import { spawn, type ChildProcess, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';

// When the operator does not set LITELLM_MASTER_KEY we generate a strong key at
// runtime instead of shipping a well-known default. The proxy we spawn and this
// client both use this value, so the gateway is never protected by a public
// constant. An externally managed proxy must be configured with the same key.
export const DEFAULT_LITELLM_MASTER_KEY = `sk-litellm-${crypto.randomBytes(24).toString('hex')}`;
export const resolveLitellmMasterKey = (): string =>
  process.env.LITELLM_MASTER_KEY || DEFAULT_LITELLM_MASTER_KEY;

// A native provider call must never hang a request forever when a provider
// stalls (an endpoint that accepts the connection but never answers). Bound
// every provider/gateway call so the router can fail over instead of blocking.
const PROVIDER_FETCH_TIMEOUT_MS = 45_000;
function fetchWithTimeout(
  url: string,
  init: RequestInit,
  ms: number = PROVIDER_FETCH_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...init, signal: controller.signal }).finally(() =>
    clearTimeout(timer),
  );
}

export interface LiteLLMStatus {
  online: boolean;
  // True when an HTTP call to the proxy succeeded. This is what `online` means;
  // it is kept separate from key presence so the status never claims the gateway
  // is reachable when it is not.
  proxyReachable: boolean;
  url: string;
  managedLocally: boolean;
  models: string[];
  configuredProviders: {
    openai: boolean;
    anthropic: boolean;
    gemini: boolean;
    deepseek: boolean;
    openrouter: boolean;
    groq: boolean;
    mistral: boolean;
    xai: boolean;
    nvidia: boolean;
    huggingface: boolean;
    azure: boolean;
  };
  masterKeyConfigured: boolean;
  error?: string;
}

let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

function convertMessagesToGemini(messages: any[]): {
  systemInstruction?: string;
  contents: Array<{ role: string; parts: any[] }>;
} {
  let systemInstruction: string | undefined = undefined;
  const contents: Array<{ role: string; parts: any[] }> = [];

  for (const m of messages) {
    if (m.role === 'system') {
      const text = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
      systemInstruction = systemInstruction ? `${systemInstruction}\n\n${text}` : text;
      continue;
    }

    const role = m.role === 'assistant' ? 'model' : 'user';
    const parts: any[] = [];

    if (typeof m.content === 'string') {
      if (m.content.trim()) {
        parts.push({ text: m.content });
      }
    } else if (Array.isArray(m.content)) {
      for (const part of m.content) {
        if (part.type === 'text' && part.text) {
          parts.push({ text: part.text });
        } else if (part.type === 'image_url' && part.image_url?.url) {
          const dataUrl = part.image_url.url;
          const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            parts.push({
              inlineData: {
                mimeType: match[1],
                data: match[2],
              },
            });
          }
        }
      }
    }

    if (parts.length > 0) {
      contents.push({ role, parts });
    }
  }

  if (contents.length === 0) {
    contents.push({ role: 'user', parts: [{ text: 'Hola' }] });
  }

  return { systemInstruction, contents };
}

async function callGeminiDirectStream(params: {
  model: string;
  messages: any[];
  temperature?: number;
  max_tokens?: number;
}): Promise<{ stream: ReadableStream<Uint8Array>; usedModel: string }> {
  const ai = getGeminiClient();
  const { systemInstruction, contents } = convertMessagesToGemini(params.messages);
  const candidateModels = ['gemini-3.5-flash', 'gemini-3.5-flash-lite'];

  let responseStream: any = null;
  let usedModelName = 'gemini-3.5-flash';
  let lastErr: any = null;

  for (const modelCandidate of candidateModels) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        responseStream = await ai.models.generateContentStream({
          model: modelCandidate,
          contents,
          config: {
            systemInstruction,
            temperature: params.temperature ?? 0.7,
          },
        });
        usedModelName = modelCandidate;
        break;
      } catch (err: any) {
        lastErr = err;
        const msg = String(err?.message || '');
        if (msg.includes('503') || msg.includes('429') || msg.includes('high demand')) {
          await new Promise((r) => setTimeout(r, (attempt + 1) * 700));
        } else {
          break; // Try next model candidate
        }
      }
    }
    if (responseStream) break;
  }

  if (!responseStream) {
    throw lastErr || new Error('Error al conectar con Google Gemini API.');
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of responseStream) {
          const text = chunk.text || '';
          if (text) {
            const sseLine = `data: ${JSON.stringify({
              choices: [{ delta: { content: text } }],
            })}\n\n`;
            controller.enqueue(encoder.encode(sseLine));
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (e) {
        controller.error(e);
      }
    },
  });

  return {
    stream,
    usedModel: `${usedModelName} (Google GenAI Direct)`,
  };
}

