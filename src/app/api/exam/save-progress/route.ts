import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';

// 保存考试进度
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, answers, currentQuestion, timeLeft } = body;
    
    if (!sessionId) {
      return NextResponse.json({ error: '缺少会话ID' }, { status: 400 });
    }
    
    const session = database.getSession(sessionId);
    
    if (!session) {
      return NextResponse.json({ error: '会话不存在' }, { status: 404 });
    }

    if (session.status !== 'in-progress') {
      return NextResponse.json({ error: '考试已结束' }, { status: 400 });
    }

    // 检查考试是否已经超时
    if (session.config?.timeLimit) {
      const startTime = new Date(session.startTime).getTime();
      const currentTime = Date.now();
      const timeLimitMs = session.config.timeLimit * 60 * 1000; // 转换为毫秒
      
      if (currentTime - startTime > timeLimitMs) {
        console.log('检测到考试超时:', { sessionId, startTime, currentTime, timeLimitMs });
        
        // 不在这里改变会话状态，只是返回超时信息
        // 让客户端或提交API来处理最终的状态更新
        return NextResponse.json({ 
          error: '考试时间已到',
          timeExpired: true 
        }, { status: 410 }); // 410 Gone 表示资源已过期
      }
    }
    
    // 更新答题进度
    const updatedSession = {
      ...session,
      answers: answers || session.answers,
      lastSaved: new Date(),
      progress: {
        currentQuestion: currentQuestion ?? 0,
        timeLeft: timeLeft,
        answeredCount: (answers || session.answers).filter((answer: any) => 
          answer !== null && answer !== undefined && answer !== -1
        ).length
      }
    };
    
    database.updateSession(sessionId, updatedSession);
    
    return NextResponse.json({
      success: true,
      message: '进度已保存',
      progress: updatedSession.progress
    });
    
  } catch (error) {
    console.error('保存考试进度时发生错误:', error);
    return NextResponse.json({ error: '保存进度失败' }, { status: 500 });
  }
}

// 获取考试进度
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json({ error: '缺少会话ID' }, { status: 400 });
    }
    
    const session = database.getSession(sessionId);
    
    if (!session) {
      return NextResponse.json({ error: '会话不存在' }, { status: 404 });
    }

    // 检查考试是否已经超时
    if (session.config?.timeLimit && session.status === 'in-progress') {
      const startTime = new Date(session.startTime).getTime();
      const currentTime = Date.now();
      const timeLimitMs = session.config.timeLimit * 60 * 1000;
      
      if (currentTime - startTime > timeLimitMs) {
        return NextResponse.json({ 
          error: '考试时间已到',
          timeExpired: true,
          shouldAutoSubmit: true
        }, { status: 410 });
      }
    }
    
    return NextResponse.json({
      progress: session.progress || {
        currentQuestion: 0,
        timeLeft: null,
        answeredCount: 0
      },
      answers: session.answers,
      lastSaved: session.lastSaved
    });
    
  } catch (error) {
    console.error('获取考试进度时发生错误:', error);
    return NextResponse.json({ error: '获取进度失败' }, { status: 500 });
  }
}
