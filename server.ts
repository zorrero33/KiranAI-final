import express, { type Request, type Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';
import { LiteLLMManager } from './src/server/litellmManager.ts';
import { ModelDiscoveryEngine } from './src/server/modelDiscovery.ts';
import { UsageManager, PLAN_CONFIGS } from './src/server/usageManager.ts';
import { UserStore } from './src/server/userStore.ts';
import { StripeManager } from './src/server/stripeManager.ts';
import { Database } from './src/server/db/database.ts';
import { AIRouter } from './src/server/aiRouter.ts';

dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Iframe & Cross-Origin Security Configuration for Safari / iOS Preview Embeds
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.removeHeader('X-Frame-Options');
  next();
});

// Initialize Singletons
const db = Database.getInstance();
const aiRouter = AIRouter.getInstance();
const litellm = LiteLLMManager.getInstance();
const usageManager = UsageManager.getInstance();
const userStore = UserStore.getInstance();
const stripeManager = StripeManager.getInstance();

// 0. Stripe Webhook Endpoint (Requires raw body buffer for cryptographically verified signature)
app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    try {
      const result = await stripeManager.handleWebhook(req.body, sig);
      res.json(result);
    } catch (err: any) {
      console.warn('[Stripe Webhook Warning]:', err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);

// Middleware for parsing JSON with a generous limit for multimodal payloads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper: Normalize model IDs from legacy or new formats
function normalizeModel(modelId?: string): string {
  if (!modelId) return 'gemini-main';
  if (modelId === 'gemini-3.8-flash') return 'gemini-main';
  if (modelId === 'gemini-3.1-flash-lite') return 'gemini-3.1-flash-lite';
  if (modelId === 'gemini-3.1-pro-preview') return 'gemini-pro';
  return modelId;
}

// 0.1 SEO & Crawlers: robots.txt and sitemap.xml
app.get('/robots.txt', (_req: Request, res: Response) => {
  const robotsPath = path.resolve(__dirname, 'public/robots.txt');
  if (fs.existsSync(robotsPath)) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.sendFile(robotsPath);
  }
  res.type('text/plain').send('User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: https://kiranai.web.app/sitemap.xml');
});

app.get('/sitemap.xml', (_req: Request, res: Response) => {
  const sitemapPath = path.resolve(__dirname, 'public/sitemap.xml');
  if (fs.existsSync(sitemapPath)) {
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.sendFile(sitemapPath);
  }
  res.status(404).send('Not Found');
});

// 0.2 Real-time System & Production Health API
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    productionUrl: 'https://kiranai.web.app',
    timestamp: Date.now(),
    uptime: Math.floor(process.uptime()),
    database: db.isFirestoreConnected() ? 'Firestore (Google Cloud)' : 'persistent_json_ledger',
    firestore: {
      connected: db.isFirestoreConnected(),
      target: 'Google Cloud Firestore',
      projectId: 'proven-script-460720-j1',
    },
    version: '1.2.0',
    platform: 'Google Cloud Run (europe-west2)',
  });
});

