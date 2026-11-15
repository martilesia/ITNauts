import React from 'react';
import { Vec2 } from '../../types/game';

/** Maps Y arena percentage (22..88) to a natural 2.5D perspective scale (0.72..1.16). */
export function getDepthScale(yPct: number): number {
  const t = Math.max(0, Math.min(1, (yPct - 22) / 66));
  return 0.72 + t * 0.44;
}

export interface RockProp25D {
  id: string;
  x: number;
  y: number;
  scale: number;
  variant: 0 | 1 | 2;
}

export const SURFACE_ROCKS: RockProp25D[] = [
  { id: 'r1', x: 8, y: 34, scale: 0.85, variant: 0 },
  { id: 'r2', x: 91, y: 36, scale: 0.9, variant: 1 },
  { id: 'r3', x: 39, y: 42, scale: 0.75, variant: 2 },
  { id: 'r4', x: 63, y: 66, scale: 0.95, variant: 0 },
  { id: 'r5', x: 11, y: 78, scale: 1.1, variant: 1 },
  { id: 'r6', x: 89, y: 82, scale: 1.15, variant: 2 },
];

export const PlanetaryRocks25D: React.FC<{
  destination: 'mars' | 'moon';
  rocks?: RockProp25D[];
}> = ({ destination, rocks = SURFACE_ROCKS }) => {
  const isMoon = destination === 'moon';
  const topColor = isMoon ? '#CBD5E1' : '#C26A46';
  const leftColor = isMoon ? '#94A3B8' : '#8C3E22';
  const rightColor = isMoon ? '#475569' : '#4A1D0E';
  const outline = isMoon ? '#1E293B' : '#290E06';

  return (
    <>
      {rocks.map((rock) => {
        const s = getDepthScale(rock.y) * rock.scale;
        return (
          <div
            key={rock.id}
            style={{
              left: `${rock.x}%`,
              top: `${rock.y}%`,
              zIndex: Math.round(rock.y),
              transform: `translate(-50%, -50%) scale(${s})`,
            }}
            className="pointer-events-none absolute select-none"
          >
            <svg width="56" height="40" viewBox="0 0 56 40" className="overflow-visible">
              {/* Ground Cast Shadow */}
              <ellipse cx="31" cy="33" rx="22" ry="6.5" fill="#000000" fillOpacity="0.48" />
              {rock.variant === 0 && (
                <g stroke={outline} strokeWidth="1.2" strokeLinejoin="round">
                  <polygon points="8,30 16,13 30,10 35,21 24,32" fill={leftColor} />
                  <polygon points="16,13 30,10 42,16 35,21" fill={topColor} />
                  <polygon points="30,10 42,16 46,29 35,32 24,32 35,21" fill={rightColor} />
                  <polygon points="40,32 45,24 51,26 50,33" fill={leftColor} />
                </g>
              )}
              {rock.variant === 1 && (
                <g stroke={outline} strokeWidth="1.2" strokeLinejoin="round">
                  <polygon points="6,31 13,18 27,15 29,32" fill={leftColor} />
                  <polygon points="13,18 27,15 39,19 28,23" fill={topColor} />
                  <polygon points="27,15 39,19 47,30 29,32" fill={rightColor} />
                </g>
              )}
              {rock.variant === 2 && (
                <g stroke={outline} strokeWidth="1.2" strokeLinejoin="round">
                  <polygon points="10,31 15,20 26,18 28,32" fill={leftColor} />
                  <polygon points="15,20 26,18 33,22 25,25" fill={topColor} />
                  <polygon points="26,18 33,22 36,31 28,32" fill={rightColor} />
                  <polygon points="34,32 39,23 47,25 48,32" fill={rightColor} />
                </g>
              )}
            </svg>
          </div>
        );
      })}
    </>
  );
};

