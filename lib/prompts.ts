export const ANALYSIS_SYSTEM_PROMPT = `You are a senior aesthetic skin consultant at Harley Street Aesthetics, a premium UK clinic. A prospective client has uploaded a selfie for a complimentary skin assessment.

Assess the visible skin in the photo and produce a warm, professional, confidence-building analysis. You are NOT a doctor: do not diagnose medical conditions, name diseases, or make clinical claims. Frame everything as a cosmetic, non-diagnostic observation of visible skin appearance.

Score five categories from 0-100, where 100 means the skin already looks its healthiest for that category and lower scores indicate more visible room for improvement:
- Hydration: plumpness, dewiness, dryness/flakiness
- Fine lines: visible fine lines and early static/dynamic creasing
- Texture & pores: smoothness, visible pores, roughness
- Tone & redness: evenness of tone, visible redness or blotchiness
- Radiance: overall glow, luminosity, dullness

Then write:
- summary: 2-3 supportive sentences describing what you observe overall.
- annotations: 4 to 7 specific points on the face marking areas you would focus on, like a consultant pointing at a mirror. For each, give:
    - x and y: the location as a PERCENTAGE of the photo (x = 0 left edge to 100 right edge, y = 0 top edge to 100 bottom edge). Estimate carefully from where the feature actually sits on THIS face. Spread points across the relevant areas; do not stack them.
    - area: the correct aesthetic-medicine term. Use terms from this set where applicable: "Forehead lines", "Glabella / frown lines", "Periorbital lines (crow's feet)", "Tear trough / under-eye", "Cheek hydration & glow", "Nasolabial folds", "Marionette lines", "Perioral (lip) lines", "Skin texture & pores", "Uneven tone / pigmentation", "Visible redness", "Jawline & lower-face skin laxity".
    - concern: one short phrase on what is visibly observed there.
    - treatment: a brief, honest suggestion. For hydration, dullness, fine lines, texture and overall skin quality, recommend the Veluria skin booster. For concerns boosters do not address well (e.g. deep folds, volume loss), name the appropriate option honestly (e.g. dermal filler, anti-wrinkle injections) and note a consultation. Never guarantee outcomes.
    - severity: "low", "moderate", or "notable".
- veluriaRecommendation: 2-3 sentences explaining how the Veluria skin booster (an injectable bio-hydrator that deeply hydrates and stimulates the skin's own renewal) could specifically help THIS person's lowest-scoring areas. Be specific to the observations, encouraging, never guaranteeing results.

Rules:
- If the image is not a usable face photo (no face, too dark, not a person), respond ONLY with: {"error":"no_face"}
- Otherwise respond ONLY with a single valid JSON object, no markdown, no code fences, matching exactly:
{
  "summary": string,
  "categories": [
    {"label":"Hydration","score":number,"note":string},
    {"label":"Fine lines","score":number,"note":string},
    {"label":"Texture & pores","score":number,"note":string},
    {"label":"Tone & redness","score":number,"note":string},
    {"label":"Radiance","score":number,"note":string}
  ],
  "annotations": [
    {"x":number,"y":number,"area":string,"concern":string,"treatment":string,"severity":"low"|"moderate"|"notable"}
  ],
  "veluriaRecommendation": string,
  "disclaimer": "This is a cosmetic, non-diagnostic assessment of visible skin appearance only and is not medical advice."
}
Each note must be a single short sentence. Scores must be integers. x and y must be numbers between 0 and 100.`;

export interface ConcernArea {
  area: string;
  concern: string;
}

/**
 * Maps a flagged concern to the specific, visible "after" change a hydrating
 * skin booster can realistically deliver there — so the result TARGETS the
 * person's actual issues (e.g. under-eye dark circles) instead of a generic
 * global glow. Keyword-matched on the area + concern text.
 */
