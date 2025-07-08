# 在线答题系统

这是一个功能完整的在线答题系统，支持从Excel文件导入题目，随机抽取指定数量的题目进行在线答题，并提供详细的测评结果导出功能。系统已完成生产环境部署准备，支持多种部署方式。

## 🚀 功能特性

### 核心功能
- **Excel题目导入**: 支持 .xlsx 和 .xls 格式的Excel文件导入
- **智能抽题**: 支持按分类、难度等条件随机抽取题目
- **在线答题**: 支持考试计时、自动提交和答题进度保存
- **结果分析**: 提供详细的答题结果分析和分类统计
- **PDF导出**: 支持导出个人成绩报告和汇总分析报告
- **管理员面板**: 完整的后台管理功能，包含数据分析和系统管理

### 技术特性
- **响应式设计**: 完美适配桌面端和移动端
- **考试超时保护**: 前后端双重超时自动提交机制
- **数据持久化**: SQLite数据库存储，支持数据备份和迁移
- **分类筛选**: 支持按分类和难度筛选题目
- **实时监控**: 考试进度实时跟踪和状态管理
- **生产就绪**: 完整的部署文档和容器化支持

## 🛠️ 技术栈

- **前端**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **后端**: Node.js API Routes, JWT身份验证
- **数据库**: SQLite + Better-SQLite3 (生产就绪)
- **数据处理**: ExcelJS (Excel处理), jsPDF (PDF生成)
- **部署**: Docker, PM2, Nginx (支持多种部署方式)
- **开发工具**: ESLint, TypeScript 严格模式, Turbopack

## 📦 安装和运行

### 环境要求
- Node.js 18+ 
- npm 或 yarn

### 安装步骤

1. 克隆项目
```bash
git clone <repository-url>
cd online-exam-system
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务器
```bash
npm run dev
```

4. 在浏览器中打开 [http://localhost:3000](http://localhost:3000)

### 管理员访问
- 首次访问系统需要设置管理员密码
- 访问 `/admin` 进入管理员面板
- 默认开发环境密码: `admin123` (生产环境必须修改)

## 📖 使用指南

### 1. 管理员面板
- 访问 `/admin` 进入管理员后台
- 查看系统统计和考试数据分析
- 管理题库和考试记录
- 导出汇总报告和数据备份

### 2. 题目管理
- 访问 `/upload` 页面
- 点击"下载样例Excel文件"获取格式模板
- 按照模板格式准备题目文件
- 上传Excel文件导入题目

### 3. 考试配置
- 访问 `/exam` 页面
- 填写考生姓名
- 设置题目数量、分类、难度等参数
- 可选设置时间限制 (支持自动超时提交)
- 点击"开始考试"

### 4. 在线答题
- 在答题页面选择答案
- 使用导航栏快速跳转题目
- 实时查看答题进度和剩余时间
- 完成后提交答案或自动超时提交

### 5. 查看结果
- 提交后自动跳转到结果页面
- 查看成绩和详细分析
- 导出个人PDF报告
- 在 `/results` 页面管理所有考试记录

## 📋 Excel格式要求

Excel文件应包含以下列：

| 列名     | 说明               | 必填 |
| -------- | ------------------ | ---- |
| 题目     | 题目内容           | ✅    |
| A        | 选项A内容          | ✅    |
| B        | 选项B内容          | ✅    |
| C        | 选项C内容          | ❌    |
| D        | 选项D内容          | ❌    |
| 正确答案 | A、B、C、D中的一个 | ✅    |
| 解析     | 题目解析说明       | ❌    |
| 分类     | 题目分类           | ❌    |
| 难度     | 简单、中等、困难   | ❌    |

### 示例数据
```
题目: 以下哪个是JavaScript的基本数据类型？
A: string
B: array  
C: object
D: function
正确答案: A
解析: string是JavaScript的基本数据类型之一
分类: JavaScript基础
难度: 简单
```

## 🏗️ 项目结构

```
src/
├── app/                    # Next.js App Router页面
│   ├── api/               # API路由
│   │   ├── admin/         # 管理员API (认证、数据分析)
│   │   ├── upload/        # 文件上传API
│   │   ├── exam/          # 考试管理API (支持超时)
│   │   ├── exam-optimized/ # 优化版考试API
│   │   ├── export/        # 结果导出API
│   │   ├── results/       # 考试记录API
│   │   └── sample-excel/  # 样例文件下载API
│   ├── admin/             # 管理员面板页面
│   │   ├── analytics/     # 数据分析
│   │   ├── database/      # 数据库管理
│   │   └── export/        # 导出管理
│   ├── exam/              # 考试相关页面
│   ├── results/           # 结果查看页面
│   ├── student/           # 学生端页面
│   ├── upload/            # 文件上传页面
│   └── page.tsx           # 首页
├── lib/                   # 工具库
│   ├── database.ts        # SQLite数据库操作
│   ├── database-optimized.ts # 优化版数据库
│   ├── excel-processor.ts # Excel处理
│   ├── pdf-exporter.ts    # PDF导出
│   └── csv-exporter.ts    # CSV导出
├── components/            # 共享组件
├── hooks/                # 自定义Hook
└── types/                # TypeScript类型定义
    └── index.ts
