'use client';
import { useState, useRef, useEffect } from 'react';
import { cn, formatRelativeTime } from '@/lib/utils';
import { useDualChatStore } from '@/store';
import { streamChatWithRole, ChatMessage } from '@/lib/api';
import { GlassCard, GlassButton, GlassTextarea } from '@/components/ui/GlassCard';
import { ClarityBadge } from '@/components/ui/ClarityIndicator';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Loader2,
  User,
  Bot,
  Sparkles,
  Eye,
  RotateCcw,
  Copy,
  Check,
  Crown,
  Settings,
  ChevronLeft,
  ChevronRight,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import toast from 'react-hot-toast';

// 消息来源角色类型
type MessageSource = 'human' | 'commander' | 'system' | 'executor' | 'auditor';

// 消息接口
interface DualChatMessage {
  id: string;
  source: MessageSource;  // 消息来源
  content: string;        // 显示内容（不含前缀）
  rawContent?: string;    // 发给AI的原始内容（含前缀）
  timestamp: Date;
  isStreaming?: boolean;
  metadata?: {
    defenseType?: string;
    defensePassed?: boolean;
    tokenCount?: number;
  };
}

// 角色配置 - 改名为执行官和审计官
const sourceConfig: Record<MessageSource, {
  label: string;
  icon: any;
  color: string;
  bgColor: string;
  position: 'left' | 'right' | 'center';
}> = {
  human: {
    label: 'Human users',
    icon: User,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    position: 'right',
  },
  commander: {
    label: 'AI Commander',
    icon: Crown,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    position: 'right',
  },
  system: {
    label: 'B2 system',
    icon: Settings,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/20',
    position: 'center',
  },
  executor: {
    label: '执行官',
    icon: Sparkles,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    position: 'left',
  },
  auditor: {
    label: '审计官',
    icon: Eye,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    position: 'left',
  },
};

