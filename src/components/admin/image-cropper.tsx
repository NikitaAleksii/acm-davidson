"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";

type Props = {
  file: File;
  /** width / height of the crop frame, e.g. 16/9 for covers, 4/5 for portraits */
  aspect: number;
  onDone: (cropped: File) => void;
  onUseOriginal: () => void;
  onCancel: () => void;
};

const OUTPUT_WIDTH = 1600; // px; plenty for a 3-column grid and full-width covers

/**
 * Simple drag-and-zoom cropper with a fixed aspect ratio. No dependencies.
 * Drag with mouse or finger, zoom with the slider or a scroll wheel, nudge
 * with arrow keys. "Crop & upload" exports a JPEG sized OUTPUT_WIDTH wide.
 */
export function ImageCropper({ file, aspect, onDone, onUseOriginal, onCancel }: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [src] = useState(() => URL.createObjectURL(file));
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [frame, setFrame] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1); // 1 = image just covers the frame
  const [offset, setOffset] = useState({ x: 0, y: 0 }); // top-left of image within frame, px
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => () => URL.revokeObjectURL(src), [src]);

  // Measure the frame (it is width-responsive).
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      setFrame({ w, h: Math.round(w / aspect) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [aspect]);

  const base = natural && frame.w ? Math.max(frame.w / natural.w, frame.h / natural.h) : 1;
  const scale = base * zoom;
  const drawnW = natural ? natural.w * scale : 0;
  const drawnH = natural ? natural.h * scale : 0;

  function clamp(o: { x: number; y: number }) {
    return {
      x: Math.min(0, Math.max(frame.w - drawnW, o.x)),
      y: Math.min(0, Math.max(frame.h - drawnH, o.y)),
    };
  }

  // Keep the image centred/clamped whenever geometry changes.
  useEffect(() => {
    if (!natural || !frame.w) return;
    setOffset((o) => clamp(o.x === 0 && o.y === 0 ? { x: (frame.w - drawnW) / 2, y: (frame.h - drawnH) / 2 } : o));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [natural, frame.w, frame.h, zoom]);

  function setZoomKeepingCentre(next: number) {
    const z = Math.min(4, Math.max(1, next));
    if (!natural) return setZoom(z);
    // Zoom around the centre of the frame.
    const cx = frame.w / 2;
    const cy = frame.h / 2;
    const ratio = (base * z) / scale;
    setOffset((o) => clamp({ x: cx - (cx - o.x) * ratio, y: cy - (cy - o.y) * ratio }));
    setZoom(z);
  }

  function onPointerDown(e: React.PointerEvent) {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current) return;
    const d = drag.current;
    setOffset(clamp({ x: d.ox + (e.clientX - d.x), y: d.oy + (e.clientY - d.y) }));
  }
  function onPointerUp() {
    drag.current = null;
  }
  function onKeyDown(e: React.KeyboardEvent) {
    const step = e.shiftKey ? 20 : 5;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [step, 0],
      ArrowRight: [-step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    };
    if (moves[e.key]) {
      e.preventDefault();
      const [dx, dy] = moves[e.key];
      setOffset((o) => clamp({ x: o.x + dx, y: o.y + dy }));
    } else if (e.key === "+" || e.key === "=") {
      setZoomKeepingCentre(zoom + 0.1);
    } else if (e.key === "-") {
      setZoomKeepingCentre(zoom - 0.1);
    }
  }

  async function exportCrop() {
    const img = imgRef.current;
    if (!img || !natural) return;
    setBusy(true);
    try {
      const outW = Math.min(OUTPUT_WIDTH, Math.round(frame.w / scale));
      const outH = Math.round(outW / aspect);
      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d")!;
      // Visible region of the source image, in source pixels.
      const sx = -offset.x / scale;
      const sy = -offset.y / scale;
      const sw = frame.w / scale;
      const sh = frame.h / scale;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.9));
      if (!blob) throw new Error("Could not export image");
      const name = file.name.replace(/\.[^.]+$/, "") + "-cropped.jpg";
      onDone(new File([blob], name, { type: "image/jpeg" }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Crop image"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
    >
      <div className="w-full max-w-2xl rounded-xl border border-default bg-card p-5 shadow-xl">
        <h2 className="font-display text-lg font-bold">Crop image</h2>
        <p className="mb-3 text-sm text-muted">
          Drag to reposition, use the slider to zoom. The frame is what visitors will see.
        </p>

        <div
          ref={frameRef}
          tabIndex={0}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={(e) => {
            e.preventDefault();
            setZoomKeepingCentre(zoom - e.deltaY * 0.002);
          }}
          style={{ height: frame.h || undefined, touchAction: "none" }}
          className="relative w-full cursor-grab select-none overflow-hidden rounded-md bg-black outline-none ring-brand-600 focus-visible:ring-2 active:cursor-grabbing"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={src}
            alt=""
            draggable={false}
            onLoad={(e) => setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
            style={{
              position: "absolute",
              left: offset.x,
              top: offset.y,
              width: drawnW || undefined,
              height: drawnH || undefined,
              maxWidth: "none",
            }}
          />
          {/* rule-of-thirds guide */}
          <div aria-hidden className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="border border-white/20" />
            ))}
          </div>
        </div>

        <label className="mt-4 flex items-center gap-3 text-sm">
          <span className="w-12 shrink-0">Zoom</span>
          <input
            type="range"
            min={1}
            max={4}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoomKeepingCentre(Number(e.target.value))}
            className="w-full accent-brand-600"
            aria-label="Zoom"
          />
        </label>

        <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button type="button" variant="secondary" onClick={onUseOriginal} disabled={busy}>
            Use original
          </Button>
          <Button type="button" onClick={exportCrop} disabled={busy || !natural}>
            {busy ? "Preparing…" : "Crop & upload"}
          </Button>
        </div>
      </div>
    </div>
  );
}
