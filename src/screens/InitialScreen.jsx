import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import SpaceBackground from '../components/SpaceBackground.jsx';
import GameLogo from '../components/GameLogo.jsx';
import ArcadeButton from '../components/ArcadeButton.jsx';
import ExitModal from '../components/ExitModal.jsx';

export default function InitialScreen({
  config,
  gameState,
  onPlay,
  onRequestExit,
  onConfirmExit,
  onCancelExit,
  onToggleAudio,
}) {
  const initialCfg = config.screens.initial;
  const audioLabel = gameState.audioEnabled
    ? initialCfg.audioToggleLabelOn
    : initialCfg.audioToggleLabelOff;

  return (
    <main className="space-stage justify-between">
      <SpaceBackground showRocketAndMoon />

      {/* Top-Right Circular Audio Control */}
      <div className="relative z-20 flex justify-end p-5 sm:p-7 md:p-9">
        <ArcadeButton
          variant="cyan-circle"
          onClick={onToggleAudio}
          ariaLabel={audioLabel}
          ariaPressed={gameState.audioEnabled}
        >
          {gameState.audioEnabled ? (
            <Volume2
              size={30}
              strokeWidth={2.75}
              className="text-white drop-shadow-[0_2px_2px_rgba(7,89,133,0.75)]"
            />
          ) : (
            <VolumeX
              size={30}
              strokeWidth={2.75}
              className="text-white/90 drop-shadow-[0_2px_2px_rgba(7,89,133,0.75)]"
            />
          )}
        </ArcadeButton>
      </div>

      {/* Center Hero Logo & Primary Actions */}
      <section
        className="relative z-20 flex-1 flex flex-col items-center justify-center px-4 pb-16 sm:pb-20 -mt-6"
        aria-label={config.game.subtitle}
      >
        <GameLogo
          titleTop={config.game.titleTop}
          titleBottom={config.game.titleBottom}
        />

        <div className="mt-7 sm:mt-10 flex flex-col items-center gap-4 sm:gap-5">
          <ArcadeButton variant="yellow" onClick={onPlay}>
            {initialCfg.playButtonLabel}
          </ArcadeButton>

          <ArcadeButton variant="red" onClick={onRequestExit}>
            {initialCfg.exitButtonLabel}
          </ArcadeButton>
        </div>
      </section>

      {/* Exit Confirmation Modal */}
      <ExitModal
        isOpen={gameState.exitModalOpen}
        title={initialCfg.exitModal.title}
        message={initialCfg.exitModal.message}
        confirmLabel={initialCfg.exitModal.confirmLabel}
        cancelLabel={initialCfg.exitModal.cancelLabel}
        onConfirm={onConfirmExit}
        onCancel={onCancelExit}
      />
    </main>
  );
}