// 1. System Status API (Includes LiteLLM Proxy Status & Providers)
app.get('/api/status', async (_req: Request, res: Response) => {
  const litellmStatus = await litellm.getStatus();

  res.json({
    name: 'KiranIA OS',
    version: '1.2.0-LITELLM',
    status: litellmStatus.online ? 'ONLINE' : 'DEGRADED',
    gateway: 'LiteLLM Universal Proxy',
    litellm: {
      online: litellmStatus.online,
      proxyUrl: litellmStatus.url,
      managedLocally: litellmStatus.managedLocally,
      masterKeyConfigured: litellmStatus.masterKeyConfigured,
      providers: litellmStatus.configuredProviders,
    },
    hasApiKey:
      litellmStatus.configuredProviders.gemini ||
      litellmStatus.configuredProviders.openai ||
      litellmStatus.configuredProviders.anthropic ||
      litellmStatus.configuredProviders.deepseek ||
      litellmStatus.configuredProviders.openrouter ||
      litellmStatus.configuredProviders.groq,
    runtime: 'Node.js + Express + LiteLLM Proxy',
    activeModelDefault: 'gemini-main',
    supportedModels: [
      {
        id: 'gemini-main',
        name: 'Gemini 3.8 Flash (via LiteLLM)',
        shortName: 'Gemini Flash',
        provider: 'Google',
        tier: litellmStatus.configuredProviders.gemini ? 'Active (Configured)' : 'Missing GEMINI_API_KEY',
        capabilities: ['Fast Reasoning', 'Coding', 'Multimodal', 'Instant Fallback'],
        isDefault: true,
      },
      {
        id: 'openai-main',
        name: 'GPT-4o (via LiteLLM)',
        shortName: 'GPT-4o',
        provider: 'OpenAI',
        tier: litellmStatus.configuredProviders.openai ? 'Failover Active (Gemini)' : 'Missing OPENAI_API_KEY',
        capabilities: ['High Precision', 'Complex Coding', 'Deep Analysis'],
        isDefault: false,
      },
      {
        id: 'claude-main',
        name: 'Claude 3.5 Sonnet (via LiteLLM)',
        shortName: 'Claude Sonnet',
        provider: 'Anthropic',
        tier: litellmStatus.configuredProviders.anthropic ? 'Active (Configured)' : 'Missing ANTHROPIC_API_KEY',
        capabilities: ['Deep Architecture', 'Natural Prose', 'Refactoring'],
        isDefault: false,
      },
      {
        id: 'deepseek-main',
        name: 'DeepSeek Chat / V3 (via LiteLLM)',
        shortName: 'DeepSeek',
        provider: 'DeepSeek',
        tier: litellmStatus.configuredProviders.deepseek ? 'Active (Configured)' : 'Missing DEEPSEEK_API_KEY',
        capabilities: ['Open Weights', 'Advanced Code Reasoning', 'Math'],
        isDefault: false,
      },
      {
        id: 'openrouter-main',
        name: 'OpenRouter Unified Gateway',
        shortName: 'OpenRouter',
        provider: 'OpenRouter',
        tier: litellmStatus.configuredProviders.openrouter ? 'Active (Configured)' : 'Missing OPENROUTER_API_KEY',
        capabilities: ['Multi-Provider', 'Global Routing', 'Community Models'],
        isDefault: false,
      },
      {
        id: 'groq-main',
        name: 'Llama 3.3 70B (via Groq)',
        shortName: 'Groq Llama',
        provider: 'Groq',
        tier: litellmStatus.configuredProviders.groq ? 'Active (Configured)' : 'Missing GROQ_API_KEY',
        capabilities: ['Ultra-Low Latency (~500 T/s)', 'Live Execution'],
        isDefault: false,
      },
      {
        id: 'mistral-main',
        name: 'Mistral Large (via LiteLLM)',
        shortName: 'Mistral Large',
        provider: 'Mistral',
        tier: litellmStatus.configuredProviders.mistral ? 'Active (Configured)' : 'Missing MISTRAL_API_KEY',
        capabilities: ['European Sovereign AI', 'Multilingual Logic'],
        isDefault: false,
      },
      {
        id: 'xai-main',
        name: 'Grok 2 (via xAI)',
        shortName: 'xAI Grok',
        provider: 'xAI',
        tier: litellmStatus.configuredProviders.xai ? 'Active (Configured)' : 'Missing XAI_API_KEY',
        capabilities: ['Direct Reasoning', 'Real-time Knowledge'],
        isDefault: false,
      },
      {
        id: 'nvidia-main',
        name: 'DeepSeek / Llama (via NVIDIA NIM)',
        shortName: 'NVIDIA NIM',
        provider: 'NVIDIA',
        tier: litellmStatus.configuredProviders.nvidia ? 'Active (Configured)' : 'Missing NVIDIA_API_KEY',
        capabilities: ['Accelerated Inference', 'Enterprise Microservices'],
        isDefault: false,
      },
    ],
    toolIntegrations: [
      {
        id: 'litellm_gateway',
        name: 'LiteLLM Multi-Provider Proxy Gateway',
        status: litellmStatus.online ? 'CONNECTED' : 'DISCONNECTED',
        description: `Central LLM routing proxy active on ${litellmStatus.url}. Manages fallback, retries, and API keys.`,
        requiresOAuth: false,
      },
      {
        id: 'code_engine',
        name: 'KiranIA Code Architecture & Generation Engine',
        status: 'CONNECTED',
        description: 'Multi-file scaffold generator, syntax verification & code tree builder.',
        requiresOAuth: false,
      },
      {
        id: 'browser_sandbox',
        name: 'Browser Web Sandbox (HTML/CSS/JS/React)',
        status: 'CONNECTED',
        description: 'Isolated client-side runtime preview with real console logs and error capture.',
        requiresOAuth: false,
      },
      {
        id: 'document_analyzer',
        name: 'Multimodal Document & Vision Engine',
        status: 'CONNECTED',
        description: 'Direct optical understanding of images, UI screenshots, code files, CSV & JSON data via LiteLLM.',
        requiresOAuth: false,
      },
    ],
  });
});

