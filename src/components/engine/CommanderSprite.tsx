import React from 'react';
import {
  EYE_COLORS,
  HAIR_COLORS,
  SKIN_TONES,
  SUIT_COLORS,
  VISOR_COLORS,
} from '../../data/scientificData';
import {
  CommanderProfile,
  EyeColorId,
  HairColorId,
  HairStyleId,
  PatchEmblemId,
  SkinToneId,
  SuitColorId,
  VisorColorId,
} from '../../types/game';

interface CommanderSpriteProps {
  profile: CommanderProfile;
  facing?: 'left' | 'right';
  isMoving?: boolean;
  isCelebrating?: boolean;
  carryingColor?: string | null;
  size?: number;
}

function renderHairBack(style: HairStyleId, color: { fill: string; highlight: string; shadow: string }) {
  switch (style) {
    case 'afro-crespo':
      return (
        <g>
          {/* Voluminous textured afro silhouette */}
          <path
            d="M22,31 C16,28 16,20 20,16 C20,10 27,6 33,8 C38,4 46,6 49,11 C55,9 60,15 58,21 C62,25 60,32 54,34 L50,36 L26,36 Z"
            fill={color.fill}
            stroke={color.shadow}
            strokeWidth="1.2"
          />
          <circle cx="25" cy="18" r="4.5" fill={color.fill} />
          <circle cx="55" cy="18" r="4.5" fill={color.fill} />
          <circle cx="32" cy="11" r="4.5" fill={color.fill} />
          <circle cx="48" cy="11" r="4.5" fill={color.fill} />
          <circle cx="40" cy="9" r="5" fill={color.fill} />
          {/* Coily texture highlights */}
          <path d="M25,15 Q28,12 31,15 M47,13 Q50,10 53,13 M37,10 Q40,8 43,10" fill="none" stroke={color.highlight} strokeWidth="1.3" strokeLinecap="round" />
        </g>
      );
    case 'crespo-puffs':
      return (
        <g>
          {/* Left & Right textured afro puffs */}
          <g>
            <circle cx="21" cy="16" r="7.5" fill={color.fill} stroke={color.shadow} strokeWidth="1.2" />
            <circle cx="17" cy="13" r="3.6" fill={color.fill} />
            <circle cx="23" cy="10" r="3.8" fill={color.fill} />
            <circle cx="15" cy="18" r="3.4" fill={color.fill} />
            <path d="M18,14 Q20,11 23,14" fill="none" stroke={color.highlight} strokeWidth="1.2" strokeLinecap="round" />
          </g>
          <g>
            <circle cx="59" cy="16" r="7.5" fill={color.fill} stroke={color.shadow} strokeWidth="1.2" />
            <circle cx="63" cy="13" r="3.6" fill={color.fill} />
            <circle cx="57" cy="10" r="3.8" fill={color.fill} />
            <circle cx="65" cy="18" r="3.4" fill={color.fill} />
            <path d="M57,14 Q60,11 62,14" fill="none" stroke={color.highlight} strokeWidth="1.2" strokeLinecap="round" />
          </g>
          {/* Ties */}
          <circle cx="26.5" cy="20" r="2.1" fill="#FACC15" stroke="#0F172A" strokeWidth="0.9" />
          <circle cx="53.5" cy="20" r="2.1" fill="#FACC15" stroke="#0F172A" strokeWidth="0.9" />
          <ellipse cx="40" cy="22" rx="15" ry="12" fill={color.fill} />
        </g>
      );
    case 'box-braids':
      return (
        <g>
          <ellipse cx="40" cy="23" rx="16" ry="13" fill={color.fill} />
          {/* Left & right braided strands */}
          {[22.5, 25.5, 54.5, 57.5].map((bx, i) => (
            <g key={i}>
              <rect x={bx - 1.7} y="22" width="3.4" height="22" rx="1.7" fill={color.fill} stroke={color.shadow} strokeWidth="0.9" />
              <line x1={bx - 1.3} y1="27" x2={bx + 1.3} y2="28" stroke={color.highlight} strokeWidth="1" />
              <line x1={bx - 1.3} y1="32" x2={bx + 1.3} y2="33" stroke={color.highlight} strokeWidth="1" />
              <line x1={bx - 1.3} y1="37" x2={bx + 1.3} y2="38" stroke={color.highlight} strokeWidth="1" />
              <circle cx={bx} cy="43.5" r="1.5" fill="#FACC15" />
            </g>
          ))}
        </g>
      );
    case 'pigtails':
      return (
        <g>
          {/* Bouncy side tails */}
          <path d="M24,23 C15,24 14,34 19,38 C22,39 25,35 26,30 Z" fill={color.fill} stroke={color.shadow} strokeWidth="1" />
          <path d="M56,23 C65,24 66,34 61,38 C58,39 55,35 54,30 Z" fill={color.fill} stroke={color.shadow} strokeWidth="1" />
          <circle cx="24.5" cy="25" r="2" fill="#EC4899" />
          <circle cx="55.5" cy="25" r="2" fill="#EC4899" />
          <ellipse cx="40" cy="24" rx="15" ry="13" fill={color.fill} />
        </g>
      );
    case 'wavy-bob':
      return (
        <path
          d="M23,24 C21,34 22,42 27,44 L53,44 C58,42 59,34 57,24 C56,14 48,10 40,10 C32,10 24,14 23,24 Z"
          fill={color.fill}
          stroke={color.shadow}
          strokeWidth="1"
        />
      );
    case 'curly-top':
      return (
        <g>
          <circle cx="26" cy="22" r="5" fill={color.fill} />
          <circle cx="54" cy="22" r="5" fill={color.fill} />
          <circle cx="25" cy="29" r="4.5" fill={color.fill} />
          <circle cx="55" cy="29" r="4.5" fill={color.fill} />
          <ellipse cx="40" cy="21" rx="16" ry="12" fill={color.fill} />
        </g>
      );
    case 'coily-fade':
    case 'short-swept':
    default:
      return <ellipse cx="40" cy="22" rx="14.8" ry="11.5" fill={color.fill} />;
  }
}

