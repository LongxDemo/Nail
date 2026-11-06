// Thin, isolated wrapper around Google's Gemini API image-editing call. This
// is the one file to touch if the model name or request/response shape
// changes -- verify against https://ai.google.dev/gemini-api/docs before
// going to production; this was written from documented API conventions and
// has not been hand-verified against a live response in this environment.

const GEMINI_MODEL = "gemini-2.5-flash-image";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

interface InlineImage {
  mimeType: string;
  base64: string;
}

export interface GenerateTryOnImageInput {
  apiKey: string;
  prompt: string;
  handPhoto: InlineImage;
  designReference?: InlineImage;
}

export type GenerateTryOnImageResult =
  | { ok: true; image: InlineImage }
  | { ok: false; error: string };

export async function generateTryOnImage(
  input: GenerateTryOnImageInput,
): Promise<GenerateTryOnImageResult> {
  const parts: unknown[] = [
    { text: input.prompt },
    { inlineData: { mimeType: input.handPhoto.mimeType, data: input.handPhoto.base64 } },
  ];
  if (input.designReference) {
    parts.push({
      inlineData: {
        mimeType: input.designReference.mimeType,
        data: input.designReference.base64,
      },
    });
  }

  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": input.apiKey,
      },
      body: JSON.stringify({ contents: [{ role: "user", parts }] }),
    });
  } catch {
    return { ok: false, error: "network_error" };
  }

  if (!response.ok) {
    return { ok: false, error: `api_error_${response.status}` };
  }

  const data = (await response.json()) as {
    candidates?: {
      content?: { parts?: { inlineData?: { mimeType: string; data: string } }[] };
      finishReason?: string;
    }[];
  };

  const imagePart = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  if (!imagePart?.inlineData) {
    const finishReason = data.candidates?.[0]?.finishReason;
    return { ok: false, error: finishReason ? `blocked_${finishReason}` : "no_image_returned" };
  }

  return {
    ok: true,
    image: { mimeType: imagePart.inlineData.mimeType, base64: imagePart.inlineData.data },
  };
}
