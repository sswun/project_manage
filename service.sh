#!/bin/bash
# project_manager项目管理系统服务控制脚本

SERVICE_NAME="project_manager-project-manager"
DEFAULT_PORT=8001
PID_FILE="service.pid"
LOG_FILE="service.log"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查服务状态
check_status() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p $PID > /dev/null 2>&1; then
            echo -e "${GREEN}✅ 服务正在运行${NC}"
            echo -e "${BLUE}PID: $PID${NC}"
            echo -e "${BLUE}端口: $DEFAULT_PORT${NC}"
            echo -e "${BLUE}访问地址: http://localhost:$DEFAULT_PORT${NC}"
            return 0
        else
            echo -e "${RED}❌ 服务已停止，但PID文件存在${NC}"
            rm -f "$PID_FILE"
            return 1
        fi
    else
        echo -e "${YELLOW}⏸️  服务未运行${NC}"
        return 1
    fi
}

# 启动服务
start_service() {
    if check_status > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  服务已在运行中${NC}"
        return 1
    fi

    echo -e "${BLUE}🚀 正在启动project_manager项目管理系统...${NC}"

    # 检查端口是否被占用
    if lsof -Pi :$DEFAULT_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${RED}❌ 端口 $DEFAULT_PORT 已被占用${NC}"
        return 1
    fi

    # 启动服务
    nohup python3 server.py $DEFAULT_PORT > "$LOG_FILE" 2>&1 &
    PID=$!

    # 保存PID
    echo $PID > "$PID_FILE"

    # 等待服务启动
    sleep 2

    # 验证服务是否成功启动
    if ps -p $PID > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 服务启动成功！${NC}"
        echo -e "${BLUE}PID: $PID${NC}"
        echo -e "${BLUE}访问地址: http://localhost:$DEFAULT_PORT${NC}"
        echo -e "${BLUE}日志文件: $LOG_FILE${NC}"
        echo -e "${YELLOW}💡 使用 './service.sh status' 查看服务状态${NC}"
        echo -e "${YELLOW}💡 使用 './service.sh stop' 停止服务${NC}"
    else
        echo -e "${RED}❌ 服务启动失败${NC}"
        rm -f "$PID_FILE"
        return 1
    fi
}

# 停止服务
stop_service() {
    if ! check_status > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  服务未运行${NC}"
        return 1
    fi

    PID=$(cat "$PID_FILE")
    echo -e "${BLUE}🛑 正在停止服务...${NC}"

    # 发送TERM信号
    kill -TERM $PID 2>/dev/null

    # 等待进程结束
    for i in {1..10}; do
        if ! ps -p $PID > /dev/null 2>&1; then
            break
        fi
        sleep 1
    done

    # 如果进程仍在运行，强制杀死
    if ps -p $PID > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  强制停止服务...${NC}"
        kill -KILL $PID 2>/dev/null
        sleep 1
    fi

    # 清理PID文件
    rm -f "$PID_FILE"

    # 验证服务是否停止
    if ! ps -p $PID > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 服务已停止${NC}"
    else
        echo -e "${RED}❌ 无法停止服务${NC}"
        return 1
    fi
}

# 重启服务
restart_service() {
    echo -e "${BLUE}🔄 正在重启服务...${NC}"
    stop_service
    sleep 2
    start_service
}

# 查看日志
view_logs() {
    if [ -f "$LOG_FILE" ]; then
        echo -e "${BLUE}📋 最近的日志记录:${NC}"
        tail -n 20 "$LOG_FILE"
    else
        echo -e "${YELLOW}⚠️  日志文件不存在${NC}"
    fi
}

# 显示帮助信息
show_help() {
    echo -e "${BLUE}project_manager项目管理系统服务控制脚本${NC}"
    echo ""
    echo -e "${YELLOW}用法:${NC}"
    echo "  ./service.sh [命令]"
    echo ""
    echo -e "${YELLOW}命令:${NC}"
    echo "  start     启动服务"
    echo "  stop      停止服务"
    echo "  restart   重启服务"
    echo "  status    查看服务状态"
    echo "  logs      查看最近日志"
    echo "  help      显示帮助信息"
    echo ""
    echo -e "${YELLOW}示例:${NC}"
    echo "  ./service.sh start    # 启动服务"
    echo "  ./service.sh status   # 查看状态"
    echo "  ./service.sh stop     # 停止服务"
}

# 主逻辑
case "$1" in
    start)
        start_service
        ;;
    stop)
        stop_service
        ;;
    restart)
        restart_service
        ;;
    status)
        check_status
        ;;
    logs)
        view_logs
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}❌ 未知命令: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac