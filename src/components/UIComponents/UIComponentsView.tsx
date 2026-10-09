import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  Terminal,
  ShieldCheck,
  RefreshCw,
  Layers,
  ArrowRight,
  Sun,
  Moon,
  Copy,
  Check,
  Palette,
} from 'lucide-react';

interface UIComponentsViewProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

export const UIComponentsView: React.FC<UIComponentsViewProps> = ({
  isDark,
  onToggleTheme,
}) => {
  const [clickCount, setClickCount] = useState(0);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const tokens = [
    { name: 'bg-background', var: '--background', desc: 'Main canvas background' },
    { name: 'bg-card', var: '--card', desc: 'Card containers and panels' },
    { name: 'bg-primary', var: '--primary', desc: 'Brand accent & high priority CTA' },
    { name: 'bg-secondary', var: '--secondary', desc: 'Subdued action buttons & badges' },
    { name: 'bg-muted', var: '--muted', desc: 'Secondary backgrounds & disabled' },
    { name: 'bg-destructive', var: '--destructive', desc: 'Errors, warnings and destructive' },
  ];

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] bg-background text-foreground overflow-y-auto p-4 md:p-8 select-none">
      <div className="max-w-5xl mx-auto w-full space-y-8 pb-16">
        {/* Header */}
        <div className="border-b border-border pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-sm">
                <Layers className="h-4 w-4" />
              </div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">
                Design System & shadcn/ui Suite
              </h1>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">
              Component verification, theme palette tokens, interactive testing, and Radix UI primitives.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleTheme}
              className="gap-2 font-mono text-xs"
            >
              {isDark ? (
                <>
                  <Sun className="h-4 w-4 text-amber-500" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 text-slate-700" />
                  <span>Dark Mode</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Verification Status Banner */}
        <div className="p-4 rounded-xl border border-border bg-card/60 backdrop-blur flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold font-mono text-foreground flex items-center gap-2">
                <span>SHADCN/UI ENGINE: COMPILED & ACTIVE</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Vite + React 19 + TypeScript + Tailwind CSS v4 + Class Variance Authority.
              </div>
            </div>
          </div>
          <div className="text-xs font-mono text-muted-foreground hidden sm:block">
            Target: <code>@/components/ui/button</code>
          </div>
        </div>

        {/* Variants Showcase */}
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                Button Component Variants
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Checking semantic theme tokens: default (primary), secondary, destructive, outline, ghost, and link.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
              <Layers className="h-4 w-4 text-primary" />
              <span>&lt;Button variant=&quot;...&quot; /&gt;</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="default">
              <Sparkles className="h-4 w-4" />
              Default (Primary)
            </Button>

            <Button variant="secondary">Secondary</Button>

            <Button variant="destructive">Destructive</Button>

            <Button variant="outline">Outline</Button>

            <Button variant="ghost">Ghost</Button>

            <Button variant="link">Link Style</Button>
          </div>
        </section>

        {/* Sizes and States */}
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                Sizes & Interactive States
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Testing small (sm), default, large (lg), icon-only variants and reactive click dispatchers.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small (sm)</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large (lg)</Button>
              <Button size="icon" variant="outline" title="Terminal Icon Button">
                <Terminal className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="secondary" title="Sparkles Icon Button">
                <Sparkles className="h-4 w-4" />
              </Button>
            </div>

            <div className="pt-4 border-t border-border flex flex-wrap items-center gap-4">
              <Button
                onClick={() => setClickCount((prev) => prev + 1)}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Click Test: {clickCount} {clickCount === 1 ? 'click' : 'clicks'}
              </Button>

              <Button disabled variant="outline">
                Disabled State
              </Button>

              <Button variant="default" className="gap-2">
                Launch System
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* Theme Token Palette Check */}
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-base font-semibold tracking-tight flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" />
                <span>Theme Token Palette Check</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Verifying background, card, primary, secondary, muted, and destructive variables in current theme ({isDark ? 'Dark' : 'Light'}).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-2">
            {tokens.map((token) => (
              <div
                key={token.name}
                onClick={() => handleCopyToken(token.name)}
                className="p-3 rounded-lg border border-border bg-card hover:border-primary/50 cursor-pointer flex flex-col justify-between h-24 text-xs transition-colors group"
              >
                <div>
                  <div className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                    <span className="truncate">{token.name}</span>
                    {copiedToken === token.name ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                    {token.var}
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground line-clamp-1">
                  {token.desc}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
