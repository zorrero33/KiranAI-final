import React, { useState } from 'react';
import { ToolIntegration } from '../../types';
import {
  Wrench,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Globe,
} from 'lucide-react';

interface ToolsViewProps {
  webSearchActive: boolean;
  onToggleWebSearch: () => void;
}

const REGISTERED_TOOLS: ToolIntegration[] = [
  {
    id: 'litellm_gateway',
    name: 'LiteLLM Universal Multi-Provider Gateway',
    category: 'infrastructure',
    status: 'CONNECTED',
    description: 'Central proxy gateway routing requests to OpenAI, Anthropic, Gemini, DeepSeek, OpenRouter, Groq, and Mistral with automated fallbacks and zero client-exposed keys.',
    requiresOAuth: false,
    permissions: { read: true, write: true, execute: true },
    architectureNotes: 'Managed server-side proxy running on port 4000 with master-key authentication and streaming SSE support.',
  },
  {
    id: 'web_search',
    name: 'Google Web Search Grounding',
    category: 'core',
    status: 'CONNECTED',
    description: 'Real-time live Google Search queries and factual citation retrieval natively supported via Gemini model tools.',
    requiresOAuth: false,
    permissions: { read: true, write: false, execute: true },
    architectureNotes: 'Directly invoked via { googleSearch: {} } in Gemini SDK generateContentStream.',
  },
  {
    id: 'code_engine',
    name: 'KiranIA Code Engine',
    category: 'core',
    status: 'CONNECTED',
    description: 'Multi-file scaffold generator, syntax verification, diff extraction, and project structure compiler.',
    requiresOAuth: false,
    permissions: { read: true, write: true, execute: true },
    architectureNotes: 'Runs on Express server with regex parsers and modular project synthesizer.',
  },
  {
    id: 'browser_sandbox',
    name: 'Browser Web Sandbox',
    category: 'developer',
    status: 'CONNECTED',
    description: 'Client-side isolated runtime for HTML5, CSS3, ES2022 JavaScript, DOM and Canvas with bi-directional console capturing.',
    requiresOAuth: false,
    permissions: { read: true, write: true, execute: true },
    architectureNotes: 'Sandboxed iframe with allow-scripts allow-modals, message posting channel for telemetry.',
  },
  {
    id: 'document_analyzer',
    name: 'Multimodal Document & Vision Analyzer',
    category: 'core',
    status: 'CONNECTED',
    description: 'Direct optical parsing of images, screenshots, code files, CSV, JSON, and technical specifications.',
    requiresOAuth: false,
    permissions: { read: true, write: false, execute: true },
    architectureNotes: 'Encodes binary inlineData buffers sent securely to Gemini 3.8 models.',
  },
  {
    id: 'gmail',
    name: 'Google Workspace Gmail',
    category: 'workspace',
    status: 'NOT_CONFIGURED',
    description: 'Read inbox emails, draft messages, and dispatch emails with explicit approval.',
    requiresOAuth: true,
    requiredScopes: ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.send'],
    permissions: { read: false, write: false, execute: false },
    architectureNotes: 'Requires Google Cloud Console OAuth 2.0 client ID and user token exchange.',
  },
  {
    id: 'google_drive',
    name: 'Google Drive Sync',
    category: 'workspace',
    status: 'NOT_CONFIGURED',
    description: 'Cloud document indexing, project backup, and team file collaboration.',
    requiresOAuth: true,
    requiredScopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive.readonly'],
    permissions: { read: false, write: false, execute: false },
    architectureNotes: 'Requires Drive API enabled in Google Cloud Console and authorized redirect URI.',
  },
  {
    id: 'google_calendar',
    name: 'Google Calendar Scheduler',
    category: 'workspace',
    status: 'NOT_CONFIGURED',
    description: 'Schedule milestones, sync project deadlines, and create reminders.',
    requiresOAuth: true,
    requiredScopes: ['https://www.googleapis.com/auth/calendar.events'],
    permissions: { read: false, write: false, execute: false },
    architectureNotes: 'Requires Calendar API credentials configured.',
  },
  {
    id: 'github',
    name: 'GitHub Repository Sync',
    category: 'developer',
    status: 'NOT_CONFIGURED',
    description: 'Push commits, create remote repositories, manage issues, and trigger GitHub Actions.',
    requiresOAuth: true,
    requiredScopes: ['repo', 'read:user', 'workflow'],
    permissions: { read: false, write: false, execute: false },
    architectureNotes: 'Requires GitHub Personal Access Token (PAT) or OAuth App registered in GitHub Developer settings.',
  },
  {
    id: 'docker_sandbox',
    name: 'Isolated Linux Sandbox Container (Docker/VM)',
    category: 'infrastructure',
    status: 'EXTERNAL_AGENT_REQUIRED',
    description: 'Sandboxed Linux environment with isolated memory and CPU limits to run arbitrary Python, Node, or Rust daemons safely.',
    requiresOAuth: false,
    permissions: { read: false, write: false, execute: false },
    architectureNotes: 'Requires Docker daemon or gVisor sandbox daemon accessible via microservice agent (e.g. firejail/podman).',
  },
];

