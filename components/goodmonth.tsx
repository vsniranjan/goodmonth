"use client";
import {
  useEffect,
  useState,
  useRef,
  type ReactNode,
  type FormEvent,
} from "react";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowDownLeft,
  Plus,
  Search,
  Bell,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  LayoutDashboard,
  Repeat2,
  Users,
  FileText,
  Wallet,
  Package,
  Heart,
  Settings,
  LogOut,
  Menu,
  X,
  Check,
  CheckCircle2,
  Clock3,
  MoreHorizontal,
  Download,
  Play,
  RotateCcw,
  CalendarDays,
  CircleHelp,
  SlidersHorizontal,
  CreditCard,
  Pause,
  Mail,
  Printer,
  Send,
  Percent,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import {
  Logo,
  Sun,
  Button,
  Badge,
  Modal,
  Empty,
  SectionHead,
  TextLink,
  Stamps,
} from "./ui";
import { seedWorkspace } from "@/lib/seed";
import {
  applyCommand,
  calculate,
  loyalty,
  metrics,
  paymentDeadline,
  reconcile,
  runBilling,
  visibleWorkspace,
} from "@/lib/engine";
import { day, id, initials, istMonth, money } from "@/lib/format";
import type {
  Command,
  Customer,
  Invoice,
  Plan,
  Subscription,
  Viewer,
  Workspace,
} from "@/lib/types";

type Tab =
  | "Overview"
  | "Subscriptions"
  | "Customers"
  | "Invoices"
  | "Payments"
  | "Products & plans"
  | "Loyalty club"
  | "Settings"
  | "My subscription";
type Dialog = { kind: string; data?: string };
const nav = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Subscriptions", icon: Repeat2 },
  { name: "Customers", icon: Users },
  { name: "Invoices", icon: FileText },
  { name: "Payments", icon: Wallet },
  { name: "Products & plans", icon: Package },
  { name: "Loyalty club", icon: Heart },
] as const;
const demoViewer: Viewer = {
  id: "demo_admin",
  name: "Alex Morgan",
  email: "alex@brightloop.example",
  role: "admin",
};
const titles: Record<Tab, { eyebrow: string; title: string; sub: string }> = {
  Overview: {
    eyebrow: "A LITTLE CLARITY, EVERY DAY",
    title: "Good things are adding up.",
    sub: "Here’s how your subscriptions are doing. Looking good, by the way.",
  },
  Subscriptions: {
    eyebrow: "BUILT FOR THE LONG RUN",
    title: "Every month, together.",
    sub: "From the first hello to the next renewal. Keep it all in one place.",
  },
  Customers: {
    eyebrow: "THE PEOPLE BEHIND THE NUMBERS",
    title: "Your kind of people.",
    sub: "Growing businesses. Familiar faces. A few new beginnings.",
  },
  Invoices: {
    eyebrow: "EVERY DETAIL, ACCOUNTED FOR",
    title: "Nothing left to guess.",
    sub: "Clear invoices, happy customers, and a little less paperwork.",
  },
  Payments: {
    eyebrow: "THE GOOD STUFF COMING IN",
    title: "All the little cha-chings.",
    sub: "Every payment has a place. Every balance has an answer.",
  },
  "Products & plans": {
    eyebrow: "MAKE ROOM FOR GOOD IDEAS",
    title: "A plan for every chapter.",
    sub: "Set the price. Pick the rhythm. Give your customers room to grow.",
  },
  "Loyalty club": {
    eyebrow: "OUR FAVOURITE KIND OF COMMITMENT",
    title: "Staying looks good on you.",
    sub: "A little thank-you for the customers who come back, month after month.",
  },
  Settings: {
    eyebrow: "THE WAY YOU LIKE IT",
    title: "Make yourself at home.",
    sub: "The small details that keep your business running smoothly.",
  },
  "My subscription": {
    eyebrow: "YOUR LITTLE CORNER OF GOODMONTH",
    title: "Here’s to another good month.",
    sub: "Your plan, your perks, and a little something for sticking around.",
  },
};
const statusTone = (s: string) =>
  s === "Paid" || s === "Active"
    ? "green"
    : s === "Overdue"
      ? "red"
      : s === "Quotation" || s === "Draft"
        ? "neutral"
        : s === "Paused"
          ? "orange"
          : "";
const invStatus = (i: Invoice, w: Workspace) =>
  i.status === "Confirmed" && new Date(i.dueDate) < new Date(w.clock)
    ? "Overdue"
    : i.status;
function Avatar({
  customer,
  small = false,
}: {
  customer?: Customer;
  small?: boolean;
}) {
  return (
    <span
      className={`avatar ${small ? "sm" : ""}`}
      style={{ background: customer?.color || "#d7ddcd" }}
    >
      {initials(customer?.company || "Good Month")}
    </span>
  );
}
function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
function FormInput({
  name,
  defaultValue = "",
  type = "text",
  required = true,
  min,
  max,
  placeholder,
}: {
  name: string;
  defaultValue?: string | number;
  type?: string;
  required?: boolean;
  min?: number;
  max?: number;
  placeholder?: string;
}) {
  return (
    <input
      name={name}
      defaultValue={defaultValue}
      type={type}
      required={required}
      min={min}
      max={max}
      placeholder={placeholder}
      step={type === "number" ? "0.01" : undefined}
    />
  );
}
function Toggle({
  name,
  defaultChecked = false,
  label,
}: {
  name: string;
  defaultChecked?: boolean;
  label: string;
}) {
  return (
    <label className="toggle-row">
      <span>{label}</span>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} />
    </label>
  );
}

