import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Vec2 } from '../../types/game';

export const WORLD_HALF_X = 27;
export const WORLD_HALF_Z = 17;

export function getWorldBounds(mode: TerrainMode): { halfX: number; halfZ: number } {
  if (mode === 'mission3') {
    return { halfX: 82, halfZ: 52 };
  }
  return { halfX: WORLD_HALF_X, halfZ: WORLD_HALF_Z };
}

/** Convert 0..100 arena percentage coordinates into 3D world (X, Z) coordinates */
export function pctToWorld(
  xPct: number,
  yPct: number,
  mode: TerrainMode = 'mission1'
): { x: number; z: number } {
  const { halfX, halfZ } = getWorldBounds(mode);
  const x = ((xPct - 50) / 50) * halfX;
  const z = ((yPct - 54) / 42) * halfZ;
  return { x, z };
}

/** Convert 3D world (X, Z) back into 0..100 arena percentage coordinates */
export function worldToPct(
  wx: number,
  wz: number,
  mode: TerrainMode = 'mission1'
): Vec2 {
  const { halfX, halfZ } = getWorldBounds(mode);
  const x = Math.min(95, Math.max(5, (wx / halfX) * 50 + 50));
  const y = Math.min(92, Math.max(14, (wz / halfZ) * 42 + 54));
  return { x, y };
}

export type TerrainMode =
  | 'indoor'
  | 'mission1'
  | 'mission2'
  | 'mission3'
  | 'mission4'
  | 'mission5';

export interface PlanetaryGravityProfile {
  label: string;
  gReal: number; // Real m/s^2 (1.62 Moon, 3.72 Mars, 9.81 Station 1G)
  gRatio: number; // Ratio relative to Earth
  gWorld: number; // Calibrated 3D simulation acceleration (units/s^2)
  jumpVelocity: number; // Vertical launch impulse (units/s)
  strideFloat: number; // Natural ballistic stride lift factor
  dustDrag: number; // Atmospheric drag on kicked-up dust
  hasRegolithDust: boolean;
}

export function getPlanetaryGravity(
  mode: TerrainMode,
  destination: 'mars' | 'moon'
): PlanetaryGravityProfile {
  if (mode === 'indoor') {
    return {
      label: 'Artificial Gravity · 9.81 m/s² (1.00 g)',
      gReal: 9.81,
      gRatio: 1.0,
      gWorld: 18.0,
      jumpVelocity: 4.5,
      strideFloat: 0.0,
      dustDrag: 1.8,
      hasRegolithDust: false,
    };
  }
  if (destination === 'moon') {
    return {
      label: 'Lunar Gravity · 1.62 m/s² (0.17 g)',
      gReal: 1.62,
      gRatio: 0.165,
      gWorld: 4.2,
      jumpVelocity: 4.85,
      strideFloat: 0.16,
      dustDrag: 0.15, // Vacuum: dust falls in pure parabolic arc
      hasRegolithDust: true,
    };
  }
  return {
    label: 'Martian Gravity · 3.72 m/s² (0.38 g)',
    gReal: 3.72,
    gRatio: 0.379,
    gWorld: 8.4,
    jumpVelocity: 5.1,
    strideFloat: 0.08,
    dustDrag: 0.75, // Thin CO2 atmosphere
    hasRegolithDust: true,
  };
}

export interface CraterDef {
  id?: string;
  xPct: number;
  yPct: number;
  rPct: number;
  depth: number;
  rimHeight: number;
}

export const MISSION3_CRATERS: CraterDef[] = [
  { id: 'c1', xPct: 21, yPct: 33, rPct: 6.2, depth: 1.45, rimHeight: 0.48 },
  { id: 'c2', xPct: 26, yPct: 72, rPct: 6.8, depth: 1.6, rimHeight: 0.54 },
  { id: 'c3', xPct: 43, yPct: 49, rPct: 7.8, depth: 1.85, rimHeight: 0.6 },
  { id: 'c4', xPct: 56, yPct: 26, rPct: 5.8, depth: 1.35, rimHeight: 0.44 },
  { id: 'c5', xPct: 61, yPct: 74, rPct: 6.6, depth: 1.55, rimHeight: 0.52 },
  { id: 'c6', xPct: 71, yPct: 31, rPct: 5.2, depth: 1.25, rimHeight: 0.42 },
];

