import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Orbit, Sparkles } from 'lucide-react';
import { AstroMood, CommanderProfile, Vec2 } from '../../types/game';
import {
  TerrainMode,
  afterDraw,
  createContactShadowTexture,
  createPlanetarySurfaceTexture,
  createSkyDome,
  detectSoftwareWebGL,
  disposeObject3D,
  getPlanetaryGravity,
  getTerrainHeight,
  pctToWorld,
  setupStudioEnvironment,
  worldToPct,
} from './threeUtils';
import { Astro3DRig, buildAstro3D, updateAstro3D } from './models/Astro3D';
import { Commander3DRig, buildCommander3D, updateCommander3D } from './models/Commander3D';
import { Rover3DRig, buildRover3D, updateRover3D } from './models/Rover3D';
import {
  WorldPropDef,
  buildIndoorStationRoom3D,
  buildInstancedRocks3D,
  buildPropMesh3D,
} from './models/BaseStructures3D';

export interface ConduitLine3D {
  from: Vec2;
  to: Vec2;
  color: string;
  active?: boolean;
}

export interface SpaceViewport3DProps {
  mode: TerrainMode;
  destination: 'mars' | 'moon';
  commanderProfile: CommanderProfile;
  commanderPos: Vec2;
  commanderMoving: boolean;
  commanderCelebrating?: boolean;
  carryingColor?: string | null;
  astroPos: Vec2;
  astroMood: AstroMood;
  astroCaption?: string | null;
  astroPointingTo?: 'left' | 'right' | null;
  showCaptions?: boolean;
  props: WorldPropDef[];
  conduits?: ConduitLine3D[];
  trailPoints?: Vec2[];
  inRover?: boolean;
  roverPos?: Vec2;
  showRover?: boolean;
  stormIntensity?: number; // 0..1 for Mission 2 3D dust storm
  iceIntensity?: number; // 0..1 for Mission 4 3D ice crystals
  satelliteBeamX?: number | null; // 0..100 for Mission 5 orbital scan beam
  highlightFlatPlateau?: boolean; // Mission 3 build mode flat zone highlight
  scannerRevealed?: boolean; // Mission 3 LOLA/MOLA overlay
  reducedStimuli?: boolean;
  onGroundClick?: (xPct: number, yPct: number) => void;
  onPropClick?: (propId: string) => void;
  cameraMode?: 'follow' | 'overview';
}

// Pre-allocated zero-GC helpers
const _projVec = new THREE.Vector3();
const _rayMouse = new THREE.Vector2();
const _dummy = new THREE.Object3D();
const _tmpColor = new THREE.Color();
const _strataColor = new THREE.Color();
const _frostColor = new THREE.Color('#BAE6FD');

const DUST_POOL_SIZE = 72;

