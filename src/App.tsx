import { useState, useEffect } from 'react';
import {
  ViewMode,
  Project,
  ChatMessage,
  AttachedFile,
  MemoryItem,
  PendingAction,
  ProjectFile,
  ModelOption,
  PromptTemplate,
  UserAccount,
  UserPreferences,
  UsageQuotaInfo,
} from './types';
import { StorageService } from './services/storage';
import {
  fetchSystemStatus,
  fetchDiscoveredModels,
  triggerModelDiscovery,
  fetchUserUsage,
  streamChat,
  generateProjectScaffold,
  analyzeFileContent,
} from './services/api';
import { exportProjectAsZip } from './services/zipExport';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { HomeView } from './components/Home/HomeView';
import { ChatView } from './components/Chat/ChatView';
import { CodeEditorView } from './components/CodeWorkspace/CodeEditorView';
import { SolveView } from './components/Solve/SolveView';
import { ToolsView } from './components/Tools/ToolsView';
import { PermissionsCenter } from './components/Permissions/PermissionsCenter';
import { MemoryView } from './components/Memory/MemoryView';
import { AutomationsView } from './components/Automations/AutomationsView';
import { UIComponentsView } from './components/UIComponents/UIComponentsView';
import { NewProjectModal } from './components/NewProjectModal';
import { GalaxyBackground } from './components/GalaxyBackground';
import { ModelCatalogModal } from './components/ModelCatalogModal';
import { ModelsCatalogView } from './components/Models/ModelsCatalogView';
import { ModelCompareView } from './components/Compare/ModelCompareView';
import { PromptLibraryView } from './components/Prompts/PromptLibraryView';
import { BillingView } from './components/Billing/BillingView';
import { AdminView } from './components/Admin/AdminView';
import { SettingsView } from './components/Settings/SettingsView';
import { CommandPalette } from './components/CommandPalette';
import { AuthModal } from './components/Auth/AuthModal';
import { ApkBuilderView } from './components/Apk/ApkBuilderView';
import { CloudflareDeployView } from './components/Deploy/CloudflareDeployView';
import { VisionStudioView } from './components/Vision/VisionStudioView';
import { DocumentsView } from './components/Documents/DocumentsView';
import {
  Layers,
  Terminal,
  Code2,
  Smartphone,
  Image as ImageIcon,
  Menu,
} from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('home');
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [memoryItems, setMemoryItems] = useState<MemoryItem[]>([]);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);

  // Models & Gateway
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.8-flash');
  const [supportedModels, setSupportedModels] = useState<ModelOption[]>([]);
  const [isModelCatalogOpen, setIsModelCatalogOpen] = useState<boolean>(false);
  const [compareInitialModels, setCompareInitialModels] = useState<string[]>(['gemini-3.8-flash', 'ministral-8b-latest']);
  const [lastFallbackInfo, setLastFallbackInfo] = useState<{
    fromModel: string;
    toModel: string;
    reason: string;
  } | null>(null);

  // User & Usage & Paywall
  const [userAccount, setUserAccount] = useState<UserAccount>(() => StorageService.getUserAccount());
  const [userPrefs, setUserPrefs] = useState<UserPreferences>(() => StorageService.getUserPreferences());
  const [usageInfo, setUsageInfo] = useState<UsageQuotaInfo | null>(null);

  // Flags & Modals
  const [webSearchActive, setWebSearchActive] = useState<boolean>(true);
  const [autoApproveSafe, setAutoApproveSafe] = useState<boolean>(true);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isRefreshingDiscovery, setIsRefreshingDiscovery] = useState<boolean>(false);
  const [isDark, setIsDark] = useState<boolean>(true);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'info' | 'success' | 'warn';
  } | null>(null);

  // Sync theme with document class
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Show notification helper
  const notify = (message: string, type: 'info' | 'success' | 'warn' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Refresh user usage quotas from backend
  const refreshUsage = async () => {
    try {
      const data = await fetchUserUsage(userAccount.id);
      setUsageInfo(data);
    } catch {
      // ignore
    }
  };

  // Discover models from backend
  const refreshModelsDiscovery = async () => {
    setIsRefreshingDiscovery(true);
    try {
      const result = await triggerModelDiscovery();
      if (result.models && result.models.length > 0) {
        setSupportedModels(result.models);
        notify(`Model Discovery completado: ${result.models.length} modelos sincronizados.`, 'success');
      }
    } catch (err: any) {
      notify(`Error en Discovery: ${err.message || 'Error'}`, 'warn');
    } finally {
      setIsRefreshingDiscovery(false);
    }
  };

  // Initialize from storage & check server status on mount
  useEffect(() => {
    let loadedProjects = StorageService.getProjects();

    if (!loadedProjects || loadedProjects.length === 0) {
      const starterProject: Project = {
        id: 'kiran-starter-project',
        name: 'Kiran AI Web Starter',
        description: 'Aplicación web interactiva con tema oscuro y ejecución reactiva en vivo.',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        files: [
          {
            id: 'f-index',
            name: 'index.html',
            path: 'index.html',
            language: 'html',
            content: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kiran AI App</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#09090e] text-zinc-100 flex items-center justify-center min-h-screen p-4 font-sans">
  <div class="max-w-md w-full bg-[#13131c] border border-purple-500/30 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
    <div class="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-500 to-cyan-400 p-[1.5px] flex items-center justify-center">
      <div class="w-full h-full bg-[#0c0c14] rounded-[14px] flex items-center justify-center text-cyan-300 font-extrabold text-lg">
        K•AI
      </div>
    </div>
    <h1 class="text-2xl font-black text-white">¡Kiran AI App Activa!</h1>
    <p class="text-xs text-zinc-400">Edita los archivos en el editor lateral y observa los cambios en vivo en la pestaña de vista previa.</p>
    <button onclick="saludar()" class="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-all shadow-lg shadow-purple-600/30 cursor-pointer">
      Probar Interacción
    </button>
    <div id="salida" class="text-xs font-mono text-cyan-300 min-h-4"></div>
  </div>
  <script src="app.js"></script>
</body>
</html>`,
            updatedAt: Date.now(),
          },
          {
            id: 'f-app',
            name: 'app.js',
            path: 'app.js',
            language: 'javascript',
            content: `function saludar() {
  const el = document.getElementById('salida');
  el.textContent = '⚡ Ejecución exitosa en Kiran AI Sandbox: ' + new Date().toLocaleTimeString();
  el.classList.add('animate-pulse');
}
console.log('Kiran AI App inicializada correctamente.');`,
            updatedAt: Date.now(),
          },
        ],
        plan: [
          { id: 'p1', title: 'Creación de archivos base', status: 'completed' },
          { id: 'p2', title: 'Ejecutor de JavaScript listo', status: 'completed' }
        ],
      };
      loadedProjects = [starterProject];
      StorageService.saveProjects(loadedProjects);
      StorageService.setActiveProjectId(starterProject.id);
    }

    setProjects(loadedProjects);

    const activeId = StorageService.getActiveProjectId();
    const active = loadedProjects.find((p) => p.id === activeId) || loadedProjects[0] || null;
    setActiveProject(active);

    setMessages(StorageService.getChatMessages());
    setMemoryItems(StorageService.getMemoryItems());
    setPendingActions(StorageService.getPendingActions());
    setPrompts(StorageService.getPromptTemplates());

    const prefs = StorageService.getUserPreferences();
    setUserPrefs(prefs);
    setSelectedModel(prefs.activeModel || 'gemini-3.8-flash');
    setAutoApproveSafe(prefs.autoApproveSafeActions ?? true);
    if (prefs.theme) {
      setIsDark(prefs.theme === 'dark');
    }

    // Verify backend status, discovered models & user usage
    fetchSystemStatus()
      .then((status) => {
        setHasApiKey(status.hasApiKey);
      })
      .catch((err) => console.error('Status check error:', err));

    fetchDiscoveredModels()
      .then((disc) => {
        if (disc.models && disc.models.length > 0) {
          setSupportedModels(disc.models);
        }
      })
      .catch((err) => console.error('Model discovery load error:', err));

    refreshUsage();
  }, []);

  // Sync projects to storage
  useEffect(() => {
    if (projects.length > 0) {
      StorageService.saveProjects(projects);
    }
  }, [projects]);

  // Sync active project id
  useEffect(() => {
    if (activeProject) {
      StorageService.setActiveProjectId(activeProject.id);
    }
  }, [activeProject]);

  // Sync messages
  useEffect(() => {
    if (messages.length > 0) {
      StorageService.saveChatMessages(messages);
    }
  }, [messages]);

  // Sync memory
  useEffect(() => {
    StorageService.saveMemoryItems(memoryItems);
  }, [memoryItems]);

  // Sync pending actions
  useEffect(() => {
    StorageService.savePendingActions(pendingActions);
  }, [pendingActions]);

  // Sync prompts
  useEffect(() => {
    StorageService.savePromptTemplates(prompts);
  }, [prompts]);

  // Helper to extract files from text (supports <<<FILE: path>>> and markdown blocks)
  const extractFilesFromText = (text: string): ProjectFile[] => {
    const generated: ProjectFile[] = [];
    const seenPaths = new Set<string>();

    const getLanguage = (ext: string): string => {
      if (['js', 'mjs', 'jsx'].includes(ext)) return 'javascript';
      if (['ts', 'tsx'].includes(ext)) return 'typescript';
      if (['html', 'htm'].includes(ext)) return 'html';
      if (['css'].includes(ext)) return 'css';
      if (['json'].includes(ext)) return 'json';
      if (['md'].includes(ext)) return 'markdown';
      if (['py'].includes(ext)) return 'python';
      return 'text';
    };

    // 1. Match <<<FILE: path/to/file.ext>>> [code] <<<END_FILE>>>
    const fileRegex = /<<<FILE:\s*([^\n\r>]+)>>>([\s\S]*?)<<<END_FILE>>>/g;
    let match;
    while ((match = fileRegex.exec(text)) !== null) {
      const filePath = match[1].trim();
      const content = match[2].replace(/^\r?\n/, '').replace(/\r?\n$/, '');
      const name = filePath.split('/').pop() || filePath;
      const ext = name.split('.').pop()?.toLowerCase() || '';

      if (!seenPaths.has(filePath)) {
        seenPaths.add(filePath);
        generated.push({
          id: `f_gen_${Date.now()}_${generated.length}`,
          path: filePath,
          name,
          content,
          language: getLanguage(ext),
          updatedAt: Date.now(),
        });
      }
    }

    // 2. Fallback: Parse markdown code blocks with filename markers
    if (generated.length === 0) {
      const mdRegex = /(?:```|~~~)(?:(\w+)\s+(?:file|path|filename|archivo)=["']?([^\s"'\n]+)["']?|(\w+)\n(?:\/\/|#|\/\*)\s*([^\n]+))\n([\s\S]*?)(?:```|~~~)/gi;
      let mdMatch;
      while ((mdMatch = mdRegex.exec(text)) !== null) {
        const lang = (mdMatch[1] || mdMatch[3] || 'javascript').toLowerCase();
        let filePath = (mdMatch[2] || mdMatch[4] || '').trim();
        const content = mdMatch[5].replace(/^\r?\n/, '').replace(/\r?\n$/, '');

        filePath = filePath.replace(/^(?:file|path|filename|archivo):\s*/i, '').trim();
        if (filePath && !seenPaths.has(filePath) && !filePath.includes(' ') && filePath.includes('.')) {
          seenPaths.add(filePath);
          const name = filePath.split('/').pop() || filePath;
          generated.push({
            id: `f_gen_${Date.now()}_${generated.length}`,
            path: filePath,
            name,
            content,
            language: getLanguage(filePath.split('.').pop()?.toLowerCase() || lang),
            updatedAt: Date.now(),
          });
        }
      }
    }

    return generated;
  };

  // Update active project
  const handleUpdateProject = (updatedProject: Project) => {
    setProjects((prev) => prev.map((p) => (p.id === updatedProject.id ? updatedProject : p)));
    setActiveProject((current) => (current?.id === updatedProject.id ? updatedProject : current));
  };

  // Main Chat Send Handler
  const handleSendMessage = async (content: string, files: AttachedFile[], personaId: string) => {
    if (!content.trim() && files.length === 0) return;

    const timestamp = Date.now();
    const userMsgId = `user_${timestamp}`;
    const modelMsgId = `model_${timestamp}`;

    const userMessage: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content,
      files,
      timestamp,
      status: 'complete',
    };

    const initialModelMessage: ChatMessage = {
      id: modelMsgId,
      role: 'model',
      content: '',
      timestamp: timestamp + 1,
      status: 'streaming',
      agentPersona: personaId.toUpperCase(),
      modelUsed: selectedModel,
    };

    setMessages((prev) => [...prev, userMessage, initialModelMessage]);
    setIsAiLoading(true);

    let accumulatedContent = '';
    let hadError = false;

    // Context preparation
    let projectContext = '';
    if (activeProject) {
      projectContext = `Active Project: "${activeProject.name}"\nProject type: ${activeProject.type}\nFiles (${activeProject.files.length}):\n${activeProject.files.map((f) => `- ${f.path}`).join('\n')}`;
    }

    const userMemories = memoryItems
      .filter((m) => m.type === 'user' || m.type === 'project')
      .map((m) => `[${m.key}]: ${m.value}`)
      .join('\n');

    const validHistory = messages
      .filter((m) => m.content && m.content.trim().length > 0)
      .map((m) => ({
        role: m.role as 'user' | 'model',
        content: m.content.trim(),
      }));

    validHistory.push({
      role: 'user',
      content: userMessage.content,
    });

    try {
      await streamChat({
        messages: validHistory,
        model: selectedModel,
        systemInstruction: userMemories ? `Directivas activas:\n${userMemories}` : undefined,
        enableWebSearch: webSearchActive,
        files,
        projectContext,
        userId: userAccount.id,
        onChunk: (chunk) => {
          accumulatedContent += chunk;
          setMessages((prev) =>
            prev.map((m) => (m.id === modelMsgId ? { ...m, content: accumulatedContent, status: 'streaming' } : m))
          );
        },
        onGrounding: (sources) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === modelMsgId ? { ...m, groundingSources: sources } : m))
          );
        },
        onFallback: (info) => {
          setLastFallbackInfo(info);
          notify(`Auto-Failover activado: pasando a ${info.toModel} (${info.reason})`, 'info');
        },
        onPaywall: (paywallInfo) => {
          notify(paywallInfo.error || 'Límite de cuota diaria alcanzado.', 'warn');
          setCurrentView('billing');
        },
        onError: (err) => {
          hadError = true;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === modelMsgId
                ? {
                    ...m,
                    content: accumulatedContent
                      ? `${accumulatedContent}\n\n[Aviso: ${err}]`
                      : `KiranIA no pudo completar la respuesta.\n\n${err}`,
                    status: 'error',
                  }
                : m
            )
          );
          setIsAiLoading(false);
        },
        onDone: () => {
          refreshUsage();

          if (hadError && !accumulatedContent) {
            setIsAiLoading(false);
            return;
          }

          const extracted = extractFilesFromText(accumulatedContent);

          if (extracted.length > 0 && activeProject) {
            if (autoApproveSafe) {
              const updatedFiles = [...activeProject.files];
              for (const newFile of extracted) {
                const idx = updatedFiles.findIndex((f) => f.path === newFile.path);
                if (idx >= 0) updatedFiles[idx] = newFile;
                else updatedFiles.push(newFile);
              }
              handleUpdateProject({
                ...activeProject,
                files: updatedFiles,
                updatedAt: Date.now(),
              });
              notify(`KiranIA actualizó ${extracted.length} archivo(s) en "${activeProject.name}".`, 'success');
            } else {
              const action: PendingAction = {
                id: `act_${Date.now()}`,
                type: 'modify_code',
                title: `Actualizar ${extracted.length} archivo(s)`,
                details: `Archivos: ${extracted.map((f) => f.path).join(', ')}`,
                payload: extracted,
                status: 'pending',
                createdAt: Date.now(),
              };
              setPendingActions((prev) => [...prev, action]);
            }
          }

          setMessages((prev) =>
            prev.map((m) =>
              m.id === modelMsgId
                ? {
                    ...m,
                    content: accumulatedContent || m.content || 'Respuesta completada.',
                    status: 'complete',
                    generatedFiles: extracted.length > 0 ? extracted : undefined,
                  }
                : m
            )
          );
          setIsAiLoading(false);
        },
      });
    } catch (err: any) {
      console.error('Chat error:', err);
      setIsAiLoading(false);
    }
  };

  const handleCreateProject = (newProject: Project) => {
    setProjects((prev) => [newProject, ...prev]);
    setActiveProject(newProject);
    setCurrentView('code');
    setIsNewProjectModalOpen(false);
    notify(`Proyecto creado: ${newProject.name}`, 'success');
  };

  const handleDeleteProject = (projectId: string) => {
    const remaining = projects.filter((p) => p.id !== projectId);
    setProjects(remaining);
    if (activeProject?.id === projectId) {
      setActiveProject(remaining[0] || null);
      if (!remaining[0]) setCurrentView('home');
    }
    notify('Proyecto eliminado.', 'info');
  };

  const handleGenerateScaffoldWithAi = async (prompt: string, projectType: string) => {
    setIsAiLoading(true);
    notify('KiranIA Architect está compilando la arquitectura...', 'info');
    try {
      const result = await generateProjectScaffold({
        prompt,
        projectType,
        model: selectedModel,
      });

      const now = Date.now();
      const files = result.files.length > 0 ? result.files : [
        {
          id: `f_${now}`,
          path: 'index.html',
          name: 'index.html',
          content: `<!DOCTYPE html>\n<html><head><title>${prompt}</title></head><body><h1>${prompt}</h1></body></html>`,
          language: 'html',
          updatedAt: now,
        },
      ];

      const newProj: Project = {
        id: `proj_${now}`,
        name: prompt.slice(0, 32).trim() || 'Proyecto Generado',
        description: prompt,
        createdAt: now,
        updatedAt: now,
        type: projectType as any,
        files,
        plan: [
          { id: 's1', title: 'Arquitectura y Scaffold', status: 'completed' },
          { id: 's2', title: 'Archivos generados', status: 'completed', details: `${files.length} archivos compilados` },
          { id: 's3', title: 'Ejecución en Sandbox', status: 'completed' },
        ],
      };

      setProjects((prev) => [newProj, ...prev]);
      setActiveProject(newProj);
      setCurrentView('code');
      setIsNewProjectModalOpen(false);
      notify(`Proyecto generado con ${files.length} archivo(s).`, 'success');
    } catch (err: any) {
      notify(`Error en generación: ${err.message || 'Error'}`, 'warn');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleExportZip = async () => {
    if (!activeProject) {
      notify('Primero selecciona o crea un proyecto.', 'warn');
      return;
    }
    try {
      notify(`Exportando ${activeProject.name}.zip...`, 'info');
      await exportProjectAsZip(activeProject);
      notify('ZIP descargado correctamente.', 'success');
    } catch (err: any) {
      notify(`Error al exportar ZIP: ${err.message}`, 'warn');
    }
  };

  const handleOpenFileInWorkspace = (filePath: string) => {
    if (activeProject && filePath) {
      const found = activeProject.files.find((f) => f.path === filePath);
      if (found) {
        handleUpdateProject({ ...activeProject, activeFileId: found.id });
      }
    }
    setCurrentView('code');
  };

  const handleAskKiranToEdit = (promptText: string, targetFile?: string) => {
    const instruction = `[CODE EDIT] Target: ${targetFile || 'Archivos del proyecto'} | Proyecto: ${activeProject?.name || 'General'}\nRequerimiento: ${promptText}\nImplementa los cambios en bloques <<<FILE: ruta>>> código <<<END_FILE>>>`;
    setCurrentView('chat');
    void handleSendMessage(instruction, [], 'coder');
  };

  const handleRunSolve = async (problemText: string, attachedFile?: AttachedFile): Promise<string> => {
    if (attachedFile) {
      const res = await analyzeFileContent({ file: attachedFile, task: 'solve', userQuestion: problemText });
      return res.analysis;
    }
    return new Promise((resolve, reject) => {
      let result = '';
      streamChat({
        messages: [{ role: 'user', content: problemText }],
        model: selectedModel,
        enableWebSearch: true,
        userId: userAccount.id,
        onChunk: (chunk) => { result += chunk; },
        onError: (err) => reject(new Error(String(err))),
        onDone: () => resolve(result),
      });
    });
  };

  const handleApplySolutionToProject = (solutionText: string) => {
    const extracted = extractFilesFromText(solutionText);
    if (extracted.length === 0) {
      notify('No se detectaron bloques de código para aplicar.', 'warn');
      return;
    }
    if (!activeProject) {
      notify('No hay proyecto activo.', 'warn');
      return;
    }
    const updatedFiles = [...activeProject.files];
    for (const newFile of extracted) {
      const idx = updatedFiles.findIndex((f) => f.path === newFile.path);
      if (idx >= 0) updatedFiles[idx] = newFile;
      else updatedFiles.push(newFile);
    }
    handleUpdateProject({ ...activeProject, files: updatedFiles, updatedAt: Date.now() });
    notify(`Aplicados ${extracted.length} archivo(s) al proyecto.`, 'success');
    setCurrentView('code');
  };

  const handleApproveAction = (action: PendingAction) => {
    if (action.type === 'modify_code' && activeProject && Array.isArray(action.payload)) {
      const updatedFiles = [...activeProject.files];
      for (const newFile of action.payload) {
        const idx = updatedFiles.findIndex((f) => f.path === newFile.path);
        if (idx >= 0) updatedFiles[idx] = newFile;
        else updatedFiles.push(newFile);
      }
      handleUpdateProject({ ...activeProject, files: updatedFiles, updatedAt: Date.now() });
      notify('Acción aprobada. Archivos actualizados.', 'success');
    }
    setPendingActions((prev) => prev.filter((a) => a.id !== action.id));
  };

  const handleRejectAction = (action: PendingAction) => {
    setPendingActions((prev) => prev.filter((a) => a.id !== action.id));
    notify('Acción rechazada.', 'info');
  };

  const handleAddMemory = (type: MemoryItem['type'], key: string, value: string) => {
    const now = Date.now();
    setMemoryItems((prev) => [...prev, { id: `mem_${now}`, type, key, value, createdAt: now, updatedAt: now }]);
    notify('Memoria guardada.', 'success');
  };

  const handleDeleteMemory = (id: string) => {
    setMemoryItems((prev) => prev.filter((m) => m.id !== id));
    notify('Memoria eliminada.', 'info');
  };

  const handleUpdateMemory = (id: string, value: string) => {
    setMemoryItems((prev) => prev.map((m) => (m.id === id ? { ...m, value, updatedAt: Date.now() } : m)));
    notify('Memoria actualizada.', 'success');
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `msg_welcome_${Date.now()}`,
        role: 'model',
        timestamp: Date.now(),
        status: 'complete',
        content: `**KiranIA Operating System Online.**\n*Your AI. Your tools. Your world.*\n\n**¿Qué quieres crear, resolver o conseguir hoy?**`,
      },
    ]);
    notify('Conversación reiniciada.', 'info');
  };

  const handleQuickPrompt = (promptText: string) => {
    setCurrentView('chat');
    void handleSendMessage(promptText, [], 'coder');
  };

  const handleToggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    const prefs = { ...userPrefs, theme: newDark ? ('dark' as const) : ('light' as const) };
    setUserPrefs(prefs);
    StorageService.saveUserPreferences(prefs);
  };

  const handleLaunchCompare = (modelIds: string[]) => {
    setCompareInitialModels(modelIds);
    setCurrentView('compare');
  };

  return (
    <div className="kirania-app min-h-screen w-full text-[#f4f4f5] flex flex-col font-sans relative overflow-hidden bg-[#05060a]">
      {/* Background WebGL Galaxy */}
      <GalaxyBackground />

      <div className="kirania-ui-layer relative z-10 flex min-h-screen w-full flex-col">
        {/* Toast Notification */}
        {notification && (
          <div className="fixed top-16 right-6 z-[100] px-4 py-2.5 rounded-xl bg-[#14141c]/95 backdrop-blur-xl border border-purple-500/50 text-xs font-mono text-white shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-purple-500 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-purple-500" />
            </span>
            <span>{notification.message}</span>
          </div>
        )}

        {/* Global Header */}
        <Header
          currentView={currentView}
          onViewChange={setCurrentView}
          activeProject={activeProject}
          selectedModel={selectedModel}
          onModelSelect={(id) => {
            setSelectedModel(id);
            notify(`Modelo activo: ${id}`, 'info');
          }}
          onExportZip={handleExportZip}
          onOpenNewProjectModal={() => setIsNewProjectModalOpen(true)}
          webSearchActive={webSearchActive}
          onToggleWebSearch={() => setWebSearchActive((v) => !v)}
          hasApiKey={hasApiKey}
          isDark={isDark}
          onToggleTheme={handleToggleTheme}
          onOpenCatalog={() => setCurrentView('models')}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          currentUser={userAccount}
          models={supportedModels}
          onToggleMobileMenu={() => setIsMobileDrawerOpen((v) => !v)}
          isMobileMenuOpen={isMobileDrawerOpen}
        />

        {/* Mobile Slide-Over Drawer */}
        {isMobileDrawerOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
              onClick={() => setIsMobileDrawerOpen(false)}
            />
            <div className="relative z-10 w-72 h-full bg-[#0c0c10] shadow-2xl flex flex-col">
              <Sidebar
                currentView={currentView}
                onViewChange={(v) => {
                  setCurrentView(v);
                  setIsMobileDrawerOpen(false);
                }}
                projects={projects}
                activeProject={activeProject}
                onSelectProject={(p) => {
                  setActiveProject(p);
                  setIsMobileDrawerOpen(false);
                }}
                onNewProject={() => {
                  setIsNewProjectModalOpen(true);
                  setIsMobileDrawerOpen(false);
                }}
                onDeleteProject={handleDeleteProject}
                hasApiKey={hasApiKey}
                onOpenCommandPalette={() => {
                  setIsCommandPaletteOpen(true);
                  setIsMobileDrawerOpen(false);
                }}
                onOpenAuthModal={() => {
                  setIsAuthModalOpen(true);
                  setIsMobileDrawerOpen(false);
                }}
                currentUser={userAccount}
                onCloseMobile={() => setIsMobileDrawerOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Main Workspace Frame */}
        <div className="flex-1 min-h-0 flex overflow-hidden pb-14 md:pb-0">
          {/* Desktop Sidebar */}
          <div className="hidden md:flex h-full shrink-0">
            <Sidebar
              currentView={currentView}
              onViewChange={setCurrentView}
              projects={projects}
              activeProject={activeProject}
              onSelectProject={(p) => {
                setActiveProject(p);
                notify(`Proyecto activo: ${p.name}`, 'info');
              }}
              onNewProject={() => setIsNewProjectModalOpen(true)}
              onDeleteProject={handleDeleteProject}
              hasApiKey={hasApiKey}
              onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
              currentUser={userAccount}
            />
          </div>

          {/* Main View Router */}
          <main className="flex-1 min-w-0 min-h-0 flex overflow-hidden relative">
            {/* HOME */}
            {currentView === 'home' && (
              <HomeView
                onViewChange={setCurrentView}
                activeProject={activeProject}
                projects={projects}
                onSelectProject={(p) => setActiveProject(p)}
                onOpenNewProjectModal={() => setIsNewProjectModalOpen(true)}
                onExportZip={handleExportZip}
                onQuickPrompt={handleQuickPrompt}
                hasApiKey={hasApiKey}
                webSearchActive={webSearchActive}
              />
            )}

            {/* CHAT */}
            {currentView === 'chat' && (
              <ChatView
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isAiLoading}
                webSearchActive={webSearchActive}
                onToggleWebSearch={() => setWebSearchActive((v) => !v)}
                activeProject={activeProject}
                onOpenProjectFile={handleOpenFileInWorkspace}
                onExportZip={handleExportZip}
                onApproveAction={handleApproveAction}
                onRejectAction={handleRejectAction}
                onClearChat={handleClearChat}
                selectedModel={selectedModel}
                onOpenModelCatalog={() => setCurrentView('models')}
                lastFallbackInfo={lastFallbackInfo}
              />
            )}

            {/* MODELS CATALOG */}
            {currentView === 'models' && (
              <ModelsCatalogView
                models={supportedModels}
                selectedModel={selectedModel}
                onSelectModel={(id) => {
                  setSelectedModel(id);
                  notify(`Modelo activo: ${id}`, 'info');
                }}
                onLaunchCompare={handleLaunchCompare}
                onRefreshDiscovery={refreshModelsDiscovery}
                isRefreshing={isRefreshingDiscovery}
              />
            )}

            {/* COMPARE ARENA */}
            {currentView === 'compare' && (
              <ModelCompareView
                models={supportedModels}
                initialSelectedModels={compareInitialModels}
                onSelectWinningModel={(id) => {
                  setSelectedModel(id);
                  notify(`Modelo ganador activado como predeterminado: ${id}`, 'success');
                }}
              />
            )}

            {/* PROMPTS LIBRARY */}
            {currentView === 'prompts' && (
              <PromptLibraryView
                prompts={prompts}
                onAddPrompt={(p) => {
                  setPrompts((prev) => [p, ...prev]);
                  notify('Plantilla de prompt guardada.', 'success');
                }}
                onDeletePrompt={(id) => {
                  setPrompts((prev) => prev.filter((p) => p.id !== id));
                  notify('Prompt eliminado.', 'info');
                }}
                onToggleFavorite={(id) => {
                  setPrompts((prev) =>
                    prev.map((p) => (p.id === id ? { ...p, isFavorite: !p.isFavorite } : p))
                  );
                }}
                onExecutePromptInChat={handleQuickPrompt}
              />
            )}

            {/* APK & ANDROID MOBILE CENTER */}
            {currentView === 'apk' && <ApkBuilderView onNotify={notify} />}

            {/* CLOUDFLARE PAGES & DOMAIN CENTER */}
            {currentView === 'deploy' && <CloudflareDeployView onNotify={notify} />}

            {/* VISION & MULTIMODAL STUDIO */}
            {currentView === 'vision' && (
              <VisionStudioView onNotify={notify} onSendToChat={handleQuickPrompt} />
            )}

            {/* DOCUMENTS DEEP ANALYZER */}
            {currentView === 'documents' && (
              <DocumentsView onNotify={notify} onSendToChat={handleQuickPrompt} />
            )}

            {/* CODE WORKSPACE */}
            {currentView === 'code' && (
              activeProject ? (
                <CodeEditorView
                  project={activeProject}
                  onUpdateProject={handleUpdateProject}
                  onExportZip={handleExportZip}
                  onAskKiranToEdit={handleAskKiranToEdit}
                  isAiGenerating={isAiLoading}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Code2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Ningún proyecto activo seleccionado</h3>
                  <p className="text-sm text-zinc-400 max-w-md">
                    Selecciona un proyecto desde la barra lateral o crea uno nuevo para comenzar a editar y previsualizar código en vivo.
                  </p>
                  <button
                    onClick={() => {
                      if (projects.length > 0) {
                        setActiveProject(projects[0]);
                      } else {
                        setIsNewProjectModalOpen(true);
                      }
                    }}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                  >
                    {projects.length > 0 ? `Abrir ${projects[0].name}` : 'Crear nuevo proyecto'}
                  </button>
                </div>
              )
            )}

            {/* SOLVE DIAGNOSTICS */}
            {currentView === 'solve' && (
              <SolveView
                onRunSolve={handleRunSolve}
                activeProject={activeProject}
                onApplySolutionToProject={handleApplySolutionToProject}
              />
            )}

            {/* BILLING & PLANS */}
            {currentView === 'billing' && (
              <BillingView
                usageInfo={usageInfo}
                onPlanChanged={() => {
                  refreshUsage();
                  setUserAccount(StorageService.getUserAccount());
                }}
                onNotify={notify}
              />
            )}

            {/* ADMIN CONSOLE */}
            {currentView === 'admin' && <AdminView onNotify={notify} />}

            {/* SETTINGS */}
            {currentView === 'settings' && (
              <SettingsView
                preferences={userPrefs}
                userAccount={userAccount}
                models={supportedModels}
                onUpdatePreferences={setUserPrefs}
                onUpdateAccount={setUserAccount}
                onNotify={notify}
                onNavigateToBilling={() => setCurrentView('billing')}
              />
            )}

            {/* TOOLS */}
            {currentView === 'tools' && (
              <ToolsView
                webSearchActive={webSearchActive}
                onToggleWebSearch={() => setWebSearchActive((v) => !v)}
              />
            )}

            {/* PERMISSIONS */}
            {currentView === 'permissions' && (
              <PermissionsCenter
                pendingActions={pendingActions}
                onApproveAction={handleApproveAction}
                onRejectAction={handleRejectAction}
                autoApproveSafe={autoApproveSafe}
                onToggleAutoApproveSafe={setAutoApproveSafe}
              />
            )}

            {/* MEMORY */}
            {currentView === 'memory' && (
              <MemoryView
                memoryItems={memoryItems}
                onAddMemory={handleAddMemory}
                onDeleteMemory={handleDeleteMemory}
                onUpdateMemory={handleUpdateMemory}
                activeProject={activeProject}
              />
            )}

            {/* AUTOMATIONS */}
            {currentView === 'automations' && <AutomationsView />}

            {/* UI COMPONENTS */}
            {currentView === 'components' && (
              <UIComponentsView
                isDark={isDark}
                onToggleTheme={handleToggleTheme}
              />
            )}
          </main>
        </div>

        {/* Mobile Fixed Bottom Navigation Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-[#0a0a10]/95 backdrop-blur-lg border-t border-[#232334] z-40 flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)] select-none">
          <button
            onClick={() => setCurrentView('home')}
            className={`flex flex-col items-center gap-0.5 text-[10px] cursor-pointer transition-colors ${
              currentView === 'home' ? 'text-purple-400 font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Inicio</span>
          </button>
          <button
            onClick={() => setCurrentView('chat')}
            className={`flex flex-col items-center gap-0.5 text-[10px] cursor-pointer transition-colors ${
              currentView === 'chat' ? 'text-purple-400 font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Chat</span>
          </button>
          <button
            onClick={() => setCurrentView('code')}
            className={`flex flex-col items-center gap-0.5 text-[10px] cursor-pointer transition-colors ${
              currentView === 'code' ? 'text-purple-400 font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Código</span>
          </button>
          <button
            onClick={() => setCurrentView('apk')}
            className={`flex flex-col items-center gap-0.5 text-[10px] cursor-pointer transition-colors ${
              currentView === 'apk' ? 'text-cyan-300 font-bold' : 'text-cyan-400/80 hover:text-cyan-300'
            }`}
          >
            <Smartphone className="w-4 h-4 text-cyan-400" />
            <span>App APK</span>
          </button>
          <button
            onClick={() => setCurrentView('vision')}
            className={`flex flex-col items-center gap-0.5 text-[10px] cursor-pointer transition-colors ${
              currentView === 'vision' ? 'text-purple-400 font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Visión</span>
          </button>
          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className="flex flex-col items-center gap-0.5 text-[10px] text-zinc-400 hover:text-white cursor-pointer"
          >
            <Menu className="w-4 h-4" />
            <span>Menú</span>
          </button>
        </nav>

        {/* Global Command Palette (Ctrl+K) */}
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onViewChange={setCurrentView}
          models={supportedModels}
          onSelectModel={(id) => {
            setSelectedModel(id);
            notify(`Modelo activo: ${id}`, 'info');
          }}
          activeProject={activeProject}
          onExportZip={handleExportZip}
          onOpenNewProject={() => setIsNewProjectModalOpen(true)}
        />

        {/* User Account / Auth Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          currentUser={userAccount}
          onUserLoggedIn={(u) => {
            setUserAccount(u);
            refreshUsage();
          }}
          onNotify={notify}
        />

        {/* Model Catalog Quick Modal */}
        <ModelCatalogModal
          isOpen={isModelCatalogOpen}
          onClose={() => setIsModelCatalogOpen(false)}
          models={supportedModels}
          selectedModel={selectedModel}
          onSelectModel={(id) => {
            setSelectedModel(id);
            notify(`Modelo activo cambiado a "${id}".`, 'info');
          }}
          lastFallbackInfo={lastFallbackInfo}
        />

        {/* New Project Scaffolding Modal */}
        <NewProjectModal
          isOpen={isNewProjectModalOpen}
          onClose={() => setIsNewProjectModalOpen(false)}
          onCreateProject={handleCreateProject}
          onGenerateWithAi={handleGenerateScaffoldWithAi}
          isGenerating={isAiLoading}
        />
      </div>
    </div>
  );
}
