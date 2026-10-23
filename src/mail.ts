import { simpleParser } from 'mailparser';
import type { Card } from './model';
export async function enrichMail(card:Card,source:Buffer):Promise<Card> {
  try { const parsed=await simpleParser(source,{skipHtmlToText:true,skipTextToHtml:true}); return {...card,title:parsed.subject||card.title,mail:{from:parsed.from?.text,date:parsed.date?.toISOString(),text:parsed.text||''}}; }
  catch { return card; }
}
