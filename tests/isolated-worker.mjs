import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
/** Disposable local Worker with no .dev.vars, model calls or shared database. */
export async function isolatedWorker(){
 const root=path.resolve('.'),scratch=await mkdtemp(path.join(tmpdir(),'decision-echo-browser-'));
 let child;
 const close=async()=>{if(child?.pid){try{process.kill(-child.pid,'SIGTERM');}catch{}}await rm(scratch,{recursive:true,force:true});};
 try{
  const reserve=createServer();await new Promise((resolve,reject)=>{reserve.once('error',reject);reserve.listen(0,'127.0.0.1',resolve);});const port=reserve.address().port;await new Promise(resolve=>reserve.close(resolve));
  const base=`http://127.0.0.1:${port}`;
  const config=JSON.parse(await readFile(path.join(root,'wrangler.jsonc'),'utf8'));delete config.$schema;
  config.name='decision-echo-browser-test';config.main=path.join(root,'src/server/index.ts');config.assets.directory=path.join(root,'dist');
  config.vars={MODE:'sandbox',OPENAI_MODEL:'gpt-6.1-sol',ELEVENLABS_VOICE_MODEL:'v4-turbo',APP_ORIGIN:'http://127.0.0.1:5173'};
  const file=path.join(scratch,'wrangler.json');await writeFile(file,JSON.stringify(config));
  child=spawn(path.join(root,'node_modules/.bin/wrangler'),['dev','--local','--config',file,'--ip','127.0.0.1','--port',String(port),'--persist-to',path.join(scratch,'state')],{cwd:scratch,detached:true,stdio:['ignore','ignore','ignore'],env:{...process.env,CI:'true',WRANGLER_SEND_METRICS:'false'}});
  for(let i=0;i<80;i++){if(child.exitCode!==null)throw Error('Isolated test Worker exited');try{const response=await fetch(base+'/api/config',{signal:AbortSignal.timeout(300)});if(response.ok){const cap=await response.json();if(cap.openAI||cap.elevenLabs||cap.notion)throw Error('Test Worker must not have provider credentials');return {base,close};}}catch(error){if(error.message==='Test Worker must not have provider credentials')throw error;}await new Promise(resolve=>setTimeout(resolve,250));}
  throw Error('Isolated test Worker did not become ready');
 }catch(error){await close();throw error;}
}
