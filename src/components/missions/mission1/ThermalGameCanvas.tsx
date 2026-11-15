import React, { useEffect, useRef } from 'react';

export type ShieldTier = 'none' | 'basic' | 'reinforced' | 'advanced';

export interface ThermalTarget {
  id: string;
  x: number;
  y: number;
  label: string;
  tempC: number;
  isDay: boolean;
  spawnedAt: number;
}

export interface ScanBeamEffect {
  x: number;
  y: number;
  tempC: number;
  label: string;
  startedAt: number;
  hitTarget: boolean;
}

export interface FloatingCallout {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  createdAt: number;
}

export interface ThermalGameCanvasProps {
  cycleProgress: number; // continuous day/night progress
  exteriorTemp: number;
  interiorTemp: number;
  energy: number;
  shield: ShieldTier;
  heaterOn: boolean;
  coolerOn: boolean;
  awningActive: boolean;
  cocoonActive: boolean;
  targets: ThermalTarget[];
  scanBeam: ScanBeamEffect | null;
  callouts: FloatingCallout[];
  status: 'TITLE' | 'PLAYING' | 'WON' | 'LOST';
  reducedStimuli: boolean;
  onCanvasTap: (logicalX: number, logicalY: number, hitTargetId?: string) => void;
}

export const THERMAL_CANVAS_W = 960;
export const THERMAL_CANVAS_H = 420;

const STARS = Array.from({ length: 34 }, (_, i) => ({
  x: ((i * 137) % 920) + 20,
  y: ((i * 73) % 175) + 16,
  r: (i % 3) * 0.7 + 1.1,
  phase: i * 0.8,
}));

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

function lerpRgb(c1: [number, number, number], c2: [number, number, number], t: number): string {
  const k = Math.max(0, Math.min(1, t));
  const r = Math.round(lerp(c1[0], c2[0], k));
  const g = Math.round(lerp(c1[1], c2[1], k));
  const b = Math.round(lerp(c1[2], c2[2], k));
  return `rgb(${r}, ${g}, ${b})`;
}

