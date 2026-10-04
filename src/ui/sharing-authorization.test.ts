import {describe,it,expect,vi} from 'vitest';
import {SharingAuthorization} from './sharing-authorization';

describe('before-share authorization',()=>{
 it('does not acquire screen/audio or transfer data while pending or after cancellation',()=>{
  const getDisplayMedia=vi.fn(),getUserMedia=vi.fn(),fetch=vi.fn();
  const action=()=>{getDisplayMedia();getUserMedia();fetch();};
  const gate=new SharingAuthorization();gate.request(action);
  expect(gate.authorized).toBe(false);
  gate.continue(false);
  for(const spy of [getDisplayMedia,getUserMedia,fetch])expect(spy).not.toHaveBeenCalled();
  gate.cancel();gate.continue(true);
  for(const spy of [getDisplayMedia,getUserMedia,fetch])expect(spy).not.toHaveBeenCalled();
  expect(gate.authorized).toBe(false);
 });
 it('starts exactly once and synchronously from acknowledged Continue',()=>{
  const action=vi.fn();const gate=new SharingAuthorization();gate.request(action);gate.continue(true);
  expect(action).toHaveBeenCalledOnce();expect(gate.authorized).toBe(true);
  gate.continue(true);expect(action).toHaveBeenCalledOnce();
 });
 it('invalidates pending action and authorization on pause',()=>{
  const gate=new SharingAuthorization();const stale=vi.fn();gate.request(stale);gate.reset();gate.continue(true);
  expect(stale).not.toHaveBeenCalled();expect(gate.authorized).toBe(false);
  const fresh=vi.fn();gate.request(fresh);gate.continue(false);expect(fresh).not.toHaveBeenCalled();gate.continue(true);expect(fresh).toHaveBeenCalledOnce();
 });
});
