export const ANALYSIS_SYSTEM_PROMPT = `You are a senior aesthetic skin consultant at Harley Street Aesthetics, a premium UK clinic. A prospective client has uploaded a selfie for a complimentary AI skin assessment built around ONE treatment: the Veluria skin booster.

ABOUT VELURIA — the ONLY treatment you may mention by name:
Veluria is a professional skin-QUALITY treatment — a skin booster (an injectable bio-hydrator) delivered as a course of sessions. Over that course it can realistically improve:
- deep hydration, dewiness and a healthy lit-from-within glow
- skin radiance and vitality (dullness, tired-looking skin)
- smoother, more refined texture and the appearance of tighter pores
- the appearance of firmness and elasticity
- FINE, superficial, dehydration-related lines and crepey texture

WHAT A SKIN BOOSTER CANNOT DO — never claim, imply or hint that Veluria treats these:
- persistent redness, flushing or visible capillaries (these are vascular and need in-clinic care)
- pigmentation, dark spots, melasma or uneven pigment patches
- active breakouts, blemishes or acne
- scarring of any kind
- deep static folds, volume loss or lip shape
- skin laxity that needs lifting, or dynamic expression lines at their source
- under-eye darkness caused by pigment or hollowing (only the crepey, dehydrated skin quality there can improve)
When you observe one of these, still flag it honestly — but say it sits outside what a skin booster addresses and is best explored with the clinician at an in-clinic consultation. NEVER name or recommend any other product, brand, device, injectable, laser, peel, skincare line or procedure. All other treatment options are strictly a matter for the consultation.

Assess the visible skin in the photo and produce a warm, professional, confidence-building analysis. You are NOT a doctor: do not diagnose medical conditions, name diseases (e.g. never write "rosacea" or "melasma" — describe only what is visible, like "areas of persistent redness"), or make clinical claims. Frame everything as a cosmetic, non-diagnostic observation of visible skin appearance.

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
    - treatment: one short, honest sentence. Two cases:
        * Concern WITHIN Veluria's scope (hydration, dullness/glow, texture, pores, fine surface lines, crepiness, firmness appearance): describe what a course of Veluria sessions can realistically improve there. Never guarantee outcomes.
        * Concern OUTSIDE a skin booster's scope (persistent redness/capillaries, pigmentation, breakouts, scarring, deep folds, volume loss, laxity, expression lines): the sentence MUST start with exactly "Beyond a skin booster's scope — " followed by a short note that the clinician can discuss the right options at a consultation. Do NOT name any product or treatment. Example: "Beyond a skin booster's scope — the clinician can advise on this at your consultation."
    - severity: "low", "moderate", or "notable".
- veluriaRecommendation: 2-3 sentences explaining what a course of the Veluria skin booster (an injectable bio-hydrator that deeply hydrates and stimulates the skin's own renewal) can realistically do for THIS person's in-scope concerns — be specific to the observations (e.g. hydration, glow, texture, fine surface lines). If some of their most visible concerns sit outside a skin booster's scope, acknowledge that honestly in one clause and note the clinician will advise on those at the consultation — never imply Veluria addresses them and never name another treatment. Warm and encouraging, never guaranteeing results. End with a gentle invitation to book a consultation.

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
 * Maps a flagged concern to the "after" change a hydrating skin booster can
 * realistically deliver there. GUARDRAIL: a skin booster improves skin QUALITY
 * only (hydration, glow, texture, fine surface lines). Vascular redness,
 * pigmentation, blemishes and scarring are NOT treatable by a booster, so for
 * those concerns the instruction explicitly PRESERVES the feature and limits
 * the change to the healthy skin around it. Keyword-matched on area + concern;
 * the out-of-scope checks run FIRST so they always win.
 */
function targetedAfterAction(area: string, concern: string): string {
  const t = `${area} ${concern}`.toLowerCase();
  if (/(redness|\bred\b|rosacea|blotch|flush|capillar|vascular|vessel)/.test(t))
    return "DO NOT reduce, fade or even out the redness — every red or flushed area and every visible capillary must keep its exact colour intensity, size and extent from the original (a skin booster cannot treat redness); only make the skin surface there look slightly better hydrated and smoother in texture";
  if (/(pigment|dark spot|sun spot|melasma|discolou?r|freckle|patch)/.test(t))
    return "DO NOT fade or lighten the pigmentation — every dark spot and pigment patch keeps its exact shape, size and depth of colour (a skin booster cannot treat pigmentation); only give the surrounding skin a healthier, better-hydrated glow";
  if (/(acne|blemish|\bspot\b|breakout|pimple|scar)/.test(t))
    return "DO NOT clear, shrink or soften the blemishes, breakouts or scarring — they must remain exactly as in the original (a skin booster cannot treat these); only improve the hydration and glow of the unaffected skin around them";
  if (/(dark circle|under[ -]?eye|tear trough|eye bag|periorbital|puffy|hollow)/.test(t))
    return "improve ONLY the skin quality under the eyes — smoother, better hydrated, less crepey and less tired-looking; keep the natural under-eye colouring, any darkness and the eye-area contours (hollows, bags) unchanged — do NOT lighten the colour or fill the area";
  if (/(line|wrinkle|crease|crow|forehead|glabella|frown|perioral|marionette|nasolabial|fold)/.test(t))
    return "soften ONLY the fine surface lines and crepey texture through better hydration so they catch a little less shadow; deeper folds and expression lines must remain clearly visible at their original depth";
  if (/(texture|pore|rough|bumpy|congest|uneven)/.test(t))
    return "smooth the rough, uneven texture and refine enlarged pores while keeping natural pore detail";
  if (/(dull|dry|dehydrat|lacklustre|lackluster|tired|glow|radian|hydrat|plump|laxity|crepe)/.test(t))
    return "restore visibly hydrated, plumper-looking, healthier skin with real dewiness from within (not added highlights or shine)";
  return "improve only the skin quality here — better hydrated, smoother and more luminous";
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
          { area: "Fine surface lines", concern: "early fine lines and crepiness" },
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

  return `Professional beauty-retouch of the SAME person in the FIRST image, showing how their skin realistically looks after a course of Veluria skin-booster sessions (a hydrating skin-QUALITY treatment).

