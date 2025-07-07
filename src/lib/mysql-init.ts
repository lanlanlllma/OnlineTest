import { pool, executeQuery, testConnection } from './mysql';

// 数据库表结构
const createTablesSQL = [
  // 题目表
  `CREATE TABLE IF NOT EXISTS questions (
    id VARCHAR(36) PRIMARY KEY,
    question TEXT NOT NULL,
    type ENUM('single', 'multiple') NOT NULL,
    options JSON NOT NULL,
    correct_answer JSON NOT NULL,
    explanation TEXT,
    category VARCHAR(255),
    difficulty ENUM('easy', 'medium', 'hard'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_difficulty (difficulty),
    INDEX idx_type (type)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // 考试会话表
  `CREATE TABLE IF NOT EXISTS exam_sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    question_ids JSON NOT NULL,
    answers JSON,
    score DECIMAL(5,2) DEFAULT 0,
    total_questions INT NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NULL,
    duration INT NULL,
    status ENUM('in-progress', 'completed', 'expired') DEFAULT 'in-progress',
    config JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_start_time (start_time)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // 统计元数据表
  `CREATE TABLE IF NOT EXISTS metadata (
    key_name VARCHAR(255) PRIMARY KEY,
    value JSON NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // 备份记录表
  `CREATE TABLE IF NOT EXISTS backup_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    backup_type ENUM('manual', 'auto') NOT NULL,
    file_path VARCHAR(500),
    file_size BIGINT,
    tables_count INT,
    records_count INT,
    status ENUM('success', 'failed') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_created_at (created_at),
    INDEX idx_status (status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
];

// 初始化数据库
export async function initDatabase() {
  console.log('开始初始化MySQL数据库...');
  
  try {
    // 测试连接
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('无法连接到MySQL数据库');
    }
    
    // 创建表
    for (const sql of createTablesSQL) {
      await executeQuery(sql);
    }
    
    console.log('✅ 数据库表创建完成');
    
    // 初始化元数据
    await initMetadata();
    
    console.log('✅ MySQL数据库初始化完成');
    return true;
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    return false;
  }
}

// 初始化元数据
async function initMetadata() {
  const metadata = {
    total_questions: 0,
    total_sessions: 0,
    completed_sessions: 0,
    categories: [],
    difficulties: [],
    last_updated: new Date().toISOString()
  };
  
  const sql = `
    INSERT INTO metadata (key_name, value) 
    VALUES ('system_stats', ?) 
    ON DUPLICATE KEY UPDATE value = VALUES(value)
  `;
  
  await executeQuery(sql, [JSON.stringify(metadata)]);
}

// 检查数据库状态
export async function checkDatabaseStatus() {
  try {
    const tables = await executeQuery('SHOW TABLES');
    const expectedTables = ['questions', 'exam_sessions', 'metadata', 'backup_records'];
    
    const existingTables = (tables as any[]).map(row => Object.values(row)[0]);
    const missingTables = expectedTables.filter(table => !existingTables.includes(table));
    
    return {
      isReady: missingTables.length === 0,
      existingTables,
      missingTables,
      totalTables: existingTables.length
    };
  } catch (error) {
    console.error('检查数据库状态失败:', error);
    return {
      isReady: false,
      existingTables: [],
      missingTables: ['questions', 'exam_sessions', 'metadata', 'backup_records'],
      totalTables: 0
    };
  }
}

// 清空数据库
export async function clearDatabase() {
  try {
    await executeQuery('DELETE FROM exam_sessions');
    await executeQuery('DELETE FROM questions');
    await executeQuery('DELETE FROM backup_records');
    await initMetadata();
    console.log('✅ 数据库清空完成');
    return true;
  } catch (error) {
    console.error('❌ 数据库清空失败:', error);
    return false;
  }
}

// 获取数据库统计
export async function getDatabaseStats() {
  try {
    const [questionsCount] = await executeQuery('SELECT COUNT(*) as count FROM questions') as any[];
    const [sessionsCount] = await executeQuery('SELECT COUNT(*) as count FROM exam_sessions') as any[];
    const [completedCount] = await executeQuery('SELECT COUNT(*) as count FROM exam_sessions WHERE status = "completed"') as any[];
    
    const [categories] = await executeQuery('SELECT DISTINCT category FROM questions WHERE category IS NOT NULL') as any[];
    const [difficulties] = await executeQuery('SELECT DISTINCT difficulty FROM questions WHERE difficulty IS NOT NULL') as any[];
    
    return {
      totalQuestions: questionsCount.count,
      totalSessions: sessionsCount.count,
      completedSessions: completedCount.count,
      categories: categories.map((row: any) => row.category),
      difficulties: difficulties.map((row: any) => row.difficulty),
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('获取数据库统计失败:', error);
    return {
      totalQuestions: 0,
      totalSessions: 0,
      completedSessions: 0,
      categories: [],
      difficulties: [],
      lastUpdated: new Date().toISOString()
    };
  }
}
