'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ExamSession {
  id: string;
  name: string;
  submittedAt: string;
  score: number;
  totalQuestions: number;
  duration: number;
  category?: string;
  difficulty?: string;
}

export default function StudentResults() {
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    category: '',
    difficulty: '',
    sortBy: 'submittedAt'
  });

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const response = await fetch('/api/student/results');
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('获取成绩失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = sessions.filter(session => {
    if (filter.category && session.category !== filter.category) return false;
    if (filter.difficulty && session.difficulty !== filter.difficulty) return false;
    return true;
  }).sort((a, b) => {
    if (filter.sortBy === 'score') {
      return b.score - a.score;
    }
    return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
  });

  const averageScore = sessions.length > 0 
    ? sessions.reduce((sum, session) => sum + session.score, 0) / sessions.length 
    : 0;

  const bestScore = sessions.length > 0 
    ? Math.max(...sessions.map(session => session.score)) 
    : 0;

  const categories = [...new Set(sessions.map(session => session.category).filter(Boolean))];
  const difficulties = [...new Set(sessions.map(session => session.difficulty).filter(Boolean))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Link 
            href="/student" 
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回学生端
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">我的成绩</h1>
          <div></div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {sessions.length}
            </div>
            <div className="text-gray-600">考试次数</div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {averageScore.toFixed(1)}%
            </div>
            <div className="text-gray-600">平均分</div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {bestScore.toFixed(1)}%
            </div>
            <div className="text-gray-600">最高分</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">筛选条件</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">分类</label>
              <select
                value={filter.category}
                onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全部分类</option>
                {categories.map((category, index) => (
                  <option key={index} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">难度</label>
              <select
                value={filter.difficulty}
                onChange={(e) => setFilter(prev => ({ ...prev, difficulty: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全部难度</option>
                {difficulties.map((difficulty, index) => (
                  <option key={index} value={difficulty}>{difficulty}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">排序方式</label>
              <select
                value={filter.sortBy}
                onChange={(e) => setFilter(prev => ({ ...prev, sortBy: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="submittedAt">按时间排序</option>
                <option value="score">按分数排序</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">考试记录</h3>
            
            {filteredSessions.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-gray-500 text-lg mb-4">暂无考试记录</p>
                <Link 
                  href="/exam" 
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block"
                >
                  开始第一次考试
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSessions.map((session) => (
                  <div key={session.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 mb-2">{session.name}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">分数:</span> 
                            <span className={`ml-1 font-bold ${
                              session.score >= 80 ? 'text-green-600' :
                              session.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {session.score.toFixed(1)}%
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">题目数:</span> {session.totalQuestions}
                          </div>
                          <div>
                            <span className="font-medium">用时:</span> {Math.floor(session.duration / 60)}分钟
                          </div>
                          <div>
                            <span className="font-medium">时间:</span> {new Date(session.submittedAt).toLocaleString()}
                          </div>
                        </div>
                        {(session.category || session.difficulty) && (
                          <div className="flex gap-2 mt-2">
                            {session.category && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                {session.category}
                              </span>
                            )}
                            {session.difficulty && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                                {session.difficulty}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <Link 
                          href={`/student/results/${session.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          查看详情
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
