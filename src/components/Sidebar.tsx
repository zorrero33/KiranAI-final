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
  Activity,
  Trash2,
  Layers,
  Component,
  Cpu,
  GitCompare,
  Bookmark,
  CreditCard,
  Server,
  Settings,
  Search,
  User,
  Sparkles,
  Smartphone,
  Image as ImageIcon,
  FileText,
  Cloud,
  Globe,
  X,
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
    <aside className="w-64 border-r border-[#272732] bg-[#0c0c10] flex flex-col justify-between h-full shrink-0 select-none overflow-y-auto">
      <div className="p-3 space-y-4">
        {/* Mobile Header with Close Button (if in mobile drawer) */}
        {onCloseMobile && (
          <div className="flex items-center justify-between pb-2 border-b border-[#232332] md:hidden">
            <KiranLogo size="xs" withText />
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Quick Command Palette Button */}
        {onOpenCommandPalette && (
          <button
            onClick={() => {
              onOpenCommandPalette();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#14141c] hover:bg-[#1a1a24] border border-[#272732] text-xs font-mono text-zinc-400 hover:text-white transition-all shadow-sm group"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
              <span>Buscar o comando...</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
              ⌘K
            </span>
          </button>
        )}

        {/* Workspace OS Section */}
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-purple-400/80 px-2 mb-1.5 font-semibold">
            WORKSPACE OS
          </div>
          <div className="space-y-0.5">
            <button
              onClick={() => handleNavClick('home')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentView === 'home'
                  ? 'bg-purple-950/70 text-purple-200 border border-purple-800/60 font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>Página de Inicio</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-600">⌘0</span>
            </button>

            <button
              onClick={() => handleNavClick('chat')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentView === 'chat'
                  ? 'bg-purple-950/70 text-purple-200 border border-purple-800/60 font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Terminal className="w-4 h-4 text-purple-400" />
                <span>KiranIA Assistant</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-600">⌘1</span>
            </button>

            <button
              onClick={() => handleNavClick('apk')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentView === 'apk'
                  ? 'bg-cyan-950/70 text-cyan-200 border border-cyan-800/60 font-semibold shadow-sm'
                  : 'text-cyan-400/90 hover:text-cyan-200 hover:bg-cyan-500/10'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                <span>App APK & Móvil</span>
              </div>
              <span className="text-[10px] font-mono px-1 rounded bg-cyan-900/70 text-cyan-300 font-bold">
                APK
              </span>
            </button>

            <button
              onClick={() => handleNavClick('deploy')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentView === 'deploy'
                  ? 'bg-cyan-950/70 text-cyan-200 border border-cyan-800/60 font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-cyan-300 hover:bg-cyan-500/10'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Cloud className="w-4 h-4 text-cyan-400" />
                <span>Google Cloud Run</span>
              </div>
              <span className="text-[10px] font-mono px-1 rounded bg-emerald-950/80 text-emerald-400 font-bold border border-emerald-500/30">
                EN VIVO
              </span>
            </button>

            <button
              onClick={() => handleNavClick('vision')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentView === 'vision'
                  ? 'bg-purple-950/70 text-purple-200 border border-purple-800/60 font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ImageIcon className="w-4 h-4 text-purple-400" />
                <span>Visión & Imágenes</span>
              </div>
              <span className="text-[10px] font-mono text-purple-400">IA</span>
            </button>

            <button
              onClick={() => handleNavClick('documents')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentView === 'documents'
                  ? 'bg-purple-950/70 text-purple-200 border border-purple-800/60 font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-fuchsia-400" />
                <span>Analizador Docs</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-600">MD</span>
            </button>

            <button
              onClick={() => handleNavClick('models')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentView === 'models'
                  ? 'bg-purple-950/70 text-purple-200 border border-purple-800/60 font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Cpu className="w-4 h-4 text-purple-400" />
                <span>Modelos & Discovery</span>
              </div>
              <span className="text-[10px] font-mono px-1 rounded bg-purple-900/60 text-purple-300 font-bold">
                PRO
              </span>
            </button>

            <button
              onClick={() => handleNavClick('compare')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentView === 'compare'
                  ? 'bg-purple-950/70 text-purple-200 border border-purple-800/60 font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <GitCompare className="w-4 h-4 text-fuchsia-400" />
                <span>Model Arena (Compare)</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-600">VS</span>
            </button>

            <button
              onClick={() => handleNavClick('code')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentView === 'code'
                  ? 'bg-purple-950/70 text-purple-200 border border-purple-800/60 font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Code2 className="w-4 h-4 text-purple-400" />
                <span>KiranIA CODE</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-600">⌘2</span>
            </button>

            <button
              onClick={() => handleNavClick('solve')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentView === 'solve'
                  ? 'bg-purple-950/70 text-purple-200 border border-purple-800/60 font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Target className="w-4 h-4 text-fuchsia-400" />
                <span>Diagnóstico SOLVE</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-600">⌘3</span>
            </button>

            <button
              onClick={() => handleNavClick('prompts')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentView === 'prompts'
                  ? 'bg-purple-950/70 text-purple-200 border border-purple-800/60 font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Bookmark className="w-4 h-4 text-purple-400" />
                <span>Biblioteca de Prompts</span>
              </div>
            </button>
          </div>
        </div>

        {/* Platform & Governance Section */}
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 px-2 mb-1.5 font-semibold">
            PLATAFORMA & GESTIÓN
          </div>
          <div className="space-y-0.5">
            <button
              onClick={() => onViewChange('billing')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentView === 'billing'
                  ? 'bg-purple-950/70 text-purple-200 border border-purple-800/60 font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>Planes & Facturación</span>
              </div>
            </button>

            <button
              onClick={() => onViewChange('admin')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentView === 'admin'
                  ? 'bg-purple-950/70 text-purple-200 border border-purple-800/60 font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Server className="w-4 h-4 text-indigo-400" />
                <span>Panel de Admin</span>
              </div>
              <span className="text-[10px] font-mono px-1 rounded bg-indigo-950 text-indigo-300">
                ROOT
              </span>
            </button>

            <button
              onClick={() => onViewChange('settings')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentView === 'settings'
                  ? 'bg-purple-950/70 text-purple-200 border border-purple-800/60 font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4 text-zinc-400" />
                <span>Configuración</span>
              </div>
            </button>

            <button
              onClick={() => onViewChange('tools')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentView === 'tools'
                  ? 'bg-purple-950/70 text-purple-200 border border-purple-800/60 font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Wrench className="w-4 h-4 text-zinc-400" />
              <span>Tools & Conectores</span>
            </button>

            <button
              onClick={() => onViewChange('permissions')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentView === 'permissions'
                  ? 'bg-purple-950/70 text-purple-200 border border-purple-800/60 font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Permisos & Control</span>
            </button>

            <button
              onClick={() => onViewChange('memory')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentView === 'memory'
                  ? 'bg-purple-950/70 text-purple-200 border border-purple-800/60 font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Brain className="w-4 h-4 text-indigo-400" />
              <span>Memoria Persistente</span>
            </button>

            <button
              onClick={() => onViewChange('automations')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentView === 'automations'
                  ? 'bg-purple-950/70 text-purple-200 border border-purple-800/60 font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <CalendarClock className="w-4 h-4 text-amber-400" />
              <span>Automatizaciones</span>
            </button>

            <button
              onClick={() => onViewChange('components')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentView === 'components'
                  ? 'bg-purple-950/70 text-purple-200 border border-purple-800/60 font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Component className="w-4 h-4 text-cyan-400" />
              <span>UI Components</span>
            </button>
          </div>
        </div>

        {/* Projects Section */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
              PROYECTOS ({projects.length})
            </span>
            <button
              onClick={onNewProject}
              title="Crear Proyecto"
              className="p-1 rounded hover:bg-white/10 text-purple-400 hover:text-purple-300 transition-colors"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-0.5 max-h-36 overflow-y-auto">
            {projects.map((proj) => {
              const isSelected = activeProject?.id === proj.id;
              return (
                <div
                  key={proj.id}
                  className={`group flex items-center justify-between px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-purple-900/40 text-purple-200 border border-purple-700/50'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                  }`}
                  onClick={() => {
                    onSelectProject(proj);
                    onViewChange('code');
                  }}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Folder className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-purple-400' : 'text-zinc-500'}`} />
                    <span className="truncate">{proj.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {confirmDeleteProjectId === proj.id ? (
                      <div className="flex items-center gap-1 bg-red-950/80 px-1 py-0.5 rounded text-[10px]" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            onDeleteProject(proj.id);
                            setConfirmDeleteProjectId(null);
                          }}
                          className="text-red-300 hover:text-white font-bold px-1"
                        >
                          Sí
                        </button>
                        <button
                          onClick={() => setConfirmDeleteProjectId(null)}
                          className="text-zinc-400 hover:text-white px-1"
                        >
                          No
                        </button>
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

      {/* User Account / Session Footer Card */}
      <div className="p-3 border-t border-[#272732] bg-[#08080a] space-y-2">
        <div
          onClick={onOpenAuthModal}
          className="p-2.5 rounded-xl bg-[#121217] hover:bg-[#181822] border border-[#272732] flex items-center justify-between cursor-pointer transition-colors group"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
              {currentUser?.name?.charAt(0) || 'A'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate group-hover:text-purple-300 transition-colors">
                {currentUser?.name || 'Arquitecto Principal'}
              </div>
              <div className="text-[10px] font-mono text-zinc-500 truncate">
                {currentUser?.email || 'admin@kirania.internal'}
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-semibold uppercase">
            {currentUser?.currentPlan || 'PRO'}
          </span>
        </div>
      </div>
    </aside>
  );
};
