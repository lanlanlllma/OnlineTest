import { ExamSession, ExamResult } from '@/types';

export class CSVExporter {
  /**
   * 导出单个考试结果为CSV
   */
  static exportExamResult(result: ExamResult): string {
    const { session, correctAnswers, incorrectAnswers, percentage, categoryBreakdown } = result;
    
    let csvContent = 'Exam Result Report\n\n';
    
    // 基本信息
    csvContent += 'Basic Information\n';
    csvContent += 'Field,Value\n';
    csvContent += `Student Name,${session.userName}\n`;
    csvContent += `Exam ID,${session.id}\n`;
    csvContent += `Start Time,${new Date(session.startTime).toLocaleString()}\n`;
    csvContent += `End Time,${session.endTime ? new Date(session.endTime).toLocaleString() : 'N/A'}\n`;
    csvContent += `Duration,${session.duration ? `${session.duration} minutes` : 'N/A'}\n`;
    csvContent += `Total Questions,${session.totalQuestions}\n`;
    csvContent += `Correct Answers,${correctAnswers}\n`;
    csvContent += `Incorrect Answers,${incorrectAnswers}\n`;
    csvContent += `Score,${percentage.toFixed(1)}%\n`;
    csvContent += '\n';
    
    // 分类统计
    if (categoryBreakdown && Object.keys(categoryBreakdown).length > 0) {
      csvContent += 'Category Breakdown\n';
      csvContent += 'Category,Correct,Total,Percentage\n';
      Object.entries(categoryBreakdown).forEach(([category, stats]) => {
        csvContent += `${category},${stats.correct},${stats.total},${stats.percentage.toFixed(1)}%\n`;
      });
      csvContent += '\n';
    }
    
    // 详细题目信息
    csvContent += 'Question Details\n';
    csvContent += 'Question,Type,Category,Difficulty,Your Answer,Correct Answer,Result\n';
    
    session.questions.forEach((question, index) => {
      const userAnswer = session.answers[index];
      let isCorrect = false;
      
      if (question.type === 'multiple') {
        const correctAnswers = question.correctAnswer as number[];
        const userAnswers = userAnswer as number[] || [];
        const sortedCorrect = [...correctAnswers].sort();
        const sortedUser = [...userAnswers].sort();
        isCorrect = sortedCorrect.length === sortedUser.length && 
                   sortedCorrect.every((val, i) => val === sortedUser[i]);
      } else {
        isCorrect = userAnswer === question.correctAnswer;
      }
      
      const formatAnswer = (answer: any) => {
        if (Array.isArray(answer)) {
          return answer.map(idx => {
            return question.options[idx] || `Option ${idx + 1}`;
          }).join('; ');
        } else if (typeof answer === 'number') {
          return question.options[answer] || `Option ${answer + 1}`;
        }
        return answer || 'No Answer';
      };
      
      const userAnswerText = formatAnswer(userAnswer);
      const correctAnswerText = formatAnswer(question.correctAnswer);
      
      csvContent += `"${question.question.replace(/"/g, '""')}",${question.type || 'single'},${question.category || 'N/A'},${question.difficulty || 'N/A'},"${userAnswerText}","${correctAnswerText}",${isCorrect ? 'Correct' : 'Incorrect'}\n`;
    });
    
    return csvContent;
  }
  
  /**
   * 导出多个考试会话的汇总CSV
   */
  static exportSessionSummary(sessions: ExamSession[]): string {
    let csvContent = 'Exam Summary Report\n\n';
    
    // 总体统计
    const totalSessions = sessions.length;
    const averageScore = sessions.reduce((sum, s) => sum + s.score, 0) / totalSessions;
    const averageDuration = sessions.filter(s => s.duration).reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.filter(s => s.duration).length;
    const passingSessions = sessions.filter(s => s.score >= 60).length;
    const passingRate = (passingSessions / totalSessions) * 100;
    
    csvContent += 'Overall Statistics\n';
    csvContent += 'Metric,Value\n';
    csvContent += `Total Sessions,${totalSessions}\n`;
    csvContent += `Average Score,${averageScore.toFixed(1)}%\n`;
    csvContent += `Average Duration,${averageDuration.toFixed(1)} minutes\n`;
    csvContent += `Passing Sessions,${passingSessions}\n`;
    csvContent += `Passing Rate,${passingRate.toFixed(1)}%\n`;
    csvContent += `Generated At,${new Date().toLocaleString()}\n`;
    csvContent += '\n';
    
    // 分数分布
    csvContent += 'Score Distribution\n';
    csvContent += 'Score Range,Count,Percentage\n';
    const excellent = sessions.filter(s => s.score >= 90).length;
    const good = sessions.filter(s => s.score >= 80 && s.score < 90).length;
    const average = sessions.filter(s => s.score >= 70 && s.score < 80).length;
    const pass = sessions.filter(s => s.score >= 60 && s.score < 70).length;
    const fail = sessions.filter(s => s.score < 60).length;
    
    csvContent += `90-100% (Excellent),${excellent},${(excellent / totalSessions * 100).toFixed(1)}%\n`;
    csvContent += `80-89% (Good),${good},${(good / totalSessions * 100).toFixed(1)}%\n`;
    csvContent += `70-79% (Average),${average},${(average / totalSessions * 100).toFixed(1)}%\n`;
    csvContent += `60-69% (Pass),${pass},${(pass / totalSessions * 100).toFixed(1)}%\n`;
    csvContent += `0-59% (Fail),${fail},${(fail / totalSessions * 100).toFixed(1)}%\n`;
    csvContent += '\n';
    
    // 详细记录
    csvContent += 'Detailed Records\n';
    csvContent += 'Student Name,Exam ID,Start Time,End Time,Duration (minutes),Total Questions,Correct Answers,Score (%),Status\n';
    
    sessions.forEach(session => {
      const correctAnswers = Math.round((session.score / 100) * session.totalQuestions);
      csvContent += `${session.userName},${session.id},${new Date(session.startTime).toLocaleString()},${session.endTime ? new Date(session.endTime).toLocaleString() : 'N/A'},${session.duration || 'N/A'},${session.totalQuestions},${correctAnswers},${session.score.toFixed(1)},${session.status}\n`;
    });
    
    return csvContent;
  }
}
