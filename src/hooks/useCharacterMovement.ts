import { useCallback, useEffect, useRef, useState } from 'react';
import { Vec2 } from '../types/game';
import { soundEngine } from '../utils/soundEngine';

interface MovementBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface CircleObstacle {
  x: number;
  y: number;
  r: number;
}

export interface RectWallCollider {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

interface UseCharacterMovementOptions {
  initialPos?: Vec2;
  bounds?: MovementBounds;
  speed?: number; // percentage units per second
  paused?: boolean;
  obstacles?: CircleObstacle[];
  walls?: RectWallCollider[];
}

export function useCharacterMovement({
  initialPos = { x: 16, y: 58 },
  bounds = { minX: 7, maxX: 93, minY: 22, maxY: 86 },
  speed = 28,
  paused = false,
  obstacles = [],
  walls = [],
}: UseCharacterMovementOptions = {}) {
  const [pos, setPos] = useState<Vec2>(initialPos);
  const [astroPos, setAstroPos] = useState<Vec2>({
    x: Math.min(bounds.maxX, Math.max(bounds.minX, initialPos.x + (initialPos.x > 50 ? -3.8 : 3.8))),
    y: Math.max(bounds.minY - 2, initialPos.y - 2.5),
  });
  const [facing, setFacing] = useState<'left' | 'right'>('right');
  const [isMoving, setIsMoving] = useState(false);

  const posRef = useRef<Vec2>(initialPos);
  const astroRef = useRef<Vec2>({
    x: Math.min(bounds.maxX, Math.max(bounds.minX, initialPos.x + (initialPos.x > 50 ? -3.8 : 3.8))),
    y: Math.max(bounds.minY - 2, initialPos.y - 2.5),
  });
  const targetRef = useRef<Vec2 | null>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const dpadRef = useRef<Vec2>({ x: 0, y: 0 });
  const lastStepAt = useRef<number>(0);
  const obstaclesRef = useRef(obstacles);
  const wallsRef = useRef(walls);
  obstaclesRef.current = obstacles;
  wallsRef.current = walls;

  const setClickTarget = useCallback(
    (xPct: number, yPct: number) => {
      if (paused) return;
      const clampedX = Math.min(bounds.maxX, Math.max(bounds.minX, xPct));
      const clampedY = Math.min(bounds.maxY, Math.max(bounds.minY, yPct));
      targetRef.current = { x: clampedX, y: clampedY };
    },
    [bounds.maxX, bounds.maxY, bounds.minX, bounds.minY, paused]
  );

  const setDpadDir = useCallback((dx: number, dy: number) => {
    dpadRef.current = { x: dx, y: dy };
    if (dx !== 0 || dy !== 0) targetRef.current = null;
  }, []);

  const stopDpad = useCallback(() => {
    dpadRef.current = { x: 0, y: 0 };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (paused) return;
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        keysRef.current.add(key);
        targetRef.current = null;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [paused]);

  useEffect(() => {
    let frameId: number;
    let lastTime = performance.now();

    const resolveCollisions = (nx: number, ny: number): Vec2 => {
      let rx = Math.min(bounds.maxX, Math.max(bounds.minX, nx));
      let ry = Math.min(bounds.maxY, Math.max(bounds.minY, ny));

      // Circular prop collision push-out (keeps physical space around 3D objects)
      for (const obs of obstaclesRef.current) {
        const dx = rx - obs.x;
        const dy = ry - obs.y;
        const dist = Math.hypot(dx, dy);
        if (dist < obs.r) {
          const push = obs.r / (dist || 0.05);
          rx = obs.x + dx * push;
          ry = obs.y + dy * push;
        }
      }

      // Rectangular structural walls (e.g. Habitat airlock divider with open doorway)
      for (const w of wallsRef.current) {
        if (rx > w.minX && rx < w.maxX && ry > w.minY && ry < w.maxY) {
          const dLeft = Math.abs(rx - w.minX);
          const dRight = Math.abs(w.maxX - rx);
          const dTop = Math.abs(ry - w.minY);
          const dBottom = Math.abs(w.maxY - ry);
          const minD = Math.min(dLeft, dRight, dTop, dBottom);
          if (minD === dLeft) rx = w.minX;
          else if (minD === dRight) rx = w.maxX;
          else if (minD === dTop) ry = w.minY;
          else ry = w.maxY;
        }
      }

      rx = Math.min(bounds.maxX, Math.max(bounds.minX, rx));
      ry = Math.min(bounds.maxY, Math.max(bounds.minY, ry));
      return { x: rx, y: ry };
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      if (!paused) {
        let vx = dpadRef.current.x;
        let vy = dpadRef.current.y;

        if (keysRef.current.has('a') || keysRef.current.has('arrowleft')) vx -= 1;
        if (keysRef.current.has('d') || keysRef.current.has('arrowright')) vx += 1;
        if (keysRef.current.has('w') || keysRef.current.has('arrowup')) vy -= 1;
        if (keysRef.current.has('s') || keysRef.current.has('arrowdown')) vy += 1;

        let moving = false;

        if (vx !== 0 || vy !== 0) {
          const len = Math.hypot(vx, vy) || 1;
          vx /= len;
          vy /= len;
          const next = resolveCollisions(
            posRef.current.x + vx * speed * dt,
            posRef.current.y + vy * speed * dt
          );
          posRef.current = next;
          if (vx < -0.1) setFacing('left');
          if (vx > 0.1) setFacing('right');
          moving = true;
        } else if (targetRef.current) {
          const dx = targetRef.current.x - posRef.current.x;
          const dy = targetRef.current.y - posRef.current.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 1.2) {
            targetRef.current = null;
          } else {
            const step = Math.min(dist, speed * dt);
            const next = resolveCollisions(
              posRef.current.x + (dx / dist) * step,
              posRef.current.y + (dy / dist) * step
            );
            // Stop auto-walk if pushed against a solid wall with zero progress
            if (Math.hypot(next.x - posRef.current.x, next.y - posRef.current.y) < 0.02) {
              targetRef.current = null;
            } else {
              posRef.current = next;
              if (dx < -0.4) setFacing('left');
              if (dx > 0.4) setFacing('right');
              moving = true;
            }
          }
        }

        if (moving && now - lastStepAt.current > 290) {
          lastStepAt.current = now;
          soundEngine.playStep();
        }

        setPos(posRef.current);
        setIsMoving(moving);

        // ASTRO smoothly trails right beside the Commander so both stay clearly in close-up frame
        const desiredAstroX = Math.min(
          bounds.maxX,
          Math.max(bounds.minX, posRef.current.x + (posRef.current.x > 50 ? -3.8 : 3.8))
        );
        const desiredAstroY = Math.max(bounds.minY - 2, posRef.current.y - 2.5);
        const adx = desiredAstroX - astroRef.current.x;
        const ady = desiredAstroY - astroRef.current.y;
        astroRef.current = {
          x: astroRef.current.x + adx * Math.min(1, dt * 4.2),
          y: astroRef.current.y + ady * Math.min(1, dt * 4.2),
        };
        setAstroPos(astroRef.current);
      } else {
        setIsMoving(false);
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [bounds.maxX, bounds.maxY, bounds.minX, bounds.minY, paused, speed]);

  return {
    pos,
    astroPos,
    facing,
    isMoving,
    clickTarget: targetRef.current,
    setClickTarget,
    setDpadDir,
    stopDpad,
  };
}
