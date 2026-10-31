import { sameSecret } from "@/lib/auth";
import { db } from "@/lib/db";
import { billingJob } from "@/lib/store";
import { deliverEmails } from "@/lib/email";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(req: Request) {
  if (
    !process.env.CRON_SECRET ||
    !sameSecret(
      req.headers.get("authorization") || "",
      `Bearer ${process.env.CRON_SECRET}`,
    )
  )
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const workspaces = await db().workspace.findMany({
      select: { id: true },
      take: 5,
    });
    const results = [];
    for (const w of workspaces) results.push(await billingJob(w.id));
    return Response.json({ results, email: await deliverEmails(10) });
  } catch {
    console.error("Scheduled billing failed; see database JobRun records.");
    return Response.json(
      { error: "Billing run failed. Check the job history." },
      { status: 500 },
    );
  }
}
