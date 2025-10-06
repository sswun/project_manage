# 用户认证系统使用指南

## 概述

project_manager工作项目管理系统现已支持用户名密码认证，提供安全可靠的数据访问控制。

## 🔐 核心特性

- **用户认证**: 基于用户名密码的安全登录
- **会话管理**: 1小时自动过期，支持主动登出
- **访问控制**: 所有敏感页面和API都需要认证
- **文件存储**: 用户数据保存在 `users.txt` 文件中
- **无注册功能**: 安全起见，仅支持管理员手动添加用户
- **共享数据**: 所有用户共享计划、项目和任务数据

## 🚀 快速启动

### 1. 启动认证服务器
```bash
python3 auth_server.py [端口]
```

### 2. 访问登录页面
- 默认地址: http://localhost:8001/login.html
- 如指定端口: http://localhost:端口号/login.html

### 3. 使用默认账户登录
- 用户名: `admin`
- 密码: `admin123`

## 👥 用户管理

### 添加用户

#### 交互式模式
```bash
python3 user_manager.py
```

#### 命令行模式
```bash
python3 user_manager.py add <用户名> <密码>
```

示例:
```bash
python3 user_manager.py add alice password123
```

#### 查看所有用户
```bash
python3 user_manager.py list
```

#### 修改用户密码
```bash
python3 user_manager.py
# 选择选项 3：修改密码
```

#### 删除用户
```bash
python3 user_manager.py remove <用户名>
```

#### 生成密码哈希
```bash
python3 user_manager.py hash <密码>
```

### 默认用户

系统已预置两个测试用户：
- `admin` / `admin123` (管理员)
- `user1` / `password123` (普通用户)

## 📁 文件结构

```
project_manage/
├── auth_server.py          # 带认证的HTTP服务器
├── user_manager.py         # 用户管理工具
├── users.txt               # 用户认证文件
├── login.html              # 登录页面
├── server_index.html       # 主页面 (需认证)
├── database/               # 数据库目录
│   ├── plans.json          # 计划数据
│   ├── projects.json       # 项目数据
│   ├── tasks.json          # 任务数据
│   └── records.json        # 记录数据
└── [其他现有文件...]
```

## 🔒 安全机制

### 密码存储
- 使用SHA-256哈希算法
- 密码以哈希形式存储，不保存明文
- 用户文件格式: `用户名:密码哈希`

### 会话管理
- 登录成功后生成随机会话Token
- Token有效期1小时，自动延期
- 支持IP地址验证
- 登出时立即失效

### 访问控制
- 登录页面: 无需认证
- 主页面: 需要认证
- API端点: 需要认证
- 静态资源: 需要认证

### 自动保护
- 未认证访问自动重定向到登录页面
- 会话过期自动要求重新登录
- 定期检查认证状态

## 🌐 公网部署

### 1. 端口配置
```bash
python3 auth_server.py 8080  # 使用8080端口
```

### 2. 防火墙设置
```bash
# Ubuntu/Debian
sudo ufw allow 8080

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --reload
```

### 3. 后台运行
```bash
nohup python3 auth_server.py 8080 > auth_server.log 2>&1 &
```

### 4. SSL/HTTPS配置
建议使用Nginx反向代理并配置SSL证书。

## 🔧 管理操作

### 备份用户数据
```bash
cp users.txt users_backup_$(date +%Y%m%d).txt
```

### 恢复用户数据
```bash
cp users_backup_20251006.txt users.txt
```

### 查看在线用户
```bash
# 查看服务器日志中会话创建信息
tail -f auth_server.log | grep "登录成功"
```

### 强制用户登出
重启服务器将清除所有会话，强制所有用户重新登录。

## 🧪 测试功能

### 运行测试套件
```bash
python3 test_auth.py
```

测试内容包括：
- 登录页面访问
- 未授权访问控制
- 用户登录验证
- 会话Cookie管理
- API数据访问
- 无效登录拒绝
- 认证状态检查
- 登出功能
- 用户管理工具

## 📋 使用流程

### 管理员
1. 启动服务器: `python3 auth_server.py`
2. 添加用户: `python3 user_manager.py add <用户名> <密码>`
3. 通知用户登录地址和凭据
4. 定期备份数据: `cp -r database/ backup_$(date +%Y%m%d)/`

### 普通用户
1. 访问登录页面
2. 输入用户名和密码
3. 登录成功后使用项目管理功能
4. 使用完毕点击登出
5. 会话1小时后自动过期

## ⚠️ 注意事项

1. **密码安全**: 使用强密码，定期更换
2. **文件权限**: 确保 `users.txt` 文件权限设置正确
3. **数据备份**: 定期备份 `database/` 目录和 `users.txt`
4. **网络安全**: 生产环境建议使用HTTPS
5. **会话管理**: 公用设备使用后务必登出

## 🔍 故障排除

### 常见问题

**Q: 忘记密码怎么办？**
A: 管理员使用 `user_manager.py` 重新设置密码

**Q: 无法登录？**
A: 检查用户名密码，确认用户存在且密码正确

**Q: 会话频繁过期？**
A: 检查服务器时间，确保时间同步

**Q: 页面显示登录页面但无法登录？**
A: 检查服务器是否正常运行，查看服务器日志

### 日志查看
```bash
tail -f auth_server.log
```

## 🎯 总结

认证系统已完全集成到项目管理系统中，提供：

- ✅ 安全的用户认证
- ✅ 简单的用户管理
- ✅ 可靠的会话控制
- ✅ 完整的访问保护
- ✅ 共享的数据访问

系统保持简单易用的同时，大幅提升了安全性和可靠性。

---

**创建者**: project_manager using Claude Code
**版本**: 2.0.0 (认证版)
**更新时间**: 2025-10-06