'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ExamConfig {
  userName: string;
  totalQuestions: number;
  category?: string;
  difficulty?: string;
  timeLimit?: number;
}

export default function ExamPage() {
  const router = useRouter();
  const [config, setConfig] = useState<ExamConfig>({
    userName: '',
    totalQuestions: 10,
    category: '',
    difficulty: '',
    timeLimit: 0
  });
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/upload');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('获取统计信息失败:', error);
    }
  };

  const handleStartExam = async () => {
    if (!config.userName.trim()) {
      setError('请输入姓名');
      return;
    }

    if (!stats || stats.totalQuestions === 0) {
      setError('系统中没有题目，请先上传题目');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/exam', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (response.ok) {
        // 跳转到答题页面
        router.push(`/exam/${data.sessionId}`);
      } else {
        setError(data.error || '创建考试失败');
      }
    } catch (err) {
      setError('创建考试时发生错误');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (field: keyof ExamConfig, value: string | number) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">考试配置</h1>
            <p className="text-gray-600">设置考试参数并开始答题</p>
          </div>
          <Link 
            href="/"
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            返回首页
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 配置表单 */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">考试设置</h2>
            
            <div className="space-y-6">
              {/* 姓名 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  考生姓名 *
                </label>
                <input
                  type="text"
                  value={config.userName}
                  onChange={(e) => handleConfigChange('userName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入您的姓名"
                />
              </div>

              {/* 题目数量 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  题目数量
                </label>
                <input
                  type="number"
                  min="1"
                  max={stats?.totalQuestions || 100}
                  value={config.totalQuestions}
                  onChange={(e) => handleConfigChange('totalQuestions', parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {stats && (
                  <p className="text-sm text-gray-500 mt-1">
                    系统中共有 {stats.totalQuestions} 道题目
                  </p>
                )}
              </div>

              {/* 题目分类 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  题目分类（可选）
                </label>
                <select
                  value={config.category}
                  onChange={(e) => handleConfigChange('category', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">不限分类</option>
                  {stats?.categories?.map((category: string) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* 难度选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  难度等级（可选）
                </label>
                <select
                  value={config.difficulty}
                  onChange={(e) => handleConfigChange('difficulty', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">不限难度</option>
                  <option value="easy">简单</option>
                  <option value="medium">中等</option>
                  <option value="hard">困难</option>
                </select>
              </div>

              {/* 时间限制 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  时间限制（分钟）
                </label>
                <input
                  type="number"
                  min="0"
                  value={config.timeLimit}
                  onChange={(e) => handleConfigChange('timeLimit', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0 表示不限时间"
                />
                <p className="text-sm text-gray-500 mt-1">
                  设为 0 表示不限制时间
                </p>
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

              <button
                onClick={handleStartExam}
                disabled={loading || !stats || stats.totalQuestions === 0}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '创建考试中...' : '开始考试'}
              </button>
            </div>
          </div>

          {/* 系统信息 */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">系统信息</h2>
            
            {stats ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {stats.totalQuestions}
                    </div>
                    <div className="text-sm text-gray-600">题目总数</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {stats.categories.length}
                    </div>
                    <div className="text-sm text-gray-600">分类数量</div>
                  </div>
                </div>

                {stats.categories.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-3">可用分类</h3>
                    <div className="flex flex-wrap gap-2">
                      {stats.categories.map((category: string) => (
                        <span
                          key={category}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">考试说明</h3>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• 考试开始后无法修改配置</li>
                    <li>• 每道题目只能选择一个答案</li>
                    <li>• 可以随时查看答题进度</li>
                    <li>• 提交后将立即显示成绩</li>
                    <li>• 考试结果可以导出为PDF</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">加载系统信息中...</p>
              </div>
            )}

            {stats && stats.totalQuestions === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <p className="text-yellow-700 font-medium">系统中暂无题目</p>
                    <p className="text-yellow-600 text-sm">
                      请先{' '}
                      <Link href="/upload" className="underline">
                        上传题目
                      </Link>
                      {' '}后再开始考试
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
