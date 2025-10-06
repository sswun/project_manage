# project_manager项目管理系统 - Windows快速启动指南

## 🎯 问题原因分析

您遇到的错误是由于批处理文件的**UTF-8编码问题**导致的。Windows命令行对UTF-8编码支持不完善，特别是处理中文字符时会出现乱码。

## ✅ 解决方案

我已经为您创建了几个简化的、编码安全的批处理脚本，请使用以下文件：

### 🚀 最简单的启动方式

#### 1. 前台启动（推荐新手）
```cmd
start_server.bat
```
- 双击运行或在命令行执行
- 可以看到实时日志输出
- 按Ctrl+C停止服务

#### 2. 后台启动（推荐日常使用）
```cmd
start_background.bat
```
- 双击运行，服务在后台启动
- 启动后可以关闭命令行窗口
- 日志输出到 `server_log.txt` 文件

#### 3. 检查服务状态
```cmd
check_status.bat
```
- 查看服务是否正在运行
- 显示进程信息和访问地址

#### 4. 停止服务
```cmd
stop_server.bat
```
- 停止所有相关进程
- 释放端口8001

## 📋 使用步骤

### 首次使用
1. **双击 `start_server.bat`** 启动服务
2. 等待看到 "Starting server on port 8001"
3. 打开浏览器访问 `http://localhost:8001`
4. 使用默认账户登录：
   - 用户名：`project_manager` 密码：`123456`
   - 或 用户名：`admin` 密码：`admin123`

### 日常使用
1. **双击 `start_background.bat`** 后台启动服务
2. 服务启动后可以关闭命令行窗口
3. 需要时运行 `check_status.bat` 检查状态
4. 使用完毕后运行 `stop_server.bat` 停止服务

## 🔧 故障排除

### 问题1：端口被占用
**症状**：启动时提示 "Port 8001 is already in use"
**解决**：
1. 运行 `stop_server.bat` 停止现有服务
2. 或者重启电脑

### 问题2：Python未找到
**症状**：启动时提示 "Python not found"
**解决**：
1. 安装Python 3.7+
2. 安装时勾选 "Add Python to PATH"
3. 重新启动命令行窗口

### 问题3：server.py文件不存在
**症状**：启动时提示 "server.py not found"
**解决**：
1. 确保在正确的项目目录中运行脚本
2. 检查项目文件夹中是否有 `server.py` 文件

### 问题4：服务无法访问
**症状**：浏览器无法打开 `http://localhost:8001`
**解决**：
1. 运行 `check_status.bat` 确认服务状态
2. 检查防火墙设置
3. 尝试使用其他浏览器

## 🎨 高级使用

### 开机自启动
如果需要开机自动启动服务：

1. **方法一：启动文件夹**
   - 按 `Win + R` 输入 `shell:startup`
   - 将 `start_background.bat` 复制到打开的文件夹

2. **方法二：任务计划程序**
   - 打开"任务计划程序"
   - 创建基本任务
   - 触发器选择"计算机启动时"
   - 操作选择运行 `start_background.bat`

### 自定义端口
如果需要使用其他端口：

1. **临时修改**：
   ```cmd
   python server.py 8080
   ```

2. **永久修改**：
   编辑 `server.py` 文件，修改默认端口号

## 📁 文件说明

| 文件名 | 用途 | 推荐使用 |
|--------|------|----------|
| `start_server.bat` | 前台启动 | 测试、调试 |
| `start_background.bat` | 后台启动 | 日常使用 |
| `check_status.bat` | 检查状态 | 状态确认 |
| `stop_server.bat` | 停止服务 | 停止服务 |
| `server.py` | 主服务器程序 | - |
| `service_fixed.bat` | 修复版管理脚本 | 高级用户 |

## 🛠️ 开发者选项

如果您是开发者，还可以使用：

### PowerShell脚本
```powershell
.\service.ps1 start
.\service.ps1 status
.\service.ps1 stop
```

### Python管理器
```cmd
python windows_service_manager.py start
python windows_service_manager.py status
python windows_service_manager.py stop
```

## 💡 使用建议

1. **测试阶段**：使用 `start_server.bat` 前台启动，方便查看日志
2. **日常使用**：使用 `start_background.bat` 后台启动
3. **问题排查**：使用 `check_status.bat` 检查状态
4. **停止服务**：使用 `stop_server.bat` 停止服务

## 📞 获取帮助

如果遇到问题：
1. 检查 `server_log.txt` 文件中的错误信息
2. 运行 `check_status.bat` 查看服务状态
3. 确认Python环境正确安装
4. 检查端口8001是否被其他程序占用

---

**注意**：避免使用原来的 `service.bat` 文件，它存在编码兼容性问题。请使用新创建的简化脚本。