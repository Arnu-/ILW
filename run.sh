#!/bin/bash

# 确保数据目录存在
mkdir -p data
chmod 777 data

# 确保数据库文件存在并有正确的权限
touch words.db
chmod 666 words.db

# 运行应用
python3 app.py