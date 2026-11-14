import React from 'react';

function FlankingStar({ className = '' }) {
  return (
    <svg
      viewBox="0 0 110 110"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Thick white sticker outline */}
      <path
        d="M55 11C58.6 11 61.9 13 63.5 16.2L73.6 36.6C74.3 38 75.7 39 77.3 39.2L99.8 42.5C103.4 43 106.3 45.5 107.4 48.9C108.5 52.3 107.6 56.1 105 58.6L88.7 74.5C87.6 75.6 87.1 77.2 87.3 78.8L91.2 101.2C91.8 104.7 90.3 108.3 87.4 110.4"
        opacity="0"
      />
      <path
        d="M55 12L67.2 36.8L94.6 40.8L74.8 60.1L79.5 87.4L55 74.5L30.5 87.4L35.2 60.1L15.4 40.8L42.8 36.8L55 12Z"
        fill="#FFFFFF"
        stroke="#FFFFFF"
        strokeWidth="15"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M55 12L67.2 36.8L94.6 40.8L74.8 60.1L79.5 87.4L55 74.5L30.5 87.4L35.2 60.1L15.4 40.8L42.8 36.8L55 12Z"
        fill="url(#redStarGrad)"
        stroke="#DC2626"
        strokeWidth="5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Top glossy highlight */}
      <path
        d="M55 17L64 36L46 36L55 17Z"
        fill="#FCA5A5"
        opacity="0.38"
      />
      <defs>
        <linearGradient id="redStarGrad" x1="55" y1="12" x2="55" y2="88" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F87171" />
          <stop offset="0.4" stopColor="#DC2626" />
          <stop offset="1" stopColor="#991B1B" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function GameLogo({ titleTop, titleBottom }) {
  const fullTitle = `${titleTop} ${titleBottom}`.trim();

  return (
    <div className="relative flex items-center justify-center w-full max-w-[820px] px-2 select-none">
      <h1 className="sr-only">{fullTitle}</h1>

      {/* Left Red Star */}
      <FlankingStar className="w-[54px] sm:w-[78px] md:w-[92px] h-auto -mr-3 sm:-mr-5 -mt-6 sm:-mt-8 -rotate-12 drop-shadow-[0_10px_14px_rgba(12,3,30,0.6)] shrink-0 z-20" />

      {/* Two-Tone Cartoon Sticker Title */}
      <svg
        viewBox="0 0 760 250"
        className="w-full max-w-[630px] h-auto overflow-visible drop-shadow-[0_12px_18px_rgba(12,3,30,0.65)] z-10"
        role="img"
        aria-label={fullTitle}
      >
        <defs>
          <linearGradient id="titleTopGold" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFF56B" />
            <stop offset="52%" stopColor="#FFC815" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
          <linearGradient id="titleBottomBlue" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#93E2FE" />
            <stop offset="50%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
          <filter id="stickerDepth" x="-10%" y="-10%" width="120%" height="130%">
            <feDropShadow dx="0" dy="7" stdDeviation="0" floodColor="#1E0B3B" floodOpacity="0.85" />
          </filter>
        </defs>

        {/* Top Wordmark */}
        <g filter="url(#stickerDepth)">
          <text
            x="380"
            y="108"
            textAnchor="middle"
            fontFamily="'Baloo 2', 'Trebuchet MS', sans-serif"
            fontWeight="800"
            fontSize="102"
            letterSpacing="2"
            fill="url(#titleTopGold)"
            stroke="#FFFFFF"
            strokeWidth="18"
            strokeLinejoin="round"
            paintOrder="stroke fill"
          >
            {titleTop}
          </text>
        </g>

        {/* Bottom Wordmark */}
        <g filter="url(#stickerDepth)">
          <text
            x="380"
            y="212"
            textAnchor="middle"
            fontFamily="'Baloo 2', 'Trebuchet MS', sans-serif"
            fontWeight="800"
            fontSize="94"
            letterSpacing="2"
            fill="url(#titleBottomBlue)"
            stroke="#FFFFFF"
            strokeWidth="18"
            strokeLinejoin="round"
            paintOrder="stroke fill"
          >
            {titleBottom}
          </text>
        </g>
      </svg>

      {/* Right Red Star */}
      <FlankingStar className="w-[54px] sm:w-[78px] md:w-[92px] h-auto -ml-3 sm:-ml-5 -mt-6 sm:-mt-8 rotate-12 drop-shadow-[0_10px_14px_rgba(12,3,30,0.6)] shrink-0 z-20" />
    </div>
  );
}
