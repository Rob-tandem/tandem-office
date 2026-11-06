// Storybook Land, open plan. 44 x 26 tiles, 32 px each.
export const TILE = 32;
export const W = 44;
export const H = 26;

export type ZoneKind = 'open' | 'room' | 'quiet';
export interface Zone { id: string; name: string; kind: ZoneKind; x: number; y: number; w: number; h: number; tint: string; emoji: string }

// Story-card palette: Navy #404A87, Ink #292E4D, Cream #FBF3E4, Coral #E5795E, Teal #63C6AC, Blue #74B3E4, Pink #F3A7C3, Yellow #F6BB47, Lavender #9BA0D9
export const ZONES: Zone[] = [
  { id: 'playground', name: 'Playground', kind: 'open',  x: 1,  y: 1,  w: 13, h: 9, tint: '#D5F1EC', emoji: '🎈' },
  { id: 'picnic',     name: 'The Picnic', kind: 'open',  x: 15, y: 1,  w: 14, h: 9, tint: '#FBF0CC', emoji: '🍉' },
  { id: 'rocket',     name: 'The Rocket', kind: 'room',  x: 31, y: 1,  w: 12, h: 8, tint: '#2B2F6B', emoji: '🚀' },
  { id: 'desks',      name: 'Desks',      kind: 'open',  x: 1,  y: 10, w: 28, h: 10, tint: '', emoji: '' },
  { id: 'treehouse',  name: 'The Treehouse', kind: 'room', x: 31, y: 10, w: 6, h: 5, tint: '#E3F2DC', emoji: '🌳' },
  { id: 'cave',       name: 'The Cave',   kind: 'room',  x: 38, y: 10, w: 5,  h: 5, tint: '#DCD9E6', emoji: '🪨' },
  { id: 'reception',  name: 'Reception',  kind: 'open',  x: 1,  y: 20, w: 28, h: 5, tint: '', emoji: '' },
  { id: 'nightsky',   name: 'Night Sky',  kind: 'quiet', x: 31, y: 16, w: 12, h: 9, tint: '#1B1E3B', emoji: '🌙' },
];

// Eight themed desks in two rows. Each unit is 4 x 4 tiles at (x, y).
export interface Desk { id: string; name: string; emoji: string; color: string; x: number; y: number }
export const DESKS: Desk[] = [
  { id: 'castle',    name: 'Castle',          emoji: '🏰', color: '#9BA0D9', x: 1,  y: 11 },
  { id: 'spaceship', name: 'Spaceship',       emoji: '🚀', color: '#74B3E4', x: 8,  y: 11 },
  { id: 'dinosaur',  name: 'Dinosaur Valley', emoji: '🦕', color: '#63C6AC', x: 15, y: 11 },
  { id: 'farmyard',  name: 'Farmyard',        emoji: '🐔', color: '#F6BB47', x: 22, y: 11 },
  { id: 'magictree', name: 'Magic Tree',      emoji: '🌳', color: '#8BD3A6', x: 1,  y: 16 },
  { id: 'island',    name: 'Desert Island',   emoji: '🏝️', color: '#F3A7C3', x: 8,  y: 16 },
  { id: 'safari',    name: 'Safari',          emoji: '🦁', color: '#E5795E', x: 15, y: 16 },
  { id: 'machines',  name: 'Big Machines',    emoji: '🚒', color: '#B83A57', x: 22, y: 16 },
];
export const NOOKS = DESKS;

// Props: an emoji placed at a tile position, size in tiles. Decoration only.
export interface Prop { e: string; x: number; y: number; s: number }
export const PROPS: Prop[] = [
  // playground
  { e: '🎈', x: 11.6, y: 1.2, s: 1.2 }, { e: '🧸', x: 2.2, y: 7.4, s: 1.3 }, { e: '🎨', x: 11.3, y: 7.6, s: 1.1 },
  // picnic
  { e: '🍉', x: 16.4, y: 1.4, s: 1.3 }, { e: '🧁', x: 26.6, y: 1.6, s: 1.1 }, { e: '🫖', x: 26.8, y: 7.4, s: 1.1 }, { e: '🌻', x: 16.2, y: 7.4, s: 1.2 },
  // rooms
  { e: '🛸', x: 40.2, y: 1.3, s: 1.5 }, { e: '🪐', x: 32, y: 6.2, s: 1.2 }, { e: '🌳', x: 31.3, y: 12.6, s: 1.3 }, { e: '🪨', x: 41.2, y: 13.3, s: 1.1 }, { e: '🕯️', x: 38.3, y: 10.4, s: 1 },
  // night sky
  { e: '🌙', x: 40.6, y: 16.4, s: 1.6 }, { e: '🔭', x: 31.6, y: 22.6, s: 1.4 },
  { e: '🪣', x: 6.2, y: 2.5, s: 0.8 },
  // desks
  { e: '🪴', x: 5.9, y: 13.2, s: 1.1 }, { e: '🪴', x: 19.9, y: 18.2, s: 1.1 }, { e: '📚', x: 12.8, y: 18.3, s: 1.1 }, { e: '🖨️', x: 26.4, y: 13.3, s: 1 },
  // reception
  { e: '🪴', x: 1.3, y: 20.3, s: 1.3 }, { e: '🪴', x: 27, y: 20.3, s: 1.3 }, { e: '🪴', x: 29.3, y: 0.3, s: 1.1 }, { e: '🪴', x: 13.7, y: 9.2, s: 1.1 },
];

