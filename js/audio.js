// Sound, all made in code: an original highlife groove and the stall itself.
//
// No recordings, so nothing here belongs to anybody else. The groove is
// highlife-style: a bright two-guitar pattern over I–IV–V–I, a bouncing
// bass, shekere on every sixteenth, a bell, and a talking-drum slide.
// Under it, oil sizzling in the pan and a crowd murmuring.
// Browsers only allow sound after a tap, so nothing plays until `start()`.

const BPM = 112;
const STEP = 60 / BPM / 4;                 // one sixteenth note
// C – F – G – C, two bars each; MIDI notes
const CHORDS = [[60, 64, 67], [65, 69, 72], [67, 71, 74], [60, 64, 67]];
const BASS = [36, 41, 43, 36];
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

export function createSound() {
  let ctx = null, master = null, music = null, ambience = null, timer = null, nextTime = 0, step = 0;
  let noiseBuf = null;

  function noise() {
    const src = ctx.createBufferSource(); src.buffer = noiseBuf; return src;
  }

  function pluck(time, freq, vol, length = .35) {
    // a bright, quickly fading guitar-like pluck
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'triangle'; o2.type = 'square'; o.frequency.value = freq; o2.frequency.value = freq * 2.002;
    f.type = 'lowpass'; f.frequency.setValueAtTime(3200, time); f.frequency.exponentialRampToValueAtTime(700, time + length);
    const g2 = ctx.createGain(); g2.gain.value = .12;
    g.gain.setValueAtTime(0, time); g.gain.linearRampToValueAtTime(vol, time + .004); g.gain.exponentialRampToValueAtTime(.0005, time + length);
    o.connect(f); o2.connect(g2).connect(f); f.connect(g).connect(music);
    o.start(time); o2.start(time); o.stop(time + length + .05); o2.stop(time + length + .05);
  }

  function bass(time, freq) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(freq, time);
    g.gain.setValueAtTime(0, time); g.gain.linearRampToValueAtTime(.55, time + .01); g.gain.exponentialRampToValueAtTime(.001, time + .32);
    o.connect(g).connect(music); o.start(time); o.stop(time + .35);
  }

  function shekere(time, accent) {
    const n = noise(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = 'highpass'; f.frequency.value = 6500;
    g.gain.setValueAtTime(accent ? .18 : .08, time); g.gain.exponentialRampToValueAtTime(.001, time + .05);
    n.connect(f).connect(g).connect(music); n.start(time, Math.random()); n.stop(time + .06);
  }

  function bell(time) {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'square'; o2.type = 'square'; o.frequency.value = 820; o2.frequency.value = 1230;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1000; f.Q.value = 3;
    g.gain.setValueAtTime(.12, time); g.gain.exponentialRampToValueAtTime(.001, time + .12);
    o.connect(f); o2.connect(f); f.connect(g).connect(music);
    o.start(time); o2.start(time); o.stop(time + .13); o2.stop(time + .13);
  }

  function talkingDrum(time, up) {
    // pitch bends like a squeezed dundun
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(up ? 110 : 170, time); o.frequency.exponentialRampToValueAtTime(up ? 175 : 105, time + .18);
    g.gain.setValueAtTime(0, time); g.gain.linearRampToValueAtTime(.45, time + .008); g.gain.exponentialRampToValueAtTime(.001, time + .28);
    o.connect(g).connect(music); o.start(time); o.stop(time + .3);
  }

  function kick(time) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(120, time); o.frequency.exponentialRampToValueAtTime(45, time + .12);
    g.gain.setValueAtTime(.7, time); g.gain.exponentialRampToValueAtTime(.001, time + .2);
    o.connect(g).connect(music); o.start(time); o.stop(time + .22);
  }

  function scheduleStep(i, time) {
    const s = i % 16, bar = Math.floor(i / 16) % 8, chord = CHORDS[Math.floor(bar / 2)], root = BASS[Math.floor(bar / 2)];
    shekere(time, s % 4 === 0);
    if (s === 0 || s === 10) kick(time);
    if ([0, 3, 6, 10, 12].includes(s)) bell(time);                       // a 3-2 style bell line
    if (s === 0 || s === 6 || s === 8 || s === 14) bass(time, midi(root + (s === 6 ? 7 : s === 14 ? 12 : 0)));
    // lead guitar: a running highlife pattern up and down the chord
    const lead = [0, 1, 2, 1, 2, 0, 1, 2, 0, 2, 1, 0, 2, 1, 2, 1];
    if (s % 2 === 0) pluck(time, midi(chord[lead[s]] + 12), .16, .28);
    // rhythm guitar on the off-beats
    if (s % 4 === 2) chord.forEach((n) => pluck(time, midi(n), .06, .18));
    if (bar % 2 === 1 && (s === 13 || s === 15)) talkingDrum(time, s === 13);
  }

  function tick() {
    while (nextTime < ctx.currentTime + .15) { scheduleStep(step++, nextTime); nextTime += STEP; }
  }

  function startAmbience() {
    // oil sizzling: crackly filtered noise
    const sizzle = noise(); sizzle.loop = true;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 4200; f.Q.value = .7;
    const g = ctx.createGain(); g.gain.value = .05;
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 9; lg.gain.value = .025; lfo.connect(lg).connect(g.gain);
    sizzle.connect(f).connect(g).connect(ambience); sizzle.start(); lfo.start();
    // a crowd murmuring: low voices drifting in and out
    const crowd = noise(); crowd.loop = true;
    const cf = ctx.createBiquadFilter(); cf.type = 'bandpass'; cf.frequency.value = 450; cf.Q.value = 1.2;
    const cg = ctx.createGain(); cg.gain.value = .07;
    const cl = ctx.createOscillator(), clg = ctx.createGain(); cl.frequency.value = .35; clg.gain.value = .03; cl.connect(clg).connect(cg.gain);
    crowd.connect(cf).connect(cg).connect(ambience); crowd.start(); cl.start();
  }

  return {
    get on() { return !!ctx && ctx.state === 'running'; },
    async start() {
      if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        master = ctx.createGain(); master.gain.value = .55; master.connect(ctx.destination);
        music = ctx.createGain(); music.gain.value = .5; music.connect(master);
        ambience = ctx.createGain(); ambience.gain.value = .8; ambience.connect(master);
        noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
        const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        startAmbience();
        nextTime = ctx.currentTime + .1;
      }
      await ctx.resume();
      if (!timer) timer = setInterval(tick, 40);
    },
    async stop() {
      if (timer) { clearInterval(timer); timer = null; }
      if (ctx) await ctx.suspend();
    },
  };
}
