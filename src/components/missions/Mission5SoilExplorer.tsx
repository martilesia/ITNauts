import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Droplets,
  Hammer,
  Play,
  RotateCcw,
  Shield,
  Sparkles,
  Sprout,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { soundEngine } from '../../utils/soundEngine';
import { AstroCompanion } from '../engine/AstroCompanion';
import { CommanderSprite } from '../engine/CommanderSprite';
import { DiscoveryCodexModal } from '../engine/DiscoveryCodexModal';
import { GameHUD } from '../engine/GameHUD';
import {
  RegolithCanvas,
  RegolithSampleId,
  getRegolithSamples,
} from './mission5/RegolithCanvas';

type Phase = 'BRIEFING' | 'SOIL_TEST' | 'BUILD' | 'RESULTS';

export const Mission5SoilExplorer: React.FC = () => {
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

  const m4WaterPct = save.campaignMemory?.m4PurifiedWaterPct ?? 0;
  const hasPureM4Water = m4WaterPct >= 100;
  const hasShieldBonus =
    save.campaignMemory?.m1ThermalShield === 'reflective' ||
    (save.campaignMemory?.m2ProtectedCount ?? 0) >= 3;

  const samples = useMemo(() => getRegolithSamples(destination), [destination]);

  const [phase, setPhase] = useState<Phase>('BRIEFING');
  const [testedIds, setTestedIds] = useState<RegolithSampleId[]>([]);
  const [activeTestId, setActiveTestId] = useState<RegolithSampleId | null>(null);
  const [selectedFoundationId, setSelectedFoundationId] = useState<RegolithSampleId>(
    samples[0].id
  );
  const [greenhouseConnected, setGreenhouseConnected] = useState(false);
  const [emergencyFiltered, setEmergencyFiltered] = useState(false);
  const [marsClaysTagged, setMarsClaysTagged] = useState(false);
  const [launchStatus, setLaunchStatus] = useState<'idle' | 'testing' | 'passed' | 'failed'>('idle');
  const [codexOpen, setCodexOpen] = useState(false);

  const selectedSoil = samples.find((s) => s.id === selectedFoundationId) ?? samples[0];
  const waterIsPure = hasPureM4Water || emergencyFiltered;
  const greenhouseHealthy = greenhouseConnected && waterIsPure;

  const handleTestSoil = (id: RegolithSampleId) => {
    soundEngine.playClick();
    setActiveTestId(id);
    if (!testedIds.includes(id)) {
      setTestedIds((prev) => [...prev, id]);
      recordBehavioralEvent('explore');
    }

    const soil = samples.find((s) => s.id === id);
    if (soil) {
      if (soil.isBestFoundation) {
        soundEngine.playSuccess();
        setSelectedFoundationId(id);
        sayAstro(soil.engineeringConsequence, 'happy', 5000);
      } else {
        soundEngine.playGentleError();
        recordBehavioralEvent('adapt');
        sayAstro(soil.engineeringConsequence, 'alert', 5000);
      }
    }

    window.setTimeout(() => {
      setActiveTestId((curr) => (curr === id ? null : curr));
    }, 550);
  };

  const handleInaugurateBase = () => {
    if (launchStatus === 'testing') return;
    soundEngine.playClick();
    setLaunchStatus('testing');
    recordDecision({
      m5SelectedZone: selectedSoil.name,
      m5UsedMission4Water: greenhouseConnected,
    });

    window.setTimeout(() => {
      if (!selectedSoil.isBestFoundation) {
        soundEngine.playGentleError();
        setLaunchStatus('failed');
        recordBehavioralEvent('adapt');
        sayAstro(
          `${selectedSoil.shortName} gave way under the base's weight! Switch to Firm Basalt!`,
          'alert',
          5500
        );
        return;
      }

      if (!greenhouseConnected) {
        soundEngine.playGentleError();
        setLaunchStatus('failed');
        sayAstro('You still need to connect water to the base Greenhouse!', 'alert', 4500);
        return;
      }

      soundEngine.playSuccess();
      setLaunchStatus('passed');
      if (waterIsPure) {
        recordBehavioralEvent('apply', 'm5-reused-m4-water');
      }
      unlockDiscovery('disc-smap-soil');
      completeMission('mission-5', 'badge-soil-scientist', {
        id: isMoon ? 'item-lunar-regolith-pad' : 'item-mars-geology-pad',
        name: isMoon ? 'Lunar Basalt Platform' : 'Martian Foundation & Greenhouse',
        category: 'module',
        color: '#34D399',
        acquiredIn: 'mission-5',
      });

      window.setTimeout(() => {
        setPhase('RESULTS');
        sayAstro(
          `Congratulations, Commander ${commanderName}! The base on ${destinationLabel} is founded and firm!`,
          'happy',
          6500
        );
      }, 900);
    }, 1000);
  };

  const resetMission = () => {
    soundEngine.playClick();
    setPhase('BRIEFING');
    setTestedIds([]);
    setActiveTestId(null);
    setSelectedFoundationId(samples[0].id);
    setGreenhouseConnected(false);
    setEmergencyFiltered(false);
    setMarsClaysTagged(false);
    setLaunchStatus('idle');
  };

  return (
    <div className="min-h-screen bg-[#1B0D2E] text-slate-100 flex flex-col">
      <GameHUD
        missionTitle={`Mission 05 · ${destinationLabel} · Final Base`}
        goalText={
          phase === 'BRIEFING'
            ? `Test the ground and build the final base on ${destinationLabel}!`
            : phase === 'SOIL_TEST'
              ? 'Drop the weight on all 3 soils to discover which one holds the base!'
              : phase === 'BUILD'
                ? 'Choose the firm ground, connect the greenhouse water, and inaugurate the base!'
                : `Base founded on ${destinationLabel}!`
        }
        progressText={
          phase === 'SOIL_TEST' ? `${testedIds.length}/3 Soils tested` : undefined
        }
        onBackToMap={() => setRoute('CAMPAIGN_MAP')}
        onOpenCodex={() => setCodexOpen(true)}
        onRepeatHint={() =>
          sayAstro(
            phase === 'SOIL_TEST'
              ? 'Tap the 3 Drop Weight buttons to see which ground sinks and which stays firm!'
              : 'Pick Firm Basalt, connect pure water to the greenhouse, and press Inaugurate Base!',
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
              <AstroCompanion mood="curious" showCaptions={false} size={64} />
            </div>

            <h1 className="mt-4 font-display text-2xl sm:text-3xl font-bold text-white">
              Final Base Builder · {destinationLabel}
            </h1>
            <p className="mt-2 text-sm text-purple-100/90">
              Time to build the base! First test where the ground does not sink.
            </p>

            <div className="mt-5 grid grid-cols-3 gap-3 text-xs font-bold">
              <div className="rounded-2xl border border-[#462A72] bg-[#190B2E] p-3.5 flex flex-col items-center gap-1.5">
                <Hammer className="h-6 w-6 text-amber-300" />
                <span className="text-white">1. Test Weight</span>
              </div>
              <div className="rounded-2xl border border-[#462A72] bg-[#190B2E] p-3.5 flex flex-col items-center gap-1.5">
                <Sprout className="h-6 w-6 text-emerald-300" />
                <span className="text-white">2. Connect Greenhouse</span>
              </div>
              <div className="rounded-2xl border border-[#462A72] bg-[#190B2E] p-3.5 flex flex-col items-center gap-1.5">
                <Building2 className="h-6 w-6 text-sky-300" />
                <span className="text-white">3. Inaugurate Base</span>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setPhase('SOIL_TEST');
                  sayAstro(
                    'Tap the 3 soils to drop the weight and see which is firmest!',
                    'curious',
                    5500
                  );
                }}
                className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-white border-b-4 bg-gradient-to-b from-[#34D399] to-[#059669] px-8 text-base font-bold text-slate-950 shadow-lg hover:scale-105 active:scale-95 transition-transform"
              >
                <Play className="h-5 w-5" />
                <span>Test the Soil!</span>
              </button>
            </div>
          </section>
        )}

        {phase === 'SOIL_TEST' && (
          <div className="flex flex-col gap-4">
            <RegolithCanvas
              destination={destination}
              commander={save.commander}
              mode="TEST_SOIL"
              samples={samples}
              testedIds={testedIds}
              activeTestId={activeTestId}
              selectedFoundationId={selectedFoundationId}
              greenhouseHealthy={greenhouseHealthy}
              hasShieldBonus={hasShieldBonus}
              launchStatus="idle"
              onTestSoil={handleTestSoil}
            />

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#462A72] bg-[#21103A] px-4 py-3">
              <div className="flex items-center gap-3">
                <AstroCompanion mood={astroDialogue?.mood ?? 'curious'} showCaptions={false} size={42} />
                <p className="text-xs sm:text-sm font-medium text-purple-100">
                  {astroDialogue?.text ?? 'Drop the weight on the soils to find out which holds the base!'}
                </p>
              </div>

              <button
                type="button"
                disabled={testedIds.length < 2}
                onClick={() => {
                  soundEngine.playClick();
                  setPhase('BUILD');
                  sayAstro(
                    'Now pick the soil, connect the greenhouse, and press Inaugurate Base!',
                    'curious',
                    6000
                  );
                }}
                className={`inline-flex h-11 items-center gap-2 rounded-full border-2 border-b-4 px-6 text-xs font-bold transition-transform whitespace-nowrap ${
                  testedIds.length >= 2
                    ? 'border-white bg-gradient-to-b from-[#FDE047] to-[#EAB308] text-slate-950 shadow-lg hover:scale-105'
                    : 'border-slate-700 bg-slate-800/70 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Building2 className="h-4 w-4" />
                <span>Build Base ({testedIds.length}/2+)</span>
              </button>
            </div>
          </div>
        )}

        {phase === 'BUILD' && (
          <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
            <div className="flex flex-col gap-3">
              <RegolithCanvas
                destination={destination}
                commander={save.commander}
                mode="BUILD_BASE"
                samples={samples}
                testedIds={testedIds}
                activeTestId={null}
                selectedFoundationId={selectedFoundationId}
                greenhouseHealthy={greenhouseHealthy}
                hasShieldBonus={hasShieldBonus}
                launchStatus={launchStatus}
                onTestSoil={() => {}}
              />

              <div className="flex items-center gap-3 rounded-2xl border border-[#462A72] bg-[#21103A] px-4 py-2.5">
                <AstroCompanion mood={astroDialogue?.mood ?? 'curious'} showCaptions={false} size={42} />
                <p className="text-xs sm:text-sm font-medium text-purple-100">
                  {astroDialogue?.text ??
                    'Watch the base tilt or stabilize depending on the parts you choose!'}
                </p>
              </div>
            </div>

            {/* Right: Crisp 3-Decision Assembly Board */}
            <aside className="flex flex-col justify-between gap-4 rounded-2xl border-2 border-[#543487] bg-[#24123F] p-5">
              <div className="space-y-4">
                {/* 1. Pick Foundation */}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-2">
                    1. Foundation Soil
                  </div>
                  <div className="grid gap-2">
                    {samples.map((s) => {
                      const picked = selectedFoundationId === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            soundEngine.playClick();
                            setSelectedFoundationId(s.id);
                            setLaunchStatus('idle');
                          }}
                          className={`flex items-center justify-between rounded-xl border-2 px-3.5 py-2.5 text-xs font-bold transition-colors ${
                            picked
                              ? s.isBestFoundation
                                ? 'border-emerald-400 bg-emerald-500/20 text-white'
                                : 'border-amber-300 bg-amber-500/20 text-white'
                              : 'border-[#462A72] bg-[#190B2E] text-purple-100 hover:border-sky-400'
                          }`}
                        >
                          <span>{s.shortName}</span>
                          <span className={s.isBestFoundation ? 'text-emerald-300' : 'text-amber-200'}>
                            {s.stabilityLevel}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Connect Water to Greenhouse (reflects Mission 4 decision!) */}
                <div className="rounded-xl border border-sky-400/50 bg-[#190B2E] p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-1.5 text-sky-300">
                      <Droplets className="h-4 w-4" />
                      <span>2. Base Greenhouse</span>
                    </span>
                    <span className={waterIsPure ? 'text-emerald-300' : 'text-amber-300'}>
                      {waterIsPure ? 'Pure Water (M4) ✓' : 'Cloudy Water!'}
                    </span>
                  </div>

                  {!waterIsPure && (
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playWaterCollect();
                        setEmergencyFiltered(true);
                      }}
                      className="w-full rounded-lg border border-amber-300 bg-amber-500/20 px-3 py-2 text-xs font-bold text-amber-100 hover:bg-amber-500/30"
                    >
                      Filter Cloudy Water Now!
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playSuccess();
                      setGreenhouseConnected(true);
                    }}
                    className={`w-full rounded-lg border-2 px-3 py-2.5 text-xs font-bold transition-colors ${
                      greenhouseConnected
                        ? 'border-emerald-400 bg-emerald-500/25 text-emerald-200'
                        : 'border-sky-300 bg-sky-500/25 text-white hover:bg-sky-500/35'
                    }`}
                  >
                    {greenhouseConnected ? 'Greenhouse Connected ✓' : 'Connect Water to Greenhouse'}
                  </button>
                </div>

                {/* Mars Ancient Clay Science Bonus Toggle */}
                {!isMoon && (
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playPickup();
                      setMarsClaysTagged((v) => !v);
                    }}
                    className={`w-full flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs font-bold transition-colors ${
                      marsClaysTagged
                        ? 'border-sky-300 bg-sky-500/20 text-sky-200'
                        : 'border-[#462A72] bg-[#190B2E] text-purple-200 hover:border-sky-400'
                    }`}
                  >
                    <span>Protect Ancient Clays Zone</span>
                    {marsClaysTagged && <CheckCircle2 className="h-4 w-4 text-sky-300" />}
                  </button>
                )}

                {/* Inherited Shield Summary */}
                <div className="flex items-center justify-between rounded-xl border border-[#462A72] bg-[#190B2E] px-3.5 py-2.5 text-xs">
                  <span className="flex items-center gap-1.5 font-bold text-amber-300">
                    <Shield className="h-4 w-4" />
                    <span>Shields (Missions 1 & 2)</span>
                  </span>
                  <span className="font-bold text-emerald-300">
                    {hasShieldBonus ? 'Active ✓' : 'Standard'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-[#462A72]">
                {launchStatus === 'failed' && (
                  <div className="flex items-center gap-2 rounded-xl border border-rose-400/60 bg-rose-500/15 px-3 py-2 text-xs font-bold text-rose-200">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>
                      {!selectedSoil.isBestFoundation
                        ? 'Soft ground! Switch to Firm Basalt.'
                        : 'Connect the greenhouse water!'}
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  disabled={launchStatus === 'testing'}
                  onClick={handleInaugurateBase}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-white border-b-4 bg-gradient-to-b from-[#34D399] to-[#059669] px-5 text-sm font-bold text-slate-950 shadow-lg hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-60"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>
                    {launchStatus === 'testing' ? 'Testing Base...' : 'Inaugurate Base!'}
                  </span>
                </button>
              </div>
            </aside>
          </div>
        )}

        {phase === 'RESULTS' && (
          <section className="mx-auto my-auto w-full max-w-2xl rounded-3xl border-2 border-emerald-400/70 bg-[#24123F] p-6 sm:p-8 text-center shadow-2xl">
            <div className="flex items-end justify-center gap-4">
              <CommanderSprite profile={save.commander} size={86} isCelebrating />
              <AstroCompanion mood="happy" showCaptions={false} size={64} />
            </div>

            <div className="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
              <Sparkles className="h-4 w-4" />
              <span>Mission 05 Completed · {destinationLabel}</span>
            </div>

            <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-white">
              Base Founded on {destinationLabel}!
            </h2>
            <p className="mt-2 text-sm text-purple-100/90">
              You tested the ground firmness, built on Firm Basalt, and connected the greenhouse with pure water!
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={resetMission}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#543487] bg-[#2D174D] px-4 text-xs font-bold text-white hover:border-amber-300"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Build Again</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setRoute('CAMPAIGN_MAP');
                }}
                className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-white border-b-4 bg-gradient-to-b from-[#FDE047] to-[#EAB308] px-6 text-xs font-bold text-slate-950 shadow-lg hover:scale-105 transition-transform"
              >
                <span>View Map & Certificate</span>
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