function renderHairFront(style: HairStyleId, color: { fill: string; highlight: string; shadow: string }) {
  switch (style) {
    case 'afro-crespo':
      return (
        <g>
          <path
            d="M25,22 C26,15 31,13 35,15 C38,12 42,12 45,15 C49,13 54,15 55,22 C52,18 47,17 40,17.5 C33,17 28,18 25,22 Z"
            fill={color.fill}
          />
          <circle cx="29" cy="17.5" r="2.6" fill={color.fill} />
          <circle cx="40" cy="16" r="2.8" fill={color.fill} />
          <circle cx="51" cy="17.5" r="2.6" fill={color.fill} />
          <path d="M32,16 Q35,14 38,16 M42,16 Q45,14 48,16" fill="none" stroke={color.highlight} strokeWidth="1.1" strokeLinecap="round" />
        </g>
      );
    case 'crespo-puffs':
      return (
        <g>
          <path
            d="M26,23 C28,16 34,14 40,16 C46,14 52,16 54,23 C49,18.5 44,18 40,19.5 C36,18 31,18.5 26,23 Z"
            fill={color.fill}
          />
          <line x1="40" y1="14" x2="40" y2="19" stroke={color.highlight} strokeWidth="1" strokeOpacity="0.65" />
        </g>
      );
    case 'coily-fade':
      return (
        <g>
          {/* Textured coily top crown */}
          <path
            d="M26,22 C25,14 31,10 40,10 C49,10 55,14 54,22 C51,18 46,17 40,17 C34,17 29,18 26,22 Z"
            fill={color.fill}
            stroke={color.shadow}
            strokeWidth="0.9"
          />
          <circle cx="31" cy="14" r="3" fill={color.fill} />
          <circle cx="37" cy="12.5" r="3.2" fill={color.fill} />
          <circle cx="43" cy="12.5" r="3.2" fill={color.fill} />
          <circle cx="49" cy="14" r="3" fill={color.fill} />
          <path d="M32,13 Q35,11 37,13 M42,13 Q45,11 47,13" fill="none" stroke={color.highlight} strokeWidth="1.1" strokeLinecap="round" />
        </g>
      );
    case 'box-braids':
      return (
        <g>
          <path
            d="M25,23 C26,15 33,12 40,13.5 C47,12 54,15 55,23 C51,18 46,17 40,18.5 C34,17 29,18 25,23 Z"
            fill={color.fill}
          />
          {/* Part lines */}
          <path d="M33,14 L31,19 M40,13.5 L40,18.5 M47,14 L49,19" stroke={color.highlight} strokeWidth="1" strokeOpacity="0.6" />
        </g>
      );
    case 'curly-top':
      return (
        <g>
          <circle cx="30" cy="17" r="4" fill={color.fill} />
          <circle cx="36" cy="15.5" r="4.2" fill={color.fill} />
          <circle cx="43" cy="15.5" r="4.2" fill={color.fill} />
          <circle cx="50" cy="17" r="4" fill={color.fill} />
          <path d="M34,16 Q37,14 39,16 M42,16 Q45,14 47,16" fill="none" stroke={color.highlight} strokeWidth="1.1" strokeLinecap="round" />
        </g>
      );
    case 'wavy-bob':
      return (
        <path
          d="M25,24 C26,14 34,12 40,13 C46,12 54,14 55,24 C50,18 44,18 40,20 C35,18 29,19 25,24 Z"
          fill={color.fill}
        />
      );
    case 'pigtails':
      return (
        <path
          d="M25.5,24 C27,15 34,13 40,15 C46,13 53,15 54.5,24 C50,19 45,19 40,21 C35,19 30,19 25.5,24 Z"
          fill={color.fill}
        />
      );
    case 'short-swept':
    default:
      return (
        <g>
          <path
            d="M25.5,24 C26,14 33,11 40,11.5 C47,11 54,14 54.5,24 C51,20 47,19 43,22 C41,19 37,20 34,23 C31,20 28,20 25.5,24 Z"
            fill={color.fill}
          />
          <path d="M31,15 Q38,13 47,15" fill="none" stroke={color.highlight} strokeWidth="1.2" strokeLinecap="round" />
        </g>
      );
  }
}

