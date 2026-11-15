import * as THREE from 'three';
import { createSolarPanelTexture } from '../threeUtils';
import { lerpAngle } from './Commander3D';

export interface Rover3DRig {
  root: THREE.Group;
  chassisGroup: THREE.Group;
  wheels: THREE.Group[];
  steeringPivots: THREE.Group[];
  navCamHead: THREE.Group;
  radarDish: THREE.Mesh;
  cockpitAnchor: THREE.Group;
  currentYaw: number;
  wheelAngle: number;
}

/**
 * Realistic 6-Wheel Rocker-Bogie Planetary Rover (NASA Perseverance / Lunar Terrain Rover inspired)
 * Grounded bottom-center at y = 0 (tires sit flush on surface).
 */
export function buildRover3D(renderer: THREE.WebGLRenderer): Rover3DRig {
  const root = new THREE.Group();
  const chassisGroup = new THREE.Group();
  root.add(chassisGroup);

  const solarTex = createSolarPanelTexture(renderer);

  const whiteHullMat = new THREE.MeshPhysicalMaterial({
    color: '#F1F5F9',
    roughness: 0.32,
    metalness: 0.25,
    clearcoat: 0.45,
    clearcoatRoughness: 0.22,
  });
  const goldFoilMat = new THREE.MeshPhysicalMaterial({
    color: '#F59E0B',
    roughness: 0.18,
    metalness: 0.92,
    clearcoat: 0.75,
    clearcoatRoughness: 0.14,
  });
  const titaniumMat = new THREE.MeshStandardMaterial({
    color: '#94A3B8',
    roughness: 0.28,
    metalness: 0.85,
  });
  const darkFrameMat = new THREE.MeshStandardMaterial({
    color: '#1E293B',
    roughness: 0.55,
    metalness: 0.65,
  });
  const tireMat = new THREE.MeshStandardMaterial({
    color: '#171C26',
    roughness: 0.88,
    metalness: 0.12,
  });
  const solarMat = new THREE.MeshPhysicalMaterial({
    map: solarTex,
    roughness: 0.18,
    metalness: 0.42,
    clearcoat: 0.85,
    clearcoatRoughness: 0.1,
  });
  const headlightMat = new THREE.MeshStandardMaterial({
    color: '#FEF9C3',
    emissive: '#FDE047',
    emissiveIntensity: 1.7,
    roughness: 0.1,
  });
  const cyanLedMat = new THREE.MeshStandardMaterial({
    color: '#38BDF8',
    emissive: '#22D3EE',
    emissiveIntensity: 1.15,
    roughness: 0.15,
  });

  // 1. Sculpted Main Rover Chassis Hull (ExtrudeGeometry with beveled profile)
  const hullShape = new THREE.Shape();
  hullShape.moveTo(-0.85, -1.25);
  hullShape.lineTo(0.85, -1.25);
  hullShape.lineTo(0.95, 0.85);
  hullShape.lineTo(0.65, 1.32);
  hullShape.lineTo(-0.65, 1.32);
  hullShape.lineTo(-0.95, 0.85);
  hullShape.closePath();

  const hullGeo = new THREE.ExtrudeGeometry(hullShape, {
    depth: 0.42,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.06,
    bevelSegments: 2,
  });
  hullGeo.rotateX(Math.PI / 2);
  const mainHull = new THREE.Mesh(hullGeo, whiteHullMat);
  mainHull.position.set(0, 0.96, 0);
  mainHull.castShadow = true;
  mainHull.receiveShadow = true;
  chassisGroup.add(mainHull);

  // Gold MLI thermal insulation side panels
  [-1, 1].forEach((side) => {
    const foil = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.34, 1.8), goldFoilMat);
    foil.position.set(side * 0.94, 0.76, -0.05);
    foil.castShadow = true;
    chassisGroup.add(foil);
  });

  // 2. Open Driver Cockpit Deck (+Z front-middle) + Handlebars
  const seatBase = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.14, 0.68), darkFrameMat);
  seatBase.position.set(0, 1.05, 0.18);
  chassisGroup.add(seatBase);

  const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.36, 0.12), darkFrameMat);
  seatBack.position.set(0, 1.24, -0.14);
  seatBack.rotation.x = -0.15;
  chassisGroup.add(seatBack);

  const steeringPost = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.44, 10), titaniumMat);
  steeringPost.position.set(0, 1.18, 0.72);
  steeringPost.rotation.x = -0.3;
  chassisGroup.add(steeringPost);

  const handleBar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.52, 8), darkFrameMat);
  handleBar.rotation.z = Math.PI / 2;
  handleBar.position.set(0, 1.38, 0.65);
  chassisGroup.add(handleBar);

  // Cockpit Seat Anchor for Commander3D when driving
  const cockpitAnchor = new THREE.Group();
  cockpitAnchor.position.set(0, 0.74, 0.2);
  chassisGroup.add(cockpitAnchor);

  // 3. Rear Solar Deck & RTG Power Radiator
  const solarDeck = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.06, 0.95), solarMat);
  solarDeck.position.set(0, 1.05, -0.82);
  solarDeck.rotation.x = -0.12;
  solarDeck.castShadow = true;
  chassisGroup.add(solarDeck);

  // RTG finned cylinder on rear overhang
  const rtgCore = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.56, 12), darkFrameMat);
  rtgCore.rotation.x = 0.45;
  rtgCore.position.set(0, 0.94, -1.42);
  rtgCore.castShadow = true;
  chassisGroup.add(rtgCore);

  // 4. Front Stereo NavCam Mast + High-Gain Comms Dish
  const mastPole = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 0.9, 10), whiteHullMat);
  mastPole.position.set(-0.56, 1.36, 0.95);
  mastPole.castShadow = true;
  chassisGroup.add(mastPole);

  const navCamHead = new THREE.Group();
  navCamHead.position.set(-0.56, 1.85, 0.95);
  chassisGroup.add(navCamHead);

  const camBox = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.16, 0.22), whiteHullMat);
  camBox.castShadow = true;
  navCamHead.add(camBox);

  [-0.09, 0.09].forEach((ox) => {
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.06, 12), cyanLedMat);
    lens.rotation.x = Math.PI / 2;
    lens.position.set(ox, 0.01, 0.12);
    navCamHead.add(lens);
  });

  // High-Gain Parabolic Dish Antenna
  const dishPost = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.42, 8), titaniumMat);
  dishPost.position.set(0.54, 1.24, -0.62);
  chassisGroup.add(dishPost);

  const radarDish = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.42),
    whiteHullMat
  );
  radarDish.position.set(0.54, 1.48, -0.62);
  radarDish.rotation.x = Math.PI * 0.72;
  radarDish.castShadow = true;
  chassisGroup.add(radarDish);

  // 5. Dual Front LED Headlights, Volumetric Beam Cones & Bumper Guard
  const frontBumper = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.42, 10), titaniumMat);
  frontBumper.rotation.z = Math.PI / 2;
  frontBumper.position.set(0, 0.56, 1.38);
  chassisGroup.add(frontBumper);

  const beamMat = new THREE.MeshBasicMaterial({
    color: '#FEF08A',
    transparent: true,
    opacity: 0.11,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  [-0.45, 0.45].forEach((ox) => {
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.08, 12), headlightMat);
    lamp.rotation.x = Math.PI / 2;
    lamp.position.set(ox, 0.74, 1.33);
    chassisGroup.add(lamp);

    const beamCone = new THREE.Mesh(new THREE.ConeGeometry(0.72, 3.2, 12, 1, true), beamMat);
    beamCone.rotation.x = -Math.PI * 0.46;
    beamCone.position.set(ox, 0.56, 2.85);
    chassisGroup.add(beamCone);
  });

  // Real illumination SpotLight ahead of the Rover
  const headlightSpot = new THREE.SpotLight('#FFFBEB', 2.4, 14, Math.PI / 4.2, 0.55, 1.4);
  headlightSpot.position.set(0, 0.85, 1.35);
  const spotTarget = new THREE.Object3D();
  spotTarget.position.set(0, 0.0, 7.5);
  chassisGroup.add(spotTarget);
  headlightSpot.target = spotTarget;
  chassisGroup.add(headlightSpot);

  // 6. True 6-Wheel Rocker-Bogie Suspension & Cleated Wheels (Wheel radius = 0.34, rests flush at y = 0!)
  const wheels: THREE.Group[] = [];
  const steeringPivots: THREE.Group[] = [];
  const wheelRadius = 0.34;
  const wheelZPositions = [1.02, 0.0, -1.02];

  [-1, 1].forEach((side) => {
    // Rocker-Bogie Horizontal Frame Tube
    const rockerBar = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 2.08, 8), titaniumMat);
    rockerBar.rotation.x = Math.PI / 2;
    rockerBar.position.set(side * 1.1, 0.58, 0);
    chassisGroup.add(rockerBar);

    // Cross Axle Bridge connecting body to rocker bar
    const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.34, 8), titaniumMat);
    bridge.rotation.z = Math.PI / 2;
    bridge.position.set(side * 0.95, 0.65, 0.0);
    chassisGroup.add(bridge);

    wheelZPositions.forEach((wz, idx) => {
      // Strut down to wheel axle
      const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.28, 8), titaniumMat);
      strut.position.set(side * 1.15, 0.46, wz);
      chassisGroup.add(strut);

      const steerPivot = new THREE.Group();
      steerPivot.position.set(side * 1.24, wheelRadius, wz);
      root.add(steerPivot);
      if (idx !== 1) steeringPivots.push(steerPivot);

      const wheelGroup = new THREE.Group();
      steerPivot.add(wheelGroup);

      // Tire Drum
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.24, 18), tireMat);
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      tire.receiveShadow = true;
      wheelGroup.add(tire);

      // Titanium Hubcap
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.26, 12), titaniumMat);
      hub.rotation.z = Math.PI / 2;
      wheelGroup.add(hub);

      // Visible Radial Cleat Treads so spinning motion reads clearly!
      for (let t = 0; t < 8; t++) {
        const angle = (t / 8) * Math.PI * 2;
        const cleat = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.035, 0.045), darkFrameMat);
        cleat.position.set(0, Math.sin(angle) * (wheelRadius + 0.005), Math.cos(angle) * (wheelRadius + 0.005));
        cleat.rotation.x = -angle;
        wheelGroup.add(cleat);
      }

      wheels.push(wheelGroup);
    });
  });

  return {
    root,
    chassisGroup,
    wheels,
    steeringPivots,
    navCamHead,
    radarDish,
    cockpitAnchor,
    currentYaw: 0,
    wheelAngle: 0,
  };
}

