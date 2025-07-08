#!/bin/bash

# =============================================================================
# Apple Container 管理脚本
# 提供便捷的容器管理功能
# =============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

CONTAINER_NAME="exam-system-app"

print_usage() {
    echo "🍎 Apple Container 管理工具"
    echo "========================="
    echo
    echo "用法: $0 <命令> [选项]"
    echo
    echo "命令:"
    echo "  start       启动考试系统容器"
    echo "  stop        停止考试系统容器"
    echo "  restart     重启考试系统容器"
    echo "  status      查看容器状态"
    echo "  logs        查看容器日志"
    echo "  shell       进入容器Shell"
    echo "  cleanup     清理停止的容器"
    echo "  system      管理Apple Container系统"
    echo "  images      管理镜像"
    echo "  help        显示此帮助信息"
    echo
}

check_container_service() {
    if ! command -v container &> /dev/null; then
        echo -e "${RED}❌ 未找到 Apple Container 命令${NC}"
        exit 1
    fi
}

start_container() {
    echo -e "${BLUE}🚀 启动考试系统容器...${NC}"
    
    # 检查容器是否已存在
    if container list | grep -q "$CONTAINER_NAME"; then
        echo -e "${YELLOW}⚠️  容器已在运行${NC}"
        return 0
    fi
    
    # 启动新容器
    container run \
        --name "$CONTAINER_NAME" \
        --detach \
        --rm \
        exam-system
    
    echo -e "${GREEN}✅ 容器启动成功${NC}"
    show_access_info
}

stop_container() {
    echo -e "${BLUE}🛑 停止考试系统容器...${NC}"
    
    if container list | grep -q "$CONTAINER_NAME"; then
        container stop "$CONTAINER_NAME"
        echo -e "${GREEN}✅ 容器已停止${NC}"
    else
        echo -e "${YELLOW}⚠️  容器未运行${NC}"
    fi
}

restart_container() {
    echo -e "${BLUE}🔄 重启考试系统容器...${NC}"
    stop_container
    sleep 2
    start_container
}

show_status() {
    echo -e "${BLUE}📊 容器状态:${NC}"
    echo
    container list --all
    echo
    
    if container list | grep -q "$CONTAINER_NAME"; then
        echo -e "${GREEN}✅ 考试系统容器正在运行${NC}"
        show_access_info
    else
        echo -e "${RED}❌ 考试系统容器未运行${NC}"
    fi
}

show_logs() {
    echo -e "${BLUE}📋 查看容器日志:${NC}"
    echo
    if container list | grep -q "$CONTAINER_NAME"; then
        container logs "$CONTAINER_NAME"
    else
        echo -e "${RED}❌ 容器未运行${NC}"
    fi
}

enter_shell() {
    echo -e "${BLUE}🐚 进入容器Shell:${NC}"
    if container list | grep -q "$CONTAINER_NAME"; then
        container exec --tty --interactive "$CONTAINER_NAME" sh
    else
        echo -e "${RED}❌ 容器未运行${NC}"
    fi
}

cleanup_containers() {
    echo -e "${BLUE}🧹 清理停止的容器...${NC}"
    
    # 显示所有容器
    echo "当前容器列表:"
    container list --all
    echo
    
    # 注意：Apple Container 的 --rm 标志会自动清理，这里主要用于显示
    echo -e "${GREEN}✅ 清理完成${NC}"
}

manage_system() {
    echo -e "${BLUE}⚙️  Apple Container 系统管理:${NC}"
    echo
    echo "1. 查看系统状态: container system status"
    echo "2. 启动系统服务: container system start"
    echo "3. 停止系统服务: container system stop"
    echo "4. 查看DNS配置: container system dns list"
    echo
    
    read -p "请选择操作 (1-4, 或按Enter跳过): " choice
    
    case $choice in
        1) container system status ;;
        2) container system start ;;
        3) container system stop ;;
        4) container system dns list ;;
        *) echo "已跳过" ;;
    esac
}

manage_images() {
    echo -e "${BLUE}🖼️  镜像管理:${NC}"
    echo
    echo "当前镜像列表:"
    container images list
    echo
    
    echo "可用操作:"
    echo "1. 删除exam-system镜像: container images delete exam-system"
    echo "2. 清理未使用镜像: container images prune"
    echo
    
    read -p "请选择操作 (1-2, 或按Enter跳过): " choice
    
    case $choice in
        1) 
            read -p "确认删除exam-system镜像? (y/N): " confirm
            if [[ $confirm =~ ^[Yy]$ ]]; then
                container images delete exam-system
            fi
            ;;
        2) 
            read -p "确认清理未使用镜像? (y/N): " confirm
            if [[ $confirm =~ ^[Yy]$ ]]; then
                container images prune
            fi
            ;;
        *) echo "已跳过" ;;
    esac
}

show_access_info() {
    # 获取容器IP
    if container list | grep -q "$CONTAINER_NAME"; then
        CONTAINER_IP=$(container list | grep "$CONTAINER_NAME" | awk '{print $6}')
        echo
        echo -e "${GREEN}🌐 访问信息:${NC}"
        echo "  📍 主页: http://$CONTAINER_IP:3000"
        echo "  👨‍💼 管理员: http://$CONTAINER_IP:3000/admin"
        echo
        echo -e "${BLUE}💡 提示: 如果配置了DNS域，也可以使用域名访问${NC}"
    fi
}

# 主程序
check_container_service

case "${1:-help}" in
    start)
        start_container
        ;;
    stop)
        stop_container
        ;;
    restart)
        restart_container
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    shell)
        enter_shell
        ;;
    cleanup)
        cleanup_containers
        ;;
    system)
        manage_system
        ;;
    images)
        manage_images
        ;;
    help|--help|-h)
        print_usage
        ;;
    *)
        echo -e "${RED}❌ 未知命令: $1${NC}"
        echo
        print_usage
        exit 1
        ;;
esac
