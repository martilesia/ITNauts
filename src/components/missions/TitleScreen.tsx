import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { soundEngine } from '../../utils/soundEngine';

export const TitleScreen: React.FC = () => {
  const { save, setRoute, toggleSetting } = useGame();
  const [exited, setExited] = useState(false);

  const handlePlay = () => {
    soundEngine.playSuccess();
    setRoute('WELCOME_ROOM');
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#1D0E33] text-white select-none">
      {/* Layered Cosmic Violet-Indigo Background matching reference */}
      <svg
        viewBox="0 0 1200 720"
        preserveAspectRatio="xMidYMid slice"
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="sky-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1B0D2F" />
            <stop offset="55%" stopColor="#2B164A" />
            <stop offset="100%" stopColor="#170A29" />
          </linearGradient>
          <linearGradient id="nebula-wave" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3B1E63" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#251242" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        <rect width="1200" height="720" fill="url(#sky-grad)" />

        {/* Soft Nebula Waves */}
        <path d="M0,180 Q320,90 660,190 T1200,140 L1200,380 Q860,460 480,350 T0,410 Z" fill="url(#nebula-wave)" />
        <path d="M0,510 Q380,440 760,540 T1200,490 L1200,720 L0,720 Z" fill="#251240" fillOpacity="0.7" />

        {/* Floating Low-Poly Space Crystals */}
        <polygon points="880,10 960,5 940,85 865,65" fill="#4C2680" fillOpacity="0.65" />
        <polygon points="40,340 85,375 55,425 18,390" fill="#3B1E66" fillOpacity="0.7" />
        <polygon points="155,585 235,610 215,695 130,665" fill="#34195C" fillOpacity="0.75" />

        {/* Twinkling Stars */}
        <polygon points="355,60 364,78 384,81 369,95 373,115 355,105 337,115 341,95 326,81 346,78" fill="#FACC15" />
        <polygon points="280,620 293,646 322,650 301,670 306,698 280,685 254,698 259,670 238,650 267,646" fill="#F59E0B" />
        <polygon points="815,622 821,634 834,636 824,645 827,658 815,652 803,658 806,645 796,636 809,634" fill="#FBBF24" />
        <polygon points="85,220 90,230 100,232 93,239 95,249 85,244 75,249 77,239 70,232 80,230" fill="#F8FAFC" fillOpacity="0.85" />
        <polygon points="1030,360 1036,372 1048,374 1039,383 1041,395 1030,389 1019,395 1021,383 1012,374 1024,372" fill="#F8FAFC" fillOpacity="0.9" />
        <circle cx="590" cy="70" r="3" fill="#E2E8F0" fillOpacity="0.75" />
        <circle cx="965" cy="185" r="2.5" fill="#FDE047" fillOpacity="0.8" />
        <circle cx="195" cy="495" r="2.5" fill="#E2E8F0" fillOpacity="0.7" />

        {/* Stylized Space Rocket (Top-Left, tilted upward-left like reference) */}
        <g transform="translate(150, 95) rotate(-42)">
          {/* Exhaust Plume */}
          <path d="M-12,56 L0,88 L12,56 Z" fill="#FACC15" fillOpacity="0.85" />
          {/* Left & Right Fins */}
          <path d="M-24,25 L-42,52 L-16,46 Z" fill="#DC2626" />
          <path d="M24,25 L42,52 L16,46 Z" fill="#DC2626" />
          <rect x="-44" y="45" width="7" height="14" rx="3" fill="#FACC15" />
          <rect x="37" y="45" width="7" height="14" rx="3" fill="#FACC15" />
          {/* Rocket Hull */}
          <path d="M0,-58 C24,-34 26,18 20,48 L-20,48 C-26,18 -24,-34 0,-58 Z" fill="#F8FAFC" />
          {/* Nose Cone */}
          <path d="M0,-58 C12,-46 18,-30 20,-18 L-20,-18 C-18,-30 -12,-46 0,-58 Z" fill="#EF4444" />
          {/* Stripes & Porthole */}
          <rect x="-21" y="22" width="42" height="8" fill="#475569" />
          <rect x="-20" y="34" width="40" height="7" fill="#475569" />
          <ellipse cx="0" cy="-2" rx="11" ry="14" fill="#3B215E" stroke="#CBD5E1" strokeWidth="3" />
          {/* Thruster Nozzle */}
          <rect x="-14" y="48" width="28" height="8" rx="2" fill="#334155" />
        </g>

        {/* Cratered Moon (Bottom-Right corner) */}
        <g transform="translate(1035, 625)">
          <circle cx="0" cy="0" r="185" fill="#E2D9EE" />
          <path d="M-175,55 A185,185 0 0,0 185,0 A170,170 0 0,1 -175,55 Z" fill="#BFAFD4" />
          {/* Craters */}
          <ellipse cx="-65" cy="-95" rx="24" ry="12" fill="#9E8BB8" transform="rotate(-22 -65 -95)" />
          <ellipse cx="35" cy="-145" rx="28" ry="14" fill="#C7B8DB" />
          <ellipse cx="-95" cy="-15" rx="36" ry="28" fill="#B5A4CC" />
          <ellipse cx="-92" cy="-12" rx="24" ry="18" fill="#9B88B5" />
          <ellipse cx="10" cy="-35" rx="26" ry="17" fill="#B5A4CC" />
          <ellipse cx="85" cy="-80" rx="22" ry="15" fill="#B5A4CC" />
          <ellipse cx="75" cy="45" rx="34" ry="22" fill="#9E8BB8" />
        </g>
      </svg>

      {/* Top-Right Circular Cyan Sound Button */}
      <button
        type="button"
        onClick={() => {
          toggleSetting('soundEnabled');
          soundEngine.playClick();
        }}
        aria-label={save.settings.soundEnabled ? 'Mute sound' : 'Turn on sound'}
        className="absolute right-5 top-5 z-20 flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-gradient-to-b from-[#38BDF8] to-[#0284C7] text-white shadow-xl transition-transform hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-amber-300"
      >
        {save.settings.soundEnabled ? <Volume2 className="h-7 w-7" /> : <VolumeX className="h-7 w-7" />}
      </button>

      {/* Center Logo & Main Actions */}
      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        {/* Stacked Cartoon Game Logo flanked by Red Stars */}
        <div className="relative flex flex-col items-center">
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Left Red Star */}
            <svg viewBox="0 0 60 60" className="h-12 w-12 sm:h-16 sm:w-16 sticker-outline shrink-0">
              <polygon
                points="30,4 38,20 56,22 43,34 46,52 30,43 14,52 17,34 4,22 22,20"
                fill="#EF4444"
              />
            </svg>

            <h1 className="font-display text-4xl font-bold tracking-wide text-[#FACC15] sm:text-6xl md:text-7xl sticker-outline leading-none">
              SPACE BASE
            </h1>

            {/* Right Red Star */}
            <svg viewBox="0 0 60 60" className="h-12 w-12 sm:h-16 sm:w-16 sticker-outline shrink-0">
              <polygon
                points="30,4 38,20 56,22 43,34 46,52 30,43 14,52 17,34 4,22 22,20"
                fill="#EF4444"
              />
            </svg>
          </div>

          <div className="mt-1 font-display text-3xl font-bold tracking-wider text-[#38BDF8] sm:text-5xl md:text-6xl sticker-outline leading-none">
            COMMANDER
          </div>
        </div>

        {!exited ? (
          <div className="mt-10 flex flex-col items-center gap-4">
            {/* Primary Golden Yellow PLAY / JOGAR Button */}
            <button
              type="button"
              onClick={handlePlay}
              className="h-16 w-60 rounded-full border-4 border-white border-b-[6px] bg-gradient-to-b from-[#FDE047] via-[#FACC15] to-[#EAB308] font-display text-2xl font-bold tracking-wider text-white shadow-[0_8px_24px_rgba(250,204,21,0.35)] transition-transform hover:scale-105 active:translate-y-0.5 active:scale-95 focus-visible:outline-2 focus-visible:outline-cyan-300 game-text-outline"
            >
              PLAY
            </button>

            {/* Secondary Crimson Red EXIT / SAIR Button */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setExited(true);
              }}
              className="h-16 w-60 rounded-full border-4 border-white border-b-[6px] bg-gradient-to-b from-[#F87171] via-[#EF4444] to-[#B91C1C] font-display text-2xl font-bold tracking-wider text-white shadow-[0_8px_24px_rgba(239,68,68,0.3)] transition-transform hover:scale-105 active:translate-y-0.5 active:scale-95 focus-visible:outline-2 focus-visible:outline-amber-300 game-text-outline"
            >
              EXIT
            </button>

            {save.hasCompletedPrologue && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setRoute('PROLOGUE');
                }}
                className="mt-2 text-sm font-semibold text-sky-300 underline-offset-4 hover:text-amber-300 hover:underline"
              >
                Customize Commander Suit
              </button>
            )}
          </div>
        ) : (
          <div className="mt-10 max-w-md rounded-2xl border-2 border-purple-400/40 bg-[#271542]/95 p-6 shadow-2xl">
            <p className="font-display text-xl font-bold text-amber-300">
              See you on the next mission, Commander!
            </p>
            <p className="mt-2 text-sm text-purple-100/85">
              Your progress is saved. You can come back anytime to keep exploring.
            </p>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setExited(false);
              }}
              className="mt-5 h-12 rounded-full border-2 border-white bg-gradient-to-b from-[#38BDF8] to-[#0284C7] px-6 font-display text-base font-bold text-white shadow-lg hover:scale-105 transition-transform"
            >
              Back to Home Screen
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
