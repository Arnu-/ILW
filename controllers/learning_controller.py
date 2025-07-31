# -*- coding: utf-8 -*-
"""
学习控制器
"""
from flask import Blueprint, request, jsonify
from app import db
from models.user import User, UserProgress, Score
from models.group import WordGroup, GroupWord
from models.word import Word, WordLearningRecord
from services.progress_service import update_learning_progress, check_group_unlocked
from services.score_service import save_score, get_top_scores, get_user_rank

learning_bp = Blueprint('learning', __name__)

@learning_bp.route('/submit', methods=['POST'])
def submit_learning_result():
    """提交学习结果"""
    data = request.get_json()
    
    if not data or 'user_id' not in data or 'group_id' not in data or 'stage' not in data:
        return jsonify({'error': '缺少必要参数'}), 400
    
    user_id = data['user_id']
    group_id = data['group_id']
    stage = data['stage']
    results = data.get('results', [])
    time_spent = data.get('time_spent', 0)
    
    # 验证用户和单词组
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': '用户不存在'}), 404
    
    group = WordGroup.query.get(group_id)
    if not group:
        return jsonify({'error': '单词组不存在'}), 404
    
    # 检查单词组是否已解锁
    if not check_group_unlocked(user_id, group_id):
        return jsonify({'error': '单词组未解锁'}), 403
    
    # 处理学习结果
    total_words = len(results)
    correct_words = sum(1 for r in results if r.get('correct', False))
    
    if total_words == 0:
        return jsonify({'error': '没有提交任何单词结果'}), 400
    
    # 计算正确率
    accuracy = (correct_words / total_words) * 100
    
    # 更新单词学习记录
    for result in results:
        word_id = result.get('word_id')
        correct = result.get('correct', False)
        
        if word_id:
            record = WordLearningRecord.get_or_create(user_id, word_id, stage)
            record.update_record(correct)
    
    # 更新学习进度
    progress = update_learning_progress(user_id, group_id, stage, accuracy)
    
    # 保存分数
    level_name = f"group_{group_id}_stage_{stage}"
    score_record = save_score(user_id, accuracy, level_name, time_spent)
    
    # 获取排名
    rank = get_user_rank(user_id, level_name)
    
    return jsonify({
        'accuracy': accuracy,
        'correct_words': correct_words,
        'total_words': total_words,
        'completed': progress.completed,
        'rank': rank,
        'message': '学习结果提交成功'
    })

@learning_bp.route('/progress/<int:user_id>/<int:group_id>', methods=['GET'])
def get_group_progress(user_id, group_id):
    """获取单词组学习进度"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': '用户不存在'}), 404
    
    group = WordGroup.query.get(group_id)
    if not group:
        return jsonify({'error': '单词组不存在'}), 404
    
    # 获取学习进度
    progress_records = UserProgress.query.filter_by(user_id=user_id, group_id=group_id).all()
    progress = {
        'group_id': group_id,
        'group_name': group.name,
        'stages': {}
    }
    
    for record in progress_records:
        progress['stages'][record.stage] = {
            'completed': record.completed,
            'accuracy': record.accuracy,
            'last_practice': record.last_practice.isoformat() if record.last_practice else None
        }
    
    # 检查是否解锁
    progress['unlocked'] = check_group_unlocked(user_id, group_id)
    
    return jsonify({
        'progress': progress
    })

@learning_bp.route('/words/<int:user_id>/<int:group_id>/<int:stage>', methods=['GET'])
def get_learning_words(user_id, group_id, stage):
    """获取学习单词"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': '用户不存在'}), 404
    
    group = WordGroup.query.get(group_id)
    if not group:
        return jsonify({'error': '单词组不存在'}), 404
    
    # 检查单词组是否已解锁
    if not check_group_unlocked(user_id, group_id):
        return jsonify({'error': '单词组未解锁'}), 403
    
    # 获取组内单词
    words = GroupWord.get_words_in_group(group_id)
    
    # 获取单词学习记录
    word_records = {}
    for word in words:
        record = WordLearningRecord.query.filter_by(
            user_id=user_id,
            word_id=word.id,
            stage=stage
        ).first()
        
        if record:
            word_records[word.id] = {
                'attempts': record.attempts,
                'correct': record.correct,
                'accuracy': round((record.correct / record.attempts) * 100) if record.attempts > 0 else 0
            }
    
    # 构建返回数据
    word_data = []
    for word in words:
        word_dict = word.to_dict()
        word_dict['learning_record'] = word_records.get(word.id, {
            'attempts': 0,
            'correct': 0,
            'accuracy': 0
        })
        word_data.append(word_dict)
    
    return jsonify({
        'words': word_data
    })

@learning_bp.route('/leaderboard', methods=['GET'])
def get_leaderboard():
    """获取排行榜"""
    level = request.args.get('level')
    limit = request.args.get('limit', 10, type=int)
    
    # 获取排行榜
    scores = get_top_scores(level, limit)
    
    return jsonify({
        'scores': [score.to_dict() for score in scores]
    })

@learning_bp.route('/rank/<int:user_id>', methods=['GET'])
def get_user_ranking(user_id):
    """获取用户排名"""
    level = request.args.get('level')
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': '用户不存在'}), 404
    
    # 获取用户排名
    rank = get_user_rank(user_id, level)
    
    if rank is None:
        return jsonify({
            'message': '用户暂无排名'
        }), 404
    
    return jsonify({
        'rank': rank
    })