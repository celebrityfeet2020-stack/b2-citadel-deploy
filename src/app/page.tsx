'use client';
import React, { useState } from 'react';
import { useUIStore } from '@/store';
import { Sidebar } from '@/components/layout/Sidebar';
import ExecutorPanel from '@/components/ExecutorPanel';
import AuditorPanel from '@/components/AuditorPanel';
import { TasksPanel } from '@/components/panels/TasksPanel';
import { AIStatusPanel } from '@/components/panels/AIStatusPanel';
import { MemoryPanel } from '@/components/panels/MemoryPanel';
import { LogsPanel } from '@/components/panels/LogsPanel';
import { ProjectsPanel } from '@/components/panels/ProjectsPanel';
import { SettingsPanel } from '@/components/panels/SettingsPanel';

export default function Home() {
  const { activePanel, sidebarOpen } = useUIStore();
  const [auditorCollapsed, setAuditorCollapsed] = useState(false);
  
  const renderContent = () => {
    switch (activePanel) {
      case 'chat':
        return (
          <div className="flex gap-4 h-full">
            {/* 执行官聊天室 - 根据审计官是否收缩调整宽度 */}
            <div className={`transition-all duration-300 ${auditorCollapsed ? 'flex-1' : 'flex-1'}`}>
              <ExecutorPanel />
            </div>
            
            {/* 审计官聊天室 - 可收缩 */}
            <div className={`transition-all duration-300 ${auditorCollapsed ? 'w-16' : 'flex-1'}`}>
              <AuditorPanel 
                collapsed={auditorCollapsed} 
                onToggleCollapse={() => setAuditorCollapsed(!auditorCollapsed)} 
              />
            </div>
          </div>
        );
      
      case 'tasks':
        return <TasksPanel />;
      
      case 'ai-status':
        return <AIStatusPanel />;
      
      case 'memory':
        return <MemoryPanel />;
      
      case 'logs':
        return <LogsPanel />;
      
      case 'projects':
        return <ProjectsPanel />;
      
      case 'settings':
        return <SettingsPanel />;
      
      default:
        return null;
    }
  };
  
  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* 侧边栏 */}
      <Sidebar />
      
      {/* 主内容区 */}
      <main className={`flex-1 p-4 overflow-hidden transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        {renderContent()}
      </main>
    </div>
  );
}
