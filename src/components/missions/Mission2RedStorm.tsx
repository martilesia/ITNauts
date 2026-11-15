import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BatteryCharging,
  Bot,
  Clock,
  Info,
  Play,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Sun,
  Trophy,
  Wind,
  Zap,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { soundEngine } from '../../utils/soundEngine';
import { DiscoveryCodexModal } from '../engine/DiscoveryCodexModal';
import { GameHUD } from '../engine/GameHUD';
import { MarsStormCanvas } from './mission2/MarsStormCanvas';

type GameStatus = 'TITLE' | 'PLAYING' | 'WON' | 'LOST';
type DifficultyLevel = 1 | 2 | 3;

interface DifficultyConfig {
  level: DifficultyLevel;
  label: string;
  durationSec: number;
  baseDrainPerSec: number;
  dustBuildPerSec: number;
  eventIntervalSec: number;
}

const DIFFICULTIES: Record<DifficultyLevel, DifficultyConfig> = {
  1: {
    level: 1,
    label: 'Level 1 · Red Breeze',
    durationSec: 45,
    baseDrainPerSec: 3.1,
    dustBuildPerSec: 3.0,
    eventIntervalSec: 12,
  },
  2: {
    level: 2,
    label: 'Level 2 · Strong Storm',
    durationSec: 60,
    baseDrainPerSec: 3.7,
    dustBuildPerSec: 4.0,
    eventIntervalSec: 11,
  },
  3: {
    level: 3,
    label: 'Level 3 · Super Storm',
    durationSec: 75,
    baseDrainPerSec: 4.3,
    dustBuildPerSec: 5.0,
    eventIntervalSec: 10,
  },
};

interface StormEventOption {
  label: string;
  effectHint: string;
  apply: (curr: SimState) => Partial<SimState>;
}

interface StormEvent {
  id: string;
  title: string;
  kind: 'storm' | 'dust' | 'energy' | 'battery';
  optionA: StormEventOption;
  optionB: StormEventOption;
}

interface SimState {
  energy: number;
  oxygen: number;
  batteryCharge: number;
  dustLevel: number;
  timeLeft: number;
  score: number;
  powerSaving: boolean;
  batteriesActive: boolean;
  roverCleaning: boolean;
  roverProgress: number;
  stormIntensity: number;
  lossReason: string;
}

const STORM_EVENTS: StormEvent[] = [
  {
    id: 'storm-intense',
    title: 'The storm just got stronger!',
    kind: 'storm',
    optionA: {
      label: 'Seal Hatches',
      effectHint: '-5% Energy · Protects O₂',
      apply: (s) => ({
        energy: Math.max(4, s.energy - 5),
        oxygen: Math.min(100, s.oxygen + 10),
        score: s.score + 90,
      }),
    },
    optionB: {
      label: 'Keep Sensors On',
      effectHint: '+140 Pts · +Dust',
      apply: (s) => ({
        dustLevel: Math.min(100, s.dustLevel + 14),
        score: s.score + 140,
      }),
    },
  },
  {
    id: 'panels-dust',
    title: 'Solar panels are covered in dust!',
    kind: 'dust',
    optionA: {
      label: 'Send Rover Now',
      effectHint: '-6% Energy · -45% Dust',
      apply: (s) => ({
        energy: Math.max(4, s.energy - 6),
        dustLevel: Math.max(0, s.dustLevel - 45),
        score: s.score + 110,
      }),
    },
    optionB: {
      label: 'Save & Wait',
      effectHint: 'Enables Power Save',
      apply: (s) => ({
        powerSaving: true,
        score: s.score + 70,
      }),
    },
  },
  {
    id: 'energy-drop',
    title: 'Energy is dropping!',
    kind: 'energy',
    optionA: {
      label: 'Turn Off Lab',
      effectHint: '+10% Energy · Power Save',
      apply: (s) => ({
        energy: Math.min(100, s.energy + 10),
        powerSaving: true,
        score: s.score + 95,
      }),
    },
    optionB: {
      label: 'Use Extra Reserve',
      effectHint: '+18% Energy · -22% Battery',
      apply: (s) => ({
        energy: Math.min(100, s.energy + 18),
        batteryCharge: Math.max(0, s.batteryCharge - 22),
        score: s.score + 85,
      }),
    },
  },
  {
    id: 'battery-low',
    title: 'Battery is almost empty!',
    kind: 'battery',
    optionA: {
      label: 'Eco Mode',
      effectHint: '+14% Battery · Power Save',
      apply: (s) => ({
        batteryCharge: Math.min(100, s.batteryCharge + 14),
        powerSaving: true,
        score: s.score + 90,
      }),
    },
    optionB: {
      label: 'Quick Clean',
      effectHint: '-28% Solar Dust',
      apply: (s) => ({
        dustLevel: Math.max(0, s.dustLevel - 28),
        score: s.score + 100,
      }),
    },
  },
];

