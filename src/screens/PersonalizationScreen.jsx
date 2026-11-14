import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Footprints,
  Hand,
  Shirt,
  Shuffle,
  Sparkles,
  User,
  Volume2,
  VolumeX,
} from 'lucide-react';
import AstronautCharacter from '../components/AstronautCharacter.jsx';
import ArcadeButton from '../components/ArcadeButton.jsx';
import { playClickSound } from '../utils/soundFx.js';

const TAB_ICONS = {
  hair: User,
  suit: Sparkles,
  emblem: Award,
  gloves: Hand,
  boots: Footprints,
  accessory: Shirt,
};

function OptionPreview({ category, option }) {
  if (category === 'hair') {
    return (
      <svg viewBox="0 0 64 64" className="w-12 h-12 sm:w-14 sm:h-14" aria-hidden="true">
        <circle cx="32" cy="36" r="16" fill="#CBD5E1" />
        <path
          d="M14 34C14 18 22 12 32 12C42 12 50 18 50 34C44 26 38 24 32 27C26 24 20 26 14 34Z"
          fill={option.color}
        />
        {option.id === 'braids' && (
          <>
            <circle cx="15" cy="44" r="4" fill={option.color} />
            <circle cx="49" cy="44" r="4" fill={option.color} />
          </>
        )}
        {option.id === 'buns' && (
          <>
            <circle cx="19" cy="14" r="6" fill={option.color} />
            <circle cx="45" cy="14" r="6" fill={option.color} />
          </>
        )}
      </svg>
    );
  }

  if (category === 'suit') {
    return (
      <svg viewBox="0 0 64 64" className="w-12 h-12 sm:w-14 sm:h-14" aria-hidden="true">
        <path
          d="M20 14H44L49 40H15L20 14Z"
          fill={option.primary}
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <rect x="20" y="38" width="24" height="14" rx="4" fill={option.secondary} />
      </svg>
    );
  }

  if (category === 'gloves' || category === 'boots') {
    return (
      <span
        className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl border-2 border-white shadow-inner inline-block"
        style={{ backgroundColor: option.color }}
        aria-hidden="true"
      />
    );
  }

  return (
    <span
      className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 border-white/80 bg-indigo-900/80 flex items-center justify-center text-amber-300 font-extrabold text-lg"
      aria-hidden="true"
    >
      {option.label.slice(0, 2).toUpperCase()}
    </span>
  );
}

export default function PersonalizationScreen({
  config,
  gameState,
  onSelectPart,
  onRandomize,
  onConfirm,
  onBackToTitle,
  onToggleAudio,
}) {
  const persCfg = config.screens.personalization;
  const tabs = persCfg.tabs || [];
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || 'hair');

  const options = persCfg.options || {};
  const activeOptions = options[activeTab] || [];
  const selectedOptionId = gameState.character?.[activeTab];

  const handleTabClick = (tabId) => {
    playClickSound(gameState.audioEnabled);
    setActiveTab(tabId);
  };

  return (
    <main className="personalization-stage justify-between p-4 sm:p-6 md:p-8">
      {/* Starry Glow & Giant Background Planet */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute right-[10%] top-[16%] w-[340px] h-[340px] sm:w-[460px] sm:h-[460px] rounded-full bg-cyan-300/20 blur-[2px] border border-white/20" />
        <div className="absolute top-[12%] left-[38%] w-2 h-2 rounded-full bg-white/80" />
        <div className="absolute top-[24%] right-[22%] w-2.5 h-2.5 rounded-full bg-amber-200/80" />
        <div className="absolute bottom-[20%] right-[14%] w-2 h-2 rounded-full bg-white/75" />
      </div>

      {/* Top Navigation & Utility Bar */}
      <header className="relative z-20 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBackToTitle}
          className="inline-flex items-center gap-2 rounded-full border-2 border-white/85 bg-[#1b499e]/90 px-4 py-2 text-sm font-bold text-white shadow-md hover:bg-[#2563eb] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <ArrowLeft size={18} />
          <span>{persCfg.backButtonLabel}</span>
        </button>

        <h1
          className="hidden md:block text-2xl lg:text-3xl font-extrabold text-white drop-shadow-[0_3px_0_rgba(14,50,118,0.8)] tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {persCfg.title}
        </h1>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onRandomize}
            aria-label={persCfg.randomizeButtonLabel}
            title={persCfg.randomizeButtonLabel}
            className="arcade-btn arcade-btn--pink-circle"
          >
            <Shuffle size={24} strokeWidth={2.5} className="text-white" />
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
        </div>
      </header>

      {/* Main Split Workspace: Left Golden Customization Grid + Right Astronaut Preview */}
      <section className="relative z-20 flex-1 grid grid-cols-1 lg:grid-cols-12 items-center gap-8 max-w-6xl w-full mx-auto py-4">
        {/* Left: Golden Framed 2x3 Grid + Protruding Right Category Tabs */}
        <div className="lg:col-span-6 flex items-center justify-center">
          <div className="relative flex items-start">
            <div className="personalization-panel-frame personalization-grid-bg p-4 sm:p-5 w-[275px] sm:w-[340px] md:w-[370px]">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {activeOptions.map((option) => {
                  const isSelected = selectedOptionId === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => onSelectPart(activeTab, option.id)}
                      aria-pressed={isSelected}
                      className={`group flex flex-col items-center justify-center gap-2 rounded-2xl p-3 sm:p-4 min-h-[104px] sm:min-h-[118px] border-3 transition-transform cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-700/80 border-amber-300 shadow-[0_0_18px_rgba(251,191,36,0.45)] scale-[1.02]'
                          : 'bg-indigo-950/55 border-white/25 hover:border-amber-200/80 hover:bg-indigo-900/65'
                      }`}
                    >
                      <OptionPreview category={activeTab} option={option} />
                      <span className="text-xs sm:text-sm font-bold text-white text-center leading-tight">
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 6 Protruding Glossy Category Tabs */}
            <div
              className="flex flex-col gap-2 pt-5 -ml-0.5"
              role="tablist"
              aria-label="Categorias de personalização"
            >
              {tabs.map((tab) => {
                const Icon = TAB_ICONS[tab.id] || Sparkles;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-label={tab.label}
                    title={tab.label}
                    onClick={() => handleTabClick(tab.id)}
                    className={`personalization-tab ${
                      isActive
                        ? 'personalization-tab--active'
                        : 'personalization-tab--inactive'
                    }`}
                  >
                    <Icon size={24} strokeWidth={2.5} className="text-white drop-shadow" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Live Customized Cartoon Astronaut */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center">
          <div className="animate-float-slow drop-shadow-[0_22px_32px_rgba(6,18,52,0.55)]">
            <AstronautCharacter
              character={gameState.character}
              options={options}
              size={260}
            />
          </div>
        </div>
      </section>

      {/* Bottom Action Row */}
      <footer className="relative z-20 flex items-center justify-end max-w-6xl w-full mx-auto pt-2">
        <ArcadeButton
          variant="yellow"
          onClick={onConfirm}
          className="!min-w-[210px] !min-h-[60px] !text-xl"
        >
          <span>{persCfg.confirmButtonLabel}</span>
          <ArrowRight size={22} strokeWidth={3} />
        </ArcadeButton>
      </footer>
    </main>
  );
}