async function callGeminiDirectCompletion(params: {
  model: string;
  messages: any[];
  temperature?: number;
  max_tokens?: number;
}): Promise<{ content: string; usedModel: string }> {
  const ai = getGeminiClient();
  const { systemInstruction, contents } = convertMessagesToGemini(params.messages);
  const candidateModels = ['gemini-3.5-flash', 'gemini-3.5-flash-lite'];

  let response: any = null;
  let usedModelName = 'gemini-3.5-flash';
  let lastErr: any = null;

  for (const modelCandidate of candidateModels) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        response = await ai.models.generateContent({
          model: modelCandidate,
          contents,
          config: {
            systemInstruction,
            temperature: params.temperature ?? 0.4,
          },
        });
        usedModelName = modelCandidate;
        break;
      } catch (err: any) {
        lastErr = err;
        const msg = String(err?.message || '');
        if (msg.includes('503') || msg.includes('429') || msg.includes('high demand')) {
          await new Promise((r) => setTimeout(r, (attempt + 1) * 700));
        } else {
          break;
        }
      }
    }
    if (response) break;
  }

  if (!response) {
    throw lastErr || new Error('Error al generar respuesta directa con Google Gemini API.');
  }

  return {
    content: response.text || '',
    usedModel: `${usedModelName} (Google GenAI Direct)`,
  };
}

interface ProviderConfig {
  endpoint: string;
  apiKey: string;
  model: string;
  providerName: string;
}

export interface ProviderHealth {
  quotaExhausted: boolean;
  authFailed?: boolean;
  lastChecked: number;
  reason?: string;
}

// Populated only from real provider responses at runtime (e.g. a 429 or an
// explicit "insufficient_quota"). Keyed by canonical provider slug (see
// canonicalProviderKey) so discovery and routing look up the same entry.
export const providerHealthMap = new Map<string, ProviderHealth>();

/**
 * Normalize a provider display name to the same slug used by the model
 * catalog. Without this, routing stored health under e.g. "groq lpu" while
 * discovery looked up "groq", so a real failure never surfaced.
 */
export function canonicalProviderKey(providerName: string): string {
  const n = providerName.toLowerCase();
  if (n.includes('google') || n.includes('gemini')) return 'google';
  if (n.includes('openai')) return 'openai';
  if (n.includes('anthropic')) return 'anthropic';
  if (n.includes('deepseek')) return 'deepseek';
  if (n.includes('groq')) return 'groq';
  if (n.includes('mistral')) return 'mistral';
  if (n.includes('xai') || n.includes('grok')) return 'xai';
  if (n.includes('openrouter')) return 'openrouter';
  if (n.includes('nvidia')) return 'nvidia';
  if (n.includes('hugging')) return 'huggingface';
  if (n.includes('cohere')) return 'cohere';
  if (n.includes('meta')) return 'meta';
  return n;
}

