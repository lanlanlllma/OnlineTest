import { optimizedDatabase } from './database-optimized';
import { mysqlDatabase } from './database-mysql';
import { initDatabase, checkDatabaseStatus } from './mysql-init';

// 从优化数据库迁移到MySQL
export async function migrateToMySQL() {
  console.log('开始从优化数据库迁移到MySQL...');
  
  try {
    // 检查MySQL数据库状态
    const status = await checkDatabaseStatus();
    if (!status.isReady) {
      console.log('MySQL数据库未准备好，正在初始化...');
      await initDatabase();
    }
    
    // 获取优化数据库的所有数据
    const questions = optimizedDatabase.getAllQuestions();
    const sessions = optimizedDatabase.getAllSessions();
    
    console.log(`准备迁移: ${questions.length} 题目, ${sessions.length} 会话`);
    
    // 迁移题目数据
    if (questions.length > 0) {
      await mysqlDatabase.addQuestions(questions);
      console.log('题目数据迁移完成');
    }
    
    // 迁移会话数据
    if (sessions.length > 0) {
      await mysqlDatabase.importSessions(sessions);
      console.log('会话数据迁移完成');
    }
    
    // 获取迁移后的统计信息
    const stats = await mysqlDatabase.getStats();
    
    console.log('迁移完成统计:');
    console.log(`- 题目数量: ${stats.totalQuestions}`);
    console.log(`- 会话数量: ${stats.totalSessions}`);
    console.log(`- 完成会话: ${stats.completedSessions}`);
    
    return {
      success: true,
      message: 'MySQL数据库迁移成功',
      stats
    };
    
  } catch (error) {
    console.error('MySQL数据库迁移失败:', error);
    return {
      success: false,
      message: 'MySQL数据库迁移失败',
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
}

// 从JSON文件迁移到MySQL
export async function migrateFromJSON() {
  console.log('开始从JSON文件迁移到MySQL...');
  
  try {
    // 检查MySQL数据库状态
    const status = await checkDatabaseStatus();
    if (!status.isReady) {
      console.log('MySQL数据库未准备好，正在初始化...');
      await initDatabase();
    }
    
    // 从优化数据库获取数据（它会自动从JSON加载）
    const questions = optimizedDatabase.getAllQuestions();
    const sessions = optimizedDatabase.getAllSessions();
    
    console.log(`准备迁移: ${questions.length} 题目, ${sessions.length} 会话`);
    
    // 迁移题目数据
    if (questions.length > 0) {
      await mysqlDatabase.addQuestions(questions);
      console.log('题目数据迁移完成');
    }
    
    // 迁移会话数据
    if (sessions.length > 0) {
      await mysqlDatabase.importSessions(sessions);
      console.log('会话数据迁移完成');
    }
    
    // 获取迁移后的统计信息
    const stats = await mysqlDatabase.getStats();
    
    console.log('迁移完成统计:');
    console.log(`- 题目数量: ${stats.totalQuestions}`);
    console.log(`- 会话数量: ${stats.totalSessions}`);
    console.log(`- 完成会话: ${stats.completedSessions}`);
    
    return {
      success: true,
      message: '从JSON到MySQL迁移成功',
      stats
    };
    
  } catch (error) {
    console.error('从JSON到MySQL迁移失败:', error);
    return {
      success: false,
      message: '从JSON到MySQL迁移失败',
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
}

// 比较不同数据库的存储效率
export async function compareStorageSystems() {
  try {
    const jsonStats = optimizedDatabase.getStats();
    const mysqlStats = await mysqlDatabase.getStats();
    
    return {
      json: {
        totalQuestions: jsonStats.totalQuestions,
        totalSessions: jsonStats.totalSessions,
        completedSessions: jsonStats.completedSessions,
        storageType: 'JSON文件'
      },
      mysql: {
        totalQuestions: mysqlStats.totalQuestions,
        totalSessions: mysqlStats.totalSessions,
        completedSessions: mysqlStats.completedSessions,
        storageType: 'MySQL数据库'
      }
    };
  } catch (error) {
    console.error('比较存储系统失败:', error);
    return {
      json: { totalQuestions: 0, totalSessions: 0, completedSessions: 0, storageType: 'JSON文件' },
      mysql: { totalQuestions: 0, totalSessions: 0, completedSessions: 0, storageType: 'MySQL数据库' }
    };
  }
}