export function renderChestEmblem(emblem: PatchEmblemId, fill: string, accent: string, cx = 40, cy = 62) {
  if (emblem === 'planet') {
    return (
      <g transform={`translate(${cx}, ${cy})`}>
        <circle cx="0" cy="0" r="4.2" fill="#FB923C" stroke="#0F172A" strokeWidth="1" />
        <ellipse
          cx="0"
          cy="0"
          rx="8"
          ry="2.2"
          fill="none"
          stroke="#FDE047"
          strokeWidth="1.4"
          transform="rotate(-18)"
        />
      </g>
    );
  }
  if (emblem === 'star') {
    return (
      <polygon
        points={`${cx},${cy - 5} ${cx + 1.6},${cy - 1.5} ${cx + 5.2},${cy - 1} ${cx + 2.5},${cy + 1.4} ${cx + 3.2},${cy + 5} ${cx},${cy + 3.2} ${cx - 3.2},${cy + 5} ${cx - 2.5},${cy + 1.4} ${cx - 5.2},${cy - 1} ${cx - 1.6},${cy - 1.5}`}
        fill="#FACC15"
        stroke="#0F172A"
        strokeWidth="0.9"
      />
    );
  }
  if (emblem === 'rocket') {
    return (
      <g transform={`translate(${cx}, ${cy})`}>
        <path d="M0,-5.5 L3,1.5 L1.5,1.5 L1.5,5 L-1.5,5 L-1.5,1.5 L-3,1.5 Z" fill={accent} stroke="#0F172A" strokeWidth="0.9" />
      </g>
    );
  }
  return (
    <path
      d={`M${cx},${cy - 5} C${cx + 4.5},${cy - 3} ${cx + 4.5},${cy + 3} ${cx},${cy + 5} C${cx - 4.5},${cy + 3} ${cx - 4.5},${cy - 3} ${cx},${cy - 5} Z`}
      fill={fill === '#34D399' ? '#FDE047' : '#34D399'}
      stroke="#0F172A"
      strokeWidth="0.9"
    />
  );
}

