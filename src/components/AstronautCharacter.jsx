import React from 'react';

function renderEmblem(emblemId) {
  switch (emblemId) {
    case 'rocket':
      return (
        <g transform="translate(130, 214)">
          <path d="M0 -13L7 4H-7L0 -13Z" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1.5" />
          <path d="M-7 4L-11 10H-4L-7 4Z" fill="#F59E0B" />
          <path d="M7 4L11 10H4L7 4Z" fill="#F59E0B" />
          <circle cx="0" cy="-2" r="2.5" fill="#E0F2FE" />
        </g>
      );
    case 'star':
      return (
        <path
          d="M130 200L133.8 207.8L142.4 209L136.2 215L137.7 223.5L130 219.5L122.3 223.5L123.8 215L117.6 209L126.2 207.8L130 200Z"
          fill="#FBBF24"
          stroke="#FFFFFF"
          strokeWidth="1.5"
        />
      );
    case 'moon':
      return (
        <path
          d="M135 202C127 202 121 208 121 215C121 222 127 228 135 228C138 228 141 227 143 225C136 225 131 220 131 214C131 208 135 203 141 203C139 202 137 202 135 202Z"
          fill="#FEF08A"
          stroke="#FFFFFF"
          strokeWidth="1.5"
        />
      );
    case 'bolt':
      return (
        <path
          d="M133 200L121 215H129L126 228L139 212H131L133 200Z"
          fill="#FDE047"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      );
    case 'atom':
      return (
        <g transform="translate(130, 214)">
          <ellipse cx="0" cy="0" rx="13" ry="5" transform="rotate(30)" stroke="#67E8F9" strokeWidth="2" fill="none" />
          <ellipse cx="0" cy="0" rx="13" ry="5" transform="rotate(-30)" stroke="#67E8F9" strokeWidth="2" fill="none" />
          <circle cx="0" cy="0" r="3" fill="#FDE047" />
        </g>
      );
    case 'saturn':
    default:
      return (
        <g transform="translate(130, 214)">
          <circle cx="0" cy="0" r="9.5" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="1.5" />
          <ellipse
            cx="0"
            cy="1"
            rx="17"
            ry="4.8"
            transform="rotate(-16)"
            stroke="#FDE68A"
            strokeWidth="2.8"
            fill="none"
          />
        </g>
      );
  }
}

function renderHair(hairId, color) {
  switch (hairId) {
    case 'braids':
      return (
        <g>
          {/* Braided pigtails */}
          <circle cx="80" cy="134" r="9" fill={color} />
          <circle cx="77" cy="147" r="7.5" fill={color} />
          <circle cx="75" cy="158" r="6" fill={color} />
          <circle cx="180" cy="134" r="9" fill={color} />
          <circle cx="183" cy="147" r="7.5" fill={color} />
          <circle cx="185" cy="158" r="6" fill={color} />
          <path
            d="M78 96C84 62 110 50 130 50C150 50 176 62 182 96C174 84 160 80 148 86C139 78 121 78 112 86C100 80 86 84 78 96Z"
            fill={color}
          />
        </g>
      );
    case 'bob':
      return (
        <path
          d="M74 118C74 72 98 48 130 48C162 48 186 72 186 118C186 134 180 144 172 146C174 126 172 96 164 88C152 80 142 84 130 84C118 84 108 80 96 88C88 96 86 126 88 146C80 144 74 134 74 118Z"
          fill={color}
        />
      );
    case 'twintails':
      return (
        <g>
          <path d="M82 94C64 98 58 124 68 146C76 138 82 124 84 108Z" fill={color} />
          <path d="M178 94C196 98 202 124 192 146C184 138 178 124 176 108Z" fill={color} />
          <circle cx="80" cy="94" r="5" fill="#F43F5E" />
          <circle cx="180" cy="94" r="5" fill="#F43F5E" />
          <path
            d="M80 96C86 62 110 50 130 50C150 50 174 62 180 96C166 84 148 82 130 88C112 82 94 84 80 96Z"
            fill={color}
          />
        </g>
      );
    case 'buns':
      return (
        <g>
          <circle cx="92" cy="56" r="17" fill={color} />
          <circle cx="168" cy="56" r="17" fill={color} />
          <path
            d="M80 96C86 64 110 52 130 52C150 52 174 64 180 96C166 84 148 82 130 86C112 82 94 84 80 96Z"
            fill={color}
          />
        </g>
      );
    case 'spiky':
      return (
        <path
          d="M78 100L84 68L102 74L114 48L130 66L146 46L158 72L176 66L182 100C166 84 148 80 130 86C112 80 94 84 78 100Z"
          fill={color}
        />
      );
    case 'classic':
    default:
      return (
        <path
          d="M78 102C80 64 104 48 130 48C156 48 180 64 182 102C174 88 160 84 148 92C140 80 122 80 112 92C100 84 86 88 78 102Z"
          fill={color}
        />
      );
  }
}