export const AMBIENT_CRATERS: CraterDef[] = [
  { xPct: 16, yPct: 24, rPct: 6.5, depth: 0.68, rimHeight: 0.26 },
  { xPct: 84, yPct: 26, rPct: 7.2, depth: 0.75, rimHeight: 0.3 },
  { xPct: 88, yPct: 84, rPct: 6.0, depth: 0.58, rimHeight: 0.24 },
  { xPct: 12, yPct: 82, rPct: 5.8, depth: 0.56, rimHeight: 0.22 },
];

/**
 * Deterministic terrain elevation function `groundHeightAt(wx, wz)`
 * Ensures every rock, building, crater, rover wheel, and character foot sits flush on the 3D surface.
 */
export function getTerrainHeight(
  wx: number,
  wz: number,
  mode: TerrainMode,
  _destination: 'mars' | 'moon' = 'mars'
): number {
  if (mode === 'indoor') return 0;

  // Mission 2: Left half is a flat pressurized base pad (x < 0.2), right half is rough terrain
  if (mode === 'mission2') {
    if (wx < 0.2) return 0;
    const blend = THREE.MathUtils.smoothstep(wx, 0.2, 4.5);
    const wave =
      Math.sin(wx * 0.14 + 0.5) * Math.cos(wz * 0.18) * 0.44 +
      Math.sin(wx * 0.32 - wz * 0.24) * 0.16;
    return blend * wave;
  }

  const { halfX, halfZ } = getWorldBounds(mode);

  // Gentle planetary dunes / lunar maria undulations + micro-ridges
  let h =
    Math.sin(wx * (mode === 'mission3' ? 0.065 : 0.12) + 0.4) *
      Math.cos(wz * (mode === 'mission3' ? 0.08 : 0.15)) *
      (mode === 'mission3' ? 0.62 : 0.38) +
    Math.sin(wx * 0.22 - wz * 0.19) * 0.16 +
    Math.cos(wx * 0.48 + wz * 0.42) * 0.05;

  // Keep central hologram pad flat in Mission 1
  if (mode === 'mission1') {
    const dCenter = Math.hypot(wx, wz);
    if (dCenter < 7.5) {
      const k = THREE.MathUtils.smoothstep(dCenter, 4.2, 7.5);
      h *= k;
    }
  }

  // Mission 3: Vast lunar/martian expedition terrain from West Landing Zone to East Ideal Construction Plateau
  if (mode === 'mission3') {
    const pct = worldToPct(wx, wz, 'mission3');
    const inWestPad = pct.x >= 5 && pct.x <= 15 && pct.y >= 40 && pct.y <= 64;
    const inEastIdealPlateau = pct.x >= 76 && pct.x <= 93 && pct.y >= 41 && pct.y <= 73;

    if (inWestPad) {
      h *= 0.22;
    } else if (inEastIdealPlateau) {
      // Smoothly level the ideal eastern basin for stable base construction
      const edgeFadeX = Math.min(
        THREE.MathUtils.smoothstep(pct.x, 75, 78),
        1 - THREE.MathUtils.smoothstep(pct.x, 91, 94)
      );
      const edgeFadeY = Math.min(
        THREE.MathUtils.smoothstep(pct.y, 40, 44),
        1 - THREE.MathUtils.smoothstep(pct.y, 70, 74)
      );
      const flatFactor = 1 - edgeFadeX * edgeFadeY * 0.92;
      h *= flatFactor;
    }

    // North-Center Highland Ridge
    if (pct.x >= 32 && pct.x <= 53 && pct.y >= 14 && pct.y <= 36) {
      const dx = (pct.x - 42.5) / 10.5;
      const dy = (pct.y - 25) / 11;
      const ridge = Math.max(0, 1 - (dx * dx + dy * dy));
      h += ridge * 3.8;
    }

    // South-Center Escarpment Ridge
    if (pct.x >= 33 && pct.x <= 52 && pct.y >= 68 && pct.y <= 91) {
      const dx = (pct.x - 42.5) / 9.5;
      const dy = (pct.y - 79.5) / 11.5;
      const ridge = Math.max(0, 1 - (dx * dx + dy * dy));
      h += ridge * 3.6;
    }

    // Pre-Plateau Southern Ridge Pass
    if (pct.x >= 62 && pct.x <= 75 && pct.y >= 64 && pct.y <= 89) {
      const dx = (pct.x - 68.5) / 6.5;
      const dy = (pct.y - 76.5) / 12.5;
      const ridge = Math.max(0, 1 - (dx * dx + dy * dy));
      h += ridge * 3.1;
    }

    // 6 Impact Craters with deep bowl & raised ejecta rim
    for (const c of MISSION3_CRATERS) {
      const cw = pctToWorld(c.xPct, c.yPct, 'mission3');
      const rWorld = (c.rPct / 50) * halfX * 0.85;
      const d = Math.hypot(wx - cw.x, wz - cw.z);
      if (d < rWorld * 1.45) {
        const u = d / rWorld;
        if (u < 1) {
          h -= (1 - u * u) * c.depth;
        } else {
          const rimU = (u - 1) / 0.45;
          h += Math.sin((1 - rimU) * Math.PI) * c.rimHeight;
        }
      }
    }
  } else {
    // Ambient craters around the edges on other planetary missions
    for (const c of AMBIENT_CRATERS) {
      const cw = pctToWorld(c.xPct, c.yPct, mode);
      const rWorld = (c.rPct / 50) * WORLD_HALF_X * 0.72;
      const d = Math.hypot(wx - cw.x, wz - cw.z);
      if (d < rWorld * 1.4) {
        const u = d / rWorld;
        if (u < 1) {
          h -= (1 - u * u) * c.depth;
        } else {
          const rimU = (u - 1) / 0.4;
          h += Math.sin((1 - rimU) * Math.PI) * c.rimHeight;
        }
      }
    }
  }

  // Distant mountain rim beyond playable perimeter
  const edgeDist = Math.max(Math.abs(wx) - (halfX + 4), Math.abs(wz) - (halfZ + 4), 0);
  if (edgeDist > 0) {
    const angle = Math.atan2(wz, wx);
    const ridgeNoise = 0.65 + 0.35 * Math.sin(angle * 7) + 0.25 * Math.cos(angle * 13);
    h += Math.min(mode === 'mission3' ? 22 : 13.5, Math.pow(edgeDist * 0.36, 1.35) * ridgeNoise);
  }

  return h;
}

