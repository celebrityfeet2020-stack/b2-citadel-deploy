'use client';

import { useState, useRef, useEffect } from 'react';
import { cn, formatRelativeTime } from '@/lib/utils';
import { useChatStore, useAIStore } from '@/store';
import { streamChat, ChatMessage } from '@/lib/api';
import { GlassCard, GlassButton, GlassTextarea } from '@/components/ui/GlassCard';
import { ClarityBadge } from '@/components/ui/ClarityIndicator';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Loader2,
  User,
  Bot,
  Sparkles,
  Shield,
  Eye,
  RotateCcw,
  Copy,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';

const roleConfig = {
  executor: {
    label: '执行官',
    icon: Sparkles,
    color: 'text-b2-accent-cyan',
    bgColor: 'bg-b2-accent-cyan/10',
    description: '负责执行开发任务',
  },
  auditor: {
    label: '审计官',
    icon: Eye,
    color: 'text-b2-accent-purple',
    bgColor: 'bg-b2-accent-purple/10',
    description: '负责审查代码质量',
  },
  commander: {
    label: '指挥官AI',
    icon: Shield,
    color: 'text-b2-accent-amber',
    bgColor: 'bg-b2-accent-amber/10',
    description: '负责任务规划和协调',
  },
};

export function ChatPanel() {
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isLoading,
    currentRole,
    addMessage,
    updateMessage,
    setMessageStreaming,
    clearMessages,
    setLoading,
    setCurrentRole,
  } = useChatStore();

  const { amnesiaStatus, adapters } = useAIStore();

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 获取当前角色的清醒度
  const getCurrentClarity = () => {
    const adapterName = `${currentRole}-primary`;
    return amnesiaStatus[adapterName]?.clarity_score ?? null;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    // 添加用户消息
    addMessage({ role: 'user', content: userMessage });

    // 添加AI消息占位
    const aiMessageId = addMessage({
      role: 'assistant',
      content: '',
      isStreaming: true,
    });

    try {
      // 构建消息历史
      const chatMessages: ChatMessage[] = messages
        .filter((m) => !m.isStreaming)
        .map((m) => ({ role: m.role, content: m.content }));
      chatMessages.push({ role: 'user', content: userMessage });

      // 流式请求
      let fullContent = '';
      for await (const chunk of streamChat({
        messages: chatMessages,
        role: currentRole,
        stream: true,
      })) {
        fullContent += chunk;
        updateMessage(aiMessageId, fullContent);
      }

      setMessageStreaming(aiMessageId, false);
    } catch (error: any) {
      updateMessage(aiMessageId, `错误: ${error.message || '请求失败'}`);
      setMessageStreaming(aiMessageId, false);
      toast.error('AI响应失败，请检查AI适配器配置');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = async (id: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('已复制到剪贴板');
  };

  const currentConfig = roleConfig[currentRole];
  const currentClarity = getCurrentClarity();

  return (
    <div className="flex flex-col h-full">
      {/* 头部 - 角色选择 */}
      <div className="flex-shrink-0 p-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-b2-text-primary">AI 聊天室</h2>
          <GlassButton variant="secondary" size="sm" onClick={clearMessages}>
            <RotateCcw size={14} className="mr-1" />
            清空
          </GlassButton>
        </div>

        {/* 角色切换 */}
        <div className="flex gap-2">
          {(Object.keys(roleConfig) as Array<keyof typeof roleConfig>).map((role) => {
            const config = roleConfig[role];
            const isActive = currentRole === role;
            const Icon = config.icon;

            return (
              <button
                key={role}
                onClick={() => setCurrentRole(role)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg',
                  'border transition-all duration-200',
                  isActive
                    ? `${config.bgColor} border-current ${config.color}`
                    : 'bg-white/5 border-white/10 text-b2-text-secondary hover:bg-white/10'
                )}
              >
                <Icon size={16} />
                <span className="text-sm font-medium">{config.label}</span>
              </button>
            );
          })}
        </div>

        {/* 当前AI状态 */}
        <div className="mt-3 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-b2-text-secondary">
            <currentConfig.icon size={16} className={currentConfig.color} />
            <span>{currentConfig.description}</span>
          </div>
          {currentClarity !== null && <ClarityBadge score={currentClarity} />}
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'flex gap-3',
                message.role === 'user' ? 'flex-row-reverse' : ''
              )}
            >
              {/* 头像 */}
              <div
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                  message.role === 'user'
                    ? 'bg-b2-accent-cyan/20'
                    : currentConfig.bgColor
                )}
              >
                {message.role === 'user' ? (
                  <User size={16} className="text-b2-accent-cyan" />
                ) : (
                  <Bot size={16} className={currentConfig.color} />
                )}
              </div>

              {/* 消息内容 */}
              <div
                className={cn(
                  'flex-1 max-w-[80%]',
                  message.role === 'user' ? 'text-right' : ''
                )}
              >
                <GlassCard
                  className={cn(
                    'p-3 inline-block text-left',
                    message.role === 'user' && 'bg-b2-accent-cyan/10'
                  )}
                >
                  <div className="text-sm text-b2-text-primary whitespace-pre-wrap">
                    {message.content || (
                      <span className="flex items-center gap-2 text-b2-text-muted">
                        <Loader2 size={14} className="animate-spin" />
                        思考中...
                      </span>
                    )}
                    {message.isStreaming && (
                      <span className="inline-block w-2 h-4 ml-1 bg-b2-accent-cyan animate-pulse" />
                    )}
                  </div>
                </GlassCard>

                {/* 消息操作 */}
                <div
                  className={cn(
                    'flex items-center gap-2 mt-1 text-xs text-b2-text-muted',
                    message.role === 'user' ? 'justify-end' : ''
                  )}
                >
                  <span>{formatRelativeTime(message.timestamp)}</span>
                  {message.role === 'assistant' && message.content && (
                    <button
                      onClick={() => handleCopy(message.id, message.content)}
                      className="hover:text-b2-text-secondary transition-colors"
                    >
                      {copiedId === message.id ? (
                        <Check size={12} className="text-b2-accent-green" />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* 空状态 */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-b2-accent-cyan/20 to-b2-accent-purple/20 flex items-center justify-center mb-4">
              <currentConfig.icon size={32} className={currentConfig.color} />
            </div>
            <h3 className="text-lg font-medium text-b2-text-primary mb-2">
              与{currentConfig.label}对话
            </h3>
            <p className="text-sm text-b2-text-secondary max-w-md">
              {currentConfig.description}。发送消息开始对话，AI将在规则的盔甲内为您工作。
            </p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="flex-shrink-0 p-4 border-t border-white/5">
        <div className="flex gap-3">
          <GlassTextarea
            value={input}
            onChange={setInput}
            placeholder={`向${currentConfig.label}发送消息...`}
            rows={2}
            disabled={isLoading}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <GlassButton
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="self-end"
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </GlassButton>
        </div>
        <p className="text-xs text-b2-text-muted mt-2">
          按 Enter 发送，Shift + Enter 换行
        </p>
      </div>
    </div>
  );
}
