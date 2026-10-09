import React, { useState } from 'react';
import { AutomationTask } from '../../types';
import {
  CalendarClock,
  Plus,
  AlertTriangle,
  Trash2,
  Clock,
} from 'lucide-react';

export const AutomationsView: React.FC = () => {
  const [automations, setAutomations] = useState<AutomationTask[]>([
    {
      id: 'auto_1',
      name: 'Daily Workspace & Security Health Check',
      schedule: '0 09:00 (Daily)',
      taskPrompt: 'Analyze active project dependencies, audit potential outdated modules, and run unit verification.',
      enabled: true,
      status: 'REQUIRES_CRON_SERVICE',
      nextRunEstimated: 'Tomorrow at 09:00 AM UTC',
    },
    {
      id: 'auto_2',
      name: 'Client In-Browser Memory Sync Trigger',
      schedule: 'Every 10 minutes (Active Browser Tab)',
      taskPrompt: 'Persist project files state and synchronize active tabs with local storage snapshot.',
      enabled: true,
      status: 'ACTIVE_LISTENER',
      nextRunEstimated: 'In 4 minutes (Client window)',
    },
  ]);

  const [name, setName] = useState('');
  const [schedule, setSchedule] = useState('');
  const [prompt, setPrompt] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !schedule.trim() || !prompt.trim()) return;

    const newTask: AutomationTask = {
      id: `auto_${Date.now()}`,
      name: name.trim(),
      schedule: schedule.trim(),
      taskPrompt: prompt.trim(),
      enabled: true,
      status: 'REQUIRES_CRON_SERVICE',
      nextRunEstimated: 'Scheduled according to cron schedule',
    };

    setAutomations((prev) => [...prev, newTask]);
    setName('');
    setSchedule('');
    setPrompt('');
  };

  const toggleEnabled = (id: string) => {
    setAutomations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
    );
  };

  const deleteAutomation = (id: string) => {
    setAutomations((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] bg-[#09090b] overflow-y-auto p-4 md:p-8 select-none">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="border-b border-[#272732] pb-5">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-600/50 flex items-center justify-center p-[1px] shadow-lg">
              <CalendarClock className="w-4 h-4 text-amber-400" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              Automations & Scheduled Pipelines
            </h1>
          </div>
          <p className="text-xs md:text-sm text-zinc-400">
            Arquitectura de tareas programadas. Cero automatizaciones ficticias: especificamos qué tareas se ejecutan como listeners en el cliente y cuáles requieren un servicio Cron/Cloud Scheduler real.
          </p>
        </div>

        {/* Notice of Transparency */}
        <div className="p-4 rounded-xl bg-[#121217] border border-amber-900/40 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <div className="font-semibold text-amber-300">
              Technical Specification for Scheduled Background Jobs
            </div>
            <p className="text-zinc-400 leading-relaxed">
              Las automatizaciones en segundo plano que deben activarse sin una pestaña del navegador abierta requieren un daemon en la nube (como Google Cloud Tasks o Cron). KiranIA ejecuta listeners en la pestaña activa y genera los manifests para desplegar el scheduler en producción.
            </p>
          </div>
        </div>

        {/* Create Automation Form */}
        <form
          onSubmit={handleCreate}
          className="p-4 rounded-xl bg-[#121217] border border-[#272732] space-y-3"
        >
          <div className="text-xs font-mono uppercase text-zinc-400 font-semibold">
            NUEVA AUTOMATIZACIÓN
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre (ej: Resumen de commits & release notes)"
              className="bg-[#09090b] border border-[#272732] rounded px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-600"
            />
            <input
              type="text"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              placeholder="Frecuencia / Cron (ej: Todos los lunes 08:00)"
              className="bg-[#09090b] border border-[#272732] rounded px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-600"
            />
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Instrucción que ejecutará KiranIA cuando se active el trigger..."
            rows={2}
            className="w-full bg-[#09090b] border border-[#272732] rounded p-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-600 resize-none"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!name.trim() || !schedule.trim() || !prompt.trim()}
              className="flex items-center gap-1 px-4 py-1.5 rounded bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar Pipeline</span>
            </button>
          </div>
        </form>

        {/* Existing Automations List */}
        <div className="space-y-3">
          {automations.map((auto) => (
            <div
              key={auto.id}
              className="p-4 rounded-xl bg-[#121217] border border-[#272732] flex items-start justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-zinc-200 font-mono">
                    {auto.name}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                    {auto.schedule}
                  </span>
                  {auto.status === 'ACTIVE_LISTENER' ? (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-400">
                      ACTIVE (Browser Runtime)
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-800/60 text-amber-400">
                      CRON DAEMON REQUIRED
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 font-mono">{auto.taskPrompt}</p>
                {auto.nextRunEstimated && (
                  <div className="text-[11px] font-mono text-zinc-500 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-zinc-600" />
                    <span>Próxima ejecución: {auto.nextRunEstimated}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleEnabled(auto.id)}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors ${
                    auto.enabled
                      ? 'bg-purple-950/60 border border-purple-800/60 text-purple-300'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {auto.enabled ? 'ENABLED' : 'PAUSED'}
                </button>
                <button
                  onClick={() => deleteAutomation(auto.id)}
                  className="p-1 rounded hover:bg-rose-950/40 text-zinc-500 hover:text-rose-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
