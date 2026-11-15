import React, { useState } from 'react';
import marsSurfaceImg from '../../assets/images/mars_surface_terrain_1794732027333.jpg';
import moonSurfaceImg from '../../assets/images/moon_surface_terrain_1794732028725.jpg';
import marsBiomeImg from '../../assets/images/mars_biome_terrain_1794732029172.jpg';
import moonBiomeImg from '../../assets/images/moon_biome_terrain_1794732030538.jpg';
import { Vec2 } from '../../types/game';
import { getDepthScale } from './Props25D';

interface PlanetaryBackdropProps {
  destination: 'mars' | 'moon';
  variant?: 'surface' | 'biome';
  reducedStimuli?: boolean;
  footprints?: Vec2[];
  trackColor?: string;
  dimmed?: boolean;
  cameraFocus?: Vec2;
}

export const PlanetaryBackdrop: React.FC<PlanetaryBackdropProps> = ({
  destination,
  variant = 'surface',
  reducedStimuli = false,
  footprints = [],
  trackColor,
  dimmed = false,
  cameraFocus,
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  const isMoon = destination === 'moon';
  const imageSrc =
    variant === 'biome'
      ? isMoon
        ? moonBiomeImg
        : marsBiomeImg
      : isMoon
        ? moonSurfaceImg
        : marsSurfaceImg;

  const altText = isMoon
    ? 'Lunar surface with craters, rocks, and terrain relief'
    : 'Martian surface with craters, dunes, rocks, and elevation changes';

  // Subtle 2.5D camera parallax shift when Commander explores
  const panX = !reducedStimuli && cameraFocus ? (50 - cameraFocus.x) * 0.08 : 0;
  const panY = !reducedStimuli && cameraFocus ? (55 - cameraFocus.y) * 0.04 : 0;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none">
      {/* Primary High-Resolution Planetary Terrain Artwork with 2.5D Parallax */}
      {!imgFailed ? (
        <img
          src={imageSrc}
          alt={altText}
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="h-full w-full object-cover object-top transition-transform duration-150 ease-out"
          style={{
            opacity: dimmed ? 0.72 : 1,
            transform: `translate3d(${panX}%, ${panY}%, 0) scale(1.06)`,
            filter: isMoon ? 'contrast(1.05) brightness(0.96)' : 'contrast(1.06) saturate(1.05)',
          }}
        />
      ) : (
        /* Resilient SVG + Gradient Fallback */
        <div
          className="h-full w-full"
          style={{
            background: isMoon
              ? 'linear-gradient(to bottom, #040711 0%, #090D1A 14%, #4B5563 18%, #64748B 50%, #334155 100%)'
              : 'linear-gradient(to bottom, #3D1A0E 0%, #8C4725 14%, #A84C24 22%, #7C2D12 58%, #451A0B 100%)',
          }}
        />
      )}

      {/* Subtle Horizon & Ground Depth Scrim */}
      <div
        className="absolute inset-0"
        style={{
          background: isMoon
            ? 'linear-gradient(to bottom, rgba(4,7,17,0.38) 0%, rgba(15,23,42,0.08) 22%, rgba(15,23,42,0.14) 68%, rgba(6,9,19,0.45) 100%)'
            : 'linear-gradient(to bottom, rgba(43,17,9,0.34) 0%, rgba(124,45,18,0.06) 24%, rgba(69,26,11,0.16) 72%, rgba(28,10,5,0.46) 100%)',
        }}
      />

      {/* Ambient Atmospheric Details: Subtle Twinkling Stars on Moon Horizon */}
      {!reducedStimuli && isMoon && (
        <svg viewBox="0 0 1000 120" preserveAspectRatio="none" className="absolute inset-x-0 top-0 h-[14%] w-full opacity-80">
          <circle cx="90" cy="24" r="1.4" fill="#FFFFFF" className="animate-pulse" />
          <circle cx="215" cy="48" r="1.2" fill="#E0F2FE" />
          <circle cx="370" cy="18" r="1.5" fill="#FEF9C3" className="animate-pulse" />
          <circle cx="520" cy="36" r="1.1" fill="#FFFFFF" />
          <circle cx="760" cy="22" r="1.6" fill="#E0F2FE" className="animate-pulse" />
          <circle cx="910" cy="44" r="1.3" fill="#FFFFFF" />
        </svg>
      )}

      {/* Depth-Scaled Dynamic Regolith Footprints / Tracks */}
      {footprints.length > 0 && (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          {footprints.map((pt, i) => {
            const s = getDepthScale(pt.y);
            const ageOpacity = 0.14 + (i / Math.max(1, footprints.length)) * 0.34;
            return (
              <g key={`${i}-${pt.x.toFixed(1)}`} opacity={ageOpacity}>
                <ellipse
                  cx={pt.x - 0.55 * s}
                  cy={pt.y + 3.2}
                  rx={0.62 * s}
                  ry={0.3 * s}
                  fill={trackColor ?? (isMoon ? '#0F172A' : '#2A0E06')}
                />
                <ellipse
                  cx={pt.x + 0.55 * s}
                  cy={pt.y + 3.5}
                  rx={0.62 * s}
                  ry={0.3 * s}
                  fill={trackColor ?? (isMoon ? '#0F172A' : '#2A0E06')}
                />
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
};
