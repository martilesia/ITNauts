(function (global) {
  'use strict';

  const SCREENS = {
    INITIAL: 'INITIAL',
    PERSONALIZATION: 'PERSONALIZATION',
    DESTINATION: 'DESTINATION',
    EXPERIMENTS: 'EXPERIMENTS',
    EXITED: 'EXITED',
  };

  function createInitialProgress(config) {
    const progress = {};
    const planets =
      (config.screens &&
        config.screens.experiments &&
        config.screens.experiments.planets) ||
      [];

    planets.forEach(function (planet) {
      progress[planet.id] = {
        unlocked: Boolean(planet.unlockedByDefault),
        unlockedUpTo: 1,
        starsByExperiment: {},
      };
    });

    if (!progress.earth) {
      progress.earth = {
        unlocked: true,
        unlockedUpTo: 1,
        starsByExperiment: {},
      };
    }

    return progress;
  }

  function createSpaceBaseEngine() {
    let config = null;
    const listeners = new Set();

    let state = {
      initialized: false,
      currentScreen: SCREENS.INITIAL,
      audioEnabled: true,
      exitModalOpen: false,
      sessionActive: false,
      sessionCount: 0,
      character: {
        hair: 'classic',
        suit: 'azure',
        emblem: 'saturn',
        gloves: 'ice',
        boots: 'cobalt',
        accessory: 'star_charm',
      },
      selectedDestination: null,
      activePlanetId: 'earth',
      activeExperimentId: null,
      experimentProgress: {},
      statusNotice: null,
      lastAction: null,
    };

    function notify() {
      const snapshot = getState();
      listeners.forEach(function (listener) {
        try {
          listener(snapshot);
        } catch (err) {
          console.error('[SpaceBaseEngine] Listener error:', err);
        }
      });
    }

    function init(loadedConfig) {
      config = loadedConfig || {};
      const defaultAudio =
        config.game && typeof config.game.defaultAudioEnabled === 'boolean'
          ? config.game.defaultAudioEnabled
          : true;

      const defaultCharacter =
        (config.screens &&
          config.screens.personalization &&
          config.screens.personalization.defaultCharacter) || {
          hair: 'classic',
          suit: 'azure',
          emblem: 'saturn',
          gloves: 'ice',
          boots: 'cobalt',
          accessory: 'star_charm',
        };

      state = {
        initialized: true,
        currentScreen: SCREENS.INITIAL,
        audioEnabled: defaultAudio,
        exitModalOpen: false,
        sessionActive: false,
        sessionCount: 0,
        character: Object.assign({}, defaultCharacter),
        selectedDestination: null,
        activePlanetId: 'earth',
        activeExperimentId: null,
        experimentProgress: createInitialProgress(config),
        statusNotice: null,
        lastAction: 'ENGINE_INITIALIZED',
      };
      notify();
      return getState();
    }

    function getState() {
      return {
        initialized: state.initialized,
        currentScreen: state.currentScreen,
        audioEnabled: state.audioEnabled,
        exitModalOpen: state.exitModalOpen,
        sessionActive: state.sessionActive,
        sessionCount: state.sessionCount,
        character: Object.assign({}, state.character),
        selectedDestination: state.selectedDestination,
        activePlanetId: state.activePlanetId,
        activeExperimentId: state.activeExperimentId,
        experimentProgress: JSON.parse(JSON.stringify(state.experimentProgress)),
        statusNotice: state.statusNotice,
        lastAction: state.lastAction,
      };
    }

    function subscribe(listener) {
      if (typeof listener !== 'function') {
        return function () {};
      }
      listeners.add(listener);
      listener(getState());
      return function unsubscribe() {
        listeners.delete(listener);
      };
    }

    function startGame() {
      state = Object.assign({}, state, {
        currentScreen: SCREENS.PERSONALIZATION,
        exitModalOpen: false,
        sessionActive: true,
        sessionCount: state.sessionCount + 1,
        statusNotice: null,
        lastAction: 'GAME_STARTED',
      });
      notify();
      return getState();
    }

    function updateCharacterPart(category, optionId) {
      if (!category || !optionId) return getState();
      const nextCharacter = Object.assign({}, state.character);
      nextCharacter[category] = optionId;

      state = Object.assign({}, state, {
        character: nextCharacter,
        lastAction: 'CHARACTER_UPDATED',
      });
      notify();
      return getState();
    }

    function randomizeCharacter() {
      const options =
        (config &&
          config.screens &&
          config.screens.personalization &&
          config.screens.personalization.options) ||
        {};
      const nextCharacter = Object.assign({}, state.character);

      Object.keys(options).forEach(function (category) {
        const list = options[category];
        if (Array.isArray(list) && list.length > 0) {
          const picked = list[Math.floor(Math.random() * list.length)];
          nextCharacter[category] = picked.id;
        }
      });

      state = Object.assign({}, state, {
        character: nextCharacter,
        lastAction: 'CHARACTER_RANDOMIZED',
      });
      notify();
      return getState();
    }

    function confirmPersonalization() {
      state = Object.assign({}, state, {
        currentScreen: SCREENS.DESTINATION,
        statusNotice: null,
        lastAction: 'PERSONALIZATION_CONFIRMED',
      });
      notify();
      return getState();
    }

    function selectDestination(destinationId) {
      const destinations =
        (config &&
          config.screens &&
          config.screens.destination &&
          config.screens.destination.destinations) ||
        [];
      const target = destinations.find(function (d) {
        return d.id === destinationId;
      });
      const planetId = target ? target.planetId : destinationId;

      const nextProgress = JSON.parse(JSON.stringify(state.experimentProgress));
      if (nextProgress[planetId]) {
        nextProgress[planetId].unlocked = true;
      }

      state = Object.assign({}, state, {
        selectedDestination: destinationId,
        activePlanetId: planetId || 'earth',
        experimentProgress: nextProgress,
        currentScreen: SCREENS.EXPERIMENTS,
        activeExperimentId: null,
        statusNotice: null,
        lastAction: 'DESTINATION_SELECTED',
      });
      notify();
      return getState();
    }

    function selectPlanet(planetId) {
      const planetState = state.experimentProgress[planetId];
      if (!planetState || !planetState.unlocked) {
        const msg =
          (config &&
            config.screens &&
            config.screens.experiments &&
            config.screens.experiments.lockedPlanetMessage) ||
          'Planeta bloqueado.';
        state = Object.assign({}, state, {
          statusNotice: msg,
          lastAction: 'PLANET_LOCKED',
        });
        notify();
        return getState();
      }

      state = Object.assign({}, state, {
        activePlanetId: planetId,
        activeExperimentId: null,
        statusNotice: null,
        lastAction: 'PLANET_SELECTED',
      });
      notify();
      return getState();
    }

    function openExperiment(experimentId) {
      const planetState = state.experimentProgress[state.activePlanetId] || {
        unlocked: true,
        unlockedUpTo: 1,
        starsByExperiment: {},
      };

      if (experimentId > planetState.unlockedUpTo) {
        const msg =
          (config &&
            config.screens &&
            config.screens.experiments &&
            config.screens.experiments.lockedExperimentMessage) ||
          'Experiência bloqueada.';
        state = Object.assign({}, state, {
          statusNotice: msg,
          lastAction: 'EXPERIMENT_LOCKED',
        });
        notify();
        return getState();
      }

      state = Object.assign({}, state, {
        activeExperimentId: experimentId,
        statusNotice: null,
        lastAction: 'EXPERIMENT_OPENED',
      });
      notify();
      return getState();
    }

    function closeExperiment() {
      state = Object.assign({}, state, {
        activeExperimentId: null,
        lastAction: 'EXPERIMENT_CLOSED',
      });
      notify();
      return getState();
    }

    function completeExperiment(experimentId, earnedStars) {
      const planetId = state.activePlanetId;
      const nextProgress = JSON.parse(JSON.stringify(state.experimentProgress));
      if (!nextProgress[planetId]) {
        nextProgress[planetId] = {
          unlocked: true,
          unlockedUpTo: 1,
          starsByExperiment: {},
        };
      }

      const currentStars = nextProgress[planetId].starsByExperiment[experimentId] || 0;
      const clampedStars = Math.max(1, Math.min(3, earnedStars || 3));
      nextProgress[planetId].starsByExperiment[experimentId] = Math.max(
        currentStars,
        clampedStars
      );

      const totalItems =
        (config &&
          config.screens &&
          config.screens.experiments &&
          Array.isArray(config.screens.experiments.items) &&
          config.screens.experiments.items.length) ||
        6;

      if (
        experimentId >= nextProgress[planetId].unlockedUpTo &&
        nextProgress[planetId].unlockedUpTo < totalItems
      ) {
        nextProgress[planetId].unlockedUpTo = experimentId + 1;
      }

      state = Object.assign({}, state, {
        experimentProgress: nextProgress,
        activeExperimentId: null,
        statusNotice: null,
        lastAction: 'EXPERIMENT_COMPLETED',
      });
      notify();
      return getState();
    }

    function goToScreen(screenName) {
      if (!SCREENS[screenName]) return getState();
      state = Object.assign({}, state, {
        currentScreen: SCREENS[screenName],
        activeExperimentId: null,
        statusNotice: null,
        exitModalOpen: false,
        lastAction: 'NAVIGATED_TO_' + screenName,
      });
      notify();
      return getState();
    }

    function clearNotice() {
      state = Object.assign({}, state, {
        statusNotice: null,
      });
      notify();
      return getState();
    }

    function requestExit() {
      state = Object.assign({}, state, {
        exitModalOpen: true,
        lastAction: 'EXIT_REQUESTED',
      });
      notify();
      return getState();
    }

    function cancelExit() {
      state = Object.assign({}, state, {
        exitModalOpen: false,
        lastAction: 'EXIT_CANCELLED',
      });
      notify();
      return getState();
    }

    function confirmExit() {
      state = Object.assign({}, state, {
        currentScreen: SCREENS.EXITED,
        exitModalOpen: false,
        sessionActive: false,
        lastAction: 'GAME_EXITED',
      });
      notify();
      return getState();
    }

    function returnToInitialScreen() {
      state = Object.assign({}, state, {
        currentScreen: SCREENS.INITIAL,
        exitModalOpen: false,
        activeExperimentId: null,
        statusNotice: null,
        sessionActive: false,
        lastAction: 'RETURNED_TO_INITIAL',
      });
      notify();
      return getState();
    }

    function toggleAudio() {
      state = Object.assign({}, state, {
        audioEnabled: !state.audioEnabled,
        lastAction: state.audioEnabled ? 'AUDIO_MUTED' : 'AUDIO_ENABLED',
      });
      notify();
      return getState();
    }

    return {
      SCREENS: SCREENS,
      init: init,
      getState: getState,
      subscribe: subscribe,
      startGame: startGame,
      updateCharacterPart: updateCharacterPart,
      randomizeCharacter: randomizeCharacter,
      confirmPersonalization: confirmPersonalization,
      selectDestination: selectDestination,
      selectPlanet: selectPlanet,
      openExperiment: openExperiment,
      closeExperiment: closeExperiment,
      completeExperiment: completeExperiment,
      goToScreen: goToScreen,
      clearNotice: clearNotice,
      requestExit: requestExit,
      cancelExit: cancelExit,
      confirmExit: confirmExit,
      returnToInitialScreen: returnToInitialScreen,
      toggleAudio: toggleAudio,
    };
  }

  global.SpaceBaseEngine = createSpaceBaseEngine();
})(window);
