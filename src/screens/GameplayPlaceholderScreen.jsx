import React from 'react';
import SpaceBackground from '../components/SpaceBackground.jsx';
import ArcadeButton from '../components/ArcadeButton.jsx';

export default function GameplayPlaceholderScreen({
  title,
  description,
  backLabel,
  onReturnToTitle,
}) {
  return (
    <main className="space-stage items-center justify-center px-4 py-10">
      <SpaceBackground showRocketAndMoon={false} />

      <section className="relative z-20 w-full max-w-xl rounded-3xl border-4 border-white/90 bg-gradient-to-b from-[#3d1c6e]/95 to-[#261047]/95 p-7 sm:p-10 text-center shadow-[0_24px_60px_rgba(10,3,24,0.7)]">
        <h1
          className="text-2xl sm:text-4xl font-extrabold text-amber-300 tracking-tight mb-4"
          style={{ fontFamily: 'var(--font-display)', textWrap: 'balance' }}
        >
          {title}
        </h1>
        <p className="text-base sm:text-lg text-purple-100 leading-relaxed mb-8">
          {description}
        </p>

        <ArcadeButton
          variant="yellow"
          onClick={onReturnToTitle}
          className="!min-w-[230px] !min-h-[58px] !text-lg"
        >
          {backLabel}
        </ArcadeButton>
      </section>
    </main>
  );
}
