import { TILE, W, H, ZONES, DESKS, PROPS, FURN, grid, type Zone } from './map';
import type { Peer } from './state';

const NAVY = '#404A87', INK = '#292E4D', CREAM = '#FBF3E4';
const FONT = "'Baloo 2', sans-serif";
const EMOJI = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
const logo = new Image(); logo.src = './art/logo-tandem-multicolour.svg';

type Ctx = CanvasRenderingContext2D;
function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function circle(ctx: Ctx, x: number, y: number, r: number) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.closePath(); }
function soft(ctx: Ctx, on: boolean) { ctx.shadowColor = on ? 'rgba(41,46,77,0.18)' : 'transparent'; ctx.shadowBlur = on ? 10 : 0; ctx.shadowOffsetY = on ? 4 : 0; }
function emoji(ctx: Ctx, e: string, x: number, y: number, s: number) {
  ctx.font = `${Math.round(s * TILE * 0.8)}px ${EMOJI}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(e, (x + s / 2) * TILE, (y + s / 2) * TILE + 2);
}
const T = (n: number) => n * TILE;

let bg: HTMLCanvasElement | null = null;
export function invalidate() { bg = null; }
let waited = false;
export function whenArtReady(cb: () => void) {
  if (waited) return; waited = true;
  Promise.all([logo.decode().catch(() => {}), (document as any).fonts?.ready]).then(() => { invalidate(); cb(); });
}

/** The static floor, furniture and decoration, drawn once. */
function background(): HTMLCanvasElement {
  if (bg) return bg;
  const c = document.createElement('canvas'); c.width = W * TILE; c.height = H * TILE;
  const ctx = c.getContext('2d')!;
  // outside + floor
  ctx.fillStyle = '#2F3766'; ctx.fillRect(0, 0, c.width, c.height);
  soft(ctx, true); ctx.fillStyle = CREAM; rr(ctx, T(0.5), T(0.5), T(W - 1), T(H - 1), 28); ctx.fill(); soft(ctx, false);
  ctx.fillStyle = 'rgba(41,46,77,0.07)';
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { circle(ctx, T(x) + 16, T(y) + 16, 1.2); ctx.fill(); }

  // zone rugs
  for (const z of ZONES) {
    if (!z.tint) continue;
    ctx.fillStyle = z.tint;
    if (z.kind === 'room' || z.kind === 'quiet') { rr(ctx, T(z.x), T(z.y), T(z.w), T(z.h), 10); ctx.fill(); }
    else { rr(ctx, T(z.x) + 10, T(z.y) + 10, T(z.w) - 20, T(z.h) - 20, 40); ctx.fill(); }
    if (z.id === 'nightsky' || z.id === 'rocket') stars(ctx, z);
  }
  // desk rugs
  for (const d of DESKS) {
    ctx.fillStyle = d.color + '55'; circle(ctx, T(d.x + 2), T(d.y + 2.1), T(1.9)); ctx.fill();
    ctx.fillStyle = d.color + '33'; circle(ctx, T(d.x + 2), T(d.y + 2.1), T(1.45)); ctx.fill();
  }

  // glass walls
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (grid[y][x] !== '#' || x === 0 || y === 0 || x === W - 1 || y === H - 1) continue;
    const horiz = grid[y][x - 1] === '#' || grid[y][x + 1] === '#';
    const vert = grid[y - 1]?.[x] === '#' || grid[y + 1]?.[x] === '#';
    ctx.fillStyle = 'rgba(64,74,135,0.28)';
    if (horiz) ctx.fillRect(T(x), T(y) + 14, TILE, 4);
    if (vert) ctx.fillRect(T(x) + 14, T(y), 4, TILE);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    if (horiz) ctx.fillRect(T(x), T(y) + 15, TILE, 1);
    if (vert) ctx.fillRect(T(x) + 15, T(y), 1, TILE);
  }

  // playground kit
  const bp = FURN.ballpit; soft(ctx, true); ctx.fillStyle = '#fff'; rr(ctx, T(bp.x) + 4, T(bp.y) + 4, T(bp.w) - 8, T(bp.h) - 8, 22); ctx.fill(); soft(ctx, false);
  let seed = 7; const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const balls = ['#E5795E', '#63C6AC', '#74B3E4', '#F3A7C3', '#F6BB47', '#9BA0D9'];
  for (let i = 0; i < 46; i++) { ctx.fillStyle = balls[i % balls.length]; circle(ctx, T(bp.x) + 18 + rnd() * (T(bp.w) - 36), T(bp.y) + 18 + rnd() * (T(bp.h) - 36), 7); ctx.fill(); }
  const sl = FURN.slide; const x0 = T(sl.x) + 4, y0 = T(sl.y + sl.h) - 8, x1 = T(sl.x + sl.w) - 10, y1 = T(sl.y) + 10;
  soft(ctx, true); ctx.strokeStyle = '#F6BB47'; ctx.lineWidth = 22; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); soft(ctx, false);
  ctx.strokeStyle = '#E5795E'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x0 - 2, y0 - 12); ctx.lineTo(x1 - 2, y1 - 12); ctx.moveTo(x0 + 2, y0 + 12); ctx.lineTo(x1 + 2, y1 + 12); ctx.stroke();
  ctx.fillStyle = '#404A87'; rr(ctx, x1 - 8, y1 - 16, 22, 32, 6); ctx.fill();                       // top platform
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x1 - 4, y1 - 8 + i * 9); ctx.lineTo(x1 + 10, y1 - 8 + i * 9); ctx.stroke(); }
  const sp = FURN.sandpit; soft(ctx, true); ctx.fillStyle = '#F6DFA4'; circle(ctx, T(sp.x), T(sp.y), T(sp.r)); ctx.fill(); soft(ctx, false);
  ctx.fillStyle = 'rgba(200,149,26,0.35)'; for (let i = 0; i < 14; i++) { circle(ctx, T(sp.x) + Math.cos(i * 2.4) * T(sp.r) * 0.6 * ((i % 3) / 3 + 0.3), T(sp.y) + Math.sin(i * 2.4) * T(sp.r) * 0.6 * ((i % 4) / 4 + 0.3), 2); ctx.fill(); }
  // swing frame spanning both swings
  const s0 = FURN.swings[0], s1 = FURN.swings[FURN.swings.length - 1];
  ctx.strokeStyle = '#404A87'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(T(s0.x) - 6, T(s0.y) + 30); ctx.lineTo(T(s0.x) + 2, T(s0.y) + 4); ctx.lineTo(T(s1.x + 1) - 2, T(s1.y) + 4); ctx.lineTo(T(s1.x + 1) + 6, T(s1.y) + 30); ctx.stroke();
  for (const w of FURN.swings) {
    ctx.strokeStyle = '#6E4F08'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(T(w.x) + 9, T(w.y) + 5); ctx.lineTo(T(w.x) + 9, T(w.y) + 25); ctx.moveTo(T(w.x) + 23, T(w.y) + 5); ctx.lineTo(T(w.x) + 23, T(w.y) + 25); ctx.stroke();
    soft(ctx, true); ctx.fillStyle = '#E5795E'; rr(ctx, T(w.x) + 5, T(w.y) + 23, 22, 8, 4); ctx.fill(); soft(ctx, false);
  }
  // picnic blanket + tables
  const bl = FURN.blanket; soft(ctx, true); ctx.fillStyle = '#fff'; rr(ctx, T(bl.x) + 4, T(bl.y) + 4, T(bl.w) - 8, T(bl.h) - 8, 10); ctx.fill(); soft(ctx, false);
  ctx.fillStyle = 'rgba(229,121,94,0.45)';
  for (let j = 0; j < bl.h * 2; j++) for (let i = 0; i < bl.w * 2; i++) if ((i + j) % 2 === 0) ctx.fillRect(T(bl.x) + 4 + i * 16, T(bl.y) + 4 + j * 16, 16, 16);
  ctx.save(); rr(ctx, T(bl.x) + 4, T(bl.y) + 4, T(bl.w) - 8, T(bl.h) - 8, 10); ctx.clip(); ctx.fillStyle = CREAM; ctx.globalCompositeOperation = 'destination-over'; ctx.restore();
  for (const t of FURN.tables) {
    soft(ctx, true); ctx.fillStyle = '#fff'; rr(ctx, T(t.x) + 3, T(t.y) + 3, T(t.w) - 6, T(t.h) - 6, 18); ctx.fill(); soft(ctx, false);
    ctx.fillStyle = '#63C6AC'; rr(ctx, T(t.x) + 9, T(t.y) + 9, T(t.w) - 18, T(t.h) - 18, 14); ctx.fill();
    // chairs around
    const n = Math.max(2, Math.round((t.w + t.h) * 1.2)); const cx = T(t.x + t.w / 2), cy = T(t.y + t.h / 2);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2; const rx = T(t.w / 2) + 13, ry = T(t.h / 2) + 13;
      ctx.fillStyle = NAVY; circle(ctx, cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, 7); ctx.fill();
    }
  }
  for (const s of FURN.sofas) {
    soft(ctx, true); ctx.fillStyle = '#E5795E'; rr(ctx, T(s.x) + 2, T(s.y) + 4, T(s.w) - 4, T(s.h) - 6, 10); ctx.fill(); soft(ctx, false);
    ctx.fillStyle = '#C8573D'; rr(ctx, T(s.x) + 2, T(s.y) + 4, T(s.w) - 4, 8, 6); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; for (let i = 0; i < s.w; i++) rr(ctx, T(s.x + i) + 6, T(s.y) + 14, TILE - 12, 10, 4), ctx.fill();
  }
  for (const b of FURN.beanbags) { soft(ctx, true); ctx.fillStyle = b.c; circle(ctx, T(b.x) + 16, T(b.y) + 17, 13); ctx.fill(); soft(ctx, false); ctx.fillStyle = 'rgba(255,255,255,0.35)'; circle(ctx, T(b.x) + 13, T(b.y) + 13, 5); ctx.fill(); }

  // desks
  for (const d of DESKS) {
    const dx = T(d.x + 1), dy = T(d.y + 1);
    soft(ctx, true); ctx.fillStyle = '#fff'; rr(ctx, dx + 2, dy + 4, T(2) - 4, TILE - 6, 8); ctx.fill(); soft(ctx, false);
    ctx.fillStyle = d.color; rr(ctx, dx + 2, dy + 4, T(2) - 4, 5, 3); ctx.fill();
    ctx.fillStyle = INK; rr(ctx, dx + 20, dy + 10, 24, 14, 3); ctx.fill(); ctx.fillStyle = '#74B3E4'; rr(ctx, dx + 22, dy + 12, 20, 10, 2); ctx.fill();
    ctx.fillStyle = 'rgba(41,46,77,0.15)'; rr(ctx, dx + 8, dy + 20, 8, 5, 2); ctx.fill();  // mug
    // chair
    soft(ctx, true); ctx.fillStyle = d.color; circle(ctx, T(d.x + 1.5), T(d.y + 2.55), 10); ctx.fill(); soft(ctx, false);
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; circle(ctx, T(d.x + 1.5), T(d.y + 2.55), 5); ctx.fill();
    // theme prop
    emoji(ctx, d.emoji, d.x + 2.9, d.y + 0.6, 1.2);
  }
  // reception sign
  const lw = T(8), lh = logo.naturalWidth ? lw * logo.naturalHeight / logo.naturalWidth : lw * 0.195;
  const sx = T(14.5) - lw / 2 - 18, sy = T(20.35);
  soft(ctx, true); ctx.fillStyle = '#fff'; rr(ctx, sx, sy, lw + 36, lh + 26, 14); ctx.fill(); soft(ctx, false);
  if (logo.complete && logo.naturalWidth) ctx.drawImage(logo, sx + 18, sy + 13, lw, lh);
  // bell plinth
  const b = FURN.bell; ctx.fillStyle = 'rgba(246,187,71,0.35)'; circle(ctx, T(b.x) + 16, T(b.y) + 16, 16); ctx.fill();
  emoji(ctx, '🔔', b.x + 0.1, b.y - 0.05, 0.9);
  ctx.fillStyle = 'rgba(41,46,77,0.6)'; ctx.font = `700 10px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText('ring me', T(b.x) + 16, T(b.y + 1) + 1);

  // props
  for (const p of PROPS) emoji(ctx, p.e, p.x, p.y, p.s);

  // zone labels as pills
  for (const z of ZONES) {
    if (z.id === 'desks' || z.id === 'reception') continue;
    ctx.font = `700 12px ${FONT}`; const text = `${z.emoji}  ${z.name}`; const tw = ctx.measureText(text).width + 22;
    const px = T(z.x) + 14, py = T(z.y) + 12;
    soft(ctx, true); ctx.fillStyle = '#fff'; rr(ctx, px, py, tw, 22, 11); ctx.fill(); soft(ctx, false);
    ctx.fillStyle = INK; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(text, px + 11, py + 12);
  }
  bg = c; return c;
}