/** Perspective elliptical ground ring under interactive 2.5D props */
export const GroundRing25D: React.FC<{
  active?: boolean;
  done?: boolean;
  urgent?: boolean;
  size?: number;
}> = ({ active = false, done = false, urgent = false, size = 76 }) => {
  const ringColor = done
    ? '#34D399'
    : active
      ? '#FDE047'
      : urgent
        ? '#FB923C'
        : '#38BDF8';
  return (
    <div
      style={{ width: size, height: size * 0.42 }}
      className="pointer-events-none relative flex items-center justify-center"
    >
      <div
        className="h-full w-full rounded-full transition-all duration-200"
        style={{
          border: `2px ${active ? 'solid' : 'dashed'} ${ringColor}`,
          background: active
            ? `radial-gradient(circle, ${ringColor}40, transparent 70%)`
            : 'rgba(0,0,0,0.38)',
          boxShadow: active ? `0 0 18px ${ringColor}77` : '0 4px 12px rgba(0,0,0,0.55)',
        }}
      />
    </div>
  );
};

/** 2.5D Volumetric Field Equipment for Mission 1 */
export const FieldProp25D: React.FC<{
  kind: 'console' | 'modis' | 'merra2' | 'srtm' | 'gpm' | 'smap';
  active: boolean;
  powered: boolean;
}> = ({ kind, active, powered }) => {
  const glow = active ? '#34D399' : powered ? '#38BDF8' : '#64748B';
  return (
    <svg width="68" height="62" viewBox="0 0 68 62" className="overflow-visible drop-shadow-[0_6px_8px_rgba(0,0,0,0.55)]">
      {/* Ground Contact Shadow */}
      <ellipse cx="36" cy="54" rx="22" ry="7" fill="#000000" fillOpacity="0.5" />
      {kind === 'console' && (
        <g>
          {/* Tilted Solar Wing */}
          <polygon points="10,20 30,12 34,26 14,34" fill="#0284C7" stroke="#0F172A" strokeWidth="1.5" />
          <line x1="16" y1="18" x2="20" y2="31" stroke="#7DD3FC" strokeWidth="1" />
          <line x1="23" y1="15" x2="27" y2="28" stroke="#7DD3FC" strokeWidth="1" />
          {/* 2.5D Console Pedestal */}
          <polygon points="28,28 42,22 54,28 40,34" fill="#CBD5E1" stroke="#0F172A" strokeWidth="1.4" />
          <polygon points="28,28 40,34 40,52 28,46" fill="#64748B" stroke="#0F172A" strokeWidth="1.4" />
          <polygon points="40,34 54,28 54,46 40,52" fill="#334155" stroke="#0F172A" strokeWidth="1.4" />
          <polygon points="31,26 42,21 51,25 40,30" fill={powered ? '#FACC15' : '#1E293B'} />
        </g>
      )}
      {kind === 'modis' && (
        <g>
          {/* Tripod Legs */}
          <line x1="34" y1="28" x2="20" y2="52" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
          <line x1="34" y1="28" x2="48" y2="52" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
          <line x1="34" y1="28" x2="34" y2="55" stroke="#64748B" strokeWidth="3" strokeLinecap="round" />
          {/* 2.5D Thermal Camera Box */}
          <polygon points="20,18 34,12 48,18 34,24" fill="#FB923C" stroke="#0F172A" strokeWidth="1.4" />
          <polygon points="20,18 34,24 34,35 20,29" fill="#EA580C" stroke="#0F172A" strokeWidth="1.4" />
          <polygon points="34,24 48,18 48,29 34,35" fill="#9A3412" stroke="#0F172A" strokeWidth="1.4" />
          <circle cx="42" cy="26" r="4" fill="#FDE047" stroke="#0F172A" strokeWidth="1.2" />
        </g>
      )}
      {kind === 'merra2' && (
        <g>
          {/* Aerosol Tower Pedestal */}
          <polygon points="24,42 34,37 44,42 34,47" fill="#94A3B8" stroke="#0F172A" strokeWidth="1.3" />
          <polygon points="24,42 34,47 34,54 24,49" fill="#475569" stroke="#0F172A" strokeWidth="1.3" />
          <polygon points="34,47 44,42 44,49 34,54" fill="#334155" stroke="#0F172A" strokeWidth="1.3" />
          <rect x="31" y="16" width="6" height="26" rx="2" fill="#E2E8F0" stroke="#0F172A" strokeWidth="1.3" />
          <ellipse cx="34" cy="14" rx="12" ry="5" fill="#22D3EE" stroke="#0F172A" strokeWidth="1.3" />
          <circle cx="34" cy="10" r="3.5" fill={glow} />
        </g>
      )}
      {kind === 'srtm' && (
        <g>
          {/* Radar Dish Mast */}
          <polygon points="26,44 34,40 42,44 34,48" fill="#64748B" stroke="#0F172A" strokeWidth="1.3" />
          <rect x="32" y="24" width="4" height="22" fill="#94A3B8" stroke="#0F172A" strokeWidth="1.2" />
          <ellipse cx="34" cy="19" rx="15" ry="9" transform="rotate(-20 34 19)" fill="#E2E8F0" stroke="#0F172A" strokeWidth="1.5" />
          <ellipse cx="34" cy="19" rx="9" ry="5" transform="rotate(-20 34 19)" fill="#34D399" fillOpacity="0.4" />
          <line x1="34" y1="19" x2="43" y2="11" stroke="#0F172A" strokeWidth="1.6" />
          <circle cx="43" cy="11" r="2.8" fill={glow} />
        </g>
      )}
      {kind === 'gpm' && (
        <g>
          {/* Cryo Water/Ice Tank */}
          <ellipse cx="34" cy="48" rx="14" ry="5.5" fill="#1E293B" stroke="#0F172A" strokeWidth="1.4" />
          <rect x="20" y="22" width="28" height="26" fill="#0EA5E9" fillOpacity="0.85" stroke="#0F172A" strokeWidth="1.4" />
          <ellipse cx="34" cy="22" rx="14" ry="5.5" fill="#7DD3FC" stroke="#0F172A" strokeWidth="1.4" />
          <rect x="24" y="28" width="6" height="16" rx="2" fill="#E0F2FE" fillOpacity="0.55" />
          <circle cx="34" cy="14" r="3" fill={glow} />
        </g>
      )}
      {kind === 'smap' && (
        <g>
          {/* Soil Core Probe Rig */}
          <polygon points="22,38 34,32 46,38 34,44" fill="#2DD4BF" stroke="#0F172A" strokeWidth="1.3" />
          <polygon points="22,38 34,44 34,51 22,45" fill="#0F766E" stroke="#0F172A" strokeWidth="1.3" />
          <polygon points="34,44 46,38 46,45 34,51" fill="#115E59" stroke="#0F172A" strokeWidth="1.3" />
          <rect x="31.5" y="14" width="5" height="25" fill="#E2E8F0" stroke="#0F172A" strokeWidth="1.3" />
          <polygon points="31.5,50 36.5,50 34,58" fill="#FACC15" stroke="#0F172A" strokeWidth="1.2" />
          <circle cx="34" cy="13" r="3.5" fill={glow} />
        </g>
      )}
    </svg>
  );
};

