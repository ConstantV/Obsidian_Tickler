import YAML from 'yaml';
import { makeCard, planDay, validateCard, type Card } from './model';
export interface NoteStore { list(folder:string):Promise<string[]>; read(path:string):Promise<string>; create(path:string,content:string):Promise<void>; write(path:string,content:string):Promise<void>; ensure(folder:string):Promise<void>; }
export type Loaded = {card:Card; path:string; version:string};
export class ConflictError extends Error { constructor(){super('Card changed; reload before saving.');} }
export class CardRepository {
  constructor(private store:NoteStore, public folder='Tickler/Items') {}
  private decode(source:string): Card {
    const match=source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    if(!match) throw new Error('YAML frontmatter is missing');
    const value=YAML.parse(match[1]);
    if(value?.tickler_schema===undefined && value?.tickler_date) { const c=makeCard(value.title||'Card','document',planDay(value.tickler_date)); return validateCard({...value,...c,tickler_id:value.tickler_id||c.tickler_id,attachments:value.attachments||[]}); }
    return validateCard(value);
  }
  private encode(card:Card):string { return `---\n${YAML.stringify(card)}---\n`; }
  async list():Promise<{items:Loaded[];diagnostics:{path:string;error:string}[]}> {
    const items:Loaded[]=[]; const diagnostics:{path:string;error:string}[]=[];
    for(const path of await this.store.list(this.folder)) try { const version=await this.store.read(path); items.push({card:this.decode(version),path,version}); } catch(e) { diagnostics.push({path,error:String(e)}); }
    return {items,diagnostics};
  }
  async create(card:Card):Promise<Loaded> {validateCard(card); await this.store.ensure(this.folder); const path=`${this.folder}/${card.tickler_id}.md`; const version=this.encode(card); await this.store.create(path,version); return {card,path,version};}
  async save(loaded:Loaded, card:Card):Promise<Loaded> { validateCard(card); const current=await this.store.read(loaded.path); if(current!==loaded.version) throw new ConflictError(); const version=this.encode(card); await this.store.write(loaded.path,version); return {card,path:loaded.path,version}; }
}
