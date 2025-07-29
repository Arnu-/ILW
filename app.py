from flask import Flask, request, jsonify, send_from_directory, render_template
from flask_cors import CORS
import sqlite3
import os
import json
import pandas as pd
from io import BytesIO

app = Flask(__name__)
CORS(app)  # 启用跨域请求支持

# 数据库初始化
def init_db():
    conn = sqlite3.connect('words.db')
    cursor = conn.cursor()
    
    # 创建单词表
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS words (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word TEXT NOT NULL UNIQUE,
        translation TEXT NOT NULL
    )
    ''')
    
    # 创建用户表
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # 创建分数表
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        score INTEGER NOT NULL,
        level INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')
    
    # 检查是否需要插入初始数据
    cursor.execute("SELECT COUNT(*) FROM words")
    count = cursor.fetchone()[0]
    
    if count == 0:
        # 插入初始单词数据
        initial_words = [
            ("apple", "苹果"),
            ("banana", "香蕉"),
            ("orange", "橙子"),
            ("grape", "葡萄"),
            ("watermelon", "西瓜"),
            ("strawberry", "草莓"),
            ("pineapple", "菠萝"),
            ("peach", "桃子"),
            ("cherry", "樱桃"),
            ("lemon", "柠檬"),
            ("computer", "电脑"),
            ("keyboard", "键盘"),
            ("mouse", "鼠标"),
            ("monitor", "显示器"),
            ("window", "窗户"),
            ("door", "门"),
            ("table", "桌子"),
            ("chair", "椅子"),
            ("book", "书"),
            ("pen", "笔")
        ]
        
        cursor.executemany("INSERT INTO words (word, translation) VALUES (?, ?)", initial_words)
    
    conn.commit()
    conn.close()

# 初始化数据库
init_db()

# 静态文件服务
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/admin')
def admin():
    return send_from_directory('.', 'admin.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('.', path)

# API 路由
@app.route('/api/words', methods=['GET'])
def get_words():
    conn = sqlite3.connect('words.db')
    conn.row_factory = sqlite3.Row  # 启用字典行工厂
    cursor = conn.cursor()
    cursor.execute("SELECT id, word, translation FROM words")
    words = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(words)

@app.route('/api/words', methods=['POST'])
def add_word():
    data = request.json
    word = data.get('word')
    translation = data.get('translation')
    
    if not word or not translation:
        return jsonify({"error": "单词和翻译不能为空"}), 400
    
    conn = sqlite3.connect('words.db')
    cursor = conn.cursor()
    
    try:
        cursor.execute("INSERT INTO words (word, translation) VALUES (?, ?)", (word, translation))
        conn.commit()
        new_id = cursor.lastrowid
        conn.close()
        return jsonify({"id": new_id, "word": word, "translation": translation}), 201
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"error": f"单词 '{word}' 已存在"}), 400

@app.route('/api/words/<int:word_id>', methods=['PUT'])
def update_word(word_id):
    data = request.json
    word = data.get('word')
    translation = data.get('translation')
    
    if not word or not translation:
        return jsonify({"error": "单词和翻译不能为空"}), 400
    
    conn = sqlite3.connect('words.db')
    cursor = conn.cursor()
    
    try:
        cursor.execute("UPDATE words SET word = ?, translation = ? WHERE id = ?", 
                      (word, translation, word_id))
        conn.commit()
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({"error": "未找到该单词"}), 404
        
        conn.close()
        return jsonify({"id": word_id, "word": word, "translation": translation})
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"error": f"单词 '{word}' 已存在"}), 400

@app.route('/api/words/<int:word_id>', methods=['DELETE'])
def delete_word(word_id):
    conn = sqlite3.connect('words.db')
    cursor = conn.cursor()
    cursor.execute("DELETE FROM words WHERE id = ?", (word_id,))
    conn.commit()
    
    if cursor.rowcount == 0:
        conn.close()
        return jsonify({"error": "未找到该单词"}), 404
    
    conn.close()
    return jsonify({"message": "单词已删除"})

@app.route('/api/words/import', methods=['POST'])
def import_words():
    if 'file' not in request.files:
        return jsonify({"error": "没有上传文件"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "没有选择文件"}), 400
    
    try:
        # 读取Excel文件
        df = pd.read_excel(file)
        
        # 确保文件有正确的列
        if len(df.columns) < 2:
            return jsonify({"error": "Excel文件格式不正确，需要至少两列"}), 400
        
        # 使用前两列作为单词和翻译
        df = df.iloc[:, :2]
        df.columns = ['word', 'translation']
        
        # 过滤掉空值
        df = df.dropna()
        
        # 转换为列表
        words_to_import = df.to_dict('records')
        
        conn = sqlite3.connect('words.db')
        cursor = conn.cursor()
        
        success_count = 0
        duplicate_words = []
        
        for item in words_to_import:
            word = item['word']
            translation = item['translation']
            
            try:
                cursor.execute("INSERT INTO words (word, translation) VALUES (?, ?)", 
                              (word, translation))
                success_count += 1
            except sqlite3.IntegrityError:
                duplicate_words.append(word)
        
        conn.commit()
        conn.close()
        
        result = {
            "success_count": success_count,
            "duplicate_count": len(duplicate_words),
            "duplicate_words": duplicate_words
        }
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({"error": f"导入失败: {str(e)}"}), 500

@app.route('/api/words/export', methods=['GET'])
def export_words():
    conn = sqlite3.connect('words.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT word, translation FROM words")
    words = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    # 创建DataFrame
    df = pd.DataFrame(words)
    
    # 创建Excel文件
    output = BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        df.to_excel(writer, sheet_name='单词列表', index=False)
    
    output.seek(0)
    
    return app.response_class(
        output.getvalue(),
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={
            'Content-Disposition': 'attachment; filename=单词列表.xlsx'
        }
    )

@app.route('/api/words/template', methods=['GET'])
def get_template():
    # 创建模板数据
    template_data = [
        {"word": "apple", "translation": "苹果"},
        {"word": "banana", "translation": "香蕉"},
        {"word": "", "translation": ""}
    ]
    
    # 创建DataFrame
    df = pd.DataFrame(template_data)
    
    # 创建Excel文件
    output = BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        df.to_excel(writer, sheet_name='单词模板', index=False)
    
    output.seek(0)
    
    return app.response_class(
        output.getvalue(),
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={
            'Content-Disposition': 'attachment; filename=单词导入模板.xlsx'
        }
    )

# 用户相关API
@app.route('/api/users', methods=['POST'])
def create_user():
    data = request.json
    username = data.get('username')
    
    if not username:
        return jsonify({"error": "用户名不能为空"}), 400
    
    conn = sqlite3.connect('words.db')
    cursor = conn.cursor()
    
    try:
        cursor.execute("INSERT INTO users (username) VALUES (?)", (username,))
        conn.commit()
        user_id = cursor.lastrowid
        conn.close()
        return jsonify({"id": user_id, "username": username}), 201
    except sqlite3.IntegrityError:
        # 如果用户名已存在，则返回该用户信息
        cursor.execute("SELECT id, username FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()
        conn.close()
        if user:
            return jsonify({"id": user[0], "username": user[1]}), 200
        return jsonify({"error": f"用户名 '{username}' 已存在"}), 400

@app.route('/api/scores', methods=['POST'])
def save_score():
    data = request.json
    user_id = data.get('user_id')
    score = data.get('score')
    level = data.get('level', 1)
    
    if not user_id or score is None:
        return jsonify({"error": "用户ID和分数不能为空"}), 400
    
    conn = sqlite3.connect('words.db')
    cursor = conn.cursor()
    
    try:
        cursor.execute("INSERT INTO scores (user_id, score, level) VALUES (?, ?, ?)", 
                      (user_id, score, level))
        conn.commit()
        score_id = cursor.lastrowid
        conn.close()
        return jsonify({"id": score_id, "user_id": user_id, "score": score, "level": level}), 201
    except Exception as e:
        conn.close()
        return jsonify({"error": f"保存分数失败: {str(e)}"}), 500

@app.route('/api/scores/top', methods=['GET'])
def get_top_scores():
    limit = request.args.get('limit', 10, type=int)
    
    conn = sqlite3.connect('words.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT s.id, s.score, s.level, s.created_at, u.username 
        FROM scores s
        JOIN users u ON s.user_id = u.id
        ORDER BY s.score DESC
        LIMIT ?
    """, (limit,))
    
    scores = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify(scores)

@app.route('/api/scores/level/<int:level>/top', methods=['GET'])
def get_level_top_scores(level):
    limit = request.args.get('limit', 10, type=int)
    
    conn = sqlite3.connect('words.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT s.id, s.score, s.level, s.created_at, u.username 
        FROM scores s
        JOIN users u ON s.user_id = u.id
        WHERE s.level = ?
        ORDER BY s.score DESC
        LIMIT ?
    """, (level, limit))
    
    scores = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify(scores)

@app.route('/api/scores/level/<int:level>/user/<int:user_id>/rank', methods=['GET'])
def get_user_rank_in_level(level, user_id):
    conn = sqlite3.connect('words.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # 获取用户在该关卡的最高分数
    cursor.execute("""
        SELECT MAX(score) as score
        FROM scores
        WHERE user_id = ? AND level = ?
    """, (user_id, level))
    
    user_score_row = cursor.fetchone()
    user_score = user_score_row['score'] if user_score_row and user_score_row['score'] is not None else 0
    
    # 获取用户排名
    cursor.execute("""
        SELECT COUNT(*) + 1 as rank
        FROM (
            SELECT user_id, MAX(score) as max_score
            FROM scores
            WHERE level = ?
            GROUP BY user_id
        )
        WHERE max_score > ?
    """, (level, user_score))
    
    rank_row = cursor.fetchone()
    rank = rank_row['rank'] if rank_row else 1
    
    # 获取总参与人数
    cursor.execute("""
        SELECT COUNT(DISTINCT user_id) as total
        FROM scores
        WHERE level = ?
    """, (level,))
    
    total_row = cursor.fetchone()
    total = total_row['total'] if total_row else 0
    
    conn.close()
    
    return jsonify({
        "user_id": user_id,
        "level": level,
        "score": user_score,
        "rank": rank,
        "total": total
    })

@app.route('/api/users/<int:user_id>/scores', methods=['GET'])
def get_user_scores(user_id):
    conn = sqlite3.connect('words.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT s.id, s.score, s.level, s.created_at, u.username 
        FROM scores s
        JOIN users u ON s.user_id = u.id
        WHERE s.user_id = ?
        ORDER BY s.score DESC
    """, (user_id,))
    
    scores = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify(scores)

if __name__ == '__main__':
    print("服务已启动，请访问 http://localhost:5001/ 开始游戏")
    print("或访问 http://localhost:5001/admin 管理单词")
    app.run(debug=True, port=5001, host='0.0.0.0')
