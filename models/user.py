# -*- coding: utf-8 -*-
"""
用户相关模型
"""
from datetime import datetime
from models import db

class User(db.Model):
    """用户模型"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), nullable=False, unique=True)
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # 关联关系
    progress = db.relationship('UserProgress', back_populates='user', cascade='all, delete-orphan')
    word_records = db.relationship('WordLearningRecord', back_populates='user', cascade='all, delete-orphan')
    scores = db.relationship('Score', back_populates='user', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<User {self.username}>'
    
    def to_dict(self):
        """转换为字典"""
        return {
            'id': self.id,
            'username': self.username,
            'is_admin': self.is_admin,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    @staticmethod
    def get_or_create(username):
        """获取或创建用户"""
        user = User.query.filter_by(username=username).first()
        if not user:
            user = User(username=username)
            db.session.add(user)
            db.session.commit()
        
        return user

class UserProgress(db.Model):
    """用户学习进度模型"""
    __tablename__ = 'user_progress'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    group_id = db.Column(db.Integer, db.ForeignKey('word_groups.id'), nullable=False)
    stage = db.Column(db.Integer, nullable=False)  # 1-认知, 2-英文抄写, 3-中文默写
    completed = db.Column(db.Boolean, default=False)
    accuracy = db.Column(db.Float, default=0)  # 正确率(%)
    last_practice = db.Column(db.DateTime, default=datetime.utcnow)
    
    # 关联关系
    user = db.relationship('User', back_populates='progress')
    group = db.relationship('WordGroup', back_populates='user_progress')
    
    __table_args__ = (
        db.UniqueConstraint('user_id', 'group_id', 'stage', name='uix_user_group_stage'),
    )
    
    def __repr__(self):
        return f'<UserProgress user_id={self.user_id} group_id={self.group_id} stage={self.stage}>'
    
    def to_dict(self):
        """转换为字典"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'group_id': self.group_id,
            'stage': self.stage,
            'completed': self.completed,
            'accuracy': self.accuracy,
            'last_practice': self.last_practice.isoformat() if self.last_practice else None
        }
    
    @staticmethod
    def get_or_create(user_id, group_id, stage):
        """获取或创建进度记录"""
        progress = UserProgress.query.filter_by(
            user_id=user_id,
            group_id=group_id,
            stage=stage
        ).first()
        
        if not progress:
            progress = UserProgress(
                user_id=user_id,
                group_id=group_id,
                stage=stage
            )
            db.session.add(progress)
            db.session.commit()
        
        return progress
    
    def update_progress(self, accuracy, completed=None):
        """更新进度"""
        self.accuracy = accuracy
        if completed is not None:
            self.completed = completed
        self.last_practice = datetime.utcnow()
        db.session.commit()
        
        return self

class Score(db.Model):
    """分数模型"""
    __tablename__ = 'scores'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    score = db.Column(db.Float, nullable=False)  # 分数(正确率)
    level = db.Column(db.String(50), nullable=False)  # 关卡标识
    time_spent = db.Column(db.Integer, nullable=False)  # 用时(秒)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # 关联关系
    user = db.relationship('User', back_populates='scores')
    
    def __repr__(self):
        return f'<Score user_id={self.user_id} level={self.level} score={self.score}>'
    
    def to_dict(self):
        """转换为字典"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'username': self.user.username,
            'score': self.score,
            'level': self.level,
            'time_spent': self.time_spent,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    @staticmethod
    def get_top_scores(level=None, limit=10):
        """获取排行榜"""
        query = Score.query
        
        if level:
            query = query.filter_by(level=level)
        
        return query.order_by(Score.score.desc(), Score.time_spent.asc()).limit(limit).all()
    
    @staticmethod
    def get_user_rank(user_id, level=None):
        """获取用户排名"""
        # 获取用户最高分
        query = Score.query.filter_by(user_id=user_id)
        if level:
            query = query.filter_by(level=level)
        
        user_score = query.order_by(Score.score.desc(), Score.time_spent.asc()).first()
        
        if not user_score:
            return None
        
        # 计算排名
        rank_query = db.session.query(
            db.func.count(Score.id) + 1
        )
        
        if level:
            rank_query = rank_query.filter(Score.level == level)
        
        rank_query = rank_query.filter(
            (Score.score > user_score.score) | 
            ((Score.score == user_score.score) & (Score.time_spent < user_score.time_spent))
        )
        
        rank = rank_query.scalar()
        
        return rank