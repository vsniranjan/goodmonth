# Goodmonth

**A little less, month after month.**

A subscription workspace for Brightloop Software, built for the Odoo × Make-A-Ton hackathon. Next.js, TypeScript, Tailwind, Prisma and Postgres. Ready for later Vercel deployment.

## Run the sample workspace

```sh
npm ci
npm run db:generate
npm run dev
```

Open http://localhost:3000 for the product homepage. Browse `/plans`, use `/login` or `/signup` for customer accounts, and `/admin/login` for the team. Without database credentials, plans are explicitly labeled samples and account forms explain that live sign-in is unavailable. Open `/demo` for the **sample workspace**. This is an interactive, browser-local demonstration: edits and payments persist in localStorage, and its clock can advance without changing real accounts. No sample action collects money. Use **Demo studio** to switch sample roles, advance time, run billing twice, or reset the story.

## Run live accounts with a database

1. Copy `.env.example` to `.env` and set `DATABASE_URL` and `APP_URL`.
2. Use a Neon Postgres URL for serverless hosting, or start local Postgres:

```sh
docker compose up -d
```

Local-only database URL:

```text
postgresql://goodmonth:local-goodmonth-only@localhost:5432/goodmonth
```

3. Apply the checked-in migration and seed the initial Brightloop workspace:

```sh
npm run db:migrate
npm run db:seed
```

Set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` (at least 12 characters) first. There are no built-in live login credentials. The seed creates the admin and an initial sample business dataset; subsequent changes are dynamic database writes. Live mode uses the real current date, so initial historical invoices may be overdue.

4. Restart the app. The homepage stays public with a configured database. Protected workspace routes require sign-in. Admins add staff in Settings; public registration creates a customer account in Brightloop. Customer permissions are enforced on the server. Customers choose plans in `/portal/plans` and submit a request. Admins review requests in `/admin/requests`; approval creates a draft subscription for the existing quotation, invoice, and activation process. Approval is idempotent. Older workspace documents default to an empty request list, so this addition needs no database migration. The public `/api/catalog` exposes available plans and variants without internal product costs or customer data.

Prisma CLI reads `.env`. Next.js also reads `.env.local`; use `.env` for values needed by both.

## Email

Configure `RESEND_API_KEY`, a verified `EMAIL_FROM`, and `APP_URL` to deliver password resets and invoice emails. Without email configuration, messages stay in the database outbox. Admins can see outbox subjects/status in Settings. Development only: `/api/demo` also exposes outbox text to authenticated admins, so reset links can be inspected locally; production never returns message bodies.

Failed deliveries are retried by billing cron or when sending invoices. An atomic lease and provider idempotency key prevent concurrent duplicate sends. No external email is sent during the sample demonstration.

## Vercel, when you're ready

- Import the repository as a Next.js project.
- Create a Neon database and add `DATABASE_URL` to Vercel environment variables. Use distinct development, preview and production databases.
- Set `APP_URL` to the deployed origin, `CRON_SECRET` to a long random value, and email variables if delivery is needed.
- Keep `NEXT_PUBLIC_DEMO_ENABLED=true` for the isolated judge demo, or set it to `false` before building to disable it.
- Apply database migrations explicitly against the intended production database before deployment. Do not run seeds or migrations on every request/build.
- Build command: `npm run build`. The build generates Prisma Client; it does not need live database access.
- Seed the admin once using the intended database connection and private seed credentials.
- `vercel.json` schedules billing once daily at 18:30 UTC (midnight IST). Vercel Hobby execution timing is approximate. Deadline checks are timestamp based, including payment mutations, so cron delays do not extend rewards.

No continuously running worker, SQLite file, persistent server memory or filesystem writes are used for live data. Next.js handlers use the Node.js serverless runtime. The Neon adapter is selected for hosted databases; local Postgres uses Prisma's direct driver.

## Business rules

- A fully paid on-time monthly period earns five percentage points off the next period, capped at 20% by default. Plan rules can be configured; subscriptions snapshot them.
- A missed deadline resets the streak immediately for future invoices. Existing confirmed invoice amounts remain unchanged. Partial payments do not earn a stamp. Late settlement does not restore old rewards.
- Loyalty is monthly only. Daily, weekly and yearly plans bill normally. Pausing and cancelling reset the streak.
- First-period payment is required before activation. Renewals are invoiced three days before their due date.
- Fixed/percentage discounts support dates, product/subscription targeting, thresholds and use limits. The larger of an eligible ordinary discount and loyalty discount wins; they do not stack.
- Money uses integer paise. Taxes are applied after discounts and rounded to the nearest paise. Dates display in Asia/Kolkata.
- Invoice period keys and payment request keys have database uniqueness constraints. Workspace version compare-and-swap and ledger writes commit in one transaction. Retry conflicts rather than overwriting another request.
- Scheduler batches are bounded. Remaining work stays represented by the subscription's next-billing cursor; repeated runs catch up without duplicates. Admins can run billing manually after downtime.

## Data model and interfaces

`Workspace.state` is a versioned JSON aggregate for catalog, subscription and reporting state. It is **dynamic Postgres data**, not a static JSON file. Mutations use optimistic concurrency with atomic indexed invoice/payment ledger writes. This keeps the hackathon implementation compact, but the full workspace document is still loaded for each request; it should be normalized and paginated server-side before a large production rollout.

- `GET /api/workspace`: authenticated, role-filtered workspace.
- `POST /api/command`: validated business operations and server-side permissions.
- `POST /api/auth/login|register|logout|forgot|reset|staff`: account flows.
- `GET /api/auth/me`: current identity and database configuration state.
- `GET /api/cron/billing`: bearer-secret-protected billing and outbox processing.
- `GET /api/demo`: authenticated admin-only operations history and team list.

Auth sessions use cryptographically random opaque tokens, hashed in the database, in HTTP-only same-site cookies. Reset tokens are expiring and single use. Mutating browser endpoints verify the request origin. Financial responses are not shared-cacheable.

## Verify

```sh
npm test
npm run typecheck
npm run build
```

Tests cover pricing, taxes, variants, payment boundaries, reset rules, retry safety, lifecycle and customer ownership. See `docs/HACKATHON.md` for submission steps and a suggested video story.

## Current limits

- Payments are recorded, not processed through a payment gateway.
- Real database transactions, live email delivery and Vercel scheduling require credentials and must be verified in the target environment.
- The scheduler processes up to five workspaces and 40 periods per workspace per invocation. This app is designed for one Brightloop business, not a general multi-tenant service.
- Large-data response time and cold-start performance must be measured on the deployment. Do not claim the brief's two-second target is proven by local UI checks.
- No refunds, credit notes, mid-period proration, or accounting revenue recognition are included.
- Shared-workspace signup and missing login rate limiting need hardening before opening the application beyond a supervised hackathon demo.
