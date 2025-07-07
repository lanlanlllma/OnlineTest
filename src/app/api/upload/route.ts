import { NextRequest, NextResponse } from 'next/server';
import { ExcelProcessor } from '@/lib/excel-processor';
import { database } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: '请选择要上传的Excel文件' }, { status: 400 });
    }
    
    // 检查文件类型
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/excel'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: '请上传Excel文件(.xlsx或.xls)' }, { status: 400 });
    }
    
    // 读取文件内容
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // 解析Excel文件
    const questions = ExcelProcessor.parseExcelFile(buffer);
    
    if (questions.length === 0) {
      return NextResponse.json({ error: '未能从Excel文件中解析出有效题目' }, { status: 400 });
    }
    
    // 存储题目到数据库
    database.addQuestions(questions);
    
    return NextResponse.json({
      message: '题目上传成功',
      count: questions.length,
      questions: questions.slice(0, 5) // 返回前5个题目作为预览
    });
    
  } catch (error) {
    console.error('上传文件时发生错误:', error);
    return NextResponse.json({ error: '文件上传失败' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const stats = database.getStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('获取统计信息时发生错误:', error);
    return NextResponse.json({ error: '获取统计信息失败' }, { status: 500 });
  }
}
