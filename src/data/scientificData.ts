import {
  BadgeEntry,
  DiscoveryEntry,
  EyeColorId,
  HairColorId,
  HairStyleId,
  MissionId,
  PatchEmblemId,
  SkinToneId,
  SuitColorId,
  VisorColorId,
} from '../types/game';

export const SUIT_COLORS: Record<SuitColorId, { label: string; primary: string; secondary: string; trim: string }> = {
  'cobalt-blue': { label: 'Space Blue', primary: '#38BDF8', secondary: '#0284C7', trim: '#E0F2FE' },
  'orbital-white': { label: 'Orbital White', primary: '#F8FAFC', secondary: '#CBD5E1', trim: '#06B6D4' },
  'mars-orange': { label: 'Mars Orange', primary: '#FB923C', secondary: '#EA580C', trim: '#FEF08A' },
  'earth-emerald': { label: 'Earth Green', primary: '#34D399', secondary: '#059669', trim: '#ECFDF5' },
  'cosmic-violet': { label: 'Cosmic Purple', primary: '#A78BFA', secondary: '#6D28D9', trim: '#FDE047' },
  'solar-yellow': { label: 'Solar Yellow', primary: '#FACC15', secondary: '#CA8A04', trim: '#FEF9C3' },
};

export const VISOR_COLORS: Record<
  VisorColorId,
  { label: string; fill: string; highlight: string; rim: string }
> = {
  'arctic-cyan': { label: 'Cyan Crystal', fill: '#38BDF8', highlight: '#E0F2FE', rim: '#0284C7' },
  'solar-gold': { label: 'Solar Gold', fill: '#FACC15', highlight: '#FEF9C3', rim: '#CA8A04' },
  'amber-warm': { label: 'Rose Quartz', fill: '#FB7185', highlight: '#FFE4E6', rim: '#E11D48' },
  'crystal-violet': { label: 'Starlight Violet', fill: '#C084FC', highlight: '#F3E8FF', rim: '#7E22CE' },
};

export const SKIN_TONES: Record<
  SkinToneId,
  { label: string; base: string; shadow: string; blush: string; lip: string }
> = {
  'light-peach': { label: 'Light Peach', base: '#FAD7C4', shadow: '#E8B49A', blush: '#F48FB1', lip: '#D87478' },
  'warm-fair': { label: 'Warm Fair', base: '#F1C29B', shadow: '#D89F74', blush: '#EC827E', lip: '#C66B5D' },
  'olive-tan': { label: 'Olive Tan', base: '#D49567', shadow: '#B57346', blush: '#DC6F68', lip: '#A9554A' },
  'caramel-brown': { label: 'Medium Brown', base: '#AC6B41', shadow: '#894D28', blush: '#CE625B', lip: '#8B433B' },
  'rich-ebony': { label: 'Rich Brown', base: '#794528', shadow: '#582F19', blush: '#B84F55', lip: '#652E2B' },
  'deep-espresso': { label: 'Deep Espresso', base: '#4E2A1A', shadow: '#351A0E', blush: '#9D3F4B', lip: '#481E1D' },
};

export const HAIR_STYLES: { id: HairStyleId; label: string }[] = [
  { id: 'afro-crespo', label: 'Coily Afro' },
  { id: 'crespo-puffs', label: 'Coily Puffs' },
  { id: 'coily-fade', label: 'Short Coils' },
  { id: 'box-braids', label: 'Box Braids' },
  { id: 'curly-top', label: 'Loose Curls' },
  { id: 'short-swept', label: 'Short Bangs' },
  { id: 'wavy-bob', label: 'Wavy Bob' },
  { id: 'pigtails', label: 'Twin Braids' },
];

export const HAIR_COLORS: Record<HairColorId, { label: string; fill: string; highlight: string; shadow: string }> = {
  'jet-black': { label: 'Natural Black', fill: '#1C161D', highlight: '#3A2E3D', shadow: '#0E0A10' },
  'dark-brown': { label: 'Dark Brown', fill: '#4A2C1D', highlight: '#6D432E', shadow: '#2E1910' },
  auburn: { label: 'Copper Red', fill: '#A84321', highlight: '#CF613A', shadow: '#782B11' },
  'honey-blonde': { label: 'Honey Blonde', fill: '#DF9F37', highlight: '#F7C96E', shadow: '#B2761B' },
  'cosmic-purple': { label: 'Space Purple', fill: '#7C3AED', highlight: '#A78BFA', shadow: '#5B21B6' },
  'cyan-frost': { label: 'Galaxy Blue', fill: '#0284C7', highlight: '#38BDF8', shadow: '#075985' },
};

