# Verification — 31 October 2026

## Automated

- 27 domain tests pass: loyalty progression/cap, partial/late/deadline payments, taxes, variants, discount precedence/redemptions/expiry, immutable confirmed invoices, payment retries, billing replay/backlogs, lifecycle permissions, month-end anchors and IST reporting boundaries.
- TypeScript checks pass.
- Production build passes without database credentials; serverless routes compile as dynamic endpoints.
- Initial Postgres migration generated and checked in.

## Browser checks

- Dashboard and customer portal inspected at desktop and 390px mobile viewport.
- Customer view contains that customer's subscription and invoices only.
- Created a subscription draft, moved it to quotation/confirmation, and created its first invoice.
- Created and confirmed a renewal invoice: ₹1,000 subtotal, ₹200 loyalty discount, ₹144 GST, ₹944 total.
- Recorded its ₹944 sample payment and verified the invoice became Paid and the loyalty card gained its fifth stamp.
- Ran billing twice: the first run brought the sample book to 26 invoices; the second run kept it at 26.
- Checked the mobile menu, modal focus handling and page overflow.
- Fonts are bundled locally; no Google Fonts request is required.

## API boundary checks

- Unauthenticated workspace read: 401.
- Cron request without its secret: 401.
- Browser mutation without a verified origin: 403.

## Not verified here

No database URL or email-provider credentials were available. Live database migrations, concurrent database transactions, registration/login/reset delivery, real invoice emails and Vercel cron execution must be exercised against the configured environment. Docker/Postgres was not available in the execution environment, so the local database instructions were prepared but not run.

The browser checks use the clearly labeled browser-local sample workspace. They do not prove live persistence or the two-second response target at thousands of records. The JSON workspace aggregate and complete-workspace responses are a known scaling limit documented in README.
