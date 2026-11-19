# Sunset Coast — GTA 6-style cover art maker

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/witty-otter-58/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/witty-otter-58/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Turn a photo and a caption into a multi-panel, GTA 6-style poster — the
sun-soaked "Sunset Coast" look, with bold title lettering, a duotone
treatment, and a comic-book panel layout. Everything runs in the browser,
offline, with no uploads and no account.

## What it does

- Drop in a photo and a caption; the app composes a multi-panel cover in the
  style of a GTA 6 key-art poster.
- Live editor: tweak the caption, panel layout, and colour treatment and see
  the poster update immediately.
- Export the finished cover as a PNG in three sizes:
  - Square — 1080×1080
  - Portrait — 1080×1350
  - Landscape — 1920×1080

## Run it

Serve the `app/` folder with any static server and open `index.html`, or use
the bundled helper (Node 22, standard library only):

```sh
node serve.ts
```

Then open http://localhost:8080 in your browser.

## Screenshots

See the `screenshots/` folder for the editor and exported covers in all
three sizes.
