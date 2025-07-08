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

    // 格式化题目数据，包含用户答案
    const formattedQuestions = questions.map((question: Question, index: number) => {
      const userAnswer = session.answers[index];
      
      // 格式化正确答案
      let correctAnswerStr = '';
      if (question.type === 'multiple') {
        const correctAnswers = question.correctAnswer as number[];
        correctAnswerStr = correctAnswers.map(a => String.fromCharCode(65 + a)).join(',');
      } else {
        correctAnswerStr = String.fromCharCode(65 + (question.correctAnswer as number));
      }
      
      // 格式化用户答案
      let userAnswerStr: string | undefined = undefined;
      if (question.type === 'multiple') {
        const userAnswers = userAnswer as number[] || [];
        userAnswerStr = userAnswers.length > 0 
          ? userAnswers.map(a => String.fromCharCode(65 + a)).join(',')
          : undefined;
      } else {
        userAnswerStr = userAnswer !== undefined && userAnswer !== -1 
          ? String.fromCharCode(65 + (userAnswer as number))
          : undefined;
      }

      return {
        id: question.id,
        question: question.question,
        type: question.type,
        options: question.options,
        correctAnswer: correctAnswerStr,
        userAnswer: userAnswerStr,
        explanation: question.explanation,
        category: question.category,
        difficulty: question.difficulty
      };
    });

    const result = {
      id: session.id,
      name: session.userName || '考试记录',
      submittedAt: session.endTime || session.startTime,
      score: session.score,
      totalQuestions: session.totalQuestions,
      correctAnswers,
      duration: session.duration || 0,
      questions: formattedQuestions
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