// Tile codes: ' ' floor, '#' wall (glass, blocked), 'D' desk, 'C' chair, 'T' table, 'S' sofa, 'W' swing, 'L' slide, 'P' ball pit (walkable), 'B' bell, 'G' beanbag (walkable), 'K' picnic blanket (walkable), 'X' blocked decoration
export const grid: string[][] = Array.from({ length: H }, () => Array(W).fill(' '));
function fill(x: number, y: number, w: number, h: number, c: string) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) grid[j][i] = c; }
// outer edge
fill(0, 0, W, 1, '#'); fill(0, H - 1, W, 1, '#'); fill(0, 0, 1, H, '#'); fill(W - 1, 0, 1, H, '#');
// glass rooms on the right
fill(30, 0, 1, 16, '#'); fill(30, 9, 13, 1, '#'); fill(30, 15, 13, 1, '#'); fill(37, 9, 1, 7, '#');
fill(30, 4, 1, 2, ' ');            // Rocket door
fill(30, 12, 1, 2, ' ');           // Treehouse door
fill(39, 15, 2, 1, ' ');           // Cave door, from the Night Sky
fill(30, 16, 1, 10, '#'); fill(30, 19, 1, 2, ' '); // Night Sky door
export interface Rect { x: number; y: number; w: number; h: number }
export const FURN = {
  tables: [{ x: 34, y: 3, w: 5, h: 3 }, { x: 24, y: 3, w: 2, h: 2 }, { x: 33, y: 12, w: 2, h: 1 }, { x: 40, y: 12, w: 1, h: 1 }] as Rect[],
  sofas: [{ x: 4, y: 23, w: 3, h: 1 }, { x: 22, y: 23, w: 3, h: 1 }] as Rect[],
  ballpit: { x: 3, y: 5, w: 4, h: 3 } as Rect,
  blanket: { x: 18, y: 3, w: 4, h: 4 } as Rect,
  slide: { x: 9, y: 2, w: 3, h: 2 } as Rect,
  sandpit: { x: 6.5, y: 2.2, r: 1.1 },
  swings: [{ x: 2, y: 2 }, { x: 4, y: 2 }],
  beanbags: [{ x: 9, y: 6, c: '#F6BB47' }, { x: 11, y: 5, c: '#E5795E' }, { x: 33, y: 18, c: '#9BA0D9' }, { x: 36, y: 20, c: '#74B3E4' }, { x: 39, y: 18, c: '#F3A7C3' }, { x: 35, y: 22, c: '#63C6AC' }],
  bell: { x: 14, y: 23 },
  lightSwitch: { x: 29, y: 22 },
};
// desks
for (const d of DESKS) { fill(d.x + 1, d.y + 1, 2, 1, 'D'); grid[d.y + 2][d.x + 1] = 'C'; }
for (const r of FURN.tables) fill(r.x, r.y, r.w, r.h, 'T');
for (const r of FURN.sofas) fill(r.x, r.y, r.w, r.h, 'S');
fill(FURN.ballpit.x, FURN.ballpit.y, FURN.ballpit.w, FURN.ballpit.h, 'P');
fill(FURN.blanket.x, FURN.blanket.y, FURN.blanket.w, FURN.blanket.h, 'K');
fill(FURN.slide.x, FURN.slide.y, FURN.slide.w, FURN.slide.h, 'L');
for (const w of FURN.swings) grid[w.y][w.x] = 'W';
for (const b of FURN.beanbags) grid[b.y][b.x] = 'G';
grid[FURN.bell.y][FURN.bell.x] = 'B';
grid[FURN.lightSwitch.y][FURN.lightSwitch.x] = 'V';

export const SPAWN = { x: 14.5, y: 21.5 };

const SOLID = new Set(['#', 'D', 'T', 'L', 'X']);
export function blocked(tx: number, ty: number): boolean {
  if (tx < 0 || ty < 0 || tx >= W || ty >= H) return true;
  return SOLID.has(grid[ty][tx]);
}
export function tileAt(x: number, y: number): string { return grid[Math.floor(y)]?.[Math.floor(x)] ?? '#'; }
export function zoneAt(x: number, y: number): Zone | null {
  const tx = Math.floor(x), ty = Math.floor(y);
  for (const z of ZONES) if (tx >= z.x && tx < z.x + z.w && ty >= z.y && ty < z.y + z.h) return z;
  return null;
}
export const zoneById = (id: string) => ZONES.find(z => z.id === id) ?? null;

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
