import * as THREE from 'three';
import {
  EYE_COLORS,
  HAIR_COLORS,
  SKIN_TONES,
  SUIT_COLORS,
  VISOR_COLORS,
} from '../../../data/scientificData';
import { CommanderProfile, HairStyleId } from '../../../types/game';

export interface Commander3DRig {
  root: THREE.Group;
  hips: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  leftShoulder: THREE.Group;
  leftElbow: THREE.Group;
  rightShoulder: THREE.Group;
  rightElbow: THREE.Group;
  leftHip: THREE.Group;
  leftKnee: THREE.Group;
  rightHip: THREE.Group;
  rightKnee: THREE.Group;
  carriedOrb: THREE.Mesh;
  walkPhase: number;
  currentYaw: number;
}

function buildHair3D(style: HairStyleId, hairHex: string, highlightHex: string): THREE.Group {
  const hairGroup = new THREE.Group();
  const hairMat = new THREE.MeshStandardMaterial({
    color: hairHex,
    roughness: 0.88,
    metalness: 0.04,
  });
  const hiMat = new THREE.MeshStandardMaterial({
    color: highlightHex,
    roughness: 0.82,
    metalness: 0.05,
  });

  if (style === 'afro-crespo') {
    const puffs: [number, number, number, number][] = [
      [0, 0.14, -0.02, 0.28],
      [-0.17, 0.12, -0.02, 0.16],
      [0.17, 0.12, -0.02, 0.16],
      [-0.12, 0.22, 0.02, 0.15],
      [0.12, 0.22, 0.02, 0.15],
      [0, 0.25, 0.03, 0.16],
      [-0.19, 0.02, -0.06, 0.14],
      [0.19, 0.02, -0.06, 0.14],
      [0, 0.05, -0.18, 0.22],
    ];
    puffs.forEach(([x, y, z, r], i) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 12), i % 3 === 0 ? hiMat : hairMat);
      m.position.set(x, y, z);
      m.castShadow = true;
      hairGroup.add(m);
    });
  } else if (style === 'crespo-puffs') {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.245, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58), hairMat);
    cap.position.set(0, 0.05, -0.02);
    hairGroup.add(cap);

    const bandMat = new THREE.MeshStandardMaterial({ color: '#FACC15', roughness: 0.4, metalness: 0.2 });
    [-1, 1].forEach((side) => {
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.018, 8, 14), bandMat);
      band.position.set(side * 0.22, 0.19, -0.01);
      band.rotation.y = side * 0.6;
      hairGroup.add(band);

      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.145, 14, 12), hairMat);
      puff.position.set(side * 0.28, 0.24, -0.02);
      puff.castShadow = true;
      hairGroup.add(puff);

      const curl = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), hiMat);
      curl.position.set(side * 0.34, 0.28, 0.01);
      hairGroup.add(curl);
    });
  } else if (style === 'coily-fade') {
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.21, 0.13, 14), hairMat);
    crown.position.set(0, 0.22, -0.01);
    hairGroup.add(crown);
    const back = new THREE.Mesh(new THREE.SphereGeometry(0.23, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.52), hairMat);
    back.position.set(0, 0.08, -0.03);
    hairGroup.add(back);
  } else if (style === 'box-braids') {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.245, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58), hairMat);
    cap.position.set(0, 0.06, -0.02);
    hairGroup.add(cap);

    const beadMat = new THREE.MeshStandardMaterial({ color: '#FACC15', roughness: 0.3, metalness: 0.4 });
    const angles = [-2.6, -2.1, -1.6, -1.1, 1.1, 1.6, 2.1, 2.6, Math.PI];
    angles.forEach((ang, idx) => {
      const r = 0.235;
      const bx = Math.sin(ang) * r;
      const bz = Math.cos(ang) * r;
      const braid = new THREE.Mesh(new THREE.CapsuleGeometry(0.032, 0.26, 4, 8), idx % 2 === 0 ? hairMat : hiMat);
      braid.position.set(bx, -0.04, bz - 0.02);
      braid.castShadow = true;
      hairGroup.add(braid);
      const bead = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), beadMat);
      bead.position.set(bx, -0.19, bz - 0.02);
      hairGroup.add(bead);
    });
  } else if (style === 'curly-top') {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 1.4 - Math.PI * 0.7;
      const c = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), i % 2 === 0 ? hairMat : hiMat);
      c.position.set(Math.sin(a) * 0.19, 0.19 + Math.cos(i) * 0.03, Math.cos(a) * 0.14 - 0.04);
      hairGroup.add(c);
    }
    const back = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.58), hairMat);
    back.position.set(0, 0.06, -0.03);
    hairGroup.add(back);
  } else if (style === 'wavy-bob') {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.255, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.65), hairMat);
    cap.position.set(0, 0.06, -0.02);
    hairGroup.add(cap);
    [-1, 1].forEach((side) => {
      const wave = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.22, 6, 10), hairMat);
      wave.position.set(side * 0.21, -0.02, -0.04);
      wave.rotation.z = side * 0.12;
      hairGroup.add(wave);
    });
  } else if (style === 'pigtails') {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.245, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.56), hairMat);
    cap.position.set(0, 0.06, -0.02);
    hairGroup.add(cap);
    const ribbonMat = new THREE.MeshStandardMaterial({ color: '#EC4899', roughness: 0.4 });
    [-1, 1].forEach((side) => {
      const tie = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.015, 8, 12), ribbonMat);
      tie.position.set(side * 0.23, 0.07, -0.02);
      hairGroup.add(tie);
      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.26, 10), hairMat);
      tail.position.set(side * 0.28, -0.04, -0.04);
      tail.rotation.z = side * -0.35;
      hairGroup.add(tail);
    });
  } else {
    // short-swept
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.248, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.56), hairMat);
    cap.position.set(0, 0.06, -0.02);
    hairGroup.add(cap);
    const bang = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.09, 0.14), hiMat);
    bang.position.set(0.02, 0.2, 0.14);
    bang.rotation.z = -0.14;
    hairGroup.add(bang);
  }

  return hairGroup;
}

