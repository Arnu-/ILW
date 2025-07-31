# -*- coding: utf-8 -*-
"""
应用入口，Flask后端服务
"""
import os
from flask import Flask, render_template
from flask_cors import CORS
from config import get_config
from models import db

# 确保数据目录存在
os.makedirs('data', exist_ok=True)

def create_app():
    """创建并配置Flask应用"""
    app = Flask(__name__)
    
    # 直接设置配置，避免从config.py加载
    app.config['SECRET_KEY'] = 'dev-key-for-ilw-app'
    # dbpath = 'data/words.db'
    # abdbpath = os.path.abspath(dbpath)
    # app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///'+ abdbpath #/Users/tuser/dev/code/arnu/ILW/data/words.db'
    # 配置数据库
    from config import get_config
    config = get_config()
    app.config['SQLALCHEMY_DATABASE_URI'] = config.SQLALCHEMY_DATABASE_URI
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # 初始化扩展
    db.init_app(app)
    CORS(app)  # 启用跨域支持
    
    # 注册蓝图
    from controllers.user_controller import user_bp
    from controllers.word_controller import word_bp
    from controllers.group_controller import group_bp
    from controllers.learning_controller import learning_bp
    from controllers.admin_controller import admin_bp
    
    app.register_blueprint(user_bp, url_prefix='/api/users')
    app.register_blueprint(word_bp, url_prefix='/api/words')
    app.register_blueprint(group_bp, url_prefix='/api/word-groups')
    app.register_blueprint(learning_bp, url_prefix='/api/learning')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    
    # 注册路由
    @app.route('/')
    def index():
        """用户端主页"""
        return render_template('index.html')
    
    @app.route('/admin')
    def admin():
        """管理员端主页"""
        return render_template('admin.html')
    
    """初始化数据库，导入初始数据"""
    from models.word import Word
    from models.user import User
    from models.group import WordGroup
    # 创建数据库表
    with app.app_context():
        db.create_all()
        # 导入初始化函数
        from models.database import init_db
        init_db(db)
    
        
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5001)
