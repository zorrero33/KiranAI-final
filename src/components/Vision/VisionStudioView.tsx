import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Sparkles,
  Upload,
  Download,
  Copy,
  Check,
  RefreshCw,
  Wand2,
  Scan,
  Eye,
  Sliders,
  Maximize2,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getApiBaseUrl } from '../../services/api';

interface VisionStudioProps {
  onNotify?: (msg: string, type?: 'info' | 'success' | 'warn') => void;
  onSendToChat?: (text: string, files?: any[]) => void;
}

export const VisionStudioView: React.FC<VisionStudioProps> = ({ onNotify, onSendToChat }) => {
  const [activeTab, setActiveTab] = useState<'generate' | 'analyze'>('generate');

  // Generation state
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3'>('1:1');
  const [stylePreset, setStylePreset] = useState<'photoreal' | 'cyberpunk' | '3d-render' | 'minimal' | 'anime'>('cyberpunk');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<
    Array<{
      id: string;
      url: string;
      prompt: string;
      style: string;
      timestamp: number;
    }>
  >([
    {
      id: 'kiran-prime',
      url: '/kiran-logo.jpg',
      prompt: 'Kiran AI Official Emblem - Radiant Cosmic Prism Neural Ray',
      style: 'Cyberpunk',
      timestamp: Date.now(),
    },
  ]);

  // Analysis state
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: number;
    previewUrl: string;
    base64?: string;
  } | null>(null);
  const [analysisPrompt, setAnalysisPrompt] = useState('Analiza esta imagen detalladamente, explica sus componentes visuales, texto y patrones técnicos.');
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Generate Image
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      onNotify?.('Por favor ingresa un prompt descriptivo para generar la imagen.', 'warn');
      return;
    }

    try {
      setIsGenerating(true);
      onNotify?.('Generando imagen con motor de difusión visual...', 'info');

      // Call API or generate high quality render
      const res = await fetch(`${getApiBaseUrl()}/api/vision/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `${prompt}, style: ${stylePreset}, aspect ratio: ${aspectRatio}, ultra high detail, 8k resolution, cinematic lighting`,
          aspectRatio,
        }),
      });

      let imageUrl = '';
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Error del servidor (${res.status})`);
      }

      const data = await res.json();
      imageUrl = data.imageUrl || data.url;

      if (!imageUrl) {
        throw new Error('El proveedor no devolvió los datos de la imagen generada.');
      }

      const newImage = {
        id: `img-${Date.now()}`,
        url: imageUrl,
        prompt,
        style: stylePreset,
        timestamp: Date.now(),
      };

      setGeneratedImages((prev) => [newImage, ...prev]);
      onNotify?.('¡Imagen generada con éxito!', 'success');
    } catch (err: any) {
      onNotify?.(`Error al generar imagen: ${err.message}`, 'warn');
    } finally {
      setIsGenerating(false);
    }
  };

  // Upload for analysis
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setSelectedFile({
        name: file.name,
        size: file.size,
        previewUrl: result,
        base64: result.split(',')[1],
      });
      onNotify?.(`Imagen cargada: ${file.name}`, 'info');
    };
    reader.readAsDataURL(file);
  };

  // Run Vision Analysis
  const handleAnalyze = async () => {
    if (!selectedFile) {
      onNotify?.('Por favor selecciona o arrastra una imagen para analizar.', 'warn');
      return;
    }

    try {
      setIsAnalyzing(true);
      setAnalysisResult(null);
      onNotify?.('Procesando análisis multimodal con visión artificial...', 'info');

      const res = await fetch(`${getApiBaseUrl()}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemini-3.5-flash',
          messages: [
            {
              role: 'user',
              content: analysisPrompt,
              files: [
                {
                  id: 'file-1',
                  name: selectedFile.name,
                  mimeType: 'image/jpeg',
                  data: selectedFile.base64,
                },
              ],
            },
          ],
        }),
      });

      if (!res.ok) {
        throw new Error(`Error en servidor: ${res.statusText}`);
      }

      const data = await res.json();
      setAnalysisResult(data.content || 'Análisis completado sin observaciones.');
      onNotify?.('¡Análisis visual completado!', 'success');
    } catch (err: any) {
      onNotify?.(`Error en análisis: ${err.message}`, 'warn');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    onNotify?.('Copiado al portapapeles', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="h-full overflow-y-auto bg-[#07070a] p-4 lg:p-8 space-y-6 select-none text-zinc-100">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#1f1f2d] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-xs">
              MULTIMODAL STUDIO
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white mt-1">
            Visión Artificial & Generador Visual
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Generación visual de alta fidelidad y análisis técnico de imágenes con modelos multimodales.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-[#12121a] p-1 rounded-xl border border-[#262638]">
          <button
            onClick={() => setActiveTab('generate')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'generate'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Generador de Imágenes
          </button>
          <button
            onClick={() => setActiveTab('analyze')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'analyze'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Scan className="w-3.5 h-3.5" />
            Analizador & OCR
          </button>
        </div>
      </div>

      {/* GENERATOR TAB */}
      {activeTab === 'generate' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Column */}
          <div className="rounded-2xl p-6 bg-[#0c0c14] border border-[#222232] space-y-5">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-2">Prompt de Generación</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ejemplo: Logotipo futurista con prisma de cuarzo luminoso, rayos de neón violeta y cian, fondo cibernético de alta resolución..."
                rows={4}
                className="w-full bg-[#13131e] border border-[#2a2a3e] rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-2">Estilo Visual</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {(['cyberpunk', 'photoreal', '3d-render', 'minimal', 'anime'] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => setStylePreset(style)}
                    className={`py-2 px-3 rounded-xl border text-center capitalize cursor-pointer transition-colors ${
                      stylePreset === style
                        ? 'border-purple-500 bg-purple-600/20 text-purple-300 font-semibold'
                        : 'border-[#262638] bg-[#141420] text-zinc-400 hover:text-white'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-2">Relación de Aspecto</label>
              <div className="grid grid-cols-4 gap-2 text-xs">
                {(['1:1', '16:9', '9:16', '4:3'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`py-2 rounded-xl border text-center font-mono cursor-pointer transition-colors ${
                      aspectRatio === ratio
                        ? 'border-cyan-500 bg-cyan-600/20 text-cyan-300 font-bold'
                        : 'border-[#262638] bg-[#141420] text-zinc-400 hover:text-white'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-600/25"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Renderizando...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Generar Imagen IA
                </>
              )}
            </Button>
          </div>

          {/* Gallery Column */}
          <div className="lg:col-span-2 rounded-2xl p-6 bg-[#0c0c14] border border-[#222232] space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-purple-400" />
              Galería de Creaciones Visuales ({generatedImages.length})
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {generatedImages.map((img) => (
                <div
                  key={img.id}
                  className="group rounded-2xl overflow-hidden border border-[#242436] bg-[#12121c] flex flex-col justify-between hover:border-purple-500/40 transition-colors"
                >
                  <div className="relative aspect-square overflow-hidden bg-black/60">
                    <img
                      src={img.url}
                      alt={img.prompt}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a
                        href={img.url}
                        download={`kiran-${img.id}.jpg`}
                        className="p-1.5 rounded-lg bg-black/70 hover:bg-black text-white backdrop-blur-md"
                        title="Descargar"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  <div className="p-3 space-y-1">
                    <p className="text-xs text-zinc-200 font-medium line-clamp-2">{img.prompt}</p>
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1">
                      <span className="font-mono capitalize text-purple-300">{img.style}</span>
                      <span>{new Date(img.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ANALYZE TAB */}
      {activeTab === 'analyze' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload & Preview Column */}
          <div className="rounded-2xl p-6 bg-[#0c0c14] border border-[#222232] space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-cyan-400" />
              Cargar Imagen para Análisis Técnico
            </h3>

            <label className="border-2 border-dashed border-[#2d2d42] hover:border-cyan-500/60 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-[#11111a]">
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              {selectedFile ? (
                <div className="space-y-3 text-center">
                  <img
                    src={selectedFile.previewUrl}
                    alt="Preview"
                    className="max-h-52 rounded-xl object-contain mx-auto border border-[#333]"
                  />
                  <div className="text-xs text-zinc-300 font-medium">{selectedFile.name}</div>
                  <div className="text-[10px] text-zinc-500 font-mono">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-2 py-6">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-semibold text-zinc-200">
                    Haz clic o arrastra una imagen aquí
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    Soporta PNG, JPG, WebP, capturas de pantalla y diagramas
                  </div>
                </div>
              )}
            </label>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-2">Instrucción de Análisis</label>
              <textarea
                value={analysisPrompt}
                onChange={(e) => setAnalysisPrompt(e.target.value)}
                rows={3}
                className="w-full bg-[#13131e] border border-[#2a2a3e] rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !selectedFile}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-600/25"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Analizando Imagen con Visión IA...
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  Ejecutar Análisis de Visión
                </>
              )}
            </Button>
          </div>

          {/* Results Column */}
          <div className="rounded-2xl p-6 bg-[#0c0c14] border border-[#222232] space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Scan className="w-4 h-4 text-purple-400" />
                  Resultados del Análisis Multimodal
                </h3>
                {analysisResult && (
                  <button
                    onClick={() => copyToClipboard(analysisResult, 'analysis')}
                    className="p-1.5 rounded-lg bg-[#181824] hover:bg-[#202030] text-zinc-300 text-xs flex items-center gap-1 cursor-pointer"
                  >
                    {copiedId === 'analysis' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    Copiar
                  </button>
                )}
              </div>

              {analysisResult ? (
                <div className="p-4 rounded-xl bg-[#12121c] border border-[#252538] text-xs text-zinc-200 leading-relaxed font-sans whitespace-pre-wrap max-h-[460px] overflow-y-auto">
                  {analysisResult}
                </div>
              ) : (
                <div className="p-12 text-center text-zinc-500 text-xs border border-dashed border-[#222232] rounded-xl flex flex-col items-center justify-center space-y-2">
                  <Eye className="w-8 h-8 opacity-40" />
                  <p>Carga una imagen y haz clic en "Ejecutar Análisis de Visión" para ver los detalles aquí.</p>
                </div>
              )}
            </div>

            {analysisResult && onSendToChat && (
              <Button
                variant="outline"
                onClick={() => onSendToChat(`He analizado esta imagen. Resultado:\n\n${analysisResult}`)}
                className="w-full border-purple-500/30 text-purple-300 hover:bg-purple-500/10 rounded-xl text-xs py-2 mt-4 cursor-pointer"
              >
                Continuar conversación sobre esta imagen en el Chat
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
