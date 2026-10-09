import React, { useState } from 'react';
import { Project, ViewMode } from '../../types';
import { KiranLogo } from '../KiranLogo';
import {
  Terminal,
  Code2,
  Sparkles,
  ArrowRight,
  Download,
  Play,
  Globe,
  Layers,
  Paperclip,
  Mic,
  Cpu,
  Zap,
  FolderGit2,
  FolderPlus,
  Box,
  Compass,
  GitCompare,
  Bookmark,
  CreditCard,
  Smartphone,
  Image as ImageIcon,
  FileText,
  Cloud,
} from 'lucide-react';

interface HomeViewProps {
  onViewChange: (view: ViewMode) => void;
  activeProject: Project | null;
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onOpenNewProjectModal: () => void;
  onExportZip: () => void;
  onQuickPrompt: (promptText: string) => void;
  hasApiKey: boolean;
  webSearchActive: boolean;
  selectedModel?: string;
  onOpenModelCatalog?: () => void;
  isAiLoading?: boolean;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onViewChange,
  activeProject,
  projects,
  onSelectProject,
  onOpenNewProjectModal,
  onExportZip,
  onQuickPrompt,
  webSearchActive,
  selectedModel = 'openrouter-main',
  onOpenModelCatalog,
  isAiLoading = false,
}) => {
  const [quickInput, setQuickInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    onQuickPrompt(quickInput.trim());
  };

  const handleVoiceToggle = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceNotice('Reconocimiento de voz no soportado en este navegador.');
      setTimeout(() => setVoiceNotice(null), 4000);
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES';
      recognition.interimResults = false;
      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      recognition.onerror = () => setIsRecording(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuickInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };
      recognition.start();
    } catch {
      setIsRecording(false);
    }
  };

  const sampleScaffolds = [
    {
      title: 'SaaS Analytics Dashboard',
      type: 'Full-Stack Web App',
      desc: 'Panel con gráficos en tiempo real, KPIs dinámicos, glassmorphism y tema oscuro.',
      prompt:
        'Crea una aplicación web SaaS completa con dashboard interactivo, simulación de telemetría y gráficos interactivos.',
      icon: '📊',
    },
    {
      title: 'Sistema de Gestión / CRM Autónomo',
      type: 'Productivity Platform',
      desc: 'Gestor completo con base de datos en memoria, CRUD reactivo, filtros y exportación.',
      prompt:
        'Crea una aplicación web para gestionar clientes, membresías y cobros con interfaz moderna y responsiva.',
      icon: '💼',
    },
    {
      title: 'E-commerce & Catálogo Interactivo',
      type: 'Storefront & Checkout',
      desc: 'Tienda interactiva con carrito flotante, filtros de productos y resumen de pedidos.',
      prompt:
        'Crea una tienda web completa con catálogo de productos, carrito de compras reactivo y resumen de pedidos.',
      icon: '🛍️',
    },
    {
      title: 'Tablero Kanban & Tareas Ágiles',
      type: 'Kanban Workspace',
      desc: 'Tablero interactivo con arrastrar columnas, tags de prioridad y persistencia.',
      prompt:
        'Crea una aplicación web de productividad tipo Kanban con columnas, creación de tareas y filtros.',
      icon: '📋',
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] bg-transparent overflow-y-auto p-4 sm:p-8 select-none">
      <div className="max-w-5xl mx-auto w-full space-y-12 pb-20">
        {/* Hero Section */}
        <div className="pt-6 pb-2 text-center space-y-5">
          {/* Principal Kiran AI Logo */}
          <div className="flex justify-center">
            <KiranLogo size="hero" glow animated />
          </div>

          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-950/60 to-purple-950/60 border border-violet-500/30 text-violet-200 text-xs font-mono shadow-[0_0_25px_rgba(139,92,246,0.2)] backdrop-blur-xl">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
            <span className="tracking-widest uppercase font-semibold">
              Kiran AI — Sistema Operativo de Inteligencia Artificial
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white drop-shadow-[0_0_35px_rgba(168,85,247,0.3)]">
            Tu Inteligencia Artificial{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-pink-400 to-cyan-300">
              del Futuro
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
            Arquitectura de software, código de producción, proyectos completos y ejecución autónoma multi-proveedor unificada por{' '}
            <span className="text-cyan-300 font-semibold">Kiran AI & LiteLLM Gateway</span>.
          </p>

          {/* AI COMMAND CENTER (Main Protagonist) */}
          <div className="max-w-3xl mx-auto pt-4">
            <div className="relative rounded-2xl p-[1px] bg-gradient-to-b from-violet-500/40 via-purple-500/20 to-pink-500/30 shadow-[0_0_60px_rgba(139,92,246,0.22)] backdrop-blur-2xl">
              <div className="rounded-[15px] bg-[#05000D]/80 p-3 sm:p-4 backdrop-blur-3xl">
                <form onSubmit={handleQuickSubmit} className="space-y-3">
                  {/* Top Bar inside Command Center Input */}
                  <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-white/[0.06] text-xs">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1.5 text-violet-300 font-mono text-[11px]">
                        <Terminal className="w-3.5 h-3.5 text-violet-400" />
                        COMMAND PALETTE
                      </span>
                      {isAiLoading && (
                        <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[10px] font-mono animate-pulse border border-violet-500/30">
                          Sintetizando...
                        </span>
                      )}
                    </div>

                    {/* Model Pill Trigger */}
                    {onOpenModelCatalog ? (
                      <button
                        type="button"
                        onClick={onOpenModelCatalog}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-950/60 hover:bg-violet-900/60 border border-violet-500/35 text-[11px] font-mono text-violet-200 transition-all shadow-[0_0_12px_rgba(139,92,246,0.2)]"
                      >
                        <Cpu className="w-3 h-3 text-violet-400" />
                        <span>{selectedModel}</span>
                        <Zap className="w-2.5 h-2.5 text-emerald-400" />
                      </button>
                    ) : (
                      <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-slate-300">
                        <Cpu className="w-3 h-3 text-violet-400" />
                        {selectedModel}
                      </span>
                    )}
                  </div>

                  {voiceNotice && (
                    <div className="mx-3 my-1 p-2 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-300 text-xs flex items-center justify-between">
                      <span>{voiceNotice}</span>
                      <button type="button" onClick={() => setVoiceNotice(null)} className="text-pink-400 hover:text-white ml-2 text-xs">✕</button>
                    </div>
                  )}

                  {/* Input Textarea / Input Bar */}
                  <div className="relative">
                    <input
                      type="text"
                      value={quickInput}
                      onChange={(e) => setQuickInput(e.target.value)}
                      placeholder="Escribe lo que deseas crear (ej: 'Crea una app de finanzas completa en HTML y React')..."
                      disabled={isAiLoading}
                      className="w-full bg-transparent border-0 text-white placeholder-slate-400 text-sm sm:text-base px-3 py-3 focus:outline-none focus:ring-0"
                    />
                  </div>

                  {/* Bottom Controls Row: Tools & Send */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onViewChange('chat')}
                        title="Adjuntar archivos o imágenes"
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <Paperclip className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={handleVoiceToggle}
                        title={isRecording ? 'Detener dictado' : 'Dictar por voz'}
                        className={`p-2 rounded-lg transition-colors ${
                          isRecording
                            ? 'text-pink-400 bg-pink-950/60 animate-pulse'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Mic className="w-4 h-4" />
                      </button>

                      <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-slate-400 px-2">
                        <Globe className={`w-3.5 h-3.5 ${webSearchActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                        <span>Web {webSearchActive ? 'ON' : 'OFF'}</span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!quickInput.trim() || isAiLoading}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] disabled:opacity-40 disabled:cursor-not-allowed group cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-violet-200 group-hover:rotate-12 transition-transform" />
                      <span>Ejecutar</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Project Scaffolds Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-violet-400" />
              <h2 className="text-sm font-mono uppercase tracking-wider text-slate-300 font-semibold">
                Scaffolds y Proyectos Listos para Construir
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Generación completa multi-archivo
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sampleScaffolds.map((item, idx) => (
              <div
                key={idx}
                onClick={() => onQuickPrompt(item.prompt)}
                className="group relative p-5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-violet-500/40 backdrop-blur-xl transition-all duration-300 cursor-pointer shadow-[0_4px_25px_rgba(0,0,0,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.18)]"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl p-2 rounded-xl bg-white/5 border border-white/5">
                      {item.icon}
                    </span>
                    <div>
                      <h3 className="text-base font-semibold text-white group-hover:text-violet-200 transition-colors">
                        {item.title}
                      </h3>
                      <span className="text-[11px] font-mono text-violet-400">
                        {item.type}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
                </div>

                <p className="text-xs text-slate-400 leading-relaxed font-light">
                  {item.desc}
                </p>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-mono text-violet-300">
                    Sintetizar proyecto
                  </span>
                  <span className="text-slate-500">Auto-instanciado en CODE</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Flagship Capabilities Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Capacidades de la Plataforma de IA</span>
            </h2>
            <span className="text-xs text-slate-500 font-mono">Arquitectura Unificada</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              onClick={() => onViewChange('apk')}
              className="p-5 rounded-2xl bg-[#0b1419] hover:bg-[#101c24] border border-cyan-500/30 hover:border-cyan-400 transition-all cursor-pointer space-y-2 group shadow-xl"
            >
              <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white group-hover:text-cyan-300 transition-colors">
                  App Móvil & APK
                </h3>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-900/60 text-cyan-300 font-mono font-bold">
                  NATIVO
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Descarga el APK oficial para Android, instálalo en tu móvil o exporta el proyecto de Android Studio.
              </p>
            </div>

            <div
              onClick={() => onViewChange('deploy')}
              className="p-5 rounded-2xl bg-gradient-to-br from-[#0c121e] to-[#121124] hover:from-[#11192b] hover:to-[#17152f] border border-cyan-500/30 hover:border-cyan-400 transition-all cursor-pointer space-y-2 group shadow-xl relative overflow-hidden"
            >
              <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[9px] bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                GRATIS
              </div>
              <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
                <Cloud className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white group-hover:text-cyan-300 transition-colors">
                kiranai.pages.dev
              </h3>
              <p className="text-xs text-zinc-400">
                Alojamiento gratuito de alta velocidad en Cloudflare Pages. Descarga el paquete compilado y pon tu web en vivo en 30 segundos.
              </p>
            </div>

            <div
              onClick={() => onViewChange('vision')}
              className="p-5 rounded-2xl bg-[#0e0e14] hover:bg-[#14141e] border border-[#272732] hover:border-purple-600/50 transition-all cursor-pointer space-y-2 group shadow-xl"
            >
              <div className="w-9 h-9 rounded-xl bg-purple-950/80 border border-purple-600/50 flex items-center justify-center text-purple-400">
                <ImageIcon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white group-hover:text-purple-300 transition-colors">
                Visión IA & Imágenes
              </h3>
              <p className="text-xs text-zinc-400">
                Generador de arte conceptual y analizador multimodal con OCR y diagnóstico de imágenes.
              </p>
            </div>

            <div
              onClick={() => onViewChange('documents')}
              className="p-5 rounded-2xl bg-[#0e0e14] hover:bg-[#14141e] border border-[#272732] hover:border-fuchsia-600/50 transition-all cursor-pointer space-y-2 group shadow-xl"
            >
              <div className="w-9 h-9 rounded-xl bg-fuchsia-950/80 border border-fuchsia-600/50 flex items-center justify-center text-fuchsia-400">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white group-hover:text-fuchsia-300 transition-colors">
                Analizador de Docs
              </h3>
              <p className="text-xs text-zinc-400">
                Sube informes, código o Markdown para extracción de insights, resúmenes y consultas directas.
              </p>
            </div>

            <div
              onClick={() => onViewChange('models')}
              className="p-5 rounded-2xl bg-[#0e0e14] hover:bg-[#14141e] border border-[#272732] hover:border-purple-600/50 transition-all cursor-pointer space-y-2 group shadow-xl"
            >
              <div className="w-9 h-9 rounded-xl bg-purple-950/80 border border-purple-600/50 flex items-center justify-center text-purple-400">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white group-hover:text-purple-300 transition-colors">
                Catálogo de Modelos
              </h3>
              <p className="text-xs text-zinc-400">
                Filtra y explora modelos de Google, OpenAI, Anthropic, DeepSeek, Groq y Mistral en tiempo real.
              </p>
            </div>

            <div
              onClick={() => onViewChange('compare')}
              className="p-5 rounded-2xl bg-[#0e0e14] hover:bg-[#14141e] border border-[#272732] hover:border-fuchsia-600/50 transition-all cursor-pointer space-y-2 group shadow-xl"
            >
              <div className="w-9 h-9 rounded-xl bg-fuchsia-950/80 border border-fuchsia-600/50 flex items-center justify-center text-fuchsia-400">
                <GitCompare className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white group-hover:text-fuchsia-300 transition-colors">
                Model Arena (Compare)
              </h3>
              <p className="text-xs text-zinc-400">
                Envía el mismo prompt a 2 o 3 modelos a la vez y compara velocidad, razonamiento y coste.
              </p>
            </div>

            <div
              onClick={() => onViewChange('prompts')}
              className="p-5 rounded-2xl bg-[#0e0e14] hover:bg-[#14141e] border border-[#272732] hover:border-indigo-600/50 transition-all cursor-pointer space-y-2 group shadow-xl"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-950/80 border border-indigo-600/50 flex items-center justify-center text-indigo-400">
                <Bookmark className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors">
                Biblioteca de Prompts
              </h3>
              <p className="text-xs text-zinc-400">
                Colección de prompts curados para arquitectura de software, seguridad OWASP y código.
              </p>
            </div>

            <div
              onClick={() => onViewChange('billing')}
              className="p-5 rounded-2xl bg-[#0e0e14] hover:bg-[#14141e] border border-[#272732] hover:border-emerald-600/50 transition-all cursor-pointer space-y-2 group shadow-xl"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-600/50 flex items-center justify-center text-emerald-400">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors">
                Planes & Facturación
              </h3>
              <p className="text-xs text-zinc-400">
                Control de consumo, cuota diaria de mensajes, estimación de costes y suscripción PRO.
              </p>
            </div>
          </div>
        </div>

        {/* Active & Recent Projects Gallery */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-violet-400" />
              <h2 className="text-sm font-mono uppercase tracking-wider text-slate-300 font-semibold">
                Proyectos en tu Workspace ({projects.length})
              </h2>
            </div>
            <button
              onClick={onOpenNewProjectModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/30 hover:bg-violet-600/50 border border-violet-500/40 text-violet-200 text-xs font-medium transition-all shadow-[0_0_12px_rgba(139,92,246,0.2)]"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Nuevo Proyecto</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((proj) => {
              const isActive = activeProject?.id === proj.id;
              return (
                <div
                  key={proj.id}
                  onClick={() => {
                    onSelectProject(proj);
                    onViewChange('code');
                  }}
                  className={`group p-4 rounded-xl border backdrop-blur-xl transition-all cursor-pointer ${
                    isActive
                      ? 'bg-violet-950/50 border-violet-500/50 shadow-[0_0_25px_rgba(139,92,246,0.2)]'
                      : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/10 hover:border-violet-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white group-hover:text-violet-300 transition-colors truncate">
                      {proj.name}
                    </span>
                    {isActive && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Activo
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                    {proj.description || 'Proyecto generado en KiranIA OS.'}
                  </p>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-white/5">
                    <span>{proj.files.length} archivo(s)</span>
                    <span className="text-violet-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Abrir <Play className="w-3 h-3 fill-current" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
