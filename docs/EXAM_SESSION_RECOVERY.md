# 考试会话恢复功能

## 功能概述

在考试开始前检查是否有未完成的考试会话，允许考生恢复之前的考试状态，确保考试的连续性。

## 核心特性

### 1. 会话检测
- 在考试配置页面加载时自动检查未完成的会话
- 检查localStorage中以`exam_state_`开头的数据
- 过滤掉超过2小时的过期会话

### 2. 用户选择
- 如果发现未完成会话，显示恢复选项界面
- 提供"继续考试"和"开始新考试"两个选项
- 显示上次保存的时间信息

### 3. 会话验证
- 点击"继续考试"时验证服务器端会话是否仍然有效
- 如果会话已过期，清理本地数据并提示重新开始

### 4. 状态管理
- 选择"开始新考试"时清理旧的本地状态
- 确保不会产生数据冲突

## 实现方案

### 页面流程
1. 用户访问 `/exam` 页面
2. 页面加载时检查未完成会话
3. 如果有未完成会话：
   - 显示恢复提示界面
   - 隐藏考试配置表单
   - 等待用户选择
4. 如果选择继续考试：
   - 验证会话有效性
   - 跳转到考试页面
5. 如果选择新建考试或没有未完成会话：
   - 显示考试配置表单
   - 正常创建新考试

### 数据结构
```typescript
interface SavedExamState {
  sessionId: string;
  answers: (number | number[])[];
  currentQuestion: number;
  timeLeft: number | null;
  lastSaved: number;
}
```

### 关键函数
- `checkUnfinishedSession()`: 检查未完成会话
- `continueExam()`: 继续未完成的考试
- `startNewExam()`: 开始新考试
- `validateSession()`: 验证会话有效性

## 用户界面

### 恢复提示界面
- 琥珀色警告框设计
- 显示最后保存时间
- 两个操作按钮（继续/新建）
- 隐藏考试配置表单

### 状态指示
- 加载时显示"检查未完成的考试..."
- 验证会话时显示加载状态
- 错误时显示相应提示信息

## 技术实现

### localStorage检查
```typescript
const checkUnfinishedSession = () => {
  const examStates = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('exam_state_')) {
      const state = localStorage.getItem(key);
      // 解析和验证状态...
    }
  }
  // 选择最新的会话...
};
```

### 会话验证
```typescript
const continueExam = async () => {
  const response = await fetch(`/api/exam?sessionId=${sessionId}`);
  if (response.ok) {
    router.push(`/exam/${sessionId}`);
  } else {
    // 清理无效会话...
  }
};
```

## 注意事项

1. **数据清理**：定期清理过期的localStorage数据
2. **错误处理**：妥善处理JSON解析错误和网络错误
3. **用户体验**：提供清晰的操作提示和状态反馈
4. **安全性**：验证会话有效性，防止恶意操作

## 测试场景

1. 正常完成考试后再次访问考试页面
2. 考试中途离开后重新访问
3. 考试超时后尝试恢复
4. localStorage被清理后的行为
5. 网络异常时的错误处理
