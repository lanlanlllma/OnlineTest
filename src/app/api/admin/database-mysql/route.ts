import { NextRequest, NextResponse } from 'next/server';
import { mysqlDatabase } from '@/lib/database-mysql';
import { migrateToMySQL, migrateFromJSON, compareStorageSystems } from '@/lib/mysql-migration';
import { checkDatabaseStatus, initDatabase, clearDatabase } from '@/lib/mysql-init';
import { testConnection } from '@/lib/mysql';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'status':
        // 检查MySQL数据库状态
        const status = await checkDatabaseStatus();
        const connection = await testConnection();
        return NextResponse.json({
          ...status,
          connectionStatus: connection ? 'connected' : 'disconnected'
        });

      case 'stats':
        // 获取详细统计
        const stats = await mysqlDatabase.getStats();
        return NextResponse.json({
          ...stats,
          storageType: 'MySQL',
          lastUpdate: new Date().toISOString()
        });

      case 'backup':
        // 创建备份
        const backupFile = await mysqlDatabase.backup();
        return NextResponse.json({ 
          success: true, 
          backupFile: backupFile.split('/').pop(),
          message: 'MySQL数据库备份创建成功' 
        });

      case 'migrate-from-json':
        // 从JSON迁移到MySQL
        const migrationResult = await migrateFromJSON();
        return NextResponse.json(migrationResult);

      case 'migrate-from-optimized':
        // 从优化数据库迁移到MySQL
        const optimizedMigration = await migrateToMySQL();
        return NextResponse.json(optimizedMigration);

      case 'compare':
        // 比较存储系统
        const comparison = await compareStorageSystems();
        return NextResponse.json(comparison);

      case 'init':
        // 初始化数据库
        const initResult = await initDatabase();
        return NextResponse.json({ 
          success: initResult, 
          message: initResult ? 'MySQL数据库初始化成功' : 'MySQL数据库初始化失败'
        });

      default:
        return NextResponse.json({ error: '不支持的操作' }, { status: 400 });
    }
  } catch (error) {
    console.error('MySQL数据库管理操作失败:', error);
    return NextResponse.json({ 
      error: '操作失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'clear-questions':
        await mysqlDatabase.clearQuestions();
        return NextResponse.json({ success: true, message: '题目数据已清空' });

      case 'clear-sessions':
        await mysqlDatabase.clearSessions();
        return NextResponse.json({ success: true, message: '会话数据已清空' });

      case 'clear-all':
        await mysqlDatabase.clearAll();
        return NextResponse.json({ success: true, message: '所有数据已清空' });

      case 'init':
        const initResult = await initDatabase();
        return NextResponse.json({ 
          success: initResult, 
          message: initResult ? 'MySQL数据库初始化成功' : 'MySQL数据库初始化失败'
        });

      case 'migrate-from-json':
        const migrationResult = await migrateFromJSON();
        return NextResponse.json(migrationResult);

      case 'migrate-from-optimized':
        const optimizedMigration = await migrateToMySQL();
        return NextResponse.json(optimizedMigration);

      default:
        return NextResponse.json({ error: '不支持的操作' }, { status: 400 });
    }
  } catch (error) {
    console.error('MySQL数据库管理操作失败:', error);
    return NextResponse.json({ 
      error: '操作失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
