export type Precision = 'none' | 'month' | 'day';
export type Planning = { precision: Precision; month?: string | null; date?: string | null };
export type Attachment = { id: string; storage: 'documenten'; path?: string; original_name: string; cloud_url?: string };
export type Card = { tickler_schema: 1; tickler_id: string; title: string; body?: string; kind: 'action' | 'document' | 'mail'; planning: Planning; original_planning: Planning; deadline?: string | null; status: 'open' | 'done'; attachments: Attachment[]; mail?: { from?: string; date?: string; text?: string }; [key: string]: unknown };
export type Task = { key: string; path: string; line: number; text: string; status: 'open' | 'done' | 'unknown'; planning: Planning; deadline?: string; warning?: string };
export type Entry = { type: 'card'; card: Card } | { type: 'task'; task: Task };
export type Counts = { tasks: number; files: number };
export const emptyCounts = (): Counts => ({ tasks: 0, files: 0 });
export function validDay(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y,m,d] = value.split('-').map(Number);
  const date = new Date(y,m-1,d);
  return date.getFullYear()===y && date.getMonth()===m-1 && date.getDate()===d;
}
export function validMonth(value: string): boolean { return /^\d{4}-(0[1-9]|1[0-2])$/.test(value); }
export function dayToday(now = new Date()): string { return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`; }
export function monthOf(day: string): string { return day.slice(0,7); }
export function addMonths(month: string, offset: number): string { const [y,m]=month.split('-').map(Number); const d=new Date(y,m-1+offset,1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; }
export function addDays(day: string, offset: number): string { if(!validDay(day))throw new Error('Invalid calendar day');const [y,m,d]=day.split('-').map(Number);const result=new Date(Date.UTC(y,m-1,d+offset));return `${result.getUTCFullYear()}-${String(result.getUTCMonth()+1).padStart(2,'0')}-${String(result.getUTCDate()).padStart(2,'0')}`; }
export function planDay(date: string): Planning { if (!validDay(date)) throw new Error('Invalid day'); return {precision:'day',date}; }
export function planMonth(month: string): Planning { if (!validMonth(month)) throw new Error('Invalid month'); return {precision:'month',month}; }
export function planNone(): Planning { return {precision:'none'}; }
export function validatePlanning(p: Planning): void {
  if (p.precision==='day' && (!p.date || !validDay(p.date) || !!p.month)) throw new Error('Invalid day plan');
  if (p.precision==='month' && (!p.month || !validMonth(p.month) || !!p.date)) throw new Error('Invalid month plan');
  if (p.precision==='none' && (p.date || p.month)) throw new Error('Inbox cannot have a date');
  if (!['day','month','none'].includes(p.precision)) throw new Error('Unknown planning precision');
}
export function validateCard(value: unknown): Card {
  if (!value || typeof value!=='object') throw new Error('Not a card');
  const c=value as Card;
  if (c.tickler_schema!==1 || !c.tickler_id || typeof c.title!=='string' || !['action','document','mail'].includes(c.kind) || !['open','done'].includes(c.status) || !Array.isArray(c.attachments)) throw new Error('Invalid card schema');
  validatePlanning(c.planning); validatePlanning(c.original_planning);
  if (c.deadline && !validDay(c.deadline)) throw new Error('Invalid deadline');
  for (const a of c.attachments) if (!a.id || a.storage!=='documenten' || !a.original_name || (a.cloud_url && !validCloudUrl(a.cloud_url))) throw new Error('Invalid attachment');
  return c;
}
export function validCloudUrl(url: string): boolean { try { const u=new URL(url); return ['http:','https:'].includes(u.protocol); } catch { return false; } }
export function effectiveDay(p: Planning, today: string): string | null { return p.precision==='day' ? (p.date! < today ? today : p.date!) : null; }
export function scheduleOf(e: Entry): Planning { return e.type==='card'?e.card.planning:e.task.planning; }
export function isOpen(e: Entry): boolean { return e.type==='card'?e.card.status==='open':e.task.status==='open'; }
export function bucket(e: Entry, today: string): string { const p=scheduleOf(e); if(p.precision==='none') return 'inbox'; if(p.precision==='month') return `month:${p.month}`; return `day:${effectiveDay(p,today)}`; }
export function counts(entries: Entry[]): Counts { const out=emptyCounts(); for(const e of entries) { if(!isOpen(e)) continue; if(e.type==='task' || e.card.kind==='action') out.tasks++; if(e.type==='card') out.files+=e.card.attachments.length; } return out; }
export function folders(entries: Entry[], startDay: string, firstMonth: string, today: string) {
  const days=Array.from({length:31},(_,i)=>{ const day=addDays(startDay,i);const matches=entries.filter(e=>isOpen(e)&&bucket(e,today)===`day:${day}`);return {date:day,valid:true,entries:matches,counts:counts(matches)}; });
  const months=Array.from({length:12},(_,i)=>{ const month=addMonths(firstMonth,i); const pool=entries.filter(e=>isOpen(e)&&bucket(e,today)===`month:${month}`); return {month,entries:pool,counts:counts(pool)}; });
  return {days,months};
}
export function reviewQueue(entries: Entry[], today: string): Map<string,Entry[]> { const out=new Map<string,Entry[]>(); for(const e of entries) { const p=scheduleOf(e); if(isOpen(e)&&p.precision==='month'&&p.month!<=monthOf(today)) out.set(p.month!,[...(out.get(p.month!)||[]),e]); } return out; }
export function makeCard(title: string, kind: Card['kind'], planning: Planning): Card { validatePlanning(planning); return {tickler_schema:1,tickler_id:crypto.randomUUID(),title,kind,planning,original_planning:{...planning},status:'open',attachments:[]}; }

export function calendarDaysBetween(from:string,to:string):number {if(!validDay(from)||!validDay(to))throw new Error('Invalid calendar day');const utc=(s:string)=>{const [y,m,d]=s.split('-').map(Number);return Date.UTC(y,m-1,d);};return Math.round((utc(to)-utc(from))/86400000);}
