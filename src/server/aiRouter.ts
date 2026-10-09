import { GoogleGenAI } from '@google/genai';
import { Database } from './db/database.ts';

export interface ProviderDiagnostic {
  id: string;
  name: string;
  envVar: string;
  isConfigured: boolean;
  status: 'active' | 'missing_key' | 'quota_exhausted' | 'degraded';
  description: string;
  docsUrl: string;
  models: string[];
}

export interface ModelSpecification {
  id: string;
  provider: 'google' | 'openai' | 'mistral' | 'openrouter' | 'anthropic' | 'deepseek' | 'groq' | 'xai';
  modelSlug: string;
  name: string;
  creditCost: number;
  inputCostPerM: number;
  outputCostPerM: number;
  capabilities: {
    vision: boolean;
    reasoning: boolean;
    code: boolean;
    tools: boolean;
    streaming: boolean;
  };
  supportedAspectRatios?: string[];
}

export const SUPPORTED_MODELS_REGISTRY: Record<string, ModelSpecification> = {
  // Google Gemini
  'gemini-3.5-flash': {
    id: 'gemini-3.5-flash',
    provider: 'google',
    modelSlug: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    creditCost: 1,
    inputCostPerM: 0.075,
    outputCostPerM: 0.3,
    capabilities: { vision: true, reasoning: true, code: true, tools: true, streaming: true },
  },
  'gemini-3.5-flash-lite': {
    id: 'gemini-3.5-flash-lite',
    provider: 'google',
    modelSlug: 'gemini-3.5-flash-lite',
    name: 'Gemini 3.5 Flash Lite',
    creditCost: 1,
    inputCostPerM: 0.0375,
    outputCostPerM: 0.15,
    capabilities: { vision: true, reasoning: false, code: true, tools: true, streaming: true },
  },
  'gemini-3.1-pro-preview': {
    id: 'gemini-3.1-pro-preview',
    provider: 'google',
    modelSlug: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro (Deep Reasoning)',
    creditCost: 5,
    inputCostPerM: 1.25,
    outputCostPerM: 5.0,
    capabilities: { vision: true, reasoning: true, code: true, tools: true, streaming: true },
  },
  'gemini-3-pro-image': {
    id: 'gemini-3-pro-image',
    provider: 'google',
    modelSlug: 'gemini-3-pro-image',
    name: 'Gemini Image Studio',
    creditCost: 4,
    inputCostPerM: 0.2,
    outputCostPerM: 1.0,
    capabilities: { vision: true, reasoning: false, code: false, tools: false, streaming: false },
    supportedAspectRatios: ['1:1', '3:4', '4:3', '9:16', '16:9'],
  },

  // Mistral AI
  'ministral-8b-latest': {
    id: 'ministral-8b-latest',
    provider: 'mistral',
    modelSlug: 'ministral-8b-latest',
    name: 'Ministral 8B',
    creditCost: 1,
    inputCostPerM: 0.1,
    outputCostPerM: 0.1,
    capabilities: { vision: false, reasoning: false, code: true, tools: true, streaming: true },
  },
  'mistral-large-latest': {
    id: 'mistral-large-latest',
    provider: 'mistral',
    modelSlug: 'mistral-large-latest',
    name: 'Mistral Large 2',
    creditCost: 3,
    inputCostPerM: 2.0,
    outputCostPerM: 6.0,
    capabilities: { vision: false, reasoning: true, code: true, tools: true, streaming: true },
  },
  'codestral-latest': {
    id: 'codestral-latest',
    provider: 'mistral',
    modelSlug: 'codestral-latest',
    name: 'Codestral (Mistral Code Engine)',
    creditCost: 2,
    inputCostPerM: 0.2,
    outputCostPerM: 0.6,
    capabilities: { vision: false, reasoning: true, code: true, tools: true, streaming: true },
  },

  // OpenRouter
  'openrouter-main': {
    id: 'openrouter-main',
    provider: 'openrouter',
    modelSlug: 'meta-llama/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B (OpenRouter)',
    creditCost: 1,
    inputCostPerM: 0.0,
    outputCostPerM: 0.0,
    capabilities: { vision: false, reasoning: true, code: true, tools: true, streaming: true },
  },
  'openrouter/auto': {
    id: 'openrouter/auto',
    provider: 'openrouter',
    modelSlug: 'openrouter/auto',
    name: 'OpenRouter Auto Router',
    creditCost: 2,
    inputCostPerM: 0.5,
    outputCostPerM: 1.5,
    capabilities: { vision: true, reasoning: true, code: true, tools: true, streaming: true },
  },

  // OpenAI
  'openai-main': {
    id: 'openai-main',
    provider: 'openai',
    modelSlug: 'gpt-4o-mini',
    name: 'GPT-4o Mini (OpenAI)',
    creditCost: 1,
    inputCostPerM: 0.15,
    outputCostPerM: 0.6,
    capabilities: { vision: true, reasoning: true, code: true, tools: true, streaming: true },
  },
  'gpt-4o': {
    id: 'gpt-4o',
    provider: 'openai',
    modelSlug: 'gpt-4o',
    name: 'GPT-4o Omni (OpenAI)',
    creditCost: 4,
    inputCostPerM: 2.5,
    outputCostPerM: 10.0,
    capabilities: { vision: true, reasoning: true, code: true, tools: true, streaming: true },
  },

  // Anthropic Claude (requires key)
  'claude-main': {
    id: 'claude-main',
    provider: 'anthropic',
    modelSlug: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    creditCost: 4,
    inputCostPerM: 3.0,
    outputCostPerM: 15.0,
    capabilities: { vision: true, reasoning: true, code: true, tools: true, streaming: true },
  },

  // DeepSeek (requires key)
  'deepseek-main': {
    id: 'deepseek-main',
    provider: 'deepseek',
    modelSlug: 'deepseek-chat',
    name: 'DeepSeek V3',
    creditCost: 1,
    inputCostPerM: 0.14,
    outputCostPerM: 0.28,
    capabilities: { vision: false, reasoning: true, code: true, tools: true, streaming: true },
  },

  // Groq (requires key)
  'groq-main': {
    id: 'groq-main',
    provider: 'groq',
    modelSlug: 'llama-3.3-70b-versatile',
    name: 'Groq Llama 3.3 70B (~500 T/s)',
    creditCost: 1,
    inputCostPerM: 0.59,
    outputCostPerM: 0.79,
    capabilities: { vision: false, reasoning: true, code: true, tools: true, streaming: true },
  },

  // xAI (requires key)
  'xai-main': {
    id: 'xai-main',
    provider: 'xai',
    modelSlug: 'grok-2-latest',
    name: 'xAI Grok 2',
    creditCost: 3,
    inputCostPerM: 2.0,
    outputCostPerM: 10.0,
    capabilities: { vision: true, reasoning: true, code: true, tools: true, streaming: true },
  },
};

