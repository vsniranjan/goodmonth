import { z } from 'zod';
import { apiError, checkOrigin, requireUser } from '@/lib/auth';
import { execute, readWorkspace } from '@/lib/store';
import { queueEmail, deliverEmails } from '@/lib/email';
import { money } from '@/lib/format';
export const runtime='nodejs';
export async function POST(req:Request){try{checkOrigin(req);const viewer=await requireUser();const cmd=z.object({type:z.string().max(50),payload:z.record(z.unknown()),requestKey:z.string().optional()}).parse(await req.json());
 if(cmd.type==='sendInvoice'){if(viewer.role==='customer')throw new Error('You do not have access to this action.');const w=await readWorkspace(viewer),inv=w.invoices.find(i=>i.id===cmd.payload.id);if(!inv||inv.status==='Draft'||inv.status==='Cancelled')throw new Error('Confirm the invoice before sending it.');const customer=w.customers.find(c=>c.id===inv.customerId)!;await queueEmail(`invoice_${inv.id}`,customer.email,`${inv.number} · your Goodmonth invoice`,`Hi ${customer.name},\n\nYour invoice ${inv.number} is ready.\n${inv.product} × ${inv.quantity}\nTotal: ${money(inv.total)}\nOutstanding: ${money(inv.total-inv.paid)}\n\nView it at ${process.env.APP_URL}\n\nThanks for another good month.`);const delivery=await deliverEmails();return Response.json({workspace:w,message:delivery.configured?'Invoice queued for email delivery.':'Invoice saved in the development outbox. Configure Resend to deliver it.'});}
 return Response.json({workspace:await execute(viewer,cmd)});
 }catch(e){if(e instanceof z.ZodError)return Response.json({error:'Invalid request.'},{status:400});return apiError(e);}}
