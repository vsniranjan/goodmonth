import { describe, expect, it } from "vitest";
import { applyCommand, planAvailable, visibleWorkspace } from "../lib/engine";
import { seedWorkspace } from "../lib/seed";
import { tabForSection } from "../lib/navigation";
import type { Viewer, Workspace } from "../lib/types";
const customer: Viewer = {
  id: "user_maya",
  name: "Maya Shah",
  email: "maya@example.com",
  role: "customer",
  customerId: "cust_maya",
};
const admin: Viewer = {
  id: "admin",
  name: "Alex",
  email: "alex@example.com",
  role: "admin",
};
const staff: Viewer = { ...admin, role: "staff" };
const request = (
  w = seedWorkspace(),
  payload: Record<string, unknown> = {},
  viewer = customer,
) =>
  applyCommand(
    w,
    {
      type: "requestSubscription",
      payload: {
        planId: "plan_team",
        variant: "Standard",
        quantity: 1,
        ...payload,
      },
    },
    viewer,
  );
const approve = (w: Workspace, viewer = admin) =>
  applyCommand(
    w,
    { type: "approveRequest", payload: { id: w.requests![0].id } },
    viewer,
  );
describe("customer plan requests", () => {
  it("supports old workspaces and derives ownership from the session", () => {
    const w = seedWorkspace();
    delete w.requests;
    const next = request(w, { customerId: "cust_arjun" });
    expect(next.requests).toHaveLength(1);
    expect(next.requests![0]).toMatchObject({
      customerId: "cust_maya",
      status: "Pending",
      planId: "plan_team",
    });
    expect(next.subscriptions).toHaveLength(w.subscriptions.length);
    expect(next.invoices).toHaveLength(w.invoices.length);
  });
  it("rejects duplicate pending requests and invalid selections", () => {
    expect(() => request(request())).toThrow(/pending request/);
    expect(() => request(seedWorkspace(), { quantity: 1.2 })).toThrow(
      /whole number/,
    );
    expect(() => request(seedWorkspace(), { quantity: 0 })).toThrow(
      /valid amount/,
    );
    expect(() => request(seedWorkspace(), { variant: "Nonexistent" })).toThrow(
      /variant/,
    );
    expect(() => request(seedWorkspace(), { planId: "missing" })).toThrow(
      /no longer available/,
    );
  });
  it("rejects unavailable dates and honors the inclusive end date in IST", () => {
    const w = seedWorkspace();
    const p = w.plans[1];
    p.startDate = "2026-11-01";
    expect(() => request(w)).toThrow(/no longer available/);
    p.startDate = "2026-01-01";
    p.endDate = "2026-10-31";
    expect(planAvailable(p, "2026-10-31T18:29:59.999Z")).toBe(true);
    expect(planAvailable(p, "2026-10-31T18:30:00.000Z")).toBe(false);
  });
  it("restricts submission to valid customer accounts", () => {
    expect(() => request(seedWorkspace(), {}, admin)).toThrow(/Only customers/);
    expect(() =>
      request(seedWorkspace(), {}, { ...customer, customerId: "unknown" }),
    ).toThrow(/Only customers/);
  });
  it("approves exactly once and uses the normal draft subscription lifecycle", () => {
    const pending = request();
    const approved = approve(pending);
    expect(approved.requests![0].status).toBe("Approved");
    expect(approved.subscriptions).toHaveLength(
      pending.subscriptions.length + 1,
    );
    expect(approved.subscriptions.at(-1)).toMatchObject({
      id: approved.requests![0].subscriptionId,
      customerId: customer.customerId,
      planId: "plan_team",
      stage: "Draft",
      quantity: 1,
      variant: "Standard",
    });
    const repeated = approve(approved);
    expect(repeated.subscriptions).toHaveLength(approved.subscriptions.length);
    expect(repeated.invoices).toHaveLength(pending.invoices.length);
  });
  it("rejects approval after a plan is unavailable and preserves the pending request", () => {
    const w = request();
    w.plans[1].endDate = "2026-10-01";
    expect(() => approve(w)).toThrow(/no longer available/);
    expect(w.requests![0].status).toBe("Pending");
  });
  it("only lets admins approve or decline", () => {
    const w = request();
    for (const viewer of [staff, customer]) {
      expect(() => approve(w, viewer)).toThrow(/Only an admin/);
      expect(() =>
        applyCommand(
          w,
          { type: "declineRequest", payload: { id: w.requests![0].id } },
          viewer,
        ),
      ).toThrow(/Only an admin/);
    }
  });
  it("keeps declined requests in history and allows a fresh request", () => {
    const w = request();
    const declined = applyCommand(
      w,
      { type: "declineRequest", payload: { id: w.requests![0].id } },
      admin,
    );
    expect(declined.requests![0].status).toBe("Declined");
    expect(() => approve(declined)).toThrow(/already been reviewed/);
    expect(request(declined).requests).toHaveLength(2);
  });
  it("filters requests, identities, and plan details to their owner", () => {
    let w = request();
    w = request(
      w,
      { planId: "plan_year" },
      { ...customer, customerId: "cust_arjun" },
    );
    const visible = visibleWorkspace(w, customer);
    expect(visible.requests).toHaveLength(1);
    expect(visible.requests![0].customerId).toBe(customer.customerId);
    expect(visible.plans.some((p) => p.id === "plan_team")).toBe(true);
    expect(visible.products.every((p) => p.cost === 0 && p.notes === "")).toBe(
      true,
    );
    expect(visible.customers).toHaveLength(1);
  });
});
describe("workspace routes", () => {
  it("limits customer sections and rejects invalid paths", () => {
    expect(tabForSection([], true)).toBe("My subscription");
    expect(tabForSection(["plans"], true)).toBe("Plans");
    expect(tabForSection(["requests"], true)).toBe("Requests");
    expect(tabForSection(["settings"], true)).toBeUndefined();
    expect(tabForSection(["customers"], true)).toBeUndefined();
    expect(tabForSection(["requests", "extra"])).toBeUndefined();
    expect(tabForSection(["requests"])).toBe("Requests");
  });
});

describe("public catalog", () => {
  it("exposes plan selection details without internal or customer data", async () => {
    const { catalogFromWorkspace } = await import("../lib/catalog-data");
    const w = seedWorkspace();
    const catalog = catalogFromWorkspace(w);
    expect(catalog.plans).toHaveLength(w.plans.length);
    expect(catalog.plans[0]).toMatchObject({
      id: w.plans[0].id,
      price: w.plans[0].price,
      variants: w.products[0].variants,
    });
    const serialized = JSON.stringify(catalog);
    expect(serialized).not.toContain('"cost"');
    expect(serialized).not.toContain('"notes"');
    expect(serialized).not.toContain('"customers"');
    expect(serialized).not.toContain('"invoices"');
  });
  it("omits unavailable plans and orphaned products", async () => {
    const { catalogFromWorkspace } = await import("../lib/catalog-data");
    const w = seedWorkspace();
    w.plans[0].endDate = "2026-10-01";
    w.plans[1].startDate = "2026-12-01";
    w.plans[2].productId = "missing";
    expect(catalogFromWorkspace(w).plans.map((p) => p.id)).toEqual([
      "plan_insights",
    ]);
  });
});
