import Stripe from 'stripe';
import { Database } from './db/database.ts';

export class StripeManager {
  private static instance: StripeManager;
  private stripe: Stripe | null = null;
  private secretKey: string | undefined;
  private webhookSecret: string | undefined;
  private priceIdPro: string | undefined;
  private priceIdBusiness: string | undefined;
  private db: Database;

  private constructor() {
    this.db = Database.getInstance();
    this.secretKey = process.env.STRIPE_SECRET_KEY;
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    this.priceIdPro = process.env.STRIPE_PRICE_ID_PRO;
    this.priceIdBusiness = process.env.STRIPE_PRICE_ID_BUSINESS;

    if (this.secretKey) {
      try {
        this.stripe = new Stripe(this.secretKey, {
          apiVersion: '2025-01-27.acacia' as any,
          typescript: true,
        });
        console.log('[StripeManager] Stripe SDK initialized with secret key.');
      } catch (err) {
        console.warn('[StripeManager] Error initializing Stripe SDK:', err);
      }
    } else {
      console.log('[StripeManager] STRIPE_SECRET_KEY not set.');
    }
  }

  public static getInstance(): StripeManager {
    if (!StripeManager.instance) {
      StripeManager.instance = new StripeManager();
    }
    return StripeManager.instance;
  }

  public isConfigured(): boolean {
    return !!this.stripe && !!this.secretKey;
  }

  public getDiagnostic() {
    return {
      configured: this.isConfigured(),
      hasSecretKey: !!this.secretKey,
      hasWebhookSecret: !!this.webhookSecret,
      hasPriceIdPro: !!this.priceIdPro,
      hasPriceIdBusiness: !!this.priceIdBusiness,
      priceIdPro: this.priceIdPro ? `${this.priceIdPro.slice(0, 10)}...` : null,
      priceIdBusiness: this.priceIdBusiness ? `${this.priceIdBusiness.slice(0, 10)}...` : null,
    };
  }

