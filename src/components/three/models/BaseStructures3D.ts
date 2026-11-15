import * as THREE from 'three';
import { createMetalDeckTexture, createSolarPanelTexture } from '../threeUtils';

export interface WorldPropDef {
  id: string;
  kind:
    | 'console'
    | 'globe'
    | 'modis'
    | 'merra2'
    | 'srtm'
    | 'gpm'
    | 'smap'
    | 'breakers'
    | 'toolbox'
    | 'purifier'
    | 'solar'
    | 'greenhouse'
    | 'crystal'
    | 'habitat_mod'
    | 'solar_mod'
    | 'comms_mod'
    | 'garage_mod'
    | 'water_tank'
    | 'biodome_plot'
    | 'door_portal'
    | 'planet_pedestal';
  xPct: number;
  yPct: number;
  label?: string;
  sublabel?: string;
  active?: boolean;
  powered?: boolean;
  urgent?: boolean;
  near?: boolean;
  color?: string;
  dustPct?: number;
  tankLevel?: number;
  planetId?: 'mars' | 'moon';
  stationFlags?: string[];
  biodomeState?: {
    soilPrepared: boolean;
    sensorPlaced: boolean;
    reservoirPlaced: boolean;
    seedsPlanted: boolean;
    plantHealthy: boolean;
    plantStress?: 'dry' | 'healthy' | 'flooded';
  };
  tiltPitch?: number;
  tiltRoll?: number;
  waterQuality?: 'raw' | 'clean';
  stormDamaged?: boolean;
  collisionRadius?: number;
}

