'use client';

import React, { useState, useEffect } from 'react';

interface ContextConfig {
  role: string;
  totalBudget: number;
  allocation: {
    systemPrompt: number;
    coreContext: number;
    primaryContent: number;
    secondaryContent: number;
    d5Memory: number;
    reserved: number;
  };
  layerTokens: {
    system_prompt: number;
    core_context: number;
    primary_content: number;
    secondary_content: number;
    d5_memory: number;
    reserved: number;
  };
  injection: {
    messageInterval: number;
    tokenThreshold: number;
  };
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:22888';

// 预设配置
const PRESETS = {
  small: { budget: 8000, label: '8K (经济)' },
  medium: { budget: 32000, label: '32K (标准)' },
  large: { budget: 128000, label: '128K (大容量)' },
  xlarge: { budget: 200000, label: '200K (最大)' },
};

export default function ContextConfigPanel() {
  const [activeRole, setActiveRole] = useState<'executor' | 'auditor'>('executor');
  const [config, setConfig] = useState<ContextConfig | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // 编辑状态
  const [editBudget, setEditBudget] = useState(32000);
  const [editAllocation, setEditAllocation] = useState({
    systemPrompt: 5,
    coreContext: 10,
    primaryContent: 40,
    secondaryContent: 25,
    d5Memory: 15,
  });
  const [editInjection, setEditInjection] = useState({
    messageInterval: 20,
    tokenThreshold: 8000,
  });
  
  // 获取配置
  const fetchConfig = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/b2/workflow/context-config/${activeRole}`);
      const data = await res.json();
      setConfig({
        role: data.role,
        totalBudget: data.total_budget,
        allocation: {
          systemPrompt: data.allocation.system_prompt,
          coreContext: data.allocation.core_context,
          primaryContent: data.allocation.primary_content,
          secondaryContent: data.allocation.secondary_content,
          d5Memory: data.allocation.d5_memory,
          reserved: data.allocation.reserved,
        },
        layerTokens: data.layer_tokens,
        injection: {
          messageInterval: data.injection.message_interval,
          tokenThreshold: data.injection.token_threshold,
        },
      });
      
      // 同步到编辑状态
      setEditBudget(data.total_budget);
      setEditAllocation({
        systemPrompt: data.allocation.system_prompt,
        coreContext: data.allocation.core_context,
        primaryContent: data.allocation.primary_content,
        secondaryContent: data.allocation.secondary_content,
        d5Memory: data.allocation.d5_memory,
      });
      setEditInjection({
        messageInterval: data.injection.message_interval,
        tokenThreshold: data.injection.token_threshold,
      });
    } catch (error) {
      console.error('获取配置失败:', error);
    }
  };
  
  useEffect(() => {
    fetchConfig();
  }, [activeRole]);
  
  // 计算预留空间
  const calculateReserved = () => {
    const used = editAllocation.systemPrompt + editAllocation.coreContext + 
                 editAllocation.primaryContent + editAllocation.secondaryContent + 
                 editAllocation.d5Memory;
    return Math.max(0, 100 - used);
  };
  
  // 计算各层token数
  const calculateLayerTokens = () => {
    const reserved = calculateReserved();
    return {
      systemPrompt: Math.floor(editBudget * editAllocation.systemPrompt / 100),
      coreContext: Math.floor(editBudget * editAllocation.coreContext / 100),
      primaryContent: Math.floor(editBudget * editAllocation.primaryContent / 100),
      secondaryContent: Math.floor(editBudget * editAllocation.secondaryContent / 100),
      d5Memory: Math.floor(editBudget * editAllocation.d5Memory / 100),
      reserved: Math.floor(editBudget * reserved / 100),
    };
  };
  
  // 保存配置
  const saveConfig = async () => {
    try {
      await fetch(`${API_BASE}/api/b2/workflow/context-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: activeRole,
          total_budget: editBudget,
          system_prompt_pct: editAllocation.systemPrompt,
          core_context_pct: editAllocation.coreContext,
          primary_content_pct: editAllocation.primaryContent,
          secondary_content_pct: editAllocation.secondaryContent,
          d5_memory_pct: editAllocation.d5Memory,
          injection_message_interval: editInjection.messageInterval,
          injection_token_threshold: editInjection.tokenThreshold,
        }),
      });
      setIsEditing(false);
      fetchConfig();
    } catch (error) {
      console.error('保存配置失败:', error);
    }
  };
  
  const reserved = calculateReserved();
  const layerTokens = calculateLayerTokens();
  
  // 获取层级说明
  const getLayerDescription = (layer: string) => {
    if (activeRole === 'executor') {
      switch (layer) {
        case 'primaryContent': return '最近对话';
        case 'secondaryContent': return '日志筛选';
        default: return '';
      }
    } else {
      switch (layer) {
        case 'primaryContent': return '待审代码';
        case 'secondaryContent': return '审计历史';
        default: return '';
      }
    }
  };
  
  return (
    <div className="bg-gray-900/50 rounded-xl border border-gray-700/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">📊 上下文配置</h2>
        
        {/* 角色切换 */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveRole('executor')}
            className={`px-4 py-2 rounded-lg text-sm ${
              activeRole === 'executor' 
                ? 'bg-green-500/30 text-green-300 border border-green-500/50' 
                : 'bg-gray-700/50 text-gray-400'
            }`}
          >
            执行官
          </button>
          <button
            onClick={() => setActiveRole('auditor')}
            className={`px-4 py-2 rounded-lg text-sm ${
              activeRole === 'auditor' 
                ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/50' 
                : 'bg-gray-700/50 text-gray-400'
            }`}
          >
            审计官
          </button>
        </div>
      </div>
      
      {/* 总上下文窗口 */}
      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-2">总上下文窗口 (tokens)</label>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            value={editBudget}
            onChange={e => setEditBudget(parseInt(e.target.value) || 0)}
            disabled={!isEditing}
            className="w-32 px-3 py-2 rounded-lg bg-gray-700/50 border border-gray-600 text-white disabled:opacity-50"
          />
          
          {/* 预设按钮 */}
          {isEditing && (
            <div className="flex gap-1">
              {Object.entries(PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => setEditBudget(preset.budget)}
                  className={`px-2 py-1 rounded text-xs ${
                    editBudget === preset.budget 
                      ? 'bg-blue-500/30 text-blue-300' 
                      : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Token分配 */}
      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-3">Token分配比例</label>
        
        <div className="space-y-4">
          {/* System Prompt */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-300">System Prompt</span>
              <span className="text-gray-400">
                {editAllocation.systemPrompt}% ≈ {layerTokens.systemPrompt.toLocaleString()} tokens
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              value={editAllocation.systemPrompt}
              onChange={e => setEditAllocation({...editAllocation, systemPrompt: parseInt(e.target.value)})}
              disabled={!isEditing}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
            />
          </div>
          
          {/* 核心上下文 */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-300">核心上下文 <span className="text-yellow-400">(必须保留)</span></span>
              <span className="text-gray-400">
                {editAllocation.coreContext}% ≈ {layerTokens.coreContext.toLocaleString()} tokens
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="30"
              value={editAllocation.coreContext}
              onChange={e => setEditAllocation({...editAllocation, coreContext: parseInt(e.target.value)})}
              disabled={!isEditing}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
            />
          </div>
          
          {/* Primary Content */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-300">
                {getLayerDescription('primaryContent') || 'Primary Content'}
              </span>
              <span className="text-gray-400">
                {editAllocation.primaryContent}% ≈ {layerTokens.primaryContent.toLocaleString()} tokens
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="60"
              value={editAllocation.primaryContent}
              onChange={e => setEditAllocation({...editAllocation, primaryContent: parseInt(e.target.value)})}
              disabled={!isEditing}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
            />
          </div>
          
          {/* Secondary Content */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-300">
                {getLayerDescription('secondaryContent') || 'Secondary Content'}
              </span>
              <span className="text-gray-400">
                {editAllocation.secondaryContent}% ≈ {layerTokens.secondaryContent.toLocaleString()} tokens
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="40"
              value={editAllocation.secondaryContent}
              onChange={e => setEditAllocation({...editAllocation, secondaryContent: parseInt(e.target.value)})}
              disabled={!isEditing}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
            />
          </div>
          
          {/* D5 Memory */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-300">D5记忆库</span>
              <span className="text-gray-400">
                {editAllocation.d5Memory}% ≈ {layerTokens.d5Memory.toLocaleString()} tokens
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              value={editAllocation.d5Memory}
              onChange={e => setEditAllocation({...editAllocation, d5Memory: parseInt(e.target.value)})}
              disabled={!isEditing}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
            />
          </div>
          
          {/* 预留空间（自动计算） */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-300">预留空间 <span className="text-gray-500">(自动计算)</span></span>
              <span className={`${reserved < 5 ? 'text-red-400' : 'text-gray-400'}`}>
                {reserved}% ≈ {layerTokens.reserved.toLocaleString()} tokens
              </span>
            </div>
            <div className="w-full h-2 bg-gray-700 rounded-lg overflow-hidden">
              <div 
                className={`h-full ${reserved < 5 ? 'bg-red-500' : 'bg-gray-500'}`}
                style={{ width: `${reserved}%` }}
              />
            </div>
            {reserved < 5 && (
              <p className="text-xs text-red-400 mt-1">⚠️ 预留空间过小，可能影响AI响应</p>
            )}
          </div>
        </div>
      </div>
      
      {/* 可视化分配图 */}
      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-2">分配可视化</label>
        <div className="h-8 rounded-lg overflow-hidden flex">
          <div 
            className="bg-purple-500 flex items-center justify-center text-xs text-white"
            style={{ width: `${editAllocation.systemPrompt}%` }}
            title="System Prompt"
          >
            {editAllocation.systemPrompt > 5 && 'SP'}
          </div>
          <div 
            className="bg-yellow-500 flex items-center justify-center text-xs text-black"
            style={{ width: `${editAllocation.coreContext}%` }}
            title="核心上下文"
          >
            {editAllocation.coreContext > 5 && '核心'}
          </div>
          <div 
            className="bg-green-500 flex items-center justify-center text-xs text-white"
            style={{ width: `${editAllocation.primaryContent}%` }}
            title="Primary Content"
          >
            {editAllocation.primaryContent > 10 && getLayerDescription('primaryContent')}
          </div>
          <div 
            className="bg-blue-500 flex items-center justify-center text-xs text-white"
            style={{ width: `${editAllocation.secondaryContent}%` }}
            title="Secondary Content"
          >
            {editAllocation.secondaryContent > 10 && getLayerDescription('secondaryContent')}
          </div>
          <div 
            className="bg-pink-500 flex items-center justify-center text-xs text-white"
            style={{ width: `${editAllocation.d5Memory}%` }}
            title="D5记忆"
          >
            {editAllocation.d5Memory > 5 && 'D5'}
          </div>
          <div 
            className="bg-gray-600 flex items-center justify-center text-xs text-white"
            style={{ width: `${reserved}%` }}
            title="预留"
          >
            {reserved > 5 && '预留'}
          </div>
        </div>
      </div>
      
      {/* 注入配置 */}
      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-3">核心提示注入配置</label>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">消息间隔（每N条消息注入一次）</label>
            <input
              type="number"
              value={editInjection.messageInterval}
              onChange={e => setEditInjection({...editInjection, messageInterval: parseInt(e.target.value) || 0})}
              disabled={!isEditing}
              className="w-full px-3 py-2 rounded-lg bg-gray-700/50 border border-gray-600 text-white disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Token阈值（每N个token注入一次）</label>
            <input
              type="number"
              value={editInjection.tokenThreshold}
              onChange={e => setEditInjection({...editInjection, tokenThreshold: parseInt(e.target.value) || 0})}
              disabled={!isEditing}
              className="w-full px-3 py-2 rounded-lg bg-gray-700/50 border border-gray-600 text-white disabled:opacity-50"
            />
          </div>
        </div>
      </div>
      
      {/* 操作按钮 */}
      <div className="flex gap-3">
        {isEditing ? (
          <>
            <button
              onClick={saveConfig}
              className="flex-1 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400"
            >
              💾 保存配置
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                fetchConfig(); // 恢复原配置
              }}
              className="flex-1 py-2 rounded-lg bg-gray-500/20 hover:bg-gray-500/30 text-gray-400"
            >
              取消
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="flex-1 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400"
          >
            ✏️ 编辑配置
          </button>
        )}
      </div>
    </div>
  );
}