function stars(ctx: Ctx, z: Zone) {
  let seed = z.x * 7 + z.y * 13;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  for (let i = 0; i < z.w * z.h * 0.7; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.35 + rnd() * 0.6})`;
    circle(ctx, T(z.x) + 8 + rnd() * (T(z.w) - 16), T(z.y) + 8 + rnd() * (T(z.h) - 16), rnd() * 1.6 + 0.5); ctx.fill();
  }
}

export function draw(ctx: Ctx, me: Peer, peers: Peer[], speaking: Set<string>, now: number, bounce: Map<string, number>) {
  ctx.drawImage(background(), 0, 0);
  const all = [me, ...peers];
  // desk signposts
  for (const d of DESKS) {
    const names = all.filter(p => p.home === d.id).map(p => p.name);
    const label = names.length ? names.join(' · ') : d.name;
    ctx.font = `700 11px ${FONT}`; const tw = ctx.measureText(label).width + 14;
    const px = T(d.x + 2) - tw / 2, py = T(d.y + 3.55);
    ctx.fillStyle = names.length ? d.color : 'rgba(255,255,255,0.85)'; rr(ctx, px, py, tw, 17, 8); ctx.fill();
    ctx.fillStyle = names.length ? '#fff' : 'rgba(41,46,77,0.6)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, px + tw / 2, py + 9);
  }
  for (const p of [...peers, me]) drawAvatar(ctx, p, p === me, speaking.has(p.id), now, bounce.get(p.id) ?? 0);
}

function drawAvatar(ctx: Ctx, p: Peer, isMe: boolean, talking: boolean, now: number, bounceT: number) {
  const r = 13;
  const hop = bounceT > 0 ? Math.abs(Math.sin((now - bounceT) / 90)) * 10 * Math.max(0, 1 - (now - bounceT) / 600) : 0;
  const px = T(p.x), py = T(p.y) - hop;
  ctx.fillStyle = 'rgba(41,46,77,0.18)'; ctx.beginPath(); ctx.ellipse(px, T(p.y) + r - 1, r * 0.9, 4, 0, 0, Math.PI * 2); ctx.fill();
  if (talking) { ctx.strokeStyle = '#63C6AC'; ctx.lineWidth = 3 + Math.sin(now / 120) * 1.5; circle(ctx, px, py, r + 5); ctx.stroke(); }
  ctx.fillStyle = p.status === 'away' ? '#B8BCC9' : p.color; circle(ctx, px, py, r); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = isMe ? 3 : 2; circle(ctx, px, py, r); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = `700 12px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(initials(p.name), px, py + 1);
  if (p.muted) { ctx.fillStyle = '#B83A57'; circle(ctx, px + 10, py - 10, 5); ctx.fill(); }
  if (p.transcribing && !p.muted) { ctx.fillStyle = '#E5795E'; circle(ctx, px - 10, py - 10, 4); ctx.fill(); }
  ctx.font = `700 11px ${FONT}`;
  const label = `${p.mood ? p.mood + ' ' : ''}${p.name}${p.status === 'away' ? ' · away' : p.status === 'meeting' ? ' · in a meeting' : ''}`;
  const tw = ctx.measureText(label).width + 10;
  ctx.fillStyle = 'rgba(41,46,77,0.85)'; rr(ctx, px - tw / 2, py + r + 4, tw, 16, 6); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.fillText(label, px, py + r + 12);
}

export function initials(name: string) { return name.trim().split(/\s+/).map(s => s[0] ?? '').join('').slice(0, 2).toUpperCase(); }
