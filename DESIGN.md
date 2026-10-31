# Goodmonth: good months add up

## Brief

A public product landing page for software subscription customers: studios and growing teams. Its job is to explain the product, show the value of eligible monthly loyalty rewards, and send people to plans or sign-in. Retain the existing Next.js App Router, local Fraunces and DM Sans fonts, and customer/admin flows. No invented testimonials, customer counts or live pricing claims.

## Concept selection

Scores: originality / fit / feasibility / portability (lower portability is better).

| Territory   | Concept and signature                                                    | Emotion / shareable frame                          | Anchor                                        | Scores        |
| ----------- | ------------------------------------------------------------------------ | -------------------------------------------------- | --------------------------------------------- | ------------- |
| Name / time | Good months add up: turn a physical month sheet to reveal a smaller bill | Warm anticipation / huge 05 over a yellow calendar | Goodmonth and its monthly loyalty progression | 4 / 5 / 5 / 2 |
| Material    | Membership stamp book: collect four stamps to complete a savings page    | Belonging / four oversized reward seals            | Four eligible renewals reach the example cap  | 3 / 4 / 5 / 3 |
| Formal      | Repeat the month numeral at a descending scale beside the savings        | Order / stepped numerals and prices                | Discount increases each eligible renewal      | 3 / 4 / 5 / 4 |

Chosen: the calendar makes the name, price progression and motion one understandable object.

Idea: Good months add up to a small reward for staying.
Metaphor: A paper desk calendar, with a new sheet for each monthly period.
Signature: A single progress value turns five sheets and synchronizes selected month, stamps and price.
Emotion: Optimistic, tactile, quietly confident.
Motion verb: Lift, turn, settle.
Screenshot: A giant month-five yellow sheet, ₹800 and 20%, next to expressive editorial type.

## System

Palette: paper #f6f4e9, ink #173e32, yellow #f3ce61, muted #56665a, line #ccd0bd, section ground #e5e9d9. Preserve the brand's warm green character; avoid an unrelated visual rebrand.
Type: existing local @fontsource-variable Fraunces for display and month numerals; DM Sans for body, navigation and price. Display tracking -0.055 to -0.075em; line height 0.99–1.1. Body 16–17px, leading 1.55–1.65. Utility captions are subordinate and legible.
Grid: 1280px maximum, 56px desktop margins, 22px phone margins. Two unequal hero columns, equal loyalty columns, numbered vertical onboarding, split FAQ, full-width dark finale. Radius: paper corners 4–5px; only physical binding and stamp circles are round.
Motion: GSAP power3.out for 650ms page selection. Desktop ScrollTrigger owns progress, a short 1100px pinned sequence. Native scrolling, no global interception, no loading theatre or WebGL. Hover lift 250ms, arrow travel 4px. GSAP context/matchMedia reverts triggers, transforms and tweens at unmount or media changes. No independent animation clock.
Idle decision: still paper at rest is intentional. Calendar turns, hover, focus and press responses provide life without decorative wobble.

## Compositions

Hero: [large title + action] [tilted month-five calendar]
[quiet product line ---------------- down cue]
Loyalty:[story + month controls] [five sheets occupying one stage]
How: [section title + link] [01 text / 02 text / 03 text]
FAQ: [short heading] [native disclosure rows]
Finale: [small label ---------------- sun]
[oversized next-month invitation]
[yellow CTA -------- returning customer link]
Mobile: hero text before compact artwork; loyalty text and controls above calendar; no pinning; each subsequent section stacks in reading order.

## Content and fallbacks

Illustrative ₹1,000 base monthly plan: months 1–5 cost ₹1,000 / ₹950 / ₹900 / ₹850 / ₹800 before tax. 5% per eligible renewal, capped at 20%; missed deadlines reset streak; annual plans excluded. Actual plan rules remain authoritative.
No-JavaScript content is rendered on the server; all five example prices are in a native disclosure. Month controls appear only once functional. Reduced motion disables pinning and instantly updates the calendar. Keep the legacy reset query redirect.
No backend/API/schema changes. No new claims about real customers or production performance. Shared public chrome only receives homepage-scoped style changes.

## Genericness and restraint

Removed the fake dashboard, floating perk badges and decorative orbit. The calendar is an honest conceptual illustration, not a simulated application screenshot. Its numerals, perforations and stamps carry the same monthly-reward story. No gratuitous page transition between a public landing page and authentication.

## QA

Verify 390px mobile and wide desktop; month selection, scroll endpoints, keyboard focus, native FAQ, CTA destinations, reduced motion, no JavaScript, and navigation cleanup. Run typecheck/tests/build. Two screenshot critiques using only rendered evidence. Record environment limitations honestly rather than claiming unmeasured performance.

## Verification results

- TypeScript passed; all 39 existing tests passed; diff whitespace check passed.
- Server-render smoke check confirmed one h1, skip link, native five-month explanation, real plan links, and hidden controls before hydration.
- Browser checked desktop and 390px phone: month endpoints, page turning on scroll, phone controls beside calendar, FAQ, plans/sign-in routes, return navigation, skip-link focus and keyboard selection. No horizontal overflow observed. Browser logs clear after fixing a hot-refresh cleanup error with synchronous layout-effect teardown.
- Two fresh independent screenshot critics reviewed separate passes. Final evidence-limited score: 7.38/10 (design 7.6, usability 7.1, creativity 7.4, content 7.2). Feedback improved mobile control placement, caption readability, transition wording, and eligibility text. This is not an award-readiness or production-performance claim.
- Production verification blocked: Turbopack cannot bind its CSS worker port (EPERM) even outside the sandbox; webpack fallback fails parsing TypeScript --showConfig child output. No production build was produced.
- Reduced-motion logic was inspected but not browser-emulated. No-JS was checked through server rendering, not a JavaScript-disabled browser. Axe, throttled performance, FPS and full hover-state audits remain unmeasured; the available browser control surface does not expose those emulation/measurement actions.
- Run locally with `npm run dev`. Before deployment, run `npm run build` in an unrestricted build environment and complete the remaining production accessibility/performance checks. Nothing was deployed.
