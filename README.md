# Armenia Flood Information Platform (FIP)

An interactive, citizen-science map of observed flood events in Armenia.

## Overview

A dependency-free static site (HTML + CSS + vanilla JS) that reads its data
from a Supabase (Postgres) backend. There is no flood data checked into this
repository — the map fetches everything at runtime.

- **Basemap** — OpenStreetMap raster tiles. No API key, no watermark. Dark
  mode re-tints the tiles with a CSS filter.
- **Markers** — every incident uses the same single-colour flood pin; there is
  no colour-by-year legend.
- **Filters (left rail)** — a month-by-month range slider plus per-marz
  checkboxes with live counts, and a free-text search in the header.
- **Details (right rail)** — date, place, description and embedded videos for
  the selected incident, with a shareable `?id=` deep link. An incident may
  carry up to 25 clips, and each one is rendered at its own aspect ratio.
- **Reporting** — the "Ներկայացնել" button opens an in-app form that writes
  straight to the moderation queue. No Google Forms.
- **Responsive** — on narrow screens both rails become bottom sheets and the
  filters move behind a floating button.

## Data model

| Table                     | Purpose                                              |
| ------------------------- | ---------------------------------------------------- |
| `public.regions`          | The 10 marzes + Yerevan (code, Armenian + English name) |
| `public.floods`           | Published incidents rendered on the map              |
| `public.flood_submissions`| Public reports awaiting review                       |

Row level security:

- `regions` and `floods` — world readable, no anonymous writes.
- `flood_submissions` — anyone may `INSERT` a row, and only with
  `status = 'pending'`. Nobody anonymous can read, update or delete the queue,
  so a submission never reaches the map before a human approves it.

Coordinates are constrained to Armenia's bounding box, `videos` is capped at
25 links per incident, and the front end only embeds video URLs from YouTube,
Facebook, Instagram and TikTok.

## Video sizing

`normalizeVideoUrl()` in `assets/js/util.js` returns each clip's width/height
ratio alongside its embed URL, and the detail panel reserves exactly that box
before the iframe loads, so nothing is letterboxed and the panel never
reflows. The ratio is taken from the link itself wherever the platform states
it — Facebook plugin URLs carry explicit per-video `width`/`height`, and the
vertical formats (YouTube Shorts, Reels, TikTok) are identifiable from the
path. Everything else falls back to that platform's own frame.

Note that no further precision is available client-side: YouTube's and
TikTok's oEmbed endpoints report the player's default box rather than the
video's real dimensions, and Facebook's and Instagram's require an app token.
If a clip ever needs a different shape, adjust the `width`/`height` in its
stored Facebook URL.

## Configuration

`assets/js/config.js` holds the project URL and the Supabase **publishable**
key. That key is designed to be public — every table is protected by the
policies above, so it grants read access to published floods and the ability
to file a pending report, nothing more.

## Moderating submissions

Review the queue in the Supabase dashboard, then promote a good report:

```sql
insert into public.floods
  (event_date, title, description, lat, lng, region_code, settlement, videos, source)
select event_date, title, description, lat, lng, region_code, settlement, videos, source
from public.flood_submissions
where id = '<submission-uuid>';

update public.flood_submissions
set status = 'approved'
where id = '<submission-uuid>';
```

Rejecting one is just `status = 'rejected'` with an optional `review_note`.
Published rows appear on the map on the next page load.

## Running locally

Any static file server works — the page only needs to be served over HTTP so
that `fetch` and the map tiles behave:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Technology

- **Leaflet** + **Leaflet.markercluster** — interactive map and clustering
- **noUiSlider** — the month range slider
- **Supabase** (PostgREST) — data storage and the submission queue
- Vanilla JS, no build step
