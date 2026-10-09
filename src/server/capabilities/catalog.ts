export type CapabilityCategory = 'remote_function' | 'dynamic_ui' | 'native_plugin';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type ConfirmationPolicy = 'none' | 'confirm_always' | 'confirm_first_time';
export type ExecutionMethod = 'server_tool' | 'client_native' | 'hybrid_flow';

export interface CapabilityDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  category: CapabilityCategory;
  riskLevel: RiskLevel;
  requiredPermissions: string[];
  minClientVersion: string;
  executionMethod: ExecutionMethod;
  confirmationPolicy: ConfirmationPolicy;
  otaUpdatable: boolean;
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
  tags: string[];
  lastUpdated: string;
}

export interface DynamicWidgetDefinition {
  id: string;
  title: string;
  description: string;
  widgetType: 'stats_card' | 'quick_action_grid' | 'prompt_form' | 'status_banner' | 'ai_feed';
  minClientVersion: string;
  props: Record<string, any>;
  otaVersion: string;
}

export interface DeviceActionRequest {
  actionId: string;
  parameters: Record<string, any>;
  clientId?: string;
  userConfirmed?: boolean;
}

export interface DeviceActionResult {
  actionId: string;
  success: boolean;
  requiresConfirmation?: boolean;
  confirmationPrompt?: string;
  riskLevel: RiskLevel;
  executedAt: string;
  resultData?: any;
  error?: string;
}

export class CapabilityCatalogEngine {
  private static catalogVersion = '2.4.0';

