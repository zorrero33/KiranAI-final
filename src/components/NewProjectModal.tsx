import React, { useState } from 'react';
import { Project } from '../types';
import { X, Layers, Sparkles, FolderPlus } from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (project: Project) => void;
  onGenerateWithAi: (prompt: string, projectType: string) => void;
  isGenerating?: boolean;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onCreateProject,
  onGenerateWithAi,
  isGenerating,
}) => {
  const [tab, setTab] = useState<'ai' | 'blank'>('ai');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [projectType, setProjectType] = useState<'web-app' | 'react' | 'api' | 'cli'>('web-app');
  const [promptText, setPromptText] = useState('');

  if (!isOpen) return null;

  const handleCreateBlank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newProject: Project = {
      id: `proj_${Date.now()}`,
      name: name.trim(),
      description: description.trim() || 'Custom project in KiranIA OS',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      type: projectType,
      plan: [
        { id: 'step_init', title: 'Project Initialization', status: 'completed', details: 'Empty workspace ready for development' },
      ],
      files: [
        {
          id: `f_idx_${Date.now()}`,
          path: 'index.html',
          name: 'index.html',
          language: 'html',
          updatedAt: Date.now(),
          content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${name}</title>
  <style>
    body { background: #09090b; color: #fff; font-family: sans-serif; padding: 32px; }
    h1 { color: #c084fc; }
  </style>
</head>
<body>
  <h1>${name}</h1>
  <p>Ready to build with KiranIA.</p>
</body>
</html>`,
        },
      ],
    };

    onCreateProject(newProject);
    onClose();
  };

  const handleGenerateScaffold = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim()) return;
    onGenerateWithAi(promptText.trim(), projectType);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#0e0e14] border border-[#272732] rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#272732]">
          <div className="flex items-center gap-2">
            <FolderPlus className="w-4 h-4 text-purple-400" />
            <h3 className="font-bold text-sm text-white">Create New Project in KiranIA</h3>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-[#272732] bg-[#09090b]">
          <button
            onClick={() => setTab('ai')}
            className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              tab === 'ai'
                ? 'border-b-2 border-purple-500 text-purple-300 bg-purple-950/20'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Generate with KiranIA Architect</span>
          </button>
          <button
            onClick={() => setTab('blank')}
            className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              tab === 'blank'
                ? 'border-b-2 border-purple-500 text-purple-300 bg-purple-950/20'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Blank Workspace</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {tab === 'ai' ? (
            <form onSubmit={handleGenerateScaffold} className="space-y-4">
              <div>
                <label className="text-xs font-mono uppercase text-zinc-400 font-semibold block mb-1.5">
                  WHAT DO YOU WANT TO BUILD?
                </label>
                <textarea
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="Ej: Un gestor de gimnasio con clases, clientes, pagos y gráficos de asistencia en modo oscuro..."
                  rows={3}
                  className="w-full bg-[#121217] border border-[#272732] rounded-lg p-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-600 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-mono uppercase text-zinc-400 font-semibold block mb-1.5">
                  ARCHITECTURE TARGET
                </label>
                <select
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value as any)}
                  className="w-full bg-[#121217] border border-[#272732] rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-purple-600 font-mono"
                >
                  <option value="web-app">Single Page Web App (Immediate Sandbox Live Preview)</option>
                  <option value="react">Modern Component Web Suite</option>
                  <option value="api">Backend REST / CRUD API Architecture</option>
                  <option value="cli">CLI Automation Tool</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!promptText.trim() || isGenerating}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-semibold shadow-md transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Scaffold Full Project</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleCreateBlank} className="space-y-4">
              <div>
                <label className="text-xs font-mono uppercase text-zinc-400 font-semibold block mb-1.5">
                  PROJECT NAME
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My New App"
                  className="w-full bg-[#121217] border border-[#272732] rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="text-xs font-mono uppercase text-zinc-400 font-semibold block mb-1.5">
                  DESCRIPTION (OPTIONAL)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short purpose of this project..."
                  className="w-full bg-[#121217] border border-[#272732] rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-semibold shadow-md transition-colors"
                >
                  Create Empty Project
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
