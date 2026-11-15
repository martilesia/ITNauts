import React from 'react';
import { AlertTriangle, CheckCircle2, Flame, Shield, Sun, Wind, Zap } from 'lucide-react';
import { CommanderProfile } from '../../../types/game';
import { AstroCompanion } from '../../engine/AstroCompanion';
import { CommanderSprite } from '../../engine/CommanderSprite';

export type M1Coating = 'reflective' | 'dark-metal';
export type M1Filter = 'electrostatic' | 'coarse-mesh';
export type M1LandingZone = 'deep-crater' | 'safe-plain' | 'steep-slope';

export interface M1SkyItem {
  id: string;
  kind: 'dust' | 'battery';
  x: number; // 10..90
  y: number; // 20..70
  hit: boolean;
}

interface PrepLabCanvasProps {
  destination: 'moon' | 'mars';
  commander: CommanderProfile;
  podX: number; // 8..92
  podY: number; // 10..80
  thrusting: boolean;
  coating: M1Coating;
  filter: M1Filter;
  integrity: number;
  skyItems: M1SkyItem[];
  flashMsg: { text: string; tone: 'good' | 'bad' } | null;
  landedZone: M1LandingZone | null;
  reducedStimuli: boolean;
}

export const PrepLabCanvas: React.FC<PrepLabCanvasProps> = ({
  destination,
  commander,
  podX,
  podY,
  thrusting,
  coating,
  filter,
  integrity,
  skyItems,
  flashMsg,
  landedZone,
  reducedStimuli,
}) => {
  const isMoon = destination === 'moon';
  const bodyFill = coating === 'reflective' ? '#FACC15' : '#334155';
  const bodyStroke = coating === 'reflective' ? '#FEF08A' : '#94A3B8';

  return (
    <div
      className={`relative h-[390px] sm:h-[440px] w-full overflow-hidden rounded-2xl border-2 select-none shadow-2xl ${
        isMoon ? 'border-slate-500/60 bg-[#050711]' : 'border-orange-500/45 bg-[#2A1109]'
      }`}
    >
      {/* Sky & Planetary Landing Zones SVG */}
      <svg
        viewBox="0 0 1000 500"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="m1LanderSky" x1="0" y1="0" x2="0" y2="1">
            {isMoon ? (
              <>
                <stop offset="0%" stopColor="#020308" />
                <stop offset="100%" stopColor="#141A29" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#4A1A0B" />
                <stop offset="100%" stopColor="#B85629" />
              </>
            )}
          </linearGradient>
          <linearGradient id="m1LanderGround" x1="0" y1="0" x2="0" y2="1">
            {isMoon ? (
              <>
                <stop offset="0%" stopColor="#5C6373" />
                <stop offset="100%" stopColor="#252A36" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#BC5528" />
                <stop offset="100%" stopColor="#5E210C" />
              </>
            )}
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="1000" height="390" fill="url(#m1LanderSky)" />

        {isMoon ? (
          <g>
            {[
              [80, 42], [185, 84], [310, 35], [470, 72], [640, 38], [780, 82], [910, 45],
            ].map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r="1.7" fill="#FFFFFF" opacity="0.85" />
            ))}
            <circle cx="880" cy="68" r="24" fill="#0284C7" stroke="#7DD3FC" strokeWidth="1.5" />
            <path d="M868,62 Q879,55 890,65 Q882,77 871,72 Z" fill="#34D399" opacity="0.85" />
            <circle cx="130" cy="65" r="26" fill="#FEF08A" opacity="0.25" />
          </g>
        ) : (
          <g>
            <circle cx="135" cy="70" r="24" fill="#FDE68A" opacity="0.55" />
            <path
              d="M0,370 L120,315 L230,360 L410,360 L480,320 L580,360 L790,360 L870,305 L1000,365 L1000,395 L0,395 Z"
              fill="#7C2D12"
              opacity="0.7"
            />
          </g>
        )}

        {/* Ground Base */}
        <rect x="0" y="385" width="1000" height="115" fill="url(#m1LanderGround)" />

        {/* Zone 1 (Left 0..330): Deep Dark Crater */}
        <ellipse cx="165" cy="422" rx="145" ry="38" fill="#090C14" stroke="#EF4444" strokeWidth="3" strokeDasharray="8 6" />
        <text x="165" y="428" textAnchor="middle" fill="#FCA5A5" fontSize="16" fontWeight="bold">
          ✗ Dark Crater
        </text>

        {/* Zone 2 (Center 350..650): Safe Sunlit Plateau Pad */}
        <rect x="365" y="385" width="270" height="58" rx="14" fill="#065F46" stroke="#34D399" strokeWidth="4" />
        <rect x="385" y="395" width="230" height="14" rx="6" fill="#10B981" />
        <text x="500" y="432" textAnchor="middle" fill="#D1FAE5" fontSize="17" fontWeight="bold">
          ✓ LAND HERE!
        </text>

        {/* Zone 3 (Right 670..1000): Steep Rocky Slope */}
        <path d="M670,450 L820,375 L980,450 Z" fill={isMoon ? '#475569' : '#9A3412'} stroke="#F59E0B" strokeWidth="3" />
        <text x="825" y="432" textAnchor="middle" fill="#FDE68A" fontSize="16" fontWeight="bold">
          ✗ Rocks & Slope
        </text>
      </svg>

      {/* Top Live Integrity Meter */}
      <div className="pointer-events-none absolute inset-x-3 top-3 z-20 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 rounded-xl border border-white/25 bg-black/75 px-3 py-1.5 text-xs font-bold text-white">
          <Shield className="h-4 w-4 text-amber-300" />
          <span>Integrity: {integrity}%</span>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-white/25 bg-black/75 px-3 py-1.5 text-xs font-bold text-white">
          <span className={coating === 'reflective' ? 'text-amber-300' : 'text-rose-300'}>
            {coating === 'reflective' ? 'Gold Blanket ✓' : 'Dark Metal'}
          </span>
          <span aria-hidden="true">·</span>
          <span className={filter === 'electrostatic' ? 'text-sky-300' : 'text-rose-300'}>
            {filter === 'electrostatic' ? 'Electric Filter ✓' : 'Wide Mesh'}
          </span>
        </div>
      </div>

      {/* Floating Sky Pickups (Batteries) & Hazards (Dust Clouds) */}
      {skyItems.map((item) => {
        if (item.hit) return null;
        return (
          <div
            key={item.id}
            style={{ left: `${item.x}%`, top: `${item.y}%` }}
            className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 z-15 flex items-center gap-1 rounded-full border-2 px-2.5 py-1.5 text-xs font-extrabold shadow-lg ${
              item.kind === 'battery'
                ? 'border-emerald-300 bg-emerald-950/90 text-emerald-200'
                : 'border-orange-300 bg-orange-950/90 text-orange-200'
            }`}
          >
            {item.kind === 'battery' ? (
              <>
                <Sun className="h-4 w-4 text-amber-300" />
                <span>+Energy</span>
              </>
            ) : (
              <>
                {isMoon ? <Zap className="h-4 w-4 text-sky-300" /> : <Wind className="h-4 w-4 text-orange-300" />}
                <span>Dust!</span>
              </>
            )}
          </div>
        );
      })}

      {/* Live Controlled Space Capsule */}
      <div
        className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 z-25"
        style={{
          left: `${podX}%`,
          top: `${podY}%`,
          transition: reducedStimuli ? 'none' : 'left 60ms linear, top 60ms linear',
        }}
      >
        <svg viewBox="0 0 120 120" className="h-20 w-20 sm:h-24 sm:w-24 drop-shadow-2xl">
          {/* Landing Legs */}
          <line x1="34" y1="84" x2="20" y2="104" stroke="#CBD5E1" strokeWidth="5" strokeLinecap="round" />
          <line x1="86" y1="84" x2="100" y2="104" stroke="#CBD5E1" strokeWidth="5" strokeLinecap="round" />

          {/* Thruster Flame when braking */}
          {thrusting && (
            <polygon points="48,90 72,90 60,118" fill="#F97316" stroke="#FEF08A" strokeWidth="2" />
          )}

          {/* Electric Dust Shield Halo if electrostatic filter */}
          {filter === 'electrostatic' && (
            <circle cx="60" cy="54" r="46" fill="none" stroke="#38BDF8" strokeWidth="3" strokeDasharray="8 6" opacity="0.8" />
          )}

          {/* Capsule Body */}
          <path d="M26,86 L34,36 Q60,14 86,36 L94,86 Z" fill={bodyFill} stroke={bodyStroke} strokeWidth="4" />
          {/* Window */}
          <circle cx="60" cy="54" r="14" fill="#0F172A" stroke="#FFFFFF" strokeWidth="3" />
          <circle cx="56" cy="50" r="4" fill="#38BDF8" opacity="0.85" />
        </svg>
      </div>

      {/* Flash Reaction Msg */}
      {flashMsg && (
        <div className="pointer-events-none absolute inset-x-0 top-16 z-30 flex justify-center">
          <div
            className={`inline-flex items-center gap-2 rounded-xl border-2 px-4 py-1.5 text-sm font-extrabold shadow-xl ${
              flashMsg.tone === 'good'
                ? 'border-emerald-300 bg-emerald-950/95 text-emerald-200'
                : 'border-rose-400 bg-rose-950/95 text-rose-200'
            }`}
          >
            {flashMsg.tone === 'good' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <span>{flashMsg.text}</span>
          </div>
        </div>
      )}

      {/* Commander & ASTRO watching from observation pad */}
      <div className="pointer-events-none absolute bottom-2 left-3 z-20 flex items-end gap-1.5">
        <CommanderSprite
          profile={commander}
          size={46}
          isCelebrating={landedZone === 'safe-plain'}
        />
        <AstroCompanion
          mood={landedZone === 'safe-plain' ? 'happy' : landedZone ? 'alert' : 'curious'}
          showCaptions={false}
          size={36}
        />
      </div>

      {/* Heat Warning Icon if dark-metal */}
      {coating === 'dark-metal' && !landedZone && (
        <div className="pointer-events-none absolute bottom-2 right-3 z-20 flex items-center gap-1 rounded-lg bg-rose-950/90 border border-rose-400 px-2.5 py-1 text-[11px] font-bold text-rose-200">
          <Flame className="h-3.5 w-3.5" />
          <span>Hot shield!</span>
        </div>
      )}
    </div>
  );
};
