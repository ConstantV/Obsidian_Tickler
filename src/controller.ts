import { CardRepository, type Loaded } from './repository';
import { TaskIndex } from './tasks';
import { cloudAttachment, hostRoot, importFile, resolve, openAttachment, type Opener, type Settings } from './storage';
import { enrichMail } from './mail';
import { makeCard, type Card, type Entry, type Planning } from './model';
import fs from 'node:fs/promises';
export class TicklerController {
  cards:Loaded[]=[]; diagnostics:{path:string;error:string}[]=[];
  constructor(public repo:CardRepository,public tasks:TaskIndex,public settings:Settings,public opener:Opener,public host:string){}
  async reload(){const result=await this.repo.list();this.cards=result.items;this.diagnostics=result.diagnostics;}
  entries():Entry[] {return [...this.cards.map(c=>({type:'card' as const,card:c.card})),...this.tasks.all().filter(task=>task.planning.precision==='day').map(task=>({type:'task' as const,task}))];}
  async create(title:string,kind:Card['kind'],plan:Planning,body=''):Promise<Card>{const card={...makeCard(title,kind,plan),body};this.cards.push(await this.repo.create(card));return card;}
  async update(id:string,change:(card:Card)=>Card):Promise<Card>{const index=this.cards.findIndex(c=>c.card.tickler_id===id);if(index<0)throw new Error('Card not found');const changed=change(structuredClone(this.cards[index].card));this.cards[index]=await this.repo.save(this.cards[index],changed);return changed;}
  async move(id:string,plan:Planning){return this.update(id,c=>({...c,planning:plan}));}
  async done(id:string,done:boolean){return this.update(id,c=>({...c,status:done?'done':'open'}));}
  async attach(id:string,sources:string[]){const root=hostRoot(this.settings,this.host);if(!root)throw new Error('Set the document folder for this device first');for(const source of sources){const attachment=await importFile(root,source);try {await this.update(id,c=>({...c,attachments:[...c.attachments,attachment]}));}catch(error){this.diagnostics.push({path:attachment.path||'',error:'Recoverable orphaned file after card save failure'});throw error;}}}
  async dropFiles(sources:string[],plan:Planning,targetId?:string){
    if(!sources.length)throw new Error('No usable files; save email as an .eml file first');
    if(targetId){await this.attach(targetId,sources);return;}
    const root=hostRoot(this.settings,this.host);if(!root)throw new Error('Set the document folder for this device first');
    const title=sources.length===1?sources[0].split(/[\\/]/).pop()!:`${sources.length} files`;
    const isMail=sources.length===1&&title.toLowerCase().endsWith('.eml');
    const attachments=[];
    try {for(const source of sources)attachments.push(await importFile(root,source));}
    catch(error){for(const a of attachments)this.diagnostics.push({path:a.path||'',error:'Recoverable orphaned file after import failure'});throw error;}
    let card={...makeCard(title,isMail?'mail':'document',plan),attachments};
    if(isMail){const copied=await resolve(root,attachments[0].path!);if(!copied)throw new Error('Copied email is missing');card=await enrichMail(card,await fs.readFile(copied));}
    try{this.cards.push(await this.repo.create(card));return card;}
    catch(error){for(const a of attachments)this.diagnostics.push({path:a.path||'',error:'Recoverable orphaned file after card save failure'});throw error;}
  }
  async addCloud(id:string,url:string,name?:string){const a=cloudAttachment(url,name);return this.update(id,c=>({...c,attachments:[...c.attachments,a]}));}
  async open(id:string,attachmentId:string){const card=this.cards.find(c=>c.card.tickler_id===id)?.card;const a=card?.attachments.find(a=>a.id===attachmentId);if(!a)throw new Error('Attachment not found');return openAttachment(hostRoot(this.settings,this.host),a,this.opener);}
}
