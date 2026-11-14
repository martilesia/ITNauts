import React from 'react';

function CartoonStar({ className = '', size = 34, color = '#fbbf24' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M32 5.5C33.8 5.5 35.4 6.5 36.2 8.1L41.8 19.4C42.2 20.2 43 20.8 43.9 20.9L56.4 22.7C58.2 23 59.6 24.2 60.1 25.9C60.6 27.6 60.1 29.4 58.8 30.6L49.8 39.4C49.1 40 48.8 41 49 41.9L51.1 54.3C51.4 56.1 50.7 57.9 49.2 58.9C47.7 60 45.8 60.1 44.2 59.2L33.1 53.4C32.3 53 31.3 53 30.5 53.4L19.4 59.2C17.8 60.1 15.9 60 14.4 58.9C12.9 57.9 12.2 56.1 12.5 54.3L14.6 41.9C14.8 41 14.5 40 13.8 39.4L4.8 30.6C3.5 29.4 3 27.6 3.5 25.9C4 24.2 5.4 23 7.2 22.7L19.7 20.9C20.6 20.8 21.4 20.2 21.8 19.4L27.4 8.1C28.2 6.5 29.8 5.5 32 5.5Z"
        fill={color}
      />
      <path
        d="M32 9.5L26.5 20.6C25.6 22.4 23.9 23.6 21.9 23.9L9.8 25.7L18.5 34.2C19.9 35.6 20.6 37.6 20.2 39.6L18.2 51.6L29 45.9C30.8 45 32.9 45 34.7 45.9L45.5 51.6L43.5 39.6C43.1 37.6 43.8 35.6 45.2 34.2L53.9 25.7L41.8 23.9C39.8 23.6 38.1 22.4 37.2 20.6L32 9.5Z"
        fill="url(#starGoldGlow)"
        opacity="0.55"
      />
      <defs>
        <linearGradient id="starGoldGlow" x1="32" y1="8" x2="32" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF7AE" />
          <stop offset="1" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function FloatingCube({ className = '', size = 90 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <polygon points="50,8 90,28 50,48 10,28" fill="#512888" />
      <polygon points="10,28 50,48 50,92 10,72" fill="#3C1A6B" />
      <polygon points="90,28 50,48 50,92 90,72" fill="#2A114E" />
    </svg>
  );
}

function TinyStar({ className = '', size = 14 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 2L14.8 8.6L22 9.3L16.5 14L18.2 21L12 17.3L5.8 21L7.5 14L2 9.3L9.2 8.6L12 2Z"
        fill="#F8FAFC"
      />
    </svg>
  );
}

export default function SpaceBackground({ showRocketAndMoon = true }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Curved Nebula Wave Layers */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1440 810"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <path
          d="M-60 220C210 130 460 330 760 250C1060 170 1240 40 1510 110L1510 860L-60 860Z"
          fill="#35185F"
          opacity="0.55"
        />
        <path
          d="M-60 440C240 330 510 540 840 450C1140 370 1300 240 1510 310L1510 860L-60 860Z"
          fill="#3D1C6C"
          opacity="0.5"
        />
        <path
          d="M-60 660C280 540 600 740 940 640C1200 565 1350 470 1510 530L1510 860L-60 860Z"
          fill="#432078"
          opacity="0.45"
        />
      </svg>

      {/* Geometric Purple Floating Cubes */}
      <FloatingCube
        size={112}
        className="animate-float-slow absolute top-[-18px] right-[21%] opacity-75 rotate-[18deg] hidden sm:block"
      />
      <FloatingCube
        size={96}
        className="animate-float-slow absolute top-[43%] left-[-28px] opacity-65 rotate-[32deg]"
      />
      <FloatingCube
        size={128}
        className="animate-float-slow absolute bottom-[-24px] left-[7%] opacity-60 rotate-[-14deg]"
      />

      {/* Golden Cartoon Stars */}
      <CartoonStar
        size={38}
        color="#FBBF24"
        className="animate-twinkle absolute top-[5%] left-[31%] rotate-[-12deg]"
      />
      <CartoonStar
        size={56}
        color="#F59E0B"
        className="animate-twinkle absolute bottom-[6%] left-[25%] rotate-[14deg]"
      />
      <CartoonStar
        size={24}
        color="#FBBF24"
        className="animate-twinkle absolute bottom-[12%] right-[31%] rotate-[-18deg]"
      />

      {/* Tiny White Stars */}
      <TinyStar size={14} className="absolute top-[41%] left-[5%] opacity-90" />
      <TinyStar size={18} className="absolute top-[49%] right-[12%] opacity-95" />
      <TinyStar size={12} className="absolute top-[22%] right-[18%] opacity-75" />
      <TinyStar size={12} className="absolute bottom-[28%] left-[17%] opacity-75" />
      <TinyStar size={10} className="absolute top-[16%] left-[44%] opacity-65" />

      {showRocketAndMoon && (
        <>
          {/* Top-Left Stylized Cartoon Rocket */}
          <div className="animate-rocket absolute top-[3%] left-[5%] sm:top-[5%] sm:left-[9%] w-[110px] sm:w-[155px] md:w-[175px]">
            <svg viewBox="0 0 180 220" fill="none" className="w-full h-auto drop-shadow-[0_14px_20px_rgba(10,3,24,0.45)]">
              {/* Left & Right Swept Red Fins */}
              <path
                d="M52 124C26 142 18 168 20 184L54 166L52 124Z"
                fill="#C81E1E"
              />
              <path
                d="M128 124C154 142 162 168 160 184L126 166L128 124Z"
                fill="#DC2626"
              />
              {/* Golden Fin Tip Accents */}
              <path d="M20 184L26 170L34 176L20 184Z" fill="#FBBF24" />
              <path d="M160 184L154 170L146 176L160 184Z" fill="#FBBF24" />

              {/* Exhaust Nozzle */}
              <path d="M68 176H112L118 192H62L68 176Z" fill="#4C1D95" />
              <ellipse cx="90" cy="204" rx="20" ry="9" fill="#6D28D9" opacity="0.35" />

              {/* Rocket Fuselage */}
              <path
                d="M90 14C60 44 48 92 52 166C52 172 58 178 66 178H114C122 178 128 172 128 166C132 92 120 44 90 14Z"
                fill="#F8FAFC"
              />
              {/* Left Shading on Body */}
              <path
                d="M90 14C60 44 48 92 52 166C52 172 58 178 66 178H82C74 134 74 72 90 14Z"
                fill="#E2E8F0"
              />

              {/* Red Nose Cone */}
              <path
                d="M90 14C73 31 64 52 59 74C79 80 101 80 121 74C116 52 107 31 90 14Z"
                fill="#DC2626"
              />
              <path
                d="M90 14C73 31 64 52 59 74C68 77 77 78 85 78C80 54 83 32 90 14Z"
                fill="#B91C1C"
              />

              {/* Dark-Purple Porthole Window */}
              <circle cx="90" cy="112" r="22" fill="#94A3B8" />
              <circle cx="90" cy="112" r="15" fill="#2E1065" />
              <path
                d="M81 104C84 100 90 99 95 101"
                stroke="#6D28D9"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Fuselage Stripes */}
              <rect x="57" y="144" width="66" height="8" rx="4" fill="#94A3B8" />
              <rect x="60" y="158" width="60" height="7" rx="3.5" fill="#64748B" />

              {/* Center Tail Fin */}
              <path d="M90 156L96 188H84L90 156Z" fill="#DC2626" />
            </svg>
          </div>

          {/* Bottom-Right Cratered Moon */}
          <div className="absolute bottom-[-55px] right-[-45px] sm:bottom-[-40px] sm:right-[-25px] w-[220px] sm:w-[290px] md:w-[340px]">
            <svg viewBox="0 0 340 300" fill="none" className="w-full h-auto">
              <circle cx="205" cy="205" r="175" fill="#DED7EA" />
              <path
                d="M42 260C82 325 155 368 235 368C325 368 380 305 380 205C380 145 352 95 310 66C332 108 338 164 316 218C284 294 196 325 112 292C85 282 61 271 42 260Z"
                fill="#BFB2D4"
              />
              {/* Craters */}
              <ellipse cx="145" cy="108" rx="22" ry="11" transform="rotate(-14 145 108)" fill="#A898C2" />
              <ellipse cx="145" cy="105" rx="18" ry="8" transform="rotate(-14 145 105)" fill="#9482B0" />

              <ellipse cx="222" cy="84" rx="14" ry="8" transform="rotate(10 222 84)" fill="#A898C2" />

              <path
                d="M112 178C106 164 114 148 130 144C144 140 158 150 162 164C166 178 158 194 142 198C128 202 116 192 112 178Z"
                fill="#A898C2"
              />
              <path
                d="M118 178C113 166 120 153 132 150C143 147 154 155 157 166C160 177 154 189 141 192C130 195 121 188 118 178Z"
                fill="#8F7DAC"
              />

              <path
                d="M210 156C205 142 222 132 246 138C268 144 274 162 266 176C258 190 236 192 220 182C211 176 213 164 210 156Z"
                fill="#B0A0CA"
              />

              <circle cx="80" cy="222" r="18" fill="#A898C2" />
              <circle cx="82" cy="224" r="13" fill="#8F7DAC" />

              <ellipse cx="164" cy="245" rx="28" ry="20" transform="rotate(-10 164 245)" fill="#A898C2" />
              <ellipse cx="166" cy="247" rx="22" ry="15" transform="rotate(-10 166 247)" fill="#8F7DAC" />
            </svg>
          </div>
        </>
      )}
    </div>
  );
}
