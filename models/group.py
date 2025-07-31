# -*- coding: utf-8 -*-
"""
单词组相关模型
"""
from datetime import datetime
from models import db

class WordGroup(db.Model):
    """单词组模型"""
    __tablename__ = 'word_groups'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    sequence = db.Column(db.Integer, nullable=False, default=1)  # 组序号，决定解锁顺序
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # 关联关系
    group_words = db.relationship('GroupWord', back_populates='group', cascade='all, delete-orphan')
    user_progress = db.relationship('UserProgress', back_populates='group', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<WordGroup {self.name}>'
    
    def to_dict(self):
        """转换为字典"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'sequence': self.sequence,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def get_words(self):
        """获取组内单词"""
        from models.word import Word
        words = []
        for group_word in self.group_words:
            words.append(group_word.word)
        return words
    
    @staticmethod
    def get_by_sequence(sequence):
        """按序号获取单词组"""
        return WordGroup.query.filter_by(sequence=sequence).first()
    
    @staticmethod
    def get_all_ordered():
        """获取所有单词组，按序号排序"""
        return WordGroup.query.order_by(WordGroup.sequence).all()

class GroupWord(db.Model):
    """单词组与单词的关联模型"""
    __tablename__ = 'group_words'
    
    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey('word_groups.id'), nullable=False)
    word_id = db.Column(db.Integer, db.ForeignKey('words.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # 关联关系
    group = db.relationship('WordGroup', back_populates='group_words')
    word = db.relationship('Word', back_populates='group_words')
    
    __table_args__ = (
        db.UniqueConstraint('group_id', 'word_id', name='uix_group_word'),
    )
    
    def __repr__(self):
        return f'<GroupWord group_id={self.group_id} word_id={self.word_id}>'
    
    @staticmethod
    def get_words_in_group(group_id):
        """获取组内所有单词"""
        from models.word import Word
        group_words = GroupWord.query.filter_by(group_id=group_id).all()
        word_ids = [gw.word_id for gw in group_words]
        return Word.query.filter(Word.id.in_(word_ids)).all()
    
    @staticmethod
    def add_word_to_group(group_id, word_id):
        """添加单词到组"""
        # 检查是否已存在
        existing = GroupWord.query.filter_by(group_id=group_id, word_id=word_id).first()
        if existing:
            return existing
        
        # 创建新关联
        group_word = GroupWord(group_id=group_id, word_id=word_id)
        db.session.add(group_word)
        db.session.commit()
        
        return group_word
    
    @staticmethod
    def remove_word_from_group(group_id, word_id):
        """从组中移除单词"""
        group_word = GroupWord.query.filter_by(group_id=group_id, word_id=word_id).first()
        if group_word:
            db.session.delete(group_word)
            db.session.commit()
            return True
        return False