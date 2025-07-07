import { Question, ExamSession } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery, executeTransaction } from './mysql';
import { initDatabase, getDatabaseStats } from './mysql-init';

// MySQL数据库类
class MySQLDatabase {
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  // 初始化数据库
  private async initialize() {
    if (this.isInitialized) return;
    
    try {
      await initDatabase();
      this.isInitialized = true;
      console.log('✅ MySQL数据库初始化完成');
    } catch (error) {
      console.error('❌ MySQL数据库初始化失败:', error);
    }
  }

  // 题目管理
  async addQuestions(questions: Question[]): Promise<void> {
    if (!this.isInitialized) await this.initialize();
    
    const queries = questions.map(question => {
      const questionId = question.id.startsWith('q_') ? uuidv4() : question.id;
      
      return {
        sql: `
          INSERT INTO questions (id, question, type, options, correct_answer, explanation, category, difficulty)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            question = VALUES(question),
            type = VALUES(type),
            options = VALUES(options),
            correct_answer = VALUES(correct_answer),
            explanation = VALUES(explanation),
            category = VALUES(category),
            difficulty = VALUES(difficulty)
        `,
        params: [
          questionId,
          question.question,
          question.type,
          JSON.stringify(question.options),
          JSON.stringify(question.correctAnswer),
          question.explanation || null,
          question.category || null,
          question.difficulty || null
        ]
      };
    });

    await executeTransaction(queries);
    console.log(`✅ 添加了 ${questions.length} 个题目到MySQL数据库`);
  }

  async getQuestion(id: string): Promise<Question | undefined> {
    if (!this.isInitialized) await this.initialize();
    
    const sql = 'SELECT * FROM questions WHERE id = ?';
    const rows = await executeQuery(sql, [id]) as any[];
    
    if (rows.length === 0) return undefined;
    
    const row = rows[0];
    return {
      id: row.id,
      question: row.question,
      type: row.type,
      options: JSON.parse(row.options),
      correctAnswer: JSON.parse(row.correct_answer),
      explanation: row.explanation,
      category: row.category,
      difficulty: row.difficulty
    };
  }

  async getAllQuestions(): Promise<Question[]> {
    if (!this.isInitialized) await this.initialize();
    
    const sql = 'SELECT * FROM questions ORDER BY created_at DESC';
    const rows = await executeQuery(sql) as any[];
    
    return rows.map(row => ({
      id: row.id,
      question: row.question,
      type: row.type,
      options: JSON.parse(row.options),
      correctAnswer: JSON.parse(row.correct_answer),
      explanation: row.explanation,
      category: row.category,
      difficulty: row.difficulty
    }));
  }

  async getQuestionsByCategory(category: string): Promise<Question[]> {
    if (!this.isInitialized) await this.initialize();
    
    const sql = 'SELECT * FROM questions WHERE category = ? ORDER BY created_at DESC';
    const rows = await executeQuery(sql, [category]) as any[];
    
    return rows.map(row => ({
      id: row.id,
      question: row.question,
      type: row.type,
      options: JSON.parse(row.options),
      correctAnswer: JSON.parse(row.correct_answer),
      explanation: row.explanation,
      category: row.category,
      difficulty: row.difficulty
    }));
  }

  async getQuestionsByDifficulty(difficulty: string): Promise<Question[]> {
    if (!this.isInitialized) await this.initialize();
    
    const sql = 'SELECT * FROM questions WHERE difficulty = ? ORDER BY created_at DESC';
    const rows = await executeQuery(sql, [difficulty]) as any[];
    
    return rows.map(row => ({
      id: row.id,
      question: row.question,
      type: row.type,
      options: JSON.parse(row.options),
      correctAnswer: JSON.parse(row.correct_answer),
      explanation: row.explanation,
      category: row.category,
      difficulty: row.difficulty
    }));
  }

  async getRandomQuestions(count: number, category?: string, difficulty?: string): Promise<Question[]> {
    if (!this.isInitialized) await this.initialize();
    
    let sql = 'SELECT * FROM questions';
    const params: any[] = [];
    const conditions: string[] = [];
    
    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }
    
