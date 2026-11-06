// Storybook Land. 44 x 26 tiles, 32 px each.
export const TILE = 32;
export const W = 44;
export const H = 26;

export type ZoneKind = 'open' | 'room' | 'quiet' | 'nook';
export interface Zone {
  id: string; name: string; kind: ZoneKind;
  x: number; y: number; w: number; h: number; floor: string; accent: string;
  art: string[];            // illustrations drawn in the zone (see DECOR for placement)
}

// Story-card palette: Navy #404A87, Ink #292E4D, Cream #FBF3E4, Coral #E5795E, Teal #63C6AC, Blue #74B3E4, Pink #F3A7C3, Yellow #F6BB47, Lavender #9BA0D9
export const ZONES: Zone[] = [
  // eight story nooks (desks)
  { id: 'castle',    name: 'Castle',         kind: 'nook', x: 1, y: 1,  w: 5, h: 5, floor: '#E6E4F5', accent: '#9BA0D9', art: ['castle', 'crown'] },
  { id: 'spaceship', name: 'Spaceship',      kind: 'nook', x: 7, y: 1,  w: 5, h: 5, floor: '#DCEBF7', accent: '#74B3E4', art: ['spaceship'] },
  { id: 'dinosaur',  name: 'Dinosaur Valley',kind: 'nook', x: 1, y: 7,  w: 5, h: 5, floor: '#DDF3EC', accent: '#63C6AC', art: ['dinosaur', 'egg'] },
  { id: 'farmyard',  name: 'Farmyard',       kind: 'nook', x: 7, y: 7,  w: 5, h: 5, floor: '#FBEFD2', accent: '#F6BB47', art: ['farmyard', 'chicken'] },
  { id: 'magictree', name: 'Magic Tree',     kind: 'nook', x: 1, y: 13, w: 5, h: 5, floor: '#E3F2DC', accent: '#63C6AC', art: ['magic-tree', 'bunny'] },
  { id: 'island',    name: 'Desert Island',  kind: 'nook', x: 7, y: 13, w: 5, h: 5, floor: '#FBE7D6', accent: '#E5795E', art: ['island', 'watermelon'] },
  { id: 'safari',    name: 'Safari',         kind: 'nook', x: 1, y: 19, w: 5, h: 5, floor: '#FBF0CC', accent: '#C8951A', art: ['lion', 'meerkat'] },
  { id: 'machines',  name: 'Big Machines',   kind: 'nook', x: 7, y: 19, w: 5, h: 5, floor: '#FADCDC', accent: '#B83A57', art: ['fire-engine', 'digger'] },
  // the middle
  { id: 'playground', name: 'Playground',    kind: 'open', x: 14, y: 1,  w: 16, h: 12, floor: '#D5F1EC', accent: '#63C6AC', art: ['park', 'rainbow', 'pet-dog', 'kitten', 'ice-cream'] },
  { id: 'cover',      name: 'Front Cover',   kind: 'open', x: 14, y: 14, w: 16, h: 11, floor: '#FBF3E4', accent: '#404A87', art: ['bell', 'box', 'lamp'] },
  // the right
  { id: 'rocket',    name: 'The Rocket',     kind: 'room', x: 31, y: 1,  w: 12, h: 7, floor: '#2B2F6B', accent: '#F6BB47', art: ['space', 'astronaut'] },
  { id: 'treehouse', name: 'The Treehouse',  kind: 'room', x: 31, y: 9,  w: 6,  h: 5, floor: '#E3F2DC', accent: '#0D8F84', art: ['magic-tree'] },
  { id: 'cave',      name: 'The Cave',       kind: 'room', x: 38, y: 9,  w: 5,  h: 5, floor: '#D9D6E3', accent: '#404A87', art: ['cave'] },
  { id: 'picnic',    name: 'The Picnic',     kind: 'open', x: 31, y: 15, w: 12, h: 5, floor: '#FBF0CC', accent: '#E5795E', art: ['cake', 'watermelon', 'egg'] },
  { id: 'nightsky',  name: 'Night Sky',      kind: 'quiet',x: 31, y: 21, w: 12, h: 4, floor: '#1B1E3B', accent: '#F6BB47', art: ['moon'] },
];

