'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface LocalExamTemplate {
  id: string;
  name: string;
  description: string;
  totalQuestions: number;
  timeLimit: number;
  icon: string;
  color: string;
}

interface ExamFormData {
  userName: string;
  totalQuestions: number;
  category?: string;
  difficulty?: string;
  timeLimit?: number;
}

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

interface ExamConfig {
  userName: string;
  totalQuestions: number;
  category?: string;
  difficulty?: string;
  timeLimit?: number;
}

// 预设考试类型
const examTemplates: LocalExamTemplate[] = [
  {
    id: 'quick',
    name: '快速测试',
    description: '10道题，15分钟，适合快速检验',
    totalQuestions: 10,
    timeLimit: 15,
    icon: '⚡',
    color: 'bg-green-100 border-green-300'
  },
  {
    id: 'standard',
    name: '标准考试',
    description: '30道题，45分钟，全面考察',
    totalQuestions: 30,
    timeLimit: 45,
    icon: '📝',
    color: 'bg-blue-100 border-blue-300'
  },
  {
    id: 'comprehensive',
    name: '全面考试',
    description: '50道题，90分钟，深度测试',
    totalQuestions: 50,
    timeLimit: 90,
    icon: '🎯',
    color: 'bg-purple-100 border-purple-300'
  },
  {
    id: 'practice',
    name: '练习模式',
    description: '20道题，不限时间，随时练习',
    totalQuestions: 20,
    timeLimit: 0,
    icon: '🏃',
    color: 'bg-yellow-100 border-yellow-300'
  },
  {
    id: 'challenge',
    name: '挑战模式',
    description: '100道题，120分钟，终极挑战',
    totalQuestions: 100,
    timeLimit: 120,
    icon: '🔥',
    color: 'bg-red-100 border-red-300'
  },
  {
    id: 'custom',
    name: '自定义',
    description: '根据需要自定义题目数量和时间',
    totalQuestions: 10,
    timeLimit: 30,
    icon: '⚙️',
    color: 'bg-gray-100 border-gray-300'
  }
];

export default function ExamPage() {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<string>('standard');
  const [config, setConfig] = useState<ExamConfig>({
    userName: '',
    totalQuestions: 30,
    category: '',
    difficulty: '',
    timeLimit: 45
  });
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  // 当选择模板时更新配置
  useEffect(() => {
    const template = examTemplates.find(t => t.id === selectedTemplate);
    if (template) {
      setConfig(prev => ({
        ...prev,
        totalQuestions: template.totalQuestions,
        timeLimit: template.timeLimit,
        category: '',
        difficulty: ''
      }));
    }
  }, [selectedTemplate]);

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
            <p className="text-gray-600">选择考试类型并开始答题</p>
          </div>
          <Link 
            href="/"
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            返回首页
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 预设考试类型选择 */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">选择考试类型</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {examTemplates.map((template) => (
                <div
                  key={template.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedTemplate === template.id
                      ? template.color + ' border-opacity-100'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">{template.icon}</span>
                    <h3 className="font-semibold text-gray-800">{template.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                  <div className="text-xs text-gray-500">
                    <span className="mr-3">📊 {template.totalQuestions}题</span>
                    <span>⏱️ {template.timeLimit === 0 ? '不限时' : `${template.timeLimit}分钟`}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* 考生姓名输入 */}
            <div className="mb-6">
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

            {/* 自定义设置（仅在选择自定义时显示） */}
            {selectedTemplate === 'custom' && (
              <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-700">自定义设置</h3>
                
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
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            )}

            <button
              onClick={handleStartExam}
              disabled={loading || !config.userName.trim()}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '准备考试中...' : '开始考试'}
            </button>
          </div>

          {/* 系统信息和说明 */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">系统信息</h2>
            
            {stats ? (
              <div className="space-y-6">
                {/* 当前配置预览 */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-3">当前配置</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">考试类型:</span>
                      <span className="font-medium">{examTemplates.find(t => t.id === selectedTemplate)?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">题目数量:</span>
                      <span className="font-medium">{config.totalQuestions} 道</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">时间限制:</span>
                      <span className="font-medium">{config.timeLimit === 0 ? '不限时' : `${config.timeLimit} 分钟`}</span>
                    </div>
                    {config.category && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">分类:</span>
                        <span className="font-medium">{config.category}</span>
                      </div>
                    )}
                    {config.difficulty && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">难度:</span>
                        <span className="font-medium">
                          {config.difficulty === 'easy' ? '简单' : config.difficulty === 'medium' ? '中等' : '困难'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 统计信息 */}
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">题库统计</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{stats.totalQuestions}</div>
                      <div className="text-sm text-gray-600">总题目数</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{stats.categories?.length || 0}</div>
                      <div className="text-sm text-gray-600">分类数量</div>
                    </div>
                  </div>
                </div>

                {/* 分类列表 */}
                {stats.categories && stats.categories.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-3">可选分类</h3>
                    <div className="flex flex-wrap gap-2">
                      {stats.categories.map((category: string) => (
                        <span
                          key={category}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
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
                    <li>• 题目将从题库中随机抽取</li>
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
