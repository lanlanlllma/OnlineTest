'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Question {
  id: string;
  question: string;
  type: 'single' | 'multiple';
  options: string[];
  correctAnswer?: number | number[];
  category?: string;
  difficulty?: string;
}

interface ExamSession {
  id: string;
  userName: string;
  questions: Question[];
  answers: (number | number[])[];
  totalQuestions: number;
  startTime: string;
  status: string;
}

export default function ExamSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [session, setSession] = useState<ExamSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<(number | number[])[]>([]);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null);

  // 用于防抖的引用
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveTimeRef = useRef<number>(0);

  useEffect(() => {
    async function getParams() {
      const resolvedParams = await params;
      setSessionId(resolvedParams.id);
    }
    getParams();
  }, [params]);

  // 自动保存功能
  const saveExamState = useCallback(async (answersToSave: (number | number[])[], currentQuestionToSave: number, timeLeftToSave: number | null) => {
    if (!sessionId) return;

    const examState = {
      sessionId,
      answers: answersToSave,
      currentQuestion: currentQuestionToSave,
      timeLeft: timeLeftToSave,
      lastSaved: Date.now()
    };

    // 保存到 localStorage
    try {
      localStorage.setItem(`exam_state_${sessionId}`, JSON.stringify(examState));
      setAutoSaveStatus('saved');
    } catch (error) {
      console.error('保存考试状态到本地存储失败:', error);
      setAutoSaveStatus('error');
    }

    // 清除之前的定时器
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // 2秒后隐藏保存状态提示
    autoSaveTimeoutRef.current = setTimeout(() => {
      setAutoSaveStatus(null);
    }, 2000);
  }, [sessionId]);

  // 防抖保存函数
  const debouncedSave = useCallback((answersToSave: (number | number[])[], currentQuestionToSave: number, timeLeftToSave: number | null) => {
    // 避免频繁保存，最少间隔3秒
    const now = Date.now();
    if (now - lastSaveTimeRef.current < 3000) {
      return;
    }

    setAutoSaveStatus('saving');
    lastSaveTimeRef.current = now;
    saveExamState(answersToSave, currentQuestionToSave, timeLeftToSave);
  }, [saveExamState]);

  // 恢复考试状态
  const restoreExamState = useCallback(() => {
    if (!sessionId) return false;

    try {
      const savedState = localStorage.getItem(`exam_state_${sessionId}`);
      if (savedState) {
        const examState = JSON.parse(savedState);
        // 检查保存时间，如果超过2小时则不恢复
        if (Date.now() - examState.lastSaved > 2 * 60 * 60 * 1000) {
          localStorage.removeItem(`exam_state_${sessionId}`);
          return false;
        }

        setAnswers(examState.answers || []);
        setCurrentQuestion(examState.currentQuestion || 0);
        if (examState.timeLeft !== null && examState.timeLeft !== undefined) {
          // 计算实际经过的时间
          const timePassed = Math.floor((Date.now() - examState.lastSaved) / 1000);
          const adjustedTimeLeft = Math.max(0, examState.timeLeft - timePassed);
          setTimeLeft(adjustedTimeLeft);
        }
        return true;
      }
    } catch (error) {
      console.error('恢复考试状态失败:', error);
    }
    return false;
  }, [sessionId]);

  // 清理考试状态
  const clearExamState = useCallback(() => {
    if (sessionId) {
      localStorage.removeItem(`exam_state_${sessionId}`);
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionId) {
      fetchSession();
    }
  }, [sessionId]);

  // 监听页面可见性变化和页面卸载事件
  useEffect(() => {
    if (!sessionId || !session) return;

    // 页面可见性变化时保存状态
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // 页面隐藏时保存状态
        debouncedSave(answers, currentQuestion, timeLeft);
      }
    };

    // 页面卸载前保存状态
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (session.status === 'in-progress') {
        saveExamState(answers, currentQuestion, timeLeft);
        // 显示确认对话框
        e.preventDefault();
        e.returnValue = '您正在进行考试，确定要离开吗？您的答题进度已自动保存。';
        return e.returnValue;
      }
    };

    // 页面完全卸载时保存状态
    const handleUnload = () => {
      if (session.status === 'in-progress') {
        saveExamState(answers, currentQuestion, timeLeft);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
    };
  }, [sessionId, session, answers, currentQuestion, timeLeft, debouncedSave, saveExamState]);

  useEffect(() => {
    if (timeLeft === null || submitting) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 0) {
          // 时间到，自动提交
          if (!submitting) {
            handleSubmit();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, submitting]);

  const fetchSession = async () => {
    if (!sessionId) return;

    try {
      const response = await fetch(`/api/exam?sessionId=${sessionId}`);

      if (response.ok) {
        const data = await response.json();
        setSession(data);

        // 尝试恢复保存的状态
        const restored = restoreExamState();

        if (!restored) {
          // 如果没有恢复状态，则初始化答案数组
          const initialAnswers = data.questions.map((q: Question) =>
            q.type === 'multiple' ? [] : -1
          );
          setAnswers(initialAnswers);

          // 如果有时间限制，设置倒计时
          if (data.remainingTime !== null && data.remainingTime !== undefined) {
            setTimeLeft(data.remainingTime); // 使用服务器返回的剩余时间（秒）
          } else if (data.timeLimit) {
            setTimeLeft(data.timeLimit * 60); // 如果没有剩余时间，使用完整时间限制
          }
        }
      } else {
        const errorData = await response.json();

        // 如果是超时自动提交，跳转到结果页面
        if (response.status === 410 && errorData.autoSubmitted) {
          clearExamState(); // 清理本地状态
          router.push(`/results/${sessionId}`);
          return;
        }

        setError(errorData.error || '获取考试信息失败');
      }
    } catch (err) {
      setError('加载考试时发生错误');
    } finally {
      setLoading(false);
    }
  };

  // 单选题答案处理
  const handleSingleAnswerChange = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answerIndex;
    setAnswers(newAnswers);

    // 触发自动保存
    debouncedSave(newAnswers, currentQuestion, timeLeft);
  };

  // 多选题答案处理
  const handleMultipleAnswerChange = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...answers];
    const currentAnswers = newAnswers[questionIndex] as number[] || [];

    if (currentAnswers.includes(answerIndex)) {
      // 如果已选中，则取消选择
      newAnswers[questionIndex] = currentAnswers.filter(a => a !== answerIndex);
    } else {
      // 如果未选中，则添加选择
      newAnswers[questionIndex] = [...currentAnswers, answerIndex].sort();
    }
    setAnswers(newAnswers);

    // 触发自动保存
    debouncedSave(newAnswers, currentQuestion, timeLeft);
  };

  const handleSubmit = async () => {
    if (submitting || !sessionId) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/exam/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionId,
          answers,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        // 清理本地保存的状态
        clearExamState();
        // 跳转到结果页面
        router.push(`/results/${sessionId}`);
      } else {
        const data = await response.json();
        setError(data.error || '提交失败');
      }
    } catch (err) {
      setError('提交时发生错误');
    } finally {
      setSubmitting(false);
    }
  };

  // 处理题目切换
  const handleQuestionChange = (newQuestionIndex: number) => {
    setCurrentQuestion(newQuestionIndex);
    // 切换题目时保存状态
    debouncedSave(answers, newQuestionIndex, timeLeft);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    if (!session) return 0;

    const answered = answers.filter((answer, index) => {
      const question = session.questions[index];
      if (question.type === 'multiple') {
        return Array.isArray(answer) && answer.length > 0;
      } else {
        return answer !== -1;
      }
    }).length;

    return (answered / answers.length) * 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载考试中...</p>
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
              href="/exam"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              返回考试配置
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const currentQ = session.questions[currentQuestion];
  const answeredCount = answers.filter((answer, index) => {
    const question = session.questions[index];
    if (question.type === 'multiple') {
      return Array.isArray(answer) && answer.length > 0;
    } else {
      return answer !== -1;
    }
  }).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* 顶部信息栏 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                在线考试 - {session.userName}
              </h1>
              <p className="text-gray-600">
                题目 {currentQuestion + 1} / {session.totalQuestions}
              </p>
            </div>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              {/* 自动保存状态指示器 */}
              {autoSaveStatus && (
                <div className="text-center">
                  <div className={`flex items-center gap-2 text-sm ${autoSaveStatus === 'saved' ? 'text-green-600' :
                      autoSaveStatus === 'saving' ? 'text-blue-600' :
                        'text-red-600'
                    }`}>
                    {autoSaveStatus === 'saved' && (
                      <>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        已保存
                      </>
                    )}
                    {autoSaveStatus === 'saving' && (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        保存中
                      </>
                    )}
                    {autoSaveStatus === 'error' && (
                      <>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        保存失败
                      </>
                    )}
                  </div>
                </div>
              )}
              {timeLeft !== null && (
                <div className="text-center">
                  <div className={`text-2xl font-bold ${timeLeft < 300 ? 'text-red-600' : 'text-blue-600'}`}>
                    {formatTime(timeLeft)}
                  </div>
                  <div className="text-sm text-gray-600">剩余时间</div>
                </div>
              )}
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {answeredCount}
                </div>
                <div className="text-sm text-gray-600">已答题</div>
              </div>
            </div>
          </div>

          {/* 进度条 */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>答题进度</span>
              <span>{Math.round(getProgress())}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProgress()}%` }}
              ></div>
            </div>
          </div>

          {/* 自动保存提示 */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-blue-800">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              您的答题进度会自动保存，短时间离开后可以继续作答
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 题目区域 */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">
                    第 {currentQuestion + 1} 题 / 共 {session.questions.length} 题
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${currentQ.type === 'multiple'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-blue-100 text-blue-800'
                      }`}>
                      {currentQ.type === 'multiple' ? '多选题' : '单选题'}
                    </span>
                    {currentQ.category && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                        {currentQ.category}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-gray-700 text-lg leading-relaxed">
                  {currentQ.question}
                </p>
                {currentQ.type === 'multiple' && (
                  <p className="text-sm text-purple-600 mt-2">
                    注意：这是多选题，可以选择多个答案
                  </p>
                )}
              </div>

              <div className="space-y-4">
                {currentQ.options.map((option, index) => {
                  // 过滤掉空白或BLANK的选项
                  if (!option || option.trim() === '' || option.trim().toLowerCase() === 'blank') {
                    return null;
                  }

                  const isSelected = currentQ.type === 'multiple'
                    ? (answers[currentQuestion] as number[] || []).includes(index)
                    : answers[currentQuestion] === index;

                  return (
                    <label
                      key={index}
                      className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${isSelected
                        ? currentQ.type === 'multiple'
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <div className="flex items-center">
                        <input
                          type={currentQ.type === 'multiple' ? 'checkbox' : 'radio'}
                          name={`question-${currentQuestion}`}
                          checked={isSelected}
                          onChange={() => {
                            if (currentQ.type === 'multiple') {
                              handleMultipleAnswerChange(currentQuestion, index);
                            } else {
                              handleSingleAnswerChange(currentQuestion, index);
                            }
                          }}
                          className={`mr-3 ${currentQ.type === 'multiple'
                            ? 'text-purple-600'
                            : 'text-blue-600'
                            }`}
                        />
                        <span className="text-gray-700">
                          <strong>{String.fromCharCode(65 + index)}.</strong> {option}
                        </span>
                      </div>
                    </label>
                  );
                }).filter(Boolean)}
              </div>

              {/* 导航按钮 */}
              <div className="flex justify-between items-center mt-8">
                <button
                  onClick={() => handleQuestionChange(Math.max(0, currentQuestion - 1))}
                  disabled={currentQuestion === 0}
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一题
                </button>

                {currentQuestion === session.questions.length - 1 ? (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {submitting ? '提交中...' : '提交答案'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleQuestionChange(Math.min(session.questions.length - 1, currentQuestion + 1))}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    下一题
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 题目导航 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">题目导航</h3>
              <div className="grid grid-cols-5 gap-2">
                {session.questions.map((question, index) => {
                  const isAnswered = question.type === 'multiple'
                    ? Array.isArray(answers[index]) && (answers[index] as number[]).length > 0
                    : answers[index] !== -1;

                  return (
                    <button
                      key={index}
                      onClick={() => handleQuestionChange(index)}
                      className={`relative w-full h-10 rounded-lg text-sm font-medium transition-colors ${index === currentQuestion
                        ? 'bg-blue-600 text-white'
                        : isAnswered
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      {index + 1}
                      {question.type === 'multiple' && (
                        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${index === currentQuestion ? 'bg-purple-300' : 'bg-purple-500'
                          }`}></div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center text-sm">
                  <div className="w-4 h-4 bg-blue-600 rounded mr-2"></div>
                  <span className="text-gray-600">当前题目</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-4 h-4 bg-green-100 border border-green-300 rounded mr-2"></div>
                  <span className="text-gray-600">已答题目</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded mr-2"></div>
                  <span className="text-gray-600">未答题目</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="relative w-4 h-4 bg-gray-100 border border-gray-300 rounded mr-2">
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full"></div>
                  </div>
                  <span className="text-gray-600">多选题</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t">
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? '提交中...' : '提交答案'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
