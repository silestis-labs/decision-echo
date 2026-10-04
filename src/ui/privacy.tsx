import type {ReactNode} from 'react';
import notice from '../../docs/privacy.md?raw';
import './privacy.css';

/** Render the notice's headings, paragraphs, lists, bold text and links as React text nodes. */
function inline(text:string):ReactNode[]{
 return text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g).filter(Boolean).map((part,index)=>{
  if(part.startsWith('**'))return <strong key={index}>{part.slice(2,-2)}</strong>;
  const link=/^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
  if(link&&/^(https:\/\/|mailto:)/.test(link[2]))return <a key={index} href={link[2]}>{link[1]}</a>;
  return part;
 });
}
export function PrivacyNotice({source=notice}:{source?:string}){
 return <article className="privacy-notice">{source.trim().split(/\n\s*\n/).map((block,index)=>{
  const heading=/^(#{1,3}) (.*)$/.exec(block);
  if(heading){const text=inline(heading[2]);return heading[1].length===1?<h1 key={index}>{text}</h1>:heading[1].length===2?<h2 key={index}>{text}</h2>:<h3 key={index}>{text}</h3>;}
  if(block.startsWith('- '))return <ul key={index}>{block.split('\n').map((line,i)=><li key={i}>{inline(line.replace(/^- /,''))}</li>)}</ul>;
  return <p key={index}>{inline(block.replace(/\n/g,' '))}</p>;
 })}</article>;
}
export function PrivacyFooter(){return <footer role="contentinfo" className="privacy-footer" aria-label="Privacy information"><span>Decision Echo</span><a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Notice</a></footer>;}
export function PrivacyPage(){return <><main className="privacy-page"><a href="/">Back to Decision Echo</a><PrivacyNotice/></main><PrivacyFooter/></>;}
export function isPrivacyRoute(pathname:string){return /^\/privacy\/?$/.test(pathname);}
