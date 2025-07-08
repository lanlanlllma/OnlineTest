'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLogin from '@/components/AdminLogin';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface AnalyticsData {
    totalQuestions: number;
    totalSessions: number;
    completedSessions: number;
    averageScore: number;
    categoryStats: {
        [category: string]: {
            totalQuestions: number;
            averageScore: number;
            sessionCount: number;
        };
    };
    difficultyStats: {
        [difficulty: string]: {
            totalQuestions: number;
            averageScore: number;
            sessionCount: number;
        };
    };
    scoreDistribution: {
        '0-60': number;
        '60-80': number;
        '80-100': number;
    };
    recentActivity: {
        date: string;
        sessionCount: number;
    }[];
}

export default function AdminAnalytics() {
    const { isAuthenticated, loading: authLoading, login } = useAdminAuth();
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isAuthenticated) {
            fetchAnalytics();
        }
    }, [isAuthenticated]);

    const fetchAnalytics = async () => {
        try {
            const response = await fetch('/api/admin/analytics');
            if (response.ok) {
                const data = await response.json();
                setAnalytics(data);
            }
        } catch (error) {
            console.error('获取分析数据失败:', error);
        } finally {
            setLoading(false);
        }
    };

    // 如果正在加载认证状态，显示加载中
    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">正在验证身份...</p>
                </div>
            </div>
        );
    }

    // 如果未认证，显示登录页面
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center mb-8">
                        <Link
                            href="/admin"
                            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
                        >
                            ← 返回管理端
                        </Link>
                        <h1 className="text-4xl font-bold text-gray-800 mb-4">管理员登录</h1>
                        <p className="text-gray-600">请输入管理员密码以访问统计分析</p>
                    </div>
                    <AdminLogin onLogin={login} />
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">加载分析数据中...</p>
                </div>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 text-lg mb-4">暂无分析数据</p>
                    <Link
                        href="/admin"
                        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                    >
                        返回管理端
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <Link
                        href="/admin"
                        className="text-green-600 hover:text-green-800 flex items-center"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        返回管理端
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-800">统计分析</h1>
                    <div></div>
                </div>

                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                        <div className="text-3xl font-bold text-blue-600 mb-2">
                            {analytics.totalQuestions}
                        </div>
                        <div className="text-gray-600">题目总数</div>
                    </div>
                    <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                        <div className="text-3xl font-bold text-green-600 mb-2">
                            {analytics.completedSessions}
                        </div>
                        <div className="text-gray-600">已完成考试</div>
                    </div>
                    <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                        <div className="text-3xl font-bold text-purple-600 mb-2">
                            {analytics.averageScore.toFixed(1)}%
                        </div>
                        <div className="text-gray-600">平均分数</div>
                    </div>
                    <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                        <div className="text-3xl font-bold text-orange-600 mb-2">
                            {analytics.totalSessions}
                        </div>
                        <div className="text-gray-600">考试总次数</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Score Distribution */}
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">分数分布</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">优秀 (80-100分)</span>
                                <div className="flex items-center">
                                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                                        <div
                                            className="bg-green-600 h-2 rounded-full"
                                            style={{
                                                width: `${(analytics.scoreDistribution['80-100'] / analytics.completedSessions) * 100}%`
                                            }}
                                        ></div>
                                    </div>
                                    <span className="text-sm font-medium text-gray-800 w-12">
                                        {analytics.scoreDistribution['80-100']}人
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">良好 (60-80分)</span>
                                <div className="flex items-center">
                                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                                        <div
                                            className="bg-yellow-500 h-2 rounded-full"
                                            style={{
                                                width: `${(analytics.scoreDistribution['60-80'] / analytics.completedSessions) * 100}%`
                                            }}
                                        ></div>
                                    </div>
                                    <span className="text-sm font-medium text-gray-800 w-12">
                                        {analytics.scoreDistribution['60-80']}人
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">待提高 (0-60分)</span>
                                <div className="flex items-center">
                                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                                        <div
                                            className="bg-red-500 h-2 rounded-full"
                                            style={{
                                                width: `${(analytics.scoreDistribution['0-60'] / analytics.completedSessions) * 100}%`
                                            }}
                                        ></div>
                                    </div>
                                    <span className="text-sm font-medium text-gray-800 w-12">
                                        {analytics.scoreDistribution['0-60']}人
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">最近活动</h3>
                        <div className="space-y-3">
                            {analytics.recentActivity.slice(0, 7).map((activity, index) => (
                                <div key={index} className="flex justify-between items-center">
                                    <span className="text-gray-600">{activity.date}</span>
                                    <div className="flex items-center">
                                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-3">
                                            <div
                                                className="bg-blue-500 h-2 rounded-full"
                                                style={{
                                                    width: `${Math.min((activity.sessionCount / 10) * 100, 100)}%`
                                                }}
                                            ></div>
                                        </div>
                                        <span className="text-sm font-medium text-gray-800 w-8">
                                            {activity.sessionCount}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Category Stats */}
                {Object.keys(analytics.categoryStats).length > 0 && (
                    <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">分类统计</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.entries(analytics.categoryStats).map(([category, stats]) => (
                                <div key={category} className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="font-semibold text-gray-800 mb-2">{category}</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">题目数:</span>
                                            <span className="font-medium">{stats.totalQuestions}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">考试次数:</span>
                                            <span className="font-medium">{stats.sessionCount}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">平均分:</span>
                                            <span className={`font-medium ${stats.averageScore >= 80 ? 'text-green-600' :
                                                stats.averageScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                                                }`}>
                                                {stats.averageScore.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Difficulty Stats */}
                {Object.keys(analytics.difficultyStats).length > 0 && (
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">难度统计</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {Object.entries(analytics.difficultyStats).map(([difficulty, stats]) => (
                                <div key={difficulty} className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="font-semibold text-gray-800 mb-2">
                                        {difficulty === 'easy' ? '简单' : difficulty === 'medium' ? '中等' : '困难'}
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">题目数:</span>
                                            <span className="font-medium">{stats.totalQuestions}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">考试次数:</span>
                                            <span className="font-medium">{stats.sessionCount}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">平均分:</span>
                                            <span className={`font-medium ${stats.averageScore >= 80 ? 'text-green-600' :
                                                stats.averageScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                                                }`}>
                                                {stats.averageScore.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
