import React, { useState } from 'react';
import { AttachedFile, Project } from '../../types';
import {
  Target,
  Sparkles,
  CheckCircle2,
  FileText,
  Paperclip,
  Terminal,
  Zap,
} from 'lucide-react';

interface SolveViewProps {
  onRunSolve: (problemText: string, attachedFile?: AttachedFile) => Promise<string>;
  activeProject: Project | null;
  onApplySolutionToProject?: (codeOrPatch: string) => void;
}

export const SolveView: React.FC<SolveViewProps> = ({
  onRunSolve,
  activeProject,
  onApplySolutionToProject,
}) => {
  const [problemDescription, setProblemDescription] = useState('');
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [solvingState, setSolvingState] = useState<'idle' | 'analyzing' | 'complete'>('idle');
  const [solveResult, setSolveResult] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const reader = new FileReader();

    if (isImage) {
      reader.onload = (event) => {
        const result = event.target?.result as string;
        const base64Data = result.split(',')[1] || '';
        setAttachedFile({
          id: `solve_file_${Date.now()}`,
          name: file.name,
          size: file.size,
          type: file.type,
          mimeType: file.type,
          data: base64Data,
        });
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = (event) => {
        const textContent = event.target?.result as string;
        setAttachedFile({
          id: `solve_file_${Date.now()}`,
          name: file.name,
          size: file.size,
          type: file.type,
          mimeType: file.type || 'text/plain',
          textContent,
        });
      };
      reader.readAsText(file);
    }
  };

  const handleExecuteSolve = async () => {
    if (!problemDescription.trim() && !attachedFile) return;

    setSolvingState('analyzing');
    setErrorMsg(null);
    setSolveResult(null);

    try {
      const output = await onRunSolve(
        `[SOLVE MODE INSTRUCTION]\nProblema o requerimiento:\n${problemDescription}\n\nEstructura tu diagnóstico de la siguiente manera:\n1. COMPRENSIÓN & RESTRICCIONES CLAVE\n2. ANÁLISIS DE CAUSA RAÍZ / INVESTIGACIÓN\n3. MATRIZ COMPARATIVA DE SOLUCIONES (Pros, contras, complejidad)\n4. ACCIÓN PROPUESTA & CÓDIGO CORRECTIVO (Usa <<<FILE: ruta>>> si corresponde)\n5. ESTADO DE VERIFICACIÓN (VERIFIED, PARTIALLY VERIFIED, UNVERIFIED)`,
        attachedFile || undefined
      );
      setSolveResult(output);
      setSolvingState('complete');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al ejecutar el motor SOLVE.');
      setSolvingState('idle');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] bg-[#09090b] overflow-y-auto p-4 md:p-8 select-none">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="border-b border-[#272732] pb-5">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-fuchsia-600 to-purple-600 flex items-center justify-center p-[1px] shadow-lg">
              <div className="w-full h-full bg-[#0d0d12] rounded-[7px] flex items-center justify-center">
                <Target className="w-4 h-4 text-fuchsia-400" />
              </div>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              SOLVE Engine — Engineering Diagnostics & Synthesis
            </h1>
          </div>
          <p className="text-xs md:text-sm text-zinc-400">
            Proporciona un problema técnico, error de producción, arquitectura o archivo complejo.
            KiranIA identifica restricciones, investiga causas, compara alternativas y genera la solución comprobada.
          </p>
        </div>

        {/* Diagnostic Pipeline Visual Steps */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center text-xs font-mono">
          <div className="p-2.5 rounded-lg bg-[#121217] border border-[#272732] text-zinc-300">
            <span className="text-purple-400 font-bold block mb-1">01. COMPREHEND</span>
            <span className="text-[11px] text-zinc-500">Constraints & scope</span>
          </div>
          <div className="p-2.5 rounded-lg bg-[#121217] border border-[#272732] text-zinc-300">
            <span className="text-indigo-400 font-bold block mb-1">02. INVESTIGATE</span>
            <span className="text-[11px] text-zinc-500">Root cause & data</span>
          </div>
          <div className="p-2.5 rounded-lg bg-[#121217] border border-[#272732] text-zinc-300">
            <span className="text-fuchsia-400 font-bold block mb-1">03. COMPARE</span>
            <span className="text-[11px] text-zinc-500">Tradeoffs & cost</span>
          </div>
          <div className="p-2.5 rounded-lg bg-[#121217] border border-[#272732] text-zinc-300">
            <span className="text-amber-400 font-bold block mb-1">04. ACTION</span>
            <span className="text-[11px] text-zinc-500">Code & resolution</span>
          </div>
          <div className="p-2.5 rounded-lg bg-[#121217] border border-[#272732] text-zinc-300">
            <span className="text-emerald-400 font-bold block mb-1">05. VERIFY</span>
            <span className="text-[11px] text-zinc-500">Evidence status</span>
          </div>
        </div>

        {/* Input Problem Card */}
        <div className="p-4 md:p-5 rounded-xl bg-[#121217] border border-[#272732] space-y-4 shadow-xl">
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase text-zinc-400 font-semibold flex items-center justify-between">
              <span>PROBLEM STATEMENT OR TECHNICAL CHALLENGE</span>
              {activeProject && (
                <span className="text-purple-400 lowercase font-normal">
                  Active Context: {activeProject.name}
                </span>
              )}
            </label>
            <textarea
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              placeholder="Describe con precisión la anomalía, el requerimiento complejo o el fallo que necesitas resolver..."
              rows={4}
              className="w-full bg-[#09090b] border border-[#272732] focus:border-fuchsia-500 rounded-lg p-3 text-xs md:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-fuchsia-500/50"
            />
          </div>

          {/* Attached Document or File for Diagnostics */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#181822] hover:bg-[#202030] border border-[#272732] text-xs font-mono text-zinc-300 transition-colors"
              >
                <Paperclip className="w-3.5 h-3.5 text-fuchsia-400" />
                <span>{attachedFile ? 'Change Attached File' : 'Attach File / Log / Image'}</span>
              </button>

              {attachedFile && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-fuchsia-950/40 border border-fuchsia-800/50 text-xs font-mono text-fuchsia-300">
                  <FileText className="w-3.5 h-3.5" />
                  <span className="max-w-[160px] truncate">{attachedFile.name}</span>
                  <button
                    onClick={() => setAttachedFile(null)}
                    className="ml-1 text-zinc-400 hover:text-white"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handleExecuteSolve}
              disabled={solvingState === 'analyzing' || (!problemDescription.trim() && !attachedFile)}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 disabled:opacity-40 text-white text-xs font-bold font-mono tracking-wide transition-all shadow-lg"
            >
              {solvingState === 'analyzing' ? (
                <>
                  <Zap className="w-4 h-4 animate-spin" />
                  <span>ANALYZING...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>SYNTHESIZE SOLUTION</span>
                </>
              )}
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-lg bg-rose-950/40 border border-rose-800/50 text-xs text-rose-300 font-mono">
            {errorMsg}
          </div>
        )}

        {/* Result Area */}
        {solveResult && (
          <div className="p-5 rounded-xl bg-[#121217] border border-purple-800/40 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#272732] pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm text-white font-mono">SOLVE SYNTHESIS REPORT</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 text-[11px] font-mono text-emerald-300">
                  VERIFIED HYPOTHESIS
                </span>
              </div>
            </div>

            <div className="text-xs md:text-sm leading-relaxed text-zinc-300 font-mono whitespace-pre-wrap bg-[#09090b] p-4 rounded-lg border border-[#272732]">
              {solveResult}
            </div>

            {onApplySolutionToProject && activeProject && (
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => onApplySolutionToProject(solveResult)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold font-mono transition-colors"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Apply Code Changes to Active Project</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
