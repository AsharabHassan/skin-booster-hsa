import { NextResponse } from "next/server";
import { pushConcernsToGhl } from "@/lib/ghl";
import type { SkinAnalysis } from "@/lib/types";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isAnalysis(v: unknown): v is SkinAnalysis {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.summary === "string" &&
    Array.isArray(o.categories) &&
    Array.isArray(o.annotations) &&
    typeof o.veluriaRecommendation === "string"
  );
}

/**
 * Phase 2 of lead capture: fired by the client AFTER the skin analysis returns,
 * sending the concerns to GHL keyed by email so the existing contact (created
 * by the phase-1 lead push) is enriched. Best-effort — the client calls this
 * fire-and-forget, so a non-200 here never blocks the user's results.
 */
export async function POST(req: Request) {
  let body: { email?: unknown; analysis?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "A valid email is required." },
      { status: 400 },
    );
  }
  if (!isAnalysis(body.analysis)) {
    return NextResponse.json(
      { error: "A valid analysis is required." },
      { status: 400 },
    );
  }

  try {
    await pushConcernsToGhl(email, body.analysis);
  } catch (err) {
    console.error("[concerns] GHL push failed:", err);
    return NextResponse.json(
      { error: "We couldn't submit your analysis details." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
