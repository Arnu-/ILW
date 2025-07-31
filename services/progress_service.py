# -*- coding: utf-8 -*-
"""
学习进度服务
"""
from app import db
from models.user import UserProgress
from models.group import WordGroup
from config import get_config

def get_user_progress(user_id):
    """获取用户学习进度"""
    # 获取所有单词组
    groups = WordGroup.get_all_ordered()
    
    # 获取用户进度记录
    progress_records = UserProgress.query.filter_by(user_id=user_id).all()
    
    # 构建进度数据
    progress_data = []
    for group in groups:
        group_data = {
            'id': group.id,
            'name': group.name,
            'description': group.description,
            'sequence': group.sequence,
            'stages': {},
            'unlocked': False  # 默认未解锁
        }
        
        # 填充阶段进度
        for stage in range(1, 4):  # 三个学习阶段
            stage_record = next((p for p in progress_records if p.group_id == group.id and p.stage == stage), None)
            
            if stage_record:
                group_data['stages'][stage] = {
                    'completed': stage_record.completed,
                    'accuracy': stage_record.accuracy,
                    'last_practice': stage_record.last_practice.isoformat() if stage_record.last_practice else None
                }
            else:
                group_data['stages'][stage] = {
                    'completed': False,
                    'accuracy': 0,
                    'last_practice': None
                }
        
        # 检查是否解锁
        group_data['unlocked'] = check_group_unlocked(user_id, group.id)
        
        progress_data.append(group_data)
    
    return progress_data

def check_group_unlocked(user_id, group_id):
    """检查单词组是否已解锁"""
    group = WordGroup.query.get(group_id)
    if not group:
        return False
    
    # 第一组总是解锁的
    if group.sequence == 1:
        return True
    
    # 检查前一组是否完成
    prev_group = WordGroup.query.filter_by(sequence=group.sequence - 1).first()
    if not prev_group:
        return True  # 如果没有前一组，则解锁
    
    # 检查前一组的第三阶段是否完成
    prev_progress = UserProgress.query.filter_by(
        user_id=user_id,
        group_id=prev_group.id,
        stage=3,  # 中文默写阶段
        completed=True
    ).first()
    
    return prev_progress is not None

def update_learning_progress(user_id, group_id, stage, accuracy):
    """更新学习进度"""
    config = get_config()
    pass_accuracy = config.PASS_ACCURACY
    
    # 获取或创建进度记录
    progress = UserProgress.get_or_create(user_id, group_id, stage)
    
    # 更新进度
    completed = accuracy >= pass_accuracy
    progress.update_progress(accuracy, completed)
    
    return progress

def check_final_challenge_status(user_id):
    """检查最终挑战状态"""
    # 获取所有单词组
    groups = WordGroup.get_all_ordered()
    
    if not groups:
        return False
    
    # 检查所有组的第三阶段是否都完成
    for group in groups:
        progress = UserProgress.query.filter_by(
            user_id=user_id,
            group_id=group.id,
            stage=3,  # 中文默写阶段
            completed=True
        ).first()
        
        if not progress:
            return False
    
    return True