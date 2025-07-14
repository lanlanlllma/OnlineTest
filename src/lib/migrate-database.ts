import { database as newDatabase } from './database';
import fs from 'fs';
import path from 'path';

export async function migrateToOptimizedDatabase() {
  console.log('🚀 开始迁移到UUID优化数据库...');

  try {
    // 1. 检查旧数据库文件是否存在
    const dataDir = path.join(process.cwd(), 'data');
    const oldDatabaseFile = path.join(dataDir, 'database.json');
    
    if (!fs.existsSync(oldDatabaseFile)) {
      console.log('⚠️  未找到旧数据库文件，跳过迁移');
      return;
    }

    // 2. 创建旧数据库的备份
    const backupFile = path.join(dataDir, `database_backup_${Date.now()}.json`);
    fs.copyFileSync(oldDatabaseFile, backupFile);
    console.log(`✅ 旧数据库已备份到: ${backupFile}`);

    // 3. 加载旧数据库数据
    const oldData = JSON.parse(fs.readFileSync(oldDatabaseFile, 'utf-8'));
    console.log(`📊 找到 ${oldData.questions?.length || 0} 道题目，${oldData.sessions?.length || 0} 个考试会话`);

    // 4. 清空新数据库并迁移数据
    newDatabase.clearAll();
    
    // 迁移题目
    if (oldData.questions && oldData.questions.length > 0) {
      console.log('📝 迁移题目数据...');
      newDatabase.addQuestions(oldData.questions);
    }

    // 迁移会话数据
    if (oldData.sessions && oldData.sessions.length > 0) {
      console.log('🎯 迁移会话数据...');
      const migratedSessions = oldData.sessions.map((session: any) => ({
        id: session.id,
        userId: session.userId,
        userName: session.userName,
        questionIds: session.questionIds || session.questions?.map((q: any) => q.id) || [],
        answers: session.answers,
        score: session.score,
        totalQuestions: session.totalQuestions,
        startTime: new Date(session.startTime),
        endTime: session.endTime ? new Date(session.endTime) : undefined,
        duration: session.duration,
        durationInSeconds: session.durationInSeconds,
        status: session.status,
        config: session.config
      }));

      newDatabase.importSessions(migratedSessions);
    }

    // 5. 验证迁移结果
    const newStats = newDatabase.getStats();
    console.log('🔍 迁移结果验证:');
    console.log(`  - 题目数量: ${newStats.totalQuestions}`);
    console.log(`  - 会话数量: ${newStats.totalSessions}`);
    console.log(`  - 分类数量: ${newStats.categories.length}`);
    console.log(`  - 难度级别: ${newStats.difficulties.length}`);

    // 6. 重命名旧数据库文件
    const oldFileRenamed = path.join(dataDir, 'database_old.json');
    if (fs.existsSync(oldDatabaseFile)) {
      fs.renameSync(oldDatabaseFile, oldFileRenamed);
      console.log(`📁 旧数据库文件已重命名为: database_old.json`);
    }

    console.log('✨ 数据库迁移完成！');
    console.log('');
    console.log('📈 系统现在使用UUID优化数据库，具有以下优势:');
    console.log('  - 使用UUID作为题目标识符');
    console.log('  - 优化的存储结构，减少数据重复');
    console.log('  - 更高效的查询性能');
    console.log('  - 支持更大规模的题库');

    return {
      success: true,
      oldStats: {
        questions: oldData.questions?.length || 0,
        sessions: oldData.sessions?.length || 0
      },
      newStats
    };

  } catch (error) {
    console.error('❌ 数据库迁移失败:', error);
    throw error;
  }
}

export default migrateToOptimizedDatabase;
