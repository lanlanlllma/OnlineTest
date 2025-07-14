'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLogin from '@/components/AdminLogin';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Question } from '@/types';

interface QuestionListResponse {
    questions: Question[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export default function QuestionsPage() {
    const { isAuthenticated, loading: authLoading, login, logout, getAuthHeaders } = useAdminAuth();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    });
    const [filters, setFilters] = useState({
        category: '',
        difficulty: '',
        search: ''
    });
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    // 获取题目列表
    const fetchQuestions = async () => {
        if (!isAuthenticated) return;

        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                ...(filters.category && { category: filters.category }),
                ...(filters.difficulty && { difficulty: filters.difficulty }),
                ...(filters.search && { search: filters.search })
            });

            const response = await fetch(`/api/questions?${params}`, {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const data: QuestionListResponse = await response.json();
                setQuestions(data.questions);
                setPagination(data.pagination);
            } else {
                console.error('获取题目列表失败');
            }
        } catch (error) {
            console.error('获取题目列表失败:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchQuestions();
        }
    }, [isAuthenticated, pagination.page, filters]);

    // 删除题目
    const handleDelete = async (id: string) => {
        try {
            const response = await fetch(`/api/questions?id=${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (response.ok) {
                setDeleteConfirm(null);
                fetchQuestions();
            } else {
                console.error('删除题目失败');
            }
        } catch (error) {
            console.error('删除题目失败:', error);
        }
    };

    // 格式化答案显示
    const formatAnswer = (question: Question) => {
        if (Array.isArray(question.correctAnswer)) {
            return question.correctAnswer.map(idx =>
                String.fromCharCode(65 + idx)
            ).join(', ');
        } else {
            return String.fromCharCode(65 + question.correctAnswer);
        }
    };

    // 如果正在加载认证状态，显示加载中
    if (authLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
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
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center mb-8">
                        <Link
                            href="/admin"
                            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
                        >
                            ← 返回管理端
                        </Link>
                        <h1 className="text-4xl font-bold text-gray-800 mb-4">管理员登录</h1>
                        <p className="text-gray-600">请输入管理员密码以访问题目管理</p>
                    </div>
                    <AdminLogin onLogin={login} />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <Link
                            href="/admin"
                            className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
                        >
                            ← 返回管理端
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">题目管理</h1>
                        <p className="text-gray-600">管理系统中的所有题目</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setIsCreating(true)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            + 新建题目
                        </button>
                        <button
                            onClick={logout}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                        >
                            退出登录
                        </button>
                    </div>
                </div>

                {/* 过滤器 */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">搜索</label>
                            <input
                                type="text"
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                placeholder="搜索题目内容..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">分类</label>
                            <select
                                value={filters.category}
                                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">所有分类</option>
                                <option value="JavaScript基础">JavaScript基础</option>
                                <option value="React">React</option>
                                <option value="Node.js">Node.js</option>
                                <option value="CSS">CSS</option>
                                <option value="HTML">HTML</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">难度</label>
                            <select
                                value={filters.difficulty}
                                onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">所有难度</option>
                                <option value="easy">简单</option>
                                <option value="medium">中等</option>
                                <option value="hard">困难</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={() => {
                                    setFilters({ category: '', difficulty: '', search: '' });
                                    setPagination({ ...pagination, page: 1 });
                                }}
                                className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                            >
                                清除过滤
                            </button>
                        </div>
                    </div>
                </div>

                {/* 题目列表 */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="ml-2">加载中...</span>
                        </div>
                    ) : questions.length === 0 ? (
                        <div className="text-center p-8">
                            <p className="text-gray-500">暂无题目数据</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                题目
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                类型
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                分类
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                难度
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                正确答案
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                操作
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {questions.map((question) => (
                                            <tr key={question.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="max-w-xs">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {question.question}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {question.options.length} 个选项
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${question.type === 'multiple'
                                                            ? 'bg-purple-100 text-purple-800'
                                                            : 'bg-blue-100 text-blue-800'
                                                        }`}>
                                                        {question.type === 'multiple' ? '多选' : '单选'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {question.category || '默认分类'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${question.difficulty === 'hard' ? 'bg-red-100 text-red-800' :
                                                            question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-green-100 text-green-800'
                                                        }`}>
                                                        {question.difficulty === 'hard' ? '困难' :
                                                            question.difficulty === 'medium' ? '中等' : '简单'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {formatAnswer(question)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => setEditingQuestion(question)}
                                                            className="text-blue-600 hover:text-blue-900"
                                                        >
                                                            编辑
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteConfirm(question.id)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            删除
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* 分页 */}
                            {pagination.totalPages > 1 && (
                                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
                                    <div className="flex-1 flex justify-between sm:hidden">
                                        <button
                                            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                                            disabled={pagination.page === 1}
                                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            上一页
                                        </button>
                                        <button
                                            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                                            disabled={pagination.page === pagination.totalPages}
                                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            下一页
                                        </button>
                                    </div>
                                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm text-gray-700">
                                                显示第 <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> 到{' '}
                                                <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> 条，
                                                共 <span className="font-medium">{pagination.total}</span> 条记录
                                            </p>
                                        </div>
                                        <div>
                                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                                <button
                                                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                                                    disabled={pagination.page === 1}
                                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                                >
                                                    上一页
                                                </button>
                                                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                                                    <button
                                                        key={page}
                                                        onClick={() => setPagination({ ...pagination, page })}
                                                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${page === pagination.page
                                                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        {page}
                                                    </button>
                                                ))}
                                                <button
                                                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                                                    disabled={pagination.page === pagination.totalPages}
                                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                                >
                                                    下一页
                                                </button>
                                            </nav>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* 编辑/创建题目模态框 */}
            {(editingQuestion || isCreating) && (
                <QuestionModal
                    question={editingQuestion}
                    isOpen={true}
                    onClose={() => {
                        setEditingQuestion(null);
                        setIsCreating(false);
                    }}
                    onSave={fetchQuestions}
                    getAuthHeaders={getAuthHeaders}
                />
            )}

            {/* 删除确认模态框 */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3 text-center">
                            <h3 className="text-lg font-medium text-gray-900">确认删除</h3>
                            <div className="mt-2 px-7 py-3">
                                <p className="text-sm text-gray-500">
                                    确定要删除这道题目吗？此操作不可恢复。
                                </p>
                            </div>
                            <div className="items-center px-4 py-3">
                                <div className="flex space-x-4">
                                    <button
                                        onClick={() => setDeleteConfirm(null)}
                                        className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-gray-600"
                                    >
                                        取消
                                    </button>
                                    <button
                                        onClick={() => handleDelete(deleteConfirm)}
                                        className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-600"
                                    >
                                        删除
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// 题目编辑模态框组件
function QuestionModal({
    question,
    isOpen,
    onClose,
    onSave,
    getAuthHeaders
}: {
    question: Question | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    getAuthHeaders: () => HeadersInit;
}) {
    const [formData, setFormData] = useState({
        question: question?.question || '',
        type: question?.type || 'single' as 'single' | 'multiple',
        options: question?.options || ['', '', '', ''],
        correctAnswer: question?.correctAnswer || 0,
        explanation: question?.explanation || '',
        category: question?.category || '默认分类',
        difficulty: question?.difficulty || 'medium' as 'easy' | 'medium' | 'hard'
    });
    const [saving, setSaving] = useState(false);

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...formData.options];
        newOptions[index] = value;
        setFormData({ ...formData, options: newOptions });
    };

    const addOption = () => {
        if (formData.options.length < 6) {
            setFormData({ ...formData, options: [...formData.options, ''] });
        }
    };

    const removeOption = (index: number) => {
        if (formData.options.length > 2) {
            const newOptions = formData.options.filter((_, i) => i !== index);
            setFormData({ ...formData, options: newOptions });

            // 调整正确答案
            if (formData.type === 'single' && typeof formData.correctAnswer === 'number' && formData.correctAnswer >= newOptions.length) {
                setFormData(prev => ({ ...prev, correctAnswer: 0 }));
            } else if (formData.type === 'multiple') {
                const correctAnswers = formData.correctAnswer as number[];
                const adjustedAnswers = correctAnswers.filter(ans => ans < newOptions.length);
                setFormData(prev => ({ ...prev, correctAnswer: adjustedAnswers }));
            }
        }
    };

    const handleCorrectAnswerChange = (optionIndex: number) => {
        if (formData.type === 'single') {
            setFormData({ ...formData, correctAnswer: optionIndex });
        } else {
            const currentAnswers = formData.correctAnswer as number[];
            const newAnswers = currentAnswers.includes(optionIndex)
                ? currentAnswers.filter(ans => ans !== optionIndex)
                : [...currentAnswers, optionIndex];
            setFormData({ ...formData, correctAnswer: newAnswers });
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const filteredOptions = formData.options.filter(opt => opt.trim());
            if (filteredOptions.length < 2) {
                alert('至少需要2个选项');
                return;
            }

            const requestData: any = {
                ...formData,
                options: filteredOptions
            };

            if (question) {
                requestData.id = question.id;
            }

            const response = await fetch('/api/questions', {
                method: question ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify(requestData)
            });

            if (response.ok) {
                onSave();
                onClose();
            } else {
                const error = await response.json();
                alert(error.error || '保存失败');
            }
        } catch (error) {
            console.error('保存题目失败:', error);
            alert('保存失败');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border max-w-4xl shadow-lg rounded-md bg-white">
                <div className="mt-3">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                        {question ? '编辑题目' : '新建题目'}
                    </h3>

                    <div className="space-y-4">
                        {/* 题目内容 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">题目内容</label>
                            <textarea
                                value={formData.question}
                                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows={3}
                                placeholder="请输入题目内容..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* 题目类型 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">题目类型</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        type: e.target.value as 'single' | 'multiple',
                                        correctAnswer: e.target.value === 'single' ? 0 : []
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="single">单选题</option>
                                    <option value="multiple">多选题</option>
                                </select>
                            </div>

                            {/* 分类 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">分类</label>
                                <input
                                    type="text"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="题目分类"
                                />
                            </div>

                            {/* 难度 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">难度</label>
                                <select
                                    value={formData.difficulty}
                                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as 'easy' | 'medium' | 'hard' })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="easy">简单</option>
                                    <option value="medium">中等</option>
                                    <option value="hard">困难</option>
                                </select>
                            </div>
                        </div>

                        {/* 选项 */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-700">选项</label>
                                <button
                                    onClick={addOption}
                                    disabled={formData.options.length >= 6}
                                    className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                                >
                                    + 添加选项
                                </button>
                            </div>

                            <div className="space-y-2">
                                {formData.options.map((option, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                        {formData.type === 'single' ? (
                                            <input
                                                type="radio"
                                                name="correctAnswer"
                                                checked={formData.correctAnswer === index}
                                                onChange={() => handleCorrectAnswerChange(index)}
                                                className="w-4 h-4 text-blue-600"
                                            />
                                        ) : (
                                            <input
                                                type="checkbox"
                                                checked={(formData.correctAnswer as number[]).includes(index)}
                                                onChange={() => handleCorrectAnswerChange(index)}
                                                className="w-4 h-4 text-blue-600"
                                            />
                                        )}
                                        <span className="w-8 text-sm font-medium text-gray-500">
                                            {String.fromCharCode(65 + index)}.
                                        </span>
                                        <input
                                            type="text"
                                            value={option}
                                            onChange={(e) => handleOptionChange(index, e.target.value)}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder={`选项 ${String.fromCharCode(65 + index)}`}
                                        />
                                        {formData.options.length > 2 && (
                                            <button
                                                onClick={() => removeOption(index)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 解析 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">题目解析（可选）</label>
                            <textarea
                                value={formData.explanation}
                                onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows={2}
                                placeholder="请输入题目解析..."
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-4 mt-6">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                        >
                            取消
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {saving ? '保存中...' : '保存'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
