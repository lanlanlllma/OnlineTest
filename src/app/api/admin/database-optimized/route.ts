import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';
import { migrateDatabase, compareStorageEfficiency } from '@/lib/migration';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'size':
        // 获取优化数据库大小信息
        const sizeInfo = database.getSize();
        return NextResponse.json(sizeInfo);

      case 'backup':
        // 创建备份
        const backupFile = database.backup();
        return NextResponse.json({ 
          success: true, 
          backupFile: backupFile.split('/').pop(),
          message: '优化数据库备份创建成功' 
        });

      case 'stats':
        // 获取详细统计
        const stats = database.getStats();
        const sizeData = database.getSize();
        return NextResponse.json({
          ...stats,
          fileSize: sizeData.fileSize,
          spaceSaved: sizeData.spaceSaved,
          lastUpdate: new Date().toISOString()
        });

      case 'migrate':
        // 执行数据迁移
        const migrationResult = await migrateDatabase();
        return NextResponse.json(migrationResult);

      case 'compare':
        // 比较存储效率
        const comparison = compareStorageEfficiency();
        return NextResponse.json(comparison);

      default:
        return NextResponse.json({ error: '不支持的操作' }, { status: 400 });
    }
  } catch (error) {
    console.error('优化数据库管理操作失败:', error);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'clear-questions':
        database.clearQuestions();
        return NextResponse.json({ success: true, message: '题目数据已清空' });

      case 'clear-sessions':
        database.clearSessions();
        return NextResponse.json({ success: true, message: '会话数据已清空' });

      case 'clear-all':
        database.clearAll();
        return NextResponse.json({ success: true, message: '所有数据已清空' });

      case 'migrate':
        // 执行数据迁移
        const migrationResult = await migrateDatabase();
        return NextResponse.json(migrationResult);

      default:
        return NextResponse.json({ error: '不支持的操作' }, { status: 400 });
    }
  } catch (error) {
    console.error('优化数据库管理操作失败:', error);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}
