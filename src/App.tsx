import React, { useState } from 'react';
import { ViewMode, Project, UserAccount } from '../types';
import {
  Terminal,
  Code2,
  Target,
  Wrench,
  ShieldCheck,
  Brain,
  CalendarClock,
  FolderPlus,
  Folder,
  Layers,
  Component,
  Cpu,
  GitCompare,
  Bookmark,
  CreditCard,
  Server,
  Settings,
  Search,
  Sparkles,
  Smartphone,
  Image as ImageIcon,
  FileText,
  Cloud,
  Globe,
  X,
  Trash2,
} from 'lucide-react';
import { KiranLogo } from './KiranLogo';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  projects: Project[];
  activeProject: Project | null;
  onSelectProject: (project: Project) => void;
  onNewProject: () => void;
  onDeleteProject: (projectId: string) => void;
  hasApiKey: boolean;
  onOpenCommandPalette?: () => void;
  onOpenAuthModal?: () => void;
  currentUser?: UserAccount;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onViewChange,
  projects,
  activeProject,
  onSelectProject,
  onNewProject,
  onDeleteProject,
  hasApiKey,
  onOpenCommandPalette,
  onOpenAuthModal,
  currentUser,
  onCloseMobile,
}) => {
  const [confirmDeleteProjectId, setConfirmDeleteProjectId] = useState<string | null>(null);

  const handleNavClick = (view: ViewMode) => {
    onViewChange(view);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <aside className="w-64 border-r border-white/10 bg-[#0b0b12]/85 backdrop-blur-xl flex flex-col justify-between h-full shrink-0 select-none overflow-y-auto shadow-[10px_0_30px_rgba(0,0,0,0.18)]">
      <div className="p-3 space-y-4">
        {onCloseMobile && (
          <div className="flex items-center justify-between pb-2 border-b border-white/10 md:hidden">
            <KiranLogo size="xs" withText />
            <button onClick={onCloseMobile} className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {onOpenCommandPalette && (
          <button
            onClick={() => {
              onOpenCommandPalette();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-zinc-300 hover:text-white transition-all"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-violet-300" />
              <span>Buscar o comando...</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">⌘K</span>
          </button>
        )}

        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-violet-300/90 px-2 mb-1.5 font-semibold">
            Workspace OS
          </div>
          <div className="space-y-1">
            {[
              ['home', 'Página de Inicio', <Layers className="w-4 h-4" />, '⌘0'],
              ['chat', 'KiranIA Assistant', <Terminal className="w-4 h-4" />, '⌘1'],
              ['apk', 'App APK & Móvil', <Smartphone className="w-4 h-4" />, 'APK'],
              ['vision', 'Visión & Imágenes', <ImageIcon className="w-4 h-4" />, 'IA'],
              ['documents', 'Analizador Docs', <FileText className="w-4 h-4" />, 'MD'],
              ['models', 'Modelos & Discovery', <Cpu className="w-4 h-4" />, 'PRO'],
              ['compare', 'Model Arena', <GitCompare className="w-4 h-4" />, 'VS'],
              ['code', 'KiranIA CODE', <Code2 className="w-4 h-4" />, '⌘2'],
              ['solve', 'Diagnóstico SOLVE', <Target className="w-4 h-4" />, '⌘3'],
              ['prompts', 'Biblioteca de Prompts', <Bookmark className="w-4 h-4" />, '']
            ].map(([view, label, icon, tag]) => {
              const isActive = currentView === view;
              return (
                <button
                  key={view}
                  onClick={() => handleNavClick(view as ViewMode)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-violet-500/20 to-cyan-500/10 text-white border border-violet-400/30 shadow-[0_0_18px_rgba(124,58,237,.15)]'
                      : 'text-zinc-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={isActive ? 'text-cyan-300' : 'text-zinc-400'}>{icon}</span>
                    <span>{label}</span>
                  </div>
                  {tag && (
                    <span className={`text-[10px] font-mono ${tag === 'PRO' ? 'px-1 rounded bg-violet-500/20 text-violet-200' : 'text-zinc-500'}`}>
                      {tag}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 px-2 mb-1.5 font-semibold">
            Plataforma & Gestión
          </div>
          <div className="space-y-1">
            {[
              ['billing', 'Planes & Facturación', <CreditCard className="w-4 h-4" />, ''],
              ['admin', 'Panel de Admin', <Server className="w-4 h-4" />, 'ROOT'],
              ['settings', 'Configuración', <Settings className="w-4 h-4" />, ''],
              ['tools', 'Tools & Conectores', <Wrench className="w-4 h-4" />, ''],
              ['permissions', 'Permisos & Control', <ShieldCheck className="w-4 h-4" />, ''],
              ['memory', 'Memoria Persistente', <Brain className="w-4 h-4" />, ''],
              ['automations', 'Automatizaciones', <CalendarClock className="w-4 h-4" />, ''],
              ['components', 'UI Components', <Component className="w-4 h-4" />, ''],
            ].map(([view, label, icon, tag]) => (
              <button
                key={view}
                onClick={() => onViewChange(view as ViewMode)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  currentView === view
                    ? 'bg-gradient-to-r from-violet-500/20 to-cyan-500/10 text-white border border-violet-400/30'
                    : 'text-zinc-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={currentView === view ? 'text-cyan-300' : 'text-zinc-400'}>{icon}</span>
                  <span>{label}</span>
                </div>
                {tag && <span className="text-[10px] font-mono px-1 rounded bg-violet-500/20 text-violet-200">{tag}</span>}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between px-2 mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
              Proyectos ({projects.length})
            </span>
            <button
              onClick={onNewProject}
              title="Crear Proyecto"
              className="p-1 rounded hover:bg-white/10 text-violet-300 hover:text-violet-200 transition-colors"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-1 max-h-36 overflow-y-auto">
            {projects.map((proj) => {
              const isSelected = activeProject?.id === proj.id;
              return (
                <div
                  key={proj.id}
                  className={`group flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-violet-500/15 border border-violet-400/30 text-white'
                      : 'text-zinc-300 hover:text-zinc-100 hover:bg-white/5'
                  }`}
                  onClick={() => {
                    onSelectProject(proj);
                    onViewChange('code');
                  }}
                >
                  <div className="flex items-center gap-2 truncate min-w-0">
                    <Folder className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-violet-300' : 'text-zinc-500'}`} />
                    <span className="truncate">{proj.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {confirmDeleteProjectId === proj.id ? (
                      <div className="flex items-center gap-1 bg-red-950/80 px-1 py-0.5 rounded text-[10px]" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => { onDeleteProject(proj.id); setConfirmDeleteProjectId(null); }} className="text-red-300 hover:text-white font-bold px-1">Sí</button>
                        <button onClick={() => setConfirmDeleteProjectId(null)} className="text-zinc-400 hover:text-white px-1">No</button>
                      </div>
                    ) : (
                      projects.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteProjectId(proj.id);
                          }}
                          title="Eliminar proyecto"
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-500 hover:text-rose-400 rounded transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="p-3 border-t border-white/10 bg-[#09090e]/80">
        <div
          onClick={onOpenAuthModal}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between cursor-pointer transition-colors group"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
              {currentUser?.name?.charAt(0) || 'A'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate group-hover:text-violet-200 transition-colors">
                {currentUser?.name || 'Arquitecto Principal'}
              </div>
              <div className="text-[10px] font-mono text-zinc-500 truncate">
                {currentUser?.email || 'admin@kirania.internal'}
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-200 border border-violet-400/20 font-semibold uppercase">
            {currentUser?.currentPlan || 'PRO'}
          </span>
        </div>
      </div>
    </aside>
  );
};

