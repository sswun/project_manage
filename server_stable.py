#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
改进的稳定版本服务器
专门处理Windows下的网络连接问题
"""

import sys
import os
import socket
import signal
from http.server import HTTPServer, BaseHTTPRequestHandler
from datetime import datetime

# 导入原始服务器代码
from server import ProjectManagerHandler

class StableHTTPServer(HTTPServer):
    """稳定的HTTP服务器，处理连接中断"""

    def handle_error(self, request, client_address):
        """处理服务器错误，不打印连接断开的错误"""
        exc_type, exc_value, exc_traceback = sys.exc_info()

        # 忽略连接相关的正常错误
        if exc_type in (ConnectionAbortedError, ConnectionResetError, BrokenPipeError):
            print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Client {client_address[0]}:{client_address[1]} disconnected normally")
            return

        # 打印其他真正的错误
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Server error from {client_address[0]}:{client_address[1]}")
        super().handle_error(request, client_address)

class StableProjectManagerHandler(ProjectManagerHandler):
    """稳定的请求处理器"""

    def handle_one_request(self):
        """改进的请求处理"""
        try:
            # 调用父类的请求处理
            super().handle_one_request()
        except (ConnectionAbortedError, ConnectionResetError, BrokenPipeError) as e:
            # 客户端断开连接，这是正常情况
            print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Client disconnected: {e}")
            self.close_connection = True
        except Exception as e:
            print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Request processing error: {e}")
            self.close_connection = True

    def log_message(self, format, *args):
        """改进的日志消息"""
        try:
            message = format % args
            print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {message}")
        except Exception as e:
            print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Log error: {e}")

def run_server_stable(port=8001):
    """运行稳定版本的服务器"""

    # 设置信号处理
    def signal_handler(signum, frame):
        print(f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Received signal {signum}, shutting down...")
        httpd.shutdown()
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    try:
        # 创建稳定的服务器
        server_address = ('', port)
        httpd = StableHTTPServer(server_address, StableProjectManagerHandler)

        # 设置socket选项
        httpd.socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

        print(f"🚀 project_manager项目管理系统稳定版服务器已启动")
        print(f"📱 访问地址: http://localhost:{port}")
        print(f"🔧 使用稳定模式，处理Windows连接问题")
        print(f"💾 数据保存在: {os.path.abspath('database')} 目录")
        print(f"⏹️  按 Ctrl+C 停止服务器")
        print("=" * 60)

        # 启动服务器
        httpd.serve_forever()

    except OSError as e:
        if e.errno == 10048:  # Windows端口被占用错误
            print(f"❌ 端口 {port} 已被占用")
            print(f"💡 请尝试:")
            print(f"   1. 停止占用端口的其他程序")
            print(f"   2. 使用其他端口: python server_stable.py {port + 1}")
            print(f"   3. 运行 stop_server.bat 停止现有服务")
        else:
            print(f"❌ 服务器启动失败: {e}")
    except KeyboardInterrupt:
        print(f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 服务器已停止")
    except Exception as e:
        print(f"❌ 服务器运行错误: {e}")

if __name__ == "__main__":
    import sys
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8001
    run_server_stable(port)