// Decorations: an illustration drawn at a tile position, s tiles wide. Not blocking unless `solid`.
export interface Decor { art: string; x: number; y: number; s: number; solid?: boolean }
export const DECOR: Decor[] = [
  // nooks: big hero image top-left, small companion bottom-right
  { art: 'castle', x: 1, y: 1.6, s: 2.6, solid: true }, { art: 'crown', x: 4.6, y: 1.1, s: 1.2 },
  { art: 'spaceship', x: 7, y: 1.6, s: 2.6, solid: true },
  { art: 'dinosaur', x: 1, y: 7.6, s: 2.6, solid: true }, { art: 'egg', x: 4.6, y: 7.1, s: 1.2 },
  { art: 'farmyard', x: 7, y: 7.6, s: 2.6, solid: true }, { art: 'chicken', x: 10.6, y: 7.1, s: 1.2 },
  { art: 'magic-tree', x: 1, y: 13.6, s: 2.6, solid: true }, { art: 'bunny', x: 4.6, y: 13.1, s: 1.2 },
  { art: 'island', x: 7, y: 13.6, s: 2.6, solid: true }, { art: 'watermelon', x: 10.6, y: 13.1, s: 1.2 },
  { art: 'lion', x: 1, y: 19.6, s: 2.6, solid: true }, { art: 'meerkat', x: 4.6, y: 19.1, s: 1.2 },
  { art: 'fire-engine', x: 7, y: 19.6, s: 2.6, solid: true }, { art: 'digger', x: 10.6, y: 19.1, s: 1.2 },
  // playground
  { art: 'rainbow', x: 20, y: 1.3, s: 5 }, { art: 'park', x: 15, y: 7.5, s: 3.5, solid: true },
  { art: 'pet-dog', x: 26, y: 9, s: 1.6 }, { art: 'kitten', x: 24, y: 3, s: 1.4 }, { art: 'ice-cream', x: 27.5, y: 3.5, s: 1.4 },
  // front cover
  { art: 'bell', x: 21, y: 21.5, s: 1.6 }, { art: 'box', x: 15, y: 22, s: 1.6 }, { art: 'lamp', x: 27.5, y: 22, s: 1.4 },
  // rooms
  { art: 'space', x: 31.5, y: 1.4, s: 2.6 }, { art: 'astronaut', x: 39.8, y: 1.4, s: 2.6 },
  { art: 'magic-tree', x: 31.3, y: 9.3, s: 2.2 },
  { art: 'cave', x: 38.2, y: 9.3, s: 2.4 },
  // picnic + night sky
  { art: 'cake', x: 32, y: 15.4, s: 2 }, { art: 'watermelon', x: 39.5, y: 15.4, s: 2 }, { art: 'egg', x: 36.3, y: 18.2, s: 1.2 },
  { art: 'moon', x: 31.5, y: 21.4, s: 2.6 },
];

// Tile codes: ' ' floor, '#' wall, 'D' desk, 'C' chair (walkable), 'T' table, 'S' sofa/blanket (walkable), 'W' swing (walkable, bouncy), 'L' slide, 'B' bell (walkable, rings), 'X' solid decoration
export const grid: string[][] = Array.from({ length: H }, () => Array(W).fill(' '));
function fill(x: number, y: number, w: number, h: number, c: string) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) grid[j][i] = c;
}
// outer walls
fill(0, 0, W, 1, '#'); fill(0, H - 1, W, 1, '#'); fill(0, 0, 1, H, '#'); fill(W - 1, 0, 1, H, '#');
// right-hand rooms
fill(30, 0, 1, 15, '#');                 // wall between centre and Rocket/Treehouse/Cave
fill(30, 20, 1, 6, '#');                 // wall between Front Cover and Night Sky
fill(31, 8, 12, 1, '#');                 // Rocket floor
fill(31, 14, 12, 1, '#');                // under Treehouse / Cave
fill(37, 9, 1, 5, '#');                  // between Treehouse and Cave
fill(31, 20, 12, 1, '#');                // over Night Sky
fill(30, 3, 1, 2, ' ');                  // Rocket door
fill(30, 11, 1, 2, ' ');                 // Treehouse door
fill(40, 14, 2, 1, ' ');                 // Cave door (from the Picnic)
fill(35, 20, 2, 1, ' ');                 // Night Sky door
// nook furniture: desk + chair in the bottom-left of each nook
for (const z of ZONES) if (z.kind === 'nook') { fill(z.x + 3, z.y + 3, 2, 1, 'D'); grid[z.y + 4][z.x + 3] = 'C'; }
// playground kit
fill(15, 3, 1, 1, 'W'); fill(17, 3, 1, 1, 'W');          // swings
fill(26, 6, 2, 1, 'L');                                     // slide
fill(20, 9, 4, 2, 'S');                                     // sandpit (walkable)
// rooms
fill(34, 3, 6, 2, 'T');                                     // Rocket table
fill(33, 11, 2, 1, 'T');                                    // Treehouse table
fill(39, 11, 2, 1, 'T');                                    // Cave table
fill(35, 16, 4, 2, 'S');                                    // picnic blanket
grid[22][21] = 'B';                                         // the bell
// solid decorations block their tiles
for (const d of DECOR) if (d.solid) for (let j = Math.floor(d.y); j < Math.ceil(d.y + d.s); j++) for (let i = Math.floor(d.x); i < Math.ceil(d.x + d.s); i++) if (grid[j]?.[i] === ' ') grid[j][i] = 'X';

export const SPAWN = { x: 22, y: 18.5 };
export const BELL = { x: 21.5, y: 22.5 };

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
export const NOOKS = ZONES.filter(z => z.kind === 'nook');

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
