/**
 * Sound Effects Service - High-Fidelity Web Audio Procedural Synthesizer
 * Synthesizes dynamic soundboard audio in real-time with zero external assets/network latency.
 */

class SoundEffectsService {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.muted = localStorage.getItem('watchparty_sfx_muted') === 'true';
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('watchparty_sfx_muted', muted ? 'true' : 'false');
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public play(soundId: string): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      switch (soundId) {
        case 'airhorn':
          this.playAirhorn(ctx);
          break;
        case 'drumroll':
          this.playBaDumTss(ctx);
          break;
        case 'applause':
          this.playApplause(ctx);
          break;
        case 'ding':
          this.playDing(ctx);
          break;
        case 'buzzer':
          this.playBuzzer(ctx);
          break;
        case 'crickets':
          this.playCrickets(ctx);
          break;
        case 'boing':
          this.playBoing(ctx);
          break;
        case 'hype':
          this.playHypeSiren(ctx);
          break;
        default:
          this.playDing(ctx);
          break;
      }
    } catch (err) {
      console.warn('Web Audio synthesis error:', err);
    }
  }

  /**
   * Iconic DJ Airhorn (3 staccato brass blasts)
   */
  private playAirhorn(ctx: AudioContext): void {
    const blasts = [
      { start: 0.0, dur: 0.12 },
      { start: 0.16, dur: 0.12 },
      { start: 0.32, dur: 0.45 },
    ];

    blasts.forEach(({ start, dur }) => {
      const startTime = ctx.currentTime + start;
      const endTime = startTime + dur;

      // Dual detuned sawtooth oscillators
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const osc3 = ctx.createOscillator();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(466.16, startTime); // Bb4
      osc1.frequency.exponentialRampToValueAtTime(460.0, endTime);

      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(622.25, startTime); // Eb5
      osc2.frequency.exponentialRampToValueAtTime(615.0, endTime);

      osc3.type = 'sawtooth';
      osc3.frequency.setValueAtTime(932.33, startTime); // Bb5
      osc3.frequency.exponentialRampToValueAtTime(920.0, endTime);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3200, startTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.3, startTime + 0.02);
      gain.gain.setValueAtTime(0.28, endTime - 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, endTime);

      osc1.connect(filter);
      osc2.connect(filter);
      osc3.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(startTime);
      osc2.start(startTime);
      osc3.start(startTime);
      osc1.stop(endTime);
      osc2.stop(endTime);
      osc3.stop(endTime);
    });
  }

  /**
   * Classic Comedy "Ba-Dum-Tss!" Drumroll & Cymbal Crash
   */
  private playBaDumTss(ctx: AudioContext): void {
    const t0 = ctx.currentTime;

    // 1. "Ba" (Low tom)
    const tom1 = ctx.createOscillator();
    const tom1Gain = ctx.createGain();
    tom1.type = 'triangle';
    tom1.frequency.setValueAtTime(160, t0);
    tom1.frequency.exponentialRampToValueAtTime(60, t0 + 0.12);
    tom1Gain.gain.setValueAtTime(0.4, t0);
    tom1Gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.12);
    tom1.connect(tom1Gain);
    tom1Gain.connect(ctx.destination);
    tom1.start(t0);
    tom1.stop(t0 + 0.12);

    // 2. "Dum" (Mid tom)
    const t1 = t0 + 0.15;
    const tom2 = ctx.createOscillator();
    const tom2Gain = ctx.createGain();
    tom2.type = 'triangle';
    tom2.frequency.setValueAtTime(140, t1);
    tom2.frequency.exponentialRampToValueAtTime(50, t1 + 0.14);
    tom2Gain.gain.setValueAtTime(0.45, t1);
    tom2Gain.gain.exponentialRampToValueAtTime(0.001, t1 + 0.14);
    tom2.connect(tom2Gain);
    tom2Gain.connect(ctx.destination);
    tom2.start(t1);
    tom2.stop(t1 + 0.14);

    // 3. "Tss!" (Cymbal crash with filtered noise)
    const t2 = t0 + 0.35;
    const bufferSize = ctx.sampleRate * 0.8;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const cymbalFilter = ctx.createBiquadFilter();
    cymbalFilter.type = 'highpass';
    cymbalFilter.frequency.setValueAtTime(5500, t2);

    const cymbalGain = ctx.createGain();
    cymbalGain.gain.setValueAtTime(0.35, t2);
    cymbalGain.gain.exponentialRampToValueAtTime(0.001, t2 + 0.75);

    noise.connect(cymbalFilter);
    cymbalFilter.connect(cymbalGain);
    cymbalGain.connect(ctx.destination);

    noise.start(t2);
    noise.stop(t2 + 0.8);
  }

  /**
   * Crowd Applause / Cheering
   */
  private playApplause(ctx: AudioContext): void {
    const t0 = ctx.currentTime;
    const duration = 1.4;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);

    // Filtered noise with rhythmic bursts
    for (let i = 0; i < bufferSize; i++) {
      const envelope = Math.sin((i / bufferSize) * Math.PI);
      data[i] = (Math.random() * 2 - 1) * envelope;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, t0);
    filter.Q.setValueAtTime(1.5, t0);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.05, t0);
    gain.gain.linearRampToValueAtTime(0.3, t0 + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(t0);
    noise.stop(t0 + duration);
  }

  /**
   * Crystal Bell Chime (Ding!)
   */
  private playDing(ctx: AudioContext): void {
    const t0 = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(2093.0, t0); // C7

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(4186.0, t0); // C8 harmonic

    gain.gain.setValueAtTime(0.01, t0);
    gain.gain.exponentialRampToValueAtTime(0.35, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.2);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(t0);
    osc2.start(t0);
    osc1.stop(t0 + 1.25);
    osc2.stop(t0 + 1.25);
  }

  /**
   * Low Raspy Buzzer (Wrong / Fail / Alert)
   */
  private playBuzzer(ctx: AudioContext): void {
    const t0 = ctx.currentTime;
    const dur = 0.55;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(130.81, t0); // C3

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(134.5, t0); // Detuned for harsh beat frequency

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, t0);

    gain.gain.setValueAtTime(0.01, t0);
    gain.gain.exponentialRampToValueAtTime(0.32, t0 + 0.03);
    gain.gain.setValueAtTime(0.3, t0 + dur - 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(t0);
    osc2.start(t0);
    osc1.stop(t0 + dur);
    osc2.stop(t0 + dur);
  }

  /**
   * High-Pitched Cricket Chirping
   */
  private playCrickets(ctx: AudioContext): void {
    const bursts = [0.0, 0.22, 0.44];

    bursts.forEach((start) => {
      const t = ctx.currentTime + start;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(4500, t);
      osc.frequency.exponentialRampToValueAtTime(4700, t + 0.1);

      gain.gain.setValueAtTime(0.01, t);
      gain.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.13);
    });
  }

  /**
   * Comical Spring Bounce (Boing!)
   */
  private playBoing(ctx: AudioContext): void {
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, t0);
    osc.frequency.exponentialRampToValueAtTime(680, t0 + 0.2);
    osc.frequency.exponentialRampToValueAtTime(240, t0 + 0.55);

    gain.gain.setValueAtTime(0.01, t0);
    gain.gain.exponentialRampToValueAtTime(0.35, t0 + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t0);
    osc.stop(t0 + 0.62);
  }

  /**
   * Rave Hype Siren Sweep
   */
  private playHypeSiren(ctx: AudioContext): void {
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, t0);
    osc.frequency.linearRampToValueAtTime(1100, t0 + 0.4);
    osc.frequency.linearRampToValueAtTime(450, t0 + 0.8);

    gain.gain.setValueAtTime(0.01, t0);
    gain.gain.exponentialRampToValueAtTime(0.25, t0 + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.85);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t0);
    osc.stop(t0 + 0.88);
  }
}

export const soundEffects = new SoundEffectsService();
