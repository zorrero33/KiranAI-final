import React, { useState } from 'react';
import { UserPreferences, UserAccount, ModelOption } from '../../types';
import { StorageService } from '../../services/storage';
import {
  Settings,
  User,
  Sliders,
  Key,
  Shield,
  Download,
  Trash2,
  Check,
  Save,
  CreditCard,
  Sparkles,
  Volume2,
} from 'lucide-react';

interface SettingsViewProps {
  preferences: UserPreferences;
  userAccount: UserAccount;
  models: ModelOption[];
  onUpdatePreferences: (prefs: UserPreferences) => void;
  onUpdateAccount: (acc: UserAccount) => void;
  onNotify: (msg: string, type: 'info' | 'success' | 'warn') => void;
  onNavigateToBilling: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  preferences,
  userAccount,
  models,
  onUpdatePreferences,
  onUpdateAccount,
  onNotify,
  onNavigateToBilling,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'ai' | 'byok' | 'data'>('profile');
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  // Form states
  const [userName, setUserName] = useState(userAccount.name || preferences.userName);
  const [userEmail, setUserEmail] = useState(userAccount.email || preferences.userEmail || '');
  const [activeModel, setActiveModel] = useState(preferences.activeModel);
  const [detailLevel, setDetailLevel] = useState(preferences.detailLevel || 'balanced');
  const [autoApproveSafe, setAutoApproveSafe] = useState(preferences.autoApproveSafeActions);
  const [autoSpeak, setAutoSpeak] = useState(preferences.autoSpeakResponse ?? false);
  const [customSystemPrompt, setCustomSystemPrompt] = useState(preferences.customSystemInstruction || '');
  const [customApiKey, setCustomApiKey] = useState(preferences.customApiKey || '');

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedPrefs: UserPreferences = {
      ...preferences,
      userName: userName.trim(),
      userEmail: userEmail.trim(),
      activeModel,
      detailLevel,
      autoApproveSafeActions: autoApproveSafe,
      autoSpeakResponse: autoSpeak,
      customSystemInstruction: customSystemPrompt.trim(),
      customApiKey: customApiKey.trim(),
    };

    const updatedAccount: UserAccount = {
      ...userAccount,
      name: userName.trim(),
      email: userEmail.trim(),
    };

    onUpdatePreferences(updatedPrefs);
    onUpdateAccount(updatedAccount);
    StorageService.saveUserPreferences(updatedPrefs);
    StorageService.saveUserAccount(updatedAccount);

