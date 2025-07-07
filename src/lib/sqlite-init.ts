import { db, executeQuery, testConnection, getDatabaseInfo } from './sqlite';

// 数据库表结构
const createTablesSQL = [
  // 题目表
  `CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    question TEXT NOT NULL,
    type TEXT CHECK(type IN ('single', 'multiple')) NOT NULL,
    options TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    category TEXT,
    difficulty TEXT CHECK(difficulty IN ('easy', 'medium', 'hard')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  // 考试会话表
  `CREATE TABLE IF NOT EXISTS exam_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    question_ids TEXT NOT NULL,
    answers TEXT,
    score REAL DEFAULT 0,
    total_questions INTEGER NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    duration INTEGER,
    status TEXT CHECK(status IN ('in-progress', 'completed', 'expired')) DEFAULT 'in-progress',
    config TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  // 统计元数据表
  `CREATE TABLE IF NOT EXISTS metadata (
    key_name TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  // 备份记录表
  `CREATE TABLE IF NOT EXISTS backup_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    backup_type TEXT CHECK(backup_type IN ('manual', 'auto')) NOT NULL,
    file_path TEXT,
    file_size INTEGER,
    tables_count INTEGER,
    records_count INTEGER,
    status TEXT CHECK(status IN ('success', 'failed')) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`
];

// 创建索引
const createIndexesSQL = [
  'CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category)',
  'CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty)',
  'CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type)',
  'CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON exam_sessions(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_sessions_status ON exam_sessions(status)',
  'CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON exam_sessions(start_time)',
  'CREATE INDEX IF NOT EXISTS idx_backup_created_at ON backup_records(created_at)',
  'CREATE INDEX IF NOT EXISTS idx_backup_status ON backup_records(status)'
];

// 初始化数据库
export async function initDatabase(): Promise<boolean> {
  console.log('开始初始化SQLite数据库...');
  
  try {
    // 测试连接
    const isConnected = testConnection();
    if (!isConnected) {
      throw new Error('无法连接到SQLite数据库');
    }
    
    // 创建表
    for (const sql of createTablesSQL) {
      executeQuery(sql);
    }
    
    console.log('✅ 数据库表创建完成');
    
    // 创建索引
    for (const sql of createIndexesSQL) {
      executeQuery(sql);
    }
    
    console.log('✅ 数据库索引创建完成');
    
    // 初始化元数据
    await initMetadata();
    
    console.log('✅ SQLite数据库初始化完成');
    
    // 显示数据库信息
    const dbInfo = getDatabaseInfo();
    console.log(`📁 数据库文件: ${dbInfo.path}`);
    console.log(`💾 文件大小: ${dbInfo.size}`);
    
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
    INSERT OR REPLACE INTO metadata (key_name, value) 
    VALUES ('system_stats', ?)
  `;
  
  executeQuery(sql, [JSON.stringify(metadata)]);
}

// 检查数据库状态
export async function checkDatabaseStatus() {
  try {
    const tablesResult = executeQuery("SELECT name FROM sqlite_master WHERE type='table'") as any[];
    const expectedTables = ['questions', 'exam_sessions', 'metadata', 'backup_records'];
    
    const existingTables = tablesResult.map(row => row.name);
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
export async function clearDatabase(): Promise<boolean> {
  try {
    executeQuery('DELETE FROM exam_sessions');
    executeQuery('DELETE FROM questions');
    executeQuery('DELETE FROM backup_records');
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
    const [questionsCount] = executeQuery('SELECT COUNT(*) as count FROM questions') as any[];
    const [sessionsCount] = executeQuery('SELECT COUNT(*) as count FROM exam_sessions') as any[];
    const [completedCount] = executeQuery('SELECT COUNT(*) as count FROM exam_sessions WHERE status = "completed"') as any[];
    
    const categories = executeQuery('SELECT DISTINCT category FROM questions WHERE category IS NOT NULL') as any[];
    const difficulties = executeQuery('SELECT DISTINCT difficulty FROM questions WHERE difficulty IS NOT NULL') as any[];
    
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

// 备份数据库
export async function backupDatabase(): Promise<string> {
  try {
    const timestamp = Date.now();
    const backupPath = `./data/backup_sqlite_${timestamp}.db`;
    const dbInfo = getDatabaseInfo();
    
    // 使用SQLite的BACKUP命令
    db.backup(backupPath);
    
    // 记录备份信息
    const sql = `
      INSERT INTO backup_records (backup_type, file_path, file_size, status)
      VALUES ('manual', ?, ?, 'success')
    `;
    
    executeQuery(sql, [backupPath, dbInfo.sizeBytes]);
    
    console.log(`✅ 创建了SQLite数据库备份: ${backupPath}`);
    return backupPath;
  } catch (error) {
    console.error('❌ SQLite数据库备份失败:', error);
    throw error;
  }
}

// 优化数据库
export async function optimizeDatabase() {
  try {
    executeQuery('VACUUM');
    executeQuery('ANALYZE');
    console.log('✅ 数据库优化完成');
    return true;
  } catch (error) {
    console.error('❌ 数据库优化失败:', error);
    return false;
  }
}