/** 2.5D Volumetric Structures for Mission 2 */
export const Mission2Prop25D: React.FC<{
  kind: 'breakers' | 'toolbox' | 'purifier' | 'solar' | 'greenhouse';
  done: boolean;
  dustPct?: number;
}> = ({ kind, done, dustPct = 0 }) => {
  return (
    <svg width="74" height="66" viewBox="0 0 74 66" className="overflow-visible drop-shadow-[0_8px_10px_rgba(0,0,0,0.6)]">
      <ellipse cx="38" cy="56" rx="24" ry="7.5" fill="#000000" fillOpacity="0.5" />
      {kind === 'breakers' && (
        <g>
          <polygon points="20,18 36,11 52,18 36,25" fill="#CBD5E1" stroke="#0F172A" strokeWidth="1.4" />
          <polygon points="20,18 36,25 36,52 20,45" fill="#475569" stroke="#0F172A" strokeWidth="1.4" />
          <polygon points="36,25 52,18 52,45 36,52" fill="#1E293B" stroke="#0F172A" strokeWidth="1.4" />
          <rect x="24" y="26" width="8" height="14" rx="1.5" fill={done ? '#34D399' : '#FACC15'} stroke="#0F172A" />
          <circle cx="44" cy="29" r="3" fill={done ? '#34D399' : '#FB7185'} />
        </g>
      )}
      {kind === 'toolbox' && (
        <g>
          <polygon points="18,32 36,24 54,32 36,40" fill="#FACC15" stroke="#0F172A" strokeWidth="1.5" />
          <polygon points="18,32 36,40 36,53 18,45" fill="#EAB308" stroke="#0F172A" strokeWidth="1.5" />
          <polygon points="36,40 54,32 54,45 36,53" fill="#A16207" stroke="#0F172A" strokeWidth="1.5" />
          <path d="M30,27 L30,21 L42,21 L42,27" fill="none" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
        </g>
      )}
      {kind === 'purifier' && (
        <g>
          <ellipse cx="36" cy="50" rx="16" ry="6" fill="#1E293B" stroke="#0F172A" strokeWidth="1.4" />
          <rect x="20" y="20" width="32" height="30" fill="#64748B" stroke="#0F172A" strokeWidth="1.4" />
          <ellipse cx="36" cy="20" rx="16" ry="6" fill="#CBD5E1" stroke="#0F172A" strokeWidth="1.4" />
          <circle cx="36" cy="35" r="7" fill={done ? '#10B981' : '#F43F5E'} stroke="#0F172A" strokeWidth="1.5" />
          <path d="M32,35 L40,35 M36,31 L36,39" stroke="#FFFFFF" strokeWidth="2" />
        </g>
      )}
      {kind === 'solar' && (
        <g>
          {/* Stand */}
          <rect x="33" y="34" width="6" height="20" fill="#475569" stroke="#0F172A" strokeWidth="1.3" />
          {/* Tilted Dual Solar Wing */}
          <polygon points="10,28 38,14 62,24 34,38" fill="#0369A1" stroke="#E0F2FE" strokeWidth="1.5" />
          <line x1="24" y1="21" x2="48" y2="31" stroke="#38BDF8" strokeWidth="1" />
          <line x1="20" y1="33" x2="48" y2="19" stroke="#38BDF8" strokeWidth="1" />
          {/* Dust Coat */}
          {dustPct > 15 && (
            <polygon
              points="10,28 38,14 62,24 34,38"
              fill="#9A3412"
              fillOpacity={Math.min(0.8, dustPct / 100)}
            />
          )}
        </g>
      )}
      {kind === 'greenhouse' && (
        <g>
          {/* Geodesic Base Ring */}
          <ellipse cx="37" cy="48" rx="22" ry="8" fill="#334155" stroke="#0F172A" strokeWidth="1.5" />
          {/* Plants inside */}
          <circle cx="30" cy="44" r="5" fill="#10B981" />
          <circle cx="38" cy="42" r="6" fill="#34D399" />
          <circle cx="45" cy="45" r="4.5" fill="#059669" />
          {/* Dome Shell: Transparent Glass OR Armored Closed Shield */}
          <path
            d="M15,48 A22,26 0 0 1 59,48 Z"
            fill={done ? '#64748B' : '#38BDF8'}
            fillOpacity={done ? 0.9 : 0.32}
            stroke={done ? '#34D399' : '#BAE6FD'}
            strokeWidth="1.8"
          />
          {done && (
            <path d="M22,36 L52,36 M18,43 L56,43" stroke="#34D399" strokeWidth="1.5" strokeDasharray="3 2" />
          )}
        </g>
      )}
    </svg>
  );
};

