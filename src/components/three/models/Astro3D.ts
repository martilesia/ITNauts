import * as THREE from 'three';
import { AstroMood } from '../../../types/game';
import { lerpAngle } from './Commander3D';

export interface Astro3DRig {
  root: THREE.Group;
  body: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  beaconMat: THREE.MeshStandardMaterial;
  eyeLeft: THREE.Mesh;
  eyeRight: THREE.Mesh;
  thrusterGlow: THREE.Mesh;
  currentYaw: number;
}

export function buildAstro3D(): Astro3DRig {
  const root = new THREE.Group();
  const body = new THREE.Group();
  body.position.y = 1.05;
  root.add(body);

  const hullMat = new THREE.MeshStandardMaterial({
    color: '#E2E8F0',
    roughness: 0.28,
    metalness: 0.32,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: '#64748B',
    roughness: 0.35,
    metalness: 0.78,
  });
  const visorMat = new THREE.MeshStandardMaterial({
    color: '#0B1324',
    roughness: 0.12,
    metalness: 0.4,
  });
  const beaconMat = new THREE.MeshStandardMaterial({
    color: '#22D3EE',
    emissive: '#06B6D4',
    emissiveIntensity: 1.2,
    roughness: 0.2,
  });

  // Main rounded cylindrical + domed droid chassis
  const torsoMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.22, 8, 18), hullMat);
  torsoMesh.scale.set(1.12, 0.95, 0.96);
  torsoMesh.castShadow = true;
  body.add(torsoMesh);

  // Dark Glass Visor Plate (+Z front)
  const visorPlate = new THREE.Mesh(
    new THREE.CylinderGeometry(0.31, 0.31, 0.24, 18, 1, false, -Math.PI * 0.35, Math.PI * 0.7),
    visorMat
  );
  visorPlate.position.set(0, 0.06, 0.04);
  body.add(visorPlate);

  // Expressive glowing eyes
  const eyeMat = new THREE.MeshStandardMaterial({
    color: '#22D3EE',
    emissive: '#22D3EE',
    emissiveIntensity: 1.6,
    roughness: 0.1,
  });
  const eyeLeft = new THREE.Mesh(new THREE.SphereGeometry(0.048, 10, 10), eyeMat);
  eyeLeft.position.set(-0.11, 0.07, 0.33);
  body.add(eyeLeft);

  const eyeRight = new THREE.Mesh(new THREE.SphereGeometry(0.048, 10, 10), eyeMat.clone());
  eyeRight.position.set(0.11, 0.07, 0.33);
  body.add(eyeRight);

  // Chest Telemetry Bar
  const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.07, 0.05), beaconMat);
  chestPlate.position.set(0, -0.11, 0.31);
  body.add(chestPlate);

  // Antenna Mast & Glowing Mood Orb
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.22, 8), trimMat);
  mast.position.set(0, 0.39, 0);
  body.add(mast);

  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 12), beaconMat);
  beacon.position.set(0, 0.51, 0);
  body.add(beacon);

  // Side Stabilizer Arms
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.37, 0.0, 0);
  const leftFin = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.16, 6, 10), trimMat);
  leftFin.position.y = -0.04;
  leftFin.castShadow = true;
  leftArm.add(leftFin);
  body.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.37, 0.0, 0);
  const rightFin = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.16, 6, 10), trimMat);
  rightFin.position.y = -0.04;
  rightFin.castShadow = true;
  rightArm.add(rightFin);
  body.add(rightArm);

  // Base Hover Thruster Skirt & Emissive Plasma Ring
  const hoverRing = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.18, 0.12, 16), trimMat);
  hoverRing.position.set(0, -0.34, 0);
  hoverRing.castShadow = true;
  body.add(hoverRing);

  const thrusterGlow = new THREE.Mesh(
    new THREE.ConeGeometry(0.16, 0.26, 14),
    new THREE.MeshBasicMaterial({
      color: '#22D3EE',
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    })
  );
  thrusterGlow.rotation.x = Math.PI;
  thrusterGlow.position.set(0, -0.5, 0);
  body.add(thrusterGlow);

  return {
    root,
    body,
    leftArm,
    rightArm,
    beaconMat,
    eyeLeft,
    eyeRight,
    thrusterGlow,
    currentYaw: 0,
  };
}

export function updateAstro3D(
  rig: Astro3DRig,
  dt: number,
  elapsed: number,
  opts: {
    vx: number;
    vz: number;
    lookTargetX?: number;
    lookTargetZ?: number;
    mood: AstroMood;
    pointingTo?: 'left' | 'right' | null;
    reducedMotion?: boolean;
  }
) {
  const { vx, vz, lookTargetX, lookTargetZ, mood, pointingTo, reducedMotion } = opts;

  const hoverAmp = reducedMotion ? 0.02 : 0.1;
  rig.body.position.y = 1.08 + Math.sin(elapsed * 2.8) * hoverAmp;

  // Pitch forward slightly while flying
  const speed = Math.hypot(vx, vz);
  rig.body.rotation.x = THREE.MathUtils.damp(rig.body.rotation.x, Math.min(0.28, speed * 0.03), 8, dt);

  if (speed > 0.15) {
    const yaw = Math.atan2(vx, vz);
    rig.currentYaw = lerpAngle(rig.currentYaw, yaw, dt * 8);
  } else if (lookTargetX !== undefined && lookTargetZ !== undefined) {
    const dx = lookTargetX - rig.root.position.x;
    const dz = lookTargetZ - rig.root.position.z;
    if (Math.hypot(dx, dz) > 0.2) {
      const yaw = Math.atan2(dx, dz);
      rig.currentYaw = lerpAngle(rig.currentYaw, yaw, dt * 6);
    }
  }
  rig.root.rotation.y = rig.currentYaw;

  // Mood colors
  const colorHex =
    mood === 'alert'
      ? '#F59E0B'
      : mood === 'happy'
        ? '#10B981'
        : mood === 'sleeping'
          ? '#64748B'
          : '#22D3EE';
  rig.beaconMat.color.set(colorHex);
  rig.beaconMat.emissive.set(colorHex);
  (rig.eyeLeft.material as THREE.MeshStandardMaterial).color.set(colorHex);
  (rig.eyeLeft.material as THREE.MeshStandardMaterial).emissive.set(colorHex);
  (rig.eyeRight.material as THREE.MeshStandardMaterial).color.set(colorHex);
  (rig.eyeRight.material as THREE.MeshStandardMaterial).emissive.set(colorHex);
  (rig.thrusterGlow.material as THREE.MeshBasicMaterial).color.set(colorHex);

  const targetLeftZ = pointingTo === 'left' ? 0.85 : 0.12;
  const targetRightZ = pointingTo === 'right' ? -0.85 : -0.12;
  rig.leftArm.rotation.z = THREE.MathUtils.damp(rig.leftArm.rotation.z, targetLeftZ, 10, dt);
  rig.rightArm.rotation.z = THREE.MathUtils.damp(rig.rightArm.rotation.z, targetRightZ, 10, dt);

  rig.thrusterGlow.scale.y = reducedMotion ? 0.9 : 0.85 + Math.sin(elapsed * 14) * 0.15;
}
