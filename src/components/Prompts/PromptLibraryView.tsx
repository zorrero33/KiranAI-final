import React, { useState } from 'react';
import { PromptTemplate } from '../../types';
import {
  Bookmark,
  Search,
  Plus,
  Copy,
  Check,
  Sparkles,
  Tag,
  Trash2,
  Send,
  SlidersHorizontal,
  FolderPlus,
  Layers,
  Heart,
} from 'lucide-react';

interface PromptLibraryViewProps {
  prompts: PromptTemplate[];
  onAddPrompt: (prompt: PromptTemplate) => void;
  onDeletePrompt: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onExecutePromptInChat: (promptText: string) => void;
}

export const PromptLibraryView: React.FC<PromptLibraryViewProps> = ({
  prompts,
  onAddPrompt,
  onDeletePrompt,
  onToggleFavorite,
  onExecutePromptInChat,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form states for new prompt
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<PromptTemplate['category']>('Coding');
  const [newDescription, setNewDescription] = useState('');
  const [newPromptText, setNewPromptText] = useState('');
  const [newTags, setNewTags] = useState('');

  const categories = ['all', 'Coding', 'Architecture', 'Security', 'Bug Fix', 'Reasoning', 'Product', 'Custom'];

  const filteredPrompts = prompts.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.prompt.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));

    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreatePrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPromptText.trim()) return;

    const template: PromptTemplate = {
      id: `prompt_${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      description: newDescription.trim() || 'Prompt personalizado de usuario.',
      prompt: newPromptText.trim(),
      tags: newTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      isCustom: true,
      isFavorite: true,
    };

    onAddPrompt(template);
    setIsCreateModalOpen(false);
    setNewTitle('');
    setNewDescription('');
    setNewPromptText('');
    setNewTags('');
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] bg-[#09090b] overflow-y-auto p-4 md:p-8 select-none">
      <div className="max-w-7xl mx-auto w-full space-y-6 pb-20">
        {/* Header */}
        <div className="border-b border-[#272732] pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-600/50 flex items-center justify-center p-[1px] shadow-lg">
                <Bookmark className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  Biblioteca de Prompts & Plantillas de Ingeniería
                  <span className="text-xs font-mono py-0.5 px-2.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800/60 font-medium">
                    KiranIA Curated
                  </span>
                </h1>
                <p className="text-xs md:text-sm text-zinc-400">
                  Instrucciones rigurosamente diseñadas para obtener código sin atajos, arquitecturas resilientes y análisis formal.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold font-mono shadow-[0_0_15px_rgba(147,51,234,0.3)] transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Prompt Personalizado</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="space-y-3 bg-[#0e0e14] p-4 rounded-2xl border border-[#272732] shadow-xl">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar prompt por título, etiquetas o contenido de la instrucción..."
              className="w-full bg-[#14141c] border border-[#272732] rounded-xl pl-10 pr-4 py-2 text-xs md:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#22222f]">
            <span className="text-[11px] font-mono text-zinc-500 uppercase mr-1">Categoría:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                  selectedCategory === cat
                    ? 'bg-purple-950/80 border border-purple-600/70 text-purple-200 font-semibold shadow-sm'
                    : 'bg-[#14141c] border border-[#272732] text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                {cat === 'all' ? 'Todas' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Prompts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrompts.map((p) => (
            <div
              key={p.id}
              className="p-5 rounded-2xl bg-[#0e0e14] border border-[#272732] hover:border-purple-600/50 transition-all flex flex-col justify-between shadow-xl group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-[#303040]">
                    {p.category}
                  </span>

                  <button
                    onClick={() => onToggleFavorite(p.id)}
                    className={`p-1 rounded hover:bg-white/5 transition-colors ${
                      p.isFavorite ? 'text-pink-400' : 'text-zinc-600 hover:text-zinc-400'
                    }`}
                    title={p.isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                  >
                    <Heart className="w-4 h-4 fill-current" />
                  </button>
                </div>

                <h3 className="font-bold text-sm text-white group-hover:text-purple-300 transition-colors mb-1.5">
                  {p.title}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed mb-3 line-clamp-2">
                  {p.description}
                </p>

                {/* Prompt Preview Text */}
                <div className="p-3 rounded-xl bg-[#08080c] border border-[#22222d] text-xs font-mono text-zinc-300 line-clamp-3 mb-3 leading-relaxed">
                  {p.prompt}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {p.tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#181822] text-zinc-400 border border-[#272736]"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-[#22222d] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(p.prompt, p.id)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#14141c] hover:bg-[#1a1a24] border border-[#272732] text-xs font-mono text-zinc-300 transition-colors"
                  >
                    {copiedId === p.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>

                  {p.isCustom && (
                    <button
                      onClick={() => onDeletePrompt(p.id)}
                      className="p-1 rounded text-zinc-600 hover:text-rose-400 transition-colors"
                      title="Eliminar prompt"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => onExecutePromptInChat(p.prompt)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-medium shadow-sm transition-colors"
                >
                  <Send className="w-3 h-3" />
                  <span>Usar en Chat</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Prompt Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-[#0e0e14] border border-[#272732] rounded-2xl p-6 text-white shadow-2xl space-y-4">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Plus className="w-4 h-4 text-purple-400" />
              <span>Guardar Nueva Plantilla de Prompt</span>
            </h3>

            <form onSubmit={handleCreatePrompt} className="space-y-3">
              <div>
                <label className="text-[11px] font-mono uppercase text-zinc-400 block mb-1">TÍTULO</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ej: Refactorización a Micro-frontends"
                  className="w-full bg-[#14141c] border border-[#272732] rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono uppercase text-zinc-400 block mb-1">CATEGORÍA</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-[#14141c] border border-[#272732] rounded-lg px-2.5 py-2 text-xs text-zinc-300 font-mono focus:outline-none focus:border-purple-600"
                  >
                    <option value="Coding">Coding</option>
                    <option value="Architecture">Architecture</option>
                    <option value="Security">Security</option>
                    <option value="Bug Fix">Bug Fix</option>
                    <option value="Reasoning">Reasoning</option>
                    <option value="Product">Product</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-mono uppercase text-zinc-400 block mb-1">ETIQUETAS (SEPARADAS POR COMA)</label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="React, CSS, Architecture"
                    className="w-full bg-[#14141c] border border-[#272732] rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-zinc-400 block mb-1">DESCRIPCIÓN BREVE</label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Para qué sirve esta instrucción..."
                  className="w-full bg-[#14141c] border border-[#272732] rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-zinc-400 block mb-1">CONTENIDO DEL PROMPT</label>
                <textarea
                  value={newPromptText}
                  onChange={(e) => setNewPromptText(e.target.value)}
                  placeholder="Actúa como..."
                  rows={4}
                  className="w-full bg-[#14141c] border border-[#272732] rounded-lg p-3 text-xs text-zinc-100 focus:outline-none focus:border-purple-600 resize-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-mono text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim() || !newPromptText.trim()}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-semibold disabled:opacity-40"
                >
                  Guardar Plantilla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