/** 2.5D Isometric Rover Vehicle */
export const Rover25D: React.FC<{
  facing: 'left' | 'right';
  slope: 'flat' | 'moderate' | 'steep' | 'crater';
  isMoving?: boolean;
  size?: number;
}> = ({ facing, slope, isMoving = false, size = 86 }) => {
  const tilt = slope === 'steep' ? (facing === 'right' ? -9 : 9) : 0;
  return (
    <div
      style={{
        width: size,
        height: size * 0.72,
        transform: `scaleX(${facing === 'left' ? -1 : 1}) rotate(${tilt}deg)`,
        transition: 'transform 160ms ease-out',
      }}
    >
      <svg viewBox="0 0 96 68" className="h-full w-full overflow-visible drop-shadow-[0_6px_8px_rgba(0,0,0,0.5)]">
        {/* Back Far Wheels */}
        <ellipse cx="32" cy="40" rx="6.5" ry="7.5" fill="#0F172A" stroke="#64748B" strokeWidth="1.5" />
        <ellipse cx="64" cy="36" rx="6.5" ry="7.5" fill="#0F172A" stroke="#64748B" strokeWidth="1.5" />
        {/* 2.5D Chassis: Top Deck + Side Body + Front Nose */}
        <polygon points="18,30 56,22 76,28 38,37" fill="#F8FAFC" stroke="#0F172A" strokeWidth="1.6" />
        <polygon points="18,30 38,37 38,48 18,41" fill="#94A3B8" stroke="#0F172A" strokeWidth="1.6" />
        <polygon points="38,37 76,28 76,39 38,48" fill="#CBD5E1" stroke="#0F172A" strokeWidth="1.6" />
        {/* Angled Solar Panel Top */}
        <polygon points="22,28 50,21 63,25 35,32" fill="#0284C7" stroke="#0F172A" strokeWidth="1.3" />
        <line x1="33" y1="25" x2="46" y2="29" stroke="#7DD3FC" strokeWidth="1" />
        {/* Camera Mast */}
        <rect x="61" y="13" width="3.5" height="14" fill="#475569" stroke="#0F172A" strokeWidth="1.1" />
        <polygon points="58,10 68,8 71,13 61,15" fill="#E2E8F0" stroke="#0F172A" strokeWidth="1.2" />
        <circle cx="67" cy="12" r="2.2" fill="#22D3EE" />
        {/* Headlight Beam */}
        <circle cx="74" cy="33" r="3" fill="#FDE047" />
        {/* Near 3 Wheels */}
        <g>
          <ellipse cx="26" cy="47" rx="7.5" ry="8.5" fill="#1E293B" stroke="#94A3B8" strokeWidth="2" />
          <circle cx="26" cy="47" r="2.8" fill={isMoving ? '#22D3EE' : '#64748B'} />
          <ellipse cx="47" cy="44" rx="7.5" ry="8.5" fill="#1E293B" stroke="#94A3B8" strokeWidth="2" />
          <circle cx="47" cy="44" r="2.8" fill={isMoving ? '#22D3EE' : '#64748B'} />
          <ellipse cx="68" cy="40" rx="7.5" ry="8.5" fill="#1E293B" stroke="#94A3B8" strokeWidth="2" />
          <circle cx="68" cy="40" r="2.8" fill={isMoving ? '#22D3EE' : '#64748B'} />
        </g>
      </svg>
    </div>
  );
};

