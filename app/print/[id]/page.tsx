"use client";
import { useEffect, useState, use } from "react";
import type { Customer, Invoice } from "@/lib/types";
import { Logo, Button } from "@/components/ui";
import { money, day } from "@/lib/format";
export default function PrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<{
      invoice: Invoice;
      customer: Customer;
    } | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    async function load() {
      try {
        const sample = localStorage.getItem("goodmonth-demo-v1");
        if (sample) {
          const w = JSON.parse(sample);
          const invoice = w.invoices.find((i: Invoice) => i.id === id);
          if (invoice) {
            setData({
              invoice,
              customer: w.customers.find(
                (c: Customer) => c.id === invoice.customerId,
              ),
            });
            return;
          }
        }
        const res = await fetch("/api/workspace"),
          w = (await res.json()).workspace;
        const invoice = w?.invoices.find((i: Invoice) => i.id === id);
        if (!invoice) throw new Error("Invoice not found or access denied.");
        setData({
          invoice,
          customer: w.customers.find(
            (c: Customer) => c.id === invoice.customerId,
          ),
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load invoice.");
      }
    }
    load();
  }, [id]);
  if (!data)
    return (
      <main className="boot">
        <Logo />
        <p>{error || "Getting your receipt ready…"}</p>
      </main>
    );
  const { invoice: i, customer: c } = data;
  return (
    <>
      <div className="print-toolbar">
        <a href="/">← Back to Goodmonth</a>
        <Button onClick={() => window.print()}>Print / save PDF</Button>
      </div>
      <main className="print-page">
        <Logo />
        <h1>{i.number}</h1>
        <div className="receipt-address">
          <div>
            <span className="tiny-label">BILLED TO</span>
            <h3>{c.company}</h3>
            <p>
              {c.name}
              <br />
              {c.email}
            </p>
          </div>
          <div>
            <p>
              Issued {day(i.issuedDate)}
              <br />
              Due {day(i.dueDate)}
              <br />
              {i.status}
            </p>
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
            <strong>{money(i.subtotal)}</strong>
          </div>
          <div>
            <span>{i.discountLabel}</span>
            <strong>−{money(i.discount)}</strong>
          </div>
          <div>
            <span>Tax ({i.taxRate}%)</span>
            <strong>{money(i.tax)}</strong>
          </div>
          <div className="total-line">
            <strong>Total</strong>
            <strong>{money(i.total)}</strong>
          </div>
          <div>
            <span>Paid</span>
            <strong>{money(i.paid)}</strong>
          </div>
          <div>
            <span>Outstanding</span>
            <strong>{money(i.total - i.paid)}</strong>
          </div>
        </div>
        <div className="receipt-note">Thanks for another good month.</div>
      </main>
    </>
  );
}
