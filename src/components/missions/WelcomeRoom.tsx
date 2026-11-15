import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { useCharacterMovement } from '../../hooks/useCharacterMovement';
import { Vec2 } from '../../types/game';
import { soundEngine } from '../../utils/soundEngine';
import { TouchControls } from '../engine/TouchControls';
import { ConduitLine3D, SpaceViewport3D } from '../three/SpaceViewport3D';
import { WorldPropDef } from '../three/models/BaseStructures3D';

const EXIT_DOOR_POS: Vec2 = { x: 85, y: 58 };

export const WelcomeRoom: React.FC = () => {
  const { save, setRoute, sayAstro, astroDialogue, toggleSetting } = useGame();

  const [phase, setPhase] = useState<'approaching' | 'introduced' | 'guiding'>('approaching');
  const [scriptedAstroPos, setScriptedAstroPos] = useState<Vec2>({ x: 70, y: 48 });
  const [exitDoorOpen, setExitDoorOpen] = useState(false);
  const [commanderWave, setCommanderWave] = useState(false);
  const enteredNextRoomRef = useRef(false);

  const commanderName = save.commander.commanderName || 'Nova';

  const obstacles = useMemo(
    () => [{ x: EXIT_DOOR_POS.x + 2, y: EXIT_DOOR_POS.y, r: 4.5 }],
    []
  );

  // Commander movement unlocked once ASTRO starts guiding to the door
  const { pos, isMoving, setClickTarget, setDpadDir, stopDpad } =
    useCharacterMovement({
      initialPos: { x: 24, y: 60 },
      bounds: { minX: 10, maxX: 90, minY: 30, maxY: 84 },
      speed: 29,
      paused: phase !== 'guiding',
      obstacles,
    });

  // Phase 1: ASTRO flies across the 3D station hall to Commander and introduces himself as assistant
  useEffect(() => {
    const startX = 70;
    const startY = 48;
    const endX = 32;
    const endY = 58;
    const duration = save.settings.reducedStimuli ? 450 : 1400;
    const startTime = performance.now();

    const doorTimer = setTimeout(() => {
      soundEngine.playScan();
    }, 150);

    let frameId: number;
    const animateApproach = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const x = startX + (endX - startX) * eased;
      const y = startY + (endY - startY) * eased + Math.sin(eased * Math.PI) * -4;
      setScriptedAstroPos({ x, y });

      if (t < 1) {
        frameId = requestAnimationFrame(animateApproach);
      } else {
        setPhase('introduced');
        setCommanderWave(true);
        soundEngine.playSuccess();
        sayAstro(
          `Hello, Commander ${commanderName}! I'm ASTRO, your space assistant!`,
          'happy',
          4000
        );
        setTimeout(() => setCommanderWave(false), 1400);
      }
    };

    frameId = requestAnimationFrame(animateApproach);

    return () => {
      clearTimeout(doorTimer);
      cancelAnimationFrame(frameId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startGuidingToDoor = useCallback(() => {
    setPhase((curr) => (curr === 'introduced' ? 'guiding' : curr));
  }, []);

  useEffect(() => {
    if (phase !== 'introduced') return;
    const autoGuideTimer = setTimeout(() => {
      startGuidingToDoor();
    }, save.settings.reducedStimuli ? 1800 : 3200);
    return () => clearTimeout(autoGuideTimer);
  }, [phase, save.settings.reducedStimuli, startGuidingToDoor]);

  // Animate ASTRO moving from beside Commander to the Exit Door when phase === 'guiding'
  useEffect(() => {
    if (phase !== 'guiding') return;
    setExitDoorOpen(true);
    soundEngine.playScan();
    sayAstro(
      'Follow me to the Destination Room door! I have the Moon and Mars to show you.',
      'curious',
      6500
    );

    const startX = 32;
    const startY = 58;
    const endX = 41;
    const endY = 57;
    const duration = save.settings.reducedStimuli ? 400 : 1250;
    const startTime = performance.now();

    let frameId: number;
    const animateGuide = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setScriptedAstroPos({
        x: startX + (endX - startX) * eased,
        y: startY + (endY - startY) * eased + Math.sin(eased * Math.PI) * -3,
      });
      if (t < 1) {
        frameId = requestAnimationFrame(animateGuide);
      }
    };
    frameId = requestAnimationFrame(animateGuide);
    return () => cancelAnimationFrame(frameId);
  }, [phase, save.settings.reducedStimuli, sayAstro]);

  const enterDestinationRoom = useCallback(() => {
    if (enteredNextRoomRef.current) return;
    enteredNextRoomRef.current = true;
    soundEngine.playSuccess();
    setRoute('DESTINATION_ROOM');
  }, [setRoute]);

  const distToDoor = Math.hypot(pos.x - EXIT_DOOR_POS.x, pos.y - EXIT_DOOR_POS.y);
  const nearDoor = phase === 'guiding' && distToDoor < 13.5;

  useEffect(() => {
    if (phase === 'guiding' && distToDoor < 10.5) {
      enterDestinationRoom();
    }
  }, [distToDoor, enterDestinationRoom, phase]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (phase !== 'guiding') return;
      if ((e.key.toLowerCase() === 'e' || e.key === 'Enter' || e.key === ' ') && nearDoor) {
        e.preventDefault();
        enterDestinationRoom();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enterDestinationRoom, nearDoor, phase]);

  const handleWalkToDoor = useCallback(() => {
    soundEngine.playClick();
    if (phase === 'introduced') {
      startGuidingToDoor();
    }
    setClickTarget(EXIT_DOOR_POS.x - 4, EXIT_DOOR_POS.y);
  }, [phase, setClickTarget, startGuidingToDoor]);

  const activeCommanderPos = phase === 'guiding' ? pos : { x: 24, y: 60 };
  const activeAstroPos =
    phase === 'guiding'
      ? {
          x: Math.min(76, Math.max(scriptedAstroPos.x, activeCommanderPos.x + 7.5)),
          y: scriptedAstroPos.y * 0.5 + (activeCommanderPos.y - 2) * 0.5,
        }
      : scriptedAstroPos;
  const astroPointing: 'left' | 'right' = phase === 'guiding' ? 'right' : 'left';

  const props3D = useMemo<WorldPropDef[]>(
    () => [
      {
        id: 'exit_door',
        kind: 'door_portal',
        xPct: EXIT_DOOR_POS.x,
        yPct: EXIT_DOOR_POS.y,
        label: 'Destination Room',
        sublabel:
          phase === 'guiding'
            ? nearDoor
              ? '[E] Enter Room'
              : 'Walk over here →'
            : 'Door Closed',
        active: exitDoorOpen,
        near: nearDoor,
      },
    ],
    [exitDoorOpen, nearDoor, phase]
  );

  const conduits3D = useMemo<ConduitLine3D[]>(
    () => [
      {
        from: activeCommanderPos,
        to: EXIT_DOOR_POS,
        color: phase === 'guiding' ? '#FACC15' : '#462A72',
        active: phase === 'guiding',
      },
    ],
    [activeCommanderPos, phase]
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#1B0D2E] text-slate-100 select-none">
      {/* Top Room Header */}
      <header className="z-20 flex items-center justify-between gap-4 border-b border-[#462A72] bg-[#21103A] px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="font-display text-lg font-bold tracking-tight text-amber-300">
            Space Base Commander
          </span>
          <span className="text-purple-400/60" aria-hidden="true">·</span>
          <span className="text-xs font-medium text-sky-300">3D Base Reception Hall</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              toggleSetting('soundEnabled');
              soundEngine.playClick();
            }}
            aria-label={save.settings.soundEnabled ? 'Mute sound' : 'Enable sound'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#543487] bg-[#2D174D] text-white hover:border-sky-300"
          >
            {save.settings.soundEnabled ? (
              <Volume2 className="h-4 w-4 text-sky-300" />
            ) : (
              <VolumeX className="h-4 w-4 text-purple-300/60" />
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setRoute('TITLE');
            }}
            className="h-10 rounded-xl border border-[#543487] bg-[#2D174D] px-3.5 text-xs font-semibold text-purple-100 hover:border-amber-300"
          >
            Home
          </button>
        </div>
      </header>

      {/* Real-Time Three.js 3D Pressurized Station Reception Hall */}
      <main className="relative flex-1 overflow-hidden cursor-pointer">
        <SpaceViewport3D
          mode="indoor"
          destination={save.selectedDestination === 'moon' ? 'moon' : 'mars'}
          commanderProfile={save.commander}
          commanderPos={activeCommanderPos}
          commanderMoving={isMoving}
          commanderCelebrating={commanderWave}
          astroPos={activeAstroPos}
          astroMood={phase === 'approaching' ? 'curious' : (astroDialogue?.mood ?? 'happy')}
          astroCaption={
            phase === 'approaching'
              ? 'Coming over to you...'
              : astroDialogue?.text ?? null
          }
          astroPointingTo={astroPointing}
          showCaptions={save.settings.captionsEnabled}
          props={props3D}
          conduits={conduits3D}
          reducedStimuli={save.settings.reducedStimuli}
          onGroundClick={(x, y) => {
            if (phase === 'guiding') setClickTarget(x, y);
          }}
          onPropClick={(propId) => {
            if (propId === 'exit_door') {
              if (nearDoor) enterDestinationRoom();
              else handleWalkToDoor();
            }
          }}
          cameraMode="follow"
        />

        {/* Bottom Dialogue & Guidance Action Bar */}
        {phase !== 'approaching' && (
          <div
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 w-[92vw] max-w-2xl rounded-2xl border-2 border-[#543487] bg-[#21103A]/95 p-4 shadow-2xl"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sky-300">
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  <span>ASTRO · Your Assistant</span>
                </div>
                <p className="text-sm font-semibold text-white">
                  {phase === 'introduced'
                    ? `"Hello, Commander ${commanderName}! I'm ASTRO, your space assistant!"`
                    : '"Come with me to the door! Let\'s choose our next exploration destination."'}
                </p>
              </div>

              <button
                type="button"
                onClick={phase === 'introduced' ? startGuidingToDoor : handleWalkToDoor}
                className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full border-2 border-white border-b-4 bg-gradient-to-b from-[#FDE047] to-[#EAB308] px-5 text-sm font-bold text-slate-950 shadow-lg transition-transform hover:scale-105 active:scale-95 whitespace-nowrap"
              >
                <span>{phase === 'introduced' ? 'Follow ASTRO' : 'Go to Door'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      {phase === 'guiding' && (
        <TouchControls
          onMoveDir={setDpadDir}
          onStopMove={stopDpad}
          onInteract={() => {
            if (nearDoor) enterDestinationRoom();
            else handleWalkToDoor();
          }}
          interactLabel={nearDoor ? 'Enter Room' : 'Go to Door'}
        />
      )}
    </div>
  );
};
