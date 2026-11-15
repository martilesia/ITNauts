import React from 'react';
import { Award, Compass, Globe2, Package, X } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { BADGE_CATALOG, DISCOVERY_CODEX } from '../../data/scientificData';
import { soundEngine } from '../../utils/soundEngine';

interface DiscoveryCodexModalProps {
  open: boolean;
  onClose: () => void;
}

export const DiscoveryCodexModal: React.FC<DiscoveryCodexModalProps> = ({ open, onClose }) => {
  const { save } = useGame();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="codex-title"
    >
      <div className="max-h-[86vh] w-full max-w-3xl overflow-y-auto rounded-2xl border-2 border-[#543487] bg-[#21103A] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#462A72] pb-4">
          <div>
            <h2 id="codex-title" className="text-xl font-bold text-amber-300">
              Discovery & Equipment Logbook
            </h2>
            <p className="mt-1 text-sm text-purple-200/80">
              Optional reference for your achievements and mission science notes.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#543487] bg-[#2D174D] text-purple-200 hover:border-amber-300 hover:text-white focus-visible:outline-2 focus-visible:outline-amber-300"
            aria-label="Close logbook"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Inventory & Badges */}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <section className="rounded-xl border border-[#462A72] bg-[#190B2E] p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
              <Package className="h-4 w-4 text-sky-300" />
              <span>Collected Equipment</span>
            </h3>
            {save.inventory.length === 0 ? (
              <p className="mt-3 text-xs text-purple-200/75">Complete missions to unlock new modules.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {save.inventory.map((item) => (
                  <li key={item.id} className="flex items-center gap-2.5 text-sm text-white">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-[#462A72] bg-[#190B2E] p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
              <Award className="h-4 w-4 text-amber-300" />
              <span>Team Badges</span>
            </h3>
            {save.badges.length === 0 ? (
              <p className="mt-3 text-xs text-purple-200/75">Calibrate instruments and overcome challenges to earn badges.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {BADGE_CATALOG.filter((b) => save.badges.includes(b.id)).map((badge) => (
                  <li key={badge.id} className="text-sm">
                    <div className="font-semibold text-amber-300">{badge.title}</div>
                    <div className="text-xs text-purple-200/80">{badge.detail}</div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Scientific Discoveries */}
        <section className="mt-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
            <Globe2 className="h-4 w-4 text-emerald-400" />
            <span>Scientific Discoveries ({save.discoveries.length}/{DISCOVERY_CODEX.length})</span>
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {DISCOVERY_CODEX.map((entry) => {
              const unlocked = save.discoveries.includes(entry.id);
              return (
                <div
                  key={entry.id}
                  className={`rounded-xl border p-4 ${
                    unlocked
                      ? 'border-[#543487] bg-[#291547]'
                      : 'border-[#38205C] bg-[#160A28]/70 opacity-65'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs text-purple-200/80">
                    <span className="font-semibold text-sky-300">{entry.instrument}</span>
                    <span aria-hidden="true">·</span>
                    <span>Planet: {entry.planetScope}</span>
                  </div>
                  <h4 className="mt-1 text-base font-bold text-white">
                    {unlocked ? entry.title : 'Discovery locked'}
                  </h4>
                  <p className="mt-1.5 text-xs leading-relaxed text-purple-100/90">
                    {unlocked
                      ? entry.shortFact
                      : 'Explore and calibrate this station in the lab to log the data.'}
                  </p>
                  {unlocked && (
                    <p className="mt-2 text-[11px] text-purple-200/75">{entry.originLabel}</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Active Learning Behavioral Observation (Zero Quizzes) */}
        {save.campaignMemory && (
          <section className="mt-6 rounded-xl border border-sky-400/40 bg-[#190B2E] p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-sky-300">
              <Compass className="h-4 w-4" />
              <span>Hands-On Decisions & Learning</span>
            </h3>
            <div className="mt-3 grid grid-cols-3 gap-2.5 text-center">
              <div className="rounded-lg border border-[#462A72] bg-[#241242] p-2.5">
                <div className="font-mono-tabular text-lg font-bold text-white">
                  {save.campaignMemory.explorationsCompleted}
                </div>
                <div className="text-[11px] text-purple-200/80">Explorations completed</div>
              </div>
              <div className="rounded-lg border border-[#462A72] bg-[#241242] p-2.5">
                <div className="font-mono-tabular text-lg font-bold text-emerald-300">
                  {save.campaignMemory.decisionsAdapted}
                </div>
                <div className="text-[11px] text-purple-200/80">Strategies adapted</div>
              </div>
              <div className="rounded-lg border border-[#462A72] bg-[#241242] p-2.5">
                <div className="font-mono-tabular text-lg font-bold text-amber-300">
                  {save.campaignMemory.appliedPriorKnowledge.length}
                </div>
                <div className="text-[11px] text-purple-200/80">Cross-mission applications</div>
              </div>
            </div>
            <ul className="mt-3 space-y-1 text-xs text-purple-100/90">
              {save.campaignMemory.m1ThermalShield === 'reflective' && (
                <li>• You chose reflective insulation to stabilize extreme temperatures.</li>
              )}
              {save.campaignMemory.m1DustFilter === 'electrostatic' && (
                <li>• You tested and applied an electrostatic filter against aerosols and dust.</li>
              )}
              {save.campaignMemory.m2RepairedAfterStorm && (
                <li>• You recovered the greenhouse after the dust gust by cleaning the dome.</li>
              )}
              {save.campaignMemory.m3RelocatedUnstableModule && (
                <li>• You spotted a tilted module on a slope and relocated it to the flat plateau.</li>
              )}
              {save.campaignMemory.m4CollectedRawWaterFirst && save.campaignMemory.m4PurifiedWaterPct >= 100 && (
                <li>• You compared cloudy raw water with water purified by the filter.</li>
              )}
              {save.campaignMemory.m5UsedMission4Water && (
                <li>• You reused purified water from Mission 4 to grow crops in the biodome.</li>
              )}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
};
