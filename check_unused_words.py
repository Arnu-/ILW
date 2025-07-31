# -*- coding: utf-8 -*-
"""
检查未分配给任何单词组的单词数量
"""
from app import create_app
from models.word import Word

app = create_app()

with app.app_context():
    # 获取未分配给任何单词组的单词
    unused_words = Word.get_words_not_in_groups()
    print(f"未分配给任何单词组的单词数量: {len(unused_words)}")
    
    # 检查未分配单词的难度分布
    difficulty_counts = {}
    for word in unused_words:
        difficulty_counts[word.difficulty] = difficulty_counts.get(word.difficulty, 0) + 1
    
    for difficulty, count in sorted(difficulty_counts.items()):
        difficulty_name = {1: '简单', 2: '中等', 3: '困难', 4: '专家'}.get(difficulty, '未知')
        print(f"难度 {difficulty}（{difficulty_name}）: {count} 个单词")