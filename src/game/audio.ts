export class WaterAudio {
  context: AudioContext | null = null;
  muted = false;
  private master: GainNode | null = null;
  private lastNote = 0;
  private voices = new Set<AudioScheduledSourceNode>();
  unlock(): void {
    try {
      if (!this.context) {
        this.context = new AudioContext(); this.master = this.context.createGain();
        this.master.gain.value = this.muted ? 0 : 0.22; this.master.connect(this.context.destination);
      }
      if (this.context.state === 'suspended') void this.context.resume().catch(() => {});
    } catch { /* Silent play remains available. */ }
  }
  setMuted(value: boolean): void {
    this.muted = value;
    if (this.context && this.master) this.master.gain.setTargetAtTime(value ? 0 : 0.22, this.context.currentTime, 0.03);
  }
  note(index: number, delay = 0, duration = 0.32): void {
    if (!this.context || !this.master || this.muted) return;
    const now = this.context.currentTime;
    if (!delay && now - this.lastNote < 0.055) return;
    this.lastNote = now;
    const oscillator = this.context.createOscillator(), gain = this.context.createGain();
    const time = now + delay;
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime([523.25, 587.33, 659.25, 783.99, 880][index % 5] * 1.7, time);
    oscillator.frequency.exponentialRampToValueAtTime([523.25, 587.33, 659.25, 783.99, 880][index % 5], time + 0.09);
    gain.gain.setValueAtTime(0, time); gain.gain.linearRampToValueAtTime(0.6, time + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    oscillator.connect(gain); gain.connect(this.master);
    this.voices.add(oscillator);
    oscillator.onended = () => { this.voices.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(time); oscillator.stop(time + duration + 0.02);
  }
  melody(notes: number[]): void {
    const sequence = notes.length ? notes.slice(-8) : [0, 2, 4, 3, 2, 0];
    sequence.concat([4, 2, 0]).forEach((note, i) => this.note(note, i * 0.19 + 0.01, 0.62));
    if (!this.context || !this.master || this.muted) return;
    const length = this.context.sampleRate * 1.5;
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) channel[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = this.context.createBufferSource(), filter = this.context.createBiquadFilter(), gain = this.context.createGain();
    source.buffer = buffer; filter.type = 'lowpass'; filter.frequency.value = 1400; gain.gain.value = 0.14;
    source.connect(filter); filter.connect(gain); gain.connect(this.master);
    this.voices.add(source); source.onended = () => { this.voices.delete(source); source.disconnect(); filter.disconnect(); gain.disconnect(); };
    source.start();
  }
  stop(): void {
    for (const voice of this.voices) { try { voice.stop(); } catch { /* Already ended. */ } }
    this.voices.clear();
  }
}
