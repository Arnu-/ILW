# -*- coding: utf-8 -*-
"""
认证相关工具
"""
from flask import session
from models.user import User

def login_user(user_id):
    """
    登录用户
    
    参数:
        user_id: 用户ID
    """
    session['user_id'] = user_id

def logout_user():
    """
    登出用户
    """
    session.pop('user_id', None)

def get_current_user():
    """
    获取当前登录用户
    
    返回:
        用户对象或None
    """
    user_id = session.get('user_id')
    if user_id:
        return User.query.get(user_id)
    return None

def is_admin():
    """
    检查当前用户是否是管理员
    
    返回:
        是否是管理员
    """
    user = get_current_user()
    return user and user.is_admin

def check_is_admin(user_id):
    """
    检查用户是否是管理员
    
    参数:
        user_id: 用户ID
        
    返回:
        是否是管理员
    """
    user = User.query.get(user_id)
    return user and user.is_admin