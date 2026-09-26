"use client";

import { useEffect, useRef } from "react";

type Blob = {
  hx: number; // home position (fraction of width/height, so it survives resizes)
  hy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number; // radius as a fraction of min(width, height)
  hue: number;
  alpha: number;
  phase: number; // for the gentle idle wander
  speed: number;
};

// Tuning knobs. Everything is per-frame at ~60fps and scaled by dt otherwise.
const SPRING = 0.0045; // pull back toward home
const DAMPING = 0.9; // velocity retained each frame (lower = smoother, less bouncy)
const REPEL_STRENGTH = 1.1; // cursor push
const REPEL_REACH = 170; // px beyond the blob's edge where the cursor still pushes
const WANDER = 0.035; // idle drift radius, as a fraction of min(width, height)
const POINTER_EASE = 0.14; // how quickly the effective cursor position follows the real one

/**
 * Soft floating blobs behind the hero. Each blob drifts gently around a home
 * position, gets pushed away by the cursor (or a touch), and springs back to
 * where it started once the cursor leaves. Honors prefers-reduced-motion by
 * rendering a single static frame. Decorative only: aria-hidden, no pointer
 * capture.
 */
export function HeroBlobs({ count = 7 }: { count?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let raf = 0;
    let last = performance.now();
    let t = 0;
    // Real pointer and the eased pointer the physics actually uses.
    const target = { x: -9999, y: -9999, active: false };
    const pointer = { x: -9999, y: -9999, strength: 0 };
    const blobs: Blob[] = [];
    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    // Seeded home positions spread across the hero.
    for (let i = 0; i < count; i++) {
      const hx = rand(0.05, 0.95);
      const hy = rand(0.1, 0.9);
      blobs.push({
        hx,
        hy,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        r: rand(0.14, 0.3),
        hue: rand(345, 358),
        alpha: rand(0.45, 0.7),
        phase: rand(0, Math.PI * 2),
        speed: rand(0.25, 0.5),
      });
    }

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const first = width === 0;
      width = rect.width;
      height = rect.height;
      canvas!.width = Math.floor(width * dpr);
      canvas!.height = Math.floor(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (first) {
        for (const b of blobs) {
          b.x = b.hx * width;
          b.y = b.hy * height;
        }
      }
    }

    function step(now: number) {
      // Normalise to 60fps so speed doesn't depend on refresh rate.
      const dt = Math.min((now - last) / (1000 / 60), 3);
      last = now;
      t += dt / 60;
      const base = Math.min(width, height);

      if (!reduceMotion) {
        // Ease the pointer toward its real position, and fade its influence in/out.
        const strengthTarget = target.active ? 1 : 0;
        pointer.strength += (strengthTarget - pointer.strength) * POINTER_EASE * dt;
        if (target.active) {
          if (pointer.x < -9000) {
            pointer.x = target.x;
            pointer.y = target.y;
          }
          pointer.x += (target.x - pointer.x) * POINTER_EASE * dt;
          pointer.y += (target.y - pointer.y) * POINTER_EASE * dt;
        }

        for (const b of blobs) {
          const r = b.r * base;
          // Idle wander: slow figure-eight around home.
          const wx = b.hx * width + Math.cos(t * b.speed + b.phase) * WANDER * base;
          const wy = b.hy * height + Math.sin(t * b.speed * 0.8 + b.phase * 1.3) * WANDER * base;
          let ax = (wx - b.x) * SPRING;
          let ay = (wy - b.y) * SPRING;

          if (pointer.strength > 0.01) {
            const dx = b.x - pointer.x;
            const dy = b.y - pointer.y;
            const dist = Math.hypot(dx, dy) || 1;
            const reach = r + REPEL_REACH;
            if (dist < reach) {
              const k = 1 - dist / reach;
              const force = k * k * REPEL_STRENGTH * pointer.strength;
              ax += (dx / dist) * force;
              ay += (dy / dist) * force;
            }
          }

          b.vx = (b.vx + ax * dt) * Math.pow(DAMPING, dt);
          b.vy = (b.vy + ay * dt) * Math.pow(DAMPING, dt);
          b.x += b.vx * dt;
          b.y += b.vy * dt;
        }
      }

      ctx!.clearRect(0, 0, width, height);
      ctx!.globalCompositeOperation = "lighter";
      for (const b of blobs) {
        const r = b.r * base;
        const g = ctx!.createRadialGradient(b.x, b.y, 0, b.x, b.y, r);
        g.addColorStop(0, `hsla(${b.hue}, 85%, 45%, ${b.alpha})`);
        g.addColorStop(0.6, `hsla(${b.hue}, 85%, 40%, ${b.alpha * 0.35})`);
        g.addColorStop(1, `hsla(${b.hue}, 85%, 35%, 0)`);
        ctx!.fillStyle = g;
        ctx!.beginPath();
        ctx!.arc(b.x, b.y, r, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.globalCompositeOperation = "source-over";
      if (!reduceMotion) raf = requestAnimationFrame(step);
    }

    const parent = canvas.parentElement ?? canvas;
    function toLocal(clientX: number, clientY: number) {
      const rect = canvas!.getBoundingClientRect();
      target.x = clientX - rect.left;
      target.y = clientY - rect.top;
      target.active = true;
    }
    let release = 0;
    const onMove = (e: PointerEvent) => {
      clearTimeout(release);
      toLocal(e.clientX, e.clientY);
    };
    const onLeave = () => {
      target.active = false;
    };
    const onTouch = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      clearTimeout(release);
      toLocal(touch.clientX, touch.clientY);
    };
    // A tap has no "leave": keep pushing for a moment, then let the blobs drift home.
    const onTouchEnd = () => {
      clearTimeout(release);
      release = window.setTimeout(onLeave, 700);
    };

    resize();
    raf = requestAnimationFrame(step);
    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    parent.addEventListener("pointermove", onMove);
    parent.addEventListener("pointerleave", onLeave);
    parent.addEventListener("touchstart", onTouch, { passive: true });
    parent.addEventListener("touchmove", onTouch, { passive: true });
    parent.addEventListener("touchend", onTouchEnd);
    parent.addEventListener("touchcancel", onTouchEnd);

    const onVisibility = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else if (!reduceMotion) {
        last = performance.now();
        raf = requestAnimationFrame(step);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      parent.removeEventListener("pointermove", onMove);
      parent.removeEventListener("pointerleave", onLeave);
      parent.removeEventListener("touchstart", onTouch);
      parent.removeEventListener("touchmove", onTouch);
      parent.removeEventListener("touchend", onTouchEnd);
      parent.removeEventListener("touchcancel", onTouchEnd);
      clearTimeout(release);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ filter: "blur(18px)" }}
    />
  );
}
