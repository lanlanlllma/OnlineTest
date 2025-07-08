'use client';

import { useState } from 'react';
import Link from 'next/link';
import AdminLogin from '@/components/AdminLogin';
import { useAdminAuth } from '@/hooks/useAdminAuth';

export default function AdminExport() {
    const { isAuthenticated, loading: authLoading, login, logout } = useAdminAuth();
    const [exporting, setExporting] = useState(false);
    const [exportType, setExportType] = useState<'all' | 'summary'>('all');

    const handleExport = async () => {
        setExporting(true);
        try {
            const response = await fetch('/api/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: exportType,
                    title: exportType === 'all' ? '所有考试记录汇总' : '考试统计汇总'
                })
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `考试记录汇总_${new Date().toISOString().split('T')[0]}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                alert('导出失败，请重试');
            }
        } catch (error) {
            console.error('导出失败:', error);
            alert('导出失败，请重试');
        } finally {
            setExporting(false);
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
                        <p className="text-gray-600">请输入管理员密码以访问批量导出功能</p>
                    </div>
                    <AdminLogin onLogin={login} />
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
                    <h1 className="text-2xl font-bold text-gray-800">批量导出</h1>
                    <div></div>
                </div>

                <div className="max-w-2xl mx-auto">
                    {/* Export Options */}
                    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                        <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">选择导出类型</h2>

                        <div className="space-y-4 mb-8">
                            <div
                                onClick={() => setExportType('all')}
                                className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${exportType === 'all'
                                        ? 'border-green-500 bg-green-50'
                                        : 'border-gray-200 hover:border-green-300'
                                    }`}
                            >
                                <div className="flex items-center">
                                    <div className={`w-4 h-4 rounded-full border-2 mr-3 ${exportType === 'all'
                                            ? 'border-green-500 bg-green-500'
                                            : 'border-gray-300'
                                        }`}>
                                        {exportType === 'all' && (
                                            <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800">详细记录导出</h3>
                                        <p className="text-sm text-gray-600">包含所有考试的详细答题记录和成绩</p>
                                    </div>
                                </div>
                            </div>

                            <div
                                onClick={() => setExportType('summary')}
                                className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${exportType === 'summary'
                                        ? 'border-green-500 bg-green-50'
                                        : 'border-gray-200 hover:border-green-300'
                                    }`}
                            >
                                <div className="flex items-center">
                                    <div className={`w-4 h-4 rounded-full border-2 mr-3 ${exportType === 'summary'
                                            ? 'border-green-500 bg-green-500'
                                            : 'border-gray-300'
                                        }`}>
                                        {exportType === 'summary' && (
                                            <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800">统计汇总导出</h3>
                                        <p className="text-sm text-gray-600">包含总体统计数据和分析报告</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="text-center">
                            <button
                                onClick={handleExport}
                                disabled={exporting}
                                className={`px-8 py-3 rounded-lg font-semibold transition-colors ${exporting
                                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                        : 'bg-green-600 text-white hover:bg-green-700'
                                    }`}
                            >
                                {exporting ? (
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        导出中...
                                    </div>
                                ) : (
                                    '开始导出'
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Export Info */}
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h3 className="font-semibold text-gray-800 mb-4">导出说明</h3>
                        <div className="space-y-3 text-sm text-gray-600">
                            <div className="flex items-start">
                                <svg className="w-4 h-4 text-green-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>导出文件为PDF格式，包含完整的考试数据</span>
                            </div>
                            <div className="flex items-start">
                                <svg className="w-4 h-4 text-green-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>详细记录包含每个考试的具体答题情况</span>
                            </div>
                            <div className="flex items-start">
                                <svg className="w-4 h-4 text-green-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>统计汇总包含分类统计和整体分析</span>
                            </div>
                            <div className="flex items-start">
                                <svg className="w-4 h-4 text-green-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>文件名将包含导出日期，便于管理</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
