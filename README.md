# Exam Trainer (Public Demo)

A multi-course exam prep web app: guided practice, spaced repetition, wrong-question pool, cloud sync (Netlify Blobs), and learning-barrier diagnostics.

**This repository is a sanitized public demo.** It does not include personal exam schedules, admission data, or proprietary question banks.

## Features

- Multi-course dashboard with priority sorting
- Guided practice (see answer → recall → quiz)
- Foundation study mode (key-clue memorization)
- Mock exams with scoring and weak-chapter reports
- Local persistence + optional cloud sync via sync key
- PWA (service worker)

## Quick start

```bash
npm install
npm test
python3 -m http.server 8080
```

Open `http://localhost:8080/web/`

## Deploy (Netlify)

1. Connect this repo to Netlify
2. Build command: `npm install`
3. Publish directory: `web`
4. Functions: `netlify/functions`

Cloud sync endpoint: `/.netlify/functions/sync?key=YOUR_SYNC_KEY`

## Demo question banks

Three small demo banks live under `shared/exam/`. Replace them with your own JSON (see format in demo files) and run:

```bash
node scripts/bundle-banks.mjs
```

## License

MIT — demo content only. Do not commit third-party exam materials without permission.
