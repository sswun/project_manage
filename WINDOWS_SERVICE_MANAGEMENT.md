# project_manager项目管理系统 - Windows服务管理指南

本文档专为Windows环境下的后台服务管理提供完整解决方案。

## 🎯 Windows环境下的服务管理方案

### 方案1: 批处理脚本管理（推荐新手）
最简单直接的Windows管理方式，无需额外依赖。

```cmd
# 启动服务
service.bat start

# 查看状态
service.bat status

# 停止服务
service.bat stop

# 重启服务
service.bat restart

# 查看日志
service.bat logs

# 实时监控
service.bat monitor

# 查看帮助
service.bat help
```

### 方案2: PowerShell脚本管理（推荐高级用户）
功能更强大的管理方式，支持详细状态信息和Windows特性。

```powershell
# 启动服务
.\service.ps1 start

# 查看详细状态
.\service.ps1 status

# 停止服务
.\service.ps1 stop

# 重启服务
.\service.ps1 restart

# 查看日志（指定行数）
.\service.ps1 logs -Lines 100

# 实时监控（指定间隔）
.\service.ps1 monitor -Interval 3

# 使用不同端口
.\service.ps1 start -Port 8080

# 查看帮助
.\service.ps1 help
```

### 方案3: Python Windows管理器（推荐开发者）
功能最全面的管理工具，支持进程监控和系统信息。

```cmd
# 启动服务
python windows_service_manager.py start

# 查看详细状态
python windows_service_manager.py status

# 停止服务
python windows_service_manager.py stop

# 重启服务
python windows_service_manager.py restart

# 查看日志
python windows_service_manager.py logs --lines 100

# 实时监控
python windows_service_manager.py monitor --interval 3

# 安装Windows服务
python windows_service_manager.py install

# 添加开机启动
python windows_service_manager.py startup

# 查看系统信息
python windows_service_manager.py info
```

### 方案4: Windows系统服务（推荐生产环境）
最专业的部署方式，支持开机自启动和系统级管理。

```cmd
# 一键安装服务（需要管理员权限）
install_windows_service.bat

# 手动启动服务
net start project_manager-project-manager

# 手动停止服务
net stop project_manager-project-manager

# 查看服务状态
sc query project_manager-project-manager

# 删除服务
sc delete project_manager-project-manager
```

## 📋 各方案对比

| 特性 | 批处理脚本 | PowerShell | Python管理器 | Windows服务 |
|------|-----------|------------|--------------|-------------|
| 易用性 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| 功能性 | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 监控能力 | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| 自启动支持 | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 系统集成 | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 适用场景 | 快速测试 | PowerShell用户 | 开发者 | 生产环境 |

## 🚀 快速开始

### 1. 环境检查
确保已安装Python并添加到PATH：
```cmd
python --version
```

### 2. 选择管理方式
根据你的需求选择合适的管理方案：

- **新手用户**: 使用 `service.bat`
- **PowerShell用户**: 使用 `service.ps1`
- **开发者**: 使用 `windows_service_manager.py`
- **生产环境**: 使用 `install_windows_service.bat`

### 3. 启动服务
```cmd
# 方式1: 批处理
service.bat start

# 方式2: PowerShell
.\service.ps1 start

# 方式3: Python
python windows_service_manager.py start
```

### 4. 访问系统
服务启动后，在浏览器中访问：
```
http://localhost:8001
```

## 🔧 安装Windows服务（生产环境推荐）

### 自动安装
```cmd
# 以管理员身份运行
install_windows_service.bat
```

### 手动安装（需要NSSM）
```cmd
# 1. 下载NSSM
# 访问: https://nssm.cc/download
# 下载并解压到系统PATH目录

# 2. 安装服务
nssm install project_manager-project-manager service_wrapper.bat
nssm set project_manager-project-manager DisplayName "project_manager项目管理系统"
nssm set project_manager-project-manager Description "project_manager项目管理系统Web服务"
nssm set project_manager-project-manager Start SERVICE_AUTO_START

# 3. 启动服务
net start project_manager-project-manager
```

