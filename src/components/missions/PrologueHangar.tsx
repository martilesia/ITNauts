import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Compass,
  Eye,
  List,
  Palette,
  Rocket,
  Shirt,
  Sparkles,
  Star,
  User,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import {
  EMBLEM_OPTIONS,
  EYE_COLORS,
  HAIR_COLORS,
  HAIR_STYLES,
  SKIN_TONES,
  SUIT_COLORS,
  VISOR_COLORS,
} from '../../data/scientificData';
import {
  EyeColorId,
  HairColorId,
  SkinToneId,
  SuitColorId,
  VisorColorId,
} from '../../types/game';
import { soundEngine } from '../../utils/soundEngine';
import { AstroCompanion } from '../engine/AstroCompanion';
import {
  CommanderHeadPreview,
  CommanderSprite,
  CommanderSuitPreview,
} from '../engine/CommanderSprite';

type EquipTabId = 'hair' | 'skin' | 'eyes' | 'suit' | 'visor' | 'emblem' | 'identity';

const EQUIP_TABS: { id: EquipTabId; label: string; icon: React.ReactNode }[] = [
  { id: 'hair', label: 'Hair', icon: <Sparkles className="h-5 w-5" /> },
  { id: 'skin', label: 'Skin', icon: <Palette className="h-5 w-5" /> },
  { id: 'eyes', label: 'Eyes', icon: <Eye className="h-5 w-5" /> },
  { id: 'suit', label: 'Suit', icon: <Shirt className="h-5 w-5" /> },
  { id: 'visor', label: 'Helmet', icon: <Rocket className="h-5 w-5" /> },
  { id: 'emblem', label: 'Emblem', icon: <Star className="h-5 w-5" /> },
  { id: 'identity', label: 'Name', icon: <User className="h-5 w-5" /> },
];

