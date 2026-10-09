import React, { useState } from 'react';
import { ModelOption, ComparisonResult } from '../../types';
import { compareModels } from '../../services/api';
import {
  GitCompare,
  Zap,
  Play,
  Clock,
  Sparkles,
  DollarSign,
  Copy,
  Check,
  RotateCcw,
  Plus,
  X,
  Layers,
  Award,
} from 'lucide-react';

interface ModelCompareViewProps {
  models: ModelOption[];
  initialSelectedModels?: string[];
  onSelectWinningModel?: (modelId: string) => void;
}

export const ModelCompareView: React.FC<ModelCompareViewProps> = ({
  models,
  initialSelectedModels = ['gemini-3.5-flash', 'ministral-8b-latest'],
  onSelectWinningModel,
}) => {
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>(
    initialSelectedModels.length > 0 ? initialSelectedModels.slice(0, 3) : ['gemini-3.5-flash', 'ministral-8b-latest']
  );
  const [promptInput, setPromptInput] = useState('');
  const [systemInstruction, setSystemInstruction] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [comparisonResults, setComparisonResults] = useState<ComparisonResult[] | null>(null);
  const [totalDuration, setTotalDuration] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [votedWinner, setVotedWinner] = useState<string | null>(null);
  const [compareNotice, setCompareNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setCompareNotice(msg);
    setTimeout(() => setCompareNotice(null), 4000);
  };

  const samplePrompts = [
    {
      title: 'Algoritmo & Rendimiento',
      prompt: 'Diseña un algoritmo en TypeScript para detectar ciclos en un grafo dirigido con N nodos y E aristas. Analiza complejidad espacial y temporal (Big-O).',
    },
    {
      title: 'Arquitectura de Sistema',
      prompt: '¿Cómo diseñarías una arquitectura para streaming de video con baja latencia para 100.000 espectadores concurrentes? Explica CDN, transcodificación y protocolos.',
    },
    {
      title: 'Razonamiento Lógico',
      prompt: 'Hay 3 cofres: uno contiene oro, los otros dos están vacíos. Cada cofre tiene una inscripción, pero sólo una es verdadera. Cofre 1: "El oro está aquí". Cofre 2: "El oro no está aquí". Cofre 3: "El oro no está en el cofre 1". ¿Dónde está el oro? Razona paso a paso.',
    },
    {
      title: 'Refactorización React',
      prompt: 'Escribe un hook personalizado useDebouncedAsync en React 19 con cancelación de peticiones con AbortController y manejo limpio de race conditions.',
    },
  ];

  const handleAddModel = (mId: string) => {
    if (selectedModelIds.includes(mId)) return;
    if (selectedModelIds.length >= 3) {
      showNotice('El modo Arena soporta hasta un máximo de 3 modelos simultáneos.');
      return;
    }
    setSelectedModelIds([...selectedModelIds, mId]);
  };

  const handleRemoveModel = (mId: string) => {
    if (selectedModelIds.length <= 2) {
      showNotice('La comparativa requiere al menos 2 modelos.');
      return;
    }
    setSelectedModelIds(selectedModelIds.filter((id) => id !== mId));
  };

  const handleExecuteCompare = async () => {
    if (!promptInput.trim() || isRunning) return;
    setIsRunning(true);
    setComparisonResults(null);
    setVotedWinner(null);

    try {
      const data = await compareModels({
        models: selectedModelIds,
        prompt: promptInput.trim(),
        systemInstruction: systemInstruction.trim() || undefined,
      });

      setComparisonResults(data.results);
      setTotalDuration(data.totalDurationMs);
    } catch (err: any) {
      showNotice(`Error en comparación: ${err.message || 'Error desconocido'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const copyResult = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] bg-[#09090b] overflow-y-auto p-4 md:p-8 select-none">
      <div className="max-w-7xl mx-auto w-full space-y-6 pb-20">
        {/* Header */}
        <div className="border-b border-[#272732] pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-fuchsia-600 to-purple-600 flex items-center justify-center p-[1px] shadow-lg">
                <div className="w-full h-full bg-[#0d0d12] rounded-[10px] flex items-center justify-center">
                  <GitCompare className="w-5 h-5 text-fuchsia-400" />
                </div>
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  Model Arena & Comparativa Concurrente
                  <span className="text-xs font-mono py-0.5 px-2.5 rounded-full bg-fuchsia-950/80 text-fuchsia-300 border border-fuchsia-800/60 font-medium">
                    Multi-LLM
                  </span>
                </h1>
                <p className="text-xs md:text-sm text-zinc-400">
                  Envía el mismo prompt a 2 o 3 modelos simultáneamente para evaluar calidad, velocidad, razonamiento y coste en tiempo real.
                </p>
              </div>
            </div>
          </div>

          {comparisonResults && (
            <button
              onClick={() => {
                setComparisonResults(null);
                setVotedWinner(null);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#14141c] hover:bg-[#1a1a24] border border-[#272732] text-xs font-mono text-zinc-300 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Nueva Comparativa</span>
            </button>
          )}
        </div>

        {/* In-app notification notice */}
        {compareNotice && (
          <div className="p-3 bg-fuchsia-950/60 border border-fuchsia-500/40 rounded-xl text-xs text-fuchsia-200 flex items-center justify-between shadow-lg">
            <span>{compareNotice}</span>
            <button onClick={() => setCompareNotice(null)} className="text-fuchsia-400 hover:text-white text-xs ml-2">✕</button>
          </div>
        )}

        {/* Models Selector Bar */}
        <div className="p-4 rounded-2xl bg-[#0e0e14] border border-[#272732] space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-zinc-400 font-semibold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              Modelos en la Arena ({selectedModelIds.length} / 3 seleccionados)
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-zinc-500">Añadir modelo:</span>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddModel(e.target.value);
                    e.target.value = '';
                  }
                }}
                disabled={selectedModelIds.length >= 3}
                className="bg-[#14141c] border border-[#272732] rounded-lg px-2.5 py-1 text-xs font-mono text-zinc-300 focus:outline-none focus:border-purple-600 disabled:opacity-40"
              >
                <option value="">+ Seleccionar...</option>
                {models
                  .filter((m) => !selectedModelIds.includes(m.id))
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.provider})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {selectedModelIds.map((mId) => {
              const modelObj = models.find((m) => m.id === mId);
              return (
                <div
                  key={mId}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-700/60 text-purple-200 text-xs font-mono shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span className="font-semibold">{modelObj?.shortName || mId}</span>
                  <span className="text-[10px] text-zinc-400">({modelObj?.provider || 'LLM'})</span>
                  {selectedModelIds.length > 2 && (
                    <button
                      onClick={() => handleRemoveModel(mId)}
                      className="ml-1 text-zinc-400 hover:text-rose-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Input Bar & Execution Controls */}
        <div className="p-4 md:p-5 rounded-2xl bg-[#0e0e14] border border-[#272732] space-y-4 shadow-xl">
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase text-zinc-400 font-semibold block">
              PROMPT DE PRUEBA SIMULTÁNEO
            </label>
            <textarea
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="Introduce la pregunta, problema de código o prueba de razonamiento que deseas comparar entre los modelos..."
              rows={3}
              className="w-full bg-[#14141c] border border-[#272732] rounded-xl p-3 text-xs md:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-600 resize-none font-sans"
            />
          </div>

          {/* Quick Prompts */}
          <div className="flex flex-wrap gap-2 pt-1 items-center">
            <span className="text-[11px] font-mono text-zinc-500">Sugerencias:</span>
            {samplePrompts.map((sp, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPromptInput(sp.prompt)}
                className="px-2.5 py-1 rounded-lg bg-[#14141c] hover:bg-[#1c1c28] border border-[#272732] hover:border-purple-600/40 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors font-mono"
              >
                {sp.title}
              </button>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleExecuteCompare}
              disabled={isRunning || !promptInput.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 disabled:opacity-40 text-white text-xs font-bold font-mono tracking-wide transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)]"
            >
              {isRunning ? (
                <>
                  <Zap className="w-4 h-4 animate-spin text-purple-200" />
                  <span>EJECUTANDO EN PARALELO...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 text-white" />
                  <span>LANZAR COMPARATIVA ({selectedModelIds.length} MODELOS)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Arena: Side-by-Side View */}
        {comparisonResults && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400 px-1">
              <span className="flex items-center gap-2 text-emerald-400">
                <Clock className="w-4 h-4" />
                Ejecución completada en {(totalDuration ? totalDuration / 1000 : 0).toFixed(2)}s
              </span>
              <span>Elige el modelo ganador según precisión y estilo</span>
            </div>

            <div
              className={`grid gap-4 ${
                comparisonResults.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'
              }`}
            >
              {comparisonResults.map((result, idx) => {
                const modelMeta = models.find((m) => m.id === result.modelId);
                const isWinner = votedWinner === result.modelId;

                return (
                  <div
                    key={idx}
                    className={`rounded-2xl border p-4 flex flex-col justify-between transition-all bg-[#0e0e14] ${
                      isWinner
                        ? 'border-emerald-500 ring-2 ring-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]'
                        : 'border-[#272732] shadow-xl'
                    }`}
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between border-b border-[#22222d] pb-3 mb-3">
                        <div>
                          <div className="font-bold text-sm text-white flex items-center gap-2">
                            <span>{modelMeta?.name || result.modelId}</span>
                            {isWinner && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700/60 font-semibold flex items-center gap-1">
                                <Award className="w-3 h-3" />
                                Ganador
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-zinc-500">
                            {result.modelUsed}
                          </div>
                        </div>

                        <button
                          onClick={() => copyResult(result.content, `cmp_${idx}`)}
                          className="p-1.5 rounded-lg bg-[#181820] hover:bg-[#20202c] text-zinc-400 hover:text-white"
                          title="Copiar respuesta"
                        >
                          {copiedId === `cmp_${idx}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Telemetry Pills */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono mb-3">
                        <div className="p-2 rounded-lg bg-[#14141c] border border-[#272732] flex items-center justify-between">
                          <span className="text-zinc-500">Latencia:</span>
                          <span className="text-purple-300 font-semibold">{result.latencyMs} ms</span>
                        </div>
                        <div className="p-2 rounded-lg bg-[#14141c] border border-[#272732] flex items-center justify-between">
                          <span className="text-zinc-500">Tokens:</span>
                          <span className="text-zinc-200 font-semibold">~{result.tokens}</span>
                        </div>
                      </div>

                      {/* Output Content */}
                      <div className="text-xs md:text-sm text-zinc-300 leading-relaxed font-sans whitespace-pre-wrap max-h-96 overflow-y-auto p-3 rounded-xl bg-[#08080c] border border-[#22222d]">
                        {result.content}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-4 border-t border-[#22222d] mt-4 flex items-center justify-between">
                      <button
                        onClick={() => {
                          setVotedWinner(result.modelId);
                          onSelectWinningModel?.(result.modelId);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                          isWinner
                            ? 'bg-emerald-600 text-white'
                            : 'bg-[#181822] hover:bg-emerald-950/60 border border-[#2a2a3a] text-zinc-400 hover:text-emerald-300'
                        }`}
                      >
                        {isWinner ? '✓ Modelo Ganador Elegido' : 'Votar Ganador'}
                      </button>

                      <span className="text-[10px] font-mono text-zinc-500">
                        {result.status === 'success' ? '✓ Generado sin errores' : '⚠ Fallo parcial'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
