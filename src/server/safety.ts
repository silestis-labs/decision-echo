import { z } from 'zod';
export class ApiError extends Error { constructor(public status:number, message:string,public retryAfter?:string){super(message)} }
/** Public installations must explicitly gate creation of provider-backed sessions. */
export function requiresDemoAccess(origin:string,code?:string,requestOrigin=origin){
 if(code)return true;
 const local=(value:string)=>{try{const url=new URL(value);return ['http:','https:'].includes(url.protocol)&&['127.0.0.1','localhost','[::1]'].includes(url.hostname);}catch{return false;}};
 return !local(origin)||!local(requestOrigin);
}
export async function digest(token:string){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)))].map(x=>x.toString(16).padStart(2,'0')).join('')}
export async function readBody(request:Request,max=1_500_000):Promise<unknown>{
 if(!request.headers.get('content-type')?.startsWith('application/json'))throw new ApiError(415,'JSON required');
 const declared=Number(request.headers.get('content-length')||0); if(declared>max)throw new ApiError(413,'Body too large');
 if(!request.body)throw new ApiError(400,'Body required');
 const reader=request.body.getReader();let size=0;const chunks:Uint8Array[]=[];
 while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>max){await reader.cancel();throw new ApiError(413,'Body too large')}chunks.push(value)}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length}
 try{return JSON.parse(new TextDecoder().decode(bytes))}catch{throw new ApiError(400,'Invalid JSON')}
}
export const imageSchema=z.string().max(550_000).regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/);
export async function providerFetch(url:string,init:RequestInit,fetcher:typeof fetch=fetch){
 let response:Response;try{response=await fetcher(url,{...init,signal:AbortSignal.timeout(25_000)})}catch{throw new ApiError(502,'Provider delivery uncertain; no automatic retry')}
 if(!response.ok){
  // Expose bounded machine identifiers only, never provider messages or echoed input.
  let detail='';try{const data=await response.json() as {error?:{code?:unknown;param?:unknown}};const identifiers=[data.error?.code,data.error?.param].filter((v):v is string=>typeof v==='string'&&/^[a-zA-Z0-9_.\[\]-]{1,80}$/.test(v));if(identifiers.length)detail=': '+identifiers.join(', ');}catch{}
  throw new ApiError(response.status===429?429:502,`Provider request failed (${response.status})${detail}`,response.headers.get('retry-after')||undefined);
 }
 return response;
}

export function constantEqual(a:string,b:string){let diff=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)diff|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return diff===0}
