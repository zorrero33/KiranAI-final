import React, { useState, useMemo, useEffect } from 'react';
import { ModelOption } from '../../types';
import { fetchProviderAudit } from '../../services/api';
import {
  Cpu,
  Search,
  Zap,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  SlidersHorizontal,
  RefreshCw,
  GitCompare,
  Eye,
  Check,
  Activity,
  Layers,
  DollarSign,
  Maximize2,
  X,
  AlertTriangle,
  KeyRound,
  ExternalLink,
} from 'lucide-react';

interface ModelsCatalogViewProps {
  models: ModelOption[];
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  onLaunchCompare: (selectedModelIds: string[]) => void;
  onRefreshDiscovery: () => Promise<void>;
  isRefreshing?: boolean;
}

export const ModelsCatalogView: React.FC<ModelsCatalogViewProps> = ({
  models,
  selectedModel,
  onSelectModel,
  onLaunchCompare,
  onRefreshDiscovery,
  isRefreshing,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [selectedModality, setSelectedModality] = useState<string>('all');
  const [selectedBadge, setSelectedBadge] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recommended' | 'speed' | 'context' | 'cost'>('recommended');
  const [compareList, setCompareList] = useState<string[]>([]);
  const [inspectingModel, setInspectingModel] = useState<ModelOption | null>(null);
  const [catalogNotice, setCatalogNotice] = useState<string | null>(null);
  const [providerAudit, setProviderAudit] = useState<any[]>([]);

  useEffect(() => {
    fetchProviderAudit()
      .then((res) => {
        if (res?.providers) setProviderAudit(res.providers);
      })
      .catch(() => {});
  }, []);

  // Extract unique providers
  const providers = useMemo(() => {
    const list = Array.from(new Set(models.map((m) => m.provider || 'Other'))).filter(Boolean);
    return ['all', ...list];
  }, [models]);

  const toggleCompare = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompareList((prev) => {
      if (prev.includes(id)) {
        return prev.filter((m) => m !== id);
      }
      if (prev.length >= 3) {
        setCatalogNotice('Puedes comparar hasta un máximo de 3 modelos simultáneamente.');
        setTimeout(() => setCatalogNotice(null), 3500);
        return prev;
      }
      return [...prev, id];
    });
  };

  const filteredModels = useMemo(() => {
    return models
      .filter((m) => {
        const matchesSearch =
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (m.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (m.provider || '').toLowerCase().includes(searchQuery.toLowerCase());

        const matchesProvider =
          selectedProvider === 'all' || (m.provider || '').toLowerCase() === selectedProvider.toLowerCase();

        const matchesModality =
          selectedModality === 'all' ||
          (selectedModality === 'vision' && m.capabilities.some((c) => c.toLowerCase().includes('visión') || c.toLowerCase().includes('vision'))) ||
          (selectedModality === 'reasoning' && (m.badges?.includes('reasoning') || m.capabilities.some((c) => c.toLowerCase().includes('razonamiento')))) ||
          (selectedModality === 'code' && m.capabilities.some((c) => c.toLowerCase().includes('código') || c.toLowerCase().includes('code')));

        const matchesBadge =
          selectedBadge === 'all' || (m.badges && m.badges.includes(selectedBadge));

        return matchesSearch && matchesProvider && matchesModality && matchesBadge;
      })
      .sort((a, b) => {
        if (sortBy === 'speed') {
          return (b.tokensPerSecEstimate || 0) - (a.tokensPerSecEstimate || 0);
        }
        if (sortBy === 'context') {
          return (b.contextWindow || 0) - (a.contextWindow || 0);
        }
        if (sortBy === 'cost') {
          return (a.pricing?.inputPerMillionUSD || 0) - (b.pricing?.inputPerMillionUSD || 0);
        }
        // Recommended first
        const aScore = a.badges?.includes('recommended') ? 2 : 0;
        const bScore = b.badges?.includes('recommended') ? 2 : 0;
        return bScore - aScore;
      });
  }, [models, searchQuery, selectedProvider, selectedModality, selectedBadge, sortBy]);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] bg-[#09090b] overflow-y-auto p-4 md:p-8 select-none">
      <div className="max-w-7xl mx-auto w-full space-y-6 pb-20">
        {/* Header & Sync Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#272732] pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-600/50 flex items-center justify-center p-[1px] shadow-lg">
                <Cpu className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  Catálogo de Modelos & Discovery Engine
                  <span className="text-xs font-mono py-0.5 px-2.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800/60 font-medium">
                    LiteLLM Gateway
                  </span>
                </h1>
                <p className="text-xs md:text-sm text-zinc-400">
                  Explora, filtra y compara modelos de Google, OpenAI, Anthropic, DeepSeek, Groq y más en una interfaz unificada.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {compareList.length > 0 && (
              <button
                onClick={() => onLaunchCompare(compareList)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white text-xs font-semibold font-mono shadow-[0_0_20px_rgba(192,38,211,0.3)] transition-all animate-in fade-in"
              >
                <GitCompare className="w-4 h-4" />
                <span>Comparar ({compareList.length}) en Arena</span>
              </button>
            )}

            <button
              onClick={onRefreshDiscovery}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#121217] hover:bg-[#181820] border border-[#272732] text-xs font-medium text-zinc-300 transition-colors"
              title="Descubrir y sincronizar modelos desde LiteLLM Proxy"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-purple-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Sincronizando...' : 'Auto-Discovery'}</span>
            </button>
          </div>
        </div>

        {/* In-app notification notice */}
        {catalogNotice && (
          <div className="p-3 bg-purple-950/60 border border-purple-500/40 rounded-xl text-xs text-purple-200 flex items-center justify-between shadow-lg">
            <span>{catalogNotice}</span>
            <button onClick={() => setCatalogNotice(null)} className="text-purple-400 hover:text-white text-xs ml-2">✕</button>
          </div>
        )}

        {/* Real Provider Diagnostic Audit Cards */}
        {providerAudit.length > 0 && (
          <div className="p-4 rounded-2xl bg-[#0e0e14] border border-[#272732] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Auditoría de Proveedores & API Keys en Servidor
                </span>
              </div>
              <span className="text-[11px] font-mono text-zinc-500">
                Transparencia total • Cero respuestas falsas
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {providerAudit.map((prov) => {
                const isActive = prov.status === 'active';
                const isQuota = prov.status === 'quota_exhausted';

                return (
                  <div
                    key={prov.id}
                    onClick={() => {
                      setCatalogNotice(
                        isActive
                          ? `${prov.name} está activo y verificado en el backend con la variable ${prov.envVar}.`
                          : isQuota
                          ? `${prov.name}: Variable ${prov.envVar} configurada, pero reporta cuota agotada (429). Recarga saldo en ${prov.docsUrl}`
                          : `${prov.name}: Falta la variable ${prov.envVar} en el servidor. Consigue tu API key en: ${prov.docsUrl}`
                      );
                    }}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      isActive
                        ? 'bg-emerald-950/20 border-emerald-800/40 hover:border-emerald-500/60'
                        : isQuota
                        ? 'bg-amber-950/20 border-amber-800/40 hover:border-amber-500/60'
                        : 'bg-zinc-900/40 border-zinc-800/60 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">{prov.name}</span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isActive
                            ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                            : isQuota
                            ? 'bg-amber-400'
                            : 'bg-zinc-600'
                        }`}
                      />
                    </div>
                    <div className="text-[10px] font-mono text-zinc-400 truncate">
                      {isActive ? 'Activo (Enrutado)' : isQuota ? 'Cuota Agotada' : `Falta ${prov.envVar}`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="space-y-3 bg-[#0e0e14] p-4 rounded-2xl border border-[#272732] shadow-xl">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar modelo por nombre, proveedor, ID o capacidad (ej: gpt-4o, claude, visión, 1M)..."
                className="w-full bg-[#14141c] border border-[#272732] rounded-xl pl-9 pr-4 py-2 text-xs md:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-600 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-zinc-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#14141c] border border-[#272732] rounded-xl px-3 py-2 text-xs font-mono text-zinc-300 focus:outline-none focus:border-purple-600"
              >
                <option value="recommended">Recomendados primero</option>
                <option value="speed">Más rápidos (tokens/s)</option>
                <option value="context">Mayor ventana de contexto</option>
                <option value="cost">Menor coste ($/token)</option>
              </select>
            </div>
          </div>

          {/* Quick Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#22222f]">
            <span className="text-[11px] font-mono text-zinc-500 uppercase mr-1">Proveedor:</span>
            {providers.map((p) => (
              <button
                key={p}
                onClick={() => setSelectedProvider(p)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                  selectedProvider === p
                    ? 'bg-purple-950/80 border border-purple-600/70 text-purple-200 font-semibold shadow-sm'
                    : 'bg-[#14141c] border border-[#272732] text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                {p === 'all' ? 'Todos' : p}
              </button>
            ))}

            <div className="h-4 w-[1px] bg-zinc-700 mx-1 hidden sm:block" />

            <span className="text-[11px] font-mono text-zinc-500 uppercase mr-1">Capacidad:</span>
            <button
              onClick={() => setSelectedModality(selectedModality === 'vision' ? 'all' : 'vision')}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                selectedModality === 'vision'
                  ? 'bg-emerald-950/80 border border-emerald-600/70 text-emerald-300'
                  : 'bg-[#14141c] text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Visión & OCR
            </button>
            <button
              onClick={() => setSelectedModality(selectedModality === 'reasoning' ? 'all' : 'reasoning')}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                selectedModality === 'reasoning'
                  ? 'bg-fuchsia-950/80 border border-fuchsia-600/70 text-fuchsia-300'
                  : 'bg-[#14141c] text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Razonamiento
            </button>
            <button
              onClick={() => setSelectedModality(selectedModality === 'code' ? 'all' : 'code')}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                selectedModality === 'code'
                  ? 'bg-cyan-950/80 border border-cyan-600/70 text-cyan-300'
                  : 'bg-[#14141c] text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Código
            </button>
          </div>
        </div>

        {/* Counter & Active Comparison Bar */}
        <div className="flex items-center justify-between px-1 text-xs font-mono text-zinc-400">
          <span>Mostrando {filteredModels.length} de {models.length} modelos registrados</span>
          {compareList.length > 0 && (
            <span className="text-purple-400">
              {compareList.length} seleccionado(s) para comparar. Pulsa &quot;Comparar en Arena&quot;.
            </span>
          )}
        </div>

        {/* Models Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModels.map((model) => {
            const isSelected = selectedModel === model.id;
            const inCompare = compareList.includes(model.id);

            return (
              <div
                key={model.id}
                onClick={() => onSelectModel(model.id)}
                className={`group relative p-4 rounded-2xl cursor-pointer transition-all duration-300 border flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-br from-purple-950/50 to-indigo-950/30 border-purple-500 shadow-[0_0_30px_rgba(139,92,246,0.25)] ring-1 ring-purple-500/50'
                    : 'bg-[#121217] hover:bg-[#161620] border-[#272732] hover:border-purple-600/50 shadow-lg'
                }`}
              >
                <div>
                  {/* Top Bar: Provider + Badges */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-semibold border border-[#303040]">
                        {model.provider || 'Proveedor'}
                      </span>
                      {model.status && (
                        <span
                          title={model.tier}
                          className={`inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded border font-semibold ${
                            model.status === 'active'
                              ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60'
                              : model.status === 'configured'
                              ? 'bg-sky-950/70 text-sky-300 border-sky-700/60'
                              : model.status === 'key_required'
                              ? 'bg-amber-950/70 text-amber-300 border-amber-700/60'
                              : 'bg-zinc-900 text-zinc-400 border-zinc-700/60'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              model.status === 'active'
                                ? 'bg-emerald-400'
                                : model.status === 'configured'
                                ? 'bg-sky-400'
                                : model.status === 'key_required'
                                ? 'bg-amber-400'
                                : 'bg-zinc-500'
                            }`}
                          />
                          {model.status === 'active'
                            ? 'Disponible'
                            : model.status === 'configured'
                            ? 'Configurado'
                            : model.status === 'key_required'
                            ? 'Sin clave'
                            : model.status === 'deprecated'
                            ? 'Obsoleto'
                            : model.status === 'unavailable'
                            ? 'Sin acceso'
                            : 'No disponible'}
                        </span>
                      )}
                      {model.badges?.includes('recommended') && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-700/60 flex items-center gap-1 font-semibold">
                          <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                          Recomendado
                        </span>
                      )}
                      {model.badges?.includes('fastest') && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 flex items-center gap-1 font-semibold">
                          <Zap className="w-2.5 h-2.5 text-emerald-400" />
                          Ultra-rápido
                        </span>
                      )}
                      {model.badges?.includes('reasoning') && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-fuchsia-950/80 text-fuchsia-300 border border-fuchsia-700/60 font-semibold">
                          Reasoning
                        </span>
                      )}
                    </div>

                    {/* Compare checkbox */}
                    <button
                      type="button"
                      onClick={(e) => toggleCompare(model.id, e)}
                      title={inCompare ? 'Quitar de la comparativa' : 'Añadir a la comparativa'}
                      className={`p-1.5 rounded-lg border text-xs font-mono transition-colors flex items-center gap-1 ${
                        inCompare
                          ? 'bg-fuchsia-950/80 border-fuchsia-500 text-fuchsia-300'
                          : 'bg-[#181820] border-[#2b2b3a] text-zinc-400 hover:text-white'
                      }`}
                    >
                      <GitCompare className="w-3 h-3" />
                      <span className="text-[10px]">{inCompare ? 'Listo' : 'VS'}</span>
                    </button>
                  </div>

                  {/* Model Title & ID */}
                  <div className="mb-2">
                    <h3 className="font-bold text-sm md:text-base text-white group-hover:text-purple-300 transition-colors flex items-center justify-between">
                      <span>{model.name}</span>
                      {isSelected && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-600 text-white font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Activo
                        </span>
                      )}
                    </h3>
                    <div className="text-[11px] font-mono text-zinc-500 truncate mt-0.5">
                      {model.id}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2 mb-3">
                    {model.description || 'Modelo de alta precisión enrutado a través de LiteLLM Universal Gateway.'}
                  </p>

                  {/* Capabilities Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {model.capabilities.slice(0, 3).map((cap, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#181822] text-zinc-300 border border-[#2a2a3a]"
                      >
                        {cap}
                      </span>
                    ))}
                    {model.capabilities.length > 3 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500">
                        +{model.capabilities.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* Specs Footer */}
                <div className="pt-3 border-t border-[#22222e] text-[11px] font-mono text-zinc-400 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Contexto:</span>
                    <span className="text-zinc-200">
                      {model.contextWindow ? `${Math.round(model.contextWindow / 1000)}k tokens` : '128k tokens'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Velocidad:</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      ~{model.tokensPerSecEstimate || 120} t/s
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Coste Estimado:</span>
                    <span className="text-zinc-300">
                      {model.pricing?.isFreeTierAvailable
                        ? 'Capa gratuita disponible'
                        : `$${model.pricing?.inputPerMillionUSD || '0.50'} / 1M input`}
                    </span>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInspectingModel(model);
                      }}
                      className="text-zinc-400 hover:text-purple-300 flex items-center gap-1 text-[11px] transition-colors"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Ficha Técnica</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectModel(model.id)}
                      className="text-purple-400 group-hover:text-purple-300 flex items-center gap-1 text-[11px] font-semibold transition-colors"
                    >
                      <span>{isSelected ? 'Seleccionado' : 'Usar Modelo'}</span>
                      <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredModels.length === 0 && (
          <div className="p-12 text-center bg-[#121217] rounded-2xl border border-[#272732] space-y-3">
            <Cpu className="w-8 h-8 text-zinc-500 mx-auto" />
            <div className="text-sm font-semibold text-zinc-300">No se encontraron modelos con los filtros seleccionados</div>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              Intenta cambiar la búsqueda o restablecer los filtros de proveedor y capacidad.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedProvider('all');
                setSelectedModality('all');
              }}
              className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-mono font-medium"
            >
              Restablecer Filtros
            </button>
          </div>
        )}
      </div>

      {/* Model Spec Inspection Modal */}
      {inspectingModel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl bg-[#0e0e14] border border-[#272732] rounded-2xl p-6 text-white shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#22222d] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-600/50 flex items-center justify-center text-purple-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">{inspectingModel.name}</h3>
                  <div className="text-xs font-mono text-zinc-400">{inspectingModel.id}</div>
                </div>
              </div>
              <button
                onClick={() => setInspectingModel(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs md:text-sm text-zinc-300 leading-relaxed">
              {inspectingModel.description}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-[#14141c] border border-[#272732]">
                <span className="text-zinc-500 block text-[10px] uppercase">PROVEEDOR</span>
                <span className="text-zinc-200 font-bold">{inspectingModel.provider}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#14141c] border border-[#272732]">
                <span className="text-zinc-500 block text-[10px] uppercase">VENTANA CONTEXTO</span>
                <span className="text-purple-300 font-bold">
                  {inspectingModel.contextWindow ? `${(inspectingModel.contextWindow / 1000).toLocaleString()}k tokens` : '128k'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#14141c] border border-[#272732]">
                <span className="text-zinc-500 block text-[10px] uppercase">OUTPUT MÁXIMO</span>
                <span className="text-zinc-200 font-bold">{inspectingModel.maxOutputTokens || 4096} tokens</span>
              </div>
              <div className="p-3 rounded-xl bg-[#14141c] border border-[#272732]">
                <span className="text-zinc-500 block text-[10px] uppercase">VELOCIDAD APROX.</span>
                <span className="text-emerald-400 font-bold">~{inspectingModel.tokensPerSecEstimate || 120} t/s</span>
              </div>
              <div className="p-3 rounded-xl bg-[#14141c] border border-[#272732]">
                <span className="text-zinc-500 block text-[10px] uppercase">PRECIO INPUT / 1M</span>
                <span className="text-zinc-200 font-bold">
                  {inspectingModel.pricing ? `$${inspectingModel.pricing.inputPerMillionUSD}` : 'Estándar'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#14141c] border border-[#272732]">
                <span className="text-zinc-500 block text-[10px] uppercase">PRECIO OUTPUT / 1M</span>
                <span className="text-zinc-200 font-bold">
                  {inspectingModel.pricing ? `$${inspectingModel.pricing.outputPerMillionUSD}` : 'Estándar'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono uppercase text-zinc-400 font-semibold block">
                Capacidades Verificadas:
              </span>
              <div className="flex flex-wrap gap-2">
                {inspectingModel.capabilities.map((cap, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-[#181822] text-xs font-mono text-zinc-200 border border-[#272732]"
                  >
                    ✓ {cap}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#22222d]">
              <button
                onClick={() => setInspectingModel(null)}
                className="px-4 py-2 rounded-xl text-xs font-mono text-zinc-400 hover:text-white"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  onSelectModel(inspectingModel.id);
                  setInspectingModel(null);
                }}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-semibold transition-colors shadow-md"
              >
                Activar como Modelo Predeterminado
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