/**
 * Clean head/hair/skin preview for the 2-column customization cards
 */
export const CommanderHeadPreview: React.FC<{
  skinTone?: SkinToneId;
  hairStyle?: HairStyleId;
  hairColor?: HairColorId;
  eyeColor?: EyeColorId;
  mannequinMode?: boolean;
  size?: number;
}> = ({
  skinTone = 'caramel-brown',
  hairStyle = 'afro-crespo',
  hairColor = 'jet-black',
  eyeColor = 'brown',
  mannequinMode = false,
  size = 64,
}) => {
  const skin = mannequinMode
    ? { base: '#CBD5E1', shadow: '#94A3B8', blush: '#94A3B8', lip: '#64748B' }
    : SKIN_TONES[skinTone] ?? SKIN_TONES['caramel-brown'];
  const hColor = HAIR_COLORS[hairColor] ?? HAIR_COLORS['jet-black'];
  const eColor = EYE_COLORS[eyeColor] ?? EYE_COLORS.brown;

  return (
    <svg viewBox="0 0 80 56" style={{ width: size, height: size * 0.7 }} aria-hidden="true">
      {/* Back Hair */}
      <g transform="translate(0, 2)">{renderHairBack(hairStyle, hColor)}</g>

      {/* Ears */}
      <circle cx="25.5" cy="29.5" r="3" fill={skin.base} stroke="#0F172A" strokeWidth="1" />
      <circle cx="54.5" cy="29.5" r="3" fill={skin.base} stroke="#0F172A" strokeWidth="1" />

      {/* Face */}
      <ellipse cx="40" cy="29" rx="14" ry="12.5" fill={skin.base} stroke="#0F172A" strokeWidth="1.2" />

      {/* Eyes */}
      {mannequinMode ? (
        <g stroke="#475569" strokeWidth="1.5" fill="none" strokeLinecap="round">
          <path d="M31,29 Q33.5,31.5 36,29" />
          <path d="M44,29 Q46.5,31.5 49,29" />
        </g>
      ) : (
        <g>
          {/* Left Eye */}
          <ellipse cx="33.5" cy="29" rx="3.4" ry="3.8" fill="#FFFFFF" stroke="#0F172A" strokeWidth="0.9" />
          <circle cx="33.8" cy="29.2" r="2.3" fill={eColor.iris} />
          <circle cx="33.8" cy="29.3" r="1.2" fill="#0F172A" />
          <circle cx="32.8" cy="28" r="0.9" fill="#FFFFFF" />
          {/* Right Eye */}
          <ellipse cx="46.5" cy="29" rx="3.4" ry="3.8" fill="#FFFFFF" stroke="#0F172A" strokeWidth="0.9" />
          <circle cx="46.2" cy="29.2" r="2.3" fill={eColor.iris} />
          <circle cx="46.2" cy="29.3" r="1.2" fill="#0F172A" />
          <circle cx="45.2" cy="28" r="0.9" fill="#FFFFFF" />
          {/* Rosy cheeks */}
          <ellipse cx="29.2" cy="33" rx="2.6" ry="1.4" fill={skin.blush} fillOpacity="0.5" />
          <ellipse cx="50.8" cy="33" rx="2.6" ry="1.4" fill={skin.blush} fillOpacity="0.5" />
        </g>
      )}

      {/* Smile */}
      <path d="M36.5,35.5 Q40,38.2 43.5,35.5" fill="none" stroke={mannequinMode ? '#475569' : skin.lip} strokeWidth="1.4" strokeLinecap="round" />

      {/* Front Hair */}
      <g transform="translate(0, 2)">{renderHairFront(hairStyle, hColor)}</g>
    </svg>
  );
};

