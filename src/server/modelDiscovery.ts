export interface AIModelMetadata {
  id: string;
  name: string;
  shortName: string;
  provider: 'Google' | 'OpenAI' | 'Anthropic' | 'DeepSeek' | 'Groq' | 'Meta' | 'Mistral' | 'xAI' | 'OpenRouter' | 'Cohere' | 'NVIDIA' | 'HuggingFace';
  family: string;
  description: string;
  contextWindow: number; // in tokens
  maxOutputTokens: number;
  modalities: ('text' | 'image' | 'audio' | 'video' | 'code')[];
  capabilities: {
    vision: boolean;
    functionCalling: boolean;
    structuredOutput: boolean;
    reasoning: boolean;
    codeSpecialized: boolean;
    webSearch: boolean;
  };
  pricing: {
    inputPerMillionUSD: number;
    outputPerMillionUSD: number;
    isFreeTierAvailable: boolean;
  };
  speedRating: 'ultra-fast' | 'fast' | 'balanced' | 'deep-thinking';
  tokensPerSecEstimate: number;
  status: 'active' | 'configured' | 'key_required';
  badges: ('recommended' | 'fastest' | 'cheapest' | 'reasoning' | 'multimodal' | 'new')[];
  isDefault?: boolean;
}

export const VERIFIED_MODEL_REGISTRY: AIModelMetadata[] = [
  // 1. Google Gemini Models
  {
    id: 'gemini-3.8-flash',
    name: 'Google Gemini 3.8 Flash',
    shortName: 'Gemini 3.8 Flash',
    provider: 'Google',
    family: 'Gemini 3',
    description: 'Motor de última generación optimizado para velocidad, razonamiento multimodal, código y grounding web en tiempo real.',
    contextWindow: 1048576, // 1M tokens
    maxOutputTokens: 8192,
    modalities: ['text', 'image', 'audio', 'video', 'code'],
    capabilities: {
      vision: true,
      functionCalling: true,
      structuredOutput: true,
      reasoning: true,
      codeSpecialized: true,
      webSearch: true,
    },
    pricing: {
      inputPerMillionUSD: 0.075,
      outputPerMillionUSD: 0.30,
      isFreeTierAvailable: true,
    },
    speedRating: 'ultra-fast',
    tokensPerSecEstimate: 210,
    status: 'active',
    badges: ['recommended', 'fastest', 'multimodal'],
    isDefault: true,
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Google Gemini 3.1 Pro (Deep Reasoning)',
    shortName: 'Gemini 3.1 Pro',
    provider: 'Google',
    family: 'Gemini 3',
    description: 'Máxima potencia para arquitectura compleja, matemática avanzada, análisis profundo y refactorización masiva.',
    contextWindow: 2097152, // 2M tokens
    maxOutputTokens: 8192,
    modalities: ['text', 'image', 'audio', 'video', 'code'],
    capabilities: {
      vision: true,
      functionCalling: true,
      structuredOutput: true,
      reasoning: true,
      codeSpecialized: true,
      webSearch: true,
    },
    pricing: {
      inputPerMillionUSD: 1.25,
      outputPerMillionUSD: 5.00,
      isFreeTierAvailable: false,
    },
    speedRating: 'deep-thinking',
    tokensPerSecEstimate: 75,
    status: 'configured',
    badges: ['reasoning'],
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Google Gemini 3.1 Flash Lite',
    shortName: 'Gemini Lite',
    provider: 'Google',
    family: 'Gemini 3',
    description: 'Ultra ligero, diseñado para micro-ediciones, transformaciones de texto instantáneas y alta concurrencia.',
    contextWindow: 1048576,
    maxOutputTokens: 4096,
    modalities: ['text', 'image', 'code'],
    capabilities: {
      vision: true,
      functionCalling: true,
      structuredOutput: true,
      reasoning: false,
      codeSpecialized: true,
      webSearch: true,
    },
    pricing: {
      inputPerMillionUSD: 0.0375,
      outputPerMillionUSD: 0.15,
      isFreeTierAvailable: true,
    },
    speedRating: 'ultra-fast',
    tokensPerSecEstimate: 290,
    status: 'configured',
    badges: ['fastest', 'cheapest'],
  },

  // 2. OpenAI Models
  {
    id: 'openai-main',
    name: 'OpenAI GPT-4o (Omni)',
    shortName: 'GPT-4o',
    provider: 'OpenAI',
    family: 'GPT-4',
    description: 'El modelo insignia multimodal de OpenAI, optimizado para razonamiento de alto nivel, lógica y código estricto.',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    modalities: ['text', 'image', 'code'],
    capabilities: {
      vision: true,
      functionCalling: true,
      structuredOutput: true,
      reasoning: true,
      codeSpecialized: true,
      webSearch: false,
    },
    pricing: {
      inputPerMillionUSD: 2.50,
      outputPerMillionUSD: 10.00,
      isFreeTierAvailable: false,
    },
    speedRating: 'fast',
    tokensPerSecEstimate: 110,
    status: 'configured',
    badges: ['recommended'],
  },
  {
    id: 'gpt-4o-mini',
    name: 'OpenAI GPT-4o Mini',
    shortName: 'GPT-4o Mini',
    provider: 'OpenAI',
    family: 'GPT-4',
    description: 'Versión compacta y económica con excelente balance de velocidad y capacidades analíticas.',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    modalities: ['text', 'image', 'code'],
    capabilities: {
      vision: true,
      functionCalling: true,
      structuredOutput: true,
      reasoning: false,
      codeSpecialized: true,
      webSearch: false,
    },
    pricing: {
      inputPerMillionUSD: 0.15,
      outputPerMillionUSD: 0.60,
      isFreeTierAvailable: false,
    },
    speedRating: 'ultra-fast',
    tokensPerSecEstimate: 180,
    status: 'configured',
    badges: ['cheapest'],
  },

  // 3. Anthropic Claude Models
  {
    id: 'claude-main',
    name: 'Anthropic Claude 3.5 Sonnet',
    shortName: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    family: 'Claude 3.5',
    description: 'Líder en generación de código, comprensión arquitectónica de software y redacción técnica de alta fidelidad.',
    contextWindow: 200000,
    maxOutputTokens: 8192,
    modalities: ['text', 'image', 'code'],
    capabilities: {
      vision: true,
      functionCalling: true,
      structuredOutput: true,
      reasoning: true,
      codeSpecialized: true,
      webSearch: false,
    },
    pricing: {
      inputPerMillionUSD: 3.00,
      outputPerMillionUSD: 15.00,
      isFreeTierAvailable: false,
    },
    speedRating: 'fast',
    tokensPerSecEstimate: 95,
    status: 'configured',
    badges: ['recommended', 'reasoning'],
  },

  // 4. DeepSeek Models
  {
    id: 'deepseek-main',
    name: 'DeepSeek Chat (V3)',
    shortName: 'DeepSeek V3',
    provider: 'DeepSeek',
    family: 'DeepSeek-V3',
    description: 'Modelo MoE de 671B parámetros (37B activos), altamente competitivo en programación, matemáticas e ingeniería.',
    contextWindow: 64000,
    maxOutputTokens: 8192,
    modalities: ['text', 'code'],
    capabilities: {
      vision: false,
      functionCalling: true,
      structuredOutput: true,
      reasoning: true,
      codeSpecialized: true,
      webSearch: false,
    },
    pricing: {
      inputPerMillionUSD: 0.14,
      outputPerMillionUSD: 0.28,
      isFreeTierAvailable: false,
    },
    speedRating: 'fast',
    tokensPerSecEstimate: 85,
    status: 'configured',
    badges: ['cheapest', 'reasoning'],
  },

  // 5. Groq LPU Models
  {
    id: 'groq-main',
    name: 'Groq LPU — GPT OSS 20B / Llama',
    shortName: 'Groq LPU',
    provider: 'Groq',
    family: 'LPU Inference',
    description: 'Inferencia a velocidad récord (~500 tokens/s) mediante unidades de procesamiento de lenguaje por hardware dedicado (LPU).',
    contextWindow: 131072,
    maxOutputTokens: 65536,
    modalities: ['text', 'code'],
    capabilities: {
      vision: false,
      functionCalling: true,
      structuredOutput: true,
      reasoning: true,
      codeSpecialized: true,
      webSearch: false,
    },
    pricing: {
      inputPerMillionUSD: 0.075,
      outputPerMillionUSD: 0.30,
      isFreeTierAvailable: true,
    },
    speedRating: 'ultra-fast',
    tokensPerSecEstimate: 480,
    status: 'configured',
    badges: ['fastest', 'recommended'],
  },

  // 6. Mistral AI Models
  {
    id: 'mistral-main',
    name: 'Mistral Large 2 / Codestral',
    shortName: 'Mistral Large',
    provider: 'Mistral',
    family: 'Mistral',
    description: 'IA soberana europea con razonamiento multilingüe superior, razonamiento de código de vanguardia y baja latencia.',
    contextWindow: 128000,
    maxOutputTokens: 8192,
    modalities: ['text', 'code'],
    capabilities: {
      vision: false,
      functionCalling: true,
      structuredOutput: true,
      reasoning: true,
      codeSpecialized: true,
      webSearch: false,
    },
    pricing: {
      inputPerMillionUSD: 2.00,
      outputPerMillionUSD: 6.00,
      isFreeTierAvailable: false,
    },
    speedRating: 'fast',
    tokensPerSecEstimate: 120,
    status: 'configured',
    badges: ['recommended'],
  },

  // 7. xAI Grok Models
  {
    id: 'xai-main',
    name: 'xAI Grok 2',
    shortName: 'xAI Grok 2',
    provider: 'xAI',
    family: 'Grok',
    description: 'Modelo directo y sin rodeos con excelente comprensión contextual y razonamiento agudo.',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    modalities: ['text', 'image', 'code'],
    capabilities: {
      vision: true,
      functionCalling: true,
      structuredOutput: false,
      reasoning: true,
      codeSpecialized: true,
      webSearch: false,
    },
    pricing: {
      inputPerMillionUSD: 2.00,
      outputPerMillionUSD: 10.00,
      isFreeTierAvailable: false,
    },
    speedRating: 'fast',
    tokensPerSecEstimate: 105,
    status: 'configured',
    badges: ['new'],
  },

  // 8. OpenRouter Unified Gateway
  {
    id: 'openrouter-main',
    name: 'OpenRouter Unified Gateway',
    shortName: 'OpenRouter Auto',
    provider: 'OpenRouter',
    family: 'Multi-Model',
    description: 'Enrutador unificado global con fallback inteligente entre cientos de modelos y proveedores mundiales.',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    modalities: ['text', 'code'],
    capabilities: {
      vision: true,
      functionCalling: true,
      structuredOutput: true,
      reasoning: true,
      codeSpecialized: true,
      webSearch: false,
    },
    pricing: {
      inputPerMillionUSD: 0.80,
      outputPerMillionUSD: 1.20,
      isFreeTierAvailable: false,
    },
    speedRating: 'fast',
    tokensPerSecEstimate: 140,
    status: 'configured',
    badges: ['recommended'],
  },

  // 9. NVIDIA NIM
  {
    id: 'nvidia-main',
    name: 'NVIDIA NIM (Accelerated Inference)',
    shortName: 'NVIDIA NIM',
    provider: 'NVIDIA',
    family: 'NIM Microservices',
    description: 'Microservicios de inferencia acelerada en GPUs NVIDIA para DeepSeek, Llama y Mistral.',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    modalities: ['text', 'code'],
    capabilities: {
      vision: false,
      functionCalling: true,
      structuredOutput: true,
      reasoning: true,
      codeSpecialized: true,
      webSearch: false,
    },
    pricing: {
      inputPerMillionUSD: 0.50,
      outputPerMillionUSD: 1.00,
      isFreeTierAvailable: true,
    },
    speedRating: 'ultra-fast',
    tokensPerSecEstimate: 200,
    status: 'configured',
    badges: ['fastest'],
  },
];

