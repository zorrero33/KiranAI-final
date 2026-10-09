import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import {
  type UserEntity,
  type SubscriptionEntity,
  type PlanEntity,
  type PaymentEntity,
  type UserCreditsEntity,
  type CreditTransactionEntity,
  type AiRequestEntity,
  type AiUsageAggregateEntity,
  type ModelEntity,
  type ProviderEntity,
  type WebhookEventEntity,
  type PlanTier,
} from './types.ts';
import {
  getFirestoreDB,
  syncDocToFirestore,
  getAllDocsFromFirestore,
} from './firestore.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Database {
  private static instance: Database;
  private dataDir: string;

  // In-memory indexed collections
  private users: Map<string, UserEntity> = new Map();
  private subscriptions: Map<string, SubscriptionEntity> = new Map();
  private plans: Map<string, PlanEntity> = new Map();
  private payments: Map<string, PaymentEntity> = new Map();
  private credits: Map<string, UserCreditsEntity> = new Map();
  private creditTransactions: Map<string, CreditTransactionEntity> = new Map();
  private aiRequests: Map<string, AiRequestEntity> = new Map();
  private aiUsage: Map<string, AiUsageAggregateEntity> = new Map();
  private models: Map<string, ModelEntity> = new Map();
  private providers: Map<string, ProviderEntity> = new Map();
  private webhookEvents: Map<string, WebhookEventEntity> = new Map();

  // Active in-memory reservation tracking (reservationId -> { userId, amount, expiresAt, operation, model })
  private pendingReservations: Map<
    string,
    {
      userId: string;
      amount: number;
      operation: 'chat' | 'image_generation' | 'document_audit' | 'compare_arena';
      model?: string;
      provider?: string;
      createdAt: number;
    }
  > = new Map();

  private constructor() {
    this.dataDir = path.resolve(__dirname, '../../../data');
    if (!fs.existsSync(this.dataDir)) {
      try {
        fs.mkdirSync(this.dataDir, { recursive: true });
      } catch (err) {
        console.warn('[Database] Could not create data directory:', err);
      }
    }

    this.loadAll();
    this.seedDefaults();
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  // Generic Persistence Helper with Atomic Temp-Rename
  private loadFile<T>(filename: string, map: Map<string, T>, keyProp: (item: T) => string) {
    const filePath = path.join(this.dataDir, filename);
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const items: T[] = JSON.parse(raw);
        for (const item of items) {
          const key = keyProp(item);
          if (key) map.set(key, item);
        }
      }
    } catch (err) {
      console.warn(`[Database] Error reading ${filename}, starting empty:`, err);
    }
  }

  private saveFile<T>(filename: string, map: Map<string, T>) {
    const filePath = path.join(this.dataDir, filename);
    const tempPath = `${filePath}.tmp.${Date.now()}`;
    try {
      const items = Array.from(map.values());
      fs.writeFileSync(tempPath, JSON.stringify(items, null, 2), 'utf-8');
      fs.renameSync(tempPath, filePath);
    } catch (err) {
      console.warn(`[Database] Error persisting ${filename}:`, err);
      try {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      } catch {}
    }
  }

  private loadAll() {
    this.loadFile('users.json', this.users, (u) => u.id);
    this.loadFile('subscriptions.json', this.subscriptions, (s) => s.id);
    this.loadFile('plans.json', this.plans, (p) => p.id);
    this.loadFile('payments.json', this.payments, (p) => p.id);
    this.loadFile('credits.json', this.credits, (c) => c.userId);
    this.loadFile('credit_transactions.json', this.creditTransactions, (t) => t.id);
    this.loadFile('ai_requests.json', this.aiRequests, (r) => r.id);
    this.loadFile('ai_usage.json', this.aiUsage, (u) => u.id);
    this.loadFile('models.json', this.models, (m) => m.id);
    this.loadFile('providers.json', this.providers, (p) => p.id);
    this.loadFile('webhook_events.json', this.webhookEvents, (e) => e.id);

    // Asynchronously hydrate and merge with remote Firestore
    this.hydrateFromFirestore().catch((e) => console.warn('[Database] Hydration init warning:', e));
  }

  public async hydrateFromFirestore(): Promise<void> {
    try {
      const db = getFirestoreDB();
      if (!db) return;

      const remoteUsers = await getAllDocsFromFirestore('users');
      for (const u of remoteUsers as UserEntity[]) {
        if (u && u.id) this.users.set(u.id, u);
      }

      const remoteCredits = await getAllDocsFromFirestore('credits');
      for (const c of remoteCredits as UserCreditsEntity[]) {
        if (c && c.userId) this.credits.set(c.userId, c);
      }

      const remoteSubs = await getAllDocsFromFirestore('subscriptions');
      for (const s of remoteSubs as SubscriptionEntity[]) {
        if (s && s.id) this.subscriptions.set(s.id, s);
      }
      console.log(`[Firestore] Successfully hydrated collections: ${remoteUsers.length} users, ${remoteCredits.length} credit ledgers`);
    } catch (err) {
      console.warn('[Firestore] Failed to hydrate:', err);
    }
  }

  public isFirestoreConnected(): boolean {
    return !!getFirestoreDB();
  }

  /**
   * Hash a password with a per-user random salt and scrypt (KDF), stored as
   * `scrypt$<saltHex>$<hashHex>`. The old scheme was a single unsalted SHA-256
   * with a hardcoded salt, which made identical passwords collide across users
   * and allowed offline brute force at GPU speed.
   */
  public hashPassword(password: string, salt?: string): string {
    const saltHex = salt || crypto.randomBytes(16).toString('hex');
    const derived = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), 64);
    return `scrypt$${saltHex}$${derived.toString('hex')}`;
  }

  /**
   * Verify a password against a stored hash, supporting the legacy
   * `sha256('kiran_salt_'+password)` format so existing accounts keep working.
   * Comparison is constant-time to avoid leaking a match through timing.
   */
  public verifyPassword(password: string, storedHash?: string): { ok: boolean; legacy: boolean } {
    if (!storedHash) return { ok: false, legacy: false };
    const safeEqual = (a: string, b: string): boolean => {
      const ab = Buffer.from(a);
      const bb = Buffer.from(b);
      return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
    };
    if (storedHash.startsWith('scrypt$')) {
      const parts = storedHash.split('$');
      if (parts.length !== 3) return { ok: false, legacy: false };
      const recomputed = this.hashPassword(password, parts[1]);
      return { ok: safeEqual(recomputed, storedHash), legacy: false };
    }
    // Legacy compatibility path.
    const legacyHash = crypto.createHash('sha256').update(`kiran_salt_${password}`).digest('hex');
    return { ok: safeEqual(legacyHash, storedHash), legacy: true };
  }

  private seedDefaults() {
    // 1. Seed Real Plans
    const defaultPlans: PlanEntity[] = [
      {
        id: 'free',
        name: 'Free Starter',
        pricePerMonthUSD: 0,
        pricePerYearUSD: 0,
        creditsPerMonth: 100,
        dailyMessageLimit: 25,
        allowedModels: ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'ministral-8b-latest'],
        features: [
          '25 mensajes diarios',
          'Gemini 3.5 Flash & Ministral 8B',
          'Google Web Search Grounding en tiempo real',
          'IDE y Sandbox en navegador',
          'Descarga y exportación de proyectos en ZIP',
          'Cero datos ficticios',
        ],
        maxProjects: 3,
        priorityRouting: false,
        isActive: true,
      },
      {
        id: 'starter',
        name: 'Starter Plan',
        pricePerMonthUSD: 9,
        pricePerYearUSD: 85,
        creditsPerMonth: 1000,
        dailyMessageLimit: 150,
        allowedModels: ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'ministral-8b-latest', 'codestral-latest'],
        features: [
          '150 mensajes diarios (~1,000 créditos/mes)',
          'Codestral y Mistral Large',
          'Exportación de ZIP ilimitada',
          'Historial de código extendido',
          'Soporte estándar',
        ],
        maxProjects: 15,
        priorityRouting: false,
        isActive: true,
      },
      {
        id: 'pro',
        name: 'KiranIA Pro',
        pricePerMonthUSD: 20,
        pricePerYearUSD: 192,
        creditsPerMonth: 3000,
        dailyMessageLimit: 500,
        allowedModels: [
          'gemini-3.5-flash',
          'gemini-3.1-pro-preview',
          'openai-main',
          'claude-main',
          'mistral-large-latest',
          'codestral-latest',
        ],
        features: [
          '500 mensajes diarios (~3,000 créditos/mes)',
          'Acceso a GPT-4o, Claude 3.5 Sonnet y Gemini 3.1 Pro',
          'Model Arena: Comparativa simultánea de modelos',
          'Prioridad de inferencia y failover inteligente',
          'Memoria persistente de proyectos sin límites',
          'Proyectos ilimitados',
        ],
        maxProjects: 50,
        priorityRouting: true,
        stripePriceIdMonthly: process.env.STRIPE_PRICE_ID_PRO || 'price_1UND8NPSl2G2R3kGlswdCNty',
        isActive: true,
      },
      {
        id: 'business',
        name: 'Enterprise / Team',
        pricePerMonthUSD: 59,
        pricePerYearUSD: 588,
        creditsPerMonth: 15000,
        dailyMessageLimit: 10000,
        allowedModels: [
          'gemini-3.5-flash',
          'gemini-3.1-pro-preview',
          'openai-main',
          'claude-main',
          'deepseek-main',
          'mistral-large-latest',
          'codestral-latest',
          'openrouter-main',
        ],
        features: [
          'Mensajes y tokens ilimitados (~15,000 créditos/mes)',
          'Acceso a modelos de razonamiento (DeepSeek R1, o1, Pro)',
          'Panel de control de costes y telemetría de equipo',
          'BYOK (Tus propias API keys corporativas)',
          'SLA 99.9% y túneles proxy dedicados',
          'Facturación corporativa y gestión de accesos (RBAC)',
        ],
        maxProjects: 500,
        priorityRouting: true,
        stripePriceIdMonthly: process.env.STRIPE_PRICE_ID_BUSINESS || 'price_1UNDBsPSl2G2R3kGNBP0m8t6',
        isActive: true,
      },
    ];

    for (const p of defaultPlans) {
      if (!this.plans.has(p.id)) {
        this.plans.set(p.id, p);
      } else {
        // Sync Stripe price IDs from env if updated
        const existing = this.plans.get(p.id)!;
        if (p.stripePriceIdMonthly) existing.stripePriceIdMonthly = p.stripePriceIdMonthly;
      }
    }
    this.saveFile('plans.json', this.plans);

    // 2. Bootstrap the configured administrator(s), if any.
    //    Admin is granted only to emails in ADMIN_EMAILS. No personal address is
    //    hardcoded and no default password is ever created: the owner registers
    //    the account normally (setting a real hash) and it is promoted here.
    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    for (const email of adminEmails) {
      const existing = Array.from(this.users.values()).find(
        (u) => u.email.toLowerCase() === email
      );
      if (existing) {
        if (existing.role !== 'admin') {
          existing.role = 'admin';
          existing.updatedAt = Date.now();
          this.users.set(existing.id, existing);
          syncDocToFirestore('users', existing.id, existing).catch(() => {});
        }
      } else {
        const admin: UserEntity = {
          id: `usr_admin_${crypto.createHash('sha256').update(email).digest('hex').slice(0, 12)}`,
          email,
          name: 'Administrador KiranAI',
          role: 'admin',
          plan: 'business',
          subscriptionStatus: 'active',
          avatarUrl: '/kiran-emblem.svg',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          lastLoginAt: 0,
          preferences: { theme: 'dark', activeModel: 'gemini-3.5-flash' },
        };
        this.users.set(admin.id, admin);
        this.ensureUserCredits(admin.id, 15000);
        syncDocToFirestore('users', admin.id, admin).catch(() => {});
      }
    }

    if (!this.users.has('usr_guest')) {
      const guest: UserEntity = {
        id: 'usr_guest',
        email: 'guest@kiranai.com',
        name: 'Invitado KiranAI',
        role: 'user',
        plan: 'free',
        subscriptionStatus: 'none',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastLoginAt: Date.now(),
        preferences: { theme: 'dark', activeModel: 'gemini-3.5-flash' },
      };
      this.users.set(guest.id, guest);
      this.ensureUserCredits(guest.id, 100);
      syncDocToFirestore('users', guest.id, guest).catch(() => {});
    }

    this.saveFile('users.json', this.users);
  }

  // ---------------------------------------------------------------------------
  // USERS
  // ---------------------------------------------------------------------------
  public getUserById(id: string): UserEntity | undefined {
    return this.users.get(id);
  }

  public getUserByEmail(email: string): UserEntity | undefined {
    const clean = email.toLowerCase().trim();
    return Array.from(this.users.values()).find((u) => u.email.toLowerCase().trim() === clean);
  }

  public getUserByStripeCustomerId(customerId: string): UserEntity | undefined {
    return Array.from(this.users.values()).find((u) => u.stripeCustomerId === customerId);
  }

  public createUser(userData: {
    email: string;
    password?: string;
    name?: string;
    role?: 'user' | 'admin';
  }): UserEntity {
    const cleanEmail = userData.email.toLowerCase().trim();
    if (this.getUserByEmail(cleanEmail)) {
      throw new Error('Ya existe una cuenta registrada con este correo electrónico.');
    }

    const id = `usr_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    let passwordHash: string | undefined;
    let passwordSalt: string | undefined;
    if (userData.password) {
      passwordSalt = crypto.randomBytes(16).toString('hex');
      passwordHash = this.hashPassword(userData.password, passwordSalt);
    }
    const user: UserEntity = {
      id,
      email: cleanEmail,
      name: userData.name || cleanEmail.split('@')[0],
      passwordHash,
      passwordSalt,
      role: userData.role || 'user',
      plan: 'free',
      subscriptionStatus: 'none',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      preferences: { theme: 'dark' },
    };

    this.users.set(id, user);
    this.saveFile('users.json', this.users);
    syncDocToFirestore('users', id, user).catch(() => {});
    this.ensureUserCredits(id, 100);
    return user;
  }

  public updateUser(id: string, updates: Partial<UserEntity>): UserEntity {
    const user = this.users.get(id);
    if (!user) throw new Error(`Usuario ${id} no encontrado.`);

    const updated: UserEntity = {
      ...user,
      ...updates,
      updatedAt: Date.now(),
    };

    this.users.set(id, updated);
    this.saveFile('users.json', this.users);
    syncDocToFirestore('users', id, updated).catch(() => {});
    return updated;
  }

  public listUsers(): UserEntity[] {
    return Array.from(this.users.values());
  }

  // ---------------------------------------------------------------------------
  // CREDITS & ATOMIC TRANSACTIONS
  // ---------------------------------------------------------------------------
  public ensureUserCredits(userId: string, initialBalance = 100): UserCreditsEntity {
    let credit = this.credits.get(userId);
    if (!credit) {
      credit = {
        userId,
        balance: initialBalance,
        totalPurchased: 0,
        totalConsumed: 0,
        reserved: 0,
        lastUpdated: Date.now(),
      };
      this.credits.set(userId, credit);
      this.saveFile('credits.json', this.credits);
      syncDocToFirestore('credits', userId, credit).catch(() => {});

      // Record transaction
      this.recordCreditTransaction({
        userId,
        type: 'grant',
        amount: initialBalance,
        balanceAfter: initialBalance,
        operation: 'subscription_grant',
        notes: 'Créditos iniciales de bienvenida',
      });
    }
    return credit;
  }

  public getUserCredits(userId: string): UserCreditsEntity {
    return this.ensureUserCredits(userId);
  }

  /**
   * Atomic Reservation: Verifies sufficient balance and locks credits during execution.
   */
  public reserveCredits(params: {
    userId: string;
    estimatedCost: number;
    operation: 'chat' | 'image_generation' | 'document_audit' | 'compare_arena';
    model?: string;
    provider?: string;
  }): { reservationId: string; allowed: boolean; currentBalance: number; reason?: string } {
    const cred = this.ensureUserCredits(params.userId);
    const available = cred.balance - cred.reserved;

    if (available < params.estimatedCost) {
      return {
        reservationId: '',
        allowed: false,
        currentBalance: cred.balance,
        reason: `Saldo insuficiente de créditos. Necesitas ${params.estimatedCost} y tienes ${available} disponibles.`,
      };
    }

    const reservationId = `res_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    cred.reserved += params.estimatedCost;
    cred.lastUpdated = Date.now();

    this.pendingReservations.set(reservationId, {
      userId: params.userId,
      amount: params.estimatedCost,
      operation: params.operation,
      model: params.model,
      provider: params.provider,
      createdAt: Date.now(),
    });

    this.saveFile('credits.json', this.credits);

    return {
      reservationId,
      allowed: true,
      currentBalance: cred.balance - cred.reserved,
    };
  }

  /**
   * Atomic Commit: Finalizes the transaction, deducts actual cost, and releases the reservation.
   */
  public commitCredits(params: {
    reservationId: string;
    actualCost: number;
    inputTokens?: number;
    outputTokens?: number;
    costUSD?: number;
    referenceId?: string;
  }): { success: boolean; newBalance: number } {
    const reservation = this.pendingReservations.get(params.reservationId);
    if (!reservation) {
      console.warn(`[Database] Reservation ${params.reservationId} not found, proceeding with direct deduction`);
    }

    const userId = reservation?.userId || 'usr_guest';
    const reservedAmount = reservation?.amount || 0;
    const cred = this.ensureUserCredits(userId);

    // Release reservation
    cred.reserved = Math.max(0, cred.reserved - reservedAmount);

    // Deduct actual cost
    const deduction = Math.max(0, params.actualCost);
    cred.balance = Math.max(0, cred.balance - deduction);
    cred.totalConsumed += deduction;
    cred.lastUpdated = Date.now();

    if (reservation) {
      this.pendingReservations.delete(params.reservationId);
    }

    this.saveFile('credits.json', this.credits);
    syncDocToFirestore('credits', userId, cred).catch(() => {});

    // Record persistent ledger transaction
    this.recordCreditTransaction({
      userId,
      type: 'consume',
      amount: -deduction,
      balanceAfter: cred.balance,
      operation: reservation?.operation || 'chat',
      model: reservation?.model,
      provider: reservation?.provider,
      inputTokens: params.inputTokens,
      outputTokens: params.outputTokens,
      costUSD: params.costUSD,
      referenceId: params.referenceId,
    });

    return {
      success: true,
      newBalance: cred.balance,
    };
  }

  /**
   * Atomic Rollback: Reverts reserved credits if the AI generation failed or timed out.
   */
  public rollbackReservation(reservationId: string, reason?: string) {
    const reservation = this.pendingReservations.get(reservationId);
    if (!reservation) return;

    const cred = this.ensureUserCredits(reservation.userId);
    cred.reserved = Math.max(0, cred.reserved - reservation.amount);
    cred.lastUpdated = Date.now();

    this.pendingReservations.delete(reservationId);
    this.saveFile('credits.json', this.credits);

    this.recordCreditTransaction({
      userId: reservation.userId,
      type: 'rollback',
      amount: 0,
      balanceAfter: cred.balance,
      operation: reservation.operation,
      model: reservation.model,
      notes: `Reserva liberada por fallo o timeout: ${reason || 'error'}`,
    });
  }

  public grantCredits(userId: string, amount: number, notes?: string): number {
    const cred = this.ensureUserCredits(userId);
    cred.balance += amount;
    cred.totalPurchased += amount;
    cred.lastUpdated = Date.now();

    this.saveFile('credits.json', this.credits);
    syncDocToFirestore('credits', userId, cred).catch(() => {});

    this.recordCreditTransaction({
      userId,
      type: 'grant',
      amount,
      balanceAfter: cred.balance,
      operation: 'subscription_grant',
      notes: notes || 'Recarga de créditos',
    });

    return cred.balance;
  }

  private recordCreditTransaction(tx: Omit<CreditTransactionEntity, 'id' | 'createdAt'>): CreditTransactionEntity {
    const id = `tx_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const record: CreditTransactionEntity = {
      ...tx,
      id,
      createdAt: Date.now(),
    };

    this.creditTransactions.set(id, record);
    this.saveFile('credit_transactions.json', this.creditTransactions);
    syncDocToFirestore('creditTransactions', id, record).catch(() => {});
    return record;
  }

  public listUserTransactions(userId: string, limit = 50): CreditTransactionEntity[] {
    return Array.from(this.creditTransactions.values())
      .filter((t) => t.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  // ---------------------------------------------------------------------------
  // WEBHOOK IDEMPOTENCY & EVENTS
  // ---------------------------------------------------------------------------
  /**
   * Checks if a webhook event was already processed.
   * If not, registers it as processed to guarantee zero double billing or duplicated grants.
   */
  public recordAndCheckWebhookEvent(
    eventId: string,
    eventType: string,
    payloadSummary: Record<string, any>
  ): { isDuplicate: boolean } {
    if (this.webhookEvents.has(eventId)) {
      console.log(`[Database] Idempotency guard: Webhook event ${eventId} (${eventType}) already processed.`);
      return { isDuplicate: true };
    }

    const record: WebhookEventEntity = {
      id: eventId,
      eventType,
      processedAt: Date.now(),
      status: 'processed',
      payloadSummary,
    };

    this.webhookEvents.set(eventId, record);
    this.saveFile('webhook_events.json', this.webhookEvents);
    return { isDuplicate: false };
  }

  // ---------------------------------------------------------------------------
  // SUBSCRIPTIONS & PLANS
  // ---------------------------------------------------------------------------
  public getPlan(planId: string): PlanEntity | undefined {
    return this.plans.get(planId);
  }

  public listPlans(): PlanEntity[] {
    return Array.from(this.plans.values()).filter((p) => p.isActive);
  }

  public upsertSubscription(sub: SubscriptionEntity) {
    this.subscriptions.set(sub.id, sub);
    this.saveFile('subscriptions.json', this.subscriptions);
    syncDocToFirestore('subscriptions', sub.id, sub).catch(() => {});

    // Sync with User
    const user = this.users.get(sub.userId);
    if (user) {
      user.plan = sub.planId;
      user.subscriptionStatus = sub.status;
      user.stripeSubscriptionId = sub.stripeSubscriptionId;
      user.currentPeriodEnd = sub.currentPeriodEnd;
      user.updatedAt = Date.now();
      this.saveFile('users.json', this.users);
    }
  }

  public getSubscriptionByUserId(userId: string): SubscriptionEntity | undefined {
    return Array.from(this.subscriptions.values()).find((s) => s.userId === userId);
  }

  // ---------------------------------------------------------------------------
  // PAYMENTS
  // ---------------------------------------------------------------------------
  public recordPayment(payment: Omit<PaymentEntity, 'id' | 'createdAt'>): PaymentEntity {
    const id = `pay_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const record: PaymentEntity = {
      ...payment,
      id,
      createdAt: Date.now(),
    };
    this.payments.set(id, record);
    this.saveFile('payments.json', this.payments);
    return record;
  }

  public listUserPayments(userId: string): PaymentEntity[] {
    return Array.from(this.payments.values())
      .filter((p) => p.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  // ---------------------------------------------------------------------------
  // AI REQUESTS & USAGE TELEMETRY
  // ---------------------------------------------------------------------------
  public logAiRequest(req: Omit<AiRequestEntity, 'id' | 'createdAt'>): AiRequestEntity {
    const id = `req_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const record: AiRequestEntity = {
      ...req,
      id,
      createdAt: Date.now(),
    };

    this.aiRequests.set(id, record);
    this.saveFile('ai_requests.json', this.aiRequests);
    syncDocToFirestore('aiRequests', id, record).catch(() => {});

    // Update aggregate daily usage
    const dateStr = new Date().toISOString().split('T')[0];
    const aggId = `${req.userId}_${dateStr}`;
    let agg = this.aiUsage.get(aggId);
    if (!agg) {
      agg = {
        id: aggId,
        userId: req.userId,
        dateString: dateStr,
        requestsCount: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCreditsUsed: 0,
        totalCostUSD: 0,
        modelBreakdown: {},
        updatedAt: Date.now(),
      };
    }

    agg.requestsCount += 1;
    agg.totalInputTokens += req.inputTokens;
    agg.totalOutputTokens += req.outputTokens;
    agg.totalCreditsUsed += req.costCredits;
    agg.totalCostUSD += req.costUSD;
    agg.modelBreakdown[req.model] = (agg.modelBreakdown[req.model] || 0) + 1;
    agg.updatedAt = Date.now();

    this.aiUsage.set(aggId, agg);
    this.saveFile('ai_usage.json', this.aiUsage);

    return record;
  }

  public getUserDailyUsage(userId: string): {
    messagesToday: number;
    tokensToday: number;
    creditsToday: number;
  } {
    const dateStr = new Date().toISOString().split('T')[0];
    const aggId = `${userId}_${dateStr}`;
    const agg = this.aiUsage.get(aggId);

    return {
      messagesToday: agg?.requestsCount || 0,
      tokensToday: (agg?.totalInputTokens || 0) + (agg?.totalOutputTokens || 0),
      creditsToday: agg?.totalCreditsUsed || 0,
    };
  }

  public getPlatformMetrics() {
    const totalRequests = this.aiRequests.size;
    let totalTokens = 0;
    let totalCost = 0;
    const modelDistribution: Record<string, number> = {};

    for (const r of this.aiRequests.values()) {
      totalTokens += (r.inputTokens || 0) + (r.outputTokens || 0);
      totalCost += r.costUSD || 0;
      modelDistribution[r.model] = (modelDistribution[r.model] || 0) + 1;
    }

    return {
      totalUsers: this.users.size,
      totalRequests,
      totalTokens,
      totalCostUSD: parseFloat(totalCost.toFixed(4)),
      modelDistribution,
      activeSubscriptions: Array.from(this.subscriptions.values()).filter((s) => s.status === 'active').length,
    };
  }
}
