/**
 * Background ambience: a soft outdoor bed with bees flying past now and then.
 * Synthesised with Web Audio (no files to download). Starts muted — browsers only allow
 * audio after the visitor switches it on.
 *
 * Each fly-by is a wingbeat tone near a honey bee's ~230 Hz with harmonics, shaped by:
 *  - a loudness swell as the bee approaches and recedes,
 *  - a stereo sweep from one side to the other,
 *  - a small Doppler pitch drop as it passes,
 *  - a low-pass filter that dulls distant bees, and slight wingbeat flutter.
 */

class Ambience {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private timer: number | null = null;
  private wingGain: GainNode | null = null;
  private wingLevel = -1;
  private on = false;

  private noiseBuffer(ctx: AudioContext) {
    const b = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
    const d = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; // brown noise
      d[i] = last * 3.5;
    }
    return b;
  }

  private init() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);

    // soft breeze bed with a slow swell
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(ctx);
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 700;
    bp.Q.value = 0.35;
    const bed = ctx.createGain();
    bed.gain.value = 0.035;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.015;
    lfo.connect(lfoGain).connect(bed.gain);
    src.connect(bp).connect(bed).connect(this.master);
    src.start();
    lfo.start();

    // the specimen's own wing buzz (driven by setWingBuzz while it fans its wings)
    this.wingGain = ctx.createGain();
    this.wingGain.gain.value = 0;
    const wlp = ctx.createBiquadFilter();
    wlp.type = 'lowpass';
    wlp.frequency.value = 1600;
    for (const [type, f, level] of [['sawtooth', 232, 0.5], ['triangle', 464, 0.3]] as [OscillatorType, number, number][]) {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = level;
      o.connect(g).connect(wlp);
      o.start();
    }
    wlp.connect(this.wingGain).connect(this.master);
  }

  /** 0..1 loudness of the on-screen bee's wing buzz. Cheap to call every frame. */
  setWingBuzz(level: number) {
    if (!this.ctx || !this.wingGain || !this.on) return;
    const v = Math.round(level * 20) / 20;
    if (v === this.wingLevel) return;
    this.wingLevel = v;
    this.wingGain.gain.setTargetAtTime(v * 0.12, this.ctx.currentTime, 0.08);
  }

  /** One bee passing the listener. */
  private flyBy(delay = 0) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t0 = ctx.currentTime + delay;
    const dur = 1.6 + Math.random() * 2.4;
    const near = Math.random(); // 0 = distant, 1 = close pass
    const peak = 0.025 + near * 0.09;
    const f = 205 + Math.random() * 45; // wingbeat fundamental, Hz
    const fromLeft = Math.random() < 0.5;

    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, t0);
    out.gain.exponentialRampToValueAtTime(peak, t0 + dur * 0.5);
    out.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    const pan = ctx.createStereoPanner();
    pan.pan.setValueAtTime(fromLeft ? -0.95 : 0.95, t0);
    pan.pan.linearRampToValueAtTime(fromLeft ? 0.95 : -0.95, t0 + dur);

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(500 + near * 400, t0);
    lp.frequency.linearRampToValueAtTime(900 + near * 1600, t0 + dur * 0.5);
    lp.frequency.linearRampToValueAtTime(500 + near * 400, t0 + dur);

    // wingbeat flutter (amplitude wobble)
    const flutter = ctx.createGain();
    flutter.gain.value = 0.8;
    const fl = ctx.createOscillator();
    fl.frequency.value = 5 + Math.random() * 6;
    const flDepth = ctx.createGain();
    flDepth.gain.value = 0.2;
    fl.connect(flDepth).connect(flutter.gain);

    const oscs: OscillatorNode[] = [];
    const partials: [OscillatorType, number, number][] = [
      ['sawtooth', 1, 0.5],
      ['triangle', 2, 0.35],
      ['sine', 3, 0.12],
    ];
    for (const [type, mult, level] of partials) {
      const o = ctx.createOscillator();
      o.type = type;
      // Doppler: slightly sharp on approach, flat as it recedes
      o.frequency.setValueAtTime(f * mult * 1.035, t0);
      o.frequency.linearRampToValueAtTime(f * mult * 1.0, t0 + dur * 0.45);
      o.frequency.linearRampToValueAtTime(f * mult * 0.965, t0 + dur * 0.6);
      o.frequency.setValueAtTime(f * mult * 0.965, t0 + dur);
      const g = ctx.createGain();
      g.gain.value = level;
      o.connect(g).connect(flutter);
      o.start(t0);
      o.stop(t0 + dur + 0.05);
      oscs.push(o);
    }
    flutter.connect(lp).connect(pan).connect(out).connect(this.master);
    fl.start(t0);
    fl.stop(t0 + dur + 0.05);
    oscs[0].onended = () => {
      [out, pan, lp, flutter, flDepth].forEach((n) => n.disconnect());
    };
  }

  private schedule() {
    if (!this.on) return;
    const wait = 2500 + Math.random() * 6500;
    this.timer = window.setTimeout(() => {
      if (!this.on || document.hidden) return this.schedule();
      this.flyBy();
      if (Math.random() < 0.25) this.flyBy(0.4 + Math.random() * 1.2); // sometimes a pair
      this.schedule();
    }, wait);
  }

  async setEnabled(on: boolean) {
    this.on = on;
    if (on) this.init();
    if (!this.ctx) return;
    if (on) {
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      this.master.gain.setTargetAtTime(0.9, this.ctx.currentTime, 0.4);
      this.flyBy(0.3); // immediate feedback that sound is on
      if (this.timer) window.clearTimeout(this.timer);
      this.schedule();
    } else {
      this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.15);
      if (this.timer) window.clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /** Pause audio processing while the tab is hidden. */
  setHidden(hidden: boolean) {
    if (!this.ctx || !this.on) return;
    void (hidden ? this.ctx.suspend() : this.ctx.resume());
  }
}

export const ambience = typeof window !== 'undefined' ? new Ambience() : (null as unknown as Ambience);
