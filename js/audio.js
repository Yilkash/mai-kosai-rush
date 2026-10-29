// Sound, all made in code: an original highlife groove and the stall itself.
//
// No recordings, so nothing here belongs to anybody else. The groove is
// highlife-style: a bright guitar pattern over I–IV–V–I, a bouncing bass,
// shekere on every sixteenth, a bell, and a talking-drum slide. Under it,
// oil sizzling in the pan and a crowd murmuring.
//
// **The groove is recorded once, then looped.** It used to be scheduled note
// by note on a timer, and on a phone busy drawing the 3D scene that timer
// fell behind and the music hung. Now it is rendered into a buffer with an
// OfflineAudioContext on the first tap and played as one seamless loop, which
// costs the phone almost nothing while the game runs.
// Browsers only allow sound after a tap, so nothing plays until `start()`.

const BPM = 112;
const STEP = 60 / BPM / 4;                 // one sixteenth note
// C – F – G – C, two bars each; MIDI notes
const CHORDS = [[60, 64, 67], [65, 69, 72], [67, 71, 74], [60, 64, 67]];
const BASS = [36, 41, 43, 36];
const STEPS = 16 * 8;                      // eight bars, then it loops
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

/** Renders eight bars of the groove into an AudioBuffer. */
async function renderGroove(sampleRate) {
  const length = Math.ceil(STEPS * STEP * sampleRate);
  const ctx = new OfflineAudioContext(2, length, sampleRate);
  const out = ctx.createGain(); out.gain.value = .5; out.connect(ctx.destination);
  const noiseBuf = ctx.createBuffer(1, sampleRate, sampleRate);
  const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const noise = () => { const s = ctx.createBufferSource(); s.buffer = noiseBuf; return s; };

  function pluck(time, freq, vol, len = .35) {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(), g2 = ctx.createGain();
    o.type = 'triangle'; o2.type = 'square'; o.frequency.value = freq; o2.frequency.value = freq * 2.002; g2.gain.value = .12;
    f.type = 'lowpass'; f.frequency.setValueAtTime(3200, time); f.frequency.exponentialRampToValueAtTime(700, time + len);
    g.gain.setValueAtTime(0, time); g.gain.linearRampToValueAtTime(vol, time + .004); g.gain.exponentialRampToValueAtTime(.0005, time + len);
    o.connect(f); o2.connect(g2).connect(f); f.connect(g).connect(out);
    o.start(time); o2.start(time); o.stop(time + len + .05); o2.stop(time + len + .05);
  }
  function bass(time, freq) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0, time); g.gain.linearRampToValueAtTime(.55, time + .01); g.gain.exponentialRampToValueAtTime(.001, time + .32);
    o.connect(g).connect(out); o.start(time); o.stop(time + .35);
  }
  function shekere(time, accent) {
    const n = noise(), f = ctx.createBiquadFilter(), g = ctx.createGain(); f.type = 'highpass'; f.frequency.value = 6500;
    g.gain.setValueAtTime(accent ? .18 : .08, time); g.gain.exponentialRampToValueAtTime(.001, time + .05);
    n.connect(f).connect(g).connect(out); n.start(time, Math.random() * .9); n.stop(time + .06);
  }
  function bell(time) {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = o2.type = 'square'; o.frequency.value = 820; o2.frequency.value = 1230;
    f.type = 'bandpass'; f.frequency.value = 1000; f.Q.value = 3;
    g.gain.setValueAtTime(.12, time); g.gain.exponentialRampToValueAtTime(.001, time + .12);
    o.connect(f); o2.connect(f); f.connect(g).connect(out); o.start(time); o2.start(time); o.stop(time + .13); o2.stop(time + .13);
  }
  function talkingDrum(time, up) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine';
    o.frequency.setValueAtTime(up ? 110 : 170, time); o.frequency.exponentialRampToValueAtTime(up ? 175 : 105, time + .18);
    g.gain.setValueAtTime(0, time); g.gain.linearRampToValueAtTime(.45, time + .008); g.gain.exponentialRampToValueAtTime(.001, time + .28);
    o.connect(g).connect(out); o.start(time); o.stop(time + .3);
  }
  function kick(time) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(120, time); o.frequency.exponentialRampToValueAtTime(45, time + .12);
    g.gain.setValueAtTime(.7, time); g.gain.exponentialRampToValueAtTime(.001, time + .2);
    o.connect(g).connect(out); o.start(time); o.stop(time + .22);
  }

  const lead = [0, 1, 2, 1, 2, 0, 1, 2, 0, 2, 1, 0, 2, 1, 2, 1];
  for (let i = 0; i < STEPS; i++) {
    const time = i * STEP, s = i % 16, bar = Math.floor(i / 16), chord = CHORDS[Math.floor(bar / 2)], root = BASS[Math.floor(bar / 2)];
    shekere(time, s % 4 === 0);
    if (s === 0 || s === 10) kick(time);
    if ([0, 3, 6, 10, 12].includes(s)) bell(time);
    if (s === 0 || s === 6 || s === 8 || s === 14) bass(time, midi(root + (s === 6 ? 7 : s === 14 ? 12 : 0)));
    if (s % 2 === 0) pluck(time, midi(chord[lead[s]] + 12), .16, .28);
    if (s % 4 === 2) chord.forEach((n) => pluck(time, midi(n), .06, .18));
    if (bar % 2 === 1 && (s === 13 || s === 15)) talkingDrum(time, s === 13);
  }
  return ctx.startRendering();
}

export function createSound() {
  let ctx = null, master = null, groove = null, loading = null;

  function startAmbience() {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const loop = () => { const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; return s; };
    // oil sizzling
    const sizzle = loop(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = 'bandpass'; f.frequency.value = 4200; f.Q.value = .7; g.gain.value = .05;
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 9; lg.gain.value = .025; lfo.connect(lg).connect(g.gain);
    sizzle.connect(f).connect(g).connect(master); sizzle.start(); lfo.start();
    // the crowd murmuring
    const crowd = loop(), cf = ctx.createBiquadFilter(), cg = ctx.createGain();
    cf.type = 'bandpass'; cf.frequency.value = 450; cf.Q.value = 1.2; cg.gain.value = .07;
    const cl = ctx.createOscillator(), clg = ctx.createGain(); cl.frequency.value = .35; clg.gain.value = .03; cl.connect(clg).connect(cg.gain);
    crowd.connect(cf).connect(cg).connect(master); crowd.start(); cl.start();
  }

  return {
    get on() { return !!ctx && ctx.state === 'running'; },
    get loading() { return !!loading; },
    async start() {
      if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        master = ctx.createGain(); master.gain.value = .55; master.connect(ctx.destination);
        startAmbience();
        loading = renderGroove(ctx.sampleRate).then((buf) => {
          groove = ctx.createBufferSource(); groove.buffer = buf; groove.loop = true;
          groove.connect(master); groove.start();
          loading = null;
        });
      }
      await ctx.resume();
      if (loading) await loading;
    },
    async stop() { if (ctx) await ctx.suspend(); },
  };
}
