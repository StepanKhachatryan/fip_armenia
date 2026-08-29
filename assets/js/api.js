/* =============================================
   API.JS — Supabase (PostgREST) data access
   ============================================= */

function apiHeaders(extra) {
  var h = {
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY
  };
  for (var k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) h[k] = extra[k];
  return h;
}

/* Read every published flood event, oldest first. */
function fetchFloods() {
  var url = SUPABASE_URL + '/rest/v1/floods'
          + '?select=id,event_date,title,description,lat,lng,region_code,settlement,videos,source'
          + '&order=event_date.asc';

  return fetch(url, { headers: apiHeaders({ 'Accept': 'application/json' }) })
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (rows) {
      return rows.map(function (r) {
        return {
          id: r.id,
          date: r.event_date,
          title: r.title || '',
          description: r.description || '',
          lat: r.lat,
          lng: r.lng,
          region: r.region_code,
          settlement: r.settlement || '',
          videos: r.videos || [],
          source: r.source || ''
        };
      });
    });
}

/* File a public submission. It lands in the moderation queue as
   'pending' — row level security allows the insert and nothing else. */
function submitFlood(payload) {
  return fetch(SUPABASE_URL + '/rest/v1/flood_submissions', {
    method: 'POST',
    headers: apiHeaders({
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    }),
    body: JSON.stringify(payload)
  }).then(function (res) {
    if (res.ok) return true;
    return res.text().then(function (t) {
      throw new Error('HTTP ' + res.status + (t ? ': ' + t : ''));
    });
  });
}
