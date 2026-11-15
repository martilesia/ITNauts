import React, { useEffect, useRef } from 'react';
import {
  BIOME_PROFILES,
  BiomeId,
  WeatherCycleStep,
  getBiomeAtWorldPos,
} from './precipitationService';

export const WORLD_W = 960;
export const WORLD_H = 560;

export interface WaterCollectorEntity {
  id: string;
  x: number;
  y: number;
  biome: BiomeId;
  waterLiters: number;
  maxLiters: number;
  isExposed: boolean;
}

export interface ObstacleCircle {
  x: number;
  y: number;
  r: number;
  kind: 'rock' | 'tree' | 'cactus';
}

export const WORLD_OBSTACLES: ObstacleCircle[] = [
  // Tropical canopy obstacles
  { x: 110, y: 100, r: 24, kind: 'tree' },
  { x: 250, y: 80, r: 22, kind: 'tree' },
  { x: 340, y: 185, r: 24, kind: 'tree' },
  { x: 145, y: 225, r: 20, kind: 'tree' },
  // Grassland rocks/trees
  { x: 105, y: 360, r: 20, kind: 'tree' },
  { x: 235, y: 495, r: 22, kind: 'rock' },
  // Mountain ridge boulders (bordering river)
  { x: 455, y: 65, r: 26, kind: 'rock' },
  { x: 455, y: 275, r: 28, kind: 'rock' },
  { x: 458, y: 500, r: 26, kind: 'rock' },
  { x: 598, y: 60, r: 25, kind: 'rock' },
  { x: 600, y: 255, r: 27, kind: 'rock' },
  { x: 598, y: 495, r: 26, kind: 'rock' },
  // Dry zone cacti/boulders
  { x: 730, y: 120, r: 20, kind: 'cactus' },
  { x: 870, y: 135, r: 22, kind: 'rock' },
  { x: 745, y: 430, r: 21, kind: 'cactus' },
  { x: 880, y: 455, r: 24, kind: 'rock' },
];

export const SHELTER_ZONE = { x: 345, y: 465, r: 44 };
export const START_BASE_POS = { x: 810, y: 280 };

// River bounds: x in [502, 560], with North Bridge y in [115, 195] and South Ford y in [365, 440]
export function isRiverBlocked(x: number, y: number, riverLevel: number): boolean {
  const halfWidth = 24 + riverLevel * 10;
  const riverCenter = 531;
  if (Math.abs(x - riverCenter) > halfWidth) return false;

  // North bridge is always passable
  if (y >= 115 && y <= 195) return false;

  // South ford is passable only when riverLevel < 0.72
  if (y >= 365 && y <= 440 && riverLevel < 0.72) return false;

  return true;
}

interface RainfallCanvasProps {
  playerPos: { x: number; y: number };
  playerAngle: number;
  playerMoving: boolean;
  scannerActive: boolean;
  scannerPulse: number; // 0..1
  weather: WeatherCycleStep;
  collectors: WaterCollectorEntity[];
  stormAlertActive: boolean;
  reducedStimuli: boolean;
  onCanvasTap: (worldX: number, worldY: number) => void;
}