// 单个聊天窗口组件
interface SingleChatWindowProps {
  role: 'executor' | 'auditor';
  messages: DualChatMessage[];
  isLoading: boolean;
  onSendMessage: (content: string) => void;
  onClearMessages: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

function SingleChatWindow({
  role,
  messages,
  isLoading,
  onSendMessage,
  onClearMessages,
  isCollapsed = false,
  onToggleCollapse,
}: SingleChatWindowProps) {
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const aiConfig = role === 'executor' ? sourceConfig.executor : sourceConfig.auditor;

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
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

  // 渲染单条消息
  const renderMessage = (message: DualChatMessage) => {
    const config = sourceConfig[message.source];
    const Icon = config.icon;
    const isCenter = config.position === 'center';
    const isRight = config.position === 'right';

    // 系统消息居中显示
    if (isCenter) {
      return (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center my-2"
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800/50 border border-gray-700/50">
            <Icon size={14} className={config.color} />
            <span className="text-xs text-gray-400">{config.label}</span>
            <span className="text-xs text-gray-300">{message.content}</span>
            {message.metadata?.defensePassed !== undefined && (
              <span className={cn(
                'text-xs font-medium',
                message.metadata.defensePassed ? 'text-green-400' : 'text-red-400'
              )}>
                {message.metadata.defensePassed ? '✓ 通过' : '✗ 未通过'}
              </span>
            )}
          </div>
        </motion.div>
      );
    }

    // 普通消息
    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'flex gap-3',
          isRight ? 'flex-row-reverse' : ''
        )}
      >
        {/* 头像 */}
        <div
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
            config.bgColor
          )}
        >
          <Icon size={16} className={config.color} />
        </div>

        {/* 消息内容 */}
        <div className={cn('flex-1 max-w-[80%]', isRight ? 'text-right' : '')}>
          {/* 角色标签 */}
          <div className={cn(
            'text-xs mb-1',
            config.color,
            isRight ? 'text-right' : 'text-left'
          )}>
            {config.label}
          </div>

          <GlassCard
            className={cn(
              'p-3 inline-block text-left',
              isRight && 'bg-blue-500/10'
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

          {/* 消息元信息 */}
          <div
            className={cn(
              'flex items-center gap-2 mt-1 text-xs text-b2-text-muted',
              isRight ? 'justify-end' : ''
            )}
          >
            <span>{formatRelativeTime(message.timestamp)}</span>
            {message.metadata?.tokenCount && (
              <span className="text-gray-500">
                {message.metadata.tokenCount} tokens
              </span>
            )}
            {message.content && (
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
    );
  };

  return (
    <div className="flex flex-col h-full border-r border-white/5 last:border-r-0">
      {/* 头部 */}
      <div className="flex-shrink-0 p-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', aiConfig.bgColor)}>
              <aiConfig.icon size={20} className={aiConfig.color} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-b2-text-primary">
                {aiConfig.label}聊天室
              </h3>
              <p className="text-xs text-b2-text-muted">
                {role === 'executor' ? '负责执行开发任务' : '负责审查代码质量'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <GlassButton variant="secondary" size="sm" onClick={onClearMessages}>
              <RotateCcw size={14} className="mr-1" />
              清空
            </GlassButton>
            {/* 审计官面板收缩按钮 */}
            {role === 'auditor' && onToggleCollapse && (
              <GlassButton 
                variant="secondary" 
                size="sm" 
                onClick={onToggleCollapse}
              >
                {isCollapsed ? <PanelRightOpen size={14} /> : <PanelRightClose size={14} />}
              </GlassButton>
            )}
          </div>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map(renderMessage)}
        </AnimatePresence>

        {/* 空状态 */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className={cn(
              'w-16 h-16 rounded-2xl flex items-center justify-center mb-4',
              aiConfig.bgColor
            )}>
              <aiConfig.icon size={32} className={aiConfig.color} />
            </div>
            <h3 className="text-lg font-medium text-b2-text-primary mb-2">
              与{aiConfig.label}对话
            </h3>
            <p className="text-sm text-b2-text-secondary max-w-md">
              发送消息开始对话。所有角色的消息都会在此显示。
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {['Human users', 'AI Commander', 'B2 system'].map((label) => (
                <span
                  key={label}
                  className="px-2 py-1 text-xs rounded-full bg-white/5 text-b2-text-muted"
                >
                  {label}
                </span>
              ))}
            </div>
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
            placeholder={`向${aiConfig.label}发送消息...`}
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
          按 Enter 发送，Shift + Enter 换行 | 消息将以 <span className="text-blue-400">Human users:</span> 前缀发送
        </p>
      </div>
    </div>
  );
}

// 收起状态的审计官面板
function CollapsedAuditorPanel({ 
  onToggleCollapse, 
  messageCount 
}: { 
  onToggleCollapse: () => void;
  messageCount: number;
}) {
  return (
    <div className="w-12 h-full flex flex-col items-center py-4 border-l border-white/10 bg-black/20">
      {/* 展开按钮 */}
      <GlassButton
        variant="secondary"
        size="sm"
        onClick={onToggleCollapse}
        className="mb-4"
      >
        <PanelRightOpen size={16} />
      </GlassButton>
      
      {/* 审计官图标 */}
      <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center mb-2">
        <Eye size={16} className="text-amber-400" />
      </div>
      
      {/* 竖向文字 */}
      <div className="writing-mode-vertical text-xs text-amber-400 font-medium tracking-wider">
        审计官
      </div>
      
      {/* 消息计数 */}
      {messageCount > 0 && (
        <div className="mt-auto mb-2 w-6 h-6 rounded-full bg-amber-500/30 flex items-center justify-center">
          <span className="text-xs text-amber-400 font-medium">
            {messageCount > 99 ? '99+' : messageCount}
          </span>
        </div>
      )}
    </div>
  );
}

// 双屏聊天室主组件
export function DualChatPanel() {
  const [auditorCollapsed, setAuditorCollapsed] = useState(false);
  
  const {
    executorMessages,
    auditorMessages,
    executorLoading,
    auditorLoading,
    addExecutorMessage,
    addAuditorMessage,
    updateExecutorMessage,
    updateAuditorMessage,
    setExecutorMessageStreaming,
    setAuditorMessageStreaming,
    clearExecutorMessages,
    clearAuditorMessages,
    setExecutorLoading,
    setAuditorLoading,
  } = useDualChatStore();

  const toggleAuditorCollapse = () => {
    setAuditorCollapsed(!auditorCollapsed);
  };

  // 发送消息到执行官
  const handleSendToExecutor = async (content: string) => {
    setExecutorLoading(true);

    // 添加用户消息
    addExecutorMessage({
      source: 'human',
      content: content,
      rawContent: `Human users: ${content}`,
    });

    // 添加AI消息占位
    const aiMessageId = addExecutorMessage({
      source: 'executor',
      content: '',
      isStreaming: true,
    });

    try {
      // 构建消息历史（带前缀）
      const chatMessages: ChatMessage[] = executorMessages
        .filter((m) => !m.isStreaming)
        .map((m) => ({
          role: m.source === 'executor' ? 'assistant' : 'user',
          content: m.rawContent || m.content,
        }));
      chatMessages.push({ role: 'user', content: `Human users: ${content}` });

      // 流式请求
      let fullContent = '';
      for await (const chunk of streamChatWithRole({
        messages: chatMessages,
        role: 'executor',
        senderRole: 'human',
        stream: true,
      })) {
        fullContent += chunk;
        updateExecutorMessage(aiMessageId, fullContent);
      }

      setExecutorMessageStreaming(aiMessageId, false);
    } catch (error: any) {
      updateExecutorMessage(aiMessageId, `错误: ${error.message || '请求失败'}`);
      setExecutorMessageStreaming(aiMessageId, false);
      toast.error('执行官响应失败');
    } finally {
      setExecutorLoading(false);
    }
  };

  // 发送消息到审计官
  const handleSendToAuditor = async (content: string) => {
    setAuditorLoading(true);

    // 添加用户消息
    addAuditorMessage({
      source: 'human',
      content: content,
      rawContent: `Human users: ${content}`,
    });

    // 添加AI消息占位
    const aiMessageId = addAuditorMessage({
      source: 'auditor',
      content: '',
      isStreaming: true,
    });

    try {
      // 构建消息历史（带前缀）
      const chatMessages: ChatMessage[] = auditorMessages
        .filter((m) => !m.isStreaming)
        .map((m) => ({
          role: m.source === 'auditor' ? 'assistant' : 'user',
          content: m.rawContent || m.content,
        }));
      chatMessages.push({ role: 'user', content: `Human users: ${content}` });

      // 流式请求
      let fullContent = '';
      for await (const chunk of streamChatWithRole({
        messages: chatMessages,
        role: 'auditor',
        senderRole: 'human',
        stream: true,
      })) {
        fullContent += chunk;
        updateAuditorMessage(aiMessageId, fullContent);
      }

      setAuditorMessageStreaming(aiMessageId, false);
    } catch (error: any) {
      updateAuditorMessage(aiMessageId, `错误: ${error.message || '请求失败'}`);
      setAuditorMessageStreaming(aiMessageId, false);
      toast.error('审计官响应失败');
    } finally {
      setAuditorLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 标题栏 */}
      <div className="flex-shrink-0 p-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-b2-text-primary">AI 聊天室</h2>
            <p className="text-sm text-b2-text-muted mt-1">
              与执行官和审计官进行对话，所有角色消息实时显示
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-b2-text-muted">
              <span className="flex items-center gap-1">
                <User size={12} className="text-blue-400" /> Human users
              </span>
              <span className="flex items-center gap-1">
                <Crown size={12} className="text-purple-400" /> AI Commander
              </span>
              <span className="flex items-center gap-1">
                <Settings size={12} className="text-gray-400" /> B2 system
              </span>
            </div>
            {/* 审计官面板切换按钮 */}
            <GlassButton
              variant="secondary"
              size="sm"
              onClick={toggleAuditorCollapse}
            >
              {auditorCollapsed ? (
                <>
                  <PanelRightOpen size={14} className="mr-1" />
                  <span className="text-xs">展开审计官</span>
                </>
              ) : (
                <>
                  <PanelRightClose size={14} className="mr-1" />
                  <span className="text-xs">收起审计官</span>
                </>
              )}
            </GlassButton>
          </div>
        </div>
      </div>

      {/* 双屏聊天区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左屏：执行官 - 当审计官收起时占满宽度 */}
        <motion.div 
          className="h-full"
          animate={{ 
            flex: auditorCollapsed ? '1 1 100%' : '1 1 50%' 
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          <SingleChatWindow
            role="executor"
            messages={executorMessages}
            isLoading={executorLoading}
            onSendMessage={handleSendToExecutor}
            onClearMessages={clearExecutorMessages}
          />
        </motion.div>

        {/* 右屏：审计官 - 可收起 */}
        <AnimatePresence mode="wait">
          {auditorCollapsed ? (
            <motion.div
              key="collapsed"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 48, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <CollapsedAuditorPanel 
                onToggleCollapse={toggleAuditorCollapse}
                messageCount={auditorMessages.length}
              />
            </motion.div>
          ) : (
            <motion.div
              key="expanded"
              className="flex-1"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 'auto', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <SingleChatWindow
                role="auditor"
                messages={auditorMessages}
                isLoading={auditorLoading}
                onSendMessage={handleSendToAuditor}
                onClearMessages={clearAuditorMessages}
                isCollapsed={auditorCollapsed}
                onToggleCollapse={toggleAuditorCollapse}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 添加CSS样式 */}
      <style jsx global>{`
        .writing-mode-vertical {
          writing-mode: vertical-rl;
          text-orientation: mixed;
        }
      `}</style>
    </div>
  );
}
