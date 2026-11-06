// Client-only, free pre-flight check run before the paid AI try-on call: is
// there actually a recognizable hand in the uploaded photo? Catches unclear
// photos immediately instead of burning an API call and making the customer
// wait, only to fail.

import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

let landmarkerPromise: Promise<HandLandmarker> | null = null;

async function getLandmarker(): Promise<HandLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
      return HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "IMAGE",
        numHands: 1,
      });
    })();
  }
  return landmarkerPromise;
}

export async function detectHandPresent(photo: Blob): Promise<boolean> {
  const [landmarker, image] = await Promise.all([
    getLandmarker(),
    createImageBitmap(photo, { imageOrientation: "from-image" }),
  ]);
  const result = landmarker.detect(image);
  return result.landmarks.length > 0;
}
