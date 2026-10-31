import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ArrowDown } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Sun } from "@/components/ui";
import { MonthSheet } from "@/components/month-calendar";
import { LoyaltyCalendar } from "@/components/loyalty-calendar";

export const metadata: Metadata = {
  title: "Goodmonth | Good months add up",
  description:
    "Software subscriptions for studios and growing teams. Find your plan, keep billing in one place, and earn rewards for eligible on-time renewals.",
  openGraph: {
    title: "Goodmonth | Good months add up",
    description:
      "Your software. Your rhythm. A little more rewarding every month.",
  },
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const { reset } = await searchParams;
  if (reset) redirect(`/reset-password?token=${encodeURIComponent(reset)}`);
  return (
    <div className="marketing gm-home">
      <a className="gm-skip" href="#main">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" tabIndex={-1}>
        <section className="gm-hero gm-wrap">
          <div className="gm-hero-copy">
            <p className="gm-label">
              <span className="gm-dot" /> A little better, every month
            </p>
            <h1>
              Good months
              <br />
              <em>add up.</em>
            </h1>
            <p className="gm-intro">
              Software subscriptions for studios and growing teams. One place
              for your plans, your bills, and a little something for staying.
            </p>
            <div className="gm-actions">
              <Link className="site-button" href="/plans">
                Explore plans <ArrowRight size={20} />
              </Link>
              <Link className="gm-link" href="#loyalty">
                Discover the perks <ArrowDown size={17} />
              </Link>
            </div>
          </div>
          <div
            className="gm-hero-art"
            aria-label="Calendar illustration: month five of an example ₹1,000 monthly plan costs ₹800 before tax, with a 20% loyalty saving."
            role="img"
          >
            <div className="gm-calendar gm-hero-calendar" aria-hidden="true">
              <MonthSheet month={5} />
            </div>
            <div className="gm-art-caption">
              <span>THE ART OF STICKING AROUND</span>
              <span>Illustrative example ↗</span>
            </div>
          </div>
          <div className="gm-hero-baseline">
            <span>Your software. Your rhythm.</span>
            <span>
              Good things are just getting started <ArrowDown size={16} />
            </span>
          </div>
        </section>
        <LoyaltyCalendar />
        <section className="gm-how gm-wrap" id="how-it-works">
          <div className="gm-how-heading">
            <span className="gm-label">Make yourself at home</span>
            <h2>
              A good start.
              <br />
              An easier routine.
            </h2>
            <Link className="gm-link" href="/plans">
              Find your first plan <ArrowRight size={18} />
            </Link>
          </div>
          <ol className="gm-steps">
            <li>
              <span>01</span>
              <div>
                <h3>Find your kind of plan.</h3>
                <p>
                  Explore the available subscriptions and choose the billing
                  rhythm that works for you.
                </p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>We’ll get you settled.</h3>
                <p>
                  Create your account and request your plan. Our team reviews it
                  and prepares your subscription.
                </p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>Keep the good going.</h3>
                <p>
                  Follow your invoices, manage your subscription, and see the
                  rewards your eligible renewals earn. All in your portal.
                </p>
              </div>
            </li>
          </ol>
        </section>
        <section className="faq-section site-container" id="questions">
          <div className="section-intro">
            <p className="gm-label">THE LITTLE DETAILS</p>
            <h2>
              A few good
              <br />
              <em>questions.</em>
            </h2>
          </div>
          <div className="faq-list">
            {[
              {
                q: "What happens after I choose a plan?",
                a: "Create an account, confirm your plan and submit a request. Our team reviews the request and prepares your subscription. You can follow its progress in your portal.",
              },
              {
                q: "Where do I find my invoices?",
                a: "Sign in to your customer portal and open Invoices. You can see invoice details and print or save a copy for your records.",
              },
              {
                q: "Can I pause or end my subscription?",
                a: "Your plan details show which options are available. If your plan supports pausing or cancellation, you can manage it from your portal.",
              },
              {
                q: "How do loyalty rewards work?",
                a: "On eligible monthly plans, fully paid on-time renewals earn a discount on the next period, up to your plan’s cap. Your portal shows the current progress. Late payments reset the streak.",
              },
            ].map((item) => (
              <details key={item.q}>
                <summary>
                  {item.q}
                  <span>+</span>
                </summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="gm-finale">
          <div className="gm-wrap">
            <div className="gm-finale-top">
              <span className="gm-label">Your next chapter starts here</span>
              <Sun size={70} />
            </div>
            <h2>
              Here’s to your
              <br />
              <em>next good month.</em>
            </h2>
            <div className="gm-finale-bottom">
              <Link href="/plans" className="site-button">
                Find your plan <ArrowRight size={20} />
              </Link>
              <p>
                Already part of the club?{" "}
                <Link href="/login">Welcome back.</Link>
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
