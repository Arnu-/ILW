# -*- coding: utf-8 -*-
"""
添加单词到数据库
"""
from app import create_app
from models.word import Word
from models import db

app = create_app()

with app.app_context():
    # 添加一个简单的单词
    new_word = Word(word="hi", translation="你好", difficulty=1)
    db.session.add(new_word)
    db.session.commit()
    print("已添加单词：hi")
    
    # 检查单词难度分布
    for difficulty in range(1, 5):
        count = Word.query.filter_by(difficulty=difficulty).count()
        difficulty_name = {1: '简单', 2: '中等', 3: '困难', 4: '专家'}[difficulty]
        print(f"难度 {difficulty}（{difficulty_name}）: {count} 个单词")