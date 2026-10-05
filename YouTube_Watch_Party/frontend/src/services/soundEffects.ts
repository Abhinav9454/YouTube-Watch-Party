/**
 * Web Audio API-based Watch Party Sound Effects Synthesizer.
 * 100% client-side, zero external assets, instant responsive audio.
 */

class SoundEffectsService {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  private getContext(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public play(soundId: string) {
    if (this.muted) return;
    try {
      switch (soundId) {
        case 'airhorn':
          this.playAirhorn();
          break;
        case 'applause':
          this.playApplause();
          break;
        case 'laughter':
          this.playLaughter();
          break;
        case 'drumroll':
          this.playDrumroll();
          break;
        case 'crickets':
          this.playCrickets();
          break;
        case 'ding':
          this.playDing();
          break;
        default:
          this.playDing();
      }
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }

  // 🎺 Classic Airhorn Synth
  private playAirhorn() {
    const ctx = this.getContext();
    if (!ctx) return;

    const freqs = [466.16, 622.25, 698.46]; // Bb4 chord
    const now = ctx.currentTime;

    freqs.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.05, now + 0.15);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    });

    // 2nd blast for authentic airhorn stutter
    setTimeout(() => {
      if (!ctx || ctx.state === 'closed') return;
      const t = ctx.currentTime;
      freqs.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.55);
      });
    }, 180);
  }

  // 👏 Crowd Applause (Filtered noise bursts)
  private playApplause() {
    const ctx = this.getContext();
    if (!ctx) return;

    const bufferSize = ctx.sampleRate * 1.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1000;
    filter.Q.value = 1.2;

    const gain = ctx.createGain();
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 1.5);
  }

  // 😂 Sitcom Laughter synth simulation
  private playLaughter() {
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [380, 420, 360, 400, 340];
    let startOffset = 0;

    notes.forEach((freq) => {
      const now = ctx.currentTime + startOffset;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.linearRampToValueAtTime(freq - 40, now + 0.12);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.14);

      startOffset += 0.12;
    });
  }

  // 🥁 Ba-Dum-Tss (Snare + Cymbal)
  private playDrumroll() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Ba
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.frequency.setValueAtTime(140, now);
    osc1.frequency.exponentialRampToValueAtTime(60, now + 0.15);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.15);

    // Dum
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    const t2 = now + 0.18;
    osc2.frequency.setValueAtTime(120, t2);
    osc2.frequency.exponentialRampToValueAtTime(50, t2 + 0.2);
    gain2.gain.setValueAtTime(0.35, t2);
    gain2.gain.exponentialRampToValueAtTime(0.01, t2 + 0.2);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(t2);
    osc2.stop(t2 + 0.2);

    // Tss (Cymbal sizzle)
    const t3 = now + 0.38;
    const bufferSize = ctx.sampleRate * 0.8;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 5000;
    const gain3 = ctx.createGain();
    gain3.gain.setValueAtTime(0.25, t3);
    gain3.gain.exponentialRampToValueAtTime(0.001, t3 + 0.7);

    noise.connect(filter);
    filter.connect(gain3);
    gain3.connect(ctx.destination);
    noise.start(t3);
    noise.stop(t3 + 0.7);
  }

  // 🦗 Crickets (Chirp chirp)
  private playCrickets() {
    const ctx = this.getContext();
    if (!ctx) return;

    for (let chirp = 0; chirp < 3; chirp++) {
      const now = ctx.currentTime + chirp * 0.14;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(4500, now);
      osc.frequency.linearRampToValueAtTime(4800, now + 0.08);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    }
  }

  // 🔔 Bell / Ding notification
  private playDing() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.08); // E6

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.6);
  }
}

export const soundEffects = new SoundEffectsService();
