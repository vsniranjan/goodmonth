export const money=(minor:number,compact=false)=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:compact?0:2,minimumFractionDigits:minor%100===0?0:2}).format(minor/100);
export const day=(value:string,opts:Intl.DateTimeFormatOptions={day:'numeric',month:'short',year:'numeric'})=>value?new Intl.DateTimeFormat('en-IN',{...opts,timeZone:'Asia/Kolkata'}).format(new Date(value)):'—';
export const initials=(s:string)=>s.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase();
export const id=(prefix:string)=>`${prefix}_${crypto.randomUUID()}`;
export function istDate(value:string){ const s=value.length===10?`${value}T00:00:00+05:30`:value; if(!Number.isFinite(new Date(s).getTime()))throw new Error('Choose a valid date.'); return new Date(s).toISOString(); }
