// The evening as a game.
//
// You play behind Lois's table: tap a customer, tap the basket, the awara,
// the red flask under the table and the pepper jar to fill their black
// nylon, then tap the customer (or the nylon) to hand it over and get paid.
// Racheal's pan is in the corner window; tap it to add batter, and again to
// lift the kosai when they turn golden.
//
// Each evening has a target. Hit it and the night's takings go into the
// kiosk tin and the next evening opens, with one new surprise: transfers
// and fake alerts, NEPA, arguments, Oluwasegun's WhatsApp rush, V's sandal.

const PRICE = { kosai: 50, awara: 50, kunu: 300 };
const START = 330, CLOSE = 570;              // 5:30pm and 9:30pm on the game's clock
const TIN_GOAL = 100000;
const AWARA_TOTAL = { min: 3000, max: 7500 };  // what Mama Yan Bui charges, in whole ₦100s
const AWARA_COST_EACH = 40;
const BATCH = 9;
const FRY_SECONDS = 12;

// Evenings: a target each, and what is new that night.
const EVENINGS = [
  { target: 5000, news: null },
  { target: 6500, news: 'Customers can pay by transfer now. Watch out for fake alerts!' },
  { target: 8000, news: 'NEPA may take light tonight.' },
  { target: 9500, news: 'The crowd is bigger. Expect “I came first!”' },
  { target: 11000, news: 'Oluwasegun can post on the WhatsApp group for a rush.' },
  { target: 12500, news: 'Somebody may want V’s black sandal.' },
  { target: 14000, news: 'Everything at once. Good luck!' },
];
// What each evening from the second adds, in order.
const FEATURES = ['transfers', 'nepa', 'arguments', 'rush', 'sandal'];

const naira = (n) => `₦${Math.round(n).toLocaleString('en-NG')}`;
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((p) => p[1]);
const $ = (id) => document.getElementById(id);

