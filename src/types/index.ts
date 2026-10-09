export type ViewMode =
  | 'home'
  | 'chat'
  | 'code'
  | 'solve'
  | 'models'
  | 'compare'
  | 'prompts'
  | 'apk'
  | 'deploy'
  | 'vision'
  | 'documents'
  | 'billing'
  | 'admin'
  | 'settings'
  | 'tools'
  | 'permissions'
  | 'memory'
  | 'automations'
  | 'components';

export type VerificationStatus = 'VERIFIED' | 'PARTIALLY_VERIFIED' | 'UNVERIFIED';

export interface ProjectFile {
  id: string;
  path: string;
  name: string;
  content: string;
  language: string;
  updatedAt: number;
}

export interface PlanStep {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  details?: string;
  completedAt?: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  files: ProjectFile[];
  activeFileId?: string;
  plan: PlanStep[];
  type?: 'web-app' | 'react' | 'api' | 'cli' | 'fullstack' | 'game' | 'general';
}

export interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  mimeType: string;
  data?: string; // base64 representation for multimodal
  textContent?: string;
  language?: string;
}

export interface PendingAction {
  id: string;
  type: 'create_files' | 'delete_file' | 'send_email' | 'run_command' | 'export_project' | 'modify_code';
  title: string;
  details: string;
  payload: any;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
}

export interface GroundingSource {
  title?: string;
  uri?: string;
  snippet?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
  files?: AttachedFile[];
  status?: 'streaming' | 'complete' | 'error';
  agentPersona?: string;
  groundingSources?: GroundingSource[];
  generatedFiles?: ProjectFile[];
  pendingAction?: PendingAction;
  modelUsed?: string;
  tokensCount?: number;
  latencyMs?: number;
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  modelId: string;
  createdAt: number;
  updatedAt: number;
  isPinned?: boolean;
  isFavorite?: boolean;
  folder?: string;
}

export interface ToolIntegration {
  id: string;
  name: string;
  category: 'core' | 'workspace' | 'developer' | 'infrastructure';
  status: 'CONNECTED' | 'NOT_CONFIGURED' | 'AVAILABLE' | 'EXTERNAL_AGENT_REQUIRED';
  description: string;
  requiresOAuth: boolean;
  requiredScopes?: string[];
  permissions: {
    read: boolean;
    write: boolean;
    execute: boolean;
  };
  documentationUrl?: string;
  architectureNotes?: string;
}

export interface ModelOption {
  id: string;
  name: string;
  shortName: string;
  tier: string;
  provider?: string;
  family?: string;
  description?: string;
  /** Availability state reported by the discovery engine. */
  status?: 'active' | 'configured' | 'key_required' | 'unavailable' | 'deprecated';
  isPaid: boolean;
  capabilities: string[];
  contextWindow?: number;
  maxOutputTokens?: number;
  modalities?: string[];
  speedRating?: 'ultra-fast' | 'fast' | 'balanced' | 'deep-thinking';
  tokensPerSecEstimate?: number;
  pricing?: {
    inputPerMillionUSD: number;
    outputPerMillionUSD: number;
    isFreeTierAvailable: boolean;
  };
  badges?: string[];
  isDefault?: boolean;
}

export interface AgentPersona {
  id: string;
  name: string;
  role: string;
  iconName: string;
  description: string;
  systemModifier: string;
}

export interface UserPreferences {
  userName: string;
  userEmail?: string;
  language: string;
  theme: 'dark' | 'light';
  detailLevel: 'concise' | 'balanced' | 'comprehensive';
  autoApproveSafeActions: boolean;
  activeModel: string;
  customSystemInstruction?: string;
  customApiKey?: string;
  autoSpeakResponse?: boolean;
}

export interface MemoryItem {
  id: string;
  type: 'user' | 'project' | 'session' | 'temporary';
  key: string;
  value: string;
  createdAt: number;
  updatedAt: number;
}

export interface AutomationTask {
  id: string;
  name: string;
  schedule: string;
  taskPrompt: string;
  enabled: boolean;
  status: 'ACTIVE_LISTENER' | 'REQUIRES_CRON_SERVICE';
  lastRun?: number;
  nextRunEstimated?: string;
}

export interface PromptTemplate {
  id: string;
  title: string;
  category: 'Coding' | 'Architecture' | 'Security' | 'Bug Fix' | 'Reasoning' | 'Product' | 'Custom';
  description: string;
  prompt: string;
  tags: string[];
  isFavorite?: boolean;
  isCustom?: boolean;
  suggestedModel?: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'guest';
  avatarUrl?: string;
  currentPlan: 'free' | 'pro' | 'business';
  createdAt: number;
  apiKeyConfigured?: boolean;
}

export interface ComparisonResult {
  modelId: string;
  modelUsed: string;
  content: string;
  latencyMs: number;
  tokens: number;
  status: 'success' | 'error';
  error?: string;
}

export interface UsageQuotaInfo {
  plan: {
    id: 'free' | 'pro' | 'business';
    name: string;
    dailyMessageLimit: number;
    dailyTokenLimit: number;
    pricePerMonthUSD: number;
    features: string[];
  };
  dailyUsage: {
    messagesToday: number;
    tokensToday: number;
    costTodayUSD: number;
  };
  remaining: number;
  isLimitReached: boolean;
  warning?: string;
  resetTime: string;
}

export interface AdminMetrics {
  totalRequests: number;
  totalTokens: number;
  totalCostUSD: number;
  activeUsers: number;
  successRate: string;
  modelDistribution: Record<string, number>;
  averageLatencyMs: number;
}
