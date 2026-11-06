import { TILE, W, H, ZONES, DECOR, grid, type Zone } from './map';
import type { Peer } from './state';

const NAVY = '#404A87', INK = '#292E4D';
const FONT = "'Baloo 2', sans-serif";
const images = new Map<string, HTMLImageElement>();
export function preload(names: string[]) {
  for (const n of new Set(names)) if (!images.has(n)) { const im = new Image(); im.src = `./art/${n}.png`; images.set(n, im); }
}
const logo = new Image(); logo.src = './art/logo-tandem-multicolour.svg';
preload(DECOR.map(d => d.art));

let bg: HTMLCanvasElement | null = null;
/** The static floor, walls, furniture and art, drawn once. */
function background(): HTMLCanvasElement {
  if (bg) return bg;
  const c = document.createElement('canvas'); c.width = W * TILE; c.height = H * TILE;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#2f3766'; ctx.fillRect(0, 0, c.width, c.height);
  for (const z of ZONES) {
    ctx.fillStyle = z.floor;
    roundRect(ctx, z.x * TILE + 2, z.y * TILE + 2, z.w * TILE - 4, z.h * TILE - 4, 14); ctx.fill();
    if (z.id === 'nightsky') stars(ctx, z);
    if (z.id === 'rocket') stars(ctx, z);
    if (z.id === 'cover') {
      // the Tandem logotype across the cover
      const lw = 9 * TILE, lh = lw * 0.26;
      if (logo.complete && logo.naturalWidth) ctx.drawImage(logo, (z.x + z.w / 2) * TILE - lw / 2, (z.y + 0.9) * TILE, lw, lh);
      ctx.fillStyle = 'rgba(41,46,77,0.55)'; ctx.font = `500 14px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText('Welcome to the office. Walk up to someone to talk.', (z.x + z.w / 2) * TILE, (z.y + 0.9) * TILE + lh + 6);
    }
    // zone label
    const dark = z.id === 'rocket' || z.id === 'nightsky';
    ctx.fillStyle = dark ? 'rgba(255,255,255,0.75)' : 'rgba(41,46,77,0.55)';
    ctx.font = `700 13px ${FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(z.name.toUpperCase(), z.x * TILE + 10, z.y * TILE + 7);
  }
  // tiles
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const t = grid[y][x]; const px = x * TILE, py = y * TILE;
    switch (t) {
      case '#': ctx.fillStyle = NAVY; ctx.fillRect(px, py, TILE, TILE); break;
      case 'D': ctx.fillStyle = '#C8951A'; roundRect(ctx, px + 2, py + 6, TILE - 4, TILE - 10, 5); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(px + 2, py + TILE - 8, TILE - 4, 4); break;
      case 'C': ctx.fillStyle = '#9BA0D9'; roundRect(ctx, px + 8, py + 8, TILE - 16, TILE - 14, 6); ctx.fill(); break;
      case 'T': ctx.fillStyle = '#63C6AC'; roundRect(ctx, px + 1, py + 4, TILE - 2, TILE - 8, 6); ctx.fill(); break;
      case 'S': ctx.fillStyle = 'rgba(229,121,94,0.35)'; roundRect(ctx, px + 1, py + 1, TILE - 2, TILE - 2, 8); ctx.fill();
        ctx.strokeStyle = 'rgba(229,121,94,0.6)'; ctx.setLineDash([4, 4]); ctx.strokeRect(px + 3, py + 3, TILE - 6, TILE - 6); ctx.setLineDash([]); break;
      case 'W': ctx.strokeStyle = '#6E4F08'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px + 8, py + 2); ctx.lineTo(px + 8, py + 22); ctx.moveTo(px + 24, py + 2); ctx.lineTo(px + 24, py + 22); ctx.stroke();
        ctx.fillStyle = '#E5795E'; ctx.fillRect(px + 5, py + 22, 22, 6); break;
      case 'L': ctx.fillStyle = '#F6BB47'; ctx.beginPath(); ctx.moveTo(px + 2, py + TILE - 4); ctx.lineTo(px + TILE - 2, py + 4); ctx.lineTo(px + TILE - 2, py + TILE - 4); ctx.closePath(); ctx.fill(); break;
      case 'B': ctx.fillStyle = 'rgba(246,187,71,0.35)'; ctx.beginPath(); ctx.arc(px + 16, py + 16, 15, 0, Math.PI * 2); ctx.fill(); break;
    }
  }
  // art
  for (const d of DECOR) {
    const im = images.get(d.art)!;
    if (im.complete && im.naturalWidth) ctx.drawImage(im, d.x * TILE, d.y * TILE, d.s * TILE, d.s * TILE);
  }
  ctx.fillStyle = 'rgba(41,46,77,0.7)'; ctx.font = `700 11px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('ring me', 21.5 * TILE, 23.6 * TILE);
  bg = c; return c;
}
export function invalidate() { bg = null; }
let waited = false;
export function whenArtReady(cb: () => void) {
  if (waited) return; waited = true;
  Promise.all([...images.values(), logo].map(im => im.decode().catch(() => {}))).then(() => { invalidate(); cb(); });
}

function stars(ctx: CanvasRenderingContext2D, z: Zone) {
  let seed = z.x * 7 + z.y * 13;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  for (let i = 0; i < z.w * z.h * 0.6; i++) { const x = z.x * TILE + rnd() * z.w * TILE, y = z.y * TILE + rnd() * z.h * TILE; const r = rnd() * 1.6 + 0.4; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
}

export function draw(ctx: CanvasRenderingContext2D, me: Peer, peers: Peer[], speaking: Set<string>, now: number, bounce: Map<string, number>) {
  ctx.drawImage(background(), 0, 0);
  // signposts: who calls each nook home
  const all = [me, ...peers];
  for (const z of ZONES) if (z.kind === 'nook') {
    const names = all.filter(p => p.home === z.id).map(p => p.name);
    if (!names.length) continue;
    ctx.font = `700 11px ${FONT}`; ctx.textAlign = 'right'; ctx.textBaseline = 'top';
    const label = names.join(' · '); const tw = ctx.measureText(label).width + 12;
    ctx.fillStyle = z.accent; roundRect(ctx, (z.x + z.w) * TILE - 6 - tw, z.y * TILE + 6, tw, 17, 6); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillText(label, (z.x + z.w) * TILE - 12, z.y * TILE + 8);
  }
  for (const p of [...peers, me]) drawAvatar(ctx, p, p === me, speaking.has(p.id), now, bounce.get(p.id) ?? 0);
}

function drawAvatar(ctx: CanvasRenderingContext2D, p: Peer, isMe: boolean, talking: boolean, now: number, bounceT: number) {
  const r = 13;
  const hop = bounceT > 0 ? Math.abs(Math.sin((now - bounceT) / 90)) * 10 * Math.max(0, 1 - (now - bounceT) / 600) : 0;
  const px = p.x * TILE, py = p.y * TILE - hop;
  ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(px, p.y * TILE + r - 2, r * 0.9, 4, 0, 0, Math.PI * 2); ctx.fill();
  if (talking) {
    ctx.strokeStyle = '#63C6AC'; ctx.lineWidth = 3 + Math.sin(now / 120) * 1.5;
    ctx.beginPath(); ctx.arc(px, py, r + 5, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.fillStyle = p.status === 'away' ? '#B8BCC9' : p.color;
  ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = isMe ? '#fff' : 'rgba(255,255,255,0.7)'; ctx.lineWidth = isMe ? 3 : 2;
  ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = `700 12px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(initials(p.name), px, py + 1);
  if (p.muted) { ctx.fillStyle = '#B83A57'; ctx.beginPath(); ctx.arc(px + 10, py - 10, 5, 0, Math.PI * 2); ctx.fill(); }
  if (p.transcribing && !p.muted) { ctx.fillStyle = '#E5795E'; ctx.beginPath(); ctx.arc(px - 10, py - 10, 4, 0, Math.PI * 2); ctx.fill(); }
  ctx.font = `700 11px ${FONT}`;
  const label = `${p.mood ? p.mood + ' ' : ''}${p.name}${p.status === 'away' ? ' · away' : p.status === 'meeting' ? ' · in a meeting' : ''}`;
  const tw = ctx.measureText(label).width + 10;
  ctx.fillStyle = 'rgba(41,46,77,0.85)'; roundRect(ctx, px - tw / 2, py + r + 4, tw, 16, 6); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.fillText(label, px, py + r + 12);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
export function initials(name: string) {
  return name.trim().split(/\s+/).map(s => s[0] ?? '').join('').slice(0, 2).toUpperCase();
}
export { INK };
