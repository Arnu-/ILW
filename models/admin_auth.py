# -*- coding: utf-8 -*-
"""
管理员认证模型
"""
from datetime import datetime
from models import db
import hashlib
import os

class AdminAuth(db.Model):
    """管理员认证模型"""
    __tablename__ = 'admin_auth'
    
    id = db.Column(db.Integer, primary_key=True)
    password_hash = db.Column(db.String(128), nullable=False)
    salt = db.Column(db.String(32), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<AdminAuth id={self.id}>'
    
    @staticmethod
    def set_password(password):
        """设置管理员密码"""
        # 生成随机盐值
        salt = os.urandom(16).hex()
        # 计算密码哈希
        password_hash = hashlib.sha256((password + salt).encode()).hexdigest()
        
        # 查找现有记录
        auth = AdminAuth.query.first()
        if auth:
            # 更新现有记录
            auth.password_hash = password_hash
            auth.salt = salt
            auth.updated_at = datetime.utcnow()
        else:
            # 创建新记录
            auth = AdminAuth(password_hash=password_hash, salt=salt)
            db.session.add(auth)
        
        db.session.commit()
        return auth
    
    @staticmethod
    def verify_password(password):
        """验证管理员密码"""
        auth = AdminAuth.query.first()
        if not auth:
            return False
        
        # 计算密码哈希
        password_hash = hashlib.sha256((password + auth.salt).encode()).hexdigest()
        
        # 比较密码哈希
        return password_hash == auth.password_hash