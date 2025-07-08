#!/bin/bash

# Docker 部署脚本

set -e

echo "🚀 开始部署在线答题系统..."

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

# 检查环境变量文件
if [ ! -f .env ]; then
    echo "⚠️  .env 文件不存在，从示例文件创建..."
    cp .env.example .env
    echo "请编辑 .env 文件设置生产环境的密码和密钥："
    echo "  ADMIN_PASSWORD=your-secure-password"
    echo "  JWT_SECRET=your-jwt-secret-key"
    read -p "是否现在编辑 .env 文件? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ${EDITOR:-nano} .env
    fi
fi

# 创建必要的目录
echo "📁 创建必要的目录..."
mkdir -p data
mkdir -p logs
mkdir -p nginx/ssl

# 构建和启动服务
echo "🔨 构建 Docker 镜像..."
docker-compose build

echo "🚀 启动服务..."
docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 健康检查
echo "🔍 检查服务状态..."
if curl -f http://localhost:3000/api/upload > /dev/null 2>&1; then
    echo "✅ 应用启动成功！"
    echo "🌐 访问地址: http://localhost"
    echo "👨‍💼 管理端: http://localhost/admin"
else
    echo "❌ 应用启动失败，请检查日志："
    docker-compose logs
    exit 1
fi

echo "📋 常用命令："
echo "  查看日志: docker-compose logs -f"
echo "  停止服务: docker-compose down"
echo "  重启服务: docker-compose restart"
echo "  查看状态: docker-compose ps"

echo "🎉 部署完成！"
