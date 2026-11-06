#!/usr/bin/env node
// Exports office_messages to one markdown file per London day in the shared TeamOS library.
// Usage: node scripts/export-office-log.mjs [YYYY-MM-DD ...]   (default: today and yesterday, Europe/London)
// Reads VITE_SUPABASE_URL / VITE_SUPABASE_KEY from .env next to this repo. Exits non-zero on failure so launchd logs it.
import { readFileSync, writeFileSync, renameSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const TZ = 'Europe/London';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const env = Object.fromEntries(readFileSync(join(root, '.env'), 'utf8').split('\n').filter(l => l.includes('=')).map(l => l.split('=').map(s => s.trim())));
const OUT = process.env.OFFICE_LOG_DIR ?? join(process.env.HOME ?? '', 'Library/CloudStorage/OneDrive-EarlyIdeasLimited/Team OS - Documents/TeamOS/co-owned/office/log');
const H = { apikey: env.VITE_SUPABASE_KEY, Authorization: `Bearer ${env.VITE_SUPABASE_KEY}` };

/** London calendar day -> [startUTC, endUTC) */
function dayBounds(day) {
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, timeZoneName: 'shortOffset' });
  const offsetAt = (d) => { const tz = fmt.formatToParts(d).find(p => p.type === 'timeZoneName').value; const m = /GMT([+-]\d+)?/.exec(tz); return m && m[1] ? Number(m[1]) : 0; };
  const start = new Date(`${day}T00:00:00Z`); start.setUTCHours(start.getUTCHours() - offsetAt(new Date(`${day}T12:00:00Z`)));
  const next = new Date(start.getTime() + 36 * 3600e3); const nextDay = londonDay(next);
  const end = new Date(`${nextDay}T00:00:00Z`); end.setUTCHours(end.getUTCHours() - offsetAt(new Date(`${nextDay}T12:00:00Z`)));
  return [start, end];
}
function londonDay(d) { const p = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d); const g = t => p.find(x => x.type === t).value; return `${g('year')}-${g('month')}-${g('day')}`; }

async function fetchDay(day) {
  const [start, end] = dayBounds(day);
  const rows = []; let after = start.toISOString(); let lastId = null;
  for (;;) {
    const q = `${env.VITE_SUPABASE_URL}/rest/v1/office_messages?select=*&created_at=gte.${after}&created_at=lt.${end.toISOString()}&order=created_at.asc,id.asc&limit=1000`;
    const r = await fetch(q, { headers: H });
    if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
    let page = await r.json();
    if (lastId) { const i = page.findIndex(m => m.id === lastId); if (i >= 0) page = page.slice(i + 1); }
    rows.push(...page);
    if (page.length < 999) break;
    after = page[page.length - 1].created_at; lastId = page[page.length - 1].id;
  }
  return rows;
}

function render(day, rows) {
  const offices = new Set(rows.map(m => m.office ?? ''));
  const lines = [`---`, `title: Office log ${day}`, `source: Tandem Office (virtual office)`, `generated: ${new Date().toISOString()}`, `messages: ${rows.length}`, `---`, ``, `# Office log, ${day}`, ``,
    `Everything typed or said (transcribed) in the Tandem Office. 🎙 = spoken, transcribed in the browser. Audience shows who could hear or read it. Times are ${TZ}.`, ``];
  for (const office of offices) {
    if (offices.size > 1) lines.push(``, `# Office ${office.slice(-8)}`, ``);
    let lastZone = undefined;
    for (const m of rows.filter(r => (r.office ?? '') === office)) {
      const t = new Date(m.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: TZ });
      if (m.kind === 'system') { lines.push(`- ${t} _${m.body}_`); continue; }
      const aud = m.audience === 'everyone' ? 'everyone' : m.audience === 'direct' ? `→ ${m.recipients?.[0] ?? '?'}` : (m.recipients?.length ? `→ ${m.recipients.join(', ')}` : 'nobody nearby');
      if (m.zone !== lastZone) { lines.push(``, `## ${m.zone ?? 'Corridor'}`, ``); lastZone = m.zone; }
      lines.push(`- ${t} ${m.kind === 'said' ? '🎙 ' : ''}**${m.sender}** (${aud}): ${m.body.replace(/\n/g, ' ')}`);
    }
  }
  return lines.join('\n') + '\n';
}

const days = process.argv.slice(2);
if (!days.length) { const now = new Date(); days.push(londonDay(now), londonDay(new Date(now.getTime() - 86400e3))); }
if (!existsSync(dirname(OUT))) { console.error(`TeamOS library not found at ${dirname(OUT)}; is OneDrive running?`); process.exit(2); }
mkdirSync(OUT, { recursive: true });
let failed = false;
for (const day of days) {
  try {
    const rows = await fetchDay(day);
    if (!rows.length) { console.log(`${day}: no messages`); continue; }
    const path = join(OUT, `${day}.md`), tmp = path + '.tmp';
    writeFileSync(tmp, render(day, rows)); renameSync(tmp, path);
    console.log(`wrote ${path} (${rows.length} messages)`);
  } catch (e) { failed = true; console.error(`${day}: export failed: ${e.message}`); }
}
process.exit(failed ? 1 : 0);
