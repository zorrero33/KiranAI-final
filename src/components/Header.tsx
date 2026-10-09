import React from 'react';
import { ViewMode, ModelOption, Project, UserAccount } from '../types';
import { Button } from '@/components/ui/button';
import { KiranLogo } from './KiranLogo';
import {
  Cpu,
  Terminal,
  Code2,
  Target,
  Download,
  Layers,
  Globe,
  ChevronDown,
  FolderGit2,
  Sparkles,
  Sun,
  Moon,
  GitCompare,
  Bookmark,
  CreditCard,
  Search,
  User,
  Smartphone,
  Image as ImageIcon,
  FileText,
  Menu,
  X,
} from 'lucide-react';

interface HeaderProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  activeProject: Project | null;
  selectedModel: string;
  onModelSelect: (modelId: string) => void;
  onExportZip: () => void;
  onOpenNewProjectModal: () => void;
  webSearchActive: boolean;
  onToggleWebSearch: () => void;
  hasApiKey: boolean;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenCatalog?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenAuthModal?: () => void;
  currentUser?: UserAccount;
  models?: ModelOption[];
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  activeProject,
  selectedModel,
  onModelSelect,
  onExportZip,
  onOpenNewProjectModal,
  webSearchActive,
  onToggleWebSearch,
  isDark,
  onToggleTheme,
  onOpenCatalog,
  onOpenCommandPalette,
  onOpenAuthModal,
  currentUser,
  models = [],
  onToggleMobileMenu,
  isMobileMenuOpen = false,
}) => {
  const [modelDropdownOpen, setModelDropdownOpen] = React.useState(false);

  const availableList = models.length > 0 ? models : [
    { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', shortName: 'Gemini Flash', tier: 'Google', isPaid: false, capabilities: ['Fast'] },
    { id: 'openai-main', name: 'GPT-4o (OpenAI)', shortName: 'GPT-4o', tier: 'OpenAI', isPaid: true, capabilities: ['Coding'] },
    { id: 'claude-main', name: 'Claude 3.5 Sonnet', shortName: 'Claude Sonnet', tier: 'Anthropic', isPaid: true, capabilities: ['Architecture'] },
    { id: 'deepseek-main', name: 'DeepSeek Chat (V3)', shortName: 'DeepSeek', tier: 'DeepSeek', isPaid: true, capabilities: ['Logic'] },
  ];

  const currentModelObj = availableList.find((m) => m.id === selectedModel) || availableList[0];

  return (
    <header className="h-14 border-b border-[#272732] bg-[#0c0c10]/95 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between sticky top-0 z-40 select-none shadow-md">
      {/* Brand & Identity + Mobile Menu Toggle */}
      <div className="flex items-center gap-2 sm:gap-4">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white bg-[#14141e] border border-[#272734] cursor-pointer"
            aria-label="Abrir Menú"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4 text-purple-400" /> : <Menu className="w-4 h-4" />}
          </button>
        )}

        <div
          onClick={() => onViewChange('home')}
          className="flex items-center cursor-pointer group"
        >
          <KiranLogo size="sm" withText />
        </div>

        {/* View Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#121217] p-1 rounded-xl border border-[#272732]">
          <button
            onClick={() => onViewChange('home')}
            aria-current={currentView === 'home' ? 'page' : undefined}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              currentView === 'home'
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Inicio</span>
          </button>
          <button
            onClick={() => onViewChange('chat')}
            aria-current={currentView === 'chat' ? 'page' : undefined}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              currentView === 'chat'
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Chat</span>
          </button>
          <button
            onClick={() => onViewChange('code')}
            aria-current={currentView === 'code' ? 'page' : undefined}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              currentView === 'code'
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-purple-400" />
            <span>CODE</span>
            {activeProject && (
              <span className="ml-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
          <button
            onClick={() => onViewChange('apk')}
            aria-current={currentView === 'apk' ? 'page' : undefined}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              currentView === 'apk'
                ? 'bg-cyan-600/25 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-cyan-400/80 hover:text-cyan-300 hover:bg-cyan-500/10'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            <span>App APK</span>
            <span className="text-[9px] px-1 rounded bg-cyan-900/60 text-cyan-300 font-mono font-bold">Móvil</span>
          </button>
          <button
            onClick={() => onViewChange('vision')}
            aria-current={currentView === 'vision' ? 'page' : undefined}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              currentView === 'vision'
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
            <span>Visión</span>
          </button>
          <button
            onClick={() => onViewChange('documents')}
            aria-current={currentView === 'documents' ? 'page' : undefined}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              currentView === 'documents'
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-fuchsia-400" />
            <span>Docs</span>
          </button>
          <button
            onClick={() => onViewChange('models')}
            aria-current={currentView === 'models' ? 'page' : undefined}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              currentView === 'models'
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span>Modelos</span>
          </button>
          <button
            onClick={() => onViewChange('compare')}
            aria-current={currentView === 'compare' ? 'page' : undefined}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              currentView === 'compare'
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5 text-fuchsia-400" />
            <span>Arena</span>
          </button>
          <button
            onClick={() => onViewChange('solve')}
            aria-current={currentView === 'solve' ? 'page' : undefined}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              currentView === 'solve'
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-fuchsia-400" />
            <span>SOLVE</span>
          </button>
          <button
            onClick={() => onViewChange('deploy')}
            aria-current={currentView === 'deploy' ? 'page' : undefined}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              currentView === 'deploy'
                ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/50 shadow-sm'
                : 'text-zinc-400 hover:text-cyan-300 hover:bg-cyan-500/10'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden xl:inline">kiranai.pages.dev</span>
            <span className="xl:hidden">Deploy</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-500/20 text-emerald-300 font-mono font-bold">
              GRATIS
            </span>
          </button>
          <button
            onClick={() => onViewChange('billing')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              currentView === 'billing'
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
            <span>Planes</span>
          </button>
        </nav>
      </div>

      {/* Right Controls: Command Palette, Web Grounding, Model Switcher, Project & Profile */}
      <div className="flex items-center gap-2">
        {/* Command Palette Button */}
        {onOpenCommandPalette && (
          <button
            onClick={onOpenCommandPalette}
            title="Abrir Command Palette (Ctrl+K)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#14141c] hover:bg-[#1a1a24] border border-[#272732] text-xs font-mono text-zinc-400 hover:text-white transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Buscar</span>
            <span className="text-[10px] px-1 rounded bg-zinc-800 text-zinc-500">⌘K</span>
          </button>
        )}

        {/* Dark/Light Theme Switcher */}
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleTheme}
          aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          title={isDark ? 'Modo Claro' : 'Modo Oscuro'}
          className="h-8 px-2.5 bg-[#121217] border-[#272732] hover:bg-[#181820] text-zinc-300"
        >
          {isDark ? (
            <Sun className="h-3.5 w-3.5 text-amber-400" />
          ) : (
            <Moon className="h-3.5 w-3.5 text-purple-400" />
          )}
        </Button>

        {/* Web Search Grounding Toggle */}
        <button
          onClick={onToggleWebSearch}
          aria-pressed={webSearchActive}
          aria-label="Activar o desactivar la búsqueda web"
          title={webSearchActive ? 'Búsqueda Web Grounding Activa' : 'Activar Búsqueda Web'}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all border ${
            webSearchActive
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
              : 'bg-[#121217] border-[#272732] text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Globe className={`w-3.5 h-3.5 ${webSearchActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
          <span className="hidden xl:inline">Web Grounding</span>
          <span className={`w-1.5 h-1.5 rounded-full ${webSearchActive ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
        </button>

        {/* Model Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
            aria-haspopup="listbox"
            aria-expanded={modelDropdownOpen}
            aria-label={`Seleccionar modelo. Actual: ${currentModelObj.name}`}
            className="flex items-center gap-2 bg-[#121217] hover:bg-[#181820] border border-[#272732] hover:border-purple-600/50 px-2.5 py-1.5 rounded-lg text-xs font-mono text-zinc-200 transition-colors shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="max-w-[110px] truncate">{currentModelObj.shortName}</span>
            <ChevronDown className="w-3 h-3 text-zinc-500" />
          </button>

          {modelDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-[#0e0e14] border border-[#272732] rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="text-[11px] font-mono text-zinc-400 px-2 py-1.5 uppercase tracking-wider border-b border-[#22222d] mb-1 flex items-center justify-between">
                <span>Model Router & Failover</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300">LiteLLM</span>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {availableList.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => {
                      onModelSelect(m.id);
                      setModelDropdownOpen(false);
                    }}
                    className={`p-2 rounded-lg cursor-pointer transition-colors ${
                      selectedModel === m.id
                        ? 'bg-purple-950/70 border border-purple-700/60 text-white'
                        : 'hover:bg-white/5 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span>{m.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                        {m.tier}
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">
                      {m.capabilities.slice(0, 2).join(' • ')}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-[#22222d] mt-2">
                <button
                  onClick={() => {
                    setModelDropdownOpen(false);
                    if (onOpenCatalog) onOpenCatalog();
                    else onViewChange('models');
                  }}
                  className="w-full py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Explorar Catálogo de Modelos</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Active Project & ZIP Action */}
        {activeProject ? (
          <div className="flex items-center gap-1.5 bg-[#121217] border border-purple-900/40 rounded-lg p-1 pr-1.5">
            <button
              onClick={() => onViewChange('code')}
              title="Abrir en CODE Workspace"
              className="flex items-center gap-1.5 px-2 py-1 text-xs text-purple-300 hover:text-white transition-colors"
            >
              <FolderGit2 className="w-3.5 h-3.5 text-purple-400" />
              <span className="max-w-[100px] truncate font-mono text-[11px]">
                {activeProject.name}
              </span>
            </button>
            <button
              onClick={onExportZip}
              aria-label="Descargar paquete ZIP con todos los archivos del proyecto"
              title="Descargar paquete ZIP con todos los archivos"
              className="flex items-center gap-1 bg-purple-600 hover:bg-purple-500 text-white px-2 py-1 rounded text-xs font-medium transition-colors shadow-sm"
            >
              <Download className="w-3 h-3" />
              <span className="hidden sm:inline">ZIP</span>
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenNewProjectModal}
            className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-sm"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nuevo Proyecto</span>
          </button>
        )}

        {/* User Account / Profile Button */}
        {onOpenAuthModal && (
          <button
            onClick={onOpenAuthModal}
            aria-label="Abrir cuenta de usuario y preferencias"
            title="Cuenta de usuario y preferencias"
            className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm hover:scale-105 transition-transform"
          >
            {currentUser?.name?.charAt(0) || 'A'}
          </button>
        )}
      </div>
    </header>
  );
};
