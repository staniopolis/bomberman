let ctx: AudioContext;
export function playTone(freq: number, dur = 0.1, volume = 0.3) {
  if (!ctx) ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = freq; osc.connect(gain); gain.connect(ctx.destination);
  gain.gain.value = volume;
  osc.start(); osc.stop(ctx.currentTime + dur);
}
