import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "./db";
import {
  applyCommand,
  reconcile,
  runBilling,
  visibleWorkspace,
} from "./engine";
import type { Command, Viewer, Workspace } from "./types";
const asJson = (w: unknown) =>
  JSON.parse(JSON.stringify(w)) as Prisma.InputJsonValue;
// The workspace document is the aggregate boundary. Versioned compare-and-swap
// keeps its business invariants atomic; indexed ledgers support financial queries.
export async function readWorkspace(viewer: Viewer) {
  const row = await db().workspace.findUniqueOrThrow({
    where: { id: viewer.workspaceId },
  });
  const w = row.state as unknown as Workspace;
  w.clock = new Date().toISOString();
  w.demo = false;
  reconcile(w);
  return visibleWorkspace(w, viewer);
}
export async function mutateWorkspace(
  workspaceId: string,
  change: (w: Workspace) => Workspace,
) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const row = await db().workspace.findUniqueOrThrow({
      where: { id: workspaceId },
    });
    const before = row.state as unknown as Workspace;
    before.clock = new Date().toISOString();
    before.demo = false;
    const after = change(structuredClone(before));
    try {
      await db().$transaction(
        async (tx) => {
          const updated = await tx.workspace.updateMany({
            where: { id: workspaceId, version: row.version },
            data: { state: asJson(after), version: { increment: 1 } },
          });
          if (!updated.count) throw new Error("CONFLICT");
          for (const inv of after.invoices) {
            const old = before.invoices.find((i) => i.id === inv.id);
            if (JSON.stringify(old) === JSON.stringify(inv)) continue;
            await tx.invoiceLedger.upsert({
              where: { id: inv.id },
              create: {
                id: inv.id,
                workspaceId,
                subscriptionId: inv.subscriptionId,
                period: inv.period,
                customerId: inv.customerId,
                status: inv.status,
                dueAt: new Date(inv.dueDate),
                total: inv.total,
                data: asJson(inv),
              },
              update: { status: inv.status, data: asJson(inv) },
            });
          }
          for (const p of after.payments.filter(
            (p) => !before.payments.some((old) => old.id === p.id),
          ))
            await tx.paymentLedger.create({
              data: {
                id: p.id,
                workspaceId,
                invoiceId: p.invoiceId,
                requestKey: p.requestKey,
                amount: p.amount,
                paidAt: new Date(p.date),
                data: asJson(p),
              },
            });
        },
        { timeout: 15000 },
      );
      return after;
    } catch (e) {
      if (
        e instanceof Error &&
        (e.message === "CONFLICT" || e.message.includes("P2034"))
      )
        continue;
      throw e;
    }
  }
  throw new Error(
    "Someone else just updated this workspace. Please try again.",
  );
}
export async function execute(viewer: Viewer, command: Command) {
  const state = await mutateWorkspace(viewer.workspaceId!, (w) =>
    applyCommand(w, command, viewer),
  );
  return visibleWorkspace(state, viewer);
}
export async function billingJob(workspaceId: string) {
  const job = await db().jobRun.create({
    data: { workspaceId, status: "running" },
  });
  try {
    let result = { processed: 0, backlog: 0 };
    await mutateWorkspace(workspaceId, (w) => {
      result = runBilling(w, 40);
      return w;
    });
    await db().jobRun.update({
      where: { id: job.id },
      data: { ...result, status: "completed", completedAt: new Date() },
    });
    return result;
  } catch (e) {
    await db().jobRun.update({
      where: { id: job.id },
      data: {
        status: "failed",
        error: e instanceof Error ? e.message : "Failed",
        completedAt: new Date(),
      },
    });
    throw e;
  }
}
