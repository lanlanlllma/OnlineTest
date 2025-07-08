#!/bin/bash

# =============================================================================
# 在线答题系统 - Apple Container (ARM64) 部署脚本
# 适用于: Apple Silicon Mac (M1/M2/M3) + Docker Desktop
# =============================================================================

set -e  # 遇到错误立即退出

# 颜色输出定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 检查系统架构
check_architecture() {
    print_step "检查系统架构..."
    ARCH=$(uname -m)
    if [[ "$ARCH" != "arm64" ]]; then
        print_warning "当前系统架构: $ARCH (推荐在Apple Silicon Mac上运行此脚本)"
    else
        print_message "系统架构: $ARCH (Apple Silicon) ✅"
    fi
}

# 检查Docker是否安装并运行
check_docker() {
    print_step "检查Docker环境..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker未安装，请先安装Docker Desktop for Mac"
        echo "下载地址: https://www.docker.com/products/docker-desktop/"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker未运行，请启动Docker Desktop"
        exit 1
    fi
    
    # 检查Docker是否支持ARM64
    DOCKER_ARCH=$(docker version --format '{{.Server.Arch}}')
    print_message "Docker架构: $DOCKER_ARCH"
    
    # 检查Docker Buildx支持
    if docker buildx version &> /dev/null; then
        print_message "Docker Buildx支持: ✅"
    else
        print_warning "Docker Buildx不可用，将使用标准docker build"
    fi
}

# 环境变量配置
setup_environment() {
    print_step "配置环境变量..."
    
    # 创建.env文件如果不存在
    if [[ ! -f .env ]]; then
        if [[ -f .env.example ]]; then
            cp .env.example .env
            print_message "已从.env.example创建.env文件"
        else
            cat > .env << EOF
# 生产环境配置
NODE_ENV=production

# 管理员密码 (请修改为强密码)
ADMIN_PASSWORD=admin123456

# JWT密钥 (请修改为随机字符串)
JWT_SECRET=exam-system-secret-key-2025

# 端口配置
PORT=3000
EOF
            print_message "已创建默认.env文件"
        fi
    fi
    
    # 检查关键环境变量
    source .env
    
    if [[ "$ADMIN_PASSWORD" == "admin123456" ]]; then
        print_warning "检测到默认管理员密码，建议修改为强密码"
        read -p "是否现在修改管理员密码? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            read -s -p "请输入新的管理员密码: " NEW_PASSWORD
            echo
            sed -i '' "s/ADMIN_PASSWORD=.*/ADMIN_PASSWORD=$NEW_PASSWORD/" .env
            print_message "管理员密码已更新"
        fi
    fi
}

# 创建Apple Silicon优化的Dockerfile
create_optimized_dockerfile() {
    print_step "创建Apple Silicon优化的Dockerfile..."
    
    cat > Dockerfile.apple << 'EOF'
# Apple Silicon (ARM64) 优化的Dockerfile
FROM --platform=linux/arm64 node:18-alpine AS base

# 添加必要的包，针对ARM64优化
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# 安装依赖 - 针对ARM64优化
COPY package.json package-lock.json* ./
RUN npm ci --only=production --platform=linux --arch=arm64

# 构建阶段 - 启用多平台支持
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 禁用遥测并优化构建
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_SHARP=0

# 构建应用
RUN npm run build

# 生产运行时 - ARM64优化
FROM --platform=linux/arm64 node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 添加非root用户
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 复制构建产物
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 创建数据目录
RUN mkdir -p ./data && chown nextjs:nodejs ./data

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/upload || exit 1

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
EOF
    
    print_message "已创建Apple Silicon优化的Dockerfile"
}

