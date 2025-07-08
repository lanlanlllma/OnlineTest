# 在线答题系统 - 生产环境部署指南

## 概述

本文档介绍如何将在线答题系统部署到生产环境。系统基于 Next.js 15，支持多种部署方式。

## 部署前检查清单

### 1. 环境变量配置
确保生产环境中设置了以下环境变量：

```bash
# 管理员密码 (必须修改)
ADMIN_PASSWORD=your-secure-production-password

# JWT 密钥 (必须使用强密钥)
JWT_SECRET=your-very-long-and-random-secret-key-at-least-32-chars

# Next.js 环境
NODE_ENV=production
```

### 2. 安全检查
- [ ] 修改默认管理员密码
- [ ] 设置强JWT密钥
- [ ] 检查API路由安全性
- [ ] 确保敏感信息不在代码中硬编码

### 3. 性能优化
- [ ] 运行 `npm run build` 检查构建
- [ ] 确认无TypeScript错误
- [ ] 优化图片和静态资源

## 部署方式

### 方式一：Vercel 部署 (推荐)

Vercel 是 Next.js 的官方推荐部署平台，零配置部署。

#### 步骤：

1. **连接GitHub仓库**
   ```bash
   # 如果还没有，先将代码推送到GitHub
   git add .
   git commit -m "准备生产部署"
   git push origin main
   ```

2. **访问 Vercel**
   - 访问 [vercel.com](https://vercel.com)
   - 使用GitHub账号登录
   - 点击 "New Project"
   - 选择你的仓库

3. **配置环境变量**
   在Vercel项目设置中添加：
   ```
   ADMIN_PASSWORD=your-secure-password
   JWT_SECRET=your-jwt-secret-key-min-32-chars
   ```

4. **部署**
   - 点击 "Deploy"
   - 等待构建完成
   - 获得生产环境URL

#### 优点：
- 零配置
- 自动HTTPS
- 全球CDN
- 自动扩展
- 免费域名

### 方式二：Docker 部署

使用Docker容器化部署，适合自有服务器。

#### 1. 创建 Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### 2. 创建 docker-compose.yml

```yaml
# docker-compose.yml
version: '3.8'

services:
  exam-system:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
    volumes:
      - ./data:/app/data
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - exam-system
    restart: unless-stopped
```

#### 3. 配置 Nginx

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream app {
        server exam-system:3000;
    }

    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

#### 4. 部署命令

```bash
# 创建环境变量文件
echo "ADMIN_PASSWORD=your-secure-password" > .env
echo "JWT_SECRET=your-jwt-secret-key" >> .env

# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### 方式三：VPS/云服务器部署

在Ubuntu/CentOS等服务器上直接部署。

#### 1. 服务器准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装PM2 (进程管理)
sudo npm install -g pm2

# 安装Nginx
sudo apt install nginx -y
```

#### 2. 代码部署

```bash
# 克隆代码
git clone https://github.com/your-username/exam-system.git
cd exam-system

# 安装依赖
npm install

# 构建项目
npm run build

# 创建环境变量
sudo nano .env.local
```

#### 3. PM2 配置

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'exam-system',
    script: 'npm',
    args: 'start',
    cwd: '/path/to/your/app',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      ADMIN_PASSWORD: 'your-secure-password',
      JWT_SECRET: 'your-jwt-secret'
    }
  }]
};
```

#### 4. 启动服务

```bash
# 启动应用
pm2 start ecosystem.config.js --env production

# 设置开机自启
pm2 startup
pm2 save
```

#### 5. Nginx 配置

```nginx
# /etc/nginx/sites-available/exam-system
server {
    listen 80;
    server_name your-domain.com;

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
    }
}
```

```bash
# 启用站点
sudo ln -s /etc/nginx/sites-available/exam-system /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## SSL证书配置

### 使用 Let's Encrypt (免费)

```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx -y

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
# 添加：0 12 * * * /usr/bin/certbot renew --quiet
```

## 监控和维护

### 1. 日志管理

```bash
# PM2 日志
pm2 logs exam-system

# Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 2. 性能监控

```bash
# PM2 监控
pm2 monit

# 系统资源
htop
df -h
free -h
```

### 3. 备份策略

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/exam-system"

# 备份数据文件
mkdir -p $BACKUP_DIR
cp -r /path/to/your/app/data $BACKUP_DIR/data_$DATE

# 保留最近30天的备份
find $BACKUP_DIR -name "data_*" -mtime +30 -delete
```

## 常见问题解决

### 1. 端口被占用
```bash
sudo lsof -i :3000
sudo kill -9 PID
```

### 2. 权限问题
```bash
sudo chown -R $USER:$USER /path/to/your/app
```

### 3. 内存不足
```bash
# 创建swap文件
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

## 安全建议

1. **防火墙配置**
```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
```

2. **定期更新**
```bash
# 系统更新
sudo apt update && sudo apt upgrade

# 依赖更新
npm audit fix
```

3. **访问控制**
- 限制管理端访问IP
- 设置强密码策略
- 定期更换密钥

## 性能优化

1. **Next.js 优化**
```javascript
// next.config.ts
const nextConfig = {
  compress: true,
  output: 'standalone',
  experimental: {
    optimizeCss: true,
  },
  images: {
    unoptimized: true
  }
};
```

2. **Nginx 缓存**
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 总结

选择部署方式的建议：
- **个人/小型项目**：Vercel (简单快捷)
- **企业/自有服务器**：Docker + VPS
- **高并发/复杂需求**：Kubernetes + 云服务

记住在生产环境中：
- 务必修改默认密码
- 使用HTTPS
- 定期备份数据
- 监控系统性能
- 及时安全更新
