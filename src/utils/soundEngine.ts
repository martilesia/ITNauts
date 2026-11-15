class SoundEngine {
  private ctx: AudioContext | null = null;
  private soundEnabled = true;
  private voiceEnabled = false;

  setSettings(soundEnabled: boolean, voiceEnabled: boolean) {
    this.soundEnabled = soundEnabled;
    this.voiceEnabled = voiceEnabled;
    if (!voiceEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  private getContext(): AudioContext | null {
    if (!this.soundEnabled || typeof window === 'undefined') return null;
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

  playTone(freq: number, duration = 0.08, type: OscillatorType = 'sine', volume = 0.07, endFreq?: number) {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (endFreq) {
        osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
      }
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // Ignore audio errors on restricted devices
    }
  }

  playClick() {
    this.playTone(520, 0.05, 'triangle', 0.05, 620);
  }

  playStep() {
    this.playTone(140, 0.04, 'sine', 0.025, 110);
  }

  playPickup() {
    this.playTone(440, 0.08, 'triangle', 0.07, 660);
    setTimeout(() => this.playTone(660, 0.1, 'triangle', 0.06, 880), 60);
  }

  playScan() {
    this.playTone(300, 0.14, 'sine', 0.05, 580);
  }

  playSuccess() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      setTimeout(() => this.playTone(n, 0.16, 'triangle', 0.07), idx * 75);
    });
  }

  playGentleError() {
    this.playTone(280, 0.12, 'sine', 0.05, 210);
  }

  playWaterCollect() {
    this.playTone(520, 0.08, 'sine', 0.06, 780);
    setTimeout(() => this.playTone(780, 0.1, 'sine', 0.05, 1040), 70);
  }

  playStormAlert() {
    this.playTone(180, 0.18, 'triangle', 0.06, 130);
    setTimeout(() => this.playTone(220, 0.2, 'sawtooth', 0.04, 150), 120);
  }

  playAstroBeep(mood: 'happy' | 'curious' | 'alert' | 'encourage') {
    if (mood === 'happy') {
      this.playTone(620, 0.07, 'sine', 0.05, 920);
      setTimeout(() => this.playTone(880, 0.09, 'sine', 0.05, 1100), 75);
    } else if (mood === 'alert') {
      this.playTone(520, 0.09, 'triangle', 0.05, 420);
    } else {
      this.playTone(480, 0.08, 'sine', 0.045, 640);
    }
  }

  private speechKeepalive: number | null = null;
  private speechQueueId = 0;

  private clearSpeechKeepalive() {
    if (this.speechKeepalive !== null) {
      window.clearInterval(this.speechKeepalive);
      this.speechKeepalive = null;
    }
  }

  speakShort(text: string) {
    if (!this.voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      const synth = window.speechSynthesis;
      synth.cancel();
      this.clearSpeechKeepalive();
      const myQueueId = ++this.speechQueueId;

      const cleaned = text.replace(/\s+/g, ' ').trim();
      if (!cleaned) return;

      // Split into complete sentences so Chromium SpeechSynthesis never truncates long guidance
      const sentences = cleaned
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter(Boolean);

      const chunks = sentences.length > 0 ? sentences : [cleaned];

      const speakNext = (index: number) => {
        if (myQueueId !== this.speechQueueId || index >= chunks.length || !this.voiceEnabled) {
          this.clearSpeechKeepalive();
          return;
        }
        const utterance = new SpeechSynthesisUtterance(chunks[index]);
        utterance.lang = 'en-US';
        utterance.rate = 0.98;
        utterance.pitch = 1.08;
        utterance.volume = 0.9;
        utterance.onend = () => {
          speakNext(index + 1);
        };
        utterance.onerror = () => {
          this.clearSpeechKeepalive();
        };
        synth.speak(utterance);
      };

      // Keepalive prevents browser speech engine from stalling on multi-sentence guidance
      this.speechKeepalive = window.setInterval(() => {
        if (!synth.speaking) {
          this.clearSpeechKeepalive();
          return;
        }
        if (synth.paused) {
          synth.resume();
        }
      }, 4500);

      speakNext(0);
    } catch {
      // Speech synthesis not supported
    }
  }
}

export const soundEngine = new SoundEngine();
