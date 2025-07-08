# 数据持久化功能实现记录

## 功能概述

为在线答题系统添加了数据持久化功能，使用JSON文件存储数据，确保服务器重启后数据不丢失。

## 实现内容

### 1. 数据库改造

**文件**: `/src/lib/database.ts`

**主要改进**:
- 将原有的`InMemoryDatabase`改为`PersistentDatabase`
- 自动加载和保存数据到JSON文件
- 数据文件位置: `/data/database.json`
- 每次数据操作后自动保存

**新增功能**:
- `loadData()`: 从文件加载数据
- `saveData()`: 保存数据到文件
- `backup()`: 创建数据备份
- `restore()`: 从备份恢复数据
- `clearAll()`: 清空所有数据
- `getSize()`: 获取数据库大小信息

### 2. 数据库管理API

**文件**: `/src/app/api/admin/database/route.ts`

**支持的操作**:
- `GET ?action=stats`: 获取数据库统计信息
- `GET ?action=size`: 获取数据库大小
- `GET ?action=backup`: 创建数据备份
- `POST {action: 'restore', backupFile}`: 恢复备份
- `POST {action: 'clear'}`: 清空所有数据

### 3. 数据库管理界面

**文件**: `/src/app/admin/database/page.tsx`

**功能包括**:
- 数据库统计信息展示
- 创建备份操作
- 清空数据操作
- 数据持久化说明

### 4. 管理端集成

**文件**: `/src/app/admin/page.tsx`

**添加内容**:
- 快速操作区域增加"数据库管理"选项
- 管理功能区域增加"数据库管理"功能介绍

## 技术特点

### 数据存储格式
```json
{
  "questions": [
    {
      "id": "string",
      "question": "string",
      "type": "single | multiple",
      "options": ["string"],
      "correctAnswer": "number | number[]",
      "explanation": "string",
      "category": "string",
      "difficulty": "string"
    }
  ],
  "sessions": [
    {
      "id": "string",
      "userId": "string",
      "userName": "string",
      "questions": ["Question"],
      "answers": ["number | number[]"],
      "score": "number",
      "totalQuestions": "number",
      "startTime": "Date",
      "endTime": "Date",
      "duration": "number",
      "status": "string"
    }
  ]
}
```

### 自动保存机制
- 添加题目时自动保存
- 创建考试会话时自动保存
- 更新考试记录时自动保存
- 删除数据时自动保存

### 备份机制
- 备份文件命名: `backup_[timestamp].json`
- 存储在同一目录下
- 支持手动恢复

### 错误处理
- 文件不存在时自动创建
- JSON解析错误时使用空数据
- 保存失败时记录错误日志
- 目录不存在时自动创建

## 安全考虑

### 文件权限
- 数据文件存储在项目根目录的`/data`文件夹
- 通过`.gitignore`防止数据文件被提交到版本控制

### 操作权限
- 只有管理员可以访问数据库管理功能
- 危险操作（清空数据）需要二次确认

### 数据完整性
- 每次操作后立即保存
- 提供备份和恢复功能
- 文件操作异常处理

## 使用说明

### 1. 自动功能
- 系统启动时自动加载数据
- 所有数据操作自动保存
- 无需手动干预

### 2. 管理功能
- 访问 `/admin/database` 进行数据库管理
- 定期创建备份
- 必要时清空数据重新开始

### 3. 数据迁移
- 导出现有数据作为备份
- 新环境中放置数据文件即可
- 支持跨环境数据迁移

## 性能考虑

### 优化措施
- 只在数据变更时保存文件
- 使用同步文件操作保证一致性
- 合理的错误处理避免数据丢失

### 限制说明
- 适用于中小规模题库（< 10000题）
- 适用于中等并发量（< 100用户同时考试）
- 大规模应用建议升级到专业数据库

## 部署注意事项

1. 确保应用对`/data`目录有读写权限
2. 定期备份数据文件
3. 监控磁盘空间使用
4. 考虑数据文件的定期归档

## 升级路径

未来可以考虑升级到：
- SQLite数据库（更好的并发性能）
- PostgreSQL/MySQL（生产环境）
- 云数据库服务（高可用性）

实现完成日期：2025年7月7日
