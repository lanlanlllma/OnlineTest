import jsPDF from 'jspdf';
import { ExamResult, ExamSession, Question } from '@/types';
import { database } from '@/lib/database';

export class PDFExporter {
  static async exportExamResult(result: ExamResult): Promise<Buffer> {
    const pdf = new jsPDF();
    const { session, correctAnswers, incorrectAnswers, percentage } = result;
    
    // 使用默认字体避免中文乱码
    pdf.setFont('helvetica');
    
    // 标题 - 使用英文
    pdf.setFontSize(20);
    pdf.text('Online Exam Result Report', 20, 20);
    
    // 基本信息 - 使用英文标签
    pdf.setFontSize(12);
    let yPosition = 40;
    
    pdf.text(`Student Name: ${session.userName}`, 20, yPosition);
    yPosition += 10;
    
    pdf.text(`Start Time: ${new Date(session.startTime).toLocaleString('en-US')}`, 20, yPosition);
    yPosition += 10;
    
    if (session.endTime) {
      pdf.text(`End Time: ${new Date(session.endTime).toLocaleString('en-US')}`, 20, yPosition);
      yPosition += 10;
    }
    
    if (session.duration) {
      pdf.text(`Duration: ${session.duration} minutes`, 20, yPosition);
      yPosition += 10;
    }
    
    yPosition += 10;
    
    // 成绩统计 - 使用英文标签
    pdf.setFontSize(16);
    pdf.text('Score Summary', 20, yPosition);
    yPosition += 15;
    
    pdf.setFontSize(12);
    pdf.text(`Total Questions: ${session.totalQuestions}`, 20, yPosition);
    yPosition += 10;
    
    pdf.text(`Correct Answers: ${correctAnswers}`, 20, yPosition);
    yPosition += 10;
    
    pdf.text(`Wrong Answers: ${incorrectAnswers}`, 20, yPosition);
    yPosition += 10;
    
    pdf.text(`Accuracy Rate: ${percentage.toFixed(2)}%`, 20, yPosition);
    yPosition += 10;
    
    pdf.text(`Status: ${session.status === 'completed' ? 'Completed' : 'In Progress'}`, 20, yPosition);
    yPosition += 20;
    
    // 分类统计 - 使用英文标签
    if (result.categoryBreakdown) {
      pdf.setFontSize(16);
      pdf.text('Category Statistics', 20, yPosition);
      yPosition += 15;
      
      pdf.setFontSize(12);
      Object.entries(result.categoryBreakdown).forEach(([category, stats]) => {
        pdf.text(`${category}: ${stats.correct}/${stats.total} (${stats.percentage.toFixed(2)}%)`, 20, yPosition);
        yPosition += 10;
      });
      
      yPosition += 10;
    }
    
    // 详细答题情况 - 使用英文标签
    if (yPosition > 250) {
      pdf.addPage();
      yPosition = 20;
    }
    
    pdf.setFontSize(16);
    pdf.text('Detailed Answer Records', 20, yPosition);
    yPosition += 15;
    
    pdf.setFontSize(10);
    // 根据questionIds获取题目
    const questions = session.questionIds.map(id => database.getQuestionById(id)).filter(q => q !== undefined) as Question[];
    
    questions.forEach((question, index) => {
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }
      
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
      
      const typeLabel = question.type === 'multiple' ? 'Multiple Choice' : 'Single Choice';
      pdf.text(`${index + 1}. [${typeLabel}] ${question.question}`, 20, yPosition);
      yPosition += 8;
      
      question.options.forEach((option, optionIndex) => {
        // 过滤掉空白或BLANK的选项
        if (!option || option.trim() === '' || option.trim().toLowerCase() === 'blank') {
          return;
        }
        
        const prefix = String.fromCharCode(65 + optionIndex); // A, B, C, D
        let text = `   ${prefix}. ${option}`;
        
        // 判断是否是正确答案
        const correctAnswerArray = Array.isArray(question.correctAnswer) 
          ? question.correctAnswer 
          : [question.correctAnswer];
        const userAnswerArray = Array.isArray(userAnswer) 
          ? userAnswer 
          : [userAnswer];
        
        const isCorrectOption = correctAnswerArray.includes(optionIndex);
        const isUserOption = userAnswerArray.includes(optionIndex);
        
        if (isCorrectOption) {
          text += ' (Correct Answer)';
        }
        
        if (isUserOption) {
          text += isCorrect ? ' ✓' : ' ✗ (Your Answer)';
        }
        
        pdf.text(text, 20, yPosition);
        yPosition += 6;
      });
      
      if (question.explanation) {
        pdf.text(`   Explanation: ${question.explanation}`, 20, yPosition);
        yPosition += 8;
      }
      
      yPosition += 5;
    });
    
    // 生成PDF并返回Buffer
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));
    return pdfBuffer;
  }
  
  static async exportSessionSummary(sessions: ExamSession[]): Promise<Buffer> {
    const pdf = new jsPDF();
    
    // 标题 - 使用英文
    pdf.setFontSize(20);
    pdf.text('Exam Records Summary', 20, 20);
    
    // 统计信息 - 使用英文标签
    pdf.setFontSize(12);
    let yPosition = 40;
    
    pdf.text(`Total Exams: ${sessions.length}`, 20, yPosition);
    yPosition += 10;
    
    const completedSessions = sessions.filter(s => s.status === 'completed');
    pdf.text(`Completed Exams: ${completedSessions.length}`, 20, yPosition);
    yPosition += 10;
    
    const avgScore = completedSessions.length > 0 
      ? completedSessions.reduce((sum, s) => sum + s.score, 0) / completedSessions.length 
      : 0;
    pdf.text(`Average Score: ${avgScore.toFixed(2)}%`, 20, yPosition);
    yPosition += 20;
    
    // 详细记录 - 使用英文标签
    pdf.setFontSize(14);
    pdf.text('Detailed Records', 20, yPosition);
    yPosition += 15;
    
    pdf.setFontSize(10);
    sessions.forEach((session, index) => {
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.text(`${index + 1}. ${session.userName}`, 20, yPosition);
      yPosition += 8;
      
      pdf.text(`   Start Time: ${new Date(session.startTime).toLocaleString('en-US')}`, 20, yPosition);
      yPosition += 6;
      
      if (session.endTime) {
        pdf.text(`   End Time: ${new Date(session.endTime).toLocaleString('en-US')}`, 20, yPosition);
        yPosition += 6;
      }
      
      pdf.text(`   Score: ${session.score.toFixed(1)}%`, 20, yPosition);
      yPosition += 6;
      
      pdf.text(`   Status: ${session.status}`, 20, yPosition);
      yPosition += 10;
    });
    
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));
    return pdfBuffer;
  }
}
