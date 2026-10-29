// The evening as a game.
//
// Each evening starts with Racheal and Lois walking up from the road and
// setting up. Then you serve from Lois's table: tap a customer (or their
// order), add what they asked for on the card at the bottom, and pack it.
// Racheal fries by herself and fills the basket.
//
// Each evening has a target. Hit it and the night's takings go into the
// kiosk tin and the next evening opens, with one new surprise: transfers
// and fake alerts, NEPA, arguments, V's sandal. Oluwasegun can post on the
// WhatsApp group for a rush from the first evening.

const PRICE = { kosai: 50, puff: 50, awara: 50, kunu: 300 };   // puff-puff price is a guess until the user confirms
const START = 330, CLOSE = 570;              // 5:30pm and 9:30pm on the game's clock
const TIN_GOAL = 100000;
const AWARA_TOTAL = { min: 3000, max: 7500 };  // what Mama Yan Bui charges, in whole ₦100s
const AWARA_COST_EACH = 40;
const BATCH = 10;
const FRY_SECONDS = 11;

// Evenings: a target each, and what is new that night.
const EVENINGS = [
  { target: 5000, news: null },
  { target: 6500, news: 'NEPA may take light tonight.' },
  { target: 8000, news: 'The crowd is bigger. Expect “I came first!”' },
  { target: 9500, news: 'Somebody may want V’s black sandal. Tap V in Stall view.' },
  { target: 11000, news: 'Everything at once. Good luck!' },
  { target: 12500, news: 'More fake alerts tonight. Check every one!' },
  { target: 14000, news: 'The busiest evening yet.' },
];
// What each evening from the second adds, in order. Transfers (and fake alerts) are there from the first.
const FEATURES = ['nepa', 'arguments', 'sandal'];
const V_LINES = ['Lois, this crowd ehn!', 'Oluwasegun, snap me too!', 'Who wants fine sandal?', 'Racheal, the kosai smell sweet o!', 'Na wa for this heat!', 'Lois, give me one kosai na 😄', 'Hahaha!'];
const V_VISITS = [
  ['Lois, how far? Market dey move?', 'E dey move small small!', 'Okay, let me not disturb you.'],
  ['See as you fine today!', 'Thank you jare!', 'I go siddon now.'],
  ['Make I help you count money?', 'No o, I don see you!', 'Hahaha!'],
];
const ITEMS = ['kosai', 'puff', 'awara', 'kunu'];
const NAME = { kosai: 'kosai', puff: 'puff-puff', awara: 'awara', kunu: 'kunu' };
const empty = () => ({ kosai: 0, puff: 0, awara: 0, kunu: 0, pepper: false });
/** "6 kosai, 4 puff-puff, pepper" */
export const orderText = (o) => [...ITEMS.filter((k) => o[k]).map((k) => `${o[k]} ${NAME[k]}`), o.pepper ? 'pepper' : 'no pepper'].join(', ');

const naira = (n) => `₦${Math.round(n).toLocaleString('en-NG')}`;
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((p) => p[1]);
const $ = (id) => document.getElementById(id);

