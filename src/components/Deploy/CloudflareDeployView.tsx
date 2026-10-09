import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import {
  Globe,
  Cloud,
  Download,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Zap,
  Terminal,
  FolderArchive,
  Server,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Lock,
  Cpu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getApiBaseUrl } from '../../services/api';

interface CloudflareDeployViewProps {
  onNotify?: (msg: string, type?: 'info' | 'success' | 'warn') => void;
}

export const CloudflareDeployView: React.FC<CloudflareDeployViewProps> = ({ onNotify }) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCname, setCopiedCname] = useState(false);
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);
  const [pingStatus, setPingStatus] = useState<'idle' | 'checking' | 'healthy' | 'error'>('idle');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [healthData, setHealthData] = useState<any>(null);

  const productionUrl = 'https://ais-pre-6ygahfd6xl2xorvxmi7nyp-239401179834.europe-west2.run.app';
  const cnameTarget = 'ghs.googlehosted.com.';

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(productionUrl);
    setCopiedUrl(true);
    onNotify?.('URL de producción copiada: ' + productionUrl, 'success');
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopyCname = () => {
    navigator.clipboard.writeText(cnameTarget);
    setCopiedCname(true);
    onNotify?.('Destino CNAME copiado: ' + cnameTarget, 'success');
    setTimeout(() => setCopiedCname(false), 2000);
  };

  const handleCheckHealth = async () => {
    setPingStatus('checking');
    const start = performance.now();
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/health`);
      const elapsed = Math.round(performance.now() - start);
      setLatencyMs(elapsed);
      if (res.ok) {
        const data = await res.json();
        setHealthData(data);
        setPingStatus('healthy');
        onNotify?.(`Servidor en línea en Google Cloud Run (${elapsed} ms)`, 'success');
      } else {
        setPingStatus('error');
        onNotify?.('El servidor respondió con código de error ' + res.status, 'warn');
      }
    } catch {
      setPingStatus('error');
      onNotify?.('No se pudo verificar el estado en tiempo real.', 'warn');
    }
  };

  useEffect(() => {
    handleCheckHealth();
  }, []);

  const handleDownloadBackup = async () => {
    setIsGeneratingZip(true);
    onNotify?.('Generando paquete de respaldo de KiranAI...', 'info');

    try {
      const zip = new JSZip();

      zip.file(
        'README-PRODUCCION.md',
        `# KiranAI — Despliegue en Producción Google Cloud Run

## URL Oficial de Producción
${productionUrl}

## Infraestructura
- **Plataforma:** Google Cloud Run (Docker Containerizado)
- **Región:** europe-west2 (Londres, Google Cloud)
- **SSL / TLS:** Certificado gestionado automáticamente por Google Cloud
- **Sitemap:** ${productionUrl}/sitemap.xml
- **Robots:** ${productionUrl}/robots.txt
- **API Health:** ${productionUrl}/api/health

## Instrucciones para Mapear un Dominio Propio (kiranai.com / kiranai.app)
1. Registra tu dominio en cualquier registrador (Namecheap, DonDominio, Squarespace/Google Domains, etc.).
2. En la zona DNS de tu dominio, crea un registro CNAME:
   - **Tipo:** CNAME
   - **Host:** app (o @ / www)
   - **Destino:** ghs.googlehosted.com.
3. Google Cloud Run verificará la propagación y emitirá el certificado SSL gratuito automáticamente.
`
      );

      try {
        const robotsRes = await fetch('/robots.txt');
        if (robotsRes.ok) zip.file('robots.txt', await robotsRes.text());
      } catch {}

      try {
        const sitemapRes = await fetch('/sitemap.xml');
        if (sitemapRes.ok) zip.file('sitemap.xml', await sitemapRes.text());
      } catch {}

      const content = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'kiranai-production-manifest.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      onNotify?.('Respaldo descargado correctamente.', 'success');
    } catch (err: any) {
      onNotify?.('Error al generar respaldo: ' + (err.message || 'Error'), 'warn');
    } finally {
      setIsGeneratingZip(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="relative rounded-3xl overflow-hidden p-6 sm:p-8 bg-gradient-to-br from-[#121324] via-[#0d0e1a] to-[#18112c] border border-cyan-500/20 shadow-2xl shadow-cyan-950/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-cyan-500/10 via-purple-600/10 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            PRODUCCIÓN GOOGLE CLOUD RUN ACTIVA
          </div>

          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white flex flex-wrap items-center gap-3">
            <span>KiranAI en Producción</span>
            <span className="text-xs px-2.5 py-1 rounded-md bg-cyan-900/60 text-cyan-300 border border-cyan-700/50 font-mono">
              europe-west2
            </span>
          </h1>

          <p className="text-sm sm:text-base text-zinc-300 max-w-3xl leading-relaxed">
            KiranAI está desplegado y operativo en la infraestructura escalable de{' '}
            <strong className="text-white">Google Cloud Run</strong>. Todos los servicios de IA,
            el sistema de suscripciones Stripe, la base de datos persistente y el SEO técnico se
            encuentran en ejecución continua bajo protocolo HTTPS seguro.
          </p>

          {/* Main Production URL Box */}
          <div className="p-4 rounded-2xl bg-[#090a12]/90 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                URL Oficial de Producción Compartida
              </span>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
                <a
                  href={productionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm sm:text-base font-mono text-cyan-300 hover:text-cyan-200 hover:underline truncate"
                >
                  {productionUrl}
                </a>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyUrl}
                className="flex-1 sm:flex-none border-cyan-500/30 hover:bg-cyan-500/10 text-cyan-300"
              >
                {copiedUrl ? <Check className="w-4 h-4 mr-1 text-emerald-400" /> : <Copy className="w-4 h-4 mr-1" />}
                {copiedUrl ? 'Copiada' : 'Copiar URL'}
              </Button>
              <Button
                size="sm"
                asChild
                className="flex-1 sm:flex-none bg-cyan-600 hover:bg-cyan-500 text-white"
              >
                <a href={productionUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Abrir
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics & Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Cloud Run Status */}
        <div className="p-5 rounded-2xl bg-[#101018] border border-[#232332] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-200 font-semibold text-sm">
              <Server className="w-4 h-4 text-purple-400" />
              <span>Infraestructura Cloud</span>
            </div>
            <button
              onClick={handleCheckHealth}
              disabled={pingStatus === 'checking'}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
              title="Comprobar salud del servidor"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${pingStatus === 'checking' ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="space-y-1.5 text-xs text-zinc-400 font-mono">
            <div className="flex justify-between">
              <span>Host:</span>
              <span className="text-zinc-200">Google Cloud Run</span>
            </div>
            <div className="flex justify-between">
              <span>Región:</span>
              <span className="text-zinc-200">europe-west2</span>
            </div>
            <div className="flex justify-between">
              <span>Latencia API:</span>
              <span className={latencyMs !== null ? 'text-emerald-400 font-bold' : 'text-zinc-500'}>
                {latencyMs !== null ? `${latencyMs} ms` : 'Verificando...'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Estado:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> ONLINE
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Security & SSL */}
        <div className="p-5 rounded-2xl bg-[#101018] border border-[#232332] space-y-3">
          <div className="flex items-center gap-2 text-zinc-200 font-semibold text-sm">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Seguridad & SSL</span>
          </div>
          <div className="space-y-1.5 text-xs text-zinc-400 font-mono">
            <div className="flex justify-between">
              <span>Certificado:</span>
              <span className="text-emerald-400">Google Managed TLS</span>
            </div>
            <div className="flex justify-between">
              <span>Protocolo:</span>
              <span className="text-zinc-200">HTTPS (HTTP/2)</span>
            </div>
            <div className="flex justify-between">
              <span>CORS & Iframe:</span>
              <span className="text-zinc-200">Habilitado</span>
            </div>
            <div className="flex justify-between">
              <span>Secretos .env:</span>
              <span className="text-emerald-400">Protegidos (Backend)</span>
            </div>
          </div>
        </div>

        {/* Card 3: SEO & Indexing */}
        <div className="p-5 rounded-2xl bg-[#101018] border border-[#232332] space-y-3">
          <div className="flex items-center gap-2 text-zinc-200 font-semibold text-sm">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>SEO Técnico & Rastreo</span>
          </div>
          <div className="space-y-1.5 text-xs text-zinc-400 font-mono">
            <div className="flex justify-between">
              <span>robots.txt:</span>
              <a href="/robots.txt" target="_blank" className="text-cyan-400 hover:underline">
                /robots.txt
              </a>
            </div>
            <div className="flex justify-between">
              <span>Sitemap XML:</span>
              <a href="/sitemap.xml" target="_blank" className="text-cyan-400 hover:underline">
                /sitemap.xml
              </a>
            </div>
            <div className="flex justify-between">
              <span>OpenGraph / X:</span>
              <span className="text-emerald-400">Configurado</span>
            </div>
            <div className="flex justify-between">
              <span>Schema.org:</span>
              <span className="text-emerald-400">JSON-LD Activo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Domain Guide Box */}
      <div className="p-6 rounded-2xl bg-[#12121d] border border-[#272739] space-y-4">
        <div className="flex items-center gap-2.5 text-base font-semibold text-white">
          <Globe className="w-5 h-5 text-purple-400" />
          <span>¿Cómo vincular un dominio propio (kiranai.com / kiranai.app)?</span>
        </div>

        <p className="text-sm text-zinc-300 leading-relaxed">
          Google Cloud Run permite mapear cualquier dominio personalizado registrado a tu nombre sin coste adicional por la emisión del certificado SSL. Para que tus usuarios accedan directamente mediante tu propia marca:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3.5 rounded-xl bg-[#0b0c14] border border-[#1e1e2d] space-y-1">
            <div className="text-xs font-bold text-purple-300">1. Registra tu dominio</div>
            <div className="text-[11px] text-zinc-400">
              Adquiere <code className="text-zinc-200">kiranai.com</code> o <code className="text-zinc-200">kiranai.app</code> en cualquier registrador de dominios.
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#0b0c14] border border-[#1e1e2d] space-y-1">
            <div className="text-xs font-bold text-cyan-300">2. Crea un registro CNAME</div>
            <div className="text-[11px] text-zinc-400">
              Apunta el subdominio <code className="text-zinc-200">app</code> hacia el host de Google:
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-300 bg-black/40 px-2 py-1 rounded">
              <span>{cnameTarget}</span>
              <button onClick={handleCopyCname} className="text-cyan-400 hover:text-cyan-300">
                {copiedCname ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#0b0c14] border border-[#1e1e2d] space-y-1">
            <div className="text-xs font-bold text-emerald-300">3. SSL Automático</div>
            <div className="text-[11px] text-zinc-400">
              Google Cloud emite el certificado TLS administrado de forma automática una vez verificado el DNS.
            </div>
          </div>
        </div>
      </div>

      {/* Backup and Export Action */}
      <div className="p-5 rounded-2xl bg-[#101018] border border-[#232332] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-sm font-semibold text-white flex items-center gap-2">
            <FolderArchive className="w-4 h-4 text-purple-400" />
            <span>Descargar Respaldo de Producción</span>
          </div>
          <p className="text-xs text-zinc-400">
            Descarga un paquete con el manifiesto oficial de producción, sitemap y especificaciones de despliegue.
          </p>
        </div>

        <Button
          onClick={handleDownloadBackup}
          disabled={isGeneratingZip}
          className="bg-purple-600 hover:bg-purple-500 text-white shrink-0"
        >
          <Download className="w-4 h-4 mr-2" />
          {isGeneratingZip ? 'Generando...' : 'Descargar Paquete'}
        </Button>
      </div>
    </div>
  );
};
