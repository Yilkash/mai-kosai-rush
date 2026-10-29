# Mai Kosai Rush

A 3D browser game set at the Mai Kosai stall: Racheal fries kosai in the zinc house, Lois serves the crowd at her table, Oluwasegun snaps for the WhatsApp group from the long bench, from 5:30 to 9:30pm.

Play: https://yilkash.github.io/mai-kosai-rush/

Status: **look test**. The stall, the street, the people and the evening light are in; the gameplay (frying, orders, arguments, the kiosk tin) comes next.

- Plain HTML, CSS and JavaScript modules, no build step. Three.js r160 is vendored in `js/vendor/` (MIT, see `THREE-LICENSE`) so it works offline.
- Every texture is drawn in code and the music is made in code (an original highlife-style groove), so there are no image or audio files.

| File | What it holds |
|---|---|
| `index.html` | The page and its buttons |
| `css/style.css` | Screen layout |
| `js/main.js` | Renderer, camera (sideways and upright), time slider, sound and full screen |
| `js/world.js` | The stall, the zinc house, the street and everything in it |
| `js/people.js` | How a person is built and posed |
| `js/cast.js` | Who is at the stall and how they move |
| `js/sky.js` | The evening: sky, light and fog from 5:30 to 9:30pm |
| `js/textures.js` | Blocks, zinc, dirt, ankara and the rest, drawn on canvas |
| `js/audio.js` | The groove and the stall's sounds |
| `sw.js` | Offline support, scoped to this game only |

Run locally: `python3 -m http.server` in this folder, then open http://localhost:8000.