// 1.5 Real Providers Diagnostic & Audit API
app.get('/api/providers/audit', async (_req: Request, res: Response) => {
  const diagnostics = aiRouter.getProviderDiagnostics();
  const stripeDiag = stripeManager.getDiagnostic();
  res.json({
    providers: diagnostics,
    stripe: stripeDiag,
    timestamp: Date.now(),
  });
});

// 1.6 Real User Credits & Ledger API
app.get('/api/credits', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'usr_guest';
  const credits = db.getUserCredits(userId);
  const transactions = db.listUserTransactions(userId, 30);
  res.json({
    ...credits,
    transactions,
  });
});

app.post('/api/credits/grant', (req: Request, res: Response) => {
  const { userId = 'usr_guest', amount, notes } = req.body;
  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Monto de créditos inválido.' });
  }
  const newBalance = db.grantCredits(userId, amount, notes || 'Recarga de créditos');
  res.json({ success: true, newBalance });
});

// 2. Main Chat & Agent Execution API with Server-Sent Events (SSE) routed through LiteLLM
app.post('/api/chat', async (req: Request, res: Response) => {
  const {
    messages = [],
    model = 'gemini-main',
    systemInstruction,
    enableWebSearch = false,
    files = [],
    projectContext,
    userId = 'usr_guest',
  } = req.body;

  // Set headers for SSE streaming
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  // Check quota & smart paywall
  const quotaCheck = usageManager.canUserSendMessage(userId);
  if (!quotaCheck.allowed) {
    res.write(`data: ${JSON.stringify({
      type: 'paywall_limit',
      error: quotaCheck.reason,
      plan: quotaCheck.plan,
      messagesToday: quotaCheck.messagesToday,
      limit: quotaCheck.limit,
    })}\n\n`);
    res.write(`data: [DONE]\n\n`);
    res.end();
    return;
  }

  const targetModel = normalizeModel(model);
  const modelSpec = aiRouter.resolveModel(targetModel);

  // Atomic Credits Reservation
  const reservation = db.reserveCredits({
    userId,
    estimatedCost: modelSpec.creditCost,
    operation: 'chat',
    model: modelSpec.id,
    provider: modelSpec.provider,
  });

  if (!reservation.allowed) {
    res.write(`data: ${JSON.stringify({
      type: 'paywall_limit',
      error: reservation.reason || 'Saldo insuficiente de créditos.',
      plan: quotaCheck.plan,
      messagesToday: quotaCheck.messagesToday,
      limit: quotaCheck.limit,
    })}\n\n`);
    res.write(`data: [DONE]\n\n`);
    res.end();
    return;
  }

  try {
    const defaultSystem = `You are KiranIA, a sophisticated and highly competent Personal AI Operating System and Engineering Intelligence.
Your motto: "REAL FUNCTIONALITY > APPEARANCE. If you cannot do something, state it transparently. If you can do something, prove it with real implementation."

Personality & Identity:
- Dark, futuristic, hyper-competent, precise, professional software engineer and system architect.
- All AI calls are routed through the central LiteLLM Gateway proxy.
- Respond in the language used by the user (if the user speaks in Spanish, respond in crisp, professional, futuristic Spanish).
- Communicate with authority and clarity: "Entendido.", "Arquitectura preparada.", "Construyendo archivos reales...".

Zero Fake Data (CRITICAL RULE):
- Never fabricate APIs, simulated executions, fake tests, or claim a file is created or a server is deployed when it is not.
- If an integration or API key is not configured, state it explicitly with instructions on which environment variable to provide.

When asked to create, code, or modify projects:
- Understand the user's objective and define the architectural blueprint.
- Produce COMPLETE, WORKING, REAL code files without shortcuts, placeholders, or "// implement later".
- ALWAYS format every file strictly inside explicit blocks so the KiranIA workspace can instantly extract and load them into the file tree and live sandbox:
  <<<FILE: path/to/file.ext>>>
  [complete, working file content here]
  <<<END_FILE>>>
- For web applications, always include a working index.html (with self-contained or linked scripts/styles) so the browser sandbox can execute it immediately.
- Structure complex responses into clean, scannable sections:
  1. COMPRENSIÓN & OBJETIVOS
  2. PLAN & ARQUITECTURA
  3. IMPLEMENTACIÓN DE ARCHIVOS (bloques <<<FILE:...>>>)
  4. INSTRUCCIONES DE EJECUCIÓN & VERIFICACIÓN`;

    const combinedSystemInstruction = systemInstruction
      ? `${defaultSystem}\n\nUser custom preferences / Project context:\n${systemInstruction}\n${projectContext ? `\nActive Project Files Context:\n${projectContext}` : ''}`
      : `${defaultSystem}${projectContext ? `\n\nActive Project Files Context:\n${projectContext}` : ''}`;

    // Convert messages to standard OpenAI format compatible with LiteLLM
    const formattedMessages: any[] = [
      {
        role: 'system',
        content: combinedSystemInstruction,
      },
    ];

    const validMessages = (Array.isArray(messages) ? messages : []).filter(
      (m: any) => (m.content && m.content.trim()) || (m.role === 'user' && files && files.length > 0)
    );

    for (let i = 0; i < validMessages.length; i++) {
      const msg = validMessages[i];
      const isLatest = i === validMessages.length - 1;
      const role = msg.role === 'user' ? 'user' : 'assistant';

      if (isLatest && role === 'user' && Array.isArray(files) && files.length > 0) {
        // Multimodal or file-attached message
        const contentParts: any[] = [];
        let attachedFileContext = '';

        for (const file of files) {
          if (file.data && file.mimeType && file.mimeType.startsWith('image/')) {
            contentParts.push({
              type: 'image_url',
              image_url: {
                url: `data:${file.mimeType};base64,${file.data}`,
              },
            });
          } else if (file.textContent) {
            attachedFileContext += `\n[Attached File: ${file.name || 'unnamed'}]\n\`\`\`${file.language || ''}\n${file.textContent}\n\`\`\`\n`;
          }
        }

        const fullText = `${msg.content || ''}${attachedFileContext ? `\n${attachedFileContext}` : ''}`.trim();
        if (fullText) {
          contentParts.unshift({ type: 'text', text: fullText });
        }

        if (contentParts.length > 0) {
          formattedMessages.push({ role, content: contentParts });
        }
      } else {
        formattedMessages.push({
          role,
          content: msg.content || '',
        });
      }
    }

    if (formattedMessages.length === 1) {
      formattedMessages.push({ role: 'user', content: 'Hola KiranIA' });
    }

    // Connect to LiteLLM Gateway with intelligent auto-failover
    const { stream, usedModel } = await litellm.createCompletionStream({
      model: targetModel,
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 4096,
      onFallback: (info) => {
        res.write(`data: ${JSON.stringify({
          type: 'fallback_switch',
          fromModel: info.fromModel,
          toModel: info.toModel,
          reason: info.reason,
        })}\n\n`);
      },
    });

    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue;

        if (trimmed.startsWith('data:')) {
          const payload = trimmed.replace(/^data:\s*/, '');
          if (payload === '[DONE]') {
            continue;
          }

          try {
            const parsed = JSON.parse(payload);
            const deltaContent = parsed.choices?.[0]?.delta?.content;
            if (deltaContent) {
              res.write(`data: ${JSON.stringify({ type: 'chunk', text: deltaContent, model: usedModel })}\n\n`);
            }
          } catch {
            // ignore malformed chunks
          }
        }
      }
    }

    // Commit credits atomically
    db.commitCredits({
      reservationId: reservation.reservationId,
      actualCost: modelSpec.creditCost,
      inputTokens: 500,
      outputTokens: 800,
      costUSD: (500 * modelSpec.inputCostPerM + 800 * modelSpec.outputCostPerM) / 1000000,
    });

    // Record usage for smart paywall and cost telemetry
    const usageStats = usageManager.recordUsage({
      userId,
      model: usedModel,
      inputTokens: 500,
      outputTokens: 800,
      status: 'success',
    });

    res.write(`data: ${JSON.stringify({ type: 'done', model: usedModel, usage: usageStats })}\n\n`);
    res.end();
  } catch (error: any) {
    console.error('[KiranIA /api/chat error via LiteLLM]:', error);

    // Rollback reserved credits on error
    db.rollbackReservation(reservation.reservationId, error?.message);

    let userFacingMessage = error?.message || 'Error de comunicación con LiteLLM Gateway.';
    if (userFacingMessage.includes('Missing') || userFacingMessage.includes('API key') || userFacingMessage.includes('AuthenticationError')) {
      userFacingMessage += ' Por favor, verifica las variables de entorno en el servidor (.env) para el proveedor seleccionado.';
    }

    res.write(
      `data: ${JSON.stringify({
        type: 'error',
        error: userFacingMessage,
      })}\n\n`
    );
    res.end();
  }
});

