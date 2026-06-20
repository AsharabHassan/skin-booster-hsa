"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { SkinAnalysis } from "@/lib/types";
import AnnotatedFace from "./AnnotatedFace";
import BeforeAfterSlider from "./BeforeAfterSlider";
import AfterCallouts from "./AfterCallouts";
import { expectedImprovement } from "@/lib/expectations";
import {
  composeBeforeAfter,
  downloadAnalysisPdf,
  downloadDataUrl,
} from "@/lib/download";

const BOOKING_URL =
  process.env.NEXT_PUBLIC_BOOKING_URL ?? "https://sironaaesthetics.co.uk";

const PREVIEW_STEPS = [
  "Reading your skin map…",
  "Applying a realistic Veluria outcome…",
  "Refining tone, texture & hydration…",
  "Finishing your before & after…",
];

function PreviewLoader({ before }: { before: string }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const pct = Math.min(95, Math.round(100 * (1 - Math.exp(-elapsed / 22))));
  const step =
    PREVIEW_STEPS[Math.min(Math.floor(elapsed / 14), PREVIEW_STEPS.length - 1)];

  return (
    <div className="relative aspect-[3/2] overflow-hidden rounded-[1.6rem] border border-white/70 bg-pearl-deep shadow-dew">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={before}
        alt="Your photo"
        className="h-full w-full scale-105 object-cover blur-md brightness-95"
      />
      <div className="absolute inset-x-0 top-0 h-px animate-sheen bg-gradient-to-r from-transparent via-serum to-transparent" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-white/30 px-8 text-center backdrop-blur-sm">
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 rounded-full border border-plum/15" />
          <div className="absolute inset-0 animate-[spin_3s_linear_infinite] rounded-full border-2 border-transparent border-t-serum" />
        </div>
        <p className="text-sm tracking-wide text-plum">{step}</p>
        <div className="w-full max-w-xs">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/70">
            <div
              className="h-full rounded-full bg-gradient-to-r from-serum to-amber transition-all duration-1000 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 text-[0.65rem] uppercase tracking-[0.15em] text-plum-soft">
            {pct}% · {elapsed}s
          </p>
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/70">
      <div
        className="h-full rounded-full bg-gradient-to-r from-[#0e7d8c] via-serum to-amber transition-all duration-700"
        style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
      />
    </div>
  );
}

function SectionHead({
  index,
  eyebrow,
  title,
}: {
  index: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="mb-6 flex items-end gap-4">
      <span className="font-display text-4xl leading-none text-serum/40">{index}</span>
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h3 className="display text-2xl text-plum sm:text-3xl">{title}</h3>
      </div>
    </div>
  );
}

