import { BadgeEntry, DiscoveryEntry, MissionId } from '../types/game';

export type PlanetaryDestination = 'moon' | 'mars';

export interface ScientificReferenceMeta {
  datasetName: string;
  instrument: string;
  body: 'Moon' | 'Mars';
  infoType: string;
  unit: string;
  originLabel: string;
}

export interface PlanetaryMissionMeta {
  id: MissionId;
  number: number;
  title: string;
  planet: string;
  instrumentTag: string;
  shortGoal: string;
  playable: boolean;
  reference: ScientificReferenceMeta;
}

export function getCampaignMissions(destination: PlanetaryDestination): PlanetaryMissionMeta[] {
  if (destination === 'moon') {
    return [
      {
        id: 'mission-1',
        number: 1,
        title: 'The Space Calling',
        planet: 'Moon · LRO (Diviner / LOLA / LROC)',
        instrumentTag: 'Diviner Thermal · LROC Shadows · Regolith Filter',
        shortGoal: 'Test thermal protection, solar power vs. shadow, and lunar dust before the mission.',
        playable: true,
        reference: {
          datasetName: 'LRO Diviner & LROC (Simulated Training)',
          instrument: 'Diviner Radiometer · LROC · LOLA',
          body: 'Moon',
          infoType: 'Extreme surface temperature, lighting, and electric dust',
          unit: '°C / % energy',
          originLabel: 'Educational simulation inspired by NASA LRO mission instruments',
        },
      },
      {
        id: 'mission-2',
        number: 2,
        title: 'Operation: Lunar Shield',
        planet: 'Moon · Radiation & Regolith',
        instrumentTag: 'Solar Shield · Panels · Electrostatic Regolith · O₂',
        shortGoal: 'Protect the lunar base against a solar flare, extreme shadow cold, and electric dust.',
        playable: true,
        reference: {
          datasetName: 'Lunar Space Environment (Simulation)',
          instrument: 'Solar Monitor & Lunar Thermal Sensors',
          body: 'Moon',
          infoType: 'Solar radiation, day/night thermal shock, and windless lunar dust',
          unit: '% integrity / °C / % O₂',
          originLabel: 'Educational simulation (no atmosphere or wind storms on the Moon)',
        },
      },
      {
        id: 'mission-3',
        number: 3,
        title: 'Terrain Explorer',
        planet: 'Moon · LOLA Altimeter',
        instrumentTag: 'LOLA · Rover · Elevation & Slope · Base',
        shortGoal: 'Drive the rover, collect samples, and choose the best site for the base.',
        playable: true,
        reference: {
          datasetName: 'LRO LOLA (Simulated Terrain)',
          instrument: 'Lunar Orbiter Laser Altimeter (LOLA)',
          body: 'Moon',
          infoType: 'Elevation and slope of craters and plains',
          unit: 'm / degrees',
          originLabel: 'Simulated terrain model for landing and base training',
        },
      },
      {
        id: 'mission-4',
        number: 4,
        title: 'Lunar Ice Explorer',
        planet: 'Moon · Polar Craters (PSR)',
        instrumentTag: 'Diviner · LOLA · LCROSS · Thermal Extractor',
        shortGoal: 'Locate ice in dark polar craters, manage battery, and purify the water.',
        playable: true,
        reference: {
          datasetName: 'LRO Diviner / LOLA / LCROSS (Simulation)',
          instrument: 'Diviner · Neutron Detector · Thermal Extractor',
          body: 'Moon',
          infoType: 'Cold traps (PSR) with ice mixed in regolith',
          unit: '°C / % battery / % clean water',
          originLabel: 'Educational simulation inspired by NASA LCROSS & LRO discoveries',
        },
      },
      {
        id: 'mission-5',
        number: 5,
        title: 'Lunar Regolith Explorer',
        planet: 'Moon · Geology & Engineering',
        instrumentTag: 'Optical Microscope · Physical Analyzer · Platform',
        shortGoal: 'Collect lunar regolith, observe grains under a microscope, and build a firm base.',
        playable: true,
        reference: {
          datasetName: 'Lunar Samples & In-Situ Engineering (Simulation)',
          instrument: 'Grain Microscope · Compaction Analyzer',
          body: 'Moon',
          infoType: 'Mare basalt, highland anorthosite, and sharp fine dust',
          unit: 'Qualitative indices (Low / Medium / High)',
          originLabel: 'Educational simulation inspired by Apollo samples and Artemis studies',
        },
      },
    ];
  }

  return [
    {
      id: 'mission-1',
      number: 1,
      title: 'The Space Calling',
      planet: 'Mars · MOLA / THEMIS / HiRISE',
      instrumentTag: 'THEMIS Thermal · Dust Filter · MOLA Relief',
      shortGoal: 'Prepare the thermal shield, fine dust filter, and comms for the Mars environment.',
      playable: true,
      reference: {
        datasetName: 'MRO / Odyssey · THEMIS & MOLA (Simulation)',
        instrument: 'THEMIS · MOLA · Atmospheric Dust Sensor',
        body: 'Mars',
        infoType: 'Day/night temperature swing in thin CO₂ atmosphere and fine dust',
        unit: '°C / orbital signal',
        originLabel: 'Educational simulation inspired by Mars Odyssey, MGS, and MRO orbiters',
      },
    },
    {
      id: 'mission-2',
      number: 2,
      title: 'Operation: Red Storm',
      planet: 'Mars · Dust Storm',
      instrumentTag: 'Solar Energy · Batteries · Rover Brush · O₂',
      shortGoal: 'Prepare and protect the Martian base during a red dust storm.',
      playable: true,
      reference: {
        datasetName: 'Martian Meteorology & REMS (Simulation)',
        instrument: 'Dust Sensor · Solar Panels · Base Shield',
        body: 'Mars',
        infoType: 'Suspended atmospheric dust in thin CO₂ air and solar drop',
        unit: '% energy / % dust / % O₂',
        originLabel: 'Educational simulation inspired by storms observed by Mars rovers',
      },
    },
    {
      id: 'mission-3',
      number: 3,
      title: 'Terrain Explorer',
      planet: 'Mars · MOLA Altimeter',
      instrumentTag: 'MOLA · Rover · Elevation & Slope · Base',
      shortGoal: 'Drive the rover, collect samples, and choose the best site for the base.',
      playable: true,
      reference: {
        datasetName: 'MGS MOLA (Simulated Terrain)',
        instrument: 'Mars Orbiter Laser Altimeter (MOLA)',
        body: 'Mars',
        infoType: 'Elevation and slope of craters, plains, and valleys',
        unit: 'm / degrees',
        originLabel: 'Simulated terrain model for landing and base training',
      },
    },
    {
      id: 'mission-4',
      number: 4,
      title: 'Water & Ice Explorer',
      planet: 'Mars · SHARAD & CRISM',
      instrumentTag: 'SHARAD Radar · CRISM Spectrometer · Purifier',
      shortGoal: 'Use subsurface radar to find buried ice, melt it, and purify the water.',
      playable: true,
      reference: {
        datasetName: 'MRO SHARAD & CRISM (Simulation)',
        instrument: 'SHARAD Subsurface Radar · CRISM Spectrometer',
        body: 'Mars',
        infoType: 'Buried glacial ice vs. hydrated minerals from ancient dry lakes',
        unit: 'depth (m) / % ice / % pure water',
        originLabel: 'Educational simulation inspired by NASA MRO SHARAD and CRISM instruments',
      },
    },
    {
      id: 'mission-5',
      number: 5,
      title: 'Martian Regolith Explorer',
      planet: 'Mars · Geology & Engineering',
      instrumentTag: 'Optical Microscope · Spectrometer · Foundation',
      shortGoal: 'Analyze dunes, ancient clays, and basalt to build the base foundation and greenhouse.',
      playable: true,
      reference: {
        datasetName: 'Martian Surface Geology (Simulation)',
        instrument: 'Grain Microscope · Mineral Spectrometer',
        body: 'Mars',
        infoType: 'Loose iron-oxide sand, hydrated clay, and firm basalt rock',
        unit: 'Qualitative indices (Low / Medium / High)',
        originLabel: 'Educational simulation inspired by NASA Curiosity and Perseverance rovers',
      },
    },
  ];
}

