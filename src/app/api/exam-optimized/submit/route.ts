import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';
import { ExamResult, Question } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, answers } = body;
    
    if (!sessionId || !answers) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }
    
    const sessionWithQuestions = database.getSessionWithQuestions(sessionId);
    
    if (!sessionWithQuestions) {
      return NextResponse.json({ error: '会话不存在' }, { status: 404 });
    }
    
    if (sessionWithQuestions.status === 'completed') {
      return NextResponse.json({ error: '考试已经完成' }, { status: 400 });
    }
    
    // 计算得分
    let correctAnswers = 0;
    const categoryStats: { [key: string]: { correct: number; total: number } } = {};
    
    sessionWithQuestions.questions.forEach((question: Question, index: number) => {
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
    
    const score = (correctAnswers / sessionWithQuestions.totalQuestions) * 100; // 转换为百分比
    const percentage = score;
    const endTime = new Date();
    
    // 处理从JSON加载的日期字符串
    const startTime = sessionWithQuestions.startTime instanceof Date ? sessionWithQuestions.startTime : new Date(sessionWithQuestions.startTime);
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
    
    // 更新会话
    database.updateSession(sessionId, {
      answers,
      score,
      endTime,
      status: 'completed',
      duration
    });
    
    // 获取更新后的会话（带题目信息）
    const updatedSessionWithQuestions = database.getSessionWithQuestions(sessionId);
    
    if (!updatedSessionWithQuestions) {
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
      session: updatedSessionWithQuestions,
      correctAnswers,
      incorrectAnswers: sessionWithQuestions.totalQuestions - correctAnswers,
      percentage,
      categoryBreakdown
    };
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('提交答案时发生错误:', error);
    return NextResponse.json({ error: '提交答案失败' }, { status: 500 });
  }
}