  public async createCheckoutSession(params: {
    userId: string;
    userEmail: string;
    planId: 'starter' | 'pro' | 'business';
    originUrl: string;
  }): Promise<{ url: string; sessionId: string }> {
    if (!this.stripe) {
      throw new Error(
        'Stripe no está configurado en el servidor. Por favor, configura STRIPE_SECRET_KEY en las variables de entorno.'
      );
    }

    const user = this.db.getUserById(params.userId);
    const plan = this.db.getPlan(params.planId);
    if (!plan) {
      throw new Error(`Plan ${params.planId} no encontrado en la base de datos.`);
    }

    const priceId =
      params.planId === 'business'
        ? this.priceIdBusiness || plan.stripePriceIdMonthly
        : this.priceIdPro || plan.stripePriceIdMonthly;

    if (!priceId) {
      throw new Error(
        `No se ha encontrado un Stripe Price ID para el plan ${params.planId}. Configura STRIPE_PRICE_ID_${params.planId.toUpperCase()} en las variables de entorno.`
      );
    }

    // Reuse or create Stripe customer
    let customerId = user?.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: params.userEmail,
        name: user?.name,
        metadata: { userId: params.userId },
      });
      customerId = customer.id;
      this.db.updateUser(params.userId, { stripeCustomerId: customerId });
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${params.originUrl}/?billing=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${params.originUrl}/?billing=cancelled`,
      metadata: {
        userId: params.userId,
        planId: params.planId,
      },
      subscription_data: {
        metadata: {
          userId: params.userId,
          planId: params.planId,
        },
      },
    });

    if (!session.url) {
      throw new Error('Stripe Checkout no devolvió una URL válida.');
    }

    return {
      url: session.url,
      sessionId: session.id,
    };
  }

  public async createCustomerPortalSession(params: {
    userId: string;
    originUrl: string;
  }): Promise<{ url: string }> {
    if (!this.stripe) {
      throw new Error('Stripe no está configurado en el servidor.');
    }

    const user = this.db.getUserById(params.userId);
    if (!user?.stripeCustomerId) {
      throw new Error(
        'El usuario aún no posee un cliente de Stripe asociado. Realiza primero una suscripción para acceder al portal.'
      );
    }

    const portalSession = await this.stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${params.originUrl}/`,
    });

    return { url: portalSession.url };
  }

  /**
   * Cryptographically Verified Webhook Handler with Idempotency Guard
   */
  public async handleWebhook(
    rawBody: string | Buffer,
    signature: string
  ): Promise<{ received: boolean; eventType: string; duplicate?: boolean }> {
    if (!this.stripe || !this.webhookSecret) {
      throw new Error('Stripe Webhook Secret no está configurado en el servidor.');
    }

    // 1. Verify cryptographic signature
    const event = this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);

    // 2. Idempotency Check: guarantee event is processed at most once
    const { isDuplicate } = this.db.recordAndCheckWebhookEvent(event.id, event.type, {
      type: event.type,
      created: event.created,
    });

    if (isDuplicate) {
      return { received: true, eventType: event.type, duplicate: true };
    }

    // 3. Process Event Types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const planId = (session.metadata?.planId as 'starter' | 'pro' | 'business') || 'pro';
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (userId) {
          const plan = this.db.getPlan(planId);
          const creditsToGrant = plan?.creditsPerMonth || 3000;

          // Activate user plan
          this.db.updateUser(userId, {
            plan: planId,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            subscriptionStatus: 'active',
            currentPeriodEnd: Date.now() + 86400000 * 30,
          });

          // Grant monthly credits
          this.db.grantCredits(userId, creditsToGrant, `Activación suscripción plan ${planId.toUpperCase()}`);

          // Register subscription
          this.db.upsertSubscription({
            id: `sub_${subscriptionId || Date.now()}`,
            userId,
            planId,
            status: 'active',
            stripeSubscriptionId: subscriptionId,
            stripeCustomerId: customerId,
            currentPeriodStart: Date.now(),
            currentPeriodEnd: Date.now() + 86400000 * 30,
            cancelAtPeriodEnd: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });

          // Record payment
          this.db.recordPayment({
            userId,
            stripeSessionId: session.id,
            amountUSD: (session.amount_total || 0) / 100,
            currency: session.currency?.toUpperCase() || 'USD',
            status: 'succeeded',
            creditsAdded: creditsToGrant,
            description: `Checkout completado: Plan ${planId.toUpperCase()}`,
          });

          console.log(`[Stripe Webhook] Suscripción activada para usuario ${userId}: Plan ${planId}`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const subscriptionId = (invoice as any).subscription as string;
        const user = this.db.getUserByStripeCustomerId(customerId);

        if (user && invoice.billing_reason === 'subscription_cycle') {
          // Recurring billing renewal!
          const plan = this.db.getPlan(user.plan);
          const creditsToGrant = plan?.creditsPerMonth || 3000;

          this.db.grantCredits(
            user.id,
            creditsToGrant,
            `Renovación mensual suscripción plan ${user.plan.toUpperCase()}`
          );

          this.db.recordPayment({
            userId: user.id,
            stripeInvoiceId: invoice.id,
            amountUSD: (invoice.amount_paid || 0) / 100,
            currency: invoice.currency?.toUpperCase() || 'USD',
            status: 'succeeded',
            creditsAdded: creditsToGrant,
            receiptUrl: invoice.hosted_invoice_url || undefined,
            description: `Renovación mensual de suscripción (${user.plan.toUpperCase()})`,
          });

          console.log(`[Stripe Webhook] Renovación exitosa para usuario ${user.id}: +${creditsToGrant} créditos.`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const user = this.db.getUserByStripeCustomerId(customerId);
        if (user) {
          this.db.updateUser(user.id, { subscriptionStatus: 'past_due' });
          console.warn(`[Stripe Webhook] Pago fallido en factura ${invoice.id} para usuario ${user.id}.`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const user = this.db.getUserByStripeCustomerId(customerId);
        if (user) {
          this.db.updateUser(user.id, {
            plan: 'free',
            subscriptionStatus: 'canceled',
            stripeSubscriptionId: undefined,
          });
          console.log(`[Stripe Webhook] Suscripción cancelada para usuario ${user.id}, plan revertido a Free.`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const user = this.db.getUserByStripeCustomerId(customerId);
        if (user) {
          const statusMap: Record<string, any> = {
            active: 'active',
            past_due: 'past_due',
            canceled: 'canceled',
            trialing: 'trialing',
            unpaid: 'unpaid',
          };
          const mappedStatus = statusMap[subscription.status] || 'active';
          this.db.updateUser(user.id, {
            subscriptionStatus: mappedStatus,
            currentPeriodEnd: subscription.items?.data?.[0]?.current_period_end
              ? subscription.items.data[0].current_period_end * 1000
              : Date.now() + 86400000 * 30,
          });
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const customerId = charge.customer as string;
        const user = this.db.getUserByStripeCustomerId(customerId);
        if (user) {
          this.db.recordPayment({
            userId: user.id,
            amountUSD: -(charge.amount_refunded / 100),
            currency: charge.currency.toUpperCase(),
            status: 'refunded',
            creditsAdded: 0,
            description: `Reembolso procesado por Stripe: ${charge.id}`,
          });
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Evento recibido: ${event.type}`);
    }

    return { received: true, eventType: event.type };
  }
}
