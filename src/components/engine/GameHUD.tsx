import React from 'react';
import { BookOpen, EyeOff, Eye, Map, Volume2, VolumeX, MessageSquare, Sparkles } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { soundEngine } from '../../utils/soundEngine';

interface GameHUDProps {
  missionTitle: string;
  goalText: string;
  progressText?: string;
  carryingName?: string | null;
  carryingColor?: string | null;
  onBackToMap?: () => void;
  onOpenCodex: () => void;
  onRepeatHint?: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  missionTitle,
  goalText,
  progressText,
  carryingName,
  carryingColor,
  onBackToMap,
  onOpenCodex,
  onRepeatHint,
}) => {
  const { save, toggleSetting } = useGame();

  return (
    <header className="relative z-20 flex flex-wrap items-center justify-between gap-4 border-b border-[#462A72] bg-[#21103A]/95 px-4 py-2.5 sm:px-6">
      {/* Zone 1: Navigation & Current Mission */}
      <div className="flex items-center gap-3 min-w-0">
        {onBackToMap && (
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onBackToMap();
            }}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#543487] bg-[#2D174D] px-3 text-xs font-semibold text-white transition-colors hover:border-amber-300 focus-visible:outline-2 focus-visible:outline-amber-300 whitespace-nowrap shrink-0"
            aria-label="Back to campaign map"
          >
            <Map className="h-4 w-4 text-sky-300" />
            <span>Map</span>
          </button>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-purple-200/80">
            <span className="font-semibold text-amber-300 whitespace-nowrap">{missionTitle}</span>
            {progressText && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tabular text-sky-200 whitespace-nowrap">{progressText}</span>
              </>
            )}
          </div>
          <p className="text-sm font-medium leading-snug text-white">{goalText}</p>
        </div>
      </div>

      {/* Zone 2: Carried Item Indicator (when active) */}
      {carryingName && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-400/60 bg-amber-400/15 px-3 py-1.5 text-xs font-bold text-amber-200 whitespace-nowrap shrink-0">
          <span
            className="h-3 w-3 rounded-full border border-slate-900"
            style={{ backgroundColor: carryingColor || '#FACC15' }}
            aria-hidden="true"
          />
          <span>In hand: {carryingName}</span>
        </div>
      )}

      {/* Zone 3: Quick Actions & Accessibility Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {onRepeatHint && (
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onRepeatHint();
            }}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-sky-400/70 bg-sky-500/20 px-3 text-xs font-bold text-sky-100 transition-colors hover:border-amber-300 hover:bg-sky-500/30 focus-visible:outline-2 focus-visible:outline-sky-300 whitespace-nowrap shrink-0"
            title="Ask ASTRO for full guidance"
          >
            <Sparkles className="h-4 w-4 text-sky-300" />
            <span>ASTRO Guide</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            onOpenCodex();
          }}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#543487] bg-[#2D174D] px-3 text-xs font-semibold text-white transition-colors hover:border-amber-300 focus-visible:outline-2 focus-visible:outline-amber-300 whitespace-nowrap shrink-0"
          aria-label="Open scientific discovery journal"
        >
          <BookOpen className="h-4 w-4 text-emerald-400" />
          <span>Journal</span>
          <span className="font-mono-tabular text-purple-200">({save.discoveries.length})</span>
        </button>

        <button
          type="button"
          onClick={() => toggleSetting('soundEnabled')}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#543487] bg-[#2D174D] text-white transition-colors hover:border-sky-400 focus-visible:outline-2 focus-visible:outline-sky-300 shrink-0"
          aria-label={save.settings.soundEnabled ? 'Mute sounds' : 'Enable sounds'}
          title={save.settings.soundEnabled ? 'Sound on' : 'Sound off'}
        >
          {save.settings.soundEnabled ? <Volume2 className="h-4 w-4 text-sky-300" /> : <VolumeX className="h-4 w-4 text-purple-300/60" />}
        </button>

        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            toggleSetting('voiceEnabled');
          }}
          className={`inline-flex h-10 items-center gap-1.5 rounded-xl border px-2.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-sky-300 whitespace-nowrap shrink-0 ${
            save.settings.voiceEnabled
              ? 'border-sky-400 bg-sky-400/20 text-sky-200'
              : 'border-[#543487] bg-[#2D174D] text-purple-200/80'
          }`}
          aria-label={save.settings.voiceEnabled ? 'Turn off ASTRO voice' : 'Turn on ASTRO voice'}
          title="Optional spoken voice"
        >
          <MessageSquare className="h-4 w-4" />
          <span className="hidden md:inline">Voice</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            toggleSetting('reducedStimuli');
          }}
          className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-colors focus-visible:outline-2 focus-visible:outline-amber-300 shrink-0 ${
            save.settings.reducedStimuli
              ? 'border-amber-400 bg-amber-400/20 text-amber-200'
              : 'border-[#543487] bg-[#2D174D] text-purple-200/80'
          }`}
          aria-label={save.settings.reducedStimuli ? 'Turn off calm mode' : 'Turn on reduced stimuli mode'}
          title="Reduced visual stimuli mode"
        >
          {save.settings.reducedStimuli ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </header>
  );
};
