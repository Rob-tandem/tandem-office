import { createClient, type RealtimeChannel } from '@supabase/supabase-js';
import type { Peer } from './state';

export interface ChatMessage {
  id?: string; created_at?: string;
  kind: 'text' | 'said' | 'system';
  sender: string; audience: 'nearby' | 'everyone' | 'direct';
  recipients: string[] | null;   // names; null = everyone
  zone: string | null; body: string; office?: string;
}

export interface NetEvents {
  onPresence(peers: Peer[]): void;
  onMove(id: string, x: number, y: number): void;
  onSignal(from: string, to: string, data: any): void;
  onChat(m: ChatMessage): void;
  onBell(from: string): void;
  onLights(on: boolean, by: string): void;
}

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_KEY as string;
export const supabase = createClient(url, key, { realtime: { params: { eventsPerSecond: 40 }, heartbeatIntervalMs: 15000 } });

export const PASSCODE = 'itsgoodtotalk';
export const OFFICE = 'main';


export class Net {
  private ch!: RealtimeChannel;
  private lastSent = 0;
  office = OFFICE;
  /** Resolves after the first presence sync, so callers know who was already here. */
  synced!: Promise<void>;
  private firstSync!: () => void;
  private watchdog = 0;
  constructor(private me: Peer, private ev: NetEvents) { this.synced = new Promise(r => (this.firstSync = r)); }

  async join(passcode: string) {
    if (passcode.trim().toLowerCase() !== PASSCODE) throw new Error('wrong passcode');
    this.ch = supabase.channel('office:' + OFFICE, { config: { presence: { key: this.me.id }, broadcast: { self: false } } });
    this.ch
      .on('presence', { event: 'sync' }, () => {
        const state = this.ch.presenceState<Peer>();
        const peers: Peer[] = [];
        for (const k of Object.keys(state)) { const metas = state[k]; const p = metas[metas.length - 1]; if (p && p.id !== this.me.id) peers.push({ ...p }); }
        this.ev.onPresence(peers);
        this.firstSync();
      })
      .on('broadcast', { event: 'pos' }, ({ payload }) => this.ev.onMove(payload.id, payload.x, payload.y))
      .on('broadcast', { event: 'rtc' }, ({ payload }) => { if (payload.to === this.me.id) this.ev.onSignal(payload.from, payload.to, payload.data); })
      .on('broadcast', { event: 'chat' }, ({ payload }) => this.ev.onChat(payload as ChatMessage))
      .on('broadcast', { event: 'bell' }, ({ payload }) => this.ev.onBell(String(payload.from ?? '')))
      .on('broadcast', { event: 'lights' }, ({ payload }) => this.ev.onLights(!!payload.on, String(payload.by ?? '')));
    await new Promise<void>((res, rej) => {
      this.ch.subscribe(async (status, err) => {
        if (status === 'SUBSCRIBED') { await this.track(); res(); }
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') rej(err ?? new Error(status));
      });
    });
    // Watchdog: a dropped channel rejoins and re-tracks on its own. Checked every 2 s and when the tab comes back.
    const check = () => {
      const st = this.ch.state;
      if (st === 'closed' || st === 'errored') { console.warn('office channel', st, '- rejoining'); this.ch.subscribe(async s2 => { if (s2 === 'SUBSCRIBED') await this.track(); }); }
    };
    this.watchdog = window.setInterval(check, 2000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) { check(); this.track().catch(() => {}); } });
  }
  get state() { return this.ch?.state ?? 'none'; }

  /** Re-send presence (identity, status, mute, current tile). */
  async track() {
    const { id, name, color, mood, home, x, y, status, muted, transcribing, camera, lights } = this.me;
    await this.ch.track({ id, name, color, mood, home, camera: !!camera, lights: lights !== false, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, status, muted, transcribing });
  }

  /** Throttled to ~8 Hz. */
  sendPos(force = false) {
    const now = performance.now();
    if (!force && now - this.lastSent < 125) return;
    this.lastSent = now;
    this.ch.send({ type: 'broadcast', event: 'pos', payload: { id: this.me.id, x: this.me.x, y: this.me.y } });
  }

  lights(on: boolean) { this.ch.send({ type: 'broadcast', event: 'lights', payload: { on, by: this.me.name } }); }

  bell() { this.ch.send({ type: 'broadcast', event: 'bell', payload: { from: this.me.name } }); }

  signal(to: string, data: any) {
    this.ch.send({ type: 'broadcast', event: 'rtc', payload: { from: this.me.id, to, data } });
  }

  /** Broadcasts live, then stores. Resolves false if the row was not saved. */
  async chat(m: ChatMessage): Promise<boolean> {
    this.ch.send({ type: 'broadcast', event: 'chat', payload: m });
    const { error } = await supabase.from('office_messages').insert({
      office: this.office, kind: m.kind, sender: m.sender, audience: m.audience, recipients: m.recipients, zone: m.zone, body: m.body,
    });
    if (error) console.warn('office_messages insert failed', error.message);
    return !error;
  }

  async history(sinceHours = 24): Promise<ChatMessage[]> {
    const since = new Date(Date.now() - sinceHours * 3600e3).toISOString();
    const { data, error } = await supabase.from('office_messages').select('*').eq('office', this.office).gte('created_at', since).order('created_at', { ascending: false }).limit(2000);
    if (error) { console.warn('history failed', error.message); return []; }
    return ((data ?? []) as ChatMessage[]).reverse();
  }

  async leave() { clearInterval(this.watchdog); try { await this.ch.untrack(); await supabase.removeChannel(this.ch); } catch {} }
}
