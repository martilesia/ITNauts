import React from 'react';

export default function ArcadeButton({
  variant = 'yellow',
  onClick,
  children,
  ariaLabel,
  ariaPressed,
  type = 'button',
  className = '',
}) {
  const variantClasses = {
    yellow: 'arcade-btn--pill arcade-btn--yellow',
    red: 'arcade-btn--pill arcade-btn--red',
    'cyan-circle': 'arcade-btn--cyan-circle',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      className={`arcade-btn ${variantClasses[variant] || variantClasses.yellow} ${className}`}
    >
      {variant !== 'cyan-circle' && <span className="arcade-btn__gloss" aria-hidden="true" />}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
}
