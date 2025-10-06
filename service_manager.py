#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
project_manager项目管理系统进程管理器
提供更强大的服务管理功能
"""

import os
import sys
import time
import signal
import subprocess
import json
import argparse
from datetime import datetime
from pathlib import Path

class ServiceManager:
    def __init__(self, name="project_manager-project-manager", port=8001):
        self.name = name
        self.port = port
        self.pid_file = f"{name}.pid"
        self.log_file = f"{name}.log"
        self.config_file = f"{name}.json"
        self.server_script = "server.py"

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
                os.kill(pid, 0)  # 发送信号0检查进程是否存在
                return True
            except OSError:
                return False
        return False

    def get_status(self):
        """获取服务状态"""
        config = self.load_config()
        pid = self.get_pid()

        if pid and self.is_running():
            try:
                # 获取进程信息
                result = subprocess.run(['ps', '-p', str(pid), '-o', 'pcpu,pmem,etime,cmd'],
                                      capture_output=True, text=True)
                if result.returncode == 0:
                    lines = result.stdout.strip().split('\n')
                    if len(lines) >= 2:
                        info = lines[1].split()
                        cpu_usage = info[0] if len(info) > 0 else "N/A"
                        mem_usage = info[1] if len(info) > 1 else "N/A"
                        runtime = info[2] if len(info) > 2 else "N/A"

                        return {
                            "status": "running",
                            "pid": pid,
                            "port": config.get("port", self.port),
                            "cpu_usage": f"{cpu_usage}%",
                            "memory_usage": f"{mem_usage}%",
                            "runtime": runtime,
                            "start_time": self.get_start_time(pid)
                        }
            except:
                pass

        return {
            "status": "stopped",
            "pid": None,
            "port": config.get("port", self.port)
        }

    def get_start_time(self, pid):
        """获取进程启动时间"""
        try:
            result = subprocess.run(['ps', '-p', str(pid), '-o', 'lstart'],
                                  capture_output=True, text=True)
            if result.returncode == 0:
                lines = result.stdout.strip().split('\n')
                if len(lines) >= 2:
                    return lines[1].strip()
        except:
            pass
        return "Unknown"

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
            # 启动服务进程
            with open(self.log_file, 'a') as log:
                process = subprocess.Popen(
                    [sys.executable, self.server_script, str(port)],
                    stdout=log,
                    stderr=subprocess.STDOUT,
                    preexec_fn=os.setsid  # 创建新的进程组
                )

            # 保存PID
            with open(self.pid_file, 'w') as f:
                f.write(str(process.pid))

            # 等待服务启动
            time.sleep(2)

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
            # 发送TERM信号
            os.killpg(os.getpgid(pid), signal.SIGTERM)

            # 等待进程结束
            for i in range(10):
                if not self.is_running():
                    break
                time.sleep(1)

            # 如果进程仍在运行，强制杀死
            if self.is_running():
                print("⚠️ 强制停止服务...")
                os.killpg(os.getpgid(pid), signal.SIGKILL)
                time.sleep(1)

            if not self.is_running():
                print("✅ 服务已停止")
                self.cleanup()
                return True
            else:
                print("❌ 无法停止服务")
                return False

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

    def is_port_occupied(self, port):
        """检查端口是否被占用"""
        try:
            result = subprocess.run(['lsof', '-i', f':{port}'],
                                  capture_output=True, text=True)
            return result.returncode == 0
        except:
            return False

    def show_logs(self, lines=50):
        """显示日志"""
        if os.path.exists(self.log_file):
            print(f"📋 最近 {lines} 行日志:")
            try:
                result = subprocess.run(['tail', f'-n', str(lines), self.log_file],
                                      text=True)
                print(result.stdout)
            except Exception as e:
                print(f"❌ 读取日志失败: {e}")
        else:
            print("⚠️ 日志文件不存在")

    def monitor(self, interval=5):
        """监控服务状态"""
        print(f"🔍 开始监控 {self.name} 服务 (按Ctrl+C停止)")
        print("-" * 60)

        try:
            while True:
                status = self.get_status()
                timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

                if status["status"] == "running":
                    print(f"[{timestamp}] ✅ 运行中 | PID: {status['pid']} | "
                          f"CPU: {status['cpu_usage']} | 内存: {status['memory_usage']} | "
                          f"运行时间: {status['runtime']}")
                else:
                    print(f"[{timestamp}] ❌ 服务停止")

                time.sleep(interval)

        except KeyboardInterrupt:
            print("\n🔍 监控已停止")

def main():
    parser = argparse.ArgumentParser(description='project_manager项目管理系统服务管理器')
    parser.add_argument('command', choices=['start', 'stop', 'restart', 'status', 'logs', 'monitor'],
                       help='要执行的命令')
    parser.add_argument('--port', type=int, default=8001, help='服务端口 (默认: 8001)')
    parser.add_argument('--lines', type=int, default=50, help='显示的日志行数 (默认: 50)')
    parser.add_argument('--interval', type=int, default=5, help='监控间隔秒数 (默认: 5)')

    args = parser.parse_args()

    manager = ServiceManager(port=args.port)

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
            print(f"🧠 内存使用率: {status['memory_usage']}")
            print(f"⏰ 运行时间: {status['runtime']}")
            print(f"🚀 启动时间: {status['start_time']}")
            print(f"🌐 访问地址: http://localhost:{status['port']}")
        else:
            print(f"⏸️ {manager.name} 未运行")
            print(f"📡 端口: {status['port']}")
    elif args.command == 'logs':
        manager.show_logs(args.lines)
    elif args.command == 'monitor':
        manager.monitor(args.interval)

if __name__ == "__main__":
    main()