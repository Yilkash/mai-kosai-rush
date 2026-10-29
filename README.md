# Mai Kosai Rush

A 3D browser game set at the Mai Kosai stall: Racheal fries kosai in the zinc house, Lois serves the crowd at her table, Oluwasegun snaps for the WhatsApp group from the long bench, from 5:30 to 9:30pm.

Play: https://yilkash.github.io/mai-kosai-rush/

How to play: each evening starts with Racheal and Lois walking up from the road with loads on their heads. Racheal brings the pan out through the black gate, Lois fills her bucket at the tap, Mama Naomi brings the firewood, Baban Dany comes out to greet them, and the fire is lit (Skip if you've seen it). Mama Yan Bui drops the awara and tells Lois the price. Then you sell: tap a customer or their written order, add what they asked for on the card at the bottom, tap **Pack & give** and give the right change or check the transfer alert for fakes (on the first evening the first customer walks you through it). Racheal fries by herself and fills the basket. Tap Oluwasegun's green button to post on the WhatsApp group for a rush. **Stall view** shows the whole place with everyone's names; **Table view** is behind Lois's table. Each evening (5:30 to 9:30pm, about four minutes) has a sales target; hit it and the night's profit, less Mama Yan Bui's awara money, goes into the kiosk tin (₦100,000 goal) and the next evening adds something new: NEPA, arguments, V's sandal. Progress is saved on the phone.

`?speed=10` on the address runs the evening faster, for testing.

- Plain HTML, CSS and JavaScript modules, no build step. Three.js r160 is vendored in `js/vendor/` (MIT, see `THREE-LICENSE`) so it works offline.
- Every texture is drawn in code and the music is made in code (an original highlife-style groove), so there are no image or audio files.

| File | What it holds |
|---|---|
| `index.html` | The page and its buttons |
| `css/style.css` | Screen layout |
| `js/main.js` | Renderer, the two cameras (Table and Stall), taps, order bubbles, name tags and sound |
| `js/world.js` | The stall, the zinc house, the street and everything in it |
| `js/people.js` | How a person is built and posed |
| `js/cast.js` | The regulars (Lois, Racheal, V, Oluwasegun, Baba Malam, Mama Yan Bui) and how they move |
| `js/customers.js` | University students who walk in, crowd round the table and leave |
| `js/game.js` | The evening as a game: pan, orders, payments, fake alerts, arguments, rush, NEPA, sandal, kiosk tin |
| `js/sky.js` | The evening: sky, light and fog from 5:30 to 9:30pm |
| `js/textures.js` | Blocks, zinc, dirt, ankara and the rest, drawn on canvas |
| `js/audio.js` | The groove and the stall's sounds |
| `sw.js` | Offline support, scoped to this game only |

Run locally: `python3 -m http.server` in this folder, then open http://localhost:8000.
