// Injection is explicitly requested for one tab. No input values or printable keys.
if (!globalThis.__decisionEchoCapture) {
  let active=false;
  const send=(text)=>{if(active)chrome.runtime.sendMessage({type:'capture-activity',text}).catch(()=>{});};
  const click=(e)=>{
    const el=e.target.closest?.('button,a,[role="button"],input,textarea,select,[contenteditable]');
    if(!el)return;
    // Input labels/text can expose values; report type only for editable controls.
    const editable=el.matches('input,textarea,select')||el.isContentEditable;
    const name=editable?'editable control':(el.getAttribute('aria-label')||el.textContent||'control').trim().slice(0,100);
    send(`Click: ${name}`);
  };
  const key=(e)=>{if(e.ctrlKey||e.metaKey||e.altKey)send('Shortcut activity');else send('Typing activity');};
  const listener=(m)=>{
    if(m.type==='capture-enable')active=true;
    if(m.type==='capture-disable')active=false;
  };
  document.addEventListener('click',click,true);
  document.addEventListener('keydown',key,true);
  chrome.runtime.onMessage.addListener(listener);
  globalThis.__decisionEchoCapture=true;
}
