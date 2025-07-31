# -*- coding: utf-8 -*-
"""
管理员控制器
"""
from flask import Blueprint, request, jsonify
from app import db
from models.user import User
from models.word import Word, WordLearningRecord
from models.group import WordGroup, GroupWord
from models.admin_auth import AdminAuth
from services.word_service import create_balanced_groups

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/login', methods=['POST'])
def admin_login():
    """管理员登录"""
    data = request.get_json()
    
    if not data or 'username' not in data:
        return jsonify({'error': '缺少用户名'}), 400
    
    if 'password' not in data:
        return jsonify({'error': '缺少密码'}), 400
    
    username = data['username'].strip()
    password = data['password']
    
    if not username:
        return jsonify({'error': '用户名不能为空'}), 400
    
    # 获取或创建用户
    user = User.get_or_create(username)
    
    # 检查是否是管理员
    if not user.is_admin:
        # 如果是第一个用户，设为管理员
        if User.query.count() == 1:
            user.is_admin = True
            db.session.commit()
        else:
            return jsonify({
                'success': False,
                'error': '您不是管理员'
            }), 403
    
    # 验证密码
    if not AdminAuth.verify_password(password):
        return jsonify({
            'success': False,
            'error': '密码错误'
        }), 401
    
    return jsonify({
        'success': True,
        'user': user.to_dict()
    })

@admin_bp.route('/check/<int:user_id>', methods=['POST'])
def check_admin(user_id):
    """检查用户是否是管理员并验证密码"""
    data = request.get_json()
    
    if not data or 'password' not in data:
        return jsonify({'error': '缺少密码'}), 400
    
    password = data['password']
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'is_admin': False}), 404
    
    # 验证密码
    if not AdminAuth.verify_password(password):
        return jsonify({'is_admin': False}), 401
    
    return jsonify({
        'is_admin': user.is_admin
    })

@admin_bp.route('/initialize-balanced-groups', methods=['POST'])
def initialize_balanced_groups():
    """初始化均衡单词组"""
    # 检查单词数量是否足够
    from config import get_config
    config = get_config()
    distribution = config.GROUP_WORD_DISTRIBUTION
    
    # 检查每个难度级别的单词数量
    for difficulty, count in distribution.items():
        if count > 0:
            difficulty_level = config.DIFFICULTY_LEVELS[difficulty]
            available_words = Word.query.filter_by(difficulty=difficulty_level).count()
            if available_words < count:
                return jsonify({
                    'error': f'难度为{difficulty}的单词数量不足，需要{count}个，但只有{available_words}个'
                }), 400
    
    # 创建均衡单词组
    groups_count = create_balanced_groups()
    
    return jsonify({
        'groups_count': groups_count,
        'message': f'成功创建 {groups_count} 个均衡单词组'
    })

@admin_bp.route('/stats', methods=['GET'])
def get_system_stats():
    """获取系统统计信息"""
    # 单词总数
    total_words = Word.query.count()
    
    # 单词组总数
    total_groups = WordGroup.query.count()
    
    # 用户总数
    total_users = User.query.count()
    
    # 学习记录总数
    total_learning_records = WordLearningRecord.query.count()
    
    # 平均正确率
    avg_accuracy_query = db.session.query(
        db.func.avg(
            db.case(
                [(WordLearningRecord.attempts > 0, (WordLearningRecord.correct * 100.0 / WordLearningRecord.attempts))],
                else_=0
            )
        )
    )
    avg_accuracy = avg_accuracy_query.scalar() or 0
    
    # 单词难度分布
    difficulty_distribution = {}
    for difficulty in range(1, 5):
        count = Word.query.filter_by(difficulty=difficulty).count()
        difficulty_distribution[difficulty] = count
    
    return jsonify({
        'total_words': total_words,
        'total_groups': total_groups,
        'total_users': total_users,
        'total_learning_records': total_learning_records,
        'avg_accuracy': round(avg_accuracy, 2),
        'difficulty_distribution': difficulty_distribution
    })

@admin_bp.route('/set-admin/<int:user_id>', methods=['PUT'])
def set_admin(user_id):
    """设置用户为管理员"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': '用户不存在'}), 404
    
    # 设置为管理员
    user.is_admin = True
    db.session.commit()
    
    return jsonify({
        'message': f'已将用户 {user.username} 设置为管理员',
        'user': user.to_dict()
    })

@admin_bp.route('/remove-admin/<int:user_id>', methods=['PUT'])
def remove_admin(user_id):
    """移除用户的管理员权限"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': '用户不存在'}), 404
    
    # 检查是否是最后一个管理员
    admin_count = User.query.filter_by(is_admin=True).count()
    if admin_count <= 1 and user.is_admin:
        return jsonify({'error': '不能移除最后一个管理员'}), 400
    
    # 移除管理员权限
    user.is_admin = False
    db.session.commit()
    
    return jsonify({
        'message': f'已移除用户 {user.username} 的管理员权限',
        'user': user.to_dict()
    })