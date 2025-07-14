import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';
import { Question } from '@/types';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'exam-system-secret-key-2025';

// 验证管理员权限
function verifyAdmin(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return false;
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded.role === 'admin';
  } catch (error) {
    console.error('JWT verification failed:', error);
    return false;
  }
}

// 获取所有题目列表
export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: '需要管理员权限' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    const search = searchParams.get('search');

    let questions = database.getAllQuestions();

    // 过滤条件
    if (category) {
      questions = questions.filter(q => q.category === category);
    }
    if (difficulty) {
      questions = questions.filter(q => q.difficulty === difficulty);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      questions = questions.filter(q => 
        q.question.toLowerCase().includes(searchLower) ||
        q.options.some(opt => opt.toLowerCase().includes(searchLower))
      );
    }

    // 分页
    const total = questions.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedQuestions = questions.slice(startIndex, endIndex);

    return NextResponse.json({
      questions: paginatedQuestions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取题目列表失败:', error);
    return NextResponse.json({ error: '获取题目列表失败' }, { status: 500 });
  }
}

// 创建新题目
export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: '需要管理员权限' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { question, type, options, correctAnswer, explanation, category, difficulty } = body;

    // 验证必填字段
    if (!question || !type || !options || options.length < 2) {
      return NextResponse.json({ error: '请填写完整的题目信息' }, { status: 400 });
    }

    // 生成题目ID
    const questionId = `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newQuestion: Question = {
      id: questionId,
      question: question.trim(),
      type: type,
      options: options.filter((opt: string) => opt && opt.trim()),
      correctAnswer,
      explanation: explanation?.trim() || '',
      category: category?.trim() || '默认分类',
      difficulty: difficulty || 'medium'
    };

    database.addQuestion(newQuestion);

    return NextResponse.json({
      message: '题目创建成功',
      question: newQuestion
    });
  } catch (error) {
    console.error('创建题目失败:', error);
    return NextResponse.json({ error: '创建题目失败' }, { status: 500 });
  }
}

// 更新题目
export async function PUT(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: '需要管理员权限' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, question, type, options, correctAnswer, explanation, category, difficulty } = body;

    if (!id) {
      return NextResponse.json({ error: '题目ID不能为空' }, { status: 400 });
    }

    // 验证题目是否存在
    const existingQuestion = database.getQuestionById(id);
    if (!existingQuestion) {
      return NextResponse.json({ error: '题目不存在' }, { status: 404 });
    }

    // 准备更新数据
    const updates: Partial<Question> = {};
    if (question !== undefined) updates.question = question.trim();
    if (type !== undefined) updates.type = type;
    if (options !== undefined) updates.options = options.filter((opt: string) => opt && opt.trim());
    if (correctAnswer !== undefined) updates.correctAnswer = correctAnswer;
    if (explanation !== undefined) updates.explanation = explanation?.trim() || '';
    if (category !== undefined) updates.category = category?.trim() || '默认分类';
    if (difficulty !== undefined) updates.difficulty = difficulty;

    const success = database.updateQuestion(id, updates);
    
    if (success) {
      return NextResponse.json({
        message: '题目更新成功',
        question: database.getQuestionById(id)
      });
    } else {
      return NextResponse.json({ error: '更新失败' }, { status: 500 });
    }
  } catch (error) {
    console.error('更新题目失败:', error);
    return NextResponse.json({ error: '更新题目失败' }, { status: 500 });
  }
}

// 删除题目
export async function DELETE(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: '需要管理员权限' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '题目ID不能为空' }, { status: 400 });
    }

    const success = database.deleteQuestion(id);
    
    if (success) {
      return NextResponse.json({ message: '题目删除成功' });
    } else {
      return NextResponse.json({ error: '题目不存在或删除失败' }, { status: 404 });
    }
  } catch (error) {
    console.error('删除题目失败:', error);
    return NextResponse.json({ error: '删除题目失败' }, { status: 500 });
  }
}
