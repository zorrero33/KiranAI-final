import React, { useState, useEffect } from 'react';
import { ViewMode, ModelOption, Project } from '../types';
import {
  Search,
  Terminal,
  Code2,
  Cpu,
  GitCompare,
  Bookmark,
  CreditCard,
  Server,
  Settings,
  Target,
  Wrench,
  Download,
  Plus,
  Sparkles,
  ArrowRight,
  Layers,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onViewChange: (view: ViewMode) => void;
  models: ModelOption[];
  onSelectModel: (modelId: string) => void;
  activeProject: Project | null;
  onExportZip: () => void;
  onOpenNewProject: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onViewChange,
  models,
  onSelectModel,
  activeProject,
  onExportZip,
  onOpenNewProject,
}) => {
  const [query, setQuery] = useState('');

  // Handle Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    {
      id: 'act_new_project',
      title: 'Crear Nuevo Proyecto en KiranIA',
      category: 'Acción Rápida',
      icon: Plus,
      run: () => {
        onClose();
        onOpenNewProject();
      },
    },
    {
      id: 'act_export_zip',
      title: 'Descargar Proyecto Activo en ZIP Real',
      category: 'Acción Rápida',
      icon: Download,
      run: () => {
        onClose();
        onExportZip();
      },
    },
    {
      id: 'nav_apk',
      title: 'Abrir Centro Móvil & Descargar APK Android',
      category: 'Móvil & APK',
      icon: Sparkles,
      run: () => {
        onViewChange('apk');
        onClose();
      },
    },
    {
      id: 'nav_vision',
      title: 'Abrir Visión Artificial & Generador Visual',
      category: 'Multimodal',
      icon: Sparkles,
      run: () => {
        onViewChange('vision');
        onClose();
      },
    },
    {
      id: 'nav_documents',
      title: 'Abrir Analizador de Documentos & Base de Conocimiento',
      category: 'Documentos',
      icon: Bookmark,
      run: () => {
        onViewChange('documents');
        onClose();
      },
    },
    {
      id: 'nav_chat',
      title: 'Ir a KiranIA Assistant (Chat & Audio)',
      category: 'Navegación',
      icon: Terminal,
      run: () => {
        onViewChange('chat');
        onClose();
      },
    },
    {
      id: 'nav_models',
      title: 'Abrir Catálogo de Modelos & Discovery',
      category: 'Navegación',
      icon: Cpu,
      run: () => {
        onViewChange('models');
        onClose();
      },
    },
    {
      id: 'nav_compare',
      title: 'Abrir Model Arena (Comparativa Concurrente)',
      category: 'Navegación',
      icon: GitCompare,
      run: () => {
        onViewChange('compare');
        onClose();
      },
    },
    {
      id: 'nav_code',
      title: 'Abrir Workspace de Código (IDE & Sandbox)',
      category: 'Navegación',
      icon: Code2,
      run: () => {
        onViewChange('code');
        onClose();
      },
    },
    {
      id: 'nav_solve',
      title: 'Motor de Diagnóstico e Hipótesis (SOLVE)',
      category: 'Navegación',
      icon: Target,
      run: () => {
        onViewChange('solve');
        onClose();
      },
    },
    {
      id: 'nav_prompts',
      title: 'Biblioteca de Prompts & Plantillas de Ingeniería',
      category: 'Navegación',
      icon: Bookmark,
      run: () => {
        onViewChange('prompts');
        onClose();
      },
    },
    {
      id: 'nav_billing',
      title: 'Planes, Facturación y Control de Cuota',
      category: 'Navegación',
      icon: CreditCard,
      run: () => {
        onViewChange('billing');
        onClose();
      },
    },
    {
      id: 'nav_admin',
      title: 'Panel de Administración & Telemetría',
      category: 'Navegación',
      icon: Server,
      run: () => {
        onViewChange('admin');
        onClose();
      },
    },
    {
      id: 'nav_settings',
      title: 'Configuración del Sistema & Preferencias',
      category: 'Navegación',
      icon: Settings,
      run: () => {
        onViewChange('settings');
        onClose();
      },
    },
  ];

  // Add models as switch options
  const modelActions = models.map((m) => ({
    id: `model_${m.id}`,
    title: `Activar modelo: ${m.name} (${m.provider})`,
    category: 'Cambiar Modelo de IA',
    icon: Sparkles,
    run: () => {
      onSelectModel(m.id);
      onClose();
    },
  }));

  const allItems = [...actions, ...modelActions];
  const filtered = allItems.filter((i) =>
    i.title.toLowerCase().includes(query.toLowerCase()) || i.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />
      <div className="relative w-full max-w-xl bg-[#0c0c12] border border-[#272732] rounded-2xl shadow-[0_0_60px_rgba(139,92,246,0.25)] overflow-hidden z-10 flex flex-col max-h-[75vh]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#22222f] bg-[#121218]">
          <Search className="w-5 h-5 text-purple-400 mr-3 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Escribe un comando, vista o modelo de IA..."
            className="w-full bg-transparent border-0 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-zinc-500">
              No se encontraron comandos o modelos con ese término.
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={item.run}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-purple-950/40 hover:border-purple-600/50 border border-transparent cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#181822] group-hover:bg-purple-900/60 border border-[#272732] flex items-center justify-center text-zinc-400 group-hover:text-purple-300 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs md:text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">
                        {item.title}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500">
                        {item.category}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-purple-400 transition-all group-hover:translate-x-1" />
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-[#08080c] border-t border-[#1a1a24] flex items-center justify-between text-[11px] font-mono text-zinc-500">
          <div className="flex items-center gap-2">
            <span>KiranIA Command Engine</span>
          </div>
          <div className="flex items-center gap-3">
            <span>↑↓ para navegar</span>
            <span>↵ para ejecutar</span>
          </div>
        </div>
      </div>
    </div>
  );
};