export function updateRover3D(
  rig: Rover3DRig,
  dt: number,
  elapsed: number,
  opts: {
    vx: number;
    vz: number;
    isMoving: boolean;
    pitchTilt?: number;
    rollTilt?: number;
    suspensionOffset?: number;
    reducedMotion?: boolean;
  }
) {
  const { vx, vz, isMoving, pitchTilt = 0, rollTilt = 0, suspensionOffset = 0, reducedMotion } = opts;
  const speed = Math.hypot(vx, vz);

  if (speed > 0.05) {
    const targetYaw = Math.atan2(vx, vz);
    let yawDiff = ((targetYaw - rig.currentYaw + Math.PI) % (Math.PI * 2)) - Math.PI;
    if (yawDiff < -Math.PI) yawDiff += Math.PI * 2;

    rig.currentYaw = lerpAngle(rig.currentYaw, targetYaw, dt * 8.5);
    rig.root.rotation.y = rig.currentYaw;
    rig.wheelAngle += (speed * dt) / 0.34;
    rig.wheels.forEach((w) => {
      w.rotation.x = rig.wheelAngle;
    });

    // Subtle steering angle on cornering pivots (Ackermann feel)
    const steer = THREE.MathUtils.clamp(yawDiff * 0.45, -0.35, 0.35);
    rig.steeringPivots.forEach((p, idx) => {
      const sign = idx % 2 === 0 ? 1 : -1;
      p.rotation.y = THREE.MathUtils.damp(p.rotation.y, steer * sign, 10, dt);
    });
  } else {
    rig.steeringPivots.forEach((p) => {
      p.rotation.y = THREE.MathUtils.damp(p.rotation.y, 0, 10, dt);
    });
  }

  // Terrain 2-axis slope & gravity spring suspension response
  const vib = isMoving && !reducedMotion ? Math.sin(elapsed * 20) * 0.014 : 0;
  rig.chassisGroup.position.y = THREE.MathUtils.damp(rig.chassisGroup.position.y, suspensionOffset + vib, 12, dt);
  rig.chassisGroup.rotation.x = THREE.MathUtils.damp(rig.chassisGroup.rotation.x, pitchTilt, 8, dt);
  rig.chassisGroup.rotation.z = THREE.MathUtils.damp(rig.chassisGroup.rotation.z, rollTilt, 8, dt);

  // NavCam subtle scan
  if (!reducedMotion) {
    rig.navCamHead.rotation.y = Math.sin(elapsed * 1.1) * 0.25;
    rig.radarDish.rotation.z = elapsed * 0.4;
  }
}
