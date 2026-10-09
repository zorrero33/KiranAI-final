import React, { useState, useRef, useEffect } from 'react';
import { KiranLogo } from '../KiranLogo';
import {
  ChatMessage,
  AttachedFile,
  AgentPersona,
  Project,
  PendingAction,
} from '../../types';
import {
  Send,
  Paperclip,
  Mic,
  MicOff,
  Globe,
  FileCode,
  FileText,
  Image as ImageIcon,
  X,
  Sparkles,
  Terminal,
  Check,
  Copy,
  Download,
  ShieldAlert,
  Bot,
  Volume2,
  VolumeX,
  Play,
  Trash2,
  Cpu,
  Zap,
  Activity,
  Square,
} from 'lucide-react';

interface ChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (content: string, files: AttachedFile[], personaId: string) => void;
  isLoading: boolean;
  onCancelGeneration?: () => void;
  webSearchActive: boolean;
  onToggleWebSearch: () => void;
  activeProject: Project | null;
  onOpenProjectFile: (filePath: string) => void;
  onExportZip: () => void;
  onApproveAction?: (action: PendingAction) => void;
  onRejectAction?: (action: PendingAction) => void;
  onClearChat?: () => void;
  selectedModel?: string;
  onOpenModelCatalog?: () => void;
  lastFallbackInfo?: {
    fromModel: string;
    toModel: string;
    reason: string;
  } | null;
}

