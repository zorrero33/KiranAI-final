import React from 'react';
import {
  X,
  Cpu,
  Zap,
  ShieldCheck,
  Activity,
  ArrowRight,
  Layers,
  Sparkles,
} from 'lucide-react';
import { ModelOption } from '../types';

interface ModelCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  models: ModelOption[];
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  lastFallbackInfo?: {
    fromModel: string;
    toModel: string;
    reason: string;
  } | null;
}

export const ModelCatalogModal: React.FC<ModelCatalogModalProps> = ({
  isOpen,
  onClose,
  models,
  selectedModel,
  onSelectModel,
  lastFallbackInfo,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#020005]/80 backdrop-blur-xl transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-4xl rounded-2xl bg-[#080014]/90 border border-purple-500/25 shadow-[0_0_60px_rgba(139,92,246,0.2)] backdrop-blur-2xl p-6 sm:p-8 text-white z-10 overflow-hidden">
        {/* Decorative cosmic background glows */}
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-pink-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative flex items-center justify-between pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600/40 to-pink-600/40 border border-violet-400/30 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.3)]">
              <Cpu className="w-6 h-6 text-violet-300" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Catálogo de Modelos & Auto-Failover
                <span className="text-xs font-mono py-0.5 px-2.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  LiteLLM Gateway
                </span>
              </h2>
              <p className="text-sm text-slate-400">
                Selecciona un modelo o deja que el sistema conmute automáticamente ante cuotas 429 o saturación.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Fallback Notification if active */}
        {lastFallbackInfo && (
          <div className="my-5 p-4 rounded-xl bg-violet-950/40 border border-violet-500/30 flex items-start gap-3 shadow-[0_0_25px_rgba(168,85,247,0.15)]">
            <Activity className="w-5 h-5 text-violet-400 shrink-0 mt-0.5 animate-pulse" />
            <div className="text-sm">
              <span className="font-semibold text-violet-300">
                Resiliencia Activa (Auto-Failover):
              </span>{' '}
              Se detectó límite de cuota o error en{' '}
              <code className="text-pink-300 bg-pink-950/50 px-1.5 py-0.5 rounded font-mono text-xs">
                {lastFallbackInfo.fromModel}
              </code>
              . La consulta fue transferida instantáneamente a{' '}
              <code className="text-emerald-300 bg-emerald-950/50 px-1.5 py-0.5 rounded font-mono text-xs">
                {lastFallbackInfo.toModel}
              </code>{' '}
              sin perder el flujo.
            </div>
          </div>
        )}

        {/* Models Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6 max-h-[60vh] overflow-y-auto pr-1">
          {models.map((model) => {
            const isSelected = selectedModel === model.id;
            const isWorking =
              model.tier.includes('Active') ||
              model.tier.includes('Included') ||
              model.tier.includes('Google') ||
              model.tier.includes('OpenRouter') ||
              model.tier.includes('Groq');

            return (
              <div
                key={model.id}
                onClick={() => {
                  onSelectModel(model.id);
                  onClose();
                }}
                className={`group relative p-4 rounded-xl cursor-pointer transition-all duration-300 border ${
                  isSelected
                    ? 'bg-gradient-to-br from-violet-950/60 to-purple-950/40 border-violet-400 shadow-[0_0_30px_rgba(139,92,246,0.3)] ring-1 ring-violet-400/50'
                    : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/10 hover:border-violet-500/40'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        isSelected
                          ? 'bg-violet-500/30 text-violet-200'
                          : 'bg-white/5 text-slate-400 group-hover:text-violet-300'
                      }`}
                    >
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-white flex items-center gap-2">
                        {model.name}
                        {isSelected && (
                          <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full bg-violet-500/30 text-violet-200 border border-violet-400/40">
                            Activo
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        {model.id}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      isWorking
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {isWorking ? 'Disponible' : 'Configurado'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-3">
                  {model.capabilities.map((cap, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/5"
                    >
                      {cap}
                    </span>
                  ))}
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
                    Enrutado por LiteLLM Proxy
                  </span>
                  <span className="text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    Seleccionar <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-white/10 text-xs text-slate-400 gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span>
              <strong>Failover inteligente:</strong> Si una llamada da error 429, el servidor pasa automáticamente al siguiente modelo disponible sin perder el hilo.
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors shadow-[0_0_15px_rgba(139,92,246,0.4)]"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};
