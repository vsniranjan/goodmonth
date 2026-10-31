# Submission notes

Based on the event-page text and participant document supplied by Niranjan on 31 October 2026.

## Event milestones (Asia/Kolkata)

- Coding window: 31 October, 09:00–17:00.
- GitHub repository link: submit through the team leader's portal account.
- Evaluator collaboration milestone: 31 October, 10:00. The supplied page names Jay Patel, with GitHub handles `jayp-odoo` and `hackathon-odoo`; confirm which account the portal expects before inviting.
- Video link: 31 October, 17:30. Verify the portal shows its submission confirmation.
- Keep the submitted code on one branch. This project uses `main`.

## Participant actions

- Every member signs in with the GitHub account used at registration and confirms their participation/address.
- Only the team leader selects the problem statement; the document says the confirmed selection cannot be changed.
- Add the assigned mentor/evaluator as a repository collaborator and join the event Discord via the portal.
- Team members must contribute their own work and commits. Generated commits do not substitute for multiple human contributors; do not fabricate authorship.
- Follow the portal's GitHub and video submission steps and check event emails.

These are participant actions; the app build does not perform portal submissions, send invitations, or contact the evaluator.

## Build alignment

- Live mode uses Postgres for dynamic records. Browser-local sample data is labeled as a demonstration, not a live database.
- Both client form controls and server/domain validation check inputs.
- Role checks run on the server, including customer ownership checks.
- Feature commits are kept incremental on one branch.
- Local Postgres is supported for an offline presentation after dependencies are installed. Email delivery needs connectivity; the outbox preserves messages until delivery is possible.
- Resend, Neon and Vercel are optional for the local presentation; Vercel deployment is prepared, not performed.

## Three-minute video

1. Introduce the problem: missed renewals, manual invoices and unclear balances.
2. Show the dashboard and create a quote/subscription.
3. Open an itemized invoice and record payment.
4. In the clearly marked sample workspace, advance the clock to demonstrate loyalty savings and a missed-renewal reset.
5. Repeat billing to show duplicate prevention.
6. Show the customer portal and explain roles, database persistence and tests.

State which mode is being shown. Do not present sample-role switching as real authentication or sample payments as payment-gateway transactions.
