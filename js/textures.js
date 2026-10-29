// Textures drawn on a canvas at load time, so the game downloads no images.
import * as THREE from 'three';

export const rnd = (a, b) => a + Math.random() * (b - a);

export function canvasTex(w, h, draw, repeat = [1, 1]) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.anisotropy = 4;
  return t;
}

/** Cement blocks laid in courses, the way the house and the wall are built. */
function blocks(base, line) {
  return (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    const bh = h / 8, bw = w / 4;
    for (let r = 0; r < 8; r++) for (let c = -1; c < 5; c++) {
      const x = c * bw + (r % 2 ? bw / 2 : 0);
      g.fillStyle = `rgba(0,0,0,${rnd(0, .12)})`; g.fillRect(x + 2, r * bh + 2, bw - 4, bh - 4);
      g.fillStyle = `rgba(255,255,255,${rnd(0, .06)})`; g.fillRect(x + 4, r * bh + 4, bw - 10, bh / 3);
    }
    g.strokeStyle = line; g.lineWidth = 3;
    for (let r = 0; r <= 8; r++) { g.beginPath(); g.moveTo(0, r * bh); g.lineTo(w, r * bh); g.stroke(); }
    for (let r = 0; r < 8; r++) for (let c = 0; c < 5; c++) {
      const x = c * bw + (r % 2 ? bw / 2 : 0);
      g.beginPath(); g.moveTo(x, r * bh); g.lineTo(x, (r + 1) * bh); g.stroke();
    }
  };
}

/** Corrugated roofing sheet, `tint` shifting it from new silver to old rust. */
function zinc(tint) {
  return (g, w, h) => {
    for (let x = 0; x < w; x += 16) {
      const gr = g.createLinearGradient(x, 0, x + 16, 0);
      gr.addColorStop(0, tint[0]); gr.addColorStop(.5, tint[1]); gr.addColorStop(1, tint[0]);
      g.fillStyle = gr; g.fillRect(x, 0, 16, h);
    }
    for (let i = 0; i < 70; i++) {
      g.fillStyle = `rgba(${140 + rnd(0, 60)},${70 + rnd(0, 30)},30,${rnd(.05, .3)})`;
      g.beginPath(); g.ellipse(rnd(0, w), rnd(0, h), rnd(2, 12), rnd(1, 5), 0, 0, 7); g.fill();
    }
  };
}

/** Ankara wax print for wrappers: a base colour with repeating motifs. */
export function ankara(base, a, b) {
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 32) for (let x = 0; x < w; x += 32) {
      const ox = (y / 32) % 2 ? 16 : 0;
      g.fillStyle = a; g.beginPath(); g.arc(x + ox + 16, y + 16, 10, 0, 7); g.fill();
      g.fillStyle = b; g.beginPath(); g.arc(x + ox + 16, y + 16, 5, 0, 7); g.fill();
      g.fillStyle = a; g.fillRect(x + ox + 2, y + 2, 5, 5);
    }
  }, [3, 2]);
}

export function makeTextures() {
  return {
    block: canvasTex(256, 256, blocks('#b49676', '#8b7259'), [3, 2]),
    blockDark: canvasTex(256, 256, blocks('#7a6450', '#5b4a3b'), [3, 1.5]),
    plaster: canvasTex(128, 128, (g, w, h) => {
      g.fillStyle = '#d8c7a8'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(90,70,50,${rnd(0, .08)})`; g.fillRect(rnd(0, w), rnd(0, h), rnd(1, 4), rnd(1, 4)); }
    }, [2, 1]),
    zinc: canvasTex(256, 64, zinc(['#7f878c', '#b9c0c4']), [10, 1]),
    zincOld: canvasTex(256, 64, zinc(['#6e4e3a', '#9a6c4c']), [8, 1]),
    dirt: canvasTex(512, 512, (g, w, h) => {
      g.fillStyle = '#8f6a4e'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 4000; i++) { const s = rnd(.5, 2.5); g.fillStyle = `rgba(${rnd(70, 180)},${rnd(50, 120)},${rnd(30, 80)},${rnd(.15, .45)})`; g.fillRect(rnd(0, w), rnd(0, h), s, s); }
      for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(70,45,30,${rnd(.04, .12)})`; g.beginPath(); g.ellipse(rnd(0, w), rnd(0, h), rnd(20, 70), rnd(8, 30), rnd(0, 3), 0, 7); g.fill(); }
    }, [16, 16]),
    road: canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = '#7d5a42'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 1500; i++) { g.fillStyle = `rgba(${rnd(60, 150)},${rnd(45, 100)},${rnd(30, 60)},${rnd(.2, .5)})`; g.fillRect(rnd(0, w), rnd(0, h), rnd(1, 3), rnd(1, 3)); }
      g.strokeStyle = 'rgba(50,32,22,.25)'; g.lineWidth = 6;
      [.35, .65].forEach((p) => { g.beginPath(); g.moveTo(0, h * p); g.lineTo(w, h * p + rnd(-4, 4)); g.stroke(); });
    }, [20, 1]),
    gate: canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = '#211c19'; g.fillRect(0, 0, w, h);
      for (let x = 0; x < w; x += 22) { g.fillStyle = '#2d2622'; g.fillRect(x + 2, 0, 16, h); g.fillStyle = '#16120f'; g.fillRect(x + 18, 0, 4, h); }
      for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(${120 + rnd(0, 60)},${55 + rnd(0, 25)},25,${rnd(.15, .45)})`; g.beginPath(); g.ellipse(rnd(0, w), rnd(0, h), rnd(2, 14), rnd(4, 30), 0, 0, 7); g.fill(); }
    }),
    wood: canvasTex(128, 64, (g, w, h) => {
      g.fillStyle = '#8a5a33'; g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 4) { g.strokeStyle = `rgba(60,35,15,${rnd(.1, .35)})`; g.beginPath(); g.moveTo(0, y + rnd(0, 3)); g.bezierCurveTo(w / 3, y + rnd(-3, 3), w * 2 / 3, y + rnd(-3, 3), w, y + rnd(0, 3)); g.stroke(); }
    }),
    holes: canvasTex(64, 64, (g, w, h) => {
      g.fillStyle = '#2f9a4a'; g.fillRect(0, 0, w, h); g.fillStyle = '#0f3d1a';
      for (let y = 4; y < h; y += 10) for (let x = 4 + (y % 20 ? 5 : 0); x < w; x += 10) { g.beginPath(); g.arc(x, y, 2.6, 0, 7); g.fill(); }
    }, [6, 2]),
    smoke: canvasTex(64, 64, (g) => {
      const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, 'rgba(220,215,210,.55)'); gr.addColorStop(1, 'rgba(220,215,210,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    }),
  };
}
