import type { ChatMessage } from './net';

export type Audience = 'nearby' | 'everyone' | 'direct';

export class ChatPanel {
  audience: Audience = 'nearby';
  directTo: string | null = null;
  private list: HTMLElement; private input: HTMLInputElement; private tabs: HTMLElement; private hint: HTMLElement;
  private seen = new Set<string>();
  constructor(root: HTMLElement, private myName: string, private onSend: (body: string, audience: Audience, to: string | null) => void) {
    root.innerHTML = `
      <div class="chat-tabs" id="chat-tabs">
        <button data-a="nearby" class="on">Nearby</button>
        <button data-a="everyone">Everyone</button>
        <button data-a="direct">Direct</button>
      </div>
      <div class="chat-hint" id="chat-hint"></div>
      <div class="chat-list" id="chat-list"></div>
      <form class="chat-form" id="chat-form"><input id="chat-input" placeholder="Type a message…" autocomplete="off" maxlength="1000"><button>Send</button></form>`;
    this.list = root.querySelector('#chat-list')!; this.input = root.querySelector('#chat-input')!;
    this.tabs = root.querySelector('#chat-tabs')!; this.hint = root.querySelector('#chat-hint')!;
    this.tabs.addEventListener('click', e => {
      const b = (e.target as HTMLElement).closest('button'); if (!b) return;
      this.setAudience(b.dataset.a as Audience);
    });
    root.querySelector('#chat-form')!.addEventListener('submit', e => {
      e.preventDefault(); const body = this.input.value.trim(); if (!body) return;
      if (this.audience === 'direct' && !this.directTo) { this.setHint('Click a name in the people list to pick who to message.'); return; }
      this.onSend(body, this.audience, this.audience === 'direct' ? this.directTo : null); this.input.value = '';
    });
    // keep movement keys from firing while typing
    this.input.addEventListener('keydown', e => e.stopPropagation());
  }
  setAudience(a: Audience, to: string | null = this.directTo) {
    this.audience = a; this.directTo = to;
    this.tabs.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.a === a));
    this.setHint(a === 'nearby' ? 'Goes to whoever can hear you right now.' : a === 'everyone' ? 'Goes to everyone in the office.' : to ? `Direct message to ${to}.` : 'Click a name in the people list.');
    this.input.placeholder = a === 'direct' && to ? `Message ${to}…` : 'Type a message…';
  }
  setHint(t: string) { this.hint.textContent = t; }
  focus() { this.input.focus(); }

  add(m: ChatMessage) {
    const k = m.id ?? `${m.sender}|${m.body}|${m.created_at ?? ''}`;
    if (m.id && this.seen.has(k)) return; if (m.id) this.seen.add(k);
    const el = document.createElement('div');
    el.className = `msg ${m.kind} ${m.sender === this.myName ? 'me' : ''} ${m.audience}`;
    const when = m.created_at ? new Date(m.created_at) : new Date();
    const who = m.audience === 'direct' ? `${m.sender} → ${m.recipients?.[0] ?? ''}` : m.sender;
    const scope = m.audience === 'everyone' ? ' · everyone' : m.audience === 'nearby' && m.zone ? ` · ${m.zone}` : '';
    el.innerHTML = `<span class="meta">${esc(who)}${scope} · ${when.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span><span class="body">${m.kind === 'said' ? '🎙 ' : ''}${esc(m.body)}</span>`;
    this.list.appendChild(el); this.list.scrollTop = this.list.scrollHeight;
  }
}
function esc(s: string) { return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!)); }
