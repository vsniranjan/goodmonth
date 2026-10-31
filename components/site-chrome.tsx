import Link from "next/link";
import { ArrowUpRight, Menu } from "lucide-react";
import { Logo } from "./ui";
export function SiteHeader() {
  return (
    <header className="site-header">
      <Link href="/" aria-label="Goodmonth home">
        <Logo />
      </Link>
      <nav className="site-nav" aria-label="Website navigation">
        <Link href="/#how-it-works">How it works</Link>
        <Link href="/plans">Explore plans</Link>
        <Link href="/#loyalty">The loyalty club</Link>
      </nav>
      <div className="site-account">
        <Link href="/login">Sign in</Link>
        <Link href="/plans" className="site-button small">
          Find your plan <ArrowUpRight size={16} />
        </Link>
      </div>
      <details className="site-mobile-menu">
        <summary aria-label="Open navigation">
          <Menu size={23} />
        </summary>
        <nav aria-label="Mobile website navigation">
          <Link href="/#how-it-works">How it works</Link>
          <Link href="/plans">Explore plans</Link>
          <Link href="/#loyalty">The loyalty club</Link>
          <Link href="/login">Sign in</Link>
        </nav>
      </details>
    </header>
  );
}
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <Link href="/" aria-label="Goodmonth home">
          <Logo />
        </Link>
        <p>
          Made for good months.
          <br />
          And the people behind them.
        </p>
      </div>
      <nav aria-label="Footer navigation">
        <Link href="/plans">Explore plans</Link>
        <Link href="/login">Customer sign-in</Link>
        <Link href="/admin/login">
          Admin sign-in <ArrowUpRight size={13} />
        </Link>
        {process.env.NEXT_PUBLIC_DEMO_ENABLED !== "false" && (
          <Link href="/demo">Explore the demo</Link>
        )}
      </nav>
      <span>Goodmonth · A little better, together.</span>
    </footer>
  );
}
