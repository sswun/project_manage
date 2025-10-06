#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
自动保存脚本 - 用于将浏览器数据自动保存到本地文件
这个脚本可以作为一个简单的HTTP服务器运行，自动捕获和保存数据
"""

import json
import os
import time
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse
import threading

class DataSaveHandler(BaseHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        self.data_dir = "data"
        self.ensure_data_dir()
        super().__init__(*args, **kwargs)

    def ensure_data_dir(self):
        """确保数据目录存在"""
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)

    def do_GET(self):
        """处理GET请求"""
        if self.path == '/':
            self.path = '/index.html'

        try:
            with open(self.path[1:], 'rb') as f:
                self.send_response(200)
                self.send_header('Content-type', self.get_content_type(self.path))
                self.end_headers()
                self.wfile.write(f.read())
        except FileNotFoundError:
            self.send_error(404, f"File not found: {self.path}")

    def do_POST(self):
        """处理POST请求 - 接收数据并保存"""
        if self.path == '/save-data':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)

            try:
                data = json.loads(post_data.decode('utf-8'))

                # 保存数据到文件
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"projects_auto_save_{timestamp}.json"
                filepath = os.path.join(self.data_dir, filename)

                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)

                # 同时更新最新备份文件
                latest_filepath = os.path.join(self.data_dir, "latest_backup.json")
                with open(latest_filepath, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)

                print(f"数据已自动保存到: {filepath}")

                # 返回成功响应
                response = {"status": "success", "filename": filename}
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(response).encode('utf-8'))

            except json.JSONDecodeError:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": "Invalid JSON"}).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode('utf-8'))

    def get_content_type(self, path):
        """获取文件内容类型"""
        if path.endswith('.html'):
            return 'text/html'
        elif path.endswith('.css'):
            return 'text/css'
        elif path.endswith('.js'):
            return 'application/javascript'
        elif path.endswith('.json'):
            return 'application/json'
        else:
            return 'text/plain'

    def log_message(self, format, *args):
        """自定义日志消息"""
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {format % args}")

def run_server(port=8000):
    """运行HTTP服务器"""
    server_address = ('', port)
    httpd = HTTPServer(server_address, DataSaveHandler)

    print(f"项目管理数据自动保存服务器已启动")
    print(f"访问地址: http://localhost:{port}")
    print(f"数据将自动保存到 {os.path.abspath('data')} 目录")
    print("按 Ctrl+C 停止服务器")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n服务器已停止")
        httpd.shutdown()

if __name__ == "__main__":
    run_server()