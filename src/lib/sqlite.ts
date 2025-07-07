import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// SQLite数据库配置
const dbPath = process.env.DB_PATH || './data/exam_system.db';
const fullDbPath = path.resolve(dbPath);

// 确保数据目录存在
const dataDir = path.dirname(fullDbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 创建SQLite数据库连接
export const db = new Database(fullDbPath);

// 设置SQLite配置
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('synchronous = NORMAL');

// 测试数据库连接
export function testConnection(): boolean {
  try {
    const result = db.prepare('SELECT 1 as test').get();
    console.log('✅ SQLite数据库连接成功');
    return true;
  } catch (error) {
    console.error('❌ SQLite数据库连接失败:', error);
    return false;
  }
}

// 执行查询
export function executeQuery(sql: string, params?: any[]): any {
  try {
    if (sql.trim().toLowerCase().startsWith('select')) {
      return db.prepare(sql).all(params);
    } else {
      return db.prepare(sql).run(params);
    }
  } catch (error) {
    console.error('SQL执行错误:', error);
    throw error;
  }
}

// 执行事务
export function executeTransaction(queries: Array<{ sql: string; params?: any[] }>): any[] {
  const transaction = db.transaction(() => {
    const results = [];
    for (const query of queries) {
      const result = db.prepare(query.sql).run(query.params);
      results.push(result);
    }
    return results;
  });
  
  return transaction();
}

// 关闭数据库连接
export function closeDatabase() {
  db.close();
}

// 获取数据库信息
export function getDatabaseInfo() {
  try {
    const size = fs.statSync(fullDbPath).size;
    const sizeInMB = (size / 1024 / 1024).toFixed(2);
    
    return {
      path: fullDbPath,
      size: `${sizeInMB} MB`,
      sizeBytes: size,
      exists: fs.existsSync(fullDbPath)
    };
  } catch (error) {
    return {
      path: fullDbPath,
      size: '0 MB',
      sizeBytes: 0,
      exists: false
    };
  }
}
