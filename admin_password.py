#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
管理员密码管理脚本

使用方法:
1. 设置管理员密码:
   python admin_password.py --set 新密码
   或
   python admin_password.py -s 新密码

示例:
   python admin_password.py --set admin123
"""
import sys
import os
import argparse
from flask import Flask
from models import db
from models.admin_auth import AdminAuth

def create_app():
    """创建Flask应用"""
    app = Flask(__name__)
    
    # 配置数据库
    from config import get_config
    config = get_config()
    app.config['SQLALCHEMY_DATABASE_URI'] = config.SQLALCHEMY_DATABASE_URI
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # 初始化数据库
    db.init_app(app)
    
    return app

def set_password(password):
    """设置管理员密码"""
    if not password or len(password) < 6:
        print("错误: 密码长度必须至少为6个字符")
        return False
        
    app = create_app()
    with app.app_context():
        # 确保表存在
        db.create_all()
        
        # 设置密码
        auth = AdminAuth.set_password(password)
        print(f"管理员密码已成功设置！更新时间: {auth.updated_at}")
        return True

def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='管理员密码管理工具')
    parser.add_argument('--set', '-s', help='设置新的管理员密码 (至少6个字符)')
    
    args = parser.parse_args()
    
    if args.set:
        set_password(args.set)
    else:
        parser.print_help()
        print("\n使用示例:")
        print("  python admin_password.py --set admin123  # 设置管理员密码为admin123")

if __name__ == '__main__':
    main()
