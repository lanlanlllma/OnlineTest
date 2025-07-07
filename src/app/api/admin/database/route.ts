import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'size':
        // 获取数据库大小信息
        const sizeInfo = database.getSize();
        return NextResponse.json(sizeInfo);

      case 'backup':
        // 创建备份
        const backupFile = database.backup();
        return NextResponse.json({ 
          success: true, 
          backupFile: backupFile.split('/').pop(),
          message: '备份创建成功' 
        });

      case 'stats':
        // 获取详细统计
        const stats = database.getStats();
        const sizeData = database.getSize();
        return NextResponse.json({
          ...stats,
          fileSize: sizeData.fileSize,
          lastUpdate: new Date().toISOString()
        });

      default:
        return NextResponse.json({ error: '不支持的操作' }, { status: 400 });
    }
  } catch (error) {
    console.error('数据库管理操作失败:', error);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, backupFile } = body;

    switch (action) {
      case 'restore':
        if (!backupFile) {
          return NextResponse.json({ error: '缺少备份文件名' }, { status: 400 });
        }
        
        // 恢复备份（这里简化处理，实际应用中需要更严格的文件验证）
        database.restore(backupFile);
        return NextResponse.json({ 
          success: true, 
          message: '数据库恢复成功' 
        });

      case 'clear':
        // 清空所有数据（危险操作）
        database.clearAll();
        return NextResponse.json({ 
          success: true, 
          message: '数据库清空成功' 
        });

      default:
        return NextResponse.json({ error: '不支持的操作' }, { status: 400 });
    }
  } catch (error) {
    console.error('数据库管理操作失败:', error);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}