/** Detect SwiftShader / llvmpipe / software WebGL from GPU renderer string */
export function detectSoftwareWebGL(): boolean {
  if (typeof document === 'undefined') return true;
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

/** Pace software WebGL loops using fenceSync + 80ms rest */
export function afterDraw(
  renderer: THREE.WebGLRenderer,
  cb: () => void,
  registerHandle: (id: number) => void
) {
  const gl = renderer.getContext() as WebGL2RenderingContext;
  if (!gl || typeof gl.fenceSync !== 'function') {
    const id = window.setTimeout(cb, 80);
    registerHandle(id);
    return;
  }
  const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
  gl.flush();
  const poll = () => {
    const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
    if (state === gl.UNSIGNALED) {
      const id = window.setTimeout(poll, 5);
      registerHandle(id);
    } else {
      if (sync) gl.deleteSync(sync);
      const id = window.setTimeout(cb, 80);
      registerHandle(id);
    }
  };
  const id = window.setTimeout(poll, 5);
  registerHandle(id);
}

/** Setup mandatory studio reflection map for PBR metals & glass */
export function setupStudioEnvironment(renderer: THREE.WebGLRenderer, scene: THREE.Scene) {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const roomEnv = new RoomEnvironment();
  const envRT = pmremGenerator.fromScene(roomEnv, 0.04);
  scene.environment = envRT.texture;
  roomEnv.dispose();
  pmremGenerator.dispose();
  return envRT;
}

/**
 * Atmospheric Sky Dome Shader (Mars butterscotch dust scattering vs Moon deep-space vacuum gradient)
 */
export function createSkyDome(
  destination: 'mars' | 'moon',
  mode: TerrainMode
): THREE.Mesh {
  const geo = new THREE.SphereGeometry(235, 32, 24);

  const zenith =
    mode === 'indoor'
      ? new THREE.Color('#090314')
      : destination === 'moon'
        ? new THREE.Color('#03050A')
        : new THREE.Color('#1B0D14');
  const midSky =
    mode === 'indoor'
      ? new THREE.Color('#180B30')
      : destination === 'moon'
        ? new THREE.Color('#090E1C')
        : new THREE.Color('#5A281B');
  const horizon =
    mode === 'indoor'
      ? new THREE.Color('#231142')
      : destination === 'moon'
        ? new THREE.Color('#131A2C')
        : new THREE.Color('#C46335');
  const sunDir = new THREE.Vector3(24, 28, -32).normalize();

  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uZenith: { value: zenith },
      uMid: { value: midSky },
      uHorizon: { value: horizon },
      uSunDir: { value: sunDir },
      uSunGlow: { value: destination === 'moon' ? 0.45 : 0.72 },
    },
    vertexShader: `
      varying vec3 vWorldDir;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldDir = normalize(wp.xyz);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform vec3 uZenith;
      uniform vec3 uMid;
      uniform vec3 uHorizon;
      uniform vec3 uSunDir;
      uniform float uSunGlow;
      varying vec3 vWorldDir;
      void main() {
        float h = clamp(vWorldDir.y, 0.0, 1.0);
        vec3 col = mix(uHorizon, uMid, smoothstep(0.0, 0.28, h));
        col = mix(col, uZenith, smoothstep(0.24, 0.85, h));
        float sunAmt = max(dot(normalize(vWorldDir), uSunDir), 0.0);
        vec3 mie = vec3(1.0, 0.84, 0.62) * pow(sunAmt, 14.0) * uSunGlow;
        vec3 disc = vec3(1.0, 0.98, 0.92) * smoothstep(0.9965, 0.9988, sunAmt) * 1.4;
        gl_FragColor = vec4(col + mie + disc, 1.0);
      }
    `,
  });

  const dome = new THREE.Mesh(geo, mat);
  dome.frustumCulled = false;
  return dome;
}