export function createGame({ world, cast, customers, say, store, onClock, focus }) {
  const G = {};
  let tin = Number(store.get('tin')) || 0;
  let evening = Math.max(1, Number(store.get('evening')) || 1);
  const tonight = () => EVENINGS[Math.min(evening, EVENINGS.length) - 1];
  const has = (feature) => evening >= 2 + FEATURES.indexOf(feature);

  function reset() {
    Object.assign(G, {
      phase: 'start', min: START, paused: false,
      sales: 0, awaraCost: 0, mamaTotal: 0,
      stock: { kosai: 0, awara: 0, kunu: 25 },
      pan: { frying: false, t: 0 },
      selected: null, bag: { kosai: 0, awara: 0, kunu: 0, pepper: false },
      spawnIn: 6, rush: 0, rushCooldown: 0, vCooldown: 0,
      argueIn: 50, nepa: 0, nepaDone: 0,
      sandal: { buyer: null, askAt: 380 + Math.random() * 130, sold: 0, asked: false },
      stats: { served: 0, walkedOff: 0, fakeCaught: 0, fakeMissed: 0, burnt: 0, wrongChange: 0 },
    });
    customers.clear();
    world.sandal.visible = true;
    cast.setRush(false);
  }

  const hint = (text) => { $('hint').textContent = text; };

  // ---------- serving on the table ----------
  function select(c) {
    if (G.phase !== 'open' || G.paused || c.state !== 'waiting') return;
    if (G.selected === c) { pack(); return; }     // tapping them again hands it over
    returnBag();
    G.selected = c;
    hint(`Serving ${c.name}: tap the basket, awara, flask and pepper, then tap ${c.name} again`);
    renderAll();
  }
  function returnBag() {
    G.stock.kosai += G.bag.kosai; G.stock.awara += G.bag.awara; G.stock.kunu += G.bag.kunu;
    G.bag = { kosai: 0, awara: 0, kunu: 0, pepper: false };
  }
  const ITEM = { basket: 'kosai', awara: 'awara', flask: 'kunu' };

  /** A tap on something on Lois's table: 'basket', 'awara', 'flask', 'jar' or 'nylon'. */
  function tapTable(what) {
    if (G.phase !== 'open' || G.paused) return;
    const c = G.selected;
    if (what === 'nylon') { if (c) pack(); else hint('Tap a customer first'); return; }
    if (!c) { hint('Tap a customer first'); return; }
    if (what === 'jar') { G.bag.pepper = !G.bag.pepper; cast.loisDoes('kosai'); renderAll(); return; }
    const k = ITEM[what];
    if (!k) return;
    if (G.bag[k] >= c.order[k]) { hint(c.order[k] ? `That’s all the ${k} ${c.name} wants` : `${c.name} didn’t ask for ${k}`); return; }
    if (G.stock[k] <= 0) { hint(k === 'kosai' ? 'The basket is empty: tap Racheal’s pan' : `No ${k} left`); return; }
    G.stock[k]--; G.bag[k]++;
    cast.loisDoes(k);
    renderAll();
  }

  function pack() {
    const c = G.selected;
    if (!c || c.state !== 'waiting') return;
    const o = c.order, b = G.bag;
    const missing = ['kosai', 'awara', 'kunu'].filter((k) => b[k] !== o[k]).map((k) => `${o[k] - b[k]} more ${k}`);
    if (b.pepper !== o.pepper) missing.push(o.pepper ? 'pepper' : 'no pepper');
    if (missing.length) { say(c.person, `I still need ${missing[0]}!`, 2.5); c.patience = Math.max(0, c.patience - .08); return; }
    G.bag = { kosai: 0, awara: 0, kunu: 0, pepper: false };
    pay(c);
  }

  // ---------- the pan, in the corner window ----------
  const RAW = [232, 207, 154], GOLD = [201, 134, 46], BURNT = [58, 36, 20];
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const panProgress = () => G.pan.t / FRY_SECONDS;
  function panState() {
    if (!G.pan.frying) return { label: 'Racheal · tap to add batter', hot: false };
    const p = panProgress();
    if (p < .7) return { label: 'Racheal · frying…', hot: false };
    if (p < 1.05) return { label: 'Golden! Tap to lift', hot: true };
    if (p < 1.25) return { label: 'Getting dark! Tap!', hot: true };
    return { label: 'Burning!', hot: true };
  }
  function renderPan() {
    const p = panProgress();
    world.panKosai.forEach((k) => { k.visible = G.pan.frying; });
    if (G.pan.frying) {
      const c = p < .7 ? mix(RAW, GOLD, p / .7) : p < 1.05 ? GOLD : mix(GOLD, BURNT, Math.min(1, (p - 1.05) / .35));
      world.panKosaiMat.color.setRGB(c[0] / 255, c[1] / 255, c[2] / 255).convertSRGBToLinear();
    }
    const s = panState();
    $('insetLabel').textContent = s.label;
    $('inset').classList.toggle('hot', s.hot);
  }
  function tapPan() {
    if (G.phase !== 'open' || G.paused) return;
    if (!G.pan.frying) {
      G.pan.frying = true; G.pan.t = 0; renderPan();
      if (!G.selected && $('hint').textContent.includes('pan')) hint('Lift it when it glows golden. Tap a customer to serve them');
      return;
    }
    const p = panProgress();
    if (p < .7) { say(cast.racheal, 'Not done!', 1.5); return; }
    G.pan.frying = false;
    if (p < 1.25) G.stock.kosai += BATCH;
    else { G.stats.burnt++; say(cast.racheal, 'E don burn!', 2); }
    renderAll();
  }

  // ---------- pop-ups: a bar at the bottom for choices, the middle for start and end ----------
  const modal = $('modal'), sheet = $('sheet'), decide = $('decide');
  function open(html, buttons) {
    sheet.innerHTML = html;
    const row = document.createElement('div'); row.className = 'choices';
    buttons.forEach(([label, fn, cls]) => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = label;
      if (cls) b.className = cls;
      b.addEventListener('click', () => { modal.hidden = true; G.paused = false; fn(); });
      row.appendChild(b);
    });
    sheet.appendChild(row);
    modal.hidden = false; G.paused = true;
    row.querySelector('button')?.focus();
  }
  function ask(html, buttons) {
    decide.innerHTML = `<div class="dtext">${html}</div>`;
    const row = document.createElement('div'); row.className = 'dchoices';
    buttons.forEach(([label, fn, cls, disabled]) => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = label;
      if (cls) b.className = cls;
      b.disabled = !!disabled;
      b.addEventListener('click', () => { decide.hidden = true; G.paused = false; fn(); });
      row.appendChild(b);
    });
    decide.appendChild(row);
    decide.hidden = false; G.paused = true;
  }

  // ---------- money ----------
  function served(c, price, mood = 'happy') {
    G.sales += price;
    if (price > 0) say(cast.lois, `+${naira(price)}`, 1.6, 'coin');
    G.stats.served++;
    cast.handOver();
    customers.leave(c, mood);
    if (G.selected === c) G.selected = null;
    hint('Tap the next customer');
    renderAll();
  }

  function pay(c) {
    const o = c.order;
    const price = o.kosai * PRICE.kosai + o.awara * PRICE.awara + o.kunu * PRICE.kunu;
    if (!has('transfers') || Math.random() < .58) {
      const note = [500, 1000, 2000, 5000].find((n) => n >= price + (Math.random() < .3 ? 400 : 0)) || 5000;
      const change = note - price;
      if (change === 0) { ask(`<b>${c.name}</b> pays <b>${naira(note)}</b> cash. Exact money.`, [['Collect it', () => served(c, price), 'primary']]); return; }
      const options = shuffle([change, change + pick([50, 100]), Math.max(50, change - pick([50, 100]))]);
      ask(`<b>${c.name}</b> pays <b>${naira(note)}</b> for <b>${naira(price)}</b>. Change?`,
        options.map((v) => [naira(v), () => {
          if (v === change) served(c, price);
          else if (v > change) { G.stats.wrongChange++; served(c, price - (v - change)); }
          else { G.stats.wrongChange++; say(c.person, 'My change no complete!', 2.5); served(c, price, 'angry'); }
        }]));
      return;
    }
    const fake = Math.random() < .28;
    const trick = fake ? pick(['amount', 'pending', 'sender']) : null;
    const cut = [100, 150, 200].filter((d) => d < price);
    const shownAmount = trick === 'amount' ? (cut.length ? price - pick(cut) : price / 2) : price;
    const status = trick === 'pending' ? '<span class="bad">Pending</span>' : '<span class="good">Successful</span>';
    const from = trick === 'sender' ? 'Unknown Sender' : c.name.toUpperCase() + ' ' + pick(['A.', 'O.', 'I.', 'M.']);
    ask(`<b>${c.name}</b> transferred for <b>${naira(price)}</b>. <span class="alert">Alert: <b>${naira(shownAmount)}</b> · ${from} · ${status}</span>`,
      shuffle([
        ['Money don land', () => {
          if (fake) { G.stats.fakeMissed++; served(c, 0); setTimeout(() => say(cast.lois, 'Fake alert!', 2.5), 2500); }
          else served(c, price);
        }],
        ['Check am again', () => {
          if (fake) { G.stats.fakeCaught++; say(c.person, 'Ehen… cash then.', 2.5); served(c, price); }
          else { c.patience = Math.max(.05, c.patience - .1); served(c, price); }
        }],
      ]));
  }

  // ---------- the surprises ----------
  function argue() {
    const w = customers.waiting.sort((a, b) => a.arrivedAt - b.arrivedAt);
    if (w.length < 3) return false;
    const first = w[Math.floor(Math.random() * (w.length - 1))];
    const second = pick(w.filter((c) => c.arrivedAt > first.arrivedAt));
    say(second.person, 'I came first!', 3);
    ask(`<b>Wahala!</b> ${first.name} and ${second.name} are arguing about who came first.`, shuffle([
      [`Serve ${first.name} first`, () => { [first, second].forEach((c) => { c.patience = Math.min(1, c.patience + .2); }); select(first); }],
      [`Serve ${second.name} first`, () => { say(first.person, 'No fair! I’m going.', 2.5); customers.leave(first, 'angry'); G.stats.walkedOff++; if (G.selected === first) G.selected = null; select(second); }],
    ]).concat([
      ['Free kosai for both (2)', () => { G.stock.kosai -= 2; [first, second].forEach((c) => { c.patience = Math.min(1, c.patience + .3); }); renderAll(); }, '', G.stock.kosai < 2],
      [G.vCooldown > 0 ? `V is tired (${Math.ceil(G.vCooldown)}s)` : 'Ask V to calm them', () => { G.vCooldown = 60; [first, second].forEach((c) => { c.patience = Math.min(1, c.patience + .25); }); say(cast.vee, 'Una calm down!', 2.5); }, '', G.vCooldown > 0],
    ]));
    return true;
  }

  function post() {
    if (G.phase !== 'open' || G.paused || !has('rush') || G.rushCooldown > 0) return;
    G.rush = 40; G.rushCooldown = 100; cast.setRush(true);
    focus('stall', 3);
    say(cast.seg, 'Posted on the group!', 2.5);
    renderAll();
  }

  function tapV() {
    if (G.phase !== 'open' || G.paused) return;
    if (!has('sandal')) { say(cast.vee, 'Hi Lois!', 1.5); return; }
    const buyer = G.sandal.buyer;
    if (G.sandal.sold) { say(cast.vee, 'Thanks for my sandal!', 2); return; }
    if (!buyer || buyer.state !== 'waiting') { say(cast.vee, 'Any buyer for my sandal?', 2.5); return; }
    const max = 3500 + Math.random() * 2500;
    ask(`<b>${buyer.name}</b> wants V’s black sandal. How much?`,
      [3000, 4500, 6000].map((price) => [naira(price), () => {
        G.sandal.buyer = null;
        if (price <= max) { G.sandal.sold = price; world.sandal.visible = false; say(cast.vee, `Sold! ${naira(price)}`, 2.5); }
        else say(buyer.person, 'Too much!', 2.5);
      }]));
  }

  // ---------- the evening ----------
  function newOrder() {
    const o = { kosai: pick([2, 2, 3, 4, 4, 6, 6, 8, 10]), awara: 0, kunu: 0, pepper: Math.random() < .6 };
    if (Math.random() < .45) o.awara = pick([1, 2, 2, 3, 4]);
    if (Math.random() < .35) o.kunu = pick([1, 1, 2]);
    return o;
  }

  function start() {
    reset();
    G.phase = 'open';
    cast.mamaComes('deliver');
    focus('stall', 4);
    hint('Tap Racheal’s pan to start frying');
    renderAll();
  }

  function closing() {
    G.phase = 'closing';
    customers.list.forEach((c) => { if (c.state === 'coming' || c.state === 'waiting') customers.leave(c); });
    G.selected = null; returnBag(); renderAll();
    focus('stall', 99);
    if (G.mamaTotal) cast.mamaComes('collect'); else closeUp();
  }

  function closeUp() {
    G.phase = 'closed';
    G.awaraCost = G.mamaTotal || 0;
    cast.mamaLeaves();
    const profit = Math.max(0, G.sales - G.awaraCost);
    const target = tonight().target;
    const hit = G.sales >= target;
    if (hit) { tin += profit; store.set('tin', String(tin)); }
    const s = G.stats;
    const stars = Math.max(1, Math.min(5, Math.round(1 + s.served / 6 - s.walkedOff / 3 - s.fakeMissed / 2 - s.burnt / 3)));
    const full = hit && tin >= TIN_GOAL;
    const was = evening;
    if (hit) { evening++; store.set('evening', String(evening)); }
    open(`<h2>${hit ? `Evening ${was}: target hit!` : `Evening ${was}: so close`}</h2>
      <p class="stars" aria-label="${stars} out of 5 stars">${'★'.repeat(stars)}${'☆'.repeat(5 - stars)}</p>
      <dl class="sum">
        <div><dt>Sales</dt><dd>${naira(G.sales)} of ${naira(target)}</dd></div>
        <div><dt>Mama Yan Bui’s awara money</dt><dd>−${naira(G.awaraCost)}</dd></div>
        <div class="total"><dt>${hit ? 'Into the kiosk tin' : 'Kiosk tin (target missed)'}</dt><dd>${hit ? naira(profit) : '₦0'}</dd></div>
        <div><dt>Served / walked off</dt><dd>${s.served} / ${s.walkedOff}</dd></div>
        ${has('transfers') ? `<div><dt>Fake alerts caught / missed</dt><dd>${s.fakeCaught} / ${s.fakeMissed}</dd></div>` : ''}
        <div><dt>Burnt pans</dt><dd>${s.burnt}</dd></div>
        ${G.sandal.sold ? `<div><dt>V’s sandal sold for her</dt><dd>${naira(G.sandal.sold)}</dd></div>` : ''}
      </dl>
      <p>Kiosk tin: <b>${naira(tin)}</b> of ${naira(TIN_GOAL)}.${full ? ' <b>It’s full! The kiosk is coming!</b>' : ''}</p>`,
      [[hit ? `On to evening ${evening}` : 'Try again', welcome, 'primary']]);
    renderAll();
  }

  function welcome() {
    reset(); renderAll();
    const t = tonight();
    open(`<h2>Evening ${evening}</h2>
      <p>Tonight’s target: <b>${naira(t.target)}</b> before 9:30pm.</p>
      ${t.news ? `<p class="news">New tonight: ${t.news}</p>` : ''}
      ${evening === 1 ? `<ol class="how">
        <li><b>Fry:</b> tap Racheal’s pan (top left) to add batter, and again when it glows golden.</li>
        <li><b>Serve:</b> tap a customer, then tap the basket, the awara, the red flask under the table and the pepper jar.</li>
        <li><b>Hand over:</b> tap the customer again, then take the money.</li>
        <li>Tap <b>Stall view</b> any time to see the whole place.</li>
      </ol>` : ''}
      <p>Kiosk tin: ${naira(tin)} of ${naira(TIN_GOAL)}.</p>`,
      [['Open the stall', start, 'primary']]);
  }

  // ---------- what the screen shows ----------
  function renderAll() {
    const shown = Math.min(world.basketKosai.length, G.stock.kosai);
    world.basketKosai.forEach((k, i) => { k.visible = i < shown; });
    const filled = G.bag.kosai + G.bag.awara + G.bag.kunu;
    world.nylon.scale.set(1 + filled * .03, .35 + Math.min(1, filled / 8) * .6, 1 + filled * .03);
    $('money').textContent = `${naira(G.sales)} tonight`;
    const t = tonight().target;
    $('targetLabel').textContent = `Evening ${evening} · ${naira(G.sales)} of ${naira(t)}`;
    $('targetFill').style.width = `${Math.min(100, G.sales / t * 100)}%`;
    const seg = $('segun');
    seg.hidden = !has('rush');
    seg.disabled = G.phase !== 'open' || G.rushCooldown > 0;
    seg.textContent = G.rush > 0 ? 'Rush is on!' : G.rushCooldown > 0 ? `Oluwasegun: ${Math.ceil(G.rushCooldown)}s` : 'Oluwasegun: post';
    renderPan();
  }

  /** What each waiting customer's bubble says, for main.js to draw over their heads. */
  function bubbles() {
    return customers.waiting.map((c) => ({
      person: c.person, name: c.name, order: c.order, patience: c.patience,
      selected: G.selected === c, bag: G.selected === c ? G.bag : null,
    }));
  }

  // Mama Yan Bui: awara at opening, her money at closing
  cast.events.onMamaDelivers = (mama) => {
    G.mamaTotal = Math.round((AWARA_TOTAL.min + Math.random() * (AWARA_TOTAL.max - AWARA_TOTAL.min)) / 100) * 100;
    G.stock.awara += Math.round(G.mamaTotal / AWARA_COST_EACH);
    say(mama, 'I’ll come for my money at closing!', 2.5);
    renderAll();
  };
  cast.events.onMamaCollects = (mama) => {
    if (G.phase !== 'closing') return;
    say(mama, `My awara money: ${naira(G.mamaTotal)}`, 3);
    setTimeout(closeUp, 2600);
  };

  let tickUi = 0;
  function update(dt) {
    if (G.phase !== 'open' || G.paused) return;
    G.min += dt;
    onClock(G.min, G.nepa > 0);
    if (G.pan.frying) { G.pan.t += dt; if (panProgress() > 1.7) { G.pan.frying = false; G.stats.burnt++; say(cast.racheal, 'E don burn!', 2); } }

    const progress = (G.min - START) / (CLOSE - START);
    const busier = has('arguments') ? 1.25 : 1;
    G.spawnIn -= dt * (G.rush > 0 ? 2.2 : 1) * busier;
    if (G.spawnIn <= 0 && G.min > START + 12 && G.min < CLOSE - 8) {
      customers.arrive(newOrder(), G.min);
      G.spawnIn = 9 - progress * 4.5 + Math.random() * 2.5;
    }
    G.rush = Math.max(0, G.rush - dt); if (G.rush === 0) cast.setRush(false);
    G.rushCooldown = Math.max(0, G.rushCooldown - dt);
    G.vCooldown = Math.max(0, G.vCooldown - dt);
    if (G.nepa > 0) G.nepa -= dt;
    else if (has('nepa') && G.nepaDone < 2 && G.min > 420 + G.nepaDone * 70 && Math.random() < dt / 40) {
      G.nepa = 25; G.nepaDone++; focus('stall', 3); say(cast.lois, 'NEPA took light!', 2.5);
    }

    for (const c of customers.waiting) if (c.patience <= 0) {
      say(c.person, pick(['I don tire!', 'I’m going!', 'Too long!']), 2.5);
      customers.leave(c, 'angry'); G.stats.walkedOff++;
      if (G.selected === c) { G.selected = null; returnBag(); }
    }
    if (has('sandal') && !G.sandal.asked && G.min > G.sandal.askAt) {
      const who = customers.waiting.find((c) => c.female) || customers.waiting[0];
      if (who) { G.sandal.asked = true; G.sandal.buyer = who; say(who.person, 'How much for that sandal?', 3.5); hint('Someone wants V’s sandal: tap V in Stall view'); }
    }
    if (has('arguments')) { G.argueIn -= dt; if (G.argueIn <= 0) G.argueIn = argue() ? 55 + Math.random() * 30 : 10; }

    if (G.min >= CLOSE) { closing(); return; }
    tickUi += dt;
    if (tickUi > .25) { tickUi = 0; renderAll(); }
  }

  reset(); renderAll(); welcome();

  return {
    update, select, tapTable, tapPan, tapV, post, bubbles,
    get running() { return (G.phase === 'open' || G.phase === 'closing') && !G.paused; },
    get min() { return G.min; },
    get phase() { return G.phase; },
    pause() { if (G.phase !== 'open' || G.paused) return; open('<h2>Paused</h2>', [['Carry on', () => {}, 'primary']]); },
  };
}
