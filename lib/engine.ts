import { id, istDate, istMonth } from "./format";
import type {
  Command,
  Invoice,
  Plan,
  Subscription,
  Viewer,
  Workspace,
} from "./types";
const DAY = 86400000;
export const paymentDeadline = (period: string, terms = 0) =>
  new Date(new Date(period).getTime() + (terms + 1) * DAY - 1).toISOString();
export function nextPeriod(
  value: string,
  interval: Plan["interval"],
  anchorDay?: number,
): string {
  const d = new Date(new Date(value).getTime() + 19800000),
    original = anchorDay ?? d.getUTCDate();
  if (interval === "daily" || interval === "weekly")
    d.setUTCDate(d.getUTCDate() + (interval === "daily" ? 1 : 7));
  else {
    d.setUTCDate(1);
    if (interval === "monthly") d.setUTCMonth(d.getUTCMonth() + 1);
    else d.setUTCFullYear(d.getUTCFullYear() + 1);
    const last = new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0),
    ).getUTCDate();
    d.setUTCDate(Math.min(original, last));
  }
  return new Date(d.getTime() - 19800000).toISOString();
}
function event(
  w: Workspace,
  title: string,
  detail: string,
  kind: Workspace["activities"][number]["kind"],
) {
  w.activities.unshift({ id: id("act"), title, detail, date: w.clock, kind });
  w.activities = w.activities.slice(0, 500);
}
export function loyalty(w: Workspace, s: Subscription) {
  const p = w.plans.find((x) => x.id === s.planId);
  return p?.loyalty && p.interval === "monthly" && !s.missed
    ? Math.min(s.streak * s.loyaltyStep, s.loyaltyCap)
    : 0;
}
export function outstanding(w: Workspace, s: Subscription) {
  return w.invoices.some(
    (i) =>
      i.subscriptionId === s.id &&
      i.status !== "Cancelled" &&
      i.paid < i.total &&
      new Date(i.dueDate) < new Date(w.clock),
  );
}
export function reconcile(w: Workspace) {
  for (const s of w.subscriptions) {
    if (s.stage !== "Active") continue;
    if (outstanding(w, s) && !s.missed) {
      s.streak = 0;
      s.missed = true;
      event(
        w,
        "A fresh start next month",
        `${s.number} missed its payment deadline. Future loyalty pricing has reset.`,
        "reset",
      );
    }
    const p = w.plans.find((x) => x.id === s.planId);
    if (
      p?.autoClose &&
      s.expiryDate &&
      new Date(s.expiryDate) < new Date(w.clock)
    ) {
      s.stage = "Closed";
      event(w, "Subscription completed", s.number, "subscription");
    }
  }
}
export function calculate(w: Workspace, s: Subscription) {
  const p = w.plans.find((x) => x.id === s.planId);
  if (!p) throw new Error("This plan could not be found.");
  const product = w.products.find((x) => x.id === p.productId);
  if (!product) throw new Error("This product could not be found.");
  const variant = product.variants.find((x) => x.name === s.variant);
  if (!variant) throw new Error("Choose an available product variant.");
  const unitPrice = p.price + (variant?.extra || 0),
    subtotal = unitPrice * s.quantity;
  const percent = loyalty(w, s);
  let discount = Math.round((subtotal * percent) / 100),
    discountLabel = percent ? `Loyalty · ${percent}%` : "No discount",
    discountId: string | undefined;
  const now = new Date(w.clock).getTime();
  for (const d of w.discounts) {
    if (
      (d.productId && d.productId !== p.productId) ||
      (d.subscriptionId && d.subscriptionId !== s.id) ||
      d.minQuantity > s.quantity ||
      d.minPurchase > subtotal ||
      (d.limit > 0 && d.used >= d.limit) ||
      now < new Date(istDate(d.startDate)).getTime() ||
      now >= new Date(istDate(d.endDate)).getTime() + DAY
    )
      continue;
    const amount = Math.min(
      subtotal,
      d.kind === "percent" ? Math.round((subtotal * d.value) / 100) : d.value,
    );
    if (amount > discount) {
      discount = amount;
      discountLabel = d.name;
      discountId = d.id;
    }
  }
  const taxRate = w.taxes.reduce((a, t) => a + t.rate, 0),
    tax = Math.round(((subtotal - discount) * taxRate) / 100);
  return {
    product: product.name,
    quantity: s.quantity,
    unitPrice,
    subtotal,
    discount,
    discountLabel,
    discountId,
    taxRate,
    tax,
    total: subtotal - discount + tax,
    loyaltyPercent: discountId ? 0 : percent,
  };
}
export function createInvoice(
  w: Workspace,
  s: Subscription,
  period = s.nextBilling,
): Invoice {
  const existing = w.invoices.find(
    (i) => i.subscriptionId === s.id && i.period === period,
  );
  if (existing) return existing;
  const calc = calculate(w, s);
  const inv: Invoice = {
    id: id("inv"),
    number: `INV-${String(w.invoices.length + 1200).padStart(4, "0")}`,
    subscriptionId: s.id,
    customerId: s.customerId,
    period,
    dueDate: paymentDeadline(period, s.terms),
    issuedDate: w.clock,
    status: "Draft",
    ...calc,
    paid: 0,
    earned: false,
  };
  w.invoices.push(inv);
  event(w, "Invoice ready", `${inv.number} · ${calc.product}`, "invoice");
  return inv;
}
export function confirmInvoice(w: Workspace, invoice: Invoice) {
  if (invoice.status !== "Draft")
    throw new Error("Only draft invoices can be confirmed.");
  if (invoice.discountId) {
    const d = w.discounts.find((x) => x.id === invoice.discountId);
    if (
      !d ||
      (d.limit > 0 && d.used >= d.limit) ||
      new Date(w.clock).getTime() >=
        new Date(istDate(d.endDate)).getTime() + DAY
    )
      throw new Error(
        "This discount is no longer available. Refresh the draft before confirming.",
      );
    d.used++;
  }
  invoice.status = invoice.total === 0 ? "Paid" : "Confirmed";
}
export function runBilling(w: Workspace, limit = 100) {
  reconcile(w);
  let processed = 0,
    backlog = 0;
  for (const s of w.subscriptions) {
    if (s.stage !== "Active" || s.paused) continue;
    const p = w.plans.find((x) => x.id === s.planId)!;
    while (
      new Date(s.nextBilling).getTime() - 3 * DAY <=
      new Date(w.clock).getTime()
    ) {
      if (processed >= limit) {
        backlog++;
        break;
      }
      if (s.expiryDate && new Date(s.nextBilling) > new Date(s.expiryDate))
        break;
      const inv = createInvoice(w, s);
      if (inv.status === "Draft") {
        Object.assign(inv, calculate(w, s));
        confirmInvoice(w, inv);
      }
      reconcile(w);
      s.nextBilling = nextPeriod(
        s.nextBilling,
        p.interval,
        new Date(new Date(s.startDate).getTime() + 19800000).getUTCDate(),
      );
      processed++;
    }
  }
  reconcile(w);
  return { processed, backlog };
}
const num = (v: unknown, min = 0, max = 1e12) => {
  const n = Number(v);
  if (!Number.isFinite(n) || n < min || n > max)
    throw new Error("Please enter a valid amount or quantity.");
  return n;
};
const str = (v: unknown, max = 300) => {
  if (typeof v !== "string" || !v.trim() || v.length > max)
    throw new Error("Please fill in the required fields.");
  return v.trim();
};
export function applyCommand(
  input: Workspace,
  cmd: Command,
  viewer: Viewer,
): Workspace {
  const w = structuredClone(input),
    p = cmd.payload;
  reconcile(w);
  const admin = [
    "saveProduct",
    "savePlan",
    "saveDiscount",
    "saveTaxes",
    "saveTemplate",
  ];
  if (admin.includes(cmd.type) && viewer.role !== "admin")
    throw new Error("Only an admin can change this setting.");
  const customerAllowed = ["transition", "pause", "resume", "renew"];
  if (viewer.role === "customer" && !customerAllowed.includes(cmd.type))
    throw new Error("You do not have access to this action.");
  const sub = () => {
    const s = w.subscriptions.find((x) => x.id === p.id);
    if (!s) throw new Error("Subscription not found.");
    if (viewer.role === "customer" && s.customerId !== viewer.customerId)
      throw new Error("You cannot access this subscription.");
    return s;
  };
  switch (cmd.type) {
    case "saveProduct": {
      const product = {
        id: typeof p.id === "string" ? p.id : id("prod"),
        name: str(p.name),
        type: str(p.productType || "Software"),
        price: Math.round(num(p.price)),
        cost: Math.round(num(p.cost || 0)),
        notes: String(p.notes || "").slice(0, 1000),
        variants: [
          { name: "Standard", extra: 0 },
          ...(p.variantName
            ? [
                {
                  name: str(p.variantName),
                  extra: Math.round(num(p.variantExtra || 0)),
                },
              ]
            : []),
        ],
      };
      if (w.products.some((x) => x.id === product.id))
        w.products = w.products.map((x) => (x.id === product.id ? product : x));
      else w.products.push(product);
      break;
    }
    case "savePlan": {
      if (!w.products.some((x) => x.id === p.productId))
        throw new Error("Choose a product.");
      if (
        !["daily", "weekly", "monthly", "yearly"].includes(String(p.interval))
      )
        throw new Error("Choose a billing interval.");
      const plan: Plan = {
        id: typeof p.id === "string" ? p.id : id("plan"),
        name: str(p.name),
        productId: str(p.productId),
        price: Math.round(num(p.price)),
        interval: p.interval as Plan["interval"],
        minQuantity: Math.trunc(num(p.minQuantity || 1, 1, 100000)),
        startDate: String(p.startDate || w.clock.slice(0, 10)),
        endDate: String(p.endDate || ""),
        autoClose: Boolean(p.autoClose),
        canPause: Boolean(p.canPause),
        canClose: Boolean(p.canClose),
        canRenew: Boolean(p.canRenew),
        loyalty: Boolean(p.loyalty),
        step: num(p.step ?? 5, 0, 100),
        cap: num(p.cap ?? 20, 0, 100),
      };
      istDate(plan.startDate);
      if (plan.endDate && istDate(plan.endDate) < istDate(plan.startDate))
        throw new Error("The end date must follow the start date.");
      if (w.plans.some((x) => x.id === plan.id))
        w.plans = w.plans.map((x) => (x.id === plan.id ? plan : x));
      else w.plans.push(plan);
      break;
    }
    case "addCustomer": {
      const email = str(p.email).toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        throw new Error("Enter a valid email.");
      if (w.customers.some((x) => x.email === email))
        throw new Error("That customer email is already in use.");
      w.customers.push({
        id: id("cust"),
        name: str(p.name),
        email,
        company: str(p.company),
        color: "#d8dfce",
      });
      break;
    }
    case "createSubscription": {
      const plan = w.plans.find((x) => x.id === p.planId);
      if (!plan) throw new Error("Choose a plan.");
      if (!w.customers.some((x) => x.id === p.customerId))
        throw new Error("Choose a customer.");
      const start = istDate(str(p.startDate)),
        quantity = num(p.quantity, plan.minQuantity, 100000);
      if (!Number.isInteger(quantity))
        throw new Error("Quantity must be a whole number.");
      if (
        start < istDate(plan.startDate) ||
        (plan.endDate && start > istDate(plan.endDate))
      )
        throw new Error("This plan is not available on that date.");
      const s: Subscription = {
        id: id("sub"),
        number: `SUB-${1041 + w.subscriptions.length}`,
        customerId: str(p.customerId),
        planId: plan.id,
        quantity,
        variant: String(p.variant || "Standard"),
        startDate: start,
        expiryDate: p.expiryDate ? istDate(str(p.expiryDate)) : "",
        nextBilling: start,
        stage: "Draft",
        paused: false,
        streak: 0,
        missed: false,
        loyaltyStep: plan.step,
        loyaltyCap: plan.cap,
        createdAt: w.clock,
        terms: Math.trunc(num(p.terms || 0, 0, 365)),
        quoteValidDays: Math.trunc(num(p.quoteValidDays || 14, 1, 365)),
        notes: String(p.notes || "").slice(0, 1000),
      };
      calculate(w, s);
      if (s.expiryDate && s.expiryDate < s.startDate)
        throw new Error("Expiry must follow the start date.");
      w.subscriptions.push(s);
      event(
        w,
        "A new beginning",
        `${s.number} is ready to become a quote.`,
        "subscription",
      );
      break;
    }
    case "transition": {
      const s = sub(),
        plan = w.plans.find((x) => x.id === s.planId)!;
      const stage = String(p.stage);
      if (stage === "Closed") {
        if (!plan.canClose || s.stage === "Closed")
          throw new Error("This subscription cannot be closed.");
        s.stage = "Closed";
        s.streak = 0;
        break;
      }
      if (viewer.role === "customer")
        throw new Error("Your team manages this change.");
      const next = {
        Draft: "Quotation",
        Quotation: "Confirmed",
        Confirmed: "Active",
      }[s.stage as "Draft" | "Quotation" | "Confirmed"];
      if (stage !== next) throw new Error("Complete the previous step first.");
      if (
        stage === "Confirmed" &&
        new Date(w.clock).getTime() >
          new Date(s.createdAt).getTime() + (s.quoteValidDays || 14) * DAY
      )
        throw new Error(
          "This quotation has expired. Please create a new quote.",
        );
      if (
        stage === "Active" &&
        !w.invoices.some(
          (i) => i.subscriptionId === s.id && i.status === "Paid",
        )
      )
        throw new Error("Record the first invoice payment before activation.");
      s.stage = stage as Subscription["stage"];
      if (stage === "Active") {
        s.nextBilling = nextPeriod(s.startDate, plan.interval);
        s.streak = w.invoices.some((i) => i.subscriptionId === s.id && i.earned)
          ? Math.max(s.streak, 1)
          : 0;
        s.missed = false;
      }
      event(
        w,
        `${s.number} is ${s.stage.toLowerCase()}`,
        w.customers.find((c) => c.id === s.customerId)!.company,
        "subscription",
      );
      break;
    }
    case "pause": {
      const s = sub();
      if (
        !w.plans.find((x) => x.id === s.planId)?.canPause ||
        s.stage !== "Active"
      )
        throw new Error("This plan cannot be paused.");
      s.paused = true;
      s.streak = 0;
      event(w, "Taking a little breather", s.number, "subscription");
      break;
    }
    case "resume": {
      const s = sub();
      if (!s.paused) throw new Error("This subscription is not paused.");
      s.paused = false;
      s.nextBilling = nextPeriod(
        w.clock,
        w.plans.find((x) => x.id === s.planId)!.interval,
      );
      break;
    }
    case "renew": {
      const s = sub(),
        plan = w.plans.find((x) => x.id === s.planId)!;
      if (!plan.canRenew || s.stage !== "Closed")
        throw new Error("This subscription cannot be renewed.");
      if (plan.endDate && new Date(w.clock) > new Date(istDate(plan.endDate)))
        throw new Error("This plan is no longer available.");
      s.stage = "Confirmed";
      s.startDate = w.clock;
      s.nextBilling = w.clock;
      s.expiryDate = "";
      s.streak = 0;
      s.missed = false;
      break;
    }
    case "createInvoice": {
      const s = sub();
      if (!["Confirmed", "Active"].includes(s.stage))
        throw new Error("Confirm the subscription first.");
      createInvoice(w, s);
      break;
    }
    case "invoiceAction": {
      const inv = w.invoices.find((x) => x.id === p.id);
      if (!inv) throw new Error("Invoice not found.");
      if (p.action === "refresh") {
        if (inv.status !== "Draft")
          throw new Error("Only draft invoices can be refreshed.");
        const s = w.subscriptions.find((s) => s.id === inv.subscriptionId)!;
        Object.assign(inv, calculate(w, s));
      } else if (p.action === "confirm") confirmInvoice(w, inv);
      else if (p.action === "cancel") {
        if (inv.paid > 0)
          throw new Error("An invoice with payments cannot be cancelled.");
        if (inv.status === "Cancelled")
          throw new Error("This invoice is already cancelled.");
        if (inv.discountId && inv.status === "Confirmed") {
          const d = w.discounts.find((x) => x.id === inv.discountId);
          if (d) d.used = Math.max(0, d.used - 1);
        }
        inv.status = "Cancelled";
      } else throw new Error("Unknown invoice action.");
      break;
    }
    case "recordPayment": {
      const duplicate = w.payments.find((x) => x.requestKey === cmd.requestKey);
      if (duplicate) {
        if (duplicate.invoiceId !== p.invoiceId)
          throw new Error("This payment reference is already in use.");
        return w;
      }
      const inv = w.invoices.find((x) => x.id === p.invoiceId);
      if (!inv || inv.status !== "Confirmed")
        throw new Error("Choose a confirmed, unpaid invoice.");
      const requestKey = str(cmd.requestKey || "");
      if (w.payments.some((x) => x.requestKey === requestKey)) return w;
      const amount = Math.round(num(p.amount, 1, inv.total - inv.paid));
      const date = p.date ? istDate(str(p.date)) : w.clock;
      if (
        new Date(date) > new Date(w.clock) ||
        new Date(date) < new Date(inv.issuedDate)
      )
        throw new Error(
          "The payment date must fall between issue date and today.",
        );
      w.payments.push({
        id: id("pay"),
        invoiceId: inv.id,
        customerId: inv.customerId,
        amount,
        method: str(p.method),
        date,
        note: String(p.note || "").slice(0, 1000),
        requestKey,
      });
      inv.paid += amount;
      const s = w.subscriptions.find((x) => x.id === inv.subscriptionId)!;
      if (inv.paid === inv.total) {
        inv.status = "Paid";
        inv.paidAt = date;
        const onTime = new Date(date) <= new Date(inv.dueDate);
        if (onTime && !inv.earned) {
          s.streak++;
          inv.earned = true;
          const otherOverdue = w.invoices.some(
            (i) =>
              i.id !== inv.id &&
              i.subscriptionId === s.id &&
              i.status !== "Cancelled" &&
              i.paid < i.total &&
              new Date(i.dueDate) < new Date(w.clock),
          );
          s.missed = otherOverdue;
          if (otherOverdue) s.streak = 0;
        } else if (!onTime) {
          s.streak = 0;
          s.missed = outstanding(w, s);
        }
        event(
          w,
          "Payment received",
          `${inv.number} is all settled.`,
          "payment",
        );
      } else
        event(
          w,
          "A payment came in",
          `${inv.number} has a remaining balance.`,
          "payment",
        );
      break;
    }
    case "saveDiscount": {
      const d = {
        id: id("disc"),
        name: str(p.name),
        kind: p.kind === "fixed" ? ("fixed" as const) : ("percent" as const),
        value: num(p.value, 0, p.kind === "fixed" ? 1e12 : 100),
        minQuantity: num(p.minQuantity || 1, 1),
        minPurchase: num(p.minPurchase || 0),
        startDate: str(p.startDate),
        endDate: str(p.endDate),
        limit: Math.trunc(num(p.limit || 0)),
        used: 0,
        productId: String(p.productId || ""),
        subscriptionId: String(p.subscriptionId || ""),
      };
      if (istDate(d.endDate) < istDate(d.startDate))
        throw new Error("The end date must follow the start date.");
      w.discounts.push(d);
      break;
    }
    case "saveTaxes": {
      w.taxes = [
        { id: "tax_gst", name: str(p.name), rate: num(p.rate, 0, 100) },
      ];
      break;
    }
    case "saveTemplate": {
      if (!w.plans.some((x) => x.id === p.planId))
        throw new Error("Choose a plan.");
      w.templates.push({
        id: id("tmpl"),
        name: str(p.name),
        planId: str(p.planId),
        quantity: Math.trunc(num(p.quantity, 1)),
        validDays: Math.trunc(num(p.validDays, 1, 365)),
        notes: String(p.notes || ""),
      });
      break;
    }
    case "runBilling":
      runBilling(w);
      break;
    default:
      throw new Error("Unknown action.");
  }
  return w;
}
export function visibleWorkspace(w: Workspace, v: Viewer): Workspace {
  if (v.role !== "customer") return w;
  const subscriptions = w.subscriptions.filter(
    (x) => x.customerId === v.customerId,
  );
  const ids = new Set(subscriptions.map((x) => x.planId));
  return {
    ...w,
    previews: Object.fromEntries(
      subscriptions.map((s) => [s.id, calculate(w, s)]),
    ),
    customers: w.customers.filter((x) => x.id === v.customerId),
    subscriptions,
    invoices: w.invoices.filter((x) => x.customerId === v.customerId),
    payments: w.payments.filter((x) => x.customerId === v.customerId),
    plans: w.plans.filter((x) => ids.has(x.id)),
    products: w.products
      .filter((x) => w.plans.some((p) => ids.has(p.id) && p.productId === x.id))
      .map((x) => ({ ...x, cost: 0, notes: "" })),
    discounts: [],
    templates: [],
    activities: [],
  };
}
export function metrics(w: Workspace) {
  const active = w.subscriptions.filter(
    (s) => s.stage === "Active" && !s.paused,
  );
  const mrr = active.reduce((n, s) => {
    const p = w.plans.find((x) => x.id === s.planId)!;
    const calc = calculate(w, s);
    const price = calc.subtotal - calc.discount;
    return (
      n +
      price *
        { daily: 30, weekly: 52 / 12, monthly: 1, yearly: 1 / 12 }[p.interval]
    );
  }, 0);
  const month = istMonth(w.clock);
  return {
    active: active.length,
    mrr: Math.round(mrr),
    collected: w.payments
      .filter((p) => istMonth(p.date) === month)
      .reduce((n, p) => n + p.amount, 0),
    outstanding: w.invoices
      .filter((i) => i.status !== "Cancelled")
      .reduce((n, i) => n + i.total - i.paid, 0),
    overdue: w.invoices.filter(
      (i) =>
        i.status === "Confirmed" &&
        i.paid < i.total &&
        new Date(i.dueDate) < new Date(w.clock),
    ).length,
    savings: w.invoices
      .filter((i) => i.status === "Paid")
      .reduce((n, i) => n + i.discount, 0),
  };
}
