#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Django风格的动态项目管理系统服务器
支持公网发布，数据保存在本地文件中
"""

import json
import os
import uuid
import secrets
import re
from datetime import datetime, timedelta
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import mimetypes
import hashlib
import hmac

def secure_hash_password(password, salt=None):
    """安全的密码哈希函数，使用随机salt"""
    if salt is None:
        salt = secrets.token_hex(32)

    # 使用PBKDF2算法进行密码哈希
    iterations = 100000
    dk = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), iterations)

    return {
        'hash': dk.hex(),
        'salt': salt,
        'iterations': iterations
    }

def verify_password(password, stored_hash_data):
    """验证密码"""
    if isinstance(stored_hash_data, str):
        # 兼容旧的简单哈希格式
        return hashlib.sha256(password.encode()).hexdigest() == stored_hash_data
    elif isinstance(stored_hash_data, dict):
        # 新的安全格式
        calculated_hash = secure_hash_password(password, stored_hash_data['salt'])['hash']
        return hmac.compare_digest(calculated_hash, stored_hash_data['hash'])
    return False

def validate_username(username):
    """验证用户名格式"""
    if not username or len(username) < 3 or len(username) > 20:
        return False
    return re.match(r'^[a-zA-Z0-9_]+$', username) is not None

def validate_password(password):
    """验证密码强度"""
    if not password or len(password) < 6:
        return False
    # 至少包含字母和数字
    return re.search(r'[a-zA-Z]', password) and re.search(r'[0-9]', password)

class ProjectManagerHandler(BaseHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        self.data_dir = "database"
        self.sessions_dir = "sessions"
        self.users_file = os.path.join(self.data_dir, "users.json")
        self.sessions_file = os.path.join(self.sessions_dir, "sessions.json")
        self.ensure_database_dir()
        super().__init__(*args, **kwargs)

    def ensure_database_dir(self):
        """确保数据库目录存在"""
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)
        if not os.path.exists(self.sessions_dir):
            os.makedirs(self.sessions_dir)
        self.ensure_default_user()

    def ensure_default_user(self):
        """确保默认用户存在"""
        if not os.path.exists(self.users_file):
            # 使用安全的密码哈希
            admin_password_data = secure_hash_password("admin123")
            project_manager_password_data = secure_hash_password("123456")

            default_users = {
                "admin": {
                    "username": "admin",
                    "password_hash": admin_password_data,
                    "created_at": datetime.now().isoformat(),
                    "role": "admin",
                    "password_changed": False  # 标记需要修改密码
                },
                "project_manager": {
                    "username": "project_manager",
                    "password_hash": project_manager_password_data,
                    "created_at": datetime.now().isoformat(),
                    "role": "user",
                    "password_changed": False  # 标记需要修改密码
                }
            }
            self.save_json(self.users_file, default_users)

    def load_json(self, filepath):
        """加载JSON文件"""
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return {}

    def save_json(self, filepath, data):
        """保存JSON文件"""
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    def get_session(self, session_id):
        """获取会话信息"""
        sessions = self.load_json(self.sessions_file)
        session = sessions.get(session_id)
        if session:
            # 检查会话是否过期
            expires_at = datetime.fromisoformat(session['expires_at'])
            if datetime.now() > expires_at:
                del sessions[session_id]
                self.save_json(self.sessions_file, sessions)
                return None

            # 检查IP地址是否匹配
            client_ip = self.client_address[0] if hasattr(self, 'client_address') else 'unknown'
            if session.get('client_ip') and session['client_ip'] != client_ip:
                del sessions[session_id]
                self.save_json(self.sessions_file, sessions)
                return None

            # 更新最后活动时间（滑动过期）
            session['last_activity'] = datetime.now().isoformat()
            sessions[session_id] = session
            self.save_json(self.sessions_file, sessions)
        return session

    def create_session(self, username):
        """创建会话"""
        session_id = secrets.token_urlsafe(32)
        expires_at = datetime.now() + timedelta(hours=4)  # 4小时过期
        client_ip = self.client_address[0] if hasattr(self, 'client_address') else 'unknown'

        sessions = self.load_json(self.sessions_file)
        sessions[session_id] = {
            'username': username,
            'created_at': datetime.now().isoformat(),
            'expires_at': expires_at.isoformat(),
            'client_ip': client_ip,
            'last_activity': datetime.now().isoformat()
        }
        self.save_json(self.sessions_file, sessions)
        return session_id

    def delete_session(self, session_id):
        """删除会话"""
        sessions = self.load_json(self.sessions_file)
        if session_id in sessions:
            del sessions[session_id]
            self.save_json(self.sessions_file, sessions)

    def get_current_user(self):
        """获取当前用户"""
        session_id = self.get_cookie('session_id')
        if not session_id:
            return None

        session = self.get_session(session_id)
        if session:
            users = self.load_json(self.users_file)
            return users.get(session['username'])
        return None

    def get_cookie(self, name):
        """获取Cookie值"""
        cookie_header = self.headers.get('Cookie', '')
        cookies = {}
        for cookie in cookie_header.split(';'):
            cookie = cookie.strip()
            if '=' in cookie:
                key, value = cookie.split('=', 1)
                cookies[key.strip()] = value.strip()
        return cookies.get(name)

    def set_cookie(self, name, value, max_age=86400):
        """设置Cookie"""
        self.send_header('Set-Cookie', f'{name}={value}; Max-Age={max_age}; HttpOnly; Path=/')

    def get_data_path(self, data_type):
        """获取数据文件路径"""
        return os.path.join(self.data_dir, f"{data_type}.json")

    def load_data(self, data_type):
        """从文件加载数据"""
        try:
            with open(self.get_data_path(data_type), 'r', encoding='utf-8') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return []

    def save_data(self, data_type, data):
        """保存数据到文件"""
        with open(self.get_data_path(data_type), 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    def do_GET(self):
        """处理GET请求"""
        parsed_path = urlparse(self.path)

        if parsed_path.path == '/':
            # 检查用户是否已登录
            current_user = self.get_current_user()
            if current_user:
                self.serve_file('server_index.html')
            else:
                self.serve_file('login.html')
        elif parsed_path.path == '/login.html':
            current_user = self.get_current_user()
            if current_user:
                self.redirect_to('/')
            else:
                self.serve_file('login.html')
        elif parsed_path.path == '/server_index.html':
            current_user = self.get_current_user()
            if current_user:
                self.serve_file('server_index.html')
            else:
                self.redirect_to('/login.html')
        elif parsed_path.path == '/styles.css':
            self.serve_file('styles.css', 'text/css')
        elif parsed_path.path in ['/script.js', '/server_script.js', '/ui_functions.js']:
            self.serve_file(parsed_path.path[1:], 'application/javascript')
        elif parsed_path.path == '/favicon.ico':
            self.serve_file('favicon.ico', 'image/x-icon') if os.path.exists('favicon.ico') else self.send_error(404)
        elif parsed_path.path == '/api/data':
            self.handle_get_data()
        elif parsed_path.path == '/api/check-auth':
            self.handle_check_auth()
        else:
            self.serve_file(parsed_path.path[1:])

    def do_POST(self):
        """处理POST请求"""
        parsed_path = urlparse(self.path)

        if parsed_path.path == '/api/save':
            self.handle_save_data()
        elif parsed_path.path == '/api/load':
            self.handle_load_data()
        elif parsed_path.path == '/api/login':
            self.handle_login()
        elif parsed_path.path == '/api/logout':
            self.handle_logout()
        else:
            self.send_error(404)

    def redirect_to(self, path):
        """重定向到指定路径"""
        self.send_response(302)
        self.send_header('Location', path)
        self.end_headers()

    def serve_file(self, filename, content_type=None):
        """提供静态文件服务"""
        try:
            if not content_type:
                content_type, _ = mimetypes.guess_type(filename)
                if not content_type:
                    content_type = 'text/plain'

            with open(filename, 'rb') as f:
                content = f.read()

            self.send_response(200)
            self.send_header('Content-type', content_type)
            self.send_header('Content-Length', str(len(content)))

            # 添加缓存和兼容性头部
            if filename.endswith(('.css', '.js')):
                self.send_header('Cache-Control', 'public, max-age=3600')
                self.send_header('Access-Control-Allow-Origin', '*')
            elif filename.endswith('.html'):
                self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
                self.send_header('Pragma', 'no-cache')
                self.send_header('Expires', '0')

            self.end_headers()

            # 改进的响应写入，处理连接中断
            try:
                self.wfile.write(content)
            except (ConnectionAbortedError, ConnectionResetError, BrokenPipeError) as e:
                # 客户端断开连接，这是正常情况，不应该打印错误
                print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Client disconnected: {e}")
            except Exception as e:
                print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Error writing response: {e}")

        except FileNotFoundError:
            self.send_error(404, f"File not found: {filename}")
        except Exception as e:
            print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Error serving file {filename}: {e}")
            self.send_error(500, f"Internal server error: {e}")

    def handle_login(self):
        """处理登录请求"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            login_data = json.loads(post_data.decode('utf-8'))

            username = login_data.get('username', '').strip()
            password = login_data.get('password', '')

            # 输入验证
            if not validate_username(username):
                self.send_json_response(400, {'success': False, 'message': '用户名格式不正确，需要3-20个字符，只能包含字母、数字和下划线'})
                return

            if not validate_password(password):
                self.send_json_response(400, {'success': False, 'message': '密码格式不正确，至少6个字符，必须包含字母和数字'})
                return

            # 防止暴力破解 - 添加延迟
            import time
            time.sleep(0.5)  # 500ms延迟

            users = self.load_json(self.users_file)
            user = users.get(username)

            if not user:
                self.send_json_response(401, {'success': False, 'message': '用户名或密码错误'})
                return

            # 使用安全的密码验证
            if not verify_password(password, user['password_hash']):
                self.send_json_response(401, {'success': False, 'message': '用户名或密码错误'})
                return

            # 登录成功，创建会话
            session_id = self.create_session(username)

            # 检查是否需要修改密码
            requires_password_change = not user.get('password_changed', True)

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.set_cookie('session_id', session_id)
            self.end_headers()
            self.wfile.write(json.dumps({
                'success': True,
                'message': '登录成功',
                'username': username,
                'role': user.get('role', 'user'),
                'requires_password_change': requires_password_change
            }).encode('utf-8'))

        except json.JSONDecodeError:
            self.send_json_response(400, {'success': False, 'message': '请求数据格式错误'})
        except Exception as e:
            print(f"登录错误: {e}")
            self.send_json_response(500, {'success': False, 'message': '服务器错误，请稍后重试'})

    def handle_logout(self):
        """处理登出请求"""
        try:
            session_id = self.get_cookie('session_id')
            if session_id:
                self.delete_session(session_id)

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.set_cookie('session_id', '', 0)  # 清除Cookie
            self.end_headers()
            self.wfile.write(json.dumps({
                'success': True,
                'message': '登出成功'
            }).encode('utf-8'))

        except Exception as e:
            print(f"登出错误: {e}")
            self.send_json_response(500, {'success': False, 'message': '服务器错误'})

    def handle_check_auth(self):
        """检查认证状态"""
        try:
            current_user = self.get_current_user()
            if current_user:
                self.send_json_response(200, {
                    'authenticated': True,
                    'username': current_user['username'],
                    'role': current_user.get('role', 'user')
                })
            else:
                self.send_json_response(401, {'authenticated': False})
        except Exception as e:
            print(f"检查认证状态错误: {e}")
            self.send_json_response(500, {'authenticated': False})

    def send_json_response(self, status_code, data):
        """发送JSON响应"""
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()

        try:
            json_data = json.dumps(data, ensure_ascii=False)
            self.wfile.write(json_data.encode('utf-8'))
        except (ConnectionAbortedError, ConnectionResetError, BrokenPipeError) as e:
            # 客户端断开连接，这是正常情况
            print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Client disconnected during JSON response: {e}")
        except Exception as e:
            print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Error sending JSON response: {e}")

    def handle_get_data(self):
        """处理获取数据请求"""
        try:
            # 检查用户是否已认证
            current_user = self.get_current_user()
            if not current_user:
                self.send_json_response(401, {'error': '未认证'})
                return

            data = {
                'plans': self.load_data('plans'),
                'projects': self.load_data('projects'),
                'tasks': self.load_data('tasks'),
                'records': self.load_data('records')
            }

            self.send_json_response(200, data)

        except Exception as e:
            self.send_json_response(500, {'error': str(e)})

    def handle_load_data(self):
        """处理加载数据请求（POST方式）"""
        return self.handle_get_data()

    def handle_save_data(self):
        """处理保存数据请求"""
        try:
            # 检查用户是否已认证
            current_user = self.get_current_user()
            if not current_user:
                self.send_json_response(401, {'status': 'error', 'message': '未认证'})
                return

            content_length = int(self.headers['Content-Length'])

            # 检查内容长度，防止过大的请求
            if content_length > 50 * 1024 * 1024:  # 50MB限制
                self.send_json_response(413, {'status': 'error', 'message': '数据太大，请减小图片尺寸'})
                return

            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))

            # 处理图片数据 - 如果太大则移除
            for data_type in ['plans', 'projects']:
                if data_type in data:
                    for item in data[data_type]:
                        if 'image' in item and item['image']:
                            # 检查图片数据大小
                            image_size = len(item['image'])
                            if image_size > 5 * 1024 * 1024:  # 5MB限制
                                print(f"图片太大 ({image_size} bytes)，移除图片数据")
                                item['image'] = None

            # 保存各类数据
            for data_type in ['plans', 'projects', 'tasks', 'records']:
                if data_type in data:
                    self.save_data(data_type, data[data_type])

            self.send_json_response(200, {'status': 'success', 'message': '数据保存成功'})

        except json.JSONDecodeError as e:
            print(f"JSON解析错误: {e}")
            self.send_json_response(400, {'status': 'error', 'message': '数据格式错误，可能是图片太大'})
        except Exception as e:
            print(f"保存数据错误: {e}")
            self.send_json_response(500, {'status': 'error', 'message': f'保存失败: {str(e)}'})

    def do_OPTIONS(self):
        """处理CORS预检请求"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Cookie')
        self.send_header('Access-Control-Allow-Credentials', 'true')
        self.end_headers()

    def log_message(self, format, *args):
        """自定义日志消息"""
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {format % args}")

def run_server(port=8001):
    """运行HTTP服务器"""
    server_address = ('', port)
    httpd = HTTPServer(server_address, ProjectManagerHandler)

    print(f"🚀 project_manager项目管理系统服务器已启动")
    print(f"📱 访问地址: http://localhost:{port}")
    print(f"🔐 默认登录账户:")
    print(f"   - 用户名: project_manager, 密码: 123456")
    print(f"   - 用户名: admin, 密码: admin123")
    print(f"💾 数据保存在: {os.path.abspath('database')} 目录")
    print(f"🌐 支持公网访问，可在防火墙开放 {port} 端口")
    print("⏹️  按 Ctrl+C 停止服务器")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n服务器已停止")
        httpd.shutdown()

if __name__ == "__main__":
    import sys
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8001
    run_server(port)