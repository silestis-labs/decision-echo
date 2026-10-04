import {createElement} from 'react';
import {describe,it,expect,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {BeforeShareContent} from './before-share';
import {PrivacyPage,PrivacyFooter,PrivacyNotice,isPrivacyRoute} from './privacy';

describe('privacy UI',()=>{
 it('disables Continue until the checkbox is checked',()=>{
  const props={onChecked:vi.fn(),onCancel:vi.fn(),onContinue:vi.fn()};
  const unchecked=renderToStaticMarkup(createElement(BeforeShareContent,{checked:false,...props}));
  expect(unchecked).toMatch(/<button[^>]*disabled=""[^>]*>Continue to screen sharing/);
  expect(unchecked).not.toMatch(/<input[^>]*checked/);
  const checked=renderToStaticMarkup(createElement(BeforeShareContent,{checked:true,...props}));
  expect(checked).toMatch(/<input[^>]*checked=""/);
  expect(checked).not.toMatch(/<button[^>]*disabled/);
  expect(unchecked).toContain('href="/privacy" target="_blank" rel="noopener noreferrer"');
 });
 it('renders the privacy route with contact information and footer link',()=>{
  expect(isPrivacyRoute('/privacy')).toBe(true);expect(isPrivacyRoute('/privacy/')).toBe(true);expect(isPrivacyRoute('/privacy-else')).toBe(false);
  const page=renderToStaticMarkup(createElement(PrivacyPage));
  expect(page).toContain('<h1>PRIVACY NOTICE</h1>');expect(page).toContain('mailto:hello@silestis.com');
  expect(page).toContain(renderToStaticMarkup(createElement(PrivacyFooter)));
 });
 it('renders text safely without accepting source HTML or unsafe links',()=>{
  const markup=renderToStaticMarkup(createElement(PrivacyNotice,{source:'# Notice\n\n<script>alert(1)</script>\n\n[bad](javascript:alert)\n\n- **Safe** [link](https://example.com)'}));
  expect(markup).not.toContain('<script>');expect(markup).not.toContain('href="javascript:');
  expect(markup).toContain('&lt;script&gt;');expect(markup).toContain('<ul>');expect(markup).toContain('<strong>Safe</strong>');
 });
});
