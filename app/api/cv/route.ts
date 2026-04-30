import { renderCvPdfStream, CV_FILENAME } from "@/lib/cv-pdf";

export const runtime = "nodejs";
export const dynamic = "force-static";

export async function GET() {
  const stream = await renderCvPdfStream();

  return new Response(stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${CV_FILENAME}"`,
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
