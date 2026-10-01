/**
 * Web Audio API procedural sound engine & Tactical Announcer for tank battles.
 * Completely standalone, zero external audio assets required.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isMusicMuted: boolean = false;
  private sfxVolume: number = 0.7;
  private musicVolume: number = 0.35;
  private voiceEnabled: boolean = true;

  // Background Music state
  private musicGain: GainNode | null = null;
  private isMusicPlaying: boolean = false;
  private musicInterval: number | null = null;
  private musicStep: number = 0;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(0, this.ctx.currentTime);
    } else if (!muted && this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(this.isMusicMuted ? 0 : this.musicVolume, this.ctx.currentTime);
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
  }

  public getSfxVolume(): number {
    return this.sfxVolume;
  }

  public setMusicVolume(vol: number) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.musicGain && this.ctx && !this.isMuted && !this.isMusicMuted) {
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
    }
  }

  public getMusicVolume(): number {
    return this.musicVolume;
  }

  public toggleMusic(): boolean {
    this.isMusicMuted = !this.isMusicMuted;
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(this.isMusicMuted || this.isMuted ? 0 : this.musicVolume, this.ctx.currentTime);
    }
    if (!this.isMusicMuted && !this.isMusicPlaying) {
      this.startBgm();
    }
    return !this.isMusicMuted;
  }

  public getIsMusicPlaying(): boolean {
    return this.isMusicPlaying && !this.isMusicMuted && !this.isMuted;
  }

  public setVoiceEnabled(enabled: boolean) {
    this.voiceEnabled = enabled;
  }

  public getVoiceEnabled(): boolean {
    return this.voiceEnabled;
  }

  // ==========================================
  // PROCEDURAL EPIC MILITARY BATTLE BGM
  // ==========================================
  public startBgm() {
    if (this.isMusicPlaying) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      this.isMusicPlaying = true;

      // Master BGM bus gain
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.isMusicMuted || this.isMuted ? 0 : this.musicVolume, this.ctx.currentTime);
      this.musicGain.connect(this.ctx.destination);

      const tempoMs = 135; // ~110 BPM 16th notes
      this.musicStep = 0;

      // War Bassline progression: D minor -> F major -> G minor -> Bb major
      const bassProgression = [
        73.42, 73.42, 73.42, 73.42,  // D2
        87.31, 87.31, 87.31, 87.31,  // F2
        98.00, 98.00, 98.00, 98.00,  // G2
        116.54, 116.54, 110.00, 98.00 // Bb2 -> A2 -> G2
      ];

      // Brass motif notes
      const brassNotes = [
        146.83, 0, 174.61, 0, 220.00, 0, 196.00, 0,
        174.61, 0, 146.83, 0, 130.81, 146.83, 0, 0
      ];

      this.musicInterval = window.setInterval(() => {
        if (!this.ctx || !this.isMusicPlaying) return;
        const t = this.ctx.currentTime;
        const step = this.musicStep % 16;
        const bar = Math.floor(this.musicStep / 16) % 4;

        // 1. War Kick / Sub Drum on beat 1, 5, 9, 13
        if (step % 4 === 0) {
          const kickOsc = this.ctx.createOscillator();
          const kickGain = this.ctx.createGain();
          kickOsc.type = 'sine';
          kickOsc.frequency.setValueAtTime(110, t);
          kickOsc.frequency.exponentialRampToValueAtTime(32, t + 0.12);
          kickGain.gain.setValueAtTime(0.4, t);
          kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
          kickOsc.connect(kickGain);
          kickGain.connect(this.musicGain!);
          kickOsc.start(t);
          kickOsc.stop(t + 0.15);
        }

        // 2. War March Snare / Hat shuffle
        if (step % 2 === 1 || step === 4 || step === 12) {
          const bufSize = Math.floor(this.ctx.sampleRate * 0.05);
          const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
          const out = buf.getChannelData(0);
          for (let i = 0; i < bufSize; i++) out[i] = Math.random() * 2 - 1;
          const noise = this.ctx.createBufferSource();
          noise.buffer = buf;
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'highpass';
          filter.frequency.setValueAtTime(step % 4 === 2 ? 1500 : 3200, t);
          const sGain = this.ctx.createGain();
          sGain.gain.setValueAtTime(step % 4 === 2 ? 0.22 : 0.12, t);
          sGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
          noise.connect(filter);
          filter.connect(sGain);
          sGain.connect(this.musicGain!);
          noise.start(t);
          noise.stop(t + 0.06);
        }

        // 3. Heavy Armored Bass Pulse
        const bassFreq = bassProgression[bar * 4 + Math.floor(step / 4)];
        if (step % 2 === 0 && bassFreq) {
          const bassOsc = this.ctx.createOscillator();
          const bGain = this.ctx.createGain();
          bassOsc.type = 'sawtooth';
          bassOsc.frequency.setValueAtTime(bassFreq, t);

          const bFilter = this.ctx.createBiquadFilter();
          bFilter.type = 'lowpass';
          bFilter.frequency.setValueAtTime(380, t);
          bFilter.frequency.exponentialRampToValueAtTime(140, t + 0.12);

          bGain.gain.setValueAtTime(0.2, t);
          bGain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);

          bassOsc.connect(bFilter);
          bFilter.connect(bGain);
          bGain.connect(this.musicGain!);
          bassOsc.start(t);
          bassOsc.stop(t + 0.14);
        }

        // 4. Heroic Brass Accent
        const brassFreq = brassNotes[step];
        if (brassFreq > 0) {
          const brassOsc = this.ctx.createOscillator();
          const brassGain = this.ctx.createGain();
          brassOsc.type = 'triangle';
          brassOsc.frequency.setValueAtTime(brassFreq, t);
          brassGain.gain.setValueAtTime(0.16, t);
          brassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
          brassOsc.connect(brassGain);
          brassGain.connect(this.musicGain!);
          brassOsc.start(t);
          brassOsc.stop(t + 0.24);
        }

        this.musicStep++;
      }, tempoMs);
    } catch {
      // autoplay guard
    }
  }

  public stopBgm() {
    this.isMusicPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.musicGain.disconnect();
      this.musicGain = null;
    }
  }

  // ==========================================
  // TACTICAL VOICE ANNOUNCER
  // ==========================================
  public announce(englishText: string, vietnameseText?: string) {
    if (!this.voiceEnabled || this.isMuted) return;

    // Play tactical radio beep first
    this.playRadioBeep();

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel(); // Cancel any lingering utterance

      const utterance = new SpeechSynthesisUtterance(vietnameseText || englishText);
      utterance.volume = Math.min(1, this.sfxVolume * 1.25);
      utterance.rate = 1.08; // slightly brisk military commander cadence
      utterance.pitch = 0.88; // deeper, authoritative radio tone

      // Try finding Vietnamese voice or English deep voice
      const voices = window.speechSynthesis.getVoices();
      const viVoice = voices.find((v) => v.lang.startsWith('vi') || v.name.toLowerCase().includes('vietnam'));
      const enVoice = voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Male') || v.name.includes('David') || v.name.includes('Google')));

      if (vietnameseText && viVoice) {
        utterance.voice = viVoice;
        utterance.text = vietnameseText;
      } else {
        utterance.voice = enVoice || voices[0] || null;
        utterance.text = englishText;
      }

      window.speechSynthesis.speak(utterance);
    } catch {
      // speech fallback
    }
  }

  // Radio squelch & tactical comms beep
  public playRadioBeep() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      // Two-tone comms chirp (880Hz -> 1760Hz)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.setValueAtTime(1760, t + 0.04);
      gain.gain.setValueAtTime(this.sfxVolume * 0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.09);
    } catch {}
  }

  // Medal fanfare sound
  public playMedalFanfare(type: string) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      let baseNotes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      if (type === 'FIRST_BLOOD') baseNotes = [440, 554.37, 659.25, 880];
      if (type === 'RAMPAGE' || type === 'UNSTOPPABLE') baseNotes = [587.33, 739.99, 880, 1174.66];
      if (type === 'SNIPER') baseNotes = [659.25, 783.99, 987.77, 1318.51];
      if (type === 'REVENGE') baseNotes = [392.00, 493.88, 587.33, 783.99];

      baseNotes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = t + idx * 0.07;

        osc.type = idx === 3 ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.02, start + 0.28);

        gain.gain.setValueAtTime(this.sfxVolume * 0.45, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.32);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.35);
      });
    } catch {}
  }

  // Cannon firing blast
  public playShoot(isHeavy: boolean = false) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      // 1. Low frequency punch
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isHeavy ? 110 : 150, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.18);

      gain.gain.setValueAtTime(this.sfxVolume * (isHeavy ? 0.9 : 0.75), t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + (isHeavy ? 0.22 : 0.16));

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.25);

      // 2. White noise pop
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.12);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isHeavy ? 800 : 1400, t);
      filter.frequency.linearRampToValueAtTime(150, t + 0.12);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(this.sfxVolume * 0.8, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      whiteNoise.start(t);
      whiteNoise.stop(t + 0.12);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  // Shell impact against tank armor / wall
  public playHit() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(340, t);
      osc.frequency.exponentialRampToValueAtTime(70, t + 0.08);

      gain.gain.setValueAtTime(this.sfxVolume * 0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.09);
    } catch {}
  }

  // Tank destroyed explosion boom
  public playExplosion() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      const duration = 0.5;
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.18));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, t);
      filter.frequency.exponentialRampToValueAtTime(60, t + duration);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(this.sfxVolume * 0.95, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(t);
      noise.stop(t + duration);
    } catch {}
  }

  // Powerup pickup chime
  public playPowerUp() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5 arpeggio

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const noteOsc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();
        const start = t + idx * 0.06;

        noteOsc.type = 'sine';
        noteOsc.frequency.setValueAtTime(freq, start);

        noteGain.gain.setValueAtTime(this.sfxVolume * 0.45, start);
        noteGain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);

        noteOsc.connect(noteGain);
        noteGain.connect(this.ctx.destination);

        noteOsc.start(start);
        noteOsc.stop(start + 0.2);
      });
    } catch {}
  }

  // Triumphant kill announcement fanfare
  public playKill(streak: number = 1) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      const baseFreq = streak >= 5 ? 587.33 : streak >= 3 ? 523.25 : 440;
      const notes = [baseFreq, baseFreq * 1.25, baseFreq * 1.5, baseFreq * 2];

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = t + idx * 0.07;

        osc.type = streak >= 3 ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.05, start + 0.25);

        gain.gain.setValueAtTime(this.sfxVolume * 0.5, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.38);
      });
    } catch {}
  }
}

export const sounds = new SoundEngine();

