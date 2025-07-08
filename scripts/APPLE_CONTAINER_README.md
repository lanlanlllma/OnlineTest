# Apple Container 部署指南

这个目录包含了使用Apple原生Container技术部署在线答题系统的脚本。

## 🍎 Apple Container 简介

Apple Container是Apple为macOS开发的原生容器技术，提供了类似Docker的功能，但更好地集成了macOS系统。

## 📦 脚本说明

### 1. `quick-deploy-apple.sh` - 快速部署脚本
一键部署在线答题系统到Apple Container。

```bash
# 基本部署
./scripts/quick-deploy-apple.sh

# 自定义管理员密码
ADMIN_PASSWORD="your-secure-password" ./scripts/quick-deploy-apple.sh
```

### 2. `setup-apple-container-dns.sh` - DNS配置脚本
设置本地DNS域，方便通过域名访问容器应用。

```bash
# 设置默认域名 (exam)
./scripts/setup-apple-container-dns.sh

# 设置自定义域名
./scripts/setup-apple-container-dns.sh test
```

### 3. `manage-apple-container.sh` - 容器管理脚本
提供便捷的容器管理功能。

```bash
# 查看帮助
./scripts/manage-apple-container.sh help

# 启动容器
./scripts/manage-apple-container.sh start

# 查看状态
./scripts/manage-apple-container.sh status

# 查看日志
./scripts/manage-apple-container.sh logs

# 进入容器shell
./scripts/manage-apple-container.sh shell

# 停止容器
./scripts/manage-apple-container.sh stop
```

## 🚀 快速开始

1. **确保Apple Container已安装**
   ```bash
   container --version
   ```

2. **部署系统**
   ```bash
   ./scripts/quick-deploy-apple.sh
   ```

3. **设置DNS域（可选）**
   ```bash
   ./scripts/setup-apple-container-dns.sh
   ```

4. **访问系统**
   - 直接IP访问：查看部署脚本输出的IP地址
   - 域名访问（如果设置了DNS）：http://exam-system-app.exam:3000

## 📋 常用命令

### 容器管理
```bash
# 查看所有容器
container list --all

# 查看容器日志
container logs exam-system-app

# 进入容器
container exec -ti exam-system-app sh

# 停止容器
container stop exam-system-app
```

### 镜像管理
```bash
# 查看镜像
container images list

# 删除镜像
container images delete exam-system
```

### 系统管理
```bash
# 查看系统状态
container system status

# 启动/停止系统
container system start
container system stop
```

## 🔧 高级配置

### 环境变量
在运行部署脚本前设置环境变量：

```bash
export ADMIN_PASSWORD="your-secure-password"
export JWT_SECRET="your-jwt-secret-key"
./scripts/quick-deploy-apple.sh
```

### 数据持久化
Apple Container支持卷挂载，但需要手动配置：

```bash
container run \
    --name exam-system-app \
    --detach \
    --volume ~/exam-data:/app/data \
    exam-system
```

### 网络配置
Apple Container自动管理网络，但您可以：
- 使用DNS域名访问
- 配置端口映射
- 设置容器间通信

## 🔍 故障排除

### 1. Container命令未找到
确保您使用的是支持Apple Container的macOS版本，或从Apple开发者网站下载Container CLI工具。

### 2. 权限问题
某些操作需要管理员权限，特别是DNS配置：
```bash
sudo container system dns create test
```

### 3. 容器启动失败
检查日志：
```bash
container logs exam-system-app
```

### 4. 端口冲突
如果3000端口被占用，修改容器配置或停止冲突的服务。

## 📚 更多资源

- [Apple Container 官方文档]()
- [项目主要README](../README.md)
- [生产部署指南](../docs/PRODUCTION_DEPLOYMENT.md)

## 🔄 从Docker迁移

如果您之前使用Docker，Apple Container提供了类似的命令：

| Docker 命令 | Apple Container 命令 |
|------------|---------------------|
| `docker build` | `container build` |
| `docker run` | `container run` |
| `docker ps` | `container list` |
| `docker logs` | `container logs` |
| `docker exec` | `container exec` |
| `docker stop` | `container stop` |
| `docker images` | `container images list` |
