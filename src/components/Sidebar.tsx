'use client';

import React from 'react';

type ViewType = 'chat' | 'tasks' | 'ai-status' | 'memory' | 'logs' | 'projects' | 'settings' | 'context-config';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

interface NavItem {
  id: ViewType;
  label: string;
  icon: string;
  description: string;
}

const navItems: NavItem[] = [
  { 
    id: 'chat', 
    label: '聊天室', 
    icon: '💬',
    description: '执行官 + 审计官双屏工作区'
  },
  { 
    id: 'tasks', 
    label: '任务中心', 
    icon: '📋',
    description: '任务管理与七道防线'
  },
  { 
    id: 'ai-status', 
    label: 'AI状态', 
    icon: '🤖',
    description: 'AI角色监控'
  },
  { 
    id: 'memory', 
    label: '记忆库', 
    icon: '🧠',
    description: 'D5记忆搜索'
  },
  { 
    id: 'logs', 
    label: '日志查看', 
    icon: '📜',
    description: 'Scribe日志记录'
  },
  { 
    id: 'projects', 
    label: '项目管理', 
    icon: '📁',
    description: '项目与模块'
  },
  { 
    id: 'context-config', 
    label: '上下文配置', 
    icon: '📊',
    description: 'Token分配与注入设置'
  },
  { 
    id: 'settings', 
    label: '设置', 
    icon: '⚙️',
    description: 'API密钥与系统配置'
  },
];

export default function Sidebar({ currentView, onViewChange }: SidebarProps) {
  return (
    <aside className="w-64 bg-gray-900/80 border-r border-gray-700/50 flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-gray-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-xl">B2</span>
          </div>
          <div>
            <h1 className="text-white font-semibold">B2 Citadel</h1>
            <p className="text-xs text-gray-400">v1.3.0</p>
          </div>
        </div>
      </div>
      
      {/* 导航菜单 */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
              currentView === item.id
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <div className="text-left">
              <div className="text-sm font-medium">{item.label}</div>
              <div className="text-xs text-gray-500">{item.description}</div>
            </div>
          </button>
        ))}
      </nav>
      
      {/* 底部状态 */}
      <div className="p-4 border-t border-gray-700/50">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>系统运行中</span>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          VPS1: 43.160.207.239
        </div>
      </div>
    </aside>
  );
}
