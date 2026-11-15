/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { CampaignMap } from './components/missions/CampaignMap';
import { Mission1EarthLab } from './components/missions/Mission1EarthLab';
import { Mission2RedStorm } from './components/missions/Mission2RedStorm';
import { Mission3TerrainExplorer } from './components/missions/Mission3TerrainExplorer';
import { Mission4RainfallExplorer } from './components/missions/Mission4RainfallExplorer';
import { Mission5SoilExplorer } from './components/missions/Mission5SoilExplorer';
import { DestinationRoom } from './components/missions/DestinationRoom';
import { PrologueHangar } from './components/missions/PrologueHangar';
import { TitleScreen } from './components/missions/TitleScreen';
import { WelcomeRoom } from './components/missions/WelcomeRoom';

const GameRouter: React.FC = () => {
  const { route } = useGame();

  if (route === 'TITLE') {
    return <TitleScreen />;
  }
  if (route === 'WELCOME_ROOM') {
    return <WelcomeRoom />;
  }
  if (route === 'DESTINATION_ROOM') {
    return <DestinationRoom />;
  }
  if (route === 'PROLOGUE') {
    return <PrologueHangar />;
  }
  if (route === 'MISSION_1') {
    return <Mission1EarthLab />;
  }
  if (route === 'MISSION_2') {
    return <Mission2RedStorm />;
  }
  if (route === 'MISSION_3') {
    return <Mission3TerrainExplorer />;
  }
  if (route === 'MISSION_4') {
    return <Mission4RainfallExplorer />;
  }
  if (route === 'MISSION_5') {
    return <Mission5SoilExplorer />;
  }
  return <CampaignMap />;
};

export default function App() {
  return (
    <GameProvider>
      <GameRouter />
    </GameProvider>
  );
}
