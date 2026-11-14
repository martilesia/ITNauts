import React, { useEffect, useState, useCallback } from 'react';
import { loadGameConfig } from './data/configLoader.js';
import InitialScreen from './screens/InitialScreen.jsx';
import PersonalizationScreen from './screens/PersonalizationScreen.jsx';
import DestinationScreen from './screens/DestinationScreen.jsx';
import ExperimentsScreen from './screens/ExperimentsScreen.jsx';
import GameplayPlaceholderScreen from './screens/GameplayPlaceholderScreen.jsx';
import ArcadeButton from './components/ArcadeButton.jsx';
import { playClickSound, playStartFanfare } from './utils/soundFx.js';

export default function App() {
  const [config, setConfig] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gameState, setGameState] = useState(null);

  const initializeApp = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const loadedConfig = await loadGameConfig();
      const engine = window.SpaceBaseEngine;

      if (!engine) {
        throw new Error('O motor de jogo (public/engine.js) não está disponível.');
      }

      engine.init(loadedConfig);
      setConfig(loadedConfig);
      setGameState(engine.getState());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao iniciar.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  useEffect(() => {
    const engine = window.SpaceBaseEngine;
    if (!engine || !config) return undefined;

    const unsubscribe = engine.subscribe((nextState) => {
      setGameState(nextState);
    });
    return unsubscribe;
  }, [config]);

  const handlePlay = useCallback(() => {
    const engine = window.SpaceBaseEngine;
    if (!engine) return;
    playStartFanfare(gameState?.audioEnabled);
    engine.startGame();
  }, [gameState?.audioEnabled]);

  const handleSelectPart = useCallback(
    (category, optionId) => {
      const engine = window.SpaceBaseEngine;
      if (!engine) return;
      playClickSound(gameState?.audioEnabled);
      engine.updateCharacterPart(category, optionId);
    },
    [gameState?.audioEnabled]
  );

  const handleRandomizeCharacter = useCallback(() => {
    const engine = window.SpaceBaseEngine;
    if (!engine) return;
    playClickSound(gameState?.audioEnabled);
    engine.randomizeCharacter();
  }, [gameState?.audioEnabled]);

  const handleConfirmPersonalization = useCallback(() => {
    const engine = window.SpaceBaseEngine;
    if (!engine) return;
    playStartFanfare(gameState?.audioEnabled);
    engine.confirmPersonalization();
  }, [gameState?.audioEnabled]);

  const handleSelectDestination = useCallback(
    (destinationId) => {
      const engine = window.SpaceBaseEngine;
      if (!engine) return;
      playStartFanfare(gameState?.audioEnabled);
      engine.selectDestination(destinationId);
    },
    [gameState?.audioEnabled]
  );

  const handleSelectPlanet = useCallback(
    (planetId) => {
      const engine = window.SpaceBaseEngine;
      if (!engine) return;
      playClickSound(gameState?.audioEnabled);
      engine.selectPlanet(planetId);
    },
    [gameState?.audioEnabled]
  );

  const handleOpenExperiment = useCallback(
    (experimentId) => {
      const engine = window.SpaceBaseEngine;
      if (!engine) return;
      playClickSound(gameState?.audioEnabled);
      engine.openExperiment(experimentId);
    },
    [gameState?.audioEnabled]
  );

  const handleCloseExperiment = useCallback(() => {
    const engine = window.SpaceBaseEngine;
    if (!engine) return;
    playClickSound(gameState?.audioEnabled);
    engine.closeExperiment();
  }, [gameState?.audioEnabled]);

  const handleCompleteExperiment = useCallback(
    (experimentId, earnedStars) => {
      const engine = window.SpaceBaseEngine;
      if (!engine) return;
      playStartFanfare(gameState?.audioEnabled);
      engine.completeExperiment(experimentId, earnedStars);
    },
    [gameState?.audioEnabled]
  );

  const handleRequestExit = useCallback(() => {
    const engine = window.SpaceBaseEngine;
    if (!engine) return;
    playClickSound(gameState?.audioEnabled);
    engine.requestExit();
  }, [gameState?.audioEnabled]);

  const handleConfirmExit = useCallback(() => {
    const engine = window.SpaceBaseEngine;
    if (!engine) return;
    playClickSound(gameState?.audioEnabled);
    engine.confirmExit();
  }, [gameState?.audioEnabled]);

  const handleCancelExit = useCallback(() => {
    const engine = window.SpaceBaseEngine;
    if (!engine) return;
    playClickSound(gameState?.audioEnabled);
    engine.cancelExit();
  }, [gameState?.audioEnabled]);

  const handleToggleAudio = useCallback(() => {
    const engine = window.SpaceBaseEngine;
    if (!engine) return;
    const nextState = engine.toggleAudio();
    if (nextState.audioEnabled) {
      playClickSound(true);
    }
  }, []);

  const handleReturnToTitle = useCallback(() => {
    const engine = window.SpaceBaseEngine;
    if (!engine) return;
    playClickSound(gameState?.audioEnabled);
    engine.returnToInitialScreen();
  }, [gameState?.audioEnabled]);

  const handleBackToPersonalization = useCallback(() => {
    const engine = window.SpaceBaseEngine;
    if (!engine) return;
    playClickSound(gameState?.audioEnabled);
    engine.goToScreen(engine.SCREENS.PERSONALIZATION);
  }, [gameState?.audioEnabled]);

  const handleBackToDestinations = useCallback(() => {
    const engine = window.SpaceBaseEngine;
    if (!engine) return;
    playClickSound(gameState?.audioEnabled);
    engine.goToScreen(engine.SCREENS.DESTINATION);
  }, [gameState?.audioEnabled]);

  if (loading) {
    return (
      <main className="space-stage items-center justify-center p-6">
        <p className="text-lg font-bold text-purple-100">
          A carregar Space Base Commander...
        </p>
      </main>
    );
  }

  if (error || !config || !gameState) {
    return (
      <main className="space-stage items-center justify-center p-6">
        <div className="max-w-md w-full rounded-3xl border-4 border-white/90 bg-[#35185f] p-7 text-center shadow-2xl">
          <h1
            className="text-2xl font-extrabold text-amber-300 mb-3"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {config?.messages?.configErrorTitle || 'Erro ao carregar configuração'}
          </h1>
          <p className="text-purple-100 mb-6">{error}</p>
          <ArcadeButton
            variant="yellow"
            onClick={initializeApp}
            className="!min-w-[190px] !min-h-[54px] !text-lg"
          >
            {config?.messages?.configErrorRetry || 'Tentar novamente'}
          </ArcadeButton>
        </div>
      </main>
    );
  }

  const screens = window.SpaceBaseEngine?.SCREENS;

  if (screens && gameState.currentScreen === screens.PERSONALIZATION) {
    return (
      <PersonalizationScreen
        config={config}
        gameState={gameState}
        onSelectPart={handleSelectPart}
        onRandomize={handleRandomizeCharacter}
        onConfirm={handleConfirmPersonalization}
        onBackToTitle={handleReturnToTitle}
        onToggleAudio={handleToggleAudio}
      />
    );
  }

  if (screens && gameState.currentScreen === screens.DESTINATION) {
    return (
      <DestinationScreen
        config={config}
        gameState={gameState}
        onSelectDestination={handleSelectDestination}
        onBackToPersonalization={handleBackToPersonalization}
        onToggleAudio={handleToggleAudio}
      />
    );
  }

  if (screens && gameState.currentScreen === screens.EXPERIMENTS) {
    return (
      <ExperimentsScreen
        config={config}
        gameState={gameState}
        onSelectPlanet={handleSelectPlanet}
        onOpenExperiment={handleOpenExperiment}
        onCloseExperiment={handleCloseExperiment}
        onCompleteExperiment={handleCompleteExperiment}
        onBackToDestinations={handleBackToDestinations}
        onBackToTitle={handleReturnToTitle}
        onToggleAudio={handleToggleAudio}
      />
    );
  }

  if (screens && gameState.currentScreen === screens.EXITED) {
    return (
      <GameplayPlaceholderScreen
        title={config.screens.initial.exitedState.title}
        description={config.screens.initial.exitedState.message}
        backLabel={config.screens.initial.exitedState.restartLabel}
        onReturnToTitle={handleReturnToTitle}
      />
    );
  }

  return (
    <InitialScreen
      config={config}
      gameState={gameState}
      onPlay={handlePlay}
      onRequestExit={handleRequestExit}
      onConfirmExit={handleConfirmExit}
      onCancelExit={handleCancelExit}
      onToggleAudio={handleToggleAudio}
    />
  );
}
