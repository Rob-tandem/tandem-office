import { TILE, W, H, SPAWN, NOOKS, blocked, zoneAt, tileAt, hearVolume } from './map';
import { draw, whenArtReady } from './render';
import { COLORS, MOODS, type Peer } from './state';
import { sounds } from './sounds';
import { Net, type ChatMessage } from './net';
import { AudioMesh } from './audio';
import { Transcriber } from './transcribe';
import { ChatPanel, type Audience } from './chat';

const $ = <T extends HTMLElement>(s: string) => document.querySelector(s) as T;
const myId = sessionStorage.getItem('office.id') ?? crypto.randomUUID();
sessionStorage.setItem('office.id', myId);

// ---------- entry screen ----------
const coloursEl = $('#colours');
let colour = localStorage.getItem('office.colour') ?? COLORS[Math.floor(Math.random() * COLORS.length)];
for (const c of COLORS) {
  const b = document.createElement('button'); b.type = 'button'; b.style.background = c; b.classList.toggle('on', c === colour);
  b.onclick = () => { colour = c; coloursEl.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); };
  coloursEl.appendChild(b);
}
const homeSel = $('#home') as HTMLSelectElement;
for (const n of NOOKS) { const o = document.createElement('option'); o.value = n.id; o.textContent = n.name; homeSel.appendChild(o); }
homeSel.value = localStorage.getItem('office.home') ?? NOOKS[Math.floor(Math.random() * NOOKS.length)].id;
const moodsEl = $('#moods');
let mood = localStorage.getItem('office.mood') ?? '😀';
for (const m of MOODS) {
  const b = document.createElement('button'); b.type = 'button'; b.textContent = m; b.classList.toggle('on', m === mood);
  b.onclick = () => { mood = m; moodsEl.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); };
  moodsEl.appendChild(b);
}
($('#name') as HTMLInputElement).value = localStorage.getItem('office.name') ?? '';
// Invite links carry the passcode in the URL fragment (never sent to a server): …/#itsgoodtotalk
const fromLink = decodeURIComponent(location.hash.slice(1)).trim();
if (fromLink) { localStorage.setItem('office.passcode', fromLink); history.replaceState(null, '', location.pathname + location.search); }
($('#passcode') as HTMLInputElement).value = fromLink || (localStorage.getItem('office.passcode') ?? '');
if (fromLink) { $('#passcode-label').classList.add('hidden'); $('#passcode-ok').classList.remove('hidden'); }
export function inviteLink() { return location.origin + location.pathname + '#' + encodeURIComponent(localStorage.getItem('office.passcode') ?? ''); }
($('#transcribe') as HTMLInputElement).checked = localStorage.getItem('office.transcribe') !== 'off';

$('#enter-form').addEventListener('submit', async e => {
  e.preventDefault();
  const name = ($('#name') as HTMLInputElement).value.trim();
  const passcode = ($('#passcode') as HTMLInputElement).value;
  const tx = ($('#transcribe') as HTMLInputElement).checked;
  localStorage.setItem('office.name', name); localStorage.setItem('office.passcode', passcode);
  localStorage.setItem('office.colour', colour); localStorage.setItem('office.transcribe', tx ? 'on' : 'off');
  localStorage.setItem('office.home', homeSel.value); localStorage.setItem('office.mood', mood);
  $('#enter-err').textContent = '';
  try { await enter(name, passcode, colour, tx, homeSel.value, mood); }
  catch (err: any) { $('#enter-err').textContent = err?.message === 'wrong passcode' ? 'That is not the office passcode. Ask the team.' : 'Could not connect: ' + (err?.message ?? err); }
});

