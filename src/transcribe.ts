// Browser speech-to-text (Chrome / Edge). Each final sentence goes to onLine.
export class Transcriber {
  private rec: any = null;
  private wanted = false;
  readonly supported: boolean;
  constructor(private onLine: (text: string) => void) {
    this.supported = !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }
  start() {
    if (!this.supported || this.rec) return;
    const R = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const r = new R(); r.continuous = true; r.interimResults = false; r.lang = 'en-GB';
    r.onresult = (e: any) => {
      if (!this.wanted) return;
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) { const t = e.results[i][0].transcript.trim(); if (t) this.onLine(t); }
      }
    };
    r.onend = () => { this.rec = null; if (this.wanted) setTimeout(() => this.start(), 300); };
    r.onerror = (e: any) => { if (e.error === 'not-allowed') this.wanted = false; };
    this.wanted = true; this.rec = r;
    try { r.start(); } catch { this.rec = null; }
  }
  stop() { this.wanted = false; try { this.rec?.abort(); } catch {} this.rec = null; }
  get running() { return this.wanted; }
}