/** Shared materials cache per build invocation to keep draw calls low & disposal clean */
export function buildPropMesh3D(
  def: WorldPropDef,
  renderer: THREE.WebGLRenderer,
  destination: 'mars' | 'moon',
  isSoftwareGl: boolean
): { group: THREE.Group; update?: (elapsed: number, dt: number) => void } {
  const group = new THREE.Group();

  const frameDark = new THREE.MeshStandardMaterial({ color: '#1E293B', roughness: 0.48, metalness: 0.68 });
  const hullLight = new THREE.MeshStandardMaterial({ color: '#E2E8F0', roughness: 0.34, metalness: 0.28 });
  const titanium = new THREE.MeshStandardMaterial({ color: '#94A3B8', roughness: 0.3, metalness: 0.82 });
  const accentColor = def.color || (def.active ? '#10B981' : def.urgent ? '#F59E0B' : '#38BDF8');
  const glowMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    emissive: accentColor,
    emissiveIntensity: def.active || def.powered ? 1.15 : 0.35,
    roughness: 0.2,
  });

  const addFoundationPad = (radius = 1.25, height = 0.16) => {
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.92, radius, height, 8), frameDark);
    pad.position.y = height / 2;
    pad.receiveShadow = true;
    pad.castShadow = true;
    group.add(pad);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(radius * 1.04, radius * 1.18, 28),
      new THREE.MeshBasicMaterial({
        color: def.near ? '#FACC15' : def.active ? '#10B981' : def.urgent ? '#F59E0B' : '#38BDF8',
        side: THREE.DoubleSide,
        transparent: true,
        opacity: def.near ? 0.9 : 0.42,
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.03;
    group.add(ring);
  };

  if (def.kind === 'console') {
    addFoundationPad(1.2, 0.16);
    const pedestal = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.05, 0.72), frameDark);
    pedestal.position.y = 0.68;
    pedestal.castShadow = true;
    group.add(pedestal);

    const screen = new THREE.Mesh(
      new THREE.BoxGeometry(0.98, 0.56, 0.08),
      new THREE.MeshStandardMaterial({
        color: '#0F172A',
        emissive: def.active ? '#10B981' : '#F59E0B',
        emissiveIntensity: def.active ? 1.1 : 0.8,
      })
    );
    screen.position.set(0, 1.38, 0.08);
    screen.rotation.x = -0.35;
    group.add(screen);

    const leverBase = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.12, 10), titanium);
    leverBase.position.set(0.32, 1.24, 0.25);
    group.add(leverBase);
    return { group };
  }

  if (def.kind === 'globe') {
    addFoundationPad(2.4, 0.24);
    const tableRing = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 2.05, 0.55, 20), frameDark);
    tableRing.position.y = 0.45;
    tableRing.castShadow = true;
    group.add(tableRing);

    const emitterRim = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.07, 10, 28), glowMat);
    emitterRim.rotation.x = Math.PI / 2;
    emitterRim.position.y = 0.75;
    group.add(emitterRim);

    const sphereMat = new THREE.MeshStandardMaterial({
      color: destination === 'moon' ? '#CBD5E1' : '#EA580C',
      emissive: def.powered ? (destination === 'moon' ? '#38BDF8' : '#FB923C') : '#1E293B',
      emissiveIntensity: def.powered ? 0.35 : 0.08,
      roughness: 0.72,
      metalness: 0.1,
    });
    const globe = new THREE.Mesh(new THREE.SphereGeometry(1.18, 24, 20), sphereMat);
    globe.position.y = 2.25;
    globe.castShadow = true;
    group.add(globe);

    // Orbiting telemetry rings for calibrated stations
    const orbitGroup = new THREE.Group();
    orbitGroup.position.y = 2.25;
    const stationColors: Record<string, string> = {
      modis: '#FB923C',
      merra2: '#22D3EE',
      srtm: '#34D399',
      gpm: '#60A5FA',
      smap: '#2DD4BF',
    };
    (def.stationFlags ?? []).forEach((st, idx) => {
      const col = stationColors[st] || '#38BDF8';
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.52 + idx * 0.12, 0.032, 8, 32),
        new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 1.0 })
      );
      ring.rotation.x = 0.45 + idx * 0.32;
      ring.rotation.y = idx * 0.65;
      orbitGroup.add(ring);
    });
    group.add(orbitGroup);

    return {
      group,
      update: (elapsed) => {
        globe.rotation.y = elapsed * 0.35;
        orbitGroup.rotation.y = -elapsed * 0.45;
      },
    };
  }

  if (['modis', 'merra2', 'srtm', 'gpm', 'smap'].includes(def.kind)) {
    addFoundationPad(1.15, 0.15);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 1.35, 12), hullLight);
    mast.position.y = 0.82;
    mast.castShadow = true;
    group.add(mast);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.44, 0.56), frameDark);
    head.position.y = 1.68;
    head.castShadow = true;
    group.add(head);

    const dishOrLens = new THREE.Mesh(
      def.kind === 'srtm' || def.kind === 'modis'
        ? new THREE.SphereGeometry(0.36, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.45)
        : new THREE.CylinderGeometry(0.24, 0.24, 0.28, 12),
      titanium
    );
    dishOrLens.position.set(0, 2.04, 0.12);
    dishOrLens.rotation.x = Math.PI * 0.65;
    dishOrLens.castShadow = true;
    group.add(dishOrLens);

    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), glowMat);
    beacon.position.set(0, 2.28, 0);
    group.add(beacon);

    return {
      group,
      update: (elapsed) => {
        dishOrLens.rotation.z = Math.sin(elapsed * 1.4 + def.xPct) * 0.35;
      },
    };
  }

  if (def.kind === 'breakers') {
    addFoundationPad(1.15, 0.14);
    const cabinet = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.9, 0.65), frameDark);
    cabinet.position.y = 1.09;
    cabinet.castShadow = true;
    group.add(cabinet);

    const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(1.12, 1.5, 0.08), titanium);
    doorPanel.position.set(0, 1.12, 0.34);
    group.add(doorPanel);

    const statusBar = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.16, 0.1), glowMat);
    statusBar.position.set(0, 1.72, 0.38);
    group.add(statusBar);

    [-0.3, 0, 0.3].forEach((ox) => {
      const sw = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.26, 0.12), glowMat);
      sw.position.set(ox, 1.1, 0.39);
      group.add(sw);
    });
    return { group };
  }

  if (def.kind === 'toolbox') {
    addFoundationPad(1.05, 0.12);
    const chest = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 0.62, 0.72),
      new THREE.MeshStandardMaterial({ color: '#EA580C', roughness: 0.42, metalness: 0.35 })
    );
    chest.position.y = 0.43;
    chest.castShadow = true;
    group.add(chest);

    const lid = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.14, 0.74), frameDark);
    lid.position.set(0, 0.85, -0.22);
    lid.rotation.x = -0.65;
    lid.castShadow = true;
    group.add(lid);

    if (!def.active) {
      const wrench = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 0.08, 0.14),
        new THREE.MeshStandardMaterial({ color: '#FACC15', emissive: '#F59E0B', emissiveIntensity: 0.6, metalness: 0.7, roughness: 0.25 })
      );
      wrench.position.set(0, 0.84, 0.1);
      wrench.rotation.y = 0.4;
      group.add(wrench);
    }
    return { group };
  }

  if (def.kind === 'purifier') {
    addFoundationPad(1.25, 0.14);
    [-0.36, 0.36].forEach((ox) => {
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.5, 14), hullLight);
      tank.position.set(ox, 0.89, 0);
      tank.castShadow = true;
      group.add(tank);

      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.295, 0.295, 0.16, 14), glowMat);
      band.position.set(ox, 1.25, 0);
      group.add(band);
    });
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.26, 0.44), frameDark);
    bridge.position.y = 1.65;
    group.add(bridge);

    const valve = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.045, 8, 16), glowMat);
    valve.position.set(0, 1.05, 0.34);
    group.add(valve);
    return { group };
  }

  if (def.kind === 'solar' || def.kind === 'solar_mod') {
    addFoundationPad(1.4, 0.14);
    const solarTex = createSolarPanelTexture(renderer);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 1.15, 12), titanium);
    mast.position.y = 0.72;
    mast.castShadow = true;
    group.add(mast);

    const panelMat = new THREE.MeshStandardMaterial({
      map: solarTex,
      roughness: 0.25,
      metalness: 0.45,
    });
    const array = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 1.45), panelMat);
    array.position.y = 1.38;
    array.rotation.x = 0.42;
    array.castShadow = true;
    group.add(array);

    const dustPct = def.dustPct ?? 0;
    if (dustPct > 5) {
      const dustLayer = new THREE.Mesh(
        new THREE.BoxGeometry(2.38, 0.03, 1.43),
        new THREE.MeshStandardMaterial({
          color: destination === 'moon' ? '#64748B' : '#9A3412',
          transparent: true,
          opacity: Math.min(0.88, dustPct / 100),
          roughness: 0.95,
        })
      );
      dustLayer.position.y = 1.43;
      dustLayer.rotation.x = 0.42;
      group.add(dustLayer);
    }
    return { group };
  }

  if (def.kind === 'greenhouse') {
    addFoundationPad(1.9, 0.2);
    const ringWall = new THREE.Mesh(new THREE.CylinderGeometry(1.72, 1.8, 0.46, 16), frameDark);
    ringWall.position.y = 0.42;
    ringWall.castShadow = true;
    group.add(ringWall);

    // Interior greenery rows
    const plantMat = new THREE.MeshStandardMaterial({
      color: def.stormDamaged ? '#A16207' : '#10B981',
      roughness: 0.75,
    });
    [-0.55, 0, 0.55].forEach((ox) => {
      const bush = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), plantMat);
      bush.position.set(ox, 0.72, 0.1);
      group.add(bush);
    });

    // Geodesic glass dome OR armored storm shield (dust-coated if stormDamaged before shielding)
    const dustColor = destination === 'moon' ? '#64748B' : '#9A3412';
    const domeMat = def.active
      ? new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.35, metalness: 0.85, flatShading: true })
      : def.stormDamaged
        ? new THREE.MeshStandardMaterial({
            color: dustColor,
            roughness: 0.92,
            transparent: true,
            opacity: 0.72,
          })
        : isSoftwareGl
          ? new THREE.MeshPhysicalMaterial({ color: '#7DD3FC', transparent: true, opacity: 0.38, depthWrite: false, roughness: 0.15 })
          : new THREE.MeshPhysicalMaterial({ color: '#E0F2FE', transmission: 0.82, thickness: 0.2, roughness: 0.1, transparent: true, opacity: 0.42, depthWrite: false });

    const dome = new THREE.Mesh(new THREE.SphereGeometry(1.65, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.52), domeMat);
    dome.position.y = 0.62;
    dome.castShadow = !!def.active;
    dome.renderOrder = 4;
    group.add(dome);

    if (def.active) {
      const shieldRing = new THREE.Mesh(new THREE.TorusGeometry(1.74, 0.08, 8, 24), glowMat);
      shieldRing.rotation.x = Math.PI / 2;
      shieldRing.position.y = 0.66;
      group.add(shieldRing);
    }
    return { group };
  }

  if (def.kind === 'crystal') {
    const col = def.color || '#38BDF8';
    const crystalMat = new THREE.MeshStandardMaterial({
      color: col,
      emissive: col,
      emissiveIntensity: 0.75,
      roughness: 0.16,
      metalness: 0.3,
    });
    const baseRock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.65, 0), frameDark);
    baseRock.scale.set(1.2, 0.45, 1.1);
    baseRock.position.y = 0.22;
    baseRock.castShadow = true;
    group.add(baseRock);

    [
      [0, 0.75, 0, 0.22, 1.15, 0.08, 0.05],
      [-0.25, 0.58, 0.16, 0.15, 0.82, 0.35, -0.25],
      [0.24, 0.54, -0.14, 0.14, 0.75, -0.32, 0.28],
    ].forEach(([x, y, z, r, h, rx, rz]) => {
      const shard = new THREE.Mesh(new THREE.ConeGeometry(r, h, 6), crystalMat);
      shard.position.set(x, y, z);
      shard.rotation.set(rx, 0, rz);
      shard.castShadow = true;
      group.add(shard);
    });

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.85, 1.0, 24),
      new THREE.MeshBasicMaterial({ color: def.near ? '#FACC15' : col, side: THREE.DoubleSide, transparent: true, opacity: def.near ? 0.9 : 0.45 })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.04;
    group.add(ring);

    return {
      group,
      update: (elapsed) => {
        group.children[1].rotation.y = elapsed * 0.8;
      },
    };
  }

  if (def.kind === 'habitat_mod') {
    addFoundationPad(2.1, 0.2);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.85, 1.45, 10), hullLight);
    body.position.y = 0.92;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const roof = new THREE.Mesh(new THREE.SphereGeometry(1.7, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.45), titanium);
    roof.position.y = 1.62;
    roof.castShadow = true;
    group.add(roof);

    const airlock = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.2, 0.9), frameDark);
    airlock.position.set(0, 0.8, 1.55);
    airlock.castShadow = true;
    group.add(airlock);

    const doorGlow = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.88, 0.08), glowMat);
    doorGlow.position.set(0, 0.72, 2.0);
    group.add(doorGlow);

    [-1, 1].forEach((side) => {
      const win = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.14, 12), glowMat);
      win.rotation.z = Math.PI / 2;
      win.position.set(side * 1.72, 1.05, 0.35);
      group.add(win);
    });
    return { group };
  }

  if (def.kind === 'comms_mod') {
    addFoundationPad(1.35, 0.18);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.65, 1.1, 8), frameDark);
    base.position.y = 0.7;
    base.castShadow = true;
    group.add(base);

    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 1.6, 8), titanium);
    tower.position.y = 1.95;
    tower.castShadow = true;
    group.add(tower);

    const dish = new THREE.Mesh(
      new THREE.SphereGeometry(0.95, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.42),
      hullLight
    );
    dish.position.set(0, 2.7, 0.18);
    dish.rotation.x = Math.PI * 0.72;
    dish.castShadow = true;
    group.add(dish);

    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), glowMat);
    tip.position.set(0, 2.95, 0.62);
    group.add(tip);

    return {
      group,
      update: (elapsed) => {
        dish.rotation.z = Math.sin(elapsed * 0.8) * 0.35;
      },
    };
  }

  if (def.kind === 'garage_mod') {
    addFoundationPad(2.1, 0.18);
    const archMat = new THREE.MeshStandardMaterial({ color: '#CBD5E1', roughness: 0.38, metalness: 0.45 });
    for (let i = -1; i <= 1; i++) {
      const arch = new THREE.Mesh(
        new THREE.TorusGeometry(1.5, 0.14, 10, 18, Math.PI),
        i === 0 ? glowMat : archMat
      );
      arch.position.set(0, 0.2, i * 0.85);
      arch.castShadow = true;
      group.add(arch);
    }
    const roofSheet = new THREE.Mesh(
      new THREE.CylinderGeometry(1.52, 1.52, 2.1, 16, 1, true, -Math.PI / 2, Math.PI),
      frameDark
    );
    roofSheet.rotation.x = Math.PI / 2;
    roofSheet.rotation.z = Math.PI / 2;
    roofSheet.position.y = 0.2;
    roofSheet.castShadow = true;
    group.add(roofSheet);
    return { group };
  }

  if (def.kind === 'water_tank') {
    addFoundationPad(1.9, 0.2);
    const tankLevel = Math.max(0, Math.min(100, def.tankLevel ?? 0));
    const outerGlass = new THREE.Mesh(
      new THREE.CylinderGeometry(1.15, 1.15, 2.2, 20, 1, true),
      new THREE.MeshPhysicalMaterial({
        color: '#7DD3FC',
        roughness: 0.12,
        transparent: true,
        opacity: 0.32,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    outerGlass.position.y = 1.32;
    outerGlass.renderOrder = 4;
    group.add(outerGlass);

    const cap = new THREE.Mesh(new THREE.CylinderGeometry(1.22, 1.22, 0.18, 20), titanium);
    cap.position.y = 2.45;
    cap.castShadow = true;
    group.add(cap);

    if (tankLevel > 1) {
      const h = (tankLevel / 100) * 2.05;
      const isRaw = def.waterQuality === 'raw';
      const water = new THREE.Mesh(
        new THREE.CylinderGeometry(1.04, 1.04, h, 20),
        new THREE.MeshStandardMaterial({
          color: isRaw ? '#B45309' : '#38BDF8',
          emissive: isRaw ? '#78350F' : '#0284C7',
          emissiveIntensity: isRaw ? 0.25 : 0.45,
          roughness: isRaw ? 0.65 : 0.18,
          transparent: true,
          opacity: isRaw ? 0.9 : 0.85,
        })
      );
      water.position.y = 0.22 + h / 2;
      group.add(water);
    }
    return { group };
  }

  if (def.kind === 'biodome_plot') {
    const st = def.biodomeState ?? {
      soilPrepared: false,
      sensorPlaced: false,
      reservoirPlaced: false,
      seedsPlanted: false,
      plantHealthy: false,
    };
    const stress = st.plantStress ?? (st.plantHealthy ? 'healthy' : 'dry');
    addFoundationPad(2.0, 0.16);
    const bedColor =
      stress === 'dry'
        ? '#855E3A'
        : stress === 'flooded'
          ? '#271D1A'
          : st.soilPrepared
            ? '#5C3A21'
            : '#3E2723';
    const bed = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 0.42, 1.8),
      new THREE.MeshStandardMaterial({ color: bedColor, roughness: stress === 'flooded' ? 0.35 : 0.92 })
    );
    bed.position.y = 0.36;
    bed.castShadow = true;
    group.add(bed);

    if (stress === 'flooded') {
      const puddle = new THREE.Mesh(
        new THREE.BoxGeometry(2.42, 0.06, 1.62),
        new THREE.MeshStandardMaterial({
          color: '#0369A1',
          roughness: 0.12,
          transparent: true,
          opacity: 0.65,
        })
      );
      puddle.position.y = 0.59;
      group.add(puddle);
    }

    if (st.sensorPlaced) {
      const stake = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8), titanium);
      stake.position.set(-0.95, 0.78, 0.55);
      group.add(stake);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), glowMat);
      tip.position.set(-0.95, 1.2, 0.55);
      group.add(tip);
    }

    if (st.reservoirPlaced) {
      const res = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.28, 0.85, 14),
        new THREE.MeshStandardMaterial({ color: '#38BDF8', emissive: '#0284C7', emissiveIntensity: 0.35 })
      );
      res.position.set(1.05, 0.65, -0.45);
      res.castShadow = true;
      group.add(res);
    }

    if (st.seedsPlanted) {
      const sproutMat = new THREE.MeshStandardMaterial({
        color: stress === 'healthy' ? '#22C55E' : stress === 'flooded' ? '#4D7C0F' : '#CA8A04',
        roughness: 0.65,
      });
      const hScale = stress === 'healthy' ? 1.25 : stress === 'flooded' ? 0.72 : 0.48;
      [-0.65, 0, 0.65].forEach((ox, idx) => {
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.45 * hScale, 8), sproutMat);
        stem.position.set(ox, 0.57 + 0.22 * hScale, 0);
        if (stress !== 'healthy') stem.rotation.z = (idx - 1) * 0.25 + 0.18;
        group.add(stem);

        const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.24 * hScale, 10, 8), sproutMat);
        canopy.position.set(ox + (stress !== 'healthy' ? 0.05 : 0), 0.57 + 0.45 * hScale, 0);
        canopy.castShadow = true;
        group.add(canopy);
      });
    }

    // Protective transparent dome arch over garden plot
    const glass = new THREE.Mesh(
      new THREE.SphereGeometry(1.65, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.48),
      new THREE.MeshPhysicalMaterial({
        color: '#A7F3D0',
        transparent: true,
        opacity: 0.26,
        depthWrite: false,
        roughness: 0.1,
      })
    );
    glass.scale.set(1.05, 0.75, 0.82);
    glass.position.y = 0.48;
    glass.renderOrder = 4;
    group.add(glass);

    return { group };
  }

  if (def.kind === 'door_portal') {
    const portalFrame = new THREE.Mesh(new THREE.BoxGeometry(2.8, 3.3, 0.65), frameDark);
    portalFrame.position.y = 1.65;
    portalFrame.castShadow = true;
    group.add(portalFrame);

    const doorPanel = new THREE.Mesh(
      new THREE.BoxGeometry(2.15, 2.75, 0.22),
      new THREE.MeshStandardMaterial({
        color: def.active ? '#FACC15' : '#334155',
        emissive: def.active ? '#F59E0B' : '#0F172A',
        emissiveIntensity: def.active ? 0.55 : 0.1,
        metalness: 0.4,
        roughness: 0.35,
      })
    );
    doorPanel.position.set(0, 1.45, 0.24);
    group.add(doorPanel);

    const headerSign = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.32, 0.28), glowMat);
    headerSign.position.set(0, 3.05, 0.28);
    group.add(headerSign);

    addFoundationPad(1.8, 0.12);
    return { group };
  }

  if (def.kind === 'planet_pedestal') {
    const isMars = def.planetId !== 'moon';
    addFoundationPad(2.0, 0.2);
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.45, 1.15, 16), frameDark);
    pedestal.position.y = 0.72;
    pedestal.castShadow = true;
    group.add(pedestal);

    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(1.22, 0.06, 8, 28),
      new THREE.MeshStandardMaterial({
        color: isMars ? '#FB923C' : '#38BDF8',
        emissive: isMars ? '#EA580C' : '#0284C7',
        emissiveIntensity: def.active ? 1.5 : 0.85,
      })
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 1.32;
    group.add(rim);

    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.08, 24, 20),
      new THREE.MeshStandardMaterial({
        color: isMars ? '#EA580C' : '#CBD5E1',
        roughness: isMars ? 0.78 : 0.86,
        metalness: 0.05,
        emissive: isMars ? '#7C2D12' : '#475569',
        emissiveIntensity: 0.22,
      })
    );
    sphere.position.y = 2.65;
    sphere.castShadow = true;
    group.add(sphere);

    if (isMars) {
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.45, 12, 8),
        new THREE.MeshStandardMaterial({ color: '#FED7AA', roughness: 0.6 })
      );
      cap.scale.set(1.2, 0.4, 1.2);
      cap.position.y = 3.55;
      group.add(cap);
    }

    return {
      group,
      update: (elapsed) => {
        sphere.rotation.y = elapsed * 0.45;
      },
    };
  }

  return { group };
}

