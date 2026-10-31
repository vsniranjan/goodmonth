import type { Workspace } from "./types";
export const DEMO_DATE = "2026-10-31T06:30:00.000Z";
export function emptyWorkspace(): Workspace {
  return {
    products: [],
    plans: [],
    customers: [],
    subscriptions: [],
    invoices: [],
    payments: [],
    discounts: [],
    taxes: [{ id: "tax_gst", name: "GST", rate: 18 }],
    templates: [],
    activities: [],
    clock: new Date().toISOString(),
    demo: false,
  };
}
export function seedWorkspace(): Workspace {
  const w = emptyWorkspace();
  w.clock = DEMO_DATE;
  w.demo = true;
  w.products = [
    {
      id: "prod_studio",
      name: "Studio workspace",
      type: "Software",
      price: 100000,
      cost: 24000,
      notes: "A happy home for every project.",
      variants: [
        { name: "Standard", extra: 0 },
        { name: "Odoo", extra: 56000 },
      ],
    },
    {
      id: "prod_team",
      name: "Team essentials",
      type: "Software",
      price: 249900,
      cost: 60000,
      notes: "Everything a growing team needs.",
      variants: [{ name: "Standard", extra: 0 }],
    },
    {
      id: "prod_insights",
      name: "Insights add-on",
      type: "Add-on",
      price: 49900,
      cost: 8000,
      notes: "Good decisions start with a little clarity.",
      variants: [{ name: "Standard", extra: 0 }],
    },
  ];
  const base = {
    minQuantity: 1,
    startDate: "2026-01-01",
    endDate: "",
    autoClose: false,
    canPause: true,
    canClose: true,
    canRenew: true,
    loyalty: true,
    step: 5,
    cap: 20,
  };
  w.plans = [
    {
      ...base,
      id: "plan_studio",
      name: "Studio monthly",
      productId: "prod_studio",
      price: 100000,
      interval: "monthly",
    },
    {
      ...base,
      id: "plan_team",
      name: "Team monthly",
      productId: "prod_team",
      price: 249900,
      interval: "monthly",
    },
    {
      ...base,
      id: "plan_year",
      name: "Studio annual",
      productId: "prod_studio",
      price: 1000000,
      interval: "yearly",
      loyalty: false,
    },
    {
      ...base,
      id: "plan_insights",
      name: "Insights monthly",
      productId: "prod_insights",
      price: 49900,
      interval: "monthly",
    },
  ];
  w.customers = [
    {
      id: "cust_maya",
      name: "Maya Shah",
      email: "maya@example.com",
      company: "Paper & Pine",
      color: "#e6c9b2",
    },
    {
      id: "cust_arjun",
      name: "Arjun Nair",
      email: "arjun@example.com",
      company: "Sunday Studio",
      color: "#c4d7cc",
    },
    {
      id: "cust_leah",
      name: "Leah Thomas",
      email: "leah@example.com",
      company: "Little Things",
      color: "#ead492",
    },
    {
      id: "cust_omar",
      name: "Omar Ali",
      email: "omar@example.com",
      company: "Fieldwork",
      color: "#cbd4e4",
    },
    {
      id: "cust_nina",
      name: "Nina Roy",
      email: "nina@example.com",
      company: "The Good Co.",
      color: "#d7cce1",
    },
    {
      id: "cust_ishan",
      name: "Ishan Patel",
      email: "ishan@example.com",
      company: "Common Ground",
      color: "#cbd5b7",
    },
  ];
  w.subscriptions = w.customers.map((c, i) => ({
    id: `sub_${i + 1}`,
    number: `SUB-${String(1041 + i)}`,
    customerId: c.id,
    planId:
      i === 1 || i === 4 ? "plan_team" : i === 5 ? "plan_year" : "plan_studio",
    quantity: i === 1 ? 3 : 1,
    variant: "Standard",
    startDate: `2026-0${i === 0 ? 6 : 8}-01`,
    expiryDate: "",
    nextBilling:
      i === 2 ? "2026-10-28T18:30:00.000Z" : "2026-10-31T18:30:00.000Z",
    stage: i === 4 ? "Quotation" : "Active",
    paused: false,
    streak: [4, 2, 0, 3, 0, 1][i],
    missed: i === 2,
    loyaltyStep: 5,
    loyaltyCap: 20,
    createdAt: "2026-06-01T06:00:00.000Z",
    terms: 0,
    quoteValidDays: 14,
    notes: "",
  }));
  for (let month = 6; month <= 10; month++)
    for (let i = 0; i < 4; i++) {
      const sub = w.subscriptions[i],
        plan = w.plans.find((p) => p.id === sub.planId)!;
      const percent = Math.min((month - 6) * 5, 20),
        subtotal = plan.price * sub.quantity,
        discount = Math.round((subtotal * percent) / 100),
        tax = Math.round((subtotal - discount) * 0.18),
        total = subtotal - discount + tax;
      const unpaid = month === 10 && i === 2,
        partial = month === 10 && i === 3;
      const paid = unpaid ? 0 : partial ? Math.round(total / 2) : total;
      const inv = {
        id: `inv_${month}_${i}`,
        number: `INV-${1200 + (month - 6) * 4 + i}`,
        subscriptionId: sub.id,
        customerId: sub.customerId,
        period: `2026-${String(month).padStart(2, "0")}-01T18:30:00.000Z`,
        dueDate: `2026-${String(month).padStart(2, "0")}-${i === 2 ? "28" : "01"}T18:30:00.000Z`,
        issuedDate: `2026-${String(month).padStart(2, "0")}-01T06:00:00.000Z`,
        status: paid === total ? ("Paid" as const) : ("Confirmed" as const),
        product: w.products.find((p) => p.id === plan.productId)!.name,
        quantity: sub.quantity,
        unitPrice: plan.price,
        subtotal,
        discount,
        discountLabel: `Loyalty · ${percent}%`,
        tax,
        taxRate: 18,
        total,
        paid,
        loyaltyPercent: percent,
        earned: paid === total,
        paidAt:
          paid === total
            ? `2026-${String(month).padStart(2, "0")}-01T10:00:00.000Z`
            : undefined,
      };
      w.invoices.push(inv);
      if (paid)
        w.payments.push({
          id: `pay_${month}_${i}`,
          invoiceId: inv.id,
          customerId: sub.customerId,
          amount: paid,
          method: ["UPI", "Bank transfer", "Card"][i % 3],
          date: inv.paidAt || "2026-10-10T06:00:00.000Z",
          note: "Monthly renewal",
          requestKey: `seed_${month}_${i}`,
        });
    }
  w.templates = [
    {
      id: "tmpl_studio",
      name: "A fresh start",
      planId: "plan_studio",
      quantity: 1,
      validDays: 14,
      notes: "Your next chapter starts here.",
    },
    {
      id: "tmpl_team",
      name: "Room to grow",
      planId: "plan_team",
      quantity: 3,
      validDays: 30,
      notes: "A little more space for your team.",
    },
  ];
  w.discounts = [
    {
      id: "disc_welcome",
      name: "A warm welcome",
      kind: "percent",
      value: 10,
      minQuantity: 1,
      minPurchase: 0,
      startDate: "2026-10-01",
      endDate: "2026-12-31",
      limit: 50,
      used: 8,
      productId: "prod_insights",
      subscriptionId: "",
    },
  ];
  w.activities = [
    {
      id: "act1",
      title: "A little loyalty goes a long way",
      detail: "Paper & Pine unlocked 20% off. Five good months together.",
      date: "2026-10-30T10:00:00.000Z",
      kind: "loyalty",
    },
    {
      id: "act2",
      title: "Payment received",
      detail: "Sunday Studio · monthly renewal, all settled.",
      date: "2026-10-29T10:00:00.000Z",
      kind: "payment",
    },
    {
      id: "act3",
      title: "Something needs a look",
      detail: "Little Things has an overdue invoice.",
      date: "2026-10-28T10:00:00.000Z",
      kind: "reset",
    },
    {
      id: "act4",
      title: "A new beginning",
      detail: "The Good Co. received their Team monthly quote.",
      date: "2026-10-27T10:00:00.000Z",
      kind: "subscription",
    },
  ];
  return w;
}
