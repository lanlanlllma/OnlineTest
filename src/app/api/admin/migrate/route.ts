import { NextRequest, NextResponse } from 'next/server';
import { migrateToOptimizedDatabase } from '@/lib/migrate-database';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'exam-system-secret-key-2025';

// 验证管理员权限
function verifyAdmin(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return false;
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded.role === 'admin';
  } catch (error) {
    console.error('JWT verification failed:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: '需要管理员权限' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'migrate') {
      const result = await migrateToOptimizedDatabase();
      return NextResponse.json({
        success: true,
        message: '数据库迁移完成',
        result
      });
    }

    return NextResponse.json({ error: '未知的操作' }, { status: 400 });
  } catch (error) {
    console.error('迁移操作失败:', error);
    return NextResponse.json({ 
      error: '迁移失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
