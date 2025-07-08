'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Question {
    id: string;
    question: string;
    type: 'single' | 'multiple';
    options: string[];
    correctAnswer: string;
    userAnswer?: string;
    explanation?: string;
    category?: string;
    difficulty?: string;
}

interface ExamSession {
    id: string;
    name: string;
    submittedAt: string;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    duration: number;
    questions: Question[];
}

export default function StudentResultDetail({ params }: { params: Promise<{ id: string }> }) {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [session, setSession] = useState<ExamSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [showExplanations, setShowExplanations] = useState(false);
    const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect'>('all');

    useEffect(() => {
        async function getParams() {
            const resolvedParams = await params;
            setSessionId(resolvedParams.id);
        }
        getParams();
    }, [params]);

    useEffect(() => {
        if (sessionId) {
            fetchSessionDetail();
        }
    }, [sessionId]);

    const fetchSessionDetail = async () => {
        try {
            const response = await fetch(`/api/student/results/${sessionId}`);
            if (response.ok) {
                const data = await response.json();
                setSession(data);
            }
        } catch (error) {
            console.error('获取考试详情失败:', error);
        } finally {
            setLoading(false);
        }
    };

    const isAnswerCorrect = (question: Question): boolean => {
        if (!question.userAnswer) return false;

        if (question.type === 'multiple') {
            // 多选题：比较逗号分隔的答案
            const correctAnswers = question.correctAnswer.split(',').sort();
            const userAnswers = question.userAnswer.split(',').sort();

            return correctAnswers.length === userAnswers.length &&
                correctAnswers.every((val, i) => val === userAnswers[i]);
        } else {
            // 单选题：直接比较
            return question.userAnswer === question.correctAnswer;
        }
    };

    const filteredQuestions = session?.questions.filter(question => {
        if (filter === 'correct') return isAnswerCorrect(question);
        if (filter === 'incorrect') return !isAnswerCorrect(question);
        return true;
    }) || [];

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

    if (!session) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 text-lg mb-4">考试记录不存在</p>
                    <Link
                        href="/student/results"
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        返回成绩列表
                    </Link>
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
                        href="/student/results"
                        className="text-blue-600 hover:text-blue-800 flex items-center"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        返回成绩列表
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-800">考试详情</h1>
                    <div></div>
                </div>

                {/* Session Info */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">{session.name}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className={`text-3xl font-bold mb-2 ${session.score >= 80 ? 'text-green-600' :
                                session.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                {session.score.toFixed(1)}%
                            </div>
                            <div className="text-gray-600">总分</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600 mb-2">
                                {session.correctAnswers}/{session.totalQuestions}
                            </div>
                            <div className="text-gray-600">正确题数</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-purple-600 mb-2">
                                {Math.floor(session.duration / 60)}分钟
                            </div>
                            <div className="text-gray-600">用时</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-bold text-gray-600 mb-2">
                                {new Date(session.submittedAt).toLocaleDateString()}
                            </div>
                            <div className="text-gray-600">考试时间</div>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                    <div className="flex flex-wrap gap-4 items-center justify-between">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-4 py-2 rounded-lg transition-colors ${filter === 'all'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                全部题目 ({session.questions.length})
                            </button>
                            <button
                                onClick={() => setFilter('correct')}
                                className={`px-4 py-2 rounded-lg transition-colors ${filter === 'correct'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                正确题目 ({session.correctAnswers})
                            </button>
                            <button
                                onClick={() => setFilter('incorrect')}
                                className={`px-4 py-2 rounded-lg transition-colors ${filter === 'incorrect'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                错误题目 ({session.totalQuestions - session.correctAnswers})
                            </button>
                        </div>
                        <div>
                            <button
                                onClick={() => setShowExplanations(!showExplanations)}
                                className={`px-4 py-2 rounded-lg transition-colors ${showExplanations
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {showExplanations ? '隐藏解析' : '显示解析'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Questions */}
                <div className="space-y-6">
                    {filteredQuestions.map((question, index) => {
                        const isCorrect = isAnswerCorrect(question);
                        return (
                            <div key={question.id} className="bg-white rounded-lg shadow-lg p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-lg font-semibold text-gray-800">
                                                题目 {session.questions.indexOf(question) + 1}
                                            </h3>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${question.type === 'multiple'
                                                ? 'bg-purple-100 text-purple-800'
                                                : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                {question.type === 'multiple' ? '多选题' : '单选题'}
                                            </span>
                                        </div>
                                        <p className="text-gray-700 mb-4">{question.question}</p>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${isCorrect
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                        }`}>
                                        {isCorrect ? '正确' : '错误'}
                                    </div>
                                </div>

                                {/* Options */}
                                <div className="space-y-2 mb-4">
                                    {question.options.map((option, optionIndex) => {
                                        // 过滤掉空白或BLANK的选项
                                        if (!option || option.trim() === '' || option.trim().toLowerCase() === 'blank') {
                                            return null;
                                        }

                                        const optionLabel = String.fromCharCode(65 + optionIndex);

                                        // 处理多选和单选的答案判断
                                        const correctAnswers = question.correctAnswer.split(',');
                                        const userAnswers = question.userAnswer ? question.userAnswer.split(',') : [];

                                        const isUserAnswer = userAnswers.includes(optionLabel);
                                        const isCorrectAnswer = correctAnswers.includes(optionLabel);

                                        return (
                                            <div
                                                key={optionIndex}
                                                className={`p-3 rounded-lg border-2 ${isCorrectAnswer
                                                    ? 'border-green-500 bg-green-50'
                                                    : isUserAnswer && !isCorrectAnswer
                                                        ? 'border-red-500 bg-red-50'
                                                        : 'border-gray-200 bg-gray-50'
                                                    }`}
                                            >
                                                <div className="flex items-center">
                                                    <span className={`w-6 h-6 rounded-full text-sm font-medium flex items-center justify-center mr-3 ${isCorrectAnswer
                                                        ? 'bg-green-500 text-white'
                                                        : isUserAnswer && !isCorrectAnswer
                                                            ? 'bg-red-500 text-white'
                                                            : 'bg-gray-300 text-gray-700'
                                                        }`}>
                                                        {optionLabel}
                                                    </span>
                                                    <span className="text-gray-700">{option}</span>
                                                    <div className="ml-auto flex items-center gap-2">
                                                        {isUserAnswer && (
                                                            <span className="text-sm text-gray-500">你的答案</span>
                                                        )}
                                                        {isCorrectAnswer && (
                                                            <span className="text-sm text-green-600 font-medium">正确答案</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }).filter(Boolean)}
                                </div>

                                {/* Tags */}
                                {(question.category || question.difficulty) && (
                                    <div className="flex gap-2 mb-4">
                                        {question.category && (
                                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                                {question.category}
                                            </span>
                                        )}
                                        {question.difficulty && (
                                            <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                                                {question.difficulty}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Explanation */}
                                {showExplanations && question.explanation && (
                                    <div className="border-t border-gray-200 pt-4">
                                        <h4 className="font-medium text-gray-800 mb-2">解析:</h4>
                                        <p className="text-gray-600">{question.explanation}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {filteredQuestions.length === 0 && (
                    <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                        <p className="text-gray-500 text-lg">没有符合条件的题目</p>
                    </div>
                )}
            </div>
        </div>
    );
}
