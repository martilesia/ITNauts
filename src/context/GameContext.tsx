import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  AccessibilitySettings,
  AstroDialogue,
  AstroMood,
  CampaignDecisionMemory,
  CommanderProfile,
  GameSaveState,
  InventoryItem,
  MissionId,
  ScreenRoute,
  StationId,
} from '../types/game';
import { soundEngine } from '../utils/soundEngine';

const STORAGE_KEY = 'space_base_commander_save_v1';

export const DEFAULT_CAMPAIGN_MEMORY: CampaignDecisionMemory = {
  m1ThermalShield: null,
  m1DustFilter: null,
  m1ReliefValidated: false,
  m1RainCollectorTested: false,
  m1SoilSeedTested: false,
  m1PrepSite: null,
  m2PreparedInTime: false,
  m2EnergyEfficiencyBonus: false,
  m2RepairedAfterStorm: false,
  m2ProtectedCount: 0,
  m2DamagedCount: 0,
  m3SteepSlopeAttempts: 0,
  m3RelocatedUnstableModule: false,
  m3RoverBatteryRemaining: 100,
  m4TestedPoorZone: false,
  m4CollectedRawWaterFirst: false,
  m4PurifiedWaterPct: 0,
  m4RecommendedZone: null,
  m5FirstRegionTried: null,
  m5AdjustedWaterStrategy: false,
  m5UsedMission4Water: false,
  m5SelectedZone: null,
  explorationsCompleted: 0,
  decisionsAdapted: 0,
  appliedPriorKnowledge: [],
};

const DEFAULT_SAVE: GameSaveState = {
  hasCompletedPrologue: false,
  hasSeenFinalVictory: false,
  selectedDestination: 'mars',
  commander: {
    commanderName: 'Nova',
    teamName: 'Team Aurora',
    suitColor: 'cobalt-blue',
    visorColor: 'arctic-cyan',
    emblem: 'planet',
    skinTone: 'caramel-brown',
    hairStyle: 'afro-crespo',
    hairColor: 'jet-black',
    eyeColor: 'brown',
  },
  completedMissions: [],
  mission1StationsDone: [],
  inventory: [],
  discoveries: [],
  badges: [],
  settings: {
    soundEnabled: true,
    voiceEnabled: false,
    captionsEnabled: true,
    reducedStimuli: false,
  },
  campaignMemory: DEFAULT_CAMPAIGN_MEMORY,
};