# 创建Apple Container专用的Docker Compose配置
create_docker_compose() {
    print_step "创建Apple Container专用的Docker Compose配置..."
    
    cat > docker-compose.apple.yml << 'EOF'
version: '3.8'

services:
  exam-system:
    build: 
      context: .
      dockerfile: Dockerfile.apple
      platforms:
        - linux/arm64
    image: exam-system:apple-latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - ADMIN_PASSWORD=${ADMIN_PASSWORD:-admin123456}
      - JWT_SECRET=${JWT_SECRET:-exam-system-secret-key-2025}
      - PLATFORM=apple-silicon
    volumes:
      - ./data:/app/data
      - exam_system_data:/app/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/api/upload"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
    networks:
      - exam-network

  # Nginx反向代理 (可选)
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - exam-system
    restart: unless-stopped
    networks:
      - exam-network
    profiles:
      - with-nginx

volumes:
  exam_system_data:
    driver: local

networks:
  exam-network:
    driver: bridge
EOF
    
    print_message "已创建Apple Container专用的Docker Compose配置"
}

# 构建和部署
build_and_deploy() {
    print_step "开始构建和部署..."
    
    # 清理旧的容器和镜像
    print_message "清理旧的容器..."
    docker-compose -f docker-compose.apple.yml down --remove-orphans || true
    
    # 使用buildx构建多平台镜像（如果可用）
    if docker buildx version &> /dev/null; then
        print_message "使用Docker Buildx构建ARM64镜像..."
        docker buildx build \
            --platform linux/arm64 \
            --file Dockerfile.apple \
            --tag exam-system:apple-latest \
            --load \
            .
    else
        print_message "使用标准Docker构建..."
        docker build -f Dockerfile.apple -t exam-system:apple-latest .
    fi
    
    # 启动服务
    print_message "启动服务..."
    docker-compose -f docker-compose.apple.yml up -d
    
    # 等待服务启动
    print_message "等待服务启动..."
    sleep 10
    
    # 检查服务状态
    if docker-compose -f docker-compose.apple.yml ps | grep -q "Up"; then
        print_message "✅ 服务启动成功!"
    else
        print_error "❌ 服务启动失败，请检查日志"
        docker-compose -f docker-compose.apple.yml logs
        exit 1
    fi
}

# 显示部署信息
show_deployment_info() {
    print_step "部署信息"
    
    echo
    echo "🎉 在线答题系统已成功部署到Apple Container!"
    echo
    echo "📋 访问信息:"
    echo "   🌐 应用地址: http://localhost:3000"
    echo "   👨‍💼 管理员面板: http://localhost:3000/admin"
    echo "   📚 系统首页: http://localhost:3000"
    echo
    echo "🔧 管理命令:"
    echo "   查看日志: docker-compose -f docker-compose.apple.yml logs -f"
    echo "   停止服务: docker-compose -f docker-compose.apple.yml down"
    echo "   重启服务: docker-compose -f docker-compose.apple.yml restart"
    echo "   查看状态: docker-compose -f docker-compose.apple.yml ps"
    echo
    echo "📁 数据目录: ./data (持久化存储)"
    echo "🔐 环境配置: .env"
    echo
    echo "🍎 Apple Silicon优化:"
    echo "   ✅ ARM64原生支持"
    echo "   ✅ 内存优化配置"
    echo "   ✅ 健康检查启用"
    echo
}

# 健康检查
health_check() {
    print_step "执行健康检查..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:3000/api/upload >/dev/null 2>&1; then
            print_message "✅ 应用健康检查通过"
            return 0
        fi
        
        print_message "等待应用启动... ($attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    done
    
    print_warning "⚠️  健康检查超时，请手动检查应用状态"
    return 1
}

# 主函数
main() {
    echo "🍎 在线答题系统 - Apple Container 部署脚本"
    echo "=================================================="
    
    check_architecture
    check_docker
    setup_environment
    create_optimized_dockerfile
    create_docker_compose
    build_and_deploy
    health_check
    show_deployment_info
    
    echo
    print_message "🎯 部署完成! 享受您的在线答题系统吧!"
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
