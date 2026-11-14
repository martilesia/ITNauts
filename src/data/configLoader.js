const CONFIG_URL = '/config/game.config.json';

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function validateGameConfig(config) {
  if (!isObject(config)) {
    throw new Error('Configuração inválida: o objeto raiz deve ser um JSON válido.');
  }

  if (!isObject(config.game) || !config.game.titleTop || !config.game.titleBottom) {
    throw new Error('Configuração inválida: secção "game" com título em falta.');
  }

  if (
    !isObject(config.screens) ||
    !isObject(config.screens.initial) ||
    !config.screens.initial.playButtonLabel ||
    !config.screens.initial.exitButtonLabel
  ) {
    throw new Error('Configuração inválida: secção "screens.initial" incompleta.');
  }

  if (
    !isObject(config.screens.personalization) ||
    !Array.isArray(config.screens.personalization.tabs) ||
    !isObject(config.screens.personalization.options)
  ) {
    throw new Error('Configuração inválida: secção "screens.personalization" incompleta.');
  }

  if (
    !isObject(config.screens.destination) ||
    !Array.isArray(config.screens.destination.destinations)
  ) {
    throw new Error('Configuração inválida: secção "screens.destination" incompleta.');
  }

  if (
    !isObject(config.screens.experiments) ||
    !Array.isArray(config.screens.experiments.planets) ||
    !Array.isArray(config.screens.experiments.items)
  ) {
    throw new Error('Configuração inválida: secção "screens.experiments" incompleta.');
  }

  return config;
}

export async function loadGameConfig() {
  const response = await fetch(CONFIG_URL, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(
      `Falha ao carregar ${CONFIG_URL} (HTTP ${response.status}).`
    );
  }

  const parsed = await response.json();
  return validateGameConfig(parsed);
}
