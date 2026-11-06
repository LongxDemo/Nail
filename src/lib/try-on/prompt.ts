export interface TryOnPromptInput {
  designName: string;
  designDescription: string | null;
  hasReferenceImage: boolean;
  shape: string;
  length: string;
}

// User-provided prompt for the two-image case (hand photo + design reference
// photo). Used verbatim with {shape}/{length} substituted.
function twoImagePrompt(shape: string, length: string): string {
  return `You are given two images:
Image 1: a photo of a customer's hand.
Image 2: a photo of a nail design.

Edit Image 1 so the customer's fingernails have the nail design from Image 2.

Copy the design exactly: same colors, patterns, decorations, gems, and finish
(glossy, matte, glitter, chrome).
Nail shape: ${shape}. Nail length: ${length}.

Rules:
- Only change the fingernails. Do not change anything else.
- Keep the hand exactly the same: skin tone, finger shape, position, rings,
  jewelry, and background.
- Make the nails look real, matching the photo's lighting, shadows, and angle.
- Apply the design to every visible nail, fitted naturally to each nail's
  curve and size.
- Do not add text, watermarks, or extra objects.`;
}

// Fallback for designs with no uploaded reference photo yet -- same rules,
// but the design is described in words since there's no "Image 2".
function textOnlyPrompt(input: TryOnPromptInput): string {
  const designDesc = `a nail design called "${input.designName}"${
    input.designDescription ? ` (${input.designDescription})` : ""
  }`;

  return `You are given one image: a photo of a customer's hand.

Edit the photo so the customer's fingernails show ${designDesc}.
Nail shape: ${input.shape}. Nail length: ${input.length}.

Rules:
- Only change the fingernails. Do not change anything else.
- Keep the hand exactly the same: skin tone, finger shape, position, rings,
  jewelry, and background.
- Make the nails look real, matching the photo's lighting, shadows, and angle.
- Apply the design to every visible nail, fitted naturally to each nail's
  curve and size.
- Do not add text, watermarks, or extra objects.`;
}

export function buildTryOnPrompt(input: TryOnPromptInput): string {
  return input.hasReferenceImage
    ? twoImagePrompt(input.shape, input.length)
    : textOnlyPrompt(input);
}