export default function Goodmonth() {
  const [w, setW] = useState<Workspace | null>(null),
    [viewer, setViewer] = useState<Viewer>(demoViewer),
    [live, setLive] = useState(false),
    [tab, setTab] = useState<Tab>("Overview"),
    [dialog, setDialog] = useState<Dialog | null>(null),
    [toast, setToast] = useState(""),
    [busy, setBusy] = useState(false),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState("All"),
    [page, setPage] = useState(1),
    [mobile, setMobile] = useState(false),
    [narrow, setNarrow] = useState(false),
    [demoTools, setDemoTools] = useState(false),
    [globalSearch, setGlobalSearch] = useState(""),
    [setup, setSetup] = useState(false),
    [bootError, setBootError] = useState(""),
    [planChoice, setPlanChoice] = useState(""),
    [notifications, setNotifications] = useState(false),
    [ops, setOps] = useState<{
      users: Record<string, string>[];
      jobs: Record<string, unknown>[];
      outbox: Record<string, string>[];
    } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const announce = (text: string) => {
    setToast(text);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 5000);
  };
  const demoEnabled = process.env.NEXT_PUBLIC_DEMO_ENABLED !== "false";
  useEffect(() => {
    const query = matchMedia("(max-width:760px)");
    const sync = () => setNarrow(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    async function boot() {
      const reset = new URLSearchParams(location.search).get("reset");
      if (reset) setDialog({ kind: "reset", data: reset });
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.error || "Could not load your account.");
        if (data.user) {
          const r = await fetch("/api/workspace");
          const d = await r.json();
          if (!r.ok) throw new Error(d.error);
          setW(d.workspace);
          setViewer(d.viewer);
          setLive(true);
          if (d.viewer.role === "customer") setTab("My subscription");
          return;
        }
        if (data.configured) {
          setSetup(true);
          return;
        }
      } catch (e) {
        setSetup(true);
        setBootError(
          e instanceof Error
            ? e.message
            : "Could not connect. Please try again.",
        );
        return;
      }
      if (demoEnabled) {
        try {
          const stored = localStorage.getItem("goodmonth-demo-v1");
          const seed = stored ? JSON.parse(stored) : seedWorkspace();
          reconcile(seed);
          setW(seed);
        } catch {
          const sample = seedWorkspace();
          reconcile(sample);
          setW(sample);
        }
      } else setSetup(true);
    }
    boot();
  }, [demoEnabled]);
  useEffect(() => {
    if (w && !live)
      localStorage.setItem("goodmonth-demo-v1", JSON.stringify(w));
  }, [w, live]);
  useEffect(() => {
    setPlanChoice("");
  }, [dialog?.kind, dialog?.data]);
  useEffect(() => {
    setSearch("");
    setFilter("All");
    setPage(1);
    setMobile(false);
  }, [tab]);
  useEffect(() => {
    if (tab === "Settings" && live && viewer.role === "admin")
      fetch("/api/demo")
        .then((r) => r.json())
        .then((d) => {
          if (!d.error) setOps(d);
        })
        .catch(() => {});
  }, [tab, live, viewer.role]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDialog(null);
        setDemoTools(false);
        setNotifications(false);
        setMobile(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("global-search")?.focus();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  async function command(
    type: string,
    payload: Record<string, unknown>,
    message = "All saved. Looking good.",
    close = true,
  ) {
    if (!w) return;
    setBusy(true);
    try {
      const cmd: Command = { type, payload, requestKey: id("request") };
      if (live) {
        const res = await fetch("/api/command", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cmd),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setW(data.workspace);
        if (data.message) message = data.message;
      } else {
        if (type === "sendInvoice") {
          announce("Sample invoice sent to the demo outbox.");
          if (close) setDialog(null);
          return;
        }
        setW(applyCommand(w, cmd, viewer));
      }
      if (close) setDialog(null);
      announce(message);
    } catch (e) {
      announce(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }
  async function auth(action: string, values: Record<string, unknown>) {
    setBusy(true);
    try {
      const res = await fetch(`/api/auth/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      if (["login", "register"].includes(action)) location.href = "/";
      else if (action === "reset") {
        history.replaceState({}, "", "/");
        setDialog({ kind: "login" });
        announce("Password updated. Welcome back.");
      } else {
        setDialog(null);
        announce(d.message || "All saved.");
      }
    } catch (e) {
      announce(e instanceof Error ? e.message : "Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }
  function go(t: Tab) {
    setMobile(false);
    setTab(t);
    setGlobalSearch("");
  }
  function advance(days: number) {
    if (!w || live) return;
    const next = structuredClone(w);
    next.clock = new Date(
      new Date(next.clock).getTime() + days * 86400000,
    ).toISOString();
    const result = runBilling(next);
    setW(next);
    announce(
      `${days} days forward. ${result.processed} billing periods processed.`,
    );
  }
  const current = w ? visibleWorkspace(w, viewer) : null;
  if (!w)
    return (
      <main className={setup ? "welcome-page" : "boot"}>
        <Logo />
        {setup ? (
          <>
            <section className="welcome-content">
              <div className="welcome-story">
                <p className="eyebrow">STAYING PAYS. QUITE LITERALLY.</p>
                <h1>
                  Good months.
                  <br />
                  <em>Better together.</em>
                </h1>
                <p>
                  Your subscriptions, a little simpler.
                  <br />
                  Your loyalty, a little more rewarding.
                </p>
                <Sun size={110} />
                <div className="welcome-prices">
                  <span>
                    Month one<strong>₹1,000</strong>
                  </span>
                  <ArrowRight size={22} />
                  <span>
                    Month five<strong>₹800</strong>
                  </span>
                </div>
                <small>
                  Example before tax · 5% per on-time renewal · capped at 20%
                </small>
              </div>
              <div className="welcome-form panel">
                <p className="eyebrow">YOUR NEXT CHAPTER</p>
                <h2>
                  {dialog?.kind === "register"
                    ? "Make yourself at home."
                    : dialog?.kind === "forgot"
                      ? "A fresh start."
                      : dialog?.kind === "reset"
                        ? "A new little secret."
                        : "Welcome back."}
                </h2>
                {bootError && (
                  <p role="alert" className="login-error">
                    {bootError}
                  </p>
                )}
                <AuthForm
                  kind={dialog?.kind || "login"}
                  token={dialog?.data}
                  busy={busy}
                  onSubmit={auth}
                  onChange={(kind) => setDialog({ kind })}
                />
                {demoEnabled && (
                  <button
                    className="welcome-demo"
                    onClick={() => {
                      const sample = seedWorkspace();
                      reconcile(sample);
                      setW(sample);
                      setSetup(false);
                      setDialog(null);
                    }}
                  >
                    Just looking? Explore the sample workspace{" "}
                    <ArrowUpRight size={14} />
                  </button>
                )}
              </div>
            </section>
            <footer>Made for good months. And the people behind them.</footer>
          </>
        ) : (
          <>
            <Sun size={70} />
            <p>Putting the kettle on…</p>
          </>
        )}
        {toast && (
          <div role="alert" className="toast">
            <AlertCircle size={18} />
            <span>{toast}</span>
            <button aria-label="Dismiss message" onClick={() => setToast("")}>
              <X size={15} />
            </button>
          </div>
        )}
      </main>
    );
  const m = metrics(current!),
    isCustomer = viewer.role === "customer",
    title = titles[tab];
  const c = current!;
  const findCustomer = (cid: string) => c.customers.find((x) => x.id === cid);
  const invoiceFor = dialog?.data
    ? c.invoices.find((x) => x.id === dialog.data)
    : undefined;
  const subFor = dialog?.data
    ? c.subscriptions.find((x) => x.id === dialog.data)
    : undefined;
  const rowsPerPage = 8;
  const matching = (text: string) =>
    text.toLowerCase().includes(search.toLowerCase());
  const overdue = c.invoices.filter((i) => invStatus(i, c) === "Overdue");
  const monthLabel = day(c.clock, { month: "long", year: "numeric" });
  const allResults =
    globalSearch.length > 1
      ? [
          ...(isCustomer ? [] : c.customers)
            .filter((x) =>
              (x.company + x.name)
                .toLowerCase()
                .includes(globalSearch.toLowerCase()),
            )
            .map((x) => ({
              label: x.company,
              detail: x.name,
              tab: "Customers" as Tab,
            })),
          ...c.subscriptions
            .filter((x) =>
              x.number.toLowerCase().includes(globalSearch.toLowerCase()),
            )
            .map((x) => ({
              label: x.number,
              detail: findCustomer(x.customerId)?.company || "",
              tab: (isCustomer ? "My subscription" : "Subscriptions") as Tab,
            })),
          ...c.invoices
            .filter((x) =>
              x.number.toLowerCase().includes(globalSearch.toLowerCase()),
            )
            .map((x) => ({
              label: x.number,
              detail: money(x.total),
              tab: "Invoices" as Tab,
            })),
        ].slice(0, 6)
      : [];
  return (
    <div className="app-shell">
      {mobile && (
        <div className="sidebar-overlay" onClick={() => setMobile(false)} />
      )}
      <aside
        className={`sidebar ${mobile ? "open" : ""}`}
        inert={narrow && !mobile}
      >
        <a className="brand" href="/" aria-label="Goodmonth home">
          <Logo />
        </a>
        <button
          className="workspace-picker"
          onClick={() => setDialog({ kind: "workspace" })}
        >
          <span className="workspace-monogram">b.</span>
          <span>
            <strong>Brightloop</strong>
            <small>YOUR WORKSPACE</small>
          </span>
          <ChevronDown size={15} />
        </button>
        <p className="nav-caption">THE DAY-TO-DAY</p>
        <nav aria-label="Main navigation">
          {(isCustomer
            ? [
                { name: "My subscription", icon: Heart },
                { name: "Invoices", icon: FileText },
              ]
            : nav
          ).map((item) => (
            <button
              key={item.name}
              className={`nav-item ${tab === item.name ? "selected" : ""}`}
              onClick={() => go(item.name as Tab)}
            >
              <item.icon size={19} strokeWidth={1.6} />
              <span>{item.name}</span>
              {item.name === "Invoices" && overdue.length > 0 && (
                <span className="nav-count">{overdue.length}</span>
              )}
              {tab === item.name && <span className="nav-active-dot" />}
            </button>
          ))}
        </nav>
        {!isCustomer && (
          <div className="sidebar-loyalty">
            <Sun size={42} />
            <span className="tiny-label">A LITTLE THANK-YOU</span>
            <h3>
              Good months.
              <br />
              Better together.
            </h3>
            <p>Turn everyday renewals into a reason to stay.</p>
            <button onClick={() => go("Loyalty club")}>
              Meet your loyalty club <ArrowUpRight size={15} />
            </button>
          </div>
        )}
        <div className="sidebar-bottom">
          <button
            className={`nav-item ${tab === "Settings" ? "selected" : ""}`}
            onClick={() =>
              isCustomer ? setDialog({ kind: "help" }) : go("Settings")
            }
          >
            <Settings size={18} />
            {isCustomer ? "Need a hand?" : "Settings"}
            <span className="new-dot" />
          </button>
          <button
            className="profile"
            onClick={() => setDialog({ kind: "account" })}
          >
            <span className="profile-avatar">{initials(viewer.name)}</span>
            <span>
              <strong>{viewer.name}</strong>
              <small>
                {live
                  ? viewer.role === "admin"
                    ? "Workspace admin"
                    : viewer.role
                  : "Sample workspace"}
              </small>
            </span>
            <MoreHorizontal size={19} />
          </button>
        </div>
      </aside>
      <div className="main-shell" inert={narrow && mobile}>
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-btn mobile-menu"
              onClick={() => setMobile(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>{tab}</strong>
          </div>
          <div className="topbar-actions">
            <div className="global-search">
              <Search size={15} />
              <input
                id="global-search"
                placeholder="Find something…"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                aria-label="Search workspace"
              />
              <kbd>⌘ K</kbd>
              {globalSearch && (
                <div className="search-results">
                  {allResults.length ? (
                    allResults.map((r, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          go(r.tab);
                          setSearch(r.label);
                        }}
                      >
                        <span>
                          {r.label}
                          <small>{r.detail}</small>
                        </span>
                        <ArrowUpRight size={15} />
                      </button>
                    ))
                  ) : (
                    <p>No matches. Try a customer or invoice number.</p>
                  )}
                </div>
              )}
            </div>
            <button
              className="icon-btn notification-btn"
              aria-label="Notifications"
              onClick={() => setNotifications(!notifications)}
            >
              <Bell size={18} />
              {overdue.length > 0 && <i />}
            </button>
            <span className="top-divider" />
            <span className="top-avatar">{initials(viewer.name)}</span>
          </div>
          {notifications && (
            <div className="notification-panel">
              <SectionHead title="A few things to know" />
              <p>
                {overdue.length
                  ? `${overdue.length} invoices need a little attention.`
                  : "You’re all caught up. Nice."}
              </p>
              {overdue.slice(0, 3).map((i) => (
                <button
                  key={i.id}
                  onClick={() => {
                    setDialog({ kind: "invoice", data: i.id });
                    setNotifications(false);
                  }}
                >
                  <AlertCircle size={17} />
                  {i.number}
                  <span>{money(i.total - i.paid)}</span>
                </button>
              ))}
            </div>
          )}
        </header>
        <main className="main-content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">
                {title.eyebrow}
                <span className="eyebrow-line" />
              </p>
              <h1>{title.title}</h1>
              <p className="page-subtitle">{title.sub}</p>
            </div>
            <div className="heading-actions">
              {!live && (
                <button
                  className="demo-pill"
                  onClick={() => setDemoTools(true)}
                >
                  <span />
                  Sample workspace <ChevronDown size={13} />
                </button>
              )}
              {tab === "Overview" ? (
                <Button
                  variant="secondary"
                  onClick={() => setDialog({ kind: "date" })}
                >
                  <CalendarDays size={16} />
                  {monthLabel}
                  <ChevronDown size={14} />
                </Button>
              ) : !isCustomer && tab === "Subscriptions" ? (
                <Button onClick={() => setDialog({ kind: "subscription" })}>
                  <Plus size={16} />
                  New subscription
                </Button>
              ) : !isCustomer && tab === "Customers" ? (
                <Button onClick={() => setDialog({ kind: "customer" })}>
                  <Plus size={16} />
                  Add customer
                </Button>
              ) : tab === "Invoices" && !isCustomer ? (
                <Button
                  onClick={() =>
                    command(
                      "runBilling",
                      {},
                      "Billing run complete. No duplicate invoices.",
                    )
                  }
                  disabled={busy}
                >
                  <Repeat2 size={16} />
                  Run billing
                </Button>
              ) : tab === "Products & plans" && viewer.role === "admin" ? (
                <Button onClick={() => setDialog({ kind: "plan" })}>
                  <Plus size={16} />
                  Create a plan
                </Button>
              ) : null}
            </div>
          </div>
          {tab === "Overview" && (
            <>
              <section className="hero-banner">
                <div className="hero-copy">
                  <span className="banner-label">
                    <span />
                    STAYING PAYS. QUITE LITERALLY.
                  </span>
                  <h2>
                    Good for your customers.
                    <br />
                    <em>Even better for your business.</em>
                  </h2>
                  <p>
                    Every on-time renewal earns a little more off.
                    <br className="desktop-only" /> A reason to stay. A
                    relationship that grows.
                  </p>
                  <button
                    className="banner-link"
                    onClick={() => go("Loyalty club")}
                  >
                    Take a look at your loyalty club <ArrowRight size={17} />
                  </button>
                </div>
                <div className="banner-art">
                  <div className="art-dashed-loop" />
                  <Sun size={73} className="hero-sun" />
                  <div className="mini-loyalty-card">
                    <div>
                      <span>THE GOODMONTH CLUB</span>
                      <Heart size={15} />
                    </div>
                    <h3>
                      A little loyalty.
                      <br />A lovely little perk.
                    </h3>
                    <Stamps streak={4} small />
                    <footer>
                      <span>YOUR NEXT MONTH</span>
                      <strong>
                        20% <small>off</small>
                      </strong>
                    </footer>
                  </div>
                  <span className="handwritten">
                    little things add up{" "}
                    <svg width="67" height="24" viewBox="0 0 67 24">
                      <path
                        d="M2 5q36 30 60 0m-12 0 13-2-4 12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.4"
                      />
                    </svg>
                  </span>
                </div>
              </section>
              <section className="metrics-grid" aria-label="Business metrics">
                <Metric
                  label="Monthly recurring revenue"
                  value={money(m.mrr, true)}
                  note="Your steady monthly rhythm"
                  icon={<Repeat2 size={17} />}
                  accent
                />
                <Metric
                  label="Active subscriptions"
                  value={String(m.active).padStart(2, "0")}
                  note={`${c.customers.length} businesses growing with you`}
                  icon={<Users size={17} />}
                />
                <Metric
                  label="Collected this month"
                  value={money(m.collected, true)}
                  note="Money in. A good feeling."
                  icon={<ArrowDownLeft size={17} />}
                />
                <Metric
                  label="Outstanding balance"
                  value={money(m.outstanding, true)}
                  note={`${m.overdue} invoices need a little nudge`}
                  icon={<Clock3 size={17} />}
                  warning
                />
              </section>
              <div className="overview-middle">
                <section className="panel revenue-panel">
                  <SectionHead
                    title="A good kind of growth"
                    sub="Payments collected, month by month"
                    action={
                      <span className="chart-legend">
                        <i />
                        Collected revenue
                      </span>
                    }
                  />
                  <RevenueChart w={c} />
                  <div className="chart-foot">
                    <span>
                      <span className="soft-dot" />
                      Every renewal is a little vote of confidence.
                    </span>
                    <TextLink onClick={() => go("Payments")}>
                      See payments
                    </TextLink>
                  </div>
                </section>
                <section className="panel loyalty-panel">
                  <div className="loyalty-top">
                    <span className="mini-tag">THE LOYALTY EFFECT</span>
                    <Heart size={19} />
                  </div>
                  <h3>
                    A little less.
                    <br />
                    <em>A lot more loyalty.</em>
                  </h3>
                  <div className="loyalty-stat">
                    {money(m.savings, true)}
                    <span>given back in customer savings</span>
                  </div>
                  <div className="loyalty-divider" />
                  <div className="loyalty-people">
                    <div className="avatar-stack">
                      {c.customers.slice(0, 3).map((x) => (
                        <Avatar key={x.id} customer={x} small />
                      ))}
                    </div>
                    <p>
                      <strong>
                        {c.subscriptions.filter((s) => s.streak >= 2).length}{" "}
                        loyal subscribers
                      </strong>
                      <br />
                      and counting. Here’s to them.
                    </p>
                  </div>
                  <button onClick={() => go("Loyalty club")}>
                    A closer look <ArrowUpRight size={17} />
                  </button>
                </section>
              </div>
              <section className="panel subscriptions-panel">
                <SectionHead
                  title="Familiar faces, fresh renewals"
                  sub="A few of the good people growing with you"
                  action={
                    <TextLink onClick={() => go("Subscriptions")}>
                      All subscriptions
                    </TextLink>
                  }
                />
                {subscriptionTable(c.subscriptions.slice(0, 4))}
              </section>
              <div className="overview-bottom">
                <section className="panel activity-panel">
                  <SectionHead
                    title="Around here lately"
                    action={
                      <span className="small-label">THE LITTLE UPDATES</span>
                    }
                  />
                  {c.activities.slice(0, 3).map((a, i) => (
                    <div className="activity-row" key={a.id}>
                      <span className={`activity-icon kind-${a.kind}`}>
                        {a.kind === "payment" ? (
                          <ArrowDownLeft size={16} />
                        ) : a.kind === "reset" ? (
                          <Clock3 size={16} />
                        ) : (
                          <Heart size={16} />
                        )}
                      </span>
                      <div>
                        <strong>{a.title}</strong>
                        <p>{a.detail}</p>
                      </div>
                      <small>
                        {day(a.date, { day: "numeric", month: "short" })}
                      </small>
                    </div>
                  ))}
                </section>
                <section className="note-card">
                  <span className="tiny-label">A NOTE FROM GOODMONTH</span>
                  <h3>
                    Behind every renewal
                    <br />
                    is a reason to stay.
                  </h3>
                  <p>Make yours a good one.</p>
                  <span className="note-scribble">That’s the whole idea.</span>
                  <Sun size={55} />
                </section>
              </div>
            </>
          )}
          {tab === "Subscriptions" && (
            <section className="panel">
              <div className="table-toolbar">
                <div className="filter-tabs">
                  {["All", "Active", "Quotation", "Draft", "Closed"].map(
                    (f) => (
                      <button
                        key={f}
                        className={filter === f ? "active" : ""}
                        onClick={() => {
                          setFilter(f);
                          setPage(1);
                        }}
                      >
                        {f}
                        {f === "All" && <span>{c.subscriptions.length}</span>}
                      </button>
                    ),
                  )}
                </div>
                <SearchField
                  value={search}
                  onChange={(v) => {
                    setSearch(v);
                    setPage(1);
                  }}
                  placeholder="Find a subscription…"
                />
              </div>
              {subscriptionTable(
                c.subscriptions
                  .filter(
                    (s) =>
                      (filter === "All" || s.stage === filter) &&
                      matching(
                        s.number + " " + findCustomer(s.customerId)?.company,
                      ),
                  )
                  .slice((page - 1) * rowsPerPage, page * rowsPerPage),
              )}
              <Pagination
                page={page}
                total={
                  c.subscriptions.filter(
                    (s) =>
                      (filter === "All" || s.stage === filter) &&
                      matching(
                        s.number + " " + findCustomer(s.customerId)?.company,
                      ),
                  ).length
                }
                onPage={setPage}
              />
            </section>
          )}
          {tab === "Customers" && (
            <>
              <div className="table-toolbar standalone">
                <p className="muted">
                  {c.customers.length} good businesses, and counting.
                </p>
                <SearchField
                  value={search}
                  onChange={setSearch}
                  placeholder="Find a familiar face…"
                />
              </div>
              <div className="customer-grid">
                {c.customers
                  .filter((x) =>
                    matching(x.company + " " + x.name + " " + x.email),
                  )
                  .map((x) => {
                    const subs = c.subscriptions.filter(
                        (s) => s.customerId === x.id,
                      ),
                      balance = c.invoices
                        .filter(
                          (i) =>
                            i.customerId === x.id && i.status !== "Cancelled",
                        )
                        .reduce((n, i) => n + i.total - i.paid, 0);
                    return (
                      <button
                        className="panel customer-card"
                        key={x.id}
                        onClick={() =>
                          setDialog({ kind: "customerDetail", data: x.id })
                        }
                      >
                        <div className="customer-card-top">
                          <Avatar customer={x} />
                          <ArrowUpRight size={18} />
                        </div>
                        <h3>{x.company}</h3>
                        <p>{x.name}</p>
                        <small>{x.email}</small>
                        <div className="customer-stats">
                          <span>
                            <small>SUBSCRIPTIONS</small>
                            <strong>{subs.length}</strong>
                          </span>
                          <span>
                            <small>OUTSTANDING</small>
                            <strong>{money(balance)}</strong>
                          </span>
                        </div>
                      </button>
                    );
                  })}
              </div>
              {!c.customers.filter((x) =>
                matching(x.company + " " + x.name + " " + x.email),
              ).length && (
                <Empty
                  title="No familiar faces here. Yet."
                  text="Try another search or add your first customer."
                />
              )}
            </>
          )}
          {tab === "Invoices" && (
            <section className="panel">
              <div className="table-toolbar">
                <div className="filter-tabs">
                  {["All", "Draft", "Confirmed", "Paid", "Overdue"].map((f) => (
                    <button
                      key={f}
                      className={filter === f ? "active" : ""}
                      onClick={() => {
                        setFilter(f);
                        setPage(1);
                      }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <SearchField
                  value={search}
                  onChange={(v) => {
                    setSearch(v);
                    setPage(1);
                  }}
                  placeholder="Find an invoice…"
                />
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>INVOICE</th>
                      {!isCustomer && <th>CUSTOMER</th>}
                      <th>DUE DATE</th>
                      <th>AMOUNT</th>
                      <th>OUTSTANDING</th>
                      <th>STATUS</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {c.invoices
                      .slice()
                      .reverse()
                      .filter(
                        (i) =>
                          (filter === "All" || invStatus(i, c) === filter) &&
                          matching(
                            i.number +
                              " " +
                              findCustomer(i.customerId)?.company,
                          ),
                      )
                      .slice((page - 1) * rowsPerPage, page * rowsPerPage)
                      .map((i) => (
                        <tr
                          key={i.id}
                          onClick={() =>
                            setDialog({ kind: "invoice", data: i.id })
                          }
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter")
                              setDialog({ kind: "invoice", data: i.id });
                          }}
                        >
                          <td className="medium">{i.number}</td>
                          {!isCustomer && (
                            <td>
                              <div className="person-cell">
                                <Avatar
                                  customer={findCustomer(i.customerId)}
                                  small
                                />
                                {findCustomer(i.customerId)?.company}
                              </div>
                            </td>
                          )}
                          <td>
                            {day(i.dueDate, { month: "short", day: "numeric" })}
                          </td>
                          <td className="numeric">{money(i.total)}</td>
                          <td className="numeric">{money(i.total - i.paid)}</td>
                          <td>
                            <Badge tone={statusTone(invStatus(i, c))}>
                              {invStatus(i, c)}
                            </Badge>
                          </td>
                          <td>
                            <ArrowUpRight size={16} />
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {!c.invoices.length && (
                <Empty
                  title="A clean slate."
                  text="Invoices will appear here when your subscriptions are ready to bill."
                />
              )}
              <Pagination
                page={page}
                total={
                  c.invoices.filter(
                    (i) =>
                      (filter === "All" || invStatus(i, c) === filter) &&
                      matching(
                        i.number + " " + findCustomer(i.customerId)?.company,
                      ),
                  ).length
                }
                onPage={setPage}
              />
            </section>
          )}
          {tab === "Payments" && (
            <>
              <div className="metrics-grid three">
                <Metric
                  label="Collected this month"
                  value={money(m.collected)}
                  note="A lovely little total"
                  icon={<Wallet size={18} />}
                  accent
                />
                <Metric
                  label="Payments recorded"
                  value={String(c.payments.length)}
                  note="Every one accounted for"
                  icon={<CheckCircle2 size={18} />}
                />
                <Metric
                  label="Still to come"
                  value={money(m.outstanding)}
                  note="Outstanding across all invoices"
                  icon={<Clock3 size={18} />}
                />
              </div>
              <section className="panel">
                <SectionHead
                  title="The payment book"
                  sub="A record of every little cha-ching"
                  action={
                    <Button
                      variant="secondary"
                      onClick={() => setDialog({ kind: "payment" })}
                    >
                      <Plus size={16} />
                      Record payment
                    </Button>
                  }
                />
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>CUSTOMER</th>
                        <th>INVOICE</th>
                        <th>METHOD</th>
                        <th>DATE</th>
                        <th>AMOUNT</th>
                        <th>NOTE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {c.payments
                        .slice()
                        .reverse()
                        .slice((page - 1) * rowsPerPage, page * rowsPerPage)
                        .map((p) => (
                          <tr key={p.id}>
                            <td>
                              <div className="person-cell">
                                <Avatar
                                  small
                                  customer={findCustomer(p.customerId)}
                                />
                                {findCustomer(p.customerId)?.company}
                              </div>
                            </td>
                            <td>
                              <button
                                className="plain-link"
                                onClick={() =>
                                  setDialog({
                                    kind: "invoice",
                                    data: p.invoiceId,
                                  })
                                }
                              >
                                {
                                  c.invoices.find((i) => i.id === p.invoiceId)
                                    ?.number
                                }
                              </button>
                            </td>
                            <td>{p.method}</td>
                            <td>{day(p.date)}</td>
                            <td className="numeric payment-amount">
                              +{money(p.amount)}
                            </td>
                            <td className="muted">{p.note || "—"}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                {!c.payments.length && (
                  <Empty
                    title="Your first cha-ching is coming."
                    text="Record a payment against a confirmed invoice to get started."
                  />
                )}
                <Pagination
                  page={page}
                  total={c.payments.length}
                  onPage={setPage}
                />
              </section>
            </>
          )}
          {tab === "Products & plans" && (
            <>
              <section className="plans-grid">
                {c.plans.map((p) => (
                  <article className="panel plan-card" key={p.id}>
                    <div className="plan-top">
                      <span className="plan-icon">
                        <Package size={22} />
                      </span>
                      {p.loyalty ? (
                        <span className="loyalty-tag">
                          <Heart size={12} />
                          LOYALTY INCLUDED
                        </span>
                      ) : (
                        <span className="small-label">A STEADY CLASSIC</span>
                      )}
                    </div>
                    <h3>{p.name}</h3>
                    <p>{c.products.find((x) => x.id === p.productId)?.notes}</p>
                    <div className="plan-price">
                      {money(p.price)}
                      <small>
                        {" "}
                        /{" "}
                        {p.interval === "monthly"
                          ? "month"
                          : p.interval === "yearly"
                            ? "year"
                            : p.interval === "weekly"
                              ? "week"
                              : "day"}
                      </small>
                    </div>
                    <ul>
                      <li>
                        <Check size={15} />
                        {p.minQuantity} seat minimum
                      </li>
                      <li>
                        <Check size={15} />
                        {p.loyalty
                          ? `Up to ${p.cap}% off for staying`
                          : "A simple, predictable price"}
                      </li>
                      <li>
                        <Check size={15} />
                        {p.canPause
                          ? "Room to pause when needed"
                          : "Continuous billing"}
                      </li>
                    </ul>
                    <Button
                      variant="secondary"
                      onClick={() =>
                        viewer.role === "admin"
                          ? setDialog({ kind: "plan", data: p.id })
                          : setDialog({ kind: "subscription", data: p.id })
                      }
                    >
                      {viewer.role === "admin"
                        ? "Edit plan"
                        : "Create subscription"}
                      <ArrowUpRight size={15} />
                    </Button>
                  </article>
                ))}
              </section>
              <section className="panel">
                <SectionHead
                  title="The product shelf"
                  sub="The good things behind your plans"
                  action={
                    viewer.role === "admin" ? (
                      <Button
                        variant="secondary"
                        onClick={() => setDialog({ kind: "product" })}
                      >
                        <Plus size={15} />
                        Add product
                      </Button>
                    ) : null
                  }
                />
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>PRODUCT</th>
                        <th>TYPE</th>
                        <th>SALES PRICE</th>
                        <th>COST PRICE</th>
                        <th>VARIANTS</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {c.products.map((p) => (
                        <tr key={p.id}>
                          <td className="medium">{p.name}</td>
                          <td>{p.type}</td>
                          <td>{money(p.price)}</td>
                          <td>{money(p.cost)}</td>
                          <td>{p.variants.map((v) => v.name).join(", ")}</td>
                          <td>
                            {viewer.role === "admin" && (
                              <button
                                className="plain-link"
                                onClick={() =>
                                  setDialog({ kind: "product", data: p.id })
                                }
                              >
                                Edit <ArrowUpRight size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
          {tab === "Loyalty club" && (
            <>
              <section className="loyalty-feature">
                <div>
                  <span className="banner-label">THE GOODMONTH WAY</span>
                  <h2>
                    Turns out, loyalty
                    <br />
                    has its perks.
                  </h2>
                  <p>
                    Every on-time renewal brings the next price down.
                    <br />A small thank-you that makes a real difference.
                  </p>
                  <div className="loyalty-feature-stats">
                    <span>
                      <strong>{money(m.savings, true)}</strong>customer savings
                    </span>
                    <span>
                      <strong>
                        {c.subscriptions.filter((s) => s.streak > 0).length}
                      </strong>
                      streaks in the making
                    </span>
                  </div>
                </div>
                <div className="loyalty-feature-card">
                  <span className="tiny-label">
                    YOUR FIVE-MONTH HAPPY ENDING
                  </span>
                  <div className="price-steps">
                    {[1000, 950, 900, 850, 800].map((n, i) => (
                      <div key={n}>
                        <span
                          className={`price-step ${i === 4 ? "last" : ""}`}
                          style={{ height: `${100 - i * 13}px` }}
                        >
                          <span>{money(n * 100)}</span>
                        </span>
                        <small>Month {i + 1}</small>
                      </div>
                    ))}
                  </div>
                  <p>
                    <Heart size={14} />
                    Five good months. 20% less. Same lovely plan.
                  </p>
                </div>
              </section>
              <div className="section-intro">
                <h3>The people making it a habit.</h3>
                <p>Every stamp is another month together.</p>
              </div>
              <div className="loyalty-members">
                {c.subscriptions
                  .filter(
                    (s) =>
                      s.stage === "Active" &&
                      c.plans.find((p) => p.id === s.planId)?.loyalty,
                  )
                  .map((s) => (
                    <article className="panel member-card" key={s.id}>
                      <div className="person-cell">
                        <Avatar customer={findCustomer(s.customerId)} />
                        <div>
                          <strong>{findCustomer(s.customerId)?.company}</strong>
                          <small>
                            {c.plans.find((p) => p.id === s.planId)?.name}
                          </small>
                        </div>
                        <span className="member-percent">
                          {loyalty(c, s)}%<small>OFF</small>
                        </span>
                      </div>
                      <Stamps streak={Math.min(s.streak, 5)} />
                      <div className="member-bottom">
                        <span>
                          {s.streak} paid month{s.streak === 1 ? "" : "s"} in a
                          row
                        </span>
                        <button
                          onClick={() =>
                            setDialog({
                              kind: "subscriptionDetail",
                              data: s.id,
                            })
                          }
                        >
                          Take a look <ArrowUpRight size={14} />
                        </button>
                      </div>
                    </article>
                  ))}
              </div>
              <div className="fair-note">
                <ShieldCheck size={22} />
                <div>
                  <strong>No fine-print surprises.</strong>
                  <p>
                    Missing a renewal deadline resets future pricing to the
                    original rate. Issued invoices keep their agreed price.
                    Customers see this before they join.
                  </p>
                </div>
                {viewer.role === "admin" && (
                  <Button
                    variant="secondary"
                    onClick={() => go("Products & plans")}
                  >
                    Set the rules <ArrowRight size={15} />
                  </Button>
                )}
              </div>
            </>
          )}
          {tab === "My subscription" && (
            <CustomerPortal
              w={c}
              onAction={(kind, data) => setDialog({ kind, data })}
              onCommand={command}
            />
          )}
          {tab === "Settings" && (
            <div className="settings-grid">
              <section className="panel settings-panel">
                <SectionHead
                  title="The essentials"
                  sub="A few details that make it yours"
                />
                <div className="setting-line">
                  <span>Business name</span>
                  <strong>Brightloop Software</strong>
                </div>
                <div className="setting-line">
                  <span>Currency</span>
                  <strong>INR · Indian rupee</strong>
                </div>
                <div className="setting-line">
                  <span>Billing timezone</span>
                  <strong>Asia/Kolkata</strong>
                </div>
                <div className="setting-line">
                  <span>Workspace mode</span>
                  <Badge tone={live ? "green" : "orange"}>
                    {live
                      ? "Live · database connected"
                      : "Sample · browser only"}
                  </Badge>
                </div>
              </section>
              <section className="panel settings-panel">
                <SectionHead
                  title="Tax, simply put"
                  sub="Applied to new invoices after discounts"
                />
                {c.taxes.map((t) => (
                  <div className="setting-line" key={t.id}>
                    <span>{t.name}</span>
                    <strong>{t.rate}%</strong>
                  </div>
                ))}
                {viewer.role === "admin" && (
                  <Button
                    variant="secondary"
                    onClick={() => setDialog({ kind: "tax" })}
                  >
                    Edit tax rule <ArrowUpRight size={15} />
                  </Button>
                )}
              </section>
              <section className="panel settings-panel">
                <SectionHead
                  title="A little extra off"
                  sub="Discounts that take care of themselves"
                  action={
                    viewer.role === "admin" ? (
                      <button
                        className="icon-btn"
                        aria-label="Add discount"
                        onClick={() => setDialog({ kind: "discount" })}
                      >
                        <Plus size={18} />
                      </button>
                    ) : null
                  }
                />
                {c.discounts.map((d) => (
                  <div className="discount-row" key={d.id}>
                    <span className="activity-icon">
                      <Percent size={17} />
                    </span>
                    <div>
                      <strong>{d.name}</strong>
                      <small>
                        {d.kind === "percent" ? `${d.value}%` : money(d.value)}{" "}
                        off · through {day(d.endDate)}
                      </small>
                    </div>
                    <span>
                      {d.used}/{d.limit || "∞"}
                    </span>
                  </div>
                ))}
                {!c.discounts.length && (
                  <p className="muted">
                    No discounts yet. A nice place to start.
                  </p>
                )}
              </section>
              <section className="panel settings-panel">
                <SectionHead
                  title="Ready-made beginnings"
                  sub="Quotation templates for the next hello"
                  action={
                    viewer.role === "admin" ? (
                      <button
                        className="icon-btn"
                        aria-label="Add quotation template"
                        onClick={() => setDialog({ kind: "template" })}
                      >
                        <Plus size={18} />
                      </button>
                    ) : null
                  }
                />
                {c.templates.map((t) => (
                  <div className="setting-line" key={t.id}>
                    <span>
                      {t.name}
                      <small>
                        {t.quantity} seats · valid for {t.validDays} days
                      </small>
                    </span>
                    <button
                      className="plain-link"
                      onClick={() =>
                        setDialog({ kind: "subscription", data: t.id })
                      }
                    >
                      Use template <ArrowUpRight size={14} />
                    </button>
                  </div>
                ))}
              </section>
              {viewer.role === "admin" && (
                <section className="panel settings-panel">
                  <SectionHead
                    title="Good people on your side"
                    sub="Only admins can add team members"
                    action={
                      <Button
                        variant="secondary"
                        onClick={() => setDialog({ kind: "staff" })}
                      >
                        <Plus size={15} />
                        Add staff
                      </Button>
                    }
                  />
                  {(ops?.users || [viewer]).map((u) => (
                    <div className="setting-line" key={u.id}>
                      <span>
                        {u.name}
                        <small>{u.email}</small>
                      </span>
                      <Badge>{u.role}</Badge>
                    </div>
                  ))}
                </section>
              )}
              {live && viewer.role === "admin" && (
                <section className="panel settings-panel">
                  <SectionHead
                    title="Behind the scenes"
                    sub="Scheduled billing and email delivery"
                  />
                  {ops?.jobs.map((j) => (
                    <div className="setting-line" key={String(j.id)}>
                      <span>
                        {day(String(j.startedAt))}
                        <small>
                          {String(j.processed)} processed · {String(j.backlog)}{" "}
                          waiting
                        </small>
                      </span>
                      <Badge>{String(j.status)}</Badge>
                    </div>
                  ))}
                  {ops?.outbox.map((e) => (
                    <div className="setting-line" key={e.id}>
                      <span>
                        {e.subject}
                        <small>{e.to}</small>
                        {e.text && (
                          <details className="dev-email">
                            <summary>Read development email</summary>
                            <pre>{e.text}</pre>
                          </details>
                        )}
                      </span>
                      <Badge>{e.status}</Badge>
                    </div>
                  ))}
                  {!ops?.jobs.length && !ops?.outbox.length && (
                    <p className="muted">
                      Job runs and email delivery will appear here.
                    </p>
                  )}
                </section>
              )}
            </div>
          )}
          <footer className="page-footer">
            <span>Made for good months. And the people behind them.</span>
            <span>
              <span className="footer-dot" />A little better, together.
              <Sun size={18} />
            </span>
          </footer>
        </main>
      </div>
      {!live && (
        <button
          className="demo-launcher"
          onClick={() => setDemoTools(!demoTools)}
        >
          <Play size={13} fill="currentColor" />
          Demo studio <span>↗</span>
        </button>
      )}
      {demoTools && !live && (
        <aside className="demo-drawer">
          <div className="demo-drawer-head">
            <span className="tiny-label">THE DEMO STUDIO</span>
            <button
              className="icon-btn"
              aria-label="Close demo controls"
              onClick={() => setDemoTools(false)}
            >
              <X size={18} />
            </button>
          </div>
          <h3>A few months in a minute.</h3>
          <p>Sample data stays in this browser. Play around.</p>
          <div className="demo-date">
            <CalendarDays size={19} />
            {day(w.clock)}
          </div>
          <div className="demo-controls">
            <Button variant="secondary" onClick={() => advance(7)}>
              + 7 days
            </Button>
            <Button onClick={() => advance(30)}>
              + 30 days <ArrowRight size={15} />
            </Button>
          </div>
          <Button
            variant="secondary full"
            onClick={() =>
              command("runBilling", {}, "Billing run complete.", false)
            }
          >
            <Repeat2 size={15} />
            Run billing again
          </Button>
          <label className="field">
            <span>Take a different seat</span>
            <select
              value={viewer.role}
              onChange={(e) => {
                const role = e.target.value as Viewer["role"];
                setViewer(
                  role === "customer"
                    ? {
                        id: "demo_customer",
                        name: "Maya Shah",
                        email: "maya@example.com",
                        role,
                        customerId: "cust_maya",
                      }
                    : { ...demoViewer, role },
                );
                go(role === "customer" ? "My subscription" : "Overview");
              }}
            >
              <option value="admin">Alex · workspace admin</option>
              <option value="staff">Alex · team member</option>
              <option value="customer">Maya · customer</option>
            </select>
          </label>
          <button
            className="reset-demo"
            onClick={() => {
              setDialog({ kind: "resetDemo" });
            }}
          >
            <RotateCcw size={14} />
            Start the story again
          </button>
          <button
            className="plain-link"
            onClick={() => {
              setDialog({ kind: "login" });
              setDemoTools(false);
            }}
          >
            Sign in to a real workspace <ArrowUpRight size={14} />
          </button>
        </aside>
      )}
      {toast && (
        <div role="status" className="toast">
          <CheckCircle2 size={18} />
          <span>{toast}</span>
          <button aria-label="Dismiss message" onClick={() => setToast("")}>
            <X size={15} />
          </button>
        </div>
      )}
      {dialog && renderDialog()}
    </div>
  );
  function subscriptionTable(subs: Subscription[]) {
    return (
      <>
        {subs.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>CUSTOMER</th>
                  <th>PLAN</th>
                  <th>STATUS</th>
                  <th>NEXT RENEWAL</th>
                  <th>LOYALTY</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => {
                  const customer = findCustomer(s.customerId),
                    plan = c.plans.find((p) => p.id === s.planId);
                  return (
                    <tr
                      key={s.id}
                      onClick={() =>
                        setDialog({ kind: "subscriptionDetail", data: s.id })
                      }
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter")
                          setDialog({ kind: "subscriptionDetail", data: s.id });
                      }}
                    >
                      <td>
                        <div className="person-cell">
                          <Avatar customer={customer} small />
                          <span>
                            <strong>{customer?.company}</strong>
                            <small>{customer?.name}</small>
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="plan-cell">
                          {plan?.name}
                          <small>
                            {money(plan?.price || 0)} /{" "}
                            {plan?.interval === "monthly"
                              ? "mo"
                              : plan?.interval}
                          </small>
                        </span>
                      </td>
                      <td>
                        <Badge tone={statusTone(s.paused ? "Paused" : s.stage)}>
                          {s.paused ? "Paused" : s.stage}
                        </Badge>
                      </td>
                      <td>
                        {day(s.nextBilling, { day: "numeric", month: "short" })}
                      </td>
                      <td>
                        {plan?.loyalty ? (
                          <span className="loyalty-cell">
                            <Heart size={13} />
                            {loyalty(c, s)}% off <span>· {s.streak} mo.</span>
                          </span>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td>
                        <button
                          className="icon-btn"
                          aria-label={`View ${s.number}`}
                          onClick={() =>
                            setDialog({
                              kind: "subscriptionDetail",
                              data: s.id,
                            })
                          }
                        >
                          <MoreHorizontal size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="A new chapter is waiting."
            text="Create a subscription or try a different filter."
          />
        )}
      </>
    );
  }
  function renderDialog() {
    if (!dialog) return null;
    const close = () => setDialog(null);
    if (["login", "register", "forgot", "reset"].includes(dialog.kind))
      return (
        <Modal
          title={
            dialog.kind === "register"
              ? "Make yourself at home."
              : dialog.kind === "forgot"
                ? "A fresh start."
                : dialog.kind === "reset"
                  ? "A new little secret."
                  : "Welcome back."
          }
          description={
            !live
              ? "Live accounts need a connected database. The sample workspace is always open."
              : undefined
          }
          onClose={close}
        >
          <AuthForm
            kind={dialog.kind}
            token={dialog.data}
            busy={busy}
            onSubmit={auth}
            onChange={(kind) => setDialog({ kind })}
          />
        </Modal>
      );
    if (dialog.kind === "resetDemo")
      return (
        <Modal
          title="Back to the beginning?"
          description="This replaces your sample changes with the original Brightloop story."
          onClose={close}
        >
          <div className="form-actions">
            <Button variant="secondary" onClick={close}>
              Keep exploring
            </Button>
            <Button
              onClick={() => {
                const sample = seedWorkspace();
                reconcile(sample);
                setW(sample);
                setViewer(demoViewer);
                setTab("Overview");
                close();
                announce("A fresh page. Here we go again.");
              }}
            >
              Reset sample workspace
            </Button>
          </div>
        </Modal>
      );
    if (dialog.kind === "invoice" && invoiceFor) {
      const i = invoiceFor,
        customer = findCustomer(i.customerId);
      return (
        <Modal title="Every little detail." onClose={close} wide>
          <div className="invoice-receipt" id="invoice-print">
            <div className="receipt-head">
              <Logo />
              <div>
                <strong>{i.number}</strong>
                <Badge tone={statusTone(invStatus(i, c))}>
                  {invStatus(i, c)}
                </Badge>
              </div>
            </div>
            <div className="receipt-address">
              <div>
                <span className="tiny-label">A GOOD MONTH FOR</span>
                <h3>{customer?.company}</h3>
                <p>
                  {customer?.name}
                  <br />
                  {customer?.email}
                </p>
              </div>
              <div>
                <span className="tiny-label">ISSUED</span>
                <p>{day(i.issuedDate)}</p>
                <span className="tiny-label">DUE</span>
                <p>{day(i.dueDate)}</p>
              </div>
            </div>
            <div className="receipt-product">
              <div>
                <strong>{i.product}</strong>
                <span>
                  {i.quantity} × {money(i.unitPrice)}
                </span>
              </div>
              <strong>{money(i.subtotal)}</strong>
            </div>
            <div className="receipt-totals">
              <div>
                <span>Subtotal</span>
                <span>{money(i.subtotal)}</span>
              </div>
              <div className="savings-line">
                <span>
                  <Heart size={14} />
                  {i.discountLabel}
                </span>
                <span>−{money(i.discount)}</span>
              </div>
              <div>
                <span>Tax ({i.taxRate}%)</span>
                <span>{money(i.tax)}</span>
              </div>
              <div className="total-line">
                <strong>Total for this month</strong>
                <strong>{money(i.total)}</strong>
              </div>
              <div>
                <span>Paid so far</span>
                <span>{money(i.paid)}</span>
              </div>
              <div>
                <strong>Still to come</strong>
                <strong>{money(i.total - i.paid)}</strong>
              </div>
            </div>
            <details className="calculation">
              <summary>
                Why this amount? <ChevronDown size={15} />
              </summary>
              <p>
                {money(i.unitPrice)} per unit × {i.quantity} ={" "}
                {money(i.subtotal)}. Subtract {money(i.discount)} in discounts,
                then add {i.taxRate}% tax ({money(i.tax)}). Your total is{" "}
                {money(i.total)}. This calculation is saved with your invoice.
              </p>
            </details>
            <div className="receipt-note">
              <Sun size={26} />
              <span>Thanks for another good month.</span>
            </div>
          </div>
          <div className="form-actions wrap">
            {!isCustomer && i.status === "Draft" && (
              <Button
                variant="secondary"
                onClick={() =>
                  command(
                    "invoiceAction",
                    { id: i.id, action: "refresh" },
                    "Draft updated with current pricing.",
                  )
                }
              >
                <RotateCcw size={15} />
                Refresh draft
              </Button>
            )}
            {!isCustomer && i.status === "Draft" && (
              <Button
                onClick={() =>
                  command(
                    "invoiceAction",
                    { id: i.id, action: "confirm" },
                    "Invoice confirmed.",
                  )
                }
              >
                Confirm invoice <Check size={15} />
              </Button>
            )}
            {!isCustomer && i.status === "Confirmed" && (
              <Button
                onClick={() => setDialog({ kind: "payment", data: i.id })}
              >
                Record payment <Plus size={15} />
              </Button>
            )}
            {!isCustomer && ["Confirmed", "Paid"].includes(i.status) && (
              <Button
                variant="secondary"
                onClick={() =>
                  command(
                    "sendInvoice",
                    { id: i.id },
                    "Invoice queued for delivery.",
                  )
                }
              >
                <Send size={15} />
                Send
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => {
                sessionStorage.setItem(
                  "goodmonth-print",
                  JSON.stringify({ invoice: i, customer }),
                );
                window.open(`/print/${i.id}`, "_blank", "noopener,noreferrer");
              }}
            >
              <Printer size={15} />
              Print
            </Button>
            {!isCustomer && i.paid === 0 && i.status !== "Cancelled" && (
              <Button
                variant="ghost danger"
                onClick={() =>
                  command(
                    "invoiceAction",
                    { id: i.id, action: "cancel" },
                    "Invoice cancelled.",
                  )
                }
              >
                Cancel invoice
              </Button>
            )}
          </div>
        </Modal>
      );
    }
    if (dialog.kind === "subscriptionDetail" && subFor) {
      const s = subFor,
        p = c.plans.find((x) => x.id === s.planId)!,
        cust = findCustomer(s.customerId),
        calc = { ...calculate(c, s), ...c.previews?.[s.id] };
      return (
        <Modal
          title={cust?.company || s.number}
          description={`${s.number} · ${p.name}`}
          onClose={close}
          wide
        >
          <div className="lifecycle">
            {["Draft", "Quotation", "Confirmed", "Active", "Closed"].map(
              (st, i) => (
                <span
                  key={st}
                  className={
                    i <=
                    [
                      "Draft",
                      "Quotation",
                      "Confirmed",
                      "Active",
                      "Closed",
                    ].indexOf(s.stage)
                      ? "done"
                      : ""
                  }
                >
                  <span>
                    {i <
                    [
                      "Draft",
                      "Quotation",
                      "Confirmed",
                      "Active",
                      "Closed",
                    ].indexOf(s.stage) ? (
                      <Check size={12} />
                    ) : (
                      i + 1
                    )}
                  </span>
                  {st}
                </span>
              ),
            )}
          </div>
          <div className="subscription-summary">
            <div>
              <span className="tiny-label">NEXT ESTIMATED TOTAL</span>
              <h2>{money(calc.total)}</h2>
              <p>
                Includes tax · {s.quantity} seat{s.quantity === 1 ? "" : "s"}
              </p>
            </div>
            <div>
              <Badge tone={statusTone(s.paused ? "Paused" : s.stage)}>
                {s.paused ? "Paused" : s.stage}
              </Badge>
              <p>
                Next renewal
                <br />
                <strong>{day(s.nextBilling)}</strong>
              </p>
            </div>
          </div>
          {p.loyalty && (
            <div className="sub-loyalty">
              <div>
                <Heart size={17} />
                <strong>{loyalty(c, s)}% loyalty savings</strong>
                <span>{s.streak} months together</span>
              </div>
              <Stamps streak={s.streak} />
            </div>
          )}
          <div className="fair-note compact">
            <ShieldCheck size={18} />
            <p>
              Missing a renewal deadline resets future loyalty pricing. Issued
              invoices stay unchanged.
            </p>
          </div>
          <div className="sub-invoices">
            <SectionHead title="The paper trail" />
            {c.invoices
              .filter((i) => i.subscriptionId === s.id)
              .slice()
              .reverse()
              .slice(0, 4)
              .map((i) => (
                <button
                  key={i.id}
                  className="setting-line"
                  onClick={() => setDialog({ kind: "invoice", data: i.id })}
                >
                  <span>
                    {i.number}
                    <small>{day(i.dueDate)}</small>
                  </span>
                  <strong>{money(i.total)}</strong>
                  <Badge tone={statusTone(invStatus(i, c))}>
                    {invStatus(i, c)}
                  </Badge>
                  <ArrowUpRight size={15} />
                </button>
              ))}
          </div>
          <div className="form-actions wrap">
            {!isCustomer && s.stage !== "Active" && s.stage !== "Closed" && (
              <Button
                onClick={() =>
                  command(
                    "transition",
                    {
                      id: s.id,
                      stage: (
                        {
                          Draft: "Quotation",
                          Quotation: "Confirmed",
                          Confirmed: "Active",
                        } as Record<string, string>
                      )[s.stage],
                    },
                    "Subscription updated.",
                  )
                }
              >
                {s.stage === "Draft"
                  ? "Send as quotation"
                  : s.stage === "Quotation"
                    ? "Confirm quotation"
                    : "Activate subscription"}
                <ArrowRight size={15} />
              </Button>
            )}
            {!isCustomer && ["Confirmed", "Active"].includes(s.stage) && (
              <Button
                variant="secondary"
                onClick={() =>
                  command(
                    "createInvoice",
                    { id: s.id },
                    "Invoice is ready in your invoice book.",
                  )
                }
              >
                <FileText size={15} />
                Create invoice
              </Button>
            )}
            {s.stage === "Active" && p.canPause && (
              <Button
                variant="secondary"
                onClick={() =>
                  command(
                    s.paused ? "resume" : "pause",
                    { id: s.id },
                    s.paused
                      ? "Welcome back. Your next chapter is ready."
                      : "Subscription paused. Your loyalty streak has reset.",
                  )
                }
              >
                <Pause size={15} />
                {s.paused ? "Resume" : "Pause"}
              </Button>
            )}
            {s.stage !== "Closed" && p.canClose && (
              <Button
                variant="ghost danger"
                onClick={() =>
                  setDialog({ kind: "closeSubscription", data: s.id })
                }
              >
                Close subscription
              </Button>
            )}
            {s.stage === "Closed" && p.canRenew && (
              <Button
                onClick={() =>
                  command(
                    "renew",
                    { id: s.id },
                    "Renewal ready. Create and pay the first invoice to activate.",
                  )
                }
              >
                Renew subscription
              </Button>
            )}
          </div>
        </Modal>
      );
    }
    if (dialog.kind === "closeSubscription" && subFor)
      return (
        <Modal
          title="Close this chapter?"
          description="Future renewals will stop and the loyalty streak will reset. Existing balances remain payable."
          onClose={close}
        >
          <div className="form-actions">
            <Button variant="secondary" onClick={close}>
              Keep subscription
            </Button>
            <Button
              onClick={() =>
                command(
                  "transition",
                  { id: subFor.id, stage: "Closed" },
                  "Subscription closed.",
                )
              }
            >
              Close subscription
            </Button>
          </div>
        </Modal>
      );
    if (dialog.kind === "customerDetail") {
      const customer = findCustomer(dialog.data || "");
      return (
        <Modal
          title={customer?.company || "Customer"}
          description={`${customer?.name} · ${customer?.email}`}
          onClose={close}
          wide
        >
          {subscriptionTable(
            c.subscriptions.filter((s) => s.customerId === customer?.id),
          )}
          <div className="form-actions">
            <Button onClick={() => setDialog({ kind: "subscription" })}>
              New subscription <Plus size={15} />
            </Button>
          </div>
        </Modal>
      );
    }
    if (dialog.kind === "date")
      return (
        <Modal
          title="A month at a glance."
          description="The overview follows the workspace clock. Use the demo studio to explore future renewals."
          onClose={close}
        >
          <p className="date-display">{day(c.clock)}</p>
          <Button
            onClick={() => {
              close();
              if (!live) setDemoTools(true);
              else announce("Live accounts follow today’s date.");
            }}
          >
            {" "}
            {live ? "Back to today" : "Open demo studio"}
            <ArrowRight size={16} />
          </Button>
        </Modal>
      );
    if (
      dialog.kind === "account" ||
      dialog.kind === "workspace" ||
      dialog.kind === "help"
    )
      return (
        <Modal
          title={
            dialog.kind === "help"
              ? "A hand with the little things."
              : dialog.kind === "workspace"
                ? "A good place to work."
                : "Hello, " + viewer.name.split(" ")[0] + "."
          }
          description={
            live
              ? "You’re in Brightloop’s live workspace."
              : "You’re exploring a sample Brightloop workspace. All demo changes stay in this browser."
          }
          onClose={close}
        >
          <div className="account-card">
            <Logo />
            <p>{viewer.email}</p>
            <Badge>{viewer.role}</Badge>
          </div>
          <p className="muted">
            Create a quote, follow it into a subscription, then record a
            payment. On-time renewals earn a lower price next month.
          </p>
          <div className="form-actions">
            {live ? (
              <Button
                variant="secondary"
                onClick={() =>
                  auth("logout", {}).then(() => (location.href = "/"))
                }
              >
                <LogOut size={16} />
                Sign out
              </Button>
            ) : (
              <>
                <Button
                  variant="secondary"
                  onClick={() => {
                    close();
                    setDemoTools(true);
                  }}
                >
                  Explore demo controls
                </Button>
                <Button onClick={() => setDialog({ kind: "login" })}>
                  Sign in <ArrowRight size={16} />
                </Button>
              </>
            )}
          </div>
        </Modal>
      );
    return renderFormDialog();
  }
  function renderFormDialog() {
    if (!dialog) return null;
    const kind = dialog.kind,
      plan = c.plans.find((p) => p.id === dialog.data),
      product = c.products.find((p) => p.id === dialog.data),
      template = c.templates.find((t) => t.id === dialog.data);
    const titleMap: Record<string, string> = {
      subscription: "Start something good.",
      customer: "A new familiar face.",
      payment: "A little cha-ching.",
      product: product
        ? "Freshen up your product."
        : "Something good to offer.",
      plan: plan ? "A little plan refresh." : "Give your idea a rhythm.",
      discount: "A little extra kindness.",
      tax: "Keep the numbers clear.",
      template: "A ready-made beginning.",
      staff: "Make room for a teammate.",
    };
    const onSubmit = (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const values = Object.fromEntries(new FormData(e.currentTarget));
      const moneyFields = [
        "price",
        "cost",
        "variantExtra",
        "amount",
        "minPurchase",
      ];
      moneyFields.forEach((k) => {
        if (k in values)
          (values as Record<string, unknown>)[k] = Math.round(
            Number(values[k]) * 100,
          );
      });
      if (kind === "discount" && values.kind === "fixed")
        (values as Record<string, unknown>).value = Math.round(
          Number(values.value) * 100,
        );
      if (kind === "plan")
        for (const key of [
          "autoClose",
          "canPause",
          "canClose",
          "canRenew",
          "loyalty",
        ])
          (values as Record<string, unknown>)[key] = values[key] === "on";
      if (kind === "payment" && values.date)
        values.date = String(values.date) + "+05:30";
      const mapping: Record<string, string> = {
        subscription: "createSubscription",
        customer: "addCustomer",
        payment: "recordPayment",
        product: "saveProduct",
        plan: "savePlan",
        discount: "saveDiscount",
        tax: "saveTaxes",
        template: "saveTemplate",
      };
      if (kind === "staff") {
        if (!live) {
          announce(
            "Sample staff invitation ready. Real accounts are created in a connected workspace.",
          );
          setDialog(null);
        } else auth("staff", values);
        return;
      }
      if ((kind === "plan" && plan) || (kind === "product" && product))
        values.id = dialog.data!;
      command(
        mapping[kind],
        values,
        kind === "payment"
          ? "Payment recorded. Another good month."
          : "All saved. Here’s to good beginnings.",
      );
    };
    const planSelect = (
      <select
        name="planId"
        onChange={(e) => setPlanChoice(e.target.value)}
        value={planChoice || template?.planId || plan?.id || c.plans[0]?.id}
        required
      >
        {c.plans.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} · {money(p.price)}
          </option>
        ))}
      </select>
    );
    return (
      <Modal
        title={titleMap[kind] || "A little update."}
        onClose={() => setDialog(null)}
        description={
          kind === "subscription"
            ? "Start with a draft. We’ll take it one good step at a time."
            : undefined
        }
        wide={["subscription", "plan"].includes(kind)}
      >
        <form onSubmit={onSubmit} className="editor-form">
          {kind === "customer" && (
            <>
              <Field label="Full name">
                <FormInput name="name" placeholder="Maya Shah" />
              </Field>
              <Field label="Business name">
                <FormInput name="company" placeholder="Paper & Pine" />
              </Field>
              <Field label="Email address">
                <FormInput
                  name="email"
                  type="email"
                  placeholder="maya@example.com"
                />
              </Field>
            </>
          )}
          {kind === "subscription" && (
            <>
              <div className="form-grid">
                <Field label="Customer">
                  <select name="customerId" required>
                    {c.customers.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.company} · {x.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Plan">{planSelect}</Field>
                <Field label="Seats / quantity">
                  <FormInput
                    name="quantity"
                    type="number"
                    defaultValue={template?.quantity || 1}
                    min={1}
                  />
                </Field>
                <Field label="Variant">
                  <select name="variant">
                    {(
                      c.products.find(
                        (product) =>
                          product.id ===
                          c.plans.find(
                            (p) =>
                              p.id ===
                              (planChoice ||
                                template?.planId ||
                                plan?.id ||
                                c.plans[0]?.id),
                          )?.productId,
                      )?.variants || []
                    ).map((v) => (
                      <option key={v.name}>{v.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Start date">
                  <FormInput
                    name="startDate"
                    type="date"
                    defaultValue={c.clock.slice(0, 10)}
                  />
                </Field>
                <Field label="Expiry date (optional)">
                  <FormInput name="expiryDate" type="date" required={false} />
                </Field>
                <Field label="Quotation valid for (days)">
                  <FormInput
                    name="quoteValidDays"
                    type="number"
                    defaultValue={template?.validDays || 14}
                    min={1}
                    max={365}
                  />
                </Field>
                <Field label="Payment terms (days after renewal)">
                  <FormInput
                    name="terms"
                    type="number"
                    defaultValue={0}
                    min={0}
                    max={365}
                  />
                </Field>
              </div>
              <Field label="A note for the next chapter">
                <textarea
                  name="notes"
                  defaultValue={template?.notes || ""}
                  placeholder="Anything the team should know?"
                />
              </Field>
              <div className="fair-note compact">
                <Heart size={18} />
                <p>
                  Monthly loyalty plans reward on-time payments. A missed
                  renewal resets future savings to the original price.
                </p>
              </div>
            </>
          )}
          {kind === "payment" && (
            <>
              <Field label="Invoice">
                <select name="invoiceId" defaultValue={dialog.data} required>
                  {c.invoices
                    .filter((i) => i.status === "Confirmed" && i.paid < i.total)
                    .map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.number} · {findCustomer(i.customerId)?.company} ·{" "}
                        {money(i.total - i.paid)} due
                      </option>
                    ))}
                </select>
              </Field>
              <div className="form-grid">
                <Field label="Amount (₹)">
                  <FormInput
                    name="amount"
                    type="number"
                    min={0.01}
                    defaultValue={
                      invoiceFor
                        ? (invoiceFor.total - invoiceFor.paid) / 100
                        : undefined
                    }
                  />
                </Field>
                <Field label="Payment method">
                  <select name="method">
                    <option>UPI</option>
                    <option>Bank transfer</option>
                    <option>Card</option>
                    <option>Cash</option>
                  </select>
                </Field>
              </div>
              <Field
                label="Payment date and time (optional, IST)"
                hint="Leave blank to record it now."
              >
                <FormInput name="date" type="datetime-local" required={false} />
              </Field>
              <Field label="Note (optional)">
                <FormInput
                  name="note"
                  required={false}
                  placeholder="Reference number or a little context"
                />
              </Field>
              <p className="form-hint">
                Recorded at the workspace’s current time: {day(c.clock)}.
                Partial payments keep the remaining balance open.
              </p>
            </>
          )}
          {kind === "product" && (
            <>
              <Field label="Product name">
                <FormInput name="name" defaultValue={product?.name} />
              </Field>
              <Field label="Type">
                <select name="productType" defaultValue={product?.type}>
                  <option>Software</option>
                  <option>Add-on</option>
                  <option>Service</option>
                </select>
              </Field>
              <div className="form-grid">
                <Field label="Sales price (₹)">
                  <FormInput
                    name="price"
                    type="number"
                    min={0}
                    defaultValue={(product?.price || 0) / 100}
                  />
                </Field>
                <Field label="Cost price (₹)">
                  <FormInput
                    name="cost"
                    type="number"
                    min={0}
                    defaultValue={(product?.cost || 0) / 100}
                  />
                </Field>
              </div>
              <Field label="Notes">
                <textarea name="notes" defaultValue={product?.notes} />
              </Field>
              <div className="form-grid">
                <Field label="Extra variant (optional)">
                  <FormInput
                    name="variantName"
                    required={false}
                    defaultValue={product?.variants[1]?.name}
                    placeholder="Odoo"
                  />
                </Field>
                <Field label="Variant surcharge (₹)">
                  <FormInput
                    name="variantExtra"
                    type="number"
                    min={0}
                    defaultValue={(product?.variants[1]?.extra || 0) / 100}
                  />
                </Field>
              </div>
            </>
          )}
          {kind === "plan" && (
            <>
              <div className="form-grid">
                <Field label="Plan name">
                  <FormInput name="name" defaultValue={plan?.name} />
                </Field>
                <Field label="Product">
                  <select
                    name="productId"
                    defaultValue={plan?.productId}
                    required
                  >
                    {c.products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Plan price (₹)">
                  <FormInput
                    name="price"
                    type="number"
                    min={0}
                    defaultValue={(plan?.price || 100000) / 100}
                  />
                </Field>
                <Field label="Billing rhythm">
                  <select
                    name="interval"
                    defaultValue={plan?.interval || "monthly"}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </Field>
                <Field label="Minimum quantity">
                  <FormInput
                    name="minQuantity"
                    type="number"
                    min={1}
                    defaultValue={plan?.minQuantity || 1}
                  />
                </Field>
                <Field label="Available from">
                  <FormInput
                    name="startDate"
                    type="date"
                    defaultValue={plan?.startDate || "2026-01-01"}
                  />
                </Field>
                <Field label="Available until (optional)">
                  <FormInput
                    name="endDate"
                    type="date"
                    required={false}
                    defaultValue={plan?.endDate}
                  />
                </Field>
              </div>
              <div className="form-toggles">
                <Toggle
                  name="canPause"
                  label="Customers can pause"
                  defaultChecked={plan?.canPause ?? true}
                />
                <Toggle
                  name="canClose"
                  label="Allow early closure"
                  defaultChecked={plan?.canClose ?? true}
                />
                <Toggle
                  name="canRenew"
                  label="Allow renewal"
                  defaultChecked={plan?.canRenew ?? true}
                />
                <Toggle
                  name="autoClose"
                  label="Close automatically at expiry"
                  defaultChecked={plan?.autoClose}
                />
                <Toggle
                  name="loyalty"
                  label="Include monthly loyalty rewards"
                  defaultChecked={plan?.loyalty ?? true}
                />
              </div>
              <div className="form-grid">
                <Field label="Reward per paid month (%)">
                  <FormInput
                    name="step"
                    type="number"
                    min={0}
                    max={100}
                    defaultValue={plan?.step ?? 5}
                  />
                </Field>
                <Field label="Maximum reward (%)">
                  <FormInput
                    name="cap"
                    type="number"
                    min={0}
                    max={100}
                    defaultValue={plan?.cap ?? 20}
                  />
                </Field>
              </div>
              <p className="form-hint">
                Existing subscriptions keep their agreed loyalty rules. Changes
                apply to new subscriptions.
              </p>
            </>
          )}
          {kind === "discount" && (
            <>
              <Field label="A name for this little perk">
                <FormInput name="name" placeholder="A warm welcome" />
              </Field>
              <div className="form-grid">
                <Field label="Discount type">
                  <select name="kind">
                    <option value="percent">Percentage</option>
                    <option value="fixed">Fixed amount (₹)</option>
                  </select>
                </Field>
                <Field label="Value">
                  <FormInput
                    name="value"
                    type="number"
                    min={0}
                    defaultValue={10}
                  />
                </Field>
                <Field label="Minimum quantity">
                  <FormInput
                    name="minQuantity"
                    type="number"
                    min={1}
                    defaultValue={1}
                  />
                </Field>
                <Field label="Minimum purchase (₹)">
                  <FormInput
                    name="minPurchase"
                    type="number"
                    min={0}
                    defaultValue={0}
                  />
                </Field>
                <Field label="Starts">
                  <FormInput
                    name="startDate"
                    type="date"
                    defaultValue={c.clock.slice(0, 10)}
                  />
                </Field>
                <Field label="Ends">
                  <FormInput
                    name="endDate"
                    type="date"
                    defaultValue="2026-12-31"
                  />
                </Field>
                <Field label="Usage limit (0 = unlimited)">
                  <FormInput
                    name="limit"
                    type="number"
                    min={0}
                    defaultValue={50}
                  />
                </Field>
                <Field label="Product">
                  <select name="productId">
                    <option value="">All products</option>
                    {c.products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Subscription">
                  <select name="subscriptionId">
                    <option value="">All subscriptions</option>
                    {c.subscriptions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.number}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <p className="form-hint">
                The better of loyalty savings and this discount applies. Perks
                don’t stack.
              </p>
            </>
          )}
          {kind === "tax" && (
            <>
              <Field label="Tax name">
                <FormInput
                  name="name"
                  defaultValue={c.taxes[0]?.name || "GST"}
                />
              </Field>
              <Field label="Rate (%)">
                <FormInput
                  name="rate"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={c.taxes[0]?.rate || 18}
                />
              </Field>
              <p className="form-hint">
                Applies to newly created invoices. Existing invoices keep their
                saved calculation.
              </p>
            </>
          )}
          {kind === "template" && (
            <>
              <Field label="Template name">
                <FormInput name="name" placeholder="A fresh start" />
              </Field>
              <Field label="Plan">{planSelect}</Field>
              <div className="form-grid">
                <Field label="Quantity">
                  <FormInput
                    name="quantity"
                    type="number"
                    min={1}
                    defaultValue={1}
                  />
                </Field>
                <Field label="Valid for (days)">
                  <FormInput
                    name="validDays"
                    type="number"
                    min={1}
                    max={365}
                    defaultValue={14}
                  />
                </Field>
              </div>
              <Field label="Notes">
                <textarea name="notes" />
              </Field>
            </>
          )}
          {kind === "staff" && (
            <>
              <Field label="Name">
                <FormInput name="name" />
              </Field>
              <Field label="Email">
                <FormInput name="email" type="email" />
              </Field>
              <Field
                label="Temporary password"
                hint="More than 8 characters, upper and lowercase, and a special character."
              >
                <FormInput name="password" type="password" />
              </Field>
            </>
          )}
          <div className="form-actions">
            <Button variant="secondary" onClick={() => setDialog(null)}>
              Maybe later
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? (
                <Loader2 size={16} className="spin" />
              ) : (
                <Check size={16} />
              )}{" "}
              {kind === "payment"
                ? "Record payment"
                : kind === "subscription"
                  ? "Create draft"
                  : "Save the good stuff"}
            </Button>
          </div>
        </form>
      </Modal>
    );
  }
}

function Metric({
  label,
  value,
  note,
  icon,
  accent = false,
  warning = false,
}: {
  label: string;
  value: string;
  note: string;
  icon: ReactNode;
  accent?: boolean;
  warning?: boolean;
}) {
  return (
    <article className={`metric ${accent ? "accent" : ""}`}>
      <div className="metric-top">
        <span>{label}</span>
        <span className="metric-icon">{icon}</span>
      </div>
      <strong className="metric-value">{value}</strong>
      <p>
        <span className={warning ? "orange-dot" : "metric-note-dot"} />
        {note}
      </p>
    </article>
  );
}
function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (s: string) => void;
  placeholder: string;
}) {
  return (
    <div className="table-search">
      <Search size={16} />
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button aria-label="Clear search" onClick={() => onChange("")}>
          <X size={13} />
        </button>
      )}
    </div>
  );
}
function Pagination({
  page,
  total,
  onPage,
}: {
  page: number;
  total: number;
  onPage: (n: number) => void;
}) {
  return (
    <div className="pagination">
      <span>
        {total
          ? `${(page - 1) * 8 + 1}–${Math.min(page * 8, total)} of ${total}`
          : "No records yet"}
        <span className="pagination-extra"> · a little order feels good</span>
      </span>
      <div>
        <button
          disabled={page <= 1}
          aria-label="Previous page"
          onClick={() => onPage(page - 1)}
        >
          <ChevronLeft size={16} />
        </button>
        <span>{page}</span>
        <button
          disabled={page * 8 >= total}
          aria-label="Next page"
          onClick={() => onPage(page + 1)}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
function RevenueChart({ w }: { w: Workspace }) {
  const date = new Date(new Date(w.clock).getTime() + 19800000);
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - 5 + i, 1),
    );
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    return {
      label: d.toLocaleDateString("en", { month: "short", timeZone: "UTC" }),
      value: w.payments
        .filter((p) => istMonth(p.date) === key)
        .reduce((n, p) => n + p.amount, 0),
    };
  });
  const max = Math.max(...months.map((x) => x.value), 10000),
    width = 600,
    height = 150;
  const points = months
    .map(
      (m, i) =>
        `${i * (width / 5)},${height - (m.value / max) * (height - 20)}`,
    )
    .join(" ");
  return (
    <div className="revenue-chart">
      <div className="chart-y">
        {[1, 0.75, 0.5, 0.25, 0].map((f) => (
          <span key={f}>{money(Math.round(max * f), true)}</span>
        ))}
      </div>
      <div className="chart-plot">
        <div className="chart-grid">
          {[0, 1, 2, 3, 4].map((n) => (
            <span key={n} />
          ))}
        </div>
        <svg
          viewBox={`-8 -12 ${width + 16} ${height + 25}`}
          preserveAspectRatio="none"
          role="img"
          aria-label="Monthly collected revenue"
        >
          <defs>
            <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c5d3b4" stopOpacity=".65" />
              <stop offset="100%" stopColor="#eaf0e3" stopOpacity=".05" />
            </linearGradient>
          </defs>
          <polygon
            points={`0,${height} ${points} ${width},${height}`}
            fill="url(#chart-fill)"
          />
          <polyline
            points={points}
            fill="none"
            stroke="#496a45"
            strokeWidth="2.5"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          {months.map((m, i) => (
            <circle
              key={i}
              cx={i * (width / 5)}
              cy={height - (m.value / max) * (height - 20)}
              r="4"
              fill="#fff"
              stroke="#496a45"
              strokeWidth="2"
            >
              <title>
                {m.label}: {money(m.value)}
              </title>
            </circle>
          ))}
        </svg>
        <div className="chart-x">
          {months.map((m, i) => (
            <span key={i}>{m.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
function CustomerPortal({
  w,
  onAction,
  onCommand,
}: {
  w: Workspace;
  onAction: (kind: string, id?: string) => void;
  onCommand: (
    type: string,
    payload: Record<string, unknown>,
    message?: string,
  ) => void;
}) {
  const s = w.subscriptions[0],
    p = w.plans.find((p) => p.id === s?.planId);
  if (!s || !p)
    return (
      <section className="panel">
        <Empty
          title="Your first good month is on its way."
          text="Your team will prepare your subscription. Once it’s ready, you’ll find everything here."
        />
      </section>
    );
  const calc = { ...calculate(w, s), ...w.previews?.[s.id] },
    discount = loyalty(w, s);
  return (
    <>
      <section className="portal-hero">
        <div>
          <span className="tiny-label">YOUR NEXT MONTH, A LITTLE LIGHTER</span>
          <div className="portal-price">
            {money(calc.total)}
            <span>including tax</span>
          </div>
          <h2>{p.name}</h2>
          <p>
            Next renewal: <strong>{day(s.nextBilling)}</strong>
            <br />
            Payment due:{" "}
            <strong>
              {day(paymentDeadline(s.nextBilling, s.terms))}, 11:59 PM IST
            </strong>
          </p>
          <Badge tone="green">{s.paused ? "Paused" : s.stage}</Badge>
          <div className="portal-actions">
            <Button
              variant="secondary"
              onClick={() => onAction("subscriptionDetail", s.id)}
            >
              Your plan details <ArrowUpRight size={16} />
            </Button>
          </div>
        </div>
        <div className="portal-loyalty">
          <div>
            <span className="tiny-label">THE GOODMONTH CLUB</span>
            <Sun size={52} />
          </div>
          <h3>
            {discount > 0
              ? "Look at you, staying golden."
              : "The start of something good."}
          </h3>
          <Stamps streak={s.streak} />
          <p>
            <strong>{discount}% off your recurring price.</strong>
            <br />
            {discount >= s.loyaltyCap
              ? "You’ve unlocked your biggest little perk."
              : `Your next on-time renewal unlocks ${Math.min(discount + s.loyaltyStep, s.loyaltyCap)}% off.`}
          </p>
        </div>
      </section>
      <div className="fair-note">
        <ShieldCheck size={22} />
        <div>
          <strong>Your rewards, clearly explained.</strong>
          <p>
            Pay by your renewal deadline to keep your streak. Missing it resets
            future pricing to the original rate. Invoices already issued keep
            their agreed amount.
          </p>
        </div>
      </div>
      <section className="panel">
        <SectionHead
          title="Your little paper trail"
          sub="Every invoice, all in one place"
        />
        {w.invoices
          .slice()
          .reverse()
          .map((i) => (
            <button
              className="portal-invoice"
              key={i.id}
              onClick={() => onAction("invoice", i.id)}
            >
              <span className="activity-icon">
                <FileText size={18} />
              </span>
              <span>
                <strong>{i.number}</strong>
                <small>{day(i.dueDate)}</small>
              </span>
              <strong>{money(i.total)}</strong>
              <Badge tone={statusTone(invStatus(i, w))}>
                {invStatus(i, w)}
              </Badge>
              <ArrowUpRight size={17} />
            </button>
          ))}
      </section>
    </>
  );
}
function AuthForm({
  kind,
  token,
  busy,
  onSubmit,
  onChange,
}: {
  kind: string;
  token?: string;
  busy: boolean;
  onSubmit: (action: string, values: Record<string, unknown>) => void;
  onChange: (kind: string) => void;
}) {
  return (
    <form
      className="editor-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(kind, {
          ...Object.fromEntries(new FormData(e.currentTarget)),
          token,
        });
      }}
    >
      {kind === "register" && (
        <>
          <Field label="Your name">
            <FormInput name="name" />
          </Field>
          <Field label="Business name">
            <FormInput name="company" />
          </Field>
        </>
      )}
      {kind !== "reset" && (
        <Field label="Email address">
          <FormInput name="email" type="email" />
        </Field>
      )}
      {kind !== "forgot" && (
        <Field
          label={kind === "reset" ? "New password" : "Password"}
          hint={
            kind === "register" || kind === "reset"
              ? "More than 8 characters, upper and lowercase, and a special character."
              : undefined
          }
        >
          <FormInput name="password" type="password" />
        </Field>
      )}
      <Button type="submit" disabled={busy} className="full">
        {busy ? <Loader2 size={16} className="spin" /> : null}
        {kind === "login"
          ? "Make yourself at home"
          : kind === "register"
            ? "Start your next chapter"
            : kind === "forgot"
              ? "Send a fresh link"
              : "Save new password"}
        <ArrowRight size={16} />
      </Button>
      <div className="auth-links">
        {kind === "login" ? (
          <>
            <button type="button" onClick={() => onChange("forgot")}>
              Forgot your password?
            </button>
            <button type="button" onClick={() => onChange("register")}>
              New here? Create an account.
            </button>
          </>
        ) : (
          <button type="button" onClick={() => onChange("login")}>
            Back to sign in
          </button>
        )}
      </div>
    </form>
  );
}
