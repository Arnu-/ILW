# -*- coding: utf-8 -*-
"""
单词组控制器
"""
from flask import Blueprint, request, jsonify
from app import db
from models.group import WordGroup, GroupWord
from models.word import Word

group_bp = Blueprint('group', __name__)

@group_bp.route('', methods=['GET'])
def get_groups():
    """获取所有单词组"""
    groups = WordGroup.get_all_ordered()
    return jsonify({
        'groups': [group.to_dict() for group in groups]
    })

@group_bp.route('', methods=['POST'])
def create_group():
    """创建单词组"""
    data = request.get_json()
    
    if not data or 'name' not in data:
        return jsonify({'error': '缺少必要参数'}), 400
    
    name = data['name'].strip()
    description = data.get('description', '').strip()
    
    if not name:
        return jsonify({'error': '名称不能为空'}), 400
    
    # 获取最大序号
    max_sequence = db.session.query(db.func.max(WordGroup.sequence)).scalar() or 0
    
    # 创建单词组
    new_group = WordGroup(
        name=name,
        description=description,
        sequence=max_sequence + 1
    )
    
    db.session.add(new_group)
    db.session.commit()
    
    return jsonify({
        'group': new_group.to_dict(),
        'message': '单词组创建成功'
    })

@group_bp.route('/<int:group_id>', methods=['GET'])
def get_group(group_id):
    """获取单词组详情"""
    group = WordGroup.query.get(group_id)
    if not group:
        return jsonify({'error': '单词组不存在'}), 404
    
    return jsonify({
        'group': group.to_dict()
    })

@group_bp.route('/<int:group_id>', methods=['PUT'])
def update_group(group_id):
    """更新单词组"""
    group = WordGroup.query.get(group_id)
    if not group:
        return jsonify({'error': '单词组不存在'}), 404
    
    data = request.get_json()
    if not data:
        return jsonify({'error': '缺少参数'}), 400
    
    # 更新单词组
    if 'name' in data and data['name'].strip():
        group.name = data['name'].strip()
    
    if 'description' in data:
        group.description = data['description'].strip()
    
    if 'sequence' in data:
        group.sequence = data['sequence']
    
    db.session.commit()
    
    return jsonify({
        'group': group.to_dict(),
        'message': '单词组更新成功'
    })

@group_bp.route('/<int:group_id>', methods=['DELETE'])
def delete_group(group_id):
    """删除单词组"""
    group = WordGroup.query.get(group_id)
    if not group:
        return jsonify({'error': '单词组不存在'}), 404
    
    db.session.delete(group)
    db.session.commit()
    
    return jsonify({
        'message': '单词组删除成功'
    })

@group_bp.route('/<int:group_id>/words', methods=['GET'])
def get_group_words(group_id):
    """获取单词组内的单词"""
    group = WordGroup.query.get(group_id)
    if not group:
        return jsonify({'error': '单词组不存在'}), 404
    
    # 获取组内单词
    words = GroupWord.get_words_in_group(group_id)
    
    return jsonify({
        'words': [word.to_dict() for word in words]
    })

@group_bp.route('/<int:group_id>/words', methods=['POST'])
def add_word_to_group(group_id):
    """添加单词到组"""
    group = WordGroup.query.get(group_id)
    if not group:
        return jsonify({'error': '单词组不存在'}), 404
    
    data = request.get_json()
    if not data or 'word_id' not in data:
        return jsonify({'error': '缺少单词ID'}), 400
    
    word_id = data['word_id']
    word = Word.query.get(word_id)
    if not word:
        return jsonify({'error': '单词不存在'}), 404
    
    # 添加单词到组
    group_word = GroupWord.add_word_to_group(group_id, word_id)
    
    return jsonify({
        'message': '单词添加成功',
        'group_word': {
            'id': group_word.id,
            'group_id': group_word.group_id,
            'word_id': group_word.word_id
        }
    })

@group_bp.route('/<int:group_id>/words/<int:word_id>', methods=['DELETE'])
def remove_word_from_group(group_id, word_id):
    """从组中移除单词"""
    group = WordGroup.query.get(group_id)
    if not group:
        return jsonify({'error': '单词组不存在'}), 404
    
    word = Word.query.get(word_id)
    if not word:
        return jsonify({'error': '单词不存在'}), 404
    
    # 从组中移除单词
    result = GroupWord.remove_word_from_group(group_id, word_id)
    
    if result:
        return jsonify({
            'message': '单词移除成功'
        })
    else:
        return jsonify({
            'error': '单词不在该组中'
        }), 404