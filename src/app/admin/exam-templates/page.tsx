'use client';

import { useState, useEffect } from 'react';

interface ExamTemplate {
    id: string;
    name: string;
    description: string;
    totalQuestions: number;
    timeLimit: number;
    category?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    icon?: string;
    color?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

interface FormData {
    name: string;
    description: string;
    totalQuestions: number;
    timeLimit: number;
    category: string;
    difficulty: 'easy' | 'medium' | 'hard' | '';
    icon: string;
    color: string;
    isActive: boolean;
}

export default function ExamTemplatesPage() {
    const [templates, setTemplates] = useState<ExamTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<ExamTemplate | null>(null);
    const [formData, setFormData] = useState<FormData>({
        name: '',
        description: '',
        totalQuestions: 20,
        timeLimit: 30,
        category: '',
        difficulty: '',
        icon: 'BookOpen',
        color: '#3B82F6',
        isActive: true
    });

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const response = await fetch('/api/exam-templates');
            if (response.ok) {
                const data = await response.json();
                setTemplates(data.templates);
            }
        } catch (error) {
            console.error('获取考试模板失败:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const url = editingTemplate ? `/api/exam-templates` : '/api/exam-templates';
            const method = editingTemplate ? 'PUT' : 'POST';
            const body = editingTemplate
                ? { ...formData, id: editingTemplate.id }
                : formData;

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                await fetchTemplates();
                setShowForm(false);
                setEditingTemplate(null);
                resetForm();
                alert(editingTemplate ? '考试模板更新成功!' : '考试模板创建成功!');
            } else {
                const error = await response.json();
                alert(`操作失败: ${error.error}`);
            }
        } catch (error) {
            console.error('提交表单失败:', error);
            alert('操作失败，请重试');
        }
    };

    const handleEdit = (template: ExamTemplate) => {
        setEditingTemplate(template);
        setFormData({
            name: template.name,
            description: template.description,
            totalQuestions: template.totalQuestions,
            timeLimit: template.timeLimit,
            category: template.category || '',
            difficulty: template.difficulty || '',
            icon: template.icon || 'BookOpen',
            color: template.color || '#3B82F6',
            isActive: template.isActive
        });
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('确定要删除这个考试模板吗？')) return;

        try {
            const response = await fetch(`/api/exam-templates?id=${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await fetchTemplates();
                alert('考试模板删除成功!');
            } else {
                const error = await response.json();
                alert(`删除失败: ${error.error}`);
            }
        } catch (error) {
            console.error('删除失败:', error);
            alert('删除失败，请重试');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            totalQuestions: 20,
            timeLimit: 30,
            category: '',
            difficulty: '',
            icon: 'BookOpen',
            color: '#3B82F6',
            isActive: true
        });
    };

    const getDifficultyLabel = (difficulty?: string) => {
        switch (difficulty) {
            case 'easy': return '简单';
            case 'medium': return '中等';
            case 'hard': return '困难';
            default: return '不限';
        }
    };

    const getDifficultyColor = (difficulty?: string) => {
        switch (difficulty) {
            case 'easy': return 'bg-green-100 text-green-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'hard': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-lg">加载中...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">考试类型管理</h1>
                    <p className="text-gray-600 mt-2">管理考试模板，设置题目数量和时间限制</p>
                </div>

                <div className="mb-6 flex justify-between items-center">
                    <div className="flex space-x-4">
                        <button
                            onClick={() => {
                                setShowForm(true);
                                setEditingTemplate(null);
                                resetForm();
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
                        >
                            创建考试模板
                        </button>
                        <button
                            onClick={() => window.location.href = '/admin'}
                            className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md font-medium"
                        >
                            返回管理面板
                        </button>
                    </div>
                </div>

                {/* 考试模板表单 */}
                {showForm && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-xl font-semibold mb-4">
                            {editingTemplate ? '编辑考试模板' : '创建新考试模板'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        模板名称 *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        模板描述 *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        题目数量 *
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="1000"
                                        value={formData.totalQuestions}
                                        onChange={(e) => setFormData({ ...formData, totalQuestions: Number(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        考试时间 (分钟) *
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="1440"
                                        value={formData.timeLimit}
                                        onChange={(e) => setFormData({ ...formData, timeLimit: Number(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        题目分类
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="可选，留空表示不限制"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        难度等级
                                    </label>
                                    <select
                                        value={formData.difficulty}
                                        onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as 'easy' | 'medium' | 'hard' | '' })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">不限制</option>
                                        <option value="easy">简单</option>
                                        <option value="medium">中等</option>
                                        <option value="hard">困难</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        图标颜色
                                    </label>
                                    <input
                                        type="color"
                                        value={formData.color}
                                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                        className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="mr-2"
                                    />
                                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                                        启用此模板
                                    </label>
                                </div>
                            </div>
                            <div className="flex space-x-4">
                                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium">
                                    {editingTemplate ? '更新模板' : '创建模板'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowForm(false);
                                        setEditingTemplate(null);
                                        resetForm();
                                    }}
                                    className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md font-medium"
                                >
                                    取消
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* 考试模板列表 */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-800">考试模板列表</h2>
                    </div>
                    {templates.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">
                            暂无考试模板，请创建新的考试模板
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            模板名称
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            描述
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            题目数量
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            考试时间
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            分类
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            难度
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            状态
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            操作
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {templates.map((template) => (
                                        <tr key={template.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div
                                                        className="w-4 h-4 rounded-full mr-3"
                                                        style={{ backgroundColor: template.color }}
                                                    />
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {template.name}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {template.description}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {template.totalQuestions} 题
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {template.timeLimit} 分钟
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {template.category || '不限'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(template.difficulty)}`}>
                                                    {getDifficultyLabel(template.difficulty)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {template.isActive ? '启用' : '禁用'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button
                                                    onClick={() => handleEdit(template)}
                                                    className="text-blue-600 hover:text-blue-900 mr-3"
                                                >
                                                    编辑
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(template.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    删除
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
