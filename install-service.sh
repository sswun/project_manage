#!/bin/bash
# 安装systemd服务脚本

SERVICE_NAME="project_manager-project-manager"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
CURRENT_DIR=$(pwd)
PROJECT_PATH="/mnt/j/files/ASpecialItems/personalWebsite/project_manage"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 安装project_manager项目管理系统systemd服务${NC}"

# 检查是否为root用户
if [[ $EUID -eq 0 ]]; then
   echo -e "${RED}❌ 请不要使用root用户运行此脚本${NC}"
   echo -e "${YELLOW}💡 使用普通用户运行: ./install-service.sh${NC}"
   exit 1
fi

# 检查systemd是否可用
if ! command -v systemctl &> /dev/null; then
    echo -e "${RED}❌ 此系统不支持systemd${NC}"
    exit 1
fi

# 创建systemd服务文件
echo -e "${BLUE}📝 创建systemd服务文件...${NC}"

# 获取当前用户信息
CURRENT_USER=$(whoami)
CURRENT_GROUP=$(id -gn)

# 创建服务文件内容
cat > "${SERVICE_NAME}.service.tmp" << EOF
[Unit]
Description=project_manager项目管理系统
Documentation=https://github.com/project_manager/project-manager
After=network.target

[Service]
Type=simple
User=${CURRENT_USER}
Group=${CURRENT_GROUP}
WorkingDirectory=${PROJECT_PATH}
ExecStart=/usr/bin/python3 ${PROJECT_PATH}/server.py 8001
ExecReload=/bin/kill -HUP \$MAINPID
Restart=always
RestartSec=10

# 环境变量
Environment=PYTHONPATH=${PROJECT_PATH}

# 安全设置
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=${PROJECT_PATH}/database
ReadWritePaths=${PROJECT_PATH}/sessions

# 日志设置
StandardOutput=journal
StandardError=journal
SyslogIdentifier=project_manager-project-manager

[Install]
WantedBy=multi-user.target
EOF

echo -e "${YELLOW}⚠️  需要管理员权限来安装系统服务${NC}"

# 复制服务文件到系统目录
sudo cp "${SERVICE_NAME}.service.tmp" "/tmp/${SERVICE_NAME}.service"

# 使用sudo创建最终的服务文件
sudo bash -c "cat > ${SERVICE_FILE} << 'EOF'
[Unit]
Description=project_manager项目管理系统
Documentation=https://github.com/project_manager/project-manager
After=network.target

[Service]
Type=simple
User=${CURRENT_USER}
Group=${CURRENT_GROUP}
WorkingDirectory=${PROJECT_PATH}
ExecStart=/usr/bin/python3 ${PROJECT_PATH}/server.py 8001
ExecReload=/bin/kill -HUP \$MAINPID
Restart=always
RestartSec=10

# 环境变量
Environment=PYTHONPATH=${PROJECT_PATH}

# 安全设置
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=${PROJECT_PATH}/database
ReadWritePaths=${PROJECT_PATH}/sessions

# 日志设置
StandardOutput=journal
StandardError=journal
SyslogIdentifier=project_manager-project-manager

[Install]
WantedBy=multi-user.target
EOF"

# 清理临时文件
rm -f "${SERVICE_NAME}.service.tmp"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 服务文件创建成功${NC}"
else
    echo -e "${RED}❌ 服务文件创建失败${NC}"
    exit 1
fi

# 重新加载systemd
echo -e "${BLUE}🔄 重新加载systemd配置...${NC}"
sudo systemctl daemon-reload

# 启用服务（开机自启）
echo -e "${BLUE}🔧 启用服务...${NC}"
sudo systemctl enable ${SERVICE_NAME}

echo -e "${GREEN}✅ 服务安装完成！${NC}"
echo ""
echo -e "${YELLOW}服务管理命令:${NC}"
echo -e "${BLUE}  sudo systemctl start ${SERVICE_NAME}     # 启动服务${NC}"
echo -e "${BLUE}  sudo systemctl stop ${SERVICE_NAME}      # 停止服务${NC}"
echo -e "${BLUE}  sudo systemctl restart ${SERVICE_NAME}   # 重启服务${NC}"
echo -e "${BLUE}  sudo systemctl status ${SERVICE_NAME}    # 查看状态${NC}"
echo -e "${BLUE}  sudo systemctl enable ${SERVICE_NAME}    # 开机自启${NC}"
echo -e "${BLUE}  sudo systemctl disable ${SERVICE_NAME}   # 取消自启${NC}"
echo ""
echo -e "${YELLOW}日志查看:${NC}"
echo -e "${BLUE}  sudo journalctl -u ${SERVICE_NAME} -f    # 实时日志${NC}"
echo -e "${BLUE}  sudo journalctl -u ${SERVICE_NAME} -n 50 # 最近50条日志${NC}"
echo ""
echo -e "${YELLOW}💡 现在可以使用以下命令启动服务:${NC}"
echo -e "${BLUE}  sudo systemctl start ${SERVICE_NAME}${NC}"
echo -e "${YELLOW}💡 然后访问: http://localhost:8001${NC}"