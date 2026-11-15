import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BatteryCharging,
  CheckCircle2,
  Droplets,
  Filter,
  Flame,
  Hammer,
  Play,
  Radar,
  RotateCcw,
  Snowflake,
  Sparkles,
  Sun,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { soundEngine } from '../../utils/soundEngine';
import { AstroCompanion } from '../engine/AstroCompanion';
import { CommanderSprite } from '../engine/CommanderSprite';
import { DiscoveryCodexModal } from '../engine/DiscoveryCodexModal';
import { GameHUD } from '../engine/GameHUD';
import { WaterResourceCanvas } from './mission4/WaterResourceCanvas';
import { WaterZoneId, getWaterZones } from './mission4/waterResourceService';

type Phase = 'BRIEFING' | 'EXPLORING' | 'RESULTS';

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

  const destination = save.selectedDestination === 'moon' ? 'moon' : 'mars';
  const isMoon = destination === 'moon';
  const destinationLabel = isMoon ? 'Moon' : 'Mars';
  const commanderName = save.commander.commanderName || 'Nova';

  const zones = useMemo(() => getWaterZones(destination), [destination]);

  const [phase, setPhase] = useState<Phase>('BRIEFING');
  const [selectedZoneId, setSelectedZoneId] = useState<WaterZoneId>(zones[0].id);
  const [scannedIds, setScannedIds] = useState<WaterZoneId[]>([zones[0].id]);
  const [radarSweeping, setRadarSweeping] = useState(false);

  const [battery, setBattery] = useState(100);
  const [drillDepth, setDrillDepth] = useState(0);
  const [drillHeat, setDrillHeat] = useState(0);
  const [drillJammed, setDrillJammed] = useState(false);

  const [rawWaterPct, setRawWaterPct] = useState(0);
  const [dustFiltered, setDustFiltered] = useState(false);
  const [saltFiltered, setSaltFiltered] = useState(false);
  const [waterConfirmed, setWaterConfirmed] = useState(false);
  const [usedDirtyWater, setUsedDirtyWater] = useState(false);

  const [codexOpen, setCodexOpen] = useState(false);

  const selectedZone = zones.find((z) => z.id === selectedZoneId) ?? zones[0];

  const handleSelectAndScanZone = (id: WaterZoneId) => {
    soundEngine.playScan();
    setSelectedZoneId(id);
    setDrillDepth(0);
    setDrillHeat(0);
    setDrillJammed(false);
    setRadarSweeping(true);

    window.setTimeout(() => {
      setRadarSweeping(false);
      if (!scannedIds.includes(id)) {
        setScannedIds((prev) => [...prev, id]);
        recordBehavioralEvent('explore');
      }
      const z = zones.find((item) => item.id === id);
      if (z) {
        if (z.isOptimalSource) {
          soundEngine.playSuccess();
          sayAstro(
            isMoon
              ? 'Ice found in the Dark Crater! Drill carefully so the drill does not overheat!'
              : 'Subsurface ice found by the radar! Drill this zone to fill the tank!',
            'happy',
            6000
          );
        } else if (z.rawWaterYield > 0) {
          sayAstro(
            isMoon
              ? 'Almost no ice here — but there is good sunlight on this rim!'
              : 'Ancient clay! Proof there was water millions of years ago, but it yields very little ice.',
            'curious',
            5500
          );
        } else {
          sayAstro(
            isMoon
              ? 'It is +95 °C in the sun here: 0% ice, but it recharges the battery!'
              : 'Dry dunes: 0% ice down here!',
            'curious',
            5000
          );
        }
      }
    }, 450);
  };

  const handleDrillStep = () => {
    if (drillJammed || drillDepth >= 100) return;

    const stepBatteryCost = selectedZone.isOptimalSource ? 7 : 5;
    if (battery < stepBatteryCost) {
      soundEngine.playGentleError();
      sayAstro('Low battery! Click Solar Recharge!', 'alert', 4500);
      return;
    }

    const nextHeat = drillHeat + 28;
    if (nextHeat >= 100) {
      soundEngine.playGentleError();
      setDrillHeat(100);
      setDrillJammed(true);
      setBattery((b) => Math.max(0, b - 10));
      recordBehavioralEvent('adapt');
      sayAstro('Drill overheated (-10% battery)! Click Cool Down!', 'alert', 5000);
      return;
    }

    soundEngine.playClick();
    setBattery((b) => Math.max(0, b - stepBatteryCost));
    setDrillHeat(nextHeat);
    const nextDepth = Math.min(100, drillDepth + 25);
    setDrillDepth(nextDepth);

    if (nextDepth >= 100) {
      if (selectedZone.isOptimalSource) {
        soundEngine.playWaterCollect();
        setRawWaterPct(100);
        recordDecision({
          m4CollectedRawWaterFirst: true,
          m4RecommendedZone: selectedZone.name,
        });
        sayAstro(
          '100% ice extracted! But it is dirty — use the 2 filters to clean the water!',
          'happy',
          6000
        );
      } else if (selectedZone.rawWaterYield > 0) {
        soundEngine.playGentleError();
        setRawWaterPct((r) => Math.min(100, r + selectedZone.rawWaterYield));
        recordDecision({ m4TestedPoorZone: true });
        recordBehavioralEvent('adapt');
        sayAstro(
          `Only yielded ${selectedZone.rawWaterYield}% ice! Try drilling the blue zone on the radar.`,
          'alert',
          5500
        );
      } else {
        soundEngine.playGentleError();
        recordDecision({ m4TestedPoorZone: true });
        recordBehavioralEvent('adapt');
        sayAstro(
          'Only dry dust (0% ice)! You spent battery for nothing — pick another zone on the radar.',
          'alert',
          5500
        );
      }
    }
  };

  const handleCoolDrill = () => {
    soundEngine.playClick();
    setDrillHeat((h) => Math.max(0, h - 50));
    setDrillJammed(false);
  };

  const handleRechargeSolar = () => {
    soundEngine.playPickup();
    setSelectedZoneId(zones[0].id);
    setDrillDepth(0);
    setDrillHeat(0);
    setDrillJammed(false);
    setBattery((b) => Math.min(100, b + 40));
    sayAstro('Battery recharged in the sun (+40%)!', 'happy', 3500);
  };

  const purifiedPct =
    rawWaterPct < 100 ? 0 : dustFiltered && saltFiltered ? 100 : dustFiltered || saltFiltered ? 55 : 20;

  const handleConfirmWater = (riskyDirty: boolean) => {
    if (rawWaterPct < 100) return;
    if (riskyDirty) {
      soundEngine.playGentleError();
      setUsedDirtyWater(true);
      recordDecision({
        m4CollectedRawWaterFirst: true,
        m4PurifiedWaterPct: 30,
        m4RecommendedZone: selectedZone.name,
      });
      recordBehavioralEvent('adapt');
      unlockDiscovery('disc-gpm-rainfall');
      completeMission('mission-4', 'badge-rain-hunter', {
        id: isMoon ? 'item-lunar-ice-purifier' : 'item-mars-ice-purifier',
        name: isMoon ? 'Lunar Ice Condenser' : 'Glacial Extractor & Purifier',
        category: 'instrument',
        color: '#38BDF8',
        acquiredIn: 'mission-4',
      });
      setWaterConfirmed(true);
      setPhase('RESULTS');
      sayAstro(
        'Warning: you sent water that is still dirty! In Mission 5 the greenhouse will struggle with the dust!',
        'alert',
        6500
      );
      return;
    }

    soundEngine.playSuccess();
    setUsedDirtyWater(false);
    recordDecision({
      m4CollectedRawWaterFirst: true,
      m4PurifiedWaterPct: 100,
      m4RecommendedZone: selectedZone.name,
    });
    recordBehavioralEvent('apply', 'm4-purified-water');
    unlockDiscovery('disc-gpm-rainfall');
    completeMission('mission-4', 'badge-rain-hunter', {
      id: isMoon ? 'item-lunar-ice-purifier' : 'item-mars-ice-purifier',
      name: isMoon ? 'Lunar Ice Condenser' : 'Glacial Extractor & Purifier',
      category: 'instrument',
      color: '#38BDF8',
      acquiredIn: 'mission-4',
    });
    setWaterConfirmed(true);
    setPhase('RESULTS');
    sayAstro(
      `100% pure water stored, ${commanderName}! It will make the plants grow in Mission 5!`,
      'happy',
      6000
    );
  };

  const resetMission = () => {
    soundEngine.playClick();
    setPhase('BRIEFING');
    setSelectedZoneId(zones[0].id);
    setScannedIds([zones[0].id]);
    setBattery(100);
    setDrillDepth(0);
    setDrillHeat(0);
    setDrillJammed(false);
    setRawWaterPct(0);
    setDustFiltered(false);
    setSaltFiltered(false);
    setWaterConfirmed(false);
    setUsedDirtyWater(false);
  };

  return (
    <div className="min-h-screen bg-[#1B0D2E] text-slate-100 flex flex-col">
      <GameHUD
        missionTitle={
          isMoon
            ? 'Mission 04 · Moon · Lunar Ice Hunt'
            : 'Mission 04 · Mars · Radar & Subsurface Ice'
        }
        goalText={
          phase === 'BRIEFING'
            ? `Find hidden ice on ${destinationLabel} and purify the water!`
            : '1. Scan the zones · 2. Drill the ice without overheating · 3. Filter the water!'
        }
        progressText={
          phase === 'EXPLORING'
            ? `Battery ${battery}% · Pure Water ${purifiedPct}%`
            : undefined
        }
        onBackToMap={() => setRoute('CAMPAIGN_MAP')}
        onOpenCodex={() => setCodexOpen(true)}
        onRepeatHint={() =>
          sayAstro(
            isMoon
              ? 'Tap the Polar Crater (PSR) to see the ice, drill while managing heat, and turn on both filters!'
              : 'Tap Subsurface Ice to scan, drill without overheating, and turn on both filters!',
            'curious',
            7000
          )
        }
      />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-4 sm:px-6">
        {phase === 'BRIEFING' && (
          <section className="mx-auto my-auto w-full max-w-2xl rounded-3xl border-2 border-[#543487] bg-[#24123F] p-6 sm:p-8 shadow-2xl text-center">
            <div className="flex items-end justify-center gap-4">
              <CommanderSprite profile={save.commander} size={86} />
              <AstroCompanion mood="curious" showCaptions={false} size={64} />
            </div>

            <h1 className="mt-4 font-display text-2xl sm:text-3xl font-bold text-white">
              {isMoon ? 'Polar Ice Hunt · Moon' : 'Subsurface Ice Hunt · Mars'}
            </h1>
            <p className="mt-2 text-sm text-purple-100/90">
              {isMoon
                ? 'On the Moon, ice hides inside dark craters (-225 °C) and comes out mixed with dust!'
                : 'On Mars, ice is buried beneath dry ground and needs to be filtered!'}
            </p>

            <div className="mt-5 grid grid-cols-3 gap-3 text-xs font-bold">
              <div className="rounded-2xl border border-[#462A72] bg-[#190B2E] p-3.5 flex flex-col items-center gap-1.5">
                <Radar className="h-6 w-6 text-sky-300" />
                <span className="text-white">1. Subsurface Scan</span>
              </div>
              <div className="rounded-2xl border border-[#462A72] bg-[#190B2E] p-3.5 flex flex-col items-center gap-1.5">
                <Hammer className="h-6 w-6 text-amber-300" />
                <span className="text-white">2. Drill Ice</span>
              </div>
              <div className="rounded-2xl border border-[#462A72] bg-[#190B2E] p-3.5 flex flex-col items-center gap-1.5">
                <Filter className="h-6 w-6 text-emerald-300" />
                <span className="text-white">3. Purify Water</span>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setPhase('EXPLORING');
                  sayAstro(
                    'Tap the 3 zones on the map to scan underground!',
                    'curious',
                    5500
                  );
                }}
                className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-white border-b-4 bg-gradient-to-b from-[#38BDF8] to-[#0284C7] px-8 text-base font-bold text-white shadow-lg hover:scale-105 active:scale-95 transition-transform"
              >
                <Play className="h-5 w-5" />
                <span>Start Radar!</span>
              </button>
            </div>
          </section>
        )}

        {phase === 'EXPLORING' && (
          <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
            {/* Left: Interactive Radar X-Ray & Drill Rig */}
            <div className="flex flex-col gap-3">
              <WaterResourceCanvas
                destination={destination}
                commander={save.commander}
                zones={zones}
                selectedZoneId={selectedZoneId}
                scannedIds={scannedIds}
                drillDepth={drillDepth}
                drillHeat={drillHeat}
                drillJammed={drillJammed}
                radarSweeping={radarSweeping}
                onSelectZone={handleSelectAndScanZone}
              />

              <div className="flex items-center gap-3 rounded-2xl border border-[#462A72] bg-[#21103A] px-4 py-2.5">
                <AstroCompanion
                  mood={astroDialogue?.mood ?? 'curious'}
                  showCaptions={false}
                  size={42}
                />
                <p className="text-xs sm:text-sm font-medium text-purple-100">
                  {astroDialogue?.text ??
                    `Tap a zone to scan underground, then drill!`}
                </p>
              </div>
            </div>

            {/* Right: Drill Controls & Visual Water Tank Purifier */}
            <aside className="flex flex-col justify-between gap-4 rounded-2xl border-2 border-[#543487] bg-[#24123F] p-5">
              <div className="space-y-4">
                {/* Battery & Heat Gauges */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-[#462A72] bg-[#190B2E] p-3">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                      <span className="flex items-center gap-1">
                        <BatteryCharging className="h-4 w-4" /> Battery
                      </span>
                      <span className="font-mono-tabular">{battery}%</span>
                    </div>
                    <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-900">
                      <div
                        className={`h-full transition-all ${battery > 30 ? 'bg-amber-400' : 'bg-rose-500'}`}
                        style={{ width: `${battery}%` }}
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#462A72] bg-[#190B2E] p-3">
                    <div className="flex items-center justify-between text-xs font-bold text-rose-300">
                      <span className="flex items-center gap-1">
                        <Flame className="h-4 w-4" /> Drill Heat
                      </span>
                      <span className="font-mono-tabular">{drillHeat}%</span>
                    </div>
                    <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-900">
                      <div
                        className={`h-full transition-all ${drillHeat < 70 ? 'bg-sky-400' : 'bg-rose-500'}`}
                        style={{ width: `${drillHeat}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Drilling Controls */}
                <div className="rounded-2xl border border-[#462A72] bg-[#190B2E] p-3.5 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-white">Zone: {selectedZone.shortName}</span>
                    <span className="font-mono-tabular text-sky-300">Depth: {drillDepth}%</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      disabled={drillJammed || drillDepth >= 100}
                      onClick={handleDrillStep}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-amber-300 bg-amber-400/20 px-3 text-sm font-bold text-white hover:bg-amber-400/30 active:scale-95 transition-transform disabled:opacity-45"
                    >
                      <Hammer className="h-4 w-4 text-amber-300" />
                      <span>{drillDepth >= 100 ? 'Bottom Reached' : 'Drill!'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCoolDrill}
                      className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 px-3 text-sm font-bold transition-colors ${
                        drillJammed
                          ? 'border-rose-400 bg-rose-500/30 text-white animate-pulse'
                          : 'border-sky-400/60 bg-sky-500/20 text-sky-100 hover:bg-sky-500/30'
                      }`}
                    >
                      <Snowflake className="h-4 w-4 text-sky-300" />
                      <span>Cool Down</span>
                    </button>
                  </div>

                  {battery < 40 && (
                    <button
                      type="button"
                      onClick={handleRechargeSolar}
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-yellow-300/70 bg-yellow-500/20 text-xs font-bold text-yellow-200 hover:bg-yellow-500/30"
                    >
                      <Sun className="h-4 w-4" />
                      <span>Solar Recharge Battery (+40%)</span>
                    </button>
                  )}
                </div>

                {/* Visual Water Tank & 2 Filter Switches */}
                <div className="rounded-2xl border border-sky-400/40 bg-[#180C2C] p-3.5 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-1.5 text-sky-200">
                      <Droplets className="h-4 w-4 text-sky-300" />
                      <span>Water Tank</span>
                    </span>
                    <span
                      className={
                        purifiedPct >= 100
                          ? 'text-emerald-300'
                          : rawWaterPct >= 100
                            ? 'text-amber-300'
                            : 'text-purple-300'
                      }
                    >
                      {rawWaterPct < 100
                        ? `Ice ${rawWaterPct}%`
                        : purifiedPct >= 100
                          ? '100% Crystal Clear ✓'
                          : 'Cloudy Water (Dirty!)'}
                    </span>
                  </div>

                  {/* Animated Visual Water Level Bar */}
                  <div className="h-8 w-full overflow-hidden rounded-xl border border-[#462A72] bg-[#0B0616] relative">
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${rawWaterPct}%`,
                        backgroundColor:
                          purifiedPct >= 100 ? '#38BDF8' : dustFiltered || saltFiltered ? '#64748B' : '#92400E',
                      }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow">
                      {rawWaterPct < 100
                        ? 'Drill the blue zone to fill'
                        : purifiedPct >= 100
                          ? 'Ready for the Base!'
                          : 'Dust + Salts mixed'}
                    </span>
                  </div>

                  {/* 2 Filter Switches */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={rawWaterPct < 100 || dustFiltered}
                      onClick={() => {
                        soundEngine.playWaterCollect();
                        setDustFiltered(true);
                      }}
                      className={`rounded-xl border-2 px-3 py-2.5 text-xs font-bold transition-colors disabled:opacity-45 ${
                        dustFiltered
                          ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                          : 'border-[#543487] bg-[#24123F] text-white hover:border-sky-300'
                      }`}
                    >
                      {dustFiltered ? 'Dust Filtered ✓' : '1. Filter Dust'}
                    </button>

                    <button
                      type="button"
                      disabled={rawWaterPct < 100 || saltFiltered}
                      onClick={() => {
                        soundEngine.playWaterCollect();
                        setSaltFiltered(true);
                      }}
                      className={`rounded-xl border-2 px-3 py-2.5 text-xs font-bold transition-colors disabled:opacity-45 ${
                        saltFiltered
                          ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                          : 'border-[#543487] bg-[#24123F] text-white hover:border-sky-300'
                      }`}
                    >
                      {saltFiltered ? 'Salts Filtered ✓' : '2. Filter Salts'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Final Decision Buttons */}
              <div className="flex flex-col gap-2 pt-2 border-t border-[#462A72]">
                <button
                  type="button"
                  disabled={purifiedPct < 100}
                  onClick={() => handleConfirmWater(false)}
                  className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-b-4 px-5 text-sm font-bold transition-transform ${
                    purifiedPct >= 100
                      ? 'border-white bg-gradient-to-b from-[#34D399] to-[#059669] text-slate-950 shadow-lg hover:scale-[1.02]'
                      : 'border-slate-700 bg-slate-800/70 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Store Pure Water!</span>
                </button>

                {rawWaterPct >= 100 && purifiedPct < 100 && (
                  <button
                    type="button"
                    onClick={() => handleConfirmWater(true)}
                    className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-amber-400/50 bg-amber-500/10 text-xs font-bold text-amber-200 hover:bg-amber-500/20"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Continue without filtering (Risks Mission 5!)</span>
                  </button>
                )}
              </div>
            </aside>
          </div>
        )}

        {phase === 'RESULTS' && waterConfirmed && (
          <section
            className={`mx-auto my-auto w-full max-w-2xl rounded-3xl border-2 bg-[#24123F] p-6 sm:p-8 text-center shadow-2xl ${
              usedDirtyWater ? 'border-amber-400/80' : 'border-emerald-400/70'
            }`}
          >
            <div className="flex items-end justify-center gap-4">
              <CommanderSprite profile={save.commander} size={86} isCelebrating={!usedDirtyWater} />
              <AstroCompanion mood={usedDirtyWater ? 'alert' : 'happy'} showCaptions={false} size={64} />
            </div>

            <div className="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-300">
              <Sparkles className="h-4 w-4" />
              <span>Mission 04 Completed · {destinationLabel}</span>
            </div>

            <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-white">
              {usedDirtyWater
                ? 'Cloudy Water Stored (Careful!)'
                : `100% Pure Water Ready!`}
            </h2>
            <p className="mt-2 text-sm text-purple-100/90">
              {usedDirtyWater
                ? 'You did not filter the water before leaving — the Mission 5 greenhouse will have poor water unless you replay and purify it!'
                : 'You found the hidden ice, controlled the drill, and filtered the water for the Mission 5 greenhouse!'}
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={resetMission}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#543487] bg-[#2D174D] px-4 text-xs font-bold text-white hover:border-amber-300"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Drill Again</span>
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

              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setRoute('MISSION_5');
                }}
                className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-white border-b-4 bg-gradient-to-b from-[#FDE047] to-[#EAB308] px-6 text-xs font-bold text-slate-950 shadow-lg hover:scale-105 transition-transform"
              >
                <span>Mission 5</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        )}
      </main>

      <DiscoveryCodexModal open={codexOpen} onClose={() => setCodexOpen(false)} />
    </div>
  );
};
