'use client';

import React, { useState, useEffect } from 'react';

interface DatabaseStats {
  totalQuestions: number;
  totalSessions: number;
  completedSessions: number;
  categories: string[];
  difficulties: string[];
  storageType: string;
  lastUpdated: string;
}

interface DatabaseStatus {
  isReady: boolean;
  existingTables: string[];
  missingTables: string[];
  totalTables: number;
  connectionStatus: string;
}

interface MigrationResult {
  success: boolean;
  message: string;
  stats?: DatabaseStats;
  error?: string;
}

export default function MySQLDatabasePage() {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'migration' | 'management'>('overview');

  // 加载数据库状态和统计信息
  const loadData = async () => {
    setLoading(true);
    try {
      const [statusResponse, statsResponse] = await Promise.all([
        fetch('/api/admin/database-mysql?action=status'),
        fetch('/api/admin/database-mysql?action=stats')
      ]);

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setStatus(statusData);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初始化数据库
  const handleInitDatabase = async () => {
    setMigrating(true);
    try {
      const response = await fetch('/api/admin/database-mysql?action=init');
      const result = await response.json();
      
      if (result.success) {
        alert('MySQL数据库初始化成功！');
        await loadData();
      } else {
        alert('MySQL数据库初始化失败！');
      }
    } catch (error) {
      alert('初始化请求失败');
    } finally {
      setMigrating(false);
    }
  };

  // 执行数据迁移
  const handleMigration = async (type: 'json' | 'optimized') => {
    setMigrating(true);
    setMigrationResult(null);
    
    try {
      const action = type === 'json' ? 'migrate-from-json' : 'migrate-from-optimized';
      const response = await fetch(`/api/admin/database-mysql?action=${action}`);
      const result = await response.json();
      setMigrationResult(result);
      
      if (result.success) {
        await loadData(); // 重新加载统计信息
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
      const response = await fetch('/api/admin/database-mysql?action=backup');
      const result = await response.json();
      
      if (result.success) {
        alert(`MySQL备份创建成功: ${result.backupFile}`);
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
      const response = await fetch('/api/admin/database-mysql', {
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
        await loadData(); // 重新加载统计信息
      } else {
        alert('操作失败');
      }
    } catch (error) {
      alert('操作失败');
    }
  };

  useEffect(() => {
    loadData();
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">MySQL数据库管理</h1>
          <p className="text-gray-600">高性能MySQL数据库存储系统</p>
        </div>

        {/* 连接状态指示器 */}
        <div className="mb-6">
          <div className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
            status?.connectionStatus === 'connected' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              status?.connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            {status?.connectionStatus === 'connected' ? 'MySQL已连接' : 'MySQL连接失败'}
          </div>
        </div>

        {/* 标签页 */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: '概览', icon: '📊' },
              { id: 'migration', label: '数据迁移', icon: '🔄' },
              { id: 'management', label: '数据管理', icon: '⚙️' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* 概览页面 */}
        {activeTab === 'overview' && (
          <>
            {/* 数据库状态 */}
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
                    <p className="text-sm font-medium text-gray-600">数据表</p>
                    <p className="text-2xl font-bold text-gray-900">{status?.totalTables || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 数据库表状态 */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">数据表状态</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">已存在的表</h3>
                  <div className="bg-gray-50 p-3 rounded">
                    {status?.existingTables.length ? (
                      <ul className="text-sm text-gray-600">
                        {status.existingTables.map((table, index) => (
                          <li key={index}>✅ {table}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">无数据表</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">缺失的表</h3>
                  <div className="bg-gray-50 p-3 rounded">
                    {status?.missingTables.length ? (
                      <ul className="text-sm text-gray-600">
                        {status.missingTables.map((table, index) => (
                          <li key={index}>❌ {table}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">所有表都已存在</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 数据迁移页面 */}
        {activeTab === 'migration' && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">数据迁移</h2>
            
            {!status?.isReady && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="text-yellow-800">MySQL数据库尚未初始化，请先初始化数据库</span>
                </div>
                <button
                  onClick={handleInitDatabase}
                  disabled={migrating}
                  className="mt-3 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                >
                  {migrating ? '初始化中...' : '初始化MySQL数据库'}
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">从JSON文件迁移</h3>
                <p className="text-sm text-gray-600 mb-4">
                  从现有的JSON文件数据迁移到MySQL数据库
                </p>
                <button
                  onClick={() => handleMigration('json')}
                  disabled={migrating || !status?.isReady}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {migrating ? '迁移中...' : '从JSON迁移'}
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">从优化数据库迁移</h3>
                <p className="text-sm text-gray-600 mb-4">
                  从优化版本的键值对数据库迁移到MySQL
                </p>
                <button
                  onClick={() => handleMigration('optimized')}
                  disabled={migrating || !status?.isReady}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {migrating ? '迁移中...' : '从优化版迁移'}
                </button>
              </div>
            </div>

            {migrationResult && (
              <div className={`mt-6 p-4 rounded-lg ${
                migrationResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className={`font-semibold ${
                  migrationResult.success ? 'text-green-900' : 'text-red-900'
                }`}>
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
        )}

        {/* 数据管理页面 */}
        {activeTab === 'management' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">数据库管理</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <button
                onClick={handleBackup}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                创建备份
              </button>
              
              <button
                onClick={handleInitDatabase}
                disabled={migrating}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                重新初始化
              </button>
            </div>

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
        )}

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
              存储类型: {stats.storageType} | 最后更新: {new Date(stats.lastUpdated).toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
