// WebRTC mesh for audio. One RTCPeerConnection per other person.
// Uses the "perfect negotiation" pattern: the peer with the lower id is polite.
// Swap this file for a LiveKit client when video arrives; main.ts only uses the public methods.

const ICE = { iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }] };

interface Conn { pc: RTCPeerConnection; audio: HTMLAudioElement; video: HTMLVideoElement | null; makingOffer: boolean; ignoreOffer: boolean; analyser?: AnalyserNode; offerSince?: number; retries: number; pending: RTCIceCandidateInit[]; videoSender?: RTCRtpSender; }

export class AudioMesh {
  private conns = new Map<string, Conn>();
  private stream: MediaStream | null = null;
  private camStream: MediaStream | null = null;
  /** Called when a peer's video tile should appear or go; the host places the element. */
  onVideo: (id: string, el: HTMLVideoElement | null) => void = () => {};
  private ctx: AudioContext | null = null;
  private localAnalyser: AnalyserNode | null = null;
  private volumes = new Map<string, number>();

  constructor(private myId: string, private send: (to: string, data: any) => void) {}

  get hasMic() { return !!this.stream; }
  get hasCamera() { return !!this.camStream; }
  get cameraStream() { return this.camStream; }
  get micStream() { return this.stream; }

  async enableMic(): Promise<boolean> {
    if (this.stream) return true;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    } catch (e) { console.warn('mic denied', e); return false; }
    this.ctx ??= new AudioContext();
    const src = this.ctx.createMediaStreamSource(this.stream);
    this.localAnalyser = this.ctx.createAnalyser(); this.localAnalyser.fftSize = 512;
    src.connect(this.localAnalyser);
    for (const [, c] of this.conns) for (const t of this.stream.getAudioTracks()) c.pc.addTrack(t, this.stream);
    return true;
  }

  /** Option 1 video: a small camera track into the same mesh. Fine for a handful of people. */
  async enableCamera(): Promise<boolean> {
    if (this.camStream) return true;
    try { this.camStream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 320 }, height: { ideal: 240 }, frameRate: { ideal: 15, max: 20 }, facingMode: 'user' } }); }
    catch (e) { console.warn('camera denied', e); return false; }
    const track = this.camStream.getVideoTracks()[0];
    for (const [, c] of this.conns) c.videoSender = c.pc.addTrack(track, this.camStream);
    return true;
  }
  disableCamera() {
    if (!this.camStream) return;
    for (const [, c] of this.conns) { if (c.videoSender) { try { c.pc.removeTrack(c.videoSender); } catch {} c.videoSender = undefined; } }
    this.camStream.getTracks().forEach(t => t.stop()); this.camStream = null;
  }

  setMuted(m: boolean) { this.stream?.getAudioTracks().forEach(t => (t.enabled = !m)); }

  /** Keep connections in step with who is present. */
  setPeers(ids: string[]) {
    for (const id of ids) if (!this.conns.has(id)) this.connect(id);
    for (const id of [...this.conns.keys()]) if (!ids.includes(id)) this.drop(id);
  }

  setVolume(id: string, v: number) {
    this.volumes.set(id, v);
    const c = this.conns.get(id); if (c) c.audio.volume = v;
  }

  /** ids currently speaking (incl. me), by simple energy threshold. */
  speaking(): Set<string> {
    const out = new Set<string>();
    if (this.localAnalyser && this.stream?.getAudioTracks()[0]?.enabled && energy(this.localAnalyser) > 0.02) out.add(this.myId);
    for (const [id, c] of this.conns) if (c.analyser && (this.volumes.get(id) ?? 1) > 0 && energy(c.analyser) > 0.02) out.add(id);
    return out;
  }

  private connect(id: string) {
    const pc = new RTCPeerConnection(ICE);
    const audio = document.createElement('audio'); audio.autoplay = true; audio.volume = this.volumes.get(id) ?? 1;
    document.body.appendChild(audio);
    const c: Conn = { pc, audio, makingOffer: false, ignoreOffer: false, retries: 0, pending: [], video: null };
    this.conns.set(id, c);
    if (this.stream) for (const t of this.stream.getAudioTracks()) pc.addTrack(t, this.stream);
    else pc.addTransceiver('audio', { direction: 'recvonly' });
    if (this.camStream) c.videoSender = pc.addTrack(this.camStream.getVideoTracks()[0], this.camStream);
    pc.onicecandidate = e => { if (e.candidate) this.send(id, { candidate: e.candidate }); };
    pc.onnegotiationneeded = async () => {
      try { c.makingOffer = true; await pc.setLocalDescription(); c.offerSince = performance.now(); c.retries = 0; this.send(id, { description: pc.localDescription }); }
      catch (e) { console.warn(e); } finally { c.makingOffer = false; }
    };
    pc.ontrack = e => {
      if (e.track.kind === 'video') {
        const v = document.createElement('video'); v.autoplay = true; v.muted = true; v.playsInline = true;
        v.srcObject = new MediaStream([e.track]); c.video = v; this.onVideo(id, v);
        e.track.onended = () => { if (c.video === v) { c.video = null; this.onVideo(id, null); } };
        e.track.onmute = () => { if (c.video === v) { c.video = null; this.onVideo(id, null); } };
        return;
      }
      const s = new MediaStream([e.track]);
      audio.srcObject = s;
      this.ctx ??= new AudioContext();
      const an = this.ctx.createAnalyser(); an.fftSize = 512;
      this.ctx.createMediaStreamSource(s).connect(an); c.analyser = an;
    };
    pc.onconnectionstatechange = () => { if (pc.connectionState === 'failed') pc.restartIce(); };
  }

  private drop(id: string) {
    const c = this.conns.get(id); if (!c) return;
    c.pc.close(); c.audio.remove(); if (c.video) this.onVideo(id, null); this.conns.delete(id);
  }

  async onSignal(from: string, data: any) {
    let c = this.conns.get(from);
    if (!c) { this.connect(from); c = this.conns.get(from)!; }
    const { pc } = c;
    const polite = this.myId < from;
    try {
      if (data.description) {
        const offerCollision = data.description.type === 'offer' && (c.makingOffer || pc.signalingState !== 'stable');
        c.ignoreOffer = !polite && offerCollision;
        if (c.ignoreOffer) return;
        await pc.setRemoteDescription(data.description);
        for (const cand of c.pending.splice(0)) { try { await pc.addIceCandidate(cand); } catch {} }
        if (data.description.type === 'offer') { await pc.setLocalDescription(); this.send(from, { description: pc.localDescription }); }
      } else if (data.candidate) {
        if (!pc.remoteDescription) { c.pending.push(data.candidate); return; }
        try { await pc.addIceCandidate(data.candidate); } catch (e) { if (!c.ignoreOffer) throw e; }
      }
    } catch (e) { console.warn('signal error', e); }
  }

  /** Call from a user gesture so autoplay is allowed. */
  async resume() { this.ctx ??= new AudioContext(); if (this.ctx.state === 'suspended') await this.ctx.resume(); for (const [, c] of this.conns) c.audio.play().catch(() => {}); }

  /** Call about once a second. Signalling runs over Supabase broadcast, which can drop a message;
   *  an offer that gets no answer within 2 s is sent again (up to 5 times). */
  tick() {
    const now = performance.now();
    for (const [id, c] of this.conns) {
      if (c.pc.signalingState === 'have-local-offer' && c.offerSince && now - c.offerSince > 2000 && c.pc.localDescription) {
        if (c.retries >= 5) { this.drop(id); this.connect(id); continue; }   // start again from scratch
        c.retries++; c.offerSince = now; this.send(id, { description: c.pc.localDescription });
      }
    }
  }

  /** Connection states, for debugging. */
  states() { const o: Record<string, string> = {}; for (const [id, c] of this.conns) o[id] = `${c.pc.connectionState}/${c.pc.iceConnectionState}/${c.pc.signalingState}`; return o; }

  close() { for (const id of [...this.conns.keys()]) this.drop(id); this.stream?.getTracks().forEach(t => t.stop()); this.stream = null; this.disableCamera(); }
}

function energy(an: AnalyserNode): number {
  const buf = new Uint8Array(an.fftSize); an.getByteTimeDomainData(buf);
  let sum = 0; for (const v of buf) { const d = (v - 128) / 128; sum += d * d; }
  return Math.sqrt(sum / buf.length);
}
