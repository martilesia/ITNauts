import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BatteryCharging,
  Play,
  RotateCcw,
  Shield,
  Sparkles,
  Sun,
  Trophy,
  Wind,
  Zap,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { soundEngine } from '../../utils/soundEngine';
import { AstroCompanion } from '../engine/AstroCompanion';
import { CommanderSprite } from '../engine/CommanderSprite';
import { DiscoveryCodexModal } from '../engine/DiscoveryCodexModal';
import { GameHUD } from '../engine/GameHUD';
import { M2StructureId, M2StructureState, MarsStormCanvas } from './mission2/MarsStormCanvas';

type Phase = 'BRIEFING' | 'DEFENSE' | 'RESULTS';

const TOTAL_SECONDS = 30;

export const Mission2RedStorm: React.FC = () => {
  const {
    save,
    setRoute,
    astroDialogue,
    sayAstro,
    unlockDiscovery,
    completeMission,
    recordDecision,
    recordBehavioralEvent,
  } = useGame();

  const isMoon = save.selectedDestination === 'moon';
  const destinationLabel = isMoon ? 'Moon' : 'Mars';
  const commanderName = save.commander.commanderName || 'Nova';
  const missionOpTitle = isMoon ? 'Lunar Shield' : 'Red Storm';

  const hasM1Reflective = save.campaignMemory?.m1ThermalShield === 'reflective';
  const hasM1ElectroFilter = save.campaignMemory?.m1DustFilter === 'electrostatic';

  const buildInitialStructures = useCallback((): M2StructureState[] => {
    return [
      {
        id: 'solar',
        label: 'Panels',
        pos: { x: 20, y: 55 },
        shielded: false,
        damaged: false,
        dustLevel: 15,
      },
      {
        id: 'sensors',
        label: 'Sensors',
        pos: { x: 42, y: 42 },
        shielded: false,
        damaged: false,
        dustLevel: 0,
      },
      {
        id: 'habitat',
        label: 'Habitat',
        pos: { x: 63, y: 55 },
        shielded: hasM1Reflective,
        permanentShield: hasM1Reflective,
        damaged: false,
        dustLevel: 0,
      },
      {
        id: 'battery',
        label: 'Batteries',
        pos: { x: 82, y: 42 },
        shielded: false,
        damaged: false,
        dustLevel: 0,
      },
    ];
  }, [hasM1Reflective]);

  const [phase, setPhase] = useState<Phase>('BRIEFING');
  const [timerSec, setTimerSec] = useState(TOTAL_SECONDS);
  const [energy, setEnergy] = useState(85);
  const [oxygen, setOxygen] = useState(95);
  const [score, setScore] = useState(0);
  const [repairedCount, setRepairedCount] = useState(0);
  const [blockedCount, setBlockedCount] = useState(0);
  const [structures, setStructures] = useState<M2StructureState[]>(buildInitialStructures);
  const [targetedId, setTargetedId] = useState<M2StructureId | null>(null);
  const [roverPosPct, setRoverPosPct] = useState(20);
  const [roverBusy, setRoverBusy] = useState(false);
  const [crisisModalOpen, setCrisisModalOpen] = useState(false);
  const [crisisDone, setCrisisDone] = useState(false);
  const [lastHitFeedback, setLastHitFeedback] = useState<{
    id: M2StructureId;
    text: string;
    tone: 'good' | 'bad';
  } | null>(null);
  const [failReason, setFailReason] = useState<'energy' | 'oxygen' | null>(null);
  const [codexOpen, setCodexOpen] = useState(false);

  const structuresRef = useRef(structures);
  structuresRef.current = structures;

  const targetedRef = useRef(targetedId);
  targetedRef.current = targetedId;

  const startDefense = () => {
    soundEngine.playClick();
    setStructures(buildInitialStructures());
    setTimerSec(TOTAL_SECONDS);
    setEnergy(85);
    setOxygen(95);
    setScore(0);
    setRepairedCount(0);
    setBlockedCount(0);
    setTargetedId(null);
    setRoverPosPct(20);
    setRoverBusy(false);
    setCrisisModalOpen(false);
    setCrisisDone(false);
    setLastHitFeedback(null);
    setFailReason(null);
    setPhase('DEFENSE');

    sayAstro(
      isMoon
        ? 'Solar flare! Tap modules with a red ring to turn on the shield, and clean dust off the panels!'
        : 'Storm active! Protect modules with a danger ring and send the rover to clean the panels!',
      'alert',
      6500
    );
  };

  const showHitFeedback = useCallback(
    (id: M2StructureId, text: string, tone: 'good' | 'bad') => {
      setLastHitFeedback({ id, text, tone });
      window.setTimeout(() => {
        setLastHitFeedback((curr) => (curr?.id === id && curr?.text === text ? null : curr));
      }, 1500);
    },
    []
  );

  // Direct module click: repair if damaged, otherwise toggle shield ON/OFF
  const handleStructureClick = (id: M2StructureId) => {
    if (phase !== 'DEFENSE' || crisisModalOpen) return;

    setStructures((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        if (s.damaged) {
          soundEngine.playSuccess();
          setRepairedCount((c) => c + 1);
          setEnergy((e) => Math.max(0, e - 4));
          setScore((sc) => sc + 15);
          recordDecision({ m2RepairedAfterStorm: true });
          recordBehavioralEvent('adapt');
          showHitFeedback(id, 'Repaired! +15', 'good');
          return { ...s, damaged: false, shielded: true };
        }
        if (s.permanentShield) {
          soundEngine.playClick();
          showHitFeedback(id, 'Gold Shield!', 'good');
          return s;
        }
        const nextShield = !s.shielded;
        soundEngine.playClick();
        if (nextShield) recordBehavioralEvent('explore');
        return { ...s, shielded: nextShield };
      })
    );
  };

  // Rover cleans dust from Solar Panels
  const handleRoverClean = () => {
    if (phase !== 'DEFENSE' || roverBusy || crisisModalOpen) return;
    soundEngine.playClick();
    setRoverBusy(true);
    setRoverPosPct((p) => (p > 45 ? 20 : 75));
    setEnergy((e) => Math.max(0, e - 5));
    recordBehavioralEvent('explore');

    window.setTimeout(() => {
      setStructures((prev) =>
        prev.map((s) => (s.id === 'solar' ? { ...s, dustLevel: 0 } : s))
      );
      setRoverBusy(false);
      setScore((sc) => sc + 15);
      soundEngine.playSuccess();
      showHitFeedback('solar', 'Panels Cleaned! +15', 'good');
    }, 700);
  };

  // Main 1-second simulation tick during DEFENSE
  useEffect(() => {
    if (phase !== 'DEFENSE' || crisisModalOpen) return;

    const interval = window.setInterval(() => {
      const currStructures = structuresRef.current;
      const currTarget = targetedRef.current;

      // 1. Update dust on solar panels
      setStructures((prev) =>
        prev.map((s) => {
          if (s.id !== 'solar') return s;
          const dustGain = hasM1ElectroFilter ? 3.5 : 6.5;
          return { ...s, dustLevel: Math.min(100, s.dustLevel + dustGain) };
        })
      );

      // 2. Energy balance: active non-permanent shields drain energy; clean solar panels recharge!
      const activeShieldCount = currStructures.filter(
        (s) => s.shielded && !s.permanentShield && !s.damaged
      ).length;
      const solar = currStructures.find((s) => s.id === 'solar');
      const solarOutput = solar?.damaged ? 0 : Math.max(0.5, 4.2 - (solar?.dustLevel ?? 0) / 28);
      const batteryDamagedPenalty = currStructures.find((s) => s.id === 'battery')?.damaged ? 2.5 : 0;

      setEnergy((prev) => {
        const next = Math.max(
          0,
          Math.min(100, prev + solarOutput - activeShieldCount * 1.4 - 1.2 - batteryDamagedPenalty)
        );
        if (next <= 0) {
          setFailReason('energy');
          setPhase('RESULTS');
        }
        return next;
      });

      // 3. Oxygen balance: drops faster if Habitat is damaged
      const habDamaged = currStructures.find((s) => s.id === 'habitat')?.damaged;
      setOxygen((prev) => {
        const next = Math.max(0, Math.min(100, prev - (habDamaged ? 4.5 : 0.7) + 0.3));
        if (next <= 0) {
          setFailReason('oxygen');
          setPhase('RESULTS');
        }
        return next;
      });

      // 4. Timer & Threat Waves
      setTimerSec((t) => {
        const nextT = t - 1;

        // Trigger mid-wave Crisis at 15s remaining
        if (nextT === 15 && !crisisDone) {
          setCrisisDone(true);
          setCrisisModalOpen(true);
          soundEngine.playStormAlert();
          return nextT;
        }

        // Every 4 seconds: resolve previous target OR spawn a new warning target!
        if (nextT > 1 && nextT % 2 === 0) {
          if (currTarget) {
            // Threat hits targeted module!
            const targetMod = currStructures.find((s) => s.id === currTarget);
            if (targetMod && (targetMod.shielded || targetMod.permanentShield)) {
              soundEngine.playSuccess();
              setBlockedCount((b) => b + 1);
              setScore((sc) => sc + 20);
              showHitFeedback(currTarget, 'Defended! +20', 'good');
            } else if (targetMod && !targetMod.damaged) {
              soundEngine.playGentleError();
              setStructures((prev) =>
                prev.map((s) => (s.id === currTarget ? { ...s, damaged: true, shielded: false } : s))
              );
              setEnergy((e) => Math.max(0, e - 8));
              showHitFeedback(currTarget, 'Damaged! -8%', 'bad');
            }
            setTargetedId(null);
          } else {
            // Pick a non-damaged module to target (prefer non-permanent-shielded ones)
            const pool = currStructures.filter((s) => !s.damaged && !s.permanentShield);
            const fallbackPool = currStructures.filter((s) => !s.damaged);
            const candidates = pool.length > 0 ? pool : fallbackPool;
            if (candidates.length > 0) {
              const chosen = candidates[Math.floor(Math.random() * candidates.length)];
              setTargetedId(chosen.id);
              soundEngine.playStormAlert();
            }
          }
        }

        if (nextT <= 0) {
          setPhase('RESULTS');
          return 0;
        }
        return nextT;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [crisisDone, crisisModalOpen, hasM1ElectroFilter, phase, showHitFeedback]);

  // Finalize mission when entering RESULTS
  useEffect(() => {
    if (phase !== 'RESULTS') return;
    const damagedCount = structures.filter((s) => s.damaged).length;
    const passed = failReason === null && energy > 0 && oxygen > 0;

    recordDecision({
      m2PreparedInTime: blockedCount >= 2,
      m2ProtectedCount: 4 - damagedCount,
      m2DamagedCount: damagedCount,
      m2EnergyEfficiencyBonus: energy >= 50,
    });

    if (passed) {
      soundEngine.playSuccess();
      unlockDiscovery('disc-mars-storm');
      completeMission('mission-2', 'badge-mars-guardian', {
        id: isMoon ? 'item-lunar-shield' : 'item-storm-shield',
        name: isMoon ? 'Lunar Anti-Radiation Shield' : 'Martian Anti-Storm Shield',
        category: 'module',
        color: '#38BDF8',
        acquiredIn: 'mission-2',
      });
      sayAstro(
        `Nice work, ${commanderName}! Base saved with ${Math.round(energy)}% energy and ${blockedCount} blocks!`,
        'happy',
        6500
      );
    } else {
      soundEngine.playGentleError();
      sayAstro(
        failReason === 'energy'
          ? 'Power ran out! Turn off shields when there is no danger and clean the panels!'
          : 'Oxygen ran out! Repair the Habitat quickly when it gets damaged!',
        'encourage',
        6500
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const handleCrisisChoice = (choice: 'all-shield' | 'save-power') => {
    setCrisisModalOpen(false);
    recordBehavioralEvent('adapt');

    if (choice === 'all-shield') {
      soundEngine.playSuccess();
      setEnergy((e) => Math.max(5, e - 15));
      setStructures((prev) => prev.map((s) => ({ ...s, shielded: true, damaged: false })));
      setTargetedId(null);
      setScore((sc) => sc + 25);
      sayAstro('Full Shield activated! Spent -15% energy but saved all modules!', 'happy', 5000);
    } else {
      soundEngine.playGentleError();
      setEnergy((e) => Math.min(100, e + 20));
      setStructures((prev) =>
        prev.map((s) => (s.id === 'sensors' ? { ...s, damaged: true, shielded: false } : s))
      );
      setTargetedId(null);
      showHitFeedback('sensors', 'Sensors Damaged!', 'bad');
      sayAstro('Saved +20% energy, but the Sensors broke! Click them to repair!', 'alert', 5500);
    }
  };

  const missionPassed = failReason === null && energy > 0 && oxygen > 0;
  const activeShields = structures.filter((s) => s.shielded && !s.permanentShield && !s.damaged).length;
  const solarDust = Math.round(structures.find((s) => s.id === 'solar')?.dustLevel ?? 0);

  return (
    <div className="min-h-screen bg-[#1B0D2E] text-slate-100 flex flex-col">
      <GameHUD
        missionTitle={`Mission 02 · ${destinationLabel} · ${missionOpTitle}`}
        goalText={
          phase === 'BRIEFING'
            ? `Defend the base against ${isMoon ? 'the solar flare' : 'the dust storm'}!`
            : phase === 'DEFENSE'
              ? 'Tap threatened modules to turn on shields and clean dust off the panels!'
              : 'Base Defense Result'
        }
        progressText={phase === 'DEFENSE' ? `${timerSec}s · ${score} pts` : undefined}
        onBackToMap={() => setRoute('CAMPAIGN_MAP')}
        onOpenCodex={() => setCodexOpen(true)}
        onRepeatHint={() =>
          sayAstro(
            'Tap a module with a red ring to turn on its shield. Turn it off when safe to save energy!',
            'curious',
            6500
          )
        }
      />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-4 sm:px-6">
        {phase === 'BRIEFING' && (
          <section className="mx-auto my-auto w-full max-w-2xl rounded-3xl border-2 border-[#543487] bg-[#24123F] p-6 sm:p-8 shadow-2xl text-center">
            <div className="flex items-end justify-center gap-4">
              <CommanderSprite profile={save.commander} size={86} />
              <AstroCompanion mood="alert" showCaptions={false} size={64} />
            </div>

            <h1 className="mt-4 font-display text-2xl sm:text-3xl font-bold text-white">
              {missionOpTitle} · {destinationLabel}
            </h1>
            <p className="mt-2 text-sm text-purple-100/90">
              {isMoon
                ? 'A solar flare is coming! Turn on shields only where there is danger so you do not drain the battery.'
                : 'The storm brings red dust! Protect modules, clean the panels, and repair any damage.'}
            </p>

            {(hasM1Reflective || hasM1ElectroFilter) && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-emerald-400/50 bg-emerald-500/15 px-4 py-2 text-xs font-bold text-emerald-200">
                <Sparkles className="h-4 w-4 shrink-0" />
                <span>
                  Mission 1 Bonus:{' '}
                  {hasM1Reflective ? 'Shielded Habitat ' : ''}
                  {hasM1ElectroFilter ? '· Less Dust on Panels!' : ''}
                </span>
              </div>
            )}

            <div className="mt-5 grid grid-cols-3 gap-3 text-xs font-bold">
              <div className="rounded-2xl border border-[#462A72] bg-[#190B2E] p-3.5 flex flex-col items-center gap-1.5">
                <Shield className="h-6 w-6 text-sky-300" />
                <span className="text-white">Tap = Shield</span>
              </div>
              <div className="rounded-2xl border border-[#462A72] bg-[#190B2E] p-3.5 flex flex-col items-center gap-1.5">
                <Sun className="h-6 w-6 text-amber-300" />
                <span className="text-white">Rover Cleans Dust</span>
              </div>
              <div className="rounded-2xl border border-[#462A72] bg-[#190B2E] p-3.5 flex flex-col items-center gap-1.5">
                <Zap className="h-6 w-6 text-emerald-300" />
                <span className="text-white">Survive 30s!</span>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={startDefense}
                className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-white border-b-4 bg-gradient-to-b from-[#FDE047] to-[#EAB308] px-8 text-base font-bold text-slate-950 shadow-lg hover:scale-105 active:scale-95 transition-transform"
              >
                <Play className="h-5 w-5" />
                <span>Defend the Base!</span>
              </button>
            </div>
          </section>
        )}

        {phase === 'DEFENSE' && (
          <div className="flex flex-col gap-4">
            {/* Compact Top Action Strip */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-2xl border-2 border-[#462A72] bg-[#21103A] p-3">
              {/* Countdown */}
              <div className="rounded-xl border border-[#462A72] bg-[#160A29] px-3 py-2 flex items-center justify-between">
                <span className="text-xs font-bold text-purple-200">Time</span>
                <span className="font-mono-tabular text-xl font-extrabold text-amber-300">
                  {timerSec}s
                </span>
              </div>

              {/* Energy Bar */}
              <div className="rounded-xl border border-[#462A72] bg-[#160A29] px-3 py-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1 text-amber-300">
                    <BatteryCharging className="h-4 w-4" /> Energy
                  </span>
                  <span className="font-mono-tabular text-white">{Math.round(energy)}%</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-900">
                  <div
                    className={`h-full transition-all ${
                      energy > 45 ? 'bg-amber-400' : energy > 20 ? 'bg-orange-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.round(energy)}%` }}
                  />
                </div>
              </div>

              {/* Oxygen Bar */}
              <div className="rounded-xl border border-[#462A72] bg-[#160A29] px-3 py-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1 text-sky-300">
                    <Wind className="h-4 w-4" /> Oxygen
                  </span>
                  <span className="font-mono-tabular text-white">{Math.round(oxygen)}%</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-900">
                  <div
                    className="h-full bg-sky-400 transition-all"
                    style={{ width: `${Math.round(oxygen)}%` }}
                  />
                </div>
              </div>

              {/* Quick Rover Cleaner Button */}
              <button
                type="button"
                disabled={roverBusy}
                onClick={handleRoverClean}
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-sky-300 bg-sky-500/25 px-3 py-2 text-xs font-bold text-white hover:bg-sky-500/35 active:scale-95 transition-transform disabled:opacity-50"
              >
                <Sun className="h-4 w-4 text-amber-300 shrink-0" />
                <span>
                  {roverBusy ? 'Rover cleaning...' : `Clean Panels (${solarDust}% dust)`}
                </span>
              </button>
            </div>

            {/* Interactive Base Defense Arena */}
            <MarsStormCanvas
              destination={isMoon ? 'moon' : 'mars'}
              commander={save.commander}
              structures={structures}
              targetedId={targetedId}
              solarFlareActive={isMoon && timerSec > 10}
              roverPosPct={roverPosPct}
              roverActive={roverBusy}
              lastHitFeedback={lastHitFeedback}
              reducedStimuli={save.settings.reducedStimuli}
              onStructureClick={handleStructureClick}
            />

            {/* Bottom Live Shield & ASTRO Status Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#462A72] bg-[#21103A] px-4 py-2.5">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <AstroCompanion mood={astroDialogue?.mood ?? 'alert'} showCaptions={false} size={40} />
                <p className="text-xs sm:text-sm font-medium text-purple-100 truncate sm:whitespace-normal">
                  {astroDialogue?.text ??
                    `Active shields: ${activeShields} (each shield uses energy — turn off when safe!)`}
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold shrink-0">
                <span className="text-emerald-300">Blocks: {blockedCount}</span>
                <span aria-hidden="true">·</span>
                <span className="text-amber-300 font-mono-tabular">{score} pts</span>
              </div>
            </div>
          </div>
        )}

        {phase === 'RESULTS' && (
          <section
            className={`mx-auto my-auto w-full max-w-2xl rounded-3xl border-2 bg-[#24123F] p-6 sm:p-8 text-center shadow-2xl ${
              missionPassed ? 'border-emerald-400/70' : 'border-rose-400/70'
            }`}
          >
            <div className="flex items-end justify-center gap-4">
              <CommanderSprite profile={save.commander} size={86} isCelebrating={missionPassed} />
              <AstroCompanion mood={missionPassed ? 'happy' : 'alert'} showCaptions={false} size={64} />
            </div>

            <h2 className="mt-4 font-display text-2xl sm:text-3xl font-bold text-white">
              {missionPassed
                ? `${destinationLabel} Base Saved!`
                : failReason === 'energy'
                  ? 'Energy Depleted!'
                  : 'Oxygen Depleted!'}
            </h2>
            <p className="mt-1.5 text-sm text-purple-100/90">
              {missionPassed
                ? 'You managed shields, the rover, and power like a true Commander!'
                : 'Turn off shields when there is no danger and use the Rover to clean the panels.'}
            </p>

            <div className="mt-5 grid grid-cols-3 gap-3 text-xs">
              <div className="rounded-xl border border-[#462A72] bg-[#190B2E] p-3">
                <div className="text-purple-200/80">Final Energy</div>
                <div className="mt-1 font-mono-tabular text-xl font-bold text-amber-300">
                  {Math.round(energy)}%
                </div>
              </div>
              <div className="rounded-xl border border-[#462A72] bg-[#190B2E] p-3">
                <div className="text-purple-200/80">Blocks</div>
                <div className="mt-1 font-mono-tabular text-xl font-bold text-emerald-300">
                  {blockedCount}
                </div>
              </div>
              <div className="rounded-xl border border-[#462A72] bg-[#190B2E] p-3">
                <div className="text-purple-200/80">Score</div>
                <div className="mt-1 font-mono-tabular text-xl font-bold text-sky-300 flex items-center justify-center gap-1">
                  <Trophy className="h-4 w-4 text-amber-300" />
                  {score}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={startDefense}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#543487] bg-[#2D174D] px-4 text-xs font-bold text-white hover:border-amber-300"
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
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#543487] bg-[#2D174D] px-4 text-xs font-bold text-white hover:border-sky-300"
              >
                <span>Map</span>
              </button>

              {missionPassed && (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setRoute('MISSION_3');
                  }}
                  className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-white border-b-4 bg-gradient-to-b from-[#FDE047] to-[#EAB308] px-6 text-xs font-bold text-slate-950 shadow-lg hover:scale-105 transition-transform"
                >
                  <span>Mission 3</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Mid-Wave Crisis Modal */}
      {crisisModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-3xl border-2 border-amber-300 bg-[#22103D] p-6 shadow-2xl text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/20 text-amber-300">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h2 className="mt-3 font-display text-xl font-bold text-white">
              {isMoon ? 'Peak Radiation Spike!' : 'Giant Dust Gust!'}
            </h2>
            <p className="mt-1 text-xs text-purple-200">
              Quickly choose the base strategy:
            </p>

            <div className="mt-5 grid gap-3">
              <button
                type="button"
                onClick={() => handleCrisisChoice('all-shield')}
                className="rounded-2xl border-2 border-sky-400 bg-sky-500/20 p-3.5 text-left hover:bg-sky-500/30 transition-colors"
              >
                <div className="text-sm font-bold text-white">Shield Everything</div>
                <div className="text-xs text-sky-200">-15% Energy · Protects every module!</div>
              </button>

              <button
                type="button"
                onClick={() => handleCrisisChoice('save-power')}
                className="rounded-2xl border-2 border-amber-400 bg-amber-500/20 p-3.5 text-left hover:bg-amber-500/30 transition-colors"
              >
                <div className="text-sm font-bold text-white">Save Energy for the End</div>
                <div className="text-xs text-amber-200">+20% Energy · Sensors will get damaged!</div>
              </button>
            </div>
          </div>
        </div>
      )}

      <DiscoveryCodexModal open={codexOpen} onClose={() => setCodexOpen(false)} />
    </div>
  );
};
