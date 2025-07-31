# -*- coding: utf-8 -*-
"""
配置文件，存储应用配置
"""
import os
from dotenv import load_dotenv

# 加载.env文件中的环境变量
load_dotenv()

class Config:
    """基础配置类"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-key-for-ilw-app'
    # 使用内存数据库
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///:memory:'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # 单词API配置
    DICTIONARY_API_KEY = os.environ.get('DICTIONARY_API_KEY') or ''
    DICTIONARY_API_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en/'
    
    # 应用配置
    WORDS_PER_GROUP = 10  # 每组单词数量
    PASS_ACCURACY = 80    # 通过所需正确率(%)
    
    # 单词难度配置
    DIFFICULTY_LEVELS = {
        'EASY': 1,      # 简单：<5个字母
        'MEDIUM': 2,    # 中等：5-8个字母
        'HARD': 3,      # 困难：8-12个字母
        'EXPERT': 4     # 专家：>12个字母
    }
    
    # 单词组配置
    GROUP_WORD_DISTRIBUTION = {
        'EASY': 4,      # 每组4个简单词
        'MEDIUM': 4,    # 每组4个中等词
        'HARD': 2       # 每组2个困难词
    }
    
    # 学习阶段
    LEARNING_STAGES = {
        'RECOGNITION': 1,   # 认知阶段
        'TYPING': 2,        # 英文抄写阶段
        'RECALL': 3         # 中文默写阶段
    }

class DevelopmentConfig(Config):
    """开发环境配置"""
    DEBUG = True
    
class ProductionConfig(Config):
    """生产环境配置"""
    DEBUG = False
    
# 根据环境变量选择配置
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}

def get_config():
    """获取当前环境的配置"""
    env = os.environ.get('FLASK_ENV') or 'default'
    return config[env]