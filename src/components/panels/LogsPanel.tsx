'use client';
import { useState, useEffect } from 'react';
import { cn, formatRelativeTime } from '@/lib/utils';
import { scribeApi, LogEntry } from '@/lib/api';
import { GlassCard, GlassButton, GlassInput } from '@/components/ui/GlassCard';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  MessageSquare,
  Code,
  AlertTriangle,
  Activity,
  Database,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import toast from 'react-hot-toast';

// 日志类型配置
const logTypeConfig: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  CHAT: { label: '对话', icon: MessageSquare, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  CODE: { label: '代码', icon: Code, color: 'text-green-400', bgColor: 'bg-green-500/20' },
  ERROR: { label: '错误', icon: AlertTriangle, color: 'text-red-400', bgColor: 'bg-red-500/20' },
  TRACE: { label: '轨迹', icon: Activity, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  MEMORY_DIRECT: { label: '记忆', icon: Database, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
};

// 日志状态配置
const statusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: '待拉取', color: 'text-yellow-400' },
  PULLED: { label: '已拉取', color: 'text-blue-400' },
  CONFIRMED: { label: '已确认', color: 'text-green-400' },
  DESTROYED: { label: '已销毁', color: 'text-gray-400' },
};

// 单条日志组件
interface LogItemProps {
  log: LogEntry;
  isExpanded: boolean;
  onToggle: () => void;
}

function LogItem({ log, isExpanded, onToggle }: LogItemProps) {
  const typeConfig = logTypeConfig[log.log_type] || logTypeConfig.TRACE;
  const status = statusConfig[log.status] || statusConfig.PENDING;
  const Icon = typeConfig.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-b border-white/5 last:border-b-0"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors text-left"
      >
        {/* 类型图标 */}
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', typeConfig.bgColor)}>
          <Icon size={16} className={typeConfig.color} />
        </div>

        {/* 主要信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn('text-xs font-medium', typeConfig.color)}>
              {typeConfig.label}
            </span>
            <span className="text-xs text-b2-text-muted">
              {log.project_id}
              {log.module_id && ` / ${log.module_id}`}
            </span>
          </div>
          <p className="text-sm text-b2-text-primary truncate">
            {log.content.substring(0, 100)}
            {log.content.length > 100 && '...'}
          </p>
        </div>

        {/* 状态和时间 */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <span className={cn('text-xs', status.color)}>{status.label}</span>
          <span className="text-xs text-b2-text-muted">
            {formatRelativeTime(new Date(log.created_at))}
          </span>
          {isExpanded ? (
            <ChevronUp size={16} className="text-b2-text-muted" />
          ) : (
            <ChevronDown size={16} className="text-b2-text-muted" />
          )}
        </div>
      </button>

      {/* 展开内容 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pl-16">
              <GlassCard className="p-4">
                <pre className="text-sm text-b2-text-secondary whitespace-pre-wrap font-mono">
                  {log.content}
                </pre>
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <h4 className="text-xs font-medium text-b2-text-muted mb-2">元数据</h4>
                    <pre className="text-xs text-b2-text-secondary font-mono">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </GlassCard>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// 主日志面板
export function LogsPanel() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [stats, setStats] = useState<{ total: number; by_type: Record<string, number> } | null>(null);

  // 加载日志
  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const data = await scribeApi.getLogs({
        log_type: selectedType || undefined,
        limit: 100,
      });
      setLogs(data.logs);
    } catch (error) {
      console.error('Failed to load logs:', error);
      toast.error('加载日志失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 加载统计
  const loadStats = async () => {
    try {
      const data = await scribeApi.getLogStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  useEffect(() => {
    loadLogs();
    loadStats();
  }, [selectedType]);

  // 过滤日志
  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    return (
      log.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.project_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.module_id && log.module_id.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  return (
    <div className="flex flex-col h-full">
      {/* 标题 */}
      <div className="flex-shrink-0 p-6 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
              <FileText size={24} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-b2-text-primary">日志查看</h2>
              <p className="text-sm text-b2-text-muted">
                查看Scribe服务记录的全量日志
                {stats && ` · 共 ${stats.total} 条`}
              </p>
            </div>
          </div>
          <GlassButton onClick={loadLogs} disabled={isLoading}>
            <RefreshCw size={16} className={cn('mr-2', isLoading && 'animate-spin')} />
            刷新
          </GlassButton>
        </div>
      </div>

      {/* 过滤器 */}
      <div className="flex-shrink-0 p-4 border-b border-white/5">
        <div className="flex items-center gap-4">
          {/* 搜索框 */}
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-b2-text-muted" />
            <GlassInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="搜索日志内容..."
              className="pl-10"
            />
          </div>

          {/* 类型过滤 */}
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-b2-text-muted" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-b2-text-primary text-sm focus:outline-none focus:border-b2-accent-cyan/50"
            >
              <option value="">全部类型</option>
              {Object.entries(logTypeConfig).map(([type, config]) => (
                <option key={type} value={type}>
                  {config.label}
                  {stats?.by_type[type] && ` (${stats.by_type[type]})`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 类型统计 */}
        {stats && (
          <div className="flex items-center gap-4 mt-4">
            {Object.entries(logTypeConfig).map(([type, config]) => {
              const count = stats.by_type[type] || 0;
              const Icon = config.icon;
              return (
                <button
                  key={type}
                  onClick={() => setSelectedType(selectedType === type ? '' : type)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors',
                    selectedType === type
                      ? 'bg-white/10 border border-white/20'
                      : 'hover:bg-white/5'
                  )}
                >
                  <Icon size={14} className={config.color} />
                  <span className="text-xs text-b2-text-secondary">{config.label}</span>
                  <span className="text-xs text-b2-text-muted">{count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 日志列表 */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw size={24} className="animate-spin text-b2-text-muted" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <FileText size={48} className="text-b2-text-muted mb-4" />
            <h3 className="text-lg font-medium text-b2-text-primary mb-2">暂无日志</h3>
            <p className="text-sm text-b2-text-secondary">
              {searchQuery ? '没有找到匹配的日志' : '还没有记录任何日志'}
            </p>
          </div>
        ) : (
          <div>
            {filteredLogs.map((log) => (
              <LogItem
                key={log.id}
                log={log}
                isExpanded={expandedId === log.id}
                onToggle={() => setExpandedId(expandedId === log.id ? null : log.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
