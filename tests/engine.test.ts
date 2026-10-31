import { describe, it, expect } from 'vitest';
import { applyCommand, calculate, confirmInvoice, createInvoice, loyalty, nextPeriod, reconcile, runBilling, visibleWorkspace } from '../lib/engine';
import { money } from '../lib/format';
import { seedWorkspace } from '../lib/seed';
import type { Workspace, Viewer } from '../lib/types';
const admin:Viewer={id:'admin',name:'Admin',email:'admin@example.com',role:'admin'};
function fixture(){const w=seedWorkspace();w.invoices=[];w.payments=[];w.discounts=[];w.activities=[];w.subscriptions=[{...w.subscriptions[0],streak:0,missed:false,nextBilling:'2026-11-01T18:30:00.000Z',terms:0,stage:'Active'}];w.clock='2026-11-01T06:30:00.000Z';return w;}
function invoice(w:Workspace){const i=createInvoice(w,w.subscriptions[0]);confirmInvoice(w,i);return i;}
function pay(w:Workspace,invoiceId:string,amount:number,key='one'){return applyCommand(w,{type:'recordPayment',payload:{invoiceId,amount,method:'UPI'},requestKey:key},admin);}
describe('loyalty and money',()=>{
 it('earns 5 percentage points per fully paid on-time period, capped at 20',()=>{let w=fixture();for(let month=0;month<6;month++){const i=invoice(w);expect(i.loyaltyPercent).toBe(Math.min(month*5,20));w=pay(w,i.id,i.total,`month_${month}`);w.subscriptions[0].nextBilling=nextPeriod(w.subscriptions[0].nextBilling,'monthly');w.clock=new Date(new Date(w.subscriptions[0].nextBilling).getTime()-3600000).toISOString();}expect(loyalty(w,w.subscriptions[0])).toBe(20);});
 it('does not award a stamp for a partial payment',()=>{let w=fixture();const i=invoice(w);w=pay(w,i.id,100);expect(w.subscriptions[0].streak).toBe(0);expect(w.invoices[0].status).toBe('Confirmed');expect(w.invoices[0].paid).toBe(100);});
 it('resets immediately when a deadline is missed, without changing the old invoice',()=>{const w=fixture();w.subscriptions[0].streak=3;const i=invoice(w);const total=i.total;w.clock='2026-11-02T18:30:00.001Z';reconcile(w);expect(w.subscriptions[0].streak).toBe(0);expect(loyalty(w,w.subscriptions[0])).toBe(0);expect(w.invoices[0].total).toBe(total);});
 it('accepts full payment at the exact deadline',()=>{let w=fixture();const i=invoice(w);w.clock=i.dueDate;w=pay(w,i.id,i.total);expect(w.subscriptions[0].streak).toBe(1);});
 it('late settlement does not restore an old streak',()=>{let w=fixture();w.subscriptions[0].streak=3;const i=invoice(w);w.clock='2026-11-03T06:30:00Z';w=pay(w,i.id,i.total);expect(w.subscriptions[0].streak).toBe(0);});
 it('uses the larger eligible discount rather than stacking',()=>{const w=fixture();w.subscriptions[0].streak=2;w.discounts=[{id:'d',name:'Welcome',kind:'percent',value:15,minQuantity:1,minPurchase:0,startDate:'2026-01-01',endDate:'2026-12-31',limit:1,used:0,productId:'',subscriptionId:''}];const i=invoice(w);expect(i.discount).toBe(15000);expect(i.tax).toBe(15300);expect(i.total).toBe(100300);expect(w.discounts[0].used).toBe(1);});
 it('counts discount use once even if billing is run twice',()=>{const w=fixture();w.discounts=[{id:'d',name:'Welcome',kind:'fixed',value:30000,minQuantity:1,minPurchase:0,startDate:'2026-01-01',endDate:'2026-12-31',limit:1,used:0,productId:'',subscriptionId:''}];runBilling(w);runBilling(w);expect(w.discounts[0].used).toBe(1);expect(w.invoices).toHaveLength(1);});
 it('handles variant surcharges and quantity before tax',()=>{const w=fixture();w.subscriptions[0].variant='Odoo';w.subscriptions[0].quantity=2;const calc=calculate(w,w.subscriptions[0]);expect(calc.subtotal).toBe(312000);expect(calc.tax).toBe(56160);});
 it('rejects overpayments',()=>{const w=fixture();const i=invoice(w);expect(()=>pay(w,i.id,i.total+1)).toThrow();});
 it('deduplicates retried partial payment submissions',()=>{let w=fixture();const i=invoice(w);w=pay(w,i.id,100,'same');w=pay(w,i.id,100,'same');expect(w.invoices[0].paid).toBe(100);expect(w.payments).toHaveLength(1);});
});
describe('billing lifecycle',()=>{
 it('runs idempotently for the same period',()=>{const w=fixture();runBilling(w);runBilling(w);expect(w.invoices).toHaveLength(1);});
 it('persists an unfinished backlog and processes it on the next run',()=>{const w=fixture();w.clock='2027-04-01T06:30:00Z';const r=runBilling(w,2);expect(r.processed).toBe(2);expect(r.backlog).toBe(1);const next=w.subscriptions[0].nextBilling;runBilling(w,2);expect(w.invoices).toHaveLength(4);expect(w.subscriptions[0].nextBilling>next).toBe(true);});
 it('does not bill paused or closed subscriptions',()=>{const w=fixture();w.subscriptions[0].paused=true;runBilling(w);expect(w.invoices).toHaveLength(0);w.subscriptions[0].paused=false;w.subscriptions[0].stage='Closed';runBilling(w);expect(w.invoices).toHaveLength(0);});
 it('clamps month ends and leap years',()=>{expect(nextPeriod('2026-01-31T18:30:00Z','monthly')).toBe('2026-02-28T18:30:00.000Z');expect(nextPeriod('2024-02-28T18:30:00Z','yearly')).toBe('2025-02-27T18:30:00.000Z');});
 it('supports daily and weekly intervals',()=>{expect(nextPeriod('2026-11-01T18:30:00Z','daily')).toBe('2026-11-02T18:30:00.000Z');expect(nextPeriod('2026-11-01T18:30:00Z','weekly')).toBe('2026-11-08T18:30:00.000Z');});
 it('requires first invoice payment before activation',()=>{const w=fixture();w.subscriptions[0].stage='Confirmed';expect(()=>applyCommand(w,{type:'transition',payload:{id:w.subscriptions[0].id,stage:'Active'}},admin)).toThrow(/first invoice/);});
});
describe('permissions',()=>{
 const customer:Viewer={id:'customer',name:'Maya',email:'maya@example.com',role:'customer',customerId:'cust_maya'};
 it('blocks customers from operational writes',()=>{expect(()=>applyCommand(fixture(),{type:'runBilling',payload:{}},customer)).toThrow(/access/);});
 it('blocks staff from configuring plans',()=>{expect(()=>applyCommand(fixture(),{type:'savePlan',payload:{}},{...admin,role:'staff'})).toThrow(/admin/);});
 it('blocks actions on another customer subscription',()=>{expect(()=>applyCommand(fixture(),{type:'pause',payload:{id:'sub_1'}},{...customer,customerId:'other'})).toThrow(/access/);});
 it('filters all financial records to the signed-in customer',()=>{const w=seedWorkspace(),view=visibleWorkspace(w,customer);expect(view.subscriptions.every(s=>s.customerId===customer.customerId)).toBe(true);expect(view.invoices.every(s=>s.customerId===customer.customerId)).toBe(true);expect(view.payments.every(s=>s.customerId===customer.customerId)).toBe(true);expect(view.products.every(p=>p.cost===0)).toBe(true);expect(view.discounts).toHaveLength(0);expect(view.activities).toHaveLength(0);});
});

describe('display formatting',()=>{it('formats fractional values in compact metrics without throwing',()=>{expect(money(141552,true)).toContain('1,416');expect(money(141552)).toContain('1,415.52');});});
