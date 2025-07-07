<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# 在线答题系统

这是一个完整的在线答题系统，包含以下功能：

## 主要功能
- Excel文件题目导入
- 随机抽取指定数量题目
- 在线答题（支持计时）
- 测评结果查看和导出
- PDF格式结果报告生成

## 技术栈
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Node.js API Routes
- XLSX (Excel处理)
- jsPDF (PDF生成)
- 内存数据库

## 项目结构
- `/src/app` - 页面组件
- `/src/lib` - 工具库和数据库
- `/src/types` - TypeScript类型定义
- `/src/app/api` - API路由

## 开发注意事项
- 使用TypeScript严格模式
- 遵循Next.js最佳实践
- 响应式设计，适配移动端
- 错误处理要完善
- API返回格式要统一

## 主要页面
- `/` - 首页和统计概览
- `/upload` - Excel文件上传和题目管理
- `/exam` - 考试配置页面
- `/exam/[id]` - 在线答题页面
- `/results` - 考试记录管理
- `/results/[id]` - 具体考试结果详情

## API端点
- `POST /api/upload` - 上传Excel文件
- `GET /api/upload` - 获取系统统计
- `POST /api/exam` - 创建考试会话
- `GET /api/exam` - 获取考试会话
- `POST /api/exam/submit` - 提交答案
- `GET /api/export` - 导出结果PDF
- `POST /api/export` - 导出汇总PDF
- `GET /api/sample-excel` - 下载样例Excel

## Excel格式要求
- 题目：题目内容
- A、B、C、D：选项内容
- 正确答案：A、B、C、D中的一个
- 解析：题目解析（可选）
- 分类：题目分类（可选）
- 难度：简单、中等、困难（可选）
