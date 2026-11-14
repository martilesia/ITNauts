import React, { useEffect, useState } from 'react';
import { CheckCircle2, Star, X } from 'lucide-react';
import ArcadeButton from './ArcadeButton.jsx';

export default function ExperimentModal({
  experiment,
  labels,
  onComplete,
  onClose,
}) {
  const [selectedId, setSelectedId] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [solved, setSolved] = useState(false);

  useEffect(() => {
    setSelectedId(null);
    setAttempts(0);
    setSolved(false);
  }, [experiment?.id]);

  useEffect(() => {
    if (!experiment) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [experiment, onClose]);

  if (!experiment) return null;

  const selectedOption = experiment.options.find((opt) => opt.id === selectedId);
  const earnedStars = attempts <= 1 ? 3 : attempts === 2 ? 2 : 1;

  const handleChoose = (option) => {
    if (solved) return;
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    setSelectedId(option.id);
    if (option.correct) {
      setSolved(true);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="experiment-modal-title"
    >
      <div className="relative w-full max-w-xl rounded-3xl border-4 border-sky-300 bg-gradient-to-b from-[#1e3a8a] to-[#0f172a] p-6 sm:p-8 shadow-[0_24px_60px_rgba(0,0,0,0.75)]">
        <button
          type="button"
          onClick={onClose}
          aria-label={labels.closeLabel}
          className="absolute top-4 right-4 w-10 h-10 rounded-full border-2 border-white/60 bg-slate-800/80 flex items-center justify-center text-white hover:bg-slate-700 cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-300 mb-1">
          Experiência #{experiment.id}
        </div>
        <h2
          id="experiment-modal-title"
          className="text-2xl sm:text-3xl font-extrabold text-white mb-4 pr-10"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {experiment.title}
        </h2>

        <p className="text-base sm:text-lg text-sky-100 leading-relaxed mb-6">
          {experiment.prompt}
        </p>

        <div className="flex flex-col gap-3 mb-6">
          {experiment.options.map((option) => {
            const isPicked = selectedId === option.id;
            const isCorrect = isPicked && option.correct;
            const isWrong = isPicked && !option.correct;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleChoose(option)}
                disabled={solved}
                className={`w-full text-left rounded-2xl border-2 px-4 py-3.5 font-bold text-sm sm:text-base transition-colors cursor-pointer ${
                  isCorrect
                    ? 'border-emerald-400 bg-emerald-600/35 text-white'
                    : isWrong
                      ? 'border-rose-400 bg-rose-600/35 text-white'
                      : 'border-sky-400/40 bg-slate-900/60 text-sky-50 hover:border-amber-300 hover:bg-slate-800/80'
                }`}
              >
                {option.text}
              </button>
            );
          })}
        </div>

        {selectedOption && !solved && (
          <p className="text-sm font-bold text-rose-300 mb-4">
            Ainda não é bem isso — analisa bem as condições no espaço e tenta outra opção!
          </p>
        )}

        {solved && (
          <div className="rounded-2xl border-2 border-emerald-400/60 bg-emerald-950/60 p-4 mb-6">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="inline-flex items-center gap-2 font-extrabold text-emerald-300">
                <CheckCircle2 size={20} />
                {labels.experimentCompleteLabel}
              </span>
              <span className="inline-flex items-center gap-1" aria-label={`${earnedStars} estrelas`}>
                {[1, 2, 3].map((idx) => (
                  <Star
                    key={idx}
                    size={20}
                    className={
                      idx <= earnedStars
                        ? 'text-amber-300 fill-amber-300'
                        : 'text-slate-500'
                    }
                  />
                ))}
              </span>
            </div>
            <p className="text-sm text-emerald-100 leading-relaxed">
              {experiment.explanation}
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3">
          {solved ? (
            <ArcadeButton
              variant="yellow"
              onClick={() => onComplete(experiment.id, earnedStars)}
              className="!min-w-[180px] !min-h-[52px] !text-lg"
            >
              {labels.continueLabel}
            </ArcadeButton>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border-2 border-white/50 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/10 cursor-pointer"
            >
              {labels.closeLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
