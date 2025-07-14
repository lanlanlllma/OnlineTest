'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ExamSession {
    id: string;
    name: string;
    submittedAt: string;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    duration: number;
    category?: string;
    difficulty?: string;
}

export default function StudentResultDetail({ params }: { params: Promise<{ id: string }> }) {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [session, setSession] = useState<ExamSession | null>(null);
    const [loading, setLoading] = useState(true);

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
                // 只保留基础信息，不包含题目详情
                const basicInfo = {
                    id: data.id,
                    name: data.name,
                    submittedAt: data.submittedAt,
                    score: data.score,
                    totalQuestions: data.totalQuestions,
                    correctAnswers: data.correctAnswers,
                    duration: data.duration,
                    category: data.category,
                    difficulty: data.difficulty
                };
                setSession(basicInfo);
            }
        } catch (error) {
            console.error('获取考试详情失败:', error);
        } finally {
            setLoading(false);
        }
    };

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
                    <h1 className="text-2xl font-bold text-gray-800">考试成绩</h1>
                    <div></div>
                </div>

                {/* Session Info */}
                <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">{session.name}</h2>
                    
                    {/* 成绩概览 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                            <div className={`text-4xl font-bold mb-2 ${session.score >= 80 ? 'text-green-600' :
                                session.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                {session.score.toFixed(1)}%
                            </div>
                            <div className="text-gray-600 font-medium">总分</div>
                        </div>
                        <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                            <div className="text-4xl font-bold text-green-600 mb-2">
                                {session.correctAnswers}
                            </div>
                            <div className="text-gray-600 font-medium">正确题数</div>
                        </div>
                        <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                            <div className="text-4xl font-bold text-purple-600 mb-2">
                                {Math.floor(session.duration / 60)}
                            </div>
                            <div className="text-gray-600 font-medium">用时(分钟)</div>
                        </div>
                        <div className="text-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
                            <div className="text-4xl font-bold text-gray-600 mb-2">
                                {session.totalQuestions}
                            </div>
                            <div className="text-gray-600 font-medium">总题数</div>
                        </div>
                    </div>

                    {/* 详细信息 */}
                    <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">考试详情</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">考试时间:</span>
                                <span className="font-medium text-gray-800">
                                    {new Date(session.submittedAt).toLocaleString('zh-CN')}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">答题用时:</span>
                                <span className="font-medium text-gray-800">
                                    {Math.floor(session.duration / 60)}分{session.duration % 60}秒
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">正确率:</span>
                                <span className="font-medium text-gray-800">
                                    {((session.correctAnswers / session.totalQuestions) * 100).toFixed(1)}%
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">错误题数:</span>
                                <span className="font-medium text-gray-800">
                                    {session.totalQuestions - session.correctAnswers}
                                </span>
                            </div>
                            {session.category && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">题目分类:</span>
                                    <span className="font-medium text-gray-800">{session.category}</span>
                                </div>
                            )}
                            {session.difficulty && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">难度等级:</span>
                                    <span className="font-medium text-gray-800">{session.difficulty}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 成绩等级 */}
                    <div className="mt-6 text-center">
                        <div className={`inline-block px-6 py-3 rounded-full font-bold text-lg ${session.score >= 90 ? 'bg-green-100 text-green-800' :
                            session.score >= 80 ? 'bg-blue-100 text-blue-800' :
                                session.score >= 70 ? 'bg-yellow-100 text-yellow-800' :
                                    session.score >= 60 ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'
                            }`}>
                            {session.score >= 90 ? '优秀' :
                                session.score >= 80 ? '良好' :
                                    session.score >= 70 ? '中等' :
                                        session.score >= 60 ? '及格' : '不及格'}
                        </div>
                    </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex justify-center space-x-4">
                    <Link
                        href="/student/results"
                        className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        返回成绩列表
                    </Link>
                    <Link
                        href="/exam"
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        开始新考试
                    </Link>
                </div>
            </div>
        </div>
    );
}