function computeSolarOutput(dustLevel: number, stormIntensity: number): number {
  const cleanFactor = Math.max(0.08, 1 - dustLevel / 105);
  const skyFactor = Math.max(0.22, 1 - stormIntensity * 0.58);
  return Math.round(Math.max(5, Math.min(100, cleanFactor * skyFactor * 100)));
}

export const Mission2RedStorm: React.FC = () => {
  const {
    setRoute,
    sayAstro,
    unlockDiscovery,
    completeMission,
    recordDecision,
    recordBehavioralEvent,
  } = useGame();

  const [status, setStatus] = useState<GameStatus>('TITLE');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(1);
  const [codexOpen, setCodexOpen] = useState(false);

  const [sim, setSim] = useState<SimState>({
    energy: 82,
    oxygen: 96,
    batteryCharge: 85,
    dustLevel: 25,
    timeLeft: DIFFICULTIES[1].durationSec,
    score: 0,
    powerSaving: false,
    batteriesActive: false,
    roverCleaning: false,
    roverProgress: 0,
    stormIntensity: 0.45,
    lossReason: '',
  });

  const [activeEvent, setActiveEvent] = useState<StormEvent | null>(null);
  const [actionToast, setActionToast] = useState<string | null>(null);

  const simRef = useRef(sim);
  simRef.current = sim;
  const eventTimerRef = useRef(0);
  const lastEventIndexRef = useRef(-1);
  const toastTimeoutRef = useRef<number | null>(null);

  const showQuickFeedback = useCallback((msg: string) => {
    setActionToast(msg);
    if (toastTimeoutRef.current !== null) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => {
      setActionToast(null);
    }, 2200);
  }, []);

  const startMission = useCallback(
    (lvl: DifficultyLevel) => {
      const cfg = DIFFICULTIES[lvl];
      soundEngine.playStormAlert();
      setDifficulty(lvl);
      eventTimerRef.current = 0;
      setActiveEvent(null);
      setActionToast(null);
      setSim({
        energy: 82,
        oxygen: 96,
        batteryCharge: 85,
        dustLevel: 22,
        timeLeft: cfg.durationSec,
        score: 0,
        powerSaving: false,
        batteriesActive: false,
        roverCleaning: false,
        roverProgress: 0,
        stormIntensity: 0.42,
        lossReason: '',
      });
      setStatus('PLAYING');
      sayAstro('Alert! The dust storm has begun! Keep energy above zero!', 'alert', 4500);
    },
    [sayAstro]
  );

  // Main 100ms game simulation loop
  useEffect(() => {
    if (status !== 'PLAYING' || activeEvent !== null) return;

    const cfg = DIFFICULTIES[difficulty];
    const dt = 0.1;

    const timer = window.setInterval(() => {
      const curr = simRef.current;
      const nextTimeLeft = Math.max(0, curr.timeLeft - dt);

      // Storm wave intensity varies over time
      const progressRatio = 1 - nextTimeLeft / cfg.durationSec;
      const nextStormIntensity = Math.min(
        1,
        0.38 + Math.sin(progressRatio * Math.PI * 2.5) * 0.22 + progressRatio * 0.42
      );

      // Dust accumulation (paused slightly while rover sweeps)
      let nextDust = curr.dustLevel + cfg.dustBuildPerSec * nextStormIntensity * dt;
      let nextRoverCleaning = curr.roverCleaning;
      let nextRoverProgress = curr.roverProgress;

      if (curr.roverCleaning) {
        nextRoverProgress += dt / 2.6; // 2.6s rover round trip
        nextDust = Math.max(0, nextDust - 22 * dt);
        if (nextRoverProgress >= 1) {
          nextRoverCleaning = false;
          nextRoverProgress = 0;
          soundEngine.playSuccess();
          showQuickFeedback('Panels cleaned!');
        }
      }
      nextDust = Math.min(100, Math.max(0, nextDust));

      // Solar production
      const solarPct = computeSolarOutput(nextDust, nextStormIntensity);
      const solarEnergyGain = (solarPct / 100) * 3.1 * dt;

      // Energy consumption & battery flow
      const drain = (curr.powerSaving ? cfg.baseDrainPerSec * 0.45 : cfg.baseDrainPerSec) * dt;

      let nextBattery = curr.batteryCharge;
      let batteryBoost = 0;
      let nextBatteriesActive = curr.batteriesActive;

      if (curr.batteriesActive && nextBattery > 0) {
        const discharge = Math.min(nextBattery, 6.2 * dt);
        nextBattery = Math.max(0, nextBattery - discharge);
        batteryBoost = discharge * 0.85;
        if (nextBattery <= 0.1) {
          nextBatteriesActive = false;
          soundEngine.playGentleError();
          showQuickFeedback('Batteries empty!');
        }
      } else if (!curr.batteriesActive && solarPct > 55 && curr.powerSaving) {
        // Gentle solar trickle recharge when clean & saving power
        nextBattery = Math.min(100, nextBattery + 1.2 * dt);
      }

      const nextEnergy = Math.max(0, Math.min(100, curr.energy + solarEnergyGain + batteryBoost - drain));

      // Oxygen drops slowly if powerSaving is off & energy critical, otherwise stays healthy
      const o2Delta =
        nextEnergy < 18
          ? -3.5 * dt
          : curr.powerSaving
            ? 0.4 * dt
            : -0.25 * dt;
      const nextOxygen = Math.max(0, Math.min(100, curr.oxygen + o2Delta));

      // Score accumulation
      const scoreGain = (curr.powerSaving ? 14 : 18) * dt + (solarPct > 50 ? 6 * dt : 0);
      const nextScore = Math.round(curr.score + scoreGain);

      // Check Loss
      if (nextEnergy <= 0 || nextOxygen <= 0) {
        soundEngine.playGentleError();
        setSim({
          ...curr,
          energy: nextEnergy <= 0 ? 0 : nextEnergy,
          oxygen: nextOxygen <= 0 ? 0 : nextOxygen,
          batteryCharge: nextBattery,
          dustLevel: nextDust,
          timeLeft: nextTimeLeft,
          score: nextScore,
          batteriesActive: false,
          roverCleaning: false,
          roverProgress: 0,
          stormIntensity: nextStormIntensity,
          lossReason:
            nextEnergy <= 0
              ? 'Base energy ran out during the storm!'
              : 'Base oxygen ran out!',
        });
        setStatus('LOST');
        sayAstro('Oh no! Base energy ran out! Let\'s try another strategy!', 'alert', 5000);
        return;
      }

      // Check Win
      if (nextTimeLeft <= 0) {
        soundEngine.playSuccess();
        const finalBonus = Math.round(nextEnergy * 3 + nextOxygen * 2);
        setSim({
          ...curr,
          energy: nextEnergy,
          oxygen: nextOxygen,
          batteryCharge: nextBattery,
          dustLevel: nextDust,
          timeLeft: 0,
          score: nextScore + finalBonus,
          batteriesActive: false,
          roverCleaning: false,
          roverProgress: 0,
          stormIntensity: 0.1,
          lossReason: '',
        });
        setStatus('WON');
        recordDecision({
          m2PreparedInTime: true,
          m2EnergyEfficiencyBonus: nextEnergy >= 35,
          m2RepairedAfterStorm: true,
        });
        recordBehavioralEvent('explore', 'm2-dust-storm-survived');
        unlockDiscovery('disc-mars-storm');
        completeMission('mission-2', 'badge-mars-guardian', {
          id: 'item-high-cap-battery',
          name: 'High-Capacity Battery',
          category: 'module',
          color: '#F59E0B',
          acquiredIn: 'mission-2',
        });
        sayAstro('We did it! The storm passed and the whole team is safe!', 'happy', 6000);
        return;
      }

      setSim({
        ...curr,
        energy: nextEnergy,
        oxygen: nextOxygen,
        batteryCharge: nextBattery,
        dustLevel: nextDust,
        timeLeft: nextTimeLeft,
        score: nextScore,
        batteriesActive: nextBatteriesActive,
        roverCleaning: nextRoverCleaning,
        roverProgress: nextRoverProgress,
        stormIntensity: nextStormIntensity,
      });

      // Random storm events trigger on interval (unless near end < 6s)
      eventTimerRef.current += dt;
      if (eventTimerRef.current >= cfg.eventIntervalSec && nextTimeLeft > 6) {
        eventTimerRef.current = 0;
        let idx = Math.floor(Math.random() * STORM_EVENTS.length);
        if (idx === lastEventIndexRef.current) {
          idx = (idx + 1) % STORM_EVENTS.length;
        }
        lastEventIndexRef.current = idx;
        const picked = STORM_EVENTS[idx];
        soundEngine.playStormAlert();
        setActiveEvent(picked);
      }
    }, 100);

    return () => window.clearInterval(timer);
  }, [
    status,
    activeEvent,
    difficulty,
    completeMission,
    recordBehavioralEvent,
    recordDecision,
    sayAstro,
    showQuickFeedback,
    unlockDiscovery,
  ]);

  // 3 Primary Actions
  const handleTogglePowerSaving = () => {
    if (status !== 'PLAYING' || activeEvent) return;
    soundEngine.playClick();
    setSim((prev) => {
      const next = !prev.powerSaving;
      showQuickFeedback(next ? 'Power saving on!' : 'Equipment on!');
      return { ...prev, powerSaving: next };
    });
  };

  const handleToggleBatteries = () => {
    if (status !== 'PLAYING' || activeEvent) return;
    if (!sim.batteriesActive && sim.batteryCharge <= 1) {
      soundEngine.playGentleError();
      showQuickFeedback('Batteries empty!');
      return;
    }
    soundEngine.playPickup();
    setSim((prev) => {
      const next = !prev.batteriesActive;
      showQuickFeedback(next ? 'Batteries powering base!' : 'Batteries on standby');
      return { ...prev, batteriesActive: next };
    });
  };

  const handleCleanPanels = () => {
    if (status !== 'PLAYING' || activeEvent || sim.roverCleaning) return;
    if (sim.energy < 8) {
      soundEngine.playGentleError();
      showQuickFeedback('Not enough energy for rover!');
      return;
    }
    soundEngine.playScan();
    setSim((prev) => ({
      ...prev,
      energy: Math.max(1, prev.energy - 7),
      roverCleaning: true,
      roverProgress: 0,
      score: prev.score + 55,
    }));
    showQuickFeedback('Rover cleaning panels!');
  };

  const handleEventChoice = (option: StormEventOption) => {
    if (!activeEvent) return;
    soundEngine.playSuccess();
    setSim((prev) => ({
      ...prev,
      ...option.apply(prev),
    }));
    showQuickFeedback(option.effectHint);
    setActiveEvent(null);
  };

  const solarOutput = computeSolarOutput(sim.dustLevel, sim.stormIntensity);
  const cfg = DIFFICULTIES[difficulty];
  const timeRatio = Math.max(0, Math.min(100, (sim.timeLeft / cfg.durationSec) * 100));

  return (
    <div className="flex min-h-screen flex-col bg-[#1B0D2E] text-slate-100 select-none">
      <GameHUD
        missionTitle="AstroBase · Dust Storm"
        goalText="Keep the base powered until the storm passes."
        progressText={status === 'PLAYING' ? `${Math.ceil(sim.timeLeft)}s · ${sim.score} pts` : undefined}
        onBackToMap={() => setRoute('CAMPAIGN_MAP')}
        onOpenCodex={() => setCodexOpen(true)}
        onRepeatHint={() => {
          sayAstro(
            'Save energy when solar output drops, use batteries during dips, and send the rover to clean dust off the panels!',
            'curious',
            5000
          );
        }}
      />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-3.5 px-4 py-4">
        {/* TOP VISUAL INDICATORS ONLY (Icons + Progress Bars + Numbers) */}
        <section
          aria-label="Base Indicators"
          className="grid grid-cols-2 gap-2.5 rounded-2xl border-2 border-[#543487] bg-[#21103A] p-3 shadow-lg sm:grid-cols-4"
        >
          {/* 1. Energia disponível */}
          <div className="rounded-xl border border-[#462A72] bg-[#160A29] px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                <BatteryCharging className="h-5 w-5" />
                <span>Energy</span>
              </span>
              <span className="font-mono-tabular text-base font-extrabold text-white">
                {Math.round(sim.energy)}%
              </span>
            </div>
            <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-150 ${
                  sim.energy > 45 ? 'bg-emerald-400' : sim.energy > 22 ? 'bg-amber-400' : 'bg-rose-500'
                }`}
                style={{ width: `${sim.energy}%` }}
              />
            </div>
          </div>

          {/* 2. Produção solar */}
          <div className="rounded-xl border border-[#462A72] bg-[#160A29] px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-orange-300">
                <Sun className="h-5 w-5" />
                <span>Solar</span>
              </span>
              <span className="font-mono-tabular text-base font-extrabold text-white">
                {solarOutput}%
              </span>
            </div>
            <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-150"
                style={{ width: `${solarOutput}%` }}
              />
            </div>
          </div>

          {/* 3. Oxigénio */}
          <div className="rounded-xl border border-[#462A72] bg-[#160A29] px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-sky-300">
                <Wind className="h-5 w-5" />
                <span>Oxygen</span>
              </span>
              <span className="font-mono-tabular text-base font-extrabold text-white">
                {Math.round(sim.oxygen)}%
              </span>
            </div>
            <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-150 ${
                  sim.oxygen > 40 ? 'bg-sky-400' : 'bg-rose-500'
                }`}
                style={{ width: `${sim.oxygen}%` }}
              />
            </div>
          </div>

          {/* 4. Tempo restante da tempestade */}
          <div className="rounded-xl border border-[#462A72] bg-[#160A29] px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-rose-300">
                <Clock className="h-5 w-5" />
                <span>Storm</span>
              </span>
              <span className="font-mono-tabular text-base font-extrabold text-white">
                {Math.ceil(sim.timeLeft)}s
              </span>
            </div>
            <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose-500 to-orange-400 transition-all duration-150"
                style={{ width: `${timeRatio}%` }}
              />
            </div>
          </div>
        </section>

        {/* 2D MARS BASE GAME SCENE + OVERLAYS */}
        <section className="relative">
          <MarsStormCanvas
            energy={sim.energy}
            solarOutput={solarOutput}
            oxygen={sim.oxygen}
            batteryCharge={sim.batteryCharge}
            dustLevel={sim.dustLevel}
            stormIntensity={sim.stormIntensity}
            powerSaving={sim.powerSaving}
            batteriesActive={sim.batteriesActive}
            roverCleaning={sim.roverCleaning}
            roverProgress={sim.roverProgress}
            status={status}
            eventActive={activeEvent !== null}
          />

          {/* Compact feedback pill during action */}
          {status === 'PLAYING' && actionToast && !activeEvent && (
            <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 rounded-full border-2 border-amber-300 bg-[#160A29]/90 px-4 py-1.5 text-xs font-bold text-amber-200 shadow-lg">
              {actionToast}
            </div>
          )}

          {/* TITLE OVERLAY */}
          {status === 'TITLE' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-[#160A29]/82 p-5 text-center backdrop-blur-[2px]">
              <div className="text-xs font-bold uppercase tracking-wider text-orange-300">
                Mission 02 · Mars
              </div>
              <h1 className="mt-1 font-display text-3xl font-bold text-white sm:text-4xl">
                Dust Storm
              </h1>
              <p className="mt-1.5 max-w-md text-sm text-purple-100">
                The storm is blocking the sun! Protect the base's energy until the sky clears.
              </p>

              {/* Level Selector */}
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {([1, 2, 3] as DifficultyLevel[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setDifficulty(lvl);
                    }}
                    className={`rounded-xl border-2 px-3.5 py-2 text-xs font-bold transition-transform hover:scale-105 ${
                      difficulty === lvl
                        ? 'border-amber-300 bg-amber-400/25 text-amber-200'
                        : 'border-[#543487] bg-[#21103A] text-purple-200'
                    }`}
                  >
                    {DIFFICULTIES[lvl].label} ({DIFFICULTIES[lvl].durationSec}s)
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => startMission(difficulty)}
                className="mt-5 inline-flex h-13 items-center gap-2.5 rounded-full border-2 border-white border-b-4 bg-gradient-to-b from-[#FDE047] to-[#EAB308] px-8 text-base font-extrabold text-slate-950 shadow-xl transition-transform hover:scale-105"
              >
                <Play className="h-5 w-5" />
                <span>START MISSION</span>
              </button>

              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-sky-200/85">
                <Info className="h-3.5 w-3.5 shrink-0" />
                <span>Educational simulation · MERRA-2 analyzes aerosols on Earth, not Mars.</span>
              </div>
            </div>
          )}

          {/* RANDOM EVENT MODAL OVERLAY */}
          {status === 'PLAYING' && activeEvent && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-[#160A29]/75 p-4 backdrop-blur-[2px]">
              <div className="w-full max-w-md animate-bounce-once rounded-3xl border-2 border-amber-300 bg-[#251142] p-5 text-center shadow-2xl">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/25 text-rose-300">
                  <AlertTriangle className="h-7 w-7 animate-pulse" />
                </div>
                <h2 className="mt-2 font-display text-xl font-bold text-white">
                  {activeEvent.title}
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[activeEvent.optionA, activeEvent.optionB].map((opt, idx) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => handleEventChoice(opt)}
                      className={`flex flex-col items-center justify-center rounded-2xl border-2 p-3.5 text-center transition-transform hover:scale-105 ${
                        idx === 0
                          ? 'border-emerald-400 bg-emerald-500/20 text-white'
                          : 'border-sky-400 bg-sky-500/20 text-white'
                      }`}
                    >
                      <span className="text-sm font-extrabold">{opt.label}</span>
                      <span className="mt-1 text-xs font-semibold text-amber-200">
                        {opt.effectHint}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VICTORY OVERLAY */}
          {status === 'WON' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-[#160A29]/82 p-5 text-center backdrop-blur-[2px]">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400 bg-emerald-500/25 px-4 py-1 text-xs font-bold text-emerald-200">
                <Trophy className="h-4 w-4 text-amber-300" />
                <span>COMMANDER MEDAL</span>
              </div>
              <h2 className="mt-2 font-display text-3xl font-bold text-emerald-300">
                Base Safe!
              </h2>
              <p className="mt-1 text-sm text-purple-100">
                The storm passed and you kept the entire crew protected!
              </p>

              <div className="mt-3 flex items-center gap-4 rounded-2xl border border-amber-300/60 bg-[#21103A] px-5 py-2.5">
                <div className="flex items-center gap-1.5 text-amber-300">
                  <Award className="h-6 w-6" />
                  <span className="font-mono-tabular text-xl font-extrabold text-white">
                    {sim.score} pts
                  </span>
                </div>
                <span className="text-xs font-bold text-sky-300">{cfg.label}</span>
              </div>

              <div className="mt-4 flex flex-wrap justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => startMission(difficulty)}
                  className="inline-flex h-11 items-center gap-1.5 rounded-full border-2 border-[#543487] bg-[#2D174D] px-5 text-xs font-bold text-white hover:border-amber-300"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>PLAY AGAIN</span>
                </button>

                {difficulty < 3 && (
                  <button
                    type="button"
                    onClick={() => startMission((difficulty + 1) as DifficultyLevel)}
                    className="inline-flex h-11 items-center gap-1.5 rounded-full border-2 border-emerald-300 bg-emerald-500 px-5 text-xs font-extrabold text-slate-950 hover:scale-105 transition-transform"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>LEVEL {difficulty + 1}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setRoute('CAMPAIGN_MAP');
                  }}
                  className="h-11 rounded-full border-2 border-[#543487] bg-[#2D174D] px-5 text-xs font-bold text-purple-100 hover:border-sky-300"
                >
                  BACK TO ASTROBASE
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playSuccess();
                    setRoute('MISSION_3');
                  }}
                  className="inline-flex h-11 items-center gap-1.5 rounded-full border-2 border-white border-b-4 bg-gradient-to-b from-[#FDE047] to-[#EAB308] px-5 text-xs font-extrabold text-slate-950 hover:scale-105 transition-transform"
                >
                  <span>MISSION 3</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* LOSS OVERLAY */}
          {status === 'LOST' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-[#160A29]/88 p-5 text-center backdrop-blur-[2px]">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/25 text-rose-400">
                <ShieldAlert className="h-8 w-8" />
              </div>
              <h2 className="mt-2 font-display text-3xl font-bold text-rose-300">
                Mission Failed!
              </h2>
              <p className="mt-1 text-sm font-semibold text-white">{sim.lossReason}</p>
              <div className="mt-2 font-mono-tabular text-sm font-bold text-amber-300">
                Score: {sim.score} pts
              </div>

              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => startMission(difficulty)}
                  className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-white border-b-4 bg-gradient-to-b from-[#FDE047] to-[#EAB308] px-6 text-sm font-extrabold text-slate-950 shadow-lg hover:scale-105 transition-transform"
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
                  className="h-12 rounded-full border-2 border-[#543487] bg-[#2D174D] px-6 text-sm font-bold text-purple-100 hover:border-sky-300"
                >
                  BACK TO ASTROBASE
                </button>
              </div>
            </div>
          )}
        </section>

        {/* 3 BIG ACTION BUTTONS */}
        <section
          aria-label="Base Actions"
          className="grid gap-3 sm:grid-cols-3"
        >
          {/* 1. Poupar energia */}
          <button
            type="button"
            disabled={status !== 'PLAYING' || activeEvent !== null}
            onClick={handleTogglePowerSaving}
            className={`flex items-center gap-3 rounded-2xl border-2 border-b-4 p-4 text-left transition-all disabled:opacity-50 ${
              sim.powerSaving
                ? 'border-sky-300 bg-gradient-to-b from-sky-500/35 to-sky-700/35 shadow-lg scale-[1.01]'
                : 'border-[#543487] bg-[#21103A] hover:border-sky-400'
            }`}
          >
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                sim.powerSaving ? 'bg-sky-400 text-slate-950' : 'bg-[#160A29] text-sky-300'
              }`}
            >
              <Zap className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-display text-base font-bold text-white">
                Save energy
              </div>
              <div className="text-xs font-semibold text-sky-200">
                {sim.powerSaving ? 'Active · Lower drain' : 'Turn off extras'}
              </div>
            </div>
          </button>

          {/* 2. Activar baterias */}
          <button
            type="button"
            disabled={status !== 'PLAYING' || activeEvent !== null}
            onClick={handleToggleBatteries}
            className={`flex items-center gap-3 rounded-2xl border-2 border-b-4 p-4 text-left transition-all disabled:opacity-50 ${
              sim.batteriesActive
                ? 'border-emerald-300 bg-gradient-to-b from-emerald-500/35 to-emerald-700/35 shadow-lg scale-[1.01]'
                : 'border-[#543487] bg-[#21103A] hover:border-emerald-400'
            }`}
          >
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                sim.batteriesActive ? 'bg-emerald-400 text-slate-950' : 'bg-[#160A29] text-emerald-300'
              }`}
            >
              <BatteryCharging className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-base font-bold text-white">
                  Activate batteries
                </span>
                <span className="font-mono-tabular text-xs font-bold text-emerald-300">
                  {Math.round(sim.batteryCharge)}%
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all"
                  style={{ width: `${sim.batteryCharge}%` }}
                />
              </div>
            </div>
          </button>

          {/* 3. Limpar painéis solares */}
          <button
            type="button"
            disabled={status !== 'PLAYING' || activeEvent !== null || sim.roverCleaning}
            onClick={handleCleanPanels}
            className={`flex items-center gap-3 rounded-2xl border-2 border-b-4 p-4 text-left transition-all disabled:opacity-60 ${
              sim.roverCleaning
                ? 'border-amber-300 bg-amber-500/25'
                : 'border-[#543487] bg-[#21103A] hover:border-amber-300'
            }`}
          >
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                sim.roverCleaning ? 'bg-amber-400 text-slate-950' : 'bg-[#160A29] text-amber-300'
              }`}
            >
              <Bot className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-base font-bold text-white">
                  Clean solar panels
                </span>
              </div>
              <div className="text-xs font-semibold text-amber-200">
                {sim.roverCleaning
                  ? `Rover cleaning (${Math.round(sim.roverProgress * 100)}%)`
                  : `Dust: ${Math.round(sim.dustLevel)}% · -7% Energy`}
              </div>
            </div>
          </button>
        </section>

        {/* Quiet 1-line scientific accuracy footer */}
        <footer className="text-center text-[11px] text-purple-200/75">
          Educational simulation on Mars · Real MERRA-2 data observes aerosols in Earth's atmosphere.
        </footer>
      </main>

      <DiscoveryCodexModal open={codexOpen} onClose={() => setCodexOpen(false)} />
    </div>
  );
};
