import React, { useState } from 'react';
import { PendingAction } from '../../types';
import {
  ShieldCheck,
  ShieldAlert,
  Check,
  X,
} from 'lucide-react';

interface PermissionsCenterProps {
  pendingActions: PendingAction[];
  onApproveAction: (action: PendingAction) => void;
  onRejectAction: (action: PendingAction) => void;
  autoApproveSafe: boolean;
  onToggleAutoApproveSafe: (val: boolean) => void;
}

interface PermissionRule {
  id: string;
  category: string;
  permission: string;
  isAllowed: boolean;
  isSensitive: boolean;
  description: string;
}

export const PermissionsCenter: React.FC<PermissionsCenterProps> = ({
  pendingActions,
  onApproveAction,
  onRejectAction,
  autoApproveSafe,
  onToggleAutoApproveSafe,
}) => {
  const [rules, setRules] = useState<PermissionRule[]>([
    {
      id: 'p_file_read',
      category: 'Project Filesystem',
      permission: 'Read files & directory tree',
      isAllowed: true,
      isSensitive: false,
      description: 'Allows KiranAI to inspect project code to provide recommendations and fixes.',
    },
    {
      id: 'p_file_write',
      category: 'Project Filesystem',
      permission: 'Create & update project files',
      isAllowed: true,
      isSensitive: true,
      description: 'Allows KiranAI to emit new source files or apply code modifications.',
    },
    {
      id: 'p_file_delete',
      category: 'Project Filesystem',
      permission: 'Delete project files',
      isAllowed: false,
      isSensitive: true,
      description: 'Requires explicit user confirmation before any file deletion.',
    },
    {
      id: 'p_sandbox_exec',
      category: 'Code Sandbox',
      permission: 'Execute JavaScript in Browser Sandbox',
      isAllowed: true,
      isSensitive: false,
      description: 'Runs isolated client-side preview in sandboxed iframe.',
    },
    {
      id: 'p_web_search',
      category: 'Web Grounding',
      permission: 'Perform live Google Search queries',
      isAllowed: true,
      isSensitive: false,
      description: 'Fetches verified real-time documentation and citations via Gemini tools.',
    },
    {
      id: 'p_gmail_read',
      category: 'Google Workspace (OAuth)',
      permission: 'Read emails',
      isAllowed: false,
      isSensitive: true,
      description: 'Only enabled when OAuth token is provisioned by user.',
    },
    {
      id: 'p_gmail_send',
      category: 'Google Workspace (OAuth)',
      permission: 'Send emails',
      isAllowed: false,
      isSensitive: true,
      description: 'Always prompts approval dialog before transmitting any message.',
    },
  ]);

  const togglePermission = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isAllowed: !r.isAllowed } : r))
    );
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] bg-[#09090b] overflow-y-auto p-4 md:p-8 select-none">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="border-b border-[#272732] pb-5">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-600/50 flex items-center justify-center p-[1px] shadow-lg">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              Permissions Center & Action Governance
            </h1>
          </div>
          <p className="text-xs md:text-sm text-zinc-400">
            Principio de Autonomía Controlada. KiranIA ejecuta tareas seguras automáticamente,
            pero exige confirmación explícita para acciones sensibles o destructivas.
          </p>
        </div>

        {/* Global Autonomy Toggle Card */}
        <div className="p-4 rounded-xl bg-[#121217] border border-[#272732] flex items-center justify-between">
          <div>
            <span className="font-semibold text-xs md:text-sm text-zinc-200 block mb-1">
              Auto-approve Low-Risk Actions
            </span>
            <span className="text-xs text-zinc-500">
              Permite a KiranIA generar borradores, leer archivos del proyecto y previsualizar sin interrumpirte con confirmaciones.
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={autoApproveSafe}
              onChange={(e) => onToggleAutoApproveSafe(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
          </label>
        </div>

        {/* Pending Actions Queue */}
        <div className="p-4 md:p-5 rounded-xl bg-[#121217] border border-[#272732] space-y-4">
          <div className="flex items-center justify-between border-b border-[#272732] pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <h2 className="text-xs md:text-sm font-bold font-mono text-white">
                PENDING ACTION AUTHORIZATION QUEUE ({pendingActions.length})
              </h2>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">
              Requires user approval before execution
            </span>
          </div>

          {pendingActions.length === 0 ? (
            <div className="py-6 text-center text-xs font-mono text-zinc-500">
              No pending actions requiring user authorization at this moment.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingActions.map((action) => (
                <div
                  key={action.id}
                  className="p-3.5 rounded-lg bg-[#09090b] border border-amber-800/40 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-amber-300 font-mono">
                      {action.title}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {new Date(action.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">{action.details}</p>
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => onApproveAction(action)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve Action</span>
                    </button>
                    <button
                      onClick={() => onRejectAction(action)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detailed Permissions Matrix */}
        <div className="p-4 md:p-5 rounded-xl bg-[#121217] border border-[#272732] space-y-4">
          <div className="border-b border-[#272732] pb-3">
            <h2 className="text-xs md:text-sm font-bold font-mono text-white">
              SYSTEM PERMISSIONS MATRIX
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Configuración de acceso granular por subsistema.
            </p>
          </div>

          <div className="divide-y divide-[#22222d]">
            {rules.map((rule) => (
              <div key={rule.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-xs text-zinc-200">
                      {rule.permission}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                      {rule.category}
                    </span>
                    {rule.isSensitive && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/40">
                        Sensitive
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-0.5">{rule.description}</p>
                </div>

                <button
                  onClick={() => togglePermission(rule.id)}
                  className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors ${
                    rule.isAllowed
                      ? 'bg-emerald-950/60 border border-emerald-800/60 text-emerald-300'
                      : 'bg-zinc-800 border border-zinc-700 text-zinc-400'
                  }`}
                >
                  {rule.isAllowed ? '✓ ALLOWED' : '✗ BLOCKED'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
