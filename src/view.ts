import { addMonths, bucket, calendarDaysBetween, counts, dayToday, folders, monthOf, planDay, planMonth, planNone, reviewQueue, type Card, type Entry, type Planning } from './model';
export interface ViewHost {
  entries():Entry[];
  diagnostics:{path:string;error:string}[];
  move(id:string,plan:Planning):Promise<unknown>;
  done(id:string,done:boolean):Promise<unknown>;
  create(title:string,kind:Card['kind'],plan:Planning,body?:string):Promise<Card>;
  edit(id:string,title:string,body:string,deadline?:string):Promise<unknown>;
  addCloud(id:string,url:string,name?:string):Promise<unknown>;
  open(id:string,attachmentId:string):Promise<string>;
  attachmentState(id:string,attachmentId:string):Promise<string>;
  openSource(path:string,line:number):Promise<void>;
  importFiles(files:File[],plan:Planning,targetId?:string):Promise<void>;
  chooseFiles(plan:Planning,targetId?:string):Promise<void>;
  refresh():Promise<void>;
}
type Screen='board'|'today'|'inbox'|'review'|'archive';
export class TicklerView {
  screen:Screen='board'; selectedMonth:string; folderKey=''; selected=new Set<string>(); error=''; confirmation='';
  constructor(public root:HTMLElement,public host:ViewHost,public today:()=>string=()=>dayToday()) {this.selectedMonth=monthOf(today());}
  private button(parent:HTMLElement,label:string,click:()=>void,cls=''):HTMLButtonElement {const b=document.createElement('button');b.type='button';b.textContent=label;b.className=cls;b.addEventListener('click',click);parent.append(b);return b;}
  private el(parent:HTMLElement,tag:string,cls='',text=''):HTMLElement {const e=document.createElement(tag);e.className=cls;e.textContent=text;parent.append(e);return e;}
  private numbered(value:number,singular:string,plural=singular+'s'){return value+' '+(value===1?singular:plural);}
  private countText(value:{tasks:number;files:number}){return this.numbered(value.tasks,'task')+' · '+this.numbered(value.files,'file');}
  private async action(run:()=>Promise<unknown>,message='Saved'){try{await run();this.error='';this.confirmation=message;this.render();}catch(error){this.error=String(error);this.render();}}
  private planMessage(plan:Planning){const label=plan.date||plan.month||'Inbox';if(plan.precision==='month'&&plan.month!<monthOf(this.today()))return `Moved to ${label}; this month is ready in Month review`;if(plan.precision==='day'&&plan.date!<this.today())return `Scheduled for ${label}; open item appears Today`;return `Moved to ${label}`;}
  private target(el:HTMLElement,plan:Planning,targetId?:string){el.addEventListener('dragover',event=>{if(plan.precision==='day'&&!plan.date)return;event.preventDefault();el.classList.add('tickler-over');});el.addEventListener('dragleave',()=>el.classList.remove('tickler-over'));el.addEventListener('drop',event=>{event.preventDefault();event.stopPropagation();el.classList.remove('tickler-over');if(plan.precision==='day'&&!plan.date){this.error='Invalid day';this.render();return;}const id=event.dataTransfer?.getData('application/x-tickler-card');if(id){void this.action(()=>this.host.move(id,plan),this.planMessage(plan));return;}const files=[...(event.dataTransfer?.files||[])];if(files.length)void this.action(()=>this.host.importFiles(files,plan,targetId),`Saved locally. ${this.planMessage(plan)}`);else {this.error='No usable file. Save the email as an .eml file first.';this.render();}});}
  private nav(parent:HTMLElement){const nav=this.el(parent,'nav','tickler-nav');for(const [key,label] of [['board','43 folders'],['today','Today'],['inbox','Inbox'],['review',`Month review (${[...reviewQueue(this.host.entries(),this.today()).values()].flat().length})`],['archive','Archive']] as [Screen,string][])this.button(nav,label,()=>{this.screen=key;if(key==='board')this.folderKey='';if(key==='review'){const first=reviewQueue(this.host.entries(),this.today()).keys().next().value;if(first)this.selectedMonth=first;}this.render();},this.screen===key?'is-active':'');}
  render(){this.root.replaceChildren();this.root.className='tickler-root';const head=this.el(this.root,'header','tickler-header');this.el(head,'h2','','Tickler');this.nav(head);if(this.error)this.el(this.root,'div','tickler-error',this.error);if(this.confirmation)this.el(this.root,'div','tickler-notice',this.confirmation);if(this.host.diagnostics.length){const details=this.el(this.root,'details','tickler-diagnostics') as HTMLDetailsElement;this.el(details,'summary','',`${this.host.diagnostics.length} card errors`);for(const d of this.host.diagnostics)this.el(details,'p','',`${d.path}: ${d.error}`);}this.board();if(this.screen==='board'&&this.folderKey)this.folderPanel();else if(this.screen==='review')this.review();else if(this.screen!=='board')this.listScreen();}
  private board(){
    const today=this.today();
    const firstMonth=addMonths(monthOf(today),1);
    const foldersOnBoard=folders(this.host.entries(),today,firstMonth,today);
    const board=this.el(this.root,'section','tickler-board');
    const shortDate=(value:string)=>new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short'}).format(new Date(Number(value.slice(0,4)),Number(value.slice(5,7))-1,Number(value.slice(8,10))));
    this.el(board,'h3','tickler-board-label','Next 31 days · '+shortDate(today)+' – '+shortDate(foldersOnBoard.days[30].date));
    const days=this.el(board,'div','tickler-calendar');
    for(const weekday of ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']){
      this.el(days,'span','tickler-weekday',weekday);
    }
    const [year,month,dayOfMonth]=today.split('-').map(Number);
    const leading=new Date(year,month-1,dayOfMonth).getDay();
    for(let i=0;i<leading;i++){
      const spacer=this.el(days,'span','tickler-calendar-spacer');
      spacer.setAttribute('aria-hidden','true');
    }
    for(const day of foldersOnBoard.days){
      const [y,m,d]=day.date.split('-').map(Number);
      const date=new Date(y,m-1,d);
      const weekday=new Intl.DateTimeFormat('en-GB',{weekday:'long'}).format(date);
      const total=day.counts.tasks+day.counts.files;
      const selected=this.folderKey==='day:'+day.date&&this.screen==='board';
      const activeDay=this.screen==='board'&&this.folderKey.startsWith('day:')?selected:this.screen==='board'&&this.folderKey.startsWith('month:')?false:day.date===today;
      const tile=this.el(days,'button','tickler-day'+(day.date===today?' is-today':'')+(selected?' is-selected':'')+(activeDay?' is-active':'')) as HTMLButtonElement;
      tile.type='button';
      tile.dataset.date=day.date;
      tile.dataset.tasks=String(day.counts.tasks);
      tile.dataset.files=String(day.counts.files);
      tile.dataset.count=String(total);
      tile.setAttribute('aria-label',weekday+' '+day.date+', '+this.countText(day.counts).replace(' · ',', '));
      this.el(tile,'span','tickler-day-number',String(d));
      const dots=this.el(tile,'span','tickler-dots');
      dots.setAttribute('aria-hidden','true');
      for(let i=0;i<Math.min(total,5);i++)this.el(dots,'span','tickler-dot');
      if(total>5)this.el(dots,'span','tickler-dot-overflow','+'+(total-5));
      tile.addEventListener('click',()=>this.openFolder('day:'+day.date));
      this.target(tile,planDay(day.date));
    }
    this.el(board,'h3','tickler-board-label tickler-month-heading','Next 12 months');
    const months=this.el(board,'div','tickler-month-grid');
    for(const monthFolder of foldersOnBoard.months){
      const [y,m]=monthFolder.month.split('-').map(Number);
      const date=new Date(y,m-1,1);
      const label=new Intl.DateTimeFormat('en-GB',{month:'long',year:'numeric'}).format(date);
      const short=new Intl.DateTimeFormat('en-GB',{month:'short'}).format(date).toUpperCase();
      const total=monthFolder.counts.tasks+monthFolder.counts.files;
      const selected=this.folderKey==='month:'+monthFolder.month&&this.screen==='board';
      const tile=this.el(months,'button','tickler-month'+(selected?' is-selected is-active':'')) as HTMLButtonElement;
      tile.type='button';
      tile.dataset.month=monthFolder.month;
      tile.dataset.tasks=String(monthFolder.counts.tasks);
      tile.dataset.files=String(monthFolder.counts.files);
      tile.dataset.count=String(total);
      tile.setAttribute('aria-label',label+', '+this.countText(monthFolder.counts).replace(' · ',', '));
      this.el(tile,'span','tickler-month-name',short);
      this.el(tile,'small','tickler-month-year',String(y));
      if(total)this.el(tile,'span','tickler-month-total',String(total));
      tile.addEventListener('click',()=>this.openFolder('month:'+monthFolder.month));
      this.target(tile,planMonth(monthFolder.month));
    }
  }
  private openFolder(key:string){
    this.folderKey=key;
    this.screen='board';
    this.render();
    this.root.querySelector('.tickler-folder-detail')?.scrollIntoView({block:'nearest'});
  }
  private choose(plan:Planning,targetId?:string){
    void this.host.chooseFiles(plan,targetId).catch(error=>this.fail(String(error)));
  }
  private folderPanel(){
    const today=this.today();
    const entries=this.host.entries().filter(e=>bucket(e,today)===this.folderKey&&this.open(e));
    const plan=this.folderKey.startsWith('day:')?planDay(this.folderKey.slice(4)):planMonth(this.folderKey.slice(6));
    const label=plan.precision==='day'?new Intl.DateTimeFormat('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date(Number(plan.date!.slice(0,4)),Number(plan.date!.slice(5,7))-1,Number(plan.date!.slice(8,10)))):new Intl.DateTimeFormat('en-GB',{month:'long',year:'numeric'}).format(new Date(Number(plan.month!.slice(0,4)),Number(plan.month!.slice(5))-1,1));
    const panel=this.el(this.root,'section','tickler-folder-detail');
    this.el(panel,'span','tickler-detail-label',plan.precision==='day'?'DAY FOLDER':'MONTH FOLDER');
    this.el(panel,'h3','',label);
    const stats=this.el(panel,'div','tickler-folder-stats');
    const summary=counts(entries);
    this.el(stats,'span','',this.numbered(summary.tasks,'task'));
    this.el(stats,'span','',this.numbered(summary.files,'file'));
    this.el(stats,'span','',this.numbered(entries.filter(e=>e.type==='card').length,'card'));
    const bar=this.el(panel,'div','tickler-toolbar');
    this.button(bar,'Add task',()=>this.newCard('action',plan));
    this.button(bar,'Upload file',()=>this.choose(plan));
    this.target(panel,plan);
    this.items(entries,panel);
  }
  private listScreen(){
    const today=this.today();
    const entries=this.host.entries();
    let filtered:Entry[]=[];
    let heading='';
    let plan=planNone();
    if(this.screen==='today'){
      heading='Today · '+today;
      filtered=entries.filter(e=>bucket(e,today)==='day:'+today&&this.open(e));
      plan=planDay(today);
    }else if(this.screen==='inbox'){
      heading='Inbox';
      filtered=entries.filter(e=>bucket(e,today)==='inbox'&&this.open(e));
    }else{
      heading='Archive';
      filtered=entries.filter(e=>e.type==='card'&&!this.open(e));
    }
    const panel=this.el(this.root,'section','tickler-folder-detail');
    this.el(panel,'h3','',heading);
    this.el(panel,'p','',this.numbered(filtered.filter(e=>e.type==='card').length,'card')+' · '+this.countText(counts(filtered)));
    if(this.screen!=='archive'){
      const bar=this.el(panel,'div','tickler-toolbar');
      this.button(bar,'Add task',()=>this.newCard('action',plan));
      this.button(bar,'Upload file',()=>this.choose(plan));
      this.target(panel,plan);
    }
    this.items(filtered,panel);
  }
  private open(e:Entry){return e.type==='card'?e.card.status==='open':e.task.status==='open';}
  private items(entries:Entry[],parent:HTMLElement=this.root){if(!entries.length)this.el(parent,'p','tickler-empty','No items.');const list=this.el(parent,'div','tickler-items');for(const e of entries){const id=e.type==='card'?e.card.tickler_id:e.task.key;const row=this.el(list,'article','tickler-item');row.dataset.id=id;if(e.type==='card'){row.draggable=true;row.addEventListener('dragstart',event=>event.dataTransfer?.setData('application/x-tickler-card',id));this.target(row,e.card.planning,id);const check=document.createElement('input');check.type='checkbox';check.checked=this.selected.has(id);check.setAttribute('aria-label',`Select ${e.card.title}`);check.addEventListener('change',()=>{if(check.checked)this.selected.add(id);else this.selected.delete(id);});row.append(check);this.el(row,'strong','',e.card.title);this.el(row,'span','',` ${e.card.kind} · ${e.card.planning.date||e.card.planning.month||'Inbox'}`);if(e.card.planning.precision==='day'&&e.card.planning.date!<this.today())this.el(row,'span','tickler-warning',` Originally scheduled for ${e.card.original_planning.date||e.card.planning.date} · ${calendarDaysBetween(e.card.planning.date!,this.today())} calendar days carried forward`);if(e.card.deadline)this.el(row,'span','tickler-warning',` Deadline ${e.card.deadline}${e.card.deadline<this.today()?' overdue':''}`);if(e.card.body)this.el(row,'p','',e.card.body);if(e.card.mail)this.el(row,'pre','tickler-mail',`${e.card.mail.from||''}\n${e.card.mail.date||''}\n${e.card.mail.text||''}`);for(const a of e.card.attachments){this.button(row,`Open ${a.original_name}`,()=>void this.action(async()=>{const result=await this.host.open(id,a.id);if(result==='missing')throw new Error('Attachment not available yet');},'Attachment opened'));const state=this.el(row,'span','tickler-attachment-state','Checking…');void this.host.attachmentState(id,a.id).then(value=>{state.textContent=value==='missing'?'Missing / not available yet':value==='cloud'?'Cloud link available':'Available locally';}).catch(()=>{state.textContent='Missing / not available yet';});}this.button(row,e.card.status==='done'?'Reopen':'Complete',()=>void this.action(()=>this.host.done(id,e.card.status!=='done')));this.button(row,'Move to…',()=>this.moveDialog(id));this.button(row,'Edit',()=>this.editDialog(e.card));this.button(row,'Choose attachment',()=>this.choose(e.card.planning,id));this.button(row,'Cloud link',()=>{const url=window.prompt('https:// link');if(url)void this.action(()=>this.host.addCloud(id,url));});}else {this.el(row,'strong','',e.task.text);this.el(row,'span','',` ${e.task.path}:${e.task.line+1}`);if(e.task.planning.precision==='day'&&e.task.planning.date!<this.today())this.el(row,'span','tickler-warning',` Originally scheduled for ${e.task.planning.date} · ${calendarDaysBetween(e.task.planning.date!,this.today())} calendar days carried forward`);if(e.task.deadline)this.el(row,'span','tickler-warning',` Deadline ${e.task.deadline}${e.task.deadline<this.today()?' overdue':''}`);if(e.task.warning)this.el(row,'span','tickler-warning',e.task.warning);this.button(row,'Open source to complete',()=>void this.action(()=>this.host.openSource(e.task.path,e.task.line)));}}}
  private review(){
    const queue=reviewQueue(this.host.entries(),this.today());
    const panel=this.el(this.root,'section','tickler-folder-detail');
    this.el(panel,'h3','','Month review');
    if(!queue.size)this.el(panel,'p','tickler-empty','No monthly items to schedule.');
    for(const [month,entries] of queue){
      this.el(panel,'h4','',month+': '+this.numbered(entries.length,'item')+' to schedule');
      this.items(entries,panel);
    }
    const bar=this.el(panel,'div','tickler-toolbar');
    const input=document.createElement('input');
    input.type='date';
    input.setAttribute('aria-label','Day for selected items');
    bar.append(input);
    this.button(bar,'Schedule selected items',()=>{
      if(!input.value)return this.fail('Choose a valid day');
      const ids=[...this.selected];
      void this.action(async()=>{
        for(const id of ids)await this.host.move(id,planDay(input.value));
        this.selected.clear();
      },'Scheduled for '+input.value);
    });
    this.el(panel,'p','','You can also drag an item to one of the 31 visible day folders.');
  }
  private fail(message:string){this.error=message;this.render();}
  private moveDialog(id:string){const value=window.prompt('New destination: YYYY-MM-DD, YYYY-MM or Inbox');if(value===null)return;let plan:Planning;try{plan=value.toLowerCase()==='inbox'?planNone():/^\d{4}-\d{2}$/.test(value)?planMonth(value):planDay(value);}catch(error){return this.fail(String(error));}void this.action(()=>this.host.move(id,plan),this.planMessage(plan));}
  private newCard(kind:Card['kind'],plan:Planning){const title=window.prompt('Title');if(!title)return;void this.action(()=>this.host.create(title,kind,plan),`Card added to ${plan.date||plan.month||'Inbox'}`);}
  private editDialog(card:Card){const title=window.prompt('Title',card.title);if(title===null)return;const body=window.prompt('Description',card.body||'');if(body===null)return;const deadline=window.prompt('Deadline (YYYY-MM-DD, blank for none)',card.deadline||'');if(deadline===null)return;void this.action(()=>this.host.edit(card.tickler_id,title,body,deadline));}
}
