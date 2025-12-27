'use client';
import { cn } from '@/lib/utils';
import { useUIStore, useAIStore } from '@/store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  ListTodo,
  Brain,
  Database,
  ChevronLeft,
  ChevronRight,
  Shield,
  FileText,
  FolderOpen,
  Settings,
} from 'lucide-react';
import { ClarityBadge, StatusDot } from '@/components/ui/ClarityIndicator';

const navItems = [
  { id: 'chat', label: '聊天室', icon: MessageSquare, description: '与AI对话' },
  { id: 'tasks', label: '任务中心', icon: ListTodo, description: '管理开发任务' },
  { id: 'ai-status', label: 'AI状态', icon: Brain, description: '监控AI清醒度' },
  { id: 'memory', label: '记忆库', icon: Database, description: '查询D5记忆' },
  { id: 'logs', label: '日志查看', icon: FileText, description: '查看全量日志' },
  { id: 'projects', label: '项目管理', icon: FolderOpen, description: '管理项目模块' },
  { id: 'settings', label: '设置', icon: Settings, description: 'API与配置' },
] as const;

export function Sidebar() {
  const { sidebarOpen, toggleSidebar, activePanel, setActivePanel } = useUIStore();
  const { adapters, amnesiaStatus } = useAIStore();

  // 计算整体AI健康状态
  const getOverallHealth = () => {
    const scores = Object.values(amnesiaStatus).map((s) => s.clarity_score);
    if (scores.length === 0) return null;
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return avg;
  };

  const overallHealth = getOverallHealth();
  const enabledAdapters = Object.values(adapters).filter((a) => a.enabled).length;

  return (
    <motion.aside
      className={cn(
        'fixed left-0 top-0 h-full z-40',
        'bg-b2-bg-secondary/80 backdrop-blur-xl',
        'border-r border-white/5',
        'flex flex-col'
      )}
      initial={false}
      animate={{ width: sidebarOpen ? 240 : 64 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-white/5">
        <motion.div
          className="flex items-center gap-3"
          animate={{ opacity: 1 }}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-b2-accent-cyan to-b2-accent-purple flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
              >
                <h1 className="text-lg font-bold bg-gradient-to-r from-b2-accent-cyan to-b2-accent-purple bg-clip-text text-transparent">
                  B2 Citadel
                </h1>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activePanel === item.id;
          const Icon = item.icon;

          return (
            <motion.button
              key={item.id}
              onClick={() => setActivePanel(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
                'transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-b2-accent-cyan/20 to-b2-accent-purple/10 border border-b2-accent-cyan/30'
                  : 'hover:bg-white/5 border border-transparent'
              )}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon
                className={cn(
                  'w-5 h-5 flex-shrink-0',
                  isActive ? 'text-b2-accent-cyan' : 'text-b2-text-secondary'
                )}
              />
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.div
                    className="flex-1 text-left"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div
                      className={cn(
                        'text-sm font-medium',
                        isActive ? 'text-b2-text-primary' : 'text-b2-text-secondary'
                      )}
                    >
                      {item.label}
                    </div>
                    <div className="text-xs text-b2-text-muted">{item.description}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </nav>

      {/* AI状态摘要 */}
      <div className="p-3 border-t border-white/5">
        <AnimatePresence>
          {sidebarOpen ? (
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-b2-text-secondary">AI引擎</span>
                <div className="flex items-center gap-1">
                  <StatusDot status={enabledAdapters > 0 ? 'online' : 'offline'} />
                  <span className="text-b2-text-muted">{enabledAdapters}个在线</span>
                </div>
              </div>
              {overallHealth !== null && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-b2-text-secondary">整体清醒度</span>
                  <ClarityBadge score={overallHealth} />
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              className="flex flex-col items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <StatusDot status={enabledAdapters > 0 ? 'online' : 'offline'} />
              {overallHealth !== null && (
                <div className="text-xs font-mono text-b2-text-muted">
                  {Math.round(overallHealth * 100)}%
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 折叠按钮 */}
      <button
        onClick={toggleSidebar}
        className={cn(
          'absolute -right-3 top-20',
          'w-6 h-6 rounded-full',
          'bg-b2-bg-tertiary border border-white/10',
          'flex items-center justify-center',
          'text-b2-text-secondary hover:text-b2-text-primary',
          'transition-colors duration-200'
        )}
      >
        {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>
    </motion.aside>
  );
}