function renderBeltCharm(accessoryId) {
  switch (accessoryId) {
    case 'planet_charm':
      return (
        <g transform="translate(158, 256)">
          <circle cx="0" cy="0" r="8" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1.5" />
          <ellipse cx="0" cy="0" rx="13" ry="3.5" transform="rotate(-18)" stroke="#FDE047" strokeWidth="2" fill="none" />
        </g>
      );
    case 'gem_charm':
      return (
        <polygon
          points="158,244 167,254 158,268 149,254"
          fill="#EC4899"
          stroke="#FFFFFF"
          strokeWidth="1.8"
        />
      );
    case 'comet_charm':
      return (
        <g transform="translate(158, 255)">
          <circle cx="0" cy="0" r="7" fill="#FDE047" stroke="#FFFFFF" strokeWidth="1.5" />
          <path d="M4 -4L14 -12L8 0Z" fill="#FB923C" />
        </g>
      );
    case 'shield_charm':
      return (
        <path
          d="M150 247H166V257C166 263 158 268 158 268C158 268 150 263 150 257V247Z"
          fill="#22C55E"
          stroke="#FFFFFF"
          strokeWidth="1.8"
        />
      );
    case 'none':
      return null;
    case 'star_charm':
    default:
      return (
        <path
          d="M158 244L161.4 251L169 252.2L163.5 257.6L164.8 265.2L158 261.6L151.2 265.2L152.5 257.6L147 252.2L154.6 251L158 244Z"
          fill="#FACC15"
          stroke="#FFFFFF"
          strokeWidth="1.5"
        />
      );
  }
}

