import React, { useState } from 'react';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Compass,
  Droplets,
  Play,
  Radio,
  RotateCcw,
  Satellite,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { soundEngine } from '../../utils/soundEngine';
import { AstroCompanion } from '../engine/AstroCompanion';
import { CommanderSprite } from '../engine/CommanderSprite';
import { DiscoveryCodexModal } from '../engine/DiscoveryCodexModal';
import { GameHUD } from '../engine/GameHUD';

type InterfaceStep = 'BRIEFING' | 'SATELLITE_MAP' | 'ANALYSIS' | 'QUIZ_CHALLENGE';
type RegionId = 'A' | 'B' | 'C';

interface RegionInfo {
  id: RegionId;
  name: string;
  moisturePct: number;
  statusLabel: string;
  colorName: string;
  cardBg: string;
  cardBorder: string;
  badgeBg: string;
  mapX: number;
  mapY: number;
  terrainHint: string;
}

const REGIONS: RegionInfo[] = [
  {
    id: 'A',
    name: 'Region A',
    moisturePct: 8,
    statusLabel: 'Very dry soil',
    colorName: 'Red',
    cardBg: 'bg-rose-500/15',
    cardBorder: 'border-rose-400',
    badgeBg: 'bg-rose-600',
    mapX: 22,
    mapY: 54,
    terrainHint: 'Dry sandy ground',
  },
  {
    id: 'B',
    name: 'Region B',
    moisturePct: 32,
    statusLabel: 'Moderately moist soil',
    colorName: 'Green',
    cardBg: 'bg-emerald-500/15',
    cardBorder: 'border-emerald-400',
    badgeBg: 'bg-emerald-600',
    mapX: 50,
    mapY: 44,
    terrainHint: 'Balanced green meadow',
  },
  {
    id: 'C',
    name: 'Region C',
    moisturePct: 45,
    statusLabel: 'Very moist soil',
    colorName: 'Blue',
    cardBg: 'bg-sky-500/15',
    cardBorder: 'border-sky-400',
    badgeBg: 'bg-sky-600',
    mapX: 78,
    mapY: 56,
    terrainHint: 'Fertile valley by the river',
  },
];

const SatelliteSvg: React.FC<{ scanning?: boolean; size?: number }> = ({ scanning = false, size = 84 }) => (
  <svg
    viewBox="0 0 96 96"
    style={{ width: size, height: size }}
    className={scanning ? 'animate-pulse' : 'animate-astro-float'}
    aria-hidden="true"
  >
    {/* Solar Wings */}
    <rect x="6" y="34" width="24" height="22" rx="4" fill="#0284C7" stroke="#E0F2FE" strokeWidth="2" />
    <line x1="14" y1="34" x2="14" y2="56" stroke="#7DD3FC" strokeWidth="1.5" />
    <line x1="22" y1="34" x2="22" y2="56" stroke="#7DD3FC" strokeWidth="1.5" />

    <rect x="66" y="34" width="24" height="22" rx="4" fill="#0284C7" stroke="#E0F2FE" strokeWidth="2" />
    <line x1="74" y1="34" x2="74" y2="56" stroke="#7DD3FC" strokeWidth="1.5" />
    <line x1="82" y1="34" x2="82" y2="56" stroke="#7DD3FC" strokeWidth="1.5" />

    {/* Connector */}
    <rect x="30" y="42" width="36" height="6" fill="#94A3B8" />

    {/* Core Body */}
    <rect x="36" y="28" width="24" height="32" rx="6" fill="#E2E8F0" stroke="#0F172A" strokeWidth="2.5" />
    <circle cx="48" cy="40" r="5" fill="#FACC15" stroke="#0F172A" strokeWidth="1.8" />

    {/* SMAP Rotating Dish */}
    <ellipse cx="48" cy="68" rx="16" ry="6" fill="#38BDF8" stroke="#0F172A" strokeWidth="2" />
    {scanning && (
      <g stroke="#38BDF8" strokeWidth="2.5" fill="none" strokeLinecap="round">
        <path d="M36 78 Q48 86 60 78" />
        <path d="M30 85 Q48 95 66 85" />
      </g>
    )}
  </svg>
);