// 3. Project Generator API (Routed through LiteLLM)
app.post('/api/generate-project', async (req: Request, res: Response) => {
  const {
    prompt,
    projectType = 'web-app',
    model = 'openrouter-main',
    features = [],
  } = req.body;

  const targetModel = normalizeModel(model);

  try {
    const promptString = `You are KiranIA Project Generator Engine. Build a complete, fully functional, multi-file ${projectType} based on this request: "${prompt}"
Required features / specifications: ${features.join(', ') || 'production-ready, responsive, fully coded, zero placeholders'}.

You MUST generate the complete files. Do NOT put comments like "// implement later" or "// add rest of code here". Write genuine, working, pristine code.
For HTML/React/JS apps, include an index.html that is ready to run in an iframe browser preview without build steps, or include full code files with package.json and README.md.

Format each file strictly with:
<<<FILE: path/to/file.ext>>>
[complete file content]
<<<END_FILE>>>

Before the files, provide a high-level PROJECT SUMMARY and ARCHITECTURE.
After the files, provide RUN INSTRUCTIONS.`;

    const { content: outputText, usedModel } = await litellm.createCompletion({
      model: targetModel,
      messages: [
        {
          role: 'system',
          content: 'You are KiranIA Senior Software Architect. Generate complete, executable project files.',
        },
        {
          role: 'user',
          content: promptString,
        },
      ],
      temperature: 0.3,
      max_tokens: 8192,
    });

    // Parse the files
    const fileRegex = /<<<FILE:\s*([^\n\r>]+)>>>([\s\S]*?)<<<END_FILE>>>/g;
    const files: Array<{ path: string; content: string; language: string }> = [];
    let match;

    while ((match = fileRegex.exec(outputText)) !== null) {
      const filePath = match[1].trim();
      const content = match[2].replace(/^\r?\n/, '').replace(/\r?\n$/, '');
      const ext = path.extname(filePath).toLowerCase();
      let language = 'text';
      if (['.js', '.mjs', '.cjs'].includes(ext)) language = 'javascript';
      else if (['.ts', '.tsx'].includes(ext)) language = 'typescript';
      else if (['.jsx'].includes(ext)) language = 'javascript';
      else if (['.html', '.htm'].includes(ext)) language = 'html';
      else if (['.css'].includes(ext)) language = 'css';
      else if (['.json'].includes(ext)) language = 'json';
      else if (['.md'].includes(ext)) language = 'markdown';
      else if (['.py'].includes(ext)) language = 'python';

      files.push({
        path: filePath,
        content,
        language,
      });
    }

    res.json({
      rawOutput: outputText,
      files,
      count: files.length,
      gateway: 'LiteLLM',
      modelUsed: targetModel,
    });
  } catch (error: any) {
    console.error('[KiranIA /api/generate-project via LiteLLM]:', error);
    res.status(500).json({ error: error?.message || 'Failed to generate project via LiteLLM' });
  }
});