export default function AstronautCharacter({
  character = {},
  options = {},
  size = 280,
  waving = false,
  className = '',
}) {
  const hairOpt =
    (options.hair || []).find((h) => h.id === character.hair) || {
      id: 'classic',
      color: '#E5A93C',
    };
  const suitOpt =
    (options.suit || []).find((s) => s.id === character.suit) || {
      primary: '#1D8FE1',
      secondary: '#0F5EA8',
      trim: '#F8FAFC',
    };
  const gloveOpt =
    (options.gloves || []).find((g) => g.id === character.gloves) || {
      color: '#E0F2FE',
    };
  const bootOpt =
    (options.boots || []).find((b) => b.id === character.boots) || {
      color: '#1E40AF',
    };

  return (
    <svg
      width={size}
      height={size * 1.28}
      viewBox="0 0 260 335"
      fill="none"
      className={className}
      role="img"
      aria-label="Astronauta personalizado"
    >
      {/* Helmet Ear Pods */}
      <rect x="40" y="92" width="18" height="36" rx="9" fill={suitOpt.secondary} stroke="#FFFFFF" strokeWidth="2.5" />
      <rect x="202" y="92" width="18" height="36" rx="9" fill={suitOpt.secondary} stroke="#FFFFFF" strokeWidth="2.5" />

      {/* Outer Space Helmet Shell */}
      <circle cx="130" cy="108" r="82" fill="#E2E8F0" stroke="#FFFFFF" strokeWidth="4" />
      <circle cx="130" cy="108" r="71" fill="#BFDBFE" opacity="0.45" />

      {/* Head & Face */}
      <circle cx="130" cy="112" r="53" fill="#FDE1C8" />
      {/* Rosy Cheeks */}
      <ellipse cx="97" cy="124" rx="9" ry="5.5" fill="#FCA5A5" opacity="0.55" />
      <ellipse cx="163" cy="124" rx="9" ry="5.5" fill="#FCA5A5" opacity="0.55" />

      {/* Big Expressive Cartoon Eyes */}
      <circle cx="107" cy="112" r="11" fill="#065F46" />
      <circle cx="107" cy="112" r="6" fill="#064E3B" />
      <circle cx="103" cy="108" r="3.5" fill="#FFFFFF" />
      <circle cx="111" cy="116" r="1.8" fill="#FFFFFF" />

      <circle cx="153" cy="112" r="11" fill="#065F46" />
      <circle cx="153" cy="112" r="6" fill="#064E3B" />
      <circle cx="149" cy="108" r="3.5" fill="#FFFFFF" />
      <circle cx="157" cy="116" r="1.8" fill="#FFFFFF" />

      {/* Nose & Friendly Smile */}
      <path d="M128 122C129 124 131 124 132 122" stroke="#D97757" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M120 133C126 138 134 138 140 133" stroke="#9A3412" strokeWidth="2.6" strokeLinecap="round" />

      {/* Hair */}
      {renderHair(hairOpt.id, hairOpt.color)}

      {/* Helmet Glass Reflection */}
      <ellipse
        cx="164"
        cy="70"
        rx="22"
        ry="12"
        transform="rotate(28 164 70)"
        fill="#FFFFFF"
        opacity="0.55"
      />
      <circle cx="140" cy="52" r="5" fill="#FFFFFF" opacity="0.65" />

      {/* Neck Collar */}
      <rect x="94" y="176" width="72" height="14" rx="7" fill={suitOpt.secondary} stroke="#FFFFFF" strokeWidth="2.5" />

      {/* Left Arm */}
      <path
        d="M84 192L52 232L68 244L94 214Z"
        fill={suitOpt.primary}
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Left Glove */}
      <circle cx="56" cy="242" r="14" fill={gloveOpt.color} stroke="#FFFFFF" strokeWidth="2.5" />

      {/* Right Arm (Optional Waving Pose in Cockpit) */}
      {waving ? (
        <g>
          <path
            d="M176 196L212 162L224 176L186 214Z"
            fill={suitOpt.primary}
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <circle cx="220" cy="166" r="14" fill={gloveOpt.color} stroke="#FFFFFF" strokeWidth="2.5" />
        </g>
      ) : (
        <g>
          <path
            d="M176 192L208 232L192 244L166 214Z"
            fill={suitOpt.primary}
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <circle cx="204" cy="242" r="14" fill={gloveOpt.color} stroke="#FFFFFF" strokeWidth="2.5" />
        </g>
      )}

      {/* Torso / Spacesuit */}
      <path
        d="M88 188H172L180 250H80L88 188Z"
        fill={suitOpt.trim}
        stroke="#FFFFFF"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Colored Chest Vest */}
      <path
        d="M90 198H170L174 236H86L90 198Z"
        fill={suitOpt.primary}
      />
      {/* Chest Emblem */}
      {renderEmblem(character.emblem)}

      {/* Belt */}
      <rect x="80" y="236" width="100" height="12" rx="4" fill="#94A3B8" stroke="#FFFFFF" strokeWidth="2" />

      {/* Pants & Legs */}
      <path d="M84 248H126L122 296H88L84 248Z" fill={suitOpt.primary} stroke="#FFFFFF" strokeWidth="2.5" />
      <path d="M134 248H176L172 296H138L134 248Z" fill={suitOpt.primary} stroke="#FFFFFF" strokeWidth="2.5" />

      {/* Boots */}
      <path d="M84 290H124V314C124 318 118 320 104 320C90 320 82 318 82 312L84 290Z" fill={bootOpt.color} stroke="#FFFFFF" strokeWidth="2.5" />
      <path d="M136 290H176L178 312C178 318 170 320 156 320C142 320 136 318 136 314V290Z" fill={bootOpt.color} stroke="#FFFFFF" strokeWidth="2.5" />

      {/* Belt Accessory Charm */}
      {renderBeltCharm(character.accessory)}
    </svg>
  );
}
