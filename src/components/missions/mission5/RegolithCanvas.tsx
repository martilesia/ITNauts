import React from 'react';
import { AlertTriangle, CheckCircle2, Droplets, Hammer, Sprout } from 'lucide-react';
import { CommanderProfile, Vec2 } from '../../../types/game';
import { AstroCompanion } from '../../engine/AstroCompanion';
import { CommanderSprite } from '../../engine/CommanderSprite';

export type RegolithSampleId =
  | 'moon_mare_basalt'
  | 'moon_highlands'
  | 'moon_fine_dust'
  | 'mars_red_dunes'
  | 'mars_ancient_clays'
  | 'mars_basalt_plain';

export interface RegolithSampleDef {
  id: RegolithSampleId;
  name: string;
  shortName: string;
  pos: Vec2;
  color: string;
  grainShape: 'sharp-basalt' | 'rocky-anorthosite' | 'jagged-fines' | 'rounded-dunes' | 'layered-clay' | 'solid-basalt';
  stabilityLevel: 'High' | 'Medium' | 'Low';
  dustRisk: 'Low' | 'Medium' | 'High';
  waterClue: string;
  microscopeNote: string;
  engineeringConsequence: string;
  isBestFoundation: boolean;
}

export function getRegolithSamples(destination: 'moon' | 'mars'): RegolithSampleDef[] {
  if (destination === 'moon') {
    return [
      {
        id: 'moon_mare_basalt',
        name: 'Lunar Mare Basalt',
        shortName: 'Firm Basalt',
        pos: { x: 20, y: 64 },
        color: '#475569',
        grainShape: 'sharp-basalt',
        stabilityLevel: 'High',
        dustRisk: 'Low',
        waterClue: 'Dry',
        microscopeNote: 'Dense rock that holds the base without sinking.',
        engineeringConsequence: '100% Firm! The platform stayed level.',
        isBestFoundation: true,
      },
      {
        id: 'moon_highlands',
        name: 'Lunar Highlands Rocks',
        shortName: 'Uneven Rock',
        pos: { x: 50, y: 64 },
        color: '#94A3B8',
        grainShape: 'rocky-anorthosite',
        stabilityLevel: 'Medium',
        dustRisk: 'Medium',
        waterClue: 'Dry',
        microscopeNote: 'Irregular boulders that wobble the base.',
        engineeringConsequence: 'Unstable! Uneven spots tilt the base.',
        isBestFoundation: false,
      },
      {
        id: 'moon_fine_dust',
        name: 'Fine Electrostatic Dust',
        shortName: 'Loose Dust',
        pos: { x: 80, y: 64 },
        color: '#CBD5E1',
        grainShape: 'jagged-fines',
        stabilityLevel: 'Low',
        dustRisk: 'High',
        waterClue: 'Sharp',
        microscopeNote: 'Fine sharp dust that gives way under weight.',
        engineeringConsequence: 'Sank! The dust gave way and clogged the seals.',
        isBestFoundation: false,
      },
    ];
  }

  return [
    {
      id: 'mars_red_dunes',
      name: 'Red Dust Dunes',
      shortName: 'Dune Sand',
      pos: { x: 20, y: 64 },
      color: '#EA580C',
      grainShape: 'rounded-dunes',
      stabilityLevel: 'Low',
      dustRisk: 'High',
      waterClue: 'Dry',
      microscopeNote: 'Loose sand that slides easily.',
      engineeringConsequence: 'Sank! The base slid in the dunes.',
      isBestFoundation: false,
    },
    {
      id: 'mars_ancient_clays',
      name: 'Ancient Lakebed Clays',
      shortName: 'Ancient Clays',
      pos: { x: 50, y: 64 },
      color: '#D97706',
      grainShape: 'layered-clay',
      stabilityLevel: 'Medium',
      dustRisk: 'Medium',
      waterClue: 'Ancient water!',
      microscopeNote: 'Holds clues of ancient water, but sinks under heavy weight.',
      engineeringConsequence: 'Soft ground! Great for science, weak for a base.',
      isBestFoundation: false,
    },
    {
      id: 'mars_basalt_plain',
      name: 'Firm Basalt Plateau',
      shortName: 'Firm Basalt',
      pos: { x: 80, y: 64 },
      color: '#78350F',
      grainShape: 'solid-basalt',
      stabilityLevel: 'High',
      dustRisk: 'Low',
      waterClue: 'Firm rock',
      microscopeNote: 'Solid rock ideal for supporting the base.',
      engineeringConsequence: '100% Firm! Level and safe base.',
      isBestFoundation: true,
    },
  ];
}