/**
 * Architectural 3D Pressurized Base Interior (Mission 2 left half, WelcomeRoom, DestinationRoom)
 */
export function buildIndoorStationRoom3D(
  renderer: THREE.WebGLRenderer,
  options: {
    width: number;
    depth: number;
    wallHeight: number;
    hasPanoramicWindow?: boolean;
    halfBaseOnly?: boolean; // Mission 2 left pressurized bay
    destination?: 'mars' | 'moon';
  }
): THREE.Group {
  const { width, depth, wallHeight, hasPanoramicWindow = true, halfBaseOnly = false, destination = 'mars' } = options;
  const group = new THREE.Group();

  const deckTex = createMetalDeckTexture(renderer);
  const deckMat = new THREE.MeshStandardMaterial({
    map: deckTex,
    roughness: 0.55,
    metalness: 0.35,
  });
  const wallMat = new THREE.MeshStandardMaterial({
    color: '#2A184A',
    roughness: 0.62,
    metalness: 0.25,
  });
  const ribMat = new THREE.MeshStandardMaterial({
    color: '#64748B',
    roughness: 0.32,
    metalness: 0.78,
  });
  const stripMat = new THREE.MeshStandardMaterial({
    color: '#38BDF8',
    emissive: '#38BDF8',
    emissiveIntensity: 0.9,
  });

  if (halfBaseOnly) {
    // Mission 2: Well-defined Pressurized Left Habitat Deck + Structural Frame + Airlock Wall at X = 0
    const bayWidth = 26;
    const bayDepth = 34;
    const bayCenterX = -14.2;

    const deck = new THREE.Mesh(new THREE.BoxGeometry(bayWidth, 0.45, bayDepth), deckMat);
    deck.position.set(bayCenterX, -0.18, 0);
    deck.receiveShadow = true;
    deck.castShadow = true;
    group.add(deck);

    // Back Structural Wall
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(bayWidth, 4.4, 0.65), wallMat);
    backWall.position.set(bayCenterX, 2.2, -bayDepth / 2);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    group.add(backWall);

    // Left Structural Wall
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.65, 4.4, bayDepth), wallMat);
    leftWall.position.set(bayCenterX - bayWidth / 2, 2.2, 0);
    leftWall.castShadow = true;
    group.add(leftWall);

    // Airlock Divider Wall at X = -1.2 with Open Central Doorway Passage (gap z in [-3.4, 3.4])
    const northWall = new THREE.Mesh(new THREE.BoxGeometry(0.75, 4.4, 13.5), wallMat);
    northWall.position.set(-1.2, 2.2, -10.2);
    northWall.castShadow = true;
    group.add(northWall);

    const southWall = new THREE.Mesh(new THREE.BoxGeometry(0.75, 4.4, 13.5), wallMat);
    southWall.position.set(-1.2, 2.2, 10.2);
    southWall.castShadow = true;
    group.add(southWall);

    // Glowing Airlock Archway Frame
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.85, 7.2), ribMat);
    lintel.position.set(-1.2, 3.85, 0);
    lintel.castShadow = true;
    group.add(lintel);

    const archGlow = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.16, 6.8), stripMat);
    archGlow.position.set(-1.2, 3.38, 0);
    group.add(archGlow);

    // Roof Structural Trusses spanning the habitat bay
    [-10, -3, 4, 11].forEach((rz) => {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(bayWidth, 0.28, 0.35), ribMat);
      rib.position.set(bayCenterX, 4.35, rz);
      group.add(rib);
    });

    // Illuminated Planetary Horizon Bar along back wall
    const backStrip = new THREE.Mesh(new THREE.BoxGeometry(bayWidth - 2, 0.14, 0.15), stripMat);
    backStrip.position.set(bayCenterX, 3.6, -bayDepth / 2 + 0.36);
    group.add(backStrip);

    // Exterior Secondary Radar Dish Tower on Rocks (Mission 2 top right)
    const radarBase = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 1.2, 8), ribMat);
    radarBase.position.set(22, 0.6, -12);
    radarBase.castShadow = true;
    group.add(radarBase);

    const radarDish = new THREE.Mesh(
      new THREE.SphereGeometry(1.1, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.45),
      new THREE.MeshStandardMaterial({ color: '#E2E8F0', roughness: 0.3 })
    );
    radarDish.position.set(22, 2.0, -12);
    radarDish.rotation.x = Math.PI * 0.68;
    radarDish.castShadow = true;
    group.add(radarDish);

    return group;
  }

  // Full Indoor Room (WelcomeRoom / DestinationRoom)
  const floor = new THREE.Mesh(new THREE.BoxGeometry(width, 0.4, depth), deckMat);
  floor.position.y = -0.2;
  floor.receiveShadow = true;
  group.add(floor);

  const backWall = new THREE.Mesh(new THREE.BoxGeometry(width, wallHeight, 0.7), wallMat);
  backWall.position.set(0, wallHeight / 2, -depth / 2);
  backWall.receiveShadow = true;
  group.add(backWall);

  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.7, wallHeight, depth), wallMat);
  leftWall.position.set(-width / 2, wallHeight / 2, 0);
  group.add(leftWall);

  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.7, wallHeight, depth), wallMat);
  rightWall.position.set(width / 2, wallHeight / 2, 0);
  group.add(rightWall);

  // Structural Wall Ribs
  for (let x = -width / 2 + 4; x <= width / 2 - 4; x += 6) {
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.55, wallHeight, 0.95), ribMat);
    col.position.set(x, wallHeight / 2, -depth / 2 + 0.25);
    col.castShadow = true;
    group.add(col);
  }

  // Glowing Ceiling Strip along back wall
  const lightBar = new THREE.Mesh(new THREE.BoxGeometry(width - 2, 0.18, 0.25), stripMat);
  lightBar.position.set(0, wallHeight - 0.4, -depth / 2 + 0.45);
  group.add(lightBar);

  if (hasPanoramicWindow) {
    const windowScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(width * 0.56, wallHeight * 0.58),
      new THREE.MeshBasicMaterial({ color: '#0B061A' })
    );
    windowScreen.position.set(-2, wallHeight * 0.54, -depth / 2 + 0.4);
    group.add(windowScreen);

    const frame = new THREE.Mesh(new THREE.BoxGeometry(width * 0.58, wallHeight * 0.62, 0.14), ribMat);
    frame.position.set(-2, wallHeight * 0.54, -depth / 2 + 0.34);
    group.add(frame);

    const planetSphere = new THREE.Mesh(
      new THREE.SphereGeometry(2.1, 20, 16),
      new THREE.MeshStandardMaterial({
        color: destination === 'moon' ? '#CBD5E1' : '#EA580C',
        emissive: destination === 'moon' ? '#38BDF8' : '#7C2D12',
        emissiveIntensity: 0.35,
      })
    );
    planetSphere.position.set(5, wallHeight * 0.54, -depth / 2 + 0.42);
    planetSphere.scale.set(1, 1, 0.25);
    group.add(planetSphere);
  }

  return group;
}

