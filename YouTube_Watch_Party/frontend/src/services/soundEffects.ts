/**
 * Sound Effects Service - Disabled per user request
 */
class SoundEffectsService {
  public setMuted(_muted: boolean): void {
    // SFX disabled
  }

  public isMuted(): boolean {
    return true;
  }

  public play(_soundId: string): void {
    // SFX sound disabled
  }
}

export const soundEffects = new SoundEffectsService();
