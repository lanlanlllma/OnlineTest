import { database } from './database';
import { optimizedDatabase } from './database-optimized';

// 数据迁移脚本
export async function migrateDatabase() {
  console.log('开始数据库迁移...');
  
  try {
    // 获取旧数据库的所有数据
    const oldQuestions = database.getAllQuestions();
    const oldSessions = database.getAllSessions();
    
    console.log(`准备迁移: ${oldQuestions.length} 题目, ${oldSessions.length} 会话`);
    
    // 迁移题目数据
    if (oldQuestions.length > 0) {
      optimizedDatabase.addQuestions(oldQuestions);
      console.log('题目数据迁移完成');
    }
    
    // 迁移会话数据
    if (oldSessions.length > 0) {
      const convertedSessions = oldSessions.map((oldSession: any) => {
        const questionIds = oldSession.questions.map((q: any) => q.id);
        
        return {
          id: oldSession.id,
          userId: oldSession.userId,
          userName: oldSession.userName,
          questionIds,
          answers: oldSession.answers,
          score: oldSession.score,
          totalQuestions: oldSession.totalQuestions,
          startTime: oldSession.startTime instanceof Date ? oldSession.startTime : new Date(oldSession.startTime),
          endTime: oldSession.endTime ? 
            (oldSession.endTime instanceof Date ? oldSession.endTime : new Date(oldSession.endTime)) : 
            undefined,
          duration: oldSession.duration,
          status: oldSession.status
        };
      });
      
      // 批量导入会话数据
      optimizedDatabase.importSessions(convertedSessions);
      console.log('会话数据迁移完成');
    }
    
    // 获取迁移后的统计信息
    const stats = optimizedDatabase.getStats();
    const sizeInfo = optimizedDatabase.getSize();
    
    console.log('迁移完成统计:');
    console.log(`- 题目数量: ${stats.totalQuestions}`);
    console.log(`- 会话数量: ${stats.totalSessions}`);
    console.log(`- 完成会话: ${stats.completedSessions}`);
    console.log(`- 文件大小: ${sizeInfo.fileSize}`);
    console.log(`- 节省空间: ${sizeInfo.spaceSaved}`);
    
    return {
      success: true,
      message: '数据库迁移成功',
      stats: {
        ...stats,
        ...sizeInfo
      }
    };
    
  } catch (error) {
    console.error('数据库迁移失败:', error);
    return {
      success: false,
      message: '数据库迁移失败',
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
}

// 比较两个数据库的存储效率
export function compareStorageEfficiency() {
  const oldStats = database.getStats();
  const newStats = optimizedDatabase.getStats();
  const newSizeInfo = optimizedDatabase.getSize();
  
  return {
    old: {
      totalQuestions: oldStats.totalQuestions,
      totalSessions: oldStats.totalSessions,
      completedSessions: oldStats.completedSessions
    },
    new: {
      totalQuestions: newStats.totalQuestions,
      totalSessions: newStats.totalSessions,
      completedSessions: newStats.completedSessions,
      fileSize: newSizeInfo.fileSize,
      spaceSaved: newSizeInfo.spaceSaved
    }
  };
}