// 4. File Analyzer API (Multimodal routed through LiteLLM)
app.post('/api/analyze-file', async (req: Request, res: Response) => {
  const { file, task = 'audit', userQuestion, model = 'gemini-main' } = req.body;
  if (!file) {
    return res.status(400).json({ error: 'No file provided' });
  }

  const targetModel = normalizeModel(model);

  try {
    const taskInstructions: Record<string, string> = {
      audit: 'Perform a comprehensive security, architecture, syntax, and vulnerability audit of this content.',
      solve: 'Analyze this file/document, identify any bugs, issues, bottlenecks, or requirements, and generate direct solutions.',
      explain: 'Provide a clear, detailed architectural and functional breakdown of this file for developers and stakeholders.',
      optimize: 'Suggest concrete performance optimizations, refactoring strategies, and modern best practices.',
    };

    const instruction = taskInstructions[task] || taskInstructions.audit;
    const promptText = `${instruction}\n${userQuestion ? `Specific user question: ${userQuestion}\n` : ''}${
      file.textContent ? `File text/code:\n\`\`\`\n${file.textContent}\n\`\`\`` : ''
    }`;

    const contentParts: any[] = [{ type: 'text', text: promptText }];
    if (file.data && file.mimeType && file.mimeType.startsWith('image/')) {
      contentParts.push({
        type: 'image_url',
        image_url: {
          url: `data:${file.mimeType};base64,${file.data}`,
        },
      });
    }

    const { content: analysis, usedModel } = await litellm.createCompletion({
      model: targetModel,
      messages: [
        {
          role: 'system',
          content: 'You are KiranIA Diagnostic Engine. Provide honest, deep, evidence-based analysis. Zero fake metrics.',
        },
        {
          role: 'user',
          content: contentParts,
        },
      ],
      temperature: 0.3,
      max_tokens: 4096,
    });

    res.json({
      analysis,
      fileName: file.name,
      timestamp: new Date().toISOString(),
      gateway: 'LiteLLM',
      modelUsed: usedModel,
    });
  } catch (error: any) {
    console.error('[KiranIA /api/analyze-file via LiteLLM]:', error);
    res.status(500).json({ error: error?.message || 'File analysis failed via LiteLLM.' });
  }
});

// 5. Dynamic Model Discovery Engine API
app.get('/api/models', async (_req: Request, res: Response) => {
  try {
    const discovery = await ModelDiscoveryEngine.discoverModels(litellm.getBaseUrl(), litellm.getMasterKey());
    res.json(discovery);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Error discovering models' });
  }
});

app.post('/api/models/discover', async (_req: Request, res: Response) => {
  try {
    const discovery = await ModelDiscoveryEngine.discoverModels(litellm.getBaseUrl(), litellm.getMasterKey());
    res.json({ ...discovery, refreshed: true });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Error refreshing models' });
  }
});

// 6. Model Arena / Concurrent Comparison API
app.post('/api/chat/compare', async (req: Request, res: Response) => {
  const { models = ['gemini-3.8-flash', 'ministral-8b-latest'], prompt, systemInstruction } = req.body;
  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const selectedModels = Array.isArray(models) && models.length > 0 ? models.slice(0, 3) : ['gemini-3.8-flash', 'ministral-8b-latest'];
  const startTime = Date.now();

  const results = await Promise.allSettled(
    selectedModels.map(async (mId: string) => {
      const modelStart = Date.now();
      const targetM = normalizeModel(mId);
      try {
        const response = await litellm.createCompletion({
          model: targetM,
          messages: [
            ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
            { role: 'user', content: prompt },
          ],
          temperature: 0.5,
          max_tokens: 2048,
        });
        const latencyMs = Date.now() - modelStart;
        const tokensEstimate = Math.ceil((prompt.length + response.content.length) / 4);
        return {
          modelId: mId,
          modelUsed: response.usedModel,
          content: response.content,
          latencyMs,
          tokens: tokensEstimate,
          status: 'success' as const,
        };
      } catch (err: any) {
        return {
          modelId: mId,
          modelUsed: targetM,
          content: `Error al generar respuesta: ${err.message || 'Fallo de proveedor'}`,
          latencyMs: Date.now() - modelStart,
          tokens: 0,
          status: 'error' as const,
          error: err.message,
        };
      }
    })
  );

  const finalResults = results.map((r, idx) => {
    if (r.status === 'fulfilled') return r.value;
    return {
      modelId: selectedModels[idx],
      modelUsed: selectedModels[idx],
      content: 'Error en la petición concurrente.',
      latencyMs: Date.now() - startTime,
      tokens: 0,
      status: 'error' as const,
    };
  });

  res.json({
    prompt,
    results: finalResults,
    totalDurationMs: Date.now() - startTime,
  });
});

// 6.5 Real Vision & Image Generation Studio API
app.post('/api/vision/generate', async (req: Request, res: Response) => {
  const { prompt = '', aspectRatio = '1:1', userId = 'usr_guest' } = req.body;
  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: 'Debes proporcionar una descripción o prompt para generar la imagen.' });
  }

  // Reserve credits for image generation
  const reservation = db.reserveCredits({
    userId,
    estimatedCost: 4,
    operation: 'image_generation',
    model: 'gemini-3.1-flash-lite-image',
    provider: 'google',
  });

  if (!reservation.allowed) {
    return res.status(402).json({ error: reservation.reason || 'Saldo insuficiente para generación de imagen (4 créditos requeridos).' });
  }

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({});
    
    // Call Gemini 3 series image generation model
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any || '1:1',
        },
      },
    });

    let imageUrl: string | null = null;
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData?.data) {
        imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!imageUrl) {
      throw new Error('La API no generó un bloque de imagen válido en la respuesta.');
    }

    db.commitCredits({
      reservationId: reservation.reservationId,
      actualCost: 4,
    });

    res.json({
      success: true,
      imageUrl,
      prompt,
      aspectRatio,
      generatedAt: Date.now(),
    });
  } catch (error: any) {
    db.rollbackReservation(reservation.reservationId, error?.message);
    const msg = String(error?.message || '');
    let userMsg = 'Error en la generación de imagen con Google GenAI.';
    if (msg.includes('billed') || msg.includes('billing') || msg.includes('quota') || msg.includes('403') || msg.includes('paid')) {
      userMsg = 'La generación de imágenes con modelos nano banana requiere una clave con facturación activa de Google Gemini.';
    } else if (msg) {
      userMsg = `Fallo de proveedor: ${msg}`;
    }
    res.status(500).json({ error: userMsg });
  }
});

// 7. Usage & Smart Paywall API
app.get('/api/usage', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'usr_guest';
  const plan = usageManager.getUserPlan(userId);
  const stats = usageManager.getUserDailyStats(userId);
  const remaining = Math.max(0, plan.dailyMessageLimit - stats.messagesToday);

  res.json({
    plan,
    dailyUsage: stats,
    remaining,
    isLimitReached: stats.messagesToday >= plan.dailyMessageLimit,
    warning: remaining <= 3 && remaining > 0 ? `Aviso: Te quedan ${remaining} mensajes hoy.` : undefined,
    resetTime: '00:00 UTC',
  });
});

app.post('/api/usage/record', (req: Request, res: Response) => {
  const { userId = 'usr_guest', model = 'gemini-3.8-flash', inputTokens, outputTokens } = req.body;
  const result = usageManager.recordUsage({ userId, model, inputTokens, outputTokens });
  res.json(result);
});

// 7.5 Authentication & User Management API
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  if (!email) return res.status(400).json({ error: 'El correo electrónico es requerido.' });
  try {
    const result = userStore.register({ email, password, name });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email) return res.status(400).json({ error: 'El correo electrónico es requerido.' });
  try {
    const result = userStore.loginWithPassword(email, password || '');
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
});

app.post('/api/auth/google', (req: Request, res: Response) => {
  const { email, name, picture, sub } = req.body;
  if (!email) return res.status(400).json({ error: 'Payload de Google inválido (email requerido).' });
  try {
    const result = userStore.authenticateGoogle({ email, name, picture, sub });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const userId = (token ? userStore.verifySessionToken(token) : null) || (req.query.userId as string) || 'usr_guest';
  const user = userStore.getUserById(userId) || userStore.getUserById('usr_guest');
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  const { passwordHash, ...safe } = user;
  res.json({ user: safe });
});

app.post('/api/auth/profile', (req: Request, res: Response) => {
  const { userId, name, avatarUrl, preferences } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId requerido' });
  try {
    const updated = userStore.updateUser(userId, { name, avatarUrl, preferences });
    const { passwordHash, ...safe } = updated;
    res.json({ user: safe });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 8. Billing & Plans API (Real Stripe Subscriptions & Customer Portal)
app.get('/api/billing/plans', (_req: Request, res: Response) => {
  res.json({
    plans: Object.values(PLAN_CONFIGS),
    currency: 'USD',
    stripeConfigured: stripeManager.isConfigured(),
  });
});

app.post('/api/billing/checkout', async (req: Request, res: Response) => {
  const { planId = 'pro', userId = 'usr_guest', userEmail } = req.body;
  const plan = PLAN_CONFIGS[planId];
  if (!plan) {
    return res.status(400).json({ error: 'Plan inválido' });
  }

  const origin = `${req.protocol}://${req.get('host')}`;
  const email = userEmail || userStore.getUserById(userId)?.email || 'guest@kiranai.com';

  try {
    const session = await stripeManager.createCheckoutSession({
      userId,
      userEmail: email,
      planId: planId as 'pro' | 'business',
      originUrl: origin,
    });

    res.json({
      success: true,
      plan,
      sessionId: session.sessionId,
      checkoutUrl: session.url,
      stripeConfigured: stripeManager.isConfigured(),
      message: `Sesión de pago generada para ${plan.name}.`,
    });
  } catch (err: any) {
    if (!stripeManager.isConfigured()) {
      return res.json({
        success: true,
        plan,
        sessionId: `sim_cs_${Date.now()}`,
        checkoutUrl: `${origin}/?billing=success&plan=${planId}&simulated=true`,
        stripeConfigured: false,
        message: `Modo Sandbox: Suscripción a ${plan.name} simulada con éxito.`,
      });
    }
    res.status(500).json({ error: err.message || 'Error al iniciar suscripción Stripe' });
  }
});

