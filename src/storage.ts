import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { randomUUID, createHash } from 'node:crypto';
import { validCloudUrl, type Attachment } from './model';
export type Settings = { itemFolder:string; taskFolders:string[]; taskTag:string; hosts:Record<string,{documenten?:string}> };
export function hostId():string { return createHash('sha256').update(`${os.hostname()}|${os.platform()}|${os.userInfo().username}`).digest('hex').slice(0,16); }
export function hostRoot(settings:Settings,host=hostId()):string|undefined { return settings.hosts[host]?.documenten; }
export function safeRelative(relative:string):boolean { return !path.isAbsolute(relative) && relative.split(/[\\/]/).every(part=>part!=='.'&&part!=='..'&&part!=='') && !relative.includes('\0'); }
async function safeRoot(root:string):Promise<string> { const st=await fs.lstat(root); if(st.isSymbolicLink()||!st.isDirectory()) throw new Error('Storage root is not a safe directory'); return fs.realpath(root); }
export async function resolve(root:string|undefined, relative:string):Promise<string|null> {
  if(!root || !safeRelative(relative)) return null;
  const base=await safeRoot(root); const full=path.resolve(base,relative);
  if(!full.startsWith(base+path.sep)) return null;
  try { const real=await fs.realpath(full); return real.startsWith(base+path.sep)?real:null; } catch { return null; }
}
export async function importFile(root:string, source:string):Promise<Attachment> {
  const base=await safeRoot(root); const id=randomUUID(); const name=path.basename(source).replace(/[^\p{L}\p{N}._ -]/gu,'_').slice(0,180)||'file';
  const relative=`objects/${id}/${name}`; const directory=path.join(base,'objects',id); const target=path.join(directory,name); const temporary=path.join(directory,`.${name}.partial`);
  await fs.mkdir(path.join(base,'objects'),{recursive:true}); const objectsStat=await fs.lstat(path.join(base,'objects')); if(objectsStat.isSymbolicLink()||!objectsStat.isDirectory())throw new Error('Unsafe objects directory'); await fs.mkdir(directory,{recursive:false});
  try { const stat=await fs.lstat(source); if(!stat.isFile()||stat.isSymbolicLink()) throw new Error('Source is not a regular file'); await fs.copyFile(source,temporary,fs.constants.COPYFILE_EXCL); await fs.rename(temporary,target); return {id,storage:'documenten',path:relative,original_name:name}; }
  catch(error) { await fs.rm(temporary,{force:true}); await fs.rmdir(directory).catch(()=>{}); throw error; }
}
export async function locateAttachment(root:string|undefined, attachment:Attachment):Promise<{type:'local'|'cloud'|'missing';target?:string}> {
  if(root && attachment.path) { const local=await resolve(root,attachment.path).catch(()=>null); if(local) return {type:'local',target:local}; }
  if(attachment.cloud_url && validCloudUrl(attachment.cloud_url)) return {type:'cloud',target:attachment.cloud_url};
  return {type:'missing'};
}
export function cloudAttachment(url:string,name='Cloud file'):Attachment { if(!validCloudUrl(url)) throw new Error('Only HTTP(S) cloud links are supported'); return {id:randomUUID(),storage:'documenten',original_name:name,cloud_url:url}; }
export interface Opener { local(path:string):Promise<void>; cloud(url:string):Promise<void>; }
export async function openAttachment(root:string|undefined,attachment:Attachment,opener:Opener):Promise<'local'|'cloud'|'missing'> { const result=await locateAttachment(root,attachment); if(result.type==='local') await opener.local(result.target!); if(result.type==='cloud') await opener.cloud(result.target!); return result.type; }