export function getDiscoveryCodex(destination: PlanetaryDestination): DiscoveryEntry[] {
  const isMoon = destination === 'moon';
  return [
    {
      id: 'disc-modis',
      title: isMoon ? 'Extreme Temperatures on the Moon (Sun vs. Shadow)' : 'Temperature Range in Mars’s Thin Atmosphere',
      instrument: isMoon ? 'NASA LRO Diviner (Simulation)' : 'NASA Mars Odyssey THEMIS (Simulation)',
      planetScope: isMoon ? 'Moon' : 'Mars',
      originTag: 'NASA_REAL_CONCEPT',
      originLabel: isMoon
        ? 'Inspired by the LRO Diviner radiometer · Simulated data'
        : 'Inspired by the Mars Odyssey THEMIS spectrometer · Simulated data',
      shortFact: isMoon
        ? 'With no atmosphere to hold heat, lunar soil heats above +120 °C in sunlight and cools below -130 °C at night (or -225 °C in polar craters).'
        : 'With a very thin CO₂ atmosphere, Martian soil can reach near +18 °C on a summer afternoon, but drop below -88 °C at night.',
      missionId: 'mission-1',
    },
    {
      id: 'disc-merra2',
      title: isMoon ? 'Electrostatic Lunar Dust (No Wind)' : 'Suspended Fine Iron-Oxide Dust',
      instrument: isMoon ? 'Regolith Analyzer & Electrostatic Filter' : 'Martian Atmospheric Dust Sensor',
      planetScope: isMoon ? 'Moon' : 'Mars',
      originTag: 'NASA_REAL_CONCEPT',
      originLabel: isMoon
        ? 'Lunar phenomenon studied since the Apollo missions · Simulated training'
        : 'Phenomenon observed by NASA Mars rovers · Simulated training',
      shortFact: isMoon
        ? 'There is no wind on the Moon! Lunar dust clings to suits and panels via electric charge caused by sunlight and has very sharp edges.'
        : 'Mars’s thin wind lifts very fine iron-oxide dust that can cover solar panels for days or weeks.',
      missionId: 'mission-1',
    },
    {
      id: 'disc-srtm',
      title: isMoon ? 'Sunlight vs. Deep Craters on the Moon' : 'Orbital Comms and Martian Terrain',
      instrument: isMoon ? 'LRO LROC & LOLA (Simulation)' : 'MGS MOLA & HiRISE (Simulation)',
      planetScope: isMoon ? 'Moon' : 'Mars',
      originTag: 'NASA_REAL_CONCEPT',
      originLabel: 'Planetary altimetry and orbital imagery · Interactive model',
      shortFact: isMoon
        ? 'Placing solar panels at the bottom of a deep crater leaves the base without light. A sunlit flat rim guarantees steady power.'
        : 'Very deep valleys and craters can block radio signals near the horizon. Sheltered plateaus keep a clear link with satellites.',
      missionId: 'mission-1',
    },
    {
      id: 'disc-mars-storm',
      title: isMoon ? 'Solar Flare and Thermal Shock on the Moon' : 'Global Dust Storm on Mars',
      instrument: isMoon ? 'Radiation Monitor & Lunar Shield' : 'Energy & Dust Management System',
      planetScope: isMoon ? 'Moon' : 'Mars',
      originTag: 'SIMULATED_TRAINING',
      originLabel: isMoon
        ? 'Educational simulation of radiation and thermal shock on the Moon'
        : 'Educational simulation of a dust storm on Mars',
      shortFact: isMoon
        ? 'Without a global magnetic field or atmosphere, the Moon receives direct solar radiation. Closing shields on instruments and keeping insulation saves the base.'
        : 'During a Martian storm, dust darkens the sky and covers panels. Saving energy, cleaning panels with the rover, and protecting sensors is vital.',
      missionId: 'mission-2',
    },
    {
      id: 'disc-mola-terrain',
      title: 'Mapping Terrain on the Moon and Mars',
      instrument: 'LOLA (Moon) · MOLA (Mars)',
      planetScope: 'Moon / Mars',
      originTag: 'NASA_REAL_CONCEPT',
      originLabel: 'Planetary laser altimeter · Simulated game terrain',
      shortFact:
        'To choose where to build a base, scientists measure elevation and slope using laser altimeters like LOLA on the Moon and MOLA on Mars.',
      missionId: 'mission-3',
    },
    {
      id: 'disc-gpm-rainfall',
      title: isMoon ? 'Ice in Shadowed Polar Craters (PSR)' : 'Subsurface Ice vs. Ancient Water Minerals',
      instrument: isMoon ? 'LRO Diviner / LOLA / LCROSS (Simulation)' : 'MRO SHARAD Radar & CRISM Spectrometer (Simulation)',
      planetScope: isMoon ? 'Moon' : 'Mars',
      originTag: 'NASA_REAL_CONCEPT',
      originLabel: isMoon
        ? 'Inspired by NASA LRO and LCROSS missions · Educational simulation'
        : 'Inspired by NASA MRO SHARAD and CRISM instruments · Educational simulation',
      shortFact: isMoon
        ? 'Lunar water does not flow in rivers or come ready to drink: it exists as ice mixed in frozen regolith (-225 °C) where the Sun never shines, requiring heating and purification.'
        : 'It does not rain on Mars today: there is ice buried underground (detected by SHARAD radar) and hydrated clays (CRISM) showing where ancient lakes once existed.',
      missionId: 'mission-4',
    },
    {
      id: 'disc-smap-soil',
      title: isMoon ? 'Lunar Regolith Under the Microscope & Foundations' : 'Martian Regolith, Ancient Clays & Foundations',
      instrument: isMoon ? 'Optical Microscope & Lunar Soil Analyzer' : 'Optical Microscope & Martian Spectrometer',
      planetScope: isMoon ? 'Moon' : 'Mars',
      originTag: 'NASA_REAL_CONCEPT',
      originLabel: isMoon
        ? 'Lunar geology inspired by Apollo and Artemis studies · Simulation'
        : 'Martian geology inspired by Curiosity and Perseverance · Simulation',
      shortFact: isMoon
        ? 'Lunar grains have no wind or water erosion, so they are sharp. Compact mare basalt supports the base better than loose dust on crater rims.'
        : 'Red dunes shift easily and cannot hold buildings; firm basalt supports the base and ancient clays reveal Mars’s wet past.',
      missionId: 'mission-5',
    },
  ];
}