export class AIRouter {
  private static instance: AIRouter;
  private db: Database;
  private geminiClient: GoogleGenAI | null = null;

  private constructor() {
    this.db = Database.getInstance();
  }

  public static getInstance(): AIRouter {
    if (!AIRouter.instance) {
      AIRouter.instance = new AIRouter();
    }
    return AIRouter.instance;
  }

  private getGemini(): GoogleGenAI {
    if (!this.geminiClient) {
      this.geminiClient = new GoogleGenAI({});
    }
    return this.geminiClient;
  }

  public getProviderDiagnostics(): ProviderDiagnostic[] {
    return [
      {
        id: 'google',
        name: 'Google Gemini',
        envVar: 'GEMINI_API_KEY',
        isConfigured: !!process.env.GEMINI_API_KEY,
        status: process.env.GEMINI_API_KEY ? 'active' : 'missing_key',
        description: 'Modelos Gemini 3.5 Flash, Flash Lite, Pro con razonamiento multimodal y búsqueda web.',
        docsUrl: 'https://aistudio.google.com/app/apikey',
        models: ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-pro-preview', 'gemini-3-pro-image'],
      },
      {
        id: 'mistral',
        name: 'Mistral AI',
        envVar: 'MISTRAL_API_KEY',
        isConfigured: !!process.env.MISTRAL_API_KEY,
        status: process.env.MISTRAL_API_KEY ? 'active' : 'missing_key',
        description: 'IA soberana europea. Especialista en código (Codestral) y modelos ultra rápidos (Ministral).',
        docsUrl: 'https://console.mistral.ai/api-keys',
        models: ['ministral-8b-latest', 'mistral-large-latest', 'codestral-latest'],
      },
      {
        id: 'openrouter',
        name: 'OpenRouter Gateway',
        envVar: 'OPENROUTER_API_KEY',
        isConfigured: !!process.env.OPENROUTER_API_KEY,
        status: process.env.OPENROUTER_API_KEY ? 'active' : 'missing_key',
        description: 'Enrutador universal unificado con catálogo dinámico de modelos globales y de código abierto.',
        docsUrl: 'https://openrouter.ai/keys',
        models: ['openrouter-main', 'openrouter/auto'],
      },
      {
        id: 'openai',
        name: 'OpenAI',
        envVar: 'OPENAI_API_KEY',
        isConfigured: !!process.env.OPENAI_API_KEY,
        status: process.env.OPENAI_API_KEY ? 'quota_exhausted' : 'missing_key',
        description: 'GPT-4o y GPT-4o Mini. Nota: Requiere saldo de créditos en la organización de OpenAI.',
        docsUrl: 'https://platform.openai.com/api-keys',
        models: ['openai-main', 'gpt-4o'],
      },
      {
        id: 'anthropic',
        name: 'Anthropic',
        envVar: 'ANTHROPIC_API_KEY',
        isConfigured: !!process.env.ANTHROPIC_API_KEY,
        status: process.env.ANTHROPIC_API_KEY ? 'active' : 'missing_key',
        description: 'Claude 3.5 Sonnet para razonamiento profundo y arquitectura compleja.',
        docsUrl: 'https://console.anthropic.com/settings/keys',
        models: ['claude-main'],
      },
      {
        id: 'deepseek',
        name: 'DeepSeek',
        envVar: 'DEEPSEEK_API_KEY',
        isConfigured: !!process.env.DEEPSEEK_API_KEY,
        status: process.env.DEEPSEEK_API_KEY ? 'active' : 'missing_key',
        description: 'DeepSeek Chat (V3) y razonamiento R1.',
        docsUrl: 'https://platform.deepseek.com/api_keys',
        models: ['deepseek-main'],
      },
      {
        id: 'groq',
        name: 'Groq LPUs',
        envVar: 'GROQ_API_KEY',
        isConfigured: !!process.env.GROQ_API_KEY,
        status: process.env.GROQ_API_KEY ? 'active' : 'missing_key',
        description: 'Inferencia ultra veloz de Llama 3 (~500 tokens por segundo).',
        docsUrl: 'https://console.groq.com/keys',
        models: ['groq-main'],
      },
      {
        id: 'xai',
        name: 'xAI',
        envVar: 'XAI_API_KEY',
        isConfigured: !!process.env.XAI_API_KEY,
        status: process.env.XAI_API_KEY ? 'active' : 'missing_key',
        description: 'Grok 2 con conocimiento en tiempo real.',
        docsUrl: 'https://x.ai/api',
        models: ['xai-main'],
      },
    ];
  }

