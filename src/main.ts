import { TILE, W, H, SPAWN, blocked, zoneAt, hearVolume } from './map';
import { draw } from './render';
import { COLORS, type Peer } from './state';
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
($('#name') as HTMLInputElement).value = localStorage.getItem('office.name') ?? '';
($('#passcode') as HTMLInputElement).value = localStorage.getItem('office.passcode') ?? '';
($('#transcribe') as HTMLInputElement).checked = localStorage.getItem('office.transcribe') !== 'off';

$('#enter-form').addEventListener('submit', async e => {
  e.preventDefault();
  const name = ($('#name') as HTMLInputElement).value.trim();
  const passcode = ($('#passcode') as HTMLInputElement).value;
  const tx = ($('#transcribe') as HTMLInputElement).checked;
  localStorage.setItem('office.name', name); localStorage.setItem('office.passcode', passcode);
  localStorage.setItem('office.colour', colour); localStorage.setItem('office.transcribe', tx ? 'on' : 'off');
  $('#enter-err').textContent = '';
  try { await enter(name, passcode, colour, tx); }
  catch (err: any) { $('#enter-err').textContent = 'Could not connect: ' + (err?.message ?? err); }
});

// ---------- the office ----------
async function enter(name: string, passcode: string, color: string, wantTranscripts: boolean) {
  const me: Peer = { id: myId, name, color, x: SPAWN.x, y: SPAWN.y, status: 'available', muted: true, transcribing: false };
  const peers = new Map<string, Peer>();
  let lastInput = performance.now();

  const mesh = new AudioMesh(myId, (to, data) => net.signal(to, data));
  const transcriber = new Transcriber(text => sendChat(text, 'nearby', null, 'said'));
  const chat = new ChatPanel($('#chat'), name, (body, audience, to) => sendChat(body, audience, to, 'text'));

  const net = new Net(me, {
    onPresence(list) {
      const ids = new Set(list.map(p => p.id));
      for (const p of list) {
        const cur = peers.get(p.id);
        if (cur) Object.assign(cur, { name: p.name, color: p.color, status: p.status, muted: p.muted, transcribing: p.transcribing });
        else peers.set(p.id, { ...p, tx: p.x, ty: p.y });
      }
      for (const id of [...peers.keys()]) if (!ids.has(id)) peers.delete(id);
      mesh.setPeers([...peers.keys()]);
      net.sendPos(true);
      renderPeople();
    },
    onMove(id, x, y) { const p = peers.get(id); if (p) { p.tx = x; p.ty = y; } },
    onSignal(from, _to, data) { mesh.onSignal(from, data); },
    onChat(m) { if (visibleToMe(m)) chat.add(m); },
  });

  await net.join(passcode);
  if (import.meta.env.DEV) (window as any).__office = { me, peers, mesh, net };
  await mesh.resume();
  $('#enter').classList.add('hidden'); $('#app').classList.remove('hidden');
  for (const m of await net.history()) if (visibleToMe(m)) chat.add(m);
  sendChat(`${name} entered the office`, 'everyone', null, 'system');

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
  function renderPeople() {
    const ul = $('#people'); ul.innerHTML = '';
    $('#count').textContent = `(${peers.size + 1})`;
    for (const p of [me, ...peers.values()]) {
      const li = document.createElement('li');
      const z = zoneAt(p.x, p.y);
      const dot = document.createElement('span'); dot.className = 'dot'; dot.style.background = COLORS.includes(p.color) ? p.color : '#999';
      const nm = document.createElement('span'); nm.textContent = `${p.name}${p === me ? ' (you)' : ''}${p.muted ? ' 🔇' : ''}`;
      const wh = document.createElement('span'); wh.className = 'where'; wh.textContent = p.status === 'away' ? 'away' : (z?.name ?? '');
      li.append(dot, nm, wh);
      if (p !== me) li.onclick = () => { chat.setAudience('direct', p.name); chat.focus(); };
      ul.appendChild(li);
    }
  }

  // ----- controls -----
  const micBtn = $('#mic'), txBtn = $('#tx');
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
  txBtn.onclick = () => { wantTranscripts = !wantTranscripts; localStorage.setItem('office.transcribe', wantTranscripts ? 'on' : 'off'); applyTranscription(); net.track(); };
  $('#leave').onclick = async () => { sendChat(`${name} left the office`, 'everyone', null, 'system'); await net.leave(); mesh.close(); transcriber.stop(); location.reload(); };
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
  let last = performance.now(), lastZone: string | null = null, lastStatus = me.status, lastPeopleRender = 0;
  function frame(now: number) {
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
    // audio volumes
    for (const p of peers.values()) mesh.setVolume(p.id, hearVolume(me.x, me.y, p.x, p.y));
    // zone + status
    const z = zoneAt(me.x, me.y);
    const zid = z?.id ?? null;
    if (zid !== lastZone) { lastZone = zid; $('#zone').textContent = z ? `· ${z.name}` : ''; applyTranscription(); net.track(); }
    const away = now - lastInput > 5 * 60e3;
    me.status = away ? 'away' : z?.kind === 'room' ? 'meeting' : 'available';
    if (me.status !== lastStatus) { lastStatus = me.status; net.track(); }
    if (now - lastPeopleRender > 1000) { lastPeopleRender = now; renderPeople(); mesh.tick(); }
    // draw
    const stage = canvas.parentElement!;
    const scale = Math.min(stage.clientWidth / (W * TILE), stage.clientHeight / (H * TILE), 1.25);
    const dpr = window.devicePixelRatio || 1;
    const cw = Math.floor(W * TILE * scale), chh = Math.floor(H * TILE * scale);
    if (canvas.width !== cw * dpr || canvas.height !== chh * dpr) { canvas.width = cw * dpr; canvas.height = chh * dpr; canvas.style.width = cw + 'px'; canvas.style.height = chh + 'px'; }
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    draw(ctx, me, [...peers.values()], mesh.speaking(), now);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