export const EYE_COLORS: Record<EyeColorId, { label: string; iris: string; glow: string }> = {
  brown: { label: 'Brown', iris: '#5C3317', glow: '#9A5B2F' },
  dark: { label: 'Dark', iris: '#1E1B24', glow: '#474254' },
  hazel: { label: 'Hazel', iris: '#B45309', glow: '#F59E0B' },
  green: { label: 'Green', iris: '#15803D', glow: '#4ADE80' },
  blue: { label: 'Blue', iris: '#0369A1', glow: '#38BDF8' },
  violet: { label: 'Violet', iris: '#6D28D9', glow: '#C084FC' },
};

export const EMBLEM_OPTIONS: { id: PatchEmblemId; label: string }[] = [
  { id: 'planet', label: 'Planet' },
  { id: 'star', label: 'Star' },
  { id: 'rocket', label: 'Rocket' },
  { id: 'leaf', label: 'Biosphere' },
];

export interface CampaignMissionMeta {
  id: MissionId;
  number: number;
  title: string;
  planet: string;
  instrumentTag: string;
  shortGoal: string;
  playable: boolean;
}

export const CAMPAIGN_MISSIONS: CampaignMissionMeta[] = [
  {
    id: 'mission-1',
    number: 1,
    title: 'The Mystery of Space Temperatures',
    planet: 'Earth · MODIS',
    instrumentTag: 'MODIS MOD11A1 V061 · Day & Night · Insulation',
    shortGoal: 'Investigate day/night surface temperatures and protect the habitat.',
    playable: true,
  },
  {
    id: 'mission-2',
    number: 2,
    title: 'Dust Storm',
    planet: 'Mars (Simulation)',
    instrumentTag: 'Solar Power · Batteries · Rover · Oxygen',
    shortGoal: 'Keep the base running during a dust storm on Mars.',
    playable: true,
  },
  {
    id: 'mission-3',
    number: 3,
    title: 'Terrain Explorer',
    planet: 'Chosen Destination',
    instrumentTag: 'SRTM (Training) · LOLA / MOLA · Rover · Base',
    shortGoal: 'Drive the rover, collect samples, and choose the best base site.',
    playable: true,
  },
  {
    id: 'mission-4',
    number: 4,
    title: 'Rainfall Explorer',
    planet: 'Earth (Training)',
    instrumentTag: 'GPM (Simulation) · Scanner · Collectors',
    shortGoal: 'Explore rainfall regions on Earth, use the scanner, and collect water.',
    playable: true,
  },
  {
    id: 'mission-5',
    number: 5,
    title: 'Soil Moisture Explorer',
    planet: 'Earth (SMAP Satellite)',
    instrumentTag: 'SMAP · Microwaves · Soil Moisture',
    shortGoal: 'Observe regions of Earth by satellite and analyze soil moisture.',
    playable: true,
  },
];

