import React from 'react';

interface RoverCartoonSvgProps {
  size?: number;
  facing?: 'right' | 'left' | 'up' | 'down';
  moving?: boolean;
  damaged?: boolean;
  className?: string;
}

export const RoverCartoonSvg: React.FC<RoverCartoonSvgProps> = ({
  size = 64,
  facing = 'right',
  moving = false,
  damaged = false,
  className = '',
}) => {
  const flipX = facing === 'left' ? -1 : 1;
  const tiltDeg = facing === 'up' ? -6 : facing === 'down' ? 6 : 0;

  return (
    <div
      className={`inline-flex items-center justify-center transition-transform duration-150 ${className}`}
      style={{
        width: size,
        height: size,
        transform: `scaleX(${flipX}) rotate(${tiltDeg}deg) ${moving ? 'translateY(-1px)' : ''}`,
      }}
    >
      <svg viewBox="0 0 80 64" className="h-full w-full drop-shadow-md" aria-hidden="true">
        {/* Mast & Stereo Camera */}
        <rect x="46" y="10" width="4" height="16" rx="2" fill="#94A3B8" stroke="#0F172A" strokeWidth="2" />
        <rect x="41" y="6" width="16" height="10" rx="4" fill="#E2E8F0" stroke="#0F172A" strokeWidth="2" />
        <circle cx="46" cy="11" r="2.2" fill="#38BDF8" />
        <circle cx="52" cy="11" r="2.2" fill="#38BDF8" />

        {/* Rear Antenna */}
        <line x1="20" y1="10" x2="20" y2="24" stroke="#CBD5E1" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="20" cy="9" r="3" fill={damaged ? '#FB7185' : '#34D399'} stroke="#0F172A" strokeWidth="1.5" />

        {/* Solar Wing */}
        <rect x="13" y="21" width="22" height="6" rx="2" fill="#0284C7" stroke="#0F172A" strokeWidth="1.8" />
        <line x1="20" y1="21" x2="20" y2="27" stroke="#7DD3FC" strokeWidth="1" />
        <line x1="27" y1="21" x2="27" y2="27" stroke="#7DD3FC" strokeWidth="1" />

        {/* Rover Body */}
        <rect
          x="16"
          y="25"
          width="44"
          height="17"
          rx="6"
          fill={damaged ? '#FCA5A5' : '#FACC15'}
          stroke="#0F172A"
          strokeWidth="2.2"
        />
        <rect x="23" y="29" width="20" height="8" rx="3" fill="#FFFBEB" opacity="0.85" />
        <circle cx="51" cy="33" r="3.5" fill="#F97316" stroke="#0F172A" strokeWidth="1.5" />

        {/* Suspension Struts */}
        <path d="M22 42 L18 49 M39 42 L39 49 M56 42 L60 49" stroke="#475569" strokeWidth="3" strokeLinecap="round" />

        {/* 3 Rugged Wheels */}
        {[18, 39, 60].map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy="51" r="7.5" fill="#1E293B" stroke="#0F172A" strokeWidth="2" />
            <circle cx={cx} cy="51" r="3" fill="#94A3B8" />
          </g>
        ))}
      </svg>
    </div>
  );
};
