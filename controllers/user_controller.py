# -*- coding: utf-8 -*-
"""
用户控制器
"""
from flask import Blueprint, request, jsonify
from app import db
from models.user import User, UserProgress
from models.group import WordGroup
from services.progress_service import get_user_progress, check_final_challenge_status
from services.word_service import get_final_challenge_words

user_bp = Blueprint('user', __name__)

@user_bp.route('', methods=['POST'])
def create_or_login_user():
    """创建或登录用户"""
    data = request.get_json()
    
    if not data or 'username' not in data:
        return jsonify({'error': '缺少用户名'}), 400
    
    username = data['username'].strip()
    
    if not username:
        return jsonify({'error': '用户名不能为空'}), 400
    
    # 获取或创建用户
    user = User.get_or_create(username)
    
    return jsonify({
        'user': user.to_dict(),
        'message': '登录成功'
    })

@user_bp.route('/<int:user_id>/progress', methods=['GET'])
def get_progress(user_id):
    """获取用户进度"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': '用户不存在'}), 404
    
    # 获取用户进度
    progress = get_user_progress(user_id)
    
    return jsonify({
        'groups': progress
    })

@user_bp.route('/<int:user_id>/scores', methods=['GET'])
def get_user_scores(user_id):
    """获取用户分数"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': '用户不存在'}), 404
    
    # 获取用户分数
    scores = [score.to_dict() for score in user.scores]
    
    return jsonify({
        'scores': scores
    })

@user_bp.route('/<int:user_id>/final-challenge-status', methods=['GET'])
def get_final_challenge_status(user_id):
    """获取最终挑战状态"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': '用户不存在'}), 404
    
    # 检查最终挑战状态
    unlocked = check_final_challenge_status(user_id)
    
    return jsonify({
        'unlocked': unlocked
    })

@user_bp.route('/<int:user_id>/final-challenge-words', methods=['GET'])
def get_user_final_challenge_words(user_id):
    """获取最终挑战单词"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': '用户不存在'}), 404
    
    # 检查最终挑战状态
    unlocked = check_final_challenge_status(user_id)
    if not unlocked:
        return jsonify({'error': '最终挑战未解锁'}), 403
    
    # 获取最终挑战单词
    words = get_final_challenge_words(user_id)
    
    return jsonify({
        'words': [word.to_dict() for word in words]
    })