export const DISCOVERY_CODEX: DiscoveryEntry[] = [
  {
    id: 'disc-modis',
    title: 'Surface Temperature (Day & Night)',
    instrument: 'NASA MODIS · MOD11A1 V061',
    planetScope: 'Earth',
    originTag: 'NASA_REAL_CONCEPT',
    originLabel: 'NASA Earthdata Search · 1 km Resolution',
    shortFact: 'MODIS measures Earth’s surface temperature (not air temperature) day and night at 1 km resolution, explaining why habitats need thermal insulation.',
    missionId: 'mission-1',
  },
  {
    id: 'disc-merra2',
    title: 'Fine Dust & Suspended Particles',
    instrument: 'Dust Analyzer',
    planetScope: 'Moon / Mars',
    originTag: 'NASA_REAL_CONCEPT',
    originLabel: 'Space dust monitoring · Interactive simulation',
    shortFact: 'Both charged lunar dust and fine Martian dust clouds require special filters on suits and base modules.',
    missionId: 'mission-1',
  },
  {
    id: 'disc-srtm',
    title: 'Craters & Plains via Laser Radar',
    instrument: 'LOLA (Moon) · MOLA (Mars)',
    planetScope: 'Moon / Mars',
    originTag: 'NASA_REAL_CONCEPT',
    originLabel: 'Planetary laser altimetry · Interactive model',
    shortFact: 'The LOLA altimeter maps lunar craters and MOLA measures valleys and volcanoes on Mars with laser beams from orbit.',
    missionId: 'mission-1',
  },
  {
    id: 'disc-gpm',
    title: 'Water Traces & Polar Ice',
    instrument: 'Hydrogen & Ice Detector',
    planetScope: 'Moon / Mars',
    originTag: 'NASA_REAL_CONCEPT',
    originLabel: 'Space ice prospecting · Game simulation',
    shortFact: 'Orbital probes detect ice hidden inside cold lunar craters and in the polar caps of Mars.',
    missionId: 'mission-1',
  },
  {
    id: 'disc-smap',
    title: 'Regolith & Soil Analysis',
    instrument: 'Surface Probe',
    planetScope: 'Moon / Mars',
    originTag: 'NASA_REAL_CONCEPT',
    originLabel: 'Planetary soil probing · Simulated sensor',
    shortFact: 'Analyzing the composition and frozen moisture of lunar regolith or Martian soil helps prepare future space greenhouses.',
    missionId: 'mission-1',
  },
  {
    id: 'disc-mars-storm',
    title: 'Dust Storm on Mars',
    instrument: 'Space Simulation · MERRA-2 (Earth)',
    planetScope: 'Earth',
    originTag: 'SIMULATED_TRAINING',
    originLabel: 'Educational simulation · MERRA-2 observes aerosols on Earth',
    shortFact: 'During dust storms on Mars, less sunlight reaches solar panels. On Earth, the MERRA-2 model helps scientists study particles and dust in the atmosphere.',
    missionId: 'mission-2',
  },
  {
    id: 'disc-mola-terrain',
    title: 'Mapping Terrain on the Moon & Mars',
    instrument: 'LOLA (Moon) · MOLA (Mars)',
    planetScope: 'Moon / Mars',
    originTag: 'NASA_REAL_CONCEPT',
    originLabel: 'Planetary laser altimeter · Simulated game terrain',
    shortFact: 'To choose where to build a base, scientists measure elevation and slope using laser altimeters like LOLA on the Moon and MOLA on Mars.',
    missionId: 'mission-3',
  },
  {
    id: 'disc-gpm-rainfall',
    title: 'Rainfall Patterns on Earth',
    instrument: 'NASA GPM (GPM_3IMERGM · Simulation)',
    planetScope: 'Earth',
    originTag: 'NASA_REAL_CONCEPT',
    originLabel: 'Global precipitation on Earth · Educational simulation',
    shortFact: 'Satellites like GPM help observe where it rains more or less on Earth before we plan space missions.',
    missionId: 'mission-4',
  },
  {
    id: 'disc-smap-soil',
    title: 'Soil Moisture via Microwaves',
    instrument: 'NASA SMAP (Soil Moisture Active Passive)',
    planetScope: 'Earth',
    originTag: 'NASA_REAL_CONCEPT',
    originLabel: 'Earth soil observation · Simulated values',
    shortFact: 'The SMAP satellite uses microwave sensors to estimate water in Earth’s topsoil layer (it does not measure the Moon or Mars).',
    missionId: 'mission-5',
  },
];

export const BADGE_CATALOG: BadgeEntry[] = [
  {
    id: 'badge-eyes-earth',
    title: 'MODIS Thermal Eyes',
    missionId: 'mission-1',
    detail: 'Investigated day/night surface temperatures and insulated the habitat.',
  },
  {
    id: 'badge-mars-guardian',
    title: 'Storm Commander',
    missionId: 'mission-2',
    detail: 'Kept the base powered and protected until the end of the dust storm.',
  },
  {
    id: 'badge-space-architect',
    title: 'Space Architect',
    missionId: 'mission-3',
    detail: 'Explored terrain with the rover and built a stable base on flat ground.',
  },
  {
    id: 'badge-rain-hunter',
    title: 'Rainfall Explorer',
    missionId: 'mission-4',
    detail: 'Explored rain zones on Earth, used the scanner, and collected water.',
  },
  {
    id: 'badge-soil-scientist',
    title: 'Junior SMAP Scientist',
    missionId: 'mission-5',
    detail: 'Observed regions of Earth with the SMAP satellite and analyzed soil moisture.',
  },
];
