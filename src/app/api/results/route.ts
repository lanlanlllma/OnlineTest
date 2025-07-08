import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const sessions = database.getAllSessions();
    
    // 转换数据格式，确保包含所有必要字段
    const formattedSessions = sessions.map(session => ({
      id: session.id,
      userName: session.userName,
      score: session.score,
      totalQuestions: session.totalQuestions,
      startTime: session.startTime,
      endTime: session.endTime,
      duration: session.duration,
      durationInSeconds: session.durationInSeconds,
      status: session.status
    }));
    
    return NextResponse.json(formattedSessions);
  } catch (error) {
    console.error('获取考试记录失败:', error);
    return NextResponse.json({ error: '获取考试记录失败' }, { status: 500 });
  }
}