/**
 * Clean suit / visor / emblem preview for customization grid tiles
 */
export const CommanderSuitPreview: React.FC<{
  suitColor?: SuitColorId;
  visorColor?: VisorColorId;
  emblem?: PatchEmblemId;
  size?: number;
}> = ({
  suitColor = 'cobalt-blue',
  visorColor = 'arctic-cyan',
  emblem = 'planet',
  size = 56,
}) => {
  const suit = SUIT_COLORS[suitColor] ?? SUIT_COLORS['cobalt-blue'];
  const visor = VISOR_COLORS[visorColor] ?? VISOR_COLORS['arctic-cyan'];

  return (
    <svg viewBox="0 0 80 68" style={{ width: size, height: size * 0.85 }} aria-hidden="true">
      {/* Helmet Bubble */}
      <circle cx="40" cy="22" r="16" fill={visor.fill} fillOpacity="0.22" stroke="#F8FAFC" strokeWidth="2.5" />
      <path d="M29,15 Q34,10 41,11" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
      <circle cx="24" cy="22" r="3" fill={visor.rim} stroke="#0F172A" strokeWidth="1" />
      <circle cx="56" cy="22" r="3" fill={visor.rim} stroke="#0F172A" strokeWidth="1" />
      {/* Suit Torso */}
      <rect x="27" y="37" width="26" height="22" rx="7" fill={suit.primary} stroke="#0F172A" strokeWidth="1.5" />
      <rect x="27" y="51" width="26" height="4" fill={suit.secondary} />
      <rect x="30" y="36" width="20" height="4" rx="2" fill="#F8FAFC" stroke="#0F172A" strokeWidth="1" />
      {renderChestEmblem(emblem, suit.primary, suit.trim, 40, 45)}
    </svg>
  );
};

