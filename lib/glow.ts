import sharp from "sharp";

/**
 * Deterministic "hydration grade" applied to the AI "after" image.
 *
 * WHY THIS EXISTS. `images.edit` is a reconstruction operation: gpt-image-2 is
 * built to hand back its input with modifications, and it is strongly biased
 * toward reproducing what it sees. Three successive prompt rewrites could not
 * reliably push it past "looks the same" on skin that was already healthy —
 * because there is little to repair, so it repairs little. Adjectives cannot
 * beat the model's core behaviour.
 *
 * But the optical signature of well-hydrated skin is not mysterious:
 *   1. specular sheen where light already falls (water in the dermis reflects),
 *   2. a lift of the dull, sallow, light-absorbing cast of dehydrated skin,
 *   3. slightly softened surface micro-texture.
 * All three are image operations. Doing them here makes the result GUARANTEED
 * and DIALABLE instead of a dice-roll on each generation.
 *
 * SAFETY. This is a filter, not a generator: it cannot invent or delete a
 * feature. A blemish, pigment patch, capillary or scar physically cannot vanish
 * — it can only be relit. That matters, because the obvious alternative (a
 * second AI pass) *did* visibly erase acne, since each pass preserves features
 * only relative to its own input and the erosion compounds.
 */

/** 0 = off, 1 = clinical (subtle), 2 = balanced, 3 = campaign. */
export type GlowStrength = 0 | 1 | 2 | 3;

const SCALE: Record<number, number> = { 1: 0.45, 2: 0.75, 3: 1.0 };

export function glowStrengthFromEnv(): GlowStrength {
  const n = Number(process.env.GLOW_STRENGTH ?? 3);
  return ([0, 1, 2, 3] as const).includes(n as GlowStrength) ? (n as GlowStrength) : 3;
}

export async function hydrationGrade(
  input: Buffer,
  strength: GlowStrength = 3,
): Promise<Buffer> {
  if (strength <= 0) return input;
  const s = SCALE[strength] ?? 0.75;

  const raw = await sharp(input).removeAlpha().toColourspace("srgb").png().toBuffer();
  const { width = 1024, height = 1024 } = await sharp(raw).metadata();
  const min = Math.min(width, height);

  // The highlight threshold must ADAPT to the photo's exposure. A fixed cutoff
  // works on a bright studio shot and produces almost nothing on a dim indoor
  // phone selfie — the very photos clients actually send — because such an image
  // has no pixels above the cutoff, so there is nothing for the sheen to land on
  // and the "after" comes back looking untouched.
  const stats = await sharp(raw).stats();
  const mean =
    stats.channels.slice(0, 3).reduce((a, c) => a + c.mean, 0) / 3;
  const max = Math.max(...stats.channels.slice(0, 3).map((c) => c.max));
  // Take the top slice of THIS image's own tonal range as "where light falls".
  const t = Math.min(235, Math.max(60, mean + 0.45 * (max - mean)));
  const a = 255 / Math.max(255 - t, 20); // map [t,255] -> [0,255]
  const b = -a * t;

  // Specular sheen: crush everything below the threshold, spread what is left,
  // and screen it back — so the bloom lands only where light already falls
  // (cheekbones, nose bridge, brow, chin), at any exposure.
  const bloom = await sharp(raw)
    .linear(a, b)
    .blur(Math.max(2, Math.round(min / 90)))
    .ensureAlpha(0.3 * s)
    .png()
    .toBuffer();

  // Veil. Deliberately low opacity: spots, pores and scars are far higher
  // contrast than this, so they read straight through it.
  const veil = await sharp(raw)
    .blur(Math.max(1.5, min / 700))
    .ensureAlpha(0.22 * s)
    .png()
    .toBuffer();

  return sharp(raw)
    .composite([
      { input: veil, blend: "over" },
      { input: bloom, blend: "screen" },
    ])
    // Lifts the sallow cast. Only a few percent — this is vitality, not a
    // whitening or skin-lightening filter; the person's tone is unchanged.
    .modulate({ brightness: 1 + 0.035 * s, saturation: 1 + 0.07 * s })
    .linear(1 + 0.05 * s, -6 * s)
    .jpeg({ quality: 95 })
    .toBuffer();
}
