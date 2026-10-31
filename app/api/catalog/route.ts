import { readCatalog } from "@/lib/catalog";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return Response.json(await readCatalog(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      {
        error: "We couldn’t load the plans. Please try again.",
        plans: [],
        unavailable: true,
      },
      { status: 503 },
    );
  }
}
