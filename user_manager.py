#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
用户管理工具
用于管理网站的用户名和密码
"""

import hashlib
import os
import getpass

USERS_FILE = "users.txt"

def hash_password(password):
    """生成密码的SHA-256哈希"""
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def init_users_file():
    """初始化用户文件"""
    if not os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'w', encoding='utf-8') as f:
            f.write("# 用户认证文件 - 格式: 用户名:密码哈希\n")
            f.write("# 请勿手动修改此文件中的哈希值\n")
            f.write("\n")
        print(f"✅ 已创建 {USERS_FILE} 文件")
        return True
    return False

def add_user(username, password):
    """添加用户"""
    if not username or not password:
        print("❌ 用户名和密码不能为空")
        return False

    # 检查用户是否已存在
    if user_exists(username):
        print(f"❌ 用户 '{username}' 已存在")
        return False

    hashed_password = hash_password(password)

    with open(USERS_FILE, 'a', encoding='utf-8') as f:
        f.write(f"{username}:{hashed_password}\n")

    print(f"✅ 用户 '{username}' 添加成功")
    return True

def user_exists(username):
    """检查用户是否存在"""
    if not os.path.exists(USERS_FILE):
        return False

    with open(USERS_FILE, 'r', encoding='utf-8') as f:
        for line in f:
            if line.startswith('#') or ':' not in line:
                continue
            line_username = line.split(':')[0]
            if line_username == username:
                return True
    return False

def verify_user(username, password):
    """验证用户名和密码"""
    if not os.path.exists(USERS_FILE):
        return False

    hashed_password = hash_password(password)

    with open(USERS_FILE, 'r', encoding='utf-8') as f:
        for line in f:
            if line.startswith('#') or ':' not in line:
                continue
            line_username, line_hash = line.strip().split(':', 1)
            if line_username == username and line_hash == hashed_password:
                return True
    return False

def list_users():
    """列出所有用户"""
    if not os.path.exists(USERS_FILE):
        print("❌ 用户文件不存在")
        return

    users = []
    with open(USERS_FILE, 'r', encoding='utf-8') as f:
        for line in f:
            if line.startswith('#') or ':' not in line:
                continue
            username = line.split(':')[0]
            users.append(username)

    if users:
        print("👥 当前用户列表:")
        for i, user in enumerate(users, 1):
            print(f"   {i}. {user}")
    else:
        print("❌ 没有找到用户")

def remove_user(username):
    """删除用户"""
    if not os.path.exists(USERS_FILE):
        print("❌ 用户文件不存在")
        return False

    lines = []
    user_found = False

    with open(USERS_FILE, 'r', encoding='utf-8') as f:
        for line in f:
            if line.startswith('#') or ':' not in line:
                lines.append(line)
            else:
                line_username = line.split(':')[0]
                if line_username == username:
                    user_found = True
                    print(f"✅ 已删除用户 '{username}'")
                else:
                    lines.append(line)

    if not user_found:
        print(f"❌ 用户 '{username}' 不存在")
        return False

    with open(USERS_FILE, 'w', encoding='utf-8') as f:
        f.writelines(lines)

    return True

def change_password(username, new_password):
    """修改用户密码"""
    if not user_exists(username):
        print(f"❌ 用户 '{username}' 不存在")
        return False

    hashed_password = hash_password(new_password)
    lines = []

    with open(USERS_FILE, 'r', encoding='utf-8') as f:
        for line in f:
            if line.startswith('#') or ':' not in line:
                lines.append(line)
            else:
                line_username = line.split(':')[0]
                if line_username == username:
                    lines.append(f"{username}:{hashed_password}\n")
                    print(f"✅ 用户 '{username}' 密码修改成功")
                else:
                    lines.append(line)

    with open(USERS_FILE, 'w', encoding='utf-8') as f:
        f.writelines(lines)

    return True

def interactive_mode():
    """交互式模式"""
    print("🔐 用户管理工具")
    print("=" * 40)

    while True:
        print("\n选择操作:")
        print("1. 添加用户")
        print("2. 删除用户")
        print("3. 修改密码")
        print("4. 列出用户")
        print("5. 生成密码哈希")
        print("6. 退出")

        choice = input("\n请输入选项 (1-6): ").strip()

        if choice == '1':
            username = input("用户名: ").strip()
            if not username:
                print("❌ 用户名不能为空")
                continue

            password = getpass.getpass("密码: ")
            if not password:
                print("❌ 密码不能为空")
                continue

            confirm_password = getpass.getpass("确认密码: ")
            if password != confirm_password:
                print("❌ 两次输入的密码不一致")
                continue

            add_user(username, password)

        elif choice == '2':
            username = input("要删除的用户名: ").strip()
            if username:
                remove_user(username)

        elif choice == '3':
            username = input("用户名: ").strip()
            if not username:
                print("❌ 用户名不能为空")
                continue

            new_password = getpass.getpass("新密码: ")
            if not new_password:
                print("❌ 密码不能为空")
                continue

            confirm_password = getpass.getpass("确认新密码: ")
            if new_password != confirm_password:
                print("❌ 两次输入的密码不一致")
                continue

            change_password(username, new_password)

        elif choice == '4':
            list_users()

        elif choice == '5':
            password = getpass.getpass("输入密码: ")
            if password:
                print(f"密码哈希: {hash_password(password)}")

        elif choice == '6':
            print("👋 再见!")
            break

        else:
            print("❌ 无效选项，请重新选择")

def main():
    """主函数"""
    init_users_file()

    if len(os.sys.argv) > 1:
        command = os.sys.argv[1]

        if command == "add":
            if len(os.sys.argv) >= 4:
                username = os.sys.argv[2]
                password = os.sys.argv[3]
                add_user(username, password)
            else:
                print("用法: python3 user_manager.py add <用户名> <密码>")

        elif command == "remove":
            if len(os.sys.argv) >= 3:
                username = os.sys.argv[2]
                remove_user(username)
            else:
                print("用法: python3 user_manager.py remove <用户名>")

        elif command == "list":
            list_users()

        elif command == "hash":
            if len(os.sys.argv) >= 3:
                password = os.sys.argv[2]
                print(f"密码哈希: {hash_password(password)}")
            else:
                print("用法: python3 user_manager.py hash <密码>")

        else:
            print("未知命令")
            print("可用命令: add, remove, list, hash")
    else:
        interactive_mode()

if __name__ == "__main__":
    main()