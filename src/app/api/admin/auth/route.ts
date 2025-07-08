import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// 管理员密码配置（在生产环境中应该使用环境变量）
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123456';
const JWT_SECRET = process.env.JWT_SECRET || 'exam-system-secret-key-2025';

// 登录验证
export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: '请输入密码' }, { status: 400 });
    }

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: '密码错误' }, { status: 401 });
    }

    // 生成JWT token，有效期24小时
    const token = jwt.sign(
      { role: 'admin', timestamp: Date.now() },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return NextResponse.json({
      success: true,
      token,
      message: '登录成功'
    });

  } catch (error) {
    console.error('管理员认证失败:', error);
    return NextResponse.json({ error: '认证失败' }, { status: 500 });
  }
}

// 验证token
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: '缺少认证token' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      valid: true,
      user: { role: 'admin' }
    });

  } catch (error) {
    console.error('Token验证失败:', error);
    return NextResponse.json({ error: 'Token无效或已过期' }, { status: 401 });
  }
}
