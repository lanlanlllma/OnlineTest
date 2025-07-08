'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ExamResult {
  session: {
    id: string;
    userName: string;
    questions: any[];
    answers: number[];
    score: number;
    totalQuestions: number;
    startTime: string;
    endTime: string;
    duration: number;
    status: string;
  };
  correctAnswers: number;
  incorrectAnswers: number;
  percentage: number;
  categoryBreakdown?: {
    [category: string]: {
      correct: number;
      total: number;
      percentage: number;
    };
  };
}

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const [result, setResult] = useState<ExamResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  // 移除导出功能相关状态

  useEffect(() => {
    async function getParams() {
      const resolvedParams = await params;
      setSessionId(resolvedParams.id);
    }
    getParams();
  }, [params]);

  useEffect(() => {
    if (sessionId) {
      fetchResult();
    }
  }, [sessionId]);

  const fetchResult = async () => {
    if (!sessionId) return;
    
    try {
      const response = await fetch(`/api/export?sessionId=${sessionId}&format=json`);

      if (response.ok) {
        const data = await response.json();
        setResult(data);
      } else {
        setError('获取考试结果失败');
      }
    } catch (err) {
      setError('加载结果时发生错误');
    } finally {
      setLoading(false);
    }
  };

  // 移除导出功能

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-blue-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGradeText = (percentage: number) => {
    if (percentage >= 90) return '优秀';
    if (percentage >= 70) return '良好';
    if (percentage >= 60) return '及格';
    return '不及格';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载结果中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <svg className="w-12 h-12 text-red-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">加载失败</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link
              href="/"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              返回首页
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">考试结果</h1>
          <p className="text-gray-600">考试已完成，以下是您的成绩报告</p>
        </div>

        {/* 成绩概览 */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="text-center mb-8">
            <div className={`text-6xl font-bold mb-2 ${getGradeColor(result.percentage)}`}>
              {result.percentage.toFixed(1)}%
            </div>
            <div className={`text-2xl font-semibold ${getGradeColor(result.percentage)}`}>
              {getGradeText(result.percentage)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800 mb-1">
                {result.session.userName}
              </div>
              <div className="text-gray-600">考生姓名</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {result.correctAnswers} / {result.session.totalQuestions}
              </div>
              <div className="text-gray-600">正确题数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {result.session.duration}
              </div>
              <div className="text-gray-600">用时(分钟)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {new Date(result.session.endTime).toLocaleString()}
              </div>
              <div className="text-gray-600">完成时间</div>
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showDetails ? '隐藏详情' : '查看详情'}
            </button>
            <Link
              href="/exam"
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              再次考试
            </Link>
          </div>
        </div>

        {/* 分类统计 */}
        {result.categoryBreakdown && Object.keys(result.categoryBreakdown).length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">分类统计</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(result.categoryBreakdown).map(([category, stats]) => (
                <div key={category} className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">{category}</h3>
                  <div className="text-sm text-gray-600">
                    <p>正确: {stats.correct} / {stats.total}</p>
                    <p>正确率: {stats.percentage.toFixed(1)}%</p>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${stats.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 详细答题情况 */}
        {showDetails && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">详细答题情况</h2>
            <div className="space-y-6">
              {result.session.questions.map((question, index) => {
                const userAnswer = result.session.answers[index];
                let isCorrect = false;

                if (question.type === 'multiple') {
                  // 多选题：比较数组
                  const correctAnswerArray = Array.isArray(question.correctAnswer)
                    ? question.correctAnswer
                    : [question.correctAnswer];
                  const userAnswerArray = Array.isArray(userAnswer)
                    ? userAnswer
                    : [userAnswer];

                  isCorrect = correctAnswerArray.length === userAnswerArray.length &&
                    correctAnswerArray.every((ans: number) => userAnswerArray.includes(ans));
                } else {
                  // 单选题：直接比较
                  isCorrect = userAnswer === question.correctAnswer;
                }

                return (
                  <div key={index} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {index + 1}. {question.question}
                        </h3>
                        <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium ${question.type === 'multiple'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                          }`}>
                          {question.type === 'multiple' ? '多选题' : '单选题'}
                        </span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${isCorrect
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                        }`}>
                        {isCorrect ? '正确' : '错误'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {question.options.map((option: string, optionIndex: number) => {
                        // 过滤掉空白或BLANK的选项
                        if (!option || option.trim() === '' || option.trim().toLowerCase() === 'blank') {
                          return null;
                        }

                        const correctAnswerArray = Array.isArray(question.correctAnswer)
                          ? question.correctAnswer
                          : [question.correctAnswer];
                        const userAnswerArray = Array.isArray(userAnswer)
                          ? userAnswer
                          : [userAnswer];

                        const isUserAnswer = userAnswerArray.includes(optionIndex);
                        const isCorrectAnswer = correctAnswerArray.includes(optionIndex);

                        return (
                          <div
                            key={optionIndex}
                            className={`p-3 rounded-lg border ${isCorrectAnswer
                                ? 'border-green-500 bg-green-50'
                                : isUserAnswer
                                  ? 'border-red-500 bg-red-50'
                                  : 'border-gray-200'
                              }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-gray-700">
                                <strong>{String.fromCharCode(65 + optionIndex)}.</strong> {option}
                              </span>
                              <div className="flex items-center space-x-2">
                                {isCorrectAnswer && (
                                  <span className="text-green-600 text-sm">✓ 正确答案</span>
                                )}
                                {isUserAnswer && !isCorrectAnswer && (
                                  <span className="text-red-600 text-sm">✗ 您的答案</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      }).filter(Boolean)}
                    </div>

                    {question.explanation && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>解析:</strong> {question.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 返回按钮 */}
        <div className="text-center mt-8">
          <Link
            href="/"
            className="bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
