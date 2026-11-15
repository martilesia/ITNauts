import React from 'react';
import { AstroMood } from '../../types/game';

interface AstroCompanionProps {
  mood: AstroMood;
  caption?: string | null;
  showCaptions?: boolean;
  size?: number;
  pointingTo?: 'left' | 'right' | null;
}

export const AstroCompanion: React.FC<AstroCompanionProps> = ({
  mood,
  caption,
  showCaptions = true,
  size = 62,
  pointingTo = null,
}) => {
  const isSleeping = mood === 'sleeping';
  const antennaColor =
    mood === 'alert'
      ? '#F59E0B'
      : mood === 'happy'
        ? '#10B981'
        : isSleeping
          ? '#475569'
          : '#06B6D4';

  const renderEyes = () => {
    if (isSleeping) {
      return (
        <g stroke="#64748B" strokeWidth="2.2" strokeLinecap="round">
          <line x1="22" y1="25" x2="28" y2="25" />
          <line x1="36" y1="25" x2="42" y2="25" />
        </g>
      );
    }
    if (mood === 'happy') {
      return (
        <g stroke="#34D399" strokeWidth="2.4" fill="none" strokeLinecap="round">
          <path d="M21 26 Q25 21 29 26" />
          <path d="M35 26 Q39 21 43 26" />
        </g>
      );
    }
    if (mood === 'alert') {
      return (
        <g fill="#FBBF24">
          <circle cx="25" cy="25" r="3.4" />
          <circle cx="39" cy="25" r="3.4" />
        </g>
      );
    }
    if (mood === 'encourage') {
      return (
        <g fill="#38BDF8">
          <circle cx="25" cy="25" r="3" />
          <path d="M35 25 Q39 22 43 25" stroke="#38BDF8" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </g>
      );
    }
    return (
      <g fill="#22D3EE">
        <circle cx="25" cy="25" r="3" />
        <circle cx="39" cy="25" r="3" />
        <circle cx="26" cy="24" r="1" fill="#ECFEFF" />
        <circle cx="40" cy="24" r="1" fill="#ECFEFF" />
      </g>
    );
  };

  return (
    <div className="relative select-none pointer-events-none flex flex-col items-center">
      {/* Complete ASTRO speech caption */}
      {showCaptions && caption && (
        <div
          className="mb-1.5 max-w-[380px] rounded-xl border-2 border-sky-400/60 bg-[#22103D]/95 px-3.5 py-2 text-left text-xs font-semibold leading-relaxed text-white shadow-lg"
          role="status"
          aria-live="polite"
        >
          {caption}
        </div>
      )}

      <div
        className={isSleeping ? '' : 'animate-astro-float'}
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 64 64" className="w-full h-full">
          {/* Thruster Glow */}
          {!isSleeping && (
            <ellipse
              cx="32"
              cy="56"
              rx="10"
              ry="4"
              fill={antennaColor}
              fillOpacity="0.35"
            />
          )}

          {/* Antenna */}
          <line x1="32" y1="6" x2="32" y2="14" stroke="#94A3B8" strokeWidth="2.2" />
          <circle cx="32" cy="5.5" r="3.5" fill={antennaColor} />

          {/* Main Dome Body */}
          <rect x="14" y="13" width="36" height="32" rx="13" fill="#E2E8F0" stroke="#0F172A" strokeWidth="2" />
          {/* Visor Screen */}
          <rect x="18" y="18" width="28" height="15" rx="7" fill="#0F172A" />
          {renderEyes()}

          {/* Chest Plate */}
          <rect x="24" y="36" width="16" height="5" rx="2.5" fill={antennaColor} fillOpacity="0.8" />

          {/* Side Stabilizer Arms */}
          <rect
            x="7"
            y="24"
            width="6"
            height="12"
            rx="3"
            fill="#94A3B8"
            stroke="#0F172A"
            strokeWidth="1.6"
            transform={pointingTo === 'left' ? 'rotate(38 10 28)' : undefined}
          />
          <rect
            x="51"
            y="24"
            width="6"
            height="12"
            rx="3"
            fill="#94A3B8"
            stroke="#0F172A"
            strokeWidth="1.6"
            transform={pointingTo === 'right' ? 'rotate(-38 54 28)' : undefined}
          />

          {/* Base Hover Ring */}
          <path d="M20 46 L44 46 L40 52 L24 52 Z" fill="#475569" stroke="#0F172A" strokeWidth="1.8" />
        </svg>
      </div>
    </div>
  );
};
