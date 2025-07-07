'use client';

import React, { useState, useEffect } from 'react';

interface DatabaseStats {
    totalQuestions: number;
    totalSessions: number;
    completedSessions: number;
    categories: string[];
    difficulties: string[];
    fileSize: string;
    spaceSaved: string;
    lastUpdated: string;
}

interface MigrationResult {
    success: boolean;
    message: string;
    stats?: DatabaseStats;
    error?: string;
}

export default function OptimizedDatabasePage() {
    const [stats, setStats] = useState<DatabaseStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [migrating, setMigrating] = useState(false);
    const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);

    // 加载数据库统计信息
    const loadStats = async () => {
        try {
            const response = await fetch('/api/admin/database-optimized?action=stats');
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('加载统计信息失败:', error);
        } finally {
            setLoading(false);
        }
    };

    // 执行数据迁移
    const handleMigration = async () => {
        setMigrating(true);
        setMigrationResult(null);

        try {
            const response = await fetch('/api/admin/database-optimized?action=migrate');
            const result = await response.json();
            setMigrationResult(result);

            if (result.success) {
                await loadStats(); // 重新加载统计信息
            }
        } catch (error) {
            setMigrationResult({
                success: false,
                message: '迁移请求失败',
                error: error instanceof Error ? error.message : '未知错误'
            });
        } finally {
            setMigrating(false);
        }
    };

    // 创建备份
    const handleBackup = async () => {
        try {
            const response = await fetch('/api/admin/database-optimized?action=backup');
            const result = await response.json();

            if (result.success) {
                alert(`备份创建成功: ${result.backupFile}`);
            } else {
                alert('备份创建失败');
            }
        } catch (error) {
            alert('备份创建失败');
        }
    };

    // 清空数据
    const handleClearData = async (type: 'questions' | 'sessions' | 'all') => {
        if (!confirm(`确定要清空${type === 'questions' ? '题目' : type === 'sessions' ? '会话' : '所有'}数据吗？`)) {
            return;
        }

        try {
            const response = await fetch('/api/admin/database-optimized', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: type === 'questions' ? 'clear-questions' :
                        type === 'sessions' ? 'clear-sessions' : 'clear-all'
                }),
            });

            const result = await response.json();

            if (result.success) {
                alert(result.message);
                await loadStats(); // 重新加载统计信息
            } else {
                alert('操作失败');
            }
        } catch (error) {
            alert('操作失败');
        }
    };

    useEffect(() => {
        loadStats();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">加载中...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">优化数据库管理</h1>
                    <p className="text-gray-600">采用UUID键值对存储的优化数据库</p>
                </div>

                {/* 数据库状态概览 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">题目数量</p>
                                <p className="text-2xl font-bold text-gray-900">{stats?.totalQuestions || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-3 rounded-full bg-green-100 text-green-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">考试会话</p>
                                <p className="text-2xl font-bold text-gray-900">{stats?.totalSessions || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">已完成</p>
                                <p className="text-2xl font-bold text-gray-900">{stats?.completedSessions || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">文件大小</p>
                                <p className="text-2xl font-bold text-gray-900">{stats?.fileSize || '0 B'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 数据迁移区域 */}
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">数据迁移</h2>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <h3 className="font-semibold text-blue-900 mb-2">优化数据库特性</h3>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• 使用UUID作为题目唯一标识符</li>
                            <li>• 考试会话中只存储题目ID引用，避免数据重复</li>
                            <li>• 采用键值对存储，提高查询效率</li>
                            <li>• 包含元数据缓存，减少计算开销</li>
                            <li>• 估算节省空间：{stats?.spaceSaved || '未知'}</li>
                        </ul>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={handleMigration}
                            disabled={migrating}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {migrating && (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            )}
                            {migrating ? '迁移中...' : '开始迁移'}
                        </button>

                        <button
                            onClick={handleBackup}
                            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                        >
                            创建备份
                        </button>
                    </div>

                    {migrationResult && (
                        <div className={`mt-4 p-4 rounded-lg ${migrationResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                            <div className={`font-semibold ${migrationResult.success ? 'text-green-900' : 'text-red-900'}`}>
                                {migrationResult.message}
                            </div>
                            {migrationResult.error && (
                                <div className="text-red-700 text-sm mt-2">
                                    错误详情: {migrationResult.error}
                                </div>
                            )}
                            {migrationResult.stats && (
                                <div className="mt-2 text-sm text-gray-600">
                                    <p>迁移后统计: {migrationResult.stats.totalQuestions} 题目, {migrationResult.stats.totalSessions} 会话</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 数据库管理操作 */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">数据库管理</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button
                            onClick={() => handleClearData('questions')}
                            className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600"
                        >
                            清空题目数据
                        </button>

                        <button
                            onClick={() => handleClearData('sessions')}
                            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
                        >
                            清空会话数据
                        </button>

                        <button
                            onClick={() => handleClearData('all')}
                            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                        >
                            清空所有数据
                        </button>
                    </div>
                </div>

                {/* 统计信息 */}
                {stats && (
                    <div className="bg-white rounded-lg shadow p-6 mt-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">详细统计</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-semibold text-gray-700 mb-2">题目分类</h3>
                                <div className="bg-gray-50 p-3 rounded">
                                    {stats.categories.length > 0 ? (
                                        <ul className="text-sm text-gray-600">
                                            {stats.categories.map((category, index) => (
                                                <li key={index}>• {category}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-gray-500">暂无分类</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-700 mb-2">难度等级</h3>
                                <div className="bg-gray-50 p-3 rounded">
                                    {stats.difficulties.length > 0 ? (
                                        <ul className="text-sm text-gray-600">
                                            {stats.difficulties.map((difficulty, index) => (
                                                <li key={index}>• {difficulty}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-gray-500">暂无难度分级</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 text-sm text-gray-500">
                            最后更新: {new Date(stats.lastUpdated).toLocaleString()}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
