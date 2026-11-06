// Tiny synth sounds so there are no audio files to ship. All go through one AudioContext.
let ctx: AudioContext | null = null;
function ac() { ctx ??= new AudioContext(); if (ctx.state === 'suspended') ctx.resume(); return ctx; }
function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.12) {
  const c = ac(); const o = c.createOscillator(); const g = c.createGain();
  o.type = type; o.frequency.value = freq; o.connect(g); g.connect(c.destination);
  const t = c.currentTime + start; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.start(t); o.stop(t + dur + 0.05);
}
export const sounds = {
  /** Door chime: someone entered the office. */
  chime() { tone(660, 0, 0.35); tone(880, 0.18, 0.5); },
  /** Soft pop: someone walked into earshot. */
  pop() { tone(520, 0, 0.12, 'triangle', 0.08); },
  /** The lobby bell: everyone, come to the Rocket. */
  bell() { for (let i = 0; i < 3; i++) { tone(1320, i * 0.45, 0.8, 'sine', 0.15); tone(1980, i * 0.45, 0.4, 'sine', 0.05); } },
  /** Swing bounce. */
  boing() { const c = ac(); const o = c.createOscillator(); const g = c.createGain(); o.type = 'sine'; o.connect(g); g.connect(c.destination);
    const t = c.currentTime; o.frequency.setValueAtTime(300, t); o.frequency.exponentialRampToValueAtTime(600, t + 0.15); g.gain.setValueAtTime(0.1, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3); o.start(t); o.stop(t + 0.35); },
};
