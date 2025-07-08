import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';
import { ExamSession } from '@/types';

export async function GET() {
  try {
    const sessions = database.getAllSessions();
    
    // 只返回已完成的考试会话
    const completedSessions = sessions.filter(session => session.status === 'completed');
    
    const formattedSessions = completedSessions.map((session: ExamSession) => ({
      id: session.id,
      name: session.userName || '匿名用户',
      submittedAt: session.endTime || session.startTime,
      score: session.score,
      totalQuestions: session.totalQuestions,
      duration: session.duration || 0,
      category: session.config?.category,
      difficulty: session.config?.difficulty
    }));

    return NextResponse.json({
      success: true,
      sessions: formattedSessions
    });
  } catch (error) {
    console.error('获取学生成绩失败:', error);
    return NextResponse.json(
      { success: false, message: '获取成绩失败' },
      { status: 500 }
    );
  }
}
