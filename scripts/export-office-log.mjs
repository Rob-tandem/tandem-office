#!/usr/bin/env node
// Exports office_messages to one markdown file per day in the shared TeamOS library.
// Usage: node scripts/export-office-log.mjs [YYYY-MM-DD]   (default: today and yesterday)
// Reads VITE_SUPABASE_URL / VITE_SUPABASE_KEY from .env next to this repo.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const env = Object.fromEntries(readFileSync(join(root, '.env'), 'utf8').split('\n').filter(l => l.includes('=')).map(l => l.split('=').map(s => s.trim())));
const OUT = process.env.OFFICE_LOG_DIR ?? '/Users/robhughesmbp/Library/CloudStorage/OneDrive-EarlyIdeasLimited/Team OS - Documents/TeamOS/co-owned/office/log';

async function fetchDay(day) {
  const start = new Date(day + 'T00:00:00Z'), end = new Date(start.getTime() + 86400e3);
  const q = `${env.VITE_SUPABASE_URL}/rest/v1/office_messages?select=*&created_at=gte.${start.toISOString()}&created_at=lt.${end.toISOString()}&order=created_at.asc&limit=5000`;
  const r = await fetch(q, { headers: { apikey: env.VITE_SUPABASE_KEY, Authorization: `Bearer ${env.VITE_SUPABASE_KEY}` } });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.json();
}

function render(day, rows) {
  const lines = [`---`, `title: Office log ${day}`, `source: Tandem Office (virtual office)`, `generated: ${new Date().toISOString()}`, `messages: ${rows.length}`, `---`, ``, `# Office log, ${day}`, ``,
    `Everything typed or said (transcribed) in the Tandem Office. 🎙 = spoken, transcribed in the browser. Audience shows who could hear or read it.`, ``];
  let lastZone = null;
  for (const m of rows) {
    const t = new Date(m.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' });
    if (m.kind === 'system') { lines.push(`- ${t} _${m.body}_`); continue; }
    const aud = m.audience === 'everyone' ? 'everyone' : m.audience === 'direct' ? `→ ${m.recipients?.[0] ?? '?'}` : (m.recipients?.length ? `→ ${m.recipients.join(', ')}` : 'nobody nearby');
    if (m.zone !== lastZone) { lines.push(``, `## ${m.zone ?? 'Corridor'}`, ``); lastZone = m.zone; }
    lines.push(`- ${t} ${m.kind === 'said' ? '🎙 ' : ''}**${m.sender}** (${aud}): ${m.body.replace(/\n/g, ' ')}`);
  }
  return lines.join('\n') + '\n';
}

const days = process.argv.slice(2);
if (!days.length) { const d = new Date(); days.push(d.toISOString().slice(0, 10)); d.setUTCDate(d.getUTCDate() - 1); days.push(d.toISOString().slice(0, 10)); }
if (!existsSync(dirname(OUT))) { console.error('TeamOS library not synced here; skipping'); process.exit(0); }
mkdirSync(OUT, { recursive: true });
for (const day of days) {
  let rows;
  try { rows = await fetchDay(day); } catch (e) { console.error(`office_messages not readable (${e.message}); is the migration applied?`); process.exit(0); }
  if (!rows.length) continue;
  const path = join(OUT, `${day}.md`);
  writeFileSync(path, render(day, rows));
  console.log(`wrote ${path} (${rows.length} messages)`);
}