function resolveProviderConfig(modelId: string): ProviderConfig | null {
  const lower = modelId.toLowerCase();

  // 1. Groq
  if (lower.startsWith('groq') || lower.includes('gpt-oss') || lower.includes('qwen') || lower.includes('allam')) {
    if (process.env.GROQ_API_KEY) {
      const groqModel = lower === 'groq-main' ? 'openai/gpt-oss-20b' : modelId;
      return {
        endpoint: 'https://api.groq.com/openai/v1/chat/completions',
        apiKey: process.env.GROQ_API_KEY,
        model: groqModel,
        providerName: 'Groq LPU',
      };
    }
  }

  // 2. Mistral
  if (lower.startsWith('mistral') || lower.startsWith('codestral') || lower.startsWith('ministral') || lower.startsWith('pixtral')) {
    if (process.env.MISTRAL_API_KEY) {
      const mistralModel = lower === 'mistral-main' ? 'ministral-8b-latest' : modelId;
      return {
        endpoint: 'https://api.mistral.ai/v1/chat/completions',
        apiKey: process.env.MISTRAL_API_KEY,
        model: mistralModel,
        providerName: 'Mistral AI',
      };
    }
  }

  // 3. OpenRouter
  if (lower.startsWith('openrouter') || lower.includes('/') || lower.endsWith(':free')) {
    if (process.env.OPENROUTER_API_KEY) {
      const orModel = lower === 'openrouter-main' ? 'meta-llama/llama-3.3-70b-instruct' : modelId;
      return {
        endpoint: 'https://openrouter.ai/api/v1/chat/completions',
        apiKey: process.env.OPENROUTER_API_KEY,
        model: orModel,
        providerName: 'OpenRouter',
      };
    }
  }

  // 4. OpenAI
  if (lower.startsWith('openai') || lower.startsWith('gpt-') || lower.startsWith('o1-')) {
    if (process.env.OPENAI_API_KEY) {
      const oaiModel = lower === 'openai-main' ? 'gpt-4o-mini' : modelId;
      return {
        endpoint: 'https://api.openai.com/v1/chat/completions',
        apiKey: process.env.OPENAI_API_KEY,
        model: oaiModel,
        providerName: 'OpenAI',
      };
    }
  }

  // 5. NVIDIA NIM
  if (lower.startsWith('nvidia') || lower.includes('nemotron')) {
    const nKey = process.env.NVIDIA_NIM_API_KEY || process.env.NVIDIA_API_KEY;
    if (nKey) {
      return {
        endpoint: 'https://integrate.api.nvidia.com/v1/chat/completions',
        apiKey: nKey,
        model: lower === 'nvidia-main' ? 'meta/llama-3.2-90b-vision-instruct' : modelId,
        providerName: 'NVIDIA NIM',
      };
    }
  }

  // 6. xAI
  if (lower.startsWith('xai') || lower.startsWith('grok')) {
    if (process.env.XAI_API_KEY) {
      return {
        endpoint: 'https://api.x.ai/v1/chat/completions',
        apiKey: process.env.XAI_API_KEY,
        model: 'grok-2-latest',
        providerName: 'xAI Grok',
      };
    }
  }

  return null;
}

export class LiteLLMManager {
  private static instance: LiteLLMManager;
  private process: ChildProcess | null = null;
  private baseUrl: string;
  private masterKey: string;
  private isSupervising: boolean = false;
  private isOnline: boolean = false;
  private availableModels: string[] = [];

  private constructor() {
    let url = (process.env.LITELLM_URL || 'http://127.0.0.1:4000/v1').replace(/\/+$/, '');
    if (url.includes('://litellm:')) {
      url = url.replace('://litellm:', '://127.0.0.1:');
    }
    this.baseUrl = url;
    this.masterKey = resolveLitellmMasterKey();
  }

