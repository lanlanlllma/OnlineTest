import { NextRequest, NextResponse } from 'next/server';
import { optimizedDatabase } from '@/lib/database-optimized';

// 创建考试会话（优化版本）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userName, totalQuestions, category, difficulty, timeLimit } = body;
    
    if (!userName || !totalQuestions) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }
    
    // 获取题目
    const questions = optimizedDatabase.getRandomQuestions(totalQuestions, category, difficulty);
    
    if (questions.length === 0) {
      return NextResponse.json({ error: '没有找到符合条件的题目' }, { status: 400 });
    }
    
    // 创建考试会话数据
    const sessionData = {
      userId: `user_${Date.now()}`,
      userName,
      questions,
      answers: new Array(questions.length).fill(-1),
      score: 0,
      totalQuestions: questions.length,
      startTime: new Date(),
      status: 'in-progress' as const,
      config: {
        category,
        difficulty,
        timeLimit
      }
    };
    
    const sessionId = optimizedDatabase.createSession(sessionData);
    
    // 返回会话信息（不包含正确答案）
    const sessionForClient = {
      id: sessionId,
      userId: sessionData.userId,
      userName: sessionData.userName,
      questions: questions.map(q => ({
        ...q,
        correctAnswer: undefined,
        explanation: undefined
      })),
      answers: sessionData.answers,
      score: sessionData.score,
      totalQuestions: sessionData.totalQuestions,
      startTime: sessionData.startTime,
      status: sessionData.status
    };
    
    return NextResponse.json({
      sessionId,
      session: sessionForClient,
      timeLimit
    });
    
  } catch (error) {
    console.error('创建考试会话时发生错误:', error);
    return NextResponse.json({ error: '创建考试失败' }, { status: 500 });
  }
}

// 获取考试会话（优化版本）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json({ error: '缺少会话ID' }, { status: 400 });
    }
    
    const sessionWithQuestions = optimizedDatabase.getSessionWithQuestions(sessionId);
    
    if (!sessionWithQuestions) {
      return NextResponse.json({ error: '会话不存在' }, { status: 404 });
    }
    
    // 返回会话信息（不包含正确答案）
    const sessionForClient = {
      ...sessionWithQuestions,
      questions: sessionWithQuestions.questions.map(q => ({
        ...q,
        correctAnswer: undefined,
        explanation: undefined
      }))
    };
    
    return NextResponse.json({ session: sessionForClient });
    
  } catch (error) {
    console.error('获取考试会话时发生错误:', error);
    return NextResponse.json({ error: '获取考试会话失败' }, { status: 500 });
  }
}