/**
 * Procedural 1024x1024 Planetary PBR Texture Set:
 * - map (SRGBColorSpace albedo)
 * - normalMap (Linear tangent-space Sobel normals for crisp micro-relief)
 * - roughnessMap (Linear per-pixel roughness variation between glossy pebbles & matte dust)
 */
export function createPlanetarySurfaceTexture(
  destination: 'mars' | 'moon',
  renderer: THREE.WebGLRenderer,
  mode: TerrainMode = 'mission1'
): { map: THREE.CanvasTexture; normalMap: THREE.DataTexture; roughnessMap: THREE.DataTexture } {
  const size = 512;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const ctx = colorCanvas.getContext('2d')!;

  const heightBuf = new Float32Array(size * size);

  // Base regolith tone
  if (destination === 'moon') {
    ctx.fillStyle = mode === 'mission4' || mode === 'mission5' ? '#7D7B91' : '#8A91A3';
  } else {
    ctx.fillStyle = mode === 'mission4' || mode === 'mission5' ? '#B8522E' : '#C85E34';
  }
  ctx.fillRect(0, 0, size, size);

  let seed = destination === 'moon' ? 42 : 109;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  // Multi-frequency wind-sculpted ripples / regolith strata
  for (let y = 0; y < size; y++) {
    const wave = Math.sin(y * 0.085) * 0.5 + Math.sin(y * 0.21 + 1.2) * 0.3 + 0.5;
    if (y % 2 === 0) {
      ctx.fillStyle =
        destination === 'moon'
          ? `rgba(205, 214, 232, ${0.02 + wave * 0.04})`
          : `rgba(251, 152, 92, ${0.03 + wave * 0.05})`;
      ctx.fillRect(0, y, size, 2);
    }
    for (let x = 0; x < size; x++) {
      const ripple = Math.sin(y * 0.09 + Math.sin(x * 0.04) * 1.4) * 0.35;
      const grain = (Math.sin(x * 0.37 + y * 0.29) + Math.cos(x * 0.71 - y * 0.53)) * 0.15;
      heightBuf[y * size + x] = 0.5 + ripple * 0.22 + grain * 0.18;
    }
  }

  // Scattered basalt pebbles & mineral speckles
  for (let i = 0; i < 1100; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 0.8 + rand() * 4.5;
    const dark = rand() > 0.42;
    ctx.fillStyle =
      destination === 'moon'
        ? dark
          ? 'rgba(42, 48, 66, 0.3)'
          : 'rgba(226, 234, 246, 0.24)'
        : dark
          ? 'rgba(98, 32, 14, 0.28)'
          : 'rgba(253, 186, 134, 0.22)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // Stamp pebble relief into height buffer
    const ix0 = Math.max(0, Math.floor(x - r));
    const ix1 = Math.min(size - 1, Math.ceil(x + r));
    const iy0 = Math.max(0, Math.floor(y - r));
    const iy1 = Math.min(size - 1, Math.ceil(y + r));
    for (let py = iy0; py <= iy1; py++) {
      for (let px = ix0; px <= ix1; px++) {
        const d = Math.hypot(px - x, py - y) / r;
        if (d < 1) {
          heightBuf[py * size + px] += (1 - d * d) * (dark ? 0.22 : 0.14);
        }
      }
    }
  }

  // Micro impact craters with bright ejecta halos
  for (let i = 0; i < 36; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 7 + rand() * 19;
    const grad = ctx.createRadialGradient(x - r * 0.2, y - r * 0.2, r * 0.1, x, y, r);
    if (destination === 'moon') {
      grad.addColorStop(0, 'rgba(24, 30, 44, 0.42)');
      grad.addColorStop(0.72, 'rgba(65, 76, 102, 0.22)');
      grad.addColorStop(0.92, 'rgba(226, 232, 240, 0.28)');
      grad.addColorStop(1, 'rgba(226, 232, 240, 0.0)');
    } else {
      grad.addColorStop(0, 'rgba(68, 22, 10, 0.36)');
      grad.addColorStop(0.72, 'rgba(138, 52, 22, 0.18)');
      grad.addColorStop(0.92, 'rgba(253, 186, 116, 0.26)');
      grad.addColorStop(1, 'rgba(253, 186, 116, 0.0)');
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    const ix0 = Math.max(0, Math.floor(x - r));
    const ix1 = Math.min(size - 1, Math.ceil(x + r));
    const iy0 = Math.max(0, Math.floor(y - r));
    const iy1 = Math.min(size - 1, Math.ceil(y + r));
    for (let py = iy0; py <= iy1; py++) {
      for (let px = ix0; px <= ix1; px++) {
        const u = Math.hypot(px - x, py - y) / r;
        if (u < 0.78) {
          heightBuf[py * size + px] -= (1 - (u / 0.78) ** 2) * 0.34;
        } else if (u < 1.0) {
          heightBuf[py * size + px] += Math.sin(((u - 0.78) / 0.22) * Math.PI) * 0.16;
        }
      }
    }
  }

  // Derive Tangent-Space Normal Map & Roughness Map from heightBuf
  const normalData = new Uint8Array(size * size * 4);
  const roughData = new Uint8Array(size * size * 4);
  const strength = 3.2;

  for (let y = 0; y < size; y++) {
    const ym = (y - 1 + size) % size;
    const yp = (y + 1) % size;
    for (let x = 0; x < size; x++) {
      const xm = (x - 1 + size) % size;
      const xp = (x + 1) % size;

      const hL = heightBuf[y * size + xm];
      const hR = heightBuf[y * size + xp];
      const hD = heightBuf[ym * size + x];
      const hU = heightBuf[yp * size + x];

      const dx = (hL - hR) * strength;
      const dy = (hD - hU) * strength;
      const dz = 1.0;
      const len = Math.hypot(dx, dy, dz) || 1;

      const idx = (y * size + x) * 4;
      normalData[idx] = Math.round(((dx / len) * 0.5 + 0.5) * 255);
      normalData[idx + 1] = Math.round(((dy / len) * 0.5 + 0.5) * 255);
      normalData[idx + 2] = Math.round(((dz / len) * 0.5 + 0.5) * 255);
      normalData[idx + 3] = 255;

      // Raised pebbles are slightly less rough (mineral gleam), dust bowls are matte
      const hVal = heightBuf[y * size + x];
      const rVal = Math.round(THREE.MathUtils.clamp(0.94 - (hVal - 0.45) * 0.35, 0.62, 0.98) * 255);
      roughData[idx] = rVal;
      roughData[idx + 1] = rVal;
      roughData[idx + 2] = rVal;
      roughData[idx + 3] = 255;
    }
  }

  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  const map = new THREE.CanvasTexture(colorCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(8, 8);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = maxAniso;

  const normalMap = new THREE.DataTexture(normalData, size, size, THREE.RGBAFormat);
  normalMap.wrapS = THREE.RepeatWrapping;
  normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.set(8, 8);
  normalMap.anisotropy = maxAniso;
  normalMap.needsUpdate = true;

  const roughnessMap = new THREE.DataTexture(roughData, size, size, THREE.RGBAFormat);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(8, 8);
  roughnessMap.anisotropy = maxAniso;
  roughnessMap.needsUpdate = true;

  return { map, normalMap, roughnessMap };
}

/** Procedural metallic space-station deck tile texture with panel bevels & grip texture */
export function createMetalDeckTexture(renderer: THREE.WebGLRenderer): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#271A45');
  grad.addColorStop(1, '#1E1338');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Outer panel seam & highlight bevel
  ctx.strokeStyle = '#533587';
  ctx.lineWidth = 3;
  ctx.strokeRect(2, 2, size - 4, size - 4);

  ctx.strokeStyle = '#382263';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(size / 2, 0);
  ctx.lineTo(size / 2, size);
  ctx.moveTo(0, size / 2);
  ctx.lineTo(size, size / 2);
  ctx.stroke();

  // Anti-slip diamond tread dots
  ctx.fillStyle = 'rgba(148, 163, 184, 0.16)';
  for (let gx = 24; gx < size; gx += 32) {
    for (let gy = 24; gy < size; gy += 32) {
      ctx.fillRect(gx - 2, gy - 1, 4, 2);
    }
  }

  // Corner titanium bolts
  ctx.fillStyle = '#94A3B8';
  for (const bx of [12, size - 12]) {
    for (const by of [12, size - 12]) {
      ctx.beginPath();
      ctx.arc(bx, by, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Subtle floor accent stripe
  ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
  ctx.fillRect(24, size / 2 - 4, size - 48, 8);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(14, 10);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

/** Procedural photovoltaic solar cell grid texture */
export function createSolarPanelTexture(renderer: THREE.WebGLRenderer): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#072240';
  ctx.fillRect(0, 0, size, size);

  const cols = 4;
  const rows = 6;
  const cellW = size / cols;
  const cellH = size / rows;
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const cellGrad = ctx.createLinearGradient(c * cellW, r * cellH, (c + 1) * cellW, (r + 1) * cellH);
      cellGrad.addColorStop(0, '#0C3D70');
      cellGrad.addColorStop(1, '#125396');
      ctx.fillStyle = cellGrad;
      ctx.fillRect(c * cellW + 4, r * cellH + 4, cellW - 8, cellH - 8);
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1;
      ctx.strokeRect(c * cellW + 4, r * cellH + 4, cellW - 8, cellH - 8);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

/** Procedural soft radial ground contact shadow texture */
export function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 4, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.76)');
  grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.36)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Safely dispose all geometries, materials, and textures in an Object3D tree */
export function disposeObject3D(root: THREE.Object3D) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }
    const mat = mesh.material;
    if (Array.isArray(mat)) {
      mat.forEach((m) => disposeMaterial(m));
    } else if (mat) {
      disposeMaterial(mat);
    }
  });
}

function disposeMaterial(mat: THREE.Material) {
  const std = mat as THREE.MeshStandardMaterial;
  if (std.map) std.map.dispose();
  if (std.normalMap) std.normalMap.dispose();
  if (std.bumpMap) std.bumpMap.dispose();
  if (std.roughnessMap) std.roughnessMap.dispose();
  if (std.emissiveMap) std.emissiveMap.dispose();
  mat.dispose();
}
