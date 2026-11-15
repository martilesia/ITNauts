import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BatteryCharging,
  CheckCircle2,
  Clock,
  Flame,
  Play,
  Radar,
  RotateCcw,
  Shield,
  ShieldAlert,
  Snowflake,
  Sun,
  Thermometer,
  Trophy,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { soundEngine } from '../../utils/soundEngine';
import { AstroCompanion } from '../engine/AstroCompanion';
import { CommanderSprite } from '../engine/CommanderSprite';
import { DiscoveryCodexModal } from '../engine/DiscoveryCodexModal';
import { GameHUD } from '../engine/GameHUD';
import {
  FloatingCallout,
  ScanBeamEffect,
  ShieldTier,
  THERMAL_CANVAS_H,
  THERMAL_CANVAS_W,
  ThermalGameCanvas,
  ThermalTarget,
} from './mission1/ThermalGameCanvas';

type GameStatus = 'BRIEFING' | 'PLAYING' | 'WON' | 'LOST';

const TARGET_IDEAL_SEC = 15;
const CYCLE_DURATION_SEC = 20; // 10s Day + 10s Night so kids experience both in ~15-20s
const MAX_DAY_TEMP = 48; // Real exposed sunlit surface temperature
const MIN_NIGHT_TEMP = -18; // Real exposed night surface temperature

interface ShieldOption {
  id: Exclude<ShieldTier, 'none'>;
  name: string;
  cost: number;
  dayConductivity: number;
  nightConductivity: number;
  solarMultiplier: number;
  plus: string;
  minus: string;
  memoryValue: 'dark-metal' | 'polymer' | 'reflective';
}

const SHIELD_OPTIONS: ShieldOption[] = [
  {
    id: 'basic',
    name: 'White Paint',
    cost: 10,
    dayConductivity: 0.055, // Reflects sunlight well by day
    nightConductivity: 0.14, // Loses heat fast at night
    solarMultiplier: 1,
    plus: 'Reflects Sun · Cheap',
    minus: 'Cools fast at night',
    memoryValue: 'dark-metal',
  },
  {
    id: 'reinforced',
    name: 'Insulation Panel',
    cost: 22,
    dayConductivity: 0.048,
    nightConductivity: 0.048,
    solarMultiplier: 0.8,
    plus: 'Blocks heat and cold',
    minus: 'Costs almost half ⚡',
    memoryValue: 'polymer',
  },
  {
    id: 'advanced',
    name: 'NASA Gold Foil',
    cost: 34,
    dayConductivity: 0.018,
    nightConductivity: 0.018,
    solarMultiplier: 0.55,
    plus: 'Protects almost all',
    minus: 'Pricey · Less sun (-45%)',
    memoryValue: 'reflective',
  },
];

interface DilemmaChoice {
  label: string;
  effect: string;
  cost: string;
  apply: (curr: SimState) => Partial<SimState>;
}

interface DilemmaEvent {
  id: 'day-heat' | 'night-cold';
  title: string;
  goalLabel: string;
  choiceA: DilemmaChoice;
  choiceB: DilemmaChoice;
}

interface SimState {
  cycleProgress: number;
  idealTime: number; // goal: 15s inside 17..27°C
  totalElapsed: number;
  exteriorTemp: number;
  interiorTemp: number;
  energy: number; // 0..100 (lose at 0)
  score: number;
  shield: ShieldTier;
  heaterTimer: number;
  coolerTimer: number;
  solarPauseTimer: number;
  shuttersTimer: number;
  scansCompleted: number;
  dayMeasuredTemp: number | null;
  nightMeasuredTemp: number | null;
  lossReason: string;
}

const DILEMMA_DAY_HEAT: DilemmaEvent = {
  id: 'day-heat',
  title: 'Strong Sun on the Ship!',
  goalLabel: 'Choose how to cool down the habitat:',
  choiceA: {
    label: 'Space Radiators',
    effect: 'Cools −9 °C now',
    cost: 'Uses 14 ⚡ Energy',
    apply: (s) => ({
      energy: Math.max(0, s.energy - 14),
      interiorTemp: s.interiorTemp - 9,
      score: s.score + 100,
    }),
  },
  choiceB: {
    label: 'Rotate to Shade',
    effect: 'Cools −5 °C (0 ⚡)',
    cost: 'No solar panel (6s)',
    apply: (s) => ({
      interiorTemp: s.interiorTemp - 5,
      solarPauseTimer: 6,
      score: s.score + 100,
    }),
  },
};

const DILEMMA_NIGHT_COLD: DilemmaEvent = {
  id: 'night-cold',
  title: 'Freezing Shadow!',
  goalLabel: 'Choose how to warm up the habitat:',
  choiceA: {
    label: 'Electric Heater',
    effect: 'Warms +9 °C now',
    cost: 'Uses 14 ⚡ Energy',
    apply: (s) => ({
      energy: Math.max(0, s.energy - 14),
      interiorTemp: s.interiorTemp + 9,
      score: s.score + 100,
    }),
  },
  choiceB: {
    label: 'Close Shutters',
    effect: 'Keeps +5 °C (0 ⚡)',
    cost: 'No ⚡ targets (6s)',
    apply: (s) => ({
      interiorTemp: s.interiorTemp + 5,
      shuttersTimer: 6,
      score: s.score + 100,
    }),
  },
};

