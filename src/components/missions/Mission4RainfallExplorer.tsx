import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Award,
  CheckCircle2,
  Cloud,
  CloudLightning,
  CloudRain,
  Compass,
  Droplets,
  PackagePlus,
  Play,
  Radar,
  RotateCcw,
  ShieldAlert,
  Sun,
  Trophy,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { soundEngine } from '../../utils/soundEngine';
import { AstroCompanion } from '../engine/AstroCompanion';
import { CommanderSprite } from '../engine/CommanderSprite';
import { DiscoveryCodexModal } from '../engine/DiscoveryCodexModal';
import { GameHUD } from '../engine/GameHUD';
import { RoverCartoonSvg } from './mission3/RoverCartoonSvg';
import {
  RainfallCanvas,
  SHELTER_ZONE,
  START_BASE_POS,
  WORLD_H,
  WORLD_OBSTACLES,
  WORLD_W,
  WaterCollectorEntity,
  isRiverBlocked,
} from './mission4/RainfallCanvas';
import {
  BIOME_PROFILES,
  BiomeId,
  ILLUSTRATIVE_GPM_SOURCE,
  WEATHER_CYCLE,
  getBiomeAtWorldPos,
  getEffectiveCollectRate,
} from './mission4/precipitationService';

type MissionStep = 'INTRO' | 'PLAYING' | 'RESULTS';

const TARGET_WATER_LITERS = 100;
const MAX_COLLECTORS = 3;