  public static getInstance(): LiteLLMManager {
    if (!LiteLLMManager.instance) {
      LiteLLMManager.instance = new LiteLLMManager();
    }
    return LiteLLMManager.instance;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public getMasterKey(): string {
    return this.masterKey;
  }

  /**
   * Initializes LiteLLM: checks if existing proxy is alive; if not, attempts local auto-spawn if available.
   */
  public async initialize(): Promise<void> {
    console.log(`[LiteLLM Manager] Checking LiteLLM Gateway at ${this.baseUrl}...`);
    const healthy = await this.checkHealth();

    if (healthy) {
      this.isOnline = true;
      console.log(`[LiteLLM Manager] External / Existing LiteLLM Gateway is ONLINE at ${this.baseUrl}`);
      await this.refreshModels();
      return;
    }

    // If not alive and URL points to localhost/127.0.0.1, check for local proxy binary
    const isLocalhost = this.baseUrl.includes('127.0.0.1') || this.baseUrl.includes('localhost');
    if (isLocalhost) {
      await this.spawnLocalProxy();
    } else {
      console.warn(`[LiteLLM Manager] Remote LiteLLM URL ${this.baseUrl} is not reachable yet. Will retry periodically.`);
    }

    // Start background health poller
    this.startSupervisorLoop();
  }

  private async spawnLocalProxy(): Promise<void> {
    const venvBin = '/opt/litellm-venv/bin/litellm';
    const configPath = path.resolve(process.cwd(), 'litellm_config.yaml');

    if (!fs.existsSync(configPath)) {
      console.warn(`[LiteLLM Manager] Configuration file not found at ${configPath}`);
      return;
    }

    let executable: string | null = null;
    if (fs.existsSync(venvBin)) {
      executable = venvBin;
    } else {
      try {
        execSync('command -v litellm', { stdio: 'ignore' });
        executable = 'litellm';
      } catch {
        executable = null;
      }
    }

    if (!executable) {
      console.log(`[LiteLLM Manager] LiteLLM binary is not installed locally. Google GenAI native engine is ready for AI traffic.`);
      return;
    }

    const port = process.env.LITELLM_PORT || '4000';
    const host = process.env.LITELLM_HOST || '0.0.0.0';

    try {
      const env = {
        ...process.env,
        LITELLM_MASTER_KEY: this.masterKey,
        PORT: port,
      };

      console.log(`[LiteLLM Manager] Spawning ${executable} --config ${configPath} --port ${port} --host ${host}`);
      const child = spawn(executable, ['--config', configPath, '--port', port, '--host', host], {
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      this.process = child;

      child.on('error', (err) => {
        console.warn(`[LiteLLM Manager] Local proxy process error: ${err.message}`);
        this.process = null;
        this.isOnline = false;
      });

      child.stdout?.on('data', (data) => {
        const msg = data.toString().trim();
        if (msg) {
          if (msg.includes('Uvicorn running') || msg.includes('LiteLLM: Current Version') || msg.includes('Application startup complete')) {
            console.log(`[LiteLLM Core] ${msg}`);
          }
        }
      });

      child.stderr?.on('data', (data) => {
        const msg = data.toString().trim();
        if (msg && (msg.includes('ERROR') || msg.includes('Exception') || msg.includes('Uvicorn running'))) {
          console.warn(`[LiteLLM Core] ${msg}`);
        }
      });

      child.on('close', (code) => {
        console.warn(`[LiteLLM Manager] Local LiteLLM process exited with code ${code}`);
        this.process = null;
        this.isOnline = false;
      });

      // Brief non-blocking health check
      for (let i = 0; i < 6; i++) {
        await new Promise((r) => setTimeout(r, 500));
        const ready = await this.checkHealth();
        if (ready) {
          this.isOnline = true;
          console.log(`[LiteLLM Manager] Local LiteLLM Proxy is now ACTIVE on ${this.baseUrl}`);
          await this.refreshModels();
          return;
        }
      }

      console.warn(`[LiteLLM Manager] Local proxy started; health check pending in background.`);
    } catch (err: any) {
      console.warn(`[LiteLLM Manager] Failed to spawn local LiteLLM proxy:`, err?.message);
    }
  }

  public async checkHealth(): Promise<boolean> {
    try {
      const rootUrl = this.baseUrl.replace(/\/v1$/, '');
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1500);

      const res = await fetch(`${rootUrl}/health/liveliness`, {
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${this.masterKey}`,
        },
      });
      clearTimeout(timeout);

      if (res.ok) {
        this.isOnline = true;
        return true;
      }
    } catch {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1500);
        const res = await fetch(`${this.baseUrl}/models`, {
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${this.masterKey}`,
          },
        });
        clearTimeout(timeout);
        if (res.ok) {
          this.isOnline = true;
          return true;
        }
      } catch {
        // Not online
      }
    }
    this.isOnline = false;
    return false;
  }

