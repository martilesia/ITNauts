import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Award,
  BatteryCharging,
  CheckCircle2,
  Compass,
  Flag,
  Gem,
  MapPin,
  Play,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Sun,
  TriangleAlert,
  Trophy,
  XCircle,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { soundEngine } from '../../utils/soundEngine';
import { AstroCompanion } from '../engine/AstroCompanion';
import { CommanderSprite } from '../engine/CommanderSprite';
import { DiscoveryCodexModal } from '../engine/DiscoveryCodexModal';
import { GameHUD } from '../engine/GameHUD';
import { RoverCartoonSvg } from './mission3/RoverCartoonSvg';
import { TerrainMapBoard } from './mission3/TerrainMapBoard';
import {
  BASE_CANDIDATES,
  BaseCandidate,
  GRID_COLS,
  GRID_ROWS,
  GridCoord,
  SAMPLES_DATA,
  SOLAR_RECHARGE_COORD,
  START_COORD,
  SampleInfo,
  TerrainTile,
  ZONE_BATTERY_COST,
  ZONE_META,
  buildTerrainGrid,
} from './mission3/terrainData';

type MissionStep = 'BRIEFING' | 'EXPLORING' | 'SELECT_BASE' | 'RESULTS';

type ActiveModal =
  | { kind: 'rocky'; challengeId: string; prevCoord: GridCoord; targetCoord: GridCoord }
  | { kind: 'steep'; challengeId: string; prevCoord: GridCoord; targetCoord: GridCoord }
  | { kind: 'sample'; sample: SampleInfo }
  | { kind: 'low_battery' }
  | { kind: 'base_prompt'; candidateId: 'A' | 'B' | 'C' }
  | null;

interface FeedbackBanner {
  text: string;
  tone: 'positive' | 'negative' | 'info';
}