app.post('/api/billing/portal', async (req: Request, res: Response) => {
  const { userId = 'usr_guest' } = req.body;
  const origin = `${req.protocol}://${req.get('host')}`;
  try {
    const portal = await stripeManager.createCustomerPortalSession({ userId, originUrl: origin });
    res.json({ url: portal.url });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Error al acceder a Stripe Customer Portal' });
  }
});

// 8.5 Admin Users Management
app.get('/api/admin/users', (_req: Request, res: Response) => {
  const users = userStore.listAllUsers();
  res.json({ users, total: users.length });
});

app.post('/api/admin/users/:id/plan', (req: Request, res: Response) => {
  const { id } = req.params;
  const { plan } = req.body;
  if (!['free', 'pro', 'business'].includes(plan)) {
    return res.status(400).json({ error: 'Plan inválido' });
  }
  try {
    const updated = userStore.updateUser(id, { plan, subscriptionStatus: 'active' });
    usageManager.setUserPlan(id, plan);
    res.json({ success: true, user: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 8.6 Android Native Mobile Package & Project Download
app.get('/api/android/info', (_req: Request, res: Response) => {
  const androidDir = path.resolve(__dirname, 'android');
  const hasAndroid = fs.existsSync(androidDir);
  res.json({
    appName: 'KiranAI',
    packageId: 'ai.kiranai.app',
    platform: 'android',
    framework: 'Capacitor 8.x + Android Native',
    androidReady: hasAndroid,
    javaInstalled: true,
    productionUrl: 'https://kiranai.web.app',
    apiHost: 'https://kiranai.web.app/api',
    instructions: 'Descomprime KiranAI-Android-Native-Capacitor.zip y ejecuta ./gradlew assembleDebug en tu entorno local o abre en Android Studio.',
  });
});

app.get('/api/android/project.zip', async (_req: Request, res: Response) => {
  try {
    const androidDir = path.resolve(__dirname, 'android');
    if (!fs.existsSync(androidDir)) {
      return res.status(404).json({ error: 'Proyecto Android no inicializado aún.' });
    }

    const zip = new JSZip();

    const addFolderToZip = (currentDir: string, zipFolder: any) => {
      const items = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const item of items) {
        if (item.name === '.gradle' || item.name === 'build' || item.name === '.idea') continue;
        const fullPath = path.join(currentDir, item.name);
        if (item.isDirectory()) {
          const subFolder = zipFolder.folder(item.name);
          addFolderToZip(fullPath, subFolder);
        } else {
          zipFolder.file(item.name, fs.readFileSync(fullPath));
        }
      }
    };

    addFolderToZip(androidDir, zip);

    const buffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="KiranAI-Android-Native-Capacitor.zip"');
    res.send(buffer);
  } catch (err: any) {
    res.status(500).json({ error: 'Error al empaquetar proyecto Android: ' + err.message });
  }
});

// 9. Admin Platform Telemetry API
app.get('/api/admin/metrics', (_req: Request, res: Response) => {
  const metrics = usageManager.getPlatformMetrics();
  res.json({
    metrics,
    system: {
      uptimeSeconds: Math.floor(process.uptime()),
      nodeVersion: process.version,
      platform: process.platform,
      memoryUsage: process.memoryUsage(),
    },
    featureFlags: {
      enableModelCompare: true,
      enableWebGrounding: true,
      enableSandboxLivePreview: true,
      enableVoiceSynthesis: true,
      enableModelDiscovery: true,
      enableStripeMock: !process.env.STRIPE_SECRET_KEY,
    },
    maintenanceMode: false,
    systemAnnouncement: 'KiranIA OS v1.2: Enrutador universal LiteLLM y Model Discovery activos.',
  });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const distPath = path.resolve(__dirname, 'dist');
  const hasDist = fs.existsSync(path.join(distPath, 'index.html'));
  const isDev = process.env.NODE_ENV === 'development' || (!hasDist && process.env.NODE_ENV !== 'production');

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[KiranIA OS] Server initialized and listening on http://0.0.0.0:${PORT}`);
    console.log(`[KiranIA OS] AI Traffic Gateway: LiteLLM Proxy on ${litellm.getBaseUrl()}`);
  });

  // Initialize LiteLLM proxy connection in background without blocking server listen
  litellm.initialize().catch((err) => {
    console.warn('[LiteLLM Manager] Background initialization note:', err?.message || err);
  });
}

startServer().catch((err) => {
  console.error('[KiranIA OS] Fatal server startup error:', err);
  process.exit(1);
});