export function createGame({ world, cast, customers, say, store, onClock, focus, onPause = () => {} }) {
  const G = {};
  let tin = Number(store.get('tin')) || 0;
  let evening = Math.max(1, Number(store.get('evening')) || 1);
  const tonight = () => EVENINGS[Math.min(evening, EVENINGS.length) - 1];
  const has = (feature) => evening >= 2 + FEATURES.indexOf(feature);

  function reset() {
    Object.assign(G, {
      phase: 'start', min: START, paused: false,
      sales: 0, awaraCost: 0, mamaTotal: 0,
      stock: { kosai: 0, puff: 0, awara: 0, kunu: 25 },
      pan: { t: 0 }, segIntro: false, paying: false, taughtFake: false, triciaCame: false, triciaAt: START + 45 + Math.random() * 60, vChatIn: 25, vVisitIn: 90,
      selected: null, bag: empty(),
      spawnIn: 6, rush: 0, rushCooldown: 0, vCooldown: 0,
      argueIn: 50, nepa: 0, nepaDone: 0,
      sandal: { buyer: null, askAt: 380 + Math.random() * 130, sold: 0, asked: false },
      stats: { served: 0, walkedOff: 0, fakeCaught: 0, fakeMissed: 0, burnt: 0, wrongChange: 0 },
    });
    customers.clear();
    world.sandal.visible = true;
    $('serve').hidden = true; $('skip').hidden = true;
    world.panKosai.forEach((k) => { k.visible = false; });
    cast.setRush(false);
  }

  const hint = (text) => { $('hint').textContent = text; };

  // ---------- serving on the table ----------
  function select(c) {
    if (G.phase !== 'open' || G.paused || c.state !== 'waiting') return;
    if (G.selected === c) { pack(); return; }     // tapping them again hands it over
    returnBag();
    G.selected = c;
    renderAll();
  }
  function returnBag() {
    ITEMS.forEach((k) => { G.stock[k] += G.bag[k]; });
    G.bag = empty();
  }
  const ITEM = { basket: 'kosai', bowl: 'puff', awara: 'awara', flask: 'kunu' };

  /** A tap on something on Lois's table: 'basket', 'awara', 'flask', 'jar' or 'nylon'. */
  function tapTable(what) {
    if (G.phase !== 'open' || G.paused) return;
    const c = G.selected;
    if (what === 'nylon') { if (c) pack(); else hint('Tap a customer first'); return; }
    if (!c) { hint('Tap a customer first'); return; }
    if (what === 'jar') {
      if (!c.order.pepper) { hint(`${c.name} said no pepper`); return; }
      G.bag.pepper = !G.bag.pepper; cast.loisDoes('kosai'); renderAll(); return;
    }
    const k = ITEM[what];
    if (!k) return;
    if (G.bag[k] >= c.order[k]) { hint(c.order[k] ? `That’s all the ${NAME[k]} ${c.name} wants` : `${c.name} didn’t ask for ${NAME[k]}`); return; }
    if (G.stock[k] <= 0) { hint(k === 'kosai' || k === 'puff' ? `No ${NAME[k]} left. Racheal is frying more…` : `No ${NAME[k]} left`); return; }
    G.stock[k]--; G.bag[k]++;
    cast.loisDoes(k === 'puff' ? 'kosai' : k);
    renderAll();
  }

  function pack() {
    const c = G.selected;
    if (!c || c.state !== 'waiting') return;
    const o = c.order, b = G.bag;
    const missing = ITEMS.filter((k) => b[k] !== o[k]).map((k) => `${o[k] - b[k]} more ${NAME[k]}`);
    if (b.pepper !== o.pepper) missing.push(o.pepper ? 'pepper' : 'no pepper');
    if (missing.length) { say(c.person, `I still need ${missing[0]}!`, 2.5); return; }
    G.bag = empty();
    G.paying = true;
    renderAll();
    pay(c);
  }

  // ---------- Racheal's pan: she fries by herself and fills the basket ----------
  const RAW = [232, 207, 154], GOLD = [201, 134, 46];
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  function fry(dt) {
    G.pan.t += dt;
    const p = Math.min(1, G.pan.t / FRY_SECONDS);
    world.panKosai.forEach((k) => { k.visible = true; });
    const c = mix(RAW, GOLD, p);
    world.panKosaiMat.color.setRGB(c[0] / 255, c[1] / 255, c[2] / 255).convertSRGBToLinear();
    if (G.pan.t >= FRY_SECONDS) {
      G.pan.t = 0;
      // Racheal fries kosai, and every third batch puff-puff
      G.batches = (G.batches || 0) + 1;
      const k = G.batches % 3 === 0 && G.stock.puff < 24 ? 'puff' : 'kosai';
      if (G.stock[k] < 40) G.stock[k] += k === 'puff' ? 8 : BATCH;
    }
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
    $('serve').hidden = true;
  }

  // ---------- money ----------
  function served(c, price, mood = 'happy') {
    G.sales += price;
    if (price > 0) say(cast.lois, `+${naira(price)}`, 1.6, 'coin');
    G.stats.served++;
    cast.handOver();
    customers.leave(c, mood);
    if (G.selected === c) G.selected = null;
    G.paying = false;
    hint(customers.waiting.length > 1 ? 'Tap the next customer' : '');
    renderAll();
  }

  function pay(c) {
    const o = c.order;
    const price = ITEMS.reduce((n, k) => n + o[k] * PRICE[k], 0);
    const teachFake = evening === 1 && G.stats.served === 2 && !G.taughtFake;
    if (guiding() || (!teachFake && Math.random() < (evening === 1 ? .7 : .58))) {
      const note = [500, 1000, 2000, 5000].find((n) => n >= price + (Math.random() < .3 ? 400 : 0)) || 5000;
      const change = note - price;
      if (change === 0) { ask(`<b>${c.name}</b> pays <b>${naira(note)}</b> cash. Exact money.`, [['Collect it', () => served(c, price), 'primary']]); return; }
      const options = shuffle([change, change + pick([50, 100]), Math.max(50, change - pick([50, 100]))]);
      const help = guiding() ? `<br><small>${naira(note)} − ${naira(price)} = the change. Pick it.</small>` : '';
      ask(`<b>${c.name}</b> pays <b>${naira(note)}</b> for <b>${naira(price)}</b>. Change?${help}`,
        options.map((v) => [naira(v), () => {
          if (v === change) served(c, price);
          else if (v > change) { G.stats.wrongChange++; served(c, price - (v - change)); }
          else { G.stats.wrongChange++; say(c.person, 'My change no complete!', 2.5); served(c, price, 'angry'); }
        }]));
      return;
    }
    if (teachFake) G.taughtFake = true;
    const fake = teachFake || Math.random() < (evening === 1 ? .2 : .28);
    const trick = teachFake ? 'pending' : fake ? pick(['amount', 'pending', 'sender']) : null;
    const cut = [100, 150, 200].filter((d) => d < price);
    const shownAmount = trick === 'amount' ? (cut.length ? price - pick(cut) : price / 2) : price;
    const status = trick === 'pending' ? '<span class="bad">Pending</span>' : '<span class="good">Successful</span>';
    const from = trick === 'sender' ? 'Unknown Sender' : c.name.toUpperCase() + ' ' + pick(['A.', 'O.', 'I.', 'M.']);
    const tip = teachFake ? '<br><small>Look well: a real alert is the full amount, from their name, and says Successful.</small>' : '';
    ask(`<b>${c.name}</b> transferred for <b>${naira(price)}</b>. <span class="alert">Alert: <b>${naira(shownAmount)}</b> · ${from} · ${status}</span>${tip}`,
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
    if (G.phase !== 'open' || G.paused) return;
    if (G.rushCooldown > 0) { say(cast.seg, `Wait small, I just posted (${Math.ceil(G.rushCooldown)}s)`, 2); return; }
    G.rush = 40; G.rushCooldown = 100; cast.setRush(true);
    focus('stall', 3);
    say(cast.seg, 'Posted on the WhatsApp group! They’re coming!', 2.5);
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
    const o = { ...empty(), kosai: pick([2, 2, 3, 4, 4, 6, 6, 8, 10]), pepper: Math.random() < .6 };
    if (Math.random() < .3) o.puff = pick([2, 3, 4, 5]);
    if (o.puff && Math.random() < .3) o.kosai = 0;   // some come for puff-puff alone
    if (Math.random() < .45) o.awara = pick([1, 2, 2, 3, 4]);
    if (Math.random() < .35) o.kunu = pick([1, 1, 2]);
    return o;
  }

  function start() {
    reset();
    G.phase = 'setup';
    focus('stall', 999);
    $('skip').hidden = false;
    hint('Racheal and Lois are setting up…');
    cast.opening(opened);
    renderAll();
  }
  function opened() {
    $('skip').hidden = true;
    G.phase = 'open';
    G.stock.kosai = BATCH;          // Racheal's first batches, fried while Lois went for water
    G.stock.puff = 8;
    focus('stall', 4);
    hint('');
    cast.mamaComes('deliver');
    renderAll();
  }
  $('skip').addEventListener('click', () => { cast.skipOpening(); cast.skipClosing(); });

  function closing() {
    G.phase = 'closing';
    customers.list.forEach((c) => { if (c.state === 'coming' || c.state === 'waiting') customers.leave(c); });
    G.selected = null; returnBag(); renderAll();
    focus('stall', 99);
    if (G.mamaTotal) cast.mamaComes('collect'); else tidyUp();
  }

  /** Lois washes up and Racheal pours the leftover oil away before the night's results. */
  function tidyUp() {
    if (G.phase !== 'closing') return;
    hint('Closing time: washing up…');
    $('skip').hidden = false;
    cast.closing(() => { $('skip').hidden = true; hint(''); closeUp(); });
  }
  function closeUp() {
    if (G.phase !== 'closing') return;
    G.phase = 'closed';
    G.awaraCost = G.mamaTotal || 0;
    cast.mamaLeaves();
    const profit = Math.max(0, G.sales - G.awaraCost);
    const target = tonight().target;
    const hit = G.sales >= target;
    if (hit) { tin += profit; store.set('tin', String(tin)); }
    const s = G.stats;
    const stars = Math.max(1, Math.min(5, Math.round(1 + s.served / 6 - s.walkedOff / 3 - s.fakeMissed / 2)));
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
        <div><dt>Fake alerts caught / missed</dt><dd>${s.fakeCaught} / ${s.fakeMissed}</dd></div>
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
        <li>Racheal fries kosai and puff-puff. You help Lois sell.</li>
        <li><b>Tap a customer</b> (or their order) to serve them.</li>
        <li>Add what they asked for, then <b>Pack &amp; give</b> and take the money.</li>
        <li>Some pay by transfer. <b>Watch for fake alerts!</b></li>
        <li>Need more customers? Tap <b>Oluwasegun</b> to post on the WhatsApp group.</li>
      </ol>` : ''}
      <p>Kiosk tin: ${naira(tin)} of ${naira(TIN_GOAL)}.</p>`,
      [['Open the stall', start, 'primary']]);
  }

  // ---------- the first customer, step by step ----------
  const guiding = () => evening === 1 && G.stats.served === 0 && G.phase === 'open';
  /** The next thing to tap while guiding: 'order', an item, 'pepper' or 'pack'. */
  function guideStep() {
    if (!guiding() || G.paying) return null;
    const c = G.selected;
    if (!c) return customers.waiting.length ? 'order' : null;
    const k = ITEMS.find((i) => G.bag[i] < c.order[i]);
    if (k) return k;
    if (c.order.pepper && !G.bag.pepper) return 'pepper';
    return 'pack';
  }

  // ---------- the serving card at the bottom ----------
  const serve = $('serve');
  serve.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    const act = b.dataset.act;
    if (act === 'close') { returnBag(); G.selected = null; renderAll(); return; }
    if (act === 'pack') { pack(); return; }
    if (act === 'pepper') { tapTable('jar'); return; }
    tapTable({ kosai: 'basket', puff: 'bowl', awara: 'awara', kunu: 'flask' }[act]);
  });
  function renderCard() {
    const c = G.selected;
    if (!c || G.paying || !decide.hidden || G.phase !== 'open') { serve.hidden = true; serve.dataset.html = ''; return; }
    const o = c.order, b = G.bag, step = guideStep();
    const ready = ITEMS.every((k) => b[k] === o[k]) && b.pepper === o.pepper;
    const btn = (act, label, done) => `<button type="button" data-act="${act}" class="${done ? 'got' : ''}${step === act ? ' pulse' : ''}">${label}</button>`;
    const say = { kosai: 'Tap Kosai', puff: 'Tap Puff-puff', awara: 'Tap Awara', kunu: 'Tap Kunu', pepper: 'Add pepper', pack: 'All done! Pack & give' }[step];
    const html = `<div class="stitle"><span><b>${c.name}</b> wants ${orderText(o)}</span><button type="button" data-act="close" class="x" aria-label="Stop serving ${c.name}">✕</button></div>
      ${say ? `<div class="sguide">${say}</div>` : ''}
      <div class="sbtns">
        ${ITEMS.filter((k) => o[k]).map((k) => btn(k, `${NAME[k][0].toUpperCase() + NAME[k].slice(1)} ${b[k]}/${o[k]}`, b[k] === o[k])).join('')}
        ${o.pepper ? btn('pepper', b.pepper ? 'Pepper ✓' : 'Add pepper', b.pepper) : '<span class="chip">No pepper</span>'}
      </div>
      <button type="button" data-act="pack" class="packbtn primary${step === 'pack' ? ' pulse' : ''}" ${ready ? '' : 'disabled'}>Pack &amp; give ${c.name}</button>`;
    if (serve.dataset.html !== html) { serve.innerHTML = html; serve.dataset.html = html; }
    serve.hidden = false;
  }

  // ---------- what the screen shows ----------
  function renderAll() {
    const shown = Math.min(world.basketKosai.length, G.stock.kosai);
    world.basketKosai.forEach((k, i) => { k.visible = i < shown; });
    const filled = ITEMS.reduce((n, k) => n + G.bag[k], 0);
    world.bowlPuff.forEach((p, i) => { p.visible = i < G.stock.puff; });
    world.nylon.scale.set(1 + filled * .03, .35 + Math.min(1, filled / 8) * .6, 1 + filled * .03);
    $('money').textContent = `${naira(G.sales)} tonight`;
    const t = tonight().target;
    $('targetLabel').textContent = `Evening ${evening} · ${naira(G.sales)} of ${naira(t)}`;
    $('targetFill').style.width = `${Math.min(100, G.sales / t * 100)}%`;
    const seg = $('segun');
    seg.hidden = G.phase !== 'open';
    seg.disabled = G.rushCooldown > 0;
    seg.textContent = G.rush > 0 ? 'More customers coming!' : G.rushCooldown > 0 ? `Oluwasegun posted · ${Math.ceil(G.rushCooldown)}s` : 'Oluwasegun: post on WhatsApp';
    if (guiding() && !G.selected && !customers.waiting.length && customers.list.length) hint('Your first customer is coming…');
    else if (guideStep() === 'order') hint(`Tap ${customers.waiting[0].name} or their order to serve them`);
    renderCard();
  }

  /** What each waiting customer's bubble says, for main.js to draw over their heads. */
  function bubbles() {
    return customers.waiting.map((c) => ({
      person: c.person, name: c.name, order: c.order, patience: c.patience,
      selected: G.selected === c, customer: c, text: orderText(c.order),
      guide: guideStep() === 'order' && c === customers.waiting[0],
    }));
  }

  // Mama Yan Bui: awara at opening, her money at closing
  cast.events.onMamaDelivers = (mama) => {
    G.mamaTotal = Math.round((AWARA_TOTAL.min + Math.random() * (AWARA_TOTAL.max - AWARA_TOTAL.min)) / 100) * 100;
    G.stock.awara += Math.round(G.mamaTotal / AWARA_COST_EACH);
    say(mama, `Lois, awara is ${naira(G.mamaTotal)} today`, 3);
    ask(`<b>Mama Yan Bui:</b> “Lois, the awara is <b>${naira(G.mamaTotal)}</b> today. I’ll collect my money at 9:30.”`,
      [['OK, Mama', () => {}, 'primary']]);
    renderAll();
  };
  cast.events.onMamaCollects = (mama) => {
    if (G.phase !== 'closing') return;
    say(mama, `My awara money: ${naira(G.mamaTotal)}`, 3);
    setTimeout(() => { cast.mamaLeaves(); tidyUp(); }, 2600);
  };

  let tickUi = 0;
  function update(dt) {
    if (G.phase !== 'open' || G.paused) return;
    G.min += dt;
    onClock(G.min, G.nepa > 0);
    fry(dt);
    if (evening === 1 && !G.segIntro && G.min > START + 25 && G.stats.served > 0) {
      G.segIntro = true;
      say(cast.seg, 'I’m Oluwasegun! Tap me to post on the WhatsApp group', 4.5);
    }

    // Tricia comes by, sits on the bench, and Lois puts kosai on a plate for her
    if (!G.triciaCame && G.min > G.triciaAt) {
      G.triciaCame = true;
      cast.triciaComes(() => {
        const n = Math.min(5, G.stock.kosai);
        G.stock.kosai -= n;
        cast.serveTricia(n);
        say(cast.lois, n ? 'Tricia, see your kosai!' : 'Wait small, Tricia!', 2.2);
        renderAll();
      });
    }
    // V keeps the place lively
    G.vChatIn -= dt;
    if (G.vChatIn <= 0) { G.vChatIn = 30 + Math.random() * 30; say(cast.vee, pick(V_LINES), 2.4); }
    G.vVisitIn -= dt;
    if (G.vVisitIn <= 0) { G.vVisitIn = 100 + Math.random() * 60; cast.veeVisit(pick(V_VISITS)); }

    const progress = (G.min - START) / (CLOSE - START);
    const busier = has('arguments') ? 1.25 : 1;
    // not too many at once: three waiting on the first evening, one more each evening after
    const room = customers.list.filter((c) => c.state === 'coming' || c.state === 'waiting').length < Math.min(8, 2 + evening + (G.rush > 0 ? 2 : 0));
    G.spawnIn -= dt * (G.rush > 0 ? 2.2 : 1) * busier;
    if (guiding()) {
      // the first customer comes alone, and nobody else until they're served
      if (!customers.list.length && G.min > START + 4) customers.arrive({ ...empty(), kosai: 4, pepper: true }, G.min);
    } else if (G.spawnIn <= 0 && room && G.min < CLOSE - 8) {
      customers.arrive(newOrder(), G.min);
      G.spawnIn = (evening === 1 ? 12 : 9) - progress * 4.5 + Math.random() * 2.5;
    }
    G.rush = Math.max(0, G.rush - dt); if (G.rush === 0) cast.setRush(false);
    G.rushCooldown = Math.max(0, G.rushCooldown - dt);
    G.vCooldown = Math.max(0, G.vCooldown - dt);
    if (G.nepa > 0) G.nepa -= dt;
    else if (has('nepa') && G.nepaDone < 2 && G.min > 420 + G.nepaDone * 70 && Math.random() < dt / 40) {
      G.nepa = 25; G.nepaDone++; focus('stall', 3); say(cast.lois, 'NEPA took light!', 2.5);
    }

    if (guiding()) customers.waiting.forEach((c) => { c.patience = Math.max(c.patience, .6); });   // the first one waits for you
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
    update, select, tapTable, tapV, post, bubbles,
    get running() { return (G.phase === 'open' || G.phase === 'closing' || G.phase === 'setup') && !G.paused; },
    get min() { return G.min; },
    get phase() { return G.phase; },
    pause() {
      if (G.phase !== 'open' || G.paused) return;
      onPause(true);   // the music stops too
      open('<h2>Paused</h2>', [['Carry on', () => onPause(false), 'primary']]);
    },
  };
}
