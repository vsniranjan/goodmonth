"use client";
import { useState, type ReactNode } from "react";
import {
  ArrowRight,
  Heart,
  FileText,
  CheckCircle2,
  Clock3,
  Repeat2,
  Wallet,
  Users,
} from "lucide-react";
import type { Workspace, Viewer } from "@/lib/types";
import { metrics, loyalty, calculate } from "@/lib/engine";
import { day, money } from "@/lib/format";
import { Badge, Button, Empty, Stamps } from "./ui";
export function Overview({
  w,
  onNavigate,
}: {
  w: Workspace;
  onNavigate: (
    section: "Subscriptions" | "Invoices" | "Payments" | "Requests",
  ) => void;
}) {
  const m = metrics(w),
    pending = (w.requests || []).filter((r) => r.status === "Pending").length;
  const overdue = w.invoices.filter(
    (i) => i.status === "Confirmed" && new Date(i.dueDate) < new Date(w.clock),
  );
  const values: {
    label: string;
    value: string;
    icon: ReactNode;
    action: "Subscriptions" | "Invoices" | "Payments";
  }[] = [
    {
      label: "Monthly recurring revenue",
      value: money(m.mrr, true),
      icon: <Repeat2 size={19} />,
      action: "Subscriptions",
    },
    {
      label: "Active subscriptions",
      value: String(m.active),
      icon: <Users size={19} />,
      action: "Subscriptions",
    },
    {
      label: "Collected this month",
      value: money(m.collected, true),
      icon: <Wallet size={19} />,
      action: "Payments",
    },
    {
      label: "Outstanding balance",
      value: money(m.outstanding, true),
      icon: <Clock3 size={19} />,
      action: "Invoices",
    },
  ];
  return (
    <div className="focused-overview">
      <div className="summary-metrics">
        {values.map((v) => (
          <button key={v.label} onClick={() => onNavigate(v.action)}>
            <span>
              {v.label}
              {v.icon}
            </span>
            <strong>{v.value}</strong>
            <small>
              View details <ArrowRight size={13} />
            </small>
          </button>
        ))}
      </div>
      <section className="attention-panel">
        <div>
          <p className="site-eyebrow">YOUR NEXT STEPS</p>
          <h2>A little attention goes a long way.</h2>
        </div>
        <button onClick={() => onNavigate("Requests")}>
          <span className="attention-icon">
            <Users size={21} />
          </span>
          <span>
            <strong>
              {pending
                ? `${pending} plan ${pending === 1 ? "request" : "requests"} to review`
                : "You’re all caught up on requests"}
            </strong>
            <small>
              Review customer choices and prepare their subscriptions.
            </small>
          </span>
          <ArrowRight size={20} />
        </button>
        <button onClick={() => onNavigate("Invoices")}>
          <span className="attention-icon">
            <FileText size={21} />
          </span>
          <span>
            <strong>
              {overdue.length
                ? `${overdue.length} overdue ${overdue.length === 1 ? "invoice" : "invoices"}`
                : "No overdue invoices"}
            </strong>
            <small>
              {overdue.length
                ? "Follow up on balances that need attention."
                : "Check all your invoices and upcoming billing."}
            </small>
          </span>
          <ArrowRight size={20} />
        </button>
      </section>
      <section className="recent-activity panel">
        <div className="focused-section-head">
          <h2>Recently in your workspace</h2>
          <span>Latest activity</span>
        </div>
        {w.activities.slice(0, 5).map((a) => (
          <div className="focused-activity" key={a.id}>
            <span className="activity-icon">
              {a.kind === "payment" ? (
                <Wallet size={18} />
              ) : a.kind === "invoice" ? (
                <FileText size={18} />
              ) : (
                <Repeat2 size={18} />
              )}
            </span>
            <div>
              <strong>{a.title}</strong>
              <p>{a.detail}</p>
            </div>
            <small>{day(a.date, { day: "numeric", month: "short" })}</small>
          </div>
        ))}
        {!w.activities.length && (
          <Empty
            title="A fresh start."
            text="Workspace activity will appear here as your business gets going."
          />
        )}
      </section>
    </div>
  );
}
export function Requests({
  w,
  viewer,
  busy,
  onCommand,
  onBrowse,
  onOpen,
}: {
  w: Workspace;
  viewer: Viewer;
  busy: boolean;
  onCommand: (
    type: string,
    payload: Record<string, unknown>,
    message?: string,
  ) => Promise<boolean | undefined>;
  onBrowse: () => void;
  onOpen: (id: string) => void;
}) {
  const [filter, setFilter] = useState("Pending");
  const customer = viewer.role === "customer";
  const requests = (w.requests || [])
    .slice()
    .reverse()
    .filter((r) => filter === "All" || r.status === filter);
  return (
    <section className="request-list panel">
      <div className="request-list-toolbar">
        <div className="filter-tabs">
          {["Pending", "Approved", "Declined", "All"].map((f) => (
            <button
              key={f}
              className={filter === f ? "active" : ""}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        {customer && (
          <Button onClick={onBrowse}>
            Explore plans <ArrowRight size={15} />
          </Button>
        )}
      </div>
      {!requests.length && (
        <Empty
          title={
            filter === "Pending"
              ? "No requests waiting."
              : "Nothing here just yet."
          }
          text={
            customer
              ? "Choose a plan to start your next good month. You can follow its progress here."
              : "Customer plan requests will appear here for review."
          }
        />
      )}
      <div className="request-rows">
        {requests.map((r) => {
          const plan = w.plans.find((p) => p.id === r.planId);
          return (
            <article key={r.id}>
              <div>
                <p className="site-eyebrow">
                  {customer
                    ? "YOUR PLAN REQUEST"
                    : w.customers.find((c) => c.id === r.customerId)?.company ||
                      "Customer request"}
                </p>
                <h3>{plan?.name || "Requested plan"}</h3>
                <p>
                  {r.quantity} {r.quantity === 1 ? "seat" : "seats"} ·{" "}
                  {r.variant} · Requested {day(r.createdAt)}
                </p>
                <small>
                  {r.status === "Pending"
                    ? "Awaiting admin review. No payment is due yet."
                    : r.status === "Approved"
                      ? "Approved. Your subscription is being prepared."
                      : "This request was declined. You can choose another plan."}
                </small>
              </div>
              <div className="request-row-actions">
                <Badge
                  tone={
                    r.status === "Approved"
                      ? "green"
                      : r.status === "Pending"
                        ? "orange"
                        : "neutral"
                  }
                >
                  {r.status}
                </Badge>
                {viewer.role === "admin" && r.status === "Pending" && (
                  <div>
                    <Button
                      disabled={busy}
                      onClick={() =>
                        void onCommand(
                          "approveRequest",
                          { id: r.id },
                          "Request approved. The draft subscription is ready.",
                        )
                      }
                    >
                      Approve
                    </Button>
                    <Button
                      disabled={busy}
                      variant="secondary"
                      onClick={() =>
                        void onCommand(
                          "declineRequest",
                          { id: r.id },
                          "Request declined.",
                        )
                      }
                    >
                      Decline
                    </Button>
                  </div>
                )}
                {r.subscriptionId && (
                  <Button
                    variant="secondary"
                    onClick={() => onOpen(r.subscriptionId!)}
                  >
                    View subscription <ArrowRight size={14} />
                  </Button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
export function CustomerHome({
  w,
  onAction,
  onBrowse,
  onRequests,
  onInvoices,
}: {
  w: Workspace;
  onAction: (kind: string, id?: string) => void;
  onBrowse: () => void;
  onRequests: () => void;
  onInvoices: () => void;
}) {
  const [chosen, setChosen] = useState("");
  const s =
    w.subscriptions.find((s) => s.id === chosen) ||
    w.subscriptions.find((s) => s.stage === "Active") ||
    w.subscriptions[0];
  const p = w.plans.find((p) => p.id === s?.planId);
  const pending = (w.requests || []).filter(
    (r) => r.status === "Pending",
  ).length;
  if (!s || !p)
    return (
      <div className="portal-welcome">
        <span className="portal-welcome-icon">
          <Heart size={30} />
        </span>
        <p className="site-eyebrow">A GOOD PLACE TO BEGIN</p>
        <h2>
          {pending
            ? "Your next chapter is in the works."
            : "Let’s find your first good month."}
        </h2>
        <p>
          {pending
            ? "Your plan request is with our team. You can follow its progress while we prepare the details."
            : "Explore our plans and choose the one that fits. Your subscription, invoices, and rewards will feel right at home here."}
        </p>
        <Button onClick={pending ? onRequests : onBrowse}>
          {pending ? "View your request" : "Explore plans"}
          <ArrowRight size={17} />
        </Button>
      </div>
    );
  const discount = loyalty(w, s),
    amount = w.previews?.[s.id]?.total ?? calculate(w, s).total;
  const invoice = w.invoices
    .filter(
      (i) =>
        i.subscriptionId === s.id &&
        i.status === "Confirmed" &&
        i.paid < i.total,
    )
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
  const rewards = p.loyalty && p.interval === "monthly";
  return (
    <div className="customer-home">
      {w.subscriptions.length > 1 && (
        <label className="subscription-switch">
          Your subscription
          <select value={s.id} onChange={(e) => setChosen(e.target.value)}>
            {w.subscriptions.map((s) => (
              <option key={s.id} value={s.id}>
                {w.plans.find((p) => p.id === s.planId)?.name} · {s.number}
              </option>
            ))}
          </select>
        </label>
      )}
      {pending > 0 && (
        <button className="portal-pending" onClick={onRequests}>
          <Clock3 size={19} />
          {pending} plan {pending === 1 ? "request is" : "requests are"} being
          reviewed <ArrowRight size={16} />
        </button>
      )}
      <section className="customer-plan">
        <div className="customer-plan-title">
          <span className="site-eyebrow">YOUR SUBSCRIPTION</span>
          <Badge tone={s.stage === "Active" ? "green" : "neutral"}>
            {s.paused ? "Paused" : s.stage}
          </Badge>
        </div>
        <h2>{p.name}</h2>
        <p>
          {s.number} · {s.quantity} {s.quantity === 1 ? "seat" : "seats"} ·{" "}
          {s.variant}
        </p>
        <div className="customer-plan-values">
          <div>
            <span>
              {s.stage === "Active" && !s.paused
                ? "Next period estimate"
                : "Recurring estimate"}
            </span>
            <strong>{money(amount)}</strong>
            <small>
              Including tax ·{" "}
              {
                {
                  daily: "daily",
                  weekly: "weekly",
                  monthly: "monthly",
                  yearly: "annual",
                }[p.interval]
              }{" "}
              period
            </small>
          </div>
          <div>
            <span>
              {s.stage === "Active" && !s.paused
                ? "Next renewal"
                : "What happens next"}
            </span>
            <strong className="renewal-value">
              {s.stage === "Active" && !s.paused
                ? day(s.nextBilling)
                : s.paused
                  ? "Ready when you are"
                  : s.stage === "Closed"
                    ? "Subscription ended"
                    : "We’re preparing your plan"}
            </strong>
            <small>
              {s.stage === "Active"
                ? "See your invoice for the payment deadline"
                : "Your plan details show the current progress"}
            </small>
          </div>
        </div>
        <Button
          variant="secondary"
          onClick={() => onAction("subscriptionDetail", s.id)}
        >
          Manage subscription <ArrowRight size={16} />
        </Button>
      </section>
      {invoice && (
        <button
          className="customer-invoice-due"
          onClick={() => onAction("invoice", invoice.id)}
        >
          <FileText size={23} />
          <span>
            <strong>{money(invoice.total - invoice.paid)} outstanding</strong>
            <small>
              {invoice.number} · Due {day(invoice.dueDate)}
            </small>
          </span>
          <span>
            View invoice <ArrowRight size={16} />
          </span>
        </button>
      )}
      <div className="customer-bottom">
        <section className="customer-reward">
          <p className="site-eyebrow">
            <Heart size={14} /> YOUR LOYALTY
          </p>
          <h3>
            {rewards
              ? "Good things are adding up."
              : "A good rhythm, all your own."}
          </h3>
          {rewards ? (
            <>
              <Stamps streak={s.streak} />
              <p>
                <strong>{discount}% off your recurring price.</strong>
                <br />
                {discount >= s.loyaltyCap
                  ? "You’ve reached your plan’s reward cap."
                  : `An eligible on-time renewal earns another ${p.step}%, up to ${p.cap}%.`}
              </p>
              <small>
                Missed payment deadlines reset your streak. Issued invoices keep
                their agreed amount.
              </small>
            </>
          ) : (
            <p>
              This plan doesn’t earn monthly loyalty rewards. Your plan and
              invoices are always available here.
            </p>
          )}
        </section>
        <section className="customer-quick-links">
          <h3>Everything in its place.</h3>
          <button onClick={onInvoices}>
            <FileText size={20} />
            <span>
              Invoices & billing<small>Your complete paper trail</small>
            </span>
            <ArrowRight size={17} />
          </button>
          <button onClick={onRequests}>
            <Clock3 size={20} />
            <span>
              Plan requests<small>Follow your next chapter</small>
            </span>
            <ArrowRight size={17} />
          </button>
          <button onClick={onBrowse}>
            <Repeat2 size={20} />
            <span>
              Explore more plans<small>Find room for what comes next</small>
            </span>
            <ArrowRight size={17} />
          </button>
        </section>
      </div>
    </div>
  );
}
