'use client';
import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'human' | 'commander' | 'system' | 'auditor';
  content: string;
  timestamp: string;
}

interface AuditItem {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  category: string;
  title: string;
  description: string;
  suggestion: string;
  status: 'pending' | 'adopted' | 'rejected' | 'deferred';
  createdAt: string;
}

interface AuditorPanelProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function AuditorPanel({ collapsed = false, onToggleCollapse }: AuditorPanelProps) {
  const [showQueue, setShowQueue] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [auditQueue, setAuditQueue] = useState<AuditItem[]>([
    {
      id: 'audit-1',
      severity: 'warning',
      category: '安全',
      title: '密码未加密存储',
      description: '检测到用户密码以明文形式存储在数据库中',
      suggestion: '使用bcrypt或argon2进行密码哈希',
      status: 'pending',
      createdAt: new Date().toISOString()
    },
    {
      id: 'audit-2',
      severity: 'info',
      category: '性能',
      title: '建议添加数据库索引',
      description: 'users表的email字段频繁查询但未建立索引',
      suggestion: '为email字段添加唯一索引',
      status: 'pending',
      createdAt: new Date().toISOString()
    }
  ]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const pendingItems = auditQueue.filter(item => item.status === 'pending');
  
  const sendMessage = async () => {
    if (!inputText.trim()) return;
    
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'human',
      content: inputText,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    
    // 模拟审计响应
    setTimeout(() => {
      const aiMessage: Message = {
        id: `msg-${Date.now()}-ai`,
        role: 'auditor',
        content: `已收到审计请求。\n\n正在分析代码...\n\n发现以下问题：\n1. 代码结构清晰\n2. 建议添加更多注释\n3. 考虑添加单元测试`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
  };
  
  const handleAuditItem = (itemId: string, action: 'adopt' | 'reject' | 'defer') => {
    setAuditQueue(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          status: action === 'adopt' ? 'adopted' : action === 'reject' ? 'rejected' : 'deferred'
        };
      }
      return item;
    }));
  };
  
  const handleBatchAction = (action: 'adopt' | 'reject' | 'defer') => {
    setAuditQueue(prev => prev.map(item => {
      if (selectedItems.includes(item.id)) {
        return {
          ...item,
          status: action === 'adopt' ? 'adopted' : action === 'reject' ? 'rejected' : 'deferred'
        };
      }
      return item;
    }));
    setSelectedItems([]);
  };
  
