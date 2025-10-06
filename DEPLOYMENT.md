# project_manager工作项目管理 - Django风格动态网站部署指南

## 概述

这是一个Django风格的动态网站，完全摆脱了浏览器localStorage依赖，所有数据都保存在服务器的本地文件系统中，适合公网部署。

## 核心特性

✅ **Django风格架构**: Python HTTP服务器 + 文件数据库
✅ **本地文件存储**: 数据保存在 `database/` 目录，不依赖浏览器
✅ **无自动下载**: 页面加载时不会自动下载JSON文件
✅ **数据持久性**: 服务器重启后数据依然存在
✅ **公网部署就绪**: 支持公网IP访问
✅ **模态框修复**: 保存后自动关闭弹窗

## 快速启动

### 1. 启动服务器
```bash
python3 server.py
```

### 2. 访问网站
- 本地访问: http://localhost:8000
- 公网访问: http://你的IP地址:8000

### 3. 测试功能
```bash
python3 test_server.py
```

## 文件结构

```
project_manage/
├── server.py                 # Python HTTP服务器 (Django风格)
├── server_index.html         # 服务器兼容的主页面
├── server_script.js          # 服务器端数据管理
├── ui_functions.js           # UI功能函数
├── styles.css               # 样式文件
├── test_server.py           # 功能测试脚本
├── database/                # 文件数据库
│   ├── plans.json          # 计划数据
│   ├── projects.json       # 项目数据
│   ├── tasks.json          # 任务数据
│   ├── records.json        # 记录数据
│   └── init_data.json      # 初始数据
├── store/                  # 文件存储目录
├── init_database.py        # 数据库初始化脚本
└── DEPLOYMENT.md           # 本部署指南
```

## API端点

### GET /api/data
加载所有数据
```json
{
  "plans": [...],
  "projects": [...],
  "tasks": [...],
  "records": [...]
}
```

### POST /api/save
保存数据
```json
{
  "plans": [...],
  "projects": [...],
  "tasks": [...],
  "records": [...]
}
```

## 数据管理

### 数据存储位置
- 所有数据保存在 `database/` 目录的JSON文件中
- 文件上传保存在 `store/` 目录
- 服务器重启后数据依然保持

### 数据备份
直接复制 `database/` 目录即可备份所有数据：
```bash
cp -r database/ backup_$(date +%Y%m%d)/
```

### 数据恢复
将备份的数据库文件复制回 `database/` 目录即可恢复数据。

## 公网部署

### 1. 端口配置
默认端口8000，可在 `server.py` 中修改：
```python
PORT = 8000  # 修改为你需要的端口
```

### 2. 防火墙设置
确保服务器防火墙允许8000端口：
```bash
# Ubuntu/Debian
sudo ufw allow 8000

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=8000/tcp
sudo firewall-cmd --reload
```

### 3. 后台运行
使用 `nohup` 后台运行：
```bash
nohup python3 server.py > server.log 2>&1 &
```

### 4. 进程管理
查看运行状态：
```bash
ps aux | grep server.py
```

停止服务器：
```bash
pkill -f "python3 server.py"
```

## 性能优化

### 1. 生产环境部署
建议使用 Nginx + uWSGI：
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 2. SSL证书
使用 Let's Encrypt 启用HTTPS：
```bash
sudo certbot --nginx -d your-domain.com
```

## 故障排除

### 常见问题

**Q: 页面无法加载？**
A: 检查服务器是否启动，端口是否被占用

**Q: 数据保存失败？**
A: 检查 `database/` 目录权限，确保服务器有写入权限

**Q: 无法公网访问？**
A: 检查防火墙设置和端口转发配置

**Q: 文件上传失败？**
A: 检查 `store/` 目录权限

### 日志查看
```bash
tail -f server.log
```

## 测试验证

运行完整测试套件：
```bash
python3 test_server.py
```

预期输出：
```
✅ 服务器运行正常
✅ 数据加载成功！
✅ 数据保存成功！
✅ 数据持久性验证成功！
✅ 主页加载成功！
✅ CSS文件加载成功！
🎉 Django风格动态网站测试完成！
```

## 更新升级

### 1. 备份数据
```bash
cp -r database/ backup_$(date +%Y%m%d)/
```

### 2. 更新代码
```bash
git pull  # 或手动替换文件
```

### 3. 重启服务器
```bash
pkill -f "python3 server.py"
python3 server.py
```

## 技术支持

如有问题，请检查：
1. Python版本 (需要3.6+)
2. 文件权限设置
3. 端口占用情况
4. 防火墙配置

---

**创建者**: project_manager using Claude Code
**版本**: 1.0.0
**更新时间**: 2025-10-06