function computeExteriorTemp(cycleProgress: number): number {
  const localPhase = cycleProgress % 1;
  const wave = Math.sin(localPhase * Math.PI * 2);
  const mid = (MAX_DAY_TEMP + MIN_NIGHT_TEMP) / 2;
  const amp = (MAX_DAY_TEMP - MIN_NIGHT_TEMP) / 2;
  return mid + wave * amp;
}

function getShieldConductivity(shield: ShieldTier, isDay: boolean): number {
  const found = SHIELD_OPTIONS.find((s) => s.id === shield);
  if (!found) return 0.15;
  return isDay ? found.dayConductivity : found.nightConductivity;
}

function getShieldSolarMult(shield: ShieldTier): number {
  const found = SHIELD_OPTIONS.find((s) => s.id === shield);
  return found ? found.solarMultiplier : 1;
}

function getShieldCost(shield: ShieldTier): number {
  const found = SHIELD_OPTIONS.find((s) => s.id === shield);
  return found ? found.cost : 0;
}

export const Mission1EarthLab: React.FC = () => {
  const {
    save,
    setRoute,
    sayAstro,
    completeMission1Station,
    unlockDiscovery,
    completeMission,
    recordDecision,
    recordBehavioralEvent,
  } = useGame();

  const [status, setStatus] = useState<GameStatus>('BRIEFING');
  const [codexOpen, setCodexOpen] = useState(false);

  const [sim, setSim] = useState<SimState>({
    cycleProgress: 0.14,
    idealTime: 0,
    totalElapsed: 0,
    exteriorTemp: computeExteriorTemp(0.14),
    interiorTemp: 24,
    energy: 54,
    score: 0,
    shield: 'none',
    heaterTimer: 0,
    coolerTimer: 0,
    solarPauseTimer: 0,
    shuttersTimer: 0,
    scansCompleted: 0,
    dayMeasuredTemp: null,
    nightMeasuredTemp: null,
    lossReason: '',
  });

  const [targets, setTargets] = useState<ThermalTarget[]>([]);
  const [scanBeam, setScanBeam] = useState<ScanBeamEffect | null>(null);
  const [callouts, setCallouts] = useState<FloatingCallout[]>([]);
  const [activeDilemma, setActiveDilemma] = useState<DilemmaEvent | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const simRef = useRef(sim);
  simRef.current = sim;
  const targetsRef = useRef(targets);
  targetsRef.current = targets;

  const triggeredDilemmasRef = useRef<Set<string>>(new Set());
  const spawnTimerRef = useRef(0);
  const lastFreeScanRef = useRef(0);
  const toastTimerRef = useRef<number | null>(null);

  const showQuickToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
    }, 2200);
  }, []);

  const addCallout = useCallback((x: number, y: number, text: string, color: string) => {
    const id = `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setCallouts((prev) => [...prev.slice(-4), { id, x, y, text, color, createdAt: performance.now() }]);
  }, []);

  const spawnThermalTarget = useCallback((exteriorTemp: number, isDay: boolean) => {
    const spots = [
      { x: 130, y: 348, dayLabel: 'Hot Ground', nightLabel: 'Cold Ground' },
      { x: 265, y: 368, dayLabel: 'Sunlit Rock', nightLabel: 'Cold Rock' },
      { x: 695, y: 362, dayLabel: 'Hot Sand', nightLabel: 'Cold Sand' },
      { x: 845, y: 350, dayLabel: 'Sunlit Soil', nightLabel: 'Frozen Ground' },
    ];
    const pick = spots[Math.floor(Math.random() * spots.length)];
    const offset = isDay ? Math.round(Math.random() * 4) : -Math.round(Math.random() * 3);
    const tempC = Math.round(exteriorTemp + offset);
    setTargets([
      {
        id: `tgt-${Date.now()}`,
        x: pick.x,
        y: pick.y,
        label: isDay ? pick.dayLabel : pick.nightLabel,
        tempC,
        isDay,
        spawnedAt: performance.now(),
      },
    ]);
  }, []);

  const startGame = useCallback(() => {
    soundEngine.playSuccess();
    triggeredDilemmasRef.current = new Set();
    spawnTimerRef.current = 1.6;
    setActiveDilemma(null);
    setScanBeam(null);
    setCallouts([]);
    setTargets([]);
    setToast(null);

    const startProgress = 0.14;
    const startExt = computeExteriorTemp(startProgress);
    setSim({
      cycleProgress: startProgress,
      idealTime: 0,
      totalElapsed: 0,
      exteriorTemp: startExt,
      interiorTemp: 24,
      energy: 54,
      score: 0,
      shield: 'none',
      heaterTimer: 0,
      coolerTimer: 0,
      solarPauseTimer: 0,
      shuttersTimer: 0,
      scansCompleted: 0,
      dayMeasuredTemp: null,
      nightMeasuredTemp: null,
      lossReason: '',
    });
    setStatus('PLAYING');
    sayAstro('Keep the habitat between 17 and 27 °C for 15 seconds!', 'curious', 4500);
  }, [sayAstro]);

  // Main 100ms Simulation Loop
  useEffect(() => {
    if (status !== 'PLAYING' || activeDilemma !== null || codexOpen) return;

    const dt = 0.1;

    const timer = window.setInterval(() => {
      const curr = simRef.current;
      const nextElapsed = curr.totalElapsed + dt;
      const nextProgress = curr.cycleProgress + dt / CYCLE_DURATION_SEC;

      const nextExtTemp = computeExteriorTemp(nextProgress);
      const localPhase = nextProgress % 1;
      const sunWave = Math.sin(localPhase * Math.PI * 2);
      const isDay = sunWave >= 0;

      const nextSolarPause = Math.max(0, curr.solarPauseTimer - dt);
      const nextShutters = Math.max(0, curr.shuttersTimer - dt);

      // Spawn clickable MODIS targets periodically (unless shutters are closed)
      if (nextShutters <= 0) {
        spawnTimerRef.current += dt;
        if (spawnTimerRef.current >= 3.2 && targetsRef.current.length === 0) {
          spawnTimerRef.current = 0;
          spawnThermalTarget(nextExtTemp, isDay);
        }
      }

      // Trigger real-space thermal dilemmas (Day heat ~4.5s, Night cold ~11.5s)
      if (!triggeredDilemmasRef.current.has('day-heat') && nextElapsed >= 4.5 && sunWave > 0.2) {
        triggeredDilemmasRef.current.add('day-heat');
        soundEngine.playStormAlert();
        setActiveDilemma(DILEMMA_DAY_HEAT);
        return;
      }
      if (!triggeredDilemmasRef.current.has('night-cold') && nextElapsed >= 11.5 && sunWave < -0.2) {
        triggeredDilemmasRef.current.add('night-cold');
        soundEngine.playStormAlert();
        setActiveDilemma(DILEMMA_NIGHT_COLD);
        return;
      }

      // Balanced energy drain + extra drain when house leaves ideal 17..27°C
      const isOutIdeal = curr.interiorTemp > 27 || curr.interiorTemp < 17;
      const baseDrain = (1.4 + (isOutIdeal ? 1.4 : 0)) * dt;
      const solarMult = getShieldSolarMult(curr.shield);
      const solarGain =
        isDay && nextSolarPause <= 0 ? (0.35 + 0.65 * sunWave) * 1.75 * solarMult * dt : 0;

      let nextHeaterTimer = Math.max(0, curr.heaterTimer - dt);
      let nextCoolerTimer = Math.max(0, curr.coolerTimer - dt);
      let nextEnergy = Math.min(100, curr.energy + solarGain - baseDrain);
      let climateDelta = 0;

      if (nextHeaterTimer > 0) {
        climateDelta = 2.8 * dt;
        if (curr.interiorTemp >= 25) {
          nextHeaterTimer = 0;
        }
      } else if (nextCoolerTimer > 0) {
        climateDelta = -2.8 * dt;
        if (curr.interiorTemp <= 19) {
          nextCoolerTimer = 0;
        }
      }

      nextEnergy = Math.max(0, nextEnergy);

      // Passive heat transfer through walls
      const cond = getShieldConductivity(curr.shield, isDay);
      const ambientPull = (nextExtTemp - curr.interiorTemp) * cond * dt;
      const nextIntTemp = curr.interiorTemp + ambientPull + climateDelta;

      // Ideal temperature timer: ONLY counts when 17 <= interiorTemp <= 27!
      const isIdeal = nextIntTemp >= 17 && nextIntTemp <= 27;
      const nextIdealTime = isIdeal ? curr.idealTime + dt : curr.idealTime;
      const nextScore = Math.round(curr.score + (isIdeal ? 22 : 4) * dt);

      // Loss Check: Energy reaches 0!
      if (nextEnergy <= 0) {
        soundEngine.playGentleError();
        setSim({
          ...curr,
          cycleProgress: nextProgress,
          idealTime: nextIdealTime,
          totalElapsed: nextElapsed,
          exteriorTemp: nextExtTemp,
          interiorTemp: nextIntTemp,
          energy: 0,
          score: nextScore,
          heaterTimer: 0,
          coolerTimer: 0,
          solarPauseTimer: nextSolarPause,
          shuttersTimer: nextShutters,
          lossReason: 'You ran out of Energy ⚡! Without energy you cannot regulate heat.',
        });
        setStatus('LOST');
        sayAstro('Energy ran out! Tap the ground beacons to recharge and pick a shield!', 'encourage', 5500);
        return;
      }

      // Win Check: 15s accumulated at Ideal Temperature!
      if (nextIdealTime >= TARGET_IDEAL_SEC) {
        soundEngine.playSuccess();
        const speedBonus = Math.max(0, Math.round((28 - nextElapsed) * 15));
        const finalBonus = Math.round(nextEnergy * 2 + speedBonus);
        setSim({
          ...curr,
          cycleProgress: nextProgress,
          idealTime: TARGET_IDEAL_SEC,
          totalElapsed: nextElapsed,
          exteriorTemp: nextExtTemp,
          interiorTemp: nextIntTemp,
          energy: nextEnergy,
          score: nextScore + finalBonus,
          heaterTimer: 0,
          coolerTimer: 0,
          solarPauseTimer: nextSolarPause,
          shuttersTimer: nextShutters,
        });
        setStatus('WON');

        const chosenOpt = SHIELD_OPTIONS.find((o) => o.id === curr.shield);
        if (chosenOpt) {
          recordDecision({ m1ThermalShield: chosenOpt.memoryValue });
        }
        completeMission1Station('modis', 'disc-modis');
        unlockDiscovery('disc-modis');
        completeMission('mission-1', 'badge-eyes-earth', {
          id: 'item-planetary-scanner',
          name: 'MODIS Thermal Scanner',
          category: 'instrument',
          color: '#FB923C',
          acquiredIn: 'mission-1',
        });
        sayAstro('Nice! You kept the habitat at the right temperature for 15 seconds!', 'happy', 5500);
        return;
      }

      setSim({
        ...curr,
        cycleProgress: nextProgress,
        idealTime: nextIdealTime,
        totalElapsed: nextElapsed,
        exteriorTemp: nextExtTemp,
        interiorTemp: nextIntTemp,
        energy: nextEnergy,
        score: nextScore,
        heaterTimer: nextHeaterTimer,
        coolerTimer: nextCoolerTimer,
        solarPauseTimer: nextSolarPause,
        shuttersTimer: nextShutters,
      });
    }, 100);

    return () => window.clearInterval(timer);
  }, [
    activeDilemma,
    codexOpen,
    completeMission,
    completeMission1Station,
    recordDecision,
    sayAstro,
    showQuickToast,
    spawnThermalTarget,
    status,
    unlockDiscovery,
  ]);

  const handleTriggerModisScan = useCallback(
    (tapX?: number, tapY?: number, hitTargetId?: string) => {
      if (status !== 'PLAYING' || activeDilemma !== null) return;
      const curr = simRef.current;

      const activeTarget = hitTargetId
        ? targetsRef.current.find((t) => t.id === hitTargetId)
        : targetsRef.current[0];

      if (activeTarget && (hitTargetId || tapX === undefined)) {
        soundEngine.playScan();
        setTimeout(() => soundEngine.playPickup(), 110);
        setScanBeam({
          x: activeTarget.x,
          y: activeTarget.y,
          tempC: activeTarget.tempC,
          label: activeTarget.label,
          startedAt: performance.now(),
          hitTarget: true,
        });
        setTargets((prev) => prev.filter((t) => t.id !== activeTarget.id));
        const sign = activeTarget.tempC >= 0 ? '+' : '';
        addCallout(
          activeTarget.x,
          activeTarget.y - 22,
          `${sign}${activeTarget.tempC} °C · +12 ⚡`,
          activeTarget.isDay ? '#FDBA74' : '#7DD3FC'
        );
        setSim((prev) => ({
          ...prev,
          energy: Math.min(100, prev.energy + 12),
          score: prev.score + 75,
          scansCompleted: prev.scansCompleted + 1,
          dayMeasuredTemp: activeTarget.isDay
            ? Math.max(prev.dayMeasuredTemp ?? activeTarget.tempC, activeTarget.tempC)
            : prev.dayMeasuredTemp,
          nightMeasuredTemp: !activeTarget.isDay
            ? Math.min(prev.nightMeasuredTemp ?? activeTarget.tempC, activeTarget.tempC)
            : prev.nightMeasuredTemp,
        }));
        recordBehavioralEvent('explore', 'm1-modis-scan');
        showQuickToast(`Ground: ${sign}${activeTarget.tempC} °C (+12 ⚡)`);
        return;
      }

      const now = performance.now();
      if (now - lastFreeScanRef.current < 1500) return;
      lastFreeScanRef.current = now;

      const scanX = tapX ?? 700;
      const scanY = Math.max(265, Math.min(THERMAL_CANVAS_H - 25, tapY ?? 330));
      const measured = Math.round(curr.exteriorTemp);
      const isDay = Math.sin((curr.cycleProgress % 1) * Math.PI * 2) >= 0;
      const sign = measured >= 0 ? '+' : '';

      soundEngine.playScan();
      setScanBeam({
        x: scanX,
        y: scanY,
        tempC: measured,
        label: 'Ground',
        startedAt: now,
        hitTarget: false,
      });
      addCallout(
        Math.min(THERMAL_CANVAS_W - 95, Math.max(95, scanX)),
        scanY - 18,
        `Ground: ${sign}${measured} °C`,
        isDay ? '#FDBA74' : '#7DD3FC'
      );
      setSim((prev) => ({
        ...prev,
        dayMeasuredTemp: isDay ? Math.max(prev.dayMeasuredTemp ?? measured, measured) : prev.dayMeasuredTemp,
        nightMeasuredTemp: !isDay ? Math.min(prev.nightMeasuredTemp ?? measured, measured) : prev.nightMeasuredTemp,
      }));
    },
    [activeDilemma, addCallout, recordBehavioralEvent, showQuickToast, status]
  );

  const handleSelectShield = (opt: ShieldOption) => {
    if (status !== 'PLAYING' || activeDilemma !== null) return;
    if (sim.shield === opt.id) return;

    const currentCost = getShieldCost(sim.shield);
    const upgradeCost = opt.cost - currentCost;

    if (upgradeCost > 0 && sim.energy <= upgradeCost) {
      soundEngine.playGentleError();
      const needed = Math.ceil(upgradeCost - sim.energy + 1);
      showQuickToast(`Need ${needed} more ⚡! Tap the ground lights.`);
      return;
    }

    const wasEquippedBefore = sim.shield !== 'none';
    soundEngine.playPickup();
    setSim((prev) => ({
      ...prev,
      shield: opt.id,
      energy: Math.max(1, Math.min(100, prev.energy - upgradeCost)),
      score: prev.score + (wasEquippedBefore ? 40 : 65),
    }));
    recordDecision({ m1ThermalShield: opt.memoryValue });
    if (wasEquippedBefore) {
      recordBehavioralEvent('adapt', 'm1-shield-changed');
    }
    showQuickToast(`${opt.name} installed!`);
  };

  const handlePulseHeater = () => {
    if (status !== 'PLAYING' || activeDilemma !== null) return;
    if (sim.energy < 5) {
      soundEngine.playGentleError();
      showQuickToast('Low energy (need 5 ⚡)! Tap the ground lights.');
      return;
    }
    soundEngine.playClick();
    addCallout(480, 178, '+3 °C Heat', '#FB923C');
    setSim((prev) => ({
      ...prev,
      interiorTemp: prev.interiorTemp + 3,
      energy: Math.max(1, prev.energy - 5),
      heaterTimer: 1.6,
      coolerTimer: 0,
    }));
  };

  const handlePulseCooler = () => {
    if (status !== 'PLAYING' || activeDilemma !== null) return;
    if (sim.energy < 5) {
      soundEngine.playGentleError();
      showQuickToast('Low energy (need 5 ⚡)! Tap the ground lights.');
      return;
    }
    soundEngine.playClick();
    addCallout(480, 178, '−3 °C Cool', '#38BDF8');
    setSim((prev) => ({
      ...prev,
      interiorTemp: prev.interiorTemp - 3,
      energy: Math.max(1, prev.energy - 5),
      coolerTimer: 1.6,
      heaterTimer: 0,
    }));
  };

  const handleDilemmaChoice = (choice: DilemmaChoice) => {
    if (!activeDilemma) return;
    soundEngine.playSuccess();
    setSim((prev) => ({ ...prev, ...choice.apply(prev) }));
    recordBehavioralEvent('adapt', `m1-dilemma-${activeDilemma.id}`);
    showQuickToast(`${choice.label}: ${choice.effect}`);
    setActiveDilemma(null);
  };

  const localPhase = sim.cycleProgress % 1;
  const isDayNow = Math.sin(localPhase * Math.PI * 2) >= 0;
  const isIdealTemp = sim.interiorTemp >= 17 && sim.interiorTemp <= 27;
  const houseStateLabel = sim.interiorTemp > 27 ? 'Hot!' : sim.interiorTemp < 17 ? 'Cold!' : 'Good!';
  const chosenShieldMeta = SHIELD_OPTIONS.find((o) => o.id === sim.shield);

  return (
    <div className="flex min-h-screen flex-col bg-[#1B0D2E] text-slate-100 select-none">
      <GameHUD
        missionTitle="Mission 01 · Protect the Base"
        goalText="Keep the habitat comfortable (17 °C to 27 °C) for 15s."
        progressText={status === 'PLAYING' ? `${isDayNow ? 'Day' : 'Night'} · ${Math.floor(sim.totalElapsed)}s` : undefined}
        onBackToMap={() => setRoute('CAMPAIGN_MAP')}
        onOpenCodex={() => setCodexOpen(true)}
        onRepeatHint={() => {
          sayAstro(
            'Keep the habitat between 17 and 27 °C for 15 seconds! Tap the ground lights to gain energy.',
            'curious',
            5000
          );
        }}
      />

      {/* EXPLICACAO ANTES DA MISSAO (Porquê, Objetivo, O que fazer) */}
      {status === 'BRIEFING' && (
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-8">
          <div className="w-full rounded-3xl border-2 border-[#543487] bg-gradient-to-b from-[#281447] to-[#1A0B30] p-6 shadow-2xl sm:p-8">
            <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
              <div className="flex items-end gap-2 shrink-0">
                <CommanderSprite profile={save.commander} size={82} />
                <AstroCompanion mood="happy" size={62} showCaptions={false} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Before You Start · Mission 01
                </p>
                <h1 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">
                  Why are you here?
                </h1>
                <p className="mt-1.5 text-sm text-purple-100">
                  In space there is no air outside: in sunlight the base boils, and in shadow it freezes!
                </p>
              </div>
            </div>

            {/* Objetivo + O que fazer */}
            <div className="mt-5 rounded-2xl border border-emerald-400/50 bg-emerald-500/15 px-4 py-3 text-center">
              <span className="text-sm font-bold text-emerald-200">
                Goal: Keep the habitat comfortable (17 °C to 27 °C) for 15 seconds without running out of Energy ⚡!
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#462A72] bg-[#190B2E] p-4 text-center">
                <Shield className="mx-auto h-7 w-7 text-sky-300" />
                <div className="mt-2 text-sm font-bold text-white">1. Choose a Shield</div>
                <p className="mt-1 text-xs text-purple-200/90">
                  Real space materials: white paint, panel, or gold foil.
                </p>
              </div>

              <div className="rounded-2xl border border-[#462A72] bg-[#190B2E] p-4 text-center">
                <Thermometer className="mx-auto h-7 w-7 text-emerald-300" />
                <div className="mt-2 text-sm font-bold text-white">2. Regulate Heat</div>
                <p className="mt-1 text-xs text-purple-200/90">
                  Click Cool (−3 °C) or Heat (+3 °C).
                </p>
              </div>

              <div className="rounded-2xl border border-[#462A72] bg-[#190B2E] p-4 text-center">
                <Radar className="mx-auto h-7 w-7 text-amber-300" />
                <div className="mt-2 text-sm font-bold text-white">3. Tap the Lights</div>
                <p className="mt-1 text-xs text-purple-200/90">
                  Tap the ground spots to scan with the satellite and gain +12 ⚡.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={startGame}
                className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-white border-b-4 bg-gradient-to-b from-[#FDE047] to-[#EAB308] px-8 text-base font-extrabold text-slate-950 shadow-xl transition-transform hover:scale-105"
              >
                <Play className="h-5 w-5" />
                <span>Start Mission</span>
              </button>
            </div>
          </div>
        </main>
      )}

      {/* JOGO: FOCO 100% EM TEMPERATURA + ENERGIA */}
      {status !== 'BRIEFING' && (
        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-3 px-4 py-4">
          {/* 3 Clean Meters: Energia, Casa °C, Tempo Ideal / 15s */}
          <section
            aria-label="Mission Indicators"
            className="grid grid-cols-3 gap-2.5 rounded-2xl border-2 border-[#543487] bg-[#21103A] p-2.5 shadow-lg"
          >
            {/* Energia */}
            <div className="rounded-xl border border-[#462A72] bg-[#160A29] px-3 py-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-bold text-amber-300">
                  <BatteryCharging className="h-4 w-4" />
                  <span>Energy</span>
                </span>
                <span className={`font-mono-tabular font-extrabold ${sim.energy < 20 ? 'text-rose-400' : 'text-white'}`}>
                  {Math.round(sim.energy)} ⚡
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-150 ${
                    sim.energy < 20 ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-400 to-yellow-300'
                  }`}
                  style={{ width: `${sim.energy}%` }}
                />
              </div>
            </div>

            {/* Temperatura da Casa */}
            <div className="rounded-xl border border-[#462A72] bg-[#160A29] px-3 py-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-bold text-emerald-300">
                  <Thermometer className="h-4 w-4" />
                  <span>Home</span>
                </span>
                <span
                  className={`font-mono-tabular font-extrabold ${
                    sim.interiorTemp > 27
                      ? 'text-rose-300'
                      : sim.interiorTemp < 17
                        ? 'text-sky-300'
                        : 'text-emerald-300'
                  }`}
                >
                  {Math.round(sim.interiorTemp)} °C · {houseStateLabel}
                </span>
              </div>
              <div className="mt-1.5 text-[11px] text-purple-200/80">
                {isIdealTemp ? 'Counting ideal time!' : 'Paused! Adjust now!'}
              </div>
            </div>

            {/* Tempo Ideal (0 / 15s) */}
            <div className="rounded-xl border border-[#462A72] bg-[#160A29] px-3 py-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-bold text-sky-300">
                  <Clock className="h-4 w-4" />
                  <span>Ideal Time</span>
                </span>
                <span className="font-mono-tabular font-extrabold text-white">
                  {Math.floor(sim.idealTime)}/{TARGET_IDEAL_SEC}s
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-150 ${
                    isIdealTemp ? 'bg-emerald-400' : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, (sim.idealTime / TARGET_IDEAL_SEC) * 100)}%` }}
                />
              </div>
            </div>
          </section>

          {/* 2D Game Canvas */}
          <section className="relative">
            <ThermalGameCanvas
              cycleProgress={sim.cycleProgress}
              exteriorTemp={sim.exteriorTemp}
              interiorTemp={sim.interiorTemp}
              energy={sim.energy}
              shield={sim.shield}
              heaterOn={sim.heaterTimer > 0}
              coolerOn={sim.coolerTimer > 0}
              awningActive={sim.solarPauseTimer > 0}
              cocoonActive={sim.shuttersTimer > 0 || sim.solarPauseTimer > 0}
              targets={targets}
              scanBeam={scanBeam}
              callouts={callouts}
              status={status === 'PLAYING' ? 'PLAYING' : status === 'WON' ? 'WON' : 'LOST'}
              reducedStimuli={save.settings.reducedStimuli}
              onCanvasTap={handleTriggerModisScan}
            />

            {status === 'PLAYING' && toast && !activeDilemma && (
              <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 rounded-full border-2 border-amber-300 bg-[#160A29]/92 px-4 py-1 text-xs font-bold text-amber-200 shadow-lg whitespace-nowrap">
                {toast}
              </div>
            )}

            {/* Same-Goal Space Engineering Dilemma Modal */}
            {status === 'PLAYING' && activeDilemma && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-[#160A29]/82 p-4 backdrop-blur-[2px]">
                <div className="w-full max-w-md rounded-3xl border-2 border-amber-300 bg-[#251142] p-5 text-center shadow-2xl">
                  <AlertTriangle className="mx-auto h-8 w-8 text-amber-300" />
                  <h2 className="mt-2 font-display text-xl font-bold text-white">{activeDilemma.title}</h2>
                  <p className="mt-1 text-xs text-purple-100">{activeDilemma.goalLabel}</p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {[activeDilemma.choiceA, activeDilemma.choiceB].map((opt, idx) => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => handleDilemmaChoice(opt)}
                        className={`flex flex-col items-center rounded-2xl border-2 p-3.5 text-center transition-transform hover:scale-[1.03] ${
                          idx === 0
                            ? 'border-sky-400 bg-sky-500/20 text-white'
                            : 'border-amber-400 bg-amber-500/20 text-white'
                        }`}
                      >
                        <span className="text-sm font-extrabold">{opt.label}</span>
                        <span className="mt-1.5 text-xs font-bold text-emerald-300">+ {opt.effect}</span>
                        <span className="mt-0.5 text-xs font-semibold text-rose-200">− {opt.cost}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Victory Overlay */}
            {status === 'WON' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-[#160A29]/90 p-5 text-center backdrop-blur-[2px]">
                <div className="flex items-center gap-3">
                  <CommanderSprite profile={save.commander} size={60} isCelebrating />
                  <AstroCompanion mood="happy" size={52} showCaptions={false} />
                </div>

                <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                  <Trophy className="h-4 w-4 text-amber-300" />
                  <span>
                    Completed in {Math.round(sim.totalElapsed)}s · {sim.score} pts
                  </span>
                </div>
                <h2 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">
                  Nice! You Regulated the Temperature!
                </h2>

                <div className="mt-3 grid w-full max-w-lg gap-2.5 text-left sm:grid-cols-2">
                  <div className="rounded-xl border border-[#462A72] bg-[#21103A] p-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                      <Sun className="h-4 w-4" />
                      <span>Day & Night (MODIS)</span>
                    </div>
                    <p className="mt-1 text-xs text-purple-100">
                      Day ground:{' '}
                      <strong className="font-mono-tabular">+{sim.dayMeasuredTemp ?? MAX_DAY_TEMP} °C</strong>
                      <br />
                      Night ground:{' '}
                      <strong className="font-mono-tabular">{sim.nightMeasuredTemp ?? MIN_NIGHT_TEMP} °C</strong>
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#462A72] bg-[#21103A] p-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-sky-300">
                      <Shield className="h-4 w-4" />
                      <span>Your Choice</span>
                    </div>
                    <p className="mt-1 text-xs text-purple-100">
                      {chosenShieldMeta
                        ? `You used ${chosenShieldMeta.name} and had ${Math.round(sim.energy)} ⚡ left.`
                        : `No extra shield! Had ${Math.round(sim.energy)} ⚡ left.`}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-amber-200">
                  <Award className="h-4 w-4 text-amber-300" />
                  <span>Badge: MODIS Thermal Eyes</span>
                </div>

                <div className="mt-4 flex flex-wrap justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={startGame}
                    className="inline-flex h-11 items-center gap-1.5 rounded-full border-2 border-[#543487] bg-[#2D174D] px-5 text-xs font-bold text-white hover:border-amber-300 whitespace-nowrap"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Play Again</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setRoute('CAMPAIGN_MAP');
                    }}
                    className="h-11 rounded-full border-2 border-[#543487] bg-[#2D174D] px-5 text-xs font-bold text-purple-100 hover:border-sky-300 whitespace-nowrap"
                  >
                    Map
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playSuccess();
                      setRoute('MISSION_2');
                    }}
                    className="inline-flex h-11 items-center gap-1.5 rounded-full border-2 border-white border-b-4 bg-gradient-to-b from-[#FDE047] to-[#EAB308] px-6 text-xs font-extrabold text-slate-950 shadow-lg hover:scale-105 transition-transform whitespace-nowrap"
                  >
                    <span>Mission 2</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Loss Overlay */}
            {status === 'LOST' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-[#160A29]/90 p-5 text-center backdrop-blur-[2px]">
                <ShieldAlert className="h-10 w-10 text-rose-400" />
                <h2 className="mt-2 font-display text-2xl font-bold text-rose-300 sm:text-3xl">
                  Out of Energy!
                </h2>
                <p className="mt-1 text-sm font-semibold text-white">{sim.lossReason}</p>
                <p className="mt-1 text-xs text-purple-200">
                  You reached {Math.floor(sim.idealTime)}/{TARGET_IDEAL_SEC}s. Pick a shield early and tap the lights (+12 ⚡)!
                </p>

                <div className="mt-4 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={startGame}
                    className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-white border-b-4 bg-gradient-to-b from-[#FDE047] to-[#EAB308] px-6 text-sm font-extrabold text-slate-950 shadow-lg hover:scale-105 transition-transform whitespace-nowrap"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Try Again</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setRoute('CAMPAIGN_MAP');
                    }}
                    className="h-11 rounded-full border-2 border-[#543487] bg-[#2D174D] px-5 text-sm font-bold text-purple-100 hover:border-sky-300 whitespace-nowrap"
                  >
                    Map
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Bottom Controls: 3 Thermal/Scan Actions + 3 Real Space Shields */}
          <section className="grid gap-3 lg:grid-cols-12">
            <div className="grid grid-cols-3 gap-2 lg:col-span-5">
              <button
                type="button"
                disabled={status !== 'PLAYING' || activeDilemma !== null}
                onClick={handlePulseCooler}
                className={`flex flex-col items-center justify-center gap-1 rounded-2xl border-2 border-b-4 p-3 text-center transition-all active:scale-95 disabled:opacity-45 ${
                  sim.coolerTimer > 0
                    ? 'border-sky-300 bg-sky-500/30 shadow-lg'
                    : 'border-[#543487] bg-[#21103A] hover:border-sky-400'
                }`}
              >
                <Snowflake className="h-6 w-6 text-sky-300" />
                <span className="font-display text-sm font-bold text-white whitespace-nowrap">
                  Cool
                </span>
                <span className="text-[11px] font-semibold text-sky-200">−3 °C · −5 ⚡</span>
              </button>

              <button
                type="button"
                disabled={status !== 'PLAYING' || activeDilemma !== null}
                onClick={handlePulseHeater}
                className={`flex flex-col items-center justify-center gap-1 rounded-2xl border-2 border-b-4 p-3 text-center transition-all active:scale-95 disabled:opacity-45 ${
                  sim.heaterTimer > 0
                    ? 'border-orange-300 bg-orange-500/30 shadow-lg'
                    : 'border-[#543487] bg-[#21103A] hover:border-orange-400'
                }`}
              >
                <Flame className="h-6 w-6 text-orange-400" />
                <span className="font-display text-sm font-bold text-white whitespace-nowrap">
                  Heat
                </span>
                <span className="text-[11px] font-semibold text-orange-200">+3 °C · −5 ⚡</span>
              </button>

              <button
                type="button"
                disabled={status !== 'PLAYING' || activeDilemma !== null}
                onClick={() => handleTriggerModisScan()}
                className={`flex flex-col items-center justify-center gap-1 rounded-2xl border-2 border-b-4 p-3 text-center transition-all disabled:opacity-45 ${
                  targets.length > 0
                    ? 'border-amber-300 bg-amber-500/25 hover:bg-amber-500/35'
                    : 'border-[#543487] bg-[#21103A] hover:border-emerald-400'
                }`}
              >
                <Radar className={`h-6 w-6 ${targets.length > 0 ? 'text-amber-300' : 'text-emerald-300'}`} />
                <span className="font-display text-sm font-bold text-white whitespace-nowrap">
                  Scan Ground
                </span>
                <span className="text-[11px] font-semibold text-amber-200">
                  {targets.length > 0 ? '+12 ⚡!' : 'See °C'}
                </span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 lg:col-span-7">
              {SHIELD_OPTIONS.map((opt) => {
                const isEquipped = sim.shield === opt.id;
                const currentCost = getShieldCost(sim.shield);
                const deltaCost = opt.cost - currentCost;
                const isDowngrade = deltaCost <= 0 && !isEquipped;
                const canAfford = sim.energy > Math.max(0, deltaCost);

                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={status !== 'PLAYING' || activeDilemma !== null || isEquipped || isDowngrade}
                    onClick={() => handleSelectShield(opt)}
                    className={`flex flex-col justify-between rounded-2xl border-2 p-2.5 text-left transition-all disabled:opacity-65 ${
                      isEquipped
                        ? 'border-emerald-400 bg-emerald-500/20 shadow-lg'
                        : canAfford
                          ? 'border-[#543487] bg-[#21103A] hover:border-amber-300'
                          : 'border-[#3B2163] bg-[#160A29]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-white truncate">{opt.name}</span>
                      {isEquipped ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
                      ) : isDowngrade ? (
                        <span className="text-[10px] text-purple-300/70">—</span>
                      ) : (
                        <span className="font-mono-tabular text-xs font-extrabold text-amber-300 whitespace-nowrap">
                          {deltaCost} ⚡
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-[11px] font-semibold text-emerald-300">+ {opt.plus}</div>
                    <div className="text-[11px] text-rose-200/90">− {opt.minus}</div>
                  </button>
                );
              })}
            </div>
          </section>
        </main>
      )}

      <DiscoveryCodexModal open={codexOpen} onClose={() => setCodexOpen(false)} />
    </div>
  );
};