export const Mission3TerrainExplorer: React.FC = () => {
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
  const grid = useMemo(() => buildTerrainGrid(), []);

  // Core Game State Machine
  const [step, setStep] = useState<MissionStep>('BRIEFING');
  const [roverCoord, setRoverCoord] = useState<GridCoord>(START_COORD);
  const [roverFacing, setRoverFacing] = useState<'right' | 'left' | 'up' | 'down'>('right');
  const [roverMoving, setRoverMoving] = useState(false);
  const [roverDamaged, setRoverDamaged] = useState(false);

  // Resource & Score State
  const [battery, setBattery] = useState(100);
  const [score, setScore] = useState(0);
  const [visitedKeys, setVisitedKeys] = useState<Set<string>>(
    () => new Set([`${START_COORD.col},${START_COORD.row}`])
  );
  const [collectedSampleIds, setCollectedSampleIds] = useState<Set<string>>(() => new Set());
  const [resolvedChallengeIds, setResolvedChallengeIds] = useState<Set<string>>(() => new Set());
  const [solarUsed, setSolarUsed] = useState(false);
  const [lowBatteryWarned, setLowBatteryWarned] = useState(false);

  // Selection & Results State
  const [selectedBaseId, setSelectedBaseId] = useState<'A' | 'B' | 'C'>('A');
  const [chosenBase, setChosenBase] = useState<BaseCandidate | null>(null);
  const [failureReason, setFailureReason] = useState<'battery' | 'unsuitable_site' | null>(null);

  // UI & Modal State
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [feedback, setFeedback] = useState<FeedbackBanner | null>(null);
  const [codexOpen, setCodexOpen] = useState(false);

  const showFeedback = useCallback((text: string, tone: FeedbackBanner['tone']) => {
    setFeedback({ text, tone });
  }, []);

  const resetMission = useCallback(
    (startImmediately = false) => {
      soundEngine.playClick();
      setRoverCoord(START_COORD);
      setRoverFacing('right');
      setRoverMoving(false);
      setRoverDamaged(false);
      setBattery(100);
      setScore(0);
      setVisitedKeys(new Set([`${START_COORD.col},${START_COORD.row}`]));
      setCollectedSampleIds(new Set());
      setResolvedChallengeIds(new Set());
      setSolarUsed(false);
      setLowBatteryWarned(false);
      setSelectedBaseId('A');
      setChosenBase(null);
      setFailureReason(null);
      setActiveModal(null);
      setFeedback(null);
      setStep(startImmediately ? 'EXPLORING' : 'BRIEFING');
      if (startImmediately) {
        sayAstro(
          'Mission restarted! Use the arrow keys or tap the map to drive the rover across green zones and save battery.',
          'happy',
          6000
        );
      }
    },
    [sayAstro]
  );

  // Trigger battery failure if battery hits 0
  const applyBatteryChange = useCallback(
    (delta: number) => {
      setBattery((prev) => {
        const next = Math.max(0, Math.min(100, prev + delta));
        if (next <= 0) {
          soundEngine.playGentleError();
          setFailureReason('battery');
          setChosenBase(null);
          setActiveModal(null);
          setStep('RESULTS');
          sayAstro(
            'Oh no, the rover battery ran out! Next time, avoid orange slopes and rocks.',
            'alert',
            6000
          );
        } else if (next <= 25 && !lowBatteryWarned) {
          setLowBatteryWarned(true);
          soundEngine.playGentleError();
          setActiveModal({ kind: 'low_battery' });
          sayAstro(
            'Warning: low battery! Look for the yellow Solar Point or stay on flat green terrain.',
            'alert',
            6000
          );
        }
        return next;
      });
    },
    [lowBatteryWarned, sayAstro]
  );

  // Attempt moving 1 grid step
  const moveRover = useCallback(
    (dCol: number, dRow: number) => {
      if (step !== 'EXPLORING' || activeModal !== null || codexOpen) return;

      if (dCol > 0) setRoverFacing('right');
      else if (dCol < 0) setRoverFacing('left');
      else if (dRow < 0) setRoverFacing('up');
      else if (dRow > 0) setRoverFacing('down');

      const nextCol = roverCoord.col + dCol;
      const nextRow = roverCoord.row + dRow;

      if (nextCol < 0 || nextCol >= GRID_COLS || nextRow < 0 || nextRow >= GRID_ROWS) {
        soundEngine.playGentleError();
        showFeedback('Map boundary reached!', 'info');
        return;
      }

      const targetTile = grid[nextRow][nextCol];

      // Impassable brown mountain tile
      if (targetTile.zone === 'mountain') {
        soundEngine.playGentleError();
        showFeedback('Mountain too steep! The rover cannot climb here.', 'negative');
        sayAstro('This brown mountain is too steep! Go around via a lower path.', 'encourage', 4500);
        return;
      }

      const prevCoord = roverCoord;
      const targetCoord: GridCoord = { col: nextCol, row: nextRow };

      // Check Challenge A — Rocky terrain
      if (
        targetTile.feature === 'rocky' &&
        targetTile.challengeId &&
        !resolvedChallengeIds.has(targetTile.challengeId)
      ) {
        soundEngine.playClick();
        setActiveModal({
          kind: 'rocky',
          challengeId: targetTile.challengeId,
          prevCoord,
          targetCoord,
        });
        return;
      }

      // Check Challenge B — Steep slope
      if (
        targetTile.feature === 'steep_challenge' &&
        targetTile.challengeId &&
        !resolvedChallengeIds.has(targetTile.challengeId)
      ) {
        soundEngine.playClick();
        setActiveModal({
          kind: 'steep',
          challengeId: targetTile.challengeId,
          prevCoord,
          targetCoord,
        });
        return;
      }

      // Normal movement
      soundEngine.playStep();
      setRoverMoving(true);
      window.setTimeout(() => setRoverMoving(false), 160);
      setRoverCoord(targetCoord);

      const tileKey = `${nextCol},${nextRow}`;
      const isNewTile = !visitedKeys.has(tileKey);
      if (isNewTile) {
        setVisitedKeys((prev) => new Set(prev).add(tileKey));
        setScore((s) => s + 5);
      }

      // Battery cost by terrain zone
      const cost = ZONE_BATTERY_COST[targetTile.zone];
      if (targetTile.zone === 'slope') {
        showFeedback(`Orange slope: -${cost}% battery!`, 'negative');
      } else if (isNewTile) {
        showFeedback(`${ZONE_META[targetTile.zone].label}: -${cost}% battery · +5 pts`, 'info');
      }

      // Solar recharge tile
      if (
        nextCol === SOLAR_RECHARGE_COORD.col &&
        nextRow === SOLAR_RECHARGE_COORD.row &&
        !solarUsed
      ) {
        setSolarUsed(true);
        soundEngine.playPickup();
        setScore((s) => s + 25);
        applyBatteryChange(25 - cost);
        showFeedback('Solar Point! +25% battery and +25 pts!', 'positive');
        sayAstro('Nice! You recharged +25% of the rover battery using solar power!', 'happy', 4500);
      } else {
        applyBatteryChange(-cost);
      }

      // Sample tile
      if (
        targetTile.feature === 'sample' &&
        targetTile.sampleId &&
        !collectedSampleIds.has(targetTile.sampleId)
      ) {
        const sample = SAMPLES_DATA.find((s) => s.id === targetTile.sampleId);
        if (sample) {
          soundEngine.playPickup();
          setActiveModal({ kind: 'sample', sample });
          return;
        }
      }

      // Base candidate marker arrival
      if (
        targetTile.feature === 'base_a' ||
        targetTile.feature === 'base_b' ||
        targetTile.feature === 'base_c'
      ) {
        const candidateId =
          targetTile.feature === 'base_a' ? 'A' : targetTile.feature === 'base_b' ? 'B' : 'C';
        soundEngine.playSuccess();
        setSelectedBaseId(candidateId);
        setActiveModal({ kind: 'base_prompt', candidateId });
      }
    },
    [
      activeModal,
      applyBatteryChange,
      codexOpen,
      collectedSampleIds,
      grid,
      resolvedChallengeIds,
      roverCoord,
      sayAstro,
      showFeedback,
      solarUsed,
      step,
      visitedKeys,
    ]
  );

  // Keyboard Arrow & WASD Controls
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (step !== 'EXPLORING' || activeModal !== null || codexOpen) return;
      const key = e.key.toLowerCase();
      if (key === 'arrowup' || key === 'w') {
        e.preventDefault();
        moveRover(0, -1);
      } else if (key === 'arrowdown' || key === 's') {
        e.preventDefault();
        moveRover(0, 1);
      } else if (key === 'arrowleft' || key === 'a') {
        e.preventDefault();
        moveRover(-1, 0);
      } else if (key === 'arrowright' || key === 'd') {
        e.preventDefault();
        moveRover(1, 0);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeModal, codexOpen, moveRover, step]);

  const handleTileClick = useCallback(
    (tile: TerrainTile) => {
      const dCol = tile.col - roverCoord.col;
      const dRow = tile.row - roverCoord.row;
      if (Math.abs(dCol) + Math.abs(dRow) === 1) {
        moveRover(dCol, dRow);
      }
    },
    [moveRover, roverCoord.col, roverCoord.row]
  );

  // Challenge A handlers
  const handleRockyChoice = (choice: 'detour' | 'cross' | 'analyze') => {
    if (!activeModal || activeModal.kind !== 'rocky') return;
    const { challengeId, targetCoord } = activeModal;

    if (choice === 'detour') {
      soundEngine.playSuccess();
      setScore((s) => s + 20);
      setActiveModal(null);
      showFeedback('Great choice! You went around the rocks without damaging the rover (+20 pts).', 'positive');
      sayAstro('Smart decision! Avoiding big boulders protects the rover wheels.', 'happy', 4500);
    } else if (choice === 'analyze') {
      soundEngine.playPickup();
      setResolvedChallengeIds((prev) => new Set(prev).add(challengeId));
      setVisitedKeys((prev) => new Set(prev).add(`${targetCoord.col},${targetCoord.row}`));
      setRoverCoord(targetCoord);
      setScore((s) => s + 30);
      setActiveModal(null);
      applyBatteryChange(-3);
      recordBehavioralEvent('explore', 'm3-rock-analyze');
      showFeedback('Terrain scanned! You found a safe passage (+30 pts).', 'positive');
      sayAstro('The scanner found a path between the rocks! Analyzing first pays off.', 'happy', 5000);
    } else {
      soundEngine.playGentleError();
      setResolvedChallengeIds((prev) => new Set(prev).add(challengeId));
      setVisitedKeys((prev) => new Set(prev).add(`${targetCoord.col},${targetCoord.row}`));
      setRoverCoord(targetCoord);
      setRoverDamaged(true);
      setScore((s) => Math.max(0, s - 15));
      setActiveModal(null);
      applyBatteryChange(-12);
      showFeedback('Rock impact! -12% battery and -15 pts!', 'negative');
      sayAstro('Ouch! Driving over rocks shook the rover and drained lots of battery!', 'alert', 5000);
    }
  };

  // Challenge B handlers
  const handleSteepChoice = (choice: 'detour' | 'climb') => {
    if (!activeModal || activeModal.kind !== 'steep') return;
    const { challengeId, targetCoord } = activeModal;

    if (choice === 'detour') {
      soundEngine.playSuccess();
      setScore((s) => s + 25);
      setActiveModal(null);
      showFeedback('Safe route! You saved rover battery (+25 pts).', 'positive');
      sayAstro('Smart decision! Looking for flatter ground saves energy.', 'happy', 4500);
    } else {
      soundEngine.playGentleError();
      setResolvedChallengeIds((prev) => new Set(prev).add(challengeId));
      setVisitedKeys((prev) => new Set(prev).add(`${targetCoord.col},${targetCoord.row}`));
      setRoverCoord(targetCoord);
      setScore((s) => Math.max(0, s - 10));
      setActiveModal(null);
      applyBatteryChange(-15);
      recordDecision({ m3SteepSlopeAttempts: (save.campaignMemory?.m3SteepSlopeAttempts ?? 0) + 1 });
      showFeedback('Very tough climb! -15% battery and -10 pts!', 'negative');
      sayAstro('Whew! Climbing steep slopes drains huge battery and is dangerous for a base.', 'alert', 5000);
    }
  };

  // Challenge C handler
  const handleCollectSample = () => {
    if (!activeModal || activeModal.kind !== 'sample') return;
    const { sample } = activeModal;
    soundEngine.playSuccess();
    setCollectedSampleIds((prev) => new Set(prev).add(sample.id));
    setScore((s) => s + sample.points);
    setActiveModal(null);
    recordBehavioralEvent('explore', `m3-${sample.id}`);
    showFeedback(`Sample "${sample.name}" collected! +${sample.points} pts`, 'positive');
    sayAstro(sample.clue, 'happy', 5500);
  };

  // Finalize Base Selection
  const handleConfirmBaseLocation = () => {
    const candidate = BASE_CANDIDATES.find((b) => b.id === selectedBaseId);
    if (!candidate) return;

    const finalScore = score + candidate.bonusScore + Math.round(battery * 0.5);
    setScore(finalScore);
    setChosenBase(candidate);

    if (candidate.suitable === 'ideal') {
      soundEngine.playSuccess();
      setFailureReason(null);
      recordDecision({
        m3RoverBatteryRemaining: battery,
        m3RelocatedUnstableModule: true,
      });
      recordBehavioralEvent('explore', 'm3-terrain-complete');
      unlockDiscovery('disc-mola-terrain');
      completeMission('mission-3', 'badge-space-architect', {
        id: 'item-modular-kit',
        name: 'Modular Construction Kit',
        category: 'module',
        color: '#34D399',
        acquiredIn: 'mission-3',
      });
      sayAstro(
        'Fantastic! The Green Plain is the best spot to build a stable base!',
        'happy',
        6000
      );
    } else {
      soundEngine.playGentleError();
      setFailureReason('unsuitable_site');
      sayAstro(
        candidate.id === 'B'
          ? 'Careful: this sloped terrain could make the base unstable! Try picking the flat site.'
          : 'Oh no! This hill is too steep to build a safe base!',
        'alert',
        6000
      );
    }

    setStep('RESULTS');
  };

  const progressPct = Math.min(
    100,
    Math.round(((visitedKeys.size / 14) * 50) + ((collectedSampleIds.size / SAMPLES_DATA.length) * 50))
  );
  const canOpenBaseSelection =
    roverCoord.col >= 7 ||
    collectedSampleIds.size >= 2 ||
    BASE_CANDIDATES.some((b) => b.coord.col === roverCoord.col && b.coord.row === roverCoord.row);

  const currentTile = grid[roverCoord.row][roverCoord.col];
  const currentZoneMeta = ZONE_META[currentTile.zone];

  const missionSucceeded = chosenBase?.suitable === 'ideal' && failureReason === null;

  return (
    <div className="flex min-h-screen flex-col bg-[#1B0D2E] text-slate-100 select-none">
      <GameHUD
        missionTitle="Mission 03 · Terrain Explorer"
        goalText={
          step === 'BRIEFING'
            ? 'Prepare the expedition to choose the best base site.'
            : step === 'EXPLORING'
              ? 'Drive the rover, collect samples, and reach sites A, B, or C.'
              : step === 'SELECT_BASE'
                ? 'Compare the 3 sites and choose where to build the base.'
                : 'Exploration mission results.'
        }
        progressText={
          step === 'EXPLORING'
            ? `Samples ${collectedSampleIds.size}/${SAMPLES_DATA.length}`
            : undefined
        }
        onBackToMap={() => setRoute('CAMPAIGN_MAP')}
        onOpenCodex={() => setCodexOpen(true)}
        onRepeatHint={() => {
          sayAstro(
            'Tip: Move the rover across green tiles to save battery, collect the glowing samples, and choose the flattest ground for the base!',
            'curious',
            7000
          );
        }}
      />

      {/* SCREEN 1: MISSION BRIEFING */}
      {step === 'BRIEFING' && (
        <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-4 py-8">
          <div className="w-full rounded-3xl border-2 border-[#543487] bg-gradient-to-b from-[#281447] to-[#1A0B30] p-6 shadow-2xl sm:p-8">
            <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
              <div className="flex items-end gap-4 shrink-0">
                <CommanderSprite profile={save.commander} size={96} />
                <RoverCartoonSvg size={94} facing="right" />
              </div>

              <div className="flex-1 text-center md:text-left">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  AstroBase · Mission 03 {isMoon ? '· Moon' : '· Mars'}
                </p>
                <h1 className="mt-1 font-display text-3xl font-bold text-white sm:text-4xl">
                  Terrain Explorer
                </h1>
                <p className="mt-3 text-base leading-relaxed text-purple-100">
                  "Welcome, Junior Astronaut! Our team needs to build a new space base. Explore the terrain, control the rover, collect samples, and find the best spot for our base!"
                </p>
              </div>
            </div>

            {/* Visual Objectives */}
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-2xl border border-[#462A72] bg-[#190B2E] p-3.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/20 text-amber-300 shrink-0">
                  <Compass className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-sm font-bold text-white">1. Drive the Rover</div>
                  <div className="text-xs text-purple-200/80">Save battery and avoid obstacles</div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-[#462A72] bg-[#190B2E] p-3.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-400/20 text-sky-300 shrink-0">
                  <Gem className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-sm font-bold text-white">2. Collect Samples</div>
                  <div className="text-xs text-purple-200/80">Discover clues about the ground</div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-[#462A72] bg-[#190B2E] p-3.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/20 text-emerald-300 shrink-0">
                  <Flag className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-sm font-bold text-white">3. Choose the Base</div>
                  <div className="text-xs text-purple-200/80">Compare slope and access</div>
                </div>
              </div>
            </div>

            {/* Scientific Distinction Note */}
            <div className="mt-5 rounded-xl border border-sky-400/35 bg-sky-500/10 px-4 py-2.5 text-xs text-sky-100">
              <strong>Training note:</strong> This map uses illustrative values inspired by <strong>Earth SRTM</strong> elevation data. A real mission uses <strong>LOLA</strong> on the Moon and <strong>MOLA</strong> on Mars!
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <AstroCompanion
                mood="curious"
                size={58}
                caption="Ready to drive the rover, Commander?"
                showCaptions={save.settings.captionsEnabled}
              />

              <button
                type="button"
                onClick={() => {
                  soundEngine.playSuccess();
                  setStep('EXPLORING');
                  sayAstro(
                    'Let us go! Use the arrow keys, WASD, or on-screen buttons to drive the rover to sites A, B, or C!',
                    'happy',
                    6500
                  );
                }}
                className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-white border-b-4 bg-gradient-to-b from-[#FDE047] to-[#EAB308] px-7 text-base font-bold text-slate-950 shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                <Play className="h-5 w-5" />
                <span>Start Mission</span>
              </button>
            </div>
          </div>
        </main>
      )}

      {/* SCREEN 2: TERRAIN EXPLORATION & ROVER CONTROL */}
      {step === 'EXPLORING' && (
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-3 px-4 py-4">
          {/* Simple Game Dashboard */}
          <section
            aria-label="Rover Dashboard"
            className="grid grid-cols-2 gap-2.5 rounded-2xl border-2 border-[#462A72] bg-[#21103A] p-3 sm:grid-cols-5 sm:items-center"
          >
            {/* Battery */}
            <div className="flex flex-col gap-1 rounded-xl border border-[#462A72] bg-[#160A29] px-3 py-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-purple-100">
                  <BatteryCharging
                    className={`h-4 w-4 ${
                      battery <= 25 ? 'text-rose-400' : battery <= 50 ? 'text-amber-300' : 'text-emerald-400'
                    }`}
                  />
                  Battery
                </span>
                <span
                  className={`font-mono-tabular font-bold ${
                    battery <= 25 ? 'text-rose-300' : 'text-white'
                  }`}
                >
                  {battery}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full transition-all duration-200 ${
                    battery <= 25 ? 'bg-rose-500' : battery <= 50 ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${battery}%` }}
                />
              </div>
            </div>

            {/* Samples */}
            <div className="flex items-center justify-between rounded-xl border border-[#462A72] bg-[#160A29] px-3 py-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-purple-100">
                <Gem className="h-4 w-4 text-sky-400" />
                Samples
              </span>
              <span className="font-mono-tabular text-sm font-bold text-white">
                {collectedSampleIds.size}/{SAMPLES_DATA.length}
              </span>
            </div>

            {/* Mission Progress */}
            <div className="flex items-center justify-between rounded-xl border border-[#462A72] bg-[#160A29] px-3 py-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-purple-100">
                <Compass className="h-4 w-4 text-amber-300" />
                Progress
              </span>
              <span className="font-mono-tabular text-sm font-bold text-white">{progressPct}%</span>
            </div>

            {/* Exploration Score */}
            <div className="flex items-center justify-between rounded-xl border border-[#462A72] bg-[#160A29] px-3 py-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-purple-100">
                <Trophy className="h-4 w-4 text-amber-300" />
                Points
              </span>
              <span className="font-mono-tabular text-sm font-bold text-amber-300">{score}</span>
            </div>

            {/* Base Selection Trigger */}
            <button
              type="button"
              onClick={() => {
                if (!canOpenBaseSelection) {
                  soundEngine.playGentleError();
                  showFeedback('Explore a bit closer to sites A, B, or C on the right!', 'info');
                  return;
                }
                soundEngine.playSuccess();
                setStep('SELECT_BASE');
              }}
              className={`col-span-2 flex h-11 items-center justify-center gap-2 rounded-xl border-2 px-3 text-xs font-bold transition-transform sm:col-span-1 whitespace-nowrap ${
                canOpenBaseSelection
                  ? 'border-white bg-gradient-to-b from-[#34D399] to-[#059669] text-slate-950 shadow-md hover:scale-[1.03]'
                  : 'border-[#543487] bg-[#2D174D] text-purple-200/80'
              }`}
            >
              <Flag className="h-4 w-4 shrink-0" />
              <span>{canOpenBaseSelection ? 'Choose Base!' : 'Head to A/B/C'}</span>
            </button>
          </section>

          {/* Immediate Visual Feedback + Current Zone Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#462A72] bg-[#190B2E] px-3.5 py-2 text-xs">
            <div className="flex items-center gap-2">
              <span
                className="h-3.5 w-3.5 rounded border"
                style={{ backgroundColor: currentZoneMeta.bg, borderColor: currentZoneMeta.border }}
              />
              <span className="font-semibold text-white">
                Current zone: {currentZoneMeta.label} ({currentTile.elevationM} m)
              </span>
              <span className="text-purple-200/75 hidden sm:inline">
                · Illustrative SRTM terrain (Earth)
              </span>
            </div>

            {feedback && (
              <div
                className={`font-bold ${
                  feedback.tone === 'positive'
                    ? 'text-emerald-300'
                    : feedback.tone === 'negative'
                      ? 'text-rose-300'
                      : 'text-sky-200'
                }`}
              >
                {feedback.text}
              </div>
            )}
          </div>

          {/* 2D Interactive Topographic Map */}
          <TerrainMapBoard
            grid={grid}
            roverCoord={roverCoord}
            roverFacing={roverFacing}
            roverMoving={roverMoving}
            roverDamaged={roverDamaged}
            visitedKeys={visitedKeys}
            collectedSampleIds={collectedSampleIds}
            resolvedChallengeIds={resolvedChallengeIds}
            solarUsed={solarUsed}
            onMoveDir={moveRover}
            onTileClick={handleTileClick}
          />

          {/* Compact ASTRO Companion Bar */}
          {save.settings.captionsEnabled && astroDialogue?.text && (
            <div className="flex items-center gap-3 rounded-2xl border border-sky-400/40 bg-[#21103A] px-4 py-2.5">
              <AstroCompanion mood={astroDialogue.mood} size={46} showCaptions={false} />
              <p className="text-xs font-medium leading-snug text-purple-100 sm:text-sm">
                {astroDialogue.text}
              </p>
            </div>
          )}
        </main>
      )}

      {/* SCREEN 3: BASE LOCATION SELECTION */}
      {step === 'SELECT_BASE' && (
        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-5 px-4 py-6">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Final Mission Decision
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">
              Where Should We Build the Space Base?
            </h1>
            <p className="mt-1 text-sm text-purple-200/85">
              Check the slope and ease of access before choosing!
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {BASE_CANDIDATES.map((site) => {
              const isSelected = selectedBaseId === site.id;
              return (
                <button
                  key={site.id}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setSelectedBaseId(site.id);
                  }}
                  className={`flex flex-col justify-between rounded-2xl border-2 p-5 text-left transition-all ${
                    isSelected
                      ? 'border-amber-300 bg-[#2D1852] shadow-xl scale-[1.01]'
                      : 'border-[#462A72] bg-[#21103A] hover:border-sky-400/70'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-extrabold text-white ${
                          site.id === 'A'
                            ? 'bg-emerald-600'
                            : site.id === 'B'
                              ? 'bg-amber-600'
                              : 'bg-rose-600'
                        }`}
                      >
                        {site.id}
                      </span>
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-300">
                          <CheckCircle2 className="h-4 w-4" />
                          Selected
                        </span>
                      )}
                    </div>

                    <h2 className="mt-3 font-display text-lg font-bold text-white">{site.name}</h2>
                    <p className="mt-0.5 text-xs text-purple-200/85">{site.subtitle}</p>

                    {/* Visual Slope Mini-Profile SVG */}
                    <div className="my-4 rounded-xl border border-[#462A72] bg-[#160A29] p-3">
                      <svg viewBox="0 0 180 56" className="h-14 w-full" aria-hidden="true">
                        {site.id === 'A' && (
                          <>
                            <path d="M 8 44 Q 90 42 172 44 L 172 54 L 8 54 Z" fill="#22C55E" />
                            <rect x="68" y="25" width="44" height="17" rx="4" fill="#E2E8F0" stroke="#0F172A" strokeWidth="2" />
                            <rect x="76" y="18" width="28" height="8" rx="3" fill="#38BDF8" stroke="#0F172A" strokeWidth="1.5" />
                          </>
                        )}
                        {site.id === 'B' && (
                          <>
                            <path d="M 8 48 L 172 28 L 172 54 L 8 54 Z" fill="#FACC15" />
                            <g transform="rotate(-7 90 38)">
                              <rect x="68" y="20" width="44" height="17" rx="4" fill="#E2E8F0" stroke="#0F172A" strokeWidth="2" />
                              <rect x="76" y="13" width="28" height="8" rx="3" fill="#38BDF8" stroke="#0F172A" strokeWidth="1.5" />
                            </g>
                          </>
                        )}
                        {site.id === 'C' && (
                          <>
                            <path d="M 8 50 L 95 36 L 172 10 L 172 54 L 8 54 Z" fill="#FB923C" />
                            <g transform="rotate(-22 92 35)">
                              <rect x="70" y="16" width="44" height="17" rx="4" fill="#FCA5A5" stroke="#0F172A" strokeWidth="2" />
                              <rect x="78" y="9" width="28" height="8" rx="3" fill="#F97316" stroke="#0F172A" strokeWidth="1.5" />
                            </g>
                          </>
                        )}
                      </svg>
                    </div>

                    <dl className="space-y-2 text-xs">
                      <div className="flex justify-between gap-2">
                        <dt className="text-purple-200/80">Slope:</dt>
                        <dd className="font-bold text-white">{site.slopeLabel}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-purple-200/80">Height variation:</dt>
                        <dd className="font-bold text-white">{site.elevationVar}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-purple-200/80">Rover access:</dt>
                        <dd className="font-bold text-white">{site.accessibility}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-purple-200/80">Distance from start:</dt>
                        <dd className="font-bold text-white">{site.distanceLabel}</dd>
                      </div>
                    </dl>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-xl border border-sky-400/35 bg-sky-500/10 px-4 py-2.5 text-center text-xs text-sky-100">
            <strong>Remember:</strong> Flat terrain helps a lot, but a real space base also needs soil, temperature, and radiation analysis — elevation alone is not enough!
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setStep('EXPLORING');
              }}
              className="h-11 rounded-full border-2 border-[#543487] bg-[#2D174D] px-5 text-sm font-semibold text-purple-100 hover:border-sky-300"
            >
              Back to Map
            </button>
            <button
              type="button"
              onClick={handleConfirmBaseLocation}
              className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-white border-b-4 bg-gradient-to-b from-[#FDE047] to-[#EAB308] px-7 text-sm font-bold text-slate-950 shadow-lg hover:scale-105 transition-transform"
            >
              <MapPin className="h-4 w-4" />
              <span>Build Base at Site {selectedBaseId}</span>
            </button>
          </div>
        </main>
      )}

      {/* SCREEN 4: MISSION RESULTS */}
      {step === 'RESULTS' && (
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-8">
          <div
            className={`w-full rounded-3xl border-2 p-6 text-center shadow-2xl sm:p-8 ${
              missionSucceeded
                ? 'border-emerald-400/80 bg-gradient-to-b from-[#29174A] to-[#170A2B]'
                : 'border-rose-400/80 bg-gradient-to-b from-[#331336] to-[#1A0A26]'
            }`}
          >
            <div className="flex items-end justify-center gap-5">
              <CommanderSprite profile={save.commander} size={88} isCelebrating={missionSucceeded} />
              <AstroCompanion
                mood={missionSucceeded ? 'happy' : 'alert'}
                size={68}
                showCaptions={false}
              />
            </div>

            <div className="mt-4 flex items-center justify-center gap-2">
              {missionSucceeded ? (
                <CheckCircle2 className="h-7 w-7 text-emerald-400" />
              ) : (
                <XCircle className="h-7 w-7 text-rose-400" />
              )}
              <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
                {failureReason === 'battery'
                  ? 'Mission Failed · Battery Depleted!'
                  : missionSucceeded
                    ? 'Mission Completed Successfully!'
                    : `Mission Failed · ${chosenBase?.feedbackTitle ?? 'Unsuitable Terrain'}`}
              </h1>
            </div>

            <p className="mt-2 text-sm leading-relaxed text-purple-100">
              {failureReason === 'battery'
                ? 'The rover ran out of energy before finishing the expedition. On your next attempt, avoid orange and rocky zones and use the Solar Point!'
                : chosenBase?.feedbackText}
            </p>

            {/* Results Summary Grid */}
            <div className="mt-5 grid grid-cols-2 gap-3 text-left sm:grid-cols-4">
              <div className="rounded-xl border border-[#462A72] bg-[#160A29] p-3">
                <div className="text-[11px] text-purple-200/80">Final Score</div>
                <div className="mt-0.5 font-mono-tabular text-xl font-bold text-amber-300">{score}</div>
              </div>
              <div className="rounded-xl border border-[#462A72] bg-[#160A29] p-3">
                <div className="text-[11px] text-purple-200/80">Remaining Battery</div>
                <div className="mt-0.5 font-mono-tabular text-xl font-bold text-emerald-300">{battery}%</div>
              </div>
              <div className="rounded-xl border border-[#462A72] bg-[#160A29] p-3">
                <div className="text-[11px] text-purple-200/80">Samples</div>
                <div className="mt-0.5 font-mono-tabular text-xl font-bold text-sky-300">
                  {collectedSampleIds.size}/{SAMPLES_DATA.length}
                </div>
              </div>
              <div className="rounded-xl border border-[#462A72] bg-[#160A29] p-3">
                <div className="text-[11px] text-purple-200/80">Chosen Site</div>
                <div className="mt-0.5 text-sm font-bold text-white">
                  {chosenBase ? `Site ${chosenBase.id}` : 'None'}
                </div>
              </div>
            </div>

            {/* Terrain Analysis Result */}
            <div className="mt-4 rounded-xl border border-[#462A72] bg-[#190B2E] p-3.5 text-left text-xs text-purple-100">
              <div className="font-bold text-amber-300">Terrain Analysis:</div>
              <p className="mt-1 leading-relaxed">
                {chosenBase
                  ? `${chosenBase.name} · Slope ${chosenBase.slopeLabel} · Access ${chosenBase.accessibility}.`
                  : 'The rover needed to reach a flat zone with enough battery left.'}{' '}
                Green flat terrain makes construction easier, while slopes and rocks consume more energy and bring tilt risk. (Illustrative SRTM data — real missions combine multiple sensors beyond elevation!)
              </p>
            </div>

            {missionSucceeded && (
              <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-amber-400/50 bg-amber-400/15 px-4 py-2.5 text-xs font-bold text-amber-200">
                <Award className="h-4 w-4 text-amber-300" />
                <span>Badge Earned: Space Architect</span>
              </div>
            )}

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => resetMission(true)}
                className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-[#543487] bg-[#2D174D] px-5 text-sm font-semibold text-white hover:border-amber-300"
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
                className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-[#543487] bg-[#2D174D] px-5 text-sm font-semibold text-purple-100 hover:border-sky-300"
              >
                <span>Back to AstroBase</span>
              </button>

              {missionSucceeded && (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playSuccess();
                    setRoute('MISSION_4');
                  }}
                  className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-white border-b-4 bg-gradient-to-b from-[#FDE047] to-[#EAB308] px-6 text-sm font-bold text-slate-950 shadow-lg hover:scale-105 transition-transform"
                >
                  <span>Mission 4</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </main>
      )}

      {/* INTERACTIVE CHALLENGE MODALS */}
      {activeModal?.kind === 'rocky' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl border-2 border-amber-300/80 bg-[#22103D] p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/20 text-amber-300">
                <ShieldAlert className="h-6 w-6" />
              </span>
              <div>
                <div className="text-xs font-bold uppercase text-amber-300">Challenge · Rocky Terrain</div>
                <h2 className="font-display text-xl font-bold text-white">Rocks Ahead!</h2>
              </div>
            </div>
            <p className="mt-3 text-sm text-purple-100">
              The rover found an area full of big rocks. What do you decide to do?
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => handleRockyChoice('analyze')}
                className="flex items-center justify-between rounded-xl border-2 border-sky-400/70 bg-sky-500/20 px-4 py-3 text-left text-sm font-bold text-white hover:bg-sky-500/30"
              >
                <span>Stop and scan the terrain</span>
                <span className="text-xs text-sky-200">+30 pts · -3% bat</span>
              </button>
              <button
                type="button"
                onClick={() => handleRockyChoice('detour')}
                className="flex items-center justify-between rounded-xl border-2 border-emerald-400/70 bg-emerald-500/20 px-4 py-3 text-left text-sm font-bold text-white hover:bg-emerald-500/30"
              >
                <span>Look for another path</span>
                <span className="text-xs text-emerald-200">+20 pts · Safe</span>
              </button>
              <button
                type="button"
                onClick={() => handleRockyChoice('cross')}
                className="flex items-center justify-between rounded-xl border-2 border-rose-400/70 bg-rose-500/20 px-4 py-3 text-left text-sm font-bold text-white hover:bg-rose-500/30"
              >
                <span>Try to drive over the rocks</span>
                <span className="text-xs text-rose-200">Risky!</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal?.kind === 'steep' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl border-2 border-orange-400/80 bg-[#22103D] p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-400/20 text-orange-300">
                <TriangleAlert className="h-6 w-6" />
              </span>
              <div>
                <div className="text-xs font-bold uppercase text-orange-300">Challenge · Steep Slope</div>
                <h2 className="font-display text-xl font-bold text-white">Very Steep Climb!</h2>
              </div>
            </div>
            <p className="mt-3 text-sm text-purple-100">
              Climbing this slope takes a lot of motor power. What is your decision?
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => handleSteepChoice('detour')}
                className="flex items-center justify-between rounded-xl border-2 border-emerald-400/70 bg-emerald-500/20 px-4 py-3 text-left text-sm font-bold text-white hover:bg-emerald-500/30"
              >
                <span>Find a safer route</span>
                <span className="text-xs text-emerald-200">+25 pts · Saves battery</span>
              </button>
              <button
                type="button"
                onClick={() => handleSteepChoice('climb')}
                className="flex items-center justify-between rounded-xl border-2 border-rose-400/70 bg-rose-500/20 px-4 py-3 text-left text-sm font-bold text-white hover:bg-rose-500/30"
              >
                <span>Try to climb the slope</span>
                <span className="text-xs text-rose-200">Uses lots of battery!</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal?.kind === 'sample' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl border-2 border-sky-400/80 bg-[#22103D] p-6 text-center shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-300">
              <Gem className="h-8 w-8" />
            </div>
            <div className="mt-3 text-xs font-bold uppercase text-sky-300">Science Sample</div>
            <h2 className="mt-1 font-display text-xl font-bold text-white">{activeModal.sample.name}</h2>
            <p className="mt-2 text-sm text-purple-100">{activeModal.sample.clue}</p>
            <button
              type="button"
              onClick={handleCollectSample}
              className="mt-5 inline-flex h-11 items-center gap-2 rounded-full border-2 border-white border-b-4 bg-gradient-to-b from-[#38BDF8] to-[#0284C7] px-6 text-sm font-bold text-white shadow-lg hover:scale-105 transition-transform"
            >
              <Sparkles className="h-4 w-4" />
              <span>Collect Sample (+{activeModal.sample.points} pts)</span>
            </button>
          </div>
        </div>
      )}

      {activeModal?.kind === 'low_battery' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl border-2 border-rose-400 bg-[#2A1038] p-6 text-center shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-300">
              <Sun className="h-8 w-8" />
            </div>
            <h2 className="mt-3 font-display text-xl font-bold text-white">Warning: Low Battery!</h2>
            <p className="mt-2 text-sm text-purple-100">
              You have {battery}% battery left. Avoid orange zones and rocks, and find the yellow Solar Point to recharge!
            </p>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setActiveModal(null);
              }}
              className="mt-5 inline-flex h-11 items-center justify-center rounded-full border-2 border-white bg-amber-400 px-6 text-sm font-bold text-slate-950"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {activeModal?.kind === 'base_prompt' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl border-2 border-emerald-400 bg-[#22103D] p-6 text-center shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300">
              <Flag className="h-8 w-8" />
            </div>
            <h2 className="mt-3 font-display text-xl font-bold text-white">
              Arrived at Site {activeModal.candidateId}!
            </h2>
            <p className="mt-2 text-sm text-purple-100">
              Do you want to compare the 3 sites now to choose where to build the base, or keep exploring?
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setActiveModal(null);
                }}
                className="h-11 rounded-full border-2 border-[#543487] bg-[#2D174D] px-5 text-sm font-semibold text-white hover:border-sky-300"
              >
                Keep Exploring
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playSuccess();
                  setActiveModal(null);
                  setStep('SELECT_BASE');
                }}
                className="h-11 rounded-full border-2 border-white border-b-4 bg-gradient-to-b from-[#34D399] to-[#059669] px-5 text-sm font-bold text-slate-950"
              >
                Choose Base Site
              </button>
            </div>
          </div>
        </div>
      )}

      <DiscoveryCodexModal open={codexOpen} onClose={() => setCodexOpen(false)} />
    </div>
  );
};
