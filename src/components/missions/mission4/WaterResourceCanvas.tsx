import React from 'react';
import { Flame, Radar, Snowflake, Sun } from 'lucide-react';
import { CommanderProfile } from '../../../types/game';
import { AstroCompanion } from '../../engine/AstroCompanion';
import { CommanderSprite } from '../../engine/CommanderSprite';
import { PlanetaryWaterZone, WaterZoneId } from './waterResourceService';

interface WaterResourceCanvasProps {
  destination: 'moon' | 'mars';
  commander: CommanderProfile;
  zones: PlanetaryWaterZone[];
  selectedZoneId: WaterZoneId;
  scannedIds: WaterZoneId[];
  drillDepth: number; // 0..100
  drillHeat: number; // 0..100
  drillJammed: boolean;
  radarSweeping: boolean;
  onSelectZone: (id: WaterZoneId) => void;
}

export const WaterResourceCanvas: React.FC<WaterResourceCanvasProps> = ({
  destination,
  commander,
  zones,
  selectedZoneId,
  scannedIds,
  drillDepth,
  drillHeat,
  drillJammed,
  radarSweeping,
  onSelectZone,
}) => {
  const isMoon = destination === 'moon';
  const selectedIndex = Math.max(0, zones.findIndex((z) => z.id === selectedZoneId));
  const selectedZone = zones[selectedIndex] ?? zones[0];
  const isSelectedScanned = scannedIds.includes(selectedZone.id);

  // X positions for the 3 side-by-side underground columns
  const columnCenters = [180, 500, 820];
  const activeRigX = columnCenters[selectedIndex] ?? 500;

  return (
    <div
      className={`relative h-[400px] sm:h-[450px] w-full overflow-hidden rounded-2xl border-2 select-none shadow-2xl ${
        isMoon ? 'border-slate-500/60 bg-[#050711]' : 'border-orange-500/50 bg-[#2C1108]'
      }`}
    >
      {/* Surface Sky + Underground X-Ray Cross-Section SVG */}
      <svg
        viewBox="0 0 1000 500"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="m4XraySky" x1="0" y1="0" x2="0" y2="1">
            {isMoon ? (
              <>
                <stop offset="0%" stopColor="#020308" />
                <stop offset="100%" stopColor="#121726" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#5C2210" />
                <stop offset="100%" stopColor="#B85629" />
              </>
            )}
          </linearGradient>
          <linearGradient id="m4Underground" x1="0" y1="0" x2="0" y2="1">
            {isMoon ? (
              <>
                <stop offset="0%" stopColor="#4B5263" />
                <stop offset="40%" stopColor="#2E3440" />
                <stop offset="100%" stopColor="#141821" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#A94922" />
                <stop offset="45%" stopColor="#6D2A12" />
                <stop offset="100%" stopColor="#381408" />
              </>
            )}
          </linearGradient>
        </defs>

        {/* Top Sky */}
        <rect x="0" y="0" width="1000" height="190" fill="url(#m4XraySky)" />

        {isMoon ? (
          <g>
            {[
              [70, 38], [210, 28], [350, 60], [520, 32], [680, 52], [850, 34],
            ].map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r="1.5" fill="#FFFFFF" opacity="0.85" />
            ))}
            <circle cx="115" cy="110" r="24" fill="#FEF08A" opacity="0.9" />
            <circle cx="115" cy="110" r="46" fill="#FDE047" opacity="0.16" />
            <path d="M0,185 L160,152 L340,178 L520,145 L720,178 L880,145 L1000,180 L1000,195 L0,195 Z" fill="#323846" />
          </g>
        ) : (
          <g>
            <circle cx="145" cy="70" r="22" fill="#FDE68A" opacity="0.65" />
            <path d="M0,185 L140,142 L280,142 L340,178 L530,178 L600,136 L740,136 L800,178 L920,148 L1000,182 L1000,195 L0,195 Z" fill="#732B13" />
          </g>
        )}

        {/* Underground Cross-Section Earth/Rock */}
        <rect x="0" y="185" width="1000" height="315" fill="url(#m4Underground)" />

        {/* Surface Horizon Crust Line */}
        <line x1="0" y1="185" x2="1000" y2="185" stroke={isMoon ? '#94A3B8' : '#FB923C'} strokeWidth="4" />

        {/* Sector Dividers Underground */}
        <line x1="340" y1="185" x2="340" y2="500" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="6 6" opacity="0.2" />
        <line x1="660" y1="185" x2="660" y2="500" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="6 6" opacity="0.2" />

        {/* Revealed Underground Deposits (visible once scanned!) */}
        {zones.map((z, idx) => {
          const cx = columnCenters[idx];
          const scanned = scannedIds.includes(z.id);
          if (!scanned) {
            return (
              <g key={z.id} opacity="0.35">
                <rect x={cx - 105} y="250" width="210" height="170" rx="14" fill="#0F172A" stroke="#64748B" strokeWidth="2" strokeDasharray="8 6" />
                <text x={cx} y="340" textAnchor="middle" fill="#94A3B8" fontSize="16" fontWeight="bold">
                  ? NOT SCANNED ?
                </text>
              </g>
            );
          }

          if (z.isOptimalSource) {
            return (
              <g key={z.id}>
                {/* Rich Cyan Ice Vein Layer */}
                <path
                  d={`M${cx - 120},315 Q${cx},285 ${cx + 120},320 L${cx + 125},420 Q${cx},440 ${cx - 125},415 Z`}
                  fill="#0EA5E9"
                  fillOpacity="0.45"
                  stroke="#38BDF8"
                  strokeWidth="3"
                />
                <path
                  d={`M${cx - 85},340 Q${cx},320 ${cx + 85},345 L${cx + 75},395 Q${cx},405 ${cx - 75},390 Z`}
                  fill="#BAE6FD"
                  fillOpacity="0.6"
                />
                <text x={cx} y="372" textAnchor="middle" fill="#FFFFFF" fontSize="15" fontWeight="bold">
                  ICE LAYER!
                </text>
              </g>
            );
          }

          if (z.rawWaterYield > 0) {
            return (
              <g key={z.id}>
                {/* Small Mineral / Clay / Frost Pockets */}
                <ellipse cx={cx - 35} cy="325" rx="42" ry="18" fill="#D97706" opacity="0.55" stroke="#FBBF24" strokeWidth="2" />
                <ellipse cx={cx + 40} cy="360" rx="34" ry="15" fill="#38BDF8" opacity="0.35" stroke="#7DD3FC" strokeWidth="1.5" />
                <text x={cx} y="415" textAnchor="middle" fill="#FDE68A" fontSize="13" fontWeight="bold">
                  Low ice ({z.rawWaterYield}%)
                </text>
              </g>
            );
          }

          return (
            <g key={z.id}>
              {/* Dry Rock & Dust */}
              <ellipse cx={cx} cy="335" rx="85" ry="30" fill={isMoon ? '#334155' : '#9A3412'} opacity="0.7" />
              <text x={cx} y="340" textAnchor="middle" fill="#FCA5A5" fontSize="14" fontWeight="bold">
                0% Ice (Dry)
              </text>
            </g>
          );
        })}

        {/* Radar Scan Cone when sweeping */}
        {radarSweeping && (
          <polygon
            points={`${activeRigX},135 ${activeRigX - 135},435 ${activeRigX + 135},435`}
            fill="#38BDF8"
            fillOpacity="0.24"
            stroke="#7DD3FC"
            strokeWidth="2"
          />
        )}

        {/* Active Drilling Rig & Descending Bit */}
        <g transform={`translate(${activeRigX}, 185)`}>
          {/* Rig Tower */}
          <rect x="-26" y="-55" width="52" height="55" rx="6" fill="#E2E8F0" stroke="#0F172A" strokeWidth="2.5" />
          <rect x="-14" y="-44" width="28" height="16" rx="3" fill={drillJammed ? '#EF4444' : '#38BDF8'} />
          {/* Drill Shaft descending up to +200px based on drillDepth */}
          <rect
            x="-6"
            y="0"
            width="12"
            height={Math.max(12, drillDepth * 2.05)}
            fill={drillHeat > 75 ? '#EF4444' : '#FACC15'}
            stroke="#0F172A"
            strokeWidth="2"
          />
          <polygon
            points={`-11,${Math.max(12, drillDepth * 2.05)} 11,${Math.max(12, drillDepth * 2.05)} 0,${Math.max(28, drillDepth * 2.05 + 18)}`}
            fill="#CBD5E1"
            stroke="#0F172A"
            strokeWidth="2"
          />
        </g>
      </svg>

      {/* Top HUD Tags */}
      <div className="pointer-events-none absolute inset-x-3 top-3 z-20 flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-lg border border-white/25 bg-black/70 px-3 py-1 text-xs font-bold text-white">
          {isMoon ? 'Lunar Polar Radar (PSR)' : 'Mars Subsurface Radar (SHARAD)'}
        </span>
        {isSelectedScanned && (
          <span className="rounded-lg border border-sky-300/60 bg-sky-950/90 px-3 py-1 text-xs font-bold text-sky-200">
            Ground: {selectedZone.tempLabel} · {selectedZone.yieldLabel}
          </span>
        )}
      </div>

      {/* 3 Clickable Surface Sector Buttons positioned right above each underground column */}
      {zones.map((z, idx) => {
        const leftPct = idx === 0 ? 18 : idx === 1 ? 50 : 82;
        const active = selectedZoneId === z.id;
        const scanned = scannedIds.includes(z.id);
        return (
          <button
            key={z.id}
            type="button"
            onClick={() => onSelectZone(z.id)}
            style={{ left: `${leftPct}%`, top: '24%' }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center rounded-2xl border-2 px-3 py-2 text-xs font-bold shadow-xl transition-transform ${
              active
                ? 'border-amber-300 bg-[#2E1856]/95 text-white scale-110 ring-4 ring-amber-300/30'
                : 'border-white/60 bg-black/75 text-purple-100 hover:border-sky-300 hover:scale-105'
            }`}
          >
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              {z.isOptimalSource ? (
                <Snowflake className="h-4 w-4 text-sky-300" />
              ) : idx === 0 ? (
                <Sun className="h-4 w-4 text-amber-300" />
              ) : (
                <Radar className="h-4 w-4 text-orange-300" />
              )}
              <span>{z.shortName}</span>
            </span>
            <span className="mt-0.5 text-[10px] font-semibold text-sky-200">
              {scanned ? z.yieldLabel : 'Tap to Scan'}
            </span>
          </button>
        );
      })}

      {/* Drill Heat Indicator if drilling */}
      {drillDepth > 0 && (
        <div className="pointer-events-none absolute right-3 bottom-3 z-20 flex items-center gap-2 rounded-xl border border-white/20 bg-black/75 px-3 py-1.5 text-xs font-bold">
          <Flame className={`h-4 w-4 ${drillHeat >= 75 ? 'text-rose-400' : 'text-amber-300'}`} />
          <span className="text-white">Drill Heat: {drillHeat}%</span>
        </div>
      )}

      {/* Commander & ASTRO */}
      <div className="pointer-events-none absolute bottom-3 left-4 z-20 flex items-end gap-2">
        <CommanderSprite profile={commander} size={58} />
        <AstroCompanion
          mood={drillJammed ? 'alert' : selectedZone.isOptimalSource && isSelectedScanned ? 'happy' : 'curious'}
          showCaptions={false}
          size={42}
        />
      </div>
    </div>
  );
};