export class ModelDiscoveryEngine {
  private static cache: {
    timestamp: number;
    models: AIModelMetadata[];
    source: 'litellm_proxy' | 'multi_provider_discovery' | 'registry_fallback';
  } | null = null;
  private static CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes cache

  /**
   * Discovers models dynamically from:
   * 1. LiteLLM Proxy endpoint (if active)
   * 2. Live Provider APIs (Groq, Mistral, OpenRouter, OpenAI)
   * 3. Verified internal registry (Google Gemini, Anthropic, DeepSeek, xAI, NVIDIA)
   */
  public static async discoverModels(litellmUrl?: string, masterKey?: string): Promise<{
    models: AIModelMetadata[];
    source: 'litellm_proxy' | 'multi_provider_discovery' | 'registry_fallback';
    activeProviders: Record<string, boolean>;
    timestamp: number;
    totalDiscovered: number;
  }> {
    const now = Date.now();
    if (this.cache && now - this.cache.timestamp < this.CACHE_TTL_MS) {
      return {
        models: this.cache.models,
        source: this.cache.source,
        activeProviders: this.detectActiveProviders(),
        timestamp: this.cache.timestamp,
        totalDiscovered: this.cache.models.length,
      };
    }

    const activeProviders = this.detectActiveProviders();
    const discoveredList: AIModelMetadata[] = [...VERIFIED_MODEL_REGISTRY];
    const seenIds = new Set<string>(discoveredList.map((m) => m.id.toLowerCase()));
    let primarySource: 'litellm_proxy' | 'multi_provider_discovery' | 'registry_fallback' = 'registry_fallback';

    // 1. Check LiteLLM Proxy
    const proxyBase = (litellmUrl || process.env.LITELLM_URL || 'http://127.0.0.1:4000/v1').replace(/\/+$/, '');
    const secretKey = masterKey || process.env.LITELLM_MASTER_KEY || 'sk-litellm-master-secret-key';

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1800);
      const res = await fetch(`${proxyBase}/models`, {
        signal: controller.signal,
        headers: { Authorization: `Bearer ${secretKey}` },
      });
      clearTimeout(timeout);

