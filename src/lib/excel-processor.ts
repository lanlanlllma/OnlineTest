import * as XLSX from 'xlsx';
import { Question } from '@/types';

export class ExcelProcessor {
  static parseExcelFile(buffer: Buffer): Question[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const worksheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[worksheetName];
    
    // 转换为JSON数组
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    return this.convertToQuestions(jsonData);
  }

  static convertToQuestions(data: any[]): Question[] {
    return data.map((row, index) => {
      const question: Question = {
        id: `q_${index + 1}`,
        question: row['content'] || row['题目'] || '',
        type: this.mapQuestionType(row['type'] || row['题型'] || '单选'),
        options: [],
        correctAnswer: 0,
        explanation: row['explanation'] || row['解析'] || '',
        category: row['category'] || row['分类'] || '默认分类',
        difficulty: this.mapDifficulty(row['difficulty'] || row['难度'] || 'medium')
      };

      // 解析选项 - 支持choice0-choice5格式
      const options = [];
      for (let i = 0; i <= 5; i++) {
        const optionValue = row[`choice${i}`] || row[`选项${i}`];
        if (optionValue && optionValue.toString().trim()) {
          options.push(optionValue.toString().trim());
        }
      }
      
      // 如果没有choice格式，尝试A-F格式
      if (options.length === 0) {
        const optionKeys = ['A', 'B', 'C', 'D', 'E', 'F'];
        for (let i = 0; i < optionKeys.length; i++) {
          const optionKey = optionKeys[i];
          const optionValue = row[optionKey] || row[`选项${optionKey}`];
          if (optionValue && optionValue.toString().trim()) {
            options.push(optionValue.toString().trim());
          }
        }
      }
      
      question.options = options;

      // 解析正确答案
      const answerValue = row['answer'] || row['正确答案'] || '0';
      question.correctAnswer = this.parseAnswer(answerValue, question.type);

      return question;
    }).filter(q => q.question && q.options.length > 0);
  }

  static mapQuestionType(type: string): 'single' | 'multiple' {
    const typeStr = type.toString().toLowerCase();
    if (typeStr.includes('多选') || typeStr.includes('multiple')) {
      return 'multiple';
    }
    return 'single';
  }

  static parseAnswer(answerValue: any, questionType: 'single' | 'multiple'): number | number[] {
    const answerStr = answerValue.toString().trim();
    
    if (questionType === 'multiple') {
      // 多选题：解析多个答案
      const answers: number[] = [];
      
      // 支持多种格式：
      // "0,1,2" 或 "012" 或 "A,B,C" 等
      if (answerStr.includes(',')) {
        // 逗号分隔
        const parts = answerStr.split(',');
        for (const part of parts) {
          const trimmed = part.trim();
          const num = this.convertAnswerToNumber(trimmed);
          if (num !== -1) {
            answers.push(num);
          }
        }
      } else {
        // 连续数字或字母：如"012"或"ABC"
        for (let i = 0; i < answerStr.length; i++) {
          const char = answerStr[i];
          const num = this.convertAnswerToNumber(char);
          if (num !== -1) {
            answers.push(num);
          }
        }
      }
      
      // 去重并排序
      return [...new Set(answers)].sort();
    } else {
      // 单选题：只有一个答案
      return this.convertAnswerToNumber(answerStr);
    }
  }

  static convertAnswerToNumber(answer: string): number {
    // 数字格式：0,1,2,3,4,5
    if (/^\d$/.test(answer)) {
      const num = parseInt(answer);
      return num >= 0 && num <= 5 ? num : 0;
    }
    
    // 字母格式：A,B,C,D,E,F
    if (/^[A-Fa-f]$/.test(answer)) {
      const upperAnswer = answer.toUpperCase();
      return upperAnswer.charCodeAt(0) - 65; // A=0, B=1, C=2...
    }
    
    return 0; // 默认返回第一个选项
  }

  static mapDifficulty(difficulty: string): 'easy' | 'medium' | 'hard' {
    const difficultyMap: { [key: string]: 'easy' | 'medium' | 'hard' } = {
      '简单': 'easy',
      '容易': 'easy',
      'easy': 'easy',
      '中等': 'medium',
      '中': 'medium',
      'medium': 'medium',
      '困难': 'hard',
      '难': 'hard',
      'hard': 'hard'
    };
    
    return difficultyMap[difficulty.toString().toLowerCase()] || 'medium';
  }

  static generateSampleExcel(): Buffer {
    const sampleData = [
      {
        'content': '以下哪个是JavaScript的基本数据类型？',
        'type': 'single',
        'choice0': 'string',
        'choice1': 'array', 
        'choice2': 'object',
        'choice3': 'function',
        'choice4': 'BLANK',
        'choice5': '',
        'answer': '0',
        'explanation': 'string是JavaScript的基本数据类型之一',
        'category': 'JavaScript基础',
        'difficulty': '简单'
      },
      {
        'content': '在React中，以下哪些Hook用于管理副作用？',
        'type': 'multiple',
        'choice0': 'useEffect',
        'choice1': 'useState',
        'choice2': 'useLayoutEffect', 
        'choice3': 'useContext',
        'choice4': 'useCallback',
        'choice5': 'BLANK',
        'answer': '0,2',
        'explanation': 'useEffect和useLayoutEffect都用于处理副作用',
        'category': 'React',
        'difficulty': '中等'
      },
      {
        'content': 'CSS中哪些属性可以用于设置元素的定位？',
        'type': 'multiple',
        'choice0': 'position',
        'choice1': 'top',
        'choice2': 'left',
        'choice3': '',
        'choice4': '',
        'choice5': '',
        'answer': '012',
        'explanation': 'position、top、left都是CSS定位相关属性',
        'category': 'CSS',
        'difficulty': '简单'
      },
      {
        'content': 'Node.js的事件循环机制中包含哪些阶段？',
        'type': 'multiple',
        'choice0': 'timers',
        'choice1': 'pending callbacks',
        'choice2': 'poll',
        'choice3': 'check',
        'choice4': 'close callbacks',
        'choice5': 'BLANK',
        'answer': '01234',
        'explanation': '事件循环包含多个阶段，每个阶段都有特定的任务',
        'category': 'Node.js',
        'difficulty': '困难'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '题目');
    
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}
