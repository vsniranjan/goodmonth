"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Logo, Sun } from "./ui";
type Kind = "login" | "register" | "forgot" | "reset";
export default function AuthPage({
  kind,
  admin = false,
  plan = "",
  token = "",
  configured = true,
}: {
  kind: Kind;
  admin?: boolean;
  plan?: string;
  token?: string;
  configured?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [done, setDone] = useState(false),
    [showPassword, setShowPassword] = useState(false);
  const suffix = plan ? `?plan=${encodeURIComponent(plan)}` : "";
  const loginUrl = admin ? "/admin/login" : `/login${suffix}`;
  const titles = {
    login: admin ? "A good day to get things done." : "Good to have you back.",
    register: "Your next good month starts here.",
    forgot: "Let’s make a fresh start.",
    reset: "A new password. A fresh start.",
  };
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const values = Object.fromEntries(new FormData(e.currentTarget));
      const res = await fetch(`/api/auth/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          token,
          area: admin ? "admin" : "customer",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Please try again.");
      if (kind === "forgot" || kind === "reset") {
        setDone(true);
        return;
      }
      const role = kind === "register" ? "customer" : data.role;
      router.replace(
        role === "customer"
          ? plan
            ? `/portal/plans?plan=${encodeURIComponent(plan)}`
            : "/portal"
          : "/admin",
      );
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "We couldn’t connect. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="account-page">
      <aside className="account-story">
        <Link href="/" aria-label="Goodmonth home">
          <Logo />
        </Link>
        <div>
          <p className="site-eyebrow">
            {admin
              ? "THE PEOPLE BEHIND THE GOOD MONTHS"
              : "YOUR OWN LITTLE CORNER OF GOODMONTH"}
          </p>
          <h2>
            {admin ? (
              <>
                A little clarity.
                <br />
                <em>A lot of possibility.</em>
              </>
            ) : (
              <>
                Good months.
                <br />
                <em>Better together.</em>
              </>
            )}
          </h2>
          <p>
            {admin
              ? "Subscriptions, customers, and the details that keep everything moving. All in a good day’s work."
              : "Your plan, your invoices, and a little something for sticking around. It all starts with you."}
          </p>
          <Sun size={110} />
        </div>
        <span>Made for good months. And the people behind them.</span>
      </aside>
      <main className="account-main">
        <Link href="/" className="account-back">
          <ArrowLeft size={16} /> Back to Goodmonth
        </Link>
        <div className="account-form-wrap">
          <p className="site-eyebrow">
            {admin ? (
              <>
                <ShieldCheck size={14} /> STAFF & ADMIN SIGN-IN
              </>
            ) : kind === "login" ? (
              "MAKE YOURSELF AT HOME"
            ) : (
              "A GOOD PLACE TO BEGIN"
            )}
          </p>
          <h1>{titles[kind]}</h1>
          <p className="account-description">
            {kind === "login"
              ? admin
                ? "Sign in with your team account to open the workspace."
                : "Sign in to see your subscriptions, invoices, and rewards."
              : kind === "register"
                ? "Create your customer account. Choose a plan and we’ll take it from there."
                : kind === "forgot"
                  ? "Enter your email and we’ll send you a link to reset your password."
                  : "Choose a strong password to keep your account secure."}
          </p>
          {plan && !admin && (
            <p className="account-plan-note">
              <CheckCircle2 size={17} /> Your selected plan will be waiting
              after sign-in.
            </p>
          )}
          {!configured && (
            <p className="account-notice">
              Accounts aren’t available in this preview yet.
              {process.env.NEXT_PUBLIC_DEMO_ENABLED !== "false" && (
                <>
                  {" "}
                  You can <Link href="/demo">explore the sample workspace</Link>
                  .
                </>
              )}
            </p>
          )}
          {done ? (
            <div className="account-success" role="status">
              <CheckCircle2 size={28} />
              <h2>
                {kind === "forgot"
                  ? "Check your inbox."
                  : "Your password is updated."}
              </h2>
              <p>
                {kind === "forgot"
                  ? "If an account exists for that email, a reset link is on its way. The link is valid for 30 minutes."
                  : "Sign in with your new password to continue."}
              </p>
              <Link className="site-button" href={loginUrl}>
                Back to sign in <ArrowRight size={17} />
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="account-form">
              {kind === "register" && (
                <>
                  <label>
                    Your name
                    <input
                      name="name"
                      autoComplete="name"
                      required
                      minLength={2}
                      maxLength={100}
                      placeholder="Alex Morgan"
                    />
                  </label>
                  <label>
                    Business name
                    <input
                      name="company"
                      autoComplete="organization"
                      required
                      maxLength={100}
                      placeholder="Your business or studio"
                    />
                  </label>
                </>
              )}
              {kind !== "reset" && (
                <label>
                  Email address
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder={
                      admin ? "you@yourcompany.com" : "you@example.com"
                    }
                  />
                </label>
              )}
              {kind !== "forgot" && (
                <label>
                  {kind === "reset" ? "New password" : "Password"}
                  <span className="password-input">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={
                        kind === "login" ? "current-password" : "new-password"
                      }
                      required
                      minLength={kind === "login" ? undefined : 9}
                      maxLength={128}
                    />
                    <button
                      type="button"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </span>
                  {kind !== "login" && (
                    <small>
                      Use at least 9 characters with uppercase, lowercase, and a
                      special character.
                    </small>
                  )}
                </label>
              )}
              {kind === "login" && (
                <Link
                  className="forgot-link"
                  href={`/forgot-password${admin ? "?area=admin" : suffix}`}
                >
                  Forgot password?
                </Link>
              )}
              {error && (
                <p className="account-error" role="alert">
                  {error}
                </p>
              )}
              {kind === "reset" && !token && (
                <p className="account-error" role="alert">
                  This reset link is missing its token.{" "}
                  <Link href="/forgot-password">Request a new link.</Link>
                </p>
              )}
              <button
                className="site-button"
                type="submit"
                disabled={busy || !configured || (kind === "reset" && !token)}
              >
                {busy ? <Loader2 size={18} className="spin" /> : null}
                {kind === "login"
                  ? "Sign in"
                  : kind === "register"
                    ? "Create your account"
                    : kind === "forgot"
                      ? "Send reset link"
                      : "Save new password"}
                <ArrowRight size={17} />
              </button>
              <p className="account-switch">
                {kind === "login" ? (
                  admin ? (
                    <>
                      Here for your subscription?{" "}
                      <Link href="/login">Customer sign-in</Link>
                    </>
                  ) : (
                    <>
                      New to Goodmonth?{" "}
                      <Link href={`/signup${suffix}`}>Create an account</Link>
                    </>
                  )
                ) : (
                  <>
                    Already have an account?{" "}
                    <Link href={loginUrl}>Sign in</Link>
                  </>
                )}
              </p>
            </form>
          )}
        </div>
        <footer>
          <ShieldCheck size={14} /> Your details, in good hands.
        </footer>
      </main>
    </div>
  );
}
