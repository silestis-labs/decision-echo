import type { Session, Capabilities } from '../shared/contracts';
export class RequestError extends Error { constructor(message:string,public status:number){super(message);} }
let credential: { id:string; token:string } | null = null;
export async function api<T>(path:string, body?:unknown, signal?:AbortSignal):Promise<T> {
  const response=await fetch(`/api${path}`, {method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(credential?{Authorization:`Bearer ${credential.token}`}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal});
  if(!response.ok){const value=await response.json().catch(()=>null) as {error?:unknown}|null;throw new RequestError(typeof value?.error==='string'?value.error:`Request failed (${response.status})`,response.status);}
  return response.json() as Promise<T>;
}
export const config=()=>api<Capabilities>('/config');
export async function create(mode:'sandbox'|'live'){const result=await api<{session:Session;token:string}>('/sessions',{mode});credential={id:result.session.id,token:result.token};return result.session;}
export function sessionApi<T>(suffix:string,body?:unknown,signal?:AbortSignal){if(!credential)throw new Error('Start a session first.');return api<T>(`/sessions/${credential.id}${suffix}`,body,signal);}

export function captureConnection(){if(!credential)throw new Error("Start a session first.");return {...credential,endpoint:"http://127.0.0.1:8787"};}
