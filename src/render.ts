import { TILE, W, H, ZONES, DESKS, FURN } from './map';
import type { Peer } from './state';

const INK = '#292E4D', MUTED = '#6B7084';
const FONT = "'Baloo 2', sans-serif";
// The static floor is one SVG (public/floor.svg), drawn from the design artboard at 1 tile = 32 px.
// Text needs the Baloo 2 web font, which an SVG image cannot load, so labels are drawn here.
const floor = new Image(); floor.src = './floor.svg';

type Ctx = CanvasRenderingContext2D;
function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function circle(ctx: Ctx, x: number, y: number, r: number) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.closePath(); }
const T = (n: number) => n * TILE;

/** CSS box-shadow 0 dy blur rgba(41,46,77,a). Canvas shadows ignore the transform, so scale by the pixel ratio. */
function shadow(ctx: Ctx, dy: number, blur: number, a: number) {
  const s = ctx.getTransform().a;
  ctx.shadowColor = `rgba(41,46,77,${a})`; ctx.shadowBlur = blur * s; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = dy * s;
}
function noShadow(ctx: Ctx) { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; }

/** Baseline that puts one line of text where CSS centres it in a box of height h (line-height: normal). */
function baseline(ctx: Ctx, text: string, top: number, h: number) {
  const m = ctx.measureText(text);
  const asc = m.fontBoundingBoxAscent ?? 0, desc = m.fontBoundingBoxDescent ?? 0;
  return asc ? top + (h - asc - desc) / 2 + asc : top + h / 2 + 4;
}

/** The design's label pill: white, 24 px high, coloured dot, Baloo 2 700 12px. */
function zonePill(ctx: Ctx, text: string, dot: string, x: number, y: number) {
  ctx.font = `700 12px ${FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  const w = 10 + 8 + 8 + ctx.measureText(text).width + 12;
  shadow(ctx, 3, 10, 0.14); ctx.fillStyle = '#fff'; rr(ctx, x, y, w, 24, 12); ctx.fill(); noShadow(ctx);
  ctx.fillStyle = dot; circle(ctx, x + 14, y + 12, 4); ctx.fill();
  ctx.fillStyle = INK; ctx.fillText(text, x + 26, baseline(ctx, text, y, 24));
}

// Zone pill dot colours, from the design.
const PILL_DOT: Record<string, string> = {
  playground: '#63C6AC', picnic: '#F6BB47', rocket: '#F6BB47', treehouse: '#0D8F84', cave: '#404A87', nightsky: '#F6BB47',
};

let bg: HTMLCanvasElement | null = null;
export function invalidate() { bg = null; }
let waited = false;
export function whenArtReady(cb: () => void) {
  if (waited) return; waited = true;
  Promise.all([floor.decode().catch(() => {}), (document as any).fonts?.ready]).then(() => { invalidate(); cb(); });
}

/** The static floor and its labels, cached at device resolution (s = device pixels per floor pixel). */
function background(s: number): HTMLCanvasElement {
  if (bg && bg.width === Math.round(W * TILE * s)) return bg;
  const c = document.createElement('canvas'); c.width = Math.round(W * TILE * s); c.height = Math.round(H * TILE * s);
  const ctx = c.getContext('2d')!;
  ctx.setTransform(s, 0, 0, s, 0, 0);
  if (floor.complete && floor.naturalWidth) ctx.drawImage(floor, 0, 0, W * TILE, H * TILE);
  else { ctx.fillStyle = '#2F3766'; ctx.fillRect(0, 0, W * TILE, H * TILE); }

  // zone label pills: open zones 14 px in, rooms 12 px in, 12 px down
  for (const z of ZONES) {
    const dot = PILL_DOT[z.id]; if (!dot) continue;
    zonePill(ctx, z.name, dot, T(z.x) + (z.kind === 'open' ? 14 : 12), T(z.y) + 12);
  }
  // bell label
  const b = FURN.bell;
  ctx.font = `700 10px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = MUTED;
  const m = ctx.measureText('ring me');
  ctx.fillText('ring me', T(b.x) + 16, T(b.y + 1) + 2 + (m.fontBoundingBoxAscent ?? 10));
  bg = c; return c;
}

export function draw(ctx: Ctx, me: Peer, peers: Peer[], speaking: Set<string>, now: number, bounce: Map<string, number>, light = 1, lightsOn = true) {
  const s = ctx.getTransform().a || 1;
  ctx.drawImage(background(s), 0, 0, W * TILE, H * TILE);
  drawLights(ctx, light, lightsOn);
  const all = [me, ...peers];
  // desk signposts: white with grey text when free, the desk colour with white text when someone sits there
  for (const d of DESKS) {
    const names = all.filter(p => p.home === d.id).map(p => p.name);
    const label = names.length ? names.join(' · ') : d.name;
    ctx.font = `700 11px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    const tw = ctx.measureText(label).width + 18;
    const px = T(d.x + 2) - tw / 2, py = T(d.y) + 114;
    shadow(ctx, 3, 10, 0.14); ctx.fillStyle = names.length ? d.color : '#fff'; rr(ctx, px, py, tw, 18, 9); ctx.fill(); noShadow(ctx);
    ctx.fillStyle = names.length ? '#fff' : MUTED; ctx.fillText(label, px + tw / 2, baseline(ctx, label, py, 18));
  }
  for (const p of [...peers, me]) drawAvatar(ctx, p, p === me, speaking.has(p.id), now, bounce.get(p.id) ?? 0);
}

/** Night mode: a navy wash over the floor, warm lamp glows at the desks and the sign, and the wall switch. */
function drawLights(ctx: Ctx, light: number, lightsOn: boolean) {
  const dark = 1 - light;
  if (dark > 0.01) {
    ctx.fillStyle = `rgba(27,30,59,${(0.78 * dark).toFixed(3)})`; ctx.fillRect(0, 0, T(W), T(H));
    const glow = (x: number, y: number, r: number, a: number) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(246,187,71,${a})`); g.addColorStop(1, 'rgba(246,187,71,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    };
    for (const d of DESKS) glow(T(d.x + 1.45), T(d.y + 1.45), 58, 0.55 * dark);
    glow(T(14.5), T(21.5), 120, 0.35 * dark);
    glow(T(FURN.bell.x + 0.5), T(FURN.bell.y + 0.5), 30, 0.5 * dark);
  }
  const sw = FURN.lightSwitch; const x = T(sw.x) + 6, y = T(sw.y) + 2;
  shadow(ctx, 3, 10, 0.14); ctx.fillStyle = '#fff'; rr(ctx, x, y, 20, 28, 5); ctx.fill(); noShadow(ctx);
  ctx.fillStyle = lightsOn ? '#F6BB47' : '#B8BCC9'; rr(ctx, x + 6, y + (lightsOn ? 5 : 13), 8, 10, 3); ctx.fill();
  ctx.fillStyle = 'rgba(41,46,77,0.6)'; ctx.font = `700 9px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText('lights', x + 10, y + 30);
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
