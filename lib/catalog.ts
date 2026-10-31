import "server-only";
import { db } from "./db";
import { catalogFromWorkspace } from "./catalog-data";
import { seedWorkspace } from "./seed";
import type { Catalog, Workspace } from "./types";
export async function readCatalog(): Promise<Catalog> {
  if (!process.env.DATABASE_URL) {
    if (process.env.NEXT_PUBLIC_DEMO_ENABLED === "false")
      return { plans: [], sample: false, unavailable: true };
    return catalogFromWorkspace(seedWorkspace());
  }
  const row = await db().workspace.findFirst({
    where: { name: "Brightloop Software" },
    orderBy: { createdAt: "asc" },
  });
  if (!row) return { plans: [], sample: false, unavailable: true };
  return catalogFromWorkspace({
    ...(row.state as unknown as Workspace),
    clock: new Date().toISOString(),
    demo: false,
  });
}
