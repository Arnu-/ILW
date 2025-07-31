# -*- coding: utf-8 -*-
"""
导入导出工具
"""
import os
import csv
import tempfile
import pandas as pd
from app import db
from models.word import Word
from utils.word_difficulty import calculate_difficulty

def import_words_from_file(file):
    """
    从文件导入单词
    
    支持CSV和Excel格式
    文件应包含单词、翻译和难度（可选）列
    
    参数:
        file: 上传的文件对象
        
    返回:
        导入的单词数量
    """
    filename = file.filename
    ext = os.path.splitext(filename)[1].lower()
    
    # 保存临时文件
    temp_file = tempfile.NamedTemporaryFile(delete=False)
    file.save(temp_file.name)
    temp_file.close()
    
    try:
        # 根据文件类型读取数据
        if ext == '.csv':
            df = pd.read_csv(temp_file.name)
        elif ext in ['.xlsx', '.xls']:
            df = pd.read_excel(temp_file.name)
        else:
            os.unlink(temp_file.name)
            raise ValueError('不支持的文件格式，请使用CSV或Excel文件')
        
        # 检查必要列
        required_columns = ['word', 'translation']
        for col in required_columns:
            if col not in df.columns:
                os.unlink(temp_file.name)
                raise ValueError(f'缺少必要列: {col}')
        
        # 导入单词
        imported_count = 0
        for _, row in df.iterrows():
            word = row['word'].strip()
            translation = row['translation'].strip()
            
            if not word or not translation:
                continue
            
            # 检查单词是否已存在
            existing = Word.query.filter_by(word=word).first()
            if existing:
                continue
            
            # 获取难度
            difficulty = None
            if 'difficulty' in df.columns and not pd.isna(row['difficulty']):
                difficulty = int(row['difficulty'])
            
            if not difficulty:
                difficulty = calculate_difficulty(word)
            
            # 创建单词
            new_word = Word(
                word=word,
                translation=translation,
                difficulty=difficulty
            )
            
            db.session.add(new_word)
            imported_count += 1
        
        db.session.commit()
        os.unlink(temp_file.name)
        return imported_count
    
    except Exception as e:
        os.unlink(temp_file.name)
        db.session.rollback()
        raise e

def export_words_to_file(format_type='csv'):
    """
    导出单词到文件
    
    参数:
        format_type: 文件格式，'csv'或'excel'
        
    返回:
        临时文件路径
    """
    # 获取所有单词
    words = Word.query.all()
    
    # 创建数据框
    data = []
    for word in words:
        data.append({
            'id': word.id,
            'word': word.word,
            'translation': word.translation,
            'difficulty': word.difficulty
        })
    
    df = pd.DataFrame(data)
    
    # 创建临时文件
    temp_dir = tempfile.gettempdir()
    
    if format_type == 'csv':
        file_path = os.path.join(temp_dir, 'words.csv')
        df.to_csv(file_path, index=False)
    elif format_type == 'excel':
        file_path = os.path.join(temp_dir, 'words.xlsx')
        df.to_excel(file_path, index=False)
    else:
        raise ValueError('不支持的文件格式，请使用csv或excel')
    
    return file_path

def get_template_file(format_type='csv'):
    """
    获取导入模板文件
    
    参数:
        format_type: 文件格式，'csv'或'excel'
        
    返回:
        临时文件路径
    """
    # 创建模板数据
    data = [
        {'word': 'example', 'translation': '例子', 'difficulty': 1},
        {'word': 'template', 'translation': '模板', 'difficulty': 2},
        {'word': 'dictionary', 'translation': '字典', 'difficulty': 3}
    ]
    
    df = pd.DataFrame(data)
    
    # 创建临时文件
    temp_dir = tempfile.gettempdir()
    
    if format_type == 'csv':
        file_path = os.path.join(temp_dir, 'word_import_template.csv')
        df.to_csv(file_path, index=False)
    elif format_type == 'excel':
        file_path = os.path.join(temp_dir, 'word_import_template.xlsx')
        df.to_excel(file_path, index=False)
    else:
        raise ValueError('不支持的文件格式，请使用csv或excel')
    
    return file_path