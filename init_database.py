#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
数据库初始化脚本
从init_data.json初始化数据库文件
"""

import json
import os

def init_database():
    """初始化数据库"""
    database_dir = "database"
    init_file = os.path.join(database_dir, "init_data.json")

    if not os.path.exists(init_file):
        print("❌ 初始化数据文件不存在")
        return False

    # 读取初始化数据
    with open(init_file, 'r', encoding='utf-8') as f:
        init_data = json.load(f)

    # 创建各种数据文件
    for data_type in ['plans', 'projects', 'tasks', 'records']:
        data_file = os.path.join(database_dir, f"{data_type}.json")

        if not os.path.exists(data_file):
            with open(data_file, 'w', encoding='utf-8') as f:
                json.dump(init_data[data_type], f, ensure_ascii=False, indent=2)
            print(f"✅ 创建 {data_type}.json")
        else:
            print(f"⚠️  {data_type}.json 已存在，跳过")

    print("🎉 数据库初始化完成")
    return True

if __name__ == "__main__":
    init_database()