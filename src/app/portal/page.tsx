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

export default function Portal() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

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
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-4">
                        在线答题系统
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        请选择您要进入的系统
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

                {/* Main Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 max-w-4xl mx-auto">
                    {/* 学生端 */}
                    <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-blue-200">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-4">学生端</h3>
                            <p className="text-gray-600 mb-8 text-lg">
                                选择测试项目并参与在线答题
                            </p>
                            <div className="space-y-4 mb-8">
                                <div className="flex items-center justify-center text-sm text-gray-500">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    选择测试项目
                                </div>
                                <div className="flex items-center justify-center text-sm text-gray-500">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    参与在线答题
                                </div>
                                <div className="flex items-center justify-center text-sm text-gray-500">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    查看个人成绩
                                </div>
                            </div>
                            <Link
                                href="/student"
                                className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors inline-block text-lg font-semibold"
                            >
                                进入学生端
                            </Link>
                        </div>
                    </div>

                    {/* 管理端 */}
                    <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-green-200">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-4">管理端</h3>
                            <p className="text-gray-600 mb-8 text-lg">
                                上传题库和查看考试成绩
                            </p>
                            <div className="space-y-4 mb-8">
                                <div className="flex items-center justify-center text-sm text-gray-500">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    上传题库管理
                                </div>
                                <div className="flex items-center justify-center text-sm text-gray-500">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    查看所有成绩
                                </div>
                                <div className="flex items-center justify-center text-sm text-gray-500">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    导出统计报告
                                </div>
                            </div>
                            <Link
                                href="/admin"
                                className="bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 transition-colors inline-block text-lg font-semibold"
                            >
                                进入管理端
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Features */}
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">系统特性</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                            </div>
                            <h4 className="font-semibold text-gray-800 mb-1">Excel导入</h4>
                            <p className="text-sm text-gray-600">支持.xlsx/.xls格式</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </div>
                            <h4 className="font-semibold text-gray-800 mb-1">随机抽取</h4>
                            <p className="text-sm text-gray-600">指定数量随机出题</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h4 className="font-semibold text-gray-800 mb-1">在线答题</h4>
                            <p className="text-sm text-gray-600">支持计时和进度保存</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h4 className="font-semibold text-gray-800 mb-1">结果导出</h4>
                            <p className="text-sm text-gray-600">PDF格式详细报告</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
