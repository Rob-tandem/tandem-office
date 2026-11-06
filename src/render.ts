import { TILE, W, H, ZONES, grid } from './map';
import type { Peer } from './state';

const NAVY = '#404A87', INK = '#292E4D';
const FURN: Record<string, string> = { D: '#9BA0D9', T: '#63C6AC', S: '#E5795E', K: '#F6BB47', B: '#74B3E4' };

export function draw(ctx: CanvasRenderingContext2D, me: Peer, peers: Peer[], speaking: Set<string>, now: number) {
  // zones
  for (const z of ZONES) {
    ctx.fillStyle = z.floor;
    ctx.fillRect(z.x * TILE, z.y * TILE, z.w * TILE, z.h * TILE);
    ctx.fillStyle = 'rgba(41,46,77,0.45)';
    ctx.font = '700 13px 'Baloo 2', sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(z.name.toUpperCase(), z.x * TILE + 8, z.y * TILE + 6);
  }
  // subtle tile grid
  ctx.strokeStyle = 'rgba(41,46,77,0.06)'; ctx.lineWidth = 1;
  for (let i = 0; i <= W; i++) { ctx.beginPath(); ctx.moveTo(i * TILE, 0); ctx.lineTo(i * TILE, H * TILE); ctx.stroke(); }
  for (let j = 0; j <= H; j++) { ctx.beginPath(); ctx.moveTo(0, j * TILE); ctx.lineTo(W * TILE, j * TILE); ctx.stroke(); }
  // tiles
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = grid[y][x];
    if (c === ' ') continue;
    const px = x * TILE, py = y * TILE;
    if (c === '#') { ctx.fillStyle = NAVY; ctx.fillRect(px, py, TILE, TILE); continue; }
    if (c === 'P') {
      ctx.fillStyle = '#0D8F84'; ctx.beginPath(); ctx.arc(px + 16, py + 16, 11, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6E4F08'; ctx.fillRect(px + 12, py + 24, 8, 5); continue;
    }
    ctx.fillStyle = FURN[c] ?? '#ccc';
    ctx.strokeStyle = 'rgba(41,46,77,0.35)'; ctx.lineWidth = 2;
    ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
    ctx.strokeRect(px + 2, py + 2, TILE - 4, TILE - 4);
  }
  // avatars (others first, me on top)
  for (const p of [...peers, me]) drawAvatar(ctx, p, p === me, speaking.has(p.id), now);
}

function drawAvatar(ctx: CanvasRenderingContext2D, p: Peer, isMe: boolean, talking: boolean, now: number) {
  const px = p.x * TILE, py = p.y * TILE, r = 13;
  if (talking) {
    ctx.strokeStyle = '#63C6AC'; ctx.lineWidth = 3 + Math.sin(now / 120) * 1.5;
    ctx.beginPath(); ctx.arc(px, py, r + 5, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.fillStyle = p.status === 'away' ? '#B8BCC9' : p.color;
  ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = isMe ? INK : 'rgba(41,46,77,0.5)'; ctx.lineWidth = isMe ? 3 : 2;
  ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = '700 12px 'Baloo 2', sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(initials(p.name), px, py + 1);
  if (p.muted) { ctx.fillStyle = '#B83A57'; ctx.beginPath(); ctx.arc(px + 10, py - 10, 5, 0, Math.PI * 2); ctx.fill(); }
  if (p.transcribing && !p.muted) { ctx.fillStyle = '#E5795E'; ctx.beginPath(); ctx.arc(px - 10, py - 10, 4, 0, Math.PI * 2); ctx.fill(); }
  // name label
  ctx.font = '700 11px 'Baloo 2', sans-serif';
  const label = p.name + (p.status === 'away' ? ' · away' : p.status === 'meeting' ? ' · in a meeting' : '');
  const tw = ctx.measureText(label).width + 10;
  ctx.fillStyle = 'rgba(41,46,77,0.85)';
  roundRect(ctx, px - tw / 2, py + r + 4, tw, 16, 6); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.fillText(label, px, py + r + 12);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

export function initials(name: string) {
  return name.trim().split(/\s+/).map(s => s[0] ?? '').join('').slice(0, 2).toUpperCase();
}
