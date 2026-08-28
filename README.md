# The Code

A personal discipline tracker: three daily habits, a weekly scorecard, a fixed set of rules, and a countdown to a lock date. Built for one user, on one phone, opened once or twice a day.

## Stack

Plain HTML, CSS and JavaScript in a single `index.html` file. No build step, no npm, no framework. All data lives in the browser's `localStorage` under the key `code.state.v1`. A `manifest.json` + `sw.js` service worker make it installable ("Add to Home Screen" on iOS) and fully usable offline after the first load.

## Running it

There's nothing to install or build. Serve the folder with any static file server and open `index.html`:

```bash
python3 -m http.server 8000
# or: npx serve .
```

Then visit `http://localhost:8000/`. A service worker needs a real HTTP(S) origin (or `localhost`) to register — opening the file directly via `file://` will still work for the tracker itself, but without offline caching or install support.

To use it as a home-screen app, host it somewhere over HTTPS (GitHub Pages, Netlify, etc.), open it in Safari on iPhone, and use Share → Add to Home Screen.

## How it works

- **Today** — tap a habit row to cycle it: none → full → min → none. A day rolls over at 3am `Australia/Sydney` time, not midnight.
- **Week** — a Monday–Sunday grid of the same data, page back through previous weeks with the arrows. On Sunday evening a review box appears to capture a one-line note on the week and next week's three biggest tasks.
- **Code** — the fixed rules and the alter-ego name field (the only other editable thing in the app).
- **Lock** — a countdown to the lock date, after which the screen changes to a decision prompt.

Streak rule: a day counts if all three habits are at least `min`, except Monday (School only) and Sunday (a rest day that's skipped entirely — it never breaks or extends the streak).

## Files

```
index.html      the entire app: markup, CSS, and JS
manifest.json   web app manifest (name, icons, standalone display)
sw.js           service worker: cache-first offline support
icon.svg        favicon
icon-*.png      192/512 (manifest) and 180 (apple-touch-icon)
```

There is intentionally no build tooling, package.json, or framework — editing `index.html` directly is the whole workflow.
