# -*- coding: utf-8 -*-
"""
单词服务
"""
from app import db
from models.word import Word
from models.group import WordGroup, GroupWord
from config import get_config

def create_balanced_groups():
    """创建均衡难度的单词组"""
    config = get_config()
    words_per_group = config.WORDS_PER_GROUP
    distribution = config.GROUP_WORD_DISTRIBUTION
    
    # 获取未分配给任何单词组的单词，按难度分类
    words_by_difficulty = {}
    unused_words = Word.get_words_not_in_groups()
    for difficulty in range(1, 5):
        words_by_difficulty[difficulty] = [w for w in unused_words if w.difficulty == difficulty]
    
    # 计算可以创建的组数
    max_groups = float('inf')
    for difficulty, count in distribution.items():
        if count > 0:
            difficulty_level = config.DIFFICULTY_LEVELS[difficulty]
            available_words = len(words_by_difficulty[difficulty_level])
            possible_groups = available_words // count if count > 0 else float('inf')
            max_groups = min(max_groups, possible_groups)
    
    if max_groups == 0 or max_groups == float('inf'):
        return 0
    
    # 创建单词组
    groups_created = 0
    for i in range(1, max_groups + 1):
        # 获取当前最大序号
        max_sequence = db.session.query(db.func.max(WordGroup.sequence)).scalar() or 0
        
        group = WordGroup(
            name=f"单词组 {max_sequence + 1}",
            description=f"包含均衡难度的{words_per_group}个单词",
            sequence=max_sequence + 1
        )
        db.session.add(group)
        db.session.flush()  # 获取组ID
        
        # 添加单词到组
        for difficulty, count in distribution.items():
            difficulty_level = config.DIFFICULTY_LEVELS[difficulty]
            words = words_by_difficulty[difficulty_level][:count]
            words_by_difficulty[difficulty_level] = words_by_difficulty[difficulty_level][count:]
            
            for word in words:
                GroupWord.add_word_to_group(group.id, word.id)
        
        groups_created += 1
    
    db.session.commit()
    return groups_created

def get_word_audio(word_text):
    """获取单词发音"""
    from services.audio_service import get_audio_url
    return get_audio_url(word_text)

def get_final_challenge_words(user_id):
    """获取最终挑战单词"""
    from models.user import UserProgress
    
    # 获取用户已完成的单词组
    completed_groups = db.session.query(UserProgress.group_id).filter(
        UserProgress.user_id == user_id,
        UserProgress.stage == 3,  # 中文默写阶段
        UserProgress.completed == True
    ).distinct().all()
    
    completed_group_ids = [g[0] for g in completed_groups]
    
    if not completed_group_ids:
        return []
    
    # 获取这些组中的所有单词
    group_words = GroupWord.query.filter(
        GroupWord.group_id.in_(completed_group_ids)
    ).all()
    
    word_ids = [gw.word_id for gw in group_words]
    
    # 获取单词详情
    words = Word.query.filter(Word.id.in_(word_ids)).all()
    
    return words