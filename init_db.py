# -*- coding: utf-8 -*-
"""
SQLite数据库初始化脚本
创建所有必要的表结构
"""
import sqlite3
import os

# 数据库文件路径

DB_FILE = 'data/words.db'

def init_database():
    """初始化数据库，创建所有表"""
    # 如果数据库文件已存在，先删除
    if os.path.exists(DB_FILE):
        print(f"数据库文件 {DB_FILE} 已存在，将被重新创建")
        os.remove(DB_FILE)
    
    # 连接到数据库
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # 创建单词表
    cursor.execute('''
    CREATE TABLE words (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word VARCHAR(100) NOT NULL UNIQUE,
        translation VARCHAR(200) NOT NULL,
        difficulty INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # 创建用户表
    cursor.execute('''
    CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(50) NOT NULL UNIQUE,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # 创建单词组表
    cursor.execute('''
    CREATE TABLE word_groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        sequence INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # 创建单词组-单词关联表
    cursor.execute('''
    CREATE TABLE group_words (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER NOT NULL,
        word_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES word_groups (id),
        FOREIGN KEY (word_id) REFERENCES words (id),
        UNIQUE (group_id, word_id)
    )
    ''')
    
    # 创建用户学习进度表
    cursor.execute('''
    CREATE TABLE user_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        group_id INTEGER NOT NULL,
        stage INTEGER NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        accuracy FLOAT DEFAULT 0,
        last_practice TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (group_id) REFERENCES word_groups (id),
        UNIQUE (user_id, group_id, stage)
    )
    ''')
    
    # 创建单词学习记录表
    cursor.execute('''
    CREATE TABLE word_learning_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        word_id INTEGER NOT NULL,
        stage INTEGER NOT NULL,
        attempts INTEGER DEFAULT 0,
        correct INTEGER DEFAULT 0,
        last_attempt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (word_id) REFERENCES words (id)
    )
    ''')
    
    # 创建分数表
    cursor.execute('''
    CREATE TABLE scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        score FLOAT NOT NULL,
        level VARCHAR(50) NOT NULL,
        time_spent INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')
    
    # 提交事务
    conn.commit()
    
    # 创建管理员用户
    cursor.execute('''
    INSERT INTO users (username, is_admin) VALUES ('admin', 1)
    ''')
    conn.commit()
    
    print("数据库初始化完成")
    print("已创建表: words, users, word_groups, group_words, user_progress, word_learning_records, scores")
    print("已创建管理员用户: admin")
    
    # 关闭连接
    conn.close()

if __name__ == "__main__":
    init_database()