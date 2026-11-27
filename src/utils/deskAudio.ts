class DeskAudioEngine {
  private ctx: AudioContext | null = null;
  public enabled = true;

  private ensureContext() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => { });
    }
  }

  playKeyTap(isSpace = false) {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Space suena más grave y con cuerpo; teclas normales más agudas y cortas
    const baseFreq = isSpace ? 155 : 290 + Math.random() * 55;
    osc.type = "triangle";
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + (isSpace ? 0.055 : 0.032));

    gain.gain.setValueAtTime(isSpace ? 0.14 : 0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isSpace ? 0.06 : 0.035));

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + (isSpace ? 0.065 : 0.04));
  }

  playMouseClick(isRight = false) {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(isRight ? 520 : 640, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.022);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.03);
  }
}

export const deskAudio = new DeskAudioEngine();