import React, { useState, useEffect, useRef } from 'react';
import { Project, ProjectFile } from '../../types';
import {
  FileCode,
  FileText,
  FileJson,
  Plus,
  Trash2,
  Download,
  Play,
  RefreshCw,
  Maximize2,
  Terminal,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  X,
  Smartphone,
  Tablet,
  Monitor,
  Layers,
} from 'lucide-react';

interface CodeEditorViewProps {
  project: Project;
  onUpdateProject: (updatedProject: Project) => void;
  onExportZip: () => void;
  onAskKiranToEdit: (prompt: string, targetFile?: string) => void;
  isAiGenerating?: boolean;
}

export const CodeEditorView: React.FC<CodeEditorViewProps> = ({
  project,
  onUpdateProject,
  onExportZip,
  onAskKiranToEdit,
  isAiGenerating,
}) => {
  const [activeFileId, setActiveFileId] = useState<string>(
    project.activeFileId || project.files[0]?.id || ''
  );
  const [openFileIds, setOpenFileIds] = useState<string[]>([
    project.activeFileId || project.files[0]?.id || '',
  ]);
  const [fileFilter, setFileFilter] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [bottomTab, setBottomTab] = useState<'preview' | 'console' | 'environment'>('preview');
  const [bottomHeight, setBottomHeight] = useState<number>(320);
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [consoleLogs, setConsoleLogs] = useState<Array<{ type: 'log' | 'error' | 'warn'; message: string; timestamp: string }>>([
    { type: 'log', message: 'KiranIA Browser Sandbox initialized.', timestamp: new Date().toLocaleTimeString() },
    { type: 'log', message: 'Ready to preview HTML/CSS/JS files.', timestamp: new Date().toLocaleTimeString() },
  ]);

  // In-app modals & notices (zero blocking alerts/prompts)
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFilePath, setNewFilePath] = useState('');
  const [workspaceNotice, setWorkspaceNotice] = useState<string | null>(null);
  const [fileToDelete, setFileToDelete] = useState<{ id: string; path: string } | null>(null);

  const showWorkspaceNotice = (msg: string) => {
    setWorkspaceNotice(msg);
    setTimeout(() => setWorkspaceNotice(null), 4000);
  };

  const previewIframeRef = useRef<HTMLIFrameElement>(null);

  // Sync active file if changed
  const activeFile = project.files.find((f) => f.id === activeFileId) || project.files[0];

  const handleSelectFile = (file: ProjectFile) => {
    setActiveFileId(file.id);
    if (!openFileIds.includes(file.id)) {
      setOpenFileIds((prev) => [...prev, file.id]);
    }
  };

  const handleCloseTab = (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newOpen = openFileIds.filter((id) => id !== fileId);
    setOpenFileIds(newOpen);
    if (activeFileId === fileId) {
      setActiveFileId(newOpen[newOpen.length - 1] || '');
    }
  };

  const handleContentChange = (newContent: string) => {
    if (!activeFile) return;
    const updatedFiles = project.files.map((f) =>
      f.id === activeFile.id ? { ...f, content: newContent, updatedAt: Date.now() } : f
    );
    onUpdateProject({
      ...project,
      files: updatedFiles,
      updatedAt: Date.now(),
    });
  };

  const handleCreateFileSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newFilePath.trim()) {
      setIsCreatingFile(false);
      return;
    }
    const trimmed = newFilePath.trim();
    if (project.files.some((f) => f.path.toLowerCase() === trimmed.toLowerCase())) {
      showWorkspaceNotice('Ya existe un archivo con esa ruta.');
      return;
    }
    const name = trimmed.split('/').pop() || trimmed;
    const ext = name.split('.').pop() || 'txt';
    let language = 'text';
    if (['js', 'mjs'].includes(ext)) language = 'javascript';
    else if (['ts', 'tsx'].includes(ext)) language = 'typescript';
    else if (['html'].includes(ext)) language = 'html';
    else if (['css'].includes(ext)) language = 'css';
    else if (['json'].includes(ext)) language = 'json';
    else if (['md'].includes(ext)) language = 'markdown';

    const newFile: ProjectFile = {
      id: `f_${Date.now()}`,
      path: trimmed,
      name,
      content: `// ${name}\n// Created in KiranIA Code Workspace\n`,
      language,
      updatedAt: Date.now(),
    };

    const updated = {
      ...project,
      files: [...project.files, newFile],
      activeFileId: newFile.id,
      updatedAt: Date.now(),
    };
    onUpdateProject(updated);
    setActiveFileId(newFile.id);
    setOpenFileIds((prev) => [...prev, newFile.id]);
    setIsCreatingFile(false);
    setNewFilePath('');
  };

  const handleTriggerDelete = (fileId: string, filePath: string) => {
    if (project.files.length <= 1) {
      showWorkspaceNotice('El proyecto debe contener al menos un archivo.');
      return;
    }
    setFileToDelete({ id: fileId, path: filePath });
  };

  const handleConfirmDelete = () => {
    if (!fileToDelete) return;
    const { id: fileId } = fileToDelete;
    const remaining = project.files.filter((f) => f.id !== fileId);
    const newOpen = openFileIds.filter((id) => id !== fileId);
    const updated = {
      ...project,
      files: remaining,
      activeFileId: remaining[0]?.id || '',
      updatedAt: Date.now(),
    };
    onUpdateProject(updated);
    setOpenFileIds(newOpen);
    setActiveFileId(remaining[0]?.id || '');
    setFileToDelete(null);
  };

  // Compile project files for live browser sandbox preview
  const generatePreviewHtml = (): string => {
    const indexHtml = project.files.find((f) => f.path.toLowerCase().endsWith('index.html'));
    const cssFiles = project.files.filter((f) => f.language === 'css' || f.path.endsWith('.css'));
    const jsFiles = project.files.filter(
      (f) => (f.language === 'javascript' || f.path.endsWith('.js')) && !f.path.includes('.test.')
    );

    if (indexHtml) {
      let html = indexHtml.content;

      // Inject CSS if separate
      const cssInjections = cssFiles.map((c) => `<style>/* ${c.path} */\n${c.content}</style>`).join('\n');
      if (cssInjections && html.includes('</head>')) {
        html = html.replace('</head>', `${cssInjections}\n</head>`);
      } else if (cssInjections) {
        html = `${cssInjections}\n${html}`;
      }

      // Inject JS if separate
      const jsInjections = jsFiles.map((j) => `<script>/* ${j.path} */\n${j.content}</script>`).join('\n');
      if (jsInjections && html.includes('</body>')) {
        html = html.replace('</body>', `${jsInjections}\n</body>`);
      } else if (jsInjections) {
        html = `${html}\n${jsInjections}`;
      }

      // Capture iframe console into parent
      const consoleCatcher = `
        <script>
          (function() {
            const originalLog = console.log;
            const originalError = console.error;
            const originalWarn = console.warn;

            window.addEventListener('error', function(e) {
              window.parent.postMessage({ type: 'kiran_console', level: 'error', msg: e.message }, '*');
            });

            console.log = function(...args) {
              originalLog.apply(console, args);
              window.parent.postMessage({ type: 'kiran_console', level: 'log', msg: args.join(' ') }, '*');
            };
            console.error = function(...args) {
              originalError.apply(console, args);
              window.parent.postMessage({ type: 'kiran_console', level: 'error', msg: args.join(' ') }, '*');
            };
            console.warn = function(...args) {
              originalWarn.apply(console, args);
              window.parent.postMessage({ type: 'kiran_console', level: 'warn', msg: args.join(' ') }, '*');
            };
          })();
        </script>
      `;

      if (html.includes('<head>')) {
        html = html.replace('<head>', `<head>${consoleCatcher}`);
      } else {
        html = `${consoleCatcher}${html}`;
      }

      return html;
    }

    // Fallback preview when no index.html exists
    return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { background: #09090b; color: #a1a1aa; font-family: monospace; padding: 24px; }
    h2 { color: #c084fc; }
    pre { background: #121217; padding: 16px; border: 1px solid #272732; border-radius: 8px; color: #e4e4e7; }
  </style>
</head>
<body>
  <h2>Project Files Loaded (${project.files.length} files)</h2>
  <p>To view an interactive preview, ensure an <strong>index.html</strong> exists in this project.</p>
  <h3>Active file: ${activeFile?.path || 'None'}</h3>
  <pre>${(activeFile?.content || '').replace(/</g, '&lt;')}</pre>
</body>
</html>`;
  };

  // Listen for iframe console messages
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'kiran_console') {
        setConsoleLogs((prev) => [
          ...prev.slice(-40),
          {
            type: e.data.level || 'log',
            message: e.data.msg || '',
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const refreshPreview = () => {
    if (previewIframeRef.current) {
      previewIframeRef.current.srcdoc = generatePreviewHtml();
      setConsoleLogs((prev) => [
        ...prev,
        { type: 'log', message: 'Sandbox preview reloaded.', timestamp: new Date().toLocaleTimeString() },
      ]);
    }
  };

  const filteredFiles = project.files.filter((f) =>
    f.path.toLowerCase().includes(fileFilter.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] bg-[#09090b] overflow-hidden select-none">
      {/* Top Workspace Action Bar */}
      <div className="h-11 border-b border-[#272732] bg-[#0c0c10] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs text-zinc-200">{project.name}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950/70 border border-purple-800/50 text-purple-300 font-mono">
              {project.files.length} files
            </span>
          </div>
          <span className="text-zinc-600">|</span>
          <span className="text-[11px] text-zinc-400 font-mono truncate max-w-sm">
            {project.description}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreatingFile(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#181820] hover:bg-[#20202c] border border-[#272732] text-xs font-medium text-zinc-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-purple-400" />
            <span>New File</span>
          </button>
          <button
            onClick={onExportZip}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download ZIP</span>
          </button>
        </div>
      </div>

      {/* Main IDE Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: File Tree Explorer */}
        <div className="w-60 border-r border-[#272732] bg-[#0b0b0f] flex flex-col shrink-0">
          <div className="p-2 border-b border-[#272732] flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-zinc-500 font-semibold tracking-wider">
              EXPLORER
            </span>
            <button
              onClick={() => setIsCreatingFile(true)}
              title="Create new file"
              className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="p-2 border-b border-[#272732]">
            <input
              type="text"
              value={fileFilter}
              onChange={(e) => setFileFilter(e.target.value)}
              placeholder="Filter files..."
              className="w-full bg-[#121217] border border-[#272732] rounded px-2 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-600"
            />
          </div>

          {/* Workspace notification notice */}
          {workspaceNotice && (
            <div className="m-2 p-2 bg-pink-950/70 border border-pink-500/40 rounded text-[11px] text-pink-200 flex items-center justify-between">
              <span>{workspaceNotice}</span>
              <button onClick={() => setWorkspaceNotice(null)} className="text-pink-300 hover:text-white text-xs ml-1">✕</button>
            </div>
          )}

          {/* Inline file deletion confirmation */}
          {fileToDelete && (
            <div className="m-2 p-2 bg-red-950/80 border border-red-500/50 rounded text-[11px] text-red-200 space-y-1.5">
              <div className="font-medium truncate">¿Eliminar {fileToDelete.path}?</div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleConfirmDelete}
                  className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold"
                >
                  Eliminar
                </button>
                <button
                  onClick={() => setFileToDelete(null)}
                  className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-zinc-300 text-[10px]"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Inline new file input */}
          {isCreatingFile && (
            <form onSubmit={handleCreateFileSubmit} className="p-2 border-b border-purple-500/30 bg-purple-950/20">
              <div className="text-[10px] text-purple-300 font-mono mb-1">Nuevo archivo:</div>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  autoFocus
                  value={newFilePath}
                  onChange={(e) => setNewFilePath(e.target.value)}
                  placeholder="ej: src/utils.js"
                  className="flex-1 bg-[#121217] border border-purple-500/50 rounded px-1.5 py-0.5 text-xs text-zinc-200 font-mono focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-1.5 py-0.5 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs"
                >
                  ✓
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingFile(false);
                    setNewFilePath('');
                  }}
                  className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-zinc-300 text-xs"
                >
                  ✕
                </button>
              </div>
            </form>
          )}

          <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5 font-mono text-xs">
            {filteredFiles.map((file) => {
              const isSelected = file.id === activeFile?.id;
              return (
                <div
                  key={file.id}
                  onClick={() => handleSelectFile(file)}
                  className={`group flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-purple-900/30 text-purple-200 border-l-2 border-purple-500'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    {file.path.endsWith('.html') ? (
                      <FileCode className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    ) : file.path.endsWith('.css') ? (
                      <FileCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    ) : file.path.endsWith('.js') || file.path.endsWith('.ts') ? (
                      <FileCode className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : file.path.endsWith('.json') ? (
                      <FileJson className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    )}
                    <span className="truncate">{file.path}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTriggerDelete(file.id, file.path);
                    }}
                    title="Delete file"
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-rose-400 text-zinc-500"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center: Tabs & Code Editor */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#09090b]">
          {/* Tabs */}
          <div className="h-9 border-b border-[#272732] bg-[#0c0c10] flex items-center overflow-x-auto px-1 shrink-0">
            {openFileIds.map((fileId) => {
              const file = project.files.find((f) => f.id === fileId);
              if (!file) return null;
              const isActive = file.id === activeFile?.id;
              return (
                <div
                  key={file.id}
                  onClick={() => setActiveFileId(file.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 border-r border-[#272732] text-xs font-mono cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-[#09090b] text-purple-300 border-t-2 border-t-purple-500 font-semibold'
                      : 'bg-[#121217] text-zinc-400 hover:text-zinc-200 hover:bg-[#181820]'
                  }`}
                >
                  <span>{file.name}</span>
                  <button
                    onClick={(e) => handleCloseTab(file.id, e)}
                    className="p-0.5 rounded hover:bg-white/10 text-zinc-500 hover:text-zinc-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Active File Editor */}
          {activeFile ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 flex overflow-hidden">
                {/* Line numbers column */}
                <div className="w-12 bg-[#08080a] border-r border-[#1a1a24] select-none py-3 text-right pr-3 font-mono text-xs text-zinc-600 shrink-0 overflow-hidden">
                  {(activeFile.content || '').split('\n').map((_, idx) => (
                    <div key={idx} className="leading-6">
                      {idx + 1}
                    </div>
                  ))}
                </div>

                {/* Editor Content Textarea */}
                <textarea
                  value={activeFile.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  spellCheck={false}
                  className="flex-1 bg-[#09090b] text-zinc-200 font-mono text-xs leading-6 p-3 resize-none focus:outline-none focus:ring-0 selection:bg-purple-900/50"
                />
              </div>

              {/* Editor Bottom Status Bar */}
              <div className="h-6 border-t border-[#272732] bg-[#0c0c10] px-3 flex items-center justify-between text-[11px] font-mono text-zinc-500 shrink-0">
                <div className="flex items-center gap-3">
                  <span>Path: {activeFile.path}</span>
                  <span>Lines: {activeFile.content.split('\n').length}</span>
                  <span>Size: {(new Blob([activeFile.content]).size / 1024).toFixed(1)} KB</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Auto-saved
                  </span>
                  <span>UTF-8</span>
                  <span className="uppercase text-purple-400 font-semibold">{activeFile.language}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-500 text-xs font-mono">
              No files open. Select a file from the explorer on the left.
            </div>
          )}
        </div>

        {/* Right: Project Plan & AI Copilot for this Project */}
        <div className="w-72 border-l border-[#272732] bg-[#0c0c10] flex flex-col shrink-0">
          <div className="p-2.5 border-b border-[#272732] flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-zinc-400 font-semibold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              PROJECT ARCHITECTURE & PLAN
            </span>
          </div>

          {/* Plan Checklist */}
          <div className="p-3 border-b border-[#272732] space-y-2 overflow-y-auto max-h-56">
            {project.plan.map((step) => (
              <div key={step.id} className="text-xs">
                <div className="flex items-center gap-2">
                  {step.status === 'completed' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : step.status === 'in_progress' ? (
                    <Clock className="w-3.5 h-3.5 text-purple-400 animate-spin shrink-0" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-zinc-600 shrink-0" />
                  )}
                  <span
                    className={`font-medium ${
                      step.status === 'completed'
                        ? 'text-zinc-300'
                        : step.status === 'in_progress'
                        ? 'text-purple-300'
                        : 'text-zinc-500'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {step.details && (
                  <p className="text-[11px] text-zinc-500 ml-5 mt-0.5">{step.details}</p>
                )}
              </div>
            ))}
          </div>

          {/* KiranAI Assistant within Project */}
          <div className="flex-1 p-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-300 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Refactor or Extend with KiranIA</span>
              </div>
              <p className="text-[11px] text-zinc-400 mb-2">
                Instruye a KiranIA para que añada una función, corrija un bug o cree nuevos módulos para este proyecto.
              </p>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ej: Añade un gráfico de retención o crea autenticación..."
                rows={3}
                className="w-full bg-[#121217] border border-[#272732] rounded p-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-600 resize-none"
              />
            </div>
            <button
              onClick={() => {
                if (!aiPrompt.trim()) return;
                onAskKiranToEdit(aiPrompt, activeFile?.path);
                setAiPrompt('');
              }}
              disabled={isAiGenerating || !aiPrompt.trim()}
              className="w-full py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm mt-3"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Apply Instruction</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Collapsible Sandbox & Console Drawer */}
      <div
        style={{ height: `${bottomHeight}px` }}
        className="border-t border-[#272732] bg-[#0c0c10] flex flex-col shrink-0 transition-all"
      >
        {/* Drawer Header Controls */}
        <div className="h-9 border-b border-[#272732] px-4 flex items-center justify-between bg-[#0e0e14]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBottomTab('preview')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                bottomTab === 'preview'
                  ? 'bg-purple-950/70 border border-purple-800/60 text-purple-300'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Play className="w-3 h-3 text-purple-400" />
              <span>Live Web Sandbox</span>
            </button>
            <button
              onClick={() => setBottomTab('console')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                bottomTab === 'console'
                  ? 'bg-purple-950/70 border border-purple-800/60 text-purple-300'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Terminal className="w-3 h-3 text-emerald-400" />
              <span>Console Logs ({consoleLogs.length})</span>
            </button>
            <button
              onClick={() => setBottomTab('environment')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                bottomTab === 'environment'
                  ? 'bg-purple-950/70 border border-purple-800/60 text-purple-300'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <AlertCircle className="w-3 h-3 text-amber-400" />
              <span>Execution Environment</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {bottomTab === 'preview' && (
              <div className="flex items-center gap-1 bg-[#181820] p-0.5 rounded border border-[#272732]">
                <button
                  onClick={() => setPreviewViewport('desktop')}
                  className={`p-1 rounded text-xs ${
                    previewViewport === 'desktop' ? 'bg-purple-600 text-white' : 'text-zinc-400'
                  }`}
                  title="Desktop 100%"
                >
                  <Monitor className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setPreviewViewport('tablet')}
                  className={`p-1 rounded text-xs ${
                    previewViewport === 'tablet' ? 'bg-purple-600 text-white' : 'text-zinc-400'
                  }`}
                  title="Tablet 768px"
                >
                  <Tablet className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setPreviewViewport('mobile')}
                  className={`p-1 rounded text-xs ${
                    previewViewport === 'mobile' ? 'bg-purple-600 text-white' : 'text-zinc-400'
                  }`}
                  title="Mobile 375px"
                >
                  <Smartphone className="w-3 h-3" />
                </button>
              </div>
            )}
            <button
              onClick={refreshPreview}
              title="Refresh Live Sandbox"
              className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setBottomHeight(bottomHeight === 320 ? 460 : 320)}
              title="Toggle drawer height"
              className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-hidden bg-[#060608] relative">
          {bottomTab === 'preview' && (
            <div className="w-full h-full flex items-center justify-center p-2 bg-[#09090c]">
              <div
                style={{
                  width:
                    previewViewport === 'mobile'
                      ? '375px'
                      : previewViewport === 'tablet'
                      ? '768px'
                      : '100%',
                  height: '100%',
                }}
                className="transition-all bg-white rounded-md overflow-hidden shadow-2xl border border-[#272732]"
              >
                <iframe
                  ref={previewIframeRef}
                  title="KiranIA Project Sandbox"
                  srcDoc={generatePreviewHtml()}
                  sandbox="allow-scripts allow-modals"
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          )}

          {bottomTab === 'console' && (
            <div className="h-full overflow-y-auto p-3 font-mono text-xs text-zinc-300 space-y-1">
              {consoleLogs.map((log, lIdx) => (
                <div
                  key={lIdx}
                  className={`flex items-start gap-2 ${
                    log.type === 'error'
                      ? 'text-rose-400'
                      : log.type === 'warn'
                      ? 'text-amber-400'
                      : 'text-zinc-300'
                  }`}
                >
                  <span className="text-zinc-600">[{log.timestamp}]</span>
                  <span
                    className={`font-semibold uppercase text-[10px] px-1 rounded ${
                      log.type === 'error'
                        ? 'bg-rose-950/60 text-rose-300'
                        : log.type === 'warn'
                        ? 'bg-amber-950/60 text-amber-300'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {log.type}
                  </span>
                  <span className="break-all">{log.message}</span>
                </div>
              ))}
            </div>
          )}

          {bottomTab === 'environment' && (
            <div className="h-full p-4 font-mono text-xs text-zinc-300 overflow-y-auto space-y-3">
              <div className="p-3 rounded bg-[#121217] border border-[#272732]">
                <h4 className="font-semibold text-purple-300 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Client Browser DOM Sandbox: ACTIVE
                </h4>
                <p className="text-zinc-400 text-[11px]">
                  HTML5, CSS3, JavaScript ES2022, DOM APIs, Canvas, Web Audio, and Web Components execute in an isolated iframe with captured console pipes.
                </p>
              </div>

              <div className="p-3 rounded bg-[#121217] border border-amber-900/40">
                <h4 className="font-semibold text-amber-300 mb-1 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  Server / Linux Sandbox Container: EXTERNAL AGENT REQUIRED
                </h4>
                <p className="text-zinc-400 text-[11px]">
                  To execute raw Linux system calls, Python interpreters, Rust binaries, or Docker daemons, an external containerized agent with isolated memory and network limits is required.
                </p>
                <div className="mt-2 text-[10px] text-zinc-500">
                  Integration Endpoint: <code>POST /api/sandbox/execute</code> (Requires Docker Daemon or gVisor sandbox cluster).
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
