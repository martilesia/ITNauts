import React from 'react';
import { Hand } from 'lucide-react';

interface TouchControlsProps {
  onMoveDir?: (dx: number, dy: number) => void;
  onStopMove?: () => void;
  onInteract: () => void;
  interactLabel?: string | null;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onInteract,
  interactLabel,
}) => {
  if (!interactLabel) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-30 flex items-center sm:right-6">
      <button
        type="button"
        onClick={onInteract}
        className="pointer-events-auto flex h-12 items-center gap-2 rounded-full border-2 border-white border-b-4 bg-gradient-to-b from-[#FDE047] to-[#EAB308] px-5 text-sm font-bold text-slate-950 shadow-lg transition-transform active:scale-95 hover:brightness-105 focus-visible:outline-2 focus-visible:outline-white whitespace-nowrap"
      >
        <Hand className="h-5 w-5" />
        <span>{interactLabel}</span>
      </button>
    </div>
  );
};

