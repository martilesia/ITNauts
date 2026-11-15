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
  'crystal-violet': { label: 'Stellar Violet', fill: '#C084FC', highlight: '#F3E8FF', rim: '#7E22CE' },
};

export const SKIN_TONES: Record<
  SkinToneId,
  { label: string; base: string; shadow: string; blush: string; lip: string }
> = {
  'light-peach': { label: 'Fair Rosy', base: '#FAD7C4', shadow: '#E8B49A', blush: '#F48FB1', lip: '#D87478' },
  'warm-fair': { label: 'Warm Fair', base: '#F1C29B', shadow: '#D89F74', blush: '#EC827E', lip: '#C66B5D' },
  'olive-tan': { label: 'Olive Tan', base: '#D49567', shadow: '#B57346', blush: '#DC6F68', lip: '#A9554A' },
  'caramel-brown': { label: 'Caramel Brown', base: '#AC6B41', shadow: '#894D28', blush: '#CE625B', lip: '#8B433B' },
  'rich-ebony': { label: 'Rich Brown', base: '#794528', shadow: '#582F19', blush: '#B84F55', lip: '#652E2B' },
  'deep-espresso': { label: 'Deep Ebony', base: '#4E2A1A', shadow: '#351A0E', blush: '#9D3F4B', lip: '#481E1D' },
};

export const HAIR_STYLES: { id: HairStyleId; label: string }[] = [
  { id: 'afro-crespo', label: 'Coily Afro' },
  { id: 'crespo-puffs', label: 'Afro Puffs' },
  { id: 'coily-fade', label: 'Short Coils' },
  { id: 'box-braids', label: 'Box Braids' },
  { id: 'curly-top', label: 'Loose Curls' },
  { id: 'short-swept', label: 'Short Swept' },
  { id: 'wavy-bob', label: 'Wavy Bob' },
  { id: 'pigtails', label: 'Twin Braids' },
];

export const HAIR_COLORS: Record<HairColorId, { label: string; fill: string; highlight: string; shadow: string }> = {
  'jet-black': { label: 'Jet Black', fill: '#1C161D', highlight: '#3A2E3D', shadow: '#0E0A10' },
  'dark-brown': { label: 'Dark Brown', fill: '#4A2C1D', highlight: '#6D432E', shadow: '#2E1910' },
  auburn: { label: 'Copper Auburn', fill: '#A84321', highlight: '#CF613A', shadow: '#782B11' },
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

import { getBadgeCatalog, getCampaignMissions, getDiscoveryCodex } from './planetaryData';

export { getBadgeCatalog, getCampaignMissions, getDiscoveryCodex };

export interface CampaignMissionMeta {
  id: MissionId;
  number: number;
  title: string;
  planet: string;
  instrumentTag: string;
  shortGoal: string;
  playable: boolean;
}

export const CAMPAIGN_MISSIONS: CampaignMissionMeta[] = getCampaignMissions('mars');
export const DISCOVERY_CODEX: DiscoveryEntry[] = getDiscoveryCodex('mars');
export const BADGE_CATALOG: BadgeEntry[] = getBadgeCatalog('mars');

