const el = id => document.getElementById(id);
let connection = null, active = false, epoch = 0, tabId = null, timer = null;
let controller = null, busy = false, lastActivity = 0, allowedOrigin = null, generation = 0;
const status = text => { el('status').textContent = text; };
function baseURL(raw) {
  const u = new URL(raw);
  if (u.protocol !== 'http:' || !['localhost', '127.0.0.1'].includes(u.hostname) || u.username || u.password || u.search || u.hash || u.pathname !== '/') throw Error('Use an HTTP loopback origin only');
  return u.origin;
}
async function api(path, body, signal) {
  const r = await fetch(`${connection.base}/api/sessions/${encodeURIComponent(connection.id)}${path}`, {
    method: body ? 'POST' : 'GET', headers: {Authorization: `Bearer ${connection.token}`, 'Content-Type': 'application/json'},
    body: body ? JSON.stringify(body) : undefined, signal, cache: 'no-store', redirect: 'error'
  });
  if (!r.ok) throw Error(`Workspace request failed (${r.status})`);
  return r.json();
}
function halt() {
  generation++; active = false; clearInterval(timer); timer = null;
  controller?.abort(); controller = null; busy = false;
  if (tabId !== null) chrome.tabs.sendMessage(tabId, {type: 'capture-disable'}).catch(() => {});
}
async function synchronize(signal) {
  const s = await api('', undefined, signal);
  if (!s.recording || s.epoch !== epoch) { halt(); status('Stopped: workspace capture authority changed'); return false; }
  return true;
}
async function selectedTab() {
  const t = await chrome.tabs.get(tabId);
  if (!t.url || new URL(t.url).origin !== allowedOrigin) throw Error('Selected tab left the allowed origin');
  return t;
}
async function boundedImage(image) {
  const img = new Image(); img.src = image; await img.decode();
  const scale = Math.min(1, 1280 / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas'); canvas.width = Math.round(img.width * scale); canvas.height = Math.round(img.height * scale);
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
  const result = canvas.toDataURL('image/jpeg', .55);
  if (result.length > 550000) throw Error('Frame exceeds the evidence size limit');
  return result;
}
// One operation owns capture, authority validation and upload. No stale screenshot can
// cross a local stop/restart, even when both runs use the same recording epoch.
async function operation(kind, text) {
  if (!active || busy) return;
  busy = true; const attempt = generation, mine = epoch, c = new AbortController(); controller = c;
  try {
    if (!await synchronize(c.signal) || !active || generation !== attempt) return;
    await api('/heartbeat', {epoch: mine}, c.signal);
    if (!active || generation !== attempt) return;
    const target = await selectedTab();
    if (!kind) return;
    let image;
    if (kind === 'frame') {
      const [current] = await chrome.tabs.query({active: true, windowId: target.windowId});
      if (current?.id !== tabId) return;
      image = await boundedImage(await chrome.tabs.captureVisibleTab(target.windowId, {format: 'jpeg', quality: 55}));
      // Recheck after asynchronous capture: the visible tab may have changed.
      const [after] = await chrome.tabs.query({active: true, windowId: target.windowId});
      if (after?.id !== tabId) return;
      await selectedTab();
    }
    if (!active || generation !== attempt || mine !== epoch || (kind === 'frame' && !el('frames').checked)) return;
    await api('/evidence', {epoch: mine, kind, text, ...(image ? {image} : {})}, c.signal);
  } catch (e) {
    if (e.name !== 'AbortError' && generation === attempt) { halt(); status(e.message.includes('activeTab') ? 'Screenshot permission missing. Click the extension toolbar action on the selected tab, then consent again.' : e.message); }
  } finally {
    if (controller === c) { controller = null; busy = false; }
  }
}
chrome.runtime.onMessage.addListener((m, sender) => {
  if (m.type === 'capture-activity' && sender.tab?.id === tabId && active && Date.now() - lastActivity > 500) {
    lastActivity = Date.now(); void operation('activity', String(m.text).slice(0, 140));
  }
});
chrome.tabs.onRemoved?.addListener(id => { if (id === tabId && active) { halt(); status('Stopped: selected tab closed'); } });
chrome.tabs.onUpdated?.addListener((id, change) => {
  if (id === tabId && active && (change.status === 'loading' || change.url)) { halt(); status('Stopped: tab navigated. Consent again to restart.'); }
});
el('extension-origin').textContent = chrome.runtime.getURL ? new URL(chrome.runtime.getURL('/')).origin : 'chrome-extension://<extension-id>';
el('start').onclick = async () => {
  halt(); const attempt = generation;
  try {
    const base = baseURL(el('endpoint').value), id = el('session').value.trim();
    const entered = el('token').value.trim(); el('token').value = '';
    const token = entered || (connection?.base === base && connection?.id === id ? connection.token : '');
    if (!id || !token) throw Error('Session and token required');
    connection = {base, id, token};
    const allowed = new URL(el('origin').value);
    if (!['http:', 'https:'].includes(allowed.protocol) || allowed.username || allowed.password || allowed.pathname !== '/' || allowed.search || allowed.hash) throw Error('Enter the exact target web origin, without a path');
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    if (!tab?.url || new URL(tab.url).origin !== allowed.origin) throw Error('Current tab must match the allowed origin');
    tabId = tab.id; allowedOrigin = allowed.origin;
    const s = await api(''); if (generation !== attempt) return;
    epoch = s.epoch; if (!s.recording) throw Error('Start recording in the workspace first');
    await chrome.scripting.executeScript({target: {tabId}, files: ['content.js']}); if (generation !== attempt) return;
    await chrome.tabs.sendMessage(tabId, {type: 'capture-enable'});
    if (generation !== attempt) { chrome.tabs.sendMessage(tabId, {type: 'capture-disable'}).catch(() => {}); return; }
    active = true; status('Recording selected tab metadata');
    timer = setInterval(() => { void operation(el('frames').checked ? 'frame' : null, 'Explicitly consented selected-tab frame'); }, 2000);
  } catch (e) { if (generation === attempt) { halt(); status(e.message.includes('activeTab') ? 'Screenshot permission missing. Click the extension toolbar action on the selected tab, then consent again.' : e.message); } }
};
el('stop').onclick = async () => {
  halt(); if (!connection) { status('Local capture stopped'); return; }
  el('start').disabled = true; status('Local capture stopped; pausing workspace…');
  try { const s = await api(''); epoch = s.epoch; await api('/recording', {recording: false, epoch}); status('Off record: workspace capture stopped'); }
  catch (e) { status(`Local capture stopped; workspace pause unconfirmed: ${e.message}`); }
  finally { el('start').disabled = false; }
};
el('forget').onclick = () => { halt(); connection = null; el('token').value = ''; status('Capture stopped and local credentials forgotten. Workspace pause is unchanged.'); };
window.addEventListener('pagehide', () => { halt(); connection = null; });
