// The office floor. 40 x 24 tiles, 32 px each.
export const TILE = 32;
export const W = 40;
export const H = 24;

export type ZoneKind = 'open' | 'room' | 'quiet';
export interface Zone {
  id: string; name: string; kind: ZoneKind;
  x: number; y: number; w: number; h: number; floor: string;
}

export const ZONES: Zone[] = [
  { id: 'desks',     name: 'Desks',         kind: 'open',  x: 1,  y: 1,  w: 22, h: 11, floor: '#FBF3E4' },
  { id: 'lobby',     name: 'Lobby',         kind: 'open',  x: 1,  y: 13, w: 22, h: 5,  floor: '#EEF0FA' },
  { id: 'garden',    name: 'Quiet Garden',  kind: 'quiet', x: 1,  y: 19, w: 22, h: 4,  floor: '#D5F1EC' },
  { id: 'castle',    name: 'Castle room',   kind: 'room',  x: 24, y: 1,  w: 15, h: 5,  floor: '#E3EEFA' },
  { id: 'spaceship', name: 'Spaceship room',kind: 'room',  x: 24, y: 7,  w: 15, h: 5,  floor: '#F8DCE3' },
  { id: 'kitchen',   name: 'Kitchen',       kind: 'open',  x: 24, y: 13, w: 15, h: 5,  floor: '#FBF0CC' },
  { id: 'library',   name: 'Library',       kind: 'open',  x: 24, y: 19, w: 15, h: 4,  floor: '#FBE7E1' },
];

// Tile codes: ' ' floor, '#' wall, 'D' desk, 'T' table, 'S' sofa, 'P' plant, 'K' counter, 'B' bookcase
export const grid: string[][] = Array.from({ length: H }, () => Array(W).fill(' '));
function fill(x: number, y: number, w: number, h: number, c: string) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) grid[j][i] = c;
}
// walls
fill(0, 0, W, 1, '#'); fill(0, H - 1, W, 1, '#'); fill(0, 0, 1, H, '#'); fill(W - 1, 0, 1, H, '#');
fill(23, 0, 1, H, '#');
fill(0, 12, 23, 1, '#'); fill(0, 18, 23, 1, '#');
fill(23, 6, 16, 1, '#'); fill(23, 12, 16, 1, '#'); fill(23, 18, 16, 1, '#');
// doors
fill(9, 12, 3, 1, ' '); fill(9, 18, 3, 1, ' ');          // desks <-> lobby <-> garden
fill(23, 3, 1, 1, ' '); fill(23, 9, 1, 1, ' ');           // castle, spaceship
fill(23, 15, 1, 1, ' '); fill(23, 20, 1, 2, ' ');         // kitchen, library
fill(30, 18, 2, 1, ' ');                                   // kitchen <-> library
// desks: 2x1, four columns, four rows
for (const y of [2, 4, 6, 8, 10]) for (const x of [3, 7, 11, 15, 19]) fill(x, y, 2, 1, 'D');
// meeting tables
fill(28, 2, 5, 2, 'T'); fill(28, 8, 5, 2, 'T');
// kitchen
fill(27, 14, 1, 3, 'K'); fill(30, 14, 2, 2, 'T'); fill(35, 15, 3, 1, 'S');
// library
fill(38 - 1, 19, 1, 4, 'B'); fill(26, 21, 3, 1, 'S');
// garden plants
for (const [x, y] of [[2, 19], [6, 22], [12, 20], [17, 19], [21, 22], [15, 22]]) grid[y][x] = 'P';

export const SPAWN = { x: 11.5, y: 15.5 };

export function blocked(tx: number, ty: number): boolean {
  if (tx < 0 || ty < 0 || tx >= W || ty >= H) return true;
  return grid[ty][tx] !== ' ';
}

export function zoneAt(x: number, y: number): Zone | null {
  const tx = Math.floor(x), ty = Math.floor(y);
  for (const z of ZONES) if (tx >= z.x && tx < z.x + z.w && ty >= z.y && ty < z.y + z.h) return z;
  return null;
}

/** Audio rules from the spec, section 6. Returns 0..1. */
export function hearVolume(ax: number, ay: number, bx: number, by: number): number {
  const za = zoneAt(ax, ay), zb = zoneAt(bx, by);
  if (za?.kind === 'quiet' || zb?.kind === 'quiet') return 0;
  if (za?.kind === 'room' || zb?.kind === 'room') return za && zb && za.id === zb.id ? 1 : 0;
  const d = Math.hypot(ax - bx, ay - by);
  if (d <= 2) return 1;
  if (d >= 5) return 0;
  return 1 - (d - 2) / 3;
}
