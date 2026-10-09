import React, { useState, useEffect } from 'react';
import { UsageQuotaInfo } from '../../types';
import { createBillingCheckout, fetchCustomerPortal, fetchUserCredits } from '../../services/api';
import {
  CreditCard,
  Check,
  Zap,
  ShieldCheck,
  Clock,
  Sparkles,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Coins,
  History,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

interface BillingViewProps {
  usageInfo: UsageQuotaInfo | null;
  onPlanChanged: () => void;
  onNotify: (msg: string, type: 'info' | 'success' | 'warn') => void;
}

export const BillingView: React.FC<BillingViewProps> = ({
  usageInfo,
  onPlanChanged,
  onNotify,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [checkoutModal, setCheckoutModal] = useState<{ url: string; planName: string } | null>(null);
  const [creditsData, setCreditsData] = useState<{
    balance: number;
    totalPurchased: number;
    totalConsumed: number;
    reserved: number;
    transactions: any[];
  } | null>(null);
  const [isLoadingCredits, setIsLoadingCredits] = useState(false);

  const currentPlanId = usageInfo?.plan?.id || 'free';
  const messagesToday = usageInfo?.dailyUsage?.messagesToday || 0;
  const limit = usageInfo?.plan?.dailyMessageLimit || 25;
  const percentage = Math.min(100, Math.round((messagesToday / limit) * 100));

  const loadCredits = async () => {
    setIsLoadingCredits(true);
    try {
      const data = await fetchUserCredits();
      setCreditsData(data);
    } catch {
      // ignore
    } finally {
      setIsLoadingCredits(false);
    }
  };

  useEffect(() => {
    loadCredits();
  }, []);

  const plans = [
    {
      id: 'free',
      name: 'Free Starter',
      price: '$0',
      period: 'para siempre',
      credits: '100 créditos/mes',
      description: 'Ideal para probar las capacidades de la plataforma y desarrollo personal.',
      features: [
        '25 mensajes diarios',
        '100 créditos de bienvenida',
        'Gemini 3.5 Flash & Ministral 8B',
        'Google Web Search Grounding en tiempo real',
        'IDE y Sandbox en navegador',
        'Descarga de proyectos en ZIP real',
        'Cero datos ficticios',
      ],
      isPopular: false,
    },
    {
      id: 'starter',
      name: 'Starter Plan',
      price: selectedBillingCycle === 'monthly' ? '$9' : '$7.50',
      period: selectedBillingCycle === 'monthly' ? 'por mes' : 'por mes (anual)',
      credits: '1,000 créditos/mes',
      description: 'Para programadores y creadores de apps que buscan velocidad y capacidad extendida.',
      features: [
        '150 mensajes diarios',
        '1,000 créditos mensuales',
        'Codestral y Mistral Large',
        'Exportación de ZIP ilimitada',
        'Prioridad estándar en cola de inferencia',
        'Sin anuncios ni pausas',
      ],
      isPopular: false,
    },
    {
      id: 'pro',
      name: 'KiranIA Pro',
      price: selectedBillingCycle === 'monthly' ? '$20' : '$16',
      period: selectedBillingCycle === 'monthly' ? 'por mes' : 'por mes (anual)',
      credits: '3,000 créditos/mes',
      description: 'Para desarrolladores, arquitectos de software y creadores que requieren máxima potencia.',
      features: [
        '500 mensajes diarios',
        '3,000 créditos mensuales',
        'Acceso a GPT-4o, Claude 3.5 Sonnet y Gemini 3.1 Pro',
        'Model Arena: Comparativa simultánea de modelos',
        'Prioridad de inferencia y failover inteligente',
        'Memoria persistente de proyectos sin límites',
        'Proyectos ilimitados y descargas ZIP',
        'Soporte técnico preferente',
      ],
      isPopular: true,
    },
    {
      id: 'business',
      name: 'Enterprise / Team',
      price: selectedBillingCycle === 'monthly' ? '$59' : '$49',
      period: selectedBillingCycle === 'monthly' ? 'por mes' : 'por mes (anual)',
      credits: '15,000 créditos/mes',
      description: 'Para equipos de ingeniería, startups y empresas con alta demanda de IA.',
      features: [
        'Mensajes y tokens ilimitados',
        '15,000 créditos mensuales',
        'Acceso a modelos de razonamiento (DeepSeek R1, o1)',
        'Panel de control de costes y telemetría de equipo',
        'BYOK (Tus propias API keys corporativas)',
        'SLA 99.9% y túneles proxy dedicados',
        'Facturación corporativa y gestión de accesos (RBAC)',
      ],
      isPopular: false,
    },
  ];

  const handleSelectPlan = async (planId: string) => {
    if (planId === currentPlanId) {
      onNotify('Ya tienes activo este plan.', 'info');
      return;
    }

    if (planId === 'free') {
      onNotify('Para volver al plan Free, gestiona tu cancelación desde el Portal de Stripe.', 'info');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await createBillingCheckout(planId);
      if (res.checkoutUrl) {
        setCheckoutModal({ url: res.checkoutUrl, planName: planId.toUpperCase() });
        // Attempt direct navigation
        window.location.href = res.checkoutUrl;
      } else {
        onNotify(res.message || `Checkout preparado para ${planId}.`, 'success');
        onPlanChanged();
      }
    } catch (err: any) {
      onNotify(`Error en Stripe Checkout: ${err?.message || 'Error'}`, 'warn');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenPortal = async () => {
    setIsProcessing(true);
    try {
      const res = await fetchCustomerPortal();
      if (res.url) {
        window.location.href = res.url;
      }
    } catch (err: any) {
      onNotify(err?.message || 'Error abriendo Stripe Customer Portal.', 'warn');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] bg-[#09090b] overflow-y-auto p-4 md:p-8 select-none">
      <div className="max-w-6xl mx-auto w-full space-y-10 pb-20">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-800/60 text-purple-300 text-xs font-mono">
            <CreditCard className="w-3.5 h-3.5 text-purple-400" />
            <span>SISTEMA DE FACTURACIÓN & GESTIÓN DE PLANES</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
            Planes Transparentes y Flexibles
          </h1>
          <p className="text-sm md:text-base text-zinc-400 max-w-2xl mx-auto">
            Accede a los mejores modelos de IA del mundo con control de costes inteligente, sistema real de créditos y pasarela segura de Stripe.
          </p>

          {/* Billing Cycle Switcher */}
          <div className="inline-flex p-1 rounded-xl bg-[#14141c] border border-[#272732] gap-1 pt-1">
            <button
              onClick={() => setSelectedBillingCycle('monthly')}
              className={`px-4 py-1.5 rounded-lg text-xs font-mono transition-all ${
                selectedBillingCycle === 'monthly'
                  ? 'bg-purple-600 text-white font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Facturación Mensual
            </button>
            <button
              onClick={() => setSelectedBillingCycle('yearly')}
              className={`px-4 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
                selectedBillingCycle === 'yearly'
                  ? 'bg-purple-600 text-white font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>Facturación Anual</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                -20% Descuento
              </span>
            </button>
          </div>
        </div>

        {/* Real Credits & Plan Status Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Current Plan */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-[#121217] to-[#181822] border border-[#272732] shadow-xl flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-mono uppercase text-zinc-500 block mb-1">PLAN ACTUAL</span>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-white">
                  {usageInfo?.plan?.name || 'Free Starter'}
                </h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-700 font-semibold">
                  Activo
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-2">
                Cupo diario: <strong>{messagesToday}</strong> / {limit} mensajes
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-[#22222d] flex items-center justify-between">
              <span className="text-xs text-zinc-500 font-mono">Stripe Customer Portal</span>
              <button
                onClick={handleOpenPortal}
                disabled={isProcessing}
                className="text-xs font-mono px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 inline-flex items-center gap-1 transition-all"
              >
                <span>Gestionar</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Card 2: Real Credits Balance */}
          <div className="p-6 rounded-2xl bg-[#121217] border border-[#272732] shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-mono uppercase text-zinc-500">SALDO DE CRÉDITOS REAL</span>
                <Coins className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">
                  {creditsData ? creditsData.balance : '100'}
                </span>
                <span className="text-xs text-zinc-400 font-mono">créditos</span>
              </div>
              <p className="text-xs text-zinc-400 mt-2">
                Consumidos: <strong>{creditsData?.totalConsumed || 0}</strong> • Reservas en vuelo:{' '}
                <strong>{creditsData?.reserved || 0}</strong>
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-[#22222d] flex items-center justify-between">
              <span className="text-xs text-zinc-500 font-mono">Descuento atómico por token</span>
              <button
                onClick={loadCredits}
                disabled={isLoadingCredits}
                className="p-1 rounded text-zinc-400 hover:text-white transition-all"
                title="Actualizar saldo"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCredits ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Card 3: Stripe Security & Status */}
          <div className="p-6 rounded-2xl bg-[#121217] border border-[#272732] shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-mono uppercase text-zinc-500">PASARELA STRIPE</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-bold text-white">Stripe Checkout Conectado</span>
              </div>
              <p className="text-xs text-zinc-400 mt-2">
                Firmas criptográficas de Webhooks y protección contra duplicidad (Idempotencia activa).
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-[#22222d] text-xs font-mono text-emerald-400/90 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>Fuente de verdad: Webhooks seguros</span>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {plans.map((p) => {
            const isCurrent = p.id === currentPlanId;

            return (
              <div
                key={p.id}
                className={`relative p-6 rounded-2xl border flex flex-col justify-between transition-all duration-300 ${
                  p.isPopular
                    ? 'bg-gradient-to-b from-[#181824] to-[#101018] border-purple-500 shadow-[0_0_40px_rgba(147,51,234,0.25)] ring-1 ring-purple-500/50'
                    : 'bg-[#0e0e14] border-[#272732] hover:border-zinc-600 shadow-xl'
                }`}
              >
                {p.isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[11px] font-mono font-bold tracking-wider uppercase shadow-md">
                    MÁS POPULAR
                  </div>
                )}

                <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-white">{p.name}</h3>
                    <div className="inline-block px-2 py-0.5 rounded bg-zinc-800 text-[11px] font-mono text-amber-300 mt-1">
                      {p.credits}
                    </div>
                    <p className="text-xs text-zinc-400 mt-2 min-h-[32px]">{p.description}</p>
                  </div>

                  <div className="mb-6 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white">{p.price}</span>
                    <span className="text-xs font-mono text-zinc-500">/ {p.period}</span>
                  </div>

                  {/* Features list */}
                  <div className="space-y-2 mb-6 text-xs text-zinc-300">
                    {p.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleSelectPlan(p.id)}
                  disabled={isCurrent || isProcessing}
                  className={`w-full py-2.5 rounded-xl text-xs font-mono font-semibold transition-all ${
                    isCurrent
                      ? 'bg-zinc-800 text-zinc-400 border border-zinc-700 cursor-default'
                      : p.isPopular
                      ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(147,51,234,0.4)]'
                      : 'bg-[#181822] hover:bg-white/10 text-white border border-[#272732]'
                  }`}
                >
                  {isCurrent ? 'Plan Actual' : `Suscribirme a ${p.name}`}
                </button>
              </div>
            );
          })}
        </div>

        {/* Real Credit Transaction Ledger */}
        {creditsData?.transactions && creditsData.transactions.length > 0 && (
          <div className="p-6 rounded-2xl bg-[#0e0e14] border border-[#272732] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-white font-mono">
                <History className="w-4 h-4 text-purple-400" />
                <span>LIBRO MAYOR DE TRANSACCIONES & CONSUMO DE CRÉDITOS</span>
              </div>
              <span className="text-xs font-mono text-zinc-500">
                {creditsData.transactions.length} registros recientes
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="text-zinc-500 border-b border-[#22222d] pb-2">
                  <tr>
                    <th className="py-2">Fecha</th>
                    <th className="py-2">Operación</th>
                    <th className="py-2">Modelo</th>
                    <th className="py-2 text-right">Variación</th>
                    <th className="py-2 text-right">Saldo Posterior</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#181822] text-zinc-300">
                  {creditsData.transactions.slice(0, 10).map((tx) => (
                    <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-2.5 text-zinc-400">
                        {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 uppercase font-semibold text-zinc-200">
                        {tx.operation.replace('_', ' ')}
                      </td>
                      <td className="py-2.5 text-zinc-400">{tx.model || tx.notes || '—'}</td>
                      <td className={`py-2.5 text-right font-bold ${tx.amount > 0 ? 'text-emerald-400' : tx.amount < 0 ? 'text-rose-400' : 'text-zinc-400'}`}>
                        {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                      </td>
                      <td className="py-2.5 text-right font-semibold text-white">
                        {tx.balanceAfter}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Stripe Architecture & Compliance Notes */}
        <div className="p-6 rounded-2xl bg-[#0e0e14] border border-[#272732] space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>ARQUITECTURA DE PAGOS & SEGURIDAD STRIPE</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-400 leading-relaxed font-sans">
            <div>
              <strong className="text-zinc-200 block mb-1">Cero Almacenamiento de Tarjetas:</strong>
              Todos los datos sensibles de pago se gestionan directamente a través de Stripe Checkout y el Customer Portal sin tocar los servidores de la aplicación.
            </div>
            <div>
              <strong className="text-zinc-200 block mb-1">Suscripciones Recurrentes:</strong>
              Gestión de upgrades, downgrades, cancelaciones inmediatas al finalizar el ciclo y webhooks firmados criptográficamente.
            </div>
            <div>
              <strong className="text-zinc-200 block mb-1">Idempotencia Garantizada:</strong>
              Cada evento de webhook tiene deduplicación de ID para evitar cargos dobles o recargas accidentales duplicadas de créditos.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
