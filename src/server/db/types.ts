export type UserRole = 'user' | 'admin';
export type PlanTier = 'free' | 'starter' | 'pro' | 'business';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' | 'none';
export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';
export type TransactionType = 'grant' | 'purchase' | 'consume' | 'refund' | 'rollback';
export type AiRequestStatus = 'pending' | 'success' | 'failed' | 'refunded';
export type ProviderStatus = 'active' | 'missing_key' | 'quota_exhausted' | 'disabled';
export type ModelStatus = 'active' | 'key_required' | 'unavailable' | 'deprecated';

export interface UserEntity {
  id: string;
  email: string;
  name: string;
  passwordHash?: string;
  role: UserRole;
  plan: PlanTier;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus: SubscriptionStatus;
  currentPeriodEnd?: number;
  avatarUrl?: string;
  createdAt: number;
  updatedAt: number;
  lastLoginAt?: number;
  apiKeys?: Array<{ id: string; name: string; key: string; createdAt: number }>;
  preferences?: Record<string, any>;
}

export interface SubscriptionEntity {
  id: string;
  userId: string;
  planId: PlanTier;
  status: SubscriptionStatus;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  stripePriceId?: string;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  canceledAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface PlanEntity {
  id: PlanTier;
  name: string;
  pricePerMonthUSD: number;
  pricePerYearUSD: number;
  creditsPerMonth: number;
  dailyMessageLimit: number;
  allowedModels: string[];
  features: string[];
  maxProjects: number;
  priorityRouting: boolean;
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
  isActive: boolean;
}

export interface PaymentEntity {
  id: string;
  userId: string;
  stripePaymentIntentId?: string;
  stripeSessionId?: string;
  stripeInvoiceId?: string;
  amountUSD: number;
  currency: string;
  status: PaymentStatus;
  creditsAdded: number;
  receiptUrl?: string;
  description: string;
  createdAt: number;
}

export interface UserCreditsEntity {
  userId: string;
  balance: number;
  totalPurchased: number;
  totalConsumed: number;
  reserved: number; // in-flight reservations
  lastUpdated: number;
}

export interface CreditTransactionEntity {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number; // positive for grants/refunds, negative for consumption
  balanceAfter: number;
  operation: 'chat' | 'image_generation' | 'document_audit' | 'compare_arena' | 'subscription_grant' | 'manual_adjustment';
  model?: string;
  provider?: string;
  inputTokens?: number;
  outputTokens?: number;
  costUSD?: number;
  referenceId?: string; // request ID or payment ID
  notes?: string;
  createdAt: number;
}

export interface AiRequestEntity {
  id: string;
  userId: string;
  provider: string;
  model: string;
  capability: 'text' | 'vision' | 'audio' | 'code' | 'image';
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  status: AiRequestStatus;
  costCredits: number;
  costUSD: number;
  errorMessage?: string;
  ipAddress?: string;
  createdAt: number;
}

export interface AiUsageAggregateEntity {
  id: string; // e.g. `${userId}_${YYYY-MM-DD}`
  userId: string;
  dateString: string; // YYYY-MM-DD
  requestsCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCreditsUsed: number;
  totalCostUSD: number;
  modelBreakdown: Record<string, number>;
  updatedAt: number;
}

export interface ModelEntity {
  id: string;
  provider: string;
  name: string;
  shortName: string;
  description: string;
  family: string;
  contextWindow: number;
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
    creditsPerRequestBase: number;
    isFreeTierAvailable: boolean;
  };
  speedRating: 'ultra-fast' | 'fast' | 'balanced' | 'deep-thinking';
  status: ModelStatus;
  statusReason?: string;
  badges: string[];
  isDefault?: boolean;
}

export interface ProviderEntity {
  id: string;
  name: string;
  website: string;
  envVar: string;
  isConfigured: boolean;
  status: ProviderStatus;
  statusMessage: string;
  docsUrl: string;
  supportedModels: string[];
  capabilities: string[];
  requiresOAuth: boolean;
}

export interface WebhookEventEntity {
  id: string; // Stripe event id (e.g. evt_12345)
  eventType: string;
  processedAt: number;
  status: 'processed' | 'ignored' | 'failed';
  errorDetails?: string;
  payloadSummary: Record<string, any>;
}
