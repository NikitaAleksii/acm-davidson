"use client";

import { useEffect, useRef } from "react";

type Blob = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  hue: number;
  alpha: number;
};

/**
 * Soft floating blobs behind the hero. They drift on their own and are pushed
 * around by the cursor (or a touch). Honors prefers-reduced-motion by rendering
 * a static frame. Purely decorative: aria-hidden, no pointer capture.
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
    let dpr = 1;
    let raf = 0;
    const pointer = { x: -9999, y: -9999, active: false };
    const blobs: Blob[] = [];

    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas!.width = Math.floor(width * dpr);
      canvas!.height = Math.floor(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (blobs.length === 0) {
        for (let i = 0; i < count; i++) {
          blobs.push({
            x: rand(0, width),
            y: rand(0, height),
            vx: rand(-0.25, 0.25),
            vy: rand(-0.25, 0.25),
            r: rand(Math.min(width, height) * 0.12, Math.min(width, height) * 0.28),
            hue: rand(345, 358),
            alpha: rand(0.45, 0.7),
          });
        }
      }
    }

    function step() {
      ctx!.clearRect(0, 0, width, height);
      ctx!.globalCompositeOperation = "lighter";
      for (const b of blobs) {
        if (!reduceMotion) {
          // Cursor repulsion: blobs glide away from the pointer.
          if (pointer.active) {
            const dx = b.x - pointer.x;
            const dy = b.y - pointer.y;
            const dist = Math.hypot(dx, dy) || 1;
            const reach = b.r + 160;
            if (dist < reach) {
              const force = ((reach - dist) / reach) * 0.9;
              b.vx += (dx / dist) * force;
              b.vy += (dy / dist) * force;
            }
          }
          b.x += b.vx;
          b.y += b.vy;
          // Gentle friction so pushes settle back into a drift.
          b.vx *= 0.97;
          b.vy *= 0.97;
          const minSpeed = 0.12;
          const speed = Math.hypot(b.vx, b.vy);
          if (speed < minSpeed) {
            const ang = Math.atan2(b.vy, b.vx) + rand(-0.4, 0.4);
            b.vx = Math.cos(ang) * minSpeed;
            b.vy = Math.sin(ang) * minSpeed;
          }
          // Wrap around the edges.
          if (b.x < -b.r) b.x = width + b.r;
          if (b.x > width + b.r) b.x = -b.r;
          if (b.y < -b.r) b.y = height + b.r;
          if (b.y > height + b.r) b.y = -b.r;
        }
        const g = ctx!.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        g.addColorStop(0, `hsla(${b.hue}, 85%, 45%, ${b.alpha})`);
        g.addColorStop(0.6, `hsla(${b.hue}, 85%, 40%, ${b.alpha * 0.35})`);
        g.addColorStop(1, `hsla(${b.hue}, 85%, 35%, 0)`);
        ctx!.fillStyle = g;
        ctx!.beginPath();
        ctx!.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.globalCompositeOperation = "source-over";
      if (!reduceMotion) raf = requestAnimationFrame(step);
    }

    const parent = canvas.parentElement ?? canvas;
    function toLocal(clientX: number, clientY: number) {
      const rect = canvas!.getBoundingClientRect();
      pointer.x = clientX - rect.left;
      pointer.y = clientY - rect.top;
      pointer.active = true;
    }
    const onMove = (e: PointerEvent) => toLocal(e.clientX, e.clientY);
    const onLeave = () => {
      pointer.active = false;
    };
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) toLocal(t.clientX, t.clientY);
    };

    resize();
    step();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    parent.addEventListener("pointermove", onMove);
    parent.addEventListener("pointerleave", onLeave);
    parent.addEventListener("touchmove", onTouch, { passive: true });
    parent.addEventListener("touchend", onLeave);

    // Pause when the tab is hidden to save battery.
    const onVisibility = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else if (!reduceMotion) raf = requestAnimationFrame(step);
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      parent.removeEventListener("pointermove", onMove);
      parent.removeEventListener("pointerleave", onLeave);
      parent.removeEventListener("touchmove", onTouch);
      parent.removeEventListener("touchend", onLeave);
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