function targetedAfterAction(area: string, concern: string): string {
  const t = `${area} ${concern}`.toLowerCase();
  if (/(dark circle|under[ -]?eye|tear trough|eye bag|periorbital|puffy|hollow)/.test(t))
    return "noticeably reduce the dark circles, shadowing and crepey, tired look under the eyes: the under-eye skin should look smoother, firmer, better hydrated and visibly fresher and less sunken — clearly improved when compared side by side, but still natural (improved by better skin quality, NOT painted a lighter colour and NOT fully erased)";
  if (/(line|wrinkle|crease|crow|forehead|glabella|frown|perioral|marionette|nasolabial|fold)/.test(t))
    return "make these lines and creases clearly shallower and softer so they catch much less shadow, without erasing them completely";
  if (/(redness|\bred\b|rosacea|blotch|flush)/.test(t))
    return "calm and even out the redness and blotchiness so the tone looks settled and uniform";
  if (/(pigment|dark spot|sun spot|melasma|uneven tone|discolou?r|patch)/.test(t))
    return "fade the uneven pigmentation and dark spots so the tone looks clearly more even";
  if (/(texture|pore|rough|bumpy|congest|uneven)/.test(t))
    return "smooth the rough, uneven texture and refine enlarged pores while keeping natural pore detail";
  if (/(acne|blemish|\bspot\b|breakout|scar)/.test(t))
    return "clear active blemishes and visibly soften marks and shallow scarring, leaving realistic skin";
  if (/(dull|dry|dehydrat|lacklustre|lackluster|tired|glow|radian|hydrat|plump|laxity|crepe)/.test(t))
    return "restore visibly hydrated, plumper, firmer and healthier skin with real dewiness from within (not added highlights or shine)";
  return "noticeably improve the skin quality here — more hydrated, smoother and more even";
}

/**
 * Builds the gpt-image-2 prompt for the AFTER image only.
 *
 * Critical: this edits the user's REAL selfie (the FIRST image) and returns a
 * single photo of the SAME person, same pose/crop/framing/lighting/background,
 * with ONLY skin quality improved. The app keeps the untouched selfie as the
 * "before" and composes the two client-side, so the before is never altered.
 *
 * The improvements are TARGETED to the concern areas the analysis flagged (so
 * the result treats real issues, not a generic glow), calibrated to "Natural" —
 * clearly visible at those spots yet believable, matching what a course of
 * THREE hydrating skin-booster sessions can realistically deliver. Never
 * filler-style volume, reshaping, or airbrushing. Any image after the first is
 * a real Veluria-treated skin reference for texture/tone matching only.
 */
export function buildAfterImagePrompt(
  concerns: ConcernArea[],
  hasReferences: boolean,
  annotate = false,
): string {
  const list: ConcernArea[] =
    concerns.length > 0
      ? concerns.slice(0, 6)
      : [
          { area: "Cheeks", concern: "dullness and dryness" },
          { area: "Skin texture & pores", concern: "rough texture and visible pores" },
          { area: "Overall tone", concern: "uneven tone and mild redness" },
        ];

  const focus = list
    .map((c) => `- ${c.area} (${c.concern}): ${targetedAfterAction(c.area, c.concern)}`)
    .join("\n");

  // When annotate is set, the SAME image also carries the treatment-map
  // pointers, so one generation serves both the slider and the map container.
  const pointerBlock = annotate
    ? `\n\nFINALLY, ADD A TIDY TREATMENT-MAP OVERLAY on this same treated photo: for each treated area below, place a small neat circular marker dot on that exact part of the face, with a thin hairline leader line to a small, crisply printed, correctly-spelled label in the empty space AROUND the face — never over the eyes or covering features. Each label is just the area name. Keep it minimal, elegant and perfectly legible, like a premium Harley Street clinic treatment diagram in soft gold and charcoal — no clutter, no legend. The markers must sit on top of the retouched skin without hiding the improvement underneath.\nTREATED AREAS TO MARK:\n${list.map((c) => `- ${c.area}`).join("\n")}`
    : "";

  const referenceLine = hasReferences
    ? `\n\nREFERENCE IMAGES: any image AFTER the first shows REAL skin treated with the Veluria booster — match that realistic treated-skin texture, tone and glow. Do NOT copy the reference people's identity or features in any way.`
    : "";

  return `Professional beauty-retouch of the SAME person in the FIRST image, showing how their skin realistically looks after a course of THREE Veluria skin-booster sessions.

THE RESULT — their skin is now visibly healthier, and the improvement must be CLEARLY noticeable next to the original (a near-identical, "no change" result is a failure):
- a soft, dewy, light-reflective glow — luminous and lit-from-within, not flat or dull
- supple, hydrated, plumped-looking surface — fresh and well-rested (NOT volumised like filler)
- smoother, more even texture with refined, tighter-looking pores
- fine lines and crepey texture softened and shallower
- brighter, smoother, less-shadowed under-eyes
- even, uniform tone with calmed redness; minor blemishes and marks faded

Concentrate the improvement on the areas the consultation flagged:
${focus}

KEEP THE SAME PERSON: identical face, features, bone structure, skin tone and ethnicity, hair, expression, head angle, pose, crop, framing and background. Keep moles, freckles and beauty spots. Output the same square framing so it overlays the original 1:1.

LOOK: professional studio beauty photography — soft, even, diffused lighting; photorealistic. Keep natural visible pores and real skin micro-texture (never plastic, waxy, blurred or over-smoothed) and the person's real age. The glow must read as healthier SKIN catching light, not a flat brightness or whitening filter.

DO NOT reshape or slim the face, change ethnicity, add make-up, add volume or filler, remove wrinkles entirely, or change the background or the person's identity.${pointerBlock}${referenceLine}`;
}

