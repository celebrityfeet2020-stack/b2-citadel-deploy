'use client';

import { useState } from 'react';
import { cn, formatDateTime, truncateText } from '@/lib/utils';
import { memoryApi, MemorySearchResult } from '@/lib/api';
import { GlassCard, GlassButton, GlassInput } from '@/components/ui/GlassCard';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database,
  Search,
  RefreshCw,
  FileText,
  Tag,
  Clock,
  Star,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export function MemoryPanel() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MemorySearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [d5Status, setD5Status] = useState<'online' | 'offline' | 'unknown'>('unknown');
  const [selectedMemory, setSelectedMemory] = useState<MemorySearchResult | null>(null);

  // 检查D5健康状态
  const checkHealth = async () => {
    try {
      const health = await memoryApi.health();
      setD5Status(health.d5_available ? 'online' : 'offline');
    } catch {
      setD5Status('offline');
    }
  };

  // 搜索记忆
  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error('请输入搜索关键词');
      return;
    }

    setIsLoading(true);
    try {
      const result = await memoryApi.search(query, {
        search_type: 'hybrid',
        top_k: 20,
      });
      setResults(result.results);
      if (result.results.length === 0) {
        toast('未找到相关记忆', { icon: '🔍' });
      }
    } catch (error: any) {
      toast.error(`搜索失败: ${error.message}`);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 头部 */}
      <div className="flex-shrink-0 p-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-b2-text-primary flex items-center gap-2">
            <Database className="text-b2-accent-green" />
            D5 记忆库
          </h2>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'text-xs px-2 py-0.5 rounded-full',
                d5Status === 'online'
                  ? 'bg-b2-accent-green/20 text-b2-accent-green'
                  : d5Status === 'offline'
                  ? 'bg-b2-accent-pink/20 text-b2-accent-pink'
                  : 'bg-white/10 text-b2-text-muted'
              )}
            >
              {d5Status === 'online' ? '在线' : d5Status === 'offline' ? '离线' : '未知'}
            </span>
            <GlassButton variant="secondary" size="sm" onClick={checkHealth}>
              <RefreshCw size={14} />
            </GlassButton>
          </div>
        </div>

        {/* 搜索框 */}
        <div className="flex gap-2">
          <GlassInput
            value={query}
            onChange={setQuery}
            placeholder="搜索记忆..."
            className="flex-1"
            onKeyDown={handleKeyDown}
          />
          <GlassButton onClick={handleSearch} disabled={isLoading}>
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Search size={18} />
            )}
          </GlassButton>
        </div>
      </div>

      {/* 搜索结果 */}
      <div className="flex-1 overflow-y-auto p-4">
        {results.length === 0 ? (
          <EmptyState onCheckHealth={checkHealth} />
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-b2-text-secondary mb-2">
              找到 {results.length} 条相关记忆
            </div>
            <AnimatePresence>
              {results.map((memory) => (
                <MemoryCard
                  key={memory.id}
                  memory={memory}
                  isSelected={selectedMemory?.id === memory.id}
                  onSelect={() => setSelectedMemory(memory)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* 记忆详情侧边栏 */}
      <AnimatePresence>
        {selectedMemory && (
          <MemoryDetail
            memory={selectedMemory}
            onClose={() => setSelectedMemory(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyState({ onCheckHealth }: { onCheckHealth: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-12">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-b2-accent-green/20 to-b2-accent-cyan/20 flex items-center justify-center mb-4">
        <Database size={32} className="text-b2-accent-green" />
      </div>
      <h3 className="text-lg font-medium text-b2-text-primary mb-2">搜索D5记忆库</h3>
      <p className="text-sm text-b2-text-secondary max-w-md mb-4">
        D5记忆母舰存储了所有项目的长期记忆。输入关键词搜索相关记忆，支持语义搜索。
      </p>
      <GlassButton variant="secondary" onClick={onCheckHealth}>
        <RefreshCw size={16} className="mr-2" />
        检查D5状态
      </GlassButton>
    </div>
  );
}

interface MemoryCardProps {
  memory: MemorySearchResult;
  isSelected: boolean;
  onSelect: () => void;
}

function MemoryCard({ memory, isSelected, onSelect }: MemoryCardProps) {
  const relevancePercent = Math.round(memory.relevance_score * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <GlassCard
        className={cn('p-4 cursor-pointer', isSelected && 'border-b2-accent-green/50')}
        hover
        onClick={onSelect}
      >
        {/* 头部 */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-b2-accent-green" />
            <span className="text-xs text-b2-text-muted font-mono">{memory.memory_type}</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'text-xs px-2 py-0.5 rounded-full font-mono',
                relevancePercent >= 70
                  ? 'bg-b2-accent-green/20 text-b2-accent-green'
                  : relevancePercent >= 40
                  ? 'bg-b2-accent-amber/20 text-b2-accent-amber'
                  : 'bg-white/10 text-b2-text-muted'
              )}
            >
              {relevancePercent}%
            </span>
            <ChevronRight size={16} className="text-b2-text-muted" />
          </div>
        </div>

        {/* 摘要 */}
        {memory.summary && (
          <p className="text-sm text-b2-text-primary mb-2">{memory.summary}</p>
        )}

        {/* 内容预览 */}
        <p className="text-xs text-b2-text-secondary line-clamp-2">
          {truncateText(memory.content, 150)}
        </p>

        {/* 标签和元信息 */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
          <div className="flex items-center gap-2 flex-wrap">
            {memory.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded bg-white/5 text-b2-text-muted"
              >
                <Tag size={10} className="inline mr-1" />
                {tag}
              </span>
            ))}
            {memory.tags.length > 3 && (
              <span className="text-xs text-b2-text-muted">+{memory.tags.length - 3}</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-b2-text-muted">
            <Star size={12} className="text-b2-accent-amber" />
            <span>{memory.importance}</span>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

interface MemoryDetailProps {
  memory: MemorySearchResult;
  onClose: () => void;
}

function MemoryDetail({ memory, onClose }: MemoryDetailProps) {
  return (
    <motion.div
      className="fixed right-0 top-0 h-full w-96 z-50"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
    >
      <div className="h-full bg-b2-bg-secondary/95 backdrop-blur-xl border-l border-white/5 flex flex-col">
        {/* 头部 */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-semibold text-b2-text-primary">记忆详情</h3>
          <button
            onClick={onClose}
            className="text-b2-text-muted hover:text-b2-text-primary transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 元信息 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-white/5">
              <div className="text-xs text-b2-text-muted mb-1">类型</div>
              <div className="text-sm text-b2-text-primary font-mono">{memory.memory_type}</div>
            </div>
            <div className="p-3 rounded-lg bg-white/5">
              <div className="text-xs text-b2-text-muted mb-1">重要性</div>
              <div className="text-sm text-b2-text-primary flex items-center gap-1">
                <Star size={14} className="text-b2-accent-amber" />
                {memory.importance}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white/5">
              <div className="text-xs text-b2-text-muted mb-1">相关度</div>
              <div className="text-sm text-b2-accent-green font-mono">
                {Math.round(memory.relevance_score * 100)}%
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white/5">
              <div className="text-xs text-b2-text-muted mb-1">创建时间</div>
              <div className="text-sm text-b2-text-primary">
                {memory.created_at ? formatDateTime(memory.created_at) : '-'}
              </div>
            </div>
          </div>

          {/* 摘要 */}
          {memory.summary && (
            <div>
              <div className="text-xs text-b2-text-muted mb-2">摘要</div>
              <div className="p-3 rounded-lg bg-white/5 text-sm text-b2-text-primary">
                {memory.summary}
              </div>
            </div>
          )}

          {/* 完整内容 */}
          <div>
            <div className="text-xs text-b2-text-muted mb-2">完整内容</div>
            <div className="p-3 rounded-lg bg-white/5 text-sm text-b2-text-primary whitespace-pre-wrap max-h-64 overflow-y-auto">
              {memory.content}
            </div>
          </div>

          {/* 标签 */}
          {memory.tags.length > 0 && (
            <div>
              <div className="text-xs text-b2-text-muted mb-2">标签</div>
              <div className="flex flex-wrap gap-2">
                {memory.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-1 rounded bg-b2-accent-cyan/10 text-b2-accent-cyan"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
