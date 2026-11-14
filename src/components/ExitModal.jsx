import React, { useEffect } from 'react';
import ArcadeButton from './ArcadeButton.jsx';

export default function ExitModal({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onCancel();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#140728]/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-modal-title"
    >
      <div className="w-full max-w-md rounded-3xl border-4 border-white/90 bg-gradient-to-b from-[#3d1c6e] to-[#261047] p-6 sm:p-8 text-center shadow-[0_20px_50px_rgba(0,0,0,0.65)]">
        <h2
          id="exit-modal-title"
          className="text-2xl sm:text-3xl font-extrabold text-amber-300 tracking-tight mb-3"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {title}
        </h2>
        <p className="text-base sm:text-lg text-purple-100 leading-relaxed mb-7">
          {message}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <ArcadeButton
            variant="yellow"
            onClick={onCancel}
            className="!min-w-[160px] !min-h-[54px] !text-lg"
          >
            {cancelLabel}
          </ArcadeButton>
          <ArcadeButton
            variant="red"
            onClick={onConfirm}
            className="!min-w-[160px] !min-h-[54px] !text-lg"
          >
            {confirmLabel}
          </ArcadeButton>
        </div>
      </div>
    </div>
  );
}