      if (res.ok) {
        const body = (await res.json()) as any;
        if (Array.isArray(body?.data) && body.data.length > 0) {
          primarySource = 'litellm_proxy';
          const dynamicIds = new Set<string>(body.data.map((m: any) => m.id));
          discoveredList.forEach((m) => {
            if (dynamicIds.has(m.id)) {
              m.status = 'active';
            }
          });
        }
      }
    } catch {
      // LiteLLM proxy offline
    }

    // 2. Discover live models directly from configured providers
    const discoveryPromises: Promise<AIModelMetadata[]>[] = [];

    // 2a. Groq API Discovery
    if (process.env.GROQ_API_KEY) {
      discoveryPromises.push(
        (async () => {
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 3500);
            const res = await fetch('https://api.groq.com/openai/v1/models', {
              signal: controller.signal,
              headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
            });
            clearTimeout(timeout);

            if (res.ok) {
              const data = (await res.json()) as any;
              if (Array.isArray(data?.data)) {
                return data.data
                  .filter((m: any) => m.active !== false && !m.id.includes('whisper') && !m.id.includes('guard'))
                  .map((m: any): AIModelMetadata => {
                    const ctx = m.context_window || m.context_length || 131072;
                    const maxOut = m.max_completion_tokens || m.max_output_length || 8192;
                    const isReasoning = m.supported_features?.includes('reasoning') || m.id.includes('oss');
                    return {
                      id: m.id,
                      name: m.name ? `${m.name} (Groq LPU)` : `Groq ${m.id}`,
                      shortName: m.name || m.id,
                      provider: 'Groq',
                      family: 'LPU Hardware Accelerated',
                      description: `Modelo ejecutado sobre microarquitectura Groq LPU con latencia ultra-baja y hasta 500 T/s.`,
                      contextWindow: ctx,
                      maxOutputTokens: maxOut,
                      modalities: ['text', 'code'],
                      capabilities: {
                        vision: m.input_modalities?.includes('image') || false,
                        functionCalling: m.supported_features?.includes('tools') || true,
                        structuredOutput: m.supported_features?.includes('structured_outputs') || true,
                        reasoning: isReasoning,
                        codeSpecialized: true,
                        webSearch: false,
                      },
                      pricing: {
                        inputPerMillionUSD: parseFloat(m.pricing?.prompt || '0.075') * 1000000,
                        outputPerMillionUSD: parseFloat(m.pricing?.completion || '0.30') * 1000000,
                        isFreeTierAvailable: true,
                      },
                      speedRating: 'ultra-fast',
                      tokensPerSecEstimate: 450,
                      status: 'active',
                      badges: isReasoning ? ['fastest', 'reasoning'] : ['fastest'],
                    };
                  });
              }
            }
          } catch (e: any) {
            console.warn('[Discovery Engine] Groq discovery warning:', e.message);
          }
          return [];
        })()
      );
    }

    // 2b. Mistral API Discovery
    if (process.env.MISTRAL_API_KEY) {
      discoveryPromises.push(
        (async () => {
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 3500);
            const res = await fetch('https://api.mistral.ai/v1/models', {
              signal: controller.signal,
              headers: { Authorization: `Bearer ${process.env.MISTRAL_API_KEY}` },
            });
            clearTimeout(timeout);

            if (res.ok) {
              const data = (await res.json()) as any;
              if (Array.isArray(data?.data)) {
                return data.data
                  .filter((m: any) => !m.deprecation && m.capabilities?.completion_chat)
                  .slice(0, 15) // Top relevant Mistral models
                  .map((m: any): AIModelMetadata => {
                    const ctx = m.max_context_length || 128000;
                    const isCode = m.id.includes('code') || m.id.includes('codestral');
                    const hasVision = m.capabilities?.vision || m.id.includes('pixtral');
                    return {
                      id: m.id,
                      name: `Mistral ${m.id}`,
                      shortName: m.id,
                      provider: 'Mistral',
                      family: 'Mistral Sovereign AI',
                      description: m.description || `Modelo soberano europeo de Mistral AI con capacidades avanzadas de código y lógica.`,
                      contextWindow: ctx,
                      maxOutputTokens: 8192,
                      modalities: hasVision ? ['text', 'image', 'code'] : ['text', 'code'],
                      capabilities: {
                        vision: hasVision,
                        functionCalling: m.capabilities?.function_calling ?? true,
                        structuredOutput: true,
                        reasoning: m.capabilities?.reasoning || false,
                        codeSpecialized: isCode,
                        webSearch: false,
                      },
                      pricing: {
                        inputPerMillionUSD: isCode ? 1.00 : 2.00,
                        outputPerMillionUSD: isCode ? 3.00 : 6.00,
                        isFreeTierAvailable: false,
                      },
                      speedRating: 'fast',
                      tokensPerSecEstimate: 130,
                      status: 'active',
                      badges: isCode ? ['recommended', 'new'] : ['recommended'],
                    };
                  });
              }
            }
          } catch (e: any) {
            console.warn('[Discovery Engine] Mistral discovery warning:', e.message);
          }
          return [];
        })()
      );
    }

    // 2c. OpenRouter Top Models Discovery
    if (process.env.OPENROUTER_API_KEY) {
      discoveryPromises.push(
        (async () => {
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 4000);
            const res = await fetch('https://openrouter.ai/api/v1/models', {
              signal: controller.signal,
              headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` },
            });
            clearTimeout(timeout);

            if (res.ok) {
              const data = (await res.json()) as any;
              if (Array.isArray(data?.data)) {
                // Select high-profile models (Claude, DeepSeek R1, Llama 3.3, Qwen)
                const priorityPrefixes = [
                  'anthropic/claude-3.5',
                  'deepseek/deepseek-r1',
                  'meta-llama/llama-3.3-70b',
                  'qwen/qwen3',
                  'inclusionai/ling',
                  'nvidia/nemotron',
                ];

                const picked = data.data.filter((m: any) =>
                  priorityPrefixes.some((p) => m.id.startsWith(p)) ||
                  (m.pricing?.prompt === '0' && m.id.endsWith(':free'))
                ).slice(0, 12);

                return picked.map((m: any): AIModelMetadata => {
                  const isFree = m.pricing?.prompt === '0';
                  const isReasoning = m.reasoning?.default_enabled || m.id.includes('r1');
                  return {
                    id: m.id,
                    name: `${m.name || m.id} (OpenRouter)`,
                    shortName: m.name ? m.name.split(':')[0] : m.id,
                    provider: 'OpenRouter',
                    family: 'OpenRouter Distributed',
                    description: m.description || `Modelo global enrutado dinámicamente a través de OpenRouter.`,
                    contextWindow: m.context_length || 128000,
                    maxOutputTokens: m.top_provider?.max_completion_tokens || 8192,
                    modalities: ['text', 'code'],
                    capabilities: {
                      vision: m.architecture?.input_modalities?.includes('image') || false,
                      functionCalling: m.supported_parameters?.includes('tools') || false,
                      structuredOutput: true,
                      reasoning: isReasoning,
                      codeSpecialized: m.id.includes('code') || m.id.includes('coder'),
                      webSearch: false,
                    },
                    pricing: {
                      inputPerMillionUSD: parseFloat(m.pricing?.prompt || '0') * 1000000,
                      outputPerMillionUSD: parseFloat(m.pricing?.completion || '0') * 1000000,
                      isFreeTierAvailable: isFree,
                    },
                    speedRating: isFree ? 'balanced' : 'fast',
                    tokensPerSecEstimate: 120,
                    status: 'active',
                    badges: isFree ? ['cheapest'] : isReasoning ? ['reasoning', 'recommended'] : ['recommended'],
                  };
                });
              }
            }
          } catch (e: any) {
            console.warn('[Discovery Engine] OpenRouter discovery warning:', e.message);
          }
          return [];
        })()
      );
    }

    // Await all live discoveries
    if (discoveryPromises.length > 0) {
      const results = await Promise.allSettled(discoveryPromises);
      for (const res of results) {
        if (res.status === 'fulfilled' && res.value.length > 0) {
          primarySource = 'multi_provider_discovery';
          for (const discoveredModel of res.value) {
            const lowerId = discoveredModel.id.toLowerCase();
            if (!seenIds.has(lowerId)) {
              seenIds.add(lowerId);
              discoveredList.push(discoveredModel);
            }
          }
        }
      }
    }

    // Refresh model status flags based on verified active provider keys
    const finalModels = discoveredList.map((model) => {
      const providerKey = model.provider.toLowerCase();
      const hasKey =
        activeProviders[providerKey] ||
        (model.provider === 'Google' && !!process.env.GEMINI_API_KEY) ||
        (model.provider === 'OpenRouter' && !!process.env.OPENROUTER_API_KEY) ||
        (model.provider === 'Groq' && !!process.env.GROQ_API_KEY) ||
        (model.provider === 'Mistral' && !!process.env.MISTRAL_API_KEY);

      return {
        ...model,
        status: hasKey ? ('active' as const) : ('key_required' as const),
      };
    });

    this.cache = {
      timestamp: now,
      models: finalModels,
      source: primarySource,
    };

    return {
      models: finalModels,
      source: primarySource,
      activeProviders,
      timestamp: now,
      totalDiscovered: finalModels.length,
    };
  }

  public static clearCache(): void {
    this.cache = null;
  }

  public static detectActiveProviders(): Record<string, boolean> {
    return {
      google: !!process.env.GEMINI_API_KEY,
      openai: !!process.env.OPENAI_API_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      deepseek: !!process.env.DEEPSEEK_API_KEY,
      groq: !!process.env.GROQ_API_KEY,
      mistral: !!process.env.MISTRAL_API_KEY,
      xai: !!process.env.XAI_API_KEY,
      openrouter: !!process.env.OPENROUTER_API_KEY,
      cohere: !!process.env.COHERE_API_KEY,
      nvidia: !!(process.env.NVIDIA_NIM_API_KEY || process.env.NVIDIA_API_KEY),
      huggingface: !!(process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN),
    };
  }
}
