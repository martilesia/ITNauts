export type WeatherKind = 'sunny' | 'cloudy' | 'light_rain' | 'moderate_rain' | 'heavy_rain' | 'storm';

export type BiomeId = 'tropical' | 'grassland' | 'mountain' | 'dry';

export interface RegionRainfallProfile {
  biome: BiomeId;
  name: string;
  scannerColor: string;
  scannerLabel: string;
  basePrecipitationMm: number; // Illustrative gameplay values inspired by GPM_3IMERGM structure
  collectRatePerSec: number; // Liters per second inside collector during rain
}

export interface WeatherCycleStep {
  id: string;
  seasonLabel: string;
  weather: WeatherKind;
  weatherLabel: string;
  multiplier: number;
  riverLevel: number; // 0..1 (above 0.72 floods the southern low ford)
}

export const ILLUSTRATIVE_GPM_SOURCE = {
  product: 'GPM_3IMERGM (Educational Simulation)',
  planet: 'Earth',
  disclaimer: 'Simulated gameplay values inspired by NASA GPM global rainfall patterns.',
};

export const BIOME_PROFILES: Record<BiomeId, RegionRainfallProfile> = {
  tropical: {
    biome: 'tropical',
    name: 'Tropical Forest',
    scannerColor: '#3B82F6', // Blue = Heavy Rain
    scannerLabel: 'Heavy Rain',
    basePrecipitationMm: 245,
    collectRatePerSec: 11,
  },
  grassland: {
    biome: 'grassland',
    name: 'Green Grassland',
    scannerColor: '#22C55E', // Green = Moderate Rain
    scannerLabel: 'Moderate Rain',
    basePrecipitationMm: 120,
    collectRatePerSec: 6,
  },
  mountain: {
    biome: 'mountain',
    name: 'Mountain Valley',
    scannerColor: '#FACC15', // Yellow = Light Rain
    scannerLabel: 'Light Rain',
    basePrecipitationMm: 62,
    collectRatePerSec: 3,
  },
  dry: {
    biome: 'dry',
    name: 'Dry Region',
    scannerColor: '#FB923C', // Orange = Very Dry
    scannerLabel: 'Very Dry',
    basePrecipitationMm: 12,
    collectRatePerSec: 0.7,
  },
};

export const WEATHER_CYCLE: WeatherCycleStep[] = [
  {
    id: 'w1',
    seasonLabel: 'Mild Season',
    weather: 'cloudy',
    weatherLabel: 'Cloudy',
    multiplier: 0.45,
    riverLevel: 0.3,
  },
  {
    id: 'w2',
    seasonLabel: 'Showers',
    weather: 'light_rain',
    weatherLabel: 'Light Rain',
    multiplier: 0.85,
    riverLevel: 0.48,
  },
  {
    id: 'w3',
    seasonLabel: 'Wet Season',
    weather: 'heavy_rain',
    weatherLabel: 'Heavy Rain',
    multiplier: 1.5,
    riverLevel: 0.78,
  },
  {
    id: 'w4',
    seasonLabel: 'Storm!',
    weather: 'storm',
    weatherLabel: 'Storm',
    multiplier: 1.85,
    riverLevel: 0.92,
  },
  {
    id: 'w5',
    seasonLabel: 'Clear Sky',
    weather: 'sunny',
    weatherLabel: 'Sunny',
    multiplier: 0.15,
    riverLevel: 0.35,
  },
  {
    id: 'w6',
    seasonLabel: 'Rain Showers',
    weather: 'moderate_rain',
    weatherLabel: 'Moderate Rain',
    multiplier: 1.15,
    riverLevel: 0.56,
  },
];

export function getBiomeAtWorldPos(x: number, y: number): BiomeId {
  // World coordinates: 960 x 560
  if (x < 430 && y < 290) return 'tropical';
  if (x < 430 && y >= 290) return 'grassland';
  if (x >= 430 && x < 635) return 'mountain';
  return 'dry';
}

export function getEffectiveCollectRate(biome: BiomeId, weather: WeatherCycleStep): number {
  const profile = BIOME_PROFILES[biome];
  return Math.max(0.2, profile.collectRatePerSec * weather.multiplier);
}
