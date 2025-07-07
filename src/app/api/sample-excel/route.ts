import { NextResponse } from 'next/server';
import { ExcelProcessor } from '@/lib/excel-processor';

export async function GET() {
  try {
    const excelBuffer = ExcelProcessor.generateSampleExcel();
    
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="sample_questions.xlsx"'
      }
    });
    
  } catch (error) {
    console.error('生成样例Excel时发生错误:', error);
    return NextResponse.json({ error: '生成样例Excel失败' }, { status: 500 });
  }
}
