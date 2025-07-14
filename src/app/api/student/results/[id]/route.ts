import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';
import { Question } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionId = id;
    const session = database.getSession(sessionId);

    if (!session) {
      return NextResponse.json(
        { success: false, message: '考试记录不存在' },
        { status: 404 }
      );
    }

    if (session.status !== 'completed') {
      return NextResponse.json(
        { success: false, message: '考试尚未完成' },
        { status: 400 }
      );
    }

    // 计算正确答案数
    let correctAnswers = 0;
    // 根据questionIds获取题目
    const questions = session.questionIds.map(id => database.getQuestionById(id)).filter(q => q !== undefined) as Question[];
    
    questions.forEach((question: Question, index: number) => {
      const userAnswer = session.answers[index];
      let isCorrect = false;
      
      if (question.type === 'multiple') {
        // 多选题：需要答案完全一致
        const correctAnswerArray = question.correctAnswer as number[];
        const userAnswerArray = userAnswer as number[] || [];
        
        // 排序后比较
        const sortedCorrect = [...correctAnswerArray].sort();
        const sortedUser = [...userAnswerArray].sort();
        
        isCorrect = sortedCorrect.length === sortedUser.length && 
                   sortedCorrect.every((val, i) => val === sortedUser[i]);
      } else {
        // 单选题：直接比较
        isCorrect = userAnswer === question.correctAnswer;
      }
      
      if (isCorrect) {
        correctAnswers++;
      }
    });

    // 获取考试的分类和难度信息（如果存在）
    let category: string | undefined = undefined;
    let difficulty: string | undefined = undefined;
    
    if (questions.length > 0) {
      // 从第一道题获取分类和难度（假设同一次考试的题目具有相同的分类和难度）
      category = questions[0].category;
      difficulty = questions[0].difficulty;
    }

    // 只返回基础统计信息，不包含题目详情
    const result = {
      id: session.id,
      name: session.userName || '考试记录',
      submittedAt: session.endTime || session.startTime,
      score: session.score,
      totalQuestions: session.totalQuestions,
      correctAnswers,
      duration: session.duration || 0,
      category: category,
      difficulty: difficulty
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('获取考试详情失败:', error);
    return NextResponse.json(
      { success: false, message: '获取考试详情失败' },
      { status: 500 }
    );
  }
}
