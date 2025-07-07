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

export default function StudentPortal() {
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
                <div className="flex justify-between items-center mb-8">
                    <Link
                        href="/portal"
                        className="text-blue-600 hover:text-blue-800 flex items-center"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        返回门户
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-800">学生端</h1>
                    <div></div>
                </div>

                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
                        在线答题系统
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        选择您要参与的测试项目，开始在线答题
                    </p>
                </div>

                {/* Stats */}
                {!loading && stats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                            <div className="text-3xl font-bold text-blue-600 mb-2">
                                {stats.totalQuestions}
                            </div>
                            <div className="text-gray-600">可用题目</div>
                        </div>
                        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                            <div className="text-3xl font-bold text-green-600 mb-2">
                                {stats.categories.length}
                            </div>
                            <div className="text-gray-600">测试分类</div>
                        </div>
                        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                            <div className="text-3xl font-bold text-purple-600 mb-2">
                                {stats.completedSessions}
                            </div>
                            <div className="text-gray-600">已完成考试</div>
                        </div>
                    </div>
                )}

                {/* Main Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    {/* 开始考试 */}
                    <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">开始考试</h3>
                            <p className="text-gray-600 mb-6">
                                配置考试参数，开始在线答题
                            </p>
                            <Link
                                href="/exam"
                                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors inline-block"
                            >
                                开始考试
                            </Link>
                        </div>
                    </div>

                    {/* 我的成绩 */}
                    <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">我的成绩</h3>
                            <p className="text-gray-600 mb-6">
                                查看个人考试记录和成绩
                            </p>
                            <Link
                                href="/student/results"
                                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors inline-block"
                            >
                                查看成绩
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Available Categories */}
                {!loading && stats && stats.categories.length > 0 && (
                    <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">可用测试分类</h2>
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

                {/* Features for Students */}
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">学生功能</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <h4 className="font-semibold text-gray-800 mb-1">选择测试</h4>
                            <p className="text-sm text-gray-600">根据分类和难度选择测试</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h4 className="font-semibold text-gray-800 mb-1">计时答题</h4>
                            <p className="text-sm text-gray-600">支持计时和进度保存</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h4 className="font-semibold text-gray-800 mb-1">成绩查看</h4>
                            <p className="text-sm text-gray-600">查看个人历史成绩</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
