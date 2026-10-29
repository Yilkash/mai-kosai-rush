# Mai Kosai Rush

A 3D browser game set at the Mai Kosai stall: Racheal fries kosai in the zinc house, Lois serves the crowd at her table, Oluwasegun snaps for the WhatsApp group from the long bench, from 5:30 to 9:30pm.

Play: https://yilkash.github.io/mai-kosai-rush/

How to play: one evening runs 5:30 to 9:30pm (about four minutes). Lift Racheal's kosai into the green basket before they burn, tap an order card, add the kosai, awara and kunu, set the pepper, and pack it in a black nylon. Give the right change for cash and catch the fake transfer alerts. Settle arguments, tap V to sell her sandal, and let Oluwasegun post on WhatsApp for a rush. NEPA takes light now and then. What you make, less what you pay Mama Yan Bui for the awara, goes into the kiosk tin (₦100,000 goal), saved on the phone.

`?speed=10` on the address runs the evening faster, for testing.

- Plain HTML, CSS and JavaScript modules, no build step. Three.js r160 is vendored in `js/vendor/` (MIT, see `THREE-LICENSE`) so it works offline.
- Every texture is drawn in code and the music is made in code (an original highlife-style groove), so there are no image or audio files.

| File | What it holds |
|---|---|
| `index.html` | The page and its buttons |
| `css/style.css` | Screen layout |
| `js/main.js` | Renderer, camera (sideways and upright), time slider, sound and full screen |
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
