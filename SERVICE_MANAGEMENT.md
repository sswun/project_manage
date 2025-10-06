# project_manager项目管理系统 - 服务管理指南

本项目提供了多种后台服务管理方案，您可以根据需求选择合适的方式。

## 🎯 快速开始

### 方案1: 简单Shell脚本管理（推荐新手）

最简单直接的管理方式，适合快速启动和测试。

```bash
# 启动服务
./service.sh start

# 查看状态
./service.sh status

# 停止服务
./service.sh stop

# 重启服务
./service.sh restart

# 查看日志
./service.sh logs

# 查看帮助
./service.sh help
```

### 方案2: Python进程管理器（推荐高级用户）

功能更强大的管理工具，支持监控和详细信息。

```bash
# 启动服务
python3 service_manager.py start

# 查看详细状态
python3 service_manager.py status

# 停止服务
python3 service_manager.py stop

# 重启服务
python3 service_manager.py restart

# 查看日志
python3 service_manager.py logs --lines 100

# 实时监控
python3 service_manager.py monitor --interval 3

# 使用不同端口
python3 service_manager.py start --port 8080
```

### 方案3: systemd服务（推荐生产环境）

适合服务器环境，支持开机自启动和系统级管理。

```bash
# 安装系统服务
./install-service.sh

# 启动服务
sudo systemctl start project_manager-project-manager

# 停止服务
sudo systemctl stop project_manager-project-manager

# 重启服务
sudo systemctl restart project_manager-project-manager

# 查看状态
sudo systemctl status project_manager-project-manager

# 开机自启
sudo systemctl enable project_manager-project-manager

# 取消自启
sudo systemctl disable project_manager-project-manager

# 查看实时日志
sudo journalctl -u project_manager-project-manager -f

# 查看最近日志
sudo journalctl -u project_manager-project-manager -n 50
```

## 🔧 各方案对比

| 特性 | Shell脚本 | Python管理器 | systemd服务 |
|------|-----------|--------------|-------------|
| 易用性 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| 功能性 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 监控能力 | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 自启动支持 | ❌ | ❌ | ⭐⭐⭐⭐⭐ |
| 系统集成 | ⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| 适用场景 | 开发测试 | 高级用户 | 生产环境 |

## 📁 文件说明

- `service.sh` - Shell服务管理脚本
- `service_manager.py` - Python进程管理器
- `install-service.sh` - systemd服务安装脚本
- `project_manager-project-manager.service` - systemd服务配置文件
- `control_panel.html` - Web控制面板（需要服务器支持）

## 🚀 使用建议

### 开发环境
推荐使用 `service.sh` 脚本，简单易用：
```bash
./service.sh start
```

### 高级用户
推荐使用 `service_manager.py`，功能更丰富：
```bash
python3 service_manager.py monitor
```

### 生产环境
推荐使用 systemd 服务，稳定可靠：
```bash
./install-service.sh
sudo systemctl enable project_manager-project-manager
sudo systemctl start project_manager-project-manager
```

## 🔍 监控和日志

### 实时监控
```bash
# Python管理器实时监控
python3 service_manager.py monitor

# systemd实时日志
sudo journalctl -u project_manager-project-manager -f
```

### 查看日志
```bash
# Shell脚本查看日志
./service.sh logs

# Python管理器查看日志
python3 service_manager.py logs --lines 200

# systemd查看日志
sudo journalctl -u project_manager-project-manager -n 100
```

### 服务状态
```bash
# 所有方案都支持状态查看
./service.sh status
python3 service_manager.py status
sudo systemctl status project_manager-project-manager
```

## ⚠️ 注意事项

1. **端口冲突**: 确保指定的端口未被其他服务占用
2. **权限问题**: systemd服务需要管理员权限安装和管理
3. **防火墙**: 生产环境记得开放防火墙端口
4. **日志轮转**: 长时间运行注意日志文件大小
5. **资源监控**: 监控CPU和内存使用情况

## 🛠️ 故障排除

### 服务无法启动
1. 检查端口是否被占用：`lsof -i :8001`
2. 查看详细日志：`./service.sh logs`
3. 检查Python环境：`python3 --version`

### 服务意外停止
1. 查看系统日志：`sudo journalctl -xe`
2. 检查资源使用：`htop`
3. 重启服务：`./service.sh restart`

### 性能问题
1. 使用监控命令：`python3 service_manager.py monitor`
2. 检查日志错误：`./service.sh logs`
3. 优化数据量：清理不必要的记录

## 📞 获取帮助

如果遇到问题，可以：
1. 查看各工具的帮助信息：`./service.sh help`
2. 查看日志文件寻找错误信息
3. 检查系统资源使用情况
4. 重启服务或重启系统

---

💡 **提示**: 建议在开发阶段使用Shell脚本，在部署到生产环境时使用systemd服务。