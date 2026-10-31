import "server-only";
import { db } from "./db";
export async function queueEmail(
  key: string,
  to: string,
  subject: string,
  text: string,
) {
  return db().emailOutbox.upsert({
    where: { key },
    create: { key, to, subject, text },
    update: {},
  });
}
export async function deliverEmails(limit = 15) {
  if (!process.env.RESEND_API_KEY) return { sent: 0, configured: false };
  const emails = await db().emailOutbox.findMany({
    where: {
      status: { not: "sent" },
      OR: [{ leaseUntil: null }, { leaseUntil: { lt: new Date() } }],
      attempts: { lt: 8 },
    },
    take: limit,
    orderBy: { createdAt: "asc" },
  });
  let sent = 0;
  for (const email of emails) {
    const claimed = await db().emailOutbox.updateMany({
      where: {
        id: email.id,
        status: { not: "sent" },
        OR: [{ leaseUntil: null }, { leaseUntil: { lt: new Date() } }],
      },
      data: {
        leaseUntil: new Date(Date.now() + 120000),
        attempts: { increment: 1 },
      },
    });
    if (!claimed.count) continue;
    try {
      const result = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
          "Idempotency-Key": email.id,
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM,
          to: email.to,
          subject: email.subject,
          text: email.text,
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!result.ok)
        throw new Error(`Email provider returned ${result.status}`);
      await db().emailOutbox.update({
        where: { id: email.id },
        data: { status: "sent", leaseUntil: null, lastError: null },
      });
      sent++;
    } catch (e) {
      await db().emailOutbox.update({
        where: { id: email.id },
        data: {
          status: "failed",
          leaseUntil: null,
          lastError: e instanceof Error ? e.message : "Delivery failed",
        },
      });
    }
  }
  return { sent, configured: true };
}
