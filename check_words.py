# -*- coding: utf-8 -*-
"""
检查数据库中的单词情况
"""
from app import create_app
from models.word import Word
from models.group import WordGroup

app = create_app()

with app.app_context():
    # 检查单词总数
    total_words = Word.query.count()
    print(f"数据库中共有 {total_words} 个单词")
    
    # 检查单词难度分布
    for difficulty in range(1, 5):
        count = Word.query.filter_by(difficulty=difficulty).count()
        difficulty_name = {1: '简单', 2: '中等', 3: '困难', 4: '专家'}[difficulty]
        print(f"难度 {difficulty}（{difficulty_name}）: {count} 个单词")
    
    # 检查单词组数量
    total_groups = WordGroup.query.count()
    print(f"数据库中共有 {total_groups} 个单词组")