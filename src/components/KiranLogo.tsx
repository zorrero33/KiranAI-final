import React from 'react';

interface KiranLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  variant?: 'emblem' | 'horizontal' | 'app-icon';
  withText?: boolean;
  withTagline?: boolean;
  className?: string;
  glow?: boolean;
  animated?: boolean;
  onClick?: () => void;
}

export const KiranLogo: React.FC<KiranLogoProps> = ({
  size = 'md',
  variant = 'emblem',
  withText = false,
  withTagline = false,
  className = '',
  glow = true,
  animated = false,
  onClick,
}) => {
  const sizeMap = {
    xs: { box: 'w-6 h-6', textSize: 'text-sm', badge: 'text-[9px] px-1 py-0.2' },
    sm: { box: 'w-8 h-8', textSize: 'text-base', badge: 'text-[10px] px-1.5 py-0.5' },
    md: { box: 'w-10 h-10', textSize: 'text-lg', badge: 'text-xs px-2 py-0.5' },
    lg: { box: 'w-14 h-14', textSize: 'text-2xl', badge: 'text-xs px-2.5 py-1' },
    xl: { box: 'w-20 h-20', textSize: 'text-3xl', badge: 'text-sm px-3 py-1' },
    hero: { box: 'w-24 h-24 sm:w-28 sm:h-28', textSize: 'text-3xl sm:text-4xl', badge: 'text-xs px-2.5 py-1' },
  };

  const currentSize = sizeMap[size];

  // Pure SVG Emblem Matching the exact KiranAI uploaded brand mark
  const EmblemSvg = (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      <defs>
        <linearGradient id="kiranRibbonMain" x1="15%" y1="85%" x2="90%" y2="15%">
          <stop offset="0%" stopColor="#161556" />
          <stop offset="25%" stopColor="#3b2d9d" />
          <stop offset="50%" stopColor="#7c3aed" />
          <stop offset="75%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#00d8f6" />
        </linearGradient>

        <linearGradient id="kiranWingCyan" x1="30%" y1="70%" x2="100%" y2="10%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="45%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#00f2fe" />
        </linearGradient>

        <linearGradient id="kiranBgSquircle" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0a0d24" />
          <stop offset="50%" stopColor="#070918" />
          <stop offset="100%" stopColor="#04050d" />
        </linearGradient>

        <filter id="kiranGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="16" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* If app-icon variant, render the rounded dark container matching the left icon */}
      {variant === 'app-icon' && (
        <>
          <rect
            x="16"
            y="16"
            width="480"
            height="480"
            rx="112"
            ry="112"
            fill="url(#kiranBgSquircle)"
            stroke="rgba(99, 102, 241, 0.28)"
            strokeWidth="3"
          />
          <circle cx="280" cy="256" r="140" fill="#7c3aed" opacity="0.18" filter="url(#kiranGlowFilter)" />
          <circle cx="340" cy="190" r="110" fill="#00d8f6" opacity="0.15" filter="url(#kiranGlowFilter)" />
        </>
      )}

      {/* Emblem geometric paths */}
      <g transform={variant === 'app-icon' ? 'translate(48, 48) scale(0.8125)' : 'translate(0, 0)'}>
        {/* 1. Left Vertical Stem */}
        <path d="M 100,50 L 155,50 L 155,462 L 100,462 Z" fill="url(#kiranRibbonMain)" />

        {/* 2. Upper Dynamic Wing (Curving to cyan tip) */}
        <path
          d="M 155,256 C 185,210 230,150 295,102 C 350,62 405,50 448,50 C 448,78 428,115 394,148 C 338,202 272,256 215,298 L 155,256 Z"
          fill="url(#kiranWingCyan)"
        />

        {/* 3. Lower Dynamic Wing (Curving down to tip) */}
        <path
          d="M 155,256 C 185,302 230,362 295,410 C 350,450 405,462 448,462 C 448,434 428,397 394,364 C 338,310 272,256 215,214 L 155,256 Z"
          fill="url(#kiranRibbonMain)"
        />

        {/* 4. Upper Diagonal Crossing Ribbon */}
        <path
          d="M 155,372 L 332,198 C 352,178 368,166 384,156 L 350,128 C 332,142 312,162 290,184 L 155,316 Z"
          fill="url(#kiranWingCyan)"
          opacity="0.95"
        />

        {/* 5. Lower Diagonal Crossing Ribbon */}
        <path
          d="M 155,140 L 332,314 C 352,334 368,346 384,356 L 350,384 C 332,370 312,350 290,328 L 155,196 Z"
          fill="url(#kiranRibbonMain)"
        />

        {/* 6. Central Intersecting Diamond Core */}
        <path d="M 242,256 L 282,216 L 322,256 L 282,296 Z" fill="url(#kiranWingCyan)" opacity="0.92" />
      </g>
    </svg>
  );

  const [imageError, setImageError] = React.useState(false);

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* Emblem Icon with optional Glow */}
      <div className="relative group shrink-0">
        {glow && (
          <div
            className={`absolute -inset-1 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-400 opacity-40 blur-md group-hover:opacity-75 transition duration-500 pointer-events-none ${
              animated ? 'animate-pulse' : ''
            }`}
          />
        )}

        <div
          className={`relative ${currentSize.box} rounded-xl overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105 duration-300 shadow-lg shadow-indigo-950/40 border border-white/10`}
        >
          {!imageError ? (
            <img
              src="/kiran-logo.jpg"
              alt="Kiran AI Logo"
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            EmblemSvg
          )}
        </div>
      </div>

      {/* Brand Typography */}
      {withText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-tight ${currentSize.textSize} text-white font-sans`}
            >
              Kiran<span className="text-[#00d4ff] font-extrabold">AI</span>
            </span>
            <span
              className={`rounded-full bg-cyan-950/70 text-cyan-300 border border-cyan-500/30 font-mono font-semibold tracking-wider uppercase ${currentSize.badge}`}
            >
              PRO
            </span>
          </div>
          {withTagline && (
            <span className="text-[11px] text-zinc-400 font-medium tracking-normal -mt-0.5">
              Autonomous AI Operating System
            </span>
          )}
        </div>
      )}
    </div>
  );
};
