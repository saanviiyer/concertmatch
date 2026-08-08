# ConcertMatch 🎫

> Turns your music taste into concert recommendations with tickets near you.


Recommend concert tickets based on your music taste. ConcertMatch reads your top
artists and genres (Spotify / YouTube Music), derives artists you'd love, and
matches them to real concerts near you (Ticketmaster) — each with a match score,
a "why recommended" reason, and a buy link.

**Runs fully offline on realistic mock data with zero setup.** Real APIs are
opt-in behind environment variables.

---

## Quick start (mock mode, no API keys)

```bash
npm install
npm run dev      # open the printed http://localhost:5173
```

Click **"Try the demo"** (or Spotify / YouTube Music — they fall back to demo
data when no key is set). You'll get a taste profile and a grid of recommended
concerts you can filter and save.

Production build (type-checked):

```bash
npm run build    # runs `tsc -b` then `vite build`; must pass with no TS errors
npm run preview  # serve the built app
```

---

## What it does

- **Connect your music** — pick a source. Each source is a swappable adapter.
- **Taste profile** — top artists, weighted top genres, and derived
  "you might like" adjacent artists.
- **Concert recommendations** — scored events for your profile + city/radius,
  each with venue, date, price range, a reason, and a buy link.
- **Filters** — city, radius, date range, max price.
- **Saved list** — heart any card; persists in `localStorage`.

---

## Architecture: the adapter layer

Every external service sits behind a TypeScript interface in `src/services/`.
The UI only ever talks to these interfaces, so the app runs identically on mock
or real data.

| Concern      | Interface       | Mock impl (default)    | Real impl (stub, gated)        |
| ------------ | --------------- | ---------------------- | ------------------------------ |
| Music taste  | `MusicAdapter`  | `MockMusicAdapter`     | `SpotifyMusicAdapter`, `YTMusicAdapter` |
| Events       | `EventsAdapter` | `MockEventsAdapter`    | `TicketmasterEventsAdapter`    |

The factory `src/services/index.ts` (`getMusicAdapter` / `getEventsAdapter`)
picks the implementation from env vars and **falls back to mock automatically**
when a real adapter is unconfigured.

Recommendation scoring lives in `src/services/recommender.ts` and is fully
adapter-agnostic (works the same on mock or live data).

---

## Going live: mock → real, function by function

1. Copy `.env.example` to `.env` and fill in keys (see links below).
2. Set the adapter selector env vars.
3. Implement the `TODO(real)` body in the matching adapter class.

### Spotify

- **Get keys:** <https://developer.spotify.com/dashboard> — create an app, copy
  the Client ID, add a redirect URI (e.g. `http://localhost:5173/callback`).
- **Env:** `VITE_MUSIC_ADAPTER=spotify`, `VITE_SPOTIFY_CLIENT_ID=...`,
  `VITE_SPOTIFY_REDIRECT_URI=...` (client secret only in a backend token
  exchange — never in the browser bundle; PKCE avoids needing it).
- **Swap:** implement `SpotifyMusicAdapter.getTopArtists()` in
  `src/services/musicAdapter.ts`. Endpoint + response mapping are documented in
  that method's JSDoc (`GET /v1/me/top/artists`). Optionally replace
  `deriveAdjacentArtists()` with `GET /v1/artists/{id}/related-artists`.

### YouTube Music

- **Get keys:** <https://console.cloud.google.com/> — enable "YouTube Data API
  v3", create OAuth credentials. (YouTube Music has no official public API; the
  Data API's subscriptions/likes are the documented approximation.)
- **Env:** `VITE_MUSIC_ADAPTER=ytmusic`, `VITE_YTMUSIC_CLIENT_ID=...`.
- **Swap:** implement `YTMusicAdapter.getTopArtists()` in
  `src/services/musicAdapter.ts` (map subscriptions/liked videos to artists;
  enrich genres via MusicBrainz or Spotify search — see the JSDoc).

### Ticketmaster

- **Get key:** <https://developer.ticketmaster.com/> — register, create an app,
  copy the Consumer Key (free tier available).
- **Env:** `VITE_EVENTS_ADAPTER=ticketmaster`, `VITE_TICKETMASTER_API_KEY=...`.
- **Swap:** implement `TicketmasterEventsAdapter.searchEvents()` in
  `src/services/ticketmasterAdapter.ts`. The Discovery API URL and the full
  field mapping (`_embedded.events[i]` → `ConcertEvent`) are documented in that
  method's JSDoc, including a copy-paste fetch skeleton.

---

## Project layout

```
concertmatch/
├── .env.example              # all env vars, documented
├── index.html
├── src/
│   ├── App.tsx               # top-level flow: connect → profile → recommendations
│   ├── types.ts              # shared domain types
│   ├── components/
│   │   ├── ConnectStep.tsx   # step 1: pick a music source
│   │   ├── TasteProfileView.tsx
│   │   ├── Filters.tsx       # city / radius / dates / max price
│   │   ├── EventCard.tsx
│   │   └── Cover.tsx         # deterministic gradient cover-art placeholder
│   ├── services/
│   │   ├── index.ts          # adapter factory (mock ↔ real selection)
│   │   ├── musicAdapter.ts   # MusicAdapter iface + Mock/Spotify/YTMusic impls
│   │   ├── ticketmasterAdapter.ts  # EventsAdapter iface + Mock/Ticketmaster impls
│   │   └── recommender.ts    # scoring + "why recommended" (adapter-agnostic)
│   └── lib/
│       ├── storage.ts        # localStorage "interested" list
│       └── cover.ts          # gradient/initials placeholder art
└── ...vite / tailwind / tsconfig
```

---

## Deploy

The production build in `dist/` is a fully static SPA. Deploy configs are
checked in: `vercel.json`, `netlify.toml`, and a `Dockerfile`, each with an SPA
fallback so unknown routes serve `index.html`.

**It ships in mock mode with zero config.** The real-API keys are all
*build-time* `VITE_*` vars — Vite inlines them into the bundle when `npm run
build` runs. With none set, the app builds and runs entirely on mock data.

**Vercel** (`vercel.json` included)

```bash
npm i -g vercel          # once
vercel --prod            # from the app directory
```

Or import the repo — Vercel auto-detects Vite (build `npm run build`, output
`dist`). To go live, add the `VITE_*` vars in Vercel's project env settings.

**Netlify** (`netlify.toml` included)

```bash
npm i -g netlify-cli     # once
netlify deploy --prod    # build command + publish dir come from netlify.toml
```

Or drag the `dist/` folder into the Netlify dashboard. Add `VITE_*` vars under
Site settings → Environment variables to go live.

**Docker** (`Dockerfile` + `nginx.conf` included — multi-stage build served by
`nginx:alpine` with an SPA fallback)

```bash
docker build -t concertmatch .
docker run -p 8080:80 concertmatch   # then open http://localhost:8080
```

The image builds in mock mode by default — **no key is baked in**. To build a
live image, pass keys as build args (they are inlined into the static bundle, so
treat the resulting image as sensitive and never commit real keys):

```bash
docker build \
  --build-arg VITE_EVENTS_ADAPTER=ticketmaster \
  --build-arg VITE_TICKETMASTER_API_KEY=your_key \
  -t concertmatch .
```

## Notes on secrets

- Only `VITE_`-prefixed vars reach the browser. **Never** ship a client secret
  or long-lived token in the bundle — do the OAuth token exchange server-side.
- `.env` is gitignored.

## Tech

Vite · React · TypeScript · Tailwind CSS. No backend required for mock mode.
