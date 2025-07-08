export interface Question {
  id: string; // 使用UUID
  question: string;
  type: 'single' | 'multiple'; // 单选或多选
  options: string[];
  correctAnswer: number | number[]; // 单选用number，多选用number[]
  explanation?: string;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

// 精简的考试会话，只存储题目ID引用
export interface ExamSession {
  id: string;
  userId: string;
  userName: string;
  questionIds: string[]; // 只存储题目ID数组，而不是完整的题目数据
  answers: (number | number[])[]; // 支持单选(number)和多选(number[])
  score: number;
  totalQuestions: number;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in minutes
  durationInSeconds?: number; // in seconds, more precise
  status: 'in-progress' | 'completed' | 'expired';
  // 可选：存储考试配置
  config?: {
    category?: string;
    difficulty?: string;
    timeLimit?: number;
    templateId?: string;
  };
}

export interface ExamResult {
  session: ExamSession;
  correctAnswers: number;
  incorrectAnswers: number;
  percentage: number;
  categoryBreakdown?: {
    [category: string]: {
      correct: number;
      total: number;
      percentage: number;
    };
  };
}

export interface ExamConfig {
  totalQuestions: number;
  timeLimit?: number; // in minutes
  categories?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
}

// 考试类型配置（由管理员配置）
export interface ExamTemplate {
  id: string;
  name: string;
  description: string;
  totalQuestions: number;
  timeLimit: number; // in minutes
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  icon?: string;
  color?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
