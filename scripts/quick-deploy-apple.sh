#!/bin/bash

# =============================================================================
# 在线答题系统 - Apple Container 快速部署脚本
# 使用 macOS 原生 Apple Container 技术
# =============================================================================

set -e

echo "🍎 Apple Container 快速部署"
echo "============================"

# 检查 Apple Container 命令
if ! command -v container &> /dev/null; then
    echo "❌ 未找到 Apple Container 命令"
    echo "请确保您使用的是支持 Apple Container 的 macOS 版本"
    echo "或者从 Apple 开发者网站下载 Container CLI 工具"
    exit 1
fi

echo "✅ 发现 Apple Container 运行时"

# 启动 container 系统服务
echo "🚀 启动 Apple Container 服务..."
container system start

echo "⏳ 等待服务启动..."
sleep 3

# 设置环境变量
export ADMIN_PASSWORD=${ADMIN_PASSWORD:-"admin123456"}
export JWT_SECRET=${JWT_SECRET:-"exam-system-jwt-secret-$(date +%s)"}
export NODE_ENV=production

echo "🔧 环境变量配置完成"

# 创建 Apple Container Dockerfile
cat > Dockerfile.apple << 'EOF'
FROM docker.io/node:18-alpine
WORKDIR /app
RUN apk add --no-cache curl
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
EOF

echo "📝 创建 Apple Container Dockerfile"

# 构建镜像
echo "🔨 构建容器镜像..."
container build --tag exam-system --file Dockerfile.apple .

echo "🚀 启动容器..."
container run \
    --name exam-system-app \
    --detach \
    --rm \
    exam-system

# 等待启动
echo "⏳ 等待服务启动..."
sleep 15

# 检查状态
if container list | grep -q exam-system-app; then
    # 获取容器IP地址
    CONTAINER_IP=$(container list | grep exam-system-app | awk '{print $6}')
    
    echo
    echo "🎉 部署成功!"
    echo "📍 访问地址: http://$CONTAINER_IP:3000"
    echo "👨‍💼 管理员: http://$CONTAINER_IP:3000/admin"
    echo "🔐 管理员密码: $ADMIN_PASSWORD"
    echo
    echo "📋 管理命令:"
    echo "  查看容器: container list"
    echo "  查看日志: container logs exam-system-app"
    echo "  进入容器: container exec --tty --interactive exam-system-app sh"
    echo "  停止服务: container stop exam-system-app"
    echo "  删除容器: container delete exam-system-app"
    echo "  停止系统: container system stop"
    echo
    echo "💡 提示: 如果配置了本地DNS域，可以通过 http://exam-system-app.test:3000 访问"
else
    echo "❌ 部署失败，请检查日志:"
    container logs exam-system-app
fi

echo
echo "🔧 其他有用命令:"
echo "  查看所有镜像: container images list"
echo "  查看系统状态: container system status"
echo "  配置本地DNS: sudo container system dns create test"
