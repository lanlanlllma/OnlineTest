# 在线答题系统

这是一个功能完整的在线答题系统，支持从Excel文件导入题目，随机抽取指定数量的题目进行在线答题，并提供详细的测评结果导出功能。

## 🚀 功能特性

### 核心功能
- **Excel题目导入**: 支持 .xlsx 和 .xls 格式的Excel文件导入
- **随机抽题**: 可指定数量随机抽取题目
- **在线答题**: 支持计时功能和答题进度保存
- **结果分析**: 提供详细的答题结果分析和分类统计
- **PDF导出**: 支持导出个人成绩报告和汇总报告

### 技术特性
- **响应式设计**: 适配桌面端和移动端
- **实时计时**: 支持考试时间限制
- **分类筛选**: 支持按分类和难度筛选题目
- **进度跟踪**: 实时显示答题进度
- **错误处理**: 完善的错误提示和处理机制

## 🛠️ 技术栈

- **前端**: Next.js 15, React, TypeScript, Tailwind CSS
- **后端**: Node.js API Routes
- **数据处理**: XLSX (Excel处理), jsPDF (PDF生成)
- **数据存储**: 内存数据库 (可扩展为真实数据库)

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

## 📖 使用指南

### 1. 题目管理
- 访问 `/upload` 页面
- 点击"下载样例Excel文件"获取格式模板
- 按照模板格式准备题目文件
- 上传Excel文件导入题目

### 2. 考试配置
- 访问 `/exam` 页面
- 填写考生姓名
- 设置题目数量、分类、难度等参数
- 可选设置时间限制
- 点击"开始考试"

### 3. 在线答题
- 在答题页面选择答案
- 使用导航栏快速跳转题目
- 实时查看答题进度
- 完成后提交答案

### 4. 查看结果
- 提交后自动跳转到结果页面
- 查看成绩和详细分析
- 导出PDF报告
- 在 `/results` 页面管理所有考试记录

## 📋 Excel格式要求

Excel文件应包含以下列：

| 列名 | 说明 | 必填 |
|------|------|------|
| 题目 | 题目内容 | ✅ |
| A | 选项A内容 | ✅ |
| B | 选项B内容 | ✅ |
| C | 选项C内容 | ❌ |
| D | 选项D内容 | ❌ |
| 正确答案 | A、B、C、D中的一个 | ✅ |
| 解析 | 题目解析说明 | ❌ |
| 分类 | 题目分类 | ❌ |
| 难度 | 简单、中等、困难 | ❌ |

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
│   │   ├── upload/        # 文件上传API
│   │   ├── exam/          # 考试管理API
│   │   ├── export/        # 结果导出API
│   │   └── sample-excel/  # 样例文件下载API
│   ├── exam/              # 考试相关页面
│   ├── results/           # 结果查看页面
│   ├── upload/            # 文件上传页面
│   └── page.tsx           # 首页
├── lib/                   # 工具库
│   ├── database.ts        # 数据库操作
│   ├── excel-processor.ts # Excel处理
│   └── pdf-exporter.ts    # PDF导出
└── types/                 # TypeScript类型定义
    └── index.ts
```

## 🔧 API文档

### 文件上传
- `POST /api/upload` - 上传Excel文件
- `GET /api/upload` - 获取系统统计信息

### 考试管理  
- `POST /api/exam` - 创建考试会话
- `GET /api/exam` - 获取考试会话信息
- `POST /api/exam/submit` - 提交考试答案

### 结果导出
- `GET /api/export` - 导出单个考试结果PDF
- `POST /api/export` - 导出汇总报告PDF

### 工具
- `GET /api/sample-excel` - 下载Excel模板文件

## 🚦 开发脚本

```bash
# 开发模式
npm run dev

# 构建项目
npm run build

# 启动生产服务器  
npm start

# 代码检查
npm run lint
```

## 🎯 未来规划

- [ ] 数据库持久化存储
- [ ] 用户认证和权限管理
- [ ] 更多题目类型支持（多选、判断、填空）
- [ ] 考试时间和截止时间设置
- [ ] 成绩统计和分析图表
- [ ] 批量导入用户和分组管理
- [ ] 移动端APP支持

## 📄 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进项目！

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- 提交 GitHub Issue
- 发送邮件到 [your-email@example.com]

---

⭐ 如果这个项目对您有帮助，请给个 Star 支持一下！
