import {chromium, expect} from '@playwright/test';
import assert from 'node:assert/strict';
const browser = await chromium.launch({headless:true});
try {
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:5173');
  await page.evaluate(async () => {
    const {default: React} = await import('/node_modules/.vite/deps/react.js');
    const {default: {createRoot}} = await import('/node_modules/.vite/deps/react-dom_client.js');
    const {VoicePresence} = await import('/src/ui/voice-presence.tsx');
    const host = document.createElement('div'); document.body.replaceChildren(host);
    const root = createRoot(host);
    window.allowMeter = true;
    window.meterReads = {input:0, output:0};
    window.showPresence = props => root.render(React.createElement(VoicePresence, {
      canSample: () => window.allowMeter,
      getInputVolume: () => {window.meterReads.input++; return .4;},
      getOutputVolume: () => {window.meterReads.output++; return .8;}, ...props,
    }));
    window.showPresence({recording:false,status:'connected'});
  });
  await expect(page.getByRole('status')).toHaveText('Voice paused');
  await page.waitForTimeout(200);
  assert.deepEqual(await page.evaluate(()=>window.meterReads), {input:0,output:0});
  await page.evaluate(()=>window.showPresence({recording:true,status:'connecting'}));
  await expect(page.getByRole('status')).toHaveText('Connecting voice');
  assert.deepEqual(await page.evaluate(()=>window.meterReads), {input:0,output:0});
  await page.evaluate(()=>window.showPresence({recording:true,status:'connected'}));
  await expect(page.getByRole('status')).toHaveText('Listening to you');
  await expect(page.locator('.voice-presence__meter span')).toHaveAttribute('style', 'width: 40%;');
  await page.evaluate(()=>window.showPresence({recording:true,status:'connected',speaking:true}));
  await expect(page.getByRole('status')).toHaveText('Agent speaking');
  await expect(page.locator('.voice-presence__meter span')).toHaveAttribute('style','width: 80%;');
  await page.evaluate(()=>window.showPresence({recording:true,status:'connected',muted:true}));
  await expect(page.getByRole('status')).toHaveText('Test replies · microphone muted');
  await expect(page.locator('.voice-presence__meter span')).toHaveAttribute('style','width: 0%;');
  const mutedReads = await page.evaluate(()=>window.meterReads);
  await page.waitForTimeout(220);
  assert.deepEqual(await page.evaluate(()=>window.meterReads), mutedReads);
  await page.evaluate(()=>{window.allowMeter=false;window.showPresence({recording:true,status:'connected',speaking:true});});
  await expect(page.locator('.voice-presence__meter span')).toHaveAttribute('style','width: 0%;');
  const stoppedReads=await page.evaluate(()=>window.meterReads);
  await page.waitForTimeout(220);
  assert.deepEqual(await page.evaluate(()=>window.meterReads),stoppedReads);
  await page.evaluate(()=>window.showPresence({recording:false,status:'connected',speaking:true}));
  await expect(page.getByRole('status')).toHaveText('Voice paused');
  const pausedReads=await page.evaluate(()=>window.meterReads);
  await page.waitForTimeout(220);
  assert.deepEqual(await page.evaluate(()=>window.meterReads),pausedReads);
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await page.locator('.voice-presence__core').evaluate(el=>getComputedStyle(el).transform),'none');
  console.log('PASS voice presence: actual getter levels, input/output switching, muted simulation, off-record sampling stop, reduced motion. No live providers used.');
} finally {await browser.close();}
