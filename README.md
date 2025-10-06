# 项目管理系统 (Project Management System)

一个现代化、美观的项目管理Web应用程序，支持多用户、实时数据同步和持久化存储。

## 🌟 功能特点

### 🎯 项目管理
- **多分类支持**：工作、个人、学习、创意项目分类
- **状态管理**：计划中、进行中、已完成、已暂停状态跟踪
- **优先级设置**：高、中、低优先级标记
- **截止日期管理**：项目时间节点和目标设定
- **详细描述**：完整的项目信息记录

### 📊 数据统计与可视化
- **实时统计仪表盘**：项目总数、进行中数量、完成数量
- **项目概览**：最近项目的快速查看
- **状态分布**：项目状态的可视化展示
- **分类统计**：不同类型项目的数据分析

### 🔍 搜索与筛选
- **智能搜索**：按项目名称和描述进行全文搜索
- **多维度筛选**：按状态、分类、优先级筛选
- **实时更新**：筛选结果即时显示，无需刷新

### 👥 用户管理
- **安全认证**：用户注册、登录、会话管理
- **角色权限**：管理员和普通用户角色
- **密码安全**：PBKDF2算法加密存储
- **会话管理**：4小时会话过期和滑动更新

### 💾 数据持久化
- **服务器端存储**：JSON格式文件存储
- **数据备份**：自动备份和恢复机制
- **跨设备同步**：多设备登录数据同步
- **数据导出**：支持JSON格式数据导出

### 🎨 现代化界面
- **响应式设计**：完美适配桌面、平板、手机
- **渐变背景**：紫色系专业设计风格
- **卡片式布局**：清晰的信息层级展示
- **动画效果**：流畅的交互动画
- **图标系统**：Font Awesome图标增强

## 🚀 快速开始

### 环境要求
- Python 3.7+
- 现代Web浏览器（Chrome 60+、Firefox 55+、Safari 12+、Edge 79+）

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/yourusername/project-management-system.git
cd project-management-system
```

2. **启动服务器**
```bash
python server.py
```

或者指定端口：
```bash
python server.py 8080
```

3. **访问系统**
打开浏览器访问：http://localhost:8001

### 默认账户
- **管理员账户**：用户名 `admin`，密码 `admin123`
- **普通用户**：用户名 `demo`，密码 `123456`

## 📁 项目结构

```
project-management-system/
├── server.py                 # 主服务器文件
├── server_stable.py         # 稳定版服务器
├── auth_server.py           # 认证服务器
├── index.html               # 前端主页面（纯前端版本）
├── server_index.html        # 服务器端主页面
├── login.html               # 登录页面
├── control_panel.html       # 控制面板
├── styles.css               # 样式文件
├── script.js                # 前端脚本
├── server_script.js         # 服务器端脚本
├── ui_functions.js          # UI功能函数
├── database/                # 数据存储目录
│   ├── users.json           # 用户数据
│   ├── projects.json        # 项目数据
│   ├── plans.json           # 计划数据
│   ├── tasks.json           # 任务数据
│   └── records.json         # 记录数据
├── sessions/                # 会话数据目录
│   └── sessions.json        # 活跃会话
├── service_manager.py       # 服务管理器
├── user_manager.py          # 用户管理器
├── init_database.py         # 数据库初始化
├── auto_save.py             # 自动保存功能
├── data_backup.js           # 数据备份脚本
├── project-manager.service  # Linux服务配置
├── project-manager.json     # 项目配置文件
└── docs/                    # 文档目录
    ├── AUTH_GUIDE.md        # 认证指南
    ├── DATA_SECURITY.md     # 数据安全文档
    ├── DEPLOYMENT.md        # 部署指南
    ├── SERVICE_MANAGEMENT.md # 服务管理文档
    └── WINDOWS_QUICK_START.md # Windows快速开始
