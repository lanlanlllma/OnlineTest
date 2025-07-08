#!/bin/bash

# VPS 部署脚本

set -e

echo "🚀 开始在 VPS 上部署在线答题系统..."

# 更新系统
echo "📦 更新系统软件包..."
sudo apt update && sudo apt upgrade -y

# 安装 Node.js
if ! command -v node &> /dev/null; then
    echo "📦 安装 Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# 安装 PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 安装 PM2..."
    sudo npm install -g pm2
fi

# 安装 Nginx
if ! command -v nginx &> /dev/null; then
    echo "📦 安装 Nginx..."
    sudo apt install nginx -y
fi

# 创建应用目录
APP_DIR="/var/www/exam-system"
echo "📁 创建应用目录: $APP_DIR"
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# 如果是 Git 部署
if [ -d ".git" ]; then
    echo "📦 部署代码到生产目录..."
    rsync -av --exclude='node_modules' --exclude='.git' --exclude='.next' . $APP_DIR/
else
    echo "⚠️  请手动将代码复制到 $APP_DIR"
fi

cd $APP_DIR

# 安装依赖
echo "📦 安装依赖..."
npm install

# 构建项目
echo "🔨 构建项目..."
npm run build

# 创建必要的目录
mkdir -p logs data

# 创建环境变量文件
if [ ! -f .env.local ]; then
    echo "⚙️  创建环境变量文件..."
    cat > .env.local << EOF
NODE_ENV=production
ADMIN_PASSWORD=your-secure-production-password
JWT_SECRET=your-very-long-and-random-secret-key-at-least-32-characters
EOF
    echo "请编辑 $APP_DIR/.env.local 文件设置生产环境的密码和密钥"
fi

# 更新 PM2 配置文件中的路径
sed -i "s|/path/to/your/exam-system|$APP_DIR|g" ecosystem.config.js

# 启动应用
echo "🚀 启动应用..."
pm2 start ecosystem.config.js --env production

# 设置 PM2 开机自启
echo "⚙️  设置开机自启..."
pm2 startup
pm2 save

# 配置 Nginx
echo "⚙️  配置 Nginx..."
sudo tee /etc/nginx/sites-available/exam-system > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
    }
}
EOF

# 启用站点
sudo ln -sf /etc/nginx/sites-available/exam-system /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 测试 Nginx 配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx

# 配置防火墙
echo "🔒 配置防火墙..."
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# 健康检查
echo "🔍 检查服务状态..."
sleep 5

if curl -f http://localhost/ > /dev/null 2>&1; then
    echo "✅ 部署成功！"
    echo "🌐 访问地址: http://$(curl -s ifconfig.me || echo 'your-server-ip')"
    echo "👨‍💼 管理端: http://$(curl -s ifconfig.me || echo 'your-server-ip')/admin"
else
    echo "❌ 部署失败，请检查日志："
    pm2 logs exam-system
    sudo nginx -t
fi

echo ""
echo "📋 常用命令："
echo "  查看应用日志: pm2 logs exam-system"
echo "  重启应用: pm2 restart exam-system"
echo "  查看应用状态: pm2 status"
echo "  查看 Nginx 日志: sudo tail -f /var/log/nginx/error.log"
echo "  重启 Nginx: sudo systemctl restart nginx"

echo ""
echo "🔧 下一步："
echo "1. 编辑 $APP_DIR/.env.local 设置安全的密码和密钥"
echo "2. 如果有域名，配置域名解析和 SSL 证书"
echo "3. 设置定期备份脚本"

echo "🎉 部署完成！"