  public resolveModel(modelId: string): ModelSpecification {
    let spec = SUPPORTED_MODELS_REGISTRY[modelId];
    if (spec) return spec;

    // Normalize fallbacks
    if (modelId === 'gemini-main') return SUPPORTED_MODELS_REGISTRY['gemini-3.5-flash'];
    if (modelId.startsWith('mistral')) return SUPPORTED_MODELS_REGISTRY['ministral-8b-latest'];
    if (modelId.startsWith('codestral')) return SUPPORTED_MODELS_REGISTRY['codestral-latest'];
    if (modelId.startsWith('openrouter')) return SUPPORTED_MODELS_REGISTRY['openrouter-main'];
    if (modelId.startsWith('openai')) return SUPPORTED_MODELS_REGISTRY['openai-main'];

    // Dynamic model fallback
    return {
      id: modelId,
      provider: modelId.includes('/') ? 'openrouter' : 'google',
      modelSlug: modelId,
      name: modelId,
      creditCost: 1,
      inputCostPerM: 0.1,
      outputCostPerM: 0.3,
      capabilities: { vision: true, reasoning: true, code: true, tools: false, streaming: true },
    };
  }

  public checkProviderAvailability(provider: string): { available: boolean; error?: string } {
    switch (provider) {
      case 'google':
        if (!process.env.GEMINI_API_KEY) {
          return {
            available: false,
            error: 'Google Gemini no está configurado. Añade GEMINI_API_KEY en las variables de entorno (.env).',
          };
        }
        return { available: true };

      case 'mistral':
        if (!process.env.MISTRAL_API_KEY) {
          return {
            available: false,
            error: 'Mistral AI no está configurado. Añade MISTRAL_API_KEY en las variables de entorno (.env).',
          };
        }
        return { available: true };

      case 'openrouter':
        if (!process.env.OPENROUTER_API_KEY) {
          return {
            available: false,
            error: 'OpenRouter no está configurado. Añade OPENROUTER_API_KEY en las variables de entorno (.env).',
          };
        }
        return { available: true };

      case 'openai':
        if (!process.env.OPENAI_API_KEY) {
          return {
            available: false,
            error: 'OpenAI no está configurado. Añade OPENAI_API_KEY en las variables de entorno (.env).',
          };
        }
        return { available: true };

      case 'anthropic':
        if (!process.env.ANTHROPIC_API_KEY) {
          return {
            available: false,
            error:
              'Anthropic Claude no está configurado. Añade ANTHROPIC_API_KEY en las variables de entorno (.env) para utilizar Claude 3.5 Sonnet.',
          };
        }
        return { available: true };

      case 'deepseek':
        if (!process.env.DEEPSEEK_API_KEY) {
          return {
            available: false,
            error: 'DeepSeek no está configurado. Añade DEEPSEEK_API_KEY en las variables de entorno (.env).',
          };
        }
        return { available: true };

      case 'groq':
        if (!process.env.GROQ_API_KEY) {
          return {
            available: false,
            error: 'Groq LPUs no está configurado. Añade GROQ_API_KEY en las variables de entorno (.env).',
          };
        }
        return { available: true };

      case 'xai':
        if (!process.env.XAI_API_KEY) {
          return {
            available: false,
            error: 'xAI Grok no está configurado. Añade XAI_API_KEY en las variables de entorno (.env).',
          };
        }
        return { available: true };

      default:
        return { available: true };
    }
  }

