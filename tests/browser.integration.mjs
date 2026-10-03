import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
try{
const page=await browser.newPage({viewport:{width:1440,height:1000},timezoneId:'Europe/Berlin'});
const errors=[];page.on('pageerror',error=>errors.push(error.message));
// Test-only synthetic canvas replaces OS permission/capture. This does not prove hardware capture.
await page.addInitScript(()=>{navigator.mediaDevices.getDisplayMedia=async()=>{const c=document.createElement('canvas');c.width=800;c.height=450;const ctx=c.getContext('2d');ctx.fillStyle='#f5f6fa';ctx.fillRect(0,0,800,450);ctx.fillStyle='#12213b';ctx.font='24px sans-serif';ctx.fillText('Synthetic browser integration test screen',30,50);let tick=0;setInterval(()=>{ctx.fillStyle=tick++%2?'#cc8844':'#4466aa';ctx.fillRect(700,350,50,50);},1000);return c.captureStream(2);};});
await page.goto('http://127.0.0.1:5173');
await page.getByRole('button',{name:'Start sandbox session →',exact:true}).click();
await page.getByRole('button',{name:'02 Work Map',exact:true}).click();
await expect(page.getByRole('heading',{name:'Your Work Map is not ready yet'})).toBeVisible();
await expect(page.getByRole('textbox',{name:'New debrief question',exact:true})).toHaveCount(0);
await page.getByRole('button',{name:'Return to Capture',exact:true}).click();
await page.getByRole('button',{name:'Share screen',exact:true}).click();
await page.getByRole('button',{name:'Screen moment',exact:false}).first().waitFor({timeout:12000});
await expect(page.getByAltText('Latest captured surface preview')).toBeVisible();
await expect.poll(async()=>new Set(await page.getByAltText('Captured screen thumbnail').evaluateAll(imgs=>imgs.map(img=>img.src))).size,{timeout:12000}).toBeGreaterThan(1);
await page.getByRole('textbox',{name:'Screen-specific question',exact:true}).fill('Unsaved question retained on pause?');
await page.getByRole('textbox',{name:'Expert’s own answer',exact:true}).fill('Unsaved expert answer retained on pause.');
await page.getByRole('button',{name:'◼ Off the record',exact:true}).click();
await expect(page.getByRole('textbox',{name:'Expert’s own answer',exact:true})).toHaveValue('Unsaved expert answer retained on pause.');
await page.getByRole('button',{name:'Share screen',exact:true}).click();
for(let i=0;i<3;i++){
await page.getByRole('textbox',{name:'Screen-specific question',exact:true}).fill(`Synthetic capture question ${i}`);
await page.getByRole('textbox',{name:'Expert’s own answer',exact:true}).fill(`Synthetic expert test answer ${i}: protect the entire weekly schedule and avoid double bookings.`);
await page.getByRole('checkbox',{name:'No overlapping work',exact:true}).check();
if(i===2)await page.getByRole('checkbox',{name:'This answer establishes a stop, limit or escalation guardrail'}).check();
await page.getByRole('button',{name:'Save evidenced answer',exact:true}).click();
await expect(page.getByText(`${i+1}/3 answers`,{exact:true})).toBeVisible();
await expect(page.getByRole('textbox',{name:'Expert’s own answer',exact:true})).toHaveValue('');
}
await page.getByRole('button',{name:'Finish capture → debrief',exact:true}).click();
for(let i=0;i<3;i++){
await page.getByRole('textbox',{name:'New debrief question',exact:true}).fill(`Synthetic debrief question ${i}`);
await page.getByRole('textbox',{name:'Expert’s own answer',exact:true}).fill(`Synthetic debrief answer ${i}: include displaced work in the plan check.`);
await page.getByRole('checkbox',{name:'No overlapping work',exact:true}).check();
await page.getByRole('button',{name:'Save evidenced answer',exact:true}).click();
await expect(page.getByText(`${i+1}/3 answers`,{exact:true})).toBeVisible();
await expect(page.getByRole('textbox',{name:'Expert’s own answer',exact:true})).toHaveValue('');
}
await page.getByRole('button',{name:'Rebuild draft from all answers',exact:true}).click();
await page.getByRole('button',{name:'I confirm this is how I work',exact:true}).click();
await page.getByRole('button',{name:'Open unseen learner case →',exact:true}).click();
await expect(page.getByRole('heading',{name:'Weekly plan · unsaved proposal',exact:true})).toBeVisible();
const atlas=page.getByRole('row').filter({hasText:'Atlas Data Correction'});
await atlas.locator('select').nth(0).selectOption('Schedule');
await atlas.locator('select').nth(1).selectOption('Lea');
await page.getByLabel('Atlas Data Correction start',{exact:true}).fill('2026-10-08T09:00');
await page.getByLabel('Atlas Data Correction end',{exact:true}).fill('2026-10-08T11:00');
await page.getByRole('button',{name:'Check with the learned rules',exact:true}).click();
await expect(page.getByRole('heading',{name:'Pause before saving',exact:true})).toBeVisible();
await expect(page.getByRole('button',{name:'I approve · save sandbox plan',exact:true})).toBeDisabled();
await page.getByRole('heading',{name:'Pause before saving',exact:true}).scrollIntoViewIfNeeded();
await page.screenshot({path:'/private/tmp/decision-echo-intervention.png'});
await page.getByLabel('Analyze Cohort Data start',{exact:true}).fill('2026-10-09T08:00');
await page.getByLabel('Analyze Cohort Data end',{exact:true}).fill('2026-10-09T12:00');
await page.getByRole('button',{name:'Check with the learned rules',exact:true}).click();
await expect(page.getByRole('heading',{name:'Proposal passed the confirmed rules',exact:true})).toBeVisible();
await page.getByRole('button',{name:'I approve · save sandbox plan',exact:true}).click();
await expect(page.getByRole('status')).toHaveText('Sandbox proposal saved. No Notion workspace was changed.');
await page.screenshot({path:'/private/tmp/decision-echo-browser-review.png',fullPage:false});
assert.equal(errors.length,0,errors.join('\n'));
console.log('PASS browser startup, screen capture sampling (synthetic test stream), capture/debrief, confirmed map, unseen learner case, pre-save intervention, full correction and explicit sandbox save.');
}finally{await browser.close();}