export const PrologueHangar: React.FC = () => {
  const {
    save,
    updateCommander,
    completePrologue,
    setRoute,
    sayAstro,
    astroDialogue,
    toggleSetting,
  } = useGame();

  const [activeTab, setActiveTab] = useState<EquipTabId>('hair');
  const [celebratePulse, setCelebratePulse] = useState(false);

  const isMoon = save.selectedDestination === 'moon';
  const destLabel = isMoon ? 'Moon' : 'Mars';
  const commanderName = save.commander.commanderName || 'Nova';

  useEffect(() => {
    sayAstro(
      `Welcome to the Equipment Room, Commander ${commanderName}! Choose your look and suit before we head to ${isMoon ? 'the Moon' : 'Mars'}.`,
      'happy',
      6500
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerReaction = (message?: string) => {
    soundEngine.playClick();
    setCelebratePulse(true);
    setTimeout(() => setCelebratePulse(false), 650);
    if (message) {
      sayAstro(message, 'happy', 3500);
    }
  };

  const handleLaunchMission = () => {
    soundEngine.playSuccess();
    if (!save.hasCompletedPrologue) {
      completePrologue(false);
    }
    setRoute('MISSION_1');
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[#1B0D2E] text-white select-none">
      {/* Cosmic Backdrop Stars & Nebula */}
      <svg
        viewBox="0 0 1200 720"
        preserveAspectRatio="xMidYMid slice"
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="equip-bg-glow" cx="68%" cy="48%" r="55%">
            <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.28" />
            <stop offset="55%" stopColor="#3B1E66" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#1B0D2E" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="1200" height="720" fill="#1B0D2E" />
        <rect width="1200" height="720" fill="url(#equip-bg-glow)" />
        <circle cx="520" cy="110" r="2" fill="#FDE047" opacity="0.8" />
        <circle cx="670" cy="80" r="1.5" fill="#E2E8F0" opacity="0.7" />
        <circle cx="960" cy="145" r="2.2" fill="#38BDF8" opacity="0.85" />
        <circle cx="1090" cy="290" r="1.6" fill="#E2E8F0" opacity="0.7" />
        <circle cx="610" cy="590" r="2" fill="#FDE047" opacity="0.65" />
        <circle cx="1040" cy="540" r="1.8" fill="#A5F3FC" opacity="0.7" />
      </svg>

      {/* Top Header Bar with Circular Game Icons (inspired by reference) */}
      <header className="relative z-20 flex flex-wrap items-center justify-between gap-4 border-b border-[#462A72] bg-[#21103A]/90 px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="font-display text-lg font-bold tracking-tight text-amber-300">
            Space Base Commander
          </span>
          <span className="text-purple-400/60" aria-hidden="true">·</span>
          <span className="text-xs font-semibold text-sky-300">
            Equipment Room · Destination: {destLabel}
          </span>
        </div>

        {/* Circular Tactile Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setRoute('DESTINATION_ROOM');
            }}
            title="Change Destination (Moon or Mars)"
            className="inline-flex h-11 items-center gap-1.5 rounded-full border-2 border-white bg-gradient-to-b from-[#38BDF8] to-[#0284C7] px-3.5 text-xs font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            <Compass className="h-4 w-4" />
            <span className="hidden sm:inline">Destinations</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              if (!save.hasCompletedPrologue) completePrologue(false);
              setRoute('CAMPAIGN_MAP');
            }}
            aria-label="Open Mission Map"
            title="All Missions"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-white bg-gradient-to-b from-[#F472B6] to-[#DB2777] text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            <List className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => {
              toggleSetting('soundEnabled');
              soundEngine.playClick();
            }}
            aria-label={save.settings.soundEnabled ? 'Mute sound' : 'Enable sound'}
            title={save.settings.soundEnabled ? 'Sound on' : 'Sound off'}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-white bg-gradient-to-b from-[#A78BFA] to-[#6D28D9] text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            {save.settings.soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Main Split Dress-Up Arena */}
      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-4 lg:flex-row lg:items-stretch lg:px-8 lg:py-6">
        {/* LEFT: Framed Wardrobe Panel + Vertical Side Category Tabs */}
        <section className="flex w-full items-stretch lg:w-[430px] shrink-0">
          {/* Framed Item Grid Box */}
          <div className="flex flex-1 flex-col overflow-hidden rounded-3xl border-4 border-amber-400 bg-[#23103E]/95 shadow-[0_14px_38px_rgba(12,4,28,0.7)]">
            {/* Active Category Title Header */}
            <div className="flex items-center justify-between border-b-2 border-[#462A72] bg-[#2D1650] px-4 py-3">
              <div>
                <h1 className="font-display text-lg font-bold text-amber-300 leading-tight">
                  {activeTab === 'hair' && 'Commander Hair'}
                  {activeTab === 'skin' && 'Skin Tone'}
                  {activeTab === 'eyes' && 'Eye Color'}
                  {activeTab === 'suit' && 'Space Suit'}
                  {activeTab === 'visor' && 'Helmet & Crystal'}
                  {activeTab === 'emblem' && 'Mission Emblem'}
                  {activeTab === 'identity' && 'Name & Team'}
                </h1>
                <p className="text-[11px] text-purple-200/80">
                  Inclusive customization for all explorers
                </p>
              </div>
            </div>

            {/* Scrollable 2-Column Visual Grid Content */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3 max-h-[380px] lg:max-h-[480px]">
              {/* TAB: HAIR (with Hair Color Swatches + 8 Inclusive Hairstyles including Crespo) */}
              {activeTab === 'hair' && (
                <>
                  <div className="rounded-xl border border-[#462A72] bg-[#160A29] p-2.5">
                    <div className="mb-2 text-[11px] font-bold text-purple-200">Hair Color</div>
                    <div className="flex flex-wrap gap-2">
                      {(Object.keys(HAIR_COLORS) as HairColorId[]).map((cid) => {
                        const c = HAIR_COLORS[cid];
                        const active = save.commander.hairColor === cid;
                        return (
                          <button
                            key={cid}
                            type="button"
                            onClick={() => {
                              updateCommander({ hairColor: cid });
                              triggerReaction();
                            }}
                            title={c.label}
                            aria-label={c.label}
                            className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                              active ? 'border-amber-300 ring-2 ring-amber-300/60 scale-110' : 'border-white/50'
                            }`}
                            style={{ backgroundColor: c.fill }}
                          />
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {HAIR_STYLES.map((style) => {
                      const active = save.commander.hairStyle === style.id;
                      return (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => {
                            updateCommander({ hairStyle: style.id });
                            triggerReaction('Great hairstyle!');
                          }}
                          className={`flex flex-col items-center justify-center rounded-2xl border-2 p-2.5 transition-all ${
                            active
                              ? 'border-amber-300 bg-[#3B1E66] shadow-[0_0_16px_rgba(250,204,21,0.3)]'
                              : 'border-[#462A72] bg-[#180B2E] hover:border-sky-300'
                          }`}
                        >
                          <CommanderHeadPreview
                            hairStyle={style.id}
                            hairColor={save.commander.hairColor}
                            mannequinMode
                            size={76}
                          />
                          <span className="mt-1 text-xs font-bold text-white text-center leading-tight">
                            {style.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* TAB: SKIN TONE (6 Inclusive Skin Tones including Pele Negra & Negra Profunda) */}
              {activeTab === 'skin' && (
                <div className="grid grid-cols-2 gap-2.5">
                  {(Object.keys(SKIN_TONES) as SkinToneId[]).map((skinId) => {
                    const tone = SKIN_TONES[skinId];
                    const active = save.commander.skinTone === skinId;
                    return (
                      <button
                        key={skinId}
                        type="button"
                        onClick={() => {
                          updateCommander({ skinTone: skinId });
                          triggerReaction();
                        }}
                        className={`flex flex-col items-center justify-center rounded-2xl border-2 p-2.5 transition-all ${
                          active
                            ? 'border-amber-300 bg-[#3B1E66] shadow-[0_0_16px_rgba(250,204,21,0.3)]'
                            : 'border-[#462A72] bg-[#180B2E] hover:border-sky-300'
                        }`}
                      >
                        <CommanderHeadPreview
                          skinTone={skinId}
                          hairStyle={save.commander.hairStyle}
                          hairColor={save.commander.hairColor}
                          eyeColor={save.commander.eyeColor}
                          size={76}
                        />
                        <div className="mt-1 flex items-center gap-1.5">
                          <span
                            className="h-3 w-3 rounded-full border border-white/70 shrink-0"
                            style={{ backgroundColor: tone.base }}
                          />
                          <span className="text-xs font-bold text-white leading-tight">
                            {tone.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* TAB: EYES */}
              {activeTab === 'eyes' && (
                <div className="grid grid-cols-2 gap-2.5">
                  {(Object.keys(EYE_COLORS) as EyeColorId[]).map((eyeId) => {
                    const eye = EYE_COLORS[eyeId];
                    const active = save.commander.eyeColor === eyeId;
                    return (
                      <button
                        key={eyeId}
                        type="button"
                        onClick={() => {
                          updateCommander({ eyeColor: eyeId });
                          triggerReaction();
                        }}
                        className={`flex flex-col items-center justify-center rounded-2xl border-2 p-3 transition-all ${
                          active
                            ? 'border-amber-300 bg-[#3B1E66] shadow-[0_0_16px_rgba(250,204,21,0.3)]'
                            : 'border-[#462A72] bg-[#180B2E] hover:border-sky-300'
                        }`}
                      >
                        <CommanderHeadPreview
                          skinTone={save.commander.skinTone}
                          hairStyle={save.commander.hairStyle}
                          hairColor={save.commander.hairColor}
                          eyeColor={eyeId}
                          size={76}
                        />
                        <div className="mt-1 flex items-center gap-1.5">
                          <span
                            className="h-3 w-3 rounded-full border border-white/70 shrink-0"
                            style={{ backgroundColor: eye.iris }}
                          />
                          <span className="text-xs font-bold text-white">{eye.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* TAB: SUIT COLOR */}
              {activeTab === 'suit' && (
                <div className="grid grid-cols-2 gap-2.5">
                  {(Object.keys(SUIT_COLORS) as SuitColorId[]).map((suitId) => {
                    const suit = SUIT_COLORS[suitId];
                    const active = save.commander.suitColor === suitId;
                    return (
                      <button
                        key={suitId}
                        type="button"
                        onClick={() => {
                          updateCommander({ suitColor: suitId });
                          triggerReaction('Space suit equipped!');
                        }}
                        className={`flex flex-col items-center justify-center rounded-2xl border-2 p-2.5 transition-all ${
                          active
                            ? 'border-amber-300 bg-[#3B1E66] shadow-[0_0_16px_rgba(250,204,21,0.3)]'
                            : 'border-[#462A72] bg-[#180B2E] hover:border-sky-300'
                        }`}
                      >
                        <CommanderSuitPreview
                          suitColor={suitId}
                          visorColor={save.commander.visorColor}
                          emblem={save.commander.emblem}
                          size={66}
                        />
                        <span className="mt-1 text-xs font-bold text-white">{suit.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* TAB: HELMET VISOR CRYSTAL */}
              {activeTab === 'visor' && (
                <div className="grid grid-cols-2 gap-2.5">
                  {(Object.keys(VISOR_COLORS) as VisorColorId[]).map((visorId) => {
                    const visor = VISOR_COLORS[visorId];
                    const active = save.commander.visorColor === visorId;
                    return (
                      <button
                        key={visorId}
                        type="button"
                        onClick={() => {
                          updateCommander({ visorColor: visorId });
                          triggerReaction('Helmet adjusted!');
                        }}
                        className={`flex flex-col items-center justify-center rounded-2xl border-2 p-2.5 transition-all ${
                          active
                            ? 'border-amber-300 bg-[#3B1E66] shadow-[0_0_16px_rgba(250,204,21,0.3)]'
                            : 'border-[#462A72] bg-[#180B2E] hover:border-sky-300'
                        }`}
                      >
                        <CommanderSuitPreview
                          suitColor={save.commander.suitColor}
                          visorColor={visorId}
                          emblem={save.commander.emblem}
                          size={66}
                        />
                        <span className="mt-1 text-xs font-bold text-white">{visor.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* TAB: EMBLEM */}
              {activeTab === 'emblem' && (
                <div className="grid grid-cols-2 gap-2.5">
                  {EMBLEM_OPTIONS.map((opt) => {
                    const active = save.commander.emblem === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          updateCommander({ emblem: opt.id });
                          triggerReaction(`${opt.label} emblem attached!`);
                        }}
                        className={`flex flex-col items-center justify-center rounded-2xl border-2 p-2.5 transition-all ${
                          active
                            ? 'border-amber-300 bg-[#3B1E66] shadow-[0_0_16px_rgba(250,204,21,0.3)]'
                            : 'border-[#462A72] bg-[#180B2E] hover:border-sky-300'
                        }`}
                      >
                        <CommanderSuitPreview
                          suitColor={save.commander.suitColor}
                          visorColor={save.commander.visorColor}
                          emblem={opt.id}
                          size={66}
                        />
                        <span className="mt-1 text-xs font-bold text-white">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* TAB: IDENTITY */}
              {activeTab === 'identity' && (
                <div className="space-y-4 p-1">
                  <label className="block">
                    <span className="text-xs font-bold text-purple-100">Commander Name</span>
                    <input
                      type="text"
                      maxLength={18}
                      value={save.commander.commanderName}
                      onChange={(e) => updateCommander({ commanderName: e.target.value })}
                      placeholder="e.g., Nova"
                      className="mt-1.5 h-11 w-full rounded-xl border-2 border-[#543487] bg-[#140826] px-3.5 text-sm font-semibold text-white focus:border-amber-300 focus:outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-purple-100">Team Name</span>
                    <input
                      type="text"
                      maxLength={22}
                      value={save.commander.teamName}
                      onChange={(e) => updateCommander({ teamName: e.target.value })}
                      placeholder="e.g., Team Aurora"
                      className="mt-1.5 h-11 w-full rounded-xl border-2 border-[#543487] bg-[#140826] px-3.5 text-sm font-semibold text-white focus:border-amber-300 focus:outline-none"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Attached Vertical Category Tabs on Right Edge of Drawer (matching reference image) */}
          <div className="flex flex-col justify-center gap-2 pl-1.5 py-3">
            {EQUIP_TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setActiveTab(tab.id);
                  }}
                  title={tab.label}
                  aria-label={tab.label}
                  className={`flex h-12 w-12 sm:w-14 flex-col items-center justify-center rounded-r-2xl border-2 border-l-0 transition-transform ${
                    active
                      ? 'translate-x-0.5 border-white bg-gradient-to-b from-[#FDE047] to-[#EAB308] text-slate-950 shadow-lg scale-105'
                      : 'border-white/70 bg-gradient-to-b from-[#F472B6] to-[#DB2777] text-white/95 hover:scale-105'
                  }`}
                >
                  {tab.icon}
                  <span className="mt-0.5 text-[9px] font-bold leading-none">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* RIGHT: Large Cosmic Commander Stage + ASTRO + Launch CTA */}
        <section className="relative flex flex-1 flex-col items-center justify-between rounded-3xl border-2 border-[#462A72] bg-gradient-to-b from-[#291448]/90 via-[#201038]/95 to-[#160928]/95 p-6 shadow-2xl">
          {/* Glowing Planet Aura Circle behind Commander (matching reference image) */}
          <div className="pointer-events-none absolute left-1/2 top-[44%] h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-b from-sky-400/25 via-sky-500/15 to-transparent blur-[2px] border border-sky-300/20" />

          {/* Top Status Pill */}
          <div className="relative z-10 flex w-full flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-sky-300">
                Space Gear Ready
              </div>
              <div className="font-display text-xl font-bold text-white">
                Commander {commanderName}
              </div>
              <div className="text-xs text-purple-200/80">{save.commander.teamName || 'Team Aurora'}</div>
            </div>

            <div className="rounded-2xl border border-[#543487] bg-[#160A29]/90 px-3.5 py-2 text-right">
              <div className="text-[10px] font-bold uppercase tracking-wider text-purple-300">
                Next Destination
              </div>
              <div className={`font-display text-base font-bold ${isMoon ? 'text-sky-300' : 'text-orange-300'}`}>
                {destLabel}
              </div>
            </div>
          </div>

          {/* Center Large Commander + ASTRO */}
          <div className="relative z-10 my-4 flex flex-col items-center justify-center gap-4 sm:flex-row sm:items-end sm:gap-8">
            <div className="flex flex-col items-center">
              <CommanderSprite
                profile={save.commander}
                size={210}
                isCelebrating={celebratePulse}
              />
            </div>

            <div className="flex flex-col items-center">
              <AstroCompanion
                mood={celebratePulse ? 'happy' : (astroDialogue?.mood ?? 'happy')}
                caption={
                  astroDialogue?.text ??
                  `You're ready, Commander ${commanderName}! Shall we launch to ${isMoon ? 'the Moon' : 'Mars'}?`
                }
                showCaptions={save.settings.captionsEnabled}
                size={84}
              />
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="relative z-10 flex w-full flex-wrap items-center justify-between gap-3 border-t border-[#462A72] pt-4">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                if (!save.hasCompletedPrologue) completePrologue(false);
                setRoute('CAMPAIGN_MAP');
              }}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#543487] bg-[#2D174D] px-4 text-xs font-bold text-purple-100 hover:border-sky-300"
            >
              <span>View Mission Map</span>
            </button>

            <button
              type="button"
              onClick={handleLaunchMission}
              className="inline-flex h-14 items-center gap-2.5 rounded-full border-4 border-white border-b-[6px] bg-gradient-to-b from-[#FDE047] via-[#FACC15] to-[#EAB308] px-7 font-display text-lg font-bold text-slate-950 shadow-[0_8px_24px_rgba(250,204,21,0.35)] transition-transform hover:scale-105 active:scale-95"
            >
              <Rocket className="h-5 w-5" />
              <span>Launch to {isMoon ? 'the Moon' : 'Mars'} (Mission 1)!</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};
