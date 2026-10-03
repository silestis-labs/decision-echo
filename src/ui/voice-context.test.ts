import {describe,it,expect,vi} from 'vitest';
import {deliverVoiceContext} from './voice-context';
describe('voice connection context',()=>{
 it('waits for asynchronous connection readiness and sends once',()=>{
  const sender={sendContextualUpdate:vi.fn(),sendUserMessage:vi.fn()};
  let pending={context:'expert evidence',debrief:false} as ReturnType<typeof deliverVoiceContext>;
  pending=deliverVoiceContext('connecting',pending,sender);expect(sender.sendContextualUpdate).not.toHaveBeenCalled();
  pending=deliverVoiceContext('connected',pending,sender);expect(sender.sendContextualUpdate).toHaveBeenCalledWith('expert evidence');
  deliverVoiceContext('connected',pending,sender);expect(sender.sendContextualUpdate).toHaveBeenCalledTimes(1);expect(sender.sendUserMessage).not.toHaveBeenCalled();
 });
 it('requests a debrief only after connection, and sends nothing after pause clears pending context',()=>{
  const sender={sendContextualUpdate:vi.fn(),sendUserMessage:vi.fn()};
  deliverVoiceContext('disconnected',{context:'review',debrief:true},sender);expect(sender.sendUserMessage).not.toHaveBeenCalled();
  deliverVoiceContext('connected',{context:'review',debrief:true},sender);expect(sender.sendUserMessage).toHaveBeenCalledTimes(1);
  deliverVoiceContext('connected',null,sender);expect(sender.sendUserMessage).toHaveBeenCalledTimes(1);
 });
});
