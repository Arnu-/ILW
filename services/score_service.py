# -*- coding: utf-8 -*-
"""
分数和排行榜服务
"""
from app import db
from models.user import User, Score

def save_score(user_id, score, level, time_spent):
    """
    保存用户分数
    
    参数:
        user_id: 用户ID
        score: 分数(正确率)
        level: 关卡标识
        time_spent: 用时(秒)
    """
    # 创建分数记录
    score_record = Score(
        user_id=user_id,
        score=score,
        level=level,
        time_spent=time_spent
    )
    
    db.session.add(score_record)
    db.session.commit()
    
    return score_record

def get_top_scores(level=None, limit=10):
    """
    获取排行榜
    
    参数:
        level: 关卡标识，如果为None则获取所有关卡
        limit: 返回记录数量
    """
    return Score.get_top_scores(level, limit)

def get_user_rank(user_id, level=None):
    """
    获取用户排名
    
    参数:
        user_id: 用户ID
        level: 关卡标识，如果为None则获取所有关卡
    """
    return Score.get_user_rank(user_id, level)

def get_user_best_score(user_id, level=None):
    """
    获取用户最高分
    
    参数:
        user_id: 用户ID
        level: 关卡标识，如果为None则获取所有关卡
    """
    query = Score.query.filter_by(user_id=user_id)
    
    if level:
        query = query.filter_by(level=level)
    
    return query.order_by(Score.score.desc(), Score.time_spent.asc()).first()

def get_achievement_badges(user_id):
    """
    获取用户成就徽章
    
    参数:
        user_id: 用户ID
    """
    from services.progress_service import check_final_challenge_status
    
    # 获取用户
    user = User.query.get(user_id)
    if not user:
        return []
    
    badges = []
    
    # 检查完成的单词组数量
    from models.user import UserProgress
    completed_groups = db.session.query(UserProgress.group_id).filter(
        UserProgress.user_id == user_id,
        UserProgress.stage == 3,  # 中文默写阶段
        UserProgress.completed == True
    ).distinct().count()
    
    # 添加徽章
    if completed_groups >= 1:
        badges.append({
            'id': 'first_group',
            'name': '初学者',
            'description': '完成第一个单词组',
            'image': '/static/images/badges/first_group.png'
        })
    
    if completed_groups >= 5:
        badges.append({
            'id': 'five_groups',
            'name': '进阶学习者',
            'description': '完成5个单词组',
            'image': '/static/images/badges/five_groups.png'
        })
    
    if completed_groups >= 10:
        badges.append({
            'id': 'ten_groups',
            'name': '单词大师',
            'description': '完成10个单词组',
            'image': '/static/images/badges/ten_groups.png'
        })
    
    # 检查最终挑战
    if check_final_challenge_status(user_id):
        badges.append({
            'id': 'final_challenge',
            'name': '挑战者',
            'description': '解锁最终挑战',
            'image': '/static/images/badges/final_challenge.png'
        })
    
    # 检查高分
    high_scores = db.session.query(Score).filter(
        Score.user_id == user_id,
        Score.score >= 95
    ).count()
    
    if high_scores >= 5:
        badges.append({
            'id': 'high_score',
            'name': '精准记忆',
            'description': '获得5次95%以上的高分',
            'image': '/static/images/badges/high_score.png'
        })
    
    return badges