/** 2.5D Isometric Base Modules for Mission 3 */
export const BaseModule25D: React.FC<{
  type: 'habitat' | 'solar' | 'comms' | 'garage';
  accentColor: string;
}> = ({ type, accentColor }) => (
  <svg width="70" height="62" viewBox="0 0 70 62" className="overflow-visible drop-shadow-[0_8px_10px_rgba(0,0,0,0.6)]">
    <ellipse cx="36" cy="52" rx="24" ry="8" fill="#000000" fillOpacity="0.52" />
    {type === 'habitat' && (
      <g>
        <ellipse cx="35" cy="46" rx="22" ry="8" fill="#334155" stroke="#0F172A" strokeWidth="1.5" />
        <path d="M13,46 A22,22 0 0 1 57,46 Z" fill="#E2E8F0" stroke="#0F172A" strokeWidth="1.5" />
        <path d="M25,27 Q35,34 45,27" fill="none" stroke={accentColor} strokeWidth="3" strokeLinecap="round" />
        <rect x="30" y="38" width="10" height="10" rx="2" fill="#0EA5E9" stroke="#0F172A" strokeWidth="1.2" />
      </g>
    )}
    {type === 'solar' && (
      <g>
        <rect x="32" y="32" width="6" height="18" fill="#475569" stroke="#0F172A" strokeWidth="1.3" />
        <polygon points="10,27 36,13 60,23 34,37" fill="#0284C7" stroke={accentColor} strokeWidth="1.8" />
        <line x1="22" y1="20" x2="48" y2="30" stroke="#BAE6FD" strokeWidth="1" />
        <line x1="20" y1="32" x2="48" y2="18" stroke="#BAE6FD" strokeWidth="1" />
      </g>
    )}
    {type === 'comms' && (
      <g>
        <polygon points="24,44 35,39 46,44 35,49" fill="#475569" stroke="#0F172A" strokeWidth="1.4" />
        <polygon points="31,42 35,14 39,42" fill="#CBD5E1" stroke="#0F172A" strokeWidth="1.3" />
        <ellipse cx="35" cy="18" rx="13" ry="7" transform="rotate(-22 35 18)" fill="#F8FAFC" stroke={accentColor} strokeWidth="1.8" />
        <circle cx="35" cy="11" r="3" fill={accentColor} />
      </g>
    )}
    {type === 'garage' && (
      <g>
        <polygon points="14,28 35,19 56,28 35,37" fill="#CBD5E1" stroke="#0F172A" strokeWidth="1.4" />
        <polygon points="14,28 35,37 35,51 14,42" fill="#64748B" stroke="#0F172A" strokeWidth="1.4" />
        <polygon points="35,37 56,28 56,42 35,51" fill="#334155" stroke="#0F172A" strokeWidth="1.4" />
        <polygon points="39,39 52,33 52,43 39,49" fill="#0F172A" stroke={accentColor} strokeWidth="1.4" />
      </g>
    )}
  </svg>
);

