import { useCallback, useRef } from "react";

export function useSlotSounds() {
  const ctxRef = useRef<AudioContext | null>(null);
  const spinIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getCtx = useCallback((): AudioContext => {
    if (!ctxRef.current || ctxRef.current.state === "closed") {
      ctxRef.current = new AudioContext();
    }
    return ctxRef.current;
  }, []);

  const playClick = useCallback((ctx: AudioContext, time: number) => {
    const bufferSize = Math.floor(ctx.sampleRate * 0.03);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1800;
    filter.Q.value = 0.8;
    const gain = ctx.createGain();
    gain.gain.value = 0.35;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(time);
  }, []);

  const startSpinSound = useCallback(() => {
    const ctx = getCtx();
    if (ctx.state === "suspended") ctx.resume();
    if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
    spinIntervalRef.current = setInterval(() => {
      playClick(ctx, ctx.currentTime);
    }, 90);
  }, [getCtx, playClick]);

  const stopSpinSound = useCallback(() => {
    if (spinIntervalRef.current) {
      clearInterval(spinIntervalRef.current);
      spinIntervalRef.current = null;
    }
  }, []);

  const playReelStop = useCallback(() => {
    const ctx = getCtx();
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;

    const bufferSize = Math.floor(ctx.sampleRate * 0.06);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = buffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "lowpass";
    noiseFilter.frequency.value = 600;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.5;
    noiseSrc.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseSrc.start(now);

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.4, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }, [getCtx]);

  const playWin = useCallback(() => {
    const ctx = getCtx();
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;

    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, noteIdx) => {
      const t = now + noteIdx * 0.12;
      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.value = freq;
      const osc2 = ctx.createOscillator();
      osc2.type = "triangle";
      osc2.frequency.value = freq * 2;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.35);
      osc2.start(t);
      osc2.stop(t + 0.35);
    });

    setTimeout(() => {
      const sCtx = getCtx();
      const sNow = sCtx.currentTime;
      const buf = sCtx.createBuffer(
        1,
        Math.floor(sCtx.sampleRate * 0.3),
        sCtx.sampleRate,
      );
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (d.length * 0.4));
      }
      const s = sCtx.createBufferSource();
      s.buffer = buf;
      const f = sCtx.createBiquadFilter();
      f.type = "highpass";
      f.frequency.value = 4000;
      const g = sCtx.createGain();
      g.gain.value = 0.2;
      s.connect(f);
      f.connect(g);
      g.connect(sCtx.destination);
      s.start(sNow);
    }, 480);
  }, [getCtx]);

  const playLose = useCallback(() => {
    const ctx = getCtx();
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;

    const notes = [300, 220, 160];
    notes.forEach((freq, noteIdx) => {
      const t = now + noteIdx * 0.1;
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.7, t + 0.12);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.15);
    });
  }, [getCtx]);

  return { startSpinSound, stopSpinSound, playReelStop, playWin, playLose };
}
