/**
 * B2 API 客户端
 * 与B2后端服务通信
 */

const API_BASE = process.env.NEXT_PUBLIC_B2_API_URL || '/api/b2';
const API_KEY = process.env.NEXT_PUBLIC_B2_API_KEY || 'b2-secret-key-2025-xyz';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

// ============== Gateway API ==============

export interface AIAdapter {
  name: string;
  role: 'executor' | 'auditor' | 'commander';
  provider: string;
  model: string;
  enabled: boolean;
  priority: number;
  total_requests: number;
  total_tokens: number;
  failed_requests: number;
  amnesia_score: number;
  last_used: string | null;
}

export interface AmnesiaStatus {
  clarity_score: number;
  amnesia_level: string;
  is_amnesia: boolean;
  metrics: {
    repetition_rate: number;
    consistency_score: number;
    audit_pass_rate: number;
    token_efficiency: number;
    response_speed_score: number;
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  role?: 'executor' | 'auditor' | 'commander';
  adapter_name?: string;
  stream?: boolean;
  max_tokens?: number;
  temperature?: number;
}

export interface ChatResponse {
  content: string;
  model: string;
  finish_reason: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export const gatewayApi = {
  // 获取网关状态
  getStatus: () => request<{ adapters: Record<string, AIAdapter>; amnesia_detection: Record<string, AmnesiaStatus> }>('/gateway/status'),

  // 健康检查
  health: () => request<{ status: string; adapters_count: number; enabled_adapters: number }>('/gateway/health'),

  // 添加AI适配器
  addAdapter: (config: {
    name: string;
    role: string;
    provider_type: string;
    base_url: string;
    api_key: string;
    model: string;
    max_tokens?: number;
    temperature?: number;
    priority?: number;
  }) => request<{ status: string; name: string; role: string }>('/gateway/adapters', { method: 'POST', body: config }),

  // 禁用AI适配器
  disableAdapter: (name: string) => request<{ status: string; name: string }>(`/gateway/adapters/${name}`, { method: 'DELETE' }),

  // 启用AI适配器
  enableAdapter: (name: string) => request<{ status: string; name: string }>(`/gateway/adapters/${name}/enable`, { method: 'POST' }),

  // 聊天（非流式）
  chat: (req: ChatRequest) => request<ChatResponse>('/gateway/chat', { method: 'POST', body: req }),

  // 获取失忆检测状态
  getAmnesiaStatus: () => request<Record<string, AmnesiaStatus>>('/gateway/amnesia/status'),

  // 获取指定AI的失忆状态
  getAIAmnesiaStatus: (aiName: string) => request<AmnesiaStatus & { ai_name: string }>(`/gateway/amnesia/${aiName}`),

  // 重置失忆检测
  resetAmnesia: (aiName: string) => request<{ status: string; ai_name: string; message: string }>(`/gateway/amnesia/${aiName}/reset`, { method: 'POST' }),
};

// ============== Tasks API ==============

export interface Task {
  id: string;
  project_id: string;
  task_type: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  executor_output?: string;
  auditor_output?: string;
  human_review_status?: string;
  human_review_comment?: string;
  defense_results: Array<{
    defense_name: string;
    passed: boolean;
    message: string;
    timestamp: string;
  }>;
  messages: ChatMessage[];
}

export interface CreateTaskRequest {
  project_id: string;
  task_type: string;
  description: string;
  module_id?: string;
  context?: Record<string, any>;
}

export const tasksApi = {
  // 创建任务
  create: (req: CreateTaskRequest) => request<Task>('/tasks', { method: 'POST', body: req }),

  // 获取任务
  get: (taskId: string) => request<Task>(`/tasks/${taskId}`),

  // 列出项目任务
  list: (projectId: string, status?: string) => {
    const params = new URLSearchParams({ project_id: projectId });
    if (status) params.append('status', status);
    return request<{ project_id: string; tasks: Task[]; count: number }>(`/tasks?${params}`);
  },

  // 运行任务
  run: (taskId: string) => request<Task>(`/tasks/${taskId}/run`, { method: 'POST' }),

  // 更新任务上下文
  updateContext: (taskId: string, contextUpdates: Record<string, any>) =>
    request<Task>(`/tasks/${taskId}/context`, { method: 'PUT', body: { context_updates: contextUpdates } }),

  // 设置执行官产出
  setExecutorOutput: (taskId: string, output: string) =>
    request<Task>(`/tasks/${taskId}/executor-output`, { method: 'PUT', body: { output } }),

  // 设置审计官产出
  setAuditorOutput: (taskId: string, output: string) =>
    request<Task>(`/tasks/${taskId}/auditor-output`, { method: 'PUT', body: { output } }),

  // 人工审查
  humanReview: (taskId: string, approved: boolean, comment?: string) =>
    request<Task>(`/tasks/${taskId}/human-review`, { method: 'POST', body: { approved, comment } }),

  // 添加消息
  addMessage: (taskId: string, role: string, content: string, metadata?: Record<string, any>) =>
    request<{ task_id: string; message_count: number }>(`/tasks/${taskId}/messages`, {
      method: 'POST',
      body: { role, content, metadata },
    }),

  // 获取消息
  getMessages: (taskId: string) => request<{ task_id: string; messages: ChatMessage[]; count: number }>(`/tasks/${taskId}/messages`),

  // 获取防线检查结果
  getDefenseResults: (taskId: string) =>
    request<{ task_id: string; defense_results: Task['defense_results']; count: number }>(`/tasks/${taskId}/defense-results`),

  // 健康检查
  health: () => request<{ status: string; total_tasks: number; total_projects: number }>('/tasks/health'),
};

// ============== Memory API ==============

export interface MemorySearchResult {
  id: string;
  content: string;
  summary?: string;
  memory_type: string;
  importance: number;
  relevance_score: number;
  tags: string[];
  created_at: string;
}

export const memoryApi = {
  // 搜索记忆
  search: (query: string, options?: { search_type?: string; top_k?: number; min_relevance?: number }) =>
    request<{ results: MemorySearchResult[]; count: number }>('/memory/search', {
      method: 'POST',
      body: { query, ...options },
    }),

  // 获取单条记忆
  get: (memoryId: string) => request<MemorySearchResult>(`/memory/${memoryId}`),

  // 构建上下文
  buildContext: (options: { project_id?: string; module_id?: string; task_description?: string; max_tokens?: number }) =>
    request<any>('/memory/context/build', { method: 'POST', body: options }),

  // 获取项目上下文
  getProjectContext: (projectId: string) => request<{ project_id: string; context: string }>(`/memory/context/project/${projectId}`),

  // 获取统计信息
  getStats: () => request<any>('/memory/stats'),

  // 健康检查
  health: () => request<{ d5_available: boolean; status: string }>('/memory/health'),
};

// ============== 流式聊天 ==============

export async function* streamChat(req: ChatRequest): AsyncGenerator<string, void, unknown> {
  const response = await fetch(`${API_BASE}/gateway/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
    },
    body: JSON.stringify({ ...req, stream: true }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') return;
        try {
          const parsed = JSON.parse(data);
          if (parsed.content) {
            yield parsed.content;
          }
        } catch {
          // 忽略解析错误
        }
      }
    }
  }
}
// ============== 新增：带角色前缀的流式聊天 ==============

export interface ChatRequestWithRole {
  messages: ChatMessage[];
  role: 'executor' | 'auditor';
  senderRole: 'human' | 'commander' | 'system';
  stream?: boolean;
  model?: string;
  max_tokens?: number;
  temperature?: number;
}

/**
 * 带角色前缀的流式聊天
 * 消息会自动添加角色前缀（Human users: / AI Commander: / B2 system:）
 */
export async function* streamChatWithRole(req: ChatRequestWithRole): AsyncGenerator<string, void, unknown> {
  // 角色前缀映射
  const prefixMap: Record<string, string> = {
    human: 'Human users: ',
    commander: 'AI Commander: ',
    system: 'B2 system: ',
  };

  // 处理消息，添加前缀（如果还没有）
  const processedMessages = req.messages.map((m) => {
    if (m.role === 'assistant') {
      // AI的回复不加前缀
      return m;
    }
    // 检查是否已经有前缀
    const hasPrefix = Object.values(prefixMap).some((p) => m.content.startsWith(p));
    if (hasPrefix) {
      return m;
    }
    // 添加前缀
    return {
      ...m,
      content: prefixMap[req.senderRole] + m.content,
    };
  });

  const response = await fetch(`${API_BASE}/gateway/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
    },
    body: JSON.stringify({
      messages: processedMessages,
      role: req.role,
      stream: req.stream ?? true,
      model: req.model,
      max_tokens: req.max_tokens,
      temperature: req.temperature,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') return;
        try {
          const parsed = JSON.parse(data);
          if (parsed.content) {
            yield parsed.content;
          }
        } catch {
          // 忽略解析错误
        }
      }
    }
  }
}

// ============== 新增：Commander API ==============

export interface CommanderSession {
  session_id: string;
  api_key: string;
  created_at: string;
  expires_at: string;
  permissions: string[];
}

export interface CommanderCommand {
  session_id: string;
  target: 'executor' | 'auditor';
  message: string;
  priority?: 'low' | 'normal' | 'high';
}

export const commanderApi = {
  // 验证API Key
  auth: (apiKey: string) =>
    request<{ valid: boolean; session: CommanderSession | null }>('/commander/auth', {
      method: 'POST',
      body: { api_key: apiKey },
    }),

  // 发送指挥指令
  sendCommand: (command: CommanderCommand) =>
    request<{ message_id: string; status: string }>('/commander/command', {
      method: 'POST',
      body: command,
    }),

  // 获取活跃会话
  getActiveSessions: () =>
    request<{ sessions: CommanderSession[] }>('/commander/sessions/active'),

  // 关闭会话
  closeSession: (sessionId: string) =>
    request<{ status: string }>(`/commander/sessions/${sessionId}`, {
      method: 'DELETE',
    }),

  // 健康检查
  health: () => request<{ status: string }>('/commander/health'),
};

// ============== 新增：Prompts API ==============

export interface SystemPrompt {
  id: string;
  role: 'executor' | 'auditor' | 'commander';
  content: string;
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const promptsApi = {
  // 获取所有提示词
  list: () => request<SystemPrompt[]>('/prompts/'),

  // 获取指定角色的提示词
  getByRole: (role: string) => request<SystemPrompt>(`/prompts/${role}`),

  // 更新提示词
  update: (promptId: string, content: string) =>
    request<SystemPrompt>(`/prompts/${promptId}`, {
      method: 'PUT',
      body: { content },
    }),

  // 创建提示词
  create: (role: string, content: string) =>
    request<SystemPrompt>('/prompts/', {
      method: 'POST',
      body: { role, content },
    }),

  // 健康检查
  health: () => request<{ status: string }>('/prompts/health'),
};

// ============== 新增：Scribe日志API ==============

export interface LogEntry {
  id: string;
  project_id: string;
  module_id?: string;
  log_type: 'CHAT' | 'CODE' | 'ERROR' | 'TRACE' | 'MEMORY_DIRECT';
  content: string;
  metadata?: Record<string, any>;
  status: 'PENDING' | 'PULLED' | 'CONFIRMED' | 'DESTROYED';
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  tech_stack?: string[];
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  status: string;
  dod_checklist?: string[];
  created_at: string;
  updated_at: string;
}

export const scribeApi = {
  // 日志相关
  getLogs: (options?: { project_id?: string; log_type?: string; limit?: number; offset?: number }) => {
    const params = new URLSearchParams();
    if (options?.project_id) params.append('project_id', options.project_id);
    if (options?.log_type) params.append('log_type', options.log_type);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    return request<{ logs: LogEntry[]; total: number }>(`/scribe/logs/?${params}`);
  },

  createLog: (log: Omit<LogEntry, 'id' | 'status' | 'created_at'>) =>
    request<LogEntry>('/scribe/logs/', { method: 'POST', body: log }),

  getLogStats: () => request<{ total: number; by_type: Record<string, number>; by_status: Record<string, number> }>('/scribe/logs/stats'),

  // 项目相关
  getProjects: () => request<Project[]>('/scribe/projects/'),

  createProject: (project: { name: string; description?: string; tech_stack?: string[] }) =>
    request<Project>('/scribe/projects/', { method: 'POST', body: project }),

  getProject: (projectId: string) => request<Project>(`/scribe/projects/${projectId}`),

  // 模块相关
  getModules: (projectId: string) => request<Module[]>(`/scribe/modules/project/${projectId}`),

  createModule: (module: { project_id: string; name: string; description?: string; dod_checklist?: string[] }) =>
    request<Module>('/scribe/modules/', { method: 'POST', body: module }),

  // 聊天会话相关
  getChatSessions: () => request<any[]>('/scribe/chat/sessions'),

  getChatHistory: (sessionId: string) =>
    request<{ messages: ChatMessage[] }>(`/scribe/chat/sessions/${sessionId}/history`),

  saveChatMessage: (message: { session_id: string; role: string; content: string; ai_role?: string }) =>
    request<any>('/scribe/chat/messages', { method: 'POST', body: message }),
};


// ============== Workflow API ==============
// 执行官三阶段工作流API

export interface WorkflowSession {
  session_id: string;
  project_id: string;
  phase: 'requirement' | 'execution' | 'summary';
  created_at: string;
  updated_at: string;
  messages: WorkflowMessage[];
  core_context?: {
    task_target: string;
    ssh_command: string;
    work_dir: string;
    custom_hints: string[];
  };
}

export interface WorkflowMessage {
  id: string;
  role: 'human' | 'executor' | 'commander' | 'system';
  content: string;
  timestamp: string;
  phase: string;
}

export interface WorkflowResponse {
  success: boolean;
  session?: WorkflowSession;
  message?: WorkflowMessage;
  error?: string;
}

export const workflowApi = {
  // 创建新会话
  createSession: (projectId: string) =>
    request<WorkflowResponse>('/workflow/sessions', {
      method: 'POST',
      body: { project_id: projectId },
    }),

  // 获取会话状态
  getSession: (sessionId: string) =>
    request<WorkflowSession>(`/workflow/sessions/${sessionId}`),

  // 发送消息
  sendMessage: (sessionId: string, content: string, role: string = 'human') =>
    request<WorkflowResponse>(`/workflow/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: { content, role },
    }),

  // 确认需求（进入执行阶段）
  confirmRequirement: (sessionId: string) =>
    request<WorkflowResponse>(`/workflow/sessions/${sessionId}/confirm-requirement`, {
      method: 'POST',
    }),

  // 完成执行（进入总结阶段）
  completeExecution: (sessionId: string) =>
    request<WorkflowResponse>(`/workflow/sessions/${sessionId}/complete-execution`, {
      method: 'POST',
    }),

  // 更新核心上下文
  updateCoreContext: (sessionId: string, context: {
    task_target?: string;
    ssh_command?: string;
    work_dir?: string;
    custom_hints?: string[];
  }) =>
    request<WorkflowResponse>(`/workflow/sessions/${sessionId}/core-context`, {
      method: 'PUT',
      body: context,
    }),

  // 获取会话健康状态
  getSessionHealth: (sessionId: string) =>
    request<{
      token_usage: number;
      max_tokens: number;
      health_percentage: number;
      recommendation: string;
    }>(`/workflow/sessions/${sessionId}/health`),

  // 压缩历史
  compressHistory: (sessionId: string) =>
    request<WorkflowResponse>(`/workflow/sessions/${sessionId}/compress`, {
      method: 'POST',
    }),

  // 创建检查点
  createCheckpoint: (sessionId: string, name: string) =>
    request<WorkflowResponse>(`/workflow/sessions/${sessionId}/checkpoint`, {
      method: 'POST',
      body: { name },
    }),

  // 清空历史
  clearHistory: (sessionId: string) =>
    request<WorkflowResponse>(`/workflow/sessions/${sessionId}/clear`, {
      method: 'POST',
    }),

  // ==================== AI配置 API ====================

  // 获取所有AI配置
  getAIConfigs: () =>
    request<Record<string, {
      provider_type: string;
      base_url: string;
      model: string;
      max_tokens: number;
      temperature: number;
      enabled: boolean;
      api_key_masked: string;
    }>>('/workflow/ai/config'),

  // 更新AI配置
  updateAIConfig: (config: {
    role: 'executor' | 'auditor';
    provider_type: string;
    api_key: string;
    base_url: string;
    model: string;
    max_tokens: number;
    temperature: number;
  }) =>
    request<{ success: boolean; message: string }>('/workflow/ai/config', {
      method: 'POST',
      body: config,
    }),

  // 测试AI连接
  testAIConnection: (role: 'executor' | 'auditor') =>
    request<{ success: boolean; message: string }>(`/workflow/ai/test/${role}`, {
      method: 'POST',
    }),

  // ==================== 上下文配置 API ====================

  // 获取上下文配置
  getContextConfig: () =>
    request<Record<string, {
      total_budget: number;
      allocation: Record<string, number>;
    }>>('/workflow/context/config'),

  // 更新上下文配置 v2.0
  updateContextConfig: (config: {
    role: 'executor' | 'auditor';
    total_budget: number;
    allocation: Record<string, number>;
    vector_search?: {
      top_k: number;
      threshold: number;
    };
    d5_recall?: {
      limit: number;
      threshold: number;
    };
  }) =>
    request<{ success: boolean }>('/workflow/context/config', {
      method: 'POST',
      body: config,
    }),

  // ==================== D5集成 API ====================

  // 获取D5配置
  getD5Config: () =>
    request<{
      base_url: string;
      enabled: boolean;
      api_key_masked: string;
      pull_timeout_hours: number;
    }>('/workflow/d5/config'),

  // 更新D5配置
  updateD5Config: (config: {
    base_url: string;
    api_key: string;
    enabled: boolean;
  }) =>
    request<{ status: string; message: string }>('/workflow/d5/config', {
      method: 'POST',
      body: config,
    }),

  // 测试D5连接
  testD5Connection: () =>
    request<{ success: boolean; message: string }>('/workflow/d5/test', {
      method: 'POST',
    }),

  // 获取日志统计
  getLogsStats: () =>
    request<{
      total: number;
      pending: number;
      pulled: number;
      archived: number;
    }>('/workflow/d5/logs/stats'),

  // 从D5搜索记忆
  searchD5Memory: (query: string, limit?: number, minScore?: number) =>
    request<{ memories: Array<{ content: string; score: number; type: string }> }>(
      '/workflow/d5/memory/search',
      {
        method: 'POST',
        body: { query, limit: limit || 5, min_score: minScore || 0.7 },
      }
    ),

  // ==================== 检查点管理 API ====================

  // 列出检查点
  listCheckpoints: (sessionId: string) =>
    request<Array<{
      id: string;
      name: string;
      created_at: string;
      messages_count: number;
    }>>(`/workflow/sessions/${sessionId}/checkpoints`),

  // 恢复检查点
  restoreCheckpoint: (sessionId: string, checkpointId: string) =>
    request<{ status: string; message: string }>(
      `/workflow/sessions/${sessionId}/checkpoint/${checkpointId}/restore`,
      { method: 'POST' }
    ),
};
