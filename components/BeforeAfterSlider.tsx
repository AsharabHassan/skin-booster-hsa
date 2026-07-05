"use client";

import { useCallback, useRef, useState } from "react";

export default function BeforeAfterSlider({
  before,
  after,
}: {
  before: string;
  after: string;
}) {
  const [pos, setPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const move = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, pct)));
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative aspect-square w-full select-none overflow-hidden rounded-[1.6rem] border border-white/70 bg-pearl-deep shadow-dew"
      onMouseMove={(e) => dragging.current && move(e.clientX)}
      onMouseUp={() => (dragging.current = false)}
      onMouseLeave={() => (dragging.current = false)}
      onTouchMove={(e) => move(e.touches[0].clientX)}
    >
      {/* After (full background) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={after}
        alt="Simulated result"
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />
      {/* Before (clipped overlay) */}
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={before}
          alt="Your photo"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ width: `${(100 / pos) * 100}%`, maxWidth: "none" }}
          draggable={false}
        />
        <span className="absolute left-3 top-3 rounded-full border border-white/50 bg-white/70 px-3 py-1 text-[0.6rem] uppercase tracking-[0.2em] text-plum backdrop-blur">
          Before
        </span>
      </div>
      <span className="absolute right-3 top-3 rounded-full border border-white/40 bg-gradient-to-r from-serum to-amber px-3 py-1 text-[0.6rem] uppercase tracking-[0.2em] text-white shadow-dew">
        Veluria
      </span>

      {/* Handle */}
      <div
        className="absolute top-0 h-full w-0.5 bg-white/90 shadow-[0_0_14px_rgba(201,162,39,0.7)]"
        style={{ left: `${pos}%` }}
      >
        <button
          type="button"
          aria-label="Drag to compare"
          onMouseDown={() => (dragging.current = true)}
          onTouchStart={() => (dragging.current = true)}
          className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full border border-white/80 bg-gradient-to-br from-serum to-amber text-white shadow-dew"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M9 7l-5 5 5 5M15 7l5 5-5 5" />
          </svg>
        </button>
      </div>
    </div>
  );
}
