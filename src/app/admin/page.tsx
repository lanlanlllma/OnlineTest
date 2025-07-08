'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Stats {
    totalQuestions: number;
    totalSessions: number;
    completedSessions: number;
    categories: string[];
    difficulties: string[];
}

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

export default function AdminPortal() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [recentSessions, setRecentSessions] = useState<ExamSession[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
        fetchRecentSessions();
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
        } finally {
            setLoading(false);
        }
    };

    const fetchRecentSessions = async () => {
        try {
            const response = await fetch('/api/results');
            if (response.ok) {
                const data = await response.json();
                // 获取最近的5个考试记录
                const recent = data
                    .filter((session: ExamSession) => session.status === 'completed')
                    .sort((a: ExamSession, b: ExamSession) =>
                        new Date(b.endTime || b.startTime).getTime() - new Date(a.endTime || a.startTime).getTime()
                    )
                    .slice(0, 5);
                setRecentSessions(recent);
            }
        } catch (error) {
            console.error('获取最近考试记录失败:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <Link
                        href="/portal"
                        className="text-green-600 hover:text-green-800 flex items-center"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        返回门户
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-800">管理端</h1>
                    <div></div>
                </div>

                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
                        在线答题系统管理端
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        管理题库，查看所有考试成绩，导出统计报告
                    </p>
                </div>

                {/* Stats */}
                {!loading && stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                            <div className="text-3xl font-bold text-blue-600 mb-2">
                                {stats.totalQuestions}
                            </div>
                            <div className="text-gray-600">题目总数</div>
                        </div>
                        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                            <div className="text-3xl font-bold text-green-600 mb-2">
                                {stats.completedSessions}
                            </div>
                            <div className="text-gray-600">已完成考试</div>
                        </div>
                        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                            <div className="text-3xl font-bold text-purple-600 mb-2">
                                {stats.categories.length}
                            </div>
                            <div className="text-gray-600">题目分类</div>
                        </div>
                        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                            <div className="text-3xl font-bold text-orange-600 mb-2">
                                {stats.totalSessions}
                            </div>
                            <div className="text-gray-600">总考试次数</div>
                        </div>
                    </div>
                )}

                {/* Main Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    {/* 题目管理 */}
                    <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">题目管理</h3>
                            <p className="text-gray-600 mb-6">
                                上传Excel文件导入题目，管理题库
                            </p>
                            <Link
                                href="/upload"
                                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block"
                            >
                                管理题目
                            </Link>
                        </div>
                    </div>

                    {/* 成绩管理 */}
                    <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">成绩管理</h3>
                            <p className="text-gray-600 mb-6">
                                查看所有考试记录，导出统计报告
                            </p>
                            <Link
                                href="/results"
                                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors inline-block"
                            >
                                查看成绩
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-12">
                    <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <h4 className="font-semibold text-gray-800 mb-2">下载模板</h4>
                        <p className="text-sm text-gray-600 mb-3">下载Excel导入模板</p>
                        <a
                            href="/api/sample-excel"
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                            下载模板
                        </a>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>
                        <h4 className="font-semibold text-gray-800 mb-2">批量导出</h4>
                        <p className="text-sm text-gray-600 mb-3">导出所有考试成绩</p>
                        <Link
                            href="/admin/export"
                            className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                        >
                            批量导出
                        </Link>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <h4 className="font-semibold text-gray-800 mb-2">统计分析</h4>
                        <p className="text-sm text-gray-600 mb-3">查看详细统计分析</p>
                        <Link
                            href="/admin/analytics"
                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                        >
                            查看分析
                        </Link>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                            </svg>
                        </div>
                        <h4 className="font-semibold text-gray-800 mb-2">数据库管理</h4>
                        <p className="text-sm text-gray-600 mb-3">备份和管理数据</p>
                        <Link
                            href="/admin/database"
                            className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                        >
                            管理数据库
                        </Link>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h4 className="font-semibold text-gray-800 mb-2">优化数据库</h4>
                        <p className="text-sm text-gray-600 mb-3">UUID键值对存储</p>
                        <Link
                            href="/admin/database-optimized"
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                            优化管理
                        </Link>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                        <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h4 className="font-semibold text-gray-800 mb-2">考试模板</h4>
                        <p className="text-sm text-gray-600 mb-3">管理考试类型配置</p>
                        <Link
                            href="/admin/exam-templates"
                            className="text-teal-600 hover:text-teal-800 text-sm font-medium"
                        >
                            配置模板
                        </Link>
                    </div>
                </div>

                {/* Available Categories */}
                {!loading && stats && stats.categories.length > 0 && (
                    <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">题目分类统计</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {stats.categories.map((category, index) => (
                                <div key={index} className="bg-gray-50 rounded-lg p-4 text-center">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                        </svg>
                                    </div>
                                    <h4 className="font-semibold text-gray-800">{category}</h4>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recent Exam Records */}
                {!loading && recentSessions.length > 0 && (
                    <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">最近考试记录</h2>
                            <Link
                                href="/results"
                                className="text-green-600 hover:text-green-800 text-sm font-medium"
                            >
                                查看全部 →
                            </Link>
                        </div>
                        <div className="space-y-4">
                            {recentSessions.map((session) => (
                                <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-800">{session.userName}</h3>
                                            <p className="text-sm text-gray-600">
                                                {new Date(session.endTime || session.startTime).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>                    <div className="flex items-center space-x-4">
                                        <div className="text-right">
                                            <div className={`text-lg font-bold ${session.score >= 80 ? 'text-green-600' :
                                                session.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                                                }`}>
                                                {session.score.toFixed(1)}%
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                {Math.round((session.score / 100) * session.totalQuestions)}/{session.totalQuestions}
                                            </div>
                                        </div>
                                        <Link
                                            href={`/results/${session.id}`}
                                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                                        >
                                            查看详情 →
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Features for Admin */}
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">管理功能</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                            </div>
                            <h4 className="font-semibold text-gray-800 mb-1">题库管理</h4>
                            <p className="text-sm text-gray-600">Excel批量导入题目</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h4 className="font-semibold text-gray-800 mb-1">成绩查看</h4>
                            <p className="text-sm text-gray-600">查看所有学生成绩</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h4 className="font-semibold text-gray-800 mb-1">报告导出</h4>
                            <p className="text-sm text-gray-600">CSV格式统计报告</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h4 className="font-semibold text-gray-800 mb-1">数据分析</h4>
                            <p className="text-sm text-gray-600">详细的统计分析</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                                </svg>
                            </div>
                            <h4 className="font-semibold text-gray-800 mb-1">数据库管理</h4>
                            <p className="text-sm text-gray-600">数据备份和恢复</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
