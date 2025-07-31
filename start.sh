#!/bin/bash

# 单词记忆游戏启动脚本

# 创建虚拟环境（如果不存在）
if [ ! -d ".venv" ]; then
    echo "创建虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境
echo "激活虚拟环境..."
source .venv/bin/activate

# 安装依赖
echo "安装依赖..."
pip3 install -r requirements.txt

# 初始化数据库
echo "初始化数据库..."
if [ ! -f "words.db" ]; then
    mkdir -p data
    echo "创建数据库..."
fi

# 启动应用
echo "启动应用..."
export FLASK_ENV=development
python3 app.py