export function getBadgeCatalog(destination: PlanetaryDestination): BadgeEntry[] {
  const isMoon = destination === 'moon';
  return [
    {
      id: 'badge-eyes-earth',
      title: isMoon ? 'Lunar LRO Prep' : 'Martian MRO Prep',
      missionId: 'mission-1',
      detail: isMoon
        ? 'You calibrated the thermal shield, electric dust filter, and lunar solar panel.'
        : 'You calibrated thermal protection, fine dust filter, and orbital signal on Mars.',
    },
    {
      id: 'badge-mars-guardian',
      title: isMoon ? 'Lunar Shield Guardian' : 'Red Storm Commander',
      missionId: 'mission-2',
      detail: isMoon
        ? 'You protected the lunar base during the solar flare and extreme shadow cold.'
        : 'You protected and repaired the Martian base during the dust storm.',
    },
    {
      id: 'badge-space-architect',
      title: 'Space Architect',
      missionId: 'mission-3',
      detail: 'You explored the terrain with the rover and built a stable base on flat ground.',
    },
    {
      id: 'badge-rain-hunter',
      title: isMoon ? 'Polar Ice Hunter' : 'Martian Water Detective',
      missionId: 'mission-4',
      detail: isMoon
        ? 'You found ice in a dark polar crater, managed the battery, and purified the water.'
        : 'You used subsurface radar to extract buried ice on Mars and purify the water.',
    },
    {
      id: 'badge-soil-scientist',
      title: isMoon ? 'Lunar Regolith Engineer' : 'Mars Geologist',
      missionId: 'mission-5',
      detail: isMoon
        ? 'You analyzed lunar grains under the microscope and built the platform on firm basalt.'
        : 'You analyzed Martian soil under the microscope, identified ancient clays, and founded the base.',
    },
  ];
}
