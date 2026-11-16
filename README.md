# Stationtracer

A wall display for the office: bus departures, the weather, and the lunch menu,
built to run fullscreen on a large screen.

- **Departures**: live countdowns from SL data, with cancellations, delays, stop
  bays, and SL traffic notices. Shows as many rows as fit; it never scrolls.
- **Weather**: current conditions, a 24-hour chart (temperature, precipitation,
  daylight), the next four days, and sunrise/sunset.
- **Lunch**: today's menu until 14:00, then tomorrow's, followed by the rest of the week.

## Data files

The display reads three JSON files from `/data/` (`public/data/` in development).
They are provided by an external data flow; the app never calls the APIs itself.

| File        | Source                                                                                     | Polled every |
|-------------|--------------------------------------------------------------------------------------------|--------------|
| `sl.json`   | SL Transport API, `GET /v1/sites/{site}/departures` (see `scripts/get-sl.sh`)              | 3 s          |
| `smhi.json` | SMHI point forecast, **snow1g** or the legacy **pmp3g** format (see below)                 | 30 s         |
| `menu.json` | `{ "monday": [{ "index": 1, "dish": "…", "type": "standard" }], … }` (types below)          | 60 s         |

Each dish's `type` sets its icon: `standard` (meat, and the default when `type` is
missing), `vegetarian`, `fish`, `seafood`, `bird` (poultry), `soup`, `christmas` (julbord),
or `closing` for a notice that the restaurant closes early or is closed all day.
Closing notices are shown in orange. Dishes with a type the display doesn't know
are shown without an icon.

If a file stops changing (judged by the `Last-Modified` header), its panel says
so: after 5 minutes for departures, or 12 hours for the forecast.
Countdowns are always calculated from the local clock, so they stay correct even
when the departures file is a few minutes old.

### SMHI format change

SMHI has retired the `pmp3g` forecast API (`scripts/get-smhi.sh` now receives a
404 page). Its replacement is `snow1g`:

```
https://opendata-download-metfcst.smhi.se/api/category/snow1g/version/1/geotype/point/lon/18.063240/lat/59.334591/data.json
```

The display accepts both formats, so the data flow can be switched whenever it suits.

## Display behaviour

- Everything scales with the viewport, so a 1080p screen and a 4K screen show the same layout. Portrait screens are supported.
- The mouse cursor hides after 3 seconds of no movement.
- The layout shifts by a pixel or two every few minutes to prevent burn-in.
- A new deployment is picked up within 5 minutes, and the page reloads once a night at 04:00.
  The page only reloads after confirming the server responds, so an outage never leaves a browser error page on the screen.
- A screen wake lock is requested where the browser allows it (HTTPS or localhost).
- If one panel fails, the others keep running, and the failed panel retries after 30 seconds.

The display computer's time zone must be `Europe/Stockholm`, because SL
times have no UTC offset.

Settings such as polling intervals, staleness thresholds and when lunch ends are in
`src/config.ts`.

## Development

```sh
yarn install
yarn mock            # write sample data to public/data (snow1g format)
yarn dev
```

`yarn mock` options: `--smhi=pmp3g` for the legacy weather format,
`--no-deviations` to leave out traffic notices, `--watch` to regenerate every 30 s,
and `--at=2026-11-16T11:30` to generate data for another time.

Fonts and icons are bundled into the build.

## Deployment

`Dockerfile` builds the app and serves it with nginx (`nginx.conf`). Mount the
synced data directory at `/usr/share/nginx/html/data`. nginx serves the data
files with `Cache-Control: no-cache`, so each poll is a cheap `304` until the
file changes. A missing file returns a real `404`.
