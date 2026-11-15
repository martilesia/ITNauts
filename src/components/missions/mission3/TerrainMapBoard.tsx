import React from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Flag,
  Gem,
  Mountain,
  Rocket,
  Sun,
  TriangleAlert,
} from 'lucide-react';
import { RoverCartoonSvg } from './RoverCartoonSvg';
import {
  GRID_COLS,
  GRID_ROWS,
  GridCoord,
  TerrainTile,
  ZONE_META,
} from './terrainData';

interface TerrainMapBoardProps {
  grid: TerrainTile[][];
  roverCoord: GridCoord;
  roverFacing: 'right' | 'left' | 'up' | 'down';
  roverMoving: boolean;
  roverDamaged: boolean;
  visitedKeys: Set<string>;
  collectedSampleIds: Set<string>;
  resolvedChallengeIds: Set<string>;
  solarUsed: boolean;
  onMoveDir: (dCol: number, dRow: number) => void;
  onTileClick: (tile: TerrainTile) => void;
}

export const TerrainMapBoard: React.FC<TerrainMapBoardProps> = ({
  grid,
  roverCoord,
  roverFacing,
  roverMoving,
  roverDamaged,
  visitedKeys,
  collectedSampleIds,
  resolvedChallengeIds,
  solarUsed,
  onMoveDir,
  onTileClick,
}) => {
  const isAdjacentToRover = (col: number, row: number) =>
    Math.abs(col - roverCoord.col) + Math.abs(row - roverCoord.row) === 1;

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
      {/* Interactive 2D Topographic Grid */}
      <div className="relative flex-1 rounded-2xl border-2 border-[#543487] bg-[#160A29] p-3 shadow-xl">
        <div
          className="relative grid w-full gap-1.5"
          style={{
            gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
          }}
          role="grid"
          aria-label="2D interactive topographic map"
        >
          {grid.flat().map((tile) => {
            const key = `${tile.col},${tile.row}`;
            const meta = ZONE_META[tile.zone];
            const isRoverHere = roverCoord.col === tile.col && roverCoord.row === tile.row;
            const isVisited = visitedKeys.has(key);
            const isAdjacent = isAdjacentToRover(tile.col, tile.row);
            const isMountainBlocked = tile.zone === 'mountain';
            const isSampleCollected = tile.sampleId ? collectedSampleIds.has(tile.sampleId) : false;
            const isChallengeResolved = tile.challengeId ? resolvedChallengeIds.has(tile.challengeId) : false;

            return (
              <button
                key={key}
                type="button"
                onClick={() => onTileClick(tile)}
                aria-label={`Sector ${tile.col + 1}-${tile.row + 1}: ${meta.label}, ${tile.elevationM} meters`}
                className={`group relative aspect-square min-h-[38px] rounded-xl border-2 transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-white ${
                  isAdjacent && !isMountainBlocked
                    ? 'cursor-pointer ring-2 ring-white/55 hover:scale-[1.04]'
                    : 'cursor-default'
                }`}
                style={{
                  backgroundColor: meta.bg,
                  borderColor: isRoverHere ? '#FFFFFF' : meta.border,
                }}
              >
                {/* Topographic contour curve hint */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-1 rounded-lg border border-black/10"
                />

                {/* Tire track dot for visited tiles */}
                {isVisited && !isRoverHere && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute bottom-1 right-1 h-2 w-2 rounded-full bg-slate-950/40"
                  />
                )}

                {/* Elevation readout on hover or base sites */}
                <span
                  className="pointer-events-none absolute left-1 top-0.5 text-[9px] font-bold leading-none opacity-75 hidden sm:inline"
                  style={{ color: meta.text }}
                >
                  {tile.elevationM}m
                </span>

                {/* Feature Icons */}
                {!isRoverHere && tile.feature === 'start' && (
                  <div className="flex h-full flex-col items-center justify-center">
                    <Rocket className="h-4 w-4 text-slate-950 sm:h-5 sm:w-5" />
                    <span className="text-[9px] font-extrabold text-slate-950 leading-none">START</span>
                  </div>
                )}

                {!isRoverHere && tile.zone === 'mountain' && (
                  <div className="flex h-full flex-col items-center justify-center text-amber-100/95">
                    <Mountain className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                )}

                {!isRoverHere && tile.feature === 'rocky' && !isChallengeResolved && (
                  <div className="flex h-full flex-col items-center justify-center">
                    <svg viewBox="0 0 32 32" className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true">
                      <polygon points="4,25 10,12 18,15 22,25" fill="#64748B" stroke="#0F172A" strokeWidth="2" />
                      <polygon points="15,26 21,15 29,21 27,26" fill="#94A3B8" stroke="#0F172A" strokeWidth="2" />
                    </svg>
                  </div>
                )}

                {!isRoverHere && tile.feature === 'steep_challenge' && !isChallengeResolved && (
                  <div className="flex h-full flex-col items-center justify-center text-slate-950">
                    <TriangleAlert className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                )}

                {!isRoverHere && tile.feature === 'sample' && !isSampleCollected && (
                  <div className="flex h-full flex-col items-center justify-center">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-sky-500 shadow sm:h-7 sm:w-7">
                      <Gem className="h-3.5 w-3.5 text-white sm:h-4 sm:w-4" />
                    </span>
                  </div>
                )}

                {!isRoverHere && tile.feature === 'solar' && !solarUsed && (
                  <div className="flex h-full flex-col items-center justify-center">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-slate-950 bg-amber-300 shadow sm:h-7 sm:w-7">
                      <Sun className="h-3.5 w-3.5 text-slate-950 sm:h-4 sm:w-4" />
                    </span>
                  </div>
                )}

                {!isRoverHere &&
                  (tile.feature === 'base_a' || tile.feature === 'base_b' || tile.feature === 'base_c') && (
                    <div className="flex h-full flex-col items-center justify-center">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-lg border-2 border-white text-xs font-extrabold shadow sm:h-7 sm:w-7 ${
                          tile.feature === 'base_a'
                            ? 'bg-emerald-700 text-white'
                            : tile.feature === 'base_b'
                              ? 'bg-amber-600 text-white'
                              : 'bg-rose-700 text-white'
                        }`}
                      >
                        {tile.feature === 'base_a' ? 'A' : tile.feature === 'base_b' ? 'B' : 'C'}
                      </span>
                    </div>
                  )}

                {/* Animated Rover Marker */}
                {isRoverHere && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-slate-950/35 ring-2 ring-white">
                    <RoverCartoonSvg
                      size={40}
                      facing={roverFacing}
                      moving={roverMoving}
                      damaged={roverDamaged}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Side Controls + Terrain Colour Legend */}
      <aside className="flex w-full flex-col justify-between gap-3 rounded-2xl border-2 border-[#462A72] bg-[#21103A] p-4 lg:w-64 shrink-0">
        {/* Legend */}
        <div>
          <h3 className="font-display text-sm font-bold text-amber-300">Terrain Colors</h3>
          <div className="mt-2.5 grid grid-cols-2 gap-2 lg:grid-cols-1">
            {(['flat', 'moderate', 'slope', 'mountain'] as const).map((z) => {
              const info = ZONE_META[z];
              return (
                <div key={z} className="flex items-center gap-2.5 text-xs">
                  <span
                    className="h-5 w-5 rounded-md border-2 shrink-0"
                    style={{ backgroundColor: info.bg, borderColor: info.border }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 leading-tight">
                    <div className="font-bold text-white">{info.label}</div>
                    <div className="text-[11px] text-purple-200/80">{info.shortDesc}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 space-y-1.5 border-t border-[#462A72] pt-3 text-xs text-purple-100">
            <div className="flex items-center gap-2">
              <Gem className="h-4 w-4 text-sky-400 shrink-0" />
              <span>Science sample (+50 pts)</span>
            </div>
            <div className="flex items-center gap-2">
              <TriangleAlert className="h-4 w-4 text-amber-300 shrink-0" />
              <span>Challenge: Rock / Slope</span>
            </div>
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-amber-300 shrink-0" />
              <span>Solar Point (+25% battery)</span>
            </div>
            <div className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Sites A, B, C (Base)</span>
            </div>
          </div>
        </div>

        {/* Directional Controls (Desktop + Mobile Touch) */}
        <div className="border-t border-[#462A72] pt-3">
          <div className="text-center text-xs font-semibold text-purple-200">
            Move Rover (Arrows / WASD)
          </div>
          <div className="mt-2.5 grid grid-cols-3 gap-1.5 max-w-[168px] mx-auto">
            <div />
            <button
              type="button"
              onClick={() => onMoveDir(0, -1)}
              aria-label="Move rover up"
              className="flex h-12 items-center justify-center rounded-xl border-2 border-[#543487] bg-[#2D174D] text-white shadow hover:border-amber-300 active:scale-95"
            >
              <ArrowUp className="h-5 w-5" />
            </button>
            <div />
            <button
              type="button"
              onClick={() => onMoveDir(-1, 0)}
              aria-label="Move rover left"
              className="flex h-12 items-center justify-center rounded-xl border-2 border-[#543487] bg-[#2D174D] text-white shadow hover:border-amber-300 active:scale-95"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => onMoveDir(0, 1)}
              aria-label="Move rover down"
              className="flex h-12 items-center justify-center rounded-xl border-2 border-[#543487] bg-[#2D174D] text-white shadow hover:border-amber-300 active:scale-95"
            >
              <ArrowDown className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => onMoveDir(1, 0)}
              aria-label="Move rover right"
              className="flex h-12 items-center justify-center rounded-xl border-2 border-[#543487] bg-[#2D174D] text-white shadow hover:border-amber-300 active:scale-95"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};