  public async refreshModels(): Promise<string[]> {
    try {
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${this.masterKey}`,
        },
      });
      if (res.ok) {
        const data = (await res.json()) as any;
        if (Array.isArray(data?.data)) {
          this.availableModels = data.data.map((m: any) => m.id);
          return this.availableModels;
        }
      }
    } catch {
      // ignore
    }
    return this.availableModels;
  }

  private startSupervisorLoop(): void {
    if (this.isSupervising) return;
    this.isSupervising = true;

    setInterval(async () => {
      const healthy = await this.checkHealth();
      if (!healthy) {
        const isLocalhost = this.baseUrl.includes('127.0.0.1') || this.baseUrl.includes('localhost');
        if (isLocalhost && !this.process) {
          await this.spawnLocalProxy();
        }
      }
    }, 20000);
  }

  public async getStatus(): Promise<LiteLLMStatus> {
    const isHealthy = await this.checkHealth();
    if (isHealthy && this.availableModels.length === 0) {
      await this.refreshModels();
    }

    const hasGeminiKey = !!process.env.GEMINI_API_KEY;

    return {
      // The proxy is only "online" when an HTTP probe actually succeeded.
      // A configured Gemini key does not make the gateway reachable, so it must
      // never be OR-ed into this flag (that would be a dishonest status).
      online: isHealthy,
      proxyReachable: isHealthy,
      url: this.baseUrl,
      managedLocally: !!this.process,
      models: this.availableModels.length > 0 ? this.availableModels : [
        'gemini-main',
        'openai-main',
        'claude-main',
        'deepseek-main',
        'openrouter-main',
        'groq-main',
        'mistral-main',
      ],
      configuredProviders: {
        gemini: hasGeminiKey,
        openai: !!process.env.OPENAI_API_KEY,
        anthropic: !!process.env.ANTHROPIC_API_KEY,
        deepseek: !!process.env.DEEPSEEK_API_KEY,
        openrouter: !!process.env.OPENROUTER_API_KEY,
        groq: !!process.env.GROQ_API_KEY,
        mistral: !!process.env.MISTRAL_API_KEY,
        xai: !!process.env.XAI_API_KEY,
        nvidia: !!(process.env.NVIDIA_NIM_API_KEY || process.env.NVIDIA_API_KEY),
        huggingface: !!(process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN),
        azure: !!process.env.AZURE_API_KEY,
      },
      masterKeyConfigured: !!process.env.LITELLM_MASTER_KEY,
    };
  }

  /**
   * Forwards chat completions to LiteLLM Proxy or direct provider APIs with automatic failover to Google GenAI.
   */
  public async createCompletionStream(params: {
    model: string;
    messages: any[];
    temperature?: number;
    max_tokens?: number;
    onFallback?: (info: { fromModel: string; toModel: string; reason: string }) => void;
  }): Promise<{ stream: ReadableStream<Uint8Array>; usedModel: string }> {
    // A. Check if LiteLLM Proxy is online and reachable
    if (this.isOnline) {
      try {
        const targetUrl = `${this.baseUrl}/chat/completions`;
        const response = await fetchWithTimeout(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.masterKey}`,
          },
          body: JSON.stringify({
            model: params.model,
            messages: params.messages,
            temperature: params.temperature ?? 0.7,
            max_tokens: params.max_tokens,
            stream: true,
          }),
        });

        if (response.ok && response.body) {
          return {
            stream: response.body as ReadableStream<Uint8Array>,
            usedModel: `${params.model} (via LiteLLM Proxy)`,
          };
        }
      } catch (err: any) {
        console.warn('[LiteLLM Gateway] Proxy call warning:', err?.message);
      }
    }

    // B. Direct Provider Routing for non-Gemini models (Groq, Mistral, OpenRouter, OpenAI, etc.)
    const providerConfig = resolveProviderConfig(params.model);
    if (providerConfig) {
      const pKey = canonicalProviderKey(providerConfig.providerName);
      const health = providerHealthMap.get(pKey);
      const isCircuitOpen = (health?.quotaExhausted || health?.authFailed) && Date.now() - health.lastChecked < 600000;

      if (isCircuitOpen) {
        if (params.onFallback) {
          params.onFallback({
            fromModel: params.model,
            toModel: 'gemini-3.5-flash',
            reason: `${providerConfig.providerName} sin créditos disponibles. Failover transparente a Google GenAI (Gemini 3.5 Flash).`,
          });
        }
      } else {
        try {
          const response = await fetchWithTimeout(providerConfig.endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${providerConfig.apiKey}`,
            },
            body: JSON.stringify({
              model: providerConfig.model,
              messages: params.messages,
              temperature: params.temperature ?? 0.7,
              max_tokens: params.max_tokens || 4096,
              stream: true,
            }),
          });

          if (response.ok && response.body) {
            if (health?.quotaExhausted || health?.authFailed) {
              providerHealthMap.delete(pKey);
            }
            return {
              stream: response.body as ReadableStream<Uint8Array>,
              usedModel: `${providerConfig.model} (${providerConfig.providerName})`,
            };
          }

          const errText = await response.text();
          let errMsg = `[${providerConfig.providerName} ${response.status}]`;
          try {
            const parsed = JSON.parse(errText);
            errMsg += ` ${parsed.error?.message || parsed.message || errText}`;
          } catch {
            errMsg += ` ${errText}`;
          }

          const isQuota =
            response.status === 429 ||
            errText.includes('insufficient_quota') ||
            errText.includes('credits remaining') ||
            errText.includes('quota');
          // A rejected key will keep failing until it is rotated, so trip the
          // breaker for it too instead of retrying on every request.
          const isAuthFailure =
            response.status === 401 ||
            response.status === 403 ||
            errText.includes('invalid_api_key') ||
            errText.includes('Invalid API Key');

          if (isQuota || isAuthFailure) {
            providerHealthMap.set(pKey, {
              quotaExhausted: isQuota,
              authFailed: isAuthFailure,
              lastChecked: Date.now(),
              reason: errMsg,
            });
            const cause = isAuthFailure
              ? `clave rechazada (${response.status})`
              : 'cuota agotada';
            console.log(`[LiteLLM Gateway] ${providerConfig.providerName} ${cause}. Auto-failover a Gemini 3.5 Flash durante 10 minutos.`);
          } else {
            console.warn(`[LiteLLM Gateway] Provider error for ${params.model}:`, errMsg);
          }

          if (params.onFallback) {
            params.onFallback({
              fromModel: params.model,
              toModel: 'gemini-3.5-flash',
              reason: isQuota
                ? `${providerConfig.providerName} sin créditos disponibles. Redirigido a Google GenAI (Gemini 3.5 Flash).`
                : isAuthFailure
                ? `${providerConfig.providerName} clave rechazada (${response.status}). Redirigido a Google GenAI (Gemini 3.5 Flash).`
                : `${providerConfig.providerName} no disponible: ${errMsg}. Activando Google GenAI.`,
            });
          }
        } catch (err: any) {
          console.warn(`[LiteLLM Gateway] Provider fetch failed:`, err?.message);
          if (params.onFallback) {
            params.onFallback({
              fromModel: params.model,
              toModel: 'gemini-3.5-flash',
              reason: `Fallo de conexión con ${providerConfig.providerName}. Activando Google GenAI.`,
            });
          }
        }
      }
    }

    // C. Default / Primary Failover: Google GenAI
    if (process.env.GEMINI_API_KEY) {
      if (params.onFallback && params.model !== 'gemini-3.5-flash' && params.model !== 'gemini-main' && !providerConfig) {
        params.onFallback({
          fromModel: params.model,
          toModel: 'gemini-3.5-flash',
          reason: 'Enrutado a Google GenAI (Motor Principal)',
        });
      }
      return await callGeminiDirectStream(params);
    }

    throw new Error('Servicio de IA no disponible: Ningún proveedor configurado respondió.');
  }

  public async createCompletion(params: {
    model: string;
    messages: any[];
    temperature?: number;
    max_tokens?: number;
    onFallback?: (info: { fromModel: string; toModel: string; reason: string }) => void;
  }): Promise<{ content: string; usedModel: string }> {
    // A. Check if LiteLLM Proxy is online
    if (this.isOnline) {
      try {
        const targetUrl = `${this.baseUrl}/chat/completions`;
        const response = await fetchWithTimeout(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.masterKey}`,
          },
          body: JSON.stringify({
            model: params.model,
            messages: params.messages,
            temperature: params.temperature ?? 0.4,
            max_tokens: params.max_tokens,
            stream: false,
          }),
        });

        if (response.ok) {
          const data = (await response.json()) as any;
          const content = data.choices?.[0]?.message?.content || '';
          return { content, usedModel: `${params.model} (via LiteLLM Proxy)` };
        }
      } catch (err: any) {
        console.warn('[LiteLLM Gateway] Proxy non-stream call warning:', err?.message);
      }
    }

    // B. Direct Provider Routing
    const providerConfig = resolveProviderConfig(params.model);
    if (providerConfig) {
      const pKey = canonicalProviderKey(providerConfig.providerName);
      const health = providerHealthMap.get(pKey);
      const isCircuitOpen = (health?.quotaExhausted || health?.authFailed) && Date.now() - health.lastChecked < 600000;

      if (isCircuitOpen) {
        if (params.onFallback) {
          const cause = health?.authFailed ? 'clave rechazada' : 'cuota agotada';
          params.onFallback({
            fromModel: params.model,
            toModel: 'gemini-3.5-flash',
            reason: `${providerConfig.providerName} ${cause}. Redirigido automáticamente a Google GenAI.`,
          });
        }
      } else {
        try {
          const response = await fetchWithTimeout(providerConfig.endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${providerConfig.apiKey}`,
            },
            body: JSON.stringify({
              model: providerConfig.model,
              messages: params.messages,
              temperature: params.temperature ?? 0.4,
              max_tokens: params.max_tokens || 4096,
              stream: false,
            }),
          });

          if (response.ok) {
            if (health?.quotaExhausted || health?.authFailed) {
              providerHealthMap.delete(pKey);
            }
            const data = (await response.json()) as any;
            const content = data.choices?.[0]?.message?.content || '';
            return { content, usedModel: `${providerConfig.model} (${providerConfig.providerName})` };
          }

          const errText = await response.text();
          const isQuota =
            response.status === 429 ||
            errText.includes('insufficient_quota') ||
            errText.includes('credits remaining') ||
            errText.includes('quota');
          const isAuthFailure =
            response.status === 401 ||
            response.status === 403 ||
            errText.includes('invalid_api_key') ||
            errText.includes('Invalid API Key');

          if (isQuota || isAuthFailure) {
            providerHealthMap.set(pKey, {
              quotaExhausted: isQuota,
              authFailed: isAuthFailure,
              lastChecked: Date.now(),
              reason: isAuthFailure ? `auth rejected (${response.status})` : 'quota exhausted',
            });
            const cause = isAuthFailure ? `clave rechazada (${response.status})` : 'cuota agotada';
            console.log(`[LiteLLM Gateway] ${providerConfig.providerName} ${cause}. Failover automático a Gemini.`);
          } else {
            console.warn(`[LiteLLM Gateway] Completion provider error:`, errText);
          }

          if (params.onFallback) {
            params.onFallback({
              fromModel: params.model,
              toModel: 'gemini-3.5-flash',
              reason: `${providerConfig.providerName} error de cuota/acceso. Redirigiendo a Google GenAI.`,
            });
          }
        } catch (err: any) {
          console.warn(`[LiteLLM Gateway] Completion fetch failed:`, err?.message);
        }
      }
    }

    // C. Default / Primary Failover: Google GenAI
    if (process.env.GEMINI_API_KEY) {
      if (params.onFallback && params.model !== 'gemini-3.5-flash' && params.model !== 'gemini-main' && !providerConfig) {
        params.onFallback({
          fromModel: params.model,
          toModel: 'gemini-3.5-flash',
          reason: 'Enrutado a Google GenAI (Motor Principal)',
        });
      }
      return await callGeminiDirectCompletion(params);
    }

    throw new Error('Servicio de IA no disponible: Ningún proveedor configurado respondió.');
  }
}
