import React, { useState } from 'react';
import { MemoryItem, Project } from '../../types';
import {
  Brain,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Layers,
  User,
  Clock,
} from 'lucide-react';

interface MemoryViewProps {
  memoryItems: MemoryItem[];
  onAddMemory: (type: MemoryItem['type'], key: string, value: string) => void;
  onDeleteMemory: (id: string) => void;
  onUpdateMemory: (id: string, value: string) => void;
  activeProject: Project | null;
}

export const MemoryView: React.FC<MemoryViewProps> = ({
  memoryItems,
  onAddMemory,
  onDeleteMemory,
  onUpdateMemory,
  activeProject,
}) => {
  const [activeTab, setActiveTab] = useState<MemoryItem['type']>('user');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');

  const filteredItems = memoryItems.filter((m) => m.type === activeTab);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) return;
    onAddMemory(activeTab, newKey.trim(), newValue.trim());
    setNewKey('');
    setNewValue('');
  };

  const startEdit = (item: MemoryItem) => {
    setEditingId(item.id);
    setEditVal(item.value);
  };

  const saveEdit = (id: string) => {
    onUpdateMemory(id, editVal);
    setEditingId(null);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] bg-[#09090b] overflow-y-auto p-4 md:p-8 select-none">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="border-b border-[#272732] pb-5">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-950/60 border border-indigo-600/50 flex items-center justify-center p-[1px] shadow-lg">
              <Brain className="w-4 h-4 text-indigo-400" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              KiranIA Memory Architecture
            </h1>
          </div>
          <p className="text-xs md:text-sm text-zinc-400">
            Control explícito sobre la memoria de la IA. Los contextos están estrictamente segregados para evitar contaminación de datos.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 border-b border-[#272732] pb-2">
          <button
            onClick={() => setActiveTab('user')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'user'
                ? 'bg-purple-950/60 border border-purple-800/60 text-purple-300'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Memoria de Usuario</span>
          </button>
          <button
            onClick={() => setActiveTab('project')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'project'
                ? 'bg-purple-950/60 border border-purple-800/60 text-purple-300'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Memoria de Proyecto {activeProject ? `(${activeProject.name})` : ''}</span>
          </button>
          <button
            onClick={() => setActiveTab('session')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'session'
                ? 'bg-purple-950/60 border border-purple-800/60 text-purple-300'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Memoria de Sesión Actual</span>
          </button>
          <button
            onClick={() => setActiveTab('temporary')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'temporary'
                ? 'bg-purple-950/60 border border-purple-800/60 text-purple-300'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Memoria Temporal</span>
          </button>
        </div>

        {/* Create Memory Item Form */}
        <form
          onSubmit={handleCreate}
          className="p-4 rounded-xl bg-[#121217] border border-[#272732] space-y-3"
        >
          <div className="text-xs font-mono uppercase text-zinc-400 font-semibold">
            AÑADIR PARÁMETRO A: {activeTab.toUpperCase()}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="Clave / Título (ej: Framework preferido)"
              className="bg-[#09090b] border border-[#272732] rounded px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-600"
            />
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="Valor / Instrucción explícita"
              className="md:col-span-2 bg-[#09090b] border border-[#272732] rounded px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-600"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!newKey.trim() || !newValue.trim()}
              className="flex items-center gap-1 px-4 py-1.5 rounded bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Guardar en Memoria</span>
            </button>
          </div>
        </form>

        {/* Existing Memory Items */}
        <div className="space-y-3">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-zinc-500 bg-[#121217] rounded-xl border border-[#272732]">
              No hay directivas guardadas en este espacio de memoria.
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-[#121217] border border-[#272732] flex items-start justify-between gap-4"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-purple-300 font-mono">
                      {item.key}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      Actualizado: {new Date(item.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {editingId === item.id ? (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={editVal}
                        onChange={(e) => setEditVal(e.target.value)}
                        className="flex-1 bg-[#09090b] border border-purple-600 rounded px-2 py-1 text-xs text-zinc-200"
                      />
                      <button
                        onClick={() => saveEdit(item.id)}
                        className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-500"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-300">{item.value}</p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => startEdit(item)}
                    title="Editar memoria"
                    className="p-1.5 rounded hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteMemory(item.id)}
                    title="Eliminar memoria"
                    className="p-1.5 rounded hover:bg-rose-950/50 text-zinc-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
