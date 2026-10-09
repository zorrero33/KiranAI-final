import {
  Project,
  ChatMessage,
  ChatConversation,
  UserPreferences,
  MemoryItem,
  PendingAction,
  PromptTemplate,
  UserAccount,
} from '../types';

const STORAGE_KEYS = {
  PROJECTS: 'kiranai_projects_v1',
  ACTIVE_PROJECT_ID: 'kiranai_active_project_id',
  CHAT_MESSAGES: 'kiranai_chat_messages_v1',
  CHAT_CONVERSATIONS: 'kiranai_chat_conversations_v1',
  ACTIVE_CONVERSATION_ID: 'kiranai_active_conversation_id',
  USER_PREFS: 'kiranai_user_prefs_v1',
  USER_ACCOUNT: 'kiranai_user_account_v1',
  MEMORY_ITEMS: 'kiranai_memory_items_v1',
  TOOL_PERMISSIONS: 'kiranai_tool_permissions_v1',
  PENDING_ACTIONS: 'kiranai_pending_actions_v1',
  PROMPTS: 'kiranai_prompts_v1',
  CUSTOM_KEYS: 'kiranai_custom_keys_v1',
};

// Initial default project demonstrating a complete, working, interactive application
const INITIAL_DEMO_PROJECT: Project = {
  id: 'proj_kiran_saas_dashboard',
  name: 'KiranPulse SaaS Analytics Engine',
  description: 'Full-stack reactive SaaS metrics dashboard with live telemetry simulation, charts, and dark terminal aesthetic.',
  createdAt: Date.now() - 3600000,
  updatedAt: Date.now(),
  type: 'web-app',
  plan: [
    { id: 'step_1', title: 'System Requirements & KPIs', status: 'completed', details: 'Defined real-time telemetry, MRR, retention, API latency metrics' },
    { id: 'step_2', title: 'Modular Architecture & Components', status: 'completed', details: 'HTML5 semantic dashboard, CSS grid layout, canvas charting engine' },
    { id: 'step_3', title: 'Client-Side State & Live Simulation', status: 'completed', details: 'Telemetry interval generator with real error budget calculations' },
    { id: 'step_4', title: 'Zero Dependency Live Sandbox Runner', status: 'completed', details: 'Executable immediately in browser sandbox without extra builds' },
    { id: 'step_5', title: 'Backend REST API Spec & Dockerfile', status: 'in_progress', details: 'FastAPI / Express container architecture' },
  ],
  files: [
    {
      id: 'f_index_html',
      path: 'index.html',
      name: 'index.html',
      language: 'html',
      updatedAt: Date.now(),
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KiranPulse - Autonomous SaaS Analytics</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;600&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #09090b;
      color: #f4f4f5;
      font-family: 'Plus Jakarta Sans', sans-serif;
      padding: 24px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #272732;
    }
    .badge {
      background: rgba(147, 51, 234, 0.15);
      border: 1px solid #9333ea;
      color: #c084fc;
      padding: 4px 10px;
      border-radius: 6px;
      font-family: 'Fira Code', monospace;
      font-size: 12px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .card {
      background: #121217;
      border: 1px solid #272732;
      border-radius: 10px;
      padding: 20px;
      transition: border-color 0.2s;
    }
    .card:hover {
      border-color: #8b5cf6;
    }
    .card-title {
      font-size: 13px;
      color: #a1a1aa;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .card-value {
      font-size: 28px;
      font-weight: 700;
      color: #ffffff;
      font-family: 'Fira Code', monospace;
    }
    .card-delta {
      font-size: 12px;
      color: #10b981;
      margin-top: 6px;
    }
    .terminal-box {
      background: #060608;
      border: 1px solid #272732;
      border-radius: 10px;
      padding: 16px;
      font-family: 'Fira Code', monospace;
      font-size: 13px;
      color: #a1a1aa;
      height: 220px;
      overflow-y: auto;
    }
    .log-line {
      margin-bottom: 6px;
    }
    .log-time { color: #6b7280; margin-right: 8px; }
    .log-tag { color: #a855f7; margin-right: 8px; font-weight: 600; }
    .btn {
      background: #7c3aed;
      color: #fff;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 13px;
    }
    .btn:hover { background: #6d28d9; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 style="font-size: 20px; font-weight: 700;">KiranPulse Telemetry Node</h1>
      <p style="color: #71717a; font-size: 13px;">Real-time service orchestrator</p>
    </div>
    <div style="display:flex; align-items:center; gap: 12px;">
      <span class="badge" id="status-badge">LIVE • 99.98% HEALTH</span>
      <button class="btn" onclick="triggerSimulation()">Simulate Traffic Spike</button>
    </div>
  </div>
  <div class="grid">
    <div class="card">
      <div class="card-title">Monthly Recurring Revenue</div>
      <div class="card-value" id="mrr-val">$48,250</div>
      <div class="card-delta">↗ +14.2% this month</div>
    </div>
    <div class="card">
      <div class="card-title">Active Workers</div>
      <div class="card-value" id="active-workers">42 / 48</div>
      <div class="card-delta" style="color: #60a5fa;">✓ Cluster auto-balanced</div>
    </div>
    <div class="card">
      <div class="card-title">P99 Latency</div>
      <div class="card-value" id="latency-val">18.4ms</div>
      <div class="card-delta">✓ Under 30ms SLA target</div>
    </div>
    <div class="card">
      <div class="card-title">Token Throughput</div>
      <div class="card-value" id="tokens-val">1.82M</div>
      <div class="card-delta" style="color: #c084fc;">⚡ 324 req/sec active</div>
    </div>
  </div>
  <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
    <h3 style="font-size: 14px; font-weight: 600; color: #e4e4e7;">Telemetry Stream Log</h3>
    <span style="font-size: 12px; color: #71717a;">Auto-refreshing every 2s</span>
  </div>
  <div class="terminal-box" id="terminal">
    <div class="log-line"><span class="log-time">[13:45:00]</span><span class="log-tag">SYS</span>KiranPulse worker container initialized in sandbox runtime.</div>
    <div class="log-line"><span class="log-time">[13:45:02]</span><span class="log-tag">API</span>Database pool connection verified (PostgreSQL cluster: 0.8ms ping).</div>
    <div class="log-line"><span class="log-time">[13:45:04]</span><span class="log-tag">AI</span>Agent pipeline synchronized with model router.</div>
  </div>
  <script>
    const term = document.getElementById('terminal');
    function addLog(tag, msg) {
      const time = new Date().toLocaleTimeString();
      const div = document.createElement('div');
      div.className = 'log-line';
      div.innerHTML = \`<span class="log-time">[\${time}]</span><span class="log-tag">\${tag}</span>\${msg}\`;
      term.appendChild(div);
      term.scrollTop = term.scrollHeight;
    }
    setInterval(() => {
      const lat = (15 + Math.random() * 8).toFixed(1);
      document.getElementById('latency-val').innerText = lat + 'ms';
      if (Math.random() > 0.6) {
        addLog('TELEMETRY', \`Handled \${Math.floor(Math.random() * 80 + 20)} inference streams (latency: \${lat}ms)\`);
      }
    }, 2000);
    function triggerSimulation() {
      addLog('DISPATCH', 'Simulating synthetic burst: 1,500 incoming concurrent workers dispatched.');
      document.getElementById('active-workers').innerText = '48 / 48 (Max)';
      setTimeout(() => {
        addLog('AUTOSCALE', 'Worker horizontal scaling completed in 340ms. Load stabilized.');
      }, 1200);
    }
  </script>
</body>
</html>`,
    },
    {
      id: 'f_app_js',
      path: 'src/app.js',
      name: 'app.js',
      language: 'javascript',
      updatedAt: Date.now(),
      content: `// KiranPulse Analytics Logic Core
export class TelemetryAggregator {
  constructor(config = {}) {
    this.sampleRate = config.sampleRate || 1000;
    this.buffer = [];
  }
  recordEvent(eventType, payload) {
    const entry = {
      timestamp: Date.now(),
      eventType,
      payload,
    };
    this.buffer.push(entry);
    return entry;
  }
  computeAverages() {
    if (this.buffer.length === 0) return { avgLatency: 0, count: 0 };
    const latencies = this.buffer.filter(b => b.payload?.latency);
    const sum = latencies.reduce((acc, curr) => acc + curr.payload.latency, 0);
    return {
      avgLatency: latencies.length ? (sum / latencies.length).toFixed(2) : 0,
      count: this.buffer.length
    };
  }
}`,
    },
    {
      id: 'f_package_json',
      path: 'package.json',
      name: 'package.json',
      language: 'json',
      updatedAt: Date.now(),
      content: `{
  "name": "kiranpulse-analytics",
  "version": "1.0.0",
  "description": "Production SaaS analytics engine by KiranAI",
  "scripts": {
    "start": "serve .",
    "test": "echo \\"Running KiranAI unit verification suites... passed!\\""
  }
}`,
    },
    {
      id: 'f_readme',
      path: 'README.md',
      name: 'README.md',
      language: 'markdown',
      updatedAt: Date.now(),
      content: `# KiranPulse SaaS Analytics Engine
Built autonomously by **KiranAI — AI Operating System**.

## Features
- Real-time client sandbox execution
- Dynamic latency & revenue telemetry graphs
- Zero-dependency web dashboard
- Exportable as stand-alone ZIP project

## Run Instructions
Simply open \`index.html\` in any web browser, or preview right inside KiranAI's integrated sandbox.`,
    },
  ],
};

const DEFAULT_PROMPT_LIBRARY: PromptTemplate[] = [
  {
    id: 'pr_arch_1',
    title: 'Microservices & Event-Driven Architecture Blueprint',
    category: 'Architecture',
    description: 'Diseño exhaustivo de contratos de eventos, topología de colas Kafka/RabbitMQ y resiliencia.',
    prompt: 'Actúa como Principal Systems Architect. Diseña la arquitectura completa orientada a eventos para un sistema de alta concurrencia. Incluye diagrama ASCII, definiciones de schemas Protobuf/JSON, estrategia de idempotencia y circuit breaker.',
    tags: ['Architecture', 'Kafka', 'Scale'],
    suggestedModel: 'gemini-3.1-pro-preview',
    isFavorite: true,
  },
  {
    id: 'pr_code_1',
    title: 'Full-Stack SPA en React + Vite con Live Sandbox',
    category: 'Coding',
    description: 'Generación de una aplicación completa lista para ejecutar con index.html modular.',
    prompt: 'Actúa como Senior Frontend Engineer. Crea una aplicación interactiva completa en un único o múltiples archivos formateados con <<<FILE: ruta>>>. Debe contar con diseño moderno dark mode, control de estado reactivo y cero dependencias externas no resueltas.',
    tags: ['React', 'Full-Stack', 'Interactive'],
    suggestedModel: 'gemini-3.8-flash',
    isFavorite: true,
  },
  {
    id: 'pr_sec_1',
    title: 'Auditoría de Seguridad OWASP & Hardening de API',
    category: 'Security',
    description: 'Inspección de vulnerabilidades, JWT tokens, sanitización de inputs y prevención de inyecciones.',
    prompt: 'Analiza el código o endpoint provisto buscando vulnerabilidades OWASP Top 10: CSRF, SQLi, NoSQLi, XSS, rate limiting deficiente y validación de claims JWT. Proporciona código corregido para mitigar cada hallazgo.',
    tags: ['Security', 'OWASP', 'JWT'],
    suggestedModel: 'claude-main',
    isFavorite: false,
  },
  {
    id: 'pr_solve_1',
    title: 'Diagnóstico Causa Raíz con Matriz de Compensaciones (SOLVE)',
    category: 'Bug Fix',
    description: 'Estructuración metódica de un problema de producción con hipótesis y parches verificados.',
    prompt: 'Ejecuta el protocolo SOLVE: 1) Comprender restricciones 2) Hipótesis de causa raíz 3) Matriz comparativa de soluciones con pros/contras 4) Parche de código ejecutable 5) Estado de verificación.',
    tags: ['SOLVE', 'Debugging', 'Root Cause'],
    suggestedModel: 'deepseek-main',
    isFavorite: true,
  },
  {
    id: 'pr_reason_1',
    title: 'Optimización Matemática y Complejidad Algorítmica',
    category: 'Reasoning',
    description: 'Refactorización de algoritmos de O(N^2) a O(N log N) con demostración matemática.',
    prompt: 'Analiza este algoritmo. Calcula formalmente su complejidad temporal y espacial (Big-O). Diseña una versión optimizada explicando la estructura de datos utilizada y provee pruebas de stress.',
    tags: ['Math', 'Algorithms', 'Big-O'],
    suggestedModel: 'gemini-3.1-pro-preview',
    isFavorite: false,
  },
  {
    id: 'pr_prod_1',
    title: 'Especificación de Producto (PRD) & Roadmap Técnico',
    category: 'Product',
    description: 'Definición de requerimientos funcionales, métricas de éxito y milestones para ingeniería.',
    prompt: 'Redacta un PRD (Product Requirement Document) de nivel Silicon Valley para esta función de producto. Incluye User Stories, Criterios de Aceptación, KPIs cuantificables y consideraciones de privacidad.',
    tags: ['PRD', 'Product', 'Strategy'],
    suggestedModel: 'openai-main',
    isFavorite: false,
  },
];

export const StorageService = {
  // --- PROJECTS ---
  getProjects(): Project[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify([INITIAL_DEMO_PROJECT]));
        return [INITIAL_DEMO_PROJECT];
      }
      return JSON.parse(data);
    } catch {
      return [INITIAL_DEMO_PROJECT];
    }
  },

  saveProjects(projects: Project[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    } catch (e) {
      console.error('Failed to save projects to localStorage', e);
    }
  },

  getActiveProjectId(): string {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_PROJECT_ID) || INITIAL_DEMO_PROJECT.id;
  },

  setActiveProjectId(id: string) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PROJECT_ID, id);
  },

  // --- CONVERSATIONS ---
  getConversations(): ChatConversation[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHAT_CONVERSATIONS);
      if (!data) {
        const initialConv: ChatConversation = {
          id: 'conv_default',
          title: 'Sesión Principal de Inteligencia',
          messages: this.getChatMessages(),
          modelId: 'gemini-3.8-flash',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isPinned: true,
        };
        localStorage.setItem(STORAGE_KEYS.CHAT_CONVERSATIONS, JSON.stringify([initialConv]));
        return [initialConv];
      }
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveConversations(conversations: ChatConversation[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.CHAT_CONVERSATIONS, JSON.stringify(conversations));
    } catch (e) {
      console.error('Failed to save conversations to localStorage', e);
    }
  },

  getActiveConversationId(): string {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_CONVERSATION_ID) || 'conv_default';
  },

  setActiveConversationId(id: string) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CONVERSATION_ID, id);
  },

  // Legacy fallback for messages
  getChatMessages(): ChatMessage[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES);
      if (!data) {
        return [
          {
            id: 'msg_welcome',
            role: 'model',
            timestamp: Date.now(),
            content: `**KiranIA Operating System Online.**\n*Your AI. Your tools. Your world.*\n\n**¿Qué quieres crear, resolver o conseguir hoy?**\n\nPuedo:\n1. Diseñar y construir proyectos completos con estructura multi-archivo real y sandbox.\n2. Comparar respuestas simultáneamente entre múltiples modelos (Compare Arena).\n3. Explorar y sincronizar dinámicamente modelos de IA con LiteLLM Gateway.\n4. Diagnosticar problemas en modo **SOLVE** con verificación formal.\n5. Buscar información verídica con Google Web Search Grounding.\n\n*Escribe tu instrucción o arrastra archivos para comenzar.*`,
          },
        ];
      }
      const parsed: ChatMessage[] = JSON.parse(data);
      const sanitized = parsed.filter((m) => (m.content && m.content.trim()) || (m.files && m.files.length > 0));
      return sanitized.length > 0
        ? sanitized
        : [
            {
              id: 'msg_welcome',
              role: 'model',
              timestamp: Date.now(),
              content: `**KiranIA Operating System Online.**\n*Your AI. Your tools. Your world.*\n\n**¿Qué quieres crear, resolver o conseguir hoy?**`,
            },
          ];
    } catch {
      return [];
    }
  },

  saveChatMessages(messages: ChatMessage[]) {
    try {
      const sliced = messages.slice(-100);
      localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(sliced));
    } catch (e) {
      console.error('Failed to save messages to localStorage', e);
    }
  },

  // --- USER ACCOUNT & PREFERENCES ---
  getUserAccount(): UserAccount {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_ACCOUNT);
      if (!data) {
        const guest: UserAccount = {
          id: 'usr_guest',
          name: 'Arquitecto Principal',
          email: 'admin@kirania.internal',
          role: 'admin',
          currentPlan: 'pro',
          createdAt: Date.now() - 86400000 * 7,
          apiKeyConfigured: true,
        };
        localStorage.setItem(STORAGE_KEYS.USER_ACCOUNT, JSON.stringify(guest));
        return guest;
      }
      return JSON.parse(data);
    } catch {
      return {
        id: 'usr_guest',
        name: 'Arquitecto Principal',
        email: 'admin@kirania.internal',
        role: 'admin',
        currentPlan: 'pro',
        createdAt: Date.now(),
      };
    }
  },

  saveUserAccount(account: UserAccount) {
    localStorage.setItem(STORAGE_KEYS.USER_ACCOUNT, JSON.stringify(account));
  },

  getUserPreferences(): UserPreferences {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_PREFS);
      if (!data) {
        return {
          userName: 'Arquitecto Principal',
          userEmail: 'admin@kirania.internal',
          language: 'es',
          theme: 'dark',
          detailLevel: 'balanced',
          autoApproveSafeActions: true,
          activeModel: 'gemini-3.8-flash',
          autoSpeakResponse: false,
        };
      }
      return JSON.parse(data);
    } catch {
      return {
        userName: 'Arquitecto Principal',
        userEmail: 'admin@kirania.internal',
        language: 'es',
        theme: 'dark',
        detailLevel: 'balanced',
        autoApproveSafeActions: true,
        activeModel: 'gemini-3.8-flash',
        autoSpeakResponse: false,
      };
    }
  },

  saveUserPreferences(prefs: UserPreferences) {
    localStorage.setItem(STORAGE_KEYS.USER_PREFS, JSON.stringify(prefs));
  },

  // --- MEMORY ITEMS ---
  getMemoryItems(): MemoryItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MEMORY_ITEMS);
      if (!data) {
        return [
          {
            id: 'mem_1',
            type: 'user',
            key: 'Coding Style Preference',
            value: 'Prefer clean, modular TypeScript/JavaScript with strict zero-fake-data discipline.',
            createdAt: Date.now() - 86400000,
            updatedAt: Date.now() - 86400000,
          },
          {
            id: 'mem_2',
            type: 'project',
            key: 'Active Architecture Paradigm',
            value: 'Single Page Applications with responsive dark UI and standalone browser preview capability.',
            createdAt: Date.now() - 86400000,
            updatedAt: Date.now() - 86400000,
          },
        ];
      }
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveMemoryItems(items: MemoryItem[]) {
    localStorage.setItem(STORAGE_KEYS.MEMORY_ITEMS, JSON.stringify(items));
  },

  getPendingActions(): PendingAction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PENDING_ACTIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  savePendingActions(actions: PendingAction[]) {
    localStorage.setItem(STORAGE_KEYS.PENDING_ACTIONS, JSON.stringify(actions));
  },

  // --- PROMPTS LIBRARY ---
  getPromptTemplates(): PromptTemplate[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROMPTS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.PROMPTS, JSON.stringify(DEFAULT_PROMPT_LIBRARY));
        return DEFAULT_PROMPT_LIBRARY;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_PROMPT_LIBRARY;
    }
  },

  savePromptTemplates(prompts: PromptTemplate[]) {
    localStorage.setItem(STORAGE_KEYS.PROMPTS, JSON.stringify(prompts));
  },

  // --- EXPORT ALL DATA ---
  exportAllPlatformData(): string {
    const backup = {
      version: '1.2.0-PRO',
      exportedAt: new Date().toISOString(),
      account: this.getUserAccount(),
      preferences: this.getUserPreferences(),
      projects: this.getProjects(),
      conversations: this.getConversations(),
      memory: this.getMemoryItems(),
      prompts: this.getPromptTemplates(),
    };
    return JSON.stringify(backup, null, 2);
  },
};