export const RainfallCanvas: React.FC<RainfallCanvasProps> = ({
  playerPos,
  playerAngle,
  playerMoving,
  scannerActive,
  scannerPulse,
  weather,
  collectors,
  stormAlertActive,
  reducedStimuli,
  onCanvasTap,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({
    playerPos,
    playerAngle,
    playerMoving,
    scannerActive,
    scannerPulse,
    weather,
    collectors,
    stormAlertActive,
    reducedStimuli,
  });

  stateRef.current = {
    playerPos,
    playerAngle,
    playerMoving,
    scannerActive,
    scannerPulse,
    weather,
    collectors,
    stormAlertActive,
    reducedStimuli,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const raindrops = Array.from({ length: 110 }, (_, i) => ({
      x: (i * 89) % WORLD_W,
      y: (i * 53) % WORLD_H,
      speed: 260 + (i % 5) * 45,
      len: 10 + (i % 4) * 4,
    }));

    const clouds = Array.from({ length: 7 }, (_, i) => ({
      x: (i * 155) % WORLD_W,
      y: 36 + (i % 4) * 125,
      w: 110 + (i % 3) * 35,
      speed: 14 + (i % 3) * 7,
    }));

    let rafId = 0;
    let lastTime = performance.now();

    const drawFrame = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      const st = stateRef.current;

      // 1. Background Geographical Regions
      // Tropical Forest (Top-Left)
      ctx.fillStyle = st.weather.weather === 'sunny' ? '#15803D' : '#166534';
      ctx.fillRect(0, 0, 430, 290);

      // Grassland (Bottom-Left)
      ctx.fillStyle = st.weather.weather === 'sunny' ? '#65A30D' : '#4D7C0F';
      ctx.fillRect(0, 290, 430, 270);

      // Mountain / Valley Corridor (Center)
      ctx.fillStyle = '#78716C';
      ctx.fillRect(430, 0, 205, WORLD_H);

      // Dry Region (Right)
      ctx.fillStyle = '#D97706';
      ctx.fillRect(635, 0, WORLD_W - 635, WORLD_H);
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(665, 30, 265, 500);

      // Subtle grass / sand texture patches
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.ellipse(80 + i * 55, 50 + (i % 2) * 140, 28, 16, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Dynamic Puddles during rain in Tropical & Grassland
      const rainStrength =
        st.weather.weather === 'storm'
          ? 1
          : st.weather.weather === 'heavy_rain'
            ? 0.85
            : st.weather.weather === 'moderate_rain'
              ? 0.6
              : st.weather.weather === 'light_rain'
                ? 0.35
                : 0.1;

      if (rainStrength > 0.2) {
        ctx.fillStyle = `rgba(56, 189, 248, ${0.28 + rainStrength * 0.35})`;
        const puddles = [
          { x: 185, y: 155, r: 26 * rainStrength },
          { x: 300, y: 110, r: 22 * rainStrength },
          { x: 225, y: 365, r: 20 * rainStrength },
          { x: 140, y: 450, r: 18 * rainStrength },
        ];
        puddles.forEach((p) => {
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.r, p.r * 0.65, 0, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // 3. River with dynamic width & crossings
      const halfRiver = 24 + st.weather.riverLevel * 10;
      const riverCenter = 531;
      ctx.fillStyle = st.weather.riverLevel >= 0.72 ? '#0284C7' : '#0EA5E9';
      ctx.fillRect(riverCenter - halfRiver, 0, halfRiver * 2, WORLD_H);

      // River flow lines
      if (!st.reducedStimuli) {
        const flowOffset = (now * 0.08) % 40;
        ctx.strokeStyle = 'rgba(224, 242, 254, 0.55)';
        ctx.lineWidth = 2;
        for (let y = -40 + flowOffset; y < WORLD_H; y += 40) {
          ctx.beginPath();
          ctx.moveTo(riverCenter - 6, y);
          ctx.lineTo(riverCenter - 6, y + 14);
          ctx.moveTo(riverCenter + 7, y + 10);
          ctx.lineTo(riverCenter + 7, y + 24);
          ctx.stroke();
        }
      }

      // North Safe Bridge (Always passable)
      ctx.fillStyle = '#92400E';
      ctx.fillRect(riverCenter - halfRiver - 10, 120, halfRiver * 2 + 20, 70);
      ctx.strokeStyle = '#FEF3C7';
      ctx.lineWidth = 2;
      ctx.strokeRect(riverCenter - halfRiver - 10, 120, halfRiver * 2 + 20, 70);
      ctx.fillStyle = '#FEF3C7';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('BRIDGE', riverCenter, 159);

      // South Low Ford (Passable unless flooded)
      const southFlooded = st.weather.riverLevel >= 0.72;
      if (southFlooded) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
        ctx.fillRect(riverCenter - halfRiver - 8, 368, halfRiver * 2 + 16, 68);
        ctx.fillStyle = '#FEE2E2';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('FLOOD!', riverCenter, 406);
      } else {
        ctx.fillStyle = '#CBD5E1';
        for (let sx = riverCenter - halfRiver; sx <= riverCenter + halfRiver - 8; sx += 14) {
          ctx.beginPath();
          ctx.arc(sx + 6, 392, 6, 0, Math.PI * 2);
          ctx.arc(sx + 4, 416, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 4. Region Labels (short & clear)
      ctx.font = 'bold 13px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.textAlign = 'left';
      ctx.fillText('Tropical Forest', 16, 26);
      ctx.fillText('Green Grassland', 16, 314);
      ctx.fillText('Mountain & River', 442, 26);
      ctx.fillStyle = '#451A03';
      ctx.fillText('Dry Region', 652, 26);

      // 5. Protected Field Shelter & Start Pad
      // Field Shelter (West)
      ctx.fillStyle = st.stormAlertActive ? 'rgba(52, 211, 153, 0.35)' : 'rgba(56, 189, 248, 0.2)';
      ctx.beginPath();
      ctx.arc(SHELTER_ZONE.x, SHELTER_ZONE.y, SHELTER_ZONE.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = st.stormAlertActive ? '#34D399' : '#38BDF8';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SHELTER', SHELTER_ZONE.x, SHELTER_ZONE.y + 4);

      // Start Pad (East)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.beginPath();
      ctx.arc(START_BASE_POS.x, START_BASE_POS.y, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#451A03';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('START', START_BASE_POS.x, START_BASE_POS.y + 4);

      // 6. Scanner Colour Overlay (Blue / Green / Yellow / Orange)
      if (st.scannerActive) {
        const zones: { x: number; y: number; w: number; h: number; biome: BiomeId }[] = [
          { x: 0, y: 0, w: 430, h: 290, biome: 'tropical' },
          { x: 0, y: 290, w: 430, h: 270, biome: 'grassland' },
          { x: 430, y: 0, w: 205, h: WORLD_H, biome: 'mountain' },
          { x: 635, y: 0, w: 325, h: WORLD_H, biome: 'dry' },
        ];
        zones.forEach((z) => {
          const prof = BIOME_PROFILES[z.biome];
          ctx.fillStyle = prof.scannerColor;
          ctx.globalAlpha = 0.28;
          ctx.fillRect(z.x, z.y, z.w, z.h);
          ctx.globalAlpha = 1;
          ctx.fillStyle = '#FFFFFF';
          ctx.strokeStyle = '#0F172A';
          ctx.lineWidth = 3;
          ctx.font = 'bold 13px sans-serif';
          ctx.textAlign = 'center';
          const label = `${prof.scannerLabel}`;
          ctx.strokeText(label, z.x + z.w / 2, z.y + z.h / 2);
          ctx.fillText(label, z.x + z.w / 2, z.y + z.h / 2);
        });

        // Expanding pulse ring around rover
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(st.playerPos.x, st.playerPos.y, 40 + st.scannerPulse * 140, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 7. Environmental Obstacles (Trees, Rocks, Cacti)
      WORLD_OBSTACLES.forEach((obs) => {
        if (obs.kind === 'tree') {
          ctx.fillStyle = '#14532D';
          ctx.beginPath();
          ctx.arc(obs.x, obs.y, obs.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#22C55E';
          ctx.beginPath();
          ctx.arc(obs.x - 4, obs.y - 4, obs.r * 0.72, 0, Math.PI * 2);
          ctx.fill();
        } else if (obs.kind === 'rock') {
          ctx.fillStyle = '#475569';
          ctx.beginPath();
          ctx.arc(obs.x, obs.y, obs.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#94A3B8';
          ctx.beginPath();
          ctx.arc(obs.x - 4, obs.y - 5, obs.r * 0.6, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = '#15803D';
          ctx.beginPath();
          ctx.arc(obs.x, obs.y, obs.r * 0.75, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#052E16';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });

      // 8. Water Collectors with animated fill bar
      st.collectors.forEach((col) => {
        const pct = Math.min(1, col.waterLiters / col.maxLiters);
        ctx.save();
        ctx.translate(col.x, col.y);

        // Exposed warning ring during storm
        if (st.stormAlertActive && col.isExposed) {
          ctx.strokeStyle = '#FB7185';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, 26, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Tank body
        ctx.fillStyle = '#1E293B';
        ctx.strokeStyle = pct >= 0.5 ? '#38BDF8' : '#E2E8F0';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(-14, -16, 28, 32, 6);
        ctx.fill();
        ctx.stroke();

        // Blue water fill inside collector
        const fillH = Math.round(26 * pct);
        if (fillH > 0) {
          ctx.fillStyle = '#38BDF8';
          ctx.beginPath();
          ctx.roundRect(-11, 13 - fillH, 22, fillH, 4);
          ctx.fill();
        }

        // Liters label
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(col.waterLiters)}L`, 0, -20);

        ctx.restore();
      });

      // 9. Player Exploration Rover
      ctx.save();
      ctx.translate(st.playerPos.x, st.playerPos.y);
      ctx.rotate(st.playerAngle);

      // Rover shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(0, 4, 20, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      // Wheels
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(-15, -15, 9, 5);
      ctx.fillRect(6, -15, 9, 5);
      ctx.fillRect(-15, 10, 9, 5);
      ctx.fillRect(6, 10, 9, 5);

      // Body
      ctx.fillStyle = '#FACC15';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.roundRect(-16, -11, 32, 22, 6);
      ctx.fill();
      ctx.stroke();

      // Front windshield / sensor
      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.roundRect(4, -7, 9, 14, 3);
      ctx.fill();

      ctx.restore();

      // 10. Animated Rain Particles & Clouds
      if (
        st.weather.weather === 'light_rain' ||
        st.weather.weather === 'moderate_rain' ||
        st.weather.weather === 'heavy_rain' ||
        st.weather.weather === 'storm'
      ) {
        const activeDrops =
          st.weather.weather === 'storm'
            ? 110
            : st.weather.weather === 'heavy_rain'
              ? 85
              : st.weather.weather === 'moderate_rain'
                ? 50
                : 25;
        ctx.strokeStyle = 'rgba(186, 230, 253, 0.72)';
        ctx.lineWidth = 1.6;
        for (let i = 0; i < activeDrops; i++) {
          const drop = raindrops[i];
          if (!st.reducedStimuli) {
            drop.x = (drop.x - drop.speed * 0.25 * dt + WORLD_W) % WORLD_W;
            drop.y = (drop.y + drop.speed * dt) % WORLD_H;
          }
          // Less rain visually in Dry region
          const dropBiome = getBiomeAtWorldPos(drop.x, drop.y);
          if (dropBiome === 'dry' && i % 3 !== 0) continue;

          ctx.beginPath();
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x - 3, drop.y + drop.len);
          ctx.stroke();
        }
      }

      // Drifting clouds
      if (st.weather.weather !== 'sunny') {
        ctx.fillStyle =
          st.weather.weather === 'storm'
            ? 'rgba(51, 65, 85, 0.45)'
            : 'rgba(255, 255, 255, 0.26)';
        clouds.forEach((c) => {
          if (!st.reducedStimuli) {
            c.x = (c.x + c.speed * dt) % (WORLD_W + 140);
          }
          const cx = c.x - 70;
          ctx.beginPath();
          ctx.ellipse(cx, c.y, c.w * 0.5, 22, 0, 0, Math.PI * 2);
          ctx.ellipse(cx - 26, c.y + 6, c.w * 0.3, 16, 0, 0, Math.PI * 2);
          ctx.ellipse(cx + 28, c.y + 6, c.w * 0.3, 16, 0, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      rafId = requestAnimationFrame(drawFrame);
    };

    rafId = requestAnimationFrame(drawFrame);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = WORLD_W / rect.width;
    const scaleY = WORLD_H / rect.height;
    const worldX = (e.clientX - rect.left) * scaleX;
    const worldY = (e.clientY - rect.top) * scaleY;
    onCanvasTap(worldX, worldY);
  };

  return (
    <canvas
      ref={canvasRef}
      width={WORLD_W}
      height={WORLD_H}
      onPointerDown={handlePointerDown}
      className="h-full w-full rounded-2xl border-2 border-[#543487] bg-[#0F172A] shadow-xl cursor-pointer touch-none"
      aria-label="Interactive 2D Rain Explorer World"
    />
  );
};
