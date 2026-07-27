# EmbedGuessr × Kuaishou

GeoGuessr, but the map is a neural network's latent space. Each of the **10 plates**
shows four clusters and one **off-manifold specimen** — an item that is *not* a member
of any cluster (a banana in a chart of vehicles, the Kuaishou logo in a chart of gadgets).
You guess where the model would file it; you're scored on distance. Built for event kiosks:
dark Kuaishou-neon theme, working browser back button, a real backend leaderboard, and a
**Studio** page for authoring your own plates.

## Run locally
```bash
npm install
npm start
# open http://localhost:3000
```
Node 18+ required.

## Pages (all real history entries — the browser Back button works)
- `#/` landing
- `#/play` the run (2D chart + 3D volume plates, label fog increases as you go)
- `#/summary` grade + plate breakdown + save to board
- `#/leaderboard` podium + table
- `#/how` explainer
- `#/admin` **Studio** — author plates: upload a specimen image, click to place the four
  clusters and the model's "true" point, set the caption and the teaching note.

Routing is hash-based, so it also works opened directly as a file or on any static host,
and the Back button behaves the same everywhere.

## Backend
`server.js` (Express) provides:
- `GET /api/plates` · `PUT /api/plates` — game content (Studio publishes here)
- `POST /api/upload` — specimen image upload (multipart, ≤6 MB)
- `GET /api/leaderboard?limit=&mode=` · `POST /api/score` — leaderboard

Content and scores are stored as JSON under `data/`. Plates seed from `seed-plates.js`
on first boot. If the backend is ever unreachable, the frontend falls back to
`localStorage` so the kiosk keeps working.

### Lock down Studio (optional)
Set `ADMIN_KEY` and the `PUT /api/plates` + `POST /api/upload` routes require an
`x-admin-key` header. Left unset, Studio is open (fine for a trusted kiosk).

## Deploy on Render
1. Push this folder to GitHub.
2. New **Web Service** → build `npm install`, start `npm start`.
3. **Important:** Render's filesystem is ephemeral — `data/` resets on every redeploy.
   For a leaderboard that survives deploys, attach a **Render Disk** mounted at the
   project's `data/` directory, or swap the JSON store in `server.js` for a database/KV.

## Swapping in your own pictures
Two ways:
- **Studio** (`#/admin`) — upload a specimen image per plate, click to place points, Publish.
- **`seed-plates.js`** — edit the array directly (coordinates are a plain 0–100 grid) and
  drop images into `public/assets/`, referenced as `/assets/yourfile.png`.

Mascots © Kuaishou (派派 PAIPAI / 小快 Xiaoliu); isolated from the provided artwork.

---

## Update — beige theme, demo mode, real CLIP embeddings

**Run it**
```bash
npm install
npm start          # http://localhost:3000
```
If you change game content, reseed the store: `rm -f data/questions.json && npm start`.

**Two modes on the landing page**
- **Start** — the main game: your regular questions, shuffled (the three demo
  questions are *excluded*).
- **Demo (3 examples)** — plays only the three tutorial questions (Apple, Monkey,
  Champion hoodie). These are flagged `tutorial:true` in `seed-questions.js` and are
  kept out of the main pool by the server.

**Generating positions from images (CLIP)**
```bash
python3 encode_questions.py
```
This reads `seed-questions.js`, encodes each cluster label as CLIP text and each
specimen image, then writes cluster coordinates + the model's true point back into
`seed-questions.js`. It now **preserves the `tutorial:true` flag** and resolves
specimen images anywhere under `public/` (so the `/assets/*.png` mascots encode too,
not just `/assets/images/*`). After running it, `rm -f data/questions.json && npm start`.

**Image filenames are case-sensitive on Render/Linux.** Specimen `src` paths must match
the file exactly — e.g. `/assets/images/banana.jpeg` (lowercase).

**How to play page** — the three example screenshots are click-to-enlarge (lightbox).

**Map markers** — your guess is the small orange **YOU** pin; the model's answer is the
larger green **MODEL** bullseye, joined by a dashed line labelled with the distance.