interface GameContextValue {
  save: GameSaveState;
  route: ScreenRoute;
  setRoute: (route: ScreenRoute) => void;
  astroDialogue: AstroDialogue | null;
  sayAstro: (text: string, mood?: AstroMood, durationMs?: number) => void;
  clearAstro: () => void;
  updateCommander: (partial: Partial<CommanderProfile>) => void;
  completePrologue: (navigateToMap?: boolean) => void;
  completeMission1Station: (station: StationId, discoveryId: string) => void;
  unlockDiscovery: (discoveryId: string) => void;
  completeMission: (missionId: MissionId, badgeId?: string, rewardItem?: InventoryItem) => void;
  markFinalVictorySeen: () => void;
  selectDestination: (destination: 'mars' | 'moon') => void;
  addInventoryItem: (item: InventoryItem) => void;
  recordDecision: (partial: Partial<CampaignDecisionMemory>) => void;
  recordBehavioralEvent: (kind: 'explore' | 'adapt' | 'apply', tag?: string) => void;
  toggleSetting: (key: keyof AccessibilitySettings) => void;
  resetCampaign: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [save, setSave] = useState<GameSaveState>(() => {
    if (typeof window === 'undefined') return DEFAULT_SAVE;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_SAVE;
      const parsed = JSON.parse(raw) as Partial<GameSaveState>;
      return {
        ...DEFAULT_SAVE,
        ...parsed,
        commander: { ...DEFAULT_SAVE.commander, ...(parsed.commander ?? {}) },
        settings: { ...DEFAULT_SAVE.settings, ...(parsed.settings ?? {}) },
        campaignMemory: { ...DEFAULT_CAMPAIGN_MEMORY, ...(parsed.campaignMemory ?? {}) },
      };
    } catch {
      return DEFAULT_SAVE;
    }
  });

  const [route, setRoute] = useState<ScreenRoute>('TITLE');

  const [astroDialogue, setAstroDialogue] = useState<AstroDialogue | null>(null);
  const astroTimerRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
    } catch {
      // Ignore storage quota errors
    }
  }, [save]);

  useEffect(() => {
    soundEngine.setSettings(save.settings.soundEnabled, save.settings.voiceEnabled);
  }, [save.settings.soundEnabled, save.settings.voiceEnabled]);

  useEffect(() => {
    const root = document.documentElement;
    if (save.settings.reducedStimuli) {
      root.classList.add('reduced-stimuli');
    } else {
      root.classList.remove('reduced-stimuli');
    }
  }, [save.settings.reducedStimuli]);

  const sayAstro = useCallback((text: string, mood: AstroMood = 'curious', durationMs = 9500) => {
    const id = Date.now();
    if (astroTimerRef.current !== null) {
      window.clearTimeout(astroTimerRef.current);
      astroTimerRef.current = null;
    }
    setAstroDialogue({ text, mood, id });
    if (mood !== 'sleeping' && mood !== 'idle') {
      soundEngine.playAstroBeep(mood);
    }
    soundEngine.speakShort(text);
    if (durationMs > 0) {
      // Ensure complete multi-sentence explanations stay visible long enough for children to read or hear
      const effectiveDuration = Math.max(durationMs, Math.min(24000, 7000 + text.length * 75));
      astroTimerRef.current = window.setTimeout(() => {
        setAstroDialogue((curr) => (curr?.id === id ? null : curr));
        astroTimerRef.current = null;
      }, effectiveDuration);
    }
  }, []);

  const clearAstro = useCallback(() => {
    if (astroTimerRef.current !== null) {
      window.clearTimeout(astroTimerRef.current);
      astroTimerRef.current = null;
    }
    setAstroDialogue(null);
  }, []);

  const updateCommander = useCallback((partial: Partial<CommanderProfile>) => {
    setSave((prev) => ({
      ...prev,
      commander: { ...prev.commander, ...partial },
    }));
  }, []);

  const completePrologue = useCallback((navigateToMap = true) => {
    setSave((prev) => ({
      ...prev,
      hasCompletedPrologue: true,
    }));
    if (navigateToMap) {
      setRoute('CAMPAIGN_MAP');
    }
  }, []);

  const addInventoryItem = useCallback((item: InventoryItem) => {
    setSave((prev) => {
      if (prev.inventory.some((i) => i.id === item.id)) return prev;
      return { ...prev, inventory: [...prev.inventory, item] };
    });
  }, []);

  const completeMission1Station = useCallback((station: StationId, discoveryId: string) => {
    setSave((prev) => {
      const stations = prev.mission1StationsDone.includes(station)
        ? prev.mission1StationsDone
        : [...prev.mission1StationsDone, station];
      const discoveries = prev.discoveries.includes(discoveryId)
        ? prev.discoveries
        : [...prev.discoveries, discoveryId];
      return {
        ...prev,
        mission1StationsDone: stations,
        discoveries,
      };
    });
  }, []);

  const unlockDiscovery = useCallback((discoveryId: string) => {
    setSave((prev) => {
      if (prev.discoveries.includes(discoveryId)) return prev;
      return { ...prev, discoveries: [...prev.discoveries, discoveryId] };
    });
  }, []);

  const completeMission = useCallback(
    (missionId: MissionId, badgeId?: string, rewardItem?: InventoryItem) => {
      setSave((prev) => {
        const completedMissions = prev.completedMissions.includes(missionId)
          ? prev.completedMissions
          : [...prev.completedMissions, missionId];
        const badges =
          badgeId && !prev.badges.includes(badgeId) ? [...prev.badges, badgeId] : prev.badges;
        const inventory =
          rewardItem && !prev.inventory.some((i) => i.id === rewardItem.id)
            ? [...prev.inventory, rewardItem]
            : prev.inventory;
        return { ...prev, completedMissions, badges, inventory };
      });
    },
    []
  );

  const markFinalVictorySeen = useCallback(() => {
    setSave((prev) => (prev.hasSeenFinalVictory ? prev : { ...prev, hasSeenFinalVictory: true }));
  }, []);

  const selectDestination = useCallback((destination: 'mars' | 'moon') => {
    setSave((prev) => ({ ...prev, selectedDestination: destination }));
  }, []);

  const recordDecision = useCallback((partial: Partial<CampaignDecisionMemory>) => {
    setSave((prev) => ({
      ...prev,
      campaignMemory: {
        ...DEFAULT_CAMPAIGN_MEMORY,
        ...(prev.campaignMemory ?? {}),
        ...partial,
      },
    }));
  }, []);

  const recordBehavioralEvent = useCallback((kind: 'explore' | 'adapt' | 'apply', tag?: string) => {
    setSave((prev) => {
      const mem = { ...DEFAULT_CAMPAIGN_MEMORY, ...(prev.campaignMemory ?? {}) };
      if (kind === 'explore') {
        mem.explorationsCompleted += 1;
      } else if (kind === 'adapt') {
        mem.decisionsAdapted += 1;
      } else if (kind === 'apply' && tag && !mem.appliedPriorKnowledge.includes(tag)) {
        mem.appliedPriorKnowledge = [...mem.appliedPriorKnowledge, tag];
      }
      return { ...prev, campaignMemory: mem };
    });
  }, []);

  const toggleSetting = useCallback((key: keyof AccessibilitySettings) => {
    setSave((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        [key]: !prev.settings[key],
      },
    }));
  }, []);

  const resetCampaign = useCallback(() => {
    setSave(DEFAULT_SAVE);
    setRoute('TITLE');
    setAstroDialogue(null);
  }, []);

  return (
    <GameContext.Provider
      value={{
        save,
        route,
        setRoute,
        astroDialogue,
        sayAstro,
        clearAstro,
        updateCommander,
        completePrologue,
        completeMission1Station,
        unlockDiscovery,
        completeMission,
        markFinalVictorySeen,
        selectDestination,
        addInventoryItem,
        recordDecision,
        recordBehavioralEvent,
        toggleSetting,
        resetCampaign,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
