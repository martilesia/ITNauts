import { PlanetaryDestination } from '../../../data/planetaryData';
import { Vec2 } from '../../../types/game';

export type WaterZoneId =
  | 'sunlit_plain'
  | 'crater_rim'
  | 'polar_psr'
  | 'dry_dunes'
  | 'ancient_lake'
  | 'glacial_deposit';

export interface PlanetaryWaterZone {
  id: WaterZoneId;
  name: string;
  shortName: string;
  center: Vec2;
  radius: number;
  tempLabel: string;
  solarLabel: string;
  instrumentReading: string;
  secondaryReading: string;
  yieldLabel: string;
  rawWaterYield: number; // 0..100 raw yield per extraction
  batteryCost: number;
  isOptimalSource: boolean;
  astroDiscoveryText: string;
}

export function getWaterZones(destination: PlanetaryDestination): PlanetaryWaterZone[] {
  if (destination === 'moon') {
    return [
      {
        id: 'sunlit_plain',
        name: 'Sunlit Plain',
        shortName: 'Solar Plain',
        center: { x: 22, y: 58 },
        radius: 17,
        tempLabel: '+95 °C',
        solarLabel: '100% Sun',
        instrumentReading: 'Diviner: +95 °C · No surface ice',
        secondaryReading: 'Neutrons: Trace hydrogen (Sublimated)',
        yieldLabel: '0% Ice',
        rawWaterYield: 0,
        batteryCost: 6,
        isOptimalSource: false,
        astroDiscoveryText:
          'In strong sunlight and the lunar vacuum (+95 °C), any ice evaporates directly into space! You can charge solar power here, but there is no ice.',
      },
      {
        id: 'crater_rim',
        name: 'Crater Rim & Slope',
        shortName: 'Crater Rim',
        center: { x: 52, y: 48 },
        radius: 15,
        tempLabel: '-85 °C',
        solarLabel: '55% Sun (Ideal for Relay)',
        instrumentReading: 'Diviner: -85 °C · Partial shadow',
        secondaryReading: 'LOLA: Safe spot to recharge and send signal',
        yieldLabel: '15% Frost',
        rawWaterYield: 18,
        batteryCost: 8,
        isOptimalSource: false,
        astroDiscoveryText:
          'On the crater rim there is a little frost trapped in cracks, and it is the perfect place to recharge the solar battery before entering the polar darkness!',
      },
      {
        id: 'polar_psr',
        name: 'Permanently Shadowed Polar Crater (PSR)',
        shortName: 'Polar Crater (PSR)',
        center: { x: 80, y: 66 },
        radius: 17,
        tempLabel: '-225 °C',
        solarLabel: '0% Sun (Total Darkness)',
        instrumentReading: 'Diviner: -225 °C (PSR Cold Trap)',
        secondaryReading: 'LCROSS / Neutrons: Ice mixed in regolith!',
        yieldLabel: '80% Ice in Regolith',
        rawWaterYield: 85,
        batteryCost: 26,
        isOptimalSource: true,
        astroDiscoveryText:
          'Discovery! In Permanently Shadowed Polar Craters (-225 °C), sunlight never hits and ice stays trapped in the dark regolith. Watch out: it drains lots of battery and comes out dusty!',
      },
    ];
  }

  return [
    {
      id: 'dry_dunes',
      name: 'Dry Dust Dunes',
      shortName: 'Dry Dunes',
      center: { x: 22, y: 60 },
      radius: 16,
      tempLabel: '-35 °C',
      solarLabel: '75% Sun',
      instrumentReading: 'SHARAD Radar: No ice layers detected',
      secondaryReading: 'CRISM: Dry iron oxide, no hydrated minerals',
      yieldLabel: '0% Water',
      rawWaterYield: 0,
      batteryCost: 8,
      isOptimalSource: false,
      astroDiscoveryText:
        'The red dunes have loose iron-oxide dust and almost zero ice underneath. The SHARAD radar detected no useful reservoir here.',
    },
    {
      id: 'ancient_lake',
      name: 'Ancient Lakebed (Clays)',
      shortName: 'Ancient Lake',
      center: { x: 52, y: 49 },
      radius: 15,
      tempLabel: '-42 °C',
      solarLabel: '70% Sun',
      instrumentReading: 'CRISM: Hydrated clays (proof of ancient water!)',
      secondaryReading: 'SHARAD: Water locked in rock (hard to extract)',
      yieldLabel: '20% Locked in Rock',
      rawWaterYield: 22,
      batteryCost: 14,
      isOptimalSource: false,
      astroDiscoveryText:
        'The CRISM spectrometer found hydrated clays — proof that liquid water existed on Mars in the distant past! Today it is locked in minerals and yields very little.',
    },
    {
      id: 'glacial_deposit',
      name: 'Subsurface Glacial Deposit',
      shortName: 'Subsurface Ice',
      center: { x: 80, y: 65 },
      radius: 17,
      tempLabel: '-78 °C',
      solarLabel: '60% Sun',
      instrumentReading: 'SHARAD Radar: Thick ice layer under dust!',
      secondaryReading: 'Thermal Drilling: High raw ice yield',
      yieldLabel: '85% Subsurface Ice',
      rawWaterYield: 88,
      batteryCost: 20,
      isOptimalSource: true,
      astroDiscoveryText:
        'Great reading from the SHARAD radar! Beneath the protective dust layer lies a buried glacial deposit. Melting it gives raw water with salts that needs a purifier!',
    },
  ];
}

export function getWaterDatasetAttribution(destination: PlanetaryDestination) {
  if (destination === 'moon') {
    return {
      datasetName: 'LRO Diviner, LOLA & LCROSS (Simulation)',
      instrument: 'Diviner Radiometer · LOLA Altimeter · Neutron Detector',
      body: 'Moon',
      infoType: 'Polar cold trap (PSR) temperatures and ice in regolith',
      unit: '°C / % energy / % ice',
      originNote: 'Educational simulation inspired by real data from NASA LRO and LCROSS probes.',
    };
  }
  return {
    datasetName: 'MRO SHARAD & CRISM (Simulation)',
    instrument: 'SHARAD Subsurface Radar · CRISM Spectrometer',
    body: 'Mars',
    infoType: 'Buried glacial ice and hydrated minerals from ancient lakes',
    unit: '°C / % ice / minerals',
    originNote: 'Educational simulation inspired by the SHARAD and CRISM instruments on the Mars Reconnaissance Orbiter.',
  };
}
