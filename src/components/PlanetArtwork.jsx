import React, { useId } from 'react';

export default function PlanetArtwork({
  planetId = 'earth',
  size = 240,
  className = '',
  locked = false,
}) {
  const uid = useId().replace(/:/g, '');

  const renderPlanet = () => {
    switch (planetId) {
      case 'moon':
        return (
          <>
            <defs>
              <radialGradient id={`moonBase-${uid}`} cx="35%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#F3F4F6" />
                <stop offset="55%" stopColor="#B8BCC4" />
                <stop offset="100%" stopColor="#4B5563" />
              </radialGradient>
            </defs>
            <circle cx="100" cy="100" r="88" fill={`url(#moonBase-${uid})`} />
            {/* Lunar Maria */}
            <ellipse cx="115" cy="52" rx="22" ry="15" fill="#6B7280" opacity="0.55" />
            <path
              d="M44 76C58 58 88 54 96 76C104 98 86 122 64 116C42 110 34 90 44 76Z"
              fill="#6B7280"
              opacity="0.45"
            />
            <ellipse cx="136" cy="96" rx="24" ry="20" fill="#6B7280" opacity="0.4" />
            {/* Crisp Craters */}
            <circle cx="72" cy="142" r="13" fill="#9CA3AF" stroke="#6B7280" strokeWidth="2.5" />
            <circle cx="72" cy="142" r="7" fill="#6B7280" opacity="0.45" />
            <circle cx="128" cy="136" r="10" fill="#9CA3AF" stroke="#6B7280" strokeWidth="2" />
            <circle cx="58" cy="64" r="8" fill="#D1D5DB" stroke="#6B7280" strokeWidth="1.8" />
            <circle cx="148" cy="70" r="7" fill="#9CA3AF" stroke="#6B7280" strokeWidth="1.8" />
            <circle cx="102" cy="106" r="11" fill="#D1D5DB" stroke="#6B7280" strokeWidth="2" />
            <circle cx="94" cy="160" r="6" fill="#9CA3AF" stroke="#6B7280" strokeWidth="1.5" />
          </>
        );

      case 'mars':
        return (
          <>
            <defs>
              <radialGradient id={`marsBase-${uid}`} cx="34%" cy="30%" r="72%">
                <stop offset="0%" stopColor="#FDBA74" />
                <stop offset="35%" stopColor="#EA580C" />
                <stop offset="75%" stopColor="#9A3412" />
                <stop offset="100%" stopColor="#431407" />
              </radialGradient>
            </defs>
            <circle cx="100" cy="100" r="88" fill={`url(#marsBase-${uid})`} />
            {/* Dark Basalt Regions & Valles Marineris */}
            <path
              d="M42 96C68 82 98 106 132 90C152 80 166 94 176 110C156 136 116 144 82 132C58 124 44 110 42 96Z"
              fill="#7C2D12"
              opacity="0.58"
            />
            <ellipse cx="136" cy="58" rx="28" ry="14" transform="rotate(-18 136 58)" fill="#7C2D12" opacity="0.5" />
            <path
              d="M66 138C92 128 124 134 146 150C124 166 86 168 66 138Z"
              fill="#431407"
              opacity="0.45"
            />
            {/* Polar Ice Cap */}
            <ellipse cx="100" cy="18" rx="22" ry="6" fill="#FFEDD5" opacity="0.7" />
            {/* Dust Highlights */}
            <circle cx="64" cy="64" r="10" fill="#FDBA74" opacity="0.25" />
            <circle cx="114" cy="78" r="7" fill="#FED7AA" opacity="0.2" />
          </>
        );

      case 'uranus':
        return (
          <>
            <defs>
              <radialGradient id={`uranusBase-${uid}`} cx="35%" cy="32%" r="70%">
                <stop offset="0%" stopColor="#E0F2FE" />
                <stop offset="50%" stopColor="#67E8F9" />
                <stop offset="100%" stopColor="#0E7490" />
              </radialGradient>
            </defs>
            <circle cx="100" cy="100" r="88" fill={`url(#uranusBase-${uid})`} />
            <path d="M24 88C68 74 134 74 178 88" stroke="#A5F3FC" strokeWidth="8" opacity="0.35" />
            <path d="M22 118C68 106 134 106 178 118" stroke="#0891B2" strokeWidth="10" opacity="0.28" />
          </>
        );

      case 'jupiter':
        return (
          <>
            <defs>
              <radialGradient id={`jupiterBase-${uid}`} cx="34%" cy="30%" r="72%">
                <stop offset="0%" stopColor="#FEF3C7" />
                <stop offset="55%" stopColor="#D97706" />
                <stop offset="100%" stopColor="#78350F" />
              </radialGradient>
              <clipPath id={`jupiterClip-${uid}`}>
                <circle cx="100" cy="100" r="88" />
              </clipPath>
            </defs>
            <circle cx="100" cy="100" r="88" fill={`url(#jupiterBase-${uid})`} />
            <g clipPath={`url(#jupiterClip-${uid})`}>
              <rect x="8" y="34" width="184" height="16" fill="#B45309" opacity="0.7" />
              <rect x="8" y="62" width="184" height="18" fill="#FEF3C7" opacity="0.55" />
              <rect x="8" y="88" width="184" height="22" fill="#92400E" opacity="0.7" />
              <rect x="8" y="122" width="184" height="16" fill="#FDE68A" opacity="0.5" />
              <rect x="8" y="148" width="184" height="18" fill="#78350F" opacity="0.65" />
              {/* Great Red Spot */}
              <ellipse cx="126" cy="126" rx="22" ry="13" fill="#DC2626" opacity="0.85" />
              <ellipse cx="126" cy="126" rx="14" ry="7" fill="#F87171" opacity="0.55" />
            </g>
          </>
        );

      case 'earth':
      default:
        return (
          <>
            <defs>
              <radialGradient id={`earthOcean-${uid}`} cx="35%" cy="30%" r="72%">
                <stop offset="0%" stopColor="#60A5FA" />
                <stop offset="50%" stopColor="#1D4ED8" />
                <stop offset="100%" stopColor="#0F172A" />
              </radialGradient>
              <clipPath id={`earthClip-${uid}`}>
                <circle cx="100" cy="100" r="88" />
              </clipPath>
            </defs>
            <circle cx="100" cy="100" r="88" fill={`url(#earthOcean-${uid})`} />
            <g clipPath={`url(#earthClip-${uid})`}>
              {/* Continents */}
              <path
                d="M52 44C74 36 96 44 108 62C116 74 102 92 86 96C72 100 58 84 48 68C44 58 44 48 52 44Z"
                fill="#4ADE80"
                opacity="0.9"
              />
              <path
                d="M116 98C136 94 158 106 164 128C168 144 148 164 132 162C118 160 108 134 110 114C112 104 112 100 116 98Z"
                fill="#22C55E"
                opacity="0.88"
              />
              <path
                d="M128 32C146 30 166 42 172 60C160 66 138 64 126 52C120 46 122 34 128 32Z"
                fill="#86EFAC"
                opacity="0.85"
              />
              {/* Atmospheric Cloud Swirls */}
              <path
                d="M28 84C58 74 96 90 128 76C146 68 164 74 176 82"
                stroke="#FFFFFF"
                strokeWidth="10"
                strokeLinecap="round"
                opacity="0.45"
              />
              <path
                d="M38 136C66 128 104 144 144 134"
                stroke="#FFFFFF"
                strokeWidth="8"
                strokeLinecap="round"
                opacity="0.38"
              />
              {/* Shadow Crescent */}
              <path
                d="M124 14C162 28 188 61 188 100C188 148 148 188 100 188C84 188 68 184 56 176C106 176 146 134 146 84C146 56 138 32 124 14Z"
                fill="#020617"
                opacity="0.35"
              />
            </g>
          </>
        );
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      className={`${className} ${locked ? 'opacity-85 saturate-75' : ''}`}
      aria-hidden="true"
    >
      {/* Subtle Outer Atmospheric Rim */}
      <circle
        cx="100"
        cy="100"
        r="92"
        fill={
          planetId === 'mars'
            ? 'rgba(251,146,60,0.16)'
            : planetId === 'moon'
              ? 'rgba(226,232,240,0.12)'
              : 'rgba(96,165,250,0.2)'
        }
      />
      {renderPlanet()}
      {/* Specular Soft Highlight */}
      <ellipse
        cx="66"
        cy="54"
        rx="26"
        ry="14"
        transform="rotate(-28 66 54)"
        fill="#FFFFFF"
        opacity="0.16"
      />
    </svg>
  );
}
