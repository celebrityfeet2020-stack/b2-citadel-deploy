'use client';

import { useEffect, useState } from 'react';
import { cn, formatDateTime, getTaskStatusDisplay } from '@/lib/utils';
import { useTaskStore } from '@/store';
import { tasksApi, Task } from '@/lib/api';
import { GlassCard, GlassButton, GlassInput, GlassTextarea } from '@/components/ui/GlassCard';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ListTodo,
  Plus,
  RefreshCw,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Eye,
  ChevronRight,
  X,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export function TasksPanel() {
  const {
    tasks,
    currentTask,
    currentProjectId,
    isLoading,
    setTasks,
    setCurrentTask,
    setCurrentProjectId,
    addTask,
    updateTask,
    setLoading,
  } = useTaskStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 加载任务列表
  const loadTasks = async () => {
    setRefreshing(true);
    try {
      const result = await tasksApi.list(currentProjectId);
      setTasks(result.tasks);
    } catch (error: any) {
      toast.error(`加载失败: ${error.message}`);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [currentProjectId]);

  // 运行任务
  const handleRunTask = async (taskId: string) => {
    try {
      const result = await tasksApi.run(taskId);
      updateTask(taskId, result);
      toast.success('任务已启动');
    } catch (error: any) {
      toast.error(`启动失败: ${error.message}`);
    }
  };

  // 人工审查
  const handleReview = async (taskId: string, approved: boolean, comment?: string) => {
    try {
      const result = await tasksApi.humanReview(taskId, approved, comment);
      updateTask(taskId, result);
      toast.success(approved ? '已批准' : '已拒绝');
    } catch (error: any) {
      toast.error(`审查失败: ${error.message}`);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 头部 */}
      <div className="flex-shrink-0 p-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-b2-text-primary flex items-center gap-2">
            <ListTodo className="text-b2-accent-cyan" />
            任务中心
          </h2>
          <div className="flex gap-2">
            <GlassButton
              variant="secondary"
              size="sm"
              onClick={loadTasks}
              disabled={refreshing}
            >
              <RefreshCw size={14} className={cn(refreshing && 'animate-spin')} />
            </GlassButton>
            <GlassButton size="sm" onClick={() => setShowCreateModal(true)}>
              <Plus size={14} className="mr-1" />
              新建任务
            </GlassButton>
          </div>
        </div>

        {/* 项目选择 */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-b2-text-secondary">项目:</span>
          <GlassInput
            value={currentProjectId}
            onChange={setCurrentProjectId}
            placeholder="项目ID"
            className="flex-1 py-1.5 text-sm"
          />
        </div>
      </div>

      {/* 任务列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        {tasks.length === 0 ? (
          <EmptyState onAdd={() => setShowCreateModal(true)} />
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isSelected={currentTask?.id === task.id}
                  onSelect={() => setCurrentTask(task)}
                  onRun={() => handleRunTask(task.id)}
                  onReview={handleReview}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* 创建任务模态框 */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateTaskModal
            projectId={currentProjectId}
            onClose={() => setShowCreateModal(false)}
            onSuccess={(task) => {
              addTask(task);
              setShowCreateModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-12">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-b2-accent-cyan/20 to-b2-accent-green/20 flex items-center justify-center mb-4">
        <ListTodo size={32} className="text-b2-accent-cyan" />
      </div>
      <h3 className="text-lg font-medium text-b2-text-primary mb-2">暂无任务</h3>
      <p className="text-sm text-b2-text-secondary max-w-md mb-4">
        创建开发任务，AI将在七道防线的保护下执行任务。
      </p>
      <GlassButton onClick={onAdd}>
        <Plus size={16} className="mr-2" />
        创建第一个任务
      </GlassButton>
    </div>
  );
}

interface TaskCardProps {
  task: Task;
  isSelected: boolean;
  onSelect: () => void;
  onRun: () => void;
  onReview: (taskId: string, approved: boolean, comment?: string) => void;
}

function TaskCard({ task, isSelected, onSelect, onRun, onReview }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [reviewComment, setReviewComment] = useState('');

  const statusDisplay = getTaskStatusDisplay(task.status);
  const needsReview = task.status === 'reviewing';
  const canRun = task.status === 'pending';

  // 防线检查结果统计
  const defenseStats = {
    passed: task.defense_results.filter((d) => d.passed).length,
    total: task.defense_results.length,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <GlassCard
        className={cn('p-4 cursor-pointer', isSelected && 'border-b2-accent-cyan/50')}
        hover
        onClick={onSelect}
      >
        {/* 头部 */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn('text-sm font-medium', statusDisplay.color)}>
                {statusDisplay.label}
              </span>
              <span className="text-xs text-b2-text-muted font-mono">{task.task_type}</span>
            </div>
            <p className="text-sm text-b2-text-primary line-clamp-2">{task.description}</p>
          </div>

          <div className="flex items-center gap-2 ml-3">
            {canRun && (
              <GlassButton
                size="sm"
                onClick={(e) => {
                  e?.stopPropagation();
                  onRun();
                }}
              >
                <Play size={14} />
              </GlassButton>
            )}
            <ChevronRight
              size={16}
              className={cn(
                'text-b2-text-muted transition-transform',
                expanded && 'rotate-90'
              )}
            />
          </div>
        </div>

        {/* 防线状态 */}
        {defenseStats.total > 0 && (
          <div className="flex items-center gap-2 text-xs text-b2-text-secondary mb-2">
            <Shield size={12} />
            <span>
              防线检查: {defenseStats.passed}/{defenseStats.total}
            </span>
            {defenseStats.passed === defenseStats.total ? (
              <CheckCircle size={12} className="text-b2-accent-green" />
            ) : (
              <AlertTriangle size={12} className="text-b2-accent-amber" />
            )}
          </div>
        )}

        {/* 时间信息 */}
        <div className="flex items-center gap-2 text-xs text-b2-text-muted">
          <Clock size={12} />
          <span>{formatDateTime(task.created_at)}</span>
        </div>

        {/* 展开详情 */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 pt-3 border-t border-white/5 space-y-3"
              onClick={(e) => e?.stopPropagation()}
            >
              {/* 执行官产出 */}
              {task.executor_output && (
                <div>
                  <div className="text-xs text-b2-text-secondary mb-1 flex items-center gap-1">
                    <Eye size={12} /> 执行官产出
                  </div>
                  <div className="p-2 rounded bg-white/5 text-xs text-b2-text-primary max-h-32 overflow-y-auto">
                    {task.executor_output}
                  </div>
                </div>
              )}

              {/* 审计官产出 */}
              {task.auditor_output && (
                <div>
                  <div className="text-xs text-b2-text-secondary mb-1 flex items-center gap-1">
                    <Shield size={12} /> 审计官产出
                  </div>
                  <div className="p-2 rounded bg-white/5 text-xs text-b2-text-primary max-h-32 overflow-y-auto">
                    {task.auditor_output}
                  </div>
                </div>
              )}

              {/* 防线检查结果 */}
              {task.defense_results.length > 0 && (
                <div>
                  <div className="text-xs text-b2-text-secondary mb-1">防线检查结果</div>
                  <div className="space-y-1">
                    {task.defense_results.map((result, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-xs p-1.5 rounded bg-white/5"
                      >
                        {result.passed ? (
                          <CheckCircle size={12} className="text-b2-accent-green" />
                        ) : (
                          <XCircle size={12} className="text-b2-accent-pink" />
                        )}
                        <span className="text-b2-text-secondary">{result.defense_name}</span>
                        <span className="text-b2-text-muted flex-1 truncate">
                          {result.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 人工审查 */}
              {needsReview && (
                <div className="pt-2 border-t border-white/5">
                  <div className="text-xs text-b2-accent-amber mb-2 flex items-center gap-1">
                    <AlertTriangle size={12} /> 需要人工审查
                  </div>
                  <GlassTextarea
                    value={reviewComment}
                    onChange={setReviewComment}
                    placeholder="审查意见（可选）"
                    rows={2}
                    className="mb-2"
                  />
                  <div className="flex gap-2">
                    <GlassButton
                      variant="danger"
                      size="sm"
                      className="flex-1"
                      onClick={() => onReview(task.id, false, reviewComment)}
                    >
                      <XCircle size={14} className="mr-1" />
                      拒绝
                    </GlassButton>
                    <GlassButton
                      size="sm"
                      className="flex-1"
                      onClick={() => onReview(task.id, true, reviewComment)}
                    >
                      <CheckCircle size={14} className="mr-1" />
                      批准
                    </GlassButton>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 展开/收起按钮 */}
        <button
          onClick={(e) => {
            e?.stopPropagation();
            setExpanded(!expanded);
          }}
          className="w-full mt-2 pt-2 border-t border-white/5 text-xs text-b2-text-muted hover:text-b2-text-secondary transition-colors"
        >
          {expanded ? '收起详情' : '查看详情'}
        </button>
      </GlassCard>
    </motion.div>
  );
}

interface CreateTaskModalProps {
  projectId: string;
  onClose: () => void;
  onSuccess: (task: Task) => void;
}

function CreateTaskModal({ projectId, onClose, onSuccess }: CreateTaskModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    task_type: 'feature',
    description: '',
    module_id: '',
  });

  const handleSubmit = async () => {
    if (!form.description) {
      toast.error('请填写任务描述');
      return;
    }

    setLoading(true);
    try {
      const task = await tasksApi.create({
        project_id: projectId,
        task_type: form.task_type,
        description: form.description,
        module_id: form.module_id || undefined,
      });
      toast.success('任务创建成功');
      onSuccess(task);
    } catch (error: any) {
      toast.error(`创建失败: ${error.message}`);
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
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        className="relative w-full max-w-md"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-b2-text-primary">创建任务</h3>
            <button
              onClick={onClose}
              className="text-b2-text-muted hover:text-b2-text-primary transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-b2-text-secondary mb-1">任务类型</label>
              <select
                value={form.task_type}
                onChange={(e) => setForm({ ...form, task_type: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-b2-text-primary focus:outline-none focus:border-b2-accent-cyan/50"
              >
                <option value="feature">功能开发</option>
                <option value="bugfix">Bug修复</option>
                <option value="refactor">代码重构</option>
                <option value="deploy">部署</option>
                <option value="security">安全相关</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-b2-text-secondary mb-1">任务描述 *</label>
              <GlassTextarea
                value={form.description}
                onChange={(v) => setForm({ ...form, description: v })}
                placeholder="详细描述需要完成的任务..."
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm text-b2-text-secondary mb-1">模块ID（可选）</label>
              <GlassInput
                value={form.module_id}
                onChange={(v) => setForm({ ...form, module_id: v })}
                placeholder="如: auth, api, frontend"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <GlassButton variant="secondary" className="flex-1" onClick={onClose}>
              取消
            </GlassButton>
            <GlassButton className="flex-1" onClick={handleSubmit} disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : '创建'}
            </GlassButton>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}
