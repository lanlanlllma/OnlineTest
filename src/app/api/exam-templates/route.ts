import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

interface ExamTemplate {
  id: string;
  name: string;
  description: string;
  totalQuestions: number;
  timeLimit: number;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  icon?: string;
  color?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TEMPLATES_FILE = path.join(process.cwd(), 'data', 'exam-templates.json');

// 确保数据目录存在
function ensureDataDirectory() {
  const dataDir = path.dirname(TEMPLATES_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// 读取考试模板
function loadTemplates(): ExamTemplate[] {
  try {
    if (fs.existsSync(TEMPLATES_FILE)) {
      const data = fs.readFileSync(TEMPLATES_FILE, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('读取考试模板失败:', error);
    return [];
  }
}

// 保存考试模板
function saveTemplates(templates: ExamTemplate[]) {
  try {
    ensureDataDirectory();
    fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(templates, null, 2));
  } catch (error) {
    console.error('保存考试模板失败:', error);
    throw error;
  }
}

// GET - 获取所有考试模板
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';
    
    let templates = loadTemplates();
    
    if (activeOnly) {
      templates = templates.filter(t => t.isActive);
    }
    
    return NextResponse.json({ templates });
  } catch (error) {
    console.error('获取考试模板失败:', error);
    return NextResponse.json({ error: '获取考试模板失败' }, { status: 500 });
  }
}

// POST - 创建新的考试模板
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { name, description, totalQuestions, timeLimit, category, difficulty, icon, color } = data;

    // 验证必填字段
    if (!name || !description || !totalQuestions || !timeLimit) {
      return NextResponse.json({ error: '请填写必填字段' }, { status: 400 });
    }

    if (totalQuestions < 1 || totalQuestions > 1000) {
      return NextResponse.json({ error: '题目数量必须在1-1000之间' }, { status: 400 });
    }

    if (timeLimit < 1 || timeLimit > 1440) {
      return NextResponse.json({ error: '考试时间必须在1-1440分钟之间' }, { status: 400 });
    }

    const templates = loadTemplates();
    
    // 检查名称是否已存在
    if (templates.some(t => t.name === name)) {
      return NextResponse.json({ error: '考试类型名称已存在' }, { status: 400 });
    }

    const newTemplate: ExamTemplate = {
      id: uuidv4(),
      name,
      description,
      totalQuestions: Number(totalQuestions),
      timeLimit: Number(timeLimit),
      category,
      difficulty: difficulty || undefined,
      icon: icon || 'BookOpen',
      color: color || '#3B82F6',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    templates.push(newTemplate);
    saveTemplates(templates);

    return NextResponse.json({ success: true, template: newTemplate });
  } catch (error) {
    console.error('创建考试模板失败:', error);
    return NextResponse.json({ error: '创建考试模板失败' }, { status: 500 });
  }
}

// PUT - 更新考试模板
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, name, description, totalQuestions, timeLimit, category, difficulty, icon, color, isActive } = data;

    if (!id) {
      return NextResponse.json({ error: '缺少模板ID' }, { status: 400 });
    }

    const templates = loadTemplates();
    const templateIndex = templates.findIndex(t => t.id === id);

    if (templateIndex === -1) {
      return NextResponse.json({ error: '考试模板不存在' }, { status: 404 });
    }

    // 检查名称是否与其他模板冲突
    const existingTemplate = templates.find(t => t.name === name && t.id !== id);
    if (existingTemplate) {
      return NextResponse.json({ error: '考试类型名称已存在' }, { status: 400 });
    }

    // 更新模板
    const updatedTemplate: ExamTemplate = {
      ...templates[templateIndex],
      name: name || templates[templateIndex].name,
      description: description || templates[templateIndex].description,
      totalQuestions: totalQuestions ? Number(totalQuestions) : templates[templateIndex].totalQuestions,
      timeLimit: timeLimit ? Number(timeLimit) : templates[templateIndex].timeLimit,
      category: category !== undefined ? category : templates[templateIndex].category,
      difficulty: difficulty !== undefined ? difficulty : templates[templateIndex].difficulty,
      icon: icon || templates[templateIndex].icon,
      color: color || templates[templateIndex].color,
      isActive: isActive !== undefined ? isActive : templates[templateIndex].isActive,
      updatedAt: new Date()
    };

    templates[templateIndex] = updatedTemplate;
    saveTemplates(templates);

    return NextResponse.json({ success: true, template: updatedTemplate });
  } catch (error) {
    console.error('更新考试模板失败:', error);
    return NextResponse.json({ error: '更新考试模板失败' }, { status: 500 });
  }
}

// DELETE - 删除考试模板
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '缺少模板ID' }, { status: 400 });
    }

    const templates = loadTemplates();
    const templateIndex = templates.findIndex(t => t.id === id);

    if (templateIndex === -1) {
      return NextResponse.json({ error: '考试模板不存在' }, { status: 404 });
    }

    templates.splice(templateIndex, 1);
    saveTemplates(templates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除考试模板失败:', error);
    return NextResponse.json({ error: '删除考试模板失败' }, { status: 500 });
  }
}