  private static capabilities: CapabilityDefinition[] = [
    // --- CATEGORÍA 1: FUNCIONES REMOTAS (Actualizables 100% servidor sin nuevo APK) ---
    {
      id: 'remote.ai.multimodal_router',
      name: 'Enrutador Multimodal Inteligente (LiteLLM + Gemini)',
      description: 'Selección automática y conmutación de modelos (Gemini 2.5 Pro, Claude, GPT-4o, DeepSeek) con streaming de alta velocidad.',
      version: '2.4.0',
      category: 'remote_function',
      riskLevel: 'low',
      requiredPermissions: [],
      minClientVersion: '1.0.0',
      executionMethod: 'server_tool',
      confirmationPolicy: 'none',
      otaUpdatable: true,
      inputSchema: { prompt: 'string', attachments: 'array?', modelId: 'string?' },
      outputSchema: { text: 'string', tokensUsed: 'number', latencyMs: 'number' },
      tags: ['ai', 'multimodal', 'llm', 'cloud'],
      lastUpdated: '2026-10-09',
    },
    {
      id: 'remote.ai.deep_research',
      name: 'Agente de Investigación Profunda Web',
      description: 'Exploración autónoma multietapa y síntesis de fuentes fidedignas con citas directas.',
      version: '2.1.0',
      category: 'remote_function',
      riskLevel: 'low',
      requiredPermissions: [],
      minClientVersion: '1.0.0',
      executionMethod: 'server_tool',
      confirmationPolicy: 'none',
      otaUpdatable: true,
      inputSchema: { query: 'string', depth: 'number?' },
      outputSchema: { report: 'string', sources: 'array' },
      tags: ['research', 'web', 'autonomous'],
      lastUpdated: '2026-10-09',
    },
    {
      id: 'remote.ai.code_interpreter',
      name: 'Sandbox de Análisis de Código & Datos',
      description: 'Ejecución y depuración de algoritmos en entorno seguro del servidor.',
      version: '1.8.0',
      category: 'remote_function',
      riskLevel: 'medium',
      requiredPermissions: [],
      minClientVersion: '1.0.0',
      executionMethod: 'server_tool',
      confirmationPolicy: 'none',
      otaUpdatable: true,
      inputSchema: { language: 'string', code: 'string' },
      outputSchema: { stdout: 'string', exitCode: 'number' },
      tags: ['code', 'sandbox', 'python', 'javascript'],
      lastUpdated: '2026-10-09',
    },

    // --- CATEGORÍA 2: MÓDULOS DE INTERFAZ DINÁMICOS (Actualizables vía Server-Driven UI) ---
    {
      id: 'ui.widgets.daily_productivity',
      name: 'Módulo de Productividad y Resumen Ejecutivo',
      description: 'Tarjetas de información contextual con métricas de uso de IA y acciones rápidas sincronizadas.',
      version: '1.5.0',
      category: 'dynamic_ui',
      riskLevel: 'low',
      requiredPermissions: [],
      minClientVersion: '1.0.0',
      executionMethod: 'client_native',
      confirmationPolicy: 'none',
      otaUpdatable: true,
      inputSchema: { viewMode: 'string' },
      outputSchema: { rendered: 'boolean' },
      tags: ['ui', 'widgets', 'productivity'],
      lastUpdated: '2026-10-09',
    },
    {
      id: 'ui.widgets.token_optimizer',
      name: 'Monitor Dinámico de Consumo y Créditos',
      description: 'Visualizador en vivo de balance de créditos, consumo en tiempo real y selector de recargas Stripe.',
      version: '2.0.0',
      category: 'dynamic_ui',
      riskLevel: 'low',
      requiredPermissions: [],
      minClientVersion: '1.0.0',
      executionMethod: 'client_native',
      confirmationPolicy: 'none',
      otaUpdatable: true,
      inputSchema: { userId: 'string' },
      outputSchema: { balance: 'number', plan: 'string' },
      tags: ['ui', 'billing', 'stripe', 'credits'],
      lastUpdated: '2026-10-09',
    },

    // --- CATEGORÍA 3: PLUGINS NATIVOS ANDROID (Requieren compilación APK si cambian) ---
    {
      id: 'native.android.voice_engine',
      name: 'Motor de Voz Continuo & Reconocimiento Nativo',
      description: 'Acceso a hardware de micrófono para Speech-to-Text de ultra baja latencia y síntesis de voz contextual.',
      version: '1.2.0',
      category: 'native_plugin',
      riskLevel: 'medium',
      requiredPermissions: ['android.permission.RECORD_AUDIO', 'android.permission.MODIFY_AUDIO_SETTINGS'],
      minClientVersion: '1.0.0',
      executionMethod: 'client_native',
      confirmationPolicy: 'confirm_first_time',
      otaUpdatable: false,
      inputSchema: { continuous: 'boolean', language: 'string' },
      outputSchema: { transcript: 'string', isFinal: 'boolean' },
      tags: ['voice', 'microphone', 'stt', 'hardware'],
      lastUpdated: '2026-10-09',
    },
    {
      id: 'native.android.vision_camera',
      name: 'Visión Computacional & Captura por Cámara',
      description: 'Captura fotográfica y análisis multimodal de documentos, diagramas y objetos del entorno.',
      version: '1.2.0',
      category: 'native_plugin',
      riskLevel: 'medium',
      requiredPermissions: ['android.permission.CAMERA'],
      minClientVersion: '1.0.0',
      executionMethod: 'client_native',
      confirmationPolicy: 'confirm_first_time',
      otaUpdatable: false,
      inputSchema: { resolution: 'string?', autoFocus: 'boolean?' },
      outputSchema: { base64Data: 'string', mimeType: 'string' },
      tags: ['camera', 'vision', 'multimodal', 'hardware'],
      lastUpdated: '2026-10-09',
    },
    {
      id: 'native.android.push_notifications',
      name: 'Centro de Notificaciones & Alarmas Proactivas',
      description: 'Canal de notificaciones nativas de Android 13+ para recordatorios de IA y alertas de automatizaciones.',
      version: '1.2.0',
      category: 'native_plugin',
      riskLevel: 'low',
      requiredPermissions: ['android.permission.POST_NOTIFICATIONS'],
      minClientVersion: '1.0.0',
      executionMethod: 'client_native',
      confirmationPolicy: 'confirm_first_time',
      otaUpdatable: false,
      inputSchema: { title: 'string', body: 'string', actionData: 'object?' },
      outputSchema: { notificationId: 'string', sent: 'boolean' },
      tags: ['notifications', 'system', 'reminders'],
      lastUpdated: '2026-10-09',
    },
    {
      id: 'native.android.haptics',
      name: 'Retroalimentación Háptica & Vibración',
      description: 'Confirmaciones sensoriales para acciones críticas y activación del asistente de voz.',
      version: '1.1.0',
      category: 'native_plugin',
      riskLevel: 'low',
      requiredPermissions: ['android.permission.VIBRATE'],
      minClientVersion: '1.0.0',
      executionMethod: 'client_native',
      confirmationPolicy: 'none',
      otaUpdatable: false,
      inputSchema: { style: 'string' },
      outputSchema: { triggered: 'boolean' },
      tags: ['haptics', 'vibration', 'hardware'],
      lastUpdated: '2026-10-09',
    },
    {
      id: 'native.android.safe_intents',
      name: 'Control de Dispositivo mediante Intents Oficiales',
      description: 'Apertura controlada de aplicaciones instaladas, enlaces web, envío de SMS preparados y gestión de calendario.',
      version: '1.3.0',
      category: 'native_plugin',
      riskLevel: 'high',
      requiredPermissions: [],
      minClientVersion: '1.0.0',
      executionMethod: 'client_native',
      confirmationPolicy: 'confirm_always',
      otaUpdatable: false,
      inputSchema: { action: 'string', uri: 'string?', package: 'string?', extraData: 'object?' },
      outputSchema: { opened: 'boolean', targetActivity: 'string?' },
      tags: ['intents', 'apps', 'automation', 'phone_control'],
      lastUpdated: '2026-10-09',
    },
  ];

