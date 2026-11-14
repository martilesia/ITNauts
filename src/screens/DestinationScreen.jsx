import React from 'react';
import { ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import PlanetArtwork from '../components/PlanetArtwork.jsx';
import ArcadeButton from '../components/ArcadeButton.jsx';

export default function DestinationScreen({
  config,
  gameState,
  onSelectDestination,
  onBackToPersonalization,
  onToggleAudio,
}) {
  const destCfg = config.screens.destination;
  const destinations = destCfg.destinations || [];

  return (
    <main className="destination-stage justify-between p-5 sm:p-8">
      {/* Top Bar */}
      <header className="relative z-20 flex items-center justify-between gap-4 max-w-6xl w-full mx-auto">
        <button
          type="button"
          onClick={onBackToPersonalization}
          className="inline-flex items-center gap-2 rounded-full border-2 border-white/75 bg-slate-900/80 px-4 py-2 text-sm font-bold text-white hover:border-amber-300 hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <ArrowLeft size={18} />
          <span>{destCfg.backButtonLabel}</span>
        </button>

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
            <Volume2 size={26} strokeWidth={2.75} className="text-white" />
          ) : (
            <VolumeX size={26} strokeWidth={2.75} className="text-white/90" />
          )}
        </ArcadeButton>
      </header>

      {/* Main Destination Selection Grid */}
      <section className="relative z-20 flex-1 flex flex-col items-center justify-center max-w-5xl w-full mx-auto py-6">
        <h1
          className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-wide text-center text-white mb-2"
          style={{ fontFamily: 'var(--font-display)', textWrap: 'balance' }}
        >
          {destCfg.title}
        </h1>
        <p className="text-sm sm:text-base text-slate-300 text-center max-w-xl mb-8">
          {destCfg.subtitle}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 w-full">
          {destinations.map((dest) => {
            const isSelected = gameState.selectedDestination === dest.id;
            return (
              <button
                key={dest.id}
                type="button"
                onClick={() => onSelectDestination(dest.id)}
                className={`destination-card group flex flex-col items-center text-center p-6 sm:p-8 cursor-pointer ${
                  isSelected ? 'border-amber-400 shadow-[0_0_32px_rgba(251,191,36,0.28)]' : ''
                }`}
              >
                <div className="my-2 sm:my-4 transition-transform duration-200 group-hover:scale-105">
                  <PlanetArtwork planetId={dest.planetId} size={230} />
                </div>

                <h2
                  className="text-2xl sm:text-3xl font-extrabold text-white mt-4 mb-2 group-hover:text-amber-300 transition-colors"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {dest.name}
                </h2>

                <div className="flex items-center justify-center gap-3 text-xs sm:text-sm text-slate-300 mb-3 tabular-nums">
                  <span>Gravidade: {dest.gravity}</span>
                  <span aria-hidden="true">·</span>
                  <span>Distância: {dest.distance}</span>
                </div>

                <p className="text-sm sm:text-base text-slate-200 max-w-xs leading-relaxed">
                  {dest.summary}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <div className="h-4" aria-hidden="true" />
    </main>
  );
}