export const Mission4RainfallExplorer: React.FC = () => {
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

  const [step, setStep] = useState<MissionStep>('INTRO');
  const [codexOpen, setCodexOpen] = useState(false);

  // Player & World React States (synced smoothly for HUD & Canvas)
  const [playerPos, setPlayerPos] = useState(START_BASE_POS);
  const [playerAngle, setPlayerAngle] = useState(Math.PI);
  const [playerMoving, setPlayerMoving] = useState(false);

  const [weatherIdx, setWeatherIdx] = useState(1); // Starts with Light Rain
  const [scannerActive, setScannerActive] = useState(false);
  const [scannerPulse, setScannerPulse] = useState(0);
  const [scannerEnergy, setScannerEnergy] = useState(100);

  const [collectors, setCollectors] = useState<WaterCollectorEntity[]>([]);
  const [collectorsDeployedTotal, setCollectorsDeployedTotal] = useState(0);
  const [waterCollected, setWaterCollected] = useState(0);
  const [score, setScore] = useState(0);
  const [exploredBiomes, setExploredBiomes] = useState<Set<BiomeId>>(() => new Set(['dry']));

  // Action Challenges Tracking
  const [foundHeavyRain, setFoundHeavyRain] = useState(false);
  const [crossedRiver, setCrossedRiver] = useState(false);
  const [stormSurvived, setStormSurvived] = useState(false);
  const [stormCountdown, setStormCountdown] = useState<number | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<{ text: string; tone: 'good' | 'warn' | 'info' } | null>(null);

  // Refs for 60fps loop
  const posRef = useRef(START_BASE_POS);
  const angleRef = useRef(Math.PI);
  const tapTargetRef = useRef<{ x: number; y: number } | null>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const dpadRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const weatherIdxRef = useRef(weatherIdx);
  const scannerActiveRef = useRef(scannerActive);
  const scannerEnergyRef = useRef(scannerEnergy);
  const collectorsRef = useRef<WaterCollectorEntity[]>(collectors);
  const stormTriggeredRef = useRef(false);
  const lastStepSoundRef = useRef(0);

  weatherIdxRef.current = weatherIdx;
  scannerActiveRef.current = scannerActive;
  scannerEnergyRef.current = scannerEnergy;
  collectorsRef.current = collectors;

  const currentWeather = WEATHER_CYCLE[weatherIdx];
  const currentBiome = getBiomeAtWorldPos(playerPos.x, playerPos.y);
  const availableCollectors = MAX_COLLECTORS - collectors.length;

  const nearestCollector = collectors.find(
    (c) => Math.hypot(c.x - playerPos.x, c.y - playerPos.y) < 52
  );
  const inShelter = Math.hypot(playerPos.x - SHELTER_ZONE.x, playerPos.y - SHELTER_ZONE.y) <= SHELTER_ZONE.r;

  const showToast = useCallback((text: string, tone: 'good' | 'warn' | 'info' = 'info') => {
    setFeedbackBanner({ text, tone });
  }, []);

  const resetMission = useCallback(
    (startImmediately = false) => {
      soundEngine.playClick();
      posRef.current = START_BASE_POS;
      angleRef.current = Math.PI;
      tapTargetRef.current = null;
      stormTriggeredRef.current = false;
      setPlayerPos(START_BASE_POS);
      setPlayerAngle(Math.PI);
      setPlayerMoving(false);
      setWeatherIdx(1);
      setScannerActive(false);
      setScannerPulse(0);
      setScannerEnergy(100);
      setCollectors([]);
      setCollectorsDeployedTotal(0);
      setWaterCollected(0);
      setScore(0);
      setExploredBiomes(new Set(['dry']));
      setFoundHeavyRain(false);
      setCrossedRiver(false);
      setStormSurvived(false);
      setStormCountdown(null);
      setFeedbackBanner(null);
      setStep(startImmediately ? 'PLAYING' : 'INTRO');
      if (startImmediately) {
        sayAstro(
          'Mission started! Turn on the Scanner to see where it rains and cross the bridge to the West!',
          'happy',
          6000
        );
      }
    },
    [sayAstro]
  );

  // Activate Scientific Scanner
  const handleToggleScanner = useCallback(() => {
    if (step !== 'PLAYING') return;
    if (scannerActiveRef.current) {
      setScannerActive(false);
      return;
    }
    if (scannerEnergyRef.current < 25) {
      soundEngine.playGentleError();
      showToast('Scanner recharging energy!', 'warn');
      return;
    }
    soundEngine.playScan();
    setScannerActive(true);
    setScannerPulse(0);
    setScannerEnergy((e) => Math.max(0, e - 25));
    showToast('Scanner active: Blue = Heavy Rain · Green = Moderate · Orange = Dry', 'info');
  }, [showToast, step]);

  // Place Collector OR Collect Water from Nearby Collector
  const handleCollectorAction = useCallback(() => {
    if (step !== 'PLAYING') return;

    if (nearestCollector) {
      const liters = Math.round(nearestCollector.waterLiters);
      if (liters >= 5) {
        soundEngine.playWaterCollect();
        setWaterCollected((w) => {
          const nextW = w + liters;
          return nextW;
        });
        setScore((s) => s + liters * 2);
        // Empty collector or pick it back up if storm is active
        if (stormCountdown !== null) {
          setCollectors((prev) => prev.filter((c) => c.id !== nearestCollector.id));
          showToast(`+${liters}L collected and collector protected!`, 'good');
        } else {
          setCollectors((prev) =>
            prev.map((c) => (c.id === nearestCollector.id ? { ...c, waterLiters: 0 } : c))
          );
          showToast(`You collected ${liters}L of water! (+${liters * 2} pts)`, 'good');
        }
        recordBehavioralEvent('explore', 'm4-water-collect');
      } else {
        // Pick up empty/low collector to relocate it
        soundEngine.playPickup();
        setCollectors((prev) => prev.filter((c) => c.id !== nearestCollector.id));
        showToast('Collector picked up! Place it in a rainier zone.', 'info');
      }
      return;
    }

    if (availableCollectors <= 0) {
      soundEngine.playGentleError();
      showToast('You already placed all 3 collectors! Go pick one up to move it.', 'warn');
      return;
    }

    const biome = getBiomeAtWorldPos(posRef.current.x, posRef.current.y);
    const newCol: WaterCollectorEntity = {
      id: `col-${Date.now()}`,
      x: posRef.current.x,
      y: posRef.current.y,
      biome,
      waterLiters: 0,
      maxLiters: 60,
      isExposed: !inShelter,
    };

    soundEngine.playPickup();
    setCollectors((prev) => [...prev, newCol]);
    setCollectorsDeployedTotal((n) => n + 1);

    if (biome === 'dry') {
      showToast('Collector in Dry Region: it barely rains here!', 'warn');
      sayAstro('In this dry zone it hardly rains. Try placing collectors in the Blue or Green zone!', 'curious', 5500);
    } else if (biome === 'tropical') {
      setScore((s) => s + 30);
      showToast('Great spot! Collector placed in the Tropical Forest (+30 pts)!', 'good');
    } else {
      setScore((s) => s + 15);
      showToast(`Collector placed in ${BIOME_PROFILES[biome].name} (+15 pts)!`, 'good');
    }
  }, [availableCollectors, inShelter, nearestCollector, recordBehavioralEvent, sayAstro, showToast, step, stormCountdown]);

  // Keyboard Listeners
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (step !== 'PLAYING' || codexOpen) return;
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
        e.preventDefault();
        keysRef.current.add(k);
        tapTargetRef.current = null;
      } else if (k === 'q') {
        e.preventDefault();
        handleToggleScanner();
      } else if (k === 'e' || k === ' ') {
        e.preventDefault();
        handleCollectorAction();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [codexOpen, handleCollectorAction, handleToggleScanner, step]);

  // Dynamic Weather Cycle Timer (every 10 seconds)
  useEffect(() => {
    if (step !== 'PLAYING' || codexOpen) return;
    const id = window.setInterval(() => {
      setWeatherIdx((prev) => {
        const next = (prev + 1) % WEATHER_CYCLE.length;
        const nextWeather = WEATHER_CYCLE[next];
        if (nextWeather.weather === 'storm' && !stormTriggeredRef.current) {
          stormTriggeredRef.current = true;
          soundEngine.playStormAlert();
          setStormCountdown(11);
          showToast('STORM ALERT! Head to the green SHELTER or pick up collectors!', 'warn');
          sayAstro(
            'Storm incoming! Drive the rover to the Shelter or pick up exposed collectors!',
            'alert',
            6000
          );
        }
        return next;
      });
    }, 10000);
    return () => window.clearInterval(id);
  }, [codexOpen, sayAstro, showToast, step]);

  // Storm Countdown Resolution (Challenge D)
  useEffect(() => {
    if (step !== 'PLAYING' || stormCountdown === null || codexOpen) return;
    if (stormCountdown <= 0) {
      const exposedCount = collectorsRef.current.filter((c) => c.isExposed).length;
      if (inShelter || exposedCount === 0) {
        soundEngine.playSuccess();
        setStormSurvived(true);
        setScore((s) => s + 60);
        showToast('Equipment protected from the storm! +60 pts!', 'good');
        sayAstro('Excellent! You protected the rover and resources during the storm!', 'happy', 5000);
      } else {
        soundEngine.playGentleError();
        setCollectors((prev) =>
          prev.map((c) => (c.isExposed ? { ...c, waterLiters: Math.max(0, c.waterLiters - 15) } : c))
        );
        showToast('The storm spilled water from exposed collectors! (-15L)', 'warn');
        sayAstro('The storm spilled water from the collectors left outside the shelter!', 'alert', 5000);
      }
      setStormCountdown(null);
      return;
    }

    const t = window.setTimeout(() => {
      setStormCountdown((c) => (c !== null ? c - 1 : null));
    }, 1000);
    return () => window.clearTimeout(t);
  }, [codexOpen, inShelter, sayAstro, showToast, step, stormCountdown]);

  // Main 60fps Movement, Collision, Collector Filling & Scanner Loop
  useEffect(() => {
    if (step !== 'PLAYING' || codexOpen) return;

    let rafId = 0;
    let last = performance.now();
    let accTick = 0;

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      // 1. Movement Vector
      let vx = dpadRef.current.x;
      let vy = dpadRef.current.y;
      if (keysRef.current.has('a') || keysRef.current.has('arrowleft')) vx -= 1;
      if (keysRef.current.has('d') || keysRef.current.has('arrowright')) vx += 1;
      if (keysRef.current.has('w') || keysRef.current.has('arrowup')) vy -= 1;
      if (keysRef.current.has('s') || keysRef.current.has('arrowdown')) vy += 1;

      let moving = false;
      let nx = posRef.current.x;
      let ny = posRef.current.y;
      const speed = 175;

      if (vx !== 0 || vy !== 0) {
        const len = Math.hypot(vx, vy) || 1;
        nx += (vx / len) * speed * dt;
        ny += (vy / len) * speed * dt;
        angleRef.current = Math.atan2(vy, vx);
        moving = true;
      } else if (tapTargetRef.current) {
        const dx = tapTargetRef.current.x - posRef.current.x;
        const dy = tapTargetRef.current.y - posRef.current.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 10) {
          tapTargetRef.current = null;
        } else {
          const stepDist = Math.min(dist, speed * dt);
          nx += (dx / dist) * stepDist;
          ny += (dy / dist) * stepDist;
          angleRef.current = Math.atan2(dy, dx);
          moving = true;
        }
      }

      // World boundary clamp
      nx = Math.max(24, Math.min(WORLD_W - 24, nx));
      ny = Math.max(24, Math.min(WORLD_H - 24, ny));

      // Obstacle circle collisions
      const roverRadius = 18;
      for (const obs of WORLD_OBSTACLES) {
        const dx = nx - obs.x;
        const dy = ny - obs.y;
        const dist = Math.hypot(dx, dy);
        const minDist = obs.r + roverRadius;
        if (dist < minDist) {
          const ux = dist > 0.001 ? dx / dist : 1;
          const uy = dist > 0.001 ? dy / dist : 0;
          nx = obs.x + ux * minDist;
          ny = obs.y + uy * minDist;
        }
      }

      // River & Flooded Ford Collision
      const activeWeather = WEATHER_CYCLE[weatherIdxRef.current];
      if (isRiverBlocked(nx, ny, activeWeather.riverLevel)) {
        // Keep previous non-river axis if possible so sliding along riverbank feels smooth
        if (!isRiverBlocked(posRef.current.x, ny, activeWeather.riverLevel)) {
          nx = posRef.current.x;
        } else if (!isRiverBlocked(nx, posRef.current.y, activeWeather.riverLevel)) {
          ny = posRef.current.y;
        } else {
          nx = posRef.current.x;
          ny = posRef.current.y;
        }
      }

      posRef.current = { x: nx, y: ny };
      setPlayerPos({ x: nx, y: ny });
      setPlayerAngle(angleRef.current);
      setPlayerMoving(moving);

      if (moving && now - lastStepSoundRef.current > 260) {
        lastStepSoundRef.current = now;
        soundEngine.playStep();
      }

      // 2. Scanner animation & energy recharge (every ~200ms batch)
      accTick += dt;
      if (accTick >= 0.2) {
        const tickDt = accTick;
        accTick = 0;

        // Biome discovery & River crossing detection
        const biome = getBiomeAtWorldPos(nx, ny);
        setExploredBiomes((prev) => {
          if (prev.has(biome)) return prev;
          const next = new Set(prev);
          next.add(biome);
          setScore((s) => s + 25);
          return next;
        });

        if (nx < 490) {
          setCrossedRiver((prev) => {
            if (!prev) {
              soundEngine.playSuccess();
              setScore((s) => s + 40);
              showToast('River crossed safely! (+40 pts)', 'good');
            }
            return true;
          });
        }

        if (scannerActiveRef.current) {
          setScannerPulse((p) => (p + tickDt * 1.4) % 1);
          setScannerEnergy((e) => {
            const nextE = Math.max(0, e - 5 * tickDt);
            if (nextE <= 0) {
              setScannerActive(false);
            }
            return nextE;
          });
          if (biome === 'tropical') {
            setFoundHeavyRain((prev) => {
              if (!prev) {
                soundEngine.playSuccess();
                setScore((s) => s + 50);
                showToast('Heavy Rain (Blue) discovered! Great spot for collectors (+50 pts)!', 'good');
              }
              return true;
            });
          }
        } else {
          setScannerEnergy((e) => Math.min(100, e + 8 * tickDt));
        }

        // Fill placed collectors based on local biome + active weather
        if (collectorsRef.current.length > 0) {
          setCollectors((prev) =>
            prev.map((c) => {
              const rate = getEffectiveCollectRate(c.biome, activeWeather);
              return {
                ...c,
                waterLiters: Math.min(c.maxLiters, c.waterLiters + rate * tickDt),
              };
            })
          );
        }
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [codexOpen, showToast, step]);

  // Auto-complete mission once water target + key exploration are reached!
  useEffect(() => {
    if (step !== 'PLAYING') return;
    if (waterCollected >= TARGET_WATER_LITERS && crossedRiver && exploredBiomes.size >= 3) {
      const t = window.setTimeout(() => {
        soundEngine.playSuccess();
        recordDecision({
          m4PurifiedWaterPct: 100,
          m4CollectedRawWaterFirst: true,
        });
        recordBehavioralEvent('explore', 'm4-rainfall-complete');
        unlockDiscovery('disc-gpm-rainfall');
        completeMission('mission-4', 'badge-rain-hunter', {
          id: 'item-rain-collector',
          name: 'Atmospheric Collector',
          category: 'instrument',
          color: '#38BDF8',
          acquiredIn: 'mission-4',
        });
        setStep('RESULTS');
        sayAstro(
          'Mission accomplished! You discovered where it rains the most and collected enough water for the team!',
          'happy',
          6500
        );
      }, 650);
      return () => window.clearTimeout(t);
    }
  }, [
    completeMission,
    crossedRiver,
    exploredBiomes.size,
    recordBehavioralEvent,
    recordDecision,
    sayAstro,
    step,
    unlockDiscovery,
    waterCollected,
  ]);

  const WeatherIcon =
    currentWeather.weather === 'sunny'
      ? Sun
      : currentWeather.weather === 'storm'
        ? CloudLightning
        : currentWeather.weather === 'cloudy'
          ? Cloud
          : CloudRain;

  return (
    <div className="flex min-h-screen flex-col bg-[#1B0D2E] text-slate-100 select-none">
      <GameHUD
        missionTitle="Mission 04 · Rain Explorer"
        goalText={
          step === 'INTRO'
            ? 'Prepare the Earth expedition to investigate rainfall.'
            : step === 'PLAYING'
              ? 'Use the scanner, cross the river, place collectors, and collect 100 L!'
              : 'Rainfall exploration results.'
        }
        progressText={step === 'PLAYING' ? `${Math.min(TARGET_WATER_LITERS, waterCollected)}/${TARGET_WATER_LITERS} L` : undefined}
        onBackToMap={() => setRoute('CAMPAIGN_MAP')}
        onOpenCodex={() => setCodexOpen(true)}
        onRepeatHint={() => {
          sayAstro(
            'Activate the Scanner (Q) to see the rain colors, cross the bridge north of the river, and place collectors in the blue Tropical Forest!',
            'curious',
            7000
          );
        }}
      />

      {/* STEP 1: MISSION INTRODUCTION */}
      {step === 'INTRO' && (
        <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-4 py-8">
          <div className="w-full rounded-3xl border-2 border-[#543487] bg-gradient-to-b from-[#281447] to-[#1A0B30] p-6 shadow-2xl sm:p-8">
            <div className="flex flex-col items-center gap-6 md:flex-row">
              <div className="flex items-end gap-3 shrink-0">
                {/* Animated Earth Illustration */}
                <svg viewBox="0 0 96 96" className="h-24 w-24 animate-astro-float drop-shadow-lg" aria-hidden="true">
                  <circle cx="48" cy="48" r="40" fill="#0284C7" stroke="#E0F2FE" strokeWidth="3" />
                  <path d="M24 38 Q36 22 52 28 Q58 38 46 50 Q32 54 24 38 Z" fill="#22C55E" />
                  <path d="M56 46 Q74 42 78 58 Q70 74 54 70 Q50 58 56 46 Z" fill="#22C55E" />
                  <ellipse cx="38" cy="24" rx="14" ry="5" fill="#FFFFFF" opacity="0.7" />
                  <ellipse cx="62" cy="36" rx="12" ry="4" fill="#FFFFFF" opacity="0.65" />
                </svg>
                <CommanderSprite profile={save.commander} size={86} />
                <RoverCartoonSvg size={76} facing="right" />
              </div>

              <div className="flex-1 text-center md:text-left">
                <p className="text-xs font-bold uppercase tracking-wider text-sky-300">
                  AstroBase · Mission 04 · Earth
                </p>
                <h1 className="mt-1 font-display text-3xl font-bold text-white sm:text-4xl">
                  Rain Explorer
                </h1>
                <p className="mt-3 text-base leading-relaxed text-purple-100">
                  "Welcome, Explorer! Our team needs to understand where it rains on Earth. Explore the environments, discover the rain, and collect water!"
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-2xl border border-[#462A72] bg-[#190B2E] p-3.5">
                <Radar className="h-6 w-6 text-sky-400 shrink-0" />
                <div>
                  <div className="text-sm font-bold text-white">1. Turn On Scanner</div>
                  <div className="text-xs text-purple-200/80">Find heavy rainfall</div>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-[#462A72] bg-[#190B2E] p-3.5">
                <PackagePlus className="h-6 w-6 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-sm font-bold text-white">2. Place Collectors</div>
                  <div className="text-xs text-purple-200/80">They fill up during rain</div>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-[#462A72] bg-[#190B2E] p-3.5">
                <Droplets className="h-6 w-6 text-amber-300 shrink-0" />
                <div>
                  <div className="text-sm font-bold text-white">3. Collect 100 L</div>
                  <div className="text-xs text-purple-200/80">And take shelter in storms!</div>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-sky-400/35 bg-sky-500/10 px-4 py-2.5 text-xs text-sky-100">
              <strong>{ILLUSTRATIVE_GPM_SOURCE.product}:</strong> {ILLUSTRATIVE_GPM_SOURCE.disclaimer} (Training mission on Earth — does not represent rain on the Moon or Mars!)
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <AstroCompanion
                mood="curious"
                size={56}
                caption="Ready to explore where it rains the most?"
                showCaptions={save.settings.captionsEnabled}
              />
              <button
                type="button"
                onClick={() => {
                  soundEngine.playSuccess();
                  setStep('PLAYING');
                  sayAstro(
                    'Press Scanner to see the rain colors, cross the bridge, and place the collectors!',
                    'happy',
                    6500
                  );
                }}
                className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-white border-b-4 bg-gradient-to-b from-[#38BDF8] to-[#0284C7] px-7 text-base font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                <Play className="h-5 w-5" />
                <span>Start Mission</span>
              </button>
            </div>
          </div>
        </main>
      )}

      {/* STEP 2: PLAYABLE 2D TOP-DOWN GAME */}
      {step === 'PLAYING' && (
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-3 px-4 py-3">
          {/* Compact Game HUD */}
          <section className="grid grid-cols-2 gap-2 rounded-2xl border-2 border-[#462A72] bg-[#21103A] p-2.5 sm:grid-cols-5 sm:items-center">
            {/* Water Collected */}
            <div className="flex flex-col gap-1 rounded-xl border border-[#462A72] bg-[#160A29] px-3 py-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 font-semibold text-sky-200">
                  <Droplets className="h-3.5 w-3.5 text-sky-400" />
                  Water
                </span>
                <span className="font-mono-tabular font-bold text-white">
                  {waterCollected}/{TARGET_WATER_LITERS} L
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-sky-400 transition-all duration-200"
                  style={{ width: `${Math.min(100, (waterCollected / TARGET_WATER_LITERS) * 100)}%` }}
                />
              </div>
            </div>

            {/* Collector Inventory */}
            <div className="flex items-center justify-between rounded-xl border border-[#462A72] bg-[#160A29] px-3 py-2 text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-emerald-200">
                <PackagePlus className="h-4 w-4 text-emerald-400" />
                Collectors
              </span>
              <span className="font-mono-tabular text-sm font-bold text-white">
                {availableCollectors}/{MAX_COLLECTORS}
              </span>
            </div>

            {/* Scanner Energy */}
            <div className="flex flex-col gap-1 rounded-xl border border-[#462A72] bg-[#160A29] px-3 py-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 font-semibold text-purple-100">
                  <Radar className="h-3.5 w-3.5 text-amber-300" />
                  Scanner
                </span>
                <span className="font-mono-tabular font-bold text-white">
                  {Math.round(scannerEnergy)}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full transition-all duration-200 ${scannerActive ? 'bg-sky-400' : 'bg-amber-400'}`}
                  style={{ width: `${scannerEnergy}%` }}
                />
              </div>
            </div>

            {/* Weather & Season */}
            <div className="flex items-center justify-between rounded-xl border border-[#462A72] bg-[#160A29] px-3 py-2 text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-white">
                <WeatherIcon
                  className={`h-4 w-4 ${
                    currentWeather.weather === 'storm'
                      ? 'text-rose-400'
                      : currentWeather.weather === 'sunny'
                        ? 'text-amber-300'
                        : 'text-sky-300'
                  }`}
                />
                {currentWeather.weatherLabel}
              </span>
              <span className="text-[11px] text-purple-200/80 hidden md:inline">
                {BIOME_PROFILES[currentBiome].name}
              </span>
            </div>

            {/* Score */}
            <div className="col-span-2 flex items-center justify-between rounded-xl border border-[#462A72] bg-[#160A29] px-3 py-2 text-xs sm:col-span-1">
              <span className="flex items-center gap-1.5 font-semibold text-amber-200">
                <Trophy className="h-4 w-4 text-amber-300" />
                Score
              </span>
              <span className="font-mono-tabular text-sm font-bold text-amber-300">{score}</span>
            </div>
          </section>

          {/* Compact Visual Objectives + Storm Alert */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#462A72] bg-[#190B2E] px-3 py-2 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`inline-flex items-center gap-1 font-semibold ${foundHeavyRain ? 'text-emerald-300' : 'text-purple-200/80'}`}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Heavy Rain (Blue)
              </span>
              <span className={`inline-flex items-center gap-1 font-semibold ${crossedRiver ? 'text-emerald-300' : 'text-purple-200/80'}`}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Cross River
              </span>
              <span className={`inline-flex items-center gap-1 font-semibold ${waterCollected >= TARGET_WATER_LITERS ? 'text-emerald-300' : 'text-purple-200/80'}`}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                100 L of Water
              </span>
              <span className={`inline-flex items-center gap-1 font-semibold ${stormSurvived ? 'text-emerald-300' : 'text-purple-200/80'}`}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Storm
              </span>
            </div>

            {stormCountdown !== null ? (
              <div className="flex items-center gap-1.5 font-bold text-rose-300">
                <ShieldAlert className="h-4 w-4" />
                <span>Storm in {stormCountdown}s! Go to SHELTER or pick up collectors!</span>
              </div>
            ) : (
              feedbackBanner && (
                <div
                  className={`font-bold ${
                    feedbackBanner.tone === 'good'
                      ? 'text-emerald-300'
                      : feedbackBanner.tone === 'warn'
                        ? 'text-rose-300'
                        : 'text-sky-200'
                  }`}
                >
                  {feedbackBanner.text}
                </div>
              )
            )}
          </div>

          {/* Main 2D Canvas + Controls Sidebar */}
          <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-stretch">
            <div className="relative flex-1 min-h-[300px]">
              <RainfallCanvas
                playerPos={playerPos}
                playerAngle={playerAngle}
                playerMoving={playerMoving}
                scannerActive={scannerActive}
                scannerPulse={scannerPulse}
                weather={currentWeather}
                collectors={collectors}
                stormAlertActive={stormCountdown !== null}
                reducedStimuli={save.settings.reducedStimuli}
                onCanvasTap={(wx, wy) => {
                  tapTargetRef.current = { x: wx, y: wy };
                }}
              />
            </div>

            {/* Action & Touch Controls Panel */}
            <aside className="flex w-full flex-col justify-between gap-3 rounded-2xl border-2 border-[#462A72] bg-[#21103A] p-3.5 lg:w-64 shrink-0">
              {/* Primary Action Buttons */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleToggleScanner}
                  className={`flex h-11 w-full items-center justify-center gap-2 rounded-xl border-2 px-3 text-xs font-bold transition-transform active:scale-95 ${
                    scannerActive
                      ? 'border-white bg-sky-500 text-white shadow'
                      : 'border-sky-400/70 bg-sky-500/20 text-sky-100 hover:bg-sky-500/30'
                  }`}
                >
                  <Radar className="h-4 w-4" />
                  <span>{scannerActive ? 'Turn Off Scanner (Q)' : 'Activate Scanner (Q)'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCollectorAction}
                  className={`flex h-11 w-full items-center justify-center gap-2 rounded-xl border-2 px-3 text-xs font-bold transition-transform active:scale-95 ${
                    nearestCollector
                      ? 'border-white bg-gradient-to-b from-[#34D399] to-[#059669] text-slate-950 shadow'
                      : 'border-amber-300/80 bg-amber-400/20 text-amber-100 hover:bg-amber-400/30'
                  }`}
                >
                  {nearestCollector ? <Droplets className="h-4 w-4" /> : <PackagePlus className="h-4 w-4" />}
                  <span>
                    {nearestCollector
                      ? nearestCollector.waterLiters >= 5
                        ? `Collect ${Math.round(nearestCollector.waterLiters)}L (E)`
                        : 'Pick Up Collector (E)'
                      : `Place Collector (E)`}
                  </span>
                </button>
              </div>

              {/* Scanner Colour Key */}
              <div className="rounded-xl border border-[#462A72] bg-[#160A29] p-3 text-xs">
                <div className="font-bold text-amber-300">Scanner Colors</div>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded bg-blue-500" />
                    <span>Heavy Rain</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded bg-green-500" />
                    <span>Moderate</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded bg-yellow-400" />
                    <span>Light</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded bg-orange-400" />
                    <span>Very Dry</span>
                  </div>
                </div>
              </div>

              {/* On-Screen D-Pad */}
              <div>
                <div className="text-center text-[11px] font-semibold text-purple-200/85">
                  Move (Arrows / WASD / Tap Map)
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1.5 max-w-[164px] mx-auto">
                  <div />
                  <button
                    type="button"
                    onPointerDown={() => {
                      tapTargetRef.current = null;
                      dpadRef.current = { x: 0, y: -1 };
                    }}
                    onPointerUp={() => (dpadRef.current = { x: 0, y: 0 })}
                    onPointerLeave={() => (dpadRef.current = { x: 0, y: 0 })}
                    aria-label="Up"
                    className="flex h-11 items-center justify-center rounded-xl border-2 border-[#543487] bg-[#2D174D] text-white active:scale-95"
                  >
                    <ArrowUp className="h-5 w-5" />
                  </button>
                  <div />
                  <button
                    type="button"
                    onPointerDown={() => {
                      tapTargetRef.current = null;
                      dpadRef.current = { x: -1, y: 0 };
                    }}
                    onPointerUp={() => (dpadRef.current = { x: 0, y: 0 })}
                    onPointerLeave={() => (dpadRef.current = { x: 0, y: 0 })}
                    aria-label="Left"
                    className="flex h-11 items-center justify-center rounded-xl border-2 border-[#543487] bg-[#2D174D] text-white active:scale-95"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onPointerDown={() => {
                      tapTargetRef.current = null;
                      dpadRef.current = { x: 0, y: 1 };
                    }}
                    onPointerUp={() => (dpadRef.current = { x: 0, y: 0 })}
                    onPointerLeave={() => (dpadRef.current = { x: 0, y: 0 })}
                    aria-label="Down"
                    className="flex h-11 items-center justify-center rounded-xl border-2 border-[#543487] bg-[#2D174D] text-white active:scale-95"
                  >
                    <ArrowDown className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onPointerDown={() => {
                      tapTargetRef.current = null;
                      dpadRef.current = { x: 1, y: 0 };
                    }}
                    onPointerUp={() => (dpadRef.current = { x: 0, y: 0 })}
                    onPointerLeave={() => (dpadRef.current = { x: 0, y: 0 })}
                    aria-label="Right"
                    className="flex h-11 items-center justify-center rounded-xl border-2 border-[#543487] bg-[#2D174D] text-white active:scale-95"
                  >
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </main>
      )}

      {/* STEP 3: MISSION COMPLETION */}
      {step === 'RESULTS' && (
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-8">
          <div className="w-full rounded-3xl border-2 border-emerald-400/80 bg-gradient-to-b from-[#281548] to-[#170A2B] p-6 text-center shadow-2xl sm:p-8">
            <div className="flex items-end justify-center gap-5">
              <CommanderSprite profile={save.commander} size={90} isCelebrating />
              <AstroCompanion mood="happy" size={70} showCaptions={false} />
            </div>

            <h1 className="mt-4 font-display text-2xl font-bold text-white sm:text-3xl">
              Mission 4 Completed!
            </h1>
            <p className="mt-2 text-sm text-purple-100">
              Excellent exploration! You discovered that regions with heavier rain allow collecting more rainwater — and that rain alone is not enough without collectors and protection!
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3 text-left sm:grid-cols-4">
              <div className="rounded-xl border border-[#462A72] bg-[#160A29] p-3">
                <div className="text-[11px] text-purple-200/80">Water Collected</div>
                <div className="mt-0.5 font-mono-tabular text-xl font-bold text-sky-300">
                  {waterCollected} L
                </div>
              </div>
              <div className="rounded-xl border border-[#462A72] bg-[#160A29] p-3">
                <div className="text-[11px] text-purple-200/80">Zones Explored</div>
                <div className="mt-0.5 font-mono-tabular text-xl font-bold text-emerald-300">
                  {exploredBiomes.size}/4
                </div>
              </div>
              <div className="rounded-xl border border-[#462A72] bg-[#160A29] p-3">
                <div className="text-[11px] text-purple-200/80">Collectors Used</div>
                <div className="mt-0.5 font-mono-tabular text-xl font-bold text-white">
                  {collectorsDeployedTotal}
                </div>
              </div>
              <div className="rounded-xl border border-[#462A72] bg-[#160A29] p-3">
                <div className="text-[11px] text-purple-200/80">Score</div>
                <div className="mt-0.5 font-mono-tabular text-xl font-bold text-amber-300">
                  {score}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-amber-400/50 bg-amber-400/15 px-4 py-2.5 text-xs font-bold text-amber-200">
              <Award className="h-4 w-4 text-amber-300" />
              <span>Badge Earned: Rain Explorer</span>
            </div>

            <p className="mt-3 text-[11px] text-purple-200/75">
              Discovery: {ILLUSTRATIVE_GPM_SOURCE.product} — simulated precipitation data on Earth.
            </p>

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
                <Compass className="h-4 w-4" />
                <span>Back to AstroBase</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playSuccess();
                  setRoute('MISSION_5');
                }}
                className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-white border-b-4 bg-gradient-to-b from-[#FDE047] to-[#EAB308] px-6 text-sm font-bold text-slate-950 shadow-lg hover:scale-105 transition-transform"
              >
                <span>Mission 5</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </main>
      )}

      <DiscoveryCodexModal open={codexOpen} onClose={() => setCodexOpen(false)} />
    </div>
  );
};
