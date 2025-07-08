'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import AdminLogin from '@/components/AdminLogin';
import { useAdminAuth } from '@/hooks/useAdminAuth';

export default function UploadPage() {
  const { isAuthenticated, loading: authLoading, login, logout } = useAdminAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setUploadResult(data);
      } else {
        setError(data.error || '上传失败');
      }
    } catch (err) {
      setError('上传过程中发生错误');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadSample = async () => {
    try {
      const response = await fetch('/api/sample-excel');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sample_questions.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('下载样例文件失败:', err);
    }
  };

  const resetUpload = () => {
    setUploadResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 如果正在加载认证状态，显示加载中
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在验证身份...</p>
        </div>
      </div>
    );
  }

  // 如果未认证，显示登录页面
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <Link
              href="/admin"
              className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
            >
              ← 返回管理端
            </Link>
            <h1 className="text-4xl font-bold text-gray-800 mb-4">管理员登录</h1>
            <p className="text-gray-600">请输入管理员密码以访问题目管理</p>
          </div>
          <AdminLogin onLogin={login} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/admin"
              className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
            >
              ← 返回管理端
            </Link>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">题目管理</h1>
            <p className="text-gray-600">上传Excel文件导入题目到系统</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
          >
            退出登录
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4 mb-6">
          <a
            href="/api/sample-excel"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            下载模板
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 上传区域 */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">上传Excel文件</h2>

            {!uploadResult && (
              <div className="space-y-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-gray-600 mb-4">
                    点击选择或拖拽Excel文件到此区域
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    支持 .xlsx 和 .xls 格式
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {uploading ? '上传中...' : '选择文件'}
                  </button>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-red-700">{error}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {uploadResult && (
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-green-800">上传成功！</h3>
                  </div>
                  <p className="text-green-700 mb-4">{uploadResult.message}</p>
                  <div className="text-sm text-green-600">
                    <p>共导入 {uploadResult.count} 道题目</p>
                  </div>
                </div>

                {uploadResult.questions && uploadResult.questions.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">题目预览（前5道）：</h4>
                    <div className="space-y-3">
                      {uploadResult.questions.map((question: any, index: number) => (
                        <div key={index} className="bg-white p-3 rounded border">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-medium text-gray-800">
                              {index + 1}. {question.question}
                            </p>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${question.type === 'multiple'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                              }`}>
                              {question.type === 'multiple' ? '多选' : '单选'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                            {question.options.map((option: string, optIndex: number) => {
                              // 过滤掉空白或BLANK的选项
                              if (!option || option.trim() === '' || option.trim().toLowerCase() === 'blank') {
                                return null;
                              }

                              const correctAnswerArray = Array.isArray(question.correctAnswer)
                                ? question.correctAnswer
                                : [question.correctAnswer];
                              const isCorrect = correctAnswerArray.includes(optIndex);

                              return (
                                <div key={optIndex} className={`
                                  ${isCorrect ? 'text-green-600 font-medium' : ''}
                                `}>
                                  {String.fromCharCode(65 + optIndex)}. {option}
                                  {isCorrect && ' ✓'}
                                </div>
                              );
                            }).filter(Boolean)}
                          </div>
                          {question.category && (
                            <div className="mt-2 text-xs text-gray-500">
                              分类: {question.category} | 难度: {question.difficulty}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    onClick={resetUpload}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    继续上传
                  </button>
                  <Link
                    href="/exam"
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors inline-block"
                  >
                    开始考试
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* 帮助区域 */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">使用说明</h2>

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">Excel格式要求</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">Excel文件应包含以下列：</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• <strong>content</strong>: 题目内容</li>
                    <li>• <strong>type</strong>: 题目类型（single=单选，multiple=多选）</li>
                    <li>• <strong>choice0, choice1, choice2, choice3, choice4, choice5</strong>: 选项内容</li>
                    <li>• <strong>answer</strong>: 正确答案（单选：0/1/2等，多选：012或0,1,2等）</li>
                    <li>• <strong>explanation</strong>: 题目解析（可选）</li>
                    <li>• <strong>category</strong>: 题目分类（可选）</li>
                    <li>• <strong>difficulty</strong>: 难度等级（可选）</li>
                  </ul>
                  <p className="text-xs text-gray-500 mt-2">
                    注意：留空或填写"BLANK"的选项将不会显示
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 mb-3">下载样例文件</h3>
                <p className="text-sm text-gray-600 mb-4">
                  如果您不确定格式，可以下载样例文件作为参考
                </p>
                <button
                  onClick={handleDownloadSample}
                  className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors w-full"
                >
                  下载样例Excel文件
                </button>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 mb-3">注意事项</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• 确保Excel文件格式正确</li>
                  <li>• 每道题目至少要有2个选项</li>
                  <li>• 单选题答案格式：0、1、2等（选项索引）</li>
                  <li>• 多选题答案格式：012、0,1,2、ABC等</li>
                  <li>• 建议文件大小不超过10MB</li>
                  <li>• 支持中英文题目内容</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