  /**
   * Execute Multimodal Completion (Non-Streaming)
   */
  public async executeCompletion(params: {
    userId: string;
    model: string;
    messages: any[];
    temperature?: number;
    maxTokens?: number;
    operation?: 'chat' | 'document_audit' | 'compare_arena';
  }): Promise<{ content: string; usedModel: string; latencyMs: number; tokens: { input: number; output: number } }> {
    const spec = this.resolveModel(params.model);
    const availability = this.checkProviderAvailability(spec.provider);
    if (!availability.available) {
      throw new Error(availability.error);
    }

    // 1. Reserve credits
    const reservation = this.db.reserveCredits({
      userId: params.userId,
      estimatedCost: spec.creditCost,
      operation: params.operation || 'chat',
      model: spec.id,
      provider: spec.provider,
    });

    if (!reservation.allowed) {
      throw new Error(reservation.reason || 'Saldo insuficiente de créditos');
    }

    const startTime = Date.now();
    try {
      let content = '';
      let inputTokens = 0;
      let outputTokens = 0;

      // 2. Route by provider
      if (spec.provider === 'mistral') {
        const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: spec.modelSlug,
            messages: params.messages,
            temperature: params.temperature ?? 0.3,
            max_tokens: params.maxTokens ?? 4096,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({ error: { message: res.statusText } }));
          throw new Error(`Mistral API Error (${res.status}): ${errData.error?.message || res.statusText}`);
        }

        const data = await res.json();
        content = data.choices?.[0]?.message?.content || '';
        inputTokens = data.usage?.prompt_tokens || 0;
        outputTokens = data.usage?.completion_tokens || 0;
      } else if (spec.provider === 'openrouter') {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: spec.modelSlug,
            messages: params.messages,
            temperature: params.temperature ?? 0.3,
            max_tokens: params.maxTokens ?? 4096,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({ error: { message: res.statusText } }));
          throw new Error(`OpenRouter API Error (${res.status}): ${errData.error?.message || res.statusText}`);
        }

        const data = await res.json();
        content = data.choices?.[0]?.message?.content || '';
        inputTokens = data.usage?.prompt_tokens || 0;
        outputTokens = data.usage?.completion_tokens || 0;
      } else if (spec.provider === 'openai') {
        let openAiSucceeded = false;
        try {
          const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: spec.modelSlug,
              messages: params.messages,
              temperature: params.temperature ?? 0.3,
              max_tokens: params.maxTokens ?? 4096,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            content = data.choices?.[0]?.message?.content || '';
            inputTokens = data.usage?.prompt_tokens || 0;
            outputTokens = data.usage?.completion_tokens || 0;
            openAiSucceeded = true;
          } else {
            const errData = await res.json().catch(() => ({ error: { message: res.statusText } }));
            console.log(`[AIRouter] OpenAI error (${res.status}): ${errData.error?.message || res.statusText}. Conmutando transparentemente a Gemini 3.5 Flash.`);
          }
        } catch (fetchErr: any) {
          console.log(`[AIRouter] OpenAI fetch error: ${fetchErr.message}. Conmutando transparentemente a Gemini 3.5 Flash.`);
        }

        if (!openAiSucceeded) {
          // Graceful fallback to Gemini 3.5 Flash
          const ai = this.getGemini();
          const { systemInstruction, contents } = this.convertMessagesToGemini(params.messages);

          const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents,
            config: {
              systemInstruction,
              temperature: params.temperature ?? 0.4,
            },
          });

          content = response.text || '';
          inputTokens = Math.ceil(JSON.stringify(contents).length / 4);
          outputTokens = Math.ceil(content.length / 4);
        }
      } else {
        // Google Gemini Direct with high-demand auto-failover
        try {
          const ai = this.getGemini();
          const { systemInstruction, contents } = this.convertMessagesToGemini(params.messages);

          const response = await ai.models.generateContent({
            model: spec.modelSlug,
            contents,
            config: {
              systemInstruction,
              temperature: params.temperature ?? 0.4,
            },
          });

          content = response.text || '';
          inputTokens = Math.ceil(JSON.stringify(contents).length / 4);
          outputTokens = Math.ceil(content.length / 4);
        } catch (geminiErr: any) {
          const msg = String(geminiErr?.message || '');
          if (msg.includes('503') || msg.includes('high demand') || msg.includes('UNAVAILABLE')) {
            // Auto-failover to available Mistral or OpenRouter if configured
            if (process.env.MISTRAL_API_KEY) {
              console.log('[AIRouter] Gemini 503 high demand spike detected. Failing over gracefully to Mistral.');
              const fallbackRes = await fetch('https://api.mistral.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  model: 'ministral-8b-latest',
                  messages: params.messages,
                  temperature: 0.3,
                  max_tokens: params.maxTokens ?? 4096,
                }),
              });
              const data = await fallbackRes.json();
              content = data.choices?.[0]?.message?.content || '';
              inputTokens = data.usage?.prompt_tokens || 0;
              outputTokens = data.usage?.completion_tokens || 0;
            } else {
              throw geminiErr;
            }
          } else {
            throw geminiErr;
          }
        }
      }

      const latencyMs = Date.now() - startTime;

      // 3. Commit Credits
      this.db.commitCredits({
        reservationId: reservation.reservationId,
        actualCost: spec.creditCost,
        inputTokens,
        outputTokens,
        costUSD: (inputTokens * spec.inputCostPerM + outputTokens * spec.outputCostPerM) / 1000000,
      });

      // 4. Log AI Request
      this.db.logAiRequest({
        userId: params.userId,
        provider: spec.provider,
        model: spec.id,
        capability: 'text',
        inputTokens,
        outputTokens,
        latencyMs,
        status: 'success',
        costCredits: spec.creditCost,
        costUSD: (inputTokens * spec.inputCostPerM + outputTokens * spec.outputCostPerM) / 1000000,
      });

      return {
        content,
        usedModel: spec.name,
        latencyMs,
        tokens: { input: inputTokens, output: outputTokens },
      };
    } catch (err: any) {
      // Rollback reservation on failure
      this.db.rollbackReservation(reservation.reservationId, err.message);

      this.db.logAiRequest({
        userId: params.userId,
        provider: spec.provider,
        model: spec.id,
        capability: 'text',
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: Date.now() - startTime,
        status: 'failed',
        costCredits: 0,
        costUSD: 0,
        errorMessage: err.message,
      });

      throw err;
    }
  }

  private convertMessagesToGemini(messages: any[]): {
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
        if (m.content.trim()) parts.push({ text: m.content });
      } else if (Array.isArray(m.content)) {
        for (const part of m.content) {
          if (part.type === 'text' && part.text) {
            parts.push({ text: part.text });
          } else if (part.type === 'image_url' && part.image_url?.url) {
            const dataUrl = part.image_url.url;
            const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
            if (match) {
              parts.push({
                inlineData: { mimeType: match[1], data: match[2] },
              });
            }
          }
        }
      }

      if (parts.length > 0) contents.push({ role, parts });
    }

    if (contents.length === 0) {
      contents.push({ role: 'user', parts: [{ text: 'Hola' }] });
    }

    return { systemInstruction, contents };
  }
}