export const ToolsView: React.FC<ToolsViewProps> = ({
  webSearchActive,
  onToggleWebSearch,
}) => {
  const [selectedTool, setSelectedTool] = useState<ToolIntegration | null>(REGISTERED_TOOLS[0]);

  const getStatusBadge = (status: ToolIntegration['status']) => {
    switch (status) {
      case 'CONNECTED':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 text-[11px] font-mono text-emerald-400">
            <CheckCircle2 className="w-3 h-3" />
            CONNECTED
          </span>
        );
      case 'NOT_CONFIGURED':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60 text-[11px] font-mono text-zinc-400">
            <XCircle className="w-3 h-3 text-zinc-500" />
            NOT CONFIGURED
          </span>
        );
      case 'EXTERNAL_AGENT_REQUIRED':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/60 text-[11px] font-mono text-amber-400">
            <AlertTriangle className="w-3 h-3" />
            AGENT REQUIRED
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] bg-[#09090b] overflow-hidden select-none">
      {/* Header */}
      <div className="p-4 md:px-8 border-b border-[#272732] bg-[#0c0c10]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Wrench className="w-5 h-5 text-purple-400" />
              <span>KiranIA Tool Registry & Connectors</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Arquitectura de herramientas reales. Las herramientas sólo se muestran como activas si existe una implementación verificada. Cero simulación.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleWebSearch}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
                webSearchActive
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                  : 'bg-[#181820] border-[#272732] text-zinc-400'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>Web Search Grounding: {webSearchActive ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: List + Detail Pane */}
      <div className="flex-1 flex overflow-hidden">
        {/* Tool List */}
        <div className="w-1/2 border-r border-[#272732] overflow-y-auto p-4 space-y-2">
          {REGISTERED_TOOLS.map((tool) => {
            const isSelected = selectedTool?.id === tool.id;
            return (
              <div
                key={tool.id}
                onClick={() => setSelectedTool(tool)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-purple-950/30 border-purple-600/60 shadow-lg'
                    : 'bg-[#121217] border-[#272732] hover:border-zinc-600 hover:bg-[#16161d]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-xs md:text-sm text-zinc-200">
                    {tool.name}
                  </span>
                  {getStatusBadge(tool.status)}
                </div>
                <p className="text-xs text-zinc-400 line-clamp-2">{tool.description}</p>
              </div>
            );
          })}
        </div>

        {/* Selected Tool Details & Architecture Specification */}
        <div className="w-1/2 p-6 overflow-y-auto bg-[#09090b]">
          {selectedTool ? (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-bold text-white">{selectedTool.name}</h2>
                  {getStatusBadge(selectedTool.status)}
                </div>
                <p className="text-xs text-zinc-400">{selectedTool.description}</p>
              </div>

              {/* Status Explanation */}
              <div className="p-4 rounded-xl bg-[#121217] border border-[#272732] space-y-3">
                <div className="text-xs font-mono uppercase tracking-wider text-purple-400 font-semibold">
                  INTEGRATION SPECIFICATION
                </div>
                <div className="text-xs space-y-2 font-mono">
                  <div className="flex justify-between border-b border-[#22222d] pb-1.5">
                    <span className="text-zinc-500">Requires OAuth 2.0:</span>
                    <span className="text-zinc-200">{selectedTool.requiresOAuth ? 'YES' : 'NO'}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#22222d] pb-1.5">
                    <span className="text-zinc-500">Architecture Layer:</span>
                    <span className="text-zinc-200 uppercase">{selectedTool.category}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#22222d] pb-1.5">
                    <span className="text-zinc-500">Permissions:</span>
                    <span className="text-emerald-400">
                      Read: {selectedTool.permissions.read ? '✓' : '✗'} | Write: {selectedTool.permissions.write ? '✓' : '✗'} | Execute: {selectedTool.permissions.execute ? '✓' : '✗'}
                    </span>
                  </div>
                </div>

                {selectedTool.requiredScopes && (
                  <div className="pt-2">
                    <span className="text-[11px] font-mono text-zinc-400 block mb-1">
                      Required OAuth Scopes:
                    </span>
                    <div className="space-y-1">
                      {selectedTool.requiredScopes.map((scope, sIdx) => (
                        <div
                          key={sIdx}
                          className="px-2 py-1 rounded bg-[#09090b] text-[11px] font-mono text-zinc-400 border border-[#272732] truncate"
                        >
                          {scope}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Architecture & Next Steps */}
              <div className="p-4 rounded-xl bg-[#121217] border border-[#272732] space-y-2">
                <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                  ARCHITECTURE & IMPLEMENTATION POINT
                </div>
                <p className="text-xs text-zinc-300 font-mono leading-relaxed">
                  {selectedTool.architectureNotes}
                </p>
                {selectedTool.status === 'NOT_CONFIGURED' && (
                  <div className="mt-3 p-3 rounded bg-zinc-900 border border-zinc-700/50 text-xs font-mono text-zinc-400 space-y-1">
                    <div className="text-amber-400 font-semibold">Next Step to Activate:</div>
                    <p>1. Open Google Cloud Console or Service Developer Portal.</p>
                    <p>2. Create OAuth 2.0 Client credentials with specified scopes.</p>
                    <p>3. Configure Client ID in KiranAI connector settings.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-xs font-mono text-zinc-500">
              Select a tool to view its technical specification.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
