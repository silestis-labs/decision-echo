import { describe,it,expect } from 'vitest';
import { digest,readBody,imageSchema,providerFetch } from './safety';
describe('server security boundaries',()=>{
 it('hashes capability deterministically without retaining plaintext',async()=>{expect(await digest('secret')).toHaveLength(64);expect(await digest('secret')).not.toBe(await digest('other'))});
 it('bounds streamed bodies even without content length',async()=>{const request=new Request('https://test',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({large:'x'.repeat(100)})});await expect(readBody(request,40)).rejects.toThrow('Body too large')});
 it('rejects remote URLs disguised as frames',()=>{expect(imageSchema.safeParse('https://example.test/image.png').success).toBe(false)});
 it('does not blindly retry a failed provider write',async()=>{let calls=0;await expect(providerFetch('https://test',{method:'PATCH'},(async()=>{calls++;return new Response('',{status:429,headers:{'Retry-After':'7'}})}) as typeof fetch)).rejects.toMatchObject({status:429,retryAfter:'7'});expect(calls).toBe(1)});
});
