import React from 'react';
import {
  AlertTriangle,
  BatteryCharging,
  Cpu,
  Home,
  Shield,
  Sun,
  Wrench,
} from 'lucide-react';
import { CommanderProfile, Vec2 } from '../../../types/game';
import { AstroCompanion } from '../../engine/AstroCompanion';
import { CommanderSprite } from '../../engine/CommanderSprite';

export type M2StructureId = 'solar' | 'sensors' | 'habitat' | 'battery';

export interface M2StructureState {
  id: M2StructureId;
  label: string;
  pos: Vec2;
  shielded: boolean;
  permanentShield?: boolean;
  damaged: boolean;
  dustLevel: number; // 0..100
}

interface MarsStormCanvasProps {
  destination: 'moon' | 'mars';
  commander: CommanderProfile;
  structures: M2StructureState[];
  targetedId: M2StructureId | null;
  solarFlareActive: boolean;
  roverPosPct: number;
  roverActive: boolean;
  lastHitFeedback: { id: M2StructureId; text: string; tone: 'good' | 'bad' } | null;
  reducedStimuli: boolean;
  onStructureClick: (id: M2StructureId) => void;
}

export const MarsStormCanvas: React.FC<MarsStormCanvasProps> = ({
  destination,
  commander,
  structures,
  targetedId,
  solarFlareActive,
  roverPosPct,
  roverActive,
  lastHitFeedback,
  reducedStimuli,
  onStructureClick,
}) => {
  const isMoon = destination === 'moon';

  const renderIcon = (id: M2StructureId) => {
    if (id === 'solar') return <Sun className="h-6 w-6 text-amber-300" />;
    if (id === 'sensors') return <Cpu className="h-6 w-6 text-sky-300" />;
    if (id === 'habitat') return <Home className="h-6 w-6 text-emerald-300" />;
    return <BatteryCharging className="h-6 w-6 text-violet-300" />;
  };

  return (
    <div
      className={`relative h-[390px] sm:h-[440px] w-full overflow-hidden rounded-2xl border-2 select-none shadow-2xl ${
        isMoon ? 'border-slate-500/60 bg-[#050711]' : 'border-orange-500/50 bg-[#2C1108]'
      }`}
    >
      {/* Environment SVG */}
      <svg
        viewBox="0 0 1000 500"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="m2DefenseSky" x1="0" y1="0" x2="0" y2="1">
            {isMoon ? (
              <>
                <stop offset="0%" stopColor="#020308" />
                <stop offset="100%" stopColor={solarFlareActive ? '#2C1B3D' : '#141926'} />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#4F1B0A" />
                <stop offset="100%" stopColor="#9C4018" />
              </>
            )}
          </linearGradient>
          <linearGradient id="m2DefenseGround" x1="0" y1="0" x2="0" y2="1">
            {isMoon ? (
              <>
                <stop offset="0%" stopColor="#586070" />
                <stop offset="100%" stopColor="#2A2F3A" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#B84F23" />
                <stop offset="100%" stopColor="#692610" />
              </>
            )}
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="1000" height="205" fill="url(#m2DefenseSky)" />

        {isMoon ? (
          <g>
            {[
              [80, 35], [160, 72], [270, 30], [380, 82], [490, 44], [610, 28],
              [700, 78], [890, 45], [940, 88],
            ].map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r="1.6" fill="#FFFFFF" opacity="0.85" />
            ))}
            <circle cx="835" cy="64" r="20" fill="#0284C7" stroke="#7DD3FC" strokeWidth="1.5" />
            <path d="M825,58 Q834,52 844,62 Q837,72 827,68 Z" fill="#34D399" opacity="0.85" />
            {solarFlareActive && (
              <g opacity={reducedStimuli ? 0.35 : 0.7}>
                <circle cx="145" cy="55" r="46" fill="#FACC15" opacity="0.22" />
                <circle cx="145" cy="55" r="22" fill="#FEF08A" opacity="0.9" />
                <path
                  d="M165,70 Q360,115 620,165 M160,82 Q330,145 500,190"
                  fill="none"
                  stroke="#FDE047"
                  strokeWidth="3"
                  strokeDasharray="10 8"
                />
              </g>
            )}
            <path d="M0,192 L150,158 L320,188 L500,152 L690,185 L860,156 L1000,185 L1000,210 L0,210 Z" fill="#323846" />
          </g>
        ) : (
          <g>
            <circle cx="155" cy="65" r="24" fill="#FDE68A" opacity="0.2" />
            <path d="M0,192 L120,145 L240,145 L300,185 L490,185 L560,138 L700,138 L760,182 L910,155 L1000,185 L1000,210 L0,210 Z" fill="#732B13" />
          </g>
        )}

        <rect x="0" y="190" width="1000" height="310" fill="url(#m2DefenseGround)" />
        <ellipse cx="150" cy="400" rx="85" ry="26" fill={isMoon ? '#393F4D' : '#7C2D12'} opacity="0.55" />
        <ellipse cx="860" cy="410" rx="95" ry="30" fill={isMoon ? '#393F4D' : '#7C2D12'} opacity="0.55" />

        {/* Power Conduits */}
        <path
          d="M180,285 L400,245 L620,285 L820,245"
          fill="none"
          stroke={isMoon ? '#38BDF8' : '#FACC15'}
          strokeWidth="4"
          strokeDasharray="10 6"
          opacity="0.55"
        />

        {/* Animated Cleaning Rover */}
        <g
          transform={`translate(${roverPosPct * 10}, 365)`}
          style={{ transition: 'transform 650ms cubic-bezier(0.16, 1, 0.3, 1)' }}
        >
          <rect x="-26" y="-16" width="52" height="20" rx="6" fill="#E2E8F0" stroke="#0F172A" strokeWidth="2.5" />
          <rect x="-14" y="-25" width="28" height="11" rx="3" fill="#38BDF8" stroke="#0F172A" strokeWidth="1.5" />
          <circle cx="-15" cy="8" r="7" fill="#1E293B" stroke="#94A3B8" strokeWidth="2" />
          <circle cx="15" cy="8" r="7" fill="#1E293B" stroke="#94A3B8" strokeWidth="2" />
          {roverActive && (
            <circle cx="32" cy="-4" r="14" fill={isMoon ? '#38BDF8' : '#FB923C'} opacity="0.6" />
          )}
        </g>
      </svg>

      {/* Atmospheric Dust Storm Overlay (MARS ONLY) */}
      {!isMoon && !reducedStimuli && (
        <div
          className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
          style={{ backgroundColor: 'rgba(180, 68, 22, 0.28)' }}
        >
          <div className="absolute inset-x-0 top-14 h-0.5 bg-orange-200/35 animate-pulse" />
          <div className="absolute inset-x-0 top-32 h-1 bg-amber-200/25 animate-pulse" />
        </div>
      )}

      {/* Top Arena Title */}
      <div className="pointer-events-none absolute left-3 top-3 z-20">
        <span className="rounded-lg border border-white/25 bg-black/65 px-3 py-1 text-xs font-bold text-white">
          {isMoon ? 'Moon · Solar Flare & Electric Dust' : 'Mars · Red Dust Storm'}
        </span>
      </div>

      {/* 4 Big Interactive Base Modules */}
      {structures.map((st) => {
        const isTargeted = targetedId === st.id;
        return (
          <button
            key={st.id}
            type="button"
            onClick={() => onStructureClick(st.id)}
            style={{ left: `${st.pos.x}%`, top: `${st.pos.y}%` }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center transition-transform hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-amber-300`}
          >
            {/* Incoming Danger Target Ring! */}
            {isTargeted && (
              <div
                className={`pointer-events-none absolute -inset-3 rounded-3xl border-4 border-rose-400 ${
                  reducedStimuli ? '' : 'animate-ping'
                }`}
              />
            )}

            <div
              className={`relative flex h-16 w-16 sm:h-18 sm:w-18 items-center justify-center rounded-2xl border-2 shadow-xl transition-all ${
                st.damaged
                  ? 'border-rose-400 bg-rose-950/95 ring-4 ring-rose-500/40'
                  : st.shielded
                    ? 'border-sky-300 bg-sky-950/90 ring-4 ring-sky-400/35'
                    : isTargeted
                      ? 'border-amber-300 bg-amber-950/95 ring-4 ring-amber-400/40'
                      : 'border-white/75 bg-[#1B0D2E]/90'
              }`}
            >
              {renderIcon(st.id)}

              {st.damaged && (
                <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white shadow">
                  <Wrench className="h-3.5 w-3.5" />
                </span>
              )}

              {!st.damaged && st.shielded && (
                <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-sky-400 text-slate-950 shadow">
                  <Shield className="h-3.5 w-3.5" />
                </span>
              )}

              {isTargeted && !st.damaged && (
                <span className="absolute -left-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-slate-950 shadow">
                  <AlertTriangle className="h-3.5 w-3.5" />
                </span>
              )}
            </div>

            <span
              className={`mt-1.5 rounded-lg border px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap shadow ${
                st.damaged
                  ? 'border-rose-400 bg-rose-600 text-white'
                  : isTargeted
                    ? 'border-amber-300 bg-amber-400 text-slate-950'
                    : st.shielded
                      ? 'border-sky-300/70 bg-sky-950/90 text-sky-200'
                      : 'border-white/25 bg-black/80 text-white'
              }`}
            >
              {st.label}
              {st.damaged
                ? ' · Repair!'
                : st.id === 'solar' && st.dustLevel >= 35
                  ? ` · Dust ${Math.round(st.dustLevel)}%`
                  : st.permanentShield
                    ? ' · Gold ✓'
                    : st.shielded
                      ? ' · Shield ON'
                      : ''}
            </span>

            {/* Floating Hit Feedback */}
            {lastHitFeedback?.id === st.id && (
              <span
                className={`mt-1 rounded-md px-2 py-0.5 text-[11px] font-extrabold shadow ${
                  lastHitFeedback.tone === 'good'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-rose-500 text-white'
                }`}
              >
                {lastHitFeedback.text}
              </span>
            )}
          </button>
        );
      })}

      {/* Commander & ASTRO */}
      <div className="pointer-events-none absolute bottom-3 left-4 z-20 flex items-end gap-2">
        <CommanderSprite profile={commander} size={58} />
        <AstroCompanion
          mood={structures.some((s) => s.damaged) || targetedId ? 'alert' : 'happy'}
          showCaptions={false}
          size={42}
        />
      </div>

      <div className="pointer-events-none absolute bottom-3 right-3 z-20 rounded-lg bg-black/65 px-2.5 py-1 text-[11px] font-semibold text-purple-100">
        Tap a module to <span className="text-sky-300 font-bold">Shield</span> or <span className="text-rose-300 font-bold">Repair</span>!
      </div>
    </div>
  );
};