function StickyPreviewBar({
  afterPending,
  after,
  previewRef,
}: {
  afterPending: boolean;
  after: string | null;
  previewRef: React.RefObject<HTMLElement | null>;
}) {
  const [scrolledPast, setScrolledPast] = useState(false);

  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setScrolledPast(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [previewRef]);

  const scrollToPreview = () => {
    previewRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (!scrolledPast) return null;

  return (
    <div className="no-print fixed bottom-4 inset-x-0 z-40 flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-white/70 bg-white/80 px-5 py-3 backdrop-blur-xl shadow-[0_8px_32px_-10px_rgba(34,30,82,0.35)]">
        {afterPending ? (
          <>
            <span className="h-4 w-4 shrink-0 animate-[spin_1.5s_linear_infinite] rounded-full border-2 border-plum/20 border-t-serum" />
            <span className="text-sm text-plum">Generating your before &amp; after…</span>
          </>
        ) : after ? (
          <>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-serum">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
              <path d="M5 8.5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-sm font-medium text-plum">Your before &amp; after is ready</span>
            <button
              onClick={scrollToPreview}
              className="ml-1 rounded-full bg-gradient-to-r from-serum to-amber px-4 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-white shadow-sm transition hover:opacity-90"
            >
              View ↑
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default function AnalysisReport({
  before,
  after,
  afterPending,
  mapImage,
  mapPending,
  analysis,
  onRestart,
}: {
  before: string;
  after: string | null;
  afterPending: boolean;
  mapImage: string | null;
  mapPending: boolean;
  analysis: SkinAnalysis;
  onRestart: () => void;
}) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [mounted, setMounted] = useState(false);
  const previewRef = useRef<HTMLElement>(null);

  useEffect(() => setMounted(true), []);

  const handlePdf = async () => {
    setPdfBusy(true);
    try {
      await downloadAnalysisPdf({ analysis, before, after, map: mapImage });
    } finally {
      setPdfBusy(false);
    }
  };

  // The "before" is the real selfie and "after" is generated separately; for a
  // downloadable artifact we stitch them into one labelled side-by-side image.
  const handleDownloadBeforeAfter = async () => {
    if (!after) return;
    const composite = await composeBeforeAfter(before, after);
    downloadDataUrl(composite, "veluria-before-after.png");
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-14 pb-24">
      <div className="text-center animate-fade-scale">
        <p className="eyebrow">Your Consultation</p>
        <h2 className="display mt-4 text-4xl text-plum sm:text-6xl">
          The skin you&rsquo;re <span className="serum-text italic">meant to have</span>
        </h2>
      </div>

      {/* Before / After */}
      <section ref={previewRef} className="animate-fade-scale" style={{ animationDelay: "80ms" }}>
        <SectionHead index="01" eyebrow="Before & After" title="Your Veluria preview" />
        {after ? (
          <div className="relative liquid-reveal">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/cinematic/leader-lines-left.png"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -left-28 top-8 z-10 hidden h-3/4 w-1/2 object-contain opacity-25 mix-blend-screen sm:block"
              draggable={false}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/cinematic/leader-lines-right.png"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -right-28 top-8 z-10 hidden h-3/4 w-1/2 object-contain opacity-25 mix-blend-screen sm:block"
              draggable={false}
            />
            <div className="relative z-0 animate-reveal-blur">
              <AfterCallouts
                annotations={analysis.annotations}
                categories={analysis.categories}
              >
                <BeforeAfterSlider before={before} after={after} />
              </AfterCallouts>
            </div>
            <div className="sheen-line rounded-[1.6rem]" />
          </div>
        ) : afterPending ? (
          <PreviewLoader before={before} />
        ) : (
          <div className="overflow-hidden rounded-[1.6rem] border border-white/70">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={before} alt="Your photo" className="w-full" />
            <p className="bg-white/70 p-3 text-center text-xs text-plum-soft">
              We couldn&rsquo;t render your visual preview this time — your full
              analysis is below.
            </p>
          </div>
        )}
        <p className="mt-4 text-center text-xs italic text-plum-mute">
          AI-simulated illustration of a possible outcome. Individual results vary
          and are not guaranteed. Not medical advice.
        </p>
      </section>

      {/* Assessment map */}
      {(analysis.annotations?.length > 0 || mapPending || mapImage) && (
        <section className="animate-fade-scale" style={{ animationDelay: "120ms" }}>
          <SectionHead
            index="02"
            eyebrow="Where Veluria Works"
            title="Your treatment map"
          />
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/cinematic/face-zone-hairline.png"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -left-16 -top-20 hidden h-80 w-80 object-contain opacity-20 mix-blend-screen sm:block"
              draggable={false}
            />
            <AnnotatedFace
              image={after ?? before}
              annotations={analysis.annotations}
              mapImage={mapImage}
              mapPending={mapPending}
              onOpen={(src) => setLightbox(src)}
            />
          </div>
          <p className="mt-4 text-center text-xs italic text-plum-mute">
            Markers show the areas Veluria targets, drawn on your simulated
            result. AI-estimated for guidance only — not a clinical diagnosis.
            A consultation confirms the right plan for you.
          </p>
        </section>
      )}

      {/* Written analysis */}
      <section className="animate-fade-scale" style={{ animationDelay: "160ms" }}>
        <SectionHead index="03" eyebrow="In-Depth Analysis" title="What we see" />
        <div className="glass p-6 sm:p-8">
          <p className="leading-relaxed text-plum">{analysis.summary}</p>
          <div className="my-6 hairline" />
          <div className="space-y-5">
            {analysis.categories.map((c) => {
              const expected = expectedImprovement(c);
              return (
                <div key={c.label}>
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <span className="text-sm font-medium text-plum">{c.label}</span>
                    <span className="font-display text-lg text-serum">{c.score}</span>
                  </div>
                  <ScoreBar score={c.score} />
                  <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <p className="text-xs text-plum-soft">{c.note}</p>
                    {expected && (
                      <span className="whitespace-nowrap rounded-full bg-serum/10 px-2.5 py-0.5 text-[0.7rem] font-medium text-[#0e7d8c]">
                        {expected.kind === "softened"
                          ? `Lines ${expected.label}`
                          : `Expected ${expected.label}`}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Veluria recommendation */}
      <section className="animate-fade-scale" style={{ animationDelay: "200ms" }}>
        <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-gradient-to-br from-peach/60 via-rose/40 to-amber/40 p-8 shadow-dew sm:p-10">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 animate-blob-morph bg-white/40 blur-2xl" />
          <p className="eyebrow">The Recommendation</p>
          <h3 className="display mt-3 text-3xl text-plum">How Veluria could help</h3>
          <p className="mt-4 leading-relaxed text-plum">
            {analysis.veluriaRecommendation}
          </p>
        </div>
      </section>

      {/* Save / open your analysis */}
      <section className="no-print animate-fade-scale" style={{ animationDelay: "220ms" }}>
        <div className="glass p-6 text-center sm:p-7">
          <p className="eyebrow">Keep your analysis</p>
          <h3 className="display mt-2 text-2xl text-plum">Open or download your report</h3>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button onClick={handlePdf} disabled={pdfBusy} className="btn-serum">
              {pdfBusy ? "Preparing PDF…" : "Download PDF"}
            </button>
            <button onClick={() => window.print()} className="btn-ghost">
              Open / print report
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-plum-soft">
            {after && (
              <button
                onClick={handleDownloadBeforeAfter}
                className="underline-offset-4 transition hover:text-plum hover:underline"
              >
                ↓ Before/After image
              </button>
            )}
            {mapImage && (
              <button
                onClick={() => downloadDataUrl(mapImage, "skin-assessment-map.png")}
                className="underline-offset-4 transition hover:text-plum hover:underline"
              >
                ↓ Assessment map image
              </button>
            )}
            <span className="text-plum-mute">Tip: tap any image to view it full-size</span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center animate-fade-scale" style={{ animationDelay: "240ms" }}>
        <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="btn-serum">
          Book a consultation
        </a>
        <button
          onClick={onRestart}
          className="no-print mt-5 block w-full text-sm text-plum-mute underline-offset-4 transition hover:text-plum hover:underline"
        >
          Start over
        </button>
        <p className="mx-auto mt-8 max-w-md text-[0.7rem] leading-relaxed text-plum-mute">
          {analysis.disclaimer}
        </p>
      </section>

      {/* Full-size image lightbox */}
      {lightbox && (
        <div
          className="no-print fixed inset-0 z-50 flex items-center justify-center bg-plum/80 p-4 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-h-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox}
              alt="Full-size analysis"
              className="max-h-[80vh] w-full rounded-2xl object-contain shadow-dew"
            />
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                onClick={() =>
                  downloadDataUrl(
                    lightbox,
                    lightbox === mapImage
                      ? "skin-assessment-map.png"
                      : "veluria-before-after.png",
                  )
                }
                className="btn-serum"
              >
                Download image
              </button>
              <button onClick={() => setLightbox(null)} className="btn-ghost">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {mounted && createPortal(
        <StickyPreviewBar
          afterPending={afterPending}
          after={after}
          previewRef={previewRef}
        />,
        document.body,
      )}
    </div>
  );
}