// ---------- the office ----------
async function enter(name: string, passcode: string, color: string, wantTranscripts: boolean, home: string, mood: string) {
  const me: Peer = { id: myId, name, color, mood, home, x: SPAWN.x, y: SPAWN.y, status: 'available', muted: true, transcribing: false };
  const bounce = new Map<string, number>();
  let lightsOn = true, light = 1, lastSwitch = 0;
  const inEarshot = new Set<string>();
  const peers = new Map<string, Peer>();
  let lastInput = performance.now();

  const mesh = new AudioMesh(myId, (to, data) => net.signal(to, data));
  const tilesEl = $('#tiles'); const tiles = new Map<string, HTMLElement>();
  function tileFor(id: string, label: string, video: HTMLVideoElement, isMe = false) {
    const t = document.createElement('div'); t.className = 'tile' + (isMe ? ' me' : ''); t.dataset.id = id;
    const who = document.createElement('span'); who.className = 'who'; who.textContent = label;
    t.append(video, who); tilesEl.appendChild(t); tiles.set(id, t); return t;
  }
  mesh.onVideo = (id, el) => {
    tiles.get(id)?.remove(); tiles.delete(id);
    if (el) tileFor(id, peers.get(id)?.name ?? '', el);
  };
  const transcriber = new Transcriber(text => sendChat(text, 'nearby', null, 'said'));
  const chat = new ChatPanel($('#chat'), name, (body, audience, to) => sendChat(body, audience, to, 'text'));

  const net = new Net(me, {
    onPresence(list) {
      const ids = new Set(list.map(p => p.id));
      for (const p of list) {
        const cur = peers.get(p.id);
        if (cur) Object.assign(cur, { name: p.name, color: p.color, mood: p.mood, home: p.home, status: p.status, muted: p.muted, transcribing: p.transcribing, camera: p.camera });
        else { peers.set(p.id, { ...p, tx: p.x, ty: p.y }); if (joined) sounds.chime(); }
      }
      for (const id of [...peers.keys()]) if (!ids.has(id)) peers.delete(id);
      mesh.setPeers([...peers.keys()]);
      net.sendPos(true);
      renderPeople();
    },
    onMove(id, x, y) { const p = peers.get(id); if (p) { p.tx = x; p.ty = y; } },
    onSignal(from, _to, data) { mesh.onSignal(from, data); },
    onChat(m) { if (visibleToMe(m)) chat.add(m); },
    onBell(from) { sounds.bell(); toast(`🔔 ${from} rang the bell: everyone to the Rocket!`); },
    onLights(on, by) { setLights(on, by, false); },
  });
  let joined = false;

  await net.join(passcode);
  joined = true;
  whenArtReady(() => {});
  if (import.meta.env.DEV) (window as any).__office = { me, peers, mesh, net, step: (n?: number) => step(n ?? performance.now()) };
  await mesh.resume();
  $('#enter').classList.add('hidden'); $('#app').classList.remove('hidden');
  for (const m of await net.history()) if (visibleToMe(m)) chat.add(m);
  sendChat(`${name} entered the office`, 'everyone', null, 'system');
  sounds.chime();
  // lights: first one in switches them on; otherwise take the state the others hold
  net.synced.then(() => setTimeout(() => {
    if (peers.size === 0) { lightsOn = false; light = 0; setLights(true, name, true, true); }
    else { const other = [...peers.values()].find(p => p.lights !== undefined); lightsOn = other ? other.lights !== false : true; light = lightsOn ? 1 : 0; me.lights = lightsOn; }
  }, 1500));
  function setLights(on: boolean, by: string, broadcast: boolean, firstIn = false) {
    if (on === lightsOn) return;
    lightsOn = on; me.lights = on; sounds.click(on);
    if (broadcast) { net.lights(on); net.track(); sendChat(`${by} turned the lights ${on ? 'on ☀️' : 'off 🌙'}${firstIn ? ' (first in)' : ''}`, 'everyone', null, 'system'); }
    toast(by === name ? (firstIn ? "☀️ You're first in. Lights on!" : `💡 You turned the lights ${on ? 'on' : 'off'}`) : `💡 ${by} turned the lights ${on ? 'on' : 'off'}`);
  }
  function toast(text: string) { const t = $('#toast'); t.textContent = text; t.classList.remove('hidden'); clearTimeout((toast as any).h); (toast as any).h = setTimeout(() => t.classList.add('hidden'), 4000); }

  // ----- helpers -----
  function hearers(): Peer[] { return [...peers.values()].filter(p => hearVolume(me.x, me.y, p.x, p.y) > 0); }
  function visibleToMe(m: ChatMessage) {
    if (m.sender === name) return true;
    if (m.audience === 'everyone') return true;
    return !!m.recipients?.includes(name);
  }
  function sendChat(body: string, audience: Audience, to: string | null, kind: ChatMessage['kind']) {
    const z = zoneAt(me.x, me.y);
    const m: ChatMessage = {
      kind, sender: name, audience, body, zone: z?.name ?? null,
      recipients: audience === 'everyone' ? null : audience === 'direct' ? [to!] : hearers().map(p => p.name),
    };
    const el = kind !== 'system' ? chat.add({ ...m, created_at: new Date().toISOString() }) : null;
    net.chat(m).then(saved => { if (!saved) el?.classList.add('unsaved'); });
  }
  let linkStates: Record<string, string> = {};
  function renderPeople() {
    linkStates = Object.fromEntries(Object.entries(mesh.states()).map(([id, st]) => [id, st.split('/')[0]]));
    const ul = $('#people'); ul.innerHTML = '';
    $('#count').textContent = `(${peers.size + 1})`;
    for (const p of [me, ...peers.values()]) {
      const li = document.createElement('li');
      const z = zoneAt(p.x, p.y);
      const dot = document.createElement('span'); dot.className = 'dot'; dot.style.background = COLORS.includes(p.color) ? p.color : '#999';
      const nm = document.createElement('span'); nm.textContent = `${p.mood ? p.mood + ' ' : ''}${p.name}${p === me ? ' (you)' : ''}${p.muted ? ' 🔇' : ''}${p.camera ? ' 📷' : ''}`;
      const link = p === me ? '' : (linkStates[p.id] ?? '');
      const wh = document.createElement('span'); wh.className = 'where' + (link && link !== 'connected' ? ' warn' : '');
      wh.textContent = link && link !== 'connected' ? (link === 'connecting' || link === 'new' ? 'connecting…' : 'no audio link') : (p.status === 'away' ? 'away' : (z?.name ?? ''));
      li.append(dot, nm, wh);
      if (p !== me) li.onclick = () => { chat.setAudience('direct', p.name); chat.focus(); };
      ul.appendChild(li);
    }
  }

  // ----- controls -----
  const micBtn = $('#mic'), txBtn = $('#tx'), camBtn = $('#cam');
  async function setMic(on: boolean) {
    if (on && !(await mesh.enableMic())) { micBtn.textContent = '🎙 Mic blocked'; return; }
    me.muted = !on; mesh.setMuted(!on);
    micBtn.textContent = on ? '🎙 Mic on' : '🎙 Mic off'; micBtn.classList.toggle('live', on);
    applyTranscription(); net.track();
  }
  function applyTranscription() {
    const inQuiet = zoneAt(me.x, me.y)?.kind === 'quiet';
    const should = wantTranscripts && !me.muted && !inQuiet && transcriber.supported;
    if (should && !transcriber.running) transcriber.start();
    if (!should && transcriber.running) transcriber.stop();
    me.transcribing = should;
    txBtn.textContent = !transcriber.supported ? '● No transcript (use Chrome)' : wantTranscripts ? (should ? '● Transcript on' : '● Transcript paused') : '○ Transcript off';
    txBtn.classList.toggle('rec', should);
  }
  micBtn.onclick = () => setMic(me.muted);
  async function setCamera(on: boolean) {
    if (on) {
      if (!(await mesh.enableCamera())) { camBtn.textContent = '📷 Camera blocked'; return; }
      const v = document.createElement('video'); v.autoplay = true; v.muted = true; v.playsInline = true; v.srcObject = mesh.cameraStream;
      tileFor(me.id, 'You', v, true);
    } else { mesh.disableCamera(); tiles.get(me.id)?.remove(); tiles.delete(me.id); }
    me.camera = on; camBtn.textContent = on ? '📷 Camera on' : '📷 Camera off'; camBtn.classList.toggle('live', on); net.track();
  }
  camBtn.onclick = () => setCamera(!me.camera);
  $('#invite').onclick = async () => {
    const link = inviteLink();
    try { await navigator.clipboard.writeText(link); toast('🔗 Invite link copied. Anyone with it can walk in.'); }
    catch { prompt('Copy this invite link:', link); }
  };
  txBtn.onclick = () => { wantTranscripts = !wantTranscripts; localStorage.setItem('office.transcribe', wantTranscripts ? 'on' : 'off'); applyTranscription(); net.track(); };
  $('#leave').onclick = async () => {
    const lastOut = peers.size === 0;
    sendChat(`${name} left the office${lastOut ? ' and turned the lights off 🌙 (last out)' : ''}`, 'everyone', null, 'system');
    if (lastOut) { lightsOn = false; sounds.click(false); toast('🌙 Last out. Lights off.'); await new Promise(r => setTimeout(r, 900)); }
    await net.leave(); mesh.close(); transcriber.stop(); location.reload();
  };
  window.addEventListener('beforeunload', () => { net.leave(); });
  applyTranscription();

  // ----- movement -----
  const keys = new Set<string>();
  window.addEventListener('keydown', e => { keys.add(e.key.toLowerCase()); lastInput = performance.now(); if (e.key.startsWith('Arrow')) e.preventDefault(); });
  window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
  window.addEventListener('blur', () => keys.clear());
  const SPEED = 4.5, R = 0.3;
  function free(x: number, y: number) {
    return !blocked(Math.floor(x - R), Math.floor(y - R)) && !blocked(Math.floor(x + R), Math.floor(y - R)) &&
           !blocked(Math.floor(x - R), Math.floor(y + R)) && !blocked(Math.floor(x + R), Math.floor(y + R));
  }

  // ----- loop -----
  const canvas = $('#c') as HTMLCanvasElement, ctx = canvas.getContext('2d')!;
  let last = performance.now(), lastZone: string | null = null, lastStatus = me.status, lastPeopleRender = 0, lastBell = 0;
  function frame(now: number) { step(now); requestAnimationFrame(frame); }
  // When the tab is hidden the browser stops animation frames; keep the logic (volumes, status, presence) going on a timer.
  setInterval(() => { if (document.hidden) step(performance.now()); }, 250);
  function step(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    let dx = 0, dy = 0;
    if (keys.has('arrowleft') || keys.has('a')) dx -= 1; if (keys.has('arrowright') || keys.has('d')) dx += 1;
    if (keys.has('arrowup') || keys.has('w')) dy -= 1; if (keys.has('arrowdown') || keys.has('s')) dy += 1;
    if (dx || dy) {
      const len = Math.hypot(dx, dy); const nx = me.x + (dx / len) * SPEED * dt, ny = me.y + (dy / len) * SPEED * dt;
      if (free(nx, me.y)) me.x = nx; if (free(me.x, ny)) me.y = ny;
      net.sendPos();
    }
    for (const p of peers.values()) { if (p.tx != null && p.ty != null) { p.x += (p.tx - p.x) * Math.min(1, dt * 12); p.y += (p.ty - p.y) * Math.min(1, dt * 12); } }
    const speakingNow = mesh.speaking();
    // audio volumes, and a pop when someone comes into earshot
    for (const p of peers.values()) {
      const v = hearVolume(me.x, me.y, p.x, p.y); mesh.setVolume(p.id, v);
      if (v > 0 && !inEarshot.has(p.id)) { inEarshot.add(p.id); sounds.pop(); } else if (v === 0) inEarshot.delete(p.id);
      const t = tiles.get(p.id); if (t) { t.style.opacity = v > 0 ? String(0.45 + 0.55 * v) : '0'; t.style.transform = v > 0 ? 'scale(1)' : 'scale(.9)'; t.classList.toggle('talking', speakingNow.has(p.id)); }
    }
    // fun tiles
    const tile = tileAt(me.x, me.y);
    if (tile === 'W' && now - (bounce.get(me.id) ?? 0) > 700) { bounce.set(me.id, now); sounds.boing(); }
    if (tile === 'V' && now - lastSwitch > 1500) { lastSwitch = now; setLights(!lightsOn, name, true); }
    if (tile === 'B' && now - lastBell > 8000) { lastBell = now; net.bell(); sounds.bell(); toast('🔔 You rang the bell. Everyone to the Rocket!'); }
    // zone + status
    const z = zoneAt(me.x, me.y);
    const zid = z?.id ?? null;
    if (zid !== lastZone) { lastZone = zid; $('#zone').textContent = z ? `· ${z.name}` : ''; applyTranscription(); net.track(); }
    const away = now - lastInput > 5 * 60e3;
    me.status = away ? 'away' : z?.kind === 'room' ? 'meeting' : 'available';
    if (me.status !== lastStatus) { lastStatus = me.status; net.track(); }
    if (now - lastPeopleRender > 1000) {
      lastPeopleRender = now; renderPeople(); mesh.tick();
      const near = hearers().map(p => p.name); const e = $('#earshot');
      e.textContent = peers.size === 0 ? 'You are the only one here' : near.length ? `🔊 You can hear: ${near.join(', ')}` : '🚶 No one in earshot. Walk up to someone to talk.';
      e.classList.toggle('none', !near.length);
    }
    // draw
    const stage = canvas.parentElement!;
    const scale = Math.min(stage.clientWidth / (W * TILE), stage.clientHeight / (H * TILE), 1.25);
    const dpr = window.devicePixelRatio || 1;
    const cw = Math.floor(W * TILE * scale), chh = Math.floor(H * TILE * scale);
    if (canvas.width !== cw * dpr || canvas.height !== chh * dpr) { canvas.width = cw * dpr; canvas.height = chh * dpr; canvas.style.width = cw + 'px'; canvas.style.height = chh + 'px'; }
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    light += ((lightsOn ? 1 : 0) - light) * Math.min(1, dt * 3);
    draw(ctx, me, [...peers.values()], speakingNow, now, bounce, light, lightsOn);
  }
  requestAnimationFrame(frame);
}