/** 2.5D Geological Mineral Cluster for Mission 3 */
export const CrystalSample25D: React.FC<{ color: string }> = ({ color }) => (
  <svg width="46" height="44" viewBox="0 0 46 44" className="overflow-visible drop-shadow-[0_5px_6px_rgba(0,0,0,0.5)]">
    <ellipse cx="24" cy="36" rx="15" ry="5" fill="#000000" fillOpacity="0.48" />
    <polygon points="12,34 16,14 23,11 26,34" fill={color} stroke="#0F172A" strokeWidth="1.3" />
    <polygon points="22,34 26,18 33,16 34,35" fill={color} fillOpacity="0.82" stroke="#0F172A" strokeWidth="1.3" />
    <polygon points="17,15 22,12 22,22" fill="#FFFFFF" fillOpacity="0.55" />
  </svg>
);

/** 2.5D Water & Ice Cryo-Tank Station for Mission 4 & Biodome Garden for Mission 5 */
export const BiodomePlot25D: React.FC<{
  soilPrepared: boolean;
  sensorPlaced: boolean;
  reservoirPlaced: boolean;
  plantHealthy: boolean;
  seedsPlanted: boolean;
}> = ({ soilPrepared, sensorPlaced, reservoirPlaced, plantHealthy, seedsPlanted }) => (
  <svg width="96" height="68" viewBox="0 0 96 68" className="overflow-visible drop-shadow-[0_10px_14px_rgba(0,0,0,0.65)]">
    <ellipse cx="48" cy="56" rx="38" ry="11" fill="#000000" fillOpacity="0.55" />
    {/* 2.5D Raised Planter Bed */}
    <polygon points="14,42 48,28 82,42 48,56" fill={soilPrepared ? '#5C3A21' : '#475569'} stroke="#0F172A" strokeWidth="1.6" />
    <polygon points="14,42 48,56 48,62 14,48" fill="#334155" stroke="#0F172A" strokeWidth="1.5" />
    <polygon points="48,56 82,42 82,48 48,62" fill="#1E293B" stroke="#0F172A" strokeWidth="1.5" />
    {/* Moisture Sensor Stake */}
    {sensorPlaced && (
      <g>
        <rect x="64" y="25" width="3.5" height="17" fill="#CBD5E1" stroke="#0F172A" strokeWidth="1" />
        <circle cx="65.7" cy="24" r="3.5" fill="#22D3EE" stroke="#0F172A" strokeWidth="1" />
      </g>
    )}
    {/* Water Reservoir Tank */}
    {reservoirPlaced && (
      <g>
        <rect x="19" y="27" width="12" height="15" rx="2" fill="#0EA5E9" stroke="#0F172A" strokeWidth="1.2" />
        <ellipse cx="25" cy="27" rx="6" ry="2.5" fill="#7DD3FC" stroke="#0F172A" strokeWidth="1" />
      </g>
    )}
    {/* Sprouting Plants */}
    {seedsPlanted && (
      <g>
        {[36, 48, 58].map((px, idx) => (
          <g key={px}>
            <line
              x1={px}
              y1="44"
              x2={px}
              y2={plantHealthy ? 28 - idx * 2 : 36}
              stroke={plantHealthy ? '#22C55E' : '#F59E0B'}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <ellipse
              cx={px - 4}
              cy={plantHealthy ? 30 - idx * 2 : 37}
              rx={plantHealthy ? 5 : 3}
              ry={plantHealthy ? 2.8 : 1.8}
              fill={plantHealthy ? '#4ADE80' : '#FBBF24'}
            />
            <ellipse
              cx={px + 4}
              cy={plantHealthy ? 31 - idx * 2 : 37}
              rx={plantHealthy ? 5 : 3}
              ry={plantHealthy ? 2.8 : 1.8}
              fill={plantHealthy ? '#16A34A' : '#D97706'}
            />
          </g>
        ))}
      </g>
    )}
    {/* Translucent Glass Biodome Canopy */}
    <path
      d="M14,42 A34,26 0 0 1 82,42"
      fill="#38BDF8"
      fillOpacity="0.16"
      stroke="#BAE6FD"
      strokeOpacity="0.7"
      strokeWidth="1.6"
    />
  </svg>
);

export const TrackTrail25D: React.FC<{
  points: Vec2[];
  color?: string;
  isRover?: boolean;
}> = ({ points, color = '#0F172A', isRover = false }) => {
  if (points.length === 0) return null;
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full">
      {points.map((pt, i) => {
        const s = getDepthScale(pt.y);
        const ageOpacity = 0.16 + (i / Math.max(1, points.length)) * 0.36;
        return (
          <g key={`${i}-${pt.x.toFixed(1)}`} opacity={ageOpacity}>
            <ellipse
              cx={pt.x - (isRover ? 1.0 : 0.55) * s}
              cy={pt.y + 2.4}
              rx={(isRover ? 0.85 : 0.55) * s}
              ry={(isRover ? 0.42 : 0.28) * s}
              fill={color}
            />
            <ellipse
              cx={pt.x + (isRover ? 1.0 : 0.55) * s}
              cy={pt.y + 2.7}
              rx={(isRover ? 0.85 : 0.55) * s}
              ry={(isRover ? 0.42 : 0.28) * s}
              fill={color}
            />
          </g>
        );
      })}
    </svg>
  );
};
