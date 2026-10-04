import {describe,it,expect} from 'vitest';
import {localDate} from './date-field';
describe('date display conversion',()=>{
 it('does not throw for invalid or empty server values',()=>{expect(localDate(null)).toBe('');expect(localDate('invalid')).toBe('');});
 it('preserves the represented local calendar time',()=>{const input=new Date(2026,9,8,9,30);expect(localDate(input.toISOString())).toBe('2026-10-08T09:30');});
});