  const toggleSelect = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };
  
  const getRoleStyle = (role: string) => {
    switch (role) {
      case 'human': return 'bg-blue-500/10 border-blue-500/30 text-blue-100';
      case 'commander': return 'bg-purple-500/10 border-purple-500/30 text-purple-100';
      case 'system': return 'bg-gray-500/10 border-gray-500/30 text-gray-300';
      case 'auditor': return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-100';
      default: return 'bg-gray-500/10 border-gray-500/30';
    }
  };
  
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'human': return 'Human users';
      case 'commander': return 'AI Commander';
      case 'system': return 'B2 system';
      case 'auditor': return '审计官';
      default: return role;
    }
  };
  
  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10 border-red-500/30';
      case 'warning': return 'bg-yellow-500/10 border-yellow-500/30';
      case 'info': return 'bg-blue-500/10 border-blue-500/30';
      default: return 'bg-gray-500/10 border-gray-500/30';
    }
  };
  
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🔴';
      case 'warning': return '🟡';
      case 'info': return '🔵';
      default: return '⚪';
    }
  };
  
  // 收缩状态下只显示一个小按钮
  if (collapsed) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-800/50 rounded-xl border border-gray-700/50 p-2">
        <button
          onClick={onToggleCollapse}
          className="w-10 h-10 rounded-full bg-yellow-500/20 hover:bg-yellow-500/30 flex items-center justify-center text-yellow-400 text-lg"
          title="展开审计官"
        >
          🔍
        </button>
        {pendingItems.length > 0 && (
          <span className="mt-2 px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-400">
            {pendingItems.length}
          </span>
        )}
        <span className="mt-2 text-xs text-gray-500 writing-mode-vertical" style={{ writingMode: 'vertical-rl' }}>
          审计官
        </span>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
      {/* 头部 */}
      <div className="p-4 border-b border-gray-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <span className="text-yellow-400 text-lg">🔍</span>
            </div>
            <div>
              <h2 className="font-bold text-white">审计官</h2>
              <p className="text-xs text-gray-400">代码审查与质量检测</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-400">
              待处理: {pendingItems.length}
            </span>
            {/* 收缩按钮 */}
            <button
              onClick={onToggleCollapse}
              className="px-2 py-1 rounded text-xs bg-gray-700/50 hover:bg-gray-600/50 text-gray-300"
              title="收起审计官"
            >
              ▶
            </button>
          </div>
        </div>
        
        {/* 角色图例 */}
        <div className="flex items-center gap-4 mt-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            Human users
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            AI Commander
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gray-400"></span>
            B2 system
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
            审计官
          </span>
        </div>
        
        {/* 标签切换 */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setShowQueue(false)}
            className={`px-3 py-1 rounded text-xs ${!showQueue ? 'bg-yellow-500/30 text-yellow-400' : 'bg-gray-700/50 text-gray-400'}`}
          >
            💬 对话
          </button>
          <button
            onClick={() => setShowQueue(true)}
            className={`px-3 py-1 rounded text-xs ${showQueue ? 'bg-yellow-500/30 text-yellow-400' : 'bg-gray-700/50 text-gray-400'}`}
          >
            📋 审计队列 ({pendingItems.length})
          </button>
        </div>
      </div>
      
      {/* 批量操作栏 */}
      {showQueue && selectedItems.length > 0 && (
        <div className="px-4 py-2 border-b border-gray-700/50 bg-gray-900/50 flex items-center justify-between">
          <span className="text-xs text-gray-400">已选择 {selectedItems.length} 项</span>
          <div className="flex gap-2">
            <button
              onClick={() => handleBatchAction('adopt')}
              className="px-2 py-1 rounded bg-green-500/20 hover:bg-green-500/30 text-green-400 text-xs"
            >
              ✅ 批量采纳
            </button>
            <button
              onClick={() => handleBatchAction('reject')}
              className="px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs"
            >
              ❌ 批量拒绝
            </button>
            <button
              onClick={() => handleBatchAction('defer')}
              className="px-2 py-1 rounded bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 text-xs"
            >
              ⏸️ 批量延后
            </button>
          </div>
        </div>
      )}
      
      {/* 内容区域 */}
      {showQueue ? (
        // 审计队列
        <div className="flex-1 overflow-y-auto p-4">
          {pendingItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <span className="text-4xl mb-4">✅</span>
              <p>暂无待处理的审计项</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingItems.map(item => (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border ${getSeverityStyle(item.severity)} ${
                    selectedItems.includes(item.id) ? 'ring-2 ring-white/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* 选择框 */}
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="mt-1"
                    />
                    
                    <div className="flex-1">
                      {/* 标题行 */}
                      <div className="flex items-center gap-2 mb-1">
                        <span>{getSeverityIcon(item.severity)}</span>
                        <span className="text-xs text-gray-400">[{item.category}]</span>
                        <span className="font-semibold">{item.title}</span>
                      </div>
                      
                      {/* 描述 */}
                      <p className="text-sm text-gray-300 mb-2">{item.description}</p>
                      
                      {/* 建议 */}
                      <p className="text-xs text-gray-400">
                        💡 建议: {item.suggestion}
                      </p>
                    </div>
                    
                    {/* 操作按钮 */}
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleAuditItem(item.id, 'adopt')}
                        className="px-2 py-1 rounded bg-green-500/20 hover:bg-green-500/30 text-green-400 text-xs"
                        title="采纳"
                      >
                        ✅
                      </button>
                      <button
                        onClick={() => handleAuditItem(item.id, 'reject')}
                        className="px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs"
                        title="拒绝"
                      >
                        ❌
                      </button>
                      <button
                        onClick={() => handleAuditItem(item.id, 'defer')}
                        className="px-2 py-1 rounded bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 text-xs"
                        title="延后"
                      >
                        ⏸️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // 对话区域
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <span className="text-4xl mb-4">🔍</span>
              <p>发送代码或问题，审计官将进行审查</p>
            </div>
          ) : (
            <>
              {messages.map(msg => (
                <div key={msg.id} className={`p-3 rounded-lg border ${getRoleStyle(msg.role)}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold">{getRoleLabel(msg.role)}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      )}
      
      {/* 输入框（仅对话模式） */}
      {!showQueue && (
        <div className="p-4 border-t border-gray-700/50">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && sendMessage()}
              placeholder="发送代码或问题进行审查..."
              className="flex-1 px-4 py-2 rounded-lg bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !inputText.trim()}
              className="px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-black disabled:opacity-50"
            >
              {isLoading ? '...' : '发送'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
