'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

interface Stats {
  totalQuestions: number;
  categories: string[];
  difficulties: string[];
}

export default function ExamPage() {
  const [examTemplates, setExamTemplates] = useState<ExamTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ExamTemplate | null>(null);
  const [config, setConfig] = useState<ExamConfig>({
    userName: '',
    totalQuestions: 10,
    category: '',
    difficulty: '',
    timeLimit: 30
  });
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchTemplates();
    fetchStats();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/exam-templates?active=true');
      if (response.ok) {
        const data = await response.json();
        setExamTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('获取考试模板失败:', error);
    } finally {
      setTemplatesLoading(false);
    }
  };

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

  const handleTemplateSelect = (template: ExamTemplate) => {
    setSelectedTemplate(template);
    setConfig(prev => ({
      ...prev,
      totalQuestions: template.totalQuestions,
      timeLimit: template.timeLimit,
      category: template.category || '',
      difficulty: template.difficulty || ''
    }));
    setShowCustomForm(false);
  };

  const handleCustomSelect = () => {
    setSelectedTemplate(null);
    setShowCustomForm(true);
  };

  const handleStartExam = async () => {
    if (!config.userName.trim()) {
      setError('请输入您的姓名');
      return;
    }

    if (config.totalQuestions < 1 || config.totalQuestions > 1000) {
      setError('题目数量必须在1-1000之间');
      return;
    }

    if (!stats || stats.totalQuestions === 0) {
      setError('题库中没有题目，请先导入题目');
      return;
    }

    if (config.totalQuestions > stats.totalQuestions) {
      setError(`题目数量不能超过题库总数 (${stats.totalQuestions})`);
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
        body: JSON.stringify({
          userName: config.userName,
          totalQuestions: config.totalQuestions,
          category: config.category || undefined,
          difficulty: config.difficulty || undefined,
          timeLimit: config.timeLimit || undefined,
          templateId: selectedTemplate?.id
        }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/exam/${data.sessionId}`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || '创建考试失败');
      }
    } catch (error) {
      console.error('创建考试失败:', error);
      setError('创建考试失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyLabel = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return '简单';
      case 'medium': return '中等';
      case 'hard': return '困难';
      default: return '不限';
    }
  };

  const getTemplateIcon = (template: ExamTemplate) => {
    return template.icon || '📝';
  };

  const getTemplateColor = (template: ExamTemplate) => {
    if (template.color) {
      return {
        backgroundColor: template.color + '20',
        borderColor: template.color,
        color: template.color
      };
    }
    return {
      backgroundColor: '#3B82F620',
      borderColor: '#3B82F6',
      color: '#3B82F6'
    };
  };

  if (templatesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <Link
            href="/portal"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            ← 返回门户
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">开始考试</h1>
          <p className="text-gray-600">
            {stats ? `题库共有 ${stats.totalQuestions} 道题目` : '正在加载题库信息...'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* 考试模板选择 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">选择考试类型</h2>

          {examTemplates.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">暂无可用的考试模板</p>
              <p className="text-sm text-gray-400">请联系管理员配置考试模板</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {examTemplates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedTemplate?.id === template.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }`}
                  style={selectedTemplate?.id === template.id ? undefined : getTemplateColor(template)}
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">{getTemplateIcon(template)}</span>
                    <h3 className="font-semibold text-gray-800">{template.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{template.totalQuestions} 题</span>
                    <span>{template.timeLimit > 0 ? `${template.timeLimit} 分钟` : '不限时'}</span>
                  </div>
                  {template.category && (
                    <div className="mt-2">
                      <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                        {template.category}
                      </span>
                    </div>
                  )}
                  {template.difficulty && (
                    <div className="mt-1">
                      <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                        {getDifficultyLabel(template.difficulty)}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 自定义选项 */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div
              onClick={handleCustomSelect}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${showCustomForm
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
                }`}
            >
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">⚙️</span>
                <h3 className="font-semibold text-gray-800">自定义考试</h3>
              </div>
              <p className="text-sm text-gray-600">根据需要自定义题目数量和时间</p>
            </div>
          </div>
        </div>

        {/* 考试配置表单 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">考试配置</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                姓名 *
              </label>
              <input
                type="text"
                value={config.userName}
                onChange={(e) => setConfig({ ...config, userName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入您的姓名"
              />
            </div>

            {showCustomForm && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    题目数量 *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={stats?.totalQuestions || 1000}
                    value={config.totalQuestions}
                    onChange={(e) => setConfig({ ...config, totalQuestions: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    考试时间 (分钟，0表示不限时)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="1440"
                    value={config.timeLimit || 0}
                    onChange={(e) => setConfig({ ...config, timeLimit: Number(e.target.value) || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    题目分类 (可选)
                  </label>
                  <select
                    value={config.category || ''}
                    onChange={(e) => setConfig({ ...config, category: e.target.value || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">所有分类</option>
                    {stats?.categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    难度等级 (可选)
                  </label>
                  <select
                    value={config.difficulty || ''}
                    onChange={(e) => setConfig({ ...config, difficulty: e.target.value || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">所有难度</option>
                    {stats?.difficulties.map(difficulty => (
                      <option key={difficulty} value={difficulty}>{getDifficultyLabel(difficulty)}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* 显示当前配置 */}
            {(selectedTemplate || showCustomForm) && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-2">当前配置</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">题目数量:</span>
                    <span className="ml-2 font-medium">{config.totalQuestions} 题</span>
                  </div>
                  <div>
                    <span className="text-gray-500">考试时间:</span>
                    <span className="ml-2 font-medium">
                      {config.timeLimit && config.timeLimit > 0 ? `${config.timeLimit} 分钟` : '不限时'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">题目分类:</span>
                    <span className="ml-2 font-medium">{config.category || '不限'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">难度等级:</span>
                    <span className="ml-2 font-medium">{getDifficultyLabel(config.difficulty)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-center">
            <button
              onClick={handleStartExam}
              disabled={loading || !config.userName.trim() || (!selectedTemplate && !showCustomForm)}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '创建中...' : '开始考试'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