    onNotify('Configuración guardada correctamente.', 'success');
  };

  const handleExportData = () => {
    const jsonStr = StorageService.exportAllPlatformData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kirania-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onNotify('Copia de seguridad descargada en JSON.', 'success');
  };

  const handleClearCache = () => {
    localStorage.removeItem('kiranai_chat_messages_v1');
    localStorage.removeItem('kiranai_chat_conversations_v1');
    setShowConfirmClear(false);
    onNotify('Caché de conversaciones limpiada con éxito.', 'info');
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] bg-[#09090b] overflow-y-auto p-4 md:p-8 select-none">
      <div className="max-w-5xl mx-auto w-full space-y-6 pb-20">
        {/* Header */}
        <div className="border-b border-[#272732] pb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-600/50 flex items-center justify-center p-[1px] shadow-lg">
              <Settings className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Configuración del Sistema & Preferencias
              </h1>
              <p className="text-xs md:text-sm text-zinc-400">
                Personaliza la identidad del agente, claves de API, opciones de inferencia y respaldos.
              </p>
            </div>
          </div>

          <button
            onClick={handleSaveAll}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-semibold shadow-md transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Cambios</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#272732] gap-2 pb-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-all ${
              activeTab === 'profile'
                ? 'bg-purple-950/80 border border-purple-600/60 text-purple-200 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white bg-[#121217]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Perfil & Cuenta</span>
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-all ${
              activeTab === 'ai'
                ? 'bg-purple-950/80 border border-purple-600/60 text-purple-200 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white bg-[#121217]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Preferencias de IA</span>
          </button>
          <button
            onClick={() => setActiveTab('byok')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-all ${
              activeTab === 'byok'
                ? 'bg-purple-950/80 border border-purple-600/60 text-purple-200 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white bg-[#121217]'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Claves API (BYOK)</span>
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-all ${
              activeTab === 'data'
                ? 'bg-purple-950/80 border border-purple-600/60 text-purple-200 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white bg-[#121217]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Datos & Privacidad</span>
          </button>
        </div>

        {/* Content Tabs */}
        {activeTab === 'profile' && (
          <div className="p-6 rounded-2xl bg-[#0e0e14] border border-[#272732] space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#22222d] pb-4">
              <div>
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  INFORMACIÓN DEL USUARIO
                </h3>
                <p className="text-xs text-zinc-400">Datos asociados a tus proyectos y directivas.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-purple-950 text-purple-300 border border-purple-700 font-semibold uppercase">
                  Plan {userAccount.currentPlan}
                </span>
                <button
                  onClick={onNavigateToBilling}
                  className="text-xs font-mono text-purple-400 hover:text-purple-300 underline"
                >
                  Gestionar Plan
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-mono uppercase text-zinc-400 block mb-1">Nombre Completo</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-[#14141c] border border-[#272732] rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-purple-600"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono uppercase text-zinc-400 block mb-1">Email Profesional</label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full bg-[#14141c] border border-[#272732] rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-purple-600"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#14141c] border border-[#272732] flex items-center justify-between">
              <div>
                <span className="font-semibold text-xs text-white block mb-0.5">Rol de Cuenta</span>
                <span className="text-[11px] text-zinc-500">
                  {userAccount.role === 'admin' ? 'Administrador con acceso a telemetría root' : 'Usuario estándar'}
                </span>
              </div>
              <span className="text-xs font-mono text-purple-300 font-semibold uppercase">
                {userAccount.role}
              </span>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="p-6 rounded-2xl bg-[#0e0e14] border border-[#272732] space-y-6 shadow-xl">
            <div className="border-b border-[#22222d] pb-4">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                COMPORTAMIENTO DEL MOTOR DE INTELIGENCIA
              </h3>
              <p className="text-xs text-zinc-400">Ajusta el modelo predeterminado y las instrucciones globales.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-mono uppercase text-zinc-400 block mb-1">
                  Modelo Predeterminado para Chat y Generación
                </label>
                <select
                  value={activeModel}
                  onChange={(e) => setActiveModel(e.target.value)}
                  className="w-full bg-[#14141c] border border-[#272732] rounded-xl p-3 text-xs text-zinc-200 font-mono focus:outline-none focus:border-purple-600"
                >
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.provider})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-zinc-400 block mb-1">
                  Nivel de Detalle en las Respuestas
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['concise', 'balanced', 'comprehensive'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setDetailLevel(lvl)}
                      className={`p-3 rounded-xl border text-xs font-mono text-center capitalize transition-all ${
                        detailLevel === lvl
                          ? 'bg-purple-950/80 border-purple-600 text-purple-200 font-semibold'
                          : 'bg-[#14141c] border-[#272732] text-zinc-400 hover:text-white'
                      }`}
                    >
                      {lvl === 'concise' ? 'Conciso' : lvl === 'balanced' ? 'Equilibrado' : 'Exhaustivo'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-zinc-400 block mb-1">
                  Instrucción del Sistema Personalizada (Global)
                </label>
                <textarea
                  value={customSystemPrompt}
                  onChange={(e) => setCustomSystemPrompt(e.target.value)}
                  placeholder="Ej: Responde siempre en español con tono futurista. Prefiere TypeScript estricto con interfaces en lugar de types..."
                  rows={3}
                  className="w-full bg-[#14141c] border border-[#272732] rounded-xl p-3 text-xs text-zinc-100 focus:outline-none focus:border-purple-600 resize-none font-mono"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#14141c] border border-[#272732]">
                <div>
                  <span className="font-semibold text-xs text-white block">Lectura de Voz Automática (TTS)</span>
                  <span className="text-[11px] text-zinc-500">
                    Sintetiza la respuesta por voz tan pronto como la IA termine de emitir texto.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSpeak}
                    onChange={(e) => setAutoSpeak(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'byok' && (
          <div className="p-6 rounded-2xl bg-[#0e0e14] border border-[#272732] space-y-6 shadow-xl">
            <div className="border-b border-[#22222d] pb-4">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                BRING YOUR OWN KEY (BYOK)
              </h3>
              <p className="text-xs text-zinc-400">
                Si deseas usar tus propias cuotas corporativas de proveedores en lugar de las compartidas por el gateway.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-mono uppercase text-zinc-400 block mb-1">
                  Clave de API de Usuario (Opcional)
                </label>
                <input
                  type="password"
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-[#14141c] border border-[#272732] rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-purple-600"
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  Las claves configuradas aquí se almacenan únicamente de forma local en tu navegador y nunca se transmiten a bases de datos públicas.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="p-6 rounded-2xl bg-[#0e0e14] border border-[#272732] space-y-6 shadow-xl">
            <div className="border-b border-[#22222d] pb-4">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                GESTIÓN DE DATOS & PRIVACIDAD
              </h3>
              <p className="text-xs text-zinc-400">Control total y exportación soberana de tus activos.</p>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#14141c] border border-[#272732] flex items-center justify-between">
                <div>
                  <span className="font-semibold text-xs text-white block">Copia de Seguridad Completa (JSON)</span>
                  <span className="text-[11px] text-zinc-500">
                    Descarga todos tus proyectos, archivos de código, memorias, conversaciones y prompts en un único archivo.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleExportData}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#181822] hover:bg-[#20202c] border border-[#272732] text-xs font-mono text-zinc-200 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-purple-400" />
                  <span>Exportar Datos</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="font-semibold text-xs text-rose-300 block">Zona de Mantenimiento / Caché</span>
                  <span className="text-[11px] text-zinc-500">
                    Limpia sesiones de chat temporales y datos en caché si notas degradación.
                  </span>
                </div>
                {showConfirmClear ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-rose-300 font-mono">¿Confirmar limpieza?</span>
                    <button
                      type="button"
                      onClick={handleClearCache}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold font-mono transition-colors"
                    >
                      Sí, Limpiar
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowConfirmClear(false)}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-300 text-xs font-mono transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowConfirmClear(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-900/40 hover:bg-rose-800/60 border border-rose-700/60 text-xs font-mono text-rose-200 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Limpiar Caché</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