const AGENT_PERSONAS: AgentPersona[] = [
  {
    id: 'core',
    name: 'KiranIA Core',
    role: 'AI Operating System & General Intelligence',
    iconName: 'Terminal',
    description: 'Autonomous orchestrator balancing architecture, code, research and task execution.',
    systemModifier: 'You are KiranIA Core, coordinating all subsystems with precision and honesty.',
  },
  {
    id: 'coder',
    name: 'Coding Agent',
    role: 'Senior Full-Stack Software Engineer',
    iconName: 'Code2',
    description: 'Specializes in production-grade code generation, multi-file projects, refactoring and unit tests.',
    systemModifier: 'You are KiranIA Coding Agent. Write pristine, modular, working code. Emit complete files using <<<FILE: path>>> format.',
  },
  {
    id: 'architect',
    name: 'Architect Agent',
    role: 'Principal Systems Architect',
    iconName: 'Layers',
    description: 'Designs scalable system schemas, data flows, API specs, security patterns and tech stack selection.',
    systemModifier: 'You are KiranIA Architect Agent. Focus on deep systems thinking, trade-offs, constraints, and verified specifications.',
  },
  {
    id: 'researcher',
    name: 'Research Agent',
    role: 'Information & Evidence Specialist',
    iconName: 'Globe',
    description: 'Performs live web research, verifies sources, extracts factual documentation and distinguishes assumptions from facts.',
    systemModifier: 'You are KiranIA Research Agent. Rigorously cite evidence and sources. Never hallucinate facts.',
  },
];

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  onSendMessage,
  isLoading,
  onCancelGeneration,
  webSearchActive,
  onToggleWebSearch,
  onOpenProjectFile,
  onExportZip,
  onApproveAction,
  onRejectAction,
  onClearChat,
  selectedModel = 'openrouter-main',
  onOpenModelCatalog,
  lastFallbackInfo,
}) => {
  const [input, setInput] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<string>('core');
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [chatNotice, setChatNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const showNotice = (text: string) => {
    setChatNotice(text);
    setTimeout(() => setChatNotice(null), 3500);
  };

  // Initialize Speech Recognition if browser supports it
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'es-ES';
      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);
      recognitionRef.current = recognition;
    } else {
      setSpeechSupported(false);
    }
  }, []);

  // Text-to-Speech function
  const speakText = (rawText: string, msgId: string) => {
    if (!('speechSynthesis' in window)) {
      showNotice('La síntesis de voz no está soportada en este navegador.');
      return;
    }

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();

    const cleanText = rawText
      .replace(/<<<FILE:[\s\S]*?<<<END_FILE>>>/g, 'He generado el archivo de código.')
      .replace(/```[\s\S]*?```/g, 'Código omitido.')
      .replace(/[*#_`]/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'es-ES';
    utterance.rate = 1.05;
    utterance.pitch = 0.95;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find((v) => v.lang.startsWith('es')) || voices.find((v) => v.lang.startsWith('en'));
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // Auto-speak hook when AI finishes streaming
  useEffect(() => {
    if (autoSpeak && !isLoading && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === 'model' && lastMsg.status === 'complete' && lastMsg.content) {
        speakText(lastMsg.content, lastMsg.id);
      }
    }
  }, [isLoading, messages, autoSpeak]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleToggleVoice = () => {
    if (!speechSupported || !recognitionRef.current) {
      showNotice('La API de reconocimiento de voz del navegador no está disponible.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Speech recognition error:', err);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isImage = file.type.startsWith('image/');
      const reader = new FileReader();

      if (isImage) {
        reader.onload = (event) => {
          const result = event.target?.result as string;
          const base64Data = result.split(',')[1];
          setAttachedFiles((prev) => [
            ...prev,
            {
              id: `att_${Date.now()}_${i}`,
              name: file.name,
              type: 'image',
              mimeType: file.type,
              data: base64Data,
              size: file.size,
            },
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        reader.onload = (event) => {
          const textContent = event.target?.result as string;
          setAttachedFiles((prev) => [
            ...prev,
            {
              id: `att_${Date.now()}_${i}`,
              name: file.name,
              type: 'code',
              mimeType: file.type || 'text/plain',
              textContent,
              size: file.size,
            },
          ]);
        };
        reader.readAsText(file);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachedFile = (fileId: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && attachedFiles.length === 0) return;
    if (isLoading) return;

    onSendMessage(input.trim(), attachedFiles, selectedPersona);
    setInput('');
    setAttachedFiles([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to render generated files inside messages
  const renderMessageContent = (content: string, msgId: string) => {
    const fileRegex = /<<<FILE:\s*([^\n\r>]+)>>>([\s\S]*?)<<<END_FILE>>>/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = fileRegex.exec(content)) !== null) {
      const matchIndex = match.index;
      if (matchIndex > lastIndex) {
        parts.push(
          <div key={`text_${lastIndex}`} className="whitespace-pre-wrap leading-relaxed text-slate-200">
            {content.substring(lastIndex, matchIndex)}
          </div>
        );
      }

      const filePath = match[1].trim();
      const fileCode = match[2].trim();
      const blockId = `${msgId}_${filePath}`;

      parts.push(
        <div key={blockId} className="my-3.5 rounded-xl border border-white/10 bg-[#080014]/90 overflow-hidden shadow-[0_0_30px_rgba(109,40,217,0.15)] backdrop-blur-xl">
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-white/[0.04] border-b border-white/[0.08]">
            <div className="flex items-center gap-2 text-xs font-mono text-violet-300">
              <FileCode className="w-3.5 h-3.5 text-violet-400" />
              <span>{filePath}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => copyToClipboard(fileCode, blockId)}
                className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                {copiedId === blockId ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
              <button
                onClick={() => onOpenProjectFile(filePath)}
                className="flex items-center gap-1 text-[11px] text-violet-200 hover:text-white px-3 py-1 rounded-lg bg-violet-600/30 hover:bg-violet-600/50 border border-violet-500/40 transition-colors shadow-[0_0_10px_rgba(139,92,246,0.2)]"
              >
                <Terminal className="w-3 h-3" />
                <span>Abrir en Workspace</span>
              </button>
            </div>
          </div>
          <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto max-h-80 bg-[#05000D]/90">
            <code>{fileCode}</code>
          </pre>
        </div>
      );

      lastIndex = matchIndex + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push(
        <div key={`text_${lastIndex}`} className="whitespace-pre-wrap leading-relaxed text-slate-200">
          {content.substring(lastIndex)}
        </div>
      );
    }

    return parts;
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] bg-transparent relative">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 space-y-6">
        {chatNotice && (
          <div className="max-w-3xl mx-auto p-3 rounded-xl bg-pink-950/60 border border-pink-500/40 text-xs text-pink-200 flex items-center justify-between shadow-lg backdrop-blur-xl">
            <span>{chatNotice}</span>
            <button onClick={() => setChatNotice(null)} className="text-pink-300 hover:text-white ml-2 text-xs">✕</button>
          </div>
        )}

        {/* Live Fallback Notification Banner */}
        {lastFallbackInfo && (
          <div className="max-w-3xl mx-auto p-3.5 rounded-xl bg-violet-950/50 border border-violet-500/40 flex items-center justify-between text-xs text-violet-200 shadow-[0_0_25px_rgba(139,92,246,0.2)] backdrop-blur-xl">
            <div className="flex items-center gap-2.5">
              <Activity className="w-4 h-4 text-violet-400 animate-pulse" />
              <span>
                <strong>Resiliencia LiteLLM:</strong> Conmutado de{' '}
                <span className="font-mono text-pink-300">{lastFallbackInfo.fromModel}</span> a{' '}
                <span className="font-mono text-emerald-300 font-bold">{lastFallbackInfo.toModel}</span> por límite de cuota o latencia.
              </span>
            </div>
            {onOpenModelCatalog && (
              <button
                onClick={onOpenModelCatalog}
                className="text-[11px] underline text-violet-300 hover:text-white shrink-0 ml-2"
              >
                Ver Catálogo
              </button>
            )}
          </div>
        )}

        {messages.length <= 1 && (
          <div className="max-w-3xl mx-auto pt-4 pb-6 text-center space-y-5">
            <div className="flex justify-center">
              <KiranLogo size="xl" glow animated />
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-violet-950/60 border border-violet-500/30 text-violet-200 text-xs font-mono shadow-[0_0_20px_rgba(139,92,246,0.2)] backdrop-blur-xl">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Kiran AI — Space Command Center & Multi-Provider Router</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white drop-shadow-[0_0_30px_rgba(168,85,247,0.3)]">
              Kiran<span className="text-cyan-400">AI</span>
            </h1>

            <p className="text-base sm:text-lg font-medium text-violet-200/90 tracking-wide">
              Your AI. Your tools. Your world.
            </p>

            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto font-light">
              Pregunta, diseña arquitecturas o solicita proyectos multi-archivo completos. Fallover garantizado sin interrupciones.
            </p>

            {/* Quick Starters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 text-left max-w-2xl mx-auto">
              <button
                onClick={() => setInput('Kiran, crea una aplicación web SaaS completa con dashboard interactivo para gestionar mi negocio.')}
                className="p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-violet-500/40 backdrop-blur-xl transition-all text-xs text-slate-300 flex flex-col gap-1 group shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
              >
                <span className="font-semibold text-violet-300 group-hover:text-violet-200 flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-violet-400" />
                  Crear Aplicación SaaS Completa
                </span>
                <span className="text-slate-400 text-[11px] font-light">
                  Diseña arquitectura, crea estructura multi-archivo real y vista previa interactiva.
                </span>
              </button>

              <button
                onClick={() => setInput('Investiga con búsqueda web el estado actual de los frameworks React 19 y las mejores prácticas en 2026.')}
                className="p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-violet-500/40 backdrop-blur-xl transition-all text-xs text-slate-300 flex flex-col gap-1 group shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
              >
                <span className="font-semibold text-emerald-400 group-hover:text-emerald-300 flex items-center gap-1.5">
                  <Globe className="w-4 h-4" />
                  Investigación Web Grounding
                </span>
                <span className="text-slate-400 text-[11px] font-light">
                  Búsqueda web con citas verificadas y fuentes directas. Cero datos falsos.
                </span>
              </button>

              <button
                onClick={() => setInput('Tengo un problema crítico de rendimiento y latencia en mi base de datos. Diagnostica y propón la solución paso a paso (SOLVE).')}
                className="p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-violet-500/40 backdrop-blur-xl transition-all text-xs text-slate-300 flex flex-col gap-1 group shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
              >
                <span className="font-semibold text-fuchsia-400 group-hover:text-fuchsia-300 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4" />
                  Modo Diagnóstico SOLVE
                </span>
                <span className="text-slate-400 text-[11px] font-light">
                  Comprender restricciones, comparar soluciones y generar código correctivo.
                </span>
              </button>

              <button
                onClick={() => setInput('Revisa la seguridad y estructura de mi proyecto actual. Genera un plan de testing y hardening.')}
                className="p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-violet-500/40 backdrop-blur-xl transition-all text-xs text-slate-300 flex flex-col gap-1 group shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
              >
                <span className="font-semibold text-pink-400 group-hover:text-pink-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  Auditoría & Plan de Hardening
                </span>
                <span className="text-slate-400 text-[11px] font-light">
                  Inspección técnica exhaustiva y pasos verificados.
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Message Stream */}
        <div className="max-w-3xl mx-auto space-y-5">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const hasGeneratedFiles = msg.content.includes('<<<FILE:');

            return (
              <div
                key={msg.id}
                className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="shrink-0 mt-0.5">
                    <KiranLogo size="sm" glow={false} />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 sm:p-5 transition-all backdrop-blur-xl border ${
                    isUser
                      ? 'bg-gradient-to-r from-violet-600/35 to-purple-600/25 border-violet-400/30 text-white shadow-[0_4px_25px_rgba(109,40,217,0.2)]'
                      : 'bg-white/[0.035] border-white/[0.08] text-slate-200 shadow-[0_4px_30px_rgba(0,0,0,0.4)]'
                  }`}
                >
                  {/* Persona & Speech bar for Assistant */}
                  {!isUser && (
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/[0.06] text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-violet-300 font-mono text-[11px]">
                          {msg.agentPersona || 'KIRANIA CORE'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => speakText(msg.content, msg.id)}
                          title="Reproducir locución"
                          className="p-1 rounded text-slate-400 hover:text-violet-300 transition-colors"
                        >
                          {speakingMsgId === msg.id ? (
                            <VolumeX className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => copyToClipboard(msg.content, msg.id)}
                          title="Copiar texto completo"
                          className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Render content & any embedded files */}
                  <div className="text-sm space-y-2">
                    {renderMessageContent(msg.content, msg.id)}
                  </div>

                  {/* Grounding Sources */}
                  {msg.groundingSources && msg.groundingSources.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-white/[0.08] text-xs space-y-1.5">
                      <div className="font-mono text-emerald-400 font-semibold flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5" />
                        <span>Fuentes Verificadas de Búsqueda Web:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {msg.groundingSources.map((source, idx) => (
                          <a
                            key={idx}
                            href={source.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 hover:text-white text-[11px] font-mono transition-colors"
                          >
                            {source.title} ↗
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Bar for Generated Code / Multi-file projects */}
                  {hasGeneratedFiles && (
                    <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-violet-950/60 to-purple-950/40 border border-violet-500/35 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_0_20px_rgba(139,92,246,0.18)]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-violet-500/20 text-violet-300 flex items-center justify-center">
                          <FileCode className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-violet-200 font-mono">
                            PROYECTO COMPLETO GENERADO
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Archivos listos para inspeccionar, editar y ejecutar en el Sandbox.
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => onOpenProjectFile('')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold font-mono transition-all shadow-[0_0_12px_rgba(139,92,246,0.3)]"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Abrir en IDE</span>
                        </button>
                        <button
                          onClick={onExportZip}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-violet-300 text-xs font-mono transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          <span>Descargar ZIP</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Pending Action Approval Card */}
                  {msg.pendingAction && (
                    <div className="mt-4 p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40">
                      <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 mb-1.5">
                        <ShieldAlert className="w-4 h-4 text-amber-400" />
                        <span>ACCIÓN REQUIERE AUTORIZACIÓN: {msg.pendingAction.title}</span>
                      </div>
                      <p className="text-xs text-slate-300 mb-3">{msg.pendingAction.details}</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onApproveAction?.(msg.pendingAction!)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors"
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={() => onRejectAction?.(msg.pendingAction!)}
                          className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300 font-medium text-xs transition-colors"
                        >
                          Rechazar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Thinking / Searching / Synthesizing Indicator */}
          {isLoading && (
            <div className="flex gap-3.5 justify-start">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-pink-600 flex items-center justify-center shrink-0 p-[1px] shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                <div className="w-full h-full bg-[#05000D] rounded-[11px] flex items-center justify-center">
                  <Bot className="w-4 h-4 text-violet-300 animate-spin" />
                </div>
              </div>
              <div className="bg-[#05000D]/85 border border-violet-500/35 rounded-2xl p-4 text-xs font-mono text-violet-200 flex items-center gap-3 shadow-[0_0_30px_rgba(139,92,246,0.2)] backdrop-blur-2xl">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-ping" />
                <span>
                  KiranIA está formulando arquitectura, código de producción y verificando fallbacks...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* AI COMMAND CENTER (Bottom Sticky Input) */}
      <div className="border-t border-white/[0.08] bg-[#05000D]/80 backdrop-blur-3xl p-3 sm:p-5 sticky bottom-0 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="max-w-3xl mx-auto space-y-2.5">
          {/* Attached Files Previews */}
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/10">
              {attachedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-violet-950/40 border border-violet-500/30 text-xs font-mono text-violet-200"
                >
                  {file.mimeType.startsWith('image/') ? (
                    <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-violet-400" />
                  )}
                  <span className="max-w-[130px] truncate">{file.name}</span>
                  <button
                    onClick={() => removeAttachedFile(file.id)}
                    className="p-0.5 text-slate-400 hover:text-rose-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Top Controls Row: Persona Switcher & Tool Indicators */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold mr-1">
                AGENTE:
              </span>
              {AGENT_PERSONAS.map((persona) => (
                <button
                  key={persona.id}
                  type="button"
                  onClick={() => setSelectedPersona(persona.id)}
                  className={`px-2.5 py-0.5 rounded-lg text-[11px] font-mono transition-all ${
                    selectedPersona === persona.id
                      ? 'bg-violet-950/80 border border-violet-500/60 text-violet-200 font-semibold shadow-[0_0_10px_rgba(139,92,246,0.2)]'
                      : 'text-slate-400 hover:text-slate-200 bg-white/5'
                  }`}
                >
                  {persona.name}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {/* Model Catalog Pill */}
              {onOpenModelCatalog && (
                <button
                  type="button"
                  onClick={onOpenModelCatalog}
                  className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-violet-950/60 hover:bg-violet-900/60 border border-violet-500/30 text-[11px] font-mono text-violet-200 transition-all shadow-[0_0_10px_rgba(139,92,246,0.15)]"
                >
                  <Cpu className="w-3 h-3 text-violet-400" />
                  <span className="max-w-[100px] truncate">{selectedModel}</span>
                  <Zap className="w-2.5 h-2.5 text-emerald-400" />
                </button>
              )}

              {/* Auto Speak Toggle */}
              <button
                type="button"
                onClick={() => setAutoSpeak(!autoSpeak)}
                title={autoSpeak ? 'Desactivar voz automática' : 'Activar locución automática'}
                className={`flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-lg transition-all border ${
                  autoSpeak
                    ? 'bg-violet-950/70 border-violet-500/60 text-violet-300 shadow-sm'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
                }`}
              >
                {autoSpeak ? <Volume2 className="w-3 h-3 text-violet-400" /> : <VolumeX className="w-3 h-3" />}
                <span className="hidden sm:inline">Voz {autoSpeak ? 'ON' : 'OFF'}</span>
              </button>

              {/* Web Grounding Toggle */}
              <button
                type="button"
                onClick={onToggleWebSearch}
                className={`flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-lg transition-all border ${
                  webSearchActive
                    ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Web Grounding</span>
              </button>

              {/* Clear chat */}
              {onClearChat && (
                <button
                  type="button"
                  onClick={onClearChat}
                  title="Limpiar historial"
                  className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Main Technological Input Box */}
          <form
            onSubmit={handleSubmit}
            className="flex items-end gap-2 bg-[#080014]/90 border border-violet-500/30 focus-within:border-violet-400 focus-within:ring-1 focus-within:ring-violet-400/50 rounded-2xl p-3 transition-all shadow-[0_0_40px_rgba(109,40,217,0.18)] backdrop-blur-2xl"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Instrucción a KiranIA (ej: 'Crea un CRM interactivo con SQLite o memoria y vistas modernas')... (Shift+Enter para salto de línea)"
              rows={Math.min(4, Math.max(1, input.split('\n').length))}
              className="flex-1 bg-transparent border-0 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-0 resize-none px-2 py-1 max-h-36"
            />
            <div className="flex items-center gap-1 shrink-0">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Adjuntar archivos, imágenes o código"
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleToggleVoice}
                title={isRecording ? 'Detener dictado' : 'Dictar por voz'}
                className={`p-2 rounded-xl transition-all ${
                  isRecording
                    ? 'bg-rose-600 text-white animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <button
                type={isLoading ? 'button' : 'submit'}
                onClick={isLoading ? onCancelGeneration : undefined}
                disabled={!isLoading && !input.trim() && attachedFiles.length === 0}
                title={isLoading ? 'Cancelar generación' : 'Enviar mensaje'}
                className={`p-2.5 rounded-xl text-white transition-all shadow-[0_0_15px_rgba(168,85,247,0.35)] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  isLoading
                    ? 'bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-500 hover:to-orange-400'
                    : 'bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500'
                }`}
              >
                {isLoading ? <Square className="w-4 h-4" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
