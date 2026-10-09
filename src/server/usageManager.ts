import { Database } from './db/database.ts';
import { type PlanTier } from './db/types.ts';

export interface UserPlanConfig {
  id: PlanTier;
  name: string;
  dailyMessageLimit: number;
  dailyTokenLimit: number;
  pricePerMonthUSD: number;
  features: string[];
  maxProjects: number;
  allowSandbox: boolean;
  priorityRouting: boolean;
}

export const PLAN_CONFIGS: Record<string, UserPlanConfig> = {
  free: {
    id: 'free',
    name: 'Free Starter',
    dailyMessageLimit: 25,
    dailyTokenLimit: 100000,
    pricePerMonthUSD: 0,
    features: [
      '25 mensajes diarios',
      'Gemini 3.5 Flash & Ministral 8B',
      'Google Web Search Grounding en tiempo real',
      'IDE y Sandbox en navegador',
      'Descarga de proyectos en ZIP real',
      'Cero datos ficticios',
    ],
    maxProjects: 3,
    allowSandbox: true,
    priorityRouting: false,
  },
  starter: {
    id: 'starter',
    name: 'Starter Plan',
    dailyMessageLimit: 150,
    dailyTokenLimit: 1000000,
    pricePerMonthUSD: 9,
    features: [
      '150 mensajes diarios (~1,000 créditos/mes)',
      'Codestral y Mistral Large',
      'Exportación de ZIP ilimitada',
      'Historial de código extendido',
      'Soporte estándar',
    ],
    maxProjects: 15,
    allowSandbox: true,
    priorityRouting: false,
  },
  pro: {
    id: 'pro',
    name: 'KiranIA Pro',
    dailyMessageLimit: 500,
    dailyTokenLimit: 3000000,
    pricePerMonthUSD: 20,
    features: [
      'Acceso completo a GPT-4o, Claude 3.5, Gemini 3.1 Pro',
      '500 mensajes diarios (~3,000 créditos/mes)',
      'Comparativa simultánea de modelos (Compare Arena)',
      'Memoria persistente de proyectos sin límites',
      'Exportación ilimitada de proyectos',
      'Soporte prioritario y failover inteligente',
    ],
    maxProjects: 50,
    allowSandbox: true,
    priorityRouting: true,
  },
  business: {
    id: 'business',
    name: 'Enterprise / Team',
    dailyMessageLimit: 10000,
    dailyTokenLimit: 25000000,
    pricePerMonthUSD: 59,
    features: [
      'Mensajes y tokens ilimitados (~15,000 créditos/mes)',
      'Acceso a modelos de razonamiento (DeepSeek R1, o1)',
      'Panel de control de costes y telemetría de equipo',
      'BYOK (Tus propias API keys corporativas)',
      'SLA 99.9% y túneles proxy dedicados',
      'Facturación corporativa y gestión de accesos (RBAC)',
    ],
    maxProjects: 500,
    allowSandbox: true,
    priorityRouting: true,
  },
};

export class UsageManager {
  private static instance: UsageManager;
  private db: Database;

  private constructor() {
    this.db = Database.getInstance();
  }

  public static getInstance(): UsageManager {
    if (!UsageManager.instance) {
      UsageManager.instance = new UsageManager();
    }
    return UsageManager.instance;
  }

  public getUserPlan(userId: string = 'usr_guest'): UserPlanConfig {
    const user = this.db.getUserById(userId);
    const planId = user?.plan || 'free';
    return PLAN_CONFIGS[planId] || PLAN_CONFIGS.free;
  }

  public setUserPlan(userId: string, planId: PlanTier) {
    this.db.updateUser(userId, { plan: planId, subscriptionStatus: 'active' });
  }

  public getUserDailyStats(userId: string = 'usr_guest') {
    return this.db.getUserDailyUsage(userId);
  }

  public canUserSendMessage(userId: string = 'usr_guest'): {
    allowed: boolean;
    reason?: string;
    plan: string;
    messagesToday: number;
    limit: number;
    creditsBalance: number;
  } {
    const plan = this.getUserPlan(userId);
    const usage = this.getUserDailyStats(userId);
    const credits = this.db.getUserCredits(userId);

    // 1. Daily Message Quota Check
    if (usage.messagesToday >= plan.dailyMessageLimit) {
      return {
        allowed: false,
        reason: `Límite diario alcanzado (${plan.dailyMessageLimit} mensajes/día en plan ${plan.name}). Mejora tu plan para continuar inmediatamente.`,
        plan: plan.name,
        messagesToday: usage.messagesToday,
        limit: plan.dailyMessageLimit,
        creditsBalance: credits.balance,
      };
    }

    // 2. Credits Balance Check
    if (credits.balance <= 0) {
      return {
        allowed: false,
        reason: 'Tu saldo de créditos se ha agotado. Adquiere créditos o suscríbete a un plan superior para continuar.',
        plan: plan.name,
        messagesToday: usage.messagesToday,
        limit: plan.dailyMessageLimit,
        creditsBalance: credits.balance,
      };
    }

    return {
      allowed: true,
      plan: plan.name,
      messagesToday: usage.messagesToday,
      limit: plan.dailyMessageLimit,
      creditsBalance: credits.balance,
    };
  }

  public recordUsage(params: {
    userId?: string;
    model: string;
    inputTokens?: number;
    outputTokens?: number;
    status?: 'success' | 'failed' | 'rate_limited';
  }) {
    const uid = params.userId || 'usr_guest';
    const plan = this.getUserPlan(uid);
    const stats = this.getUserDailyStats(uid);
    const remaining = Math.max(0, plan.dailyMessageLimit - stats.messagesToday);

    return {
      currentDailyUsage: stats.messagesToday,
      limit: plan.dailyMessageLimit,
      remaining,
      warning: remaining <= 3 && remaining > 0 ? `Aviso: Te quedan ${remaining} mensajes hoy.` : undefined,
    };
  }

  public getPlatformMetrics() {
    return this.db.getPlatformMetrics();
  }
}