/** Lightweight procedural Earth texture for Moon Earthrise celestial sphere */
function createEarthriseTexture(): THREE.CanvasTexture {
  const w = 128;
  const h = 64;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#1D4ED8';
  ctx.fillRect(0, 0, w, h);

  // Continents
  ctx.fillStyle = '#15803D';
  const patches = [
    [28, 22, 16, 12],
    [46, 36, 10, 14],
    [74, 18, 22, 15],
    [94, 40, 12, 9],
  ];
  for (const [cx, cy, rx, ry] of patches) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Atmospheric cloud bands & polar cap
  ctx.fillStyle = 'rgba(248, 250, 252, 0.72)';
  ctx.fillRect(0, 0, w, 6);
  ctx.fillRect(0, h - 6, w, 6);
  for (let i = 0; i < 9; i++) {
    ctx.beginPath();
    ctx.ellipse((i * 17) % w, 14 + ((i * 11) % 36), 14, 3.2, 0.15, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Soft procedural multi-lobe dust cloud alpha texture for volumetric storm puffs & streaks */
function createDustCloudTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, size, size);

  const puffs = [
    [64, 64, 54, 0.55],
    [44, 56, 36, 0.42],
    [84, 68, 38, 0.42],
    [60, 44, 30, 0.32],
  ];
  for (const [cx, cy, r, a] of puffs) {
    const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
    grad.addColorStop(0, `rgba(255, 255, 255, ${a})`);
    grad.addColorStop(0.55, `rgba(255, 255, 255, ${a * 0.42})`);
    grad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export const SpaceViewport3D: React.FC<SpaceViewport3DProps> = ({
  mode,
  destination,
  commanderProfile,
  commanderPos,
  commanderMoving,
  commanderCelebrating = false,
  carryingColor = null,
  astroPos,
  astroMood,
  astroCaption = null,
  astroPointingTo = null,
  showCaptions = true,
  props,
  conduits = [],
  trailPoints = [],
  inRover = false,
  roverPos,
  showRover = false,
  stormIntensity = 0,
  iceIntensity = 0,
  satelliteBeamX = null,
  highlightFlatPlateau = false,
  scannerRevealed = false,
  reducedStimuli = false,
  onGroundClick,
  onPropClick,
  cameraMode = 'follow',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const labelsLayerRef = useRef<HTMLDivElement>(null);
  const astroBubbleRef = useRef<HTMLDivElement>(null);
  const commanderNameRef = useRef<HTMLDivElement>(null);

  const [webglLost, setWebglLost] = useState(false);
  const jumpQueuedRef = useRef(false);
  const gravityProfile = useMemo(() => getPlanetaryGravity(mode, destination), [mode, destination]);

  // Trigger a gravity-calibrated jump on [J] or [Espaço] when not near an interactable object
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')
      ) {
        return;
      }
      if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        jumpQueuedRef.current = true;
      } else if (e.key === ' ' && !stateRef.current.props.some((p) => p.near)) {
        e.preventDefault();
        jumpQueuedRef.current = true;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Latest reactive state stored in refs so WebGLRenderer NEVER remounts during gameplay
  const stateRef = useRef({
    commanderPos,
    commanderMoving,
    commanderCelebrating,
    carryingColor,
    astroPos,
    astroMood,
    astroPointingTo,
    inRover,
    roverPos,
    showRover,
    stormIntensity,
    iceIntensity,
    satelliteBeamX,
    reducedStimuli,
    cameraMode,
    props,
    onGroundClick,
    onPropClick,
  });

  stateRef.current = {
    commanderPos,
    commanderMoving,
    commanderCelebrating,
    carryingColor,
    astroPos,
    astroMood,
    astroPointingTo,
    inRover,
    roverPos,
    showRover,
    stormIntensity,
    iceIntensity,
    satelliteBeamX,
    reducedStimuli,
    cameraMode,
    props,
    onGroundClick,
    onPropClick,
  };

  // Dynamic scene handles for syncing props/conduits/tracks without tearing down WebGL
  const sceneHandlesRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    isSoftwareGl: boolean;
    propsGroup: THREE.Group;
    propUpdaters: Array<(elapsed: number, dt: number) => void>;
    propHitMeshes: Array<{ id: string; obj: THREE.Object3D }>;
    conduitsGroup: THREE.Group;
    tracksMesh: THREE.InstancedMesh | null;
    commanderRig: Commander3DRig | null;
    commanderRootWrap: THREE.Group;
    astroRig: Astro3DRig | null;
    roverRig: Rover3DRig | null;
    targetMarker: THREE.Mesh;
    targetMarkerTimer: number;
    plateauOverlay: THREE.Group;
    satBeamGroup: THREE.Group;
    zoomOffset: number;
  } | null>(null);

  // 1. Mount WebGLRenderer & core 3D world ONCE per mode/destination change
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglLost(true);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const initW = Math.max(container.clientWidth, 320);
    const initH = Math.max(container.clientHeight, 240);
    renderer.setSize(initW, initH);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setWebglLost(true);
    };
    const onContextRestored = () => setWebglLost(false);
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    // Scene, Atmospheric Sky Shader & Fog
    const scene = new THREE.Scene();
    const skyHex =
      mode === 'indoor'
        ? '#120822'
        : destination === 'moon'
          ? '#070B16'
          : '#3A1912';
    scene.background = new THREE.Color(skyHex);
    const fogDensity =
      mode === 'indoor'
        ? 0.0075
        : mode === 'mission3'
          ? destination === 'moon'
            ? 0.0036
            : 0.0052
          : destination === 'moon'
            ? 0.0072
            : 0.011;
    scene.fog = new THREE.FogExp2(skyHex, fogDensity);

    const skyDome = createSkyDome(destination, mode);
    scene.add(skyDome);

    // Distant Celestial Sphere (Earthrise in Moon sky / Phobos in Mars sky)
    let earthSphere: THREE.Mesh | null = null;
    if (mode !== 'indoor') {
      if (destination === 'moon') {
        const earthTex = createEarthriseTexture();
        earthSphere = new THREE.Mesh(
          new THREE.SphereGeometry(4.4, 24, 18),
          new THREE.MeshStandardMaterial({
            map: earthTex,
            roughness: 0.65,
            metalness: 0.05,
            emissive: '#1E3A8A',
            emissiveIntensity: 0.25,
          })
        );
        earthSphere.position.set(-34, 25, -58);
        scene.add(earthSphere);

        const earthHalo = new THREE.Mesh(
          new THREE.SphereGeometry(4.78, 24, 18),
          new THREE.MeshBasicMaterial({
            color: '#60A5FA',
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide,
            depthWrite: false,
          })
        );
        earthHalo.position.copy(earthSphere.position);
        scene.add(earthHalo);
      } else {
        const phobosGeo = new THREE.IcosahedronGeometry(1.5, 1);
        const pAttr = phobosGeo.attributes.position;
        for (let i = 0; i < pAttr.count; i++) {
          const px = pAttr.getX(i);
          const py = pAttr.getY(i);
          const pz = pAttr.getZ(i);
          const n = 1 + 0.18 * Math.sin(px * 3.1 + py * 2.7) * Math.cos(pz * 3.4);
          pAttr.setXYZ(i, px * 1.24 * n, py * 0.88 * n, pz * n);
        }
        phobosGeo.computeVertexNormals();
        const phobos = new THREE.Mesh(
          phobosGeo,
          new THREE.MeshStandardMaterial({
            color: '#9A8C82',
            roughness: 0.92,
            metalness: 0.06,
          })
        );
        phobos.position.set(32, 27, -56);
        scene.add(phobos);
      }
    }

    const envRT = setupStudioEnvironment(renderer, scene);

    // Perspective Camera (Close-up third-person framing showing Commander & ASTRO clearly)
    const camera = new THREE.PerspectiveCamera(50, initW / initH, 0.2, 380);
    const startW = pctToWorld(stateRef.current.commanderPos.x, stateRef.current.commanderPos.y, mode);
    const startAstW = pctToWorld(stateRef.current.astroPos.x, stateRef.current.astroPos.y, mode);
    const initDistAst = Math.hypot(startAstW.x - startW.x, startAstW.z - startW.z);
    const initAstWeight = initDistAst < 8.5 ? (mode === 'mission3' ? 0.28 : 0.36) : 0;
    const initFocusX = startW.x * (1 - initAstWeight) + startAstW.x * initAstWeight;
    const initFocusZ = startW.z * (1 - initAstWeight) + startAstW.z * initAstWeight;
    if (mode === 'mission3') {
      camera.position.set(initFocusX + 0.4, 5.0, initFocusZ + 8.4);
      camera.lookAt(initFocusX, 1.2, initFocusZ - 0.8);
    } else {
      camera.position.set(initFocusX + 0.25, 4.3, initFocusZ + 6.9);
      camera.lookAt(initFocusX, 1.18, initFocusZ - 0.5);
    }

    // Three-Point / Outdoor Warm-Cool Studio Lighting
    const hemiLight = new THREE.HemisphereLight(
      mode === 'indoor' ? '#A5B4FC' : destination === 'moon' ? '#94A3B8' : '#FDBA74',
      mode === 'indoor' ? '#1E1B4B' : destination === 'moon' ? '#1E293B' : '#431407',
      0.88
    );
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(
      mode === 'indoor' ? '#F8FAFC' : destination === 'moon' ? '#E2E8F0' : '#FFE4C4',
      1.72
    );
    keyLight.position.set(22, 34, 24);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = isSoftwareGl ? 1024 : 2048;
    keyLight.shadow.mapSize.height = isSoftwareGl ? 1024 : 2048;
    keyLight.shadow.radius = 2.5;
    keyLight.shadow.camera.near = 2;
    keyLight.shadow.camera.far = 95;
    keyLight.shadow.camera.left = -32;
    keyLight.shadow.camera.right = 32;
    keyLight.shadow.camera.top = 24;
    keyLight.shadow.camera.bottom = -24;
    keyLight.shadow.bias = -0.0004;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);
    scene.add(keyLight.target);

    const rimLight = new THREE.DirectionalLight(
      destination === 'moon' ? '#38BDF8' : '#FB923C',
      0.6
    );
    rimLight.position.set(-24, 14, -22);
    scene.add(rimLight);

    // Distant Starfield Dome (for planetary surface & panoramic station windows)
    const starCount = 520;
    const starPositions = new Float32Array(starCount * 3);
    let sSeed = 91;
    const srand = () => {
      sSeed = (sSeed * 1664525 + 1013904223) % 4294967296;
      return sSeed / 4294967296;
    };
    for (let i = 0; i < starCount; i++) {
      const theta = srand() * Math.PI * 2;
      const phi = srand() * Math.PI * 0.44;
      const r = 165 + srand() * 35;
      starPositions[i * 3] = Math.cos(theta) * Math.sin(phi) * r;
      starPositions[i * 3 + 1] = Math.cos(phi) * r + 10;
      starPositions[i * 3 + 2] = Math.sin(theta) * Math.sin(phi) * r;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: '#F8FAFC', size: 0.58, sizeAttenuation: true });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // Terrain / Room Ground Construction
    let groundClickTarget: THREE.Object3D;
    if (mode === 'indoor') {
      const room = buildIndoorStationRoom3D(renderer, {
        width: 58,
        depth: 38,
        wallHeight: 8.5,
        hasPanoramicWindow: true,
        destination,
      });
      scene.add(room);
      groundClickTarget = room;
    } else {
      // High-Detail Displaced Planetary 3D Terrain Surface + Geological Slope/Crater Vertex Colors
      const isExpedition = mode === 'mission3';
      const terrainW = isExpedition ? 280 : 130;
      const terrainD = isExpedition ? 200 : 100;
      const segW = isExpedition ? (isSoftwareGl ? 96 : 156) : (isSoftwareGl ? 84 : 132);
      const segD = isExpedition ? (isSoftwareGl ? 72 : 116) : (isSoftwareGl ? 64 : 100);
      const terrainGeo = new THREE.PlaneGeometry(terrainW, terrainD, segW, segD);
      terrainGeo.rotateX(-Math.PI / 2);

      const posAttr = terrainGeo.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        const vx = posAttr.getX(i);
        const vz = posAttr.getZ(i);
        posAttr.setY(i, getTerrainHeight(vx, vz, mode, destination));
      }
      terrainGeo.computeVertexNormals();

      const normAttr = terrainGeo.attributes.normal;
      const colors = new Float32Array(posAttr.count * 3);
      _strataColor.set(destination === 'moon' ? '#64748B' : '#7C2D12');

      for (let i = 0; i < posAttr.count; i++) {
        const vx = posAttr.getX(i);
        const vy = posAttr.getY(i);
        const ny = normAttr.getY(i);
        const steep = THREE.MathUtils.clamp((1 - ny) * 3.8, 0, 0.72);
        const depthShade = vy < -0.15 ? THREE.MathUtils.clamp(0.95 + vy * 0.18, 0.68, 0.96) : 1.0;
        const ridgeGlow = vy > 0.7 ? THREE.MathUtils.clamp(1.0 + (vy - 0.7) * 0.04, 1.0, 1.14) : 1.0;

        _tmpColor.setRGB(depthShade * ridgeGlow, depthShade * ridgeGlow, depthShade * ridgeGlow);
        _tmpColor.lerp(_strataColor, steep * 0.55);

        if (mode === 'mission4') {
          const frostMix = THREE.MathUtils.smoothstep(vx, 7, 25) * 0.42;
          if (frostMix > 0.01) {
            _tmpColor.lerp(_frostColor, frostMix);
          }
        }

        colors[i * 3] = _tmpColor.r;
        colors[i * 3 + 1] = _tmpColor.g;
        colors[i * 3 + 2] = _tmpColor.b;
      }
      terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const { map, normalMap, roughnessMap } = createPlanetarySurfaceTexture(destination, renderer, mode);
      if (isExpedition) {
        map.repeat.set(18, 14);
        normalMap.repeat.set(18, 14);
        roughnessMap.repeat.set(18, 14);
      }
      const terrainMat = new THREE.MeshStandardMaterial({
        map,
        normalMap,
        normalScale: new THREE.Vector2(1.25, 1.25),
        roughnessMap,
        roughness: 1.0,
        metalness: 0.04,
        vertexColors: true,
      });
      const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
      terrainMesh.receiveShadow = true;
      scene.add(terrainMesh);
      groundClickTarget = terrainMesh;

      // Scattered natural 3D planetary boulders & pebbles around edges & ridges
      const rocks = buildInstancedRocks3D(
        destination,
        (wx, wz) => getTerrainHeight(wx, wz, mode, destination),
        mode === 'mission1' ? 14 : 18,
        isExpedition
      );
      scene.add(rocks);

      // Mission 2: Add Left Pressurized Habitat Base on top of terrain
      if (mode === 'mission2') {
        const habBay = buildIndoorStationRoom3D(renderer, {
          width: 26,
          depth: 34,
          wallHeight: 4.4,
          halfBaseOnly: true,
          destination,
        });
        scene.add(habBay);
      }
    }

    // Mission 3 Ideal Construction Plateau Highlight & 3D Survey Corner Beacons
    const plateauOverlay = new THREE.Group();
    if (mode === 'mission3') {
      const eastPos = pctToWorld(84.5, 57, 'mission3');
      const eastY = getTerrainHeight(eastPos.x, eastPos.z, 'mission3', destination);
      const eastZone = new THREE.Mesh(
        new THREE.PlaneGeometry(27.5, 36),
        new THREE.MeshBasicMaterial({
          color: '#10B981',
          transparent: true,
          opacity: 0.14,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
      );
      eastZone.rotation.x = -Math.PI / 2;
      eastZone.position.set(eastPos.x, eastY + 0.16, eastPos.z);
      plateauOverlay.add(eastZone);

      const eastBorder = new THREE.Mesh(
        new THREE.RingGeometry(13.2, 13.8, 36),
        new THREE.MeshBasicMaterial({
          color: '#34D399',
          transparent: true,
          opacity: 0.5,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
      );
      eastBorder.rotation.x = -Math.PI / 2;
      eastBorder.position.set(eastPos.x, eastY + 0.18, eastPos.z);
      plateauOverlay.add(eastBorder);

      // 4 Physical 3D Corner Survey Beacons framing the Ideal Construction Zone
      const beaconMat = new THREE.MeshStandardMaterial({ color: '#1E293B', metalness: 0.7, roughness: 0.3 });
      const beaconOrbMat = new THREE.MeshStandardMaterial({
        color: '#34D399',
        emissive: '#10B981',
        emissiveIntensity: 1.4,
      });
      const corners: [number, number][] = [
        [77, 43],
        [92, 43],
        [77, 71],
        [92, 71],
      ];
      for (const [cx, cy] of corners) {
        const cw = pctToWorld(cx, cy, 'mission3');
        const czY = getTerrainHeight(cw.x, cw.z, 'mission3', destination);
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 1.8, 8), beaconMat);
        pole.position.set(cw.x, czY + 0.9, cw.z);
        pole.castShadow = true;
        plateauOverlay.add(pole);

        const orb = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 10), beaconOrbMat);
        orb.position.set(cw.x, czY + 1.9, cw.z);
        plateauOverlay.add(orb);
      }

      // West Landing Pad beacon ring
      const westPos = pctToWorld(9, 52, 'mission3');
      const westY = getTerrainHeight(westPos.x, westPos.z, 'mission3', destination);
      const westPadRing = new THREE.Mesh(
        new THREE.RingGeometry(2.6, 3.2, 28),
        new THREE.MeshBasicMaterial({
          color: '#38BDF8',
          transparent: true,
          opacity: 0.38,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
      );
      westPadRing.rotation.x = -Math.PI / 2;
      westPadRing.position.set(westPos.x, westY + 0.14, westPos.z);
      plateauOverlay.add(westPadRing);
    }
    scene.add(plateauOverlay);

    // Ground Click Destination Beacon Ring
    const targetMarker = new THREE.Mesh(
      new THREE.RingGeometry(0.45, 0.72, 24),
      new THREE.MeshBasicMaterial({ color: '#FACC15', side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
    );
    targetMarker.rotation.x = -Math.PI / 2;
    targetMarker.visible = false;
    scene.add(targetMarker);

    // Dynamic Containers for Props, Conduits, & Track Trails
    const propsGroup = new THREE.Group();
    scene.add(propsGroup);

    const conduitsGroup = new THREE.Group();
    scene.add(conduitsGroup);

    // Instanced Footprints / Rover Track Marks (max 80)
    const trackGeo = new THREE.PlaneGeometry(0.45, 0.28);
    trackGeo.rotateX(-Math.PI / 2);
    const trackMat = new THREE.MeshBasicMaterial({
      color: destination === 'moon' ? '#334155' : '#5B2210',
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    const tracksMesh = new THREE.InstancedMesh(trackGeo, trackMat, 80);
    tracksMesh.count = 0;
    tracksMesh.frustumCulled = false;
    scene.add(tracksMesh);

    // Contact Shadow Texture
    const contactShadowTex = createContactShadowTexture();
    const makeShadowDisc = (radius: number) => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(radius * 2, radius * 2),
        new THREE.MeshBasicMaterial({
          map: contactShadowTex,
          transparent: true,
          opacity: 0.6,
          depthWrite: false,
        })
      );
      m.rotation.x = -Math.PI / 2;
      m.position.y = 0.03;
      return m;
    };

    // Build Commander 3D Avatar + Shadow
    const commanderRootWrap = new THREE.Group();
    const commanderRig = buildCommander3D(commanderProfile, isSoftwareGl);
    commanderRootWrap.add(commanderRig.root);
    const cmdShadow = makeShadowDisc(0.55);
    commanderRootWrap.add(cmdShadow);
    const initCmdW = pctToWorld(stateRef.current.commanderPos.x, stateRef.current.commanderPos.y, mode);
    commanderRootWrap.position.set(
      initCmdW.x,
      getTerrainHeight(initCmdW.x, initCmdW.z, mode, destination),
      initCmdW.z
    );
    scene.add(commanderRootWrap);

    // Build ASTRO 3D Companion + Shadow
    const astroRig = buildAstro3D();
    astroRig.root.add(makeShadowDisc(0.42));
    const initAstW = pctToWorld(stateRef.current.astroPos.x, stateRef.current.astroPos.y, mode);
    astroRig.root.position.set(
      initAstW.x,
      getTerrainHeight(initAstW.x, initAstW.z, mode, destination),
      initAstW.z
    );
    scene.add(astroRig.root);

    // Build 6-Wheel Rover 3D (visible in Mission 3)
    const roverRig = buildRover3D(renderer);
    const roverShadow = makeShadowDisc(1.75);
    roverRig.root.add(roverShadow);
    roverRig.root.visible = !!stateRef.current.showRover;
    scene.add(roverRig.root);

    // Ballistic 3D Regolith Dust Plume Pool (footsteps, jump landings, and rover tire kicks under real gravity)
    const gravity = getPlanetaryGravity(mode, destination);
    const dustGeo = new THREE.IcosahedronGeometry(0.15, 0);
    const dustMat = new THREE.MeshStandardMaterial({
      color: destination === 'moon' ? '#94A3B8' : '#EA580C',
      roughness: 0.95,
      metalness: 0.0,
    });
    const dustMesh = new THREE.InstancedMesh(dustGeo, dustMat, DUST_POOL_SIZE);
    dustMesh.frustumCulled = false;
    dustMesh.visible = gravity.hasRegolithDust;
    scene.add(dustMesh);

    const dustPx = new Float32Array(DUST_POOL_SIZE);
    const dustPy = new Float32Array(DUST_POOL_SIZE);
    const dustPz = new Float32Array(DUST_POOL_SIZE);
    const dustVx = new Float32Array(DUST_POOL_SIZE);
    const dustVy = new Float32Array(DUST_POOL_SIZE);
    const dustVz = new Float32Array(DUST_POOL_SIZE);
    const dustLife = new Float32Array(DUST_POOL_SIZE);
    const dustMaxLife = new Float32Array(DUST_POOL_SIZE);
    const dustScale = new Float32Array(DUST_POOL_SIZE);
    let dustCursor = 0;

    // Initialize all dust matrices collapsed
    for (let i = 0; i < DUST_POOL_SIZE; i++) {
      _dummy.position.set(0, -100, 0);
      _dummy.scale.setScalar(0);
      _dummy.updateMatrix();
      dustMesh.setMatrixAt(i, _dummy.matrix);
    }
    dustMesh.instanceMatrix.needsUpdate = true;

    const spawnDustBurst = (
      wx: number,
      wy: number,
      wz: number,
      count: number,
      power: number,
      dirX = 0,
      dirZ = 0
    ) => {
      if (!gravity.hasRegolithDust) return;
      for (let i = 0; i < count; i++) {
        const idx = dustCursor;
        dustCursor = (dustCursor + 1) % DUST_POOL_SIZE;
        const ang = (i / Math.max(1, count)) * Math.PI * 2 + srand() * 0.6;
        const spd = (0.45 + srand() * 0.9) * power;
        dustPx[idx] = wx + (srand() - 0.5) * 0.35;
        dustPy[idx] = wy + 0.08;
        dustPz[idx] = wz + (srand() - 0.5) * 0.35;
        dustVx[idx] = Math.cos(ang) * spd + dirX * 0.35;
        dustVy[idx] = (0.9 + srand() * 1.1) * power;
        dustVz[idx] = Math.sin(ang) * spd + dirZ * 0.35;
        const ml = 0.55 + srand() * 0.45;
        dustMaxLife[idx] = ml;
        dustLife[idx] = ml;
        dustScale[idx] = 0.6 + srand() * 0.7;
      }
    };

    // Optional 3D Atmospheric Particles & Volumetric Dust Storm (M2 Dust Storm / M4 Ice Crystals)
    const particleCount = mode === 'mission2' ? 380 : mode === 'mission4' ? 180 : 0;
    let particlePoints: THREE.Points | null = null;
    let particleVelocities: Float32Array | null = null;
    let stormCloudMesh: THREE.InstancedMesh | null = null;
    let stormCloudMat: THREE.MeshBasicMaterial | null = null;
    const STORM_CLOUD_COUNT = 72;
    let stormCloudX: Float32Array | null = null;
    let stormCloudY: Float32Array | null = null;
    let stormCloudZ: Float32Array | null = null;
    let stormCloudSpd: Float32Array | null = null;
    let stormCloudScale: Float32Array | null = null;

    if (particleCount > 0) {
      const stormCloudTex = mode === 'mission2' ? createDustCloudTexture() : null;
      const pPos = new Float32Array(particleCount * 3);
      particleVelocities = new Float32Array(particleCount);
      for (let i = 0; i < particleCount; i++) {
        pPos[i * 3] = mode === 'mission2' ? -1.5 + srand() * 40 : (srand() - 0.5) * 38;
        pPos[i * 3 + 1] = 0.25 + srand() * 8.5;
        pPos[i * 3 + 2] = (srand() - 0.5) * 38;
        particleVelocities[i] = mode === 'mission2' ? 10 + srand() * 11 : 4 + srand() * 6;
      }
      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
      const pMat = new THREE.PointsMaterial({
        color: mode === 'mission4' ? '#7DD3FC' : destination === 'moon' ? '#E2E8F0' : '#FB923C',
        map: stormCloudTex ?? undefined,
        size: mode === 'mission4' ? 0.28 : 0.78,
        transparent: true,
        opacity: mode === 'mission2' ? 0.82 : 0.72,
        depthWrite: false,
      });
      particlePoints = new THREE.Points(pGeo, pMat);
      scene.add(particlePoints);

      if (mode === 'mission2' && stormCloudTex) {
        const cloudGeo = new THREE.PlaneGeometry(5.8, 3.0);
        stormCloudMat = new THREE.MeshBasicMaterial({
          map: stormCloudTex,
          color: destination === 'moon' ? '#CBD5E1' : '#F97316',
          transparent: true,
          opacity: 0.34,
          depthWrite: false,
          side: THREE.DoubleSide,
        });
        stormCloudMesh = new THREE.InstancedMesh(cloudGeo, stormCloudMat, STORM_CLOUD_COUNT);
        stormCloudMesh.frustumCulled = false;

        stormCloudX = new Float32Array(STORM_CLOUD_COUNT);
        stormCloudY = new Float32Array(STORM_CLOUD_COUNT);
        stormCloudZ = new Float32Array(STORM_CLOUD_COUNT);
        stormCloudSpd = new Float32Array(STORM_CLOUD_COUNT);
        stormCloudScale = new Float32Array(STORM_CLOUD_COUNT);

        for (let i = 0; i < STORM_CLOUD_COUNT; i++) {
          stormCloudX[i] = -1.5 + srand() * 42;
          stormCloudY[i] = 0.7 + srand() * 7.2;
          stormCloudZ[i] = (srand() - 0.5) * 38;
          stormCloudSpd[i] = 6.5 + srand() * 8.5;
          stormCloudScale[i] = 0.75 + srand() * 0.95;
        }
        scene.add(stormCloudMesh);
      }
    }

    // Mission 5 Orbital Satellite + Scan Cone Beam
    const satBeamGroup = new THREE.Group();
    if (mode === 'mission5') {
      const satBody = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 0.45, 0.7),
        new THREE.MeshStandardMaterial({ color: '#E2E8F0', metalness: 0.6, roughness: 0.3 })
      );
      satBody.position.y = 10.5;
      satBeamGroup.add(satBody);

      [-1.3, 1.3].forEach((ox) => {
        const wing = new THREE.Mesh(
          new THREE.BoxGeometry(1.4, 0.06, 0.55),
          new THREE.MeshStandardMaterial({ color: '#0284C7', emissive: '#0369A1', emissiveIntensity: 0.4 })
        );
        wing.position.set(ox, 10.5, 0);
        satBeamGroup.add(wing);
      });

      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(4.2, 10.5, 20, 1, true),
        new THREE.MeshBasicMaterial({
          color: '#38BDF8',
          transparent: true,
          opacity: 0.22,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
      );
      cone.position.y = 5.25;
      satBeamGroup.add(cone);
      satBeamGroup.visible = false;
      scene.add(satBeamGroup);
    }

    sceneHandlesRef.current = {
      renderer,
      scene,
      camera,
      isSoftwareGl,
      propsGroup,
      propUpdaters: [],
      propHitMeshes: [],
      conduitsGroup,
      tracksMesh,
      commanderRig,
      commanderRootWrap,
      astroRig,
      roverRig,
      targetMarker,
      targetMarkerTimer: 0,
      plateauOverlay,
      satBeamGroup,
      zoomOffset: 0,
    };

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Pointer Raycasting on 3D Canvas (click ground to walk, click prop to interact)
    const raycaster = new THREE.Raycaster();
    const handleCanvasPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const rect = renderer.domElement.getBoundingClientRect();
      _rayMouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _rayMouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(_rayMouse, camera);

      const handles = sceneHandlesRef.current;
      if (!handles) return;

      // Check prop clicks first
      if (stateRef.current.onPropClick && handles.propHitMeshes.length > 0) {
        for (const item of handles.propHitMeshes) {
          const hits = raycaster.intersectObject(item.obj, true);
          if (hits.length > 0) {
            stateRef.current.onPropClick(item.id);
            return;
          }
        }
      }

      // Otherwise check ground intersection
      if (stateRef.current.onGroundClick) {
        const groundHits = raycaster.intersectObject(groundClickTarget, true);
        if (groundHits.length > 0) {
          const pt = groundHits[0].point;
          const pct = worldToPct(pt.x, pt.z, mode);
          handles.targetMarker.position.set(pt.x, pt.y + 0.08, pt.z);
          handles.targetMarker.visible = true;
          handles.targetMarkerTimer = 1.1;
          stateRef.current.onGroundClick(pct.x, pct.y);
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (!sceneHandlesRef.current) return;
      sceneHandlesRef.current.zoomOffset = THREE.MathUtils.clamp(
        sceneHandlesRef.current.zoomOffset + e.deltaY * 0.01,
        -5,
        mode === 'mission3' ? 22 : 10
      );
    };

    renderer.domElement.addEventListener('pointerdown', handleCanvasPointerDown);
    renderer.domElement.addEventListener('wheel', handleWheel, { passive: true });

    // ResizeObserver for crisp responsive viewport
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const w = Math.max(entry.contentRect.width, 200);
      const h = Math.max(entry.contentRect.height, 200);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    // 3D Animation & Kinematics Loop
    const clock = new THREE.Clock();
    let frameId = 0;
    let timerId = 0;
    let disposed = false;

    let prevCmdX = initCmdW.x;
    let prevCmdZ = initCmdW.z;
    let prevAstX = initAstW.x;
    let prevAstZ = initAstW.z;
    let cmdAlt = 0;
    let cmdVy = 0;
    let landingSquat = 0;
    let stepDustTimer = 0;

    let roverAlt = 0;
    let roverVy = 0;
    let roverSuspOffset = 0;
    let roverSuspVel = 0;
    let prevRoverGroundY = 0;
    let roverDustTimer = 0;

    const camLookTarget = new THREE.Vector3(initCmdW.x, 0.8, initCmdW.z);

    const tick = () => {
      if (disposed) return;
      const dt = Math.min(0.05, clock.getDelta() || 0.016);
      const elapsed = clock.getElapsedTime();
      const st = stateRef.current;
      const handles = sceneHandlesRef.current;
      if (!handles) return;

      // Consume pending Jump action
      if (jumpQueuedRef.current) {
        jumpQueuedRef.current = false;
        if (st.inRover && st.showRover && handles.roverRig) {
          if (roverAlt <= 0.02) {
            roverVy = gravity.jumpVelocity * 0.72;
            const rp = st.commanderPos;
            const rw = pctToWorld(rp.x, rp.y, mode);
            const ry = getTerrainHeight(rw.x, rw.z, mode, destination);
            spawnDustBurst(rw.x, ry, rw.z, 10, 1.35);
          }
        } else if (cmdAlt <= 0.02) {
          cmdVy = gravity.jumpVelocity;
          const cw = pctToWorld(st.commanderPos.x, st.commanderPos.y, mode);
          const cy = getTerrainHeight(cw.x, cw.z, mode, destination);
          spawnDustBurst(cw.x, cy, cw.z, 7, 1.15);
        }
      }

      // 1. Update Commander 3D Position, Planetary Gravity Physics & Low-G Gait
      const cmdWorld = pctToWorld(st.commanderPos.x, st.commanderPos.y, mode);
      const cmdGroundY = getTerrainHeight(cmdWorld.x, cmdWorld.z, mode, destination);
      const vx = (cmdWorld.x - prevCmdX) / Math.max(0.008, dt);
      const vz = (cmdWorld.z - prevCmdZ) / Math.max(0.008, dt);
      prevCmdX = cmdWorld.x;
      prevCmdZ = cmdWorld.z;

      if (cmdAlt > 0 || cmdVy > 0) {
        cmdVy -= gravity.gWorld * dt;
        cmdAlt += cmdVy * dt;
        if (cmdAlt <= 0) {
          if (cmdVy < -1.2) {
            landingSquat = Math.min(1.0, Math.abs(cmdVy) / 5.5);
            spawnDustBurst(cmdWorld.x, cmdGroundY, cmdWorld.z, 10, 1.35);
          }
          cmdAlt = 0;
          cmdVy = 0;
        }
      } else {
        landingSquat = THREE.MathUtils.damp(landingSquat, 0, 9, dt);
      }

      if (st.commanderMoving && cmdAlt <= 0.02 && !st.inRover && gravity.hasRegolithDust && !st.reducedStimuli) {
        stepDustTimer -= dt;
        if (stepDustTimer <= 0) {
          stepDustTimer = 0.28 + gravity.strideFloat * 0.65;
          spawnDustBurst(cmdWorld.x, cmdGroundY, cmdWorld.z, 2, 0.72, -vx * 0.25, -vz * 0.25);
        }
      }

      if (st.inRover && st.showRover && handles.roverRig) {
        // Mount Commander inside the 3D Rover cockpit!
        if (commanderRig.root.parent !== handles.roverRig.cockpitAnchor) {
          handles.roverRig.cockpitAnchor.add(commanderRig.root);
          commanderRig.root.position.set(0, 0, 0);
          commanderRig.root.rotation.set(0, 0, 0);
        }
        cmdShadow.visible = false;
        cmdAlt = 0;
        cmdVy = 0;
        updateCommander3D(commanderRig, dt, elapsed, {
          vx: 0,
          vz: 0,
          isMoving: false,
          seatedInRover: true,
          carryingColor: st.carryingColor,
          reducedMotion: st.reducedStimuli,
        });
      } else {
        if (commanderRig.root.parent !== commanderRootWrap) {
          commanderRootWrap.add(commanderRig.root);
          commanderRig.root.position.set(0, 0, 0);
        }
        cmdShadow.visible = true;
        commanderRootWrap.position.set(cmdWorld.x, cmdGroundY + cmdAlt, cmdWorld.z);
        const shScale = Math.max(0.35, 1 / (1 + cmdAlt * 0.42));
        cmdShadow.scale.setScalar(shScale);
        cmdShadow.position.y = 0.03 - cmdAlt;
        (cmdShadow.material as THREE.MeshBasicMaterial).opacity = 0.6 * shScale;

        updateCommander3D(commanderRig, dt, elapsed, {
          vx,
          vz,
          isMoving: st.commanderMoving,
          isCelebrating: st.commanderCelebrating,
          carryingColor: st.carryingColor,
          seatedInRover: false,
          reducedMotion: st.reducedStimuli,
          altitude: cmdAlt,
          verticalVel: cmdVy,
          strideFloat: gravity.strideFloat,
          landingSquat,
        });
      }

      // 2. Update Rover 3D Position, 4-Corner Slope Pitch/Roll & Gravity Suspension Airtime
      if (handles.roverRig) {
        handles.roverRig.root.visible = !!st.showRover;
        if (st.showRover) {
          const rp = st.inRover ? st.commanderPos : (st.roverPos ?? st.commanderPos);
          const rw = pctToWorld(rp.x, rp.y, mode);
          const ry = getTerrainHeight(rw.x, rw.z, mode, destination);
          const yaw = handles.roverRig.currentYaw;
          const sinY = Math.sin(yaw);
          const cosY = Math.cos(yaw);

          const ryF = getTerrainHeight(rw.x + sinY * 1.05, rw.z + cosY * 1.05, mode, destination);
          const ryB = getTerrainHeight(rw.x - sinY * 1.05, rw.z - cosY * 1.05, mode, destination);
          const ryL = getTerrainHeight(rw.x + cosY * 1.05, rw.z - sinY * 1.05, mode, destination);
          const ryR = getTerrainHeight(rw.x - cosY * 1.05, rw.z + sinY * 1.05, mode, destination);

          const pitchTilt = Math.atan2(ryB - ryF, 2.1) * 0.72;
          const rollTilt = Math.atan2(ryR - ryL, 2.1) * 0.68;

          // Cresting craters/ridges at speed yields realistic low-g rover airtime
          if (st.inRover && st.commanderMoving && roverAlt <= 0.01 && ry < prevRoverGroundY - 0.05) {
            roverVy = Math.max(roverVy, 1.35);
          }
          prevRoverGroundY = ry;

          if (roverAlt > 0 || roverVy > 0) {
            roverVy -= gravity.gWorld * dt;
            roverAlt += roverVy * dt;
            if (roverAlt <= 0) {
              if (roverVy < -0.9) {
                roverSuspVel -= Math.min(2.2, Math.abs(roverVy) * 0.45);
                spawnDustBurst(rw.x, ry, rw.z, 12, 1.45);
              }
              roverAlt = 0;
              roverVy = 0;
            }
          }

          // Second-order vertical suspension spring damper
          roverSuspVel += (-48 * roverSuspOffset - 7.5 * roverSuspVel) * dt;
          roverSuspOffset = THREE.MathUtils.clamp(roverSuspOffset + roverSuspVel * dt, -0.18, 0.14);

          if (st.inRover && st.commanderMoving && roverAlt <= 0.05 && gravity.hasRegolithDust && !st.reducedStimuli) {
            roverDustTimer -= dt;
            if (roverDustTimer <= 0) {
              roverDustTimer = 0.12;
              spawnDustBurst(rw.x - sinY * 0.9, ry, rw.z - cosY * 0.9, 2, 0.9, -vx * 0.3, -vz * 0.3);
            }
          }

          const rShScale = Math.max(0.45, 1 / (1 + roverAlt * 0.35));
          roverShadow.scale.setScalar(rShScale);
          roverShadow.position.y = 0.03 - roverAlt;
          (roverShadow.material as THREE.MeshBasicMaterial).opacity = 0.6 * rShScale;

          handles.roverRig.root.position.set(rw.x, ry + roverAlt, rw.z);
          updateRover3D(handles.roverRig, dt, elapsed, {
            vx: st.inRover ? vx : 0,
            vz: st.inRover ? vz : 0,
            isMoving: st.inRover && st.commanderMoving,
            pitchTilt,
            rollTilt,
            suspensionOffset: roverSuspOffset,
            reducedMotion: st.reducedStimuli,
          });
        }
      }

      // 3. Update ASTRO 3D Companion
      const astW = pctToWorld(st.astroPos.x, st.astroPos.y, mode);
      const astY = getTerrainHeight(astW.x, astW.z, mode, destination);
      const avx = (astW.x - prevAstX) / Math.max(0.008, dt);
      const avz = (astW.z - prevAstZ) / Math.max(0.008, dt);
      prevAstX = astW.x;
      prevAstZ = astW.z;
      astroRig.root.position.set(astW.x, astY, astW.z);
      updateAstro3D(astroRig, dt, elapsed, {
        vx: avx,
        vz: avz,
        lookTargetX: cmdWorld.x,
        lookTargetZ: cmdWorld.z,
        mood: st.astroMood,
        pointingTo: st.astroPointingTo,
        reducedMotion: st.reducedStimuli,
      });

      // 3b. Subtle Earthrise rotation in lunar sky
      if (earthSphere && !st.reducedStimuli) {
        earthSphere.rotation.y += dt * 0.04;
      }

      // 3c. Simulate 3D Ballistic Regolith Dust Particles under planetary gravity
      if (gravity.hasRegolithDust) {
        let anyDustActive = false;
        const drag = Math.max(0, 1 - gravity.dustDrag * dt);
        for (let i = 0; i < DUST_POOL_SIZE; i++) {
          if (dustLife[i] > 0) {
            anyDustActive = true;
            dustLife[i] -= dt;
            dustVy[i] -= gravity.gWorld * dt;
            dustVx[i] *= drag;
            dustVz[i] *= drag;
            dustPx[i] += dustVx[i] * dt;
            dustPy[i] += dustVy[i] * dt;
            dustPz[i] += dustVz[i] * dt;

            const gy = getTerrainHeight(dustPx[i], dustPz[i], mode, destination);
            if (dustPy[i] < gy + 0.06) {
              dustPy[i] = gy + 0.06;
              dustVy[i] = Math.abs(dustVy[i]) * 0.18;
              dustVx[i] *= 0.6;
              dustVz[i] *= 0.6;
            }

            const ratio = Math.max(0, dustLife[i] / dustMaxLife[i]);
            const s = dustScale[i] * Math.sin(ratio * Math.PI);
            _dummy.position.set(dustPx[i], dustPy[i], dustPz[i]);
            _dummy.rotation.set(elapsed + i, elapsed * 0.7, 0);
            _dummy.scale.setScalar(s);
            _dummy.updateMatrix();
            dustMesh.setMatrixAt(i, _dummy.matrix);
          } else {
            _dummy.position.set(0, -100, 0);
            _dummy.scale.setScalar(0);
            _dummy.updateMatrix();
            dustMesh.setMatrixAt(i, _dummy.matrix);
          }
        }
        if (anyDustActive) {
          dustMesh.instanceMatrix.needsUpdate = true;
        }
      }

      // 4. Update Interactive 3D Props
      for (const up of handles.propUpdaters) {
        up(elapsed, dt);
      }

      // 5. Target Destination Beacon Decay
      if (handles.targetMarker.visible) {
        handles.targetMarkerTimer -= dt;
        const pulse = 1 + Math.sin(elapsed * 10) * 0.14;
        handles.targetMarker.scale.set(pulse, pulse, 1);
        if (handles.targetMarkerTimer <= 0) {
          handles.targetMarker.visible = false;
        }
      }

      // 6. 3D Dust Storm / Ice Particles & Volumetric Storm Clouds + Dynamic Fog
      if (mode === 'mission2' && scene.fog instanceof THREE.FogExp2) {
        const isOutside = st.commanderPos.x > 46;
        const baseFog = destination === 'moon' ? 0.008 : 0.011;
        const stormFogAdd = st.stormIntensity * (isOutside ? 0.022 : 0.008);
        scene.fog.density = THREE.MathUtils.damp(scene.fog.density, baseFog + stormFogAdd, 3.5, dt);
      }

      if (particlePoints && particleVelocities) {
        const activeRate = mode === 'mission2' ? st.stormIntensity : st.iceIntensity;
        particlePoints.visible = activeRate > 0.04;
        if (particlePoints.visible) {
          const pMat = particlePoints.material as THREE.PointsMaterial;
          if (mode === 'mission2') {
            pMat.opacity = 0.18 + activeRate * 0.72;
          }
          const pArr = particlePoints.geometry.attributes.position as THREE.BufferAttribute;
          const speedScale = st.reducedStimuli ? 0.35 : 0.7 + activeRate * 1.15;
          for (let i = 0; i < particleCount; i++) {
            let px = pArr.getX(i);
            let py = pArr.getY(i);
            let pz = pArr.getZ(i);
            if (mode === 'mission2') {
              px -= particleVelocities[i] * dt * speedScale * 1.35;
              pz += Math.sin(elapsed * 1.8 + i) * dt * 1.2;
              if (px < -1.5) px = 38.5;
            } else {
              py -= particleVelocities[i] * dt * speedScale * 0.7;
              if (py < 0.2) py = 9.5;
            }
            pArr.setXYZ(i, px, py, pz);
          }
          pArr.needsUpdate = true;
        }
      }

      if (stormCloudMesh && stormCloudMat && stormCloudX && stormCloudY && stormCloudZ && stormCloudSpd && stormCloudScale) {
        const activeRate = st.stormIntensity;
        stormCloudMesh.visible = activeRate > 0.06;
        if (stormCloudMesh.visible) {
          stormCloudMat.opacity = 0.08 + activeRate * 0.32;
          const windScale = st.reducedStimuli ? 0.35 : 0.65 + activeRate;
          for (let i = 0; i < STORM_CLOUD_COUNT; i++) {
            stormCloudX[i] -= stormCloudSpd[i] * dt * windScale;
            if (stormCloudX[i] < -1.8) {
              stormCloudX[i] = 39.5;
            }
            const cy = stormCloudY[i] + Math.sin(elapsed * 1.4 + i * 0.7) * 0.35;
            const cs = stormCloudScale[i] * (0.45 + activeRate * 0.72);
            _dummy.position.set(stormCloudX[i], cy, stormCloudZ[i]);
            _dummy.quaternion.copy(camera.quaternion);
            _dummy.scale.set(cs, cs, 1);
            _dummy.updateMatrix();
            stormCloudMesh.setMatrixAt(i, _dummy.matrix);
          }
          stormCloudMesh.instanceMatrix.needsUpdate = true;
        }
      }

      // 7. Mission 5 Satellite Overpass Beam
      if (mode === 'mission5') {
        if (st.satelliteBeamX !== null && st.satelliteBeamX !== undefined) {
          satBeamGroup.visible = true;
          const beamW = pctToWorld(st.satelliteBeamX, 50, mode);
          satBeamGroup.position.set(beamW.x, 0, 0);
        } else {
          satBeamGroup.visible = false;
        }
      }

      // 8. Smooth, Close-Up Third-Person Follow Camera framing Commander & ASTRO together
      const isOverview = st.cameraMode === 'overview';
      const isExpedition = mode === 'mission3';
      const zoom = handles.zoomOffset;

      const distCmdAst = Math.hypot(astW.x - cmdWorld.x, astW.z - cmdWorld.z);
      const astWeight = distCmdAst < 8.5 ? (isExpedition ? 0.28 : 0.36) : 0;
      const focusX = cmdWorld.x * (1 - astWeight) + astW.x * astWeight;
      const focusZ = cmdWorld.z * (1 - astWeight) + astW.z * astWeight;

      const desiredTargetX = isOverview ? (isExpedition ? 22 : 0) : focusX;
      const desiredTargetZ = isOverview ? 0 : focusZ - (isExpedition ? 0.8 : 0.5);
      const desiredTargetY = isOverview ? 0.8 : 1.18 + cmdGroundY * 0.4 + cmdAlt * 0.35;

      camLookTarget.x = THREE.MathUtils.damp(camLookTarget.x, desiredTargetX, 6.2, dt);
      camLookTarget.y = THREE.MathUtils.damp(camLookTarget.y, desiredTargetY, 6.2, dt);
      camLookTarget.z = THREE.MathUtils.damp(camLookTarget.z, desiredTargetZ, 6.2, dt);

      keyLight.position.set(camLookTarget.x + 22, 34, camLookTarget.z + 24);
      keyLight.target.position.set(camLookTarget.x, 0, camLookTarget.z);
      keyLight.target.updateMatrixWorld();

      const followDistY = isExpedition ? (st.inRover ? 5.0 : 4.3) : 4.3;
      const followDistZ = isExpedition ? (st.inRover ? 8.4 : 6.9) : 6.9;

      const camDistY = isOverview
        ? (isExpedition ? 66 : 24) + zoom * 0.7
        : followDistY + cmdGroundY * 0.4 + zoom * 0.45;
      const camDistZ = isOverview
        ? (isExpedition ? 72 : 26) + zoom
        : followDistZ + zoom * 0.75;
      const desiredCamX = isOverview
        ? isExpedition
          ? 22
          : 0
        : focusX + (isExpedition ? 0.4 : 0.25);
      const desiredCamZ = (isOverview ? 0 : focusZ) + camDistZ;

      camera.position.x = THREE.MathUtils.damp(camera.position.x, desiredCamX, 5.8, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, Math.max(2.2, camDistY), 5.8, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, desiredCamZ, 5.8, dt);
      camera.lookAt(camLookTarget);

      renderer.render(scene, camera);

      // 9. Project 3D Coordinates -> 2D Screen Positions for Crisp HTML Labels & ASTRO Caption
      const width = renderer.domElement.clientWidth;
      const height = renderer.domElement.clientHeight;
      if (labelsLayerRef.current) {
        const labelEls = labelsLayerRef.current.children;
        for (let i = 0; i < st.props.length && i < labelEls.length; i++) {
          const p = st.props[i];
          const el = labelEls[i] as HTMLElement;
          const pw = pctToWorld(p.xPct, p.yPct, mode);
          const py = getTerrainHeight(pw.x, pw.z, mode, destination);
          const labelYOffset =
            p.kind === 'globe' || p.kind === 'planet_pedestal'
              ? 3.85
              : p.kind === 'door_portal'
                ? 3.65
                : p.kind === 'comms_mod'
                  ? 3.4
                  : 2.55;
          _projVec.set(pw.x, py + labelYOffset, pw.z);
          _projVec.project(camera);
          const visibleFront = _projVec.z < 1;
          const sx = (_projVec.x * 0.5 + 0.5) * width;
          const sy = (-_projVec.y * 0.5 + 0.5) * height;
          el.style.opacity = visibleFront ? '1' : '0';
          el.style.transform = `translate3d(${sx}px, ${sy}px, 0) translate(-50%, -100%)`;
        }
      }

      if (astroBubbleRef.current) {
        _projVec.set(astW.x, astY + 2.0, astW.z);
        _projVec.project(camera);
        const sx = (_projVec.x * 0.5 + 0.5) * width;
        const sy = (-_projVec.y * 0.5 + 0.5) * height;
        astroBubbleRef.current.style.transform = `translate3d(${sx}px, ${sy}px, 0) translate(-50%, -100%)`;
      }

      if (commanderNameRef.current) {
        const activeCmdW = st.inRover && st.roverPos ? pctToWorld(st.roverPos.x, st.roverPos.y, mode) : cmdWorld;
        const activeCmdY = getTerrainHeight(activeCmdW.x, activeCmdW.z, mode, destination);
        const airborneLift = st.inRover ? 2.45 + roverAlt : 2.15 + cmdAlt;
        _projVec.set(activeCmdW.x, activeCmdY + airborneLift, activeCmdW.z);
        _projVec.project(camera);
        const sx = (_projVec.x * 0.5 + 0.5) * width;
        const sy = (-_projVec.y * 0.5 + 0.5) * height;
        commanderNameRef.current.style.transform = `translate3d(${sx}px, ${sy}px, 0) translate(-50%, -100%)`;
      }

      if (isSoftwareGl) {
        afterDraw(renderer, tick, (id) => {
          timerId = id;
        });
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    if (isSoftwareGl) {
      timerId = window.setTimeout(tick, 16);
    } else {
      frameId = requestAnimationFrame(tick);
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(timerId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointerdown', handleCanvasPointerDown);
      renderer.domElement.removeEventListener('wheel', handleWheel);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
      disposeObject3D(scene);
      envRT.dispose();
      contactShadowTex.dispose();
      renderer.dispose();
      sceneHandlesRef.current = null;
    };
    // Only rebuild whole Three.js world when mode, destination, or Commander avatar appearance changes
  }, [mode, destination, commanderProfile]);

  // 2. Sync Interactive Props into 3D Scene whenever prop states change
  useEffect(() => {
    const handles = sceneHandlesRef.current;
    if (!handles) return;

    disposeObject3D(handles.propsGroup);
    handles.propsGroup.clear();
    handles.propUpdaters = [];
    handles.propHitMeshes = [];

    for (const p of props) {
      const { group, update } = buildPropMesh3D(
        p,
        handles.renderer,
        destination,
        handles.isSoftwareGl
      );
      const pw = pctToWorld(p.xPct, p.yPct, mode);
      const py = getTerrainHeight(pw.x, pw.z, mode, destination);
      group.position.set(pw.x, py, pw.z);
      if (p.tiltPitch || p.tiltRoll) {
        group.rotation.set(p.tiltPitch ?? 0, 0, p.tiltRoll ?? 0);
      }
      handles.propsGroup.add(group);
      handles.propHitMeshes.push({ id: p.id, obj: group });
      if (update) handles.propUpdaters.push(update);
    }
  }, [props, mode, destination]);

  // 3. Sync 3D Conduits / Power Cables / Guiding Paths
  useEffect(() => {
    const handles = sceneHandlesRef.current;
    if (!handles) return;

    disposeObject3D(handles.conduitsGroup);
    handles.conduitsGroup.clear();

    for (const c of conduits) {
      const a = pctToWorld(c.from.x, c.from.y, mode);
      const b = pctToWorld(c.to.x, c.to.y, mode);
      const midX = (a.x + b.x) / 2;
      const midZ = (a.z + b.z) / 2;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(a.x, getTerrainHeight(a.x, a.z, mode, destination) + 0.09, a.z),
        new THREE.Vector3(midX, getTerrainHeight(midX, midZ, mode, destination) + 0.11, midZ),
        new THREE.Vector3(b.x, getTerrainHeight(b.x, b.z, mode, destination) + 0.09, b.z),
      ]);
      const geo = new THREE.TubeGeometry(curve, 16, c.active ? 0.09 : 0.055, 6, false);
      const mat = new THREE.MeshStandardMaterial({
        color: c.color,
        emissive: c.color,
        emissiveIntensity: c.active ? 0.8 : 0.2,
        roughness: 0.4,
      });
      const mesh = new THREE.Mesh(geo, mat);
      handles.conduitsGroup.add(mesh);
    }
  }, [conduits, mode, destination]);

  // 4. Sync 3D Footprints & Rover Tire Tracks
  useEffect(() => {
    const handles = sceneHandlesRef.current;
    if (!handles || !handles.tracksMesh) return;

    const count = Math.min(80, trailPoints.length);
    handles.tracksMesh.count = count;
    for (let i = 0; i < count; i++) {
      const pt = trailPoints[trailPoints.length - count + i];
      const w = pctToWorld(pt.x, pt.y, mode);
      const gy = getTerrainHeight(w.x, w.z, mode, destination);
      _dummy.position.set(w.x, gy + 0.04, w.z);
      _dummy.rotation.set(0, (i * 0.4) % Math.PI, 0);
      _dummy.scale.setScalar(1);
      _dummy.updateMatrix();
      handles.tracksMesh.setMatrixAt(i, _dummy.matrix);
    }
    handles.tracksMesh.instanceMatrix.needsUpdate = true;
    handles.tracksMesh.computeBoundingSphere();
  }, [trailPoints, mode, destination]);

  // 5. Sync Mission 3 Flat Plateau Overlay Visibility
  useEffect(() => {
    const handles = sceneHandlesRef.current;
    if (!handles) return;
    handles.plateauOverlay.visible = highlightFlatPlateau || scannerRevealed;
  }, [highlightFlatPlateau, scannerRevealed]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Isolated WebGL Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />

      {/* Planetary Gravity Telemetry & Jump Action Badge */}
      <div className="pointer-events-none absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-lg border border-purple-400/35 bg-[#160A29]/90 px-2.5 py-1 text-[11px] font-semibold text-purple-100 shadow">
          <Orbit className="h-3.5 w-3.5 text-sky-300" />
          <span>{gravityProfile.label}</span>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.currentTarget.blur();
            jumpQueuedRef.current = true;
          }}
          className="pointer-events-auto flex items-center gap-1 rounded-lg border border-amber-300/60 bg-[#241242]/92 px-2.5 py-1 text-[11px] font-bold text-amber-200 shadow transition-colors hover:bg-amber-400/25 active:scale-95"
          title="Test the effect of gravity by jumping (J key)"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-300" />
          <span>Jump [J]</span>
        </button>
      </div>

      {/* Fallback message only if WebGL hardware/software context completely unavailable */}
      {webglLost && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#160A29] text-center p-6">
          <div className="max-w-md rounded-2xl border border-amber-300/60 bg-[#21103A] p-5 text-white">
            <h3 className="font-display text-lg font-bold text-amber-300">Preparing 3D engine</h3>
            <p className="mt-2 text-sm text-purple-100">
              The 3D graphics context was paused by the browser. You can keep using the on-screen controls.
            </p>
          </div>
        </div>
      )}

      {/* Projected Semantic DOM Labels floating cleanly above 3D objects */}
      <div
        ref={labelsLayerRef}
        className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
      >
        {props.map((p) => {
          if (!p.label) return <div key={p.id} className="hidden" />;
          return (
            <button
              key={p.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPropClick?.(p.id);
              }}
              style={{ left: 0, top: 0 }}
              className={`pointer-events-auto absolute flex flex-col items-center rounded-lg border px-2.5 py-1 text-center shadow-lg transition-colors ${
                p.active
                  ? 'border-emerald-400 bg-emerald-950/92 text-emerald-100'
                  : p.near
                    ? 'border-amber-300 bg-slate-950/95 text-amber-200'
                    : p.urgent
                      ? 'border-amber-400/90 bg-slate-950/92 text-amber-100'
                      : 'border-white/25 bg-slate-950/88 text-white'
              }`}
            >
              <span className="text-[11px] font-bold leading-tight whitespace-nowrap">
                {p.label}
              </span>
              {p.sublabel && (
                <span className="text-[10px] opacity-85 leading-tight whitespace-nowrap">
                  {p.sublabel}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Projected Commander Nameplate */}
      <div
        ref={commanderNameRef}
        style={{ left: 0, top: 0 }}
        className="pointer-events-none absolute z-10 rounded-md border border-sky-300/40 bg-slate-950/88 px-2 py-0.5 text-[10px] font-bold text-sky-200 shadow whitespace-nowrap"
      >
        {commanderProfile.commanderName || 'Nova'}
      </div>

      {/* Projected ASTRO 3D Nametag */}
      <div
        ref={astroBubbleRef}
        style={{ left: 0, top: 0 }}
        className="pointer-events-none absolute z-10 rounded-md border border-cyan-300/45 bg-slate-950/88 px-2 py-0.5 text-[10px] font-bold text-cyan-200 shadow whitespace-nowrap"
      >
        ASTRO
      </div>

      {/* Unclipped ASTRO Complete Guidance Comms Banner */}
      {showCaptions && astroCaption && (
        <div
          className="pointer-events-none absolute top-12 left-1/2 -translate-x-1/2 z-20 w-[min(660px,92vw)]"
          role="status"
          aria-live="polite"
        >
          <div
            className={`flex items-start gap-2.5 rounded-2xl border-2 px-4 py-2.5 shadow-2xl ${
              astroMood === 'alert'
                ? 'border-amber-400/85 bg-[#2A1424]/95 text-amber-50'
                : astroMood === 'happy'
                  ? 'border-emerald-400/85 bg-[#11262D]/95 text-emerald-50'
                  : 'border-sky-400/80 bg-[#1B0F36]/95 text-white'
            }`}
          >
            <span
              className={`mt-0.5 shrink-0 rounded-md px-2 py-0.5 text-[10px] font-extrabold tracking-wide uppercase ${
                astroMood === 'alert'
                  ? 'bg-amber-400 text-slate-950'
                  : astroMood === 'happy'
                    ? 'bg-emerald-400 text-slate-950'
                    : 'bg-sky-400 text-slate-950'
              }`}
            >
              ASTRO
            </span>
            <p className="text-xs sm:text-[13px] font-semibold leading-relaxed whitespace-normal break-words">
              {astroCaption}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
