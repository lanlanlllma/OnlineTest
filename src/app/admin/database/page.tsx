'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DatabaseStats {
    totalQuestions: number;
    totalSessions: number;
    completedSessions: number;
    categories: string[];
    difficulties: string[];
    fileSize: string;
    lastUpdate: string;
}

export default function DatabaseManagement() {
    const [stats, setStats] = useState<DatabaseStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/admin/database?action=stats');
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('获取数据库统计失败:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBackup = async () => {
        setActionLoading('backup');
        try {
            const response = await fetch('/api/admin/database?action=backup');
            if (response.ok) {
                const data = await response.json();
                alert(`备份创建成功: ${data.backupFile}`);
                fetchStats();
            } else {
                alert('备份失败');
            }
        } catch {
            alert('备份时发生错误');
        } finally {
            setActionLoading(null);
        }
    };

    const handleClearData = async () => {
        if (!confirm('确定要清空所有数据吗？此操作不可逆！')) {
            return;
        }

        setActionLoading('clear');
        try {
            const response = await fetch('/api/admin/database', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'clear' })
            });

            if (response.ok) {
                alert('数据库清空成功');
                fetchStats();
            } else {
                alert('清空失败');
            }
        } catch {
            alert('清空时发生错误');
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <Link
                        href="/admin"
                        className="text-purple-600 hover:text-purple-800 flex items-center"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        返回管理端
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-800">数据库管理</h1>
                    <div></div>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">加载数据库信息中...</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* 数据库统计 */}
                        <div className="bg-white rounded-xl shadow-lg p-8">
                            <h2 className="text-xl font-bold text-gray-800 mb-6">数据库统计</h2>

                            {stats && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="bg-blue-50 rounded-lg p-6 text-center">
                                        <div className="text-3xl font-bold text-blue-600 mb-2">
                                            {stats.totalQuestions}
                                        </div>
                                        <div className="text-gray-600">题目总数</div>
                                    </div>

                                    <div className="bg-green-50 rounded-lg p-6 text-center">
                                        <div className="text-3xl font-bold text-green-600 mb-2">
                                            {stats.completedSessions}
                                        </div>
                                        <div className="text-gray-600">已完成考试</div>
                                    </div>

                                    <div className="bg-purple-50 rounded-lg p-6 text-center">
                                        <div className="text-3xl font-bold text-purple-600 mb-2">
                                            {stats.categories.length}
                                        </div>
                                        <div className="text-gray-600">题目分类</div>
                                    </div>

                                    <div className="bg-orange-50 rounded-lg p-6 text-center">
                                        <div className="text-3xl font-bold text-orange-600 mb-2">
                                            {stats.fileSize}
                                        </div>
                                        <div className="text-gray-600">数据库大小</div>
                                    </div>
                                </div>
                            )}

                            {stats && (
                                <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                                    <h3 className="font-semibold text-gray-800 mb-2">详细信息</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                                        <div>
                                            <span className="font-medium">总考试次数:</span> {stats.totalSessions}
                                        </div>
                                        <div>
                                            <span className="font-medium">最后更新:</span> {new Date(stats.lastUpdate).toLocaleString()}
                                        </div>
                                        <div>
                                            <span className="font-medium">题目分类:</span> {stats.categories.join(', ') || '无'}
                                        </div>
                                        <div>
                                            <span className="font-medium">难度等级:</span> {stats.difficulties.join(', ') || '无'}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 数据库操作 */}
                        <div className="bg-white rounded-xl shadow-lg p-8">
                            <h2 className="text-xl font-bold text-gray-800 mb-6">数据库操作</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* 备份操作 */}
                                <div className="border border-gray-200 rounded-lg p-6">
                                    <div className="flex items-center mb-4">
                                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l2 2 4-4" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-800">创建备份</h3>
                                            <p className="text-sm text-gray-600">备份当前所有数据</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleBackup}
                                        disabled={actionLoading === 'backup'}
                                        className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                    >
                                        {actionLoading === 'backup' ? '备份中...' : '创建备份'}
                                    </button>
                                </div>

                                {/* 清空数据 */}
                                <div className="border border-red-200 rounded-lg p-6">
                                    <div className="flex items-center mb-4">
                                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-800">清空数据</h3>
                                            <p className="text-sm text-gray-600">删除所有题目和考试记录</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleClearData}
                                        disabled={actionLoading === 'clear'}
                                        className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                    >
                                        {actionLoading === 'clear' ? '清空中...' : '清空数据'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 数据持久化说明 */}
                        <div className="bg-white rounded-xl shadow-lg p-8">
                            <h2 className="text-xl font-bold text-gray-800 mb-6">数据持久化说明</h2>

                            <div className="space-y-4 text-gray-600">
                                <div className="flex items-start">
                                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                    <p>所有数据现在自动保存到本地JSON文件中，服务器重启后数据不会丢失</p>
                                </div>

                                <div className="flex items-start">
                                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                    <p>每次添加题目、创建考试或更新记录时都会自动保存</p>
                                </div>

                                <div className="flex items-start">
                                    <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                    <p>建议定期创建备份，以防数据文件损坏</p>
                                </div>

                                <div className="flex items-start">
                                    <div className="w-2 h-2 bg-orange-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                    <p>数据文件位置: /data/database.json</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