/**
 * Instanced planetary rocks scattered outside playable paths for rich 3D geology
 */
export function buildInstancedRocks3D(
  destination: 'mars' | 'moon',
  getHeightAt: (wx: number, wz: number) => number,
  excludeCenterRadius = 0,
  largeExpedition = false
): THREE.InstancedMesh {
  const geo = new THREE.IcosahedronGeometry(1, 1);
  // Multi-frequency organic basaltic rock displacement
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vy = pos.getY(i);
    const vz = pos.getZ(i);
    const noise =
      0.82 +
      0.24 * Math.sin(vx * 3.4 + vy * 2.1) * Math.cos(vz * 2.9) +
      0.1 * Math.cos(vx * 6.5 - vz * 5.2);
    pos.setXYZ(i, vx * noise, vy * 0.68 * noise, vz * noise);
  }
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    color: '#FFFFFF',
    roughness: destination === 'moon' ? 0.92 : 0.86,
    metalness: 0.06,
    flatShading: true,
  });

  const count = largeExpedition ? 340 : 165;
  const instanced = new THREE.InstancedMesh(geo, mat, count);
  instanced.castShadow = true;
  instanced.receiveShadow = true;

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  let placed = 0;
  let seed = destination === 'moon' ? 777 : 333;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  const maxAttempts = largeExpedition ? 850 : 380;
  for (let i = 0; i < maxAttempts && placed < count; i++) {
    let wx: number;
    let wz: number;
    if (largeExpedition) {
      wx = (rand() - 0.5) * 210;
      wz = (rand() - 0.5) * 140;
      // Keep West Landing Pad & East Ideal Flat Plateau clean of big obstacles
      if (wx < -52 && Math.abs(wz) < 16) continue;
      if (wx > 39 && wx < 76 && wz > -18 && wz < 25) continue;
      // Keep main horizontal rover corridor partially navigable while framing it with rocks
      if (Math.abs(wz) < 5 && Math.abs(wx) < 52 && rand() > 0.25) continue;
    } else {
      const angle = rand() * Math.PI * 2;
      const dist = 12 + rand() * 36;
      wx = Math.cos(angle) * dist * 1.25;
      wz = Math.sin(angle) * dist * 0.92;
      // Keep clear of central playable arena
      if (Math.abs(wx) < 23 && Math.abs(wz) < 14 && (excludeCenterRadius === 0 || Math.hypot(wx, wz) < excludeCenterRadius)) {
        continue;
      }
    }

    const gy = getHeightAt(wx, wz);
    const isPebble = placed > (largeExpedition ? 210 : 110);
    const s = isPebble ? 0.22 + rand() * 0.42 : 0.55 + rand() * (largeExpedition ? 2.15 : 1.75);
    dummy.position.set(wx, gy + s * 0.24, wz);
    dummy.rotation.set(rand() * 0.5, rand() * Math.PI * 2, rand() * 0.5);
    dummy.scale.set(s * (0.9 + rand() * 0.45), s * (0.62 + rand() * 0.42), s * (0.9 + rand() * 0.45));
    dummy.updateMatrix();
    instanced.setMatrixAt(placed, dummy.matrix);

    if (destination === 'moon') {
      const shade = 0.34 + rand() * 0.34;
      color.setRGB(shade, shade * 1.02, shade * 1.09);
    } else {
      color.setRGB(0.42 + rand() * 0.28, 0.16 + rand() * 0.13, 0.09 + rand() * 0.08);
    }
    instanced.setColorAt(placed, color);
    placed++;
  }

  instanced.count = placed;
  instanced.instanceMatrix.needsUpdate = true;
  if (instanced.instanceColor) instanced.instanceColor.needsUpdate = true;
  instanced.computeBoundingSphere();
  return instanced;
}
