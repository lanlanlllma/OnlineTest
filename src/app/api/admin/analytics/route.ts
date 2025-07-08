import { NextResponse } from 'next/server';
import { database } from '@/lib/database';

export async function GET() {
  try {
    const questions = database.getAllQuestions();
    const sessions = database.getAllSessions();
    const completedSessions = sessions.filter(session => session.status === 'completed');

    // 计算平均分
    const averageScore = completedSessions.length > 0 
      ? completedSessions.reduce((sum, session) => sum + session.score, 0) / completedSessions.length 
      : 0;

    // 分数分布
    const scoreDistribution = {
      '0-60': 0,
      '60-80': 0,
      '80-100': 0
    };

    completedSessions.forEach(session => {
      if (session.score < 60) {
        scoreDistribution['0-60']++;
      } else if (session.score < 80) {
        scoreDistribution['60-80']++;
      } else {
        scoreDistribution['80-100']++;
      }
    });

    // 分类统计
    const categoryStats: { [key: string]: { totalQuestions: number; averageScore: number; sessionCount: number } } = {};
    const categories = [...new Set(questions.map(q => q.category).filter(Boolean))];
    
    categories.forEach(category => {
      const categoryQuestions = questions.filter(q => q.category === category);
      const categorySessions = completedSessions.filter(session => 
        session.config?.category === category
      );
      
      const categoryAverage = categorySessions.length > 0
        ? categorySessions.reduce((sum, session) => sum + session.score, 0) / categorySessions.length
        : 0;

      categoryStats[category!] = {
        totalQuestions: categoryQuestions.length,
        averageScore: categoryAverage,
        sessionCount: categorySessions.length
      };
    });

    // 难度统计
    const difficultyStats: { [key: string]: { totalQuestions: number; averageScore: number; sessionCount: number } } = {};
    const difficulties = [...new Set(questions.map(q => q.difficulty).filter(Boolean))];
    
    difficulties.forEach(difficulty => {
      const difficultyQuestions = questions.filter(q => q.difficulty === difficulty);
      const difficultySessions = completedSessions.filter(session => 
        session.config?.difficulty === difficulty
      );
      
      const difficultyAverage = difficultySessions.length > 0
        ? difficultySessions.reduce((sum, session) => sum + session.score, 0) / difficultySessions.length
        : 0;

      difficultyStats[difficulty!] = {
        totalQuestions: difficultyQuestions.length,
        averageScore: difficultyAverage,
        sessionCount: difficultySessions.length
      };
    });

    // 最近活动（按日期分组）
    const recentActivity: { [key: string]: number } = {};
    const now = new Date();
    
    // 生成最近7天的数据
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      recentActivity[dateStr] = 0;
    }

    completedSessions.forEach(session => {
      const sessionDate = new Date(session.endTime || session.startTime).toISOString().split('T')[0];
      if (recentActivity.hasOwnProperty(sessionDate)) {
        recentActivity[sessionDate]++;
      }
    });

    const recentActivityArray = Object.entries(recentActivity).map(([date, count]) => ({
      date,
      sessionCount: count
    }));

    const analytics = {
      totalQuestions: questions.length,
      totalSessions: sessions.length,
      completedSessions: completedSessions.length,
      averageScore,
      categoryStats,
      difficultyStats,
      scoreDistribution,
      recentActivity: recentActivityArray
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('获取分析数据失败:', error);
    return NextResponse.json(
      { success: false, message: '获取分析数据失败' },
      { status: 500 }
    );
  }
}