export function buildCommander3D(profile: CommanderProfile, isSoftwareGl: boolean): Commander3DRig {
  const suit = SUIT_COLORS[profile.suitColor] ?? SUIT_COLORS['cobalt-blue'];
  const visor = VISOR_COLORS[profile.visorColor] ?? VISOR_COLORS['arctic-cyan'];
  const skin = SKIN_TONES[profile.skinTone] ?? SKIN_TONES['caramel-brown'];
  const hair = HAIR_COLORS[profile.hairColor] ?? HAIR_COLORS['jet-black'];
  const eye = EYE_COLORS[profile.eyeColor] ?? EYE_COLORS.brown;

  const root = new THREE.Group();

  // Materials with calibrated roughness & metalness contrast
  const suitMat = new THREE.MeshStandardMaterial({
    color: suit.primary,
    roughness: 0.46,
    metalness: 0.12,
  });
  const suitSecMat = new THREE.MeshStandardMaterial({
    color: suit.secondary,
    roughness: 0.55,
    metalness: 0.18,
  });
  const whiteMat = new THREE.MeshStandardMaterial({
    color: '#F8FAFC',
    roughness: 0.38,
    metalness: 0.1,
  });
  const metalTrimMat = new THREE.MeshStandardMaterial({
    color: '#94A3B8',
    roughness: 0.28,
    metalness: 0.85,
  });
  const visorAccentMat = new THREE.MeshStandardMaterial({
    color: visor.rim,
    roughness: 0.3,
    metalness: 0.65,
    emissive: visor.fill,
    emissiveIntensity: 0.2,
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: skin.base,
    roughness: 0.68,
    metalness: 0.02,
  });
  const bibMat = new THREE.MeshPhysicalMaterial({
    color: '#F8FAFC',
    roughness: 0.28,
    metalness: 0.12,
    clearcoat: 0.55,
    clearcoatRoughness: 0.22,
  });
  const glassHelmetMat = isSoftwareGl
    ? new THREE.MeshPhysicalMaterial({
        color: visor.fill,
        roughness: 0.12,
        metalness: 0.05,
        transparent: true,
        opacity: 0.24,
        depthWrite: false,
      })
    : new THREE.MeshPhysicalMaterial({
        color: visor.highlight,
        roughness: 0.04,
        metalness: 0.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        transmission: 0.88,
        thickness: 0.28,
        ior: 1.52,
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
      });

  // Hips / Pelvis pivot (sits at y = 0.72 above soles so feet rest cleanly at y = 0)
  const hips = new THREE.Group();
  hips.position.y = 0.72;
  root.add(hips);

  const pelvisMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.22, 14), suitSecMat);
  pelvisMesh.castShadow = true;
  hips.add(pelvisMesh);

  // Belt + Star charm
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.255, 0.255, 0.08, 16), metalTrimMat);
  belt.position.y = 0.06;
  hips.add(belt);

  const starCharm = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.06, 0),
    new THREE.MeshStandardMaterial({ color: '#FACC15', roughness: 0.25, metalness: 0.6, emissive: '#F59E0B', emissiveIntensity: 0.25 })
  );
  starCharm.position.set(0.18, 0.03, 0.22);
  hips.add(starCharm);

  // Torso group attached to hips
  const torso = new THREE.Group();
  torso.position.y = 0.12;
  hips.add(torso);

  const chestMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.28, 8, 14), suitMat);
  chestMesh.scale.set(1.08, 1.0, 0.85);
  chestMesh.position.y = 0.26;
  chestMesh.castShadow = true;
  chestMesh.receiveShadow = true;
  torso.add(chestMesh);

  // White chest bib armor plate
  const bibPlate = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.22, 0.14), bibMat);
  bibPlate.position.set(0, 0.34, 0.15);
  bibPlate.castShadow = true;
  torso.add(bibPlate);

  // Emblem Badge on Chest (+Z front)
  const emblemColor =
    profile.emblem === 'star'
      ? '#FACC15'
      : profile.emblem === 'rocket'
        ? '#FB7185'
        : profile.emblem === 'leaf'
          ? '#34D399'
          : '#FB923C';
  const emblemBadge = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.07, 0.03, 14),
    new THREE.MeshStandardMaterial({ color: emblemColor, roughness: 0.32, metalness: 0.45, emissive: emblemColor, emissiveIntensity: 0.2 })
  );
  emblemBadge.rotation.x = Math.PI / 2;
  emblemBadge.position.set(0, 0.32, 0.225);
  torso.add(emblemBadge);

  // PLSS Life-Support Backpack (-Z back)
  const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.44, 0.24), suitSecMat);
  backpack.position.set(0, 0.28, -0.25);
  backpack.castShadow = true;
  torso.add(backpack);

  [-0.12, 0.12].forEach((ox) => {
    const tank = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.28, 6, 10), whiteMat);
    tank.position.set(ox, 0.28, -0.34);
    tank.castShadow = true;
    torso.add(tank);
  });

  // Neck Collar Ring
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.048, 10, 20), bibMat);
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0, 0.54, 0);
  torso.add(collar);

  const collarTrim = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.018, 8, 20), visorAccentMat);
  collarTrim.rotation.x = Math.PI / 2;
  collarTrim.position.set(0, 0.54, 0);
  torso.add(collarTrim);

  // Head Group
  const head = new THREE.Group();
  head.position.set(0, 0.78, 0);
  torso.add(head);

  // Face / Head sphere
  const headSphere = new THREE.Mesh(new THREE.SphereGeometry(0.225, 18, 16), skinMat);
  headSphere.scale.set(1.0, 0.96, 0.96);
  headSphere.castShadow = true;
  head.add(headSphere);

  // Ears
  [-1, 1].forEach((side) => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.048, 10, 8), skinMat);
    ear.position.set(side * 0.215, 0.0, 0.01);
    head.add(ear);
  });

  // Expressive Eyes (+Z forward)
  const scleraMat = new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.2 });
  const irisMat = new THREE.MeshStandardMaterial({ color: eye.iris, roughness: 0.25 });
  const pupilMat = new THREE.MeshStandardMaterial({ color: '#0F172A', roughness: 0.15 });
  const blushMat = new THREE.MeshStandardMaterial({ color: skin.blush, roughness: 0.7, transparent: true, opacity: 0.55 });

  [-1, 1].forEach((side) => {
    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.044, 12, 10), scleraMat);
    sclera.scale.set(0.9, 1.05, 0.55);
    sclera.position.set(side * 0.082, 0.025, 0.192);
    head.add(sclera);

    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 10), irisMat);
    iris.scale.set(1, 1, 0.5);
    iris.position.set(side * 0.078, 0.025, 0.212);
    head.add(iris);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), pupilMat);
    pupil.position.set(side * 0.078, 0.025, 0.223);
    head.add(pupil);

    const catchlight = new THREE.Mesh(new THREE.SphereGeometry(0.007, 6, 6), scleraMat);
    catchlight.position.set(side * 0.072 - 0.008, 0.036, 0.232);
    head.add(catchlight);

    const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.036, 8, 8), blushMat);
    cheek.scale.set(1.2, 0.65, 0.4);
    cheek.position.set(side * 0.13, -0.045, 0.185);
    head.add(cheek);
  });

  // Smile arc
  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.05, 0.01, 6, 12, Math.PI * 0.75),
    new THREE.MeshStandardMaterial({ color: skin.lip, roughness: 0.6 })
  );
  smile.position.set(0, -0.055, 0.205);
  smile.rotation.z = Math.PI * 1.12;
  head.add(smile);

  // 3D Customized Hair
  const hairMesh = buildHair3D(profile.hairStyle ?? 'afro-crespo', hair.fill, hair.highlight);
  head.add(hairMesh);

  // Transparent Bubble Helmet Dome + Visor Ear Pods
  const helmetBubble = new THREE.Mesh(new THREE.SphereGeometry(0.38, 22, 18), glassHelmetMat);
  helmetBubble.position.set(0, 0.04, 0.0);
  helmetBubble.renderOrder = 6;
  head.add(helmetBubble);

  [-1, 1].forEach((side) => {
    const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.06, 14), visorAccentMat);
    pod.rotation.z = Math.PI / 2;
    pod.position.set(side * 0.37, 0.03, 0);
    head.add(pod);
  });

  // Helper to build articulated arms
  function makeArm(side: -1 | 1) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.3, 0.44, 0);
    torso.add(shoulder);

    const pauldron = new THREE.Mesh(new THREE.SphereGeometry(0.095, 12, 10), bibMat);
    shoulder.add(pauldron);

    const upperArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.072, 0.18, 6, 10), suitMat);
    upperArm.position.y = -0.14;
    upperArm.castShadow = true;
    shoulder.add(upperArm);

    const elbow = new THREE.Group();
    elbow.position.y = -0.26;
    shoulder.add(elbow);

    const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.16, 6, 10), suitMat);
    forearm.position.y = -0.11;
    forearm.castShadow = true;
    elbow.add(forearm);

    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.072, 0.04, 12), bibMat);
    cuff.position.y = -0.18;
    elbow.add(cuff);

    const glove = new THREE.Mesh(new THREE.SphereGeometry(0.078, 12, 10), metalTrimMat);
    glove.position.y = -0.24;
    glove.castShadow = true;
    elbow.add(glove);

    return { shoulder, elbow };
  }

  const leftArm = makeArm(-1);
  const rightArm = makeArm(1);

  // Carried instrument/tool orb attached to right hand
  const carriedOrb = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 12, 12),
    new THREE.MeshStandardMaterial({
      color: '#FACC15',
      roughness: 0.25,
      metalness: 0.4,
      emissive: '#F59E0B',
      emissiveIntensity: 0.45,
    })
  );
  carriedOrb.position.set(0, -0.34, 0.09);
  carriedOrb.visible = false;
  rightArm.elbow.add(carriedOrb);

  // Helper to build articulated legs (from hip y=0.72 down to boot sole y=0)
  function makeLeg(side: -1 | 1) {
    const hip = new THREE.Group();
    hip.position.set(side * 0.14, -0.04, 0);
    hips.add(hip);

    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.088, 0.22, 6, 12), suitSecMat);
    thigh.position.y = -0.17;
    thigh.castShadow = true;
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.y = -0.32;
    hip.add(knee);

    const kneePad = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 10), bibMat);
    knee.add(kneePad);

    const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.082, 0.2, 6, 12), suitMat);
    shin.position.y = -0.16;
    shin.castShadow = true;
    knee.add(shin);

    // Space Boot (sole lands right at -0.36 from knee => 0.72 - 0.04 - 0.32 - 0.36 = 0.00)
    const bootUpper = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.11, 0.25), bibMat);
    bootUpper.position.set(0, -0.305, 0.045);
    bootUpper.castShadow = true;
    knee.add(bootUpper);

    const bootSole = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.045, 0.27), visorAccentMat);
    bootSole.position.set(0, -0.338, 0.045);
    knee.add(bootSole);

    return { hip, knee };
  }

  const leftLeg = makeLeg(-1);
  const rightLeg = makeLeg(1);

  return {
    root,
    hips,
    torso,
    head,
    leftShoulder: leftArm.shoulder,
    leftElbow: leftArm.elbow,
    rightShoulder: rightArm.shoulder,
    rightElbow: rightArm.elbow,
    leftHip: leftLeg.hip,
    leftKnee: leftLeg.knee,
    rightHip: rightLeg.hip,
    rightKnee: rightLeg.knee,
    carriedOrb,
    walkPhase: 0,
    currentYaw: 0,
  };
}

