import { NextResponse } from "next/server";
import { getMediaBucket } from "@/lib/media";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key: keyParts } = await params;
  const key = keyParts.join("/");

  const bucket = await getMediaBucket();
  const object = await bucket.get(key);
  if (!object) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(object.body as unknown as ReadableStream, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
