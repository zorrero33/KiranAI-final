import React, { useState } from 'react';
import { UserAccount } from '../../types';
import { StorageService } from '../../services/storage';
import { loginWithEmail, registerWithEmail, loginWithGoogle, AuthResult } from '../../services/api';
import {
  User,
  Lock,
  Mail,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  Github,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  onUserLoggedIn: (user: UserAccount) => void;
  onNotify: (msg: string, type: 'info' | 'success' | 'warn') => void;
}

function mapAuthResultToAccount(result: AuthResult): UserAccount {
  return {
    id: result.user.id,
    name: result.user.name || result.user.email.split('@')[0],
    email: result.user.email,
    role: result.user.role,
    currentPlan: result.user.plan as UserAccount['currentPlan'],
    createdAt: Date.now(),
    apiKeyConfigured: true,
  };
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserLoggedIn,
  onNotify,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    if (password.length < 6) {
      onNotify('La contraseña debe tener al menos 6 caracteres.', 'warn');
      return;
    }

    setIsBusy(true);
    try {
      const result =
        mode === 'login'
          ? await loginWithEmail(email.trim(), password)
          : await registerWithEmail(email.trim(), password, name.trim() || undefined);

      const account = mapAuthResultToAccount(result);
      StorageService.saveUserAccount(account);
      onUserLoggedIn(account);
      onNotify(
        mode === 'login'
          ? `Sesión iniciada. Bienvenido, ${account.name}.`
          : `Cuenta creada. Bienvenido a KiranIA, ${account.name}.`,
        'success'
      );
      onClose();
    } catch (err: any) {
      onNotify(err.message || 'No se pudo completar la autenticación.', 'warn');
    } finally {
      setIsBusy(false);
    }
  };

  const handleGoogleLogin = async () => {
    const clientId = (import.meta as any)?.env?.VITE_GOOGLE_OAUTH_CLIENT_ID as string | undefined;
    const googleIdentity = (window as any)?.google?.accounts?.id;
    if (!clientId || !googleIdentity) {
      onNotify(
        'El acceso con Google requiere configurar VITE_GOOGLE_OAUTH_CLIENT_ID (cliente OAuth) en el frontend.',
        'warn'
      );
      return;
    }

    setIsBusy(true);
    try {
      const idToken: string = await new Promise((resolve, reject) => {
        googleIdentity.initialize({
          client_id: clientId,
          callback: (response: any) => {
            if (response?.credential) resolve(response.credential);
            else reject(new Error('Google no devolvió una credencial válida.'));
          },
        });
        googleIdentity.prompt((notification: any) => {
          if (notification?.isNotDisplayed?.() || notification?.isSkippedMoment?.()) {
            reject(new Error('El acceso con Google fue cancelado o bloqueado por el navegador.'));
          }
        });
      });

      const result = await loginWithGoogle(idToken);
      const account = mapAuthResultToAccount(result);
      StorageService.saveUserAccount(account);
      onUserLoggedIn(account);
      onNotify(`Autenticado vía Google como ${account.email}.`, 'success');
      onClose();
    } catch (err: any) {
      onNotify(err.message || 'No se pudo autenticar con Google.', 'warn');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in select-none">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-[#0e0e14] border border-[#272732] rounded-2xl shadow-[0_0_60px_rgba(139,92,246,0.3)] p-6 md:p-8 text-white z-10 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#22222d] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-950/80 border border-purple-600/50 flex items-center justify-center text-purple-400">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                {mode === 'login' ? 'Iniciar Sesión en KiranIA' : 'Crear Cuenta Profesional'}
              </h3>
              <p className="text-xs text-zinc-400">Gestión de proyectos, directivas y cuotas PRO.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Social Logins */}
        <div className="space-y-2">
          <button
            type="button"
            disabled={isBusy}
            onClick={handleGoogleLogin}
            className="w-full py-2.5 px-4 rounded-xl bg-[#14141c] hover:bg-[#1a1a24] border border-[#272732] hover:border-zinc-500 text-xs font-mono text-zinc-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span className="font-bold text-purple-400">G</span>
            <span>Continuar con Google</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-600 uppercase">
          <div className="h-[1px] bg-zinc-800 flex-1" />
          <span>O mediante credenciales</span>
          <div className="h-[1px] bg-zinc-800 flex-1" />
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'register' && (
            <div>
              <label className="text-[11px] font-mono uppercase text-zinc-400 block mb-1">Nombre</label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre o alias"
                  className="w-full bg-[#14141c] border border-[#272732] rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-purple-600"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[11px] font-mono uppercase text-zinc-400 block mb-1">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@kirania.internal"
                className="w-full bg-[#14141c] border border-[#272732] rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-purple-600"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-mono uppercase text-zinc-400 block mb-1">Contraseña</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#14141c] border border-[#272732] rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-purple-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isBusy}
            className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-semibold transition-colors shadow-md mt-2 disabled:opacity-50"
          >
            {isBusy ? 'Procesando...' : mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </button>
        </form>

        {/* Mode Switcher */}
        <div className="text-center pt-2 border-t border-[#22222d] text-xs text-zinc-400">
          {mode === 'login' ? (
            <span>
              ¿No tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-purple-400 hover:text-purple-300 font-semibold underline"
              >
                Crear una ahora
              </button>
            </span>
          ) : (
            <span>
              ¿Ya tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-purple-400 hover:text-purple-300 font-semibold underline"
              >
                Inicia sesión aquí
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
