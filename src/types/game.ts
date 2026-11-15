export type SuitColorId =
  | 'orbital-white'
  | 'mars-orange'
  | 'cobalt-blue'
  | 'earth-emerald'
  | 'cosmic-violet'
  | 'solar-yellow';

export type VisorColorId = 'arctic-cyan' | 'solar-gold' | 'amber-warm' | 'crystal-violet';
export type PatchEmblemId = 'star' | 'rocket' | 'planet' | 'leaf';

export type SkinToneId =
  | 'light-peach'
  | 'warm-fair'
  | 'olive-tan'
  | 'caramel-brown'
  | 'rich-ebony'
  | 'deep-espresso';

export type HairStyleId =
  | 'afro-crespo'
  | 'crespo-puffs'
  | 'coily-fade'
  | 'box-braids'
  | 'curly-top'
  | 'short-swept'
  | 'wavy-bob'
  | 'pigtails';

export type HairColorId =
  | 'jet-black'
  | 'dark-brown'
  | 'auburn'
  | 'honey-blonde'
  | 'cosmic-purple'
  | 'cyan-frost';

export type EyeColorId = 'brown' | 'dark' | 'hazel' | 'green' | 'blue' | 'violet';

export interface CommanderProfile {
  commanderName: string;
  teamName: string;
  suitColor: SuitColorId;
  visorColor: VisorColorId;
  emblem: PatchEmblemId;
  skinTone: SkinToneId;
  hairStyle: HairStyleId;
  hairColor: HairColorId;
  eyeColor: EyeColorId;
}

export type AstroMood = 'sleeping' | 'idle' | 'happy' | 'curious' | 'alert' | 'encourage';

export interface AstroDialogue {
  text: string;
  mood: AstroMood;
  id: number;
}

export type MissionId = 'mission-1' | 'mission-2' | 'mission-3' | 'mission-4' | 'mission-5';

export type StationId = 'modis' | 'merra2' | 'srtm' | 'gpm' | 'smap';

export interface InventoryItem {
  id: string;
  name: string;
  category: 'instrument' | 'module' | 'sample';
  color: string;
  acquiredIn: MissionId | 'prologue';
}

export type DataOriginTag = 'NASA_REAL_CONCEPT' | 'PROCESSED_FOR_GAME' | 'SIMULATED_TRAINING';

export interface DiscoveryEntry {
  id: string;
  title: string;
  instrument: string;
  planetScope: 'Earth' | 'Mars' | 'Moon / Mars';
  originTag: DataOriginTag;
  originLabel: string;
  shortFact: string;
  missionId: MissionId;
}

export interface BadgeEntry {
  id: string;
  title: string;
  missionId: MissionId;
  detail: string;
}

export interface AccessibilitySettings {
  soundEnabled: boolean;
  voiceEnabled: boolean;
  captionsEnabled: boolean;
  reducedStimuli: boolean;
}

export type ScreenRoute =
  | 'TITLE'
  | 'WELCOME_ROOM'
  | 'DESTINATION_ROOM'
  | 'PROLOGUE'
  | 'CAMPAIGN_MAP'
  | 'MISSION_1'
  | 'MISSION_2'
  | 'MISSION_3'
  | 'MISSION_4'
  | 'MISSION_5';

export interface CampaignDecisionMemory {
  m1ThermalShield: 'reflective' | 'dark-metal' | 'polymer' | null;
  m1DustFilter: 'electrostatic' | 'coarse-mesh' | null;
  m1ReliefValidated: boolean;
  m1RainCollectorTested: boolean;
  m1SoilSeedTested: boolean;
  m2PreparedInTime: boolean;
  m2EnergyEfficiencyBonus: boolean;
  m2RepairedAfterStorm: boolean;
  m3SteepSlopeAttempts: number;
  m3RelocatedUnstableModule: boolean;
  m3RoverBatteryRemaining: number;
  m4TestedPoorZone: boolean;
  m4CollectedRawWaterFirst: boolean;
  m4PurifiedWaterPct: number;
  m5FirstRegionTried: 'A' | 'B' | 'C' | null;
  m5AdjustedWaterStrategy: boolean;
  m5UsedMission4Water: boolean;
  explorationsCompleted: number;
  decisionsAdapted: number;
  appliedPriorKnowledge: string[];
}

export interface GameSaveState {
  hasCompletedPrologue: boolean;
  hasSeenFinalVictory?: boolean;
  selectedDestination?: 'mars' | 'moon';
  commander: CommanderProfile;
  completedMissions: MissionId[];
  mission1StationsDone: StationId[];
  inventory: InventoryItem[];
  discoveries: string[];
  badges: string[];
  settings: AccessibilitySettings;
  campaignMemory?: CampaignDecisionMemory;
}

export interface Vec2 {
  x: number; // Percentage 0..100 inside arena
  y: number; // Percentage 0..100 inside arena
}
