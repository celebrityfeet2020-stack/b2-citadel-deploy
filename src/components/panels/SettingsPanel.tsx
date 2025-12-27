'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard, GlassButton, GlassInput } from '../ui/GlassComponents';
import { useSettings } from '@/contexts/SettingsContext';
import { workflowApi } from '@/lib/api';

// Tab类型
type SettingsTab = 'api-key' | 'ai-config' | 'context-config' | 'system-prompt';

// AI配置类型
interface AIConfig {
  providerType: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

// 上下文配置类型 v2.0
interface ContextConfigV2 {
  totalBudget: number;
  reserveRatio: number;
  allocation: {
    recent_conversation: number;
    local_logs: number;
    d5_memory: number;
  };
  vectorSearch: {
    topK: number;
    threshold: number;
  };
  d5Recall: {
    limit: number;
    threshold: number;
  };
}

// System Prompt类型
interface SystemPrompt {
  role: string;
  content: string;
}

// AI配置表单组件
interface AIConfigFormProps {
  title: string;
  config: AIConfig;
  setConfig: (config: AIConfig) => void;
  onSave: () => void;
  onTest: () => void;
  saving: boolean;
  testing: boolean;
  testResult: { success: boolean; message: string } | null;
}

const AIConfigForm: React.FC<AIConfigFormProps> = ({
  title,
  config,
  setConfig,
  onSave,
  onTest,
  saving,
  testing,
  testResult,
}) => {
  const providerOptions = title.includes('执行官') 
    ? [
        { value: 'manus', label: 'Manus API' },
        { value: 'openai', label: 'OpenAI Compatible' },
      ]
    : [
        { value: 'gemini', label: 'Gemini API' },
        { value: 'openai', label: 'OpenAI Compatible' },
      ];

  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-cyan-400">{title}</h3>
        <div className="flex gap-2">
          <GlassButton size="sm" onClick={onTest} disabled={testing}>
            {testing ? '测试中...' : '测试'}
          </GlassButton>
          <GlassButton size="sm" variant="primary" onClick={onSave} disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </GlassButton>
        </div>
      </div>
      
      <p className="text-xs text-gray-400 mb-4">
        配置{title}的API接入信息
      </p>

      {testResult && (
        <div className={`mb-4 p-2 rounded text-sm ${testResult.success ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
          {testResult.message}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">Provider Type</label>
          <select
            value={config.providerType}
            onChange={(e) => setConfig({ ...config, providerType: e.target.value })}
            className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-white"
          >
            {providerOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">Base URL</label>
          <GlassInput
            type="text"
            value={config.baseUrl}
            onChange={(value) => setConfig({ ...config, baseUrl: value })}
            placeholder={config.providerType === 'manus' ? 'https://api.manus.ai/v1' : 'https://generativelanguage.googleapis.com/v1beta'}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">API Key</label>
          <GlassInput
            type="password"
            value={config.apiKey}
            onChange={(value) => setConfig({ ...config, apiKey: value })}
            placeholder={config.providerType === 'manus' ? 'sk-...' : 'AIza...'}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">Model</label>
          <GlassInput
            type="text"
            value={config.model}
            onChange={(value) => setConfig({ ...config, model: value })}
            placeholder={config.providerType === 'manus' ? 'manus-1.6 / manus-1.6-lite / manus-1.6-max' : 'gemini-3-flash / gemini-3-pro'}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Max Tokens</label>
            <GlassInput
              type="text"
              value={String(config.maxTokens)}
              onChange={(value) => setConfig({ ...config, maxTokens: parseInt(value) || 0 })}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Temperature</label>
            <GlassInput
              type="text"
              value={String(config.temperature)}
              onChange={(value) => setConfig({ ...config, temperature: parseFloat(value) || 0 })}
            />
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

// 上下文配置表单组件 v2.0
interface ContextConfigFormV2Props {
  title: string;
  config: ContextConfigV2;
  setConfig: (config: ContextConfigV2) => void;
  onSave: () => void;
  saving: boolean;
}

const ContextConfigFormV2: React.FC<ContextConfigFormV2Props> = ({
  title,
  config,
  setConfig,
  onSave,
  saving,
}) => {
  // 计算动态预算
  const reserveTokens = Math.floor(config.totalBudget * config.reserveRatio);
  const dynamicBudget = config.totalBudget - reserveTokens;
  
  // 计算各层实际Token数
  const recentConvTokens = Math.floor(dynamicBudget * config.allocation.recent_conversation / 100);
  const localLogsTokens = Math.floor(dynamicBudget * config.allocation.local_logs / 100);
  const d5MemoryTokens = Math.floor(dynamicBudget * config.allocation.d5_memory / 100);
  
  // 计算总百分比
  const totalPercent = config.allocation.recent_conversation + config.allocation.local_logs + config.allocation.d5_memory;

  const updateAllocation = (key: keyof typeof config.allocation, value: number) => {
    setConfig({
      ...config,
      allocation: {
        ...config.allocation,
        [key]: value,
      },
    });
  };

  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-cyan-400">{title}</h3>
        <GlassButton size="sm" variant="primary" onClick={onSave} disabled={saving}>
          {saving ? '保存中...' : '保存'}
        </GlassButton>
      </div>
      
      <p className="text-xs text-gray-400 mb-4">
        配置{title}的Token分配（基于Agent7方案）
      </p>

      <div className="space-y-4">
        {/* 总Token预算 */}
        <div>
          <label className="block text-sm text-gray-300 mb-1">总Token预算</label>
          <GlassInput
            type="text"
            value={String(config.totalBudget)}
            onChange={(value) => setConfig({ ...config, totalBudget: parseInt(value) || 0 })}
            placeholder="115000"
          />
          <p className="text-xs text-gray-500 mt-1">
            建议：执行官 32000-64000，审计官 16000-32000
          </p>
        </div>

        {/* 预算分解 */}
        <div className="bg-gray-800/30 rounded p-3 text-sm">
          <div className="flex justify-between text-gray-400">
            <span>预留给AI回复 ({(config.reserveRatio * 100).toFixed(0)}%)</span>
            <span>{reserveTokens.toLocaleString()} tokens</span>
          </div>
          <div className="flex justify-between text-cyan-400 mt-1">
            <span>动态内容预算</span>
            <span>{dynamicBudget.toLocaleString()} tokens</span>
          </div>
        </div>

        {/* 百分比分配 */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm text-gray-300">动态分配</label>
            <span className={`text-sm ${Math.abs(totalPercent - 100) < 0.1 ? 'text-green-400' : 'text-yellow-400'}`}>
              当前: {totalPercent.toFixed(1)}%
            </span>
          </div>

          {/* 最近对话 */}
          <div className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">最近对话（可截断）</span>
              <span className="text-cyan-400">{config.allocation.recent_conversation}% = {recentConvTokens.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="0.5"
              value={config.allocation.recent_conversation}
              onChange={(e) => updateAllocation('recent_conversation', parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* 本地日志 */}
          <div className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">本地日志（向量检索）</span>
              <span className="text-cyan-400">{config.allocation.local_logs}% = {localLogsTokens.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="0.5"
              value={config.allocation.local_logs}
              onChange={(e) => updateAllocation('local_logs', parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* D5记忆 */}
          <div className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">D5记忆库（API调用）</span>
              <span className="text-cyan-400">{config.allocation.d5_memory}% = {d5MemoryTokens.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="0.5"
              value={config.allocation.d5_memory}
              onChange={(e) => updateAllocation('d5_memory', parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        {/* Token分配预览 */}
        <div className="bg-gray-800/30 rounded p-3">
          <p className="text-xs text-gray-400 mb-2">Token分配预览</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="bg-blue-900/50 px-2 py-1 rounded">最近对话: {recentConvTokens.toLocaleString()}</span>
            <span className="bg-purple-900/50 px-2 py-1 rounded">本地日志: {localLogsTokens.toLocaleString()}</span>
            <span className="bg-green-900/50 px-2 py-1 rounded">D5记忆: {d5MemoryTokens.toLocaleString()}</span>
          </div>
        </div>

        {/* 高级设置 */}
        <details className="text-sm">
          <summary className="text-gray-400 cursor-pointer hover:text-gray-300">高级设置</summary>
          <div className="mt-3 space-y-3 pl-2 border-l border-gray-700">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">向量检索 Top-K</label>
                <GlassInput
                  type="text"
                  value={String(config.vectorSearch.topK)}
                  onChange={(value) => setConfig({
                    ...config,
                    vectorSearch: { ...config.vectorSearch, topK: parseInt(value) || 10 }
                  })}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">向量检索阈值</label>
                <GlassInput
                  type="text"
                  value={String(config.vectorSearch.threshold)}
                  onChange={(value) => setConfig({
                    ...config,
                    vectorSearch: { ...config.vectorSearch, threshold: parseFloat(value) || 0.5 }
                  })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">D5检索数量</label>
                <GlassInput
                  type="text"
                  value={String(config.d5Recall.limit)}
                  onChange={(value) => setConfig({
                    ...config,
                    d5Recall: { ...config.d5Recall, limit: parseInt(value) || 5 }
                  })}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">D5检索阈值</label>
                <GlassInput
                  type="text"
                  value={String(config.d5Recall.threshold)}
                  onChange={(value) => setConfig({
                    ...config,
                    d5Recall: { ...config.d5Recall, threshold: parseFloat(value) || 0.7 }
                  })}
                />
              </div>
            </div>
          </div>
        </details>
      </div>
    </GlassCard>
  );
};

// 主组件
export function SettingsPanel() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('api-key');
  
  // System Prompt状态
  const [prompts, setPrompts] = useState<SystemPrompt[]>([]);
  const [selectedPromptRole, setSelectedPromptRole] = useState<string>('executor');
  const [promptLoading, setPromptLoading] = useState(false);

  // AI配置状态（统一Max Tokens为12800，基于128K上下文窗口）
  const [executorConfig, setExecutorConfig] = useState<AIConfig>({
    providerType: 'manus',
    baseUrl: 'https://api.manus.ai/v1',
    apiKey: '',
    model: 'manus-1.6',
    maxTokens: 12800,
    temperature: 0.7,
  });
  const [auditorConfig, setAuditorConfig] = useState<AIConfig>({
    providerType: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    apiKey: '',
    model: 'gemini-3-flash',
    maxTokens: 12800,
    temperature: 0.3,
  });
  const [executorSaving, setExecutorSaving] = useState(false);
  const [auditorSaving, setAuditorSaving] = useState(false);
  const [executorTesting, setExecutorTesting] = useState(false);
  const [auditorTesting, setAuditorTesting] = useState(false);
  const [executorTestResult, setExecutorTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [auditorTestResult, setAuditorTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // 上下文配置状态 v2.0
  const [executorContextConfig, setExecutorContextConfig] = useState<ContextConfigV2>({
    totalBudget: 115000,
    reserveRatio: 0.10,
    allocation: {
      recent_conversation: 65,
      local_logs: 12.5,
      d5_memory: 22.5,
    },
    vectorSearch: { topK: 20, threshold: 0.5 },
    d5Recall: { limit: 10, threshold: 0.7 },
  });
  const [auditorContextConfig, setAuditorContextConfig] = useState<ContextConfigV2>({
    totalBudget: 115000,
    reserveRatio: 0.10,
    allocation: {
      recent_conversation: 55,
      local_logs: 20,
      d5_memory: 25,
    },
    vectorSearch: { topK: 20, threshold: 0.5 },
    d5Recall: { limit: 10, threshold: 0.7 },
  });
  const [contextSaving, setContextSaving] = useState(false);

  const {
    commanderApiUrl,
    commanderApiKey,
    setCommanderApiUrl,
    setCommanderApiKey,
  } = useSettings();

  // 保存执行官AI配置
  const saveExecutorConfig = async () => {
    setExecutorSaving(true);
    try {
      await workflowApi.updateAIConfig({
        role: 'executor',
        provider_type: executorConfig.providerType,
        api_key: executorConfig.apiKey,
        base_url: executorConfig.baseUrl,
        model: executorConfig.model,
        max_tokens: executorConfig.maxTokens,
        temperature: executorConfig.temperature,
      });
      alert('执行官配置已保存');
    } catch (error) {
      alert('保存失败: ' + error);
    }
    setExecutorSaving(false);
  };

  // 保存审计官AI配置
  const saveAuditorConfig = async () => {
    setAuditorSaving(true);
    try {
      await workflowApi.updateAIConfig({
        role: 'auditor',
        provider_type: auditorConfig.providerType,
        api_key: auditorConfig.apiKey,
        base_url: auditorConfig.baseUrl,
        model: auditorConfig.model,
        max_tokens: auditorConfig.maxTokens,
        temperature: auditorConfig.temperature,
      });
      alert('审计官配置已保存');
    } catch (error) {
      alert('保存失败: ' + error);
    }
    setAuditorSaving(false);
  };

  // 测试执行官连接
  const testExecutorConnection = async () => {
    setExecutorTesting(true);
    setExecutorTestResult(null);
    try {
      const result = await workflowApi.testAIConnection('executor');
      setExecutorTestResult(result);
    } catch (error) {
      setExecutorTestResult({ success: false, message: String(error) });
    }
    setExecutorTesting(false);
  };

  // 测试审计官连接
  const testAuditorConnection = async () => {
    setAuditorTesting(true);
    setAuditorTestResult(null);
    try {
      const result = await workflowApi.testAIConnection('auditor');
      setAuditorTestResult(result);
    } catch (error) {
      setAuditorTestResult({ success: false, message: String(error) });
    }
    setAuditorTesting(false);
  };

  // 保存上下文配置
  const saveContextConfig = async (role: 'executor' | 'auditor') => {
    setContextSaving(true);
    const config = role === 'executor' ? executorContextConfig : auditorContextConfig;
    try {
      await workflowApi.updateContextConfig({
        role,
        total_budget: config.totalBudget,
        allocation: config.allocation,
        vector_search: {
          top_k: config.vectorSearch.topK,
          threshold: config.vectorSearch.threshold,
        },
        d5_recall: {
          limit: config.d5Recall.limit,
          threshold: config.d5Recall.threshold,
        },
      });
      alert(`${role === 'executor' ? '执行官' : '审计官'}上下文配置已保存`);
    } catch (error) {
      alert('保存失败: ' + error);
    }
    setContextSaving(false);
  };

  const tabs = [
    { id: 'api-key' as SettingsTab, label: 'API密钥', icon: '🔑' },
    { id: 'ai-config' as SettingsTab, label: 'AI配置', icon: '🤖' },
    { id: 'context-config' as SettingsTab, label: '上下文配置', icon: '⚡' },
    { id: 'system-prompt' as SettingsTab, label: 'System Prompt', icon: '📝' },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span>⚙️</span>
          <span>设置</span>
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          管理API密钥、AI配置、上下文配置和System Prompt
        </p>
      </div>

      {/* Tab导航 */}
      <div className="flex border-b border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-400/10'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab内容 */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* API密钥 Tab */}
        {activeTab === 'api-key' && (
          <GlassCard className="p-4">
            <h3 className="text-lg font-semibold text-cyan-400 mb-4 flex items-center gap-2">
              <span>👑</span>
              AI代理指挥官 API
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              用于外部AI（如Manus）接入B2平台
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">API URL</label>
                <div className="flex gap-2">
                  <GlassInput
                    type="text"
                    value={commanderApiUrl}
                    onChange={(value) => setCommanderApiUrl(value)}
                    className="flex-1"
                  />
                  <GlassButton size="sm" onClick={() => navigator.clipboard.writeText(commanderApiUrl)}>
                    📋
                  </GlassButton>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">API Key</label>
                <div className="flex gap-2">
                  <GlassInput
                    type="text"
                    value={commanderApiKey}
                    onChange={(value) => setCommanderApiKey(value)}
                    className="flex-1"
                  />
                  <GlassButton size="sm" onClick={() => navigator.clipboard.writeText(commanderApiKey)}>
                    📋
                  </GlassButton>
                  <GlassButton size="sm" onClick={() => setCommanderApiKey(`b2-commander-${Math.random().toString(36).slice(2, 12)}`)}>
                    🔄
                  </GlassButton>
                </div>
              </div>

              <div className="bg-blue-900/20 border border-blue-700/50 rounded p-3 mt-4">
                <h4 className="text-sm font-medium text-blue-400 mb-2">使用说明</h4>
                <p className="text-xs text-gray-400">
                  在请求Header中添加 <code className="bg-gray-800 px-1 rounded">X-API-Key: {commanderApiKey}</code> 进行认证。
                  AI代理指挥官可以通过此API代替人类用户向执行官和审计官发送指令。
                </p>
              </div>
            </div>
          </GlassCard>
        )}

        {/* AI配置 Tab */}
        {activeTab === 'ai-config' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AIConfigForm
              title="🚀 执行官配置"
              config={executorConfig}
              setConfig={setExecutorConfig}
              onSave={saveExecutorConfig}
              onTest={testExecutorConnection}
              saving={executorSaving}
              testing={executorTesting}
              testResult={executorTestResult}
            />
            <AIConfigForm
              title="🔍 审计官配置"
              config={auditorConfig}
              setConfig={setAuditorConfig}
              onSave={saveAuditorConfig}
              onTest={testAuditorConnection}
              saving={auditorSaving}
              testing={auditorTesting}
              testResult={auditorTestResult}
            />
          </div>
        )}

        {/* 上下文配置 Tab v2.0 */}
        {activeTab === 'context-config' && (
          <div className="space-y-4">
            <div className="bg-blue-900/20 border border-blue-700/50 rounded p-3 mb-4">
              <h4 className="text-sm font-medium text-blue-400 mb-2">上下文管理 v2.0</h4>
              <p className="text-xs text-gray-400">
                基于Agent7方案设计。固定部分（System Prompt、核心上下文）按实际长度计算，
                动态部分（最近对话、本地日志、D5记忆）按比例分配。最近对话可截断，本地日志使用向量检索。
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ContextConfigFormV2
                title="🚀 执行官上下文"
                config={executorContextConfig}
                setConfig={setExecutorContextConfig}
                onSave={() => saveContextConfig('executor')}
                saving={contextSaving}
              />
              <ContextConfigFormV2
                title="🔍 审计官上下文"
                config={auditorContextConfig}
                setConfig={setAuditorContextConfig}
                onSave={() => saveContextConfig('auditor')}
                saving={contextSaving}
              />
            </div>
          </div>
        )}

        {/* System Prompt Tab */}
        {activeTab === 'system-prompt' && (
          <GlassCard className="p-4">
            <h3 className="text-lg font-semibold text-cyan-400 mb-4">System Prompt 管理</h3>
            <p className="text-sm text-gray-400 mb-4">
              配置执行官和审计官的角色提示词
            </p>
            
            <div className="flex gap-2 mb-4">
              <GlassButton
                size="sm"
                variant={selectedPromptRole === 'executor' ? 'primary' : 'default'}
                onClick={() => setSelectedPromptRole('executor')}
              >
                执行官
              </GlassButton>
              <GlassButton
                size="sm"
                variant={selectedPromptRole === 'auditor' ? 'primary' : 'default'}
                onClick={() => setSelectedPromptRole('auditor')}
              >
                审计官
              </GlassButton>
            </div>

            <textarea
              className="w-full h-64 bg-gray-800/50 border border-gray-600 rounded p-3 text-white text-sm font-mono"
              placeholder={`输入${selectedPromptRole === 'executor' ? '执行官' : '审计官'}的System Prompt...`}
            />

            <div className="flex justify-end mt-4">
              <GlassButton variant="primary">
                保存 Prompt
              </GlassButton>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
