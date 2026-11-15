import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Compass, Map, Shirt, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { useCharacterMovement } from '../../hooks/useCharacterMovement';
import { Vec2 } from '../../types/game';
import { soundEngine } from '../../utils/soundEngine';
import { TouchControls } from '../engine/TouchControls';
import { ConduitLine3D, SpaceViewport3D } from '../three/SpaceViewport3D';
import { WorldPropDef } from '../three/models/BaseStructures3D';

type DestinationId = 'mars' | 'moon';

interface PlanetPanelNode {
  id: DestinationId;
  title: string;
  subtitle: string;
  pos: Vec2;
}

const PLANET_PANELS: PlanetPanelNode[] = [
  {
    id: 'mars',
    title: 'MARS',
    subtitle: 'Red Desert & Mountains',
    pos: { x: 32, y: 46 },
  },
  {
    id: 'moon',
    title: 'MOON',
    subtitle: 'Craters & Lunar Plains',
    pos: { x: 60, y: 46 },
  },
];

const EQUIP_DOOR_POS: Vec2 = { x: 87, y: 58 };

export const DestinationRoom: React.FC = () => {
  const { save, setRoute, selectDestination, sayAstro, astroDialogue, toggleSetting } = useGame();

  const [chosenDest, setChosenDest] = useState<DestinationId | null>(null);
  const [guidedAstroPos, setGuidedAstroPos] = useState<Vec2 | null>(null);
  const [pendingPanel, setPendingPanel] = useState<DestinationId | null>(null);
  const enteredEquipRoomRef = useRef(false);
  const commanderName = save.commander.commanderName || 'Nova';

  const obstacles = useMemo(
    () => [
      ...PLANET_PANELS.map((p) => ({ x: p.pos.x, y: p.pos.y, r: 6.2 })),
      { x: EQUIP_DOOR_POS.x + 2, y: EQUIP_DOOR_POS.y, r: 4.5 },
    ],
    []
  );

  const { pos, astroPos, isMoving, setClickTarget, setDpadDir, stopDpad } =
    useCharacterMovement({
      initialPos: { x: 15, y: 66 },
      bounds: { minX: 9, maxX: 91, minY: 28, maxY: 86 },
      speed: 29,
      paused: false,
      obstacles,
    });

  // ASTRO introduces the Moon and Mars exploration challenges on entry
  useEffect(() => {
    sayAstro(
      'There are exploration challenges on the Moon and Mars! Choose a planetary pedestal for us to investigate and explore.',
      'curious',
      7000
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nearestPanel = useMemo(() => {
    if (chosenDest) return null;
    let closest: { panel: PlanetPanelNode; dist: number } | null = null;
    for (const panel of PLANET_PANELS) {
      const dist = Math.hypot(panel.pos.x - pos.x, panel.pos.y - pos.y);
      if (dist < 17 && (!closest || dist < closest.dist)) {
        closest = { panel, dist };
      }
    }
    return closest?.panel ?? null;
  }, [chosenDest, pos.x, pos.y]);

  const enterEquipmentRoom = useCallback(() => {
    if (enteredEquipRoomRef.current) return;
    enteredEquipRoomRef.current = true;
    soundEngine.playSuccess();
    setRoute('PROLOGUE');
  }, [setRoute]);

  const chooseDestination = useCallback(
    (dest: DestinationId) => {
      if (chosenDest) return;
      selectDestination(dest);
      setChosenDest(dest);
      soundEngine.playSuccess();
      sayAstro(
        dest === 'mars'
          ? `Destination chosen: Mars! Now come with me to the Equipment Room to suit up, Commander ${commanderName}!`
          : `Destination chosen: Moon! Now come with me to the Equipment Room to suit up, Commander ${commanderName}!`,
        'happy',
        7000
      );

      // Animate ASTRO gliding ahead toward the open Equipment Room door while staying in close-up frame
      const startX = astroPos.x;
      const startY = astroPos.y;
      const endX = Math.min(77, Math.max(pos.x + 8.5, startX + 7));
      const endY = 56;
      const duration = save.settings.reducedStimuli ? 400 : 1200;
      const startTime = performance.now();

      const animateGuide = (now: number) => {
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        setGuidedAstroPos({
          x: startX + (endX - startX) * eased,
          y: startY + (endY - startY) * eased + Math.sin(eased * Math.PI) * -3,
        });
        if (t < 1) {
          requestAnimationFrame(animateGuide);
        }
      };
      requestAnimationFrame(animateGuide);
    },
    [astroPos.x, astroPos.y, chosenDest, commanderName, pos.x, save.settings.reducedStimuli, sayAstro, selectDestination]
  );

  useEffect(() => {
    if (!pendingPanel || chosenDest) return;
    const target = PLANET_PANELS.find((p) => p.id === pendingPanel);
    if (!target) return;
    if (Math.hypot(target.pos.x - pos.x, target.pos.y - pos.y) < 15) {
      setPendingPanel(null);
      chooseDestination(target.id);
    }
  }, [chooseDestination, chosenDest, pendingPanel, pos.x, pos.y]);

  const distToEquipDoor = Math.hypot(pos.x - EQUIP_DOOR_POS.x, pos.y - EQUIP_DOOR_POS.y);
  const nearEquipDoor = chosenDest !== null && distToEquipDoor < 13.5;

  useEffect(() => {
    if (chosenDest && distToEquipDoor < 10.5) {
      enterEquipmentRoom();
    }
  }, [chosenDest, distToEquipDoor, enterEquipmentRoom]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'e' || e.key === 'Enter' || e.key === ' ') {
        if (nearEquipDoor) {
          e.preventDefault();
          enterEquipmentRoom();
        } else if (nearestPanel && !chosenDest) {
          e.preventDefault();
          chooseDestination(nearestPanel.id);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [chooseDestination, chosenDest, enterEquipmentRoom, nearEquipDoor, nearestPanel]);

  const handleWalkToEquipDoor = useCallback(() => {
    soundEngine.playClick();
    setClickTarget(EQUIP_DOOR_POS.x - 4, EQUIP_DOOR_POS.y);
  }, [setClickTarget]);

  const handlePropClick = useCallback(
    (propId: string) => {
      if (propId === 'mars' || propId === 'moon') {
        if (!chosenDest) chooseDestination(propId);
        return;
      }
      if (propId === 'equip_door') {
        if (!chosenDest) {
          soundEngine.playGentleError();
          sayAstro('Choose a destination first: Moon or Mars!', 'curious', 4000);
          return;
        }
        if (nearEquipDoor) enterEquipmentRoom();
        else handleWalkToEquipDoor();
      }
    },
    [chooseDestination, chosenDest, enterEquipmentRoom, handleWalkToEquipDoor, nearEquipDoor, sayAstro]
  );

  const activeAstroPos = guidedAstroPos
    ? {
        x: Math.min(77, Math.max(guidedAstroPos.x, pos.x + 6.5)),
        y: guidedAstroPos.y * 0.5 + (pos.y - 2) * 0.5,
      }
    : astroPos;

  const props3D = useMemo<WorldPropDef[]>(() => {
    const pedestals: WorldPropDef[] = PLANET_PANELS.map((panel) => ({
      id: panel.id,
      kind: 'planet_pedestal',
      planetId: panel.id,
      xPct: panel.pos.x,
      yPct: panel.pos.y,
      label: chosenDest === panel.id ? `${panel.title} ✓` : panel.title,
      sublabel: panel.subtitle,
      active: chosenDest === panel.id,
      near: nearestPanel?.id === panel.id,
    }));

    pedestals.push({
      id: 'equip_door',
      kind: 'door_portal',
      xPct: EQUIP_DOOR_POS.x,
      yPct: EQUIP_DOOR_POS.y,
      label: 'Equipment Room',
      sublabel: chosenDest
        ? nearEquipDoor
          ? '[E] Enter & Suit Up'
          : 'Follow ASTRO →'
        : 'Choose destination',
      active: chosenDest !== null,
      near: nearEquipDoor,
    });

    return pedestals;
  }, [chosenDest, nearEquipDoor, nearestPanel?.id]);

  const conduits3D = useMemo<ConduitLine3D[]>(() => {
    if (!chosenDest) return [];
    return [
      {
        from: pos,
        to: EQUIP_DOOR_POS,
        color: '#FACC15',
        active: true,
      },
    ];
  }, [chosenDest, pos]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#1B0D2E] text-slate-100 select-none">
      {/* Room Top Bar */}
      <header className="z-20 flex flex-wrap items-center justify-between gap-3 border-b border-[#462A72] bg-[#21103A] px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="font-display text-lg font-bold tracking-tight text-amber-300">
            Space Base Commander
          </span>
          <span className="text-purple-400/60" aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-300">
            <Compass className="h-3.5 w-3.5" />
            3D Destination Room · Moon & Mars
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setRoute('PROLOGUE');
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#543487] bg-[#2D174D] px-3 text-xs font-semibold text-purple-100 hover:border-sky-300"
          >
            <Shirt className="h-3.5 w-3.5 text-sky-300" />
            <span>Suit Up</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setRoute('CAMPAIGN_MAP');
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#543487] bg-[#2D174D] px-3 text-xs font-semibold text-purple-100 hover:border-amber-300"
          >
            <Map className="h-3.5 w-3.5 text-amber-300" />
            <span>All Missions</span>
          </button>
          <button
            type="button"
            onClick={() => {
              toggleSetting('soundEnabled');
              soundEngine.playClick();
            }}
            aria-label={save.settings.soundEnabled ? 'Mute sound' : 'Enable sound'}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#543487] bg-[#2D174D] text-white hover:border-sky-300"
          >
            {save.settings.soundEnabled ? (
              <Volume2 className="h-4 w-4 text-sky-300" />
            ) : (
              <VolumeX className="h-4 w-4 text-purple-300/60" />
            )}
          </button>
        </div>
      </header>

      {/* Real-Time Three.js 3D Destination Selection Room */}
      <main className="relative flex-1 overflow-hidden cursor-pointer">
        <SpaceViewport3D
          mode="indoor"
          destination={chosenDest ?? 'mars'}
          commanderProfile={save.commander}
          commanderPos={pos}
          commanderMoving={isMoving}
          commanderCelebrating={chosenDest !== null && !isMoving}
          astroPos={activeAstroPos}
          astroMood={chosenDest ? 'happy' : (astroDialogue?.mood ?? 'curious')}
          astroCaption={astroDialogue?.text ?? null}
          astroPointingTo={chosenDest ? 'right' : null}
          showCaptions={save.settings.captionsEnabled}
          props={props3D}
          conduits={conduits3D}
          reducedStimuli={save.settings.reducedStimuli}
          onGroundClick={(x, y) => {
            setPendingPanel(null);
            setClickTarget(x, y);
          }}
          onPropClick={handlePropClick}
          cameraMode="follow"
        />

        {/* Compact ASTRO Prompt Bar at Bottom */}
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex w-[92vw] max-w-2xl flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-[#543487] bg-[#21103A]/95 px-4 py-3 shadow-2xl"
        >
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-white">
            <Sparkles className="h-4 w-4 text-amber-300 shrink-0" />
            <span>
              {chosenDest
                ? `Destination: ${chosenDest === 'mars' ? 'Mars' : 'Moon'}! Come with me to the Equipment Room to suit up.`
                : 'ASTRO: "We have challenges on the Moon and Mars. Choose a 3D globe to explore!"'}
            </span>
          </div>

          {!chosenDest ? (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => chooseDestination('mars')}
                className="inline-flex h-9 items-center gap-1 rounded-full border border-orange-300/80 bg-orange-500/20 px-3 text-xs font-bold text-orange-200 hover:bg-orange-500/35"
              >
                <span>Mars</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => chooseDestination('moon')}
                className="inline-flex h-9 items-center gap-1 rounded-full border border-sky-300/80 bg-sky-400/20 px-3 text-xs font-bold text-sky-200 hover:bg-sky-400/35"
              >
                <span>Moon</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleWalkToEquipDoor}
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border-2 border-white border-b-4 bg-gradient-to-b from-[#FDE047] to-[#EAB308] px-4 text-xs font-bold text-slate-950 shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              <Shirt className="h-3.5 w-3.5" />
              <span>Go Suit Up</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </main>

      <TouchControls
        onMoveDir={setDpadDir}
        onStopMove={stopDpad}
        onInteract={() => {
          if (nearEquipDoor) enterEquipmentRoom();
          else if (chosenDest) handleWalkToEquipDoor();
          else if (nearestPanel) chooseDestination(nearestPanel.id);
        }}
        interactLabel={
          chosenDest
            ? nearEquipDoor
              ? 'Enter Room'
              : 'Go to Equipment'
            : nearestPanel
              ? `Explore ${nearestPanel.title}`
              : null
        }
      />
    </div>
  );
};
