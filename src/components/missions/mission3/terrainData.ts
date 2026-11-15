export type TerrainZone = 'flat' | 'moderate' | 'slope' | 'mountain';

export type TileFeature =
  | 'none'
  | 'start'
  | 'rocky'
  | 'steep_challenge'
  | 'sample'
  | 'solar'
  | 'base_a'
  | 'base_b'
  | 'base_c';

export interface GridCoord {
  col: number;
  row: number;
}

export interface TerrainTile {
  col: number;
  row: number;
  zone: TerrainZone;
  elevationM: number;
  feature: TileFeature;
  sampleId?: string;
  challengeId?: string;
}

export interface SampleInfo {
  id: string;
  name: string;
  clue: string;
  points: number;
  coord: GridCoord;
}

export interface BaseCandidate {
  id: 'A' | 'B' | 'C';
  name: string;
  subtitle: string;
  slopeLabel: string;
  slopeDegrees: number;
  elevationVar: string;
  accessibility: 'Easy' | 'Moderate' | 'Hard';
  distanceLabel: string;
  suitable: 'ideal' | 'risky' | 'unsuitable';
  bonusScore: number;
  feedbackTitle: string;
  feedbackText: string;
  coord: GridCoord;
}

export const GRID_COLS = 12;
export const GRID_ROWS = 8;

// 12x8 colourful topographic layout:
// 'F' = Verde (Plano), 'M' = Amarelo (Moderado), 'S' = Laranja (Encosta), 'H' = Castanho (Montanha Íngreme)
const ZONE_MAP: string[] = [
  'FFMMSSHHHHMM',
  'FFMMMSHHSSMM',
  'FFMMFFFFMMFF',
  'FFFMMMMFFFFF',
  'FFFMSSFFFFFF',
  'FFMMSSMMFFSF',
  'FMMMSSHMMSSF',
  'FFMMSSHHSSSF',
];

const CHAR_TO_ZONE: Record<string, TerrainZone> = {
  F: 'flat',
  M: 'moderate',
  S: 'slope',
  H: 'mountain',
};

const ZONE_ELEVATION: Record<TerrainZone, number> = {
  flat: 120,
  moderate: 260,
  slope: 480,
  mountain: 760,
};

export const ZONE_BATTERY_COST: Record<TerrainZone, number> = {
  flat: 2,
  moderate: 3,
  slope: 6,
  mountain: 9,
};

export const ZONE_META: Record<
  TerrainZone,
  { label: string; bg: string; border: string; text: string; shortDesc: string }
> = {
  flat: {
    label: 'Flat',
    bg: '#22C55E',
    border: '#15803D',
    text: '#052E16',
    shortDesc: 'Low battery usage',
  },
  moderate: {
    label: 'Gentle',
    bg: '#FACC15',
    border: '#CA8A04',
    text: '#422006',
    shortDesc: 'Moderate elevation',
  },
  slope: {
    label: 'Slope',
    bg: '#FB923C',
    border: '#C2410C',
    text: '#431407',
    shortDesc: 'Uses more battery',
  },
  mountain: {
    label: 'Steep',
    bg: '#92400E',
    border: '#451A03',
    text: '#FEF3C7',
    shortDesc: 'Mountain blocked',
  },
};

export const START_COORD: GridCoord = { col: 0, row: 4 };

export const SAMPLES_DATA: SampleInfo[] = [
  {
    id: 'sample-1',
    name: 'Basalt Crystal',
    clue: 'This rock shows that the green ground nearby is compact and firm!',
    points: 50,
    coord: { col: 2, row: 2 },
  },
  {
    id: 'sample-2',
    name: 'Slope Sand',
    clue: 'Loose grains in the orange zone! Building on slopes can tilt the base.',
    points: 50,
    coord: { col: 5, row: 5 },
  },
  {
    id: 'sample-3',
    name: 'Firm Regolith',
    clue: 'Stable and level ground! A great sign near Site A.',
    points: 50,
    coord: { col: 8, row: 2 },
  },
];

export const ROCKY_COORDS: { id: string; coord: GridCoord }[] = [
  { id: 'rock-1', coord: { col: 3, row: 4 } },
  { id: 'rock-2', coord: { col: 6, row: 3 } },
  { id: 'rock-3', coord: { col: 8, row: 5 } },
];

