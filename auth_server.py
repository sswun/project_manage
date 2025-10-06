#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
带用户认证的动态项目管理系统服务器
支持用户名密码登录，数据保存在本地文件中
"""

import json
import os
import hashlib
import secrets
import time
from datetime import datetime, timedelta
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import mimetypes
from socketserver import ThreadingMixIn

# 全局会话存储
sessions = {}

class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    """线程化的HTTP服务器，更好地处理信号"""
    daemon_threads = True

class AuthProjectManagerHandler(BaseHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        self.data_dir = "database"
        self.users_file = "users.txt"
        self.ensure_database_dir()
        super().__init__(*args, **kwargs)

    def ensure_database_dir(self):
        """确保数据库目录存在"""
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)

    def hash_password(self, password):
        """生成密码的SHA-256哈希"""
        return hashlib.sha256(password.encode('utf-8')).hexdigest()

    def verify_user(self, username, password):
        """验证用户名和密码"""
        if not os.path.exists(self.users_file):
            return False

        hashed_password = self.hash_password(password)

        try:
            with open(self.users_file, 'r', encoding='utf-8') as f:
                for line in f:
                    if line.startswith('#') or ':' not in line:
                        continue
                    line_username, line_hash = line.strip().split(':', 1)
                    if line_username == username and line_hash == hashed_password:
                        return True
        except Exception as e:
            print(f"验证用户时出错: {e}")

        return False

    def create_session(self, username):
        """创建用户会话"""
        token = secrets.token_urlsafe(32)
        sessions[token] = {
            'username': username,
            'created': time.time(),
            'expires': time.time() + 3600,  # 1小时后过期
            'ip': self.client_address[0]
        }
        return token

    def is_authenticated(self):
        """检查是否已认证"""
        # 检查是否有有效的会话token
        cookie_header = self.headers.get('Cookie')
        if not cookie_header:
            return False

        # 解析Cookie
        cookies = {}
        for item in cookie_header.split(';'):
            if '=' in item:
                key, value = item.strip().split('=', 1)
                cookies[key] = value

        session_token = cookies.get('session_token')
        if not session_token:
            return False

        # 检查会话是否存在且有效
        session = sessions.get(session_token)
        if not session:
            return False

        # 检查会话是否过期
        if time.time() > session['expires']:
            del sessions[session_token]
            return False

        # 检查IP地址是否匹配（简单的安全措施）
        if session['ip'] != self.client_address[0]:
            del sessions[session_token]
            return False

        # 更新会话过期时间
        session['expires'] = time.time() + 3600
        return True

    def get_current_user(self):
        """获取当前用户名"""
        cookie_header = self.headers.get('Cookie')
        if not cookie_header:
            return None

        cookies = {}
        for item in cookie_header.split(';'):
            if '=' in item:
                key, value = item.strip().split('=', 1)
                cookies[key] = value

        session_token = cookies.get('session_token')
        session = sessions.get(session_token)
        return session['username'] if session else None

    def require_auth(self):
        """要求认证的装饰器"""
        if not self.is_authenticated():
            # 重定向到登录页面
            self.send_response(302)
            self.send_header('Location', '/login.html')
            self.end_headers()
            return False
        return True

    def set_session_cookie(self, token):
        """设置会话Cookie"""
        self.send_header('Set-Cookie', f'session_token={token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=3600')

    def clear_session_cookie(self):
        """清除会话Cookie"""
        self.send_header('Set-Cookie', 'session_token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0')

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

        # 登录页面 - 不需要认证
        if parsed_path.path == '/login.html':
            self.serve_file('login.html')
        # 登录页面样式 - 不需要认证
        elif parsed_path.path == '/login.css':
            self.serve_file('login.css', 'text/css')
        # 主页和静态资源 - 需要认证
        elif parsed_path.path == '/':
            if self.require_auth():
                self.serve_file('server_index.html')
        elif parsed_path.path == '/styles.css':
            if self.require_auth():
                self.serve_file('styles.css', 'text/css')
        elif parsed_path.path == '/server_script.js':
            if self.require_auth():
                self.serve_file('server_script.js', 'application/javascript')
        elif parsed_path.path == '/ui_functions.js':
            if self.require_auth():
                self.serve_file('ui_functions.js', 'application/javascript')
        elif parsed_path.path == '/api/data':
            if self.require_auth():
                self.handle_get_data()
        elif parsed_path.path == '/api/check-auth':
            self.handle_check_auth()
        elif parsed_path.path == '/api/logout':
            self.handle_logout()  # 登出不需要认证前置检查
        else:
            # 其他静态文件 - 需要认证
            if self.require_auth():
                self.serve_file(parsed_path.path[1:])

    def do_POST(self):
        """处理POST请求"""
        parsed_path = urlparse(self.path)

        if parsed_path.path == '/api/login':
            self.handle_login()
        elif parsed_path.path == '/api/logout':
            self.handle_logout()
        elif parsed_path.path == '/api/save':
            if self.require_auth():
                self.handle_save_data()
        elif parsed_path.path == '/api/load':
            if self.require_auth():
                self.handle_load_data()
        else:
            if self.require_auth():
                self.send_error(404)

    def handle_login(self):
        """处理登录请求"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))

            username = data.get('username', '').strip()
            password = data.get('password', '')

            if not username or not password:
                response = {'success': False, 'message': '用户名和密码不能为空'}
                self.send_json_response(400, response)
                return

            if self.verify_user(username, password):
                # 登录成功，创建会话
                session_token = self.create_session(username)

                response = {
                    'success': True,
                    'message': '登录成功',
                    'username': username
                }

                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.set_session_cookie(session_token)
                self.end_headers()
                self.wfile.write(json.dumps(response).encode('utf-8'))

                print(f"✅ 用户 '{username}' 登录成功 (IP: {self.client_address[0]})")
            else:
                # 登录失败
                response = {'success': False, 'message': '用户名或密码错误'}
                self.send_json_response(401, response)
                print(f"❌ 登录失败: {username} (IP: {self.client_address[0]})")

        except Exception as e:
            print(f"登录处理错误: {e}")
            response = {'success': False, 'message': '服务器错误'}
            self.send_json_response(500, response)

    def handle_check_auth(self):
        """检查认证状态"""
        if self.is_authenticated():
            username = self.get_current_user()
            response = {
                'authenticated': True,
                'username': username
            }
        else:
            response = {'authenticated': False}

        self.send_json_response(200, response)

    def handle_logout(self):
        """处理登出请求"""
        cookie_header = self.headers.get('Cookie')
        if cookie_header:
            cookies = {}
            for item in cookie_header.split(';'):
                if '=' in item:
                    key, value = item.strip().split('=', 1)
                    cookies[key] = value

            session_token = cookies.get('session_token')
            if session_token in sessions:
                username = sessions[session_token]['username']
                del sessions[session_token]
                print(f"👋 用户 '{username}' 已登出")

        # 清除Cookie并重定向到登录页面
        self.send_response(302)
        self.send_header('Location', '/login.html')
        self.send_header('Content-type', 'text/html')
        self.clear_session_cookie()
        self.end_headers()

    def handle_get_data(self):
        """处理获取数据请求"""
        try:
            data = {
                'plans': self.load_data('plans'),
                'projects': self.load_data('projects'),
                'tasks': self.load_data('tasks'),
                'records': self.load_data('records')
            }

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(data).encode('utf-8'))

        except Exception as e:
            self.send_error(500, str(e))

    def handle_save_data(self):
        """处理保存数据请求"""
        try:
            content_length = int(self.headers['Content-Length'])

            # 检查内容长度，防止过大的请求
            if content_length > 50 * 1024 * 1024:  # 50MB限制
                response = {'status': 'error', 'message': '数据太大，请减小图片尺寸'}
                self.send_json_response(413, response)
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

            username = self.get_current_user()
            response = {'status': 'success', 'message': '数据保存成功'}
            self.send_json_response(200, response)
            print(f"💾 数据保存成功 by {username}")

        except json.JSONDecodeError as e:
            print(f"JSON解析错误: {e}")
            response = {'status': 'error', 'message': '数据格式错误，可能是图片太大'}
            self.send_json_response(400, response)
        except Exception as e:
            print(f"保存数据错误: {e}")
            response = {'status': 'error', 'message': f'保存失败: {str(e)}'}
            self.send_json_response(500, response)

    def handle_load_data(self):
        """处理加载数据请求"""
        # 重定向到数据获取API
        self.send_response(302)
        self.send_header('Location', '/api/data')
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
            self.end_headers()
            self.wfile.write(content)

        except FileNotFoundError:
            self.send_error(404, f"File not found: {filename}")

    def send_json_response(self, status_code, data):
        """发送JSON响应"""
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_OPTIONS(self):
        """处理CORS预检请求"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Cookie')
        self.end_headers()

    def log_message(self, format, *args):
        """自定义日志消息"""
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {format % args}")

def cleanup_expired_sessions():
    """清理过期会话"""
    current_time = time.time()
    expired_tokens = []

    for token, session in sessions.items():
        if current_time > session['expires']:
            expired_tokens.append(token)

    for token in expired_tokens:
        username = sessions[token]['username']
        del sessions[token]
        print(f"🕐 会话过期: {username}")

def run_server(port=8001):
    """运行HTTP服务器"""
    import signal
    import sys

    server_address = ('', port)
    httpd = ThreadedHTTPServer(server_address, AuthProjectManagerHandler)

    print(f"🚀 带认证的项目管理系统服务器已启动")
    print(f"📱 访问地址: http://localhost:{port}")
    print(f"🔐 登录页面: http://localhost:{port}/login.html")
    print(f"💾 数据保存在: {os.path.abspath('database')} 目录")
    print(f"👥 用户文件: {os.path.abspath('users.txt')}")
    print(f"🌐 支持公网访问，可在防火墙开放 {port} 端口")
    print("⏹️  按 Ctrl+C 停止服务器")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 收到中断信号，正在停止服务器...")
    except Exception as e:
        print(f"❌ 服务器运行错误: {e}")
    finally:
        try:
            print("正在关闭服务器...")
            httpd.shutdown()
            httpd.server_close()
            print("✅ 服务器已安全停止")
        except Exception as e:
            print(f"⚠️  停止服务器时出错: {e}")
        sys.exit(0)

if __name__ == "__main__":
    import sys

    # 确保用户文件存在
    if not os.path.exists('users.txt'):
        print("⚠️  用户文件不存在，请先运行:")
        print("   python3 user_manager.py add <用户名> <密码>")
        print("或使用交互模式:")
        print("   python3 user_manager.py")
        sys.exit(1)

    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8001
    run_server(port)