# Windows简单启动指南

## 🎯 问题解决

您遇到的问题是由于批处理文件编码导致的。我已经创建了完全兼容Windows的简化脚本。

## ✅ 推荐使用（按优先级）

### 1. 最简单方式 - 直接运行Python
打开命令行，进入项目目录，运行：
```
python server.py 8001
```

### 2. 最简单的批处理脚本

#### 前台启动（推荐测试用）
```
run_server.bat
```

#### 后台启动（推荐日常使用）
```
run_background.bat
```

#### 查看状态
```
status.bat
```

#### 停止服务
```
kill_server.bat
```

### 3. VBScript后台启动（完全隐藏）
```
start_hidden.vbs
```
双击运行，完全在后台启动，会显示确认消息框

## 🚀 使用步骤

### 日常使用推荐：
1. 双击 `run_background.bat` 启动服务
2. 双击 `status.bat` 检查状态
3. 双击 `kill_server.bat` 停止服务

### 开发测试推荐：
1. 双击 `run_server.bat` 前台启动
2. 可以看到实时日志
3. 按 Ctrl+C 停止

### 完全隐藏启动：
1. 双击 `start_hidden.vbs`
2. 服务在后台启动
3. 显示成功消息框

## 📋 文件说明

| 文件名 | 用途 | 推荐使用 |
|--------|------|----------|
| `run_server.bat` | 前台启动 | 测试、调试 |
| `run_background.bat` | 后台启动 | 日常使用 |
| `status.bat` | 检查状态 | 状态确认 |
| `kill_server.bat` | 停止服务 | 停止服务 |
| `start_hidden.vbs` | 隐藏启动 | 后台运行 |

## ⚠️ 注意事项

1. **确保Python已安装**并在PATH中
2. **确保在项目目录下运行**脚本
3. **端口8001不要被其他程序占用**
4. **Windows防火墙可能需要允许**Python网络访问

## 🛠️ 故障排除

### 问题1：找不到Python
- 安装Python并添加到PATH
- 或使用完整路径：`C:\Python39\python.exe server.py 8001`

### 问题2：端口被占用
- 运行 `kill_server.bat` 停止现有服务
- 或重启电脑

### 问题3：权限问题
- 右键"以管理员身份运行"脚本

---

现在请尝试使用这些简化的脚本，它们应该能正常工作！