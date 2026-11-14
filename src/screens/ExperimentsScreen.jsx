import React from 'react';
import { ArrowLeft, Home, Lock, Star, Volume2, VolumeX } from 'lucide-react';
import PlanetArtwork from '../components/PlanetArtwork.jsx';
import AstronautCharacter from '../components/AstronautCharacter.jsx';
import ArcadeButton from '../components/ArcadeButton.jsx';
import ExperimentModal from '../components/ExperimentModal.jsx';

export default function ExperimentsScreen({
  config,
  gameState,
  onSelectPlanet,
  onOpenExperiment,
  onCloseExperiment,
  onCompleteExperiment,
  onBackToDestinations,
  onBackToTitle,
  onToggleAudio,
}) {
  const expCfg = config.screens.experiments;
  const persOptions = config.screens.personalization.options;
  const planets = expCfg.planets || [];
  const items = expCfg.items || [];

  const activePlanetId = gameState.activePlanetId || 'earth';
  const activePlanetMeta = planets.find((p) => p.id === activePlanetId) || planets[0];
  const activeProgress = gameState.experimentProgress?.[activePlanetId] || {
    unlocked: true,
    unlockedUpTo: 1,
    starsByExperiment: {},
  };

  const activeExperiment =
    items.find((item) => item.id === gameState.activeExperimentId) || null;

  return (
    <main className="cockpit-stage justify-between">
      {/* Starfield Backdrop */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute top-[14%] left-[18%] w-1.5 h-1.5 rounded-full bg-white/80" />
        <div className="absolute top-[22%] left-[32%] w-1 h-1 rounded-full bg-sky-200/75" />
        <div className="absolute top-[18%] right-[24%] w-1.5 h-1.5 rounded-full bg-white/90" />
        <div className="absolute top-[34%] right-[14%] w-2 h-2 rounded-full bg-amber-100/80" />
        <div className="absolute top-[48%] left-[12%] w-1.5 h-1.5 rounded-full bg-white/70" />
        <div className="absolute top-[55%] right-[22%] w-1.5 h-1.5 rounded-full bg-sky-100/70" />
      </div>

      {/* Cockpit Blue Frame Side Struts */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-6 sm:w-12 md:w-16 bg-gradient-to-r from-[#1e3a8a] via-[#1d4ed8] to-[#1e40af] border-r-4 border-[#60a5fa] opacity-90 z-10"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-6 sm:w-12 md:w-16 bg-gradient-to-l from-[#1e3a8a] via-[#1d4ed8] to-[#1e40af] border-l-4 border-[#60a5fa] opacity-90 z-10"
        aria-hidden="true"
      />

      {/* Top Cockpit Bar: Back Controls + Green Planet Tray + Audio */}
      <header className="relative z-20 flex flex-col lg:flex-row items-center justify-between gap-3 px-8 sm:px-16 md:px-20 pt-0">
        <div className="flex items-center gap-2 pt-3 lg:pt-0">
          <button
            type="button"
            onClick={onBackToDestinations}
            className="inline-flex items-center gap-1.5 rounded-full border-2 border-sky-300/75 bg-slate-900/85 px-3.5 py-1.5 text-xs sm:text-sm font-bold text-white hover:border-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>{expCfg.backToDestinationsLabel}</span>
          </button>
          <button
            type="button"
            onClick={onBackToTitle}
            aria-label={expCfg.backToTitleLabel}
            title={expCfg.backToTitleLabel}
            className="inline-flex items-center justify-center w-9 h-9 rounded-full border-2 border-sky-300/75 bg-slate-900/85 text-white hover:border-amber-300 transition-colors shrink-0 cursor-pointer"
          >
            <Home size={16} />
          </button>
        </div>

        {/* Light-Green Top Planet Selector Bar (Matching Reference) */}
        <nav
          aria-label="Seleção de planetas"
          className="cockpit-planet-tray px-4 sm:px-7 py-2.5 sm:py-3 flex items-center gap-2.5 sm:gap-5"
        >
          {planets.map((planet) => {
            const pState = gameState.experimentProgress?.[planet.id];
            const isUnlocked = Boolean(pState?.unlocked);
            const isActive = activePlanetId === planet.id;

            return (
              <button
                key={planet.id}
                type="button"
                onClick={() => onSelectPlanet(planet.id)}
                aria-label={planet.name}
                aria-current={isActive ? 'true' : undefined}
                title={planet.name}
                className={`relative w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-transform cursor-pointer ${
                  isActive
                    ? 'ring-4 ring-amber-400 scale-110 bg-slate-950'
                    : 'ring-2 ring-lime-200 bg-slate-950 hover:scale-105'
                }`}
              >
                <PlanetArtwork
                  planetId={planet.id}
                  size={54}
                  locked={!isUnlocked}
                  className="w-10 h-10 sm:w-14 sm:h-14"
                />
                {!isUnlocked && (
                  <span
                    className="absolute inset-0 rounded-full bg-slate-950/35 flex items-center justify-center"
                    aria-hidden="true"
                  >
                    <Lock size={20} className="text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]" />
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="pt-1 lg:pt-3">
          <ArcadeButton
            variant="cyan-circle"
            onClick={onToggleAudio}
            ariaLabel={
              gameState.audioEnabled
                ? config.screens.initial.audioToggleLabelOn
                : config.screens.initial.audioToggleLabelOff
            }
            ariaPressed={gameState.audioEnabled}
          >
            {gameState.audioEnabled ? (
              <Volume2 size={24} strokeWidth={2.75} className="text-white" />
            ) : (
              <VolumeX size={24} strokeWidth={2.75} className="text-white/90" />
            )}
          </ArcadeButton>
        </div>
      </header>

      {/* Center Viewport: Active Planet */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 py-2">
        <div className="animate-float-slow flex flex-col items-center">
          <PlanetArtwork
            planetId={activePlanetId}
            size={280}
            className="w-[210px] h-[210px] sm:w-[270px] sm:h-[270px] md:w-[300px] md:h-[300px] drop-shadow-[0_0_40px_rgba(96,165,250,0.22)]"
          />
          <h1
            className="mt-2 text-lg sm:text-xl font-extrabold text-sky-200 tracking-wide"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {activePlanetMeta?.name} · {expCfg.chapterTitle}
          </h1>
        </div>
      </section>

      {/* Bottom Cockpit Area: Assistant Character (Left) + 6-Slot Blue Console (Center) */}
      <section className="relative z-20 flex flex-col md:flex-row items-center md:items-end justify-center gap-4 px-8 sm:px-14 md:px-20 pb-0">
        {/* Bottom-Left Commander / Assistant */}
        <div className="flex items-end gap-3 md:absolute md:left-14 lg:left-20 md:bottom-0 pointer-events-none select-none">
          <div className="w-[110px] sm:w-[140px] md:w-[165px]">
            <AstronautCharacter
              character={gameState.character}
              options={persOptions}
              size={165}
              waving
              className="w-full h-auto drop-shadow-[0_12px_20px_rgba(0,0,0,0.6)]"
            />
          </div>
          <div className="hidden xl:block mb-24 max-w-[210px] rounded-2xl border-2 border-sky-300 bg-slate-900/90 px-3.5 py-2.5 text-xs font-bold text-sky-100 shadow-lg">
            {gameState.statusNotice || expCfg.assistantGreeting}
          </div>
        </div>

        {/* Status Notice Banner on smaller screens */}
        {gameState.statusNotice && (
          <div className="xl:hidden mb-2 rounded-full border-2 border-amber-300 bg-slate-900/95 px-4 py-1.5 text-xs sm:text-sm font-bold text-amber-200 text-center shadow-lg">
            {gameState.statusNotice}
          </div>
        )}

        {/* Bottom Center Blue Console with 6 Numbered Experiment Tiles */}
        <div className="cockpit-console-frame w-full max-w-2xl p-3 sm:p-4 pb-4">
          <div className="cockpit-console-screen p-3 sm:p-4">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 sm:gap-3">
              {items.map((item) => {
                const stars = activeProgress.starsByExperiment?.[item.id] || 0;
                const isCompleted = stars > 0;
                const isUnlocked = item.id <= activeProgress.unlockedUpTo;
                const isCurrent = item.id === activeProgress.unlockedUpTo && !isCompleted;

                const tileClass = isCurrent
                  ? 'experiment-tile--active'
                  : isCompleted
                    ? 'experiment-tile--completed'
                    : isUnlocked
                      ? 'experiment-tile--active'
                      : 'experiment-tile--locked';

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onOpenExperiment(item.id)}
                    aria-label={`${item.title} (${stars}/3 estrelas)`}
                    className={`experiment-tile ${tileClass} flex flex-col items-center justify-center py-2.5 px-2 min-h-[74px] cursor-pointer`}
                  >
                    <span
                      className={`text-2xl sm:text-3xl font-extrabold leading-none ${
                        isCurrent || isCompleted || isUnlocked
                          ? 'text-yellow-300 drop-shadow-[0_2px_0_rgba(15,23,42,0.7)]'
                          : 'text-slate-500'
                      }`}
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {item.id}
                    </span>
                    <div className="mt-1.5 flex items-center gap-0.5" aria-hidden="true">
                      {[1, 2, 3].map((starIdx) => (
                        <Star
                          key={starIdx}
                          size={13}
                          className={
                            starIdx <= stars
                              ? 'text-amber-300 fill-amber-300'
                              : isCurrent || isCompleted
                                ? 'text-purple-950/60 fill-purple-950/40'
                                : 'text-slate-400 fill-slate-400/60'
                          }
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Educational Experiment Modal */}
      <ExperimentModal
        experiment={activeExperiment}
        labels={expCfg}
        onComplete={onCompleteExperiment}
        onClose={onCloseExperiment}
      />
    </main>
  );
}