```

## 🔧 API文档

### 管理员API
- `POST /api/admin/auth` - 管理员登录认证
- `GET /api/admin/analytics` - 获取系统分析数据
- `GET /api/admin/database` - 数据库管理操作

### 文件上传
- `POST /api/upload` - 上传Excel文件
- `GET /api/upload` - 获取系统统计信息

### 考试管理  
- `POST /api/exam` - 创建考试会话 (支持超时设置)
- `GET /api/exam` - 获取考试会话信息
- `POST /api/exam/submit` - 提交考试答案 (支持超时自动提交)

### 考试记录
- `GET /api/results` - 获取考试记录列表
- `GET /api/student/results` - 学生端结果查看

### 结果导出
- `GET /api/export` - 导出单个考试结果PDF
- `POST /api/export` - 导出汇总报告PDF

### 工具
- `GET /api/sample-excel` - 下载Excel模板文件

## 🚦 开发脚本

```bash
# 开发模式 (使用Turbopack加速)
npm run dev

# 构建项目
npm run build

# 启动生产服务器  
npm start

# 代码检查
npm run lint
```

## 🚀 生产部署

### 快速部署 (推荐)

1. **使用提供的一键部署脚本**
```bash
chmod +x scripts/deploy-docker.sh
./scripts/deploy-docker.sh
```

2. **或者使用Docker Compose**
```bash
docker-compose up -d
```

### 支持的部署方式

1. **Vercel部署** (零配置，推荐用于演示)
2. **Docker容器化部署** (生产环境推荐)
3. **传统VPS部署** (使用PM2进程管理)
4. **云服务器部署** (阿里云、腾讯云等)

详细部署文档请参考：
- 📖 [生产环境部署指南](docs/PRODUCTION_DEPLOYMENT.md)
- ⚡ [快速部署指南](docs/QUICK_DEPLOY.md)

### 环境变量配置

生产环境需要配置以下环境变量：
```bash
# 管理员密码 (必须修改)
ADMIN_PASSWORD=your-secure-password

# JWT密钥 (必须使用强密钥)
JWT_SECRET=your-jwt-secret-key

# 生产环境标识
NODE_ENV=production
```

## 🎯 系统特色

### 🔒 安全特性
- JWT身份验证和会话管理
- 管理员权限控制
- API安全防护
- 敏感数据加密存储

### ⚡ 性能优化
- SQLite数据库高效查询
- Next.js 15最新特性支持
- Turbopack开发环境加速
- 响应式设计适配各种设备

### 📊 数据分析
- 详细的考试数据统计
- 分类和难度分析图表
- 成绩分布和趋势分析
- 批量数据导出功能

### 🛡️ 稳定性保障
- 考试超时自动保护
- 数据备份和恢复机制
- 错误监控和日志记录
- 生产环境部署验证

## 🎯 未来规划

- [ ] SQLite数据库持久化存储 
- [ ] ✅ 管理员认证和权限管理 (已完成)
- [ ] ✅ 考试超时自动提交功能 (已完成)
- [ ] ✅ 生产环境部署支持 (已完成)
- [ ] 更多题目类型支持（多选、判断、填空）
- [ ] 考试模板和预设配置
- [ ] 实时考试监控面板
- [ ] 批量用户管理和分组
- [ ] 移动端APP支持
- [ ] 考试防作弊机制

## 📄 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进项目！

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- 提交 GitHub Issue
- 查看项目文档：`docs/` 目录
- 参考部署指南：`docs/PRODUCTION_DEPLOYMENT.md`

## 📚 更多文档

- [完整功能列表](docs/COMPLETED_FEATURES.md)
- [生产部署指南](docs/PRODUCTION_DEPLOYMENT.md)
- [快速部署指南](docs/QUICK_DEPLOY.md)
- [数据持久化实现](docs/DATA_PERSISTENCE_IMPLEMENTATION.md)
- [考试超时功能](docs/EXAM_TIMEOUT_FEATURE.md)

---

⭐ 如果这个项目对您有帮助，请给个 Star 支持一下！

## 🏆 项目状态

- ✅ **开发完成** - 所有核心功能已实现
- ✅ **生产就绪** - 已通过生产环境构建测试
- ✅ **部署文档** - 提供完整的部署指南
- ✅ **持续优化** - 持续改进和功能增强
