# -*- coding: utf-8 -*-
"""
单词相关模型
"""
from datetime import datetime
from models import db

class Word(db.Model):
    """单词模型"""
    __tablename__ = 'words'
    
    id = db.Column(db.Integer, primary_key=True)
    word = db.Column(db.String(100), nullable=False, unique=True)
    translation = db.Column(db.String(200), nullable=False)
    difficulty = db.Column(db.Integer, nullable=False, default=1)  # 1-简单, 2-中等, 3-困难, 4-专家
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # 关联关系
    group_words = db.relationship('GroupWord', back_populates='word', cascade='all, delete-orphan')
    learning_records = db.relationship('WordLearningRecord', back_populates='word', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Word {self.word}>'
    
    def to_dict(self):
        """转换为字典"""
        return {
            'id': self.id,
            'word': self.word,
            'translation': self.translation,
            'difficulty': self.difficulty,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    @staticmethod
    def get_by_difficulty(difficulty):
        """按难度获取单词"""
        return Word.query.filter_by(difficulty=difficulty).all()
    
    @staticmethod
    def get_words_not_in_groups():
        """获取未分组的单词"""
        from models.group import GroupWord
        subquery = db.session.query(GroupWord.word_id)
        return Word.query.filter(~Word.id.in_(subquery)).all()

class WordLearningRecord(db.Model):
    """单词学习记录模型"""
    __tablename__ = 'word_learning_records'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    word_id = db.Column(db.Integer, db.ForeignKey('words.id'), nullable=False)
    stage = db.Column(db.Integer, nullable=False)  # 1-认知, 2-英文抄写, 3-中文默写
    attempts = db.Column(db.Integer, default=0)
    correct = db.Column(db.Integer, default=0)
    last_attempt = db.Column(db.DateTime, default=datetime.utcnow)
    
    # 关联关系
    user = db.relationship('User', back_populates='word_records')
    word = db.relationship('Word', back_populates='learning_records')
    
    def __repr__(self):
        return f'<WordLearningRecord user_id={self.user_id} word_id={self.word_id} stage={self.stage}>'
    
    def to_dict(self):
        """转换为字典"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'word_id': self.word_id,
            'stage': self.stage,
            'attempts': self.attempts,
            'correct': self.correct,
            'accuracy': round((self.correct / self.attempts) * 100) if self.attempts > 0 else 0,
            'last_attempt': self.last_attempt.isoformat() if self.last_attempt else None
        }
    
    @staticmethod
    def get_or_create(user_id, word_id, stage):
        """获取或创建学习记录"""
        record = WordLearningRecord.query.filter_by(
            user_id=user_id,
            word_id=word_id,
            stage=stage
        ).first()
        
        if not record:
            record = WordLearningRecord(
                user_id=user_id,
                word_id=word_id,
                stage=stage
            )
            db.session.add(record)
            db.session.commit()
        
        return record
    
    def update_record(self, is_correct):
        """更新学习记录"""
        self.attempts += 1
        if is_correct:
            self.correct += 1
        self.last_attempt = datetime.utcnow()
        db.session.commit()
        
        return self