import {
  AttachedFile,
  ProjectFile,
  GroundingSource,
  ModelOption,
  ComparisonResult,
  UsageQuotaInfo,
  AdminMetrics,
} from '../types';

export interface SystemStatusResponse {
  name: string;
  version: string;
  status: string;
  gateway?: string;
  litellm?: {
    online: boolean;
    proxyUrl: string;
    managedLocally: boolean;
    masterKeyConfigured: boolean;
    providers: Record<string, boolean>;
  };
  hasApiKey: boolean;
  runtime: string;
  activeModelDefault: string;
  supportedModels: any[];
  toolIntegrations: any[];
}

export function getApiBaseUrl(): string {
  // Same-origin by default so the Vite dev proxy and the production Express
  // server (which serves the SPA) both route /api correctly. A cross-origin
  // backend can still be supplied explicitly via VITE_API_BASE_URL.
  const configured = (import.meta as any)?.env?.VITE_API_BASE_URL as string | undefined;
  if (configured) return configured.replace(/\/+$/, '');
  return '';
}

const SESSION_TOKEN_KEY = 'kiranai_session_token_v1';

export function getSessionToken(): string | null {
  try {
    return localStorage.getItem(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setSessionToken(token: string | null) {
  try {
    if (token) localStorage.setItem(SESSION_TOKEN_KEY, token);
    else localStorage.removeItem(SESSION_TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
}

/** Authenticated fetch helper that attaches the session bearer token when present. */
export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = getSessionToken();
  const headers = new Headers(init.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}

export interface AuthResult {
  user: {
    id: string;
    email: string;
    name: string;
    role: 'user' | 'admin';
    plan: string;
    subscriptionStatus: string;
    avatarUrl?: string;
    preferences?: Record<string, any>;
  };
  token: string;
}

export async function loginWithEmail(email: string, password: string): Promise<AuthResult> {
  const res = await authFetch(`${getApiBaseUrl()}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'No se pudo iniciar sesión.');
  setSessionToken(data.token);
  return data;
}

export async function registerWithEmail(email: string, password: string, name?: string): Promise<AuthResult> {
  const res = await authFetch(`${getApiBaseUrl()}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'No se pudo crear la cuenta.');
  setSessionToken(data.token);
  return data;
}

export async function loginWithGoogle(idToken: string): Promise<AuthResult> {
  const res = await authFetch(`${getApiBaseUrl()}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'No se pudo autenticar con Google.');
  setSessionToken(data.token);
  return data;
}

export async function fetchCurrentUser(): Promise<AuthResult['user'] | null> {
  const res = await authFetch(`${getApiBaseUrl()}/api/auth/me`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.user || null;
}

export function logout() {
  setSessionToken(null);
}

export async function fetchSystemStatus(): Promise<SystemStatusResponse> {
  const res = await authFetch(`${getApiBaseUrl()}/api/status`);
  if (!res.ok) {
    throw new Error(`Failed to fetch system status: ${res.statusText}`);
  }
  return await res.json();
}

export interface StreamChatOptions {
  messages: Array<{ role: 'user' | 'model'; content: string }>;
  model: string;
  systemInstruction?: string;
  enableWebSearch?: boolean;
  files?: AttachedFile[];
  projectContext?: string;
  userId?: string;
  onChunk: (chunk: string) => void;
  onGrounding?: (sources: GroundingSource[]) => void;
  onFallback?: (info: { fromModel: string; toModel: string; reason: string }) => void;
  onPaywall?: (info: { error: string; plan: any; messagesToday: number; limit: number }) => void;
  onError: (error: string) => void;
  onDone: () => void;
}

export async function streamChat({
  messages,
  model,
  systemInstruction,
  enableWebSearch,
  files,
  projectContext,
  userId = 'usr_guest',
  onChunk,
  onGrounding,
  onFallback,
  onPaywall,
  onError,
  onDone,
}: StreamChatOptions): Promise<() => void> {
  const controller = new AbortController();

  try {
    const response = await authFetch(`${getApiBaseUrl()}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        model,
        systemInstruction,
        enableWebSearch,
        userId,
        files: files?.map((f) => ({
          name: f.name,
          mimeType: f.mimeType,
          data: f.data,
          textContent: f.textContent,
          language: f.language,
        })),
        projectContext,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      onError(`Server error (${response.status}): ${errText}`);
      onDone();
      return () => controller.abort();
    }

    if (!response.body) {
      onError('Response body is empty or unreadable.');
      onDone();
      return () => controller.abort();
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    (async () => {
      let hasError = false;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (buffer.trim()) {
              const remainingLines = buffer.split(/\r?\n/);
              for (const line of remainingLines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('data:')) {
                  const jsonStr = trimmed.replace(/^data:\s*/, '');
                  try {
                    const data = JSON.parse(jsonStr);
                    if (data.type === 'chunk' && data.text) {
                      onChunk(data.text);
                    } else if (data.type === 'paywall_limit' && onPaywall) {
                      onPaywall(data);
                    } else if (data.type === 'error') {
                      hasError = true;
                      onError(data.error);
                    }
                  } catch (e) {
                    console.warn('Failed to parse final SSE chunk:', jsonStr, e);
                  }
                }
              }
            }
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(':')) continue;
            if (trimmed.startsWith('data:')) {
              const jsonStr = trimmed.replace(/^data:\s*/, '');
              try {
                const data = JSON.parse(jsonStr);
                if (data.type === 'chunk' && data.text) {
                  onChunk(data.text);
                } else if (data.type === 'paywall_limit' && onPaywall) {
                  hasError = true;
                  onPaywall(data);
                } else if (data.type === 'fallback_switch' && onFallback) {
                  onFallback({
                    fromModel: data.fromModel,
                    toModel: data.toModel,
                    reason: data.reason,
                  });
                } else if (data.type === 'grounding') {
                  const sources: GroundingSource[] = [];
                  const chunks = data.groundingMetadata?.groundingChunks || [];
                  for (const c of chunks) {
                    if (c.web) {
                      sources.push({
                        title: c.web.title || 'Web Search Reference',
                        uri: c.web.uri || '',
                      });
                    }
                  }
                  if (onGrounding && sources.length > 0) {
                    onGrounding(sources);
                  }
                } else if (data.type === 'error') {
                  hasError = true;
                  onError(data.error);
                } else if (data.type === 'done') {
                  if (!hasError) {
                    onDone();
                  }
                  return;
                }
              } catch (e) {
                console.warn('Failed to parse SSE JSON:', jsonStr, e);
              }
            }
          }
        }
        if (!hasError) {
          onDone();
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          onError(err.message || 'Stream connection interrupted');
        }
      }
    })();
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      onError(err.message || 'Failed to initiate chat request');
    }
    onDone();
  }

  return () => {
    controller.abort();
  };
}

