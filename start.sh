#!/bin/bash

# 安装依赖
echo "正在安装依赖..."
pip3 install -r requirements.txt

# 提示用户检查.env文件
echo "请确保已在.env文件中配置了腾讯云API密钥"
echo "如果尚未配置，请编辑.env文件并设置TENCENT_SECRET_ID和TENCENT_SECRET_KEY"

# 启动应用
echo "正在启动应用..."
python3 app.py
