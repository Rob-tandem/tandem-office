import { createClient, type RealtimeChannel } from '@supabase/supabase-js';
import type { Peer } from './state';

export interface ChatMessage {
  id?: string; created_at?: string;
  kind: 'text' | 'said' | 'system';
  sender: string; audience: 'nearby' | 'everyone' | 'direct';
  recipients: string[] | null;   // names; null = everyone
  zone: string | null; body: string;
}

export interface NetEvents {
  onPresence(peers: Peer[]): void;
  onMove(id: string, x: number, y: number): void;
  onSignal(from: string, to: string, data: any): void;
  onChat(m: ChatMessage): void;
}

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_KEY as string;
export const supabase = createClient(url, key, { realtime: { params: { eventsPerSecond: 40 } } });

async function channelName(passcode: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('tandem-office:' + passcode.trim().toLowerCase()));
  return 'office:' + Array.from(new Uint8Array(buf)).slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('');
}

export class Net {
  private ch!: RealtimeChannel;
  private lastSent = 0;
  constructor(private me: Peer, private ev: NetEvents) {}

  async join(passcode: string) {
    const name = await channelName(passcode);
    this.ch = supabase.channel(name, { config: { presence: { key: this.me.id }, broadcast: { self: false } } });
    this.ch
      .on('presence', { event: 'sync' }, () => {
        const state = this.ch.presenceState<Peer>();
        const peers: Peer[] = [];
        for (const k of Object.keys(state)) { const p = state[k][0]; if (p && p.id !== this.me.id) peers.push({ ...p }); }
        this.ev.onPresence(peers);
      })
      .on('broadcast', { event: 'pos' }, ({ payload }) => this.ev.onMove(payload.id, payload.x, payload.y))
      .on('broadcast', { event: 'rtc' }, ({ payload }) => { if (payload.to === this.me.id) this.ev.onSignal(payload.from, payload.to, payload.data); })
      .on('broadcast', { event: 'chat' }, ({ payload }) => this.ev.onChat(payload as ChatMessage));
    await new Promise<void>((res, rej) => {
      this.ch.subscribe(async (status, err) => {
        if (status === 'SUBSCRIBED') { await this.track(); res(); }
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') rej(err ?? new Error(status));
      });
    });
  }

  /** Re-send presence (identity, status, mute, current tile). */
  async track() {
    const { id, name, color, x, y, status, muted, transcribing } = this.me;
    await this.ch.track({ id, name, color, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, status, muted, transcribing });
  }

  /** Throttled to ~8 Hz. */
  sendPos(force = false) {
    const now = performance.now();
    if (!force && now - this.lastSent < 125) return;
    this.lastSent = now;
    this.ch.send({ type: 'broadcast', event: 'pos', payload: { id: this.me.id, x: this.me.x, y: this.me.y } });
  }

  signal(to: string, data: any) {
    this.ch.send({ type: 'broadcast', event: 'rtc', payload: { from: this.me.id, to, data } });
  }

  async chat(m: ChatMessage) {
    this.ch.send({ type: 'broadcast', event: 'chat', payload: m });
    const { error } = await supabase.from('office_messages').insert({
      kind: m.kind, sender: m.sender, audience: m.audience, recipients: m.recipients, zone: m.zone, body: m.body,
    });
    if (error) console.warn('office_messages insert failed', error.message);
  }

  async history(sinceHours = 24): Promise<ChatMessage[]> {
    const since = new Date(Date.now() - sinceHours * 3600e3).toISOString();
    const { data, error } = await supabase.from('office_messages').select('*').gte('created_at', since).order('created_at', { ascending: true }).limit(500);
    if (error) { console.warn('history failed', error.message); return []; }
    return (data ?? []) as ChatMessage[];
  }

  async leave() { try { await this.ch.untrack(); await supabase.removeChannel(this.ch); } catch {} }
}
