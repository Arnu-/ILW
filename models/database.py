# -*- coding: utf-8 -*-
"""
数据库连接和初始化
"""
import os
import csv

def init_db(db):
    """初始化数据库，导入初始数据"""
    from models.word import Word
    from models.user import User
    from models.group import WordGroup
    
    
    # 检查是否已有数据
    if Word.query.count() == 0:
        # 导入示例单词
        words_file = os.path.join('words-lib', 'g8u1-bj.csv')
        if os.path.exists(words_file):
            with open(words_file, 'r', encoding='utf-8') as f:
                reader = csv.reader(f)
                next(reader)  # 跳过标题行
                for row in reader:
                    if len(row) >= 2:
                        word = row[0].strip()
                        translation = row[1].strip()
                        
                        # 计算难度
                        from utils.word_difficulty import calculate_difficulty
                        difficulty = calculate_difficulty(word)
                        
                        # 添加单词
                        new_word = Word(word=word, translation=translation, difficulty=difficulty)
                        db.session.add(new_word)
            
            db.session.commit()
            print(f"已导入示例单词")
    
    # 创建管理员用户
    if User.query.filter_by(username='admin').first() is None:
        admin = User(username='admin', is_admin=True)
        db.session.add(admin)
        db.session.commit()
        print(f"已创建管理员用户")
    
    # 检查是否需要创建均衡单词组
    if WordGroup.query.count() == 0:
        from services.word_service import create_balanced_groups
        groups_count = create_balanced_groups()
        print(f"已创建 {groups_count} 个均衡单词组")