```

## 🔧 配置说明

### 服务器配置
服务器默认监听8001端口，可以通过以下方式修改：

```bash
python server.py <端口号>
```

### 数据库配置
- 数据存储位置：`database/` 目录
- 会话存储位置：`sessions/` 目录
- 支持手动备份和恢复

### 安全配置
- 密码使用PBKDF2算法加密
- 会话过期时间：4小时
- 支持IP地址验证
- 防暴力破解延迟机制

## 📖 使用指南

### 项目管理

1. **创建项目**
   - 点击"新建项目"按钮
   - 填写项目基本信息（名称、描述）
   - 选择分类（工作/个人/学习/创意）
   - 设置状态和优先级
   - 可选设置截止日期
   - 点击保存

2. **项目管理**
   - **编辑**：点击项目卡片的编辑图标
   - **删除**：点击项目卡片的删除图标
   - **查看详情**：在仪表盘查看项目概览

3. **搜索筛选**
   - 使用搜索框查找特定项目
   - 使用状态筛选器查看不同状态的项目
   - 使用分类筛选器按类别查看

### 用户管理

1. **登录系统**
   - 访问登录页面
   - 输入用户名和密码
   - 系统自动创建会话

2. **登出系统**
   - 点击登出按钮
   - 系统清除会话信息

3. **权限说明**
   - **管理员**：完全访问权限
   - **普通用户**：基本项目管理权限

## 🌐 部署指南

### 本地部署
```bash
git clone <repository-url>
cd project-management-system
python server.py
```

### Linux服务部署
1. 复制服务配置文件：
```bash
sudo cp project-manager.service /etc/systemd/system/
```

2. 启动服务：
```bash
sudo systemctl enable project-manager
sudo systemctl start project-manager
```

3. 查看状态：
```bash
sudo systemctl status project-manager
```

### Docker部署（可选）
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY . .
EXPOSE 8001
CMD ["python", "server.py"]
```

## 🔒 安全特性

- **密码加密**：PBKDF2 + SHA256算法
- **会话管理**：安全的会话令牌机制
- **输入验证**：严格的数据验证规则
- **XSS防护**：前端输入过滤
- **CSRF保护**：令牌验证机制

## 📊 API文档

### 认证相关
- `POST /api/login` - 用户登录
- `POST /api/logout` - 用户登出
- `GET /api/check-auth` - 检查认证状态

### 数据操作
- `GET /api/data` - 获取项目数据
- `POST /api/save` - 保存项目数据
- `POST /api/load` - 加载项目数据

## 🛠️ 开发指南

### 技术栈
- **后端**：Python 3 + HTTPServer
- **前端**：HTML5 + CSS3 + JavaScript ES6+
- **存储**：JSON文件系统
- **认证**：自定义会话管理

### 扩展开发
1. 添加新功能模块
2. 修改样式主题
3. 集成数据库系统
4. 添加更多用户角色

## 📈 性能优化

- **图片压缩**：自动压缩上传的图片
- **缓存策略**：静态文件缓存
- **数据压缩**：JSON数据压缩存储
- **延迟加载**：按需加载项目数据

## 🔄 更新日志

### v2.0.0 (最新)
- ✅ 添加用户认证系统
- ✅ 服务器端数据存储
- ✅ 会话管理功能
- ✅ 权限控制系统
- ✅ 数据备份恢复

### v1.0.0
- ✅ 基础项目管理功能
- ✅ 前端界面设计
- ✅ 本地数据存储
- ✅ 搜索筛选功能

## 🐛 问题反馈

如果您在使用过程中遇到问题，请：

1. 查看本文档的常见问题部分
2. 检查浏览器控制台错误信息
3. 在GitHub Issues中提交问题
4. 提供详细的错误信息和复现步骤

## 📄 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📞 联系方式

- 项目主页：https://github.com/yourusername/project-management-system
- 问题反馈：https://github.com/yourusername/project-management-system/issues
- 邮箱：your-email@example.com

---

⭐ 如果这个项目对您有帮助，请给个Star支持一下！