interface RegolithCanvasProps {
  destination: 'moon' | 'mars';
  commander: CommanderProfile;
  mode: 'TEST_SOIL' | 'BUILD_BASE';
  samples: RegolithSampleDef[];
  testedIds: RegolithSampleId[];
  activeTestId: RegolithSampleId | null;
  selectedFoundationId: RegolithSampleId | null;
  greenhouseHealthy: boolean;
  hasShieldBonus: boolean;
  launchStatus: 'idle' | 'testing' | 'passed' | 'failed';
  onTestSoil: (id: RegolithSampleId) => void;
}

export const RegolithCanvas: React.FC<RegolithCanvasProps> = ({
  destination,
  commander,
  mode,
  samples,
  testedIds,
  activeTestId,
  selectedFoundationId,
  greenhouseHealthy,
  hasShieldBonus,
  launchStatus,
  onTestSoil,
}) => {
  const isMoon = destination === 'moon';
  const selectedSoil = samples.find((s) => s.id === selectedFoundationId) ?? null;

  const baseTiltDeg =
    !selectedSoil
      ? 0
      : selectedSoil.isBestFoundation
        ? 0
        : selectedSoil.stabilityLevel === 'Low'
          ? -12
          : 6;

  const baseSinkPx =
    !selectedSoil
      ? 0
      : selectedSoil.isBestFoundation
        ? 0
        : selectedSoil.stabilityLevel === 'Low'
          ? 18
          : 8;

  return (
    <div
      className={`relative h-[390px] sm:h-[440px] w-full overflow-hidden rounded-2xl border-2 select-none shadow-2xl ${
        isMoon ? 'border-slate-500/60 bg-[#050711]' : 'border-orange-500/50 bg-[#2C1108]'
      }`}
    >
      {/* Moon or Mars Backdrop */}
      <svg
        viewBox="0 0 1000 500"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="m5StageSky" x1="0" y1="0" x2="0" y2="1">
            {isMoon ? (
              <>
                <stop offset="0%" stopColor="#020308" />
                <stop offset="100%" stopColor="#171C2B" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#5C2210" />
                <stop offset="100%" stopColor="#BA572A" />
              </>
            )}
          </linearGradient>
          <linearGradient id="m5StageGround" x1="0" y1="0" x2="0" y2="1">
            {isMoon ? (
              <>
                <stop offset="0%" stopColor="#656D7E" />
                <stop offset="100%" stopColor="#2A303B" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#BF582B" />
                <stop offset="100%" stopColor="#63230E" />
              </>
            )}
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="1000" height="205" fill="url(#m5StageSky)" />

        {isMoon ? (
          <g>
            {[
              [80, 42], [170, 74], [300, 32], [440, 68], [590, 38], [720, 72], [875, 44],
            ].map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r="1.5" fill="#FFFFFF" opacity="0.85" />
            ))}
            <circle cx="845" cy="64" r="20" fill="#0284C7" stroke="#7DD3FC" strokeWidth="1.5" />
            <path d="M835,58 Q844,52 854,62 Q847,72 837,68 Z" fill="#34D399" opacity="0.85" />
            <path d="M0,195 L160,155 L350,185 L550,148 L760,184 L910,154 L1000,190 L1000,210 L0,210 Z" fill="#323846" />
          </g>
        ) : (
          <g>
            <circle cx="170" cy="66" r="22" fill="#FDE68A" opacity="0.65" />
            <path d="M0,195 L120,145 L260,145 L320,182 L510,182 L585,136 L720,136 L780,180 L915,150 L1000,188 L1000,210 L0,210 Z" fill="#732B13" />
          </g>
        )}

        <rect x="0" y="195" width="1000" height="305" fill="url(#m5StageGround)" />

        {/* BUILD_BASE Visual Preview directly on the planetary surface */}
        {mode === 'BUILD_BASE' && (
          <g>
            {/* Soil Foundation Strip */}
            <ellipse
              cx="500"
              cy="375"
              rx="240"
              ry="44"
              fill={selectedSoil?.color ?? '#334155'}
              stroke="#0F172A"
              strokeWidth="3"
              opacity="0.9"
            />
            {/* Space Base Habitat + Greenhouse reacting LIVE to Tilt & Water! */}
            <g
              transform={`translate(500, ${320 + baseSinkPx}) rotate(${baseTiltDeg})`}
              style={{ transition: 'transform 500ms cubic-bezier(0.16, 1, 0.3, 1)' }}
            >
              {/* Shield Aura from M1/M2 */}
              {hasShieldBonus && (
                <ellipse
                  cx="0"
                  cy="-20"
                  rx="165"
                  ry="95"
                  fill="none"
                  stroke="#FACC15"
                  strokeWidth="3"
                  strokeDasharray="10 8"
                  opacity="0.65"
                />
              )}

              {/* Base Platform */}
              <rect x="-135" y="15" width="270" height="24" rx="8" fill="#E2E8F0" stroke="#0F172A" strokeWidth="3" />

              {/* Main Habitat Dome */}
              <path
                d="M-115,15 Q-60,-78 0,15 Z"
                fill={hasShieldBonus ? '#FDE047' : '#CBD5E1'}
                stroke="#0F172A"
                strokeWidth="3"
              />
              <circle cx="-58" cy="-14" r="14" fill="#0F172A" stroke="#FFFFFF" strokeWidth="2.5" />
              <circle cx="-58" cy="-14" r="8" fill="#38BDF8" opacity="0.8" />

              {/* Greenhouse Bio-Dome */}
              <path
                d="M10,15 Q68,-68 122,15 Z"
                fill={greenhouseHealthy ? '#0EA5E9' : '#64748B'}
                fillOpacity="0.45"
                stroke="#E2E8F0"
                strokeWidth="3"
              />
              {/* Plants inside Greenhouse */}
              <circle
                cx="50"
                cy="2"
                r="11"
                fill={greenhouseHealthy ? '#22C55E' : '#94A3B8'}
              />
              <circle
                cx="72"
                cy="-6"
                r="13"
                fill={greenhouseHealthy ? '#4ADE80' : '#94A3B8'}
              />
              <circle
                cx="92"
                cy="4"
                r="10"
                fill={greenhouseHealthy ? '#16A34A' : '#94A3B8'}
              />
            </g>
          </g>
        )}
      </svg>

      {/* Top Tag */}
      <div className="pointer-events-none absolute left-3 top-3 z-20">
        <span className="rounded-lg border border-white/25 bg-black/70 px-3 py-1 text-xs font-bold text-white">
          {mode === 'TEST_SOIL'
            ? `${isMoon ? 'Moon' : 'Mars'} · Drop-Weight Test Rig`
            : `${isMoon ? 'Moon' : 'Mars'} · Final Base Construction Site`}
        </span>
      </div>

      {/* TEST_SOIL Mode: 3 Interactive Drop-Weight Soil Pedestals */}
      {mode === 'TEST_SOIL' && (
        <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 z-20 grid grid-cols-3 gap-3 sm:gap-5">
          {samples.map((s) => {
            const tested = testedIds.includes(s.id);
            const isTestingNow = activeTestId === s.id;
            const blockSink =
              tested && !s.isBestFoundation
                ? s.stabilityLevel === 'Low'
                  ? 'translate-y-4 -rotate-12'
                  : 'translate-y-2 rotate-6'
                : 'translate-y-0 rotate-0';

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onTestSoil(s.id)}
                className={`group flex flex-col items-center justify-between rounded-2xl border-2 p-3 sm:p-4 text-center shadow-xl transition-all hover:scale-[1.03] active:scale-95 ${
                  tested
                    ? s.isBestFoundation
                      ? 'border-emerald-400 bg-emerald-950/85'
                      : 'border-rose-400/80 bg-rose-950/80'
                    : 'border-white/60 bg-[#1B0D2E]/90 hover:border-amber-300'
                }`}
              >
                <span className="text-xs sm:text-sm font-bold text-white leading-tight">
                  {s.shortName}
                </span>

                {/* Drop-Weight Physics Visual */}
                <div className="my-3 flex flex-col items-center justify-end h-20 w-full">
                  <div
                    className={`h-8 w-14 rounded-lg border-2 border-white bg-slate-200 flex items-center justify-center shadow transition-all duration-500 ${
                      isTestingNow ? 'scale-110' : ''
                    } ${tested ? blockSink : '-translate-y-3 opacity-75'}`}
                  >
                    <Hammer className="h-4 w-4 text-slate-900" />
                  </div>
                  <div
                    className="mt-1 h-5 w-full rounded-lg border border-black/40"
                    style={{ backgroundColor: s.color }}
                  />
                </div>

                <div className="w-full">
                  {tested ? (
                    <div
                      className={`inline-flex items-center justify-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold w-full ${
                        s.isBestFoundation
                          ? 'bg-emerald-500/25 text-emerald-200'
                          : 'bg-rose-500/25 text-rose-200'
                      }`}
                    >
                      {s.isBestFoundation ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      )}
                      <span>
                        {s.isBestFoundation
                          ? 'Firm!'
                          : s.stabilityLevel === 'Low'
                            ? 'Sank!'
                            : 'Unstable!'}
                      </span>
                    </div>
                  ) : (
                    <span className="inline-block rounded-lg bg-amber-400 px-2.5 py-1 text-[11px] font-extrabold text-slate-950">
                      Drop Weight!
                    </span>
                  )}

                  {!isMoon && s.id === 'mars_ancient_clays' && tested && (
                    <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-sky-300">
                      <Droplets className="h-3 w-3" />
                      <span>Ancient Water Clue!</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* BUILD_BASE Live Status Banner */}
      {mode === 'BUILD_BASE' && launchStatus !== 'idle' && (
        <div className="pointer-events-none absolute inset-x-0 top-14 z-20 flex justify-center px-4">
          <div
            className={`inline-flex items-center gap-2 rounded-xl border-2 px-4 py-2 text-sm font-extrabold shadow-xl ${
              launchStatus === 'passed'
                ? 'border-emerald-300 bg-emerald-950/90 text-emerald-200'
                : launchStatus === 'failed'
                  ? 'border-rose-400 bg-rose-950/95 text-rose-200'
                  : 'border-amber-300 bg-[#22103D]/95 text-amber-200'
            }`}
          >
            {launchStatus === 'passed' ? (
              <Sprout className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <span>
              {launchStatus === 'testing'
                ? 'Testing gravity and greenhouse...'
                : launchStatus === 'passed'
                  ? 'Firm Base & Growing Greenhouse!'
                  : 'The base sank! Choose firmer ground!'}
            </span>
          </div>
        </div>
      )}

      {/* Commander & ASTRO */}
      <div className="pointer-events-none absolute bottom-3 left-4 z-20 flex items-end gap-2">
        <CommanderSprite
          profile={commander}
          size={58}
          isCelebrating={launchStatus === 'passed'}
        />
        <AstroCompanion
          mood={launchStatus === 'failed' ? 'alert' : launchStatus === 'passed' ? 'happy' : 'curious'}
          showCaptions={false}
          size={42}
        />
      </div>
    </div>
  );
};
