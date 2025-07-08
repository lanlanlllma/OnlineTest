# 快速部署指南

## 🚀 一键部署

### 选项1: Docker 部署 (推荐)

```bash
# 1. 克隆代码
git clone <your-repo-url>
cd exam-system

# 2. 运行部署脚本
./scripts/deploy-docker.sh
```

### 选项2: VPS 部署

```bash
# 1. 在服务器上克隆代码
git clone <your-repo-url>
cd exam-system

# 2. 运行部署脚本
./scripts/deploy-vps.sh
```

### 选项3: Vercel 部署

1. 将代码推送到 GitHub
2. 访问 [vercel.com](https://vercel.com)
3. 导入 GitHub 仓库
4. 设置环境变量：
   - `ADMIN_PASSWORD=your-secure-password`
   - `JWT_SECRET=your-jwt-secret-key`
5. 点击部署

## ⚙️ 环境变量

部署前必须设置以下环境变量：

```bash
ADMIN_PASSWORD=your-secure-production-password
JWT_SECRET=your-very-long-and-random-secret-key-at-least-32-characters
```

## 🔧 部署后配置

1. 访问 `/admin` 使用管理员密码登录
2. 在 `/upload` 上传题目Excel文件
3. 在 `/admin/exam-templates` 配置考试类型
4. 测试考试功能

## 📋 常用命令

### Docker 部署
```bash
# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 停止服务
docker-compose down
```

### VPS 部署
```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs exam-system

# 重启应用
pm2 restart exam-system

# 重启 Nginx
sudo systemctl restart nginx
```

## 🗃️ 备份数据

```bash
# 手动备份
./scripts/backup.sh

# 设置定时备份 (crontab)
0 2 * * * /path/to/exam-system/scripts/backup.sh
```

## 🔒 安全建议

1. **修改默认密码**：务必在生产环境中修改管理员密码
2. **使用 HTTPS**：配置 SSL 证书
3. **防火墙设置**：只开放必要端口
4. **定期更新**：保持系统和依赖包更新
5. **备份数据**：设置定期备份策略

## 📞 技术支持

如果遇到问题，请检查：
1. 服务器日志
2. 环境变量配置
3. 端口是否被占用
4. 防火墙设置

详细部署文档请查看 [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)
