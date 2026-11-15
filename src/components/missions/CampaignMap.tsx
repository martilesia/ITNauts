import React, { useEffect, useState } from 'react';
import { Award, BookOpen, CheckCircle2, Compass, GraduationCap, Home, Lock, Play, RotateCcw, Shirt, X } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { BADGE_CATALOG, CAMPAIGN_MISSIONS } from '../../data/scientificData';
import { soundEngine } from '../../utils/soundEngine';
import { AstroCompanion } from '../engine/AstroCompanion';
import { CommanderSprite } from '../engine/CommanderSprite';
import { DiscoveryCodexModal } from '../engine/DiscoveryCodexModal';

export const CampaignMap: React.FC = () => {
  const { save, setRoute, astroDialogue, sayAstro, markFinalVictorySeen, resetCampaign } = useGame();
  const [codexOpen, setCodexOpen] = useState(false);
  const [certificateOpen, setCertificateOpen] = useState(false);

  const allCompleted = save.completedMissions.length === 5;
  const commanderName = save.commander.commanderName || 'Nova';
  const isMoon = save.selectedDestination === 'moon';
  const destinationName = isMoon ? 'Moon' : 'Mars';

  useEffect(() => {
    if (allCompleted && !save.hasSeenFinalVictory) {
      soundEngine.playSuccess();
      setCertificateOpen(true);
      markFinalVictorySeen();
      sayAstro(
        `Congratulations, Commander ${commanderName}, you successfully completed all missions!`,
        'happy',
        6500
      );
    }
  }, [allCompleted, commanderName, markFinalVictorySeen, save.hasSeenFinalVictory, sayAstro]);

  const handleLockedClick = (missionNumber: number, title: string) => {
    soundEngine.playGentleError();
    sayAstro(
      `Mission ${missionNumber} (${title}) arrives in the next phase of construction!`,
      'encourage',
      4500
    );
  };

  return (
    <div className="min-h-screen bg-[#1B0D2E] text-slate-100 flex flex-col">
      {/* 3-Zone Top Bar */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#462A72] bg-[#21103A] px-6 py-3.5">
        <span className="font-display text-lg font-bold tracking-tight text-amber-300 whitespace-nowrap shrink-0">
          Space Base Commander
        </span>

        <div className="flex items-center gap-3 text-xs text-purple-100">
          <span>Commander {save.commander.commanderName}</span>
          <span aria-hidden="true">·</span>
          <span>{save.commander.teamName}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono-tabular text-sky-300">
            {save.completedMissions.length}/5 Missions
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setRoute('TITLE');
            }}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#543487] bg-[#2D174D] px-3 text-xs font-semibold text-white hover:border-amber-300 whitespace-nowrap"
          >
            <Home className="h-4 w-4 text-amber-300" />
            <span>Home</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setRoute('DESTINATION_ROOM');
            }}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#543487] bg-[#2D174D] px-3 text-xs font-semibold text-white hover:border-amber-300 whitespace-nowrap"
          >
            <Compass className="h-4 w-4 text-amber-300" />
            <span>Destinations</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setRoute('PROLOGUE');
            }}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#543487] bg-[#2D174D] px-3 text-xs font-semibold text-white hover:border-sky-300 whitespace-nowrap"
          >
            <Shirt className="h-4 w-4 text-sky-300" />
            <span>Suit</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setCodexOpen(true);
            }}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#543487] bg-[#2D174D] px-3 text-xs font-semibold text-white hover:border-emerald-400 whitespace-nowrap"
          >
            <BookOpen className="h-4 w-4 text-emerald-400" />
            <span>Logbook ({save.discoveries.length})</span>
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-8 px-4 py-8 sm:px-8">
        {/* Commander + ASTRO Command Deck */}
        <section
          className={`flex flex-col items-center justify-between gap-6 rounded-2xl border-2 p-6 sm:flex-row ${
            allCompleted
              ? 'border-amber-300/70 bg-gradient-to-r from-[#2D1852] via-[#261445] to-[#1F1038]'
              : 'border-[#462A72] bg-[#24123F]'
          }`}
        >
          <div className="flex items-center gap-5">
            <CommanderSprite profile={save.commander} size={86} isCelebrating={allCompleted} />
            <div>
              <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
                {allCompleted
                  ? `Congratulations, Commander ${commanderName}, you completed the missions!`
                  : 'Expedition Map'}
              </h1>
              <p className="mt-1 text-sm text-purple-200/85">
                {allCompleted
                  ? 'All 5 campaign missions are complete. You can review your certificate or replay any mission.'
                  : 'Choose the next mission to explore, experiment, and build.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <AstroCompanion
              mood={astroDialogue?.mood ?? (allCompleted ? 'happy' : 'idle')}
              caption={
                astroDialogue?.text ??
                (allCompleted
                  ? `Congratulations, Commander ${commanderName}, you completed the missions!`
                  : save.completedMissions.length > 0
                    ? `You've already completed ${save.completedMissions.length}/5 missions on ${isMoon ? 'the Moon' : 'Mars'}! Which one shall we explore next?`
                    : `Mission 1 is ready on ${isMoon ? 'the Moon' : 'Mars'}! Let's head into the lab.`)
              }
              showCaptions={save.settings.captionsEnabled}
              size={68}
            />
            {allCompleted && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playSuccess();
                  sayAstro(
                    `Congratulations, Commander ${commanderName}, you completed the missions!`,
                    'happy',
                    6500
                  );
                  setCertificateOpen(true);
                }}
                className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-white border-b-4 bg-gradient-to-b from-[#FDE047] to-[#EAB308] px-5 text-xs font-bold text-slate-950 shadow-lg hover:scale-105 transition-transform whitespace-nowrap"
              >
                <GraduationCap className="h-4 w-4" />
                <span>View Certificate</span>
              </button>
            )}
          </div>
        </section>

        {/* 5-Mission Orbital Trail */}
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {CAMPAIGN_MISSIONS.map((m) => {
            const isDone = save.completedMissions.includes(m.id);
            return (
              <article
                key={m.id}
                className={`flex flex-col justify-between rounded-2xl border-2 p-5 transition-colors ${
                  m.playable
                    ? 'border-[#543487] bg-[#261445] hover:border-sky-400/70'
                    : 'border-[#38205C] bg-[#190B2E]/80 opacity-80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs text-purple-200/80">
                    <span>
                      Mission 0{m.number} · {destinationName}
                    </span>
                    {isDone && (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                        Completed
                      </span>
                    )}
                  </div>
                  <h2 className="mt-2 font-display text-xl font-bold text-white">{m.title}</h2>
                  <p className="mt-1.5 text-sm text-purple-100/90">{m.shortGoal}</p>
                  <p className="mt-3 text-xs font-mono-tabular text-sky-300">
                    {m.instrumentTag}
                  </p>
                </div>

                <div className="mt-5">
                  {m.playable ? (
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        setRoute(
                          m.id === 'mission-2'
                            ? 'MISSION_2'
                            : m.id === 'mission-3'
                              ? 'MISSION_3'
                              : m.id === 'mission-4'
                                ? 'MISSION_4'
                                : m.id === 'mission-5'
                                  ? 'MISSION_5'
                                  : 'MISSION_1'
                        );
                      }}
                      className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border-2 border-white border-b-4 px-4 text-sm font-bold shadow transition-transform hover:scale-[1.02] active:scale-95 focus-visible:outline-2 focus-visible:outline-white ${
                        isDone
                          ? 'bg-gradient-to-b from-[#38BDF8] to-[#0284C7] text-white'
                          : 'bg-gradient-to-b from-[#FDE047] to-[#EAB308] text-slate-950'
                      }`}
                    >
                      <Play className="h-4 w-4" />
                      <span>{isDone ? 'Explore Again' : `Start Mission ${m.number}`}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleLockedClick(m.number, m.title)}
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#462A72] bg-[#190B2E] px-4 text-xs font-semibold text-purple-300"
                    >
                      <Lock className="h-4 w-4" />
                      <span>Next Chapter</span>
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </section>

        {/* Quiet Footer Actions */}
        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-[#462A72] pt-4 text-xs text-purple-200/80">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-300" />
            <span>Badges earned: {save.badges.length}</span>
            <span aria-hidden="true">·</span>
            <span>Equipment: {save.inventory.length}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              resetCampaign();
            }}
            className="inline-flex items-center gap-1.5 text-purple-200/80 hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Restart Adventure</span>
          </button>
        </footer>
      </main>

      <DiscoveryCodexModal open={codexOpen} onClose={() => setCodexOpen(false)} />

      {/* Final Space Base Commander Certificate */}
      {certificateOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-xl rounded-2xl border-2 border-amber-300/80 bg-gradient-to-b from-[#2B164A] to-[#190B2E] p-7 text-center shadow-2xl">
            <button
              type="button"
              onClick={() => setCertificateOpen(false)}
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#543487] bg-[#2D174D] text-purple-200 hover:text-white"
              aria-label="Close certificate"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-xs font-bold uppercase tracking-widest text-amber-300">
              Missions Completed · Space Base Commander
            </div>
            <h2 className="mt-2 font-display text-2xl font-extrabold text-white sm:text-3xl">
              Congratulations, Commander {commanderName}, you completed the missions!
            </h2>

            <div className="my-5 flex items-end justify-center gap-6">
              <CommanderSprite profile={save.commander} size={96} isCelebrating />
              <AstroCompanion
                mood="happy"
                size={74}
                caption={`Congratulations, Commander ${commanderName}!`}
                showCaptions={save.settings.captionsEnabled}
              />
            </div>

            <div className="mt-1 font-display text-xl font-bold text-sky-300">
              {save.commander.teamName}
            </div>
            <p className="mt-2 text-xs text-purple-100/90">
              You explored {isMoon ? 'the Moon' : 'Mars'}, mastered scientific sensors, protected the space base, built stable structures, collected water and ice, and grew crops in the space greenhouse.
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {BADGE_CATALOG.map((b) => (
                <div
                  key={b.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/50 bg-amber-400/15 px-3 py-1.5 text-xs font-bold text-amber-200"
                >
                  <Award className="h-3.5 w-3.5" />
                  <span>{b.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