/**
 * Builds the gpt-image-2 prompt for the professional consultation MAP — a clean
 * clinical annotation overlay drawn onto the selfie (no skin retouching). `areas`
 * are the concern zones identified by the written analysis, so labels stay accurate.
 */
export interface MapZone {
  area: string;
  severity: "low" | "moderate" | "notable" | string;
}

const ATTENTION_WORD: Record<string, string> = {
  notable: "High",
  moderate: "Medium",
  low: "Low",
};

/**
 * Builds the gpt-image-2 prompt for the professional consultation MAP. Each zone
 * carries a severity from the Claude analysis so the map can colour-code which
 * areas need the most attention.
 */
export function buildMapPrompt(zones: MapZone[]): string {
  const list: MapZone[] =
    zones.length > 0
      ? zones.slice(0, 7)
      : [
          { area: "Forehead lines", severity: "moderate" },
          { area: "Periorbital lines (crow's feet)", severity: "moderate" },
          { area: "Tear trough / under-eye", severity: "notable" },
          { area: "Cheek hydration & glow", severity: "notable" },
          { area: "Nasolabial folds", severity: "moderate" },
          { area: "Jawline & lower face", severity: "low" },
        ];

  const lines = list
    .map((z) => `- ${z.area} — ${ATTENTION_WORD[z.severity] ?? "Medium"} attention`)
    .join("\n");

  return `Turn the FIRST image into a professional aesthetic-clinic CONSULTATION MAP that makes it OBVIOUS AT A GLANCE which areas need the most attention.

Keep the SAME person and photo completely unchanged — do NOT retouch, smooth, beautify or alter the skin, features or background. This is a diagnostic annotation layer placed ON TOP of the original photo.

For each zone below, place a small neat marker dot on that exact facial area, with a thin hairline leader line to a small, crisply printed, clearly legible, correctly-spelled label in the empty space around the face (not over the face). Each label shows the area name and its attention level.

COLOUR-CODE every marker dot and its label by attention level so priority is instantly clear:
- HIGH attention -> red
- MEDIUM attention -> amber / gold
- LOW attention -> green
Add a small, tidy legend in a corner: red = high, amber = medium, green = low attention.

ZONES (area - attention level):
${lines}

Style: premium Harley Street aesthetic clinic, minimal, precise, uncluttered, like a doctor's treatment-planning diagram. Tidy leader lines, labels around the edges, nothing crowding the face. No watermark, no logo.`;
}
