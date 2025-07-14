#!/usr/bin/env node

/**
 * 数据库迁移脚本
 * 将原有的简易数据库迁移到优化的UUID数据库
 */

import { database } from './database';
import { optimizedDatabase } from './database-optimized';
import fs from 'fs';
import path from 'path';

console.log('🚀 开始数据库迁移...');

try {
  // 1. 获取原数据库的所有数据
  console.log('📖 读取原数据库数据...');
  const oldQuestions = database.getAllQuestions();
  const oldSessions = database.getAllSessions();
  
  console.log(`📊 找到 ${oldQuestions.length} 道题目，${oldSessions.length} 个考试会话`);

  // 2. 迁移题目数据到优化数据库
  console.log('📝 迁移题目数据...');
  optimizedDatabase.addQuestions(oldQuestions);

  // 3. 迁移会话数据到优化数据库
  console.log('🎯 迁移会话数据...');
  const migratedSessions = oldSessions.map(session => {
    // 获取会话中的题目ID映射
    const sessionAny = session as any;
    const questionIds = session.questionIds || sessionAny.questions?.map((q: any) => q.id) || [];
    
    return {
      id: session.id,
      userId: session.userId,
      userName: session.userName,
      questionIds,
      answers: session.answers,
      score: session.score,
      totalQuestions: session.totalQuestions,
      startTime: session.startTime instanceof Date ? session.startTime : new Date(session.startTime),
      endTime: session.endTime ? 
        (session.endTime instanceof Date ? session.endTime : new Date(session.endTime)) : 
        undefined,
      duration: session.duration,
      durationInSeconds: session.durationInSeconds,
      status: session.status,
      config: session.config
    };
  });

  optimizedDatabase.importSessions(migratedSessions);

  // 4. 备份原数据库文件
  console.log('💾 备份原数据库...');
  const dataDir = path.join(process.cwd(), 'data');
  const originalFile = path.join(dataDir, 'database.json');
  const backupFile = path.join(dataDir, `database_backup_${Date.now()}.json`);
  
  if (fs.existsSync(originalFile)) {
    fs.copyFileSync(originalFile, backupFile);
    console.log(`✅ 原数据库已备份到: ${backupFile}`);
  }

  // 5. 验证迁移结果
  const newStats = optimizedDatabase.getStats();
  console.log('🔍 验证迁移结果:');
  console.log(`  - 题目数量: ${newStats.totalQuestions}`);
  console.log(`  - 会话数量: ${newStats.totalSessions}`);
  console.log(`  - 分类数量: ${newStats.categories.length}`);
  console.log(`  - 难度级别: ${newStats.difficulties.length}`);

  // 6. 获取存储优化信息
  const sizeInfo = optimizedDatabase.getSize();
  console.log('📈 存储优化信息:');
  console.log(`  - 数据库文件大小: ${sizeInfo.fileSize}`);
  console.log(`  - 预估节省空间: ${sizeInfo.spaceSaved}`);

  console.log('✨ 数据库迁移完成！');
  console.log('');
  console.log('⚠️  下一步操作:');
  console.log('1. 更新所有API文件以使用优化数据库');
  console.log('2. 删除旧的数据库文件（如果确认迁移成功）');
  console.log('3. 重启应用程序');

} catch (error) {
  console.error('❌ 数据库迁移失败:', error);
  process.exit(1);
}
