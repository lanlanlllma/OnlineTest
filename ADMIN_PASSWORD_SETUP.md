# 管理员密码配置说明

## 默认配置

管理员密码可以通过环境变量配置：

### 本地开发环境
在 `.env.local` 文件中设置：
```
ADMIN_PASSWORD=admin123
JWT_SECRET=your-secret-key-here-make-it-long-and-random
```

### 生产环境
在生产服务器上设置环境变量：
```bash
export ADMIN_PASSWORD=your-secure-password
export JWT_SECRET=your-very-long-and-random-secret-key
```

## 默认密码

如果没有设置环境变量，系统会使用默认密码：
- 默认密码：`admin123456`

## 使用方法

1. 访问管理端任何页面（如 `/admin`、`/results`、`/upload` 等）
2. 如果未登录，系统会自动跳转到登录页面
3. 输入管理员密码进行登录
4. 登录后可以访问所有管理功能
5. 点击"退出登录"按钮可以退出登录
6. Token 有效期为 24 小时，过期后需要重新登录

## 安全建议

1. 在生产环境中务必修改默认密码
2. 使用强密码（包含大小写字母、数字、特殊字符）
3. 定期更换密码
4. 确保 JWT_SECRET 足够长且复杂
5. 不要在代码中硬编码密码

## 已保护的页面

所有管理端页面都已受到密码保护：
- `/admin` - 管理端首页
- `/results` - 考试记录管理
- `/upload` - 题目上传管理
- `/admin/exam-templates` - 考试模板管理
- `/admin/analytics` - 统计分析
- 其他所有 `/admin/*` 页面

## 注意事项

- 登录状态通过 localStorage 存储，关闭浏览器不会丢失
- 如果 Token 过期，系统会自动返回登录页面
- 所有管理端页面都有统一的认证检查机制
