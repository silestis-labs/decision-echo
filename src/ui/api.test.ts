import {afterEach,expect,it,vi} from 'vitest';
import {api,sessionReferences,forgetSessions} from './api';
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();});
it('preserves valid recoverable sessions beside malformed catalog entries',()=>{
 const valid={id:'a',token:'capability',createdAt:'2026-10-04',confirmed:true,mode:'sandbox'};
 vi.stubGlobal('sessionStorage',{getItem:()=>JSON.stringify([null,42,{},valid,{...valid,confirmed:'yes'}])});
 expect(sessionReferences()).toEqual([valid]);
});
it('bounds a stalled request and never retries a mutation',async()=>{
 vi.useFakeTimers();const fetcher=vi.fn((_url,options)=>new Promise((_resolve,reject)=>options.signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')))));
 vi.stubGlobal('fetch',fetcher);const request=api('/sessions',{mode:'sandbox'});const rejected=expect(request).rejects.toMatchObject({status:408});
 await vi.advanceTimersByTimeAsync(35_000);await rejected;expect(fetcher).toHaveBeenCalledTimes(1);
});
it('retains explicit caller cancellation',async()=>{
 const caller=new AbortController();vi.stubGlobal('fetch',(_url:unknown,options:RequestInit)=>new Promise((_resolve,reject)=>options.signal!.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')))));
 const request=api('/config',undefined,caller.signal);caller.abort();await expect(request).rejects.toMatchObject({name:'AbortError'});
});
it('reports malformed successful responses without printing content',async()=>{
 vi.stubGlobal('fetch',async()=>new Response('private unparseable upstream text',{status:200}));
 await expect(api('/config')).rejects.toMatchObject({status:502,message:'The server returned an unreadable response. Reload the session before retrying a change.'});
});
it('handles unavailable browser storage without breaking cleanup',()=>{vi.stubGlobal('sessionStorage',{getItem(){throw Error('disabled');},removeItem(){throw Error('disabled');}});expect(sessionReferences()).toEqual([]);expect(()=>forgetSessions()).not.toThrow();});
