// Audio (beeps con WebAudio) y vibración. Verbatim del juego original.
let actx = null;

export function beep (freq = 880, dur = 0.12, vol = 0.4) {
  try {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = 'triangle'; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + dur);
    o.connect(g); g.connect(actx.destination);
    o.start(); o.stop(actx.currentTime + dur);
  } catch {}
}
export function avisoFin () { beep(660, 0.18); setTimeout(() => beep(880, 0.18), 170); setTimeout(() => beep(1175, 0.3), 360); }
export function vibrar (p) { if (navigator.vibrate) navigator.vibrate(p); }
