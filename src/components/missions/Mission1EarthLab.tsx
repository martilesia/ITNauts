import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Flame,
  Play,
  RotateCcw,
  Shield,
  Sparkles,
  Wind,
  Zap,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { soundEngine } from '../../utils/soundEngine';
import { AstroCompanion } from '../engine/AstroCompanion';
import { CommanderSprite } from '../engine/CommanderSprite';
import { DiscoveryCodexModal } from '../engine/DiscoveryCodexModal';
import { GameHUD } from '../engine/GameHUD';
import {
  M1Coating,
  M1Filter,
  M1LandingZone,
  M1SkyItem,
  PrepLabCanvas,
} from './mission1/PrepLabCanvas';

type Phase = 'EQUIP' | 'FLYING' | 'RESULTS';

function createSkyItems(): M1SkyItem[] {
  return [
    { id: 'b1', kind: 'battery', x: 35, y: 34, hit: false },
    { id: 'd1', kind: 'dust', x: 56, y: 42, hit: false },
    { id: 'b2', kind: 'battery', x: 64, y: 58, hit: false },
    { id: 'd2', kind: 'dust', x: 44, y: 63, hit: false },
  ];
}

export const Mission1EarthLab: React.FC = () => {
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

  const [phase, setPhase] = useState<Phase>('EQUIP');
  const [coating, setCoating] = useState<M1Coating>('reflective');
  const [filter, setFilter] = useState<M1Filter>('electrostatic');

  // Flight state
  const [podX, setPodX] = useState(18);
  const [podY, setPodY] = useState(12);
  const [integrity, setIntegrity] = useState(100);
  const [thrusting, setThrusting] = useState(false);
  const [skyItems, setSkyItems] = useState<M1SkyItem[]>(createSkyItems);
  const [flashMsg, setFlashMsg] = useState<{ text: string; tone: 'good' | 'bad' } | null>(null);
  const [landedZone, setLandedZone] = useState<M1LandingZone | null>(null);
  const [codexOpen, setCodexOpen] = useState(false);

  const keysRef = useRef({ left: false, right: false, brake: false });
  const podRef = useRef({ x: 18, y: 12, integrity: 100 });
  const itemsRef = useRef<M1SkyItem[]>(skyItems);
  const thermalCheckedRef = useRef(false);

  const showFlash = useCallback((text: string, tone: 'good' | 'bad') => {
    setFlashMsg({ text, tone });
    window.setTimeout(() => {
      setFlashMsg((curr) => (curr?.text === text ? null : curr));
    }, 1300);
  }, []);

  const launchFlight = () => {
    soundEngine.playClick();
    const freshItems = createSkyItems();
    podRef.current = { x: 18, y: 12, integrity: 100 };
    itemsRef.current = freshItems;
    thermalCheckedRef.current = false;
    keysRef.current = { left: false, right: false, brake: false };

    setPodX(18);
    setPodY(12);
    setIntegrity(100);
    setSkyItems(freshItems);
    setLandedZone(null);
    setFlashMsg(null);
    setPhase('FLYING');

    sayAstro(
      'Steer the capsule to the green center (LAND HERE!) and grab +Energy!',
      'curious',
      6000
    );
  };

  // Keyboard controls during flight
  useEffect(() => {
    if (phase !== 'FLYING') return;
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'arrowleft' || k === 'a') {
        e.preventDefault();
        keysRef.current.left = true;
      } else if (k === 'arrowright' || k === 'd') {
        e.preventDefault();
        keysRef.current.right = true;
      } else if (k === 'arrowup' || k === 'w' || k === ' ') {
        e.preventDefault();
        keysRef.current.brake = true;
        setThrusting(true);
      }
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'arrowleft' || k === 'a') keysRef.current.left = false;
      else if (k === 'arrowright' || k === 'd') keysRef.current.right = false;
      else if (k === 'arrowup' || k === 'w' || k === ' ') {
        keysRef.current.brake = false;
        setThrusting(false);
      }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [phase]);

  // Smooth arcade descent loop
  useEffect(() => {
    if (phase !== 'FLYING') return;

    const tick = window.setInterval(() => {
      let { x, y, integrity: hp } = podRef.current;

      if (keysRef.current.left) x = Math.max(8, x - 2.1);
      if (keysRef.current.right) x = Math.min(92, x + 2.1);

      const descentSpeed = keysRef.current.brake ? 0.3 : 1.05;
      y = Math.min(77, y + descentSpeed);

      // Mid-air thermal shock event at y >= 45
      if (!thermalCheckedRef.current && y >= 45) {
        thermalCheckedRef.current = true;
        if (coating === 'reflective') {
          soundEngine.playSuccess();
          showFlash('Gold Blanket protected from heat/cold!', 'good');
        } else {
          hp = Math.max(10, hp - 25);
          soundEngine.playGentleError();
          showFlash('Dark Metal overheated! -25%', 'bad');
        }
      }

      // Check collisions with sky items
      let itemsChanged = false;
      const nextItems = itemsRef.current.map((item) => {
        if (item.hit) return item;
        const dist = Math.hypot(item.x - x, item.y - y);
        if (dist < 10) {
          itemsChanged = true;
          if (item.kind === 'battery') {
            hp = Math.min(100, hp + 15);
            soundEngine.playPickup();
            showFlash('+15% Energy!', 'good');
          } else if (filter === 'electrostatic') {
            soundEngine.playSuccess();
            showFlash('Electric Filter repelled dust!', 'good');
          } else {
            hp = Math.max(5, hp - 25);
            soundEngine.playGentleError();
            showFlash('Dust got through mesh! -25%', 'bad');
          }
          return { ...item, hit: true };
        }
        return item;
      });

      if (itemsChanged) {
        itemsRef.current = nextItems;
        setSkyItems(nextItems);
      }

      podRef.current = { x, y, integrity: hp };
      setPodX(x);
      setPodY(y);
      setIntegrity(hp);

      // Touchdown!
      if (y >= 77) {
        const zone: M1LandingZone =
          x < 34 ? 'deep-crater' : x > 66 ? 'steep-slope' : 'safe-plain';
        setLandedZone(zone);

        const finalHp = zone === 'safe-plain' ? hp : Math.max(0, hp - 40);
        setIntegrity(finalHp);

        recordDecision({
          m1ThermalShield: coating,
          m1DustFilter: filter,
          m1ReliefValidated: zone === 'safe-plain',
          m1PrepSite: zone,
        });
        recordBehavioralEvent('explore');

        const won = zone === 'safe-plain' && finalHp >= 50;
        if (won) {
          soundEngine.playSuccess();
          unlockDiscovery('disc-modis');
          unlockDiscovery('disc-merra2');
          unlockDiscovery('disc-srtm');
          completeMission('mission-1', 'badge-eyes-earth', {
            id: isMoon ? 'item-lunar-prep-kit' : 'item-mars-prep-kit',
            name: isMoon ? 'Reflective Shield & Lunar Filter' : 'Reflective Shield & Martian Filter',
            category: 'module',
            color: '#FACC15',
            acquiredIn: 'mission-1',
          });
          sayAstro(`Perfect landing on the Plateau, ${commanderName}!`, 'happy', 5500);
        } else {
          soundEngine.playGentleError();
          recordBehavioralEvent('adapt');
          sayAstro(
            zone === 'deep-crater'
              ? 'You landed in the Dark Crater (no sunlight)! Try landing on the green center!'
              : zone === 'steep-slope'
                ? 'Hit the rocks on the slope! Aim for the green center!'
                : 'The capsule took too much damage! Use the Gold Blanket and Electric Filter!',
            'alert',
            6000
          );
        }
        setPhase('RESULTS');
      }
    }, 55);

    return () => window.clearInterval(tick);
  }, [
    coating,
    commanderName,
    completeMission,
    filter,
    isMoon,
    phase,
    recordBehavioralEvent,
    recordDecision,
    sayAstro,
    showFlash,
    unlockDiscovery,
  ]);

  const won = landedZone === 'safe-plain' && integrity >= 50;

  return (
    <div className="min-h-screen bg-[#1B0D2E] text-slate-100 flex flex-col">
      <GameHUD
        missionTitle={`Mission 01 · ${destinationLabel} · Safe Landing`}
        goalText={
          phase === 'EQUIP'
            ? 'Choose the capsule shield and filter, then pilot to the green center!'
            : phase === 'FLYING'
              ? 'Use Left / Right to land on the green center (LAND HERE ✓)!'
              : 'Landing Result'
        }
        progressText={phase === 'FLYING' ? `Integrity ${integrity}%` : undefined}
        onBackToMap={() => setRoute('CAMPAIGN_MAP')}
        onOpenCodex={() => setCodexOpen(true)}
        onRepeatHint={() =>
          sayAstro(
            'Choose Gold Blanket + Electric Filter and use the arrow keys or buttons to land on the green center!',
            'curious',
            6500
          )
        }
      />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-4 sm:px-6">
        {phase === 'EQUIP' && (
          <section className="mx-auto my-auto w-full max-w-2xl rounded-3xl border-2 border-[#543487] bg-[#24123F] p-6 sm:p-7 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="flex items-end gap-2 shrink-0">
                <CommanderSprite profile={save.commander} size={78} />
                <AstroCompanion mood="curious" showCaptions={false} size={58} />
              </div>
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
                  Prepare the Capsule & Land!
                </h1>
                <p className="mt-1 text-sm text-purple-100/90">
                  Pick the right parts and guide the capsule to the green pad on {destinationLabel}.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {/* Choice 1: Shield */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-2">
                  1. Heat & Cold Shield ({isMoon ? '+120°C / -175°C' : '+18°C / -88°C'})
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setCoating('reflective');
                    }}
                    className={`flex items-center gap-3 rounded-2xl border-2 p-3.5 text-left transition-all ${
                      coating === 'reflective'
                        ? 'border-amber-300 bg-amber-400/20 text-white'
                        : 'border-[#462A72] bg-[#190B2E] text-purple-200 hover:border-sky-400'
                    }`}
                  >
                    <Shield className="h-6 w-6 text-amber-300 shrink-0" />
                    <div>
                      <div className="text-sm font-bold">Gold Blanket</div>
                      <div className="text-[11px] text-purple-200/80">Reflects heat & cold</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setCoating('dark-metal');
                    }}
                    className={`flex items-center gap-3 rounded-2xl border-2 p-3.5 text-left transition-all ${
                      coating === 'dark-metal'
                        ? 'border-amber-300 bg-amber-400/20 text-white'
                        : 'border-[#462A72] bg-[#190B2E] text-purple-200 hover:border-sky-400'
                    }`}
                  >
                    <Flame className="h-6 w-6 text-slate-300 shrink-0" />
                    <div>
                      <div className="text-sm font-bold">Dark Metal</div>
                      <div className="text-[11px] text-purple-200/80">Plain thin metal</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Choice 2: Dust Filter */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-sky-300 mb-2">
                  2. Dust Filter
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setFilter('electrostatic');
                    }}
                    className={`flex items-center gap-3 rounded-2xl border-2 p-3.5 text-left transition-all ${
                      filter === 'electrostatic'
                        ? 'border-sky-300 bg-sky-500/20 text-white'
                        : 'border-[#462A72] bg-[#190B2E] text-purple-200 hover:border-sky-400'
                    }`}
                  >
                    <Zap className="h-6 w-6 text-sky-300 shrink-0" />
                    <div>
                      <div className="text-sm font-bold">Electric Filter</div>
                      <div className="text-[11px] text-purple-200/80">Repels fine dust</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setFilter('coarse-mesh');
                    }}
                    className={`flex items-center gap-3 rounded-2xl border-2 p-3.5 text-left transition-all ${
                      filter === 'coarse-mesh'
                        ? 'border-sky-300 bg-sky-500/20 text-white'
                        : 'border-[#462A72] bg-[#190B2E] text-purple-200 hover:border-sky-400'
                    }`}
                  >
                    <Wind className="h-6 w-6 text-orange-300 shrink-0" />
                    <div>
                      <div className="text-sm font-bold">Wide Mesh</div>
                      <div className="text-[11px] text-purple-200/80">Standard open grid</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={launchFlight}
                className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-white border-b-4 bg-gradient-to-b from-[#FDE047] to-[#EAB308] px-8 text-base font-bold text-slate-950 shadow-lg hover:scale-105 active:scale-95 transition-transform"
              >
                <Play className="h-5 w-5" />
                <span>Launch & Pilot Capsule!</span>
              </button>
            </div>
          </section>
        )}

        {phase === 'FLYING' && (
          <div className="flex flex-col gap-3">
            <PrepLabCanvas
              destination={isMoon ? 'moon' : 'mars'}
              commander={save.commander}
              podX={podX}
              podY={podY}
              thrusting={thrusting}
              coating={coating}
              filter={filter}
              integrity={integrity}
              skyItems={skyItems}
              flashMsg={flashMsg}
              landedZone={landedZone}
              reducedStimuli={save.settings.reducedStimuli}
            />

            {/* Big Kid-Friendly Flight Controls */}
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onPointerDown={() => {
                  keysRef.current.left = true;
                }}
                onPointerUp={() => {
                  keysRef.current.left = false;
                }}
                onPointerLeave={() => {
                  keysRef.current.left = false;
                }}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border-2 border-[#543487] bg-[#2D174D] text-sm sm:text-base font-bold text-white active:scale-95 active:border-amber-300 select-none"
              >
                <ArrowLeft className="h-5 w-5 text-amber-300" />
                <span>Left</span>
              </button>

              <button
                type="button"
                onPointerDown={() => {
                  keysRef.current.brake = true;
                  setThrusting(true);
                }}
                onPointerUp={() => {
                  keysRef.current.brake = false;
                  setThrusting(false);
                }}
                onPointerLeave={() => {
                  keysRef.current.brake = false;
                  setThrusting(false);
                }}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border-2 border-sky-300 bg-sky-500/25 text-sm sm:text-base font-bold text-white active:scale-95 select-none"
              >
                <ArrowDown className="h-5 w-5 text-sky-300 rotate-180" />
                <span>Brake</span>
              </button>

              <button
                type="button"
                onPointerDown={() => {
                  keysRef.current.right = true;
                }}
                onPointerUp={() => {
                  keysRef.current.right = false;
                }}
                onPointerLeave={() => {
                  keysRef.current.right = false;
                }}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border-2 border-[#543487] bg-[#2D174D] text-sm sm:text-base font-bold text-white active:scale-95 active:border-amber-300 select-none"
              >
                <span>Right</span>
                <ArrowRight className="h-5 w-5 text-amber-300" />
              </button>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-[#462A72] bg-[#21103A] px-4 py-2">
              <AstroCompanion mood={astroDialogue?.mood ?? 'curious'} showCaptions={false} size={38} />
              <p className="text-xs sm:text-sm font-medium text-purple-100">
                {astroDialogue?.text ?? 'Use Left / Right (or arrow keys) to land on the green pad!'}
              </p>
            </div>
          </div>
        )}

        {phase === 'RESULTS' && (
          <section
            className={`mx-auto my-auto w-full max-w-2xl rounded-3xl border-2 bg-[#24123F] p-6 sm:p-8 text-center shadow-2xl ${
              won ? 'border-emerald-400/70' : 'border-rose-400/70'
            }`}
          >
            <div className="flex items-end justify-center gap-4">
              <CommanderSprite profile={save.commander} size={86} isCelebrating={won} />
              <AstroCompanion mood={won ? 'happy' : 'alert'} showCaptions={false} size={64} />
            </div>

            <div className="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300">
              <Sparkles className="h-4 w-4" />
              <span>Mission 01 · Integrity {integrity}%</span>
            </div>

            <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-white">
              {won
                ? `Perfect Landing on ${destinationLabel}!`
                : landedZone === 'deep-crater'
                  ? 'You Landed in the Dark Crater!'
                  : landedZone === 'steep-slope'
                    ? 'Capsule Hit the Rocks!'
                    : 'Capsule Took Damage!'}
            </h2>
            <p className="mt-2 text-sm text-purple-100/90">
              {won
                ? 'You landed in the sunlit zone and your parts will help the base in Mission 2!'
                : 'Equip Gold Blanket + Electric Filter and guide the capsule to the green center!'}
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setPhase('EQUIP');
                }}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#543487] bg-[#2D174D] px-4 text-xs font-bold text-white hover:border-amber-300"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Swap Parts & Fly</span>
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

              {won && (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setRoute('MISSION_2');
                  }}
                  className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-white border-b-4 bg-gradient-to-b from-[#FDE047] to-[#EAB308] px-6 text-xs font-bold text-slate-950 shadow-lg hover:scale-105 transition-transform"
                >
                  <span>Mission 2</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </section>
        )}
      </main>

      <DiscoveryCodexModal open={codexOpen} onClose={() => setCodexOpen(false)} />
    </div>
  );
};
