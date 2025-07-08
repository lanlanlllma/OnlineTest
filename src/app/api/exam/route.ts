import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';
import { ExamSession, Question } from '@/types';

// 创建考试会话
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userName, totalQuestions, category, difficulty, timeLimit, templateId } = body;
    
    if (!userName || !totalQuestions) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }
    
    // 获取题目
    const questions = database.getRandomQuestions(totalQuestions, category, difficulty);
    
    if (questions.length === 0) {
      return NextResponse.json({ error: '没有找到符合条件的题目' }, { status: 400 });
    }
    
    // 创建考试会话
    const session: ExamSession = {
      id: `exam_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: `user_${Date.now()}`,
      userName,
      questionIds: questions.map(q => q.id), // 只存储题目ID
      answers: new Array(questions.length).fill(-1),
      score: 0,
      totalQuestions: questions.length,
      startTime: new Date(),
      status: 'in-progress',
      config: {
        category,
        difficulty,
        timeLimit,
        templateId
      }
    };
    
    const sessionId = database.createSession(session);
    
    // 返回会话信息和题目（不包含正确答案）
    const questionsForClient = questions.map(q => ({
      ...q,
      correctAnswer: undefined,
      explanation: undefined
    }));
    
    return NextResponse.json({
      sessionId,
      session: {
        ...session,
        questions: questionsForClient
      },
      timeLimit
    });
    
  } catch (error) {
    console.error('创建考试会话时发生错误:', error);
    return NextResponse.json({ error: '创建考试失败' }, { status: 500 });
  }
}

// 获取考试会话
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
    
    // 根据questionIds获取题目
    const questions = session.questionIds.map(id => database.getQuestionById(id)).filter(q => q !== undefined) as Question[];
    
    // 返回会话信息和题目（不包含正确答案）
    const questionsForClient = questions.map(q => ({
      ...q,
      correctAnswer: undefined,
      explanation: undefined
    }));
    
    return NextResponse.json({
      ...session,
      questions: questionsForClient
    });
    
  } catch (error) {
    console.error('获取考试会话时发生错误:', error);
    return NextResponse.json({ error: '获取考试会话失败' }, { status: 500 });
  }
}
