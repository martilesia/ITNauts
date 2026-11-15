import React, { useEffect, useRef, useState } from 'react';
import { Check, CloudRain, Droplets, Flame, Mountain, ShieldCheck, Wind, X } from 'lucide-react';
import { CampaignDecisionMemory, StationId } from '../../../types/game';
import { pickAstroReaction } from '../../../utils/pedagogicalEngine';
import { soundEngine } from '../../../utils/soundEngine';
import { AstroCompanion } from '../../engine/AstroCompanion';

function useSpeakLabHint(message: string | null) {
  useEffect(() => {
    if (message) {
      soundEngine.speakShort(message);
    }
  }, [message]);
}

interface StationLabProps {
  station: StationId;
  destination: 'mars' | 'moon';
  alreadyDone: boolean;
  onDecisionRecorded?: (
    patch: Partial<CampaignDecisionMemory>,
    adapted?: boolean,
    explored?: boolean
  ) => void;
  onComplete: (station: StationId) => void;
  onClose: () => void;
}

export const EarthStationLabs: React.FC<StationLabProps> = ({
  station,
  destination,
  alreadyDone,
  onDecisionRecorded,
  onComplete,
  onClose,
}) => {
  const isMoon = destination === 'moon';
  const destLabel = isMoon ? 'Moon' : 'Mars';

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border-2 border-[#543487] bg-[#21103A] shadow-2xl">
        {/* Top bar of station */}
        <div className="flex items-center justify-between border-b border-[#462A72] bg-[#2B164A] px-5 py-3">
          <div className="flex items-center gap-2.5 text-sm font-bold text-white">
            {station === 'modis' && <Flame className="h-4 w-4 text-amber-400" />}
            {station === 'merra2' && <Wind className="h-4 w-4 text-sky-300" />}
            {station === 'srtm' && <Mountain className="h-4 w-4 text-emerald-400" />}
            {station === 'gpm' && <CloudRain className="h-4 w-4 text-sky-400" />}
            {station === 'smap' && <Droplets className="h-4 w-4 text-teal-400" />}
            <span>
              {station === 'modis' && `MODIS Thermal · Temperature & Materials (${destLabel})`}
              {station === 'merra2' && `MERRA-2 · Dust & Filters (${destLabel})`}
              {station === 'srtm' && `SRTM / ${isMoon ? 'LOLA' : 'MOLA'} · Relief & Structures (${destLabel})`}
              {station === 'gpm' && `GPM · Precipitation & Collection (${destLabel})`}
              {station === 'smap' && `SMAP · Soil Moisture & Farming (${destLabel})`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#543487] bg-[#2D174D] text-purple-200 hover:border-amber-300 hover:text-white"
            aria-label="Close workbench"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6">
          {station === 'modis' && (
            <ModisThermalLab
              destination={destination}
              alreadyDone={alreadyDone}
              onDecisionRecorded={onDecisionRecorded}
              onSuccess={() => onComplete('modis')}
            />
          )}
          {station === 'merra2' && (
            <Merra2AerosolLab
              destination={destination}
              alreadyDone={alreadyDone}
              onDecisionRecorded={onDecisionRecorded}
              onSuccess={() => onComplete('merra2')}
            />
          )}
          {station === 'srtm' && (
            <SrtmReliefLab
              destination={destination}
              alreadyDone={alreadyDone}
              onDecisionRecorded={onDecisionRecorded}
              onSuccess={() => onComplete('srtm')}
            />
          )}
          {station === 'gpm' && (
            <GpmRainLab
              destination={destination}
              alreadyDone={alreadyDone}
              onDecisionRecorded={onDecisionRecorded}
              onSuccess={() => onComplete('gpm')}
            />
          )}
          {station === 'smap' && (
            <SmapSoilLab
              destination={destination}
              alreadyDone={alreadyDone}
              onDecisionRecorded={onDecisionRecorded}
              onSuccess={() => onComplete('smap')}
            />
          )}
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   1. MODIS — Thermal Exploration + Shelter Material Consequence Test
   ============================================================================ */
const ZONES_MOON_THERMAL = [
  { id: 'polar', name: 'South Polar Crater', x: 24, y: 24, temp: -170, color: '#38BDF8', hint: 'Freezing zone (-170 °C) in permanent shadow!' },
  { id: 'mare', name: 'Sea of Tranquility', x: 46, y: 52, temp: 18, color: '#0EA5E9', hint: 'Mild temperature (+18 °C). Keep exploring the other regions!' },
  { id: 'highland', name: 'Tycho Plateau', x: 34, y: 68, temp: 76, color: '#10B981', hint: 'Very hot surface (+76 °C)!' },
  { id: 'equator', name: 'Sunlit Lunar Equator', x: 70, y: 46, temp: 120, color: '#F97316', hint: 'Extreme heat recorded (+120 °C)! Now choose the shelter coating.' },
];

const ZONES_MARS_THERMAL = [
  { id: 'polar', name: 'North Polar Cap', x: 24, y: 24, temp: -110, color: '#38BDF8', hint: 'Very cold (-110 °C)! Notice the thermal difference between poles and equator.' },
  { id: 'plain', name: 'Elysium Plain', x: 46, y: 52, temp: -32, color: '#0EA5E9', hint: 'Martian cold (-32 °C). Explore the warmer zone to the right!' },
  { id: 'jezero', name: 'Jezero Crater', x: 34, y: 68, temp: 6, color: '#10B981', hint: 'Warms at noon (+6 °C), but there is an even greater contrast in sunlight!' },
  { id: 'equator', name: 'Martian Equator', x: 70, y: 46, temp: 24, color: '#F97316', hint: 'Thermal contrast recorded! Now test a material for the shelter.' },
];

type ThermalMatId = 'reflective' | 'dark-metal' | 'polymer';

const ModisThermalLab: React.FC<{
  destination: 'mars' | 'moon';
  alreadyDone: boolean;
  onDecisionRecorded?: StationLabProps['onDecisionRecorded'];
  onSuccess: () => void;
}> = ({ destination, alreadyDone, onDecisionRecorded, onSuccess }) => {
  const isMoon = destination === 'moon';
  const ZONES = isMoon ? ZONES_MOON_THERMAL : ZONES_MARS_THERMAL;

  const [lens, setLens] = useState({ x: alreadyDone ? 70 : 32, y: alreadyDone ? 46 : 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [visitedZones, setVisitedZones] = useState<string[]>(alreadyDone ? ['polar', 'equator'] : []);
  const [phase, setPhase] = useState<'explore' | 'material'>(alreadyDone ? 'material' : 'explore');
  const [testedMat, setTestedMat] = useState<ThermalMatId | null>(alreadyDone ? 'reflective' : null);
  const [hadBadAttempt, setHadBadAttempt] = useState(false);
  const [done, setDone] = useState(alreadyDone);
  const [astroHint, setAstroHint] = useState(
    alreadyDone
      ? 'Reflective blanket validated! Without it the shelter would overheat in sun and freeze in shadow, but with it it held a steady 21 °C.'
      : 'Thermal problem: temperature swings wildly between shadow and sunlight! Step 1: drag the lens across 2 different regions (one cold, one hot) to measure the hazard before choosing the shelter material.'
  );
  useSpeakLabHint(astroHint);
  const areaRef = useRef<HTMLDivElement>(null);

  const activeZone = ZONES.reduce((best, z) => {
    const d = Math.hypot(z.x - lens.x, z.y - lens.y);
    const bd = Math.hypot(best.x - lens.x, best.y - lens.y);
    return d < bd ? z : best;
  }, ZONES[0]);

  const activeDist = Math.hypot(activeZone.x - lens.x, activeZone.y - lens.y);
  const nearZone = activeDist < 17 ? activeZone : null;

  useEffect(() => {
    if (!nearZone || phase !== 'explore') return;
    if (!visitedZones.includes(nearZone.id)) {
      const next = [...visitedZones, nearZone.id];
      setVisitedZones(next);
      soundEngine.playScan();
      if (next.length >= 2) {
        setPhase('material');
        setAstroHint(
          pickAstroReaction('m1-thermal-found', [
            `You discovered swings from ${ZONES[0].temp} °C to +${ZONES[3].temp} °C! Now test a material to protect the shelter.`,
            `Good observation! Since the ground temperature shifts so much, choose the coating for the test shelter.`,
          ])
        );
      } else {
        setAstroHint(`${nearZone.name} (${nearZone.temp > 0 ? '+' : ''}${nearZone.temp} °C) observed! Explore one more distant zone.`);
      }
    }
  }, [ZONES, nearZone, phase, visitedZones]);

  const handleMove = (clientX: number, clientY: number) => {
    if (!areaRef.current) return;
    const rect = areaRef.current.getBoundingClientRect();
    const x = Math.min(92, Math.max(8, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.min(88, Math.max(12, ((clientY - rect.top) / rect.height) * 100));
    setLens({ x, y });
  };

  const handleTestMaterial = (mat: ThermalMatId) => {
    setTestedMat(mat);
    if (mat === 'dark-metal') {
      soundEngine.playGentleError();
      setHadBadAttempt(true);
      onDecisionRecorded?.({ m1ThermalShield: mat }, false, false);
      setAstroHint(
        pickAstroReaction('m1-dark-metal', [
          'The dark plate absorbed solar radiation and heated the shelter to +68 °C! Want to try another coating?',
          'Careful: dark metal traps too much heat! Test a material that reflects light.',
        ])
      );
      return;
    }
    if (mat === 'polymer') {
      soundEngine.playGentleError();
      setHadBadAttempt(true);
      onDecisionRecorded?.({ m1ThermalShield: mat }, false, false);
      setAstroHint(
        pickAstroReaction('m1-polymer', [
          'The thin plastic let the night cold inside (-34 °C)! Try an insulating, reflective layer.',
          'Too cold inside! Such a thin material cannot withstand the thermal swing.',
        ])
      );
      return;
    }

    // Reflective gold foil succeeds!
    soundEngine.playSuccess();
    setDone(true);
    onDecisionRecorded?.({ m1ThermalShield: 'reflective' }, hadBadAttempt, true);
    setAstroHint(
      hadBadAttempt
        ? 'Great adaptation! The reflective gold blanket kept the shelter at 21 °C — we will use it on our base!'
        : 'Spot-on choice! The reflective gold blanket kept a steady 21 °C and will protect our habitat!'
    );
    onSuccess();
  };

  const shelterInternalTemp =
    testedMat === 'dark-metal' ? '+68 °C (Overheated)' : testedMat === 'polymer' ? '-34 °C (Frozen)' : testedMat === 'reflective' ? '+21 °C (Stable)' : '-- °C';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-purple-100">{astroHint}</p>
        <div className="font-mono-tabular text-base font-bold text-amber-300 whitespace-nowrap">
          {nearZone ? `${nearZone.name} · ${nearZone.temp > 0 ? '+' : ''}${nearZone.temp} °C` : `${visitedZones.length}/2 regions`}
        </div>
      </div>

      {/* Interactive Thermal Map */}
      <div
        ref={areaRef}
        onPointerDown={(e) => {
          setIsDragging(true);
          handleMove(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (isDragging || e.buttons === 1) handleMove(e.clientX, e.clientY);
        }}
        onPointerUp={() => setIsDragging(false)}
        onPointerCancel={() => setIsDragging(false)}
        onPointerLeave={() => setIsDragging(false)}
        className="relative h-52 w-full cursor-grab active:cursor-grabbing overflow-hidden rounded-xl border-2 border-[#543487] select-none touch-none"
        style={{ backgroundColor: isMoon ? '#241E36' : '#32170E' }}
      >
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
          <path d="M5,10 Q30,5 55,15 L45,32 L10,30 Z" fill={isMoon ? '#4C436B' : '#7C2D12'} />
          <path d="M18,36 Q32,38 38,52 L42,82 L26,84 L20,62 Z" fill={isMoon ? '#393252' : '#5C2918'} />
          <path d="M56,30 Q78,28 84,52 L75,82 L60,74 L55,50 Z" fill={isMoon ? '#5E537F' : '#8A3E20'} />
          {ZONES.map((z) => {
            const dist = Math.hypot(z.x - lens.x, z.y - lens.y);
            const intensity = Math.max(0.14, 1 - dist / 28);
            const seen = visitedZones.includes(z.id);
            return (
              <g key={z.id}>
                <circle cx={z.x} cy={z.y} r="13" fill={z.color} fillOpacity={intensity * 0.65} />
                {(dist < 18 || seen) && (
                  <text x={z.x} y={z.y - 10} textAnchor="middle" fill="#F8FAFC" fontSize="3.8" fontWeight="bold">
                    {z.name} ({z.temp > 0 ? '+' : ''}{z.temp}°)
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-300 shadow-[0_0_24px_rgba(251,191,36,0.45)]"
          style={{
            left: `${lens.x}%`,
            top: `${lens.y}%`,
            width: 78,
            height: 78,
            background: 'radial-gradient(circle, rgba(251,191,36,0.18) 0%, transparent 70%)',
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-amber-300" />
          </div>
        </div>
      </div>

      {/* Step 2: Material Consequence Experiment */}
      {phase === 'material' && (
        <div className="rounded-xl border border-[#543487] bg-[#160A29] p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-sky-300">
              Step 2 · Thermal Experiment: Choose the shelter coating
            </span>
            <span
              className={`rounded-lg px-2.5 py-1 text-xs font-mono-tabular font-bold ${
                testedMat === 'reflective'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : testedMat
                    ? 'bg-rose-500/20 text-rose-300'
                    : 'bg-[#2D174D] text-purple-200'
              }`}
            >
              Shelter Interior: {shelterInternalTemp}
            </span>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-3">
            {(
              [
                {
                  id: 'dark-metal',
                  title: 'Thin Dark Plate',
                  desc: 'Thin metal painted black',
                  swatch: '#1E293B',
                },
                {
                  id: 'reflective',
                  title: 'Reflective Gold Blanket',
                  desc: 'Insulating layers that reflect sunlight',
                  swatch: '#FACC15',
                },
                {
                  id: 'polymer',
                  title: 'Simple Plastic',
                  desc: 'Light film without thermal insulation',
                  swatch: '#93C5FD',
                },
              ] as const
            ).map((opt) => {
              const selected = testedMat === opt.id;
              const isGood = opt.id === 'reflective' && selected;
              const isBad = opt.id !== 'reflective' && selected;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleTestMaterial(opt.id)}
                  className={`flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition-all ${
                    isGood
                      ? 'border-emerald-400 bg-emerald-500/20'
                      : isBad
                        ? 'border-rose-400 bg-rose-500/20'
                        : 'border-[#462A72] bg-[#21103A] hover:border-amber-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 rounded-full border border-white/40" style={{ backgroundColor: opt.swatch }} />
                    <span className="text-xs font-bold text-white">{opt.title}</span>
                  </div>
                  <span className="text-[11px] text-purple-200/80">{opt.desc}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-purple-200/80">
        <span>Simulated surface data · Thermal observation</span>
        {done && (
          <span className="inline-flex items-center gap-1.5 font-bold text-emerald-400">
            <Check className="h-4 w-4" /> Shelter protected for Base
          </span>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
   2. MERRA-2 — Suspended Particles + Filter Selection Consequence
   ============================================================================ */
const Merra2AerosolLab: React.FC<{
  destination: 'mars' | 'moon';
  alreadyDone: boolean;
  onDecisionRecorded?: StationLabProps['onDecisionRecorded'];
  onSuccess: () => void;
}> = ({ destination, alreadyDone, onDecisionRecorded, onSuccess }) => {
  const isMoon = destination === 'moon';
  const [filterTuning, setFilterTuning] = useState(alreadyDone ? 78 : 15);
  const [windAngle, setWindAngle] = useState(alreadyDone ? 180 : 40);
  const [testedFilter, setTestedFilter] = useState<'coarse-mesh' | 'electrostatic' | null>(
    alreadyDone ? 'electrostatic' : null
  );
  const [hadBadAttempt, setHadBadAttempt] = useState(false);
  const [done, setDone] = useState(alreadyDone);
  const [feedback, setFeedback] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const labMessage =
    feedback ??
    (done
      ? `Particles tracked and filter validated! Without a filter, ${isMoon ? 'lunar' : 'Martian'} dust would enter equipment and panels; the electrostatic filter blocked it all.`
      : `Atmospheric problem: fine suspended dust can clog filters and cover solar panels. 1. Adjust the Optical Filter and Flow Direction until you see the dust cloud; 2. Test both filters to find which one stops it!`);
  useSpeakLabHint(labMessage);

  const filterAligned = filterTuning >= 68 && filterTuning <= 88;
  const windAligned = Math.abs(windAngle - 180) <= 22;
  const flowDetected = filterAligned && windAligned;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const particles = Array.from({ length: 52 }, (_, i) => ({
      x: (i * 23) % 520,
      y: 65 + Math.sin(i * 1.3) * 42,
      r: 2 + (i % 3),
      speed: 0.9 + (i % 4) * 0.35,
    }));

    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = isMoon ? '#140F24' : '#26100B';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = isMoon ? '#4B4366' : '#7C2D12';
      ctx.fillRect(0, 145, 540, 65);

      // Draw Filter Barrier at x = 180 when testing a filter
      if (testedFilter) {
        ctx.strokeStyle = testedFilter === 'electrostatic' ? '#34D399' : '#F59E0B';
        ctx.lineWidth = testedFilter === 'electrostatic' ? 6 : 3;
        ctx.setLineDash(testedFilter === 'electrostatic' ? [] : [8, 8]);
        ctx.beginPath();
        ctx.moveTo(180, 18);
        ctx.lineTo(180, 145);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      const visibility = filterAligned ? 0.92 : Math.max(0.14, 1 - Math.abs(filterTuning - 78) / 60);
      particles.forEach((p) => {
        p.x -= p.speed * 1.5;
        // Electrostatic filter blocks particles before reaching the clean chamber (x < 180)
        if (testedFilter === 'electrostatic' && p.x < 184) {
          p.x = 520;
        }
        if (p.x < 10) p.x = 520;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * (filterAligned ? 1.45 : 1), 0, Math.PI * 2);
        ctx.fillStyle = filterAligned
          ? isMoon
            ? `rgba(196, 181, 220, ${visibility})`
            : `rgba(251, 146, 60, ${visibility})`
          : `rgba(148, 163, 184, ${visibility * 0.45})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };
    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, [filterAligned, filterTuning, isMoon, testedFilter]);

  const handleTestFilter = (kind: 'coarse-mesh' | 'electrostatic') => {
    if (!flowDetected) {
      soundEngine.playGentleError();
      setFeedback('First tune the optical filter and point the flow in the right direction!');
      return;
    }
    setTestedFilter(kind);
    if (kind === 'coarse-mesh') {
      soundEngine.playGentleError();
      setHadBadAttempt(true);
      onDecisionRecorded?.({ m1DustFilter: 'coarse-mesh' }, false, false);
      setFeedback(
        pickAstroReaction('m1-coarse-mesh', [
          'Look at the chamber: fine dust slipped right through the wide holes! Which filter can trap microparticles?',
          'The coarse mesh let dust straight into the base! Try the electrostatic filter.',
        ])
      );
      return;
    }

    soundEngine.playSuccess();
    setDone(true);
    onDecisionRecorded?.({ m1DustFilter: 'electrostatic' }, hadBadAttempt, true);
    setFeedback(
      'Electrostatic filter active! Not a single particle got through — this protection will help in Mission 2.'
    );
    onSuccess();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <AstroCompanion mood={done ? 'happy' : testedFilter === 'coarse-mesh' ? 'alert' : 'curious'} size={52} showCaptions={false} />
        <p className="text-sm leading-relaxed text-purple-100">{labMessage}</p>
      </div>

      <div className="relative overflow-hidden rounded-xl border-2 border-[#543487]">
        <canvas ref={canvasRef} width={540} height={200} className="h-44 w-full object-cover" />
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
          style={{ transform: `translate(-50%, -50%) rotate(${windAngle}deg)` }}
        >
          <div
            className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold ${
              windAligned
                ? 'border-emerald-400 bg-emerald-500/25 text-emerald-200'
                : 'border-sky-300 bg-[#190B2E]/90 text-sky-200'
            }`}
          >
            <span>Flow →</span>
          </div>
        </div>
        {testedFilter && (
          <div className="pointer-events-none absolute left-3 top-2 rounded bg-black/75 px-2.5 py-1 text-[11px] font-bold text-white">
            {testedFilter === 'electrostatic' ? 'Clean Chamber (98% Trapped)' : 'Dust Passing Through!'}
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="rounded-xl border border-[#462A72] bg-[#190B2E] p-3">
          <div className="flex justify-between text-xs font-semibold text-purple-100">
            <span>Optical Dust Filter</span>
            <span className={filterAligned ? 'text-emerald-400' : 'text-amber-300'}>
              {filterAligned ? 'Cloud Visible' : 'Adjust'}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={filterTuning}
            onChange={(e) => setFilterTuning(Number(e.target.value))}
            className="mt-2 w-full accent-amber-400"
          />
        </label>

        <label className="rounded-xl border border-[#462A72] bg-[#190B2E] p-3">
          <div className="flex justify-between text-xs font-semibold text-purple-100">
            <span>Flow Direction</span>
            <span className={windAligned ? 'text-emerald-400' : 'text-sky-300'}>
              {windAligned ? 'Aligned' : 'Rotate arrow'}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={360}
            value={windAngle}
            onChange={(e) => setWindAngle(Number(e.target.value))}
            className="mt-2 w-full accent-sky-400"
          />
        </label>
      </div>

      <div className="rounded-xl border border-[#543487] bg-[#160A29] p-3 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-semibold text-sky-300">
          {flowDetected ? 'Step 2 · Choose and test a filter in the dust stream:' : 'Align the 2 controls above to test the filters'}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!flowDetected}
            onClick={() => handleTestFilter('coarse-mesh')}
            className={`h-10 rounded-xl border px-3.5 text-xs font-bold transition-colors disabled:opacity-45 ${
              testedFilter === 'coarse-mesh'
                ? 'border-rose-400 bg-rose-500/20 text-rose-200'
                : 'border-[#543487] bg-[#2D174D] text-purple-100 hover:border-amber-300'
            }`}
          >
            Test Coarse Mesh
          </button>
          <button
            type="button"
            disabled={!flowDetected}
            onClick={() => handleTestFilter('electrostatic')}
            className={`inline-flex h-10 items-center gap-1.5 rounded-xl border px-3.5 text-xs font-bold transition-colors disabled:opacity-45 ${
              testedFilter === 'electrostatic'
                ? 'border-emerald-400 bg-emerald-500/25 text-emerald-200'
                : 'border-sky-400/70 bg-sky-500/20 text-sky-100 hover:bg-sky-500/35'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Test Electrostatic Filter</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   3. SRTM / LOLA / MOLA — Relief Profile + Visual Signal / Tilt Consequence
   ============================================================================ */
const SRTM_HEIGHTS = [82, 92, 65, 22, 16, 48, 48, 48, 76, 95, 58]; // 5..7 = flat plateau, 3..4 = valley, rest = steep/peak

const SrtmReliefLab: React.FC<{
  destination: 'mars' | 'moon';
  alreadyDone: boolean;
  onDecisionRecorded?: StationLabProps['onDecisionRecorded'];
  onSuccess: () => void;
}> = ({ destination, alreadyDone, onDecisionRecorded, onSuccess }) => {
  const isMoon = destination === 'moon';
  const radarName = isMoon ? 'LOLA' : 'MOLA';

  const [scanIndex, setScanIndex] = useState(alreadyDone ? 6 : 1);
  const [placedIndex, setPlacedIndex] = useState<number | null>(alreadyDone ? 6 : null);
  const [hadBadAttempt, setHadBadAttempt] = useState(false);
  const [feedback, setFeedback] = useState(
    alreadyDone
      ? `Flat plateau validated by the ${radarName} radar! Here the tower does not tilt and the signal does not hit mountains.`
      : `Relief problem: if we build in a valley, mountains block communications, and on a slope the structure tilts. Slide the ${radarName} radar and tap "Install Repeater Here" to test different spots and find a stable plateau!`
  );
  useSpeakLabHint(feedback);

  const isFlatHere = scanIndex >= 5 && scanIndex <= 7;
  const placedKind =
    placedIndex === null
      ? null
      : placedIndex >= 5 && placedIndex <= 7
        ? 'flat'
        : placedIndex === 3 || placedIndex === 4
          ? 'valley'
          : 'slope';

  const handleInstall = () => {
    setPlacedIndex(scanIndex);
    if (isFlatHere) {
      soundEngine.playSuccess();
      onDecisionRecorded?.({ m1ReliefValidated: true }, hadBadAttempt, true);
      setFeedback(
        hadBadAttempt
          ? 'Great adaptation! On the level plateau the repeater stands straight and the beam passes freely to orbit!'
          : 'Perfect! On the flat plateau the tower sits firmly and communicates cleanly with orbit.'
      );
      onSuccess();
    } else if (scanIndex === 3 || scanIndex === 4) {
      soundEngine.playGentleError();
      setHadBadAttempt(true);
      setFeedback(
        pickAstroReaction('m1-valley', [
          'Look at the signal beam: the surrounding mountains blocked the antenna at the bottom of the valley! Try moving it to a raised flat zone.',
          'At the bottom of the valley the signal hits the slopes! Try another point on the profile.',
        ])
      );
    } else {
      soundEngine.playGentleError();
      setHadBadAttempt(true);
      setFeedback(
        pickAstroReaction('m1-slope', [
          'See how the tower tilted on this slope? Steep terrain makes construction difficult — look for a level plateau!',
          'Steep slope! The antenna base is unstable. Shall we test a flatter surface?',
        ])
      );
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-purple-100">{feedback}</p>

      <div className="relative h-56 overflow-hidden rounded-xl border-2 border-[#543487] bg-[#160A29] p-4">
        <svg viewBox="0 0 220 110" className="h-full w-full">
          <line x1="0" y1="30" x2="220" y2="30" stroke="#361D5C" strokeDasharray="3 3" />
          <line x1="0" y1="60" x2="220" y2="60" stroke="#361D5C" strokeDasharray="3 3" />
          <line x1="0" y1="90" x2="220" y2="90" stroke="#361D5C" strokeDasharray="3 3" />

          <polygon
            points={`0,110 ${SRTM_HEIGHTS.map((h, i) => `${i * 22},${105 - h * 0.85}`).join(' ')} 220,110`}
            fill={isMoon ? '#4B4366' : '#6B2F1B'}
            stroke={isMoon ? '#C4B5DC' : '#FB923C'}
            strokeWidth="2"
          />

          <line
            x1={scanIndex * 20 + 10}
            y1="0"
            x2={scanIndex * 20 + 10}
            y2="110"
            stroke={isFlatHere ? '#34D399' : '#FACC15'}
            strokeWidth="2"
            strokeDasharray="4 2"
          />
          <circle
            cx={scanIndex * 20 + 10}
            cy={105 - SRTM_HEIGHTS[Math.min(10, scanIndex)] * 0.85}
            r="4.5"
            fill={isFlatHere ? '#34D399' : '#FACC15'}
          />

          {/* Placed Repeater + Physical Consequence (upright + clean beam vs tilted vs blocked beam) */}
          {placedIndex !== null && (
            <g
              transform={`translate(${placedIndex * 20 + 10}, ${105 - SRTM_HEIGHTS[placedIndex] * 0.85}) rotate(${
                placedKind === 'slope' ? (placedIndex < 5 ? -22 : 22) : 0
              })`}
            >
              <rect
                x="-3"
                y="-13"
                width="6"
                height="13"
                fill={placedKind === 'flat' ? '#38BDF8' : '#F59E0B'}
              />
              <circle cx="0" cy="-15" r="3.2" fill={placedKind === 'flat' ? '#34D399' : '#FB7185'} />
              {placedKind === 'flat' && (
                <line x1="0" y1="-18" x2="0" y2="-65" stroke="#34D399" strokeWidth="1.8" strokeDasharray="3 2" />
              )}
              {placedKind === 'valley' && (
                <line x1="0" y1="-16" x2="26" y2="-38" stroke="#FB7185" strokeWidth="1.8" strokeDasharray="3 2" />
              )}
            </g>
          )}
        </svg>

        <div className="absolute right-4 top-3 rounded-lg border border-[#543487] bg-[#21103A]/95 px-3 py-1 text-xs font-semibold text-purple-100">
          Relief:{' '}
          <span className={isFlatHere ? 'text-emerald-400' : 'text-amber-300'}>
            {isFlatHere ? 'Flat Plateau' : scanIndex === 3 || scanIndex === 4 ? 'Deep Valley' : 'Slope / Peak'}
          </span>
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={10}
        step={1}
        value={scanIndex}
        onChange={(e) => {
          soundEngine.playScan();
          setScanIndex(Number(e.target.value));
        }}
        className="w-full accent-emerald-400"
        aria-label={`Move ${radarName} radar beam`}
      />

      <div className="flex items-center justify-between">
        <span className="text-xs text-purple-200/80">
          Try placing it on different terrain types to observe signal and stability
        </span>
        <button
          type="button"
          onClick={handleInstall}
          className={`inline-flex h-11 items-center gap-2 rounded-full border-2 border-white border-b-4 px-5 text-sm font-bold shadow ${
            placedKind === 'flat'
              ? 'bg-emerald-400 text-slate-950'
              : 'bg-gradient-to-b from-[#38BDF8] to-[#0284C7] text-white'
          }`}
        >
          <Mountain className="h-4 w-4" />
          <span>{placedIndex !== null ? 'Move / Install Here' : 'Install Repeater Here'}</span>
        </button>
      </div>
    </div>
  );
};

/* ============================================================================
   4. GPM — Rain/Ice Simulation + Collector Yield Experiment
   ============================================================================ */
const GpmRainLab: React.FC<{
  destination: 'mars' | 'moon';
  alreadyDone: boolean;
  onDecisionRecorded?: StationLabProps['onDecisionRecorded'];
  onSuccess: () => void;
}> = ({ destination, alreadyDone, onDecisionRecorded, onSuccess }) => {
  const isMoon = destination === 'moon';
  const ZONES = isMoon
    ? [
        { id: 'arid', name: 'Dry Equator', baseIce: 10 },
        { id: 'coast', name: 'Crater Rim', baseIce: 60 },
        { id: 'tropic', name: 'Shaded Polar Crater', baseIce: 95 },
      ]
    : [
        { id: 'arid', name: 'Martian Desert', baseIce: 10 },
        { id: 'coast', name: 'Shaded Slope', baseIce: 60 },
        { id: 'tropic', name: 'North Polar Cap', baseIce: 95 },
      ];

  const [selectedZone, setSelectedZone] = useState<string>(alreadyDone ? 'tropic' : 'arid');
  const [testing, setTesting] = useState(false);
  const [fillLevel, setFillLevel] = useState(alreadyDone ? 95 : 0);
  const [hadBadAttempt, setHadBadAttempt] = useState(false);
  const [done, setDone] = useState(alreadyDone);
  const [astroMsg, setAstroMsg] = useState(
    alreadyDone
      ? `Reserves located! We learned that placing the collector in dry zones barely fills the tank, while in ${isMoon ? "the Moon's" : "Mars's"} richest zone we gather water quickly.`
      : 'Water problem: rain or ice varies widely by region; if you place the collector in the wrong spot, the base runs out of water. Tap the 3 regions below to test the collector and discover where it fills fastest!'
  );
  useSpeakLabHint(astroMsg);

  const handleTestCollector = (zoneId: string) => {
    if (testing) return;
    setSelectedZone(zoneId);
    setTesting(true);
    setFillLevel(0);
    soundEngine.playScan();
    const target = ZONES.find((z) => z.id === zoneId)?.baseIce ?? 10;

    let current = 0;
    const interval = setInterval(() => {
      current += Math.max(4, Math.ceil(target / 10));
      if (current >= target) {
        current = target;
        clearInterval(interval);
        setTesting(false);
        if (target < 50) {
          soundEngine.playGentleError();
          setHadBadAttempt(true);
          setAstroMsg(
            pickAstroReaction('m1-gpm-dry', [
              `Oops! It only filled ${target}% — there is barely any water or ice here. Try placing the collector in another region!`,
              `The tank barely rose (${target}%)! Rain/ice varies greatly from place to place.`,
            ])
          );
        } else {
          soundEngine.playSuccess();
          setDone(true);
          onDecisionRecorded?.({ m1RainCollectorTested: true }, hadBadAttempt, true);
          setAstroMsg(
            `Great discovery! Here we collected ${target}% in no time — we'll use this clue in Mission 4.`
          );
          onSuccess();
        }
      }
      setFillLevel(current);
    }, 110);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-purple-100">{astroMsg}</p>
        <div className="rounded-xl border border-sky-400/50 bg-[#160A29] px-3 py-1.5 text-xs font-mono-tabular text-sky-200">
          Test Beaker: <strong>{fillLevel}%</strong>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {ZONES.map((z) => {
          const isCurrent = selectedZone === z.id;
          const crystals = z.baseIce > 70 ? 12 : z.baseIce > 40 ? 6 : 1;
          return (
            <button
              key={z.id}
              type="button"
              disabled={testing}
              onClick={() => handleTestCollector(z.id)}
              className={`relative flex h-44 flex-col justify-between overflow-hidden rounded-xl border-2 p-3 text-left transition-colors ${
                isCurrent
                  ? z.baseIce >= 50
                    ? 'border-emerald-400 bg-[#2C1852]'
                    : 'border-amber-400 bg-[#2C1852]'
                  : 'border-[#462A72] bg-[#190B2E] hover:border-sky-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{z.name}</span>
                <CloudRain className={`h-5 w-5 ${z.baseIce > 50 ? 'text-sky-300' : 'text-purple-300/60'}`} />
              </div>

              <div className="relative flex-1 overflow-hidden">
                {Array.from({ length: crystals }).map((_, i) => (
                  <span
                    key={i}
                    className="absolute w-1 rounded-full bg-cyan-300/80 animate-bounce"
                    style={{
                      left: `${10 + ((i * 19) % 80)}%`,
                      top: `${(i * 23) % 65}%`,
                      height: z.baseIce > 70 ? 10 : 6,
                      animationDuration: `${450 + (i % 4) * 120}ms`,
                    }}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-[#462A72] pt-2 text-xs">
                <span className="font-semibold text-sky-300">
                  {isCurrent && testing ? 'Collecting...' : isCurrent ? 'Tested Here' : 'Test Collector'}
                </span>
                {isCurrent && !testing && (
                  <span className="font-mono-tabular text-sky-200">{fillLevel}%</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Live Transparent Beaker Feedback */}
      <div className="flex items-center gap-4 rounded-xl border border-[#462A72] bg-[#160A29] p-3">
        <div className="relative h-12 w-10 overflow-hidden rounded-b-lg border-2 border-sky-300/60 bg-slate-950 shrink-0">
          <div
            className="absolute inset-x-0 bottom-0 bg-sky-400/80 transition-all duration-150"
            style={{ height: `${fillLevel}%` }}
          />
        </div>
        <div className="text-xs text-purple-100/90">
          {done
            ? `You compared collection yields and proved that higher-concentration zones provide far more water.`
            : `Choose any region above to test the collector over a short cycle.`}
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   5. SMAP — Soil Probe + Sprout Consequence Experiment (Dry vs Balanced vs Soaked)
   ============================================================================ */
const SmapSoilLab: React.FC<{
  destination: 'mars' | 'moon';
  alreadyDone: boolean;
  onDecisionRecorded?: StationLabProps['onDecisionRecorded'];
  onSuccess: () => void;
}> = ({ destination, alreadyDone, onDecisionRecorded, onSuccess }) => {
  const isMoon = destination === 'moon';
  const PATCHES = [
    { id: 'dry', label: isMoon ? 'Dry Dust' : 'Dry Sand', moisture: 'Low (8%)', color: '#A16207', dots: 2 },
    { id: 'balanced', label: isMoon ? 'Balanced Regolith' : 'Balanced Soil', moisture: 'Balanced (32%)', color: '#06B6D4', dots: 8 },
    { id: 'icy', label: isMoon ? 'Waterlogged Regolith' : 'Waterlogged Soil', moisture: 'Excess (48%)', color: '#1D4ED8', dots: 15 },
  ];

  const [scanned, setScanned] = useState<number[]>(alreadyDone ? [0, 1, 2] : []);
  const [plantedIdx, setPlantedIdx] = useState<number | null>(alreadyDone ? 1 : null);
  const [hadBadAttempt, setHadBadAttempt] = useState(false);
  const [done, setDone] = useState(alreadyDone);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleProbe = (idx: number) => {
    soundEngine.playScan();
    setScanned((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
  };

  const handlePlantExperiment = (idx: number) => {
    if (!scanned.includes(idx)) {
      handleProbe(idx);
    }
    setPlantedIdx(idx);
    if (idx === 0) {
      soundEngine.playGentleError();
      setHadBadAttempt(true);
      setFeedback(
        pickAstroReaction('m1-soil-dry', [
          'The seed dried out! Even after a quick rain, sandy soils do not retain enough moisture.',
          'Not enough moisture retained in the roots! Try planting in another sample.',
        ])
      );
      return;
    }
    if (idx === 2) {
      soundEngine.playGentleError();
      setHadBadAttempt(true);
      setFeedback(
        pickAstroReaction('m1-soil-wet', [
          'Too much water! The roots were submerged with no oxygen. More water does not always mean better soil!',
          'Waterlogged! See how excess moisture also harms growth?',
        ])
      );
      return;
    }

    soundEngine.playSuccess();
    setDone(true);
    onDecisionRecorded?.({ m1SoilSeedTested: true }, hadBadAttempt, true);
    setFeedback(
      `Sprouted healthily! Balanced moisture let the roots drink water and breathe — perfect for the greenhouse!`
    );
    onSuccess();
  };

  const smapMessage =
    feedback ??
    (done
      ? 'Balanced soil validated! If the soil is too dry the seed wilts; if it is waterlogged the roots drown without air.'
      : 'Farming problem: soil moisture is different from surface water! 1. Tap the 3 soils to probe them; 2. Click "Plant Test" to observe what happens in each soil and discover which grows strong!');
  useSpeakLabHint(smapMessage);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <AstroCompanion mood={done ? 'happy' : plantedIdx !== null ? 'alert' : 'curious'} size={52} showCaptions={false} />
        <p className="text-sm leading-relaxed text-purple-100">{smapMessage}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {PATCHES.map((patch, idx) => {
          const isScanned = scanned.includes(idx);
          const isPlantedHere = plantedIdx === idx;
          return (
            <div
              key={patch.id}
              className={`flex flex-col justify-between rounded-xl border-2 p-3 transition-all ${
                isPlantedHere
                  ? idx === 1
                    ? 'border-emerald-400 bg-[#2C1852]'
                    : 'border-amber-400 bg-[#2C1852]'
                  : 'border-[#462A72] bg-[#190B2E]'
              }`}
            >
              <button
                type="button"
                onClick={() => handleProbe(idx)}
                className="text-left"
              >
                <span className="text-xs font-bold text-white">{patch.label}</span>
                <div
                  className="relative my-2 h-20 overflow-hidden rounded-lg border border-[#462A72] p-2"
                  style={{
                    backgroundColor: isMoon
                      ? idx === 0
                        ? '#4B4559'
                        : idx === 1
                          ? '#3E3852'
                          : '#1E293B'
                      : idx === 0
                        ? '#5C4024'
                        : idx === 1
                          ? '#4B2D1F'
                          : '#1E293B',
                  }}
                >
                  {isScanned ? (
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from({ length: patch.dots }).map((_, d) => (
                        <span key={d} className="h-2 w-2 rounded-full" style={{ backgroundColor: patch.color }} />
                      ))}
                    </div>
                  ) : (
                    <span className="text-[11px] text-purple-100/75">1. Tap to Probe</span>
                  )}

                  {/* Sprout visual consequence */}
                  {isPlantedHere && (
                    <div className="absolute bottom-1 right-2 text-xs font-bold">
                      {idx === 1 ? (
                        <span className="text-emerald-300">🌱 Thriving!</span>
                      ) : idx === 0 ? (
                        <span className="text-amber-300">🥀 Dry</span>
                      ) : (
                        <span className="text-sky-300">💧 Drowned</span>
                      )}
                    </div>
                  )}
                </div>
                <span className="text-[11px] font-semibold text-sky-300">
                  {isScanned ? patch.moisture : 'No reading'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handlePlantExperiment(idx)}
                className="mt-2.5 h-9 rounded-lg border border-[#543487] bg-[#2D174D] text-xs font-bold text-white hover:border-amber-300"
              >
                {isPlantedHere ? 'Tested Here' : '2. Plant Test'}
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-xs text-purple-200/80">
        <span>Simulated soil moisture data · Hands-on experiment</span>
        {done && <span className="font-bold text-emerald-400">Concept applied ✓</span>}
      </div>
    </div>
  );
};

