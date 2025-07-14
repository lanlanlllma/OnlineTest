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
    
    // 创建考试会话数据
    const sessionData = {
      userId: `user_${Date.now()}`,
      userName,
      questions, // 传递完整的题目数组
      answers: new Array(questions.length).fill(-1),
      score: 0,
      totalQuestions: questions.length,
      startTime: new Date(),
      status: 'in-progress' as const,
      config: {
        category,
        difficulty,
        timeLimit,
        templateId
      }
    };
    
    const sessionId = database.createSession(sessionData);
    
    // 返回会话信息和题目（不包含正确答案）
    const questionsForClient = questions.map(q => ({
      ...q,
      correctAnswer: undefined,
      explanation: undefined
    }));
    
    return NextResponse.json({
      sessionId,
      session: {
        id: sessionId,
        ...sessionData,
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

    // 检查考试是否已经超时
    if (session.config?.timeLimit && session.status === 'in-progress') {
      const startTime = new Date(session.startTime).getTime();
      const currentTime = Date.now();
      const timeLimitMs = session.config.timeLimit * 60 * 1000; // 转换为毫秒
      
      if (currentTime - startTime > timeLimitMs) {
        // 考试超时，自动提交
        const endTime = new Date(startTime + timeLimitMs);
        const durationMs = endTime.getTime() - startTime;
        const durationMinutes = Math.round(durationMs / (1000 * 60));
        const durationInSeconds = Math.round(durationMs / 1000);
        
        // 计算得分
        const questions = session.questionIds.map(id => database.getQuestionById(id)).filter(q => q !== undefined) as Question[];
        let correctAnswers = 0;
        
        questions.forEach((question, index) => {
          const userAnswer = session.answers[index];
          let isCorrect = false;
          
          if (question.type === 'multiple') {
            const correctAnswerArray = Array.isArray(question.correctAnswer) 
              ? question.correctAnswer 
              : [question.correctAnswer];
            const userAnswerArray = Array.isArray(userAnswer) 
              ? userAnswer 
              : [userAnswer];
            
            isCorrect = correctAnswerArray.length === userAnswerArray.length &&
                       correctAnswerArray.every(ans => userAnswerArray.includes(ans));
          } else {
            isCorrect = question.correctAnswer === userAnswer;
          }
          
          if (isCorrect) correctAnswers++;
        });
        
        const score = (correctAnswers / session.totalQuestions) * 100;
        
        // 更新会话状态为已完成
        const updatedSession = {
          ...session,
          status: 'completed' as const,
          endTime,
          duration: durationMinutes,
          durationInSeconds,
          score
        };
        
        database.updateSession(sessionId, updatedSession);
        
        return NextResponse.json({ 
          error: '考试时间已到，已自动提交',
          autoSubmitted: true,
          sessionId 
        }, { status: 410 }); // 410 Gone 表示资源已过期
      }
    }
    
    // 根据questionIds获取题目
    const questions = session.questionIds.map(id => database.getQuestionById(id)).filter(q => q !== undefined) as Question[];
    
    // 返回会话信息和题目（不包含正确答案）
    const questionsForClient = questions.map(q => ({
      ...q,
      correctAnswer: undefined,
      explanation: undefined
    }));

    // 计算剩余时间
    let remainingTime = null;
    if (session.config?.timeLimit && session.status === 'in-progress') {
      const startTime = new Date(session.startTime).getTime();
      const currentTime = Date.now();
      const timeLimitMs = session.config.timeLimit * 60 * 1000;
      const elapsedMs = currentTime - startTime;
      remainingTime = Math.max(0, Math.floor((timeLimitMs - elapsedMs) / 1000)); // 返回剩余秒数
    }
    
    return NextResponse.json({
      ...session,
      questions: questionsForClient,
      timeLimit: session.config?.timeLimit,
      remainingTime // 添加剩余时间字段
    });
    
  } catch (error) {
    console.error('获取考试会话时发生错误:', error);
    return NextResponse.json({ error: '获取考试会话失败' }, { status: 500 });
  }
}
