import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import PlanBrowser from "@/components/plan-browser";
import { readCatalog } from "@/lib/catalog";
export const dynamic = "force-dynamic";
export default async function Page() {
  const catalog = await readCatalog().catch(() => ({
    plans: [],
    sample: false,
    unavailable: true,
  }));
  return (
    <div className="marketing">
      <SiteHeader />
      <main className="public-plans site-container">
        <div className="plans-intro">
          <p className="site-eyebrow">FIND YOUR GOOD FIT</p>
          <h1>
            A plan for
            <br />
            <em>your next chapter.</em>
          </h1>
          <p>
            Choose your rhythm. Make room to grow.
            <br />
            We’ll keep the details simple.
          </p>
        </div>
        <PlanBrowser initial={catalog} />
        <p className="plans-footnote">
          Choose a plan, create your account, and submit a request for review.
          <br />
          Your subscription begins after approval and the required first
          payment.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
