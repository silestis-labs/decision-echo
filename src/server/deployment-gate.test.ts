import {expect,it} from 'vitest';
import {requiresDemoAccess} from './safety';
it('allows ungated local development but requires a gate for public or malformed origins',()=>{
 for(const origin of ['http://127.0.0.1:5173','http://localhost:5173','http://[::1]:5173'])expect(requiresDemoAccess(origin)).toBe(false);
 for(const origin of ['https://decision-echo.example','http://127.0.0.1.attacker.example','invalid',''])expect(requiresDemoAccess(origin)).toBe(true);
 expect(requiresDemoAccess('http://127.0.0.1:5173','configured')).toBe(true);
 expect(requiresDemoAccess('http://127.0.0.1:5173',undefined,'https://decision-echo.workers.dev')).toBe(true);
 expect(requiresDemoAccess('http://127.0.0.1:5173',undefined,'http://127.0.0.1:8787')).toBe(false);
});
