#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
project_manager项目管理系统 - Windows专用服务管理器
支持Windows特有的服务管理功能
"""

import os
import sys
import time
import subprocess
import json
import argparse
import psutil
import socket
from datetime import datetime
from pathlib import Path
import win32service
import win32serviceutil
import win32event
import win32con
import win32evtlogutil
import servicemanager

class WindowsServiceManager:
    def __init__(self, name="project_manager-project-manager", port=8001):
        self.name = name
        self.port = port
        self.pid_file = f"{name}.pid"
        self.log_file = f"{name}.log"
        self.config_file = f"{name}.json"
        self.server_script = "server.py"
        self.working_dir = os.getcwd()

        # Windows特有配置
        self.service_name = f"SSWUN_{name.replace('-', '_')}"
        self.service_display_name = f"project_manager项目管理系统"
        self.service_description = f"project_manager项目管理系统Web服务，端口: {port}"

        # 确保必要的文件存在
        self.ensure_files()

    def ensure_files(self):
        """确保必要的配置文件存在"""
        if not os.path.exists(self.config_file):
            default_config = {
                "name": self.name,
                "port": self.port,
                "auto_restart": True,
                "max_retries": 3,
                "log_level": "INFO",
                "service_type": "background",  # background, service, startup
                "created_at": datetime.now().isoformat()
            }
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(default_config, f, ensure_ascii=False, indent=2)

    def load_config(self):
        """加载配置文件"""
        try:
            with open(self.config_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return {"port": self.port}

    def get_pid(self):
        """获取进程ID"""
        if os.path.exists(self.pid_file):
            try:
                with open(self.pid_file, 'r') as f:
                    return int(f.read().strip())
            except:
                return None
        return None

    def is_running(self):
        """检查服务是否运行"""
        pid = self.get_pid()
        if pid:
            try:
                process = psutil.Process(pid)
                return process.is_running()
            except psutil.NoSuchProcess:
                return False
        return False

    def is_port_occupied(self, port):
        """检查端口是否被占用"""
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(1)
                result = s.connect_ex(('localhost', port))
                return result == 0
        except:
            return False

    def get_status(self):
        """获取详细的服务状态"""
        config = self.load_config()
        pid = self.get_pid()

        if pid and self.is_running():
            try:
                process = psutil.Process(pid)
                cpu_percent = process.cpu_percent()
                memory_info = process.memory_info()
                memory_mb = memory_info.rss / 1024 / 1024
                create_time = datetime.fromtimestamp(process.create_time())
                uptime = datetime.now() - create_time
                uptime_str = str(uptime).split('.')[0]

                return {
                    "status": "running",
                    "pid": pid,
                    "port": config.get("port", self.port),
                    "cpu_usage": f"{cpu_percent:.1f}%",
                    "memory_usage": f"{memory_mb:.1f}MB",
                    "memory_percent": f"{process.memory_percent():.1f}%",
                    "threads": process.num_threads(),
                    "uptime": uptime_str,
                    "start_time": create_time.strftime("%Y-%m-%d %H:%M:%S"),
                    "executable": process.exe(),
                    "command_line": " ".join(process.cmdline())
                }
            except psutil.NoSuchProcess:
                pass

        return {
            "status": "stopped",
            "pid": None,
            "port": config.get("port", self.port)
        }

    def start(self):
        """启动服务"""
        if self.is_running():
            print(f"❌ 服务已在运行中 (PID: {self.get_pid()})")
            return False

        config = self.load_config()
        port = config.get("port", self.port)

        print(f"🚀 正在启动 {self.name} 服务...")
        print(f"📡 端口: {port}")

        # 检查端口是否被占用
        if self.is_port_occupied(port):
            print(f"❌ 端口 {port} 已被占用")
            return False

        try:
            # 创建启动命令
            cmd = [sys.executable, self.server_script, str(port)]

            # 在Windows上使用后台启动
            if os.name == 'nt':
                # Windows下使用CREATE_NO_WINDOW标志
                startupinfo = subprocess.STARTUPINFO()
                startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
                startupinfo.wShowWindow = subprocess.SW_HIDE

                process = subprocess.Popen(
                    cmd,
                    stdout=open(self.log_file, 'a', encoding='utf-8'),
                    stderr=subprocess.STDOUT,
                    startupinfo=startupinfo,
                    creationflags=subprocess.CREATE_NO_WINDOW
                )
            else:
                process = subprocess.Popen(
                    cmd,
                    stdout=open(self.log_file, 'a', encoding='utf-8'),
                    stderr=subprocess.STDOUT
                )

            # 保存PID
            with open(self.pid_file, 'w') as f:
                f.write(str(process.pid))

            # 等待服务启动
            time.sleep(3)

            if self.is_running():
                print(f"✅ 服务启动成功!")
                print(f"📍 PID: {process.pid}")
                print(f"🌐 访问地址: http://localhost:{port}")
                print(f"📋 日志文件: {self.log_file}")
                return True
            else:
                print("❌ 服务启动失败")
                self.cleanup()
                return False

        except Exception as e:
            print(f"❌ 启动失败: {e}")
            return False

    def stop(self):
        """停止服务"""
        if not self.is_running():
            print("⚠️ 服务未运行")
            return False

        pid = self.get_pid()
        print(f"🛑 正在停止服务 (PID: {pid})...")

        try:
            process = psutil.Process(pid)

            # 尝试优雅停止
            process.terminate()

            # 等待进程结束
            for i in range(10):
                if not process.is_running():
                    break
                time.sleep(1)

            # 如果进程仍在运行，强制杀死
            if process.is_running():
                print("⚠️ 强制停止服务...")
                process.kill()
                time.sleep(1)

            if not process.is_running():
                print("✅ 服务已停止")
                self.cleanup()
                return True
            else:
                print("❌ 无法停止服务")
                return False

        except psutil.NoSuchProcess:
            print("✅ 服务已停止")
            self.cleanup()
            return True
        except Exception as e:
            print(f"❌ 停止失败: {e}")
            return False

    def restart(self):
        """重启服务"""
        print("🔄 正在重启服务...")
        self.stop()
        time.sleep(2)
        return self.start()

    def cleanup(self):
        """清理临时文件"""
        if os.path.exists(self.pid_file):
            os.remove(self.pid_file)

    def show_logs(self, lines=50):
        """显示日志"""
        if os.path.exists(self.log_file):
            print(f"📋 最近 {lines} 行日志:")
            try:
                with open(self.log_file, 'r', encoding='utf-8', errors='ignore') as f:
                    all_lines = f.readlines()
                    for line in all_lines[-lines:]:
                        print(line.rstrip())
            except Exception as e:
                print(f"❌ 读取日志失败: {e}")
        else:
            print("⚠️ 日志文件不存在")

    def monitor(self, interval=5):
        """监控服务状态"""
        print(f"🔍 开始监控 {self.name} 服务 (按Ctrl+C停止)")
        print("-" * 80)

        try:
            while True:
                status = self.get_status()
                timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

                if status["status"] == "running":
                    print(f"[{timestamp}] ✅ 运行中 | PID: {status['pid']} | "
                          f"CPU: {status['cpu_usage']} | 内存: {status['memory_usage']} | "
                          f"线程: {status['threads']} | 运行时间: {status['uptime']}")
                else:
                    print(f"[{timestamp}] ❌ 服务停止")

                time.sleep(interval)

        except KeyboardInterrupt:
            print("\n🔍 监控已停止")

    def create_startup_shortcut(self):
        """创建开机启动快捷方式"""
        try:
            import winshell
            from win32com.client import Dispatch

            # 获取启动文件夹路径
            startup_path = winshell.startup()
            shortcut_path = os.path.join(startup_path, f"{self.name}.lnk")

            # 创建快捷方式
            shell = Dispatch('WScript.Shell')
            shortcut = shell.CreateShortCut(shortcut_path)

            # 设置快捷方式属性
            script_path = os.path.join(self.working_dir, "start_service.bat")
            shortcut.Targetpath = script_path
            shortcut.WorkingDirectory = self.working_dir
            shortcut.IconLocation = sys.executable
            shortcut.save()

            print(f"✅ 已创建开机启动快捷方式: {shortcut_path}")
            return True

        except ImportError:
            print("❌ 需要安装pywin32库: pip install pywin32")
            return False
        except Exception as e:
            print(f"❌ 创建快捷方式失败: {e}")
            return False

    def install_windows_service(self):
        """安装Windows服务"""
        try:
            # 检查管理员权限
            if not self.is_admin():
                print("❌ 需要管理员权限安装Windows服务")
                print("💡 请以管理员身份运行命令提示符或PowerShell")
                return False

            # 使用nssm安装服务（推荐）
            if self.install_nssm_service():
                return True

            # 使用sc命令安装服务
            return self.install_sc_service()

        except Exception as e:
            print(f"❌ 安装Windows服务失败: {e}")
            return False

    def install_nssm_service(self):
        """使用NSSM安装Windows服务"""
        try:
            # 检查nssm是否可用
            result = subprocess.run(['nssm', 'version'], capture_output=True, text=True)
            if result.returncode != 0:
                print("⚠️  NSSM未找到，请先安装NSSM")
                print("💡 下载地址: https://nssm.cc/download")
                return False

            # 创建服务包装器脚本
            wrapper_path = self.create_service_wrapper()
            if not wrapper_path:
                return False

            # 使用nssm安装服务
            subprocess.run([
                'nssm', 'install', self.service_name,
                sys.executable, wrapper_path
            ], check=True)

            # 配置服务
            subprocess.run([
                'nssm', 'set', self.service_name,
                'DisplayName', self.service_display_name
            ], check=True)

            subprocess.run([
                'nssm', 'set', self.service_name,
                'Description', self.service_description
            ], check=True)

            subprocess.run([
                'nssm', 'set', self.service_name,
                'AppDirectory', self.working_dir
            ], check=True)

            print(f"✅ Windows服务 '{self.service_name}' 安装成功")
            print(f"💡 服务管理命令:")
            print(f"   net start {self.service_name}")
            print(f"   net stop {self.service_name}")
            print(f"   sc query {self.service_name}")
            return True

        except Exception as e:
            print(f"❌ NSSM服务安装失败: {e}")
            return False

    def install_sc_service(self):
        """使用sc命令安装Windows服务"""
        try:
            # 创建服务包装器脚本
            wrapper_path = self.create_service_wrapper()
            if not wrapper_path:
                return False

            # 使用sc安装服务
            subprocess.run([
                'sc', 'create', self.service_name,
                'binPath=', f'"{sys.executable}" "{wrapper_path}"',
                'DisplayName=', self.service_display_name,
                'start=', 'auto'
            ], check=True)

            # 设置服务描述
            subprocess.run([
                'sc', 'description', self.service_name,
                self.service_description
            ], check=True)

            print(f"✅ Windows服务 '{self.service_name}' 安装成功")
            return True

        except Exception as e:
            print(f"❌ SC服务安装失败: {e}")
            return False

    def create_service_wrapper(self):
        """创建服务包装器脚本"""
        try:
            wrapper_path = os.path.join(self.working_dir, "service_wrapper.py")
            config = self.load_config()
            port = config.get("port", self.port)

            wrapper_content = f'''#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
project_manager项目管理系统服务包装器
"""

