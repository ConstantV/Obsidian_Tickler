import { planDay, planNone, validDay, type Task } from './model';
export type TaskOptions = { folders?: string[]; tag?: string; excluded?: string };
export function parseTasks(path: string, source: string, options: TaskOptions = {}): Task[] {
  if(options.excluded && (path===options.excluded || path.startsWith(options.excluded+'/'))) return [];
  if(options.folders?.length && !options.folders.some(f=>path===f||path.startsWith(f+'/'))) return [];
  const result: Task[]=[]; let fence: string|null=null;
  source.split(/\r?\n/).forEach((line,index)=>{
    const marker=line.match(/^\s*(`{3,}|~{3,})/);
    if(marker) { if(!fence) fence=marker[1][0]; else if(marker[1][0]===fence) fence=null; return; }
    if(fence) return;
    const match=line.match(/^\s*[-*+]\s+\[([^\]])\]\s+(.+)$/);
    if(!match) return;
    if(options.tag && !match[2].includes(options.tag)) return;
    const scheduled=match[2].match(/⏳\s*(\d{4}-\d{2}-\d{2})/);
    const due=match[2].match(/📅\s*(\d{4}-\d{2}-\d{2})/);
    const raw=scheduled?.[1] || due?.[1];
    const warning=raw && !validDay(raw)?`Invalid date: ${raw}`:!scheduled&&due?'Deadline only: no preparation time':(/[⏳📅]/.test(match[2])&&!raw?'Unknown date format':undefined);
    result.push({key:`${path}:${index}:${match[2]}`,path,line:index,text:match[2],status:match[1]===' '?'open':/[xX]/.test(match[1])?'done':'unknown',planning:raw&&validDay(raw)?planDay(raw):planNone(),deadline:due&&validDay(due[1])?due[1]:undefined,warning});
  });
  return result;
}
export class TaskIndex {
  private byPath=new Map<string,Task[]>();
  constructor(private options: TaskOptions={}) {}
  update(path:string, source:string) { this.byPath.set(path,parseTasks(path,source,this.options)); }
  remove(path:string) { this.byPath.delete(path); }
  rename(oldPath:string,newPath:string) { const old=this.byPath.get(oldPath); if(old) {this.byPath.delete(oldPath);this.byPath.set(newPath,old.map(t=>({...t,path:newPath,key:t.key.replace(oldPath+':',newPath+':')})));} }
  all():Task[] { return [...this.byPath.values()].flat(); }
  clear(){this.byPath.clear();}
}
