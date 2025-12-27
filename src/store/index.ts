import { create } from 'zustand';
import { AIAdapter, AmnesiaStatus, Task, ChatMessage } from '@/lib/api';

// ============== AI状态 ==============
interface AIState {
  adapters: Record<string, AIAdapter>;
  amnesiaStatus: Record<string, AmnesiaStatus>;
  isLoading: boolean;
  error: string | null;
  setAdapters: (adapters: Record<string, AIAdapter>) => void;
  setAmnesiaStatus: (status: Record<string, AmnesiaStatus>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAIStore = create<AIState>((set) => ({
  adapters: {},
  amnesiaStatus: {},
  isLoading: false,
  error: null,
  setAdapters: (adapters) => set({ adapters }),
  setAmnesiaStatus: (amnesiaStatus) => set({ amnesiaStatus }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));

// ============== 双屏聊天状态 (新增) ==============
type MessageSource = 'human' | 'commander' | 'system' | 'executor' | 'auditor';

interface DualChatMessage {
  id: string;
  source: MessageSource;
  content: string;
  rawContent?: string;
  timestamp: Date;
  isStreaming?: boolean;
  metadata?: {
    defenseType?: string;
    defensePassed?: boolean;
    tokenCount?: number;
  };
}

interface DualChatState {
  // 执行官聊天
  executorMessages: DualChatMessage[];
  executorLoading: boolean;
  // 审计官聊天
  auditorMessages: DualChatMessage[];
  auditorLoading: boolean;
  // 执行官操作
  addExecutorMessage: (message: Omit<DualChatMessage, 'id' | 'timestamp'>) => string;
  updateExecutorMessage: (id: string, content: string) => void;
  setExecutorMessageStreaming: (id: string, isStreaming: boolean) => void;
  clearExecutorMessages: () => void;
  setExecutorLoading: (loading: boolean) => void;
  // 审计官操作
  addAuditorMessage: (message: Omit<DualChatMessage, 'id' | 'timestamp'>) => string;
  updateAuditorMessage: (id: string, content: string) => void;
  setAuditorMessageStreaming: (id: string, isStreaming: boolean) => void;
  clearAuditorMessages: () => void;
  setAuditorLoading: (loading: boolean) => void;
  // 系统消息（同时添加到两个聊天室）
  addSystemMessage: (content: string, metadata?: DualChatMessage['metadata']) => void;
}

export const useDualChatStore = create<DualChatState>((set, get) => ({
  executorMessages: [],
  executorLoading: false,
  auditorMessages: [],
  auditorLoading: false,

  // 执行官操作
  addExecutorMessage: (message) => {
    const id = Math.random().toString(36).substring(2, 15);
    set((state) => ({
      executorMessages: [
        ...state.executorMessages,
        { ...message, id, timestamp: new Date() },
      ],
    }));
    return id;
  },
  updateExecutorMessage: (id, content) => {
    set((state) => ({
      executorMessages: state.executorMessages.map((m) =>
        m.id === id ? { ...m, content } : m
      ),
    }));
  },
  setExecutorMessageStreaming: (id, isStreaming) => {
    set((state) => ({
      executorMessages: state.executorMessages.map((m) =>
        m.id === id ? { ...m, isStreaming } : m
      ),
    }));
  },
  clearExecutorMessages: () => set({ executorMessages: [] }),
  setExecutorLoading: (executorLoading) => set({ executorLoading }),

  // 审计官操作
  addAuditorMessage: (message) => {
    const id = Math.random().toString(36).substring(2, 15);
    set((state) => ({
      auditorMessages: [
        ...state.auditorMessages,
        { ...message, id, timestamp: new Date() },
      ],
    }));
    return id;
  },
  updateAuditorMessage: (id, content) => {
    set((state) => ({
      auditorMessages: state.auditorMessages.map((m) =>
        m.id === id ? { ...m, content } : m
      ),
    }));
  },
  setAuditorMessageStreaming: (id, isStreaming) => {
    set((state) => ({
      auditorMessages: state.auditorMessages.map((m) =>
        m.id === id ? { ...m, isStreaming } : m
      ),
    }));
  },
  clearAuditorMessages: () => set({ auditorMessages: [] }),
  setAuditorLoading: (auditorLoading) => set({ auditorLoading }),

  // 系统消息（同时添加到两个聊天室）
  addSystemMessage: (content, metadata) => {
    const baseMessage = {
      source: 'system' as MessageSource,
      content,
      rawContent: `B2 system: ${content}`,
      metadata,
    };
    get().addExecutorMessage(baseMessage);
    get().addAuditorMessage(baseMessage);
  },
}));

// ============== 旧版聊天状态 (保留兼容) ==============
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  currentRole: 'executor' | 'auditor' | 'commander';
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => string;
  updateMessage: (id: string, content: string) => void;
  setMessageStreaming: (id: string, isStreaming: boolean) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
  setCurrentRole: (role: 'executor' | 'auditor' | 'commander') => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  currentRole: 'executor',
  addMessage: (message) => {
    const id = Math.random().toString(36).substring(2, 15);
    set((state) => ({
      messages: [
        ...state.messages,
        { ...message, id, timestamp: new Date() },
      ],
    }));
    return id;
  },
  updateMessage: (id, content) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, content } : m
      ),
    }));
  },
  setMessageStreaming: (id, isStreaming) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, isStreaming } : m
      ),
    }));
  },
  clearMessages: () => set({ messages: [] }),
  setLoading: (isLoading) => set({ isLoading }),
  setCurrentRole: (currentRole) => set({ currentRole }),
}));

