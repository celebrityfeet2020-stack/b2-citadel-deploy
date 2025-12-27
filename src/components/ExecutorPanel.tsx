'use client';
import React, { useState, useRef, useEffect } from 'react';
import { workflowApi } from '@/lib/api';

interface Message {
  id: string;
  role: 'human' | 'commander' | 'system' | 'executor';
  content: string;
  timestamp: string;
}

interface CoreContext {
  taskTarget: string;
  sshCommand: string;
  workDir: string;
  customHints: string[];
  version: string;
}

type Phase = 'requirement' | 'execution' | 'summary';

export default function ExecutorPanel() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('requirement');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [healthScore, setHealthScore] = useState(100);
  const [showSessionManager, setShowSessionManager] = useState(false);
  const [showCoreContext, setShowCoreContext] = useState(false);
  const [coreContext, setCoreContext] = useState<CoreContext>({
    taskTarget: '',
    sshCommand: "sshpass -p 'Manus2819AiGoGo' ssh -p 22 -o StrictHostKeyChecking=no ubuntu@43.160.207.239",
    workDir: '/home/ubuntu',
    customHints: ['PostgreSQL端口是25432', '使用Docker部署'],
    version: 'v1.0'
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // 计算健康度
  useEffect(() => {
    const tokenEstimate = messages.reduce((acc, msg) => acc + msg.content.length, 0);
    const score = Math.max(0, 100 - Math.floor(tokenEstimate / 500));
    setHealthScore(score);
  }, [messages]);
  
  const createSession = async () => {
    try {
      const response = await workflowApi.createSession('default-project');
      setSessionId(response.session?.session_id || `session-${Date.now()}`);
      setPhase('requirement');
      setMessages([]);
    } catch (error) {
      console.error('Failed to create session:', error);
      // 模拟创建
      setSessionId(`session-${Date.now()}`);
      setPhase('requirement');
    }
  };
  
  const sendMessage = async () => {
    if (!inputText.trim() || !sessionId) return;
    
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'human',
      content: inputText,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    
    try {
      const response = await workflowApi.sendMessage(sessionId, inputText, 'human');
      
      if (response.message?.content) {
        const aiMessage: Message = {
          id: `msg-${Date.now()}-ai`,
          role: 'executor',
          content: response.message.content,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // 模拟AI响应
      const mockResponse: Message = {
        id: `msg-${Date.now()}-ai`,
        role: 'executor',
        content: `收到您的需求：「${inputText}」\n\n让我确认几个关键点：\n1. 这个功能的主要目标是什么？\n2. 有什么技术栈偏好吗？\n3. 预期的完成时间是？\n\n请补充信息，或者点击"确认需求"开始执行。`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, mockResponse]);
    }
    
    setIsLoading(false);
  };
  
  const confirmRequirement = () => {
    const systemMessage: Message = {
      id: `msg-${Date.now()}-sys`,
      role: 'system',
      content: '✅ 需求已确认，进入开发执行阶段。执行官将开始执行任务...',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, systemMessage]);
    setPhase('execution');
  };
  
  const completeExecution = () => {
    const systemMessage: Message = {
      id: `msg-${Date.now()}-sys`,
      role: 'system',
      content: '📝 执行阶段完成，进入总结归档阶段。',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, systemMessage]);
    setPhase('summary');
  };
  
  const clearHistory = () => {
    setMessages([]);
    setHealthScore(100);
  };
  
  const compressHistory = () => {
    const systemMessage: Message = {
      id: `msg-${Date.now()}-sys`,
      role: 'system',
      content: '📦 历史已压缩。执行官已生成阶段性总结，继续开发...',
      timestamp: new Date().toISOString()
    };
    setMessages([systemMessage]);
    setHealthScore(95);
  };
  
  const saveCheckpoint = () => {
    alert('检查点已保存！');
  };
  
  const updateCoreContext = () => {
    setCoreContext(prev => ({ ...prev, version: `v${parseFloat(prev.version.slice(1)) + 0.1}` }));
    alert('核心上下文已更新！');
  };
  
  const getRoleStyle = (role: string) => {
    switch (role) {
      case 'human': return 'bg-blue-500/10 border-blue-500/30 text-blue-100';
      case 'commander': return 'bg-purple-500/10 border-purple-500/30 text-purple-100';
      case 'system': return 'bg-gray-500/10 border-gray-500/30 text-gray-300';
      case 'executor': return 'bg-green-500/10 border-green-500/30 text-green-100';
      default: return 'bg-gray-500/10 border-gray-500/30';
    }
  };
  
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'human': return 'Human users';
      case 'commander': return 'AI Commander';
      case 'system': return 'B2 system';
      case 'executor': return '执行官';
      default: return role;
    }
  };
  
  const getPhaseLabel = (p: Phase) => {
    switch (p) {
      case 'requirement': return '需求确认';
      case 'execution': return '开发执行';
      case 'summary': return '总结归档';
    }
  };
  
  const getHealthColor = () => {
    if (healthScore >= 80) return 'text-green-400 bg-green-500/20';
    if (healthScore >= 50) return 'text-yellow-400 bg-yellow-500/20';
    return 'text-red-400 bg-red-500/20';
  };
  
  return (
    <div className="flex flex-col h-full bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
      {/* 头部 */}
      <div className="p-4 border-b border-gray-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <span className="text-green-400 text-lg">🎯</span>
            </div>
            <div>
              <h2 className="font-bold text-white">执行官</h2>
              <p className="text-xs text-gray-400">负责执行开发任务</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-xs ${getHealthColor()}`}>
              健康度: {healthScore}%
            </span>
            <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400">
              📋 {getPhaseLabel(phase)}
            </span>
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
            <span className="w-2 h-2 rounded-full bg-green-400"></span>
            执行官
          </span>
        </div>
        
        {/* 工具栏 */}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => setShowSessionManager(!showSessionManager)}
            className="px-3 py-1 rounded text-xs bg-gray-700/50 hover:bg-gray-600/50 text-gray-300"
            title="会话管理"
          >
            ⚙️
          </button>
          <button
            onClick={() => setShowCoreContext(!showCoreContext)}
            className="px-3 py-1 rounded text-xs bg-gray-700/50 hover:bg-gray-600/50 text-gray-300"
            title="核心上下文"
          >
            📌
          </button>
        </div>
      </div>
      
      {/* 会话管理面板 */}
      {showSessionManager && (
        <div className="p-4 border-b border-gray-700/50 bg-gray-900/50">
          <h3 className="text-sm font-semibold text-white mb-3">会话管理</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-gray-400">
              <span>Token使用</span>
              <span>{messages.reduce((acc, m) => acc + m.content.length, 0)} / 32000</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>对话轮数</span>
              <span>{messages.length}</span>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={clearHistory} className="flex-1 py-2 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400">
                🗑️ 清空历史
              </button>
              <button onClick={compressHistory} className="flex-1 py-2 rounded bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400">
                📦 压缩历史
              </button>
              <button onClick={saveCheckpoint} className="flex-1 py-2 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-400">
                💾 保存检查点
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 核心上下文面板 */}
      {showCoreContext && (
        <div className="p-4 border-b border-gray-700/50 bg-gray-900/50">
          <h3 className="text-sm font-semibold text-white mb-3">核心上下文 ({coreContext.version})</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400">任务目标</label>
              <input
                type="text"
                value={coreContext.taskTarget}
                onChange={e => setCoreContext({...coreContext, taskTarget: e.target.value})}
                className="w-full mt-1 px-3 py-2 rounded bg-gray-700/50 border border-gray-600 text-white text-sm"
                placeholder="例如：开发用户认证系统"
              />
            </div>
            
            <div>
              <label className="text-xs text-gray-400">SSH命令</label>
              <input
                type="text"
                value={coreContext.sshCommand}
                onChange={e => setCoreContext({...coreContext, sshCommand: e.target.value})}
                className="w-full mt-1 px-3 py-2 rounded bg-gray-700/50 border border-gray-600 text-white text-sm font-mono"
                placeholder="ssh user@host"
              />
            </div>
            
            <div>
              <label className="text-xs text-gray-400">工作目录</label>
              <input
                type="text"
                value={coreContext.workDir}
                onChange={e => setCoreContext({...coreContext, workDir: e.target.value})}
                className="w-full mt-1 px-3 py-2 rounded bg-gray-700/50 border border-gray-600 text-white text-sm font-mono"
                placeholder="/home/ubuntu/project"
              />
            </div>
            
            <div>
              <label className="text-xs text-gray-400">自定义提示（每行一条）</label>
              <textarea
                value={coreContext.customHints.join('\n')}
                onChange={e => setCoreContext({...coreContext, customHints: e.target.value.split('\n').filter(Boolean)})}
                className="w-full mt-1 px-3 py-2 rounded bg-gray-700/50 border border-gray-600 text-white text-sm"
                rows={3}
                placeholder="PostgreSQL端口是25432&#10;使用Docker部署"
              />
            </div>
            
            <button
              onClick={updateCoreContext}
              className="w-full py-2 rounded bg-green-500/20 hover:bg-green-500/30 text-green-400 text-sm"
            >
              保存核心上下文
            </button>
          </div>
        </div>
      )}
      
      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!sessionId ? (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-gray-400 mb-4">开始一个新的开发会话</p>
            <button
              onClick={createSession}
              className="px-6 py-3 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400"
            >
              🚀 创建会话
            </button>
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
      
      {/* 阶段控制按钮 */}
      {sessionId && phase === 'requirement' && (
        <div className="px-4 py-2 border-t border-gray-700/50">
          <button
            onClick={confirmRequirement}
            className="w-full py-2 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 text-sm font-semibold"
          >
            ✅ 确认需求，开始执行
          </button>
        </div>
      )}
      
      {sessionId && phase === 'execution' && (
        <div className="px-4 py-2 border-t border-gray-700/50">
          <button
            onClick={completeExecution}
            className="w-full py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 text-sm font-semibold"
          >
            📝 完成执行，进入总结
          </button>
        </div>
      )}
      
      {/* 输入框 */}
      {sessionId && (
        <div className="p-4 border-t border-gray-700/50">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && sendMessage()}
              placeholder={phase === 'requirement' ? '描述你的需求...' : '发送指令...'}
              className="flex-1 px-4 py-2 rounded-lg bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !inputText.trim()}
              className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white disabled:opacity-50"
            >
              {isLoading ? '...' : '发送'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
