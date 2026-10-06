// Web Audio API Equalizer and Sound Profile Engine
export type EqPresetId = 'flat' | 'cinema' | 'bass' | 'vocal' | 'night';

export interface EqBandConfig {
  freq: number;
  label: string;
  type: BiquadFilterType;
}

export interface SoundProfileMeta {
  id: EqPresetId;
  name: string;
  icon: string;
  tagline: string;
  description: string;
  gains: [number, number, number, number, number]; // 60Hz, 250Hz, 1kHz, 4kHz, 16kHz
}

export const EQ_FREQUENCIES: EqBandConfig[] = [
  { freq: 60, label: '60 Hz (Sub-Bass)', type: 'lowshelf' },
  { freq: 250, label: '250 Hz (Punch)', type: 'peaking' },
  { freq: 1000, label: '1 kHz (Vocals)', type: 'peaking' },
  { freq: 4000, label: '4 kHz (Clarity)', type: 'peaking' },
  { freq: 16000, label: '16 kHz (Air)', type: 'highshelf' },
];

export const SOUND_PROFILES: SoundProfileMeta[] = [
  {
    id: 'flat',
    name: 'Standard (Flat)',
    icon: '🎵',
    tagline: 'Source Fidelity',
    description: 'Neutral frequency curve reproducing the original video mixing faithfully without coloration.',
    gains: [0, 0, 0, 0, 0],
  },
  {
    id: 'cinema',
    name: 'Cinema 3D',
    icon: '🎬',
    tagline: 'Wide Spatial Surround',
    description: 'Immersive soundstage with enhanced low rumble, spatial presence, and dynamic movie theater atmosphere.',
    gains: [3.5, 1.5, 2.0, 3.5, 4.0],
  },
  {
    id: 'bass',
    name: 'Bass Boost',
    icon: '💥',
    tagline: 'Sub & Low-End Punch',
    description: 'Heavy low-end amplification (+7dB at 60Hz, +5dB at 250Hz) perfect for EDM, hip-hop, and trailer drops.',
    gains: [7.0, 5.0, 0.0, -1.0, 0.5],
  },
  {
    id: 'vocal',
    name: 'Vocal Clarity',
    icon: '🗣️',
    tagline: 'Crisp Speech & Dialogue',
    description: 'Sharpened vocal presence bands (+5dB at 1kHz) with gentle sub-bass attenuation to isolate speech in podcasts and shows.',
    gains: [-3.5, 1.0, 5.5, 4.0, 2.0],
  },
  {
    id: 'night',
    name: 'Night Mode',
    icon: '🌙',
    tagline: 'Soft Compressed Listening',
    description: 'Tames jarring explosions, softens high-frequency harshness, and keeps listening pleasant at low volumes.',
    gains: [-4.5, -2.0, 1.0, -3.5, -5.5],
  },
];

class AudioEqService {
  private audioCtx: AudioContext | null = null;
  private currentProfile: EqPresetId = 'flat';

  constructor() {
    try {
      const saved = localStorage.getItem('watchparty_audio_profile') as EqPresetId;
      if (saved && SOUND_PROFILES.some((p) => p.id === saved)) {
        this.currentProfile = saved;
      }
    } catch {}
  }

  public getProfile(): EqPresetId {
    return this.currentProfile;
  }

  public setProfile(id: EqPresetId) {
    this.currentProfile = id;
    try {
      localStorage.setItem('watchparty_audio_profile', id);
    } catch {}
  }

  public getProfileMeta(id: EqPresetId): SoundProfileMeta {
    return SOUND_PROFILES.find((p) => p.id === id) || SOUND_PROFILES[0];
  }

  private initContext(): AudioContext | null {
    if (!this.audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Generates an acoustic frequency preview test chime through the Web Audio EQ filter chain
   * so the user audibly hears the difference between Bass, Vocal, Cinema, Night, and Flat.
   */
  public playPreview(profileId: EqPresetId) {
    const ctx = this.initContext();
    if (!ctx) return;

    const profile = this.getProfileMeta(profileId);
    const gains = profile.gains;

    const now = ctx.currentTime;
    const duration = 0.65;

    // Build the 5 BiquadFilterNodes
    const filters = EQ_FREQUENCIES.map((band, idx) => {
      const filter = ctx.createBiquadFilter();
      filter.type = band.type;
      filter.frequency.setValueAtTime(band.freq, now);
      filter.gain.setValueAtTime(gains[idx], now);
      if (band.type === 'peaking') {
        filter.Q.setValueAtTime(1.2, now);
      }
      return filter;
    });

    // Chain the filters together
    for (let i = 0; i < filters.length - 1; i++) {
      filters[i].connect(filters[i + 1]);
    }

    // Master gain for profile volume leveling
    const masterGain = ctx.createGain();
    const baseVolume = profileId === 'night' ? 0.28 : profileId === 'bass' ? 0.38 : 0.35;
    masterGain.gain.setValueAtTime(baseVolume, now);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // Connect last filter to master gain and then destination
    filters[filters.length - 1].connect(masterGain);
    masterGain.connect(ctx.destination);

    // Create 3 harmonic oscillators (Low bass foundation, Warm mid fundamental, Crisp high chime)
    const freqs = [
      profileId === 'bass' ? 65 : 110, // Bass tone
      330, // Mid harmony
      profileId === 'vocal' ? 1200 : profileId === 'cinema' ? 880 : 660, // Top chime
    ];

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = idx === 0 ? 'sine' : idx === 1 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now);

      // Pitch glide for Cinema 3D or Bass sweep
      if (profileId === 'bass' && idx === 0) {
        osc.frequency.exponentialRampToValueAtTime(45, now + duration * 0.8);
      }

      const amp = idx === 0 ? 0.45 : idx === 1 ? 0.3 : 0.25;
      oscGain.gain.setValueAtTime(amp, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(oscGain);
      oscGain.connect(filters[0]);

      osc.start(now);
      osc.stop(now + duration);
    });
  }
}

export const audioEqService = new AudioEqService();
