import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';
import { PDFExporter } from '@/lib/pdf-exporter';
import { CSVExporter } from '@/lib/csv-exporter';
import { ExamResult, Question } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const format = searchParams.get('format') || 'pdf';
    
    if (!sessionId) {
      return NextResponse.json({ error: '缺少会话ID' }, { status: 400 });
    }
    
    const session = database.getSession(sessionId);
    
    if (!session) {
      return NextResponse.json({ error: '会话不存在' }, { status: 404 });
    }
    
    if (session.status !== 'completed') {
      return NextResponse.json({ error: '考试尚未完成' }, { status: 400 });
    }
    
    // 计算结果
    let correctAnswers = 0;
    const categoryStats: { [key: string]: { correct: number; total: number } } = {};
    
    // 根据questionIds获取题目
    const questions = session.questionIds.map(id => database.getQuestionById(id)).filter(q => q !== undefined) as Question[];
    
    questions.forEach((question, index) => {
      const userAnswer = session.answers[index];
      let isCorrect = false;
      
      if (question.type === 'multiple') {
        // 多选题：比较数组
        const correctAnswerArray = Array.isArray(question.correctAnswer) 
          ? question.correctAnswer 
          : [question.correctAnswer];
        const userAnswerArray = Array.isArray(userAnswer) 
          ? userAnswer 
          : [userAnswer];
        
        isCorrect = correctAnswerArray.length === userAnswerArray.length &&
                   correctAnswerArray.every(ans => userAnswerArray.includes(ans));
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
        ...session,
        questions // 添加题目数组到session中
      },
      correctAnswers,
      incorrectAnswers: session.totalQuestions - correctAnswers,
      percentage: (correctAnswers / session.totalQuestions) * 100,
      categoryBreakdown
    };
    
    if (format === 'pdf') {
      const pdfBuffer = await PDFExporter.exportExamResult(result);
      
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="exam_result_${sessionId}.pdf"`
        }
      });
    } else if (format === 'csv') {
      const csvContent = CSVExporter.exportExamResult(result);
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="exam_result_${sessionId}.csv"`
        }
      });
    } else {
      return NextResponse.json(result);
    }
    
  } catch (error) {
    console.error('导出结果时发生错误:', error);
    return NextResponse.json({ error: '导出结果失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type = 'all', format = 'pdf' } = body;
    
    if (type === 'all') {
      const sessions = database.getAllSessions().filter(s => s.status === 'completed');
      
      if (sessions.length === 0) {
        return NextResponse.json({ error: '没有已完成的考试记录' }, { status: 400 });
      }
      
      if (format === 'csv') {
        const csvContent = CSVExporter.exportSessionSummary(sessions);
        
        return new NextResponse(csvContent, {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="exam_summary_${new Date().toISOString().split('T')[0]}.csv"`
          }
        });
      } else {
        const pdfBuffer = await PDFExporter.exportSessionSummary(sessions);
        
        return new NextResponse(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="exam_summary_${new Date().toISOString().split('T')[0]}.pdf"`
          }
        });
      }
    }
    
    return NextResponse.json({ error: '不支持的导出类型' }, { status: 400 });
    
  } catch (error) {
    console.error('导出汇总时发生错误:', error);
    return NextResponse.json({ error: '导出汇总失败' }, { status: 500 });
  }
}