export const STEEP_CHALLENGE_COORDS: { id: string; coord: GridCoord }[] = [
  { id: 'steep-1', coord: { col: 4, row: 4 } },
  { id: 'steep-2', coord: { col: 5, row: 0 } },
  { id: 'steep-3', coord: { col: 9, row: 6 } },
];

export const SOLAR_RECHARGE_COORD: GridCoord = { col: 6, row: 2 };

export const BASE_CANDIDATES: BaseCandidate[] = [
  {
    id: 'A',
    name: 'Site A — Green Plain',
    subtitle: 'Relatively flat terrain',
    slopeLabel: 'Gentle (2°)',
    slopeDegrees: 2,
    elevationVar: 'Very low (±3 m)',
    accessibility: 'Easy',
    distanceLabel: 'Medium (10 sectors)',
    suitable: 'ideal',
    bonusScore: 150,
    feedbackTitle: 'Excellent Choice!',
    feedbackText:
      'Site A is flat and easy to reach with the rover. Structures stay level and energy usage is low!',
    coord: { col: 10, row: 3 },
  },
  {
    id: 'B',
    name: 'Site B — Gentle Slope',
    subtitle: 'Moderately sloped terrain',
    slopeLabel: 'Medium (12°)',
    slopeDegrees: 12,
    elevationVar: 'Medium (±25 m)',
    accessibility: 'Moderate',
    distanceLabel: 'Short (6 sectors)',
    suitable: 'risky',
    bonusScore: 50,
    feedbackTitle: 'Risky Site!',
    feedbackText:
      'Site B is closer, but it has a medium slope. The base would need extra leveling so it does not tilt!',
    coord: { col: 4, row: 1 },
  },
  {
    id: 'C',
    name: 'Site C — Steep Hill',
    subtitle: 'Very steep and uneven terrain',
    slopeLabel: 'Steep (28°)',
    slopeDegrees: 28,
    elevationVar: 'High (±65 m)',
    accessibility: 'Hard',
    distanceLabel: 'Long (11 sectors)',
    suitable: 'unsuitable',
    bonusScore: 0,
    feedbackTitle: 'Unsuitable Site!',
    feedbackText:
      'Site C has large height differences and a steep slope. Modules could tip over and the rover would use a lot of battery!',
    coord: { col: 10, row: 6 },
  },
];

export function buildTerrainGrid(): TerrainTile[][] {
  const grid: TerrainTile[][] = [];

  for (let row = 0; row < GRID_ROWS; row++) {
    const rowTiles: TerrainTile[] = [];
    const rowStr = ZONE_MAP[row];

    for (let col = 0; col < GRID_COLS; col++) {
      const ch = rowStr[col] || 'F';
      const zone = CHAR_TO_ZONE[ch] ?? 'flat';
      const variation = ((col * 7 + row * 13) % 18) - 9;
      const elevationM = ZONE_ELEVATION[zone] + variation;

      let feature: TileFeature = 'none';
      let sampleId: string | undefined;
      let challengeId: string | undefined;

      if (col === START_COORD.col && row === START_COORD.row) {
        feature = 'start';
      } else if (col === SOLAR_RECHARGE_COORD.col && row === SOLAR_RECHARGE_COORD.row) {
        feature = 'solar';
      } else {
        const sample = SAMPLES_DATA.find((s) => s.coord.col === col && s.coord.row === row);
        const rock = ROCKY_COORDS.find((r) => r.coord.col === col && r.coord.row === row);
        const steep = STEEP_CHALLENGE_COORDS.find((s) => s.coord.col === col && s.coord.row === row);
        const base = BASE_CANDIDATES.find((b) => b.coord.col === col && b.coord.row === row);

        if (base) {
          feature = base.id === 'A' ? 'base_a' : base.id === 'B' ? 'base_b' : 'base_c';
        } else if (sample) {
          feature = 'sample';
          sampleId = sample.id;
        } else if (rock) {
          feature = 'rocky';
          challengeId = rock.id;
        } else if (steep) {
          feature = 'steep_challenge';
          challengeId = steep.id;
        }
      }

      rowTiles.push({
        col,
        row,
        zone,
        elevationM,
        feature,
        sampleId,
        challengeId,
      });
    }

    grid.push(rowTiles);
  }

  return grid;
}
