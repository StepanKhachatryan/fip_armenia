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
  straight to the moderation queue. No Google Forms. Reporters paste an
  ordinary share link (not an embed address) and see a live preview of what
  the link resolved to before sending.
- **Adding to an existing incident** — "Ավելացնել տեսանյութ" on an open
  incident, or the second tab of the form, files extra clips against a flood
  that is already on the map instead of creating a duplicate point.
- **Responsive** — on narrow screens both rails become bottom sheets and the
  filters move behind a floating button.

## Data model

| Table                     | Purpose                                              |
| ------------------------- | ---------------------------------------------------- |
| `public.regions`          | The 10 marzes + Yerevan (code, Armenian + English name) |
| `public.floods`           | Published incidents rendered on the map              |
| `public.flood_submissions`| Public reports awaiting review                       |

A submission has a `kind`: `new` carries a full incident (date, title,
coordinates, region), while `addition` carries only video links plus the
`target_flood_id` they belong to. A database check constraint enforces the
right shape for each, so an addition can never arrive without a target and a
`new` can never arrive without coordinates.

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

**Nothing a visitor submits appears on the map until it is approved.** Reports
land in `flood_submissions` with `status = 'pending'`; the map only ever reads
`floods`. If a submitted video "does not show up", that is why — check the
queue first.

Review what is waiting, in the Supabase SQL editor:

```sql
select id, kind, target_flood_id, event_date, title, videos, submitter_note, created_at
from public.flood_submissions
where status = 'pending'
order by created_at;
```

Then publish or turn one down with a single call:

```sql
select public.approve_submission('<submission-uuid>');   -- returns the flood id
select public.reject_submission('<submission-uuid>', 'why');
```

`approve_submission` does the right thing per kind: a `new` submission becomes
a fresh row in `floods`, while an `addition` appends its links to the incident
it targets, skipping any link that incident already carries. Both mark the
submission `approved`. The functions are `SECURITY DEFINER` with `EXECUTE`
revoked from `anon` and `authenticated`, so only the service role — the SQL
editor or the dashboard — can moderate. Published rows appear on the map on
the next page load.

### Fixing a bad link

The form validates every link and previews it, so broken links are usually
caught before they are sent. Once a clip is published, only a moderator can
change it — a reporter can flag it through `submitter_note`. To repair one:

```sql
-- replace a single link
update public.floods
set videos = array_replace(videos, '<old url>', '<new url>')
where id = <flood id>;

-- or drop it
update public.floods
set videos = array_remove(videos, '<bad url>')
where id = <flood id>;
```

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