export const ThermalGameCanvas: React.FC<ThermalGameCanvasProps> = (props) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<ThermalGameCanvasProps>(props);
  stateRef.current = props;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let animTime = 0;

    const render = () => {
      const s = stateRef.current;
      animTime += s.reducedStimuli ? 0.008 : 0.016;
      const now = performance.now();

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const targetW = THERMAL_CANVAS_W * dpr;
      const targetH = THERMAL_CANVAS_H * dpr;
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, THERMAL_CANVAS_W, THERMAL_CANVAS_H);

      // Day/Night factor from cycleProgress (0..1 is one full cycle: 0..0.5 day, 0.5..1 night)
      const localPhase = s.cycleProgress % 1;
      const sunWave = Math.sin(localPhase * Math.PI * 2); // +1 midday, -1 midnight
      const dayFactor = (sunWave + 1) / 2; // 1 = bright noon, 0 = deep night

      // 1. Sky Gradient (Day <-> Dusk <-> Night)
      const skyTop =
        dayFactor > 0.5
          ? lerpRgb([92, 58, 130], [14, 116, 204], (dayFactor - 0.5) * 2)
          : lerpRgb([14, 10, 38], [92, 58, 130], dayFactor * 2);
      const skyBottom =
        dayFactor > 0.5
          ? lerpRgb([245, 132, 66], [125, 211, 252], (dayFactor - 0.5) * 2)
          : lerpRgb([30, 22, 68], [245, 132, 66], dayFactor * 2);

      const skyGrad = ctx.createLinearGradient(0, 0, 0, 268);
      skyGrad.addColorStop(0, skyTop);
      skyGrad.addColorStop(1, skyBottom);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, THERMAL_CANVAS_W, 270);

      // 2. Stars at Night
      const starVis = Math.max(0, 1 - dayFactor * 2.1);
      if (starVis > 0.02) {
        for (const st of STARS) {
          const twinkle = s.reducedStimuli ? 0.8 : 0.55 + 0.45 * Math.sin(animTime * 2.6 + st.phase);
          ctx.fillStyle = `rgba(248, 250, 252, ${starVis * twinkle})`;
          ctx.beginPath();
          ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 3. Sun or Moon Celestial Arc
      if (sunWave >= -0.08) {
        const sunArc = localPhase / 0.5; // 0..1 across daytime
        const sx = lerp(90, THERMAL_CANVAS_W - 90, sunArc);
        const sy = 230 - Math.sin(Math.min(1, Math.max(0, sunArc)) * Math.PI) * 165;
        const glow = ctx.createRadialGradient(sx, sy, 8, sx, sy, 68);
        glow.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
        glow.addColorStop(0.45, 'rgba(251, 191, 36, 0.45)');
        glow.addColorStop(1, 'rgba(251, 191, 36, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(sx, sy, 68, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FEF08A';
        ctx.beginPath();
        ctx.arc(sx, sy, 22, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const nightArc = (localPhase - 0.5) / 0.5;
        const mx = lerp(110, THERMAL_CANVAS_W - 110, nightArc);
        const my = 225 - Math.sin(Math.min(1, Math.max(0, nightArc)) * Math.PI) * 155;
        ctx.fillStyle = 'rgba(186, 230, 253, 0.22)';
        ctx.beginPath();
        ctx.arc(mx, my, 36, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#E0F2FE';
        ctx.beginPath();
        ctx.arc(mx, my, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = skyTop;
        ctx.beginPath();
        ctx.arc(mx + 6, my - 4, 15, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Orbiting MODIS Satellite in upper sky
      const satX = 480 + Math.sin(animTime * 0.48) * 280;
      const satY = 54 + Math.cos(animTime * 0.9) * 8;

      // Active MODIS Scan Beam from Satellite to Ground!
      if (s.scanBeam && now - s.scanBeam.startedAt < 950) {
        const age = (now - s.scanBeam.startedAt) / 950;
        const beamAlpha = (1 - age) * 0.75;
        const beamColor = s.scanBeam.tempC >= 20 ? `rgba(251, 146, 60, ${beamAlpha})` : `rgba(56, 189, 248, ${beamAlpha})`;

        ctx.save();
        ctx.fillStyle = beamColor;
        ctx.beginPath();
        ctx.moveTo(satX - 5, satY + 14);
        ctx.lineTo(satX + 5, satY + 14);
        ctx.lineTo(s.scanBeam.x + 28, s.scanBeam.y);
        ctx.lineTo(s.scanBeam.x - 28, s.scanBeam.y);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = s.scanBeam.tempC >= 20 ? `rgba(253, 224, 71, ${beamAlpha})` : `rgba(125, 211, 252, ${beamAlpha})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(s.scanBeam.x, s.scanBeam.y, 18 + age * 26, 7 + age * 9, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Draw MODIS Satellite body
      ctx.save();
      ctx.translate(satX, satY);
      ctx.fillStyle = '#0284C7';
      ctx.strokeStyle = '#E0F2FE';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.roundRect(-38, -8, 22, 16, 3);
      ctx.roundRect(16, -8, 22, 16, 3);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#94A3B8';
      ctx.fillRect(-16, -2, 32, 4);

      ctx.fillStyle = '#E2E8F0';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-12, -13, 24, 26, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = s.scanBeam && now - s.scanBeam.startedAt < 950 ? '#34D399' : '#FACC15';
      ctx.beginPath();
      ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 5. Distant Hills
      const hillColor = lerpRgb([37, 25, 68], [161, 86, 56], dayFactor);
      ctx.fillStyle = hillColor;
      ctx.beginPath();
      ctx.moveTo(0, 262);
      ctx.lineTo(130, 212);
      ctx.lineTo(290, 248);
      ctx.lineTo(470, 206);
      ctx.lineTo(660, 244);
      ctx.lineTo(830, 210);
      ctx.lineTo(THERMAL_CANVAS_W, 240);
      ctx.lineTo(THERMAL_CANVAS_W, 275);
      ctx.lineTo(0, 275);
      ctx.closePath();
      ctx.fill();

      // 6. Surface Ground (color reacts to Day/Night surface temperature!)
      const groundTop = lerpRgb([54, 71, 112], [207, 118, 56], dayFactor);
      const groundBottom = lerpRgb([24, 31, 61], [124, 58, 28], dayFactor);
      const groundGrad = ctx.createLinearGradient(0, 252, 0, THERMAL_CANVAS_H);
      groundGrad.addColorStop(0, groundTop);
      groundGrad.addColorStop(1, groundBottom);
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, 252, THERMAL_CANVAS_W, THERMAL_CANVAS_H - 252);

      // Thermal surface shimmer (hot day) or frost crystals (cold night)
      if (!s.reducedStimuli) {
        if (s.exteriorTemp >= 25) {
          ctx.strokeStyle = 'rgba(251, 146, 60, 0.35)';
          ctx.lineWidth = 2;
          for (let i = 0; i < 6; i++) {
            const hx = 90 + i * 155;
            const hy = 278 - ((animTime * 22 + i * 13) % 24);
            ctx.beginPath();
            ctx.moveTo(hx, hy);
            ctx.quadraticCurveTo(hx + 8, hy - 8, hx, hy - 16);
            ctx.stroke();
          }
        } else if (s.exteriorTemp <= 4) {
          ctx.fillStyle = 'rgba(186, 230, 253, 0.45)';
          for (let i = 0; i < 14; i++) {
            const fx = 45 + ((i * 71) % 870);
            const fy = 268 + ((i * 37) % 120);
            ctx.beginPath();
            ctx.arc(fx, fy, 2.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // 7. Ground Rocks / Terrain Details
      ctx.fillStyle = lerpRgb([41, 52, 87], [154, 76, 36], dayFactor);
      ctx.beginPath();
      ctx.ellipse(145, 368, 34, 10, 0, 0, Math.PI * 2);
      ctx.ellipse(810, 364, 42, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // 8. Solar Power Wing (Left Side, generates energy during Day!)
      ctx.save();
      ctx.translate(155, 290);
      // Power cable to habitat
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(28, 32);
      ctx.lineTo(195, 32);
      ctx.stroke();

      const solarGenerating = dayFactor > 0.52 && !s.cocoonActive && s.status === 'PLAYING';
      if (solarGenerating) {
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([10, 12]);
        ctx.lineDashOffset = -animTime * 55;
        ctx.beginPath();
        ctx.moveTo(28, 32);
        ctx.lineTo(195, 32);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Solar stand & panel
      ctx.fillStyle = '#475569';
      ctx.fillRect(-5, 8, 10, 30);
      ctx.fillStyle = '#1E293B';
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-42, -16, 84, 34, 5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = solarGenerating ? '#0EA5E9' : '#1E3A5F';
      ctx.beginPath();
      ctx.roundRect(-37, -12, 74, 26, 3);
      ctx.fill();
      ctx.restore();

      // 9. Cutaway Space Habitat (Center)
      ctx.save();
      ctx.translate(480, 286);

      // Foundation pad
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(-135, 34, 270, 22, 8);
      ctx.fill();
      ctx.stroke();

      // Awning shade when active
      if (s.awningActive) {
        ctx.fillStyle = '#0EA5E9';
        ctx.strokeStyle = '#E0F2FE';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-148, -76);
        ctx.lineTo(148, -76);
        ctx.lineTo(132, -92);
        ctx.lineTo(-132, -92);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Shield shell styling
      const shellColors: Record<ShieldTier, { fill: string; border: string }> = {
        none: { fill: '#475569', border: '#94A3B8' },
        basic: { fill: '#CBD5E1', border: '#FFFFFF' },
        reinforced: { fill: '#0369A1', border: '#38BDF8' },
        advanced: { fill: '#CA8A04', border: '#FDE047' },
      };
      const sc = shellColors[s.shield];

      // Protective aura for reinforced/advanced
      if (s.shield === 'reinforced' || s.shield === 'advanced') {
        ctx.strokeStyle = s.shield === 'advanced' ? 'rgba(250, 204, 21, 0.45)' : 'rgba(56, 189, 248, 0.35)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.roundRect(-124, -76, 248, 114, 28);
        ctx.stroke();
      }

      // Habitat outer wall
      ctx.fillStyle = sc.fill;
      ctx.strokeStyle = sc.border;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(-118, -70, 236, 106, 24);
      ctx.fill();
      ctx.stroke();

      // Interior room background (reacts to interiorTemp!)
      const isTooHot = s.interiorTemp > 27;
      const isTooCold = s.interiorTemp < 17;
      const roomGrad = ctx.createLinearGradient(0, -56, 0, 24);
      if (isTooHot) {
        roomGrad.addColorStop(0, '#7C2D12');
        roomGrad.addColorStop(1, '#451A03');
      } else if (isTooCold) {
        roomGrad.addColorStop(0, '#0C4A6E');
        roomGrad.addColorStop(1, '#1E1B4B');
      } else {
        roomGrad.addColorStop(0, '#1E293B');
        roomGrad.addColorStop(1, '#0F172A');
      }
      ctx.fillStyle = roomGrad;
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-100, -56, 200, 80, 14);
      ctx.fill();
      ctx.stroke();

      // Frost crystals in interior corners if cold
      if (isTooCold) {
        ctx.fillStyle = 'rgba(186, 230, 253, 0.55)';
        ctx.beginPath();
        ctx.moveTo(-100, -56);
        ctx.lineTo(-76, -56);
        ctx.lineTo(-100, -34);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(100, -56);
        ctx.lineTo(76, -56);
        ctx.lineTo(100, -34);
        ctx.closePath();
        ctx.fill();
      }

      // Heater Coil (Left interior wall)
      ctx.fillStyle = s.heaterOn ? '#F97316' : '#334155';
      ctx.beginPath();
      ctx.roundRect(-92, -30, 16, 44, 4);
      ctx.fill();
      if (s.heaterOn) {
        ctx.fillStyle = '#FDE047';
        ctx.beginPath();
        ctx.roundRect(-89, -24, 10, 32, 3);
        ctx.fill();
      }

      // Cooler Fan (Right interior wall)
      ctx.save();
      ctx.translate(80, -10);
      ctx.fillStyle = s.coolerOn ? '#0284C7' : '#334155';
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      if (s.coolerOn) ctx.rotate(animTime * 11);
      ctx.strokeStyle = s.coolerOn ? '#E0F2FE' : '#64748B';
      ctx.lineWidth = 3;
      for (let b = 0; b < 3; b++) {
        ctx.rotate((Math.PI * 2) / 3);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(9, 0);
        ctx.stroke();
      }
      ctx.restore();
      ctx.restore();

      // Commander inside Habitat
      const shiverX = isTooCold && !s.reducedStimuli ? Math.sin(animTime * 28) * 1.6 : 0;
      const happyBob = !isTooHot && !isTooCold ? Math.sin(animTime * 3.5) * 1.5 : 0;

      ctx.save();
      ctx.translate(-26 + shiverX, 2 + happyBob);
      // Suit body
      ctx.fillStyle = '#38BDF8';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-11, -8, 22, 24, 6);
      ctx.fill();
      ctx.stroke();
      // Helmet
      ctx.fillStyle = '#F8FAFC';
      ctx.beginPath();
      ctx.arc(0, -18, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Visor
      ctx.fillStyle = isTooHot ? '#FB923C' : isTooCold ? '#7DD3FC' : '#22D3EE';
      ctx.beginPath();
      ctx.roundRect(-8, -23, 16, 10, 4);
      ctx.fill();
      ctx.restore();

      // ASTRO robot inside Habitat
      ctx.save();
      ctx.translate(22 + shiverX, 6 + Math.sin(animTime * 4 + 1) * 1.8);
      ctx.fillStyle = '#E2E8F0';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-12, -16, 24, 24, 7);
      ctx.fill();
      ctx.stroke();
      // Astro screen face
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.roundRect(-9, -12, 18, 13, 4);
      ctx.fill();
      // Eyes reacting to temperature!
      ctx.fillStyle = isTooHot ? '#FB923C' : isTooCold ? '#38BDF8' : '#34D399';
      ctx.beginPath();
      ctx.arc(-4, -6, 2.2, 0, Math.PI * 2);
      ctx.arc(4, -6, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Interior Temp Pill mounted on Habitat Roof
      const tempBadgeColor = isTooHot ? '#EF4444' : isTooCold ? '#0284C7' : '#10B981';
      ctx.fillStyle = '#0F172A';
      ctx.strokeStyle = tempBadgeColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(-64, -92, 128, 28, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      const signIn = s.interiorTemp >= 0 ? '+' : '';
      ctx.fillText(`Home: ${signIn}${Math.round(s.interiorTemp)} °C`, 0, -73);

      ctx.restore();

      // 10. Exterior Ground Temperature Signpost (Right Side)
      ctx.save();
      ctx.translate(812, 294);
      ctx.fillStyle = '#1E293B';
      ctx.strokeStyle = s.exteriorTemp >= 22 ? '#FB923C' : '#38BDF8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(-64, -24, 128, 46, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#CBD5E1';
      ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GROUND', 0, -7);

      ctx.fillStyle = s.exteriorTemp >= 22 ? '#FDBA74' : '#7DD3FC';
      ctx.font = 'bold 16px "JetBrains Mono", monospace';
      const signExt = s.exteriorTemp >= 0 ? '+' : '';
      ctx.fillText(`${signExt}${Math.round(s.exteriorTemp)} °C`, 0, 14);
      ctx.restore();

      // 11. Clickable MODIS Thermal Targets on the Ground!
      for (const tgt of s.targets) {
        const pulse = s.reducedStimuli ? 1 : 1 + 0.12 * Math.sin(animTime * 6);
        const isHot = tgt.tempC >= 20;
        const ringColor = isHot ? '#FB923C' : '#38BDF8';
        const fillGlow = isHot ? 'rgba(251, 146, 60, 0.28)' : 'rgba(56, 189, 248, 0.28)';

        ctx.save();
        ctx.translate(tgt.x, tgt.y);
        ctx.scale(pulse, pulse);

        ctx.fillStyle = fillGlow;
        ctx.strokeStyle = ringColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(0, 0, 34, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Inner beacon dot
        ctx.fillStyle = '#FEF08A';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();

        // Call-to-action tag
        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.roundRect(-34, -38, 68, 20, 8);
        ctx.fill();
        ctx.strokeStyle = ringColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Tap!', 0, -24);
        ctx.restore();
      }

      // 12. Floating Scan Callouts
      for (const c of s.callouts) {
        const ageMs = now - c.createdAt;
        if (ageMs > 1800) continue;
        const progress = ageMs / 1800;
        const alpha = 1 - progress * progress;
        const offsetY = -progress * 38;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = c.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(c.x - 86, c.y + offsetY - 16, 172, 26, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = c.color;
        ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(c.text, c.x, c.y + offsetY + 1);
        ctx.restore();
      }

      ctx.restore();
      rafId = window.requestAnimationFrame(render);
    };

    rafId = window.requestAnimationFrame(render);
    return () => window.cancelAnimationFrame(rafId);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * THERMAL_CANVAS_W;
    const y = ((e.clientY - rect.top) / rect.height) * THERMAL_CANVAS_H;

    // Check if user tapped any active MODIS thermal target
    const hit = props.targets.find((t) => Math.hypot(t.x - x, t.y - y) <= 58);
    props.onCanvasTap(x, y, hit?.id);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-[#543487] bg-[#160A29] shadow-2xl">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        className="block h-auto w-full aspect-[960/420] cursor-crosshair touch-manipulation"
        aria-label="Interactive 2D thermal station scene with MODIS satellite and space habitat"
      />
    </div>
  );
};
