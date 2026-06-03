"use client";

import { useState } from "react";
import SelfieCapture from "@/components/SelfieCapture";
import LeadForm from "@/components/LeadForm";
import Processing from "@/components/Processing";
import AnalysisReport from "@/components/AnalysisReport";
import CinematicAtmosphere from "@/components/CinematicAtmosphere";
import type { SkinAnalysis, LeadPayload } from "@/lib/types";

type Step = "welcome" | "capture" | "form" | "processing" | "result" | "error";

export default function Home() {
  const [step, setStep] = useState<Step>("welcome");
  const [selfie, setSelfie] = useState<string | null>(null);
  const [lead, setLead] = useState<LeadPayload | null>(null);
  const [analysis, setAnalysis] = useState<SkinAnalysis | null>(null);
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [afterPending, setAfterPending] = useState(false);
  const [mapImage, setMapImage] = useState<string | null>(null);
  const [mapPending, setMapPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const reset = () => {
    setSelfie(null);
    setLead(null);
    setAnalysis(null);
    setAfterImage(null);
    setAfterPending(false);
    setMapImage(null);
    setMapPending(false);
    setErrorMsg("");
    setStep("welcome");
  };

  // Fetch one "after" pass at a given quality, optionally targeting the flagged
  // concern areas (so it treats real issues) and optionally baking in the
  // treatment-map pointers (so the one image serves the slider AND the map).
  const fetchAfter = (
    image: string,
    quality: "low" | "medium",
    areas: { area: string; concern: string }[] = [],
    annotate = false,
  ) =>
    fetch("/api/transform", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image, quality, areas, annotate }),
    })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        return r.ok ? (d.image as string) : null;
      })
      .catch(() => null);

  // Runs only after the lead has been captured + pushed to GHL. `leadData` is
  // passed on the first call (state hasn't settled yet); the error-screen Retry
  // calls without it and falls back to the stored lead.
  const runAnalysis = async (image: string, leadData?: LeadPayload | null) => {
    const activeLead = leadData ?? lead;
    setStep("processing");
    setAfterImage(null);
    setMapImage(null);
    setAfterPending(true);
    setMapPending(true);

    // STEP 1 — Claude vision analyses the selfie FIRST. Its findings drive both
    // the written report and the before/after image, so nothing is generated
    // until we know this person's actual concerns.
    let analysisResult: SkinAnalysis;
    try {
      const r = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error ?? "Analysis failed.");
      analysisResult = data.analysis as SkinAnalysis;
      setAnalysis(analysisResult);
      // Report appears now (scores, notes, recommendation); the before/after
      // and map areas show their loader while the image is generated.
      setStep("result");
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "We couldn't complete your analysis.",
      );
      setStep("error");
      return;
    }

    // PHASE 2 of lead capture — now that we have the analysis, push the concerns
    // to GHL keyed by the lead's email so the existing contact is enriched.
    // Fire-and-forget: a failure here never blocks the results reveal.
    if (activeLead?.email) {
      fetch("/api/lead/concerns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: activeLead.email, analysis: analysisResult }),
      }).catch(() => {});
    }

    // STEP 2 — feed the analysis concerns into gpt-image-2 to generate ONE
    // targeted, pointer-annotated image, reused for both the slider and the map.
    // "medium" quality so the skin change actually renders visibly ("low"
    // under-renders fine detail and the before/after looks near-identical).
    const concerns =
      analysisResult.annotations?.map((a) => ({
        area: a.area,
        concern: a.concern,
      })) ?? [];

    fetchAfter(image, "medium", concerns, true).then((afterImg) => {
      if (afterImg) {
        setAfterImage(afterImg);
        setMapImage(afterImg); // reuse the same image — no second generation
      }
      setAfterPending(false);
      setMapPending(false);
    });
  };

  const atmosphereScene =
    step === "processing" ? "processing" : step === "result" ? "report" : "welcome";

  return (
    <main className="relative min-h-dvh">
      <CinematicAtmosphere scene={atmosphereScene} />

      <header className="relative z-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-2 px-6 pt-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/sirona-logo.png"
            alt="Sirona Aesthetics"
            className="h-11 w-auto"
            draggable={false}
          />
          <p className="text-[0.6rem] uppercase tracking-couture text-serum">
            Veluria Skin Studio
          </p>
        </div>
      </header>

      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 py-12 sm:py-16">
        {step === "welcome" && (
          <section key="welcome" className="relative mx-auto max-w-2xl text-center">
            <p className="eyebrow animate-fade-scale" style={{ animationDelay: "60ms" }}>
              Complimentary AI Skin Consultation
            </p>
            <h1
              className="display mt-6 animate-fade-scale text-5xl text-plum sm:text-7xl"
              style={{ animationDelay: "140ms" }}
            >
              Reveal the skin
              <br />
              <span className="serum-text italic">beneath the surface.</span>
            </h1>
            <p
              className="mx-auto mt-7 max-w-md animate-fade-scale text-balance text-plum-soft"
              style={{ animationDelay: "240ms" }}
            >
              One photograph. A consultant-grade analysis, a professional treatment
              map of your face, and a luminous preview of your results with{" "}
              <span className="font-medium text-plum">Veluria Silk Skin</span> by PB
              Serum.
            </p>
            <div
              className="mt-10 flex animate-fade-scale flex-col items-center gap-4"
              style={{ animationDelay: "340ms" }}
            >
              <button onClick={() => setStep("capture")} className="btn-serum">
                Begin my analysis
              </button>
              <p className="text-[0.7rem] uppercase tracking-[0.16em] text-plum-mute">
                Under a minute · Processed privately · Never stored
              </p>
            </div>

            <div
              className="mx-auto mt-14 grid max-w-lg animate-fade-scale grid-cols-3 gap-3"
              style={{ animationDelay: "440ms" }}
            >
              {[
                ["01", "Deep analysis"],
                ["02", "Treatment map"],
                ["03", "Before / after"],
              ].map(([n, label]) => (
                <div key={n} className="glass-soft px-4 py-5 text-center">
                  <p className="font-display text-2xl text-serum">{n}</p>
                  <p className="mt-1 text-[0.65rem] uppercase tracking-[0.14em] text-plum-soft">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {step === "capture" && (
          <section key="capture" className="w-full animate-fade-scale">
            <div className="mb-8 text-center">
              <p className="eyebrow">Step 01 — Your Photograph</p>
              <h2 className="display mt-3 text-4xl text-plum sm:text-5xl">
                Let&rsquo;s see your skin
              </h2>
            </div>
            <SelfieCapture
              onCaptured={(url) => {
                setSelfie(url);
                setStep("form");
              }}
            />
          </section>
        )}

        {step === "form" && selfie && (
          <section key="form" className="w-full animate-fade-scale">
            <LeadForm
              selfie={selfie}
              onSubmitted={(submittedLead) => {
                setLead(submittedLead);
                runAnalysis(selfie, submittedLead);
              }}
            />
          </section>
        )}

        {step === "processing" && <Processing key="processing" />}

        {step === "result" && analysis && selfie && (
          <AnalysisReport
            key="result"
            before={selfie}
            after={afterImage}
            afterPending={afterPending}
            mapImage={mapImage}
            mapPending={mapPending}
            analysis={analysis}
            onRestart={reset}
          />
        )}

        {step === "error" && (
          <section key="error" className="mx-auto max-w-md animate-fade-scale text-center">
            <p className="eyebrow">Something interrupted us</p>
            <h2 className="display mt-3 text-4xl text-plum">Let&rsquo;s try that again</h2>
            <p className="mt-3 text-plum-soft">{errorMsg}</p>
            <div className="mt-8 flex flex-col items-center gap-4">
              <button onClick={() => selfie && runAnalysis(selfie)} className="btn-serum">
                Retry
              </button>
              <button
                onClick={reset}
                className="text-sm text-plum-mute underline-offset-4 hover:text-plum hover:underline"
              >
                Start over
              </button>
            </div>
          </section>
        )}
      </div>

      <footer className="relative z-10 mx-auto max-w-5xl px-6 pb-10 text-center text-[0.65rem] uppercase tracking-[0.14em] text-plum-mute/70">
        © {new Date().getFullYear()} Sirona Aesthetics · Veluria by PB Serum · A
        cosmetic, non-diagnostic AI simulation · Not medical advice
      </footer>
    </main>
  );
}