export const CommanderSprite: React.FC<CommanderSpriteProps> = ({
  profile,
  facing = 'right',
  isMoving = false,
  isCelebrating = false,
  carryingColor = null,
  size = 76,
}) => {
  const suit = SUIT_COLORS[profile.suitColor] ?? SUIT_COLORS['cobalt-blue'];
  const visor = VISOR_COLORS[profile.visorColor] ?? VISOR_COLORS['arctic-cyan'];
  const skin = SKIN_TONES[profile.skinTone] ?? SKIN_TONES['caramel-brown'];
  const hairColor = HAIR_COLORS[profile.hairColor] ?? HAIR_COLORS['jet-black'];
  const hairStyle = profile.hairStyle ?? 'afro-crespo';
  const eyeColor = EYE_COLORS[profile.eyeColor] ?? EYE_COLORS.brown;

  return (
    <div
      className="relative select-none pointer-events-none"
      style={{
        width: size,
        height: size * 1.12,
        transform: `scaleX(${facing === 'left' ? -1 : 1}) translateY(${isCelebrating ? '-6px' : '0px'})`,
        transition: 'transform 140ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Ground shadow */}
      <div
        className="absolute bottom-0.5 left-1/2 -translate-x-1/2 rounded-full bg-black/45 blur-[2px]"
        style={{ width: size * 0.58, height: size * 0.14 }}
      />

      <svg
        viewBox="0 0 80 94"
        className={`w-full h-full ${isMoving ? 'animate-bounce' : ''}`}
        style={{ animationDuration: isMoving ? '360ms' : undefined }}
      >
        {/* Life Support Backpack */}
        <rect x="21" y="49" width="38" height="22" rx="6" fill={suit.secondary} stroke="#0F172A" strokeWidth="1.8" />

        {/* Legs */}
        <rect
          x="29"
          y="71"
          width="9"
          height="13"
          rx="4"
          fill={suit.secondary}
          stroke="#0F172A"
          strokeWidth="1.8"
          transform={isMoving ? 'rotate(-10 33 71)' : undefined}
        />
        <rect
          x="42"
          y="71"
          width="9"
          height="13"
          rx="4"
          fill={suit.primary}
          stroke="#0F172A"
          strokeWidth="1.8"
          transform={isMoving ? 'rotate(10 46 71)' : undefined}
        />
        {/* Space Boots */}
        <rect x="27" y="81" width="12" height="6" rx="3" fill="#F8FAFC" stroke="#0F172A" strokeWidth="1.6" />
        <rect x="41" y="81" width="12" height="6" rx="3" fill="#F8FAFC" stroke="#0F172A" strokeWidth="1.6" />
        <rect x="28" y="85" width="10" height="2.2" rx="1" fill={visor.rim} />
        <rect x="42" y="85" width="10" height="2.2" rx="1" fill={visor.rim} />

        {/* Torso Spacesuit */}
        <rect x="26" y="49" width="28" height="24" rx="8" fill={suit.primary} stroke="#0F172A" strokeWidth="1.8" />
        {/* Chest White Bib & Stripes */}
        <path d="M27,50 Q40,54 53,50 L53,57 Q40,60 27,57 Z" fill="#F8FAFC" fillOpacity="0.92" />
        {/* Belt + Cute Star Charm */}
        <rect x="26" y="66.5" width="28" height="4" rx="1.5" fill="#94A3B8" stroke="#0F172A" strokeWidth="1.2" />
        <polygon
          points="51,69 52.3,71.7 55.2,72.1 53.1,74.1 53.6,77 51,75.6 48.4,77 48.9,74.1 46.8,72.1 49.7,71.7"
          fill="#FACC15"
          stroke="#0F172A"
          strokeWidth="0.9"
        />
        {/* Chest Emblem */}
        {renderChestEmblem(profile.emblem, suit.primary, suit.trim, 40, 61)}

        {/* Left Arm */}
        <g transform={isCelebrating ? 'rotate(128 24 54)' : 'rotate(16 24 54)'}>
          <rect x="17" y="51" width="8" height="15" rx="4" fill={suit.primary} stroke="#0F172A" strokeWidth="1.8" />
          <line x1="18" y1="58" x2="24" y2="58" stroke="#F8FAFC" strokeWidth="2" />
          <circle cx="21" cy="67" r="4.2" fill="#E2E8F0" stroke="#0F172A" strokeWidth="1.5" />
        </g>

        {/* Right Arm */}
        <g
          transform={
            isCelebrating
              ? 'rotate(-128 56 54)'
              : carryingColor
                ? 'rotate(-48 56 54)'
                : 'rotate(-16 56 54)'
          }
        >
          <rect x="55" y="51" width="8" height="15" rx="4" fill={suit.primary} stroke="#0F172A" strokeWidth="1.8" />
          <line x1="56" y1="58" x2="62" y2="58" stroke="#F8FAFC" strokeWidth="2" />
          <circle cx="59" cy="67" r="4.2" fill="#E2E8F0" stroke="#0F172A" strokeWidth="1.5" />
        </g>

        {/* Carried Instrument Orb */}
        {carryingColor && (
          <g transform="translate(66, 44)">
            <circle cx="0" cy="0" r="6.5" fill={carryingColor} stroke="#0F172A" strokeWidth="1.5" />
            <circle cx="-2" cy="-2" r="2.2" fill="#FFFFFF" fillOpacity="0.75" />
          </g>
        )}

        {/* Helmet Back Glass Shell (subtle space tint behind hair) */}
        <circle cx="40" cy="27" r="22.5" fill={visor.fill} fillOpacity="0.14" />

        {/* Back Hair Layer (inside bubble helmet) */}
        <g transform="translate(0, 2)">{renderHairBack(hairStyle, hairColor)}</g>

        {/* Neck & Ears */}
        <rect x="35.5" y="40" width="9" height="6" rx="2.5" fill={skin.shadow} />
        <circle cx="25.5" cy="30" r="3" fill={skin.base} stroke="#0F172A" strokeWidth="1.1" />
        <circle cx="54.5" cy="30" r="3" fill={skin.base} stroke="#0F172A" strokeWidth="1.1" />

        {/* Face */}
        <ellipse cx="40" cy="30" rx="14" ry="12.5" fill={skin.base} stroke="#0F172A" strokeWidth="1.3" />

        {/* Rosy Cheeks */}
        <ellipse cx="29.5" cy="33.5" rx="2.9" ry="1.6" fill={skin.blush} fillOpacity="0.52" />
        <ellipse cx="50.5" cy="33.5" rx="2.9" ry="1.6" fill={skin.blush} fillOpacity="0.52" />

        {/* Expressive Sparkling Eyes */}
        <g>
          {/* Left Eye */}
          <ellipse cx="33.2" cy="29.5" rx="3.7" ry="4.2" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.1" />
          <circle cx="33.6" cy="29.7" r="2.6" fill={eyeColor.iris} />
          <circle cx="33.6" cy="29.8" r="1.4" fill="#0F172A" />
          <circle cx="32.4" cy="28.3" r="1.1" fill="#FFFFFF" />
          <circle cx="34.8" cy="31" r="0.55" fill="#FFFFFF" />
          <path d="M29.4,26.8 Q33.2,24.8 36.8,26.8" fill="none" stroke="#0F172A" strokeWidth="1.4" strokeLinecap="round" />

          {/* Right Eye */}
          <ellipse cx="46.8" cy="29.5" rx="3.7" ry="4.2" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.1" />
          <circle cx="46.4" cy="29.7" r="2.6" fill={eyeColor.iris} />
          <circle cx="46.4" cy="29.8" r="1.4" fill="#0F172A" />
          <circle cx="45.2" cy="28.3" r="1.1" fill="#FFFFFF" />
          <circle cx="47.6" cy="31" r="0.55" fill="#FFFFFF" />
          <path d="M43.2,26.8 Q46.8,24.8 50.6,26.8" fill="none" stroke="#0F172A" strokeWidth="1.4" strokeLinecap="round" />
        </g>

        {/* Cute Nose & Happy Smile */}
        <path d="M39.3,32.5 Q40,33.3 40.7,32.5" fill="none" stroke={skin.shadow} strokeWidth="1.1" strokeLinecap="round" />
        <path d="M36.3,36.2 Q40,39.2 43.7,36.2" fill="none" stroke={skin.lip} strokeWidth="1.6" strokeLinecap="round" />

        {/* Front Hair Layer */}
        <g transform="translate(0, 2)">{renderHairFront(hairStyle, hairColor)}</g>

        {/* Clear Glass Bubble Helmet Ring, Ear Pods & Specular Shine */}
        <circle cx="17" cy="27" r="4" fill={visor.rim} stroke="#0F172A" strokeWidth="1.3" />
        <circle cx="63" cy="27" r="4" fill={visor.rim} stroke="#0F172A" strokeWidth="1.3" />
        <circle
          cx="40"
          cy="27"
          r="22.5"
          fill={visor.fill}
          fillOpacity="0.11"
          stroke="#F8FAFC"
          strokeWidth="3.4"
        />
        <circle cx="40" cy="27" r="24.2" fill="none" stroke="#0F172A" strokeWidth="1.2" strokeOpacity="0.35" />
        {/* Helmet Neck Collar */}
        <path
          d="M24,45.5 Q40,51 56,45.5"
          fill="none"
          stroke="#F8FAFC"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M24,45.5 Q40,51 56,45.5"
          fill="none"
          stroke={visor.rim}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        {/* Glass Highlights */}
        <path d="M24,16 Q31,9 41,9" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" opacity="0.82" />
        <circle cx="53" cy="14" r="2.2" fill="#FFFFFF" opacity="0.72" />
      </svg>
    </div>
  );
};
