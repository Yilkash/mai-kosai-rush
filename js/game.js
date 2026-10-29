// The evening as a game: frying, orders, money, and the chaos.
//
// One evening runs 5:30 to 9:30pm, one game minute per real second. Kosai
// come out of Racheal's pan into the green basket; students crowd round and
// order; you pack each order in a black nylon and take cash or a transfer.
// Fake alerts, arguments, Oluwasegun's WhatsApp rush, NEPA and V's sandal
// keep it from being easy. What is left at 9:30 goes into the kiosk tin.

const PRICE = { kosai: 50, awara: 50, kunu: 300 };
const START = 330, CLOSE = 570;              // 5:30pm and 9:30pm on the game's clock
const TIN_GOAL = 100000;
const AWARA_TOTAL = { min: 3000, max: 7500 };  // what Mama Yan Bui charges, in whole ₦100s
const AWARA_COST_EACH = 40;                    // so ₦3,000 buys 75 pieces
const BATCH = 9;                               // kosai per pan
const FRY_SECONDS = 12;                        // raw to just-right

const naira = (n) => `₦${Math.round(n).toLocaleString('en-NG')}`;
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((p) => p[1]);
const $ = (id) => document.getElementById(id);

export function createGame({ world, cast, customers, say, store, onClock }) {
  const G = {};
  let tin = Number(store.get('tin')) || 0;

  function reset() {
    Object.assign(G, {
      phase: 'start', min: START, paused: false,
      sales: 0, awaraCost: 0,
      stock: { kosai: 0, awara: 0, kunu: 25 },
      pan: { frying: false, t: 0 },
      selected: null, bag: { kosai: 0, awara: 0, kunu: 0, pepper: false },
      spawnIn: 6, rush: 0, rushCooldown: 0, vCooldown: 0,
      argueIn: 50, nepa: 0, nepaDone: 0,
      sandal: { buyer: null, askAt: 380 + Math.random() * 130, sold: 0, asked: false },
      mamaTotal: 0,
      stats: { served: 0, walkedOff: 0, fakeCaught: 0, fakeMissed: 0, burnt: 0, wrongChange: 0 },
    });
    customers.clear();
    world.sandal.visible = true;
    cast.setRush(false);
  }

  // ---------- the order strip, the pan and the tray ----------
  const ordersEl = $('orders'), packingEl = $('packing');
  function describe(o) {
    const parts = [];
    if (o.kosai) parts.push(`${o.kosai} kosai`);
    if (o.awara) parts.push(`${o.awara} awara`);
    if (o.kunu) parts.push(`${o.kunu} kunu`);
    parts.push(o.pepper ? 'pepper' : 'no pepper');
    return parts.join(' · ');
  }
  function renderOrders() {
    const waiting = customers.waiting.sort((a, b) => a.arrivedAt - b.arrivedAt);
    ordersEl.replaceChildren(...waiting.map((c) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'card' + (G.selected === c ? ' on' : '');
      b.setAttribute('aria-pressed', String(G.selected === c));
      const tone = c.patience > .5 ? 'ok' : c.patience > .25 ? 'warn' : 'bad';
      b.innerHTML = `<b>${c.name}</b><span>${describe(c.order)}</span><i class="pat ${tone}"><i style="width:${Math.round(c.patience * 100)}%"></i></i>`;
      b.addEventListener('click', () => select(c));
      return b;
    }));
  }
  function select(c) {
    if (G.phase !== 'open' || c.state !== 'waiting') return;
    returnBag();
    G.selected = c;
    renderOrders(); renderBag();
  }
  function returnBag() {
    G.stock.kosai += G.bag.kosai; G.stock.awara += G.bag.awara; G.stock.kunu += G.bag.kunu;
    G.bag = { kosai: 0, awara: 0, kunu: 0, pepper: false };
  }
  function renderBag() {
    const c = G.selected;
    $('pepper').setAttribute('aria-pressed', String(G.bag.pepper));
    if (!c) { packingEl.textContent = 'Tap an order card to start packing'; return; }
    const o = c.order, bag = G.bag;
    const row = (k) => (o[k] || bag[k]) ? `${k} ${bag[k]}/${o[k]}` : null;
    packingEl.textContent = `For ${c.name}: ` + ['kosai', 'awara', 'kunu'].map(row).filter(Boolean).join(' · ') + (bag.pepper ? ' · pepper' : '');
  }
  function renderStock() {
    $('stock').textContent = `Basket: ${G.stock.kosai} kosai · Awara ${G.stock.awara} · Kunu ${G.stock.kunu} cups`;
    const shown = Math.min(world.basketKosai.length, G.stock.kosai);
    world.basketKosai.forEach((k, i) => { k.visible = i < shown; });
  }
  function renderHud() {
    $('money').textContent = `${naira(G.sales)} tonight`;
    $('tinLabel').textContent = `Kiosk tin · ${naira(tin)} of ${naira(TIN_GOAL)}`;
    $('tinFill').style.width = `${Math.min(100, tin / TIN_GOAL * 100)}%`;
    const seg = $('segun');
    seg.disabled = G.phase !== 'open' || G.rushCooldown > 0;
    seg.textContent = G.rush > 0 ? 'Segun posted: rush is on!' : G.rushCooldown > 0 ? `Segun: post again in ${Math.ceil(G.rushCooldown)}s` : 'Segun: post on WhatsApp';
  }

  // the tray buttons
  document.querySelectorAll('[data-add]').forEach((b) => b.addEventListener('click', () => {
    const k = b.dataset.add;
    if (!G.selected) { packingEl.textContent = 'Tap an order card first'; return; }
    if (G.stock[k] <= 0) {
      if (k === 'kosai') packingEl.textContent = 'Basket is empty: lift the kosai from the pan';
      else packingEl.textContent = `No ${k} left`;
      return;
    }
    G.stock[k]--; G.bag[k]++;
    cast.loisDoes(k);
    renderBag(); renderStock();
  }));
  $('pepper').addEventListener('click', () => { if (!G.selected) return; G.bag.pepper = !G.bag.pepper; renderBag(); });
  $('clearBag').addEventListener('click', () => { returnBag(); renderBag(); renderStock(); });
  $('pack').addEventListener('click', () => {
    const c = G.selected;
    if (!c || c.state !== 'waiting') return;
    const o = c.order, b = G.bag;
    const wrong = [];
    for (const k of ['kosai', 'awara', 'kunu']) if (b[k] !== o[k]) wrong.push(`${o[k]} ${k}`);
    if (b.pepper !== o.pepper) wrong.push(o.pepper ? 'pepper' : 'no pepper');
    if (wrong.length) {
      say(c.person, `I said ${wrong[0]}!`, 2.5);
      c.patience = Math.max(0, c.patience - .15);
      return;
    }
    G.bag = { kosai: 0, awara: 0, kunu: 0, pepper: false };
    pay(c);
  });

  // the pan
  const panBtn = $('panBtn'), panFill = $('panFill'), panLabel = $('panLabel');
  const RAW = [232, 207, 154], GOLD = [201, 134, 46], BURNT = [58, 36, 20];
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  function panProgress() { return G.pan.t / FRY_SECONDS; }
  function renderPan() {
    const p = panProgress();
    world.panKosai.forEach((k) => { k.visible = G.pan.frying; });
    if (!G.pan.frying) { panLabel.textContent = 'Pan is empty'; panBtn.textContent = 'Add batter'; panFill.style.width = '0%'; return; }
    const c = p < .7 ? mix(RAW, GOLD, p / .7) : p < 1.05 ? GOLD : mix(GOLD, BURNT, Math.min(1, (p - 1.05) / .35));
    world.panKosaiMat.color.setRGB(c[0] / 255, c[1] / 255, c[2] / 255).convertSRGBToLinear();
    panFill.style.width = `${Math.min(100, p / 1.4 * 100)}%`;
    panLabel.textContent = p < .7 ? 'Frying…' : p < 1.05 ? 'Golden! Lift them now' : p < 1.25 ? 'Getting dark!' : 'Burning!';
    panBtn.textContent = 'Lift into basket';
    panBtn.classList.toggle('hot', p >= .7 && p < 1.25);
  }
  panBtn.addEventListener('click', () => {
    if (G.phase !== 'open') return;
    if (!G.pan.frying) { G.pan.frying = true; G.pan.t = 0; renderPan(); return; }
    const p = panProgress();
    if (p < .7) { say(cast.racheal, 'Not done!', 1.5); return; }
    G.pan.frying = false;
    if (p < 1.25) { G.stock.kosai += BATCH; }
    else { G.stats.burnt++; say(cast.racheal, 'E don burn!', 2); }
    renderPan(); renderStock();
  });

  // ---------- money ----------
  const modal = $('modal'), sheet = $('sheet');
  function open(html, buttons) {
    sheet.innerHTML = html;
    const row = document.createElement('div'); row.className = 'choices';
    buttons.forEach(([label, fn, cls, disabled]) => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = label;
      if (cls) b.className = cls;
      b.disabled = !!disabled;
      b.addEventListener('click', () => { close(); fn(); });
      row.appendChild(b);
    });
    sheet.appendChild(row);
    modal.hidden = false; G.paused = true;
    row.querySelector('button:not(:disabled)')?.focus();
  }
  function close() { modal.hidden = true; G.paused = false; }

  // In-game choices sit in a bar where the packing tray is, so the stall stays in view.
  const decide = $('decide'), tray = document.querySelector('.tray');
  function ask(html, buttons) {
    decide.innerHTML = `<div class="dtext">${html}</div>`;
    const row = document.createElement('div'); row.className = 'dchoices';
    buttons.forEach(([label, fn, cls, disabled]) => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = label;
      if (cls) b.className = cls;
      b.disabled = !!disabled;
      b.addEventListener('click', () => { decide.hidden = true; tray.hidden = false; G.paused = false; fn(); });
      row.appendChild(b);
    });
    decide.appendChild(row);
    decide.hidden = false; tray.hidden = true; G.paused = true;
  }
  const deciding = () => !decide.hidden;

  function served(c, price, mood = 'happy') {
    G.sales += price;
    if (price > 0) say(cast.lois, `+${naira(price)}`, 1.6, 'coin');
    G.stats.served++;
    cast.handOver();
    customers.leave(c, mood);
    if (G.selected === c) G.selected = null;
    renderOrders(); renderBag(); renderHud();
  }

  function pay(c) {
    const o = c.order;
    const price = o.kosai * PRICE.kosai + o.awara * PRICE.awara + o.kunu * PRICE.kunu;
    if (Math.random() < .58) {
      // cash: pick the right change
      const note = [500, 1000, 2000, 5000].find((n) => n >= price + (Math.random() < .3 ? 400 : 0)) || 5000;
      const change = note - price;
      if (change === 0) {
        ask(`<b>${c.name}</b> pays <b>${naira(note)}</b> cash. Exact money.`,
          [['Collect it', () => served(c, price), 'primary']]);
        return;
      }
      const options = shuffle([change, change + pick([50, 100]), Math.max(50, change - pick([50, 100]))]);
      ask(`<b>${c.name}</b> pays <b>${naira(note)}</b> for <b>${naira(price)}</b>. Change?`,
        options.map((v) => [naira(v), () => {
          if (v === change) served(c, price);
          else if (v > change) { G.stats.wrongChange++; served(c, price - (v - change)); }
          else { G.stats.wrongChange++; say(c.person, 'My change no complete!', 2.5); served(c, price, 'angry'); }
        }]));
    } else {
      // transfer: watch for the fake alert
      const fake = Math.random() < .28;
      const trick = fake ? pick(['amount', 'pending', 'sender']) : null;
      const cut = [100, 150, 200].filter((d) => d < price);
      const shownAmount = trick === 'amount' ? (cut.length ? price - pick(cut) : price / 2) : price;
      const status = trick === 'pending' ? '<span class="bad">Pending</span>' : '<span class="good">Successful</span>';

      const from = trick === 'sender' ? 'Unknown Sender' : c.name.toUpperCase() + ' ' + pick(['A.', 'O.', 'I.', 'M.']);
      ask(`<b>${c.name}</b> transferred for <b>${naira(price)}</b>.
        <span class="alert">Alert: <b>${naira(shownAmount)}</b> · ${from} · ${status}</span>`,
        shuffle([
          ['Money don land', () => {
            if (fake) { G.stats.fakeMissed++; served(c, 0, 'happy'); setTimeout(() => say(cast.lois, 'Fake alert!', 2.5), 2500); }
            else served(c, price);
          }],
          ['Check am again', () => {
            if (fake) { G.stats.fakeCaught++; say(c.person, 'Ehen… cash then.', 2.5); served(c, price); }
            else { c.patience = Math.max(.05, c.patience - .1); served(c, price); }
          }],
        ]));
    }
  }

  // ---------- the chaos ----------
  function argue() {
    const w = customers.waiting.sort((a, b) => a.arrivedAt - b.arrivedAt);
    if (w.length < 3) return false;
    const first = w[Math.floor(Math.random() * (w.length - 1))];
    const later = w.filter((c) => c.arrivedAt > first.arrivedAt);
    const second = pick(later);
    say(second.person, 'I came first!', 3);
    ask(`<b>Wahala!</b> ${first.name} and ${second.name} are arguing about who came first.`, shuffle([
      [`Serve ${first.name} first`, () => { [first, second].forEach((c) => { c.patience = Math.min(1, c.patience + .2); }); select(first); }],
      [`Serve ${second.name} first`, () => { say(first.person, 'No fair! I’m going.', 2.5); customers.leave(first, 'angry'); G.stats.walkedOff++; if (G.selected === first) G.selected = null; select(second); }],
    ]).concat([
      ['Free kosai for both (2)', () => { G.stock.kosai -= 2; [first, second].forEach((c) => { c.patience = Math.min(1, c.patience + .3); }); renderStock(); }, '', G.stock.kosai < 2],
      [G.vCooldown > 0 ? `V is tired (${Math.ceil(G.vCooldown)}s)` : 'Ask V to calm them', () => { G.vCooldown = 60; [first, second].forEach((c) => { c.patience = Math.min(1, c.patience + .25); }); say(cast.vee, 'Una calm down!', 2.5); }, '', G.vCooldown > 0],
    ]));
    return true;
  }

  $('segun').addEventListener('click', () => {
    if (G.phase !== 'open' || G.rushCooldown > 0) return;
    G.rush = 40; G.rushCooldown = 100; cast.setRush(true);
    say(cast.seg, 'Posted on the group!', 2.5);
    renderHud();
  });

  /** Tapping V on the bench. */
  function tapV() {
    if (G.phase !== 'open') return;
    const buyer = G.sandal.buyer;
    if (G.sandal.sold) { say(cast.vee, 'Thanks for my sandal!', 2); return; }
    if (!buyer || buyer.state !== 'waiting') { say(cast.vee, 'Any buyer for my sandal?', 2.5); return; }
    const max = 3500 + Math.random() * 2500;
    ask(`<b>${buyer.name}</b> wants V’s black sandal. How much?`,
      [3000, 4500, 6000].map((price) => [naira(price), () => {
        G.sandal.buyer = null;
        if (price <= max) {
          G.sandal.sold = price; world.sandal.visible = false;
          say(cast.vee, `Sold! ${naira(price)}`, 2.5);
        } else say(buyer.person, 'Too much!', 2.5);
      }]));
  }

  function nepa(on) {
    G.nepa = on ? 25 : 0;
    if (on) { G.nepaDone++; say(cast.lois, 'NEPA took light!', 2.5); }
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
    cast.mamaComes();
    renderAll();
  }

  /** 9:30pm: everybody goes, Mama Yan Bui comes for her money, then the count. */
  function closing() {
    G.phase = 'closing';
    customers.list.forEach((c) => { if (c.state === 'coming' || c.state === 'waiting') customers.leave(c); });
    G.selected = null; returnBag(); renderAll();
    if (G.mamaTotal) cast.mamaComes('collect'); else closeUp();
  }
  function closeUp() {
    G.phase = 'closed';
    G.awaraCost = G.mamaTotal || 0;
    cast.mamaLeaves();
    const profit = G.sales - G.awaraCost;
    const before = tin;
    tin += Math.max(0, profit);
    store.set('tin', String(tin));
    const full = before < TIN_GOAL && tin >= TIN_GOAL;
    const s = G.stats;
    const stars = Math.max(1, Math.min(5, Math.round(1 + s.served / 6 - s.walkedOff / 3 - s.fakeMissed / 2 - s.burnt / 3)));
    open(`<h2>9:30pm. Mai Kosai is closed!</h2>
      <p class="stars" aria-label="${stars} out of 5 stars">${'★'.repeat(stars)}${'☆'.repeat(5 - stars)}</p>
      <dl class="sum">
        <div><dt>Sales</dt><dd>${naira(G.sales)}</dd></div>
        <div><dt>Mama Yan Bui’s awara money</dt><dd>−${naira(G.awaraCost)}</dd></div>
        <div class="total"><dt>Into the kiosk tin</dt><dd>${naira(Math.max(0, profit))}</dd></div>
        <div><dt>Customers served</dt><dd>${s.served}</dd></div>
        <div><dt>Walked off angry</dt><dd>${s.walkedOff}</dd></div>
        <div><dt>Fake alerts caught / missed</dt><dd>${s.fakeCaught} / ${s.fakeMissed}</dd></div>
        <div><dt>Burnt pans</dt><dd>${s.burnt}</dd></div>
        ${G.sandal.sold ? `<div><dt>V’s sandal sold for her</dt><dd>${naira(G.sandal.sold)}</dd></div>` : ''}
      </dl>
      <p>Kiosk tin: <b>${naira(tin)}</b> of ${naira(TIN_GOAL)}.${full ? ' <b>It’s full! The kiosk is coming!</b>' : ''}</p>`,
      [['Next evening', start, 'primary']]);
    renderAll();
  }

  function renderAll() { renderOrders(); renderBag(); renderStock(); renderPan(); renderHud(); }

  // Mama Yan Bui drops the awara at opening and comes back for her money at closing
  cast.events.onMamaDelivers = (mama) => {
    G.mamaTotal = Math.round((AWARA_TOTAL.min + Math.random() * (AWARA_TOTAL.max - AWARA_TOTAL.min)) / 100) * 100;
    G.stock.awara += Math.round(G.mamaTotal / AWARA_COST_EACH);
    say(mama, 'I’ll come for my money at closing!', 2.5);
    renderStock();
  };
  cast.events.onMamaCollects = (mama) => {
    if (G.phase !== 'closing') return;
    say(mama, `My awara money: ${naira(G.mamaTotal)}`, 3);
    setTimeout(closeUp, 2600);
  };

  let tickUi = 0;
  function update(dt) {
    if (G.phase !== 'open' || G.paused) return;
    G.min += dt;                                   // one game minute per second
    onClock(G.min, G.nepa > 0);
    if (G.pan.frying) { G.pan.t += dt; if (panProgress() > 1.7) { G.pan.frying = false; G.stats.burnt++; say(cast.racheal, 'E don burn!', 2); } }

    // customers come faster as the evening goes on, and much faster in a rush
    const progress = (G.min - START) / (CLOSE - START);
    G.spawnIn -= dt * (G.rush > 0 ? 2.2 : 1);
    if (G.spawnIn <= 0 && G.min > START + 12 && G.min < CLOSE - 8) {
      customers.arrive(newOrder(), G.min);
      G.spawnIn = 9 - progress * 4.5 + Math.random() * 2.5;
    }
    G.rush = Math.max(0, G.rush - dt); if (G.rush === 0) cast.setRush(false);
    G.rushCooldown = Math.max(0, G.rushCooldown - dt);
    G.vCooldown = Math.max(0, G.vCooldown - dt);
    if (G.nepa > 0) G.nepa -= dt;
    else if (G.nepaDone < 2 && G.min > 420 + G.nepaDone * 70 && Math.random() < dt / 40) nepa(true);

    // the walk-offs
    for (const c of customers.waiting) if (c.patience <= 0) {
      say(c.person, pick(['I don tire!', 'I’m going!', 'Too long!']), 2.5);
      customers.leave(c, 'angry'); G.stats.walkedOff++;
      if (G.selected === c) { G.selected = null; returnBag(); }
    }
    // the sandal buyer
    if (!G.sandal.asked && G.min > G.sandal.askAt) {
      const who = customers.waiting.find((c) => c.female) || customers.waiting[0];
      if (who) { G.sandal.asked = true; G.sandal.buyer = who; say(who.person, 'How much for that sandal?', 3.5); packingEl.textContent = 'Someone wants V’s sandal: tap V'; }
    }
    // arguments
    G.argueIn -= dt;
    if (G.argueIn <= 0) G.argueIn = argue() ? 55 + Math.random() * 30 : 10;

    if (G.min >= CLOSE) { closing(); return; }
    tickUi += dt;
    if (tickUi > .25) { tickUi = 0; renderOrders(); renderPan(); renderHud(); }
  }

  // the start screen
  reset(); renderAll();
  open(`<h2>Mai Kosai Rush</h2>
    <p>Help <b>Lois</b> and <b>Racheal</b> run the kosai stall from <b>5:30 to 9:30pm</b>.</p>
    <ol class="how">
      <li><b>Fry:</b> add batter, then lift the kosai into the green basket when they turn golden. Don’t let them burn.</li>
      <li><b>Serve:</b> tap an order card, add the kosai, awara and kunu, set the pepper, then <b>Pack in black nylon</b>.</li>
      <li><b>Get paid:</b> give the right change, and watch out for <b>fake alerts</b>.</li>
      <li><b>Wahala:</b> settle arguments, tap <b>V</b> to sell her sandal, and let <b>Segun</b> post on WhatsApp when you’re ready for a rush.</li>
    </ol>
    <p>Everything you make goes into the <b>kiosk tin</b>: ${naira(tin)} of ${naira(TIN_GOAL)} so far.</p>`,
    [['Start the evening', start, 'primary']]);

  return {
    update, tapV, select,
    get running() { return (G.phase === 'open' || G.phase === 'closing') && !G.paused; },
    get min() { return G.min; },
    pause() { if (G.phase !== 'open' || G.paused) return; open('<h2>Paused</h2>', [['Carry on', () => {}, 'primary']]); },
  };
}