  private static dynamicWidgets: DynamicWidgetDefinition[] = [
    {
      id: 'widget.ai_quick_prompt',
      title: 'Disparador Rápido de IA',
      description: 'Entrada directa con un toque para consultar modelos de lenguaje.',
      widgetType: 'prompt_form',
      minClientVersion: '1.0.0',
      otaVersion: '2.4.0',
      props: {
        placeholder: 'Pregunta a KiranAI...',
        suggestedPrompts: [
          'Resume las noticias tecnológicas de hoy',
          'Analiza este fragmento de código',
          'Crea un recordatorio para revisar el reporte',
        ],
      },
    },
    {
      id: 'widget.device_telemetry',
      title: 'Telemetría del Asistente & Conectividad',
      description: 'Muestra estado de Cloud Run, LiteLLM y sincronización con Firestore.',
      widgetType: 'stats_card',
      minClientVersion: '1.0.0',
      otaVersion: '2.4.0',
      props: {
        metrics: ['Cloud Run (europe-west2)', 'Firestore DB', 'LiteLLM Engine', 'Capacitor Android Core'],
      },
    },
    {
      id: 'widget.safe_phone_actions',
      title: 'Acciones Rápidas del Dispositivo',
      description: 'Acciones pre-validadas de control del teléfono sin riesgos de seguridad.',
      widgetType: 'quick_action_grid',
      minClientVersion: '1.0.0',
      otaVersion: '2.4.0',
      props: {
        actions: [
          { id: 'open_browser', label: 'Navegador Web', icon: 'globe', intent: 'https://kiranai.web.app' },
          { id: 'open_settings', label: 'Ajustes del Sistema', icon: 'settings', intent: 'android.settings.SETTINGS' },
          { id: 'compose_sms', label: 'Preparar Mensaje', icon: 'message', intent: 'sms:' },
          { id: 'voice_trigger', label: 'Comando de Voz', icon: 'mic', intent: 'kiranai://voice' },
        ],
      },
    },
  ];

  public static getCatalog(clientVersion = '1.0.0') {
    const supported = this.capabilities.map((cap) => {
      const isClientCompatible = this.compareVersions(clientVersion, cap.minClientVersion) >= 0;
      return {
        ...cap,
        isClientCompatible,
        needsApkUpgrade: !isClientCompatible && cap.category === 'native_plugin',
      };
    });

    return {
      catalogVersion: this.catalogVersion,
      clientVersion,
      totalCapabilities: supported.length,
      categories: {
        category1_remote: supported.filter((c) => c.category === 'remote_function').length,
        category2_dynamic_ui: supported.filter((c) => c.category === 'dynamic_ui').length,
        category3_native_plugins: supported.filter((c) => c.category === 'native_plugin').length,
      },
      capabilities: supported,
      dynamicWidgets: this.dynamicWidgets,
      updateStrategy: {
        tierA_serverImmediate: 'Herramientas de IA, prompts, LiteLLM y backend se actualizan sin APK.',
        tierB_dynamicUi: 'Widgets declarativos y tarjetas de interfaz se actualizan vía Server-Driven UI.',
        tierC_nativePlugins: 'Cambios en permisos de Android o código Java/Kotlin compilan un nuevo APK.',
      },
    };
  }

  public static validateAndExecuteAction(req: DeviceActionRequest): DeviceActionResult {
    const capability = this.capabilities.find((c) => c.id === req.actionId);
    if (!capability) {
      return {
        actionId: req.actionId,
        success: false,
        riskLevel: 'high',
        executedAt: new Date().toISOString(),
        error: `Acción no registrada en el catálogo seguro: ${req.actionId}`,
      };
    }

    // High or Critical risk actions require explicit user confirmation
    if (capability.confirmationPolicy === 'confirm_always' && !req.userConfirmed) {
      return {
        actionId: req.actionId,
        success: false,
        requiresConfirmation: true,
        riskLevel: capability.riskLevel,
        confirmationPrompt: `¿Autorizas a KiranAI a ejecutar la acción "${capability.name}" con los parámetros indicados?`,
        executedAt: new Date().toISOString(),
      };
    }

    return {
      actionId: req.actionId,
      success: true,
      riskLevel: capability.riskLevel,
      executedAt: new Date().toISOString(),
      resultData: {
        status: 'authorized_and_dispatched',
        executionMethod: capability.executionMethod,
        parameters: req.parameters,
        note: 'Acción aprobada mediante el catálogo cerrado de KiranAI OS.',
      },
    };
  }

  private static compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map((n) => parseInt(n, 10) || 0);
    const parts2 = v2.split('.').map((n) => parseInt(n, 10) || 0);
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }
    return 0;
  }
}