export async function generateProjectScaffold(params: {
  prompt: string;
  projectType: string;
  model: string;
  features?: string[];
}): Promise<{ rawOutput: string; files: ProjectFile[]; count: number }> {
  const response = await authFetch(`${getApiBaseUrl()}/api/generate-project`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(errorData.error || 'Failed to generate project.');
  }

  const data = await response.json();
  const projectFiles: ProjectFile[] = (data.files || []).map((f: any, idx: number) => ({
    id: `file_${Date.now()}_${idx}`,
    path: f.path,
    name: f.path.split('/').pop() || f.path,
    content: f.content,
    language: f.language || 'javascript',
    updatedAt: Date.now(),
  }));

  return {
    rawOutput: data.rawOutput,
    files: projectFiles,
    count: projectFiles.length,
  };
}

export async function analyzeFileContent(params: {
  file: AttachedFile;
  task: 'audit' | 'solve' | 'explain' | 'optimize';
  userQuestion?: string;
}): Promise<{ analysis: string; fileName: string; timestamp: string }> {
  const response = await authFetch(`${getApiBaseUrl()}/api/analyze-file`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(errorData.error || 'Failed to analyze file.');
  }

  return await response.json();
}

/**
 * Model Discovery API
 */
export async function fetchDiscoveredModels(): Promise<{
  models: ModelOption[];
  source: string;
  activeProviders: Record<string, boolean>;
  timestamp: number;
}> {
  const res = await authFetch(`${getApiBaseUrl()}/api/models`);
  if (!res.ok) {
    throw new Error('Error al consultar el catálogo de modelos.');
  }
  const data = await res.json();
  return {
    ...data,
    models: (data.models || []).map((m: any) => ({
      id: m.id,
      name: m.name,
      shortName: m.shortName,
      provider: m.provider,
      family: m.family,
      description: m.description,
      status: m.status,
      tier:
        m.status === 'active'
          ? 'Disponible'
          : m.status === 'key_required'
          ? 'Requiere clave de proveedor'
          : m.status === 'unavailable'
          ? 'No disponible'
          : m.status === 'deprecated'
          ? 'Obsoleto'
          : 'Configurado (LiteLLM)',
      isPaid: m.pricing?.isFreeTierAvailable === false,
      capabilities: Object.entries(m.capabilities || {})
        .filter(([_, enabled]) => Boolean(enabled))
        .map(([k]) => {
          if (k === 'vision') return 'Visión & OCR';
          if (k === 'reasoning') return 'Razonamiento Profundo';
          if (k === 'codeSpecialized') return 'Especialista en Código';
          if (k === 'functionCalling') return 'Function Calling';
          if (k === 'structuredOutput') return 'Salida JSON Estructurada';
          if (k === 'webSearch') return 'Búsqueda Web';
          return k;
        }),
      contextWindow: m.contextWindow,
      maxOutputTokens: m.maxOutputTokens,
      modalities: m.modalities,
      speedRating: m.speedRating,
      tokensPerSecEstimate: m.tokensPerSecEstimate,
      pricing: m.pricing,
      badges: m.badges,
      isDefault: m.isDefault,
    })),
  };
}