export const Mission5SoilExplorer: React.FC = () => {
  const { save, setRoute, sayAstro, unlockDiscovery, completeMission, recordDecision, recordBehavioralEvent } =
    useGame();

  const [step, setStep] = useState<InterfaceStep>('BRIEFING');
  const [selectedRegion, setSelectedRegion] = useState<RegionId>('A');
  const [observedRegions, setObservedRegions] = useState<Set<RegionId>>(() => new Set());
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // Quiz Challenge State
  const [score, setScore] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [quizFeedback, setQuizFeedback] = useState<{ correct: boolean; text: string } | null>(null);
  const [challengeDone, setChallengeDone] = useState(false);
  const [codexOpen, setCodexOpen] = useState(false);

  const missionProgressPct =
    step === 'BRIEFING'
      ? 10
      : step === 'SATELLITE_MAP'
        ? 25 + Math.round((observedRegions.size / 3) * 35)
        : step === 'ANALYSIS'
          ? 75
          : challengeDone
            ? 100
            : 88;

  const resetMission = () => {
    soundEngine.playClick();
    setStep('BRIEFING');
    setSelectedRegion('A');
    setObservedRegions(new Set());
    setIsScanning(false);
    setScanMessage(null);
    setScore(0);
    setWrongAttempts(0);
    setQuizFeedback(null);
    setChallengeDone(false);
  };

  const handleStartObservation = () => {
    if (isScanning) return;
    soundEngine.playScan();
    setIsScanning(true);
    setScanMessage(null);

    window.setTimeout(() => {
      setIsScanning(false);
      soundEngine.playSuccess();
      setObservedRegions((prev) => {
        const next = new Set(prev);
        if (!next.has(selectedRegion)) {
          setScore((s) => s + 30);
        }
        next.add(selectedRegion);
        return next;
      });
      setScanMessage('Observation complete! Soil moisture data has been received.');
      recordBehavioralEvent('explore', `m5-observe-${selectedRegion}`);
      sayAstro(
        `Observation of Region ${selectedRegion} complete! ${
          observedRegions.size + (observedRegions.has(selectedRegion) ? 0 : 1) < 3
            ? 'Select another region to continue.'
            : 'You have observed all 3 regions! You can now view the soil analysis.'
        }`,
        'happy',
        5500
      );
    }, 1500);
  };

  const handleAnswerQuiz = (answer: RegionId) => {
    if (challengeDone) return;
    if (answer === 'C') {
      const bonus = Math.max(40, 100 - wrongAttempts * 20);
      setScore((s) => s + bonus);
      setQuizFeedback({
        correct: true,
        text: 'Well done! Region C has 45% moisture — it is the most moist (Blue color)!',
      });
      setChallengeDone(true);
      soundEngine.playSuccess();
      recordDecision({ m5FirstRegionTried: answer, m5UsedMission4Water: true });
      recordBehavioralEvent('apply', 'm5-smap-moisture-analysis');
      unlockDiscovery('disc-smap-soil');
      completeMission('mission-5', 'badge-soil-scientist', {
        id: 'item-smap-sensor',
        name: 'SMAP Little Scientist Medal',
        category: 'instrument',
        color: '#38BDF8',
        acquiredIn: 'mission-5',
      });
      sayAstro('Congratulations, little scientist! You earned the SMAP Medal!', 'happy', 6000);
    } else {
      soundEngine.playGentleError();
      setWrongAttempts((w) => w + 1);
      const chosen = REGIONS.find((r) => r.id === answer)!;
      setQuizFeedback({
        correct: false,
        text: `Almost! ${chosen.name} only has ${chosen.moisturePct}% (${chosen.statusLabel.toLowerCase()}). Look for the blue region with the highest percentage and try again!`,
      });
    }
  };

  const activeRegionObj = REGIONS.find((r) => r.id === selectedRegion)!;

  return (
    <div className="flex min-h-screen flex-col bg-[#1B0D2E] text-slate-100 select-none">
      <GameHUD
        missionTitle="Mission 05 · Soil Moisture Explorer"
        goalText={
          step === 'BRIEFING'
            ? 'Prepare the SMAP satellite to study Earth soil.'
            : step === 'SATELLITE_MAP'
              ? `Observe the 3 Earth regions by satellite (${observedRegions.size}/3).`
              : step === 'ANALYSIS'
                ? 'Analyze the soil moisture colors and percentages.'
                : 'Answer the little scientist challenge!'
        }
        progressText={`${missionProgressPct}%`}
        onBackToMap={() => setRoute('CAMPAIGN_MAP')}
        onOpenCodex={() => setCodexOpen(true)}
        onRepeatHint={() => {
          sayAstro(
            'Click each region A, B, and C on the map, press Start Observation, and compare which one has the most water in the soil!',
            'curious',
            6000
          );
        }}
      />

      {/* Mission Progress Strip */}
      <div className="border-b border-[#462A72] bg-[#190B2E] px-4 py-2">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <span className="text-xs font-bold text-sky-300 whitespace-nowrap">Mission Progress</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#2D174D]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#38BDF8] to-[#34D399] transition-all duration-300"
              style={{ width: `${missionProgressPct}%` }}
            />
          </div>
          <span className="font-mono-tabular text-xs font-bold text-white">{missionProgressPct}%</span>
        </div>
      </div>

      {/* INTERFACE 1 — BRIEFING DA MISSÃO */}
      {step === 'BRIEFING' && (
        <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-4 py-8">
          <div className="w-full rounded-3xl border-2 border-[#543487] bg-gradient-to-b from-[#281447] to-[#1A0B30] p-6 shadow-2xl sm:p-8">
            <div className="flex flex-col items-center gap-6 md:flex-row">
              <div className="flex items-end gap-4 shrink-0">
                <CommanderSprite profile={save.commander} size={96} />
                <SatelliteSvg size={92} />
              </div>

              <div className="flex-1 text-center md:text-left">
                <p className="text-xs font-bold uppercase tracking-wider text-sky-300">
                  AstroBase · Mission 05 · SMAP Satellite (Earth)
                </p>
                <h1 className="mt-1 font-display text-3xl font-bold text-white sm:text-4xl">
                  Soil Moisture Explorer
                </h1>
                <p className="mt-3 text-base leading-relaxed text-purple-100">
                  "Hello, little scientist! Today we are going to help NASA study the amount of water in Earth's soil. Are you ready for this mission?"
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-2xl border border-[#462A72] bg-[#190B2E] p-3.5">
                <Satellite className="h-6 w-6 text-sky-400 shrink-0" />
                <div>
                  <div className="text-sm font-bold text-white">1. Observe Regions</div>
                  <div className="text-xs text-purple-200/80">Use the satellite on the map</div>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-[#462A72] bg-[#190B2E] p-3.5">
                <Droplets className="h-6 w-6 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-sm font-bold text-white">2. Analyze Data</div>
                  <div className="text-xs text-purple-200/80">Compare dry and moist soil</div>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-[#462A72] bg-[#190B2E] p-3.5">
                <Award className="h-6 w-6 text-amber-300 shrink-0" />
                <div>
                  <div className="text-sm font-bold text-white">3. Earn Medal</div>
                  <div className="text-xs text-purple-200/80">Complete the final challenge</div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <AstroCompanion
                mood="happy"
                size={58}
                caption="Let us power up the SMAP satellite!"
                showCaptions={save.settings.captionsEnabled}
              />
              <button
                type="button"
                onClick={() => {
                  soundEngine.playSuccess();
                  setStep('SATELLITE_MAP');
                  sayAstro('Choose a region (A, B, or C) on the map and press Start Observation!', 'curious', 6000);
                }}
                className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-white border-b-4 bg-gradient-to-b from-[#FDE047] to-[#EAB308] px-8 text-base font-bold text-slate-950 shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                <Play className="h-5 w-5" />
                <span>START MISSION</span>
              </button>
            </div>
          </div>
        </main>
      )}

      {/* INTERFACE 2 — EXPLORAÇÃO POR SATÉLITE */}
      {step === 'SATELLITE_MAP' && (
        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-5 px-4 py-6">
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
              Satellite Exploration (Earth)
            </h1>
            <p className="mt-1 text-sm text-purple-200/85">
              Click a region on the map and start the SMAP satellite reading ({observedRegions.size}/3 observed).
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3 lg:items-stretch">
            {/* 2D Earth Map with 3 Selectable Regions */}
            <div className="relative min-h-[300px] overflow-hidden rounded-3xl border-2 border-[#543487] bg-gradient-to-b from-[#0C4A6E] to-[#082F49] p-4 shadow-xl lg:col-span-2">
              {/* Stylized 2D Earth Continent Map SVG */}
              <svg viewBox="0 0 800 420" className="h-full w-full" aria-hidden="true">
                {/* Ocean Waves */}
                <rect width="800" height="420" rx="20" fill="#0369A1" opacity="0.35" />

                {/* Landmass 1 - Dry West (Region A) */}
                <path
                  d="M70 110 Q160 60 270 110 Q310 210 260 320 Q150 350 75 270 Z"
                  fill="#D97706"
                  stroke="#FEF3C7"
                  strokeWidth="3"
                />

                {/* Landmass 2 - Moderate Center (Region B) */}
                <path
                  d="M310 90 Q410 55 500 110 Q520 220 470 300 Q370 330 325 230 Z"
                  fill="#22C55E"
                  stroke="#ECFDF5"
                  strokeWidth="3"
                />

                {/* Landmass 3 - Humid River Valley East (Region C) */}
                <path
                  d="M540 120 Q645 75 735 140 Q760 270 690 345 Q575 350 535 250 Z"
                  fill="#15803D"
                  stroke="#E0F2FE"
                  strokeWidth="3"
                />
                {/* River across Region C */}
                <path
                  d="M590 105 Q645 200 615 335"
                  fill="none"
                  stroke="#38BDF8"
                  strokeWidth="16"
                  strokeLinecap="round"
                />
              </svg>

              {/* Interactive Region Pins */}
              {REGIONS.map((region) => {
                const isSelected = selectedRegion === region.id;
                const isObserved = observedRegions.has(region.id);
                return (
                  <button
                    key={region.id}
                    type="button"
                    onClick={() => {
                      if (isScanning) return;
                      soundEngine.playClick();
                      setSelectedRegion(region.id);
                      setScanMessage(null);
                    }}
                    style={{ left: `${region.mapX}%`, top: `${region.mapY}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 rounded-2xl border-2 px-3.5 py-2 shadow-xl transition-transform ${
                      isSelected
                        ? 'scale-110 border-amber-300 bg-[#22103D] ring-4 ring-amber-300/35'
                        : 'border-white/80 bg-[#190B2E]/90 hover:scale-105'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-sm font-extrabold text-white">
                      <span>{region.name}</span>
                      {isObserved && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                    </div>
                    <span className="text-[11px] text-purple-200">{region.terrainHint}</span>
                  </button>
                );
              })}

              {/* Animated Satellite Scan Beam Overlay */}
              <div
                style={{
                  left: `${activeRegionObj.mapX}%`,
                  top: `${Math.max(18, activeRegionObj.mapY - 26)}%`,
                }}
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-500"
              >
                <SatelliteSvg scanning={isScanning} size={74} />
              </div>

              {isScanning && (
                <div
                  style={{ left: `${activeRegionObj.mapX}%`, top: `${activeRegionObj.mapY}%` }}
                  className="pointer-events-none absolute h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-sky-300 bg-sky-400/25 animate-ping"
                />
              )}
            </div>

            {/* Right Control Panel */}
            <div className="flex flex-col justify-between gap-4 rounded-3xl border-2 border-[#462A72] bg-[#21103A] p-5">
              <div>
                <div className="text-xs font-bold uppercase text-sky-300">Selected Region</div>
                <h2 className="mt-1 font-display text-2xl font-bold text-white">
                  {activeRegionObj.name}
                </h2>
                <p className="mt-1 text-xs text-purple-200/85">{activeRegionObj.terrainHint}</p>

                <div className="mt-4 space-y-2">
                  {REGIONS.map((r) => {
                    const done = observedRegions.has(r.id);
                    return (
                      <div
                        key={r.id}
                        className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-semibold ${
                          done
                            ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-200'
                            : 'border-[#462A72] bg-[#160A29] text-purple-200/75'
                        }`}
                      >
                        <span>{r.name}</span>
                        <span>{done ? 'Observed ✓' : 'Not observed'}</span>
                      </div>
                    );
                  })}
                </div>

                {scanMessage && (
                  <div className="mt-4 rounded-xl border border-emerald-400/60 bg-emerald-500/15 p-3 text-xs font-semibold text-emerald-200">
                    {scanMessage}
                  </div>
                )}
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleStartObservation}
                  disabled={isScanning}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-white border-b-4 bg-gradient-to-b from-[#38BDF8] to-[#0284C7] px-5 text-sm font-bold text-white shadow-lg transition-transform hover:scale-[1.02] disabled:opacity-60"
                >
                  <Radio className="h-4 w-4" />
                  <span>{isScanning ? 'Scanning with microwaves...' : 'START OBSERVATION'}</span>
                </button>

                {observedRegions.size === 3 && (
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playSuccess();
                      setStep('ANALYSIS');
                    }}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-white border-b-4 bg-gradient-to-b from-[#FDE047] to-[#EAB308] px-5 text-sm font-bold text-slate-950 shadow-lg hover:scale-[1.02]"
                  >
                    <span>View Soil Analysis</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      )}

      {/* INTERFACE 3 — ANÁLISE DA HUMIDADE DO SOLO */}
      {step === 'ANALYSIS' && (
        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-5 px-4 py-6">
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
              Soil Moisture Analysis
            </h1>
            <p className="mx-auto mt-1.5 max-w-2xl text-sm text-purple-100">
              Soil moisture shows how much water is in the top layer of the ground. NASA's SMAP satellite uses microwave sensors to study this feature.
            </p>
          </div>

          {/* 3 Region Result Cards (Simulated Educational Values) */}
          <div className="grid gap-4 md:grid-cols-3">
            {REGIONS.map((region) => (
              <div
                key={region.id}
                className={`rounded-2xl border-2 p-5 shadow-lg ${region.cardBorder} ${region.cardBg}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`rounded-lg px-2.5 py-1 text-xs font-extrabold text-white ${region.badgeBg}`}>
                    {region.name}
                  </span>
                  <span className="text-xs font-bold text-white/90">Color: {region.colorName}</span>
                </div>

                <div className="mt-4 font-mono-tabular text-4xl font-extrabold text-white">
                  {region.moisturePct}%
                </div>
                <div className="mt-1 text-sm font-bold text-white">{region.statusLabel}.</div>

                <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-950/60">
                  <div
                    className={`h-full rounded-full ${region.badgeBg}`}
                    style={{ width: `${region.moisturePct * 2}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* 4-Colour Scale Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 rounded-2xl border border-[#462A72] bg-[#21103A] px-4 py-3 text-xs">
            <span className="flex items-center gap-2 font-semibold">
              <span className="h-3.5 w-3.5 rounded bg-sky-500" />
              Blue: highest moisture
            </span>
            <span className="flex items-center gap-2 font-semibold">
              <span className="h-3.5 w-3.5 rounded bg-emerald-500" />
              Green: moderate moisture
            </span>
            <span className="flex items-center gap-2 font-semibold">
              <span className="h-3.5 w-3.5 rounded bg-yellow-400" />
              Yellow: low moisture
            </span>
            <span className="flex items-center gap-2 font-semibold">
              <span className="h-3.5 w-3.5 rounded bg-rose-500" />
              Red: very dry soil
            </span>
          </div>

          {/* 3 Educational Cards */}
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-[#462A72] bg-[#190B2E] p-4">
              <div className="flex items-center gap-2 font-display text-base font-bold text-sky-300">
                <Satellite className="h-5 w-5" />
                <span>1. Satellite</span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-purple-100">
                Observes different regions of Earth from space.
              </p>
            </div>
            <div className="rounded-2xl border border-[#462A72] bg-[#190B2E] p-4">
              <div className="flex items-center gap-2 font-display text-base font-bold text-amber-300">
                <Radio className="h-5 w-5" />
                <span>2. Microwaves</span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-purple-100">
                Sensors receive natural signals emitted by the Earth's surface.
              </p>
            </div>
            <div className="rounded-2xl border border-[#462A72] bg-[#190B2E] p-4">
              <div className="flex items-center gap-2 font-display text-base font-bold text-emerald-300">
                <Droplets className="h-5 w-5" />
                <span>3. Soil Moisture</span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-purple-100">
                Scientists use the data to estimate the amount of water in the soil.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-sky-400/35 bg-sky-500/10 px-4 py-2 text-center text-xs text-sky-100">
            <strong>Scientific note:</strong> SMAP (Soil Moisture Active Passive) studies <strong>Earth's</strong> soil — it does not measure water on the Moon or Mars. Simulated values for educational example.
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setStep('QUIZ_CHALLENGE');
              }}
              className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-white border-b-4 bg-gradient-to-b from-[#FDE047] to-[#EAB308] px-8 text-base font-bold text-slate-950 shadow-lg hover:scale-105 transition-transform"
            >
              <span>Little Scientist Challenge</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </main>
      )}

      {/* INTERFACE 4 — DESAFIO DO PEQUENO CIENTISTA */}
      {step === 'QUIZ_CHALLENGE' && (
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-8">
          <div className="w-full rounded-3xl border-2 border-[#543487] bg-gradient-to-b from-[#281447] to-[#190B2E] p-6 text-center shadow-2xl sm:p-8">
            <div className="flex items-end justify-center gap-5">
              <CommanderSprite profile={save.commander} size={88} isCelebrating={challengeDone} />
              <AstroCompanion mood={challengeDone ? 'happy' : 'curious'} size={68} showCaptions={false} />
            </div>

            {!challengeDone ? (
              <>
                <div className="mt-3 text-xs font-bold uppercase tracking-wider text-amber-300">
                  Little Scientist Challenge
                </div>
                <h1 className="mt-1 font-display text-2xl font-bold text-white">
                  Which region has the highest amount of soil moisture?
                </h1>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {REGIONS.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleAnswerQuiz(r.id)}
                      className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-[#543487] bg-[#2D174D] p-4 text-white transition-transform hover:scale-105 hover:border-amber-300"
                    >
                      <span className="font-display text-xl font-bold">{r.name}</span>
                      <span className="text-xs text-purple-200">{r.terrainHint}</span>
                    </button>
                  ))}
                </div>

                {quizFeedback && !quizFeedback.correct && (
                  <div className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-rose-400/70 bg-rose-500/15 px-4 py-3 text-sm font-semibold text-rose-200">
                    <XCircle className="h-5 w-5 shrink-0" />
                    <span>{quizFeedback.text}</span>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/60 bg-emerald-500/20 px-4 py-1 text-xs font-bold text-emerald-200">
                  <Sparkles className="h-4 w-4" />
                  <span>Correct Answer!</span>
                </div>
                <h1 className="mt-2 font-display text-2xl font-bold text-white sm:text-3xl">
                  Congratulations, Little Scientist!
                </h1>
                <p className="mt-2 text-sm text-purple-100">{quizFeedback?.text}</p>

                <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl border border-[#462A72] bg-[#160A29] p-3">
                    <div className="text-[11px] text-purple-200/80">Score</div>
                    <div className="mt-0.5 font-mono-tabular text-2xl font-bold text-amber-300">{score}</div>
                  </div>
                  <div className="rounded-xl border border-[#462A72] bg-[#160A29] p-3">
                    <div className="text-[11px] text-purple-200/80">Correct Answers</div>
                    <div className="mt-0.5 font-mono-tabular text-2xl font-bold text-emerald-300">1 / 1</div>
                  </div>
                  <div className="rounded-xl border border-amber-400/60 bg-amber-400/15 p-3">
                    <div className="text-[11px] text-amber-200">Medal</div>
                    <div className="mt-1 flex items-center justify-center gap-1 text-xs font-bold text-white">
                      <Award className="h-4 w-4 text-amber-300" />
                      <span>Little Scientist</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={resetMission}
                    className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-[#543487] bg-[#2D174D] px-5 text-sm font-semibold text-white hover:border-amber-300"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>PLAY AGAIN</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setRoute('CAMPAIGN_MAP');
                    }}
                    className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-white border-b-4 bg-gradient-to-b from-[#FDE047] to-[#EAB308] px-6 text-sm font-bold text-slate-950 shadow-lg hover:scale-105 transition-transform"
                  >
                    <Compass className="h-4 w-4" />
                    <span>BACK TO ASTROBASE</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </main>
      )}

      <DiscoveryCodexModal open={codexOpen} onClose={() => setCodexOpen(false)} />
    </div>
  );
};