A skin booster improves SKIN QUALITY ONLY. THE RESULT — clearly noticeable next to the original in these ways ONLY (a near-identical "no change" result is a failure):
- a soft, dewy, light-reflective glow — luminous and lit-from-within, not flat or dull
- supple, hydrated, plumped-looking surface — fresh and well-rested (NOT volumised like filler)
- smoother, more even texture with refined, tighter-looking pores
- FINE surface lines and crepey texture softened and shallower (deeper folds stay clearly visible)

Concentrate the improvement on the areas the consultation flagged:
${focus}

MEDICAL HONESTY — THE FOLLOWING MUST REMAIN EXACTLY AS IN THE ORIGINAL, VISIBLY UNTREATED. A skin booster cannot treat them, and removing them would mislead the client (removing any of these is a FAILED result):
- redness, flushing, red patches and visible or broken capillaries — same colour intensity, same size, same extent as the original
- pigmentation, dark spots, sun spots and uneven pigment patches — unchanged
- active blemishes, breakouts, acne and ALL scarring — unchanged
- deep static folds and expression lines — still clearly present at their original depth (at most fractionally softer from hydration)
- under-eye darkness, hollows, eye bags and facial volume — unchanged
- moles, freckles and beauty spots — unchanged
If any of these are visible in the original photo they MUST still be clearly visible in the result. Healthier, more hydrated skin AROUND them with the features themselves intact is the correct outcome.

KEEP THE SAME PERSON: identical face, features, bone structure, skin tone and ethnicity, hair, expression, head angle, pose, crop, framing and background. Output the same square framing so it overlays the original 1:1.

LOOK: professional studio beauty photography — soft, even, diffused lighting; photorealistic. Keep natural visible pores and real skin micro-texture (never plastic, waxy, blurred or over-smoothed) and the person's real age. The glow must read as healthier SKIN catching light, not a flat brightness or whitening filter.

DO NOT reshape or slim the face, change ethnicity, add make-up, add volume or filler, remove wrinkles entirely, or change the background or the person's identity.${pointerBlock}${referenceLine}

Style: photorealistic, professional clinical beauty photography. A clearly visible, natural improvement in hydration, glow and texture — while every untreatable feature (redness, pigmentation, blemishes, scars, deep folds) is left untouched.`;
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
