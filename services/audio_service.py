# -*- coding: utf-8 -*-
"""
音频服务
"""
import os
import requests
import json
from config import get_config

def get_audio_url(word):
    """
    获取单词发音URL
    使用Dictionary API获取单词发音
    """
    config = get_config()
    api_url = config.DICTIONARY_API_URL
    
    # 缓存目录
    cache_dir = os.path.join('static', 'audio')
    os.makedirs(cache_dir, exist_ok=True)
    
    # 检查缓存
    cache_file = os.path.join(cache_dir, f"{word}.mp3")
    if os.path.exists(cache_file):
        return f"/static/audio/{word}.mp3"
    
    # 调用API
    try:
        response = requests.get(f"{api_url}{word}")
        if response.status_code == 200:
            data = response.json()
            
            # 提取音频URL
            audio_url = None
            if isinstance(data, list) and len(data) > 0:
                phonetics = data[0].get('phonetics', [])
                for phonetic in phonetics:
                    if phonetic.get('audio'):
                        audio_url = phonetic.get('audio')
                        break
            
            if audio_url:
                # 下载音频文件
                audio_response = requests.get(audio_url)
                if audio_response.status_code == 200:
                    with open(cache_file, 'wb') as f:
                        f.write(audio_response.content)
                    return f"/static/audio/{word}.mp3"
    except Exception as e:
        print(f"获取单词发音错误: {e}")
    
    # 如果获取失败，返回默认URL
    return "https://api.dictionaryapi.dev/media/pronunciations/en/example-us.mp3"