## 📱 开机自启动配置

### 方案1: 用户启动项
```cmd
# 添加到用户启动项
service.bat startup
```

### 方案2: Windows服务
```cmd
# 安装为Windows服务（推荐）
install_windows_service.bat
```

### 方案3: 任务计划程序
1. 打开"任务计划程序"
2. 创建基本任务
3. 设置触发器为"计算机启动时"
4. 操作设置为运行 `start_service.bat`

## 🔍 监控和日志

### 实时监控
```cmd
# 批处理脚本监控
service.bat monitor

# PowerShell监控
.\service.ps1 monitor -Interval 3

# Python监控
python windows_service_manager.py monitor
```

### 查看日志
```cmd
# 查看最近日志
service.bat logs

# 查看更多日志
.\service.ps1 logs -Lines 200

# Python查看日志
python windows_service_manager.py logs --lines 100
```

### Windows服务日志
```cmd
# 查看服务日志
type project_manager-project-manager-stdout.log
type project_manager-project-manager-stderr.log

# Windows事件查看器
eventvwr.msc
```

## 🛠️ 故障排除

### 常见问题

#### 1. Python环境问题
```cmd
# 检查Python是否安装
python --version

# 检查PATH环境变量
where python

# 如果未找到，重新安装Python并勾选"Add Python to PATH"
```

#### 2. 端口被占用
```cmd
# 查看端口占用
netstat -ano | find :8001

# 结束占用进程
taskkill /PID <进程ID> /F

# 使用其他端口
service.bat start --port 8080
```

#### 3. 权限问题
```cmd
# 检查管理员权限
net session

# 以管理员身份运行
# 右键 -> 以管理员身份运行
```

#### 4. 防火墙问题
```cmd
# 允许防火墙通过
netsh advfirewall firewall add rule name="project_manager" dir=in action=allow protocol=TCP localport=8001

# 或在防火墙设置中手动添加例外
```

#### 5. 服务无法启动
1. 检查Python环境
2. 查看日志文件
3. 检查端口占用
4. 验证文件权限
5. 重启系统

### 日志文件位置
- 应用日志: `project_manager-project-manager.log`
- 服务标准输出: `project_manager-project-manager-stdout.log`
- 服务错误输出: `project_manager-project-manager-stderr.log`
- 系统事件日志: 事件查看器 -> Windows日志 -> 应用程序

## 📁 文件说明

| 文件名 | 用途 | 适用方案 |
|--------|------|----------|
| `service.bat` | 批处理管理脚本 | 新手、快速测试 |
| `service.ps1` | PowerShell管理脚本 | PowerShell用户 |
| `windows_service_manager.py` | Python管理器 | 开发者 |
| `install_windows_service.bat` | Windows服务安装 | 生产环境 |
| `start_service.bat` | 静默启动脚本 | 开机启动 |
| `stop_service.bat` | 静默停止脚本 | 关机脚本 |
| `control_panel.html` | Web控制面板 | 图形界面管理 |

## 🎨 个性化配置

### 修改默认端口
编辑配置文件 `project_manager-project-manager.json`：
```json
{
    "port": 8080,
    "auto_restart": true,
    "max_retries": 3
}
```

### 自定义日志级别
在 `server.py` 中修改日志配置：
```python
import logging
logging.basicConfig(level=logging.INFO)
```

### 设置环境变量
```cmd
# 设置环境变量
set PORT=8080
set LOG_LEVEL=DEBUG

# 或在系统环境变量中设置
```

## 📞 获取帮助

1. **查看命令帮助**: `service.bat help`
2. **查看详细文档**: `WINDOWS_SERVICE_MANAGEMENT.md`
3. **检查日志文件**: `service.bat logs`
4. **查看系统信息**: `python windows_service_manager.py info`

---

💡 **提示**:
- 开发阶段推荐使用批处理脚本
- 生产环境推荐使用Windows服务
- 如果遇到问题，优先查看日志文件
- 确保Python环境正确配置