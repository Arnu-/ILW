# -*- coding: utf-8 -*-
"""
单词控制器
"""
from flask import Blueprint, request, jsonify, send_file
from app import db
from models.word import Word
from services.word_service import get_word_audio
from services.audio_service import get_audio_url
from utils.word_difficulty import calculate_difficulty
from utils.import_export import import_words_from_file, export_words_to_file, get_template_file

word_bp = Blueprint('word', __name__)

@word_bp.route('', methods=['GET'])
def get_words():
    """获取所有单词"""
    words = Word.query.all()
    return jsonify({
        'words': [word.to_dict() for word in words]
    })

@word_bp.route('', methods=['POST'])
def create_word():
    """创建单词"""
    data = request.get_json()
    
    if not data or 'word' not in data or 'translation' not in data:
        return jsonify({'error': '缺少必要参数'}), 400
    
    word = data['word'].strip()
    translation = data['translation'].strip()
    
    if not word or not translation:
        return jsonify({'error': '单词和翻译不能为空'}), 400
    
    # 检查单词是否已存在
    existing = Word.query.filter_by(word=word).first()
    if existing:
        return jsonify({'error': '单词已存在'}), 400
    
    # 计算难度
    difficulty = data.get('difficulty')
    if not difficulty:
        difficulty = calculate_difficulty(word)
    
    # 创建单词
    new_word = Word(
        word=word,
        translation=translation,
        difficulty=difficulty
    )
    
    db.session.add(new_word)
    db.session.commit()
    
    return jsonify({
        'word': new_word.to_dict(),
        'message': '单词创建成功'
    })

@word_bp.route('/<int:word_id>', methods=['GET'])
def get_word(word_id):
    """获取单词详情"""
    word = Word.query.get(word_id)
    if not word:
        return jsonify({'error': '单词不存在'}), 404
    
    return jsonify({
        'word': word.to_dict()
    })

@word_bp.route('/<int:word_id>', methods=['PUT'])
def update_word(word_id):
    """更新单词"""
    word = Word.query.get(word_id)
    if not word:
        return jsonify({'error': '单词不存在'}), 404
    
    data = request.get_json()
    if not data:
        return jsonify({'error': '缺少参数'}), 400
    
    # 更新单词
    if 'word' in data and data['word'].strip():
        # 检查单词是否已存在
        existing = Word.query.filter_by(word=data['word'].strip()).first()
        if existing and existing.id != word_id:
            return jsonify({'error': '单词已存在'}), 400
        
        word.word = data['word'].strip()
    
    if 'translation' in data and data['translation'].strip():
        word.translation = data['translation'].strip()
    
    if 'difficulty' in data:
        word.difficulty = data['difficulty']
    
    db.session.commit()
    
    return jsonify({
        'word': word.to_dict(),
        'message': '单词更新成功'
    })

@word_bp.route('/<int:word_id>', methods=['DELETE'])
def delete_word(word_id):
    """删除单词"""
    word = Word.query.get(word_id)
    if not word:
        return jsonify({'error': '单词不存在'}), 404
    
    db.session.delete(word)
    db.session.commit()
    
    return jsonify({
        'message': '单词删除成功'
    })

@word_bp.route('/audio', methods=['GET'])
def get_word_audio_url():
    """获取单词发音URL"""
    word = request.args.get('word')
    if not word:
        return jsonify({'error': '缺少单词参数'}), 400
    
    # 获取单词发音URL
    audio_url = get_audio_url(word)
    
    return jsonify({
        'word': word,
        'audio_url': audio_url
    })

@word_bp.route('/import', methods=['POST'])
def import_words():
    """导入单词"""
    if 'file' not in request.files:
        return jsonify({'error': '缺少文件'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': '未选择文件'}), 400
    
    # 导入单词
    try:
        imported_count = import_words_from_file(file)
        return jsonify({
            'imported_count': imported_count,
            'message': f'成功导入 {imported_count} 个单词'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@word_bp.route('/export', methods=['GET'])
def export_words():
    """导出单词"""
    format_type = request.args.get('format', 'csv')
    
    # 导出单词
    try:
        file_path = export_words_to_file(format_type)
        return send_file(file_path, as_attachment=True)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@word_bp.route('/template', methods=['GET'])
def get_template():
    """获取导入模板"""
    format_type = request.args.get('format', 'csv')
    
    # 获取模板
    try:
        file_path = get_template_file(format_type)
        return send_file(file_path, as_attachment=True)
    except Exception as e:
        return jsonify({'error': str(e)}), 400