/** Smoothly wrap angular difference into [-PI, PI] */
export function lerpAngle(current: number, target: number, alpha: number): number {
  let diff = ((target - current + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return current + diff * Math.min(1, alpha);
}

/**
 * Drive realistic bipedal locomotion, low-gravity lunar/martian loping gait, airborne jump physics, and rover seating
 */
export function updateCommander3D(
  rig: Commander3DRig,
  dt: number,
  elapsed: number,
  opts: {
    vx: number;
    vz: number;
    isMoving: boolean;
    isCelebrating?: boolean;
    carryingColor?: string | null;
    seatedInRover?: boolean;
    reducedMotion?: boolean;
    altitude?: number;
    verticalVel?: number;
    strideFloat?: number;
    landingSquat?: number;
  }
) {
  const {
    vx,
    vz,
    isMoving,
    isCelebrating,
    carryingColor,
    seatedInRover,
    reducedMotion,
    altitude = 0,
    verticalVel = 0,
    strideFloat = 0,
    landingSquat = 0,
  } = opts;

  // Update carried orb visibility & color
  if (carryingColor) {
    rig.carriedOrb.visible = true;
    (rig.carriedOrb.material as THREE.MeshStandardMaterial).color.set(carryingColor);
    (rig.carriedOrb.material as THREE.MeshStandardMaterial).emissive.set(carryingColor);
  } else {
    rig.carriedOrb.visible = false;
  }

  // Smooth yaw rotation along movement direction
  if (Math.hypot(vx, vz) > 0.01) {
    const targetYaw = Math.atan2(vx, vz);
    rig.currentYaw = lerpAngle(rig.currentYaw, targetYaw, dt * 11);
    rig.root.rotation.y = rig.currentYaw;
  }

  if (seatedInRover) {
    // Seated driving pose inside rover cockpit
    rig.hips.position.y = THREE.MathUtils.damp(rig.hips.position.y, 0.56, 10, dt);
    rig.hips.rotation.z = 0;
    rig.torso.rotation.x = THREE.MathUtils.damp(rig.torso.rotation.x, 0.14, 10, dt);
    rig.torso.rotation.y = 0;
    rig.leftHip.rotation.x = THREE.MathUtils.damp(rig.leftHip.rotation.x, -1.15, 10, dt);
    rig.rightHip.rotation.x = THREE.MathUtils.damp(rig.rightHip.rotation.x, -1.15, 10, dt);
    rig.leftKnee.rotation.x = THREE.MathUtils.damp(rig.leftKnee.rotation.x, 1.15, 10, dt);
    rig.rightKnee.rotation.x = THREE.MathUtils.damp(rig.rightKnee.rotation.x, 1.15, 10, dt);
    rig.leftShoulder.rotation.x = THREE.MathUtils.damp(rig.leftShoulder.rotation.x, -0.85, 10, dt);
    rig.rightShoulder.rotation.x = THREE.MathUtils.damp(rig.rightShoulder.rotation.x, -0.85, 10, dt);
    rig.leftShoulder.rotation.z = 0.12;
    rig.rightShoulder.rotation.z = -0.12;
    rig.leftElbow.rotation.x = -0.45;
    rig.rightElbow.rotation.x = -0.45;
    return;
  }

  // Airborne low-gravity jump / leap pose
  if (altitude > 0.08) {
    const tuck = THREE.MathUtils.clamp(altitude * 0.4, 0.15, 0.65);
    rig.hips.position.y = THREE.MathUtils.damp(rig.hips.position.y, 0.72, 12, dt);
    rig.hips.rotation.z = THREE.MathUtils.damp(rig.hips.rotation.z, 0, 8, dt);
    rig.torso.rotation.x = THREE.MathUtils.damp(rig.torso.rotation.x, verticalVel > 0 ? 0.16 : -0.06, 8, dt);
    rig.torso.rotation.y = THREE.MathUtils.damp(rig.torso.rotation.y, 0, 8, dt);

    rig.leftHip.rotation.x = THREE.MathUtils.damp(rig.leftHip.rotation.x, -0.42 * tuck - 0.18, 10, dt);
    rig.rightHip.rotation.x = THREE.MathUtils.damp(rig.rightHip.rotation.x, 0.25 * tuck, 10, dt);
    rig.leftKnee.rotation.x = THREE.MathUtils.damp(rig.leftKnee.rotation.x, 0.75 * tuck + 0.2, 10, dt);
    rig.rightKnee.rotation.x = THREE.MathUtils.damp(rig.rightKnee.rotation.x, 0.35 * tuck + 0.1, 10, dt);

    // Arms spread gently upward to balance in low gravity
    rig.leftShoulder.rotation.z = THREE.MathUtils.damp(rig.leftShoulder.rotation.z, 0.58, 9, dt);
    rig.rightShoulder.rotation.z = THREE.MathUtils.damp(rig.rightShoulder.rotation.z, -0.58, 9, dt);
    rig.leftShoulder.rotation.x = THREE.MathUtils.damp(rig.leftShoulder.rotation.x, -0.35, 9, dt);
    rig.rightShoulder.rotation.x = THREE.MathUtils.damp(rig.rightShoulder.rotation.x, carryingColor ? -0.95 : -0.35, 9, dt);
    rig.leftElbow.rotation.x = THREE.MathUtils.damp(rig.leftElbow.rotation.x, -0.45, 9, dt);
    rig.rightElbow.rotation.x = THREE.MathUtils.damp(rig.rightElbow.rotation.x, -0.45, 9, dt);
    return;
  }

  if (isCelebrating) {
    const hop = reducedMotion ? 0 : Math.abs(Math.sin(elapsed * 6.5)) * 0.18;
    rig.hips.position.y = THREE.MathUtils.damp(rig.hips.position.y, 0.72 + hop, 12, dt);
    rig.torso.rotation.x = 0;
    rig.leftShoulder.rotation.z = THREE.MathUtils.damp(rig.leftShoulder.rotation.z, 2.55, 10, dt);
    rig.rightShoulder.rotation.z = THREE.MathUtils.damp(rig.rightShoulder.rotation.z, -2.55, 10, dt);
    rig.leftShoulder.rotation.x = Math.sin(elapsed * 8) * 0.25;
    rig.rightShoulder.rotation.x = -Math.sin(elapsed * 8) * 0.25;
    rig.leftHip.rotation.x = THREE.MathUtils.damp(rig.leftHip.rotation.x, 0, 10, dt);
    rig.rightHip.rotation.x = THREE.MathUtils.damp(rig.rightHip.rotation.x, 0, 10, dt);
    rig.leftKnee.rotation.x = THREE.MathUtils.damp(rig.leftKnee.rotation.x, 0, 10, dt);
    rig.rightKnee.rotation.x = THREE.MathUtils.damp(rig.rightKnee.rotation.x, 0, 10, dt);
    return;
  }

  const squatDip = landingSquat * 0.14;

  if (isMoving) {
    // Low-gravity astronauts lope with slower, floatier cadence and higher ballistic stride lift
    const cadenceFactor = 1 - strideFloat * 1.4;
    const speedMag = Math.min(2.2, Math.max(0.85, Math.hypot(vx, vz) * 0.12));
    rig.walkPhase += dt * (reducedMotion ? 5.2 : 9.2 * cadenceFactor) * speedMag;
    const p = rig.walkPhase;

    const swing = Math.sin(p) * (0.72 + strideFloat * 0.45);
    const leftKneeBend = Math.max(0, -Math.cos(p)) * (0.78 + strideFloat * 0.5);
    const rightKneeBend = Math.max(0, Math.cos(p)) * (0.78 + strideFloat * 0.5);

    rig.leftHip.rotation.x = swing - landingSquat * 0.25;
    rig.rightHip.rotation.x = -swing - landingSquat * 0.25;
    rig.leftKnee.rotation.x = leftKneeBend + landingSquat * 0.5;
    rig.rightKnee.rotation.x = rightKneeBend + landingSquat * 0.5;

    // Opposing arm swing
    rig.leftShoulder.rotation.x = -swing * 0.8;
    rig.rightShoulder.rotation.x = carryingColor ? -0.95 : swing * 0.8;
    rig.leftShoulder.rotation.z = 0.16 + strideFloat * 0.35;
    rig.rightShoulder.rotation.z = -0.16 - strideFloat * 0.35;
    rig.leftElbow.rotation.x = -0.35 - Math.max(0, Math.sin(p)) * 0.35;
    rig.rightElbow.rotation.x = carryingColor ? -0.65 : -0.35 - Math.max(0, -Math.sin(p)) * 0.35;

    // Ballistic low-gravity lope lift (zero on Earth 1g, buoyant arc on Moon 0.17g / Mars 0.38g)
    const strideBob = reducedMotion ? 0.02 : Math.abs(Math.sin(p)) * (0.075 + strideFloat * 0.72);
    rig.hips.position.y = THREE.MathUtils.damp(rig.hips.position.y, 0.70 + strideBob - squatDip, 14, dt);
    rig.hips.rotation.z = Math.cos(p) * 0.045;
    rig.torso.rotation.x = THREE.MathUtils.damp(rig.torso.rotation.x, 0.11 + landingSquat * 0.14, 10, dt);
    rig.torso.rotation.y = Math.sin(p) * 0.11;
    rig.head.rotation.y = -Math.sin(p) * 0.07;
  } else {
    // Relaxed natural idle breathing & cushioned landing squat recovery
    const breath = reducedMotion ? 0 : Math.sin(elapsed * 2.1) * 0.015;
    rig.hips.position.y = THREE.MathUtils.damp(rig.hips.position.y, 0.72 + breath - squatDip, 10, dt);
    rig.hips.rotation.z = THREE.MathUtils.damp(rig.hips.rotation.z, 0, 8, dt);
    rig.torso.rotation.x = THREE.MathUtils.damp(rig.torso.rotation.x, 0.02 + breath * 0.6 + landingSquat * 0.18, 10, dt);
    rig.torso.rotation.y = THREE.MathUtils.damp(rig.torso.rotation.y, 0, 8, dt);
    rig.head.rotation.y = reducedMotion ? 0 : Math.sin(elapsed * 0.85) * 0.12;

    rig.leftHip.rotation.x = THREE.MathUtils.damp(rig.leftHip.rotation.x, -landingSquat * 0.42, 10, dt);
    rig.rightHip.rotation.x = THREE.MathUtils.damp(rig.rightHip.rotation.x, -landingSquat * 0.42, 10, dt);
    rig.leftKnee.rotation.x = THREE.MathUtils.damp(rig.leftKnee.rotation.x, landingSquat * 0.78, 10, dt);
    rig.rightKnee.rotation.x = THREE.MathUtils.damp(rig.rightKnee.rotation.x, landingSquat * 0.78, 10, dt);

    rig.leftShoulder.rotation.x = THREE.MathUtils.damp(rig.leftShoulder.rotation.x, 0.04, 8, dt);
    rig.rightShoulder.rotation.x = THREE.MathUtils.damp(
      rig.rightShoulder.rotation.x,
      carryingColor ? -0.9 : 0.04,
      8,
      dt
    );
    rig.leftShoulder.rotation.z = THREE.MathUtils.damp(rig.leftShoulder.rotation.z, 0.16 + landingSquat * 0.25, 8, dt);
    rig.rightShoulder.rotation.z = THREE.MathUtils.damp(rig.rightShoulder.rotation.z, -0.16 - landingSquat * 0.25, 8, dt);
    rig.leftElbow.rotation.x = THREE.MathUtils.damp(rig.leftElbow.rotation.x, -0.15, 8, dt);
    rig.rightElbow.rotation.x = THREE.MathUtils.damp(rig.rightElbow.rotation.x, carryingColor ? -0.55 : -0.15, 8, dt);
  }
}