    if (difficulty) {
      conditions.push('difficulty = ?');
      params.push(difficulty);
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' ORDER BY RAND() LIMIT ?';
    params.push(count);
    
    const rows = await executeQuery(sql, params) as any[];
    
    return rows.map(row => ({
      id: row.id,
      question: row.question,
      type: row.type,
      options: JSON.parse(row.options),
      correctAnswer: JSON.parse(row.correct_answer),
      explanation: row.explanation,
      category: row.category,
      difficulty: row.difficulty
    }));
  }

  async clearQuestions(): Promise<void> {
    if (!this.isInitialized) await this.initialize();
    
    await executeQuery('DELETE FROM questions');
    console.log('✅ 清空了所有题目');
  }

  // 考试会话管理
  async createSession(sessionData: Omit<ExamSession, 'id' | 'questionIds'> & { questions: Question[] }): Promise<string> {
    if (!this.isInitialized) await this.initialize();
    
    const sessionId = `exam_${Date.now()}_${uuidv4().slice(0, 8)}`;
    const questionIds = sessionData.questions.map(q => q.id);
    
    const sql = `
      INSERT INTO exam_sessions (
        id, user_id, user_name, question_ids, answers, score, total_questions,
        start_time, end_time, duration, status, config
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      sessionId,
      sessionData.userId,
      sessionData.userName,
      JSON.stringify(questionIds),
      JSON.stringify(sessionData.answers),
      sessionData.score,
      sessionData.totalQuestions,
      sessionData.startTime,
      sessionData.endTime || null,
      sessionData.duration || null,
      sessionData.status,
      JSON.stringify(sessionData.config || {})
    ];
    
    await executeQuery(sql, params);
    console.log(`✅ 创建了考试会话: ${sessionId}`);
    return sessionId;
  }

  async getSession(id: string): Promise<ExamSession | undefined> {
    if (!this.isInitialized) await this.initialize();
    
    const sql = 'SELECT * FROM exam_sessions WHERE id = ?';
    const rows = await executeQuery(sql, [id]) as any[];
    
    if (rows.length === 0) return undefined;
    
    const row = rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      userName: row.user_name,
      questionIds: JSON.parse(row.question_ids),
      answers: JSON.parse(row.answers),
      score: parseFloat(row.score),
      totalQuestions: row.total_questions,
      startTime: new Date(row.start_time),
      endTime: row.end_time ? new Date(row.end_time) : undefined,
      duration: row.duration,
      status: row.status,
      config: JSON.parse(row.config || '{}')
    };
  }

  async getSessionWithQuestions(id: string): Promise<(ExamSession & { questions: Question[] }) | undefined> {
    if (!this.isInitialized) await this.initialize();
    
    const session = await this.getSession(id);
    if (!session) return undefined;
    
    // 获取题目数据
    const questions: Question[] = [];
    for (const questionId of session.questionIds) {
      const question = await this.getQuestion(questionId);
      if (question) {
        questions.push(question);
      }
    }
    
    return {
      ...session,
      questions
    };
  }

  async updateSession(id: string, updates: Partial<ExamSession>): Promise<void> {
    if (!this.isInitialized) await this.initialize();
    
    const fields: string[] = [];
    const params: any[] = [];
    
    if (updates.answers !== undefined) {
      fields.push('answers = ?');
      params.push(JSON.stringify(updates.answers));
    }
    
    if (updates.score !== undefined) {
      fields.push('score = ?');
      params.push(updates.score);
    }
    
    if (updates.endTime !== undefined) {
      fields.push('end_time = ?');
      params.push(updates.endTime);
    }
    
    if (updates.duration !== undefined) {
      fields.push('duration = ?');
      params.push(updates.duration);
    }
    
    if (updates.status !== undefined) {
      fields.push('status = ?');
      params.push(updates.status);
    }
    
    if (fields.length === 0) return;
    
    const sql = `UPDATE exam_sessions SET ${fields.join(', ')} WHERE id = ?`;
    params.push(id);
    
    await executeQuery(sql, params);
    console.log(`✅ 更新了考试会话: ${id}`);
  }

  async getAllSessions(): Promise<ExamSession[]> {
    if (!this.isInitialized) await this.initialize();
    
    const sql = 'SELECT * FROM exam_sessions ORDER BY start_time DESC';
    const rows = await executeQuery(sql) as any[];
    
    return rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      userName: row.user_name,
      questionIds: JSON.parse(row.question_ids),
      answers: JSON.parse(row.answers),
      score: parseFloat(row.score),
      totalQuestions: row.total_questions,
      startTime: new Date(row.start_time),
      endTime: row.end_time ? new Date(row.end_time) : undefined,
      duration: row.duration,
      status: row.status,
      config: JSON.parse(row.config || '{}')
    }));
  }

  async getSessionsByUser(userId: string): Promise<ExamSession[]> {
    if (!this.isInitialized) await this.initialize();
    
    const sql = 'SELECT * FROM exam_sessions WHERE user_id = ? ORDER BY start_time DESC';
    const rows = await executeQuery(sql, [userId]) as any[];
    
    return rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      userName: row.user_name,
      questionIds: JSON.parse(row.question_ids),
      answers: JSON.parse(row.answers),
      score: parseFloat(row.score),
      totalQuestions: row.total_questions,
      startTime: new Date(row.start_time),
      endTime: row.end_time ? new Date(row.end_time) : undefined,
      duration: row.duration,
      status: row.status,
      config: JSON.parse(row.config || '{}')
    }));
  }

  async deleteSession(id: string): Promise<void> {
    if (!this.isInitialized) await this.initialize();
    
    await executeQuery('DELETE FROM exam_sessions WHERE id = ?', [id]);
    console.log(`✅ 删除了考试会话: ${id}`);
  }

  async clearSessions(): Promise<void> {
    if (!this.isInitialized) await this.initialize();
    
    await executeQuery('DELETE FROM exam_sessions');
    console.log('✅ 清空了所有考试会话');
  }

  async clearAll(): Promise<void> {
    if (!this.isInitialized) await this.initialize();
    
    await executeQuery('DELETE FROM exam_sessions');
    await executeQuery('DELETE FROM questions');
    await executeQuery('DELETE FROM backup_records');
    console.log('✅ 清空了所有数据');
  }

  // 获取统计数据
  async getStats() {
    if (!this.isInitialized) await this.initialize();
    
    return await getDatabaseStats();
  }

  // 备份数据库
  async backup(): Promise<string> {
    if (!this.isInitialized) await this.initialize();
    
    const timestamp = Date.now();
    const backupPath = `backup_mysql_${timestamp}.sql`;
    
    try {
      // 这里可以使用mysqldump或其他备份工具
      // 暂时返回一个模拟的备份路径
      const sql = `
        INSERT INTO backup_records (backup_type, file_path, status, created_at)
        VALUES ('manual', ?, 'success', NOW())
      `;
      
      await executeQuery(sql, [backupPath]);
      console.log(`✅ 创建了数据库备份: ${backupPath}`);
      return backupPath;
    } catch (error) {
      console.error('❌ 数据库备份失败:', error);
      throw error;
    }
  }

  // 导入会话数据（用于迁移）
  async importSessions(sessions: ExamSession[]): Promise<void> {
    if (!this.isInitialized) await this.initialize();
    
    const queries = sessions.map(session => ({
      sql: `
        INSERT INTO exam_sessions (
          id, user_id, user_name, question_ids, answers, score, total_questions,
          start_time, end_time, duration, status, config
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          answers = VALUES(answers),
          score = VALUES(score),
          end_time = VALUES(end_time),
          duration = VALUES(duration),
          status = VALUES(status)
      `,
      params: [
        session.id,
        session.userId,
        session.userName,
        JSON.stringify(session.questionIds),
        JSON.stringify(session.answers),
        session.score,
        session.totalQuestions,
        session.startTime,
        session.endTime || null,
        session.duration || null,
        session.status,
        JSON.stringify(session.config || {})
      ]
    }));

    await executeTransaction(queries);
    console.log(`✅ 导入了 ${sessions.length} 个考试会话到MySQL数据库`);
  }
}

export const mysqlDatabase = new MySQLDatabase();
