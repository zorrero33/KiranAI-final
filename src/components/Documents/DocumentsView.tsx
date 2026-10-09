import React, { useState } from 'react';
import {
  FileText,
  Upload,
  BookOpen,
  Sparkles,
  Search,
  Check,
  Copy,
  Download,
  RefreshCw,
  FolderOpen,
  HelpCircle,
  ListChecks,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getApiBaseUrl } from '../../services/api';

interface DocumentsViewProps {
  onNotify?: (msg: string, type?: 'info' | 'success' | 'warn') => void;
  onSendToChat?: (text: string) => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({ onNotify, onSendToChat }) => {
  const [docContent, setDocContent] = useState<string>(
    `# Especificación del Sistema Kiran AI OS v1.2\n\nKiran AI es un sistema operativo de inteligencia artificial autónomo diseñado para desarrolladores, investigadores y creadores digitales.\n\n## Características Principales:\n1. Enrutador universal de modelos con failover automático a través de LiteLLM Proxy, Groq LPU, Google Gemini 3.5 Flash, Mistral AI y OpenRouter.\n2. Espacio de trabajo de código con ejecutor nativo y empaquetador ZIP.\n3. Soporte móvil completo con compatibilidad WebAPK y compilación de paquetes instalables Android APK.\n4. Memoria contextual persistente y centro de automatizaciones.\n5. Modos de diagnóstico y resolución de problemas técnicos.`
  );
  const [docTitle, setDocTitle] = useState('Especificacion-KiranAI.md');
  const [query, setQuery] = useState('¿Cuáles son los proveedores soportados por Kiran AI?');
  const [queryResult, setQueryResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Analyze or Ask Document
  const handleQueryDocument = async () => {
    if (!docContent.trim() || !query.trim()) {
      onNotify?.('Por favor ingresa contenido del documento y una pregunta.', 'warn');
      return;
    }

    try {
      setIsProcessing(true);
      setQueryResult(null);
      onNotify?.('Analizando documento con modelo de razonamiento...', 'info');

      const res = await fetch(`${getApiBaseUrl()}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemini-3.5-flash',
          messages: [
            {
              role: 'system',
              content: 'Eres el motor de análisis documental de Kiran AI. Responde a la pregunta del usuario estrictamente basada en el documento provisto, citando secciones o datos clave con precisión técnica.',
            },
            {
              role: 'user',
              content: `DOCUMENTO:\n"""\n${docContent}\n"""\n\nPREGUNTA DEL USUARIO:\n${query}`,
            },
          ],
        }),
      });

      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();
      setQueryResult(data.content || 'Sin respuesta.');
      onNotify?.('¡Análisis documental completado!', 'success');
    } catch (err: any) {
      onNotify?.(`Error al consultar documento: ${err.message}`, 'warn');
    } finally {
      setIsProcessing(false);
    }
  };

  // Summarize Document
  const handleSummarize = async () => {
    if (!docContent.trim()) return;
    setQuery('Genera un resumen ejecutivo conciso del documento con los 5 puntos clave más relevantes.');
    setTimeout(() => {
      handleQueryDocument();
    }, 50);
  };

  // Handle local text file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocTitle(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setDocContent(reader.result as string);
      onNotify?.(`Documento "${file.name}" cargado.`, 'success');
    };
    reader.readAsText(file);
  };

  return (
    <div className="h-full overflow-y-auto bg-[#07070a] p-4 lg:p-8 space-y-6 select-none text-zinc-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#1f1f2d] pb-6">
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 font-mono text-xs">
            DEEP DOCUMENT INTELLIGENCE
          </span>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white mt-1">
            Analizador de Documentos & Base de Conocimiento
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Extrae datos, genera resúmenes y realiza preguntas directas sobre cualquier texto o archivo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="px-4 py-2 rounded-xl bg-[#141420] hover:bg-[#1c1c2e] border border-[#262638] text-xs font-semibold text-zinc-200 cursor-pointer flex items-center gap-2 transition-colors">
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            Cargar Archivo (.txt, .md, .csv)
            <input type="file" accept=".txt,.md,.json,.csv,.js,.ts" onChange={handleFileUpload} className="hidden" />
          </label>
          <Button
            variant="outline"
            onClick={handleSummarize}
            disabled={isProcessing}
            className="border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 rounded-xl text-xs py-2 px-3 flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Resumen Automático
          </Button>
        </div>
      </div>

      {/* 2-Column Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Editor */}
        <div className="rounded-2xl p-6 bg-[#0c0c14] border border-[#222232] space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" />
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="bg-transparent font-semibold text-sm text-white focus:outline-none border-b border-transparent focus:border-purple-500"
                />
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">
                {docContent.length} caracteres
              </span>
            </div>

            <textarea
              value={docContent}
              onChange={(e) => setDocContent(e.target.value)}
              placeholder="Pega aquí el contenido de un informe, especificación técnica, código o artículo..."
              rows={18}
              className="w-full bg-[#11111a] border border-[#262638] rounded-xl p-3.5 text-xs text-zinc-200 font-mono leading-relaxed focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-zinc-400">
            <span>Formato: Markdown / Texto plano</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(docContent);
                onNotify?.('Documento copiado', 'info');
              }}
              className="hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <Copy className="w-3 h-3" />
              Copiar Texto
            </button>
          </div>
        </div>

        {/* Q&A & Analysis Box */}
        <div className="rounded-2xl p-6 bg-[#0c0c14] border border-[#222232] space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              Consulta Inteligente al Documento
            </h3>

            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 font-medium">¿Qué deseas saber o extraer?</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleQueryDocument()}
                  placeholder="Escribe una pregunta sobre el texto..."
                  className="flex-1 bg-[#13131e] border border-[#262638] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
                <Button
                  onClick={handleQueryDocument}
                  disabled={isProcessing}
                  className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-semibold text-xs px-4 rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  Preguntar
                </Button>
              </div>
            </div>

            {/* Answer Display */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Respuesta del Modelo:</span>
                {queryResult && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(queryResult);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="flex items-center gap-1 text-[11px] text-cyan-400 hover:underline cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    Copiar
                  </button>
                )}
              </div>

              {queryResult ? (
                <div className="p-4 rounded-xl bg-[#12121c] border border-[#27273a] text-xs text-zinc-200 leading-relaxed font-sans whitespace-pre-wrap max-h-[360px] overflow-y-auto">
                  {queryResult}
                </div>
              ) : (
                <div className="p-10 border border-dashed border-[#222232] rounded-xl text-center text-zinc-500 text-xs flex flex-col items-center justify-center space-y-2">
                  <BookOpen className="w-8 h-8 opacity-30" />
                  <p>Escribe tu pregunta arriba o pulsa "Resumen Automático" para recibir un análisis instantáneo.</p>
                </div>
              )}
            </div>
          </div>

          {queryResult && onSendToChat && (
            <Button
              variant="outline"
              onClick={() => onSendToChat(`He consultado el documento "${docTitle}". Pregunta: ${query}\n\nRespuesta:\n${queryResult}`)}
              className="w-full border-purple-500/30 text-purple-300 hover:bg-purple-500/10 rounded-xl text-xs py-2 mt-2 cursor-pointer"
            >
              Enviar esta consulta al Chat Principal
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