import os
import sys
import subprocess
import time
import signal
import atexit

# 设置工作目录
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# 信号处理
def signal_handler(signum, frame):
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

# 清理函数
def cleanup():
    try:
        # 优雅停止服务
        subprocess.run(['python', 'windows_service_manager.py', 'stop'], timeout=10)
    except:
        pass

atexit.register(cleanup)

# 启动服务
try:
    print("🚀 启动project_manager项目管理系统服务...")
    process = subprocess.Popen([
        sys.executable, 'server.py', str({port})
    ])

    # 等待进程结束
    process.wait()

except Exception as e:
    print(f"❌ 服务启动失败: {{e}}")
    sys.exit(1)
'''

            with open(wrapper_path, 'w', encoding='utf-8') as f:
                f.write(wrapper_content)

            return wrapper_path

        except Exception as e:
            print(f"❌ 创建服务包装器失败: {e}")
            return None

    def is_admin(self):
        """检查是否为管理员权限"""
        try:
            import ctypes
            return ctypes.windll.shell32.IsUserAnAdmin()
        except:
            return False

    def show_system_info(self):
        """显示系统信息"""
        print("🖥️  系统信息:")
        print(f"   操作系统: {os.name}")
        print(f"   Python版本: {sys.version}")
        print(f"   工作目录: {self.working_dir}")
        print(f"   管理员权限: {'是' if self.is_admin() else '否'}")

        # 显示端口占用情况
        print(f"📡 端口状态:")
        port_status = "占用" if self.is_port_occupied(self.port) else "空闲"
        print(f"   端口 {self.port}: {port_status}")

def main():
    parser = argparse.ArgumentParser(description='project_manager项目管理系统 Windows服务管理器')
    parser.add_argument('command', choices=['start', 'stop', 'restart', 'status', 'logs', 'monitor', 'install', 'startup', 'info'],
                       help='要执行的命令')
    parser.add_argument('--port', type=int, default=8001, help='服务端口 (默认: 8001)')
    parser.add_argument('--lines', type=int, default=50, help='显示的日志行数 (默认: 50)')
    parser.add_argument('--interval', type=int, default=5, help='监控间隔秒数 (默认: 5)')

    args = parser.parse_args()

    manager = WindowsServiceManager(port=args.port)

    if args.command == 'start':
        manager.start()
    elif args.command == 'stop':
        manager.stop()
    elif args.command == 'restart':
        manager.restart()
    elif args.command == 'status':
        status = manager.get_status()
        if status["status"] == "running":
            print(f"✅ {manager.name} 正在运行")
            print(f"📍 PID: {status['pid']}")
            print(f"📡 端口: {status['port']}")
            print(f"💻 CPU使用率: {status['cpu_usage']}")
            print(f"🧠 内存使用: {status['memory_usage']} ({status['memory_percent']})")
            print(f"🧵 线程数: {status['threads']}")
            print(f"⏰ 运行时间: {status['uptime']}")
            print(f"🚀 启动时间: {status['start_time']}")
            print(f"🌐 访问地址: http://localhost:{status['port']}")
            print(f"📂 可执行文件: {status['executable']}")
        else:
            print(f"⏸️ {manager.name} 未运行")
            print(f"📡 端口: {status['port']}")
    elif args.command == 'logs':
        manager.show_logs(args.lines)
    elif args.command == 'monitor':
        manager.monitor(args.interval)
    elif args.command == 'install':
        manager.install_windows_service()
    elif args.command == 'startup':
        manager.create_startup_shortcut()
    elif args.command == 'info':
        manager.show_system_info()

if __name__ == "__main__":
    main()