// ============== 任务状态 ==============
interface TaskState {
  tasks: Task[];
  currentTask: Task | null;
  currentProjectId: string;
  isLoading: boolean;
  error: string | null;
  setTasks: (tasks: Task[]) => void;
  setCurrentTask: (task: Task | null) => void;
  setCurrentProjectId: (projectId: string) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  currentTask: null,
  currentProjectId: 'default',
  isLoading: false,
  error: null,
  setTasks: (tasks) => set({ tasks }),
  setCurrentTask: (currentTask) => set({ currentTask }),
  setCurrentProjectId: (currentProjectId) => set({ currentProjectId }),
  addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] })),
  updateTask: (taskId, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
      currentTask:
        state.currentTask?.id === taskId
          ? { ...state.currentTask, ...updates }
          : state.currentTask,
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));

// ============== UI状态 ==============
interface UIState {
  sidebarOpen: boolean;
  activePanel: 'chat' | 'tasks' | 'ai-status' | 'memory' | 'logs' | 'projects' | 'settings';
  theme: 'dark';
  toggleSidebar: () => void;
  setActivePanel: (panel: UIState['activePanel']) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  activePanel: 'chat',
  theme: 'dark',
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setActivePanel: (activePanel) => set({ activePanel }),
}));

// ============== 设置状态 (新增) ==============
interface AIConfig {
  providerType: 'openai_compatible' | 'ollama';
  baseUrl: string;
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

interface SettingsState {
  // Commander API配置
  commanderApiUrl: string;
  commanderApiKey: string;
  // 执行官配置
  executorConfig: AIConfig;
  // 审计官配置
  auditorConfig: AIConfig;
  // 操作
  setCommanderApiKey: (key: string) => void;
  setExecutorConfig: (config: Partial<AIConfig>) => void;
  setAuditorConfig: (config: Partial<AIConfig>) => void;
  generateNewCommanderKey: () => string;
}

const defaultAIConfig: AIConfig = {
  providerType: 'openai_compatible',
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4.1-mini',
  maxTokens: 4096,
  temperature: 0.7,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  commanderApiUrl: '/api/b2/commander',
  commanderApiKey: 'b2-commander-' + Math.random().toString(36).substring(2, 15),
  executorConfig: { ...defaultAIConfig },
  auditorConfig: { ...defaultAIConfig },

  setCommanderApiKey: (commanderApiKey) => set({ commanderApiKey }),
  setExecutorConfig: (config) =>
    set((state) => ({
      executorConfig: { ...state.executorConfig, ...config },
    })),
  setAuditorConfig: (config) =>
    set((state) => ({
      auditorConfig: { ...state.auditorConfig, ...config },
    })),
  generateNewCommanderKey: () => {
    const newKey = 'b2-commander-' + Math.random().toString(36).substring(2, 15);
    set({ commanderApiKey: newKey });
    return newKey;
  },
}));
