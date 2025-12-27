'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useAIStore } from '@/store';
import { gatewayApi, AIAdapter, AmnesiaStatus } from '@/lib/api';
import { GlassCard, GlassButton, GlassInput } from '@/components/ui/GlassCard';
import { ClarityIndicator, StatusDot } from '@/components/ui/ClarityIndicator';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Plus,
  RefreshCw,
  Power,
  PowerOff,
  Trash2,
  Settings,
  Activity,
  Zap,
  AlertTriangle,
  CheckCircle,
  X,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';

export function AIStatusPanel() {
  const { adapters, amnesiaStatus, isLoading, setAdapters, setAmnesiaStatus, setLoading } =
    useAIStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 加载AI状态
  const loadStatus = async () => {
    setRefreshing(true);
    try {
      const status = await gatewayApi.getStatus();
      setAdapters(status.adapters);
      setAmnesiaStatus(status.amnesia_detection);
    } catch (error: any) {
      toast.error(`加载失败: ${error.message}`);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStatus();
    // 每30秒刷新一次
    const interval = setInterval(loadStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // 切换适配器状态
  const toggleAdapter = async (name: string, enabled: boolean) => {
    try {
      if (enabled) {
        await gatewayApi.disableAdapter(name);
        toast.success(`已禁用 ${name}`);
      } else {
        await gatewayApi.enableAdapter(name);
        toast.success(`已启用 ${name}`);
      }
      loadStatus();
    } catch (error: any) {
      toast.error(`操作失败: ${error.message}`);
    }
  };

  // 重置失忆检测
  const resetAmnesia = async (name: string) => {
    try {
      await gatewayApi.resetAmnesia(name);
      toast.success(`已重置 ${name} 的失忆检测`);
      loadStatus();
    } catch (error: any) {
      toast.error(`重置失败: ${error.message}`);
    }
  };

  const adapterList = Object.entries(adapters);
  const hasAdapters = adapterList.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* 头部 */}
      <div className="flex-shrink-0 p-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-b2-text-primary flex items-center gap-2">
            <Brain className="text-b2-accent-purple" />
            AI 状态监控
          </h2>
          <div className="flex gap-2">
            <GlassButton
              variant="secondary"
              size="sm"
              onClick={loadStatus}
              disabled={refreshing}
            >
              <RefreshCw size={14} className={cn(refreshing && 'animate-spin')} />
            </GlassButton>
            <GlassButton size="sm" onClick={() => setShowAddModal(true)}>
              <Plus size={14} className="mr-1" />
              添加AI
            </GlassButton>
          </div>
        </div>
        <p className="text-sm text-b2-text-secondary">
          监控AI适配器状态和清醒度，及时发现失忆问题
        </p>
      </div>

      {/* AI列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!hasAdapters ? (
          <EmptyState onAdd={() => setShowAddModal(true)} />
        ) : (
          <AnimatePresence>
            {adapterList.map(([name, adapter]) => (
              <AIAdapterCard
                key={name}
                adapter={adapter}
                amnesiaStatus={amnesiaStatus[name]}
                onToggle={() => toggleAdapter(name, adapter.enabled)}
                onResetAmnesia={() => resetAmnesia(name)}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* 添加AI模态框 */}
      <AnimatePresence>
        {showAddModal && (
          <AddAIModal onClose={() => setShowAddModal(false)} onSuccess={loadStatus} />
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-12">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-b2-accent-purple/20 to-b2-accent-pink/20 flex items-center justify-center mb-4">
        <Brain size={32} className="text-b2-accent-purple" />
      </div>
      <h3 className="text-lg font-medium text-b2-text-primary mb-2">尚未配置AI适配器</h3>
      <p className="text-sm text-b2-text-secondary max-w-md mb-4">
        添加AI适配器以启用聊天和任务执行功能。支持OpenAI兼容API和本地Ollama。
      </p>
      <GlassButton onClick={onAdd}>
        <Plus size={16} className="mr-2" />
        添加第一个AI
      </GlassButton>
    </div>
  );
}

interface AIAdapterCardProps {
  adapter: AIAdapter;
  amnesiaStatus?: AmnesiaStatus;
  onToggle: () => void;
  onResetAmnesia: () => void;
}

function AIAdapterCard({
  adapter,
  amnesiaStatus,
  onToggle,
  onResetAmnesia,
}: AIAdapterCardProps) {
  const [expanded, setExpanded] = useState(false);

  const roleLabels: Record<string, string> = {
    executor: '执行官',
    auditor: '审计官',
    commander: '指挥官AI',
  };

  const clarityScore = amnesiaStatus?.clarity_score ?? 1;
  const isAmnesia = amnesiaStatus?.is_amnesia ?? false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <GlassCard className="p-4">
        {/* 头部 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center',
                adapter.enabled ? 'bg-b2-accent-cyan/20' : 'bg-white/5'
              )}
            >
              <Zap
                size={20}
                className={adapter.enabled ? 'text-b2-accent-cyan' : 'text-b2-text-muted'}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-b2-text-primary">{adapter.name}</h3>
                <StatusDot status={adapter.enabled ? 'online' : 'offline'} />
              </div>
              <div className="text-xs text-b2-text-secondary">
                {roleLabels[adapter.role] || adapter.role} · {adapter.model}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAmnesia && (
              <span className="px-2 py-0.5 rounded-full bg-b2-accent-pink/20 text-b2-accent-pink text-xs flex items-center gap-1">
                <AlertTriangle size={12} />
                失忆警告
              </span>
            )}
            <GlassButton
              variant={adapter.enabled ? 'danger' : 'primary'}
              size="sm"
              onClick={onToggle}
            >
              {adapter.enabled ? <PowerOff size={14} /> : <Power size={14} />}
            </GlassButton>
          </div>
        </div>

        {/* 清醒度指示器 */}
        {adapter.enabled && (
          <div className="mb-3">
            <ClarityIndicator score={clarityScore} size="md" />
          </div>
        )}

        {/* 统计信息 */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-2 rounded-lg bg-white/5">
            <div className="text-lg font-mono text-b2-text-primary">
              {adapter.total_requests}
            </div>
            <div className="text-xs text-b2-text-muted">请求数</div>
          </div>
          <div className="p-2 rounded-lg bg-white/5">
            <div className="text-lg font-mono text-b2-text-primary">
              {(adapter.total_tokens / 1000).toFixed(1)}k
            </div>
            <div className="text-xs text-b2-text-muted">Token</div>
          </div>
          <div className="p-2 rounded-lg bg-white/5">
            <div className="text-lg font-mono text-b2-text-primary">
              {adapter.failed_requests}
            </div>
            <div className="text-xs text-b2-text-muted">失败</div>
          </div>
        </div>

        {/* 展开详情 */}
        {expanded && amnesiaStatus && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-3 pt-3 border-t border-white/5"
          >
            <div className="text-xs text-b2-text-secondary mb-2">失忆检测指标</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-b2-text-muted">重复率</span>
                <span className="font-mono">
                  {(amnesiaStatus.metrics.repetition_rate * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-b2-text-muted">一致性</span>
                <span className="font-mono">
                  {(amnesiaStatus.metrics.consistency_score * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-b2-text-muted">审计通过率</span>
                <span className="font-mono">
                  {(amnesiaStatus.metrics.audit_pass_rate * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-b2-text-muted">Token效率</span>
                <span className="font-mono">
                  {(amnesiaStatus.metrics.token_efficiency * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {isAmnesia && (
              <GlassButton
                variant="danger"
                size="sm"
                className="w-full mt-3"
                onClick={onResetAmnesia}
              >
                <RefreshCw size={14} className="mr-1" />
                一键换人（重置检测）
              </GlassButton>
            )}
          </motion.div>
        )}

        {/* 展开/收起按钮 */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full mt-3 pt-2 border-t border-white/5 text-xs text-b2-text-muted hover:text-b2-text-secondary transition-colors"
        >
          {expanded ? '收起详情' : '查看详情'}
        </button>
      </GlassCard>
    </motion.div>
  );
}

interface AddAIModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function AddAIModal({ onClose, onSuccess }: AddAIModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    role: 'executor',
    provider_type: 'openai_compatible',
    base_url: '',
    api_key: '',
    model: 'gpt-4.1-mini',
  });

  const handleSubmit = async () => {
    if (!form.name || !form.base_url || !form.api_key) {
      toast.error('请填写必填字段');
      return;
    }

    setLoading(true);
    try {
      await gatewayApi.addAdapter(form);
      toast.success('AI适配器添加成功');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(`添加失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* 模态框 */}
      <motion.div
        className="relative w-full max-w-md"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-b2-text-primary">添加AI适配器</h3>
            <button
              onClick={onClose}
              className="text-b2-text-muted hover:text-b2-text-primary transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-b2-text-secondary mb-1">名称 *</label>
              <GlassInput
                value={form.name}
                onChange={(v) => setForm({ ...form, name: v })}
                placeholder="如: executor-primary"
              />
            </div>

            <div>
              <label className="block text-sm text-b2-text-secondary mb-1">角色 *</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-b2-text-primary focus:outline-none focus:border-b2-accent-cyan/50"
              >
                <option value="executor">执行官</option>
                <option value="auditor">审计官</option>
                <option value="commander">指挥官AI</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-b2-text-secondary mb-1">API地址 *</label>
              <GlassInput
                value={form.base_url}
                onChange={(v) => setForm({ ...form, base_url: v })}
                placeholder="https://api.openai.com/v1"
              />
            </div>

            <div>
              <label className="block text-sm text-b2-text-secondary mb-1">API密钥 *</label>
              <GlassInput
                value={form.api_key}
                onChange={(v) => setForm({ ...form, api_key: v })}
                placeholder="sk-..."
                type="password"
              />
            </div>

            <div>
              <label className="block text-sm text-b2-text-secondary mb-1">模型</label>
              <GlassInput
                value={form.model}
                onChange={(v) => setForm({ ...form, model: v })}
                placeholder="gpt-4.1-mini"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <GlassButton variant="secondary" className="flex-1" onClick={onClose}>
              取消
            </GlassButton>
            <GlassButton className="flex-1" onClick={handleSubmit} disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : '添加'}
            </GlassButton>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}
