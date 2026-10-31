"use client";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowRight,
  Check,
  Heart,
  Loader2,
  ArrowLeft,
  Package,
} from "lucide-react";
import type { Catalog, CatalogPlan } from "@/lib/types";
import { money } from "@/lib/format";
export default function PlanBrowser({
  initial,
  customer = false,
  demo = false,
  onRequest,
}: {
  initial?: Catalog;
  customer?: boolean;
  demo?: boolean;
  onRequest?: (values: Record<string, unknown>) => Promise<boolean | undefined>;
}) {
  const [catalog, setCatalog] = useState<Catalog | undefined>(initial),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(!initial),
    [selected, setSelected] = useState(""),
    [busy, setBusy] = useState(false),
    [filter, setFilter] = useState("all");
  const [variant, setVariant] = useState(""),
    [quantity, setQuantity] = useState(1);
  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/catalog");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCatalog(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn’t load the plans.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (!initial) void load();
    const id = new URLSearchParams(location.search).get("plan");
    if (customer && id) setSelected(id);
  }, [initial, customer]);
  const plan = catalog?.plans.find((p) => p.id === selected);
  useEffect(() => {
    if (plan) {
      setVariant(plan.variants[0]?.name || "Standard");
      setQuantity(plan.minQuantity);
    }
  }, [plan?.id]);
  function choose(p: CatalogPlan) {
    setSelected(p.id);
    setVariant(p.variants[0]?.name || "Standard");
    setQuantity(p.minQuantity);
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!plan || !onRequest) return;
    setBusy(true);
    try {
      await onRequest({ planId: plan.id, variant, quantity });
    } finally {
      setBusy(false);
    }
  }
  if (loading)
    return (
      <div className="plans-state" role="status">
        <Loader2 className="spin" size={25} />
        <p>Finding your next good month…</p>
      </div>
    );
  if (error || catalog?.unavailable)
    return (
      <div className="plans-state">
        <Package size={30} />
        <h2>We couldn’t load the plans.</h2>
        <p role="alert">{error || "Please check back shortly."}</p>
        <button className="site-button" onClick={load}>
          Try again
        </button>
      </div>
    );
  if (!catalog?.plans.length)
    return (
      <div className="plans-state">
        <Package size={30} />
        <h2>Good things are on the way.</h2>
        <p>There are no plans available right now. Please check back soon.</p>
      </div>
    );
  return (
    <div className="plan-browser">
      {catalog.sample && (
        <div className="catalog-notice">
          <span>Sample catalog</span> These plans illustrate the experience.
          {!demo && (
            <>
              {" "}
              <Link href="/demo">
                Explore the demo <ArrowRight size={14} />
              </Link>
            </>
          )}
        </div>
      )}
      {selected && !plan && (
        <p className="account-error" role="alert">
          Your selected plan is no longer available. Choose from the plans
          below.
        </p>
      )}
      {plan && customer ? (
        <div className="request-layout">
          <div className="request-summary">
            <button className="site-text-link" onClick={() => setSelected("")}>
              <ArrowLeft size={16} /> Back to all plans
            </button>
            <p className="site-eyebrow">YOUR NEXT CHAPTER</p>
            <h2>{plan.name}</h2>
            <p>{plan.productName}</p>
            <strong>
              {money(plan.price)}
              <small>
                {" "}
                /{" "}
                {
                  {
                    daily: "day",
                    weekly: "week",
                    monthly: "month",
                    yearly: "year",
                  }[plan.interval]
                }
              </small>
            </strong>
            <span>Per seat, before tax and variant extras</span>
            <ul>
              <li>
                <Check size={16} /> Your own subscription portal
              </li>
              <li>
                <Check size={16} /> Clear invoices and renewal details
              </li>
              {plan.loyalty && plan.interval === "monthly" && (
                <li>
                  <Heart size={16} /> {plan.step}% per on-time renewal, up to{" "}
                  {plan.cap}%
                </li>
              )}
            </ul>
          </div>
          <form className="request-form account-form" onSubmit={submit}>
            <h3>Make it yours.</h3>
            <p>
              Confirm the details and send your request. An admin will review it
              before preparing your subscription.
            </p>
            <label>
              Product variant
              <select
                value={variant}
                onChange={(e) => setVariant(e.target.value)}
              >
                {plan.variants.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name}
                    {v.extra ? ` (+${money(v.extra)})` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Number of seats
              <input
                type="number"
                min={plan.minQuantity}
                max={100000}
                step={1}
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
              <small>
                Minimum {plan.minQuantity}{" "}
                {plan.minQuantity === 1 ? "seat" : "seats"}
              </small>
            </label>
            <div className="request-total">
              <span>Recurring subtotal</span>
              <strong>
                {money(
                  (plan.price +
                    (plan.variants.find((v) => v.name === variant)?.extra ||
                      0)) *
                    quantity,
                )}
              </strong>
            </div>
            <p className="request-disclaimer">
              Before taxes and any eligible discounts. Your quotation will
              confirm the final amount. No payment is taken when you submit a
              request.
            </p>
            <button
              className="site-button"
              type="submit"
              disabled={busy || !onRequest}
            >
              {busy && <Loader2 size={17} className="spin" />}Send plan request{" "}
              <ArrowRight size={17} />
            </button>
          </form>
        </div>
      ) : (
        <>
          <div className="plan-filter" aria-label="Billing interval">
            {["all", "monthly", "yearly"].map((f) => (
              <button
                key={f}
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
              >
                {f === "all"
                  ? "All plans"
                  : f === "yearly"
                    ? "Annual"
                    : "Monthly"}
              </button>
            ))}
          </div>
          <div className="catalog-grid">
            {catalog.plans
              .filter((p) => filter === "all" || p.interval === filter)
              .map((p) => (
                <article className="catalog-card" key={p.id}>
                  <div className="catalog-card-top">
                    <Package size={22} />
                    {p.loyalty && p.interval === "monthly" && (
                      <span>
                        <Heart size={12} /> Loyalty included
                      </span>
                    )}
                  </div>
                  <p>{p.productName}</p>
                  <h2>{p.name}</h2>
                  <div className="catalog-price">
                    {money(p.price)}
                    <span>
                      {" "}
                      /{" "}
                      {
                        {
                          daily: "day",
                          weekly: "week",
                          monthly: "month",
                          yearly: "year",
                        }[p.interval]
                      }
                    </span>
                  </div>
                  <small>Per seat, before tax · minimum {p.minQuantity}</small>
                  <ul>
                    <li>
                      <Check size={16} /> Subscription details in one place
                    </li>
                    <li>
                      <Check size={16} /> Invoice history and renewal dates
                    </li>
                    {p.canPause && (
                      <li>
                        <Check size={16} /> Pause when your plan allows
                      </li>
                    )}
                    {p.canClose && (
                      <li>
                        <Check size={16} /> Manage cancellation in your portal
                      </li>
                    )}
                    {p.loyalty && p.interval === "monthly" ? (
                      <li>
                        <Heart size={16} /> Earn {p.step}% off per eligible
                        renewal, capped at {p.cap}%
                      </li>
                    ) : (
                      <li>
                        <Check size={16} />{" "}
                        {p.interval === "yearly"
                          ? "One annual billing rhythm"
                          : "A clear recurring billing rhythm"}
                      </li>
                    )}
                  </ul>
                  {customer ? (
                    <button className="site-button" onClick={() => choose(p)}>
                      Choose this plan <ArrowRight size={16} />
                    </button>
                  ) : catalog.sample ? (
                    <Link
                      className="site-button"
                      href={`/demo/plans?plan=${encodeURIComponent(p.id)}`}
                    >
                      Try in the demo <ArrowRight size={16} />
                    </Link>
                  ) : (
                    <Link
                      className="site-button"
                      href={`/signup?plan=${encodeURIComponent(p.id)}`}
                    >
                      Choose this plan <ArrowRight size={16} />
                    </Link>
                  )}
                </article>
              ))}
          </div>
          {!catalog.plans.some(
            (p) => filter === "all" || p.interval === filter,
          ) && (
            <div className="plans-state">
              <p>No plans with this billing interval yet.</p>
              <button
                className="site-text-link"
                onClick={() => setFilter("all")}
              >
                See all plans <ArrowRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
