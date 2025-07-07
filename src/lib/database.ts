import { Question, ExamSession } from '@/types';
import fs from 'fs';
import path from 'path';

// 数据存储接口
interface DatabaseData {
  questions: Question[];
  sessions: ExamSession[];
}

// 持久化数据库存储
class PersistentDatabase {
  private questions: Question[] = [];
  private sessions: ExamSession[] = [];
  private dataFile: string;
  private isInitialized = false;

  constructor() {
    // 确保数据目录存在
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    this.dataFile = path.join(dataDir, 'database.json');
    this.loadData();
  }

  // 从文件加载数据
  private loadData() {
    if (this.isInitialized) return;
    
    try {
      if (fs.existsSync(this.dataFile)) {
        const data = fs.readFileSync(this.dataFile, 'utf-8');
        const parsed: DatabaseData = JSON.parse(data);
        this.questions = parsed.questions || [];
        this.sessions = (parsed.sessions || []).map(session => ({
          ...session,
          // 确保日期字段为Date对象
          startTime: session.startTime instanceof Date ? session.startTime : new Date(session.startTime),
          endTime: session.endTime ? 
            (session.endTime instanceof Date ? session.endTime : new Date(session.endTime)) : 
            undefined
        }));
        console.log(`数据库加载成功: ${this.questions.length} 题目, ${this.sessions.length} 考试记录`);
      } else {
        console.log('数据库文件不存在，使用空数据库');
      }
    } catch (error) {
      console.error('数据库加载失败:', error);
      this.questions = [];
      this.sessions = [];
    }
    
    this.isInitialized = true;
  }

  // 保存数据到文件
  private saveData() {
    try {
      const data: DatabaseData = {
        questions: this.questions,
        sessions: this.sessions
      };
      
      fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2), 'utf-8');
      console.log('数据库保存成功');
    } catch (error) {
      console.error('数据库保存失败:', error);
    }
  }

  // 题目管理
  addQuestions(questions: Question[]) {
    this.questions = [...this.questions, ...questions];
    this.saveData();
  }

  getAllQuestions(): Question[] {
    return this.questions;
  }

  getQuestionsByCategory(category: string): Question[] {
    return this.questions.filter(q => q.category === category);
  }

  getQuestionsByDifficulty(difficulty: string): Question[] {
    return this.questions.filter(q => q.difficulty === difficulty);
  }

  getRandomQuestions(count: number, category?: string, difficulty?: string): Question[] {
    let filteredQuestions = this.questions;
    
    if (category) {
      filteredQuestions = filteredQuestions.filter(q => q.category === category);
    }
    
    if (difficulty) {
      filteredQuestions = filteredQuestions.filter(q => q.difficulty === difficulty);
    }

    // 随机打乱题目顺序
    const shuffled = [...filteredQuestions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  clearQuestions() {
    this.questions = [];
    this.saveData();
  }

  // 清空所有会话记录
  clearSessions() {
    this.sessions = [];
    this.saveData();
  }

  // 清空所有数据
  clearAll() {
    this.questions = [];
    this.sessions = [];
    this.saveData();
  }

  // 考试会话管理
  createSession(session: ExamSession): string {
    this.sessions.push(session);
    this.saveData();
    return session.id;
  }

  getSession(id: string): ExamSession | undefined {
    return this.sessions.find(s => s.id === id);
  }

  updateSession(id: string, updates: Partial<ExamSession>) {
    const sessionIndex = this.sessions.findIndex(s => s.id === id);
    if (sessionIndex !== -1) {
      this.sessions[sessionIndex] = { ...this.sessions[sessionIndex], ...updates };
      this.saveData();
    }
  }

  getAllSessions(): ExamSession[] {
    return this.sessions;
  }

  getSessionsByUser(userId: string): ExamSession[] {
    return this.sessions.filter(s => s.userId === userId);
  }

  deleteSession(id: string) {
    this.sessions = this.sessions.filter(s => s.id !== id);
    this.saveData();
  }

  // 获取统计数据
  getStats() {
    return {
      totalQuestions: this.questions.length,
      totalSessions: this.sessions.length,
      completedSessions: this.sessions.filter(s => s.status === 'completed').length,
      categories: Array.from(new Set(this.questions.map(q => q.category).filter(Boolean))),
      difficulties: Array.from(new Set(this.questions.map(q => q.difficulty).filter(Boolean)))
    };
  }

  // 数据库管理方法
  backup(): string {
    const backupFile = path.join(path.dirname(this.dataFile), `backup_${Date.now()}.json`);
    try {
      if (!fs.existsSync(this.dataFile)) {
        throw new Error('数据库文件不存在，无法创建备份');
      }
      fs.copyFileSync(this.dataFile, backupFile);
      console.log('备份创建成功:', backupFile);
      return backupFile;
    } catch (error) {
      console.error('备份失败:', error);
      throw error;
    }
  }

  restore(backupFile: string) {
    try {
      if (fs.existsSync(backupFile)) {
        fs.copyFileSync(backupFile, this.dataFile);
        this.loadData();
        console.log('数据库恢复成功');
      } else {
        throw new Error('备份文件不存在');
      }
    } catch (error) {
      console.error('恢复失败:', error);
      throw error;
    }
  }

  // 获取数据库大小
  getSize(): { questions: number; sessions: number; fileSize: string } {
    let fileSize = '0 B';
    try {
      if (fs.existsSync(this.dataFile)) {
        const stats = fs.statSync(this.dataFile);
        const bytes = stats.size;
        if (bytes === 0) {
          fileSize = '0 B';
        } else {
          const k = 1024;
          const sizes = ['B', 'KB', 'MB', 'GB'];
          const i = Math.floor(Math.log(bytes) / Math.log(k));
          fileSize = (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
        }
      }
    } catch (error) {
      console.error('获取文件大小失败:', error);
    }

    return {
      questions: this.questions.length,
      sessions: this.sessions.length,
      fileSize
    };
  }
}

export const database = new PersistentDatabase();
