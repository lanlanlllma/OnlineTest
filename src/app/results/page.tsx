'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ExamSession {
  id: string;
  userName: string;
  score: number;
  totalQuestions: number;
  startTime: string;
  endTime?: string;
  duration?: number;
  status: string;
}

export default function ResultsPage() {
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingAll, setExportingAll] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/results');
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      } else {
        console.error('获取考试记录失败');
      }
    } catch (error) {
      console.error('获取考试记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportAll = async () => {
    setExportingAll(true);
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'all', format: 'csv' }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `exam_summary_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        alert('导出失败');
      }
    } catch (err) {
      alert('导出时发生错误');
    } finally {
      setExportingAll(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'in-progress':
        return '进行中';
      case 'expired':
        return '已过期';
      default:
        return '未知';
    }
  };

  const getScoreColor = (score: number, total: number) => {
    const percentage = score; // score 已经是百分比了
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-blue-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">考试记录管理</h1>
            <p className="text-gray-600">查看所有考试记录和成绩统计</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleExportAll}
              disabled={exportingAll || sessions.length === 0}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {exportingAll ? '导出中...' : '              导出CSV'}
            </button>
            <Link 
              href="/"
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              返回首页
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">加载考试记录中...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">暂无考试记录</h3>
            <p className="text-gray-600 mb-6">还没有任何考试记录，开始第一次考试吧！</p>
            <Link
              href="/exam"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              开始考试
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 统计信息 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {sessions.length}
                </div>
                <div className="text-gray-600">总考试次数</div>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {sessions.filter(s => s.status === 'completed').length}
                </div>
                <div className="text-gray-600">已完成考试</div>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {sessions.filter(s => s.status === 'completed').length > 0 
                    ? (sessions.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.score, 0) / sessions.filter(s => s.status === 'completed').length).toFixed(1)
                    : '0'}%
                </div>
                <div className="text-gray-600">平均分</div>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {sessions.filter(s => s.status === 'completed' && s.duration).length > 0
                    ? Math.round(sessions.filter(s => s.status === 'completed' && s.duration).reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.filter(s => s.status === 'completed' && s.duration).length)
                    : '0'}
                </div>
                <div className="text-gray-600">平均用时(分钟)</div>
              </div>
            </div>

            {/* 考试记录列表 */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">考试记录列表</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        考生姓名
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        成绩
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        用时
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        状态
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        考试时间
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sessions.map((session) => (
                      <tr key={session.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {session.userName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-semibold ${getScoreColor(session.score, 100)}`}>
                            {Math.round((session.score / 100) * session.totalQuestions)} / {session.totalQuestions}
                          </div>
                          <div className="text-xs text-gray-500">
                            {session.score.toFixed(1)}%
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {session.duration ? `${session.duration} 分钟` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(session.status)}`}>
                            {getStatusText(session.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>{new Date(session.startTime).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(session.startTime).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {session.status === 'completed' ? (
                            <Link
                              href={`/results/${session.id}`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              查看详情
                            </Link>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
