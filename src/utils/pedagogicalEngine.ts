import { AstroMood } from '../types/game';

const messageCursor: Record<string, number> = {};

/**
 * Cycles through varied, age-appropriate ASTRO reactions per pedagogical topic
 * so ASTRO never repeats the exact same phrase mechanically.
 */
export function pickAstroReaction(topicKey: string, variants: string[]): string {
  if (variants.length === 0) return '';
  const idx = messageCursor[topicKey] ?? 0;
  messageCursor[topicKey] = (idx + 1) % variants.length;
  return variants[idx];
}

export interface BehavioralOutcome {
  label: string;
  mood: AstroMood;
  message: string;
}