export async function triggerModelDiscovery(): Promise<any> {
  const res = await authFetch(`${getApiBaseUrl()}/api/models/discover`, { method: 'POST' });
  if (!res.ok) {
    throw new Error('Error al sincronizar modelos.');
  }
  return await res.json();
}

/**
 * Model Compare Arena API
 */
export async function compareModels(params: {
  models: string[];
  prompt: string;
  systemInstruction?: string;
}): Promise<{
  prompt: string;
  results: ComparisonResult[];
  totalDurationMs: number;
}> {
  const res = await authFetch(`${getApiBaseUrl()}/api/chat/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errorData.error || 'Error al ejecutar comparación de modelos.');
  }
  return await res.json();
}

/**
 * Usage & Smart Paywall API
 */
export async function fetchUserUsage(userId: string = 'usr_guest'): Promise<UsageQuotaInfo> {
  const res = await authFetch(`${getApiBaseUrl()}/api/usage?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) {
    throw new Error('Error al consultar uso de cuota.');
  }
  return await res.json();
}

/**
 * Billing & Checkout API
 */
export async function fetchBillingPlans(): Promise<{ plans: any[]; currency: string; stripeConfigured: boolean }> {
  const res = await authFetch(`${getApiBaseUrl()}/api/billing/plans`);
  if (!res.ok) {
    throw new Error('Error al consultar planes de facturación.');
  }
  return await res.json();
}

export async function createBillingCheckout(planId: string, userId: string = 'usr_guest'): Promise<{
  success: boolean;
  checkoutUrl: string;
  sessionId: string;
  plan: any;
  message?: string;
  stripeConfigured: boolean;
}> {
  const res = await authFetch(`${getApiBaseUrl()}/api/billing/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ planId, userId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error en checkout' }));
    throw new Error(err.error || 'Error al procesar suscripción.');
  }
  return await res.json();
}

export async function fetchCustomerPortal(userId: string = 'usr_guest'): Promise<{ url: string }> {
  const res = await authFetch(`${getApiBaseUrl()}/api/billing/portal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al acceder a portal' }));
    throw new Error(err.error || 'Error abriendo portal de cliente.');
  }
  return await res.json();
}

export async function fetchProviderAudit(): Promise<{
  providers: Array<{
    id: string;
    name: string;
    envVar: string;
    isConfigured: boolean;
    status: string;
    description: string;
    docsUrl: string;
    models: string[];
  }>;
  stripe: {
    configured: boolean;
    hasSecretKey: boolean;
    hasWebhookSecret: boolean;
    hasPriceIdPro: boolean;
    hasPriceIdBusiness: boolean;
  };
}> {
  const res = await authFetch(`${getApiBaseUrl()}/api/providers/audit`);
  if (!res.ok) {
    throw new Error('Error al auditar proveedores de IA.');
  }
  return await res.json();
}

export async function fetchUserCredits(userId: string = 'usr_guest'): Promise<{
  userId: string;
  balance: number;
  totalPurchased: number;
  totalConsumed: number;
  reserved: number;
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    balanceAfter: number;
    operation: string;
    model?: string;
    createdAt: number;
    notes?: string;
  }>;
}> {
  const res = await authFetch(`${getApiBaseUrl()}/api/credits?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) {
    throw new Error('Error al consultar saldo de créditos.');
  }
  return await res.json();
}

/**
 * Admin Metrics API
 */
export async function fetchAdminMetrics(): Promise<{
  metrics: AdminMetrics;
  system: any;
  featureFlags: any;
  maintenanceMode: boolean;
  systemAnnouncement: string;
}> {
  const res = await authFetch(`${getApiBaseUrl()}/api/admin/metrics`);
  if (!res.ok) {
    throw new Error('Error al consultar métricas de administración.');
  }
  return await res.json();
}
