import { Question, ExamSession } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

// 优化的数据存储接口
interface OptimizedDatabaseData {
  questions: { [id: string]: Question }; // 使用键值对存储题目
  sessions: { [id: string]: ExamSession }; // 使用键值对存储会话
  metadata: {
    totalQuestions: number;
    totalSessions: number;
    categories: string[];
    difficulties: string[];
    lastUpdated: string;
  };
}

// 优化的持久化数据库
class OptimizedDatabase {
  private questions: { [id: string]: Question } = {};
  private sessions: { [id: string]: ExamSession } = {};
  private metadata = {
    totalQuestions: 0,
    totalSessions: 0,
    categories: [] as string[],
    difficulties: [] as string[],
    lastUpdated: new Date().toISOString()
  };
  
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
        const parsed: OptimizedDatabaseData = JSON.parse(data);
        
        this.questions = parsed.questions || {};
        this.sessions = this.processSessions(parsed.sessions || {});
        this.metadata = parsed.metadata || this.metadata;
        
        console.log(`优化数据库加载成功: ${Object.keys(this.questions).length} 题目, ${Object.keys(this.sessions).length} 考试记录`);
      } else {
        console.log('优化数据库文件不存在，使用空数据库');
      }
    } catch (error) {
      console.error('优化数据库加载失败:', error);
      this.questions = {};
      this.sessions = {};
    }
    
    this.isInitialized = true;
  }

  // 处理加载的会话数据，确保日期类型正确
  private processSessions(sessions: { [id: string]: ExamSession }): { [id: string]: ExamSession } {
    const processedSessions: { [id: string]: ExamSession } = {};
    
    for (const [id, session] of Object.entries(sessions)) {
      processedSessions[id] = {
        ...session,
        startTime: session.startTime instanceof Date ? session.startTime : new Date(session.startTime),
        endTime: session.endTime ? 
          (session.endTime instanceof Date ? session.endTime : new Date(session.endTime)) : 
          undefined
      };
    }
    
    return processedSessions;
  }

  // 保存数据到文件
  private saveData() {
    try {
      const data: OptimizedDatabaseData = {
        questions: this.questions,
        sessions: this.sessions,
        metadata: {
          ...this.metadata,
          totalQuestions: Object.keys(this.questions).length,
          totalSessions: Object.keys(this.sessions).length,
          lastUpdated: new Date().toISOString()
        }
      };
      
      fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2), 'utf-8');
      console.log('优化数据库保存成功');
    } catch (error) {
      console.error('优化数据库保存失败:', error);
    }
  }

  // 更新元数据
  private updateMetadata() {
    const categories = new Set<string>();
    const difficulties = new Set<string>();
    
    Object.values(this.questions).forEach(q => {
      if (q.category) categories.add(q.category);
      if (q.difficulty) difficulties.add(q.difficulty);
    });
    
    this.metadata = {
      totalQuestions: Object.keys(this.questions).length,
      totalSessions: Object.keys(this.sessions).length,
      categories: Array.from(categories),
      difficulties: Array.from(difficulties),
      lastUpdated: new Date().toISOString()
    };
  }

  // 题目管理
  addQuestions(questions: Question[]) {
    questions.forEach(question => {
      // 为每个题目生成UUID（如果还没有的话）
      const questionId = question.id.startsWith('q_') ? uuidv4() : question.id;
      this.questions[questionId] = {
        ...question,
        id: questionId
      };
    });
    
    this.updateMetadata();
    this.saveData();
  }

  // 添加单个题目
  addQuestion(question: Question) {
    const questionId = question.id.startsWith('q_') ? uuidv4() : question.id;
    this.questions[questionId] = {
      ...question,
      id: questionId
    };
    
    this.updateMetadata();
    this.saveData();
  }

  // 更新题目
  updateQuestion(id: string, updates: Partial<Question>) {
    if (this.questions[id]) {
      this.questions[id] = { ...this.questions[id], ...updates };
      this.updateMetadata();
      this.saveData();
      return true;
    }
    return false;
  }

  // 删除题目
  deleteQuestion(id: string) {
    if (this.questions[id]) {
      delete this.questions[id];
      this.updateMetadata();
      this.saveData();
      return true;
    }
    return false;
  }

  // 通过ID获取题目（兼容旧方法名）
  getQuestionById(id: string): Question | undefined {
    return this.questions[id];
  }

  getQuestion(id: string): Question | undefined {
    return this.questions[id];
  }

  getAllQuestions(): Question[] {
    return Object.values(this.questions);
  }

  getQuestionsByCategory(category: string): Question[] {
    return Object.values(this.questions).filter(q => q.category === category);
  }

  getQuestionsByDifficulty(difficulty: string): Question[] {
    return Object.values(this.questions).filter(q => q.difficulty === difficulty);
  }

  getRandomQuestions(count: number, category?: string, difficulty?: string): Question[] {
    let filteredQuestions = Object.values(this.questions);
    
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
    this.questions = {};
    this.updateMetadata();
    this.saveData();
  }

  // 考试会话管理
  createSession(sessionData: Omit<ExamSession, 'id' | 'questionIds'> & { questions: Question[] }): string {
    const sessionId = `exam_${Date.now()}_${uuidv4().slice(0, 8)}`;
    
    // 提取题目ID
    const questionIds = sessionData.questions.map(q => q.id);
    
    const session: ExamSession = {
      id: sessionId,
      userId: sessionData.userId,
      userName: sessionData.userName,
      questionIds, // 只存储题目ID
      answers: sessionData.answers,
      score: sessionData.score,
      totalQuestions: sessionData.totalQuestions,
      startTime: sessionData.startTime,
      endTime: sessionData.endTime,
      duration: sessionData.duration,
      status: sessionData.status,
      config: sessionData.config
    };
    
    this.sessions[sessionId] = session;
    this.updateMetadata();
    this.saveData();
    return sessionId;
  }

  getSession(id: string): ExamSession | undefined {
    return this.sessions[id];
  }

  // 获取会话的完整题目数据
  getSessionWithQuestions(id: string): (ExamSession & { questions: Question[] }) | undefined {
    const session = this.sessions[id];
    if (!session) return undefined;
    
    const questions = session.questionIds.map(qId => this.questions[qId]).filter(Boolean);
    
    return {
      ...session,
      questions
    };
  }

  updateSession(id: string, updates: Partial<ExamSession>) {
    if (this.sessions[id]) {
      this.sessions[id] = { ...this.sessions[id], ...updates };
      this.updateMetadata();
      this.saveData();
    }
  }

  getAllSessions(): ExamSession[] {
    return Object.values(this.sessions);
  }

  getSessionsByUser(userId: string): ExamSession[] {
    return Object.values(this.sessions).filter(s => s.userId === userId);
  }

  deleteSession(id: string) {
    delete this.sessions[id];
    this.updateMetadata();
    this.saveData();
  }

  // 清空会话记录
  clearSessions() {
    this.sessions = {};
    this.updateMetadata();
    this.saveData();
  }

  // 清空所有数据
  clearAll() {
    this.questions = {};
    this.sessions = {};
    this.updateMetadata();
    this.saveData();
  }

  // 获取统计数据
  getStats() {
    const completedSessions = Object.values(this.sessions).filter(s => s.status === 'completed').length;
    
    return {
      totalQuestions: Object.keys(this.questions).length,
      totalSessions: Object.keys(this.sessions).length,
      completedSessions,
      categories: this.metadata.categories,
      difficulties: this.metadata.difficulties,
      lastUpdated: this.metadata.lastUpdated
    };
  }

  // 获取数据库大小信息
  getSize(): { questions: number; sessions: number; fileSize: string; spaceSaved: string } {
    let fileSize = '0 B';
    let spaceSaved = '0 B';
    
    try {
      if (fs.existsSync(this.dataFile)) {
        const stats = fs.statSync(this.dataFile);
        const bytes = stats.size;
        fileSize = this.formatBytes(bytes);
        
        // 估算空间节省（假设原始方式会重复存储题目）
        const avgSessionQuestions = Object.values(this.sessions).reduce((acc, s) => acc + s.totalQuestions, 0) / Object.keys(this.sessions).length || 0;
        const estimatedOriginalSize = bytes * (1 + avgSessionQuestions * 0.1); // 粗略估算
        spaceSaved = this.formatBytes(estimatedOriginalSize - bytes);
      }
    } catch (error) {
      console.error('获取文件大小失败:', error);
    }

    return {
      questions: Object.keys(this.questions).length,
      sessions: Object.keys(this.sessions).length,
      fileSize,
      spaceSaved
    };
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
  }

  // 数据库管理方法
  backup(): string {
    const backupFile = path.join(path.dirname(this.dataFile), `backup_optimized_${Date.now()}.json`);
    try {
      if (!fs.existsSync(this.dataFile)) {
        // 创建空的数据库文件
        this.saveData();
      }
      fs.copyFileSync(this.dataFile, backupFile);
      console.log('优化数据库备份创建成功:', backupFile);
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
        // 重新初始化以加载恢复的数据
        this.isInitialized = false;
        this.loadData();
        console.log('优化数据库恢复成功');
      } else {
        throw new Error('备份文件不存在');
      }
    } catch (error) {
      console.error('恢复失败:', error);
      throw error;
    }
  }

  // 数据迁移方法：从旧数据库迁移到优化数据库
  migrateFromOldDatabase(oldDatabase: any) {
    console.log('开始数据迁移...');
    
    // 迁移题目数据
    const oldQuestions = oldDatabase.getAllQuestions();
    this.addQuestions(oldQuestions);
    
    // 迁移会话数据
    const oldSessions = oldDatabase.getAllSessions();
    oldSessions.forEach((oldSession: any) => {
      const sessionId = oldSession.id;
      const questionIds = oldSession.questions.map((q: Question) => q.id);
      
      const newSession: ExamSession = {
        id: sessionId,
        userId: oldSession.userId,
        userName: oldSession.userName,
        questionIds,
        answers: oldSession.answers,
        score: oldSession.score,
        totalQuestions: oldSession.totalQuestions,
        startTime: oldSession.startTime instanceof Date ? oldSession.startTime : new Date(oldSession.startTime),
        endTime: oldSession.endTime ? 
          (oldSession.endTime instanceof Date ? oldSession.endTime : new Date(oldSession.endTime)) : 
          undefined,
        duration: oldSession.duration,
        status: oldSession.status
      };
      
      this.sessions[sessionId] = newSession;
    });
    
    this.updateMetadata();
    this.saveData();
    
    console.log(`数据迁移完成: ${Object.keys(this.questions).length} 题目, ${Object.keys(this.sessions).length} 会话`);
  }

  // 导入会话数据（用于迁移）
  importSession(session: ExamSession) {
    this.sessions[session.id] = session;
  }

  // 批量导入会话数据
  importSessions(sessions: ExamSession[]) {
    sessions.forEach(session => {
      this.sessions[session.id] = session;
    });
    this.updateMetadata();
    this.saveData();
  }
}

export const database = new OptimizedDatabase();
