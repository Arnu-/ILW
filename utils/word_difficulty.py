# -*- coding: utf-8 -*-
"""
单词难度计算工具
"""
from config import get_config

def calculate_difficulty(word):
    """
    计算单词难度
    
    根据单词长度计算难度：
    - 小于5个字母：简单(1)
    - 5-8个字母：中等(2)
    - 8-12个字母：困难(3)
    - 12个字母以上：专家(4)
    
    参数:
        word: 单词
        
    返回:
        难度级别(1-4)
    """
    config = get_config()
    word_length = len(word)
    
    if word_length < 5:
        return config.DIFFICULTY_LEVELS['EASY']
    elif word_length <= 8:
        return config.DIFFICULTY_LEVELS['MEDIUM']
    elif word_length <= 12:
        return config.DIFFICULTY_LEVELS['HARD']
    else:
        return config.DIFFICULTY_LEVELS['EXPERT']

def get_difficulty_name(difficulty):
    """
    获取难度名称
    
    参数:
        difficulty: 难度级别(1-4)
        
    返回:
        难度名称
    """
    difficulty_names = {
        1: '简单',
        2: '中等',
        3: '困难',
        4: '专家'
    }
    
    return difficulty_names.get(difficulty, '未知')