import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';
import { ExamResult, Question } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, answers } = body;
    
    console.log('考试提交请求:', { sessionId, answersLength: answers?.length });
    
    if (!sessionId || !answers) {
      console.log('缺少必要参数:', { sessionId: !!sessionId, answers: !!answers });
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }
    
    const session = database.getSession(sessionId);
    
    if (!session) {
      console.log('会话不存在:', sessionId);
      return NextResponse.json({ error: '会话不存在' }, { status: 404 });
    }
    
    console.log('当前会话状态:', { status: session.status, sessionId });
    
    if (session.status === 'completed') {
      console.log('考试已经完成，返回现有结果:', sessionId);
      
      // 如果考试已经完成，返回现有的结果而不是错误
      // 这可能是因为服务端已经自动提交了
      const questions = session.questionIds.map(id => database.getQuestionById(id)).filter(q => q !== undefined) as Question[];
      
      const result: ExamResult = {
        session: {
          ...session,
          questions
        },
        correctAnswers: 0, // 这些值在自动提交时已经计算过了
        incorrectAnswers: session.totalQuestions,
        percentage: session.score || 0,
        categoryBreakdown: {}
      };
      
      return NextResponse.json(result);
    }

    if (session.status === 'expired') {
      console.log('考试时间已到，但状态为expired:', sessionId);
      return NextResponse.json({ error: '考试时间已到' }, { status: 400 });
    }

    // 检查考试是否超时
    if (session.config?.timeLimit && session.status === 'in-progress') {
      const startTime = new Date(session.startTime).getTime();
      const currentTime = Date.now();
      const timeLimitMs = session.config.timeLimit * 60 * 1000; // 转换为毫秒
      
      if (currentTime - startTime > timeLimitMs) {
        // 考试超时，但仍然允许提交（因为可能是网络延迟）
        // 但是将结束时间设置为超时时间点
        const timeoutEndTime = new Date(startTime + timeLimitMs);
        
        // 更新会话状态为超时
        database.updateSession(sessionId, {
          status: 'expired',
          endTime: timeoutEndTime
        });
      }
    }
    
    // 计算得分
    let correctAnswers = 0;
    const categoryStats: { [key: string]: { correct: number; total: number } } = {};
    
    // 根据questionIds获取题目数据
    const questions = session.questionIds.map(id => database.getQuestionById(id)).filter(q => q !== undefined) as Question[];
    
    questions.forEach((question: Question, index: number) => {
      const userAnswer = answers[index];
      let isCorrect = false;
      
      if (question.type === 'multiple') {
        // 多选题：需要答案完全一致
        const correctAnswers = question.correctAnswer as number[];
        const userAnswers = userAnswer as number[] || [];
        
        // 排序后比较
        const sortedCorrect = [...correctAnswers].sort();
        const sortedUser = [...userAnswers].sort();
        
        isCorrect = sortedCorrect.length === sortedUser.length && 
                   sortedCorrect.every((val, i) => val === sortedUser[i]);
      } else {
        // 单选题：直接比较
        isCorrect = userAnswer === question.correctAnswer;
      }
      
      if (isCorrect) {
        correctAnswers++;
      }
      
      // 统计分类信息
      if (question.category) {
        if (!categoryStats[question.category]) {
          categoryStats[question.category] = { correct: 0, total: 0 };
        }
        categoryStats[question.category].total++;
        if (isCorrect) {
          categoryStats[question.category].correct++;
        }
      }
    });
    
    const score = (correctAnswers / session.totalQuestions) * 100; // 转换为百分比
    const percentage = score;
    const endTime = new Date();
    
    // 处理从JSON加载的日期字符串
    const startTime = session.startTime instanceof Date ? session.startTime : new Date(session.startTime);
    const durationInMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
    const durationInSeconds = Math.round((endTime.getTime() - startTime.getTime()) / 1000);
    
    // 更新会话 - 保存分钟数用于兼容，但优先保存秒数
    database.updateSession(sessionId, {
      answers,
      score,
      endTime,
      status: 'completed',
      duration: durationInMinutes,
      durationInSeconds
    });
    
    // 获取更新后的会话
    const updatedSession = database.getSession(sessionId);
    
    if (!updatedSession) {
      return NextResponse.json({ error: '更新会话失败' }, { status: 500 });
    }
    
    // 构建结果对象
    const categoryBreakdown: ExamResult['categoryBreakdown'] = {};
    Object.entries(categoryStats).forEach(([category, stats]) => {
      if (categoryBreakdown) {
        categoryBreakdown[category] = {
          ...stats,
          percentage: (stats.correct / stats.total) * 100
        };
      }
    });

    const result: ExamResult = {
      session: {
        ...updatedSession,
        questions // 添加题目数组到session中
      },
      correctAnswers,
      incorrectAnswers: session.totalQuestions - correctAnswers,
      percentage,
      categoryBreakdown
    };
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('提交答案时发生错误:', error);
    return NextResponse.json({ error: '提交答案失败' }, { status: 500 });
  }
}
