/* =============================================
   MAP.JS — Leaflet map, flood markers, detail panel
   ============================================= */

var map;
var markerCluster;
var floodIcon;
var pickMode = false;
var pickMarker = null;
var onPickComplete = null;

/* OpenStreetMap standard tiles — no API key, no watermark.
   Dark mode is handled with a CSS filter on the tile pane. */
var OSM_URL  = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
var OSM_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/* ---- Marker icon: one flood glyph, one colour, for every incident ---- */
function makeFloodIcon() {
  var svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36" aria-hidden="true">' +
      '<path d="M14 0C6.27 0 0 6.27 0 14c0 9.6 12.1 20.9 12.9 21.6a1.6 1.6 0 0 0 2.2 0C15.9 34.9 28 23.6 28 14 28 6.27 21.73 0 14 0z" ' +
        'fill="' + MARKER_COLOR + '" stroke="#ffffff" stroke-width="1.6"/>' +
      '<path d="M14 5.8c-2.4 2.7-3.8 4.9-3.8 6.6a3.8 3.8 0 0 0 7.6 0c0-1.7-1.4-3.9-3.8-6.6z" fill="#ffffff"/>' +
      '<path d="M8.4 19.4q1.4-1.4 2.8 0t2.8 0 2.8 0 2.8 0" fill="none" stroke="#ffffff" ' +
        'stroke-width="1.9" stroke-linecap="round"/>' +
    '</svg>';

  return L.divIcon({
    html: svg,
    className: 'flood-pin',
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -34]
  });
}

function makeClusterIcon(cluster) {
  var n = cluster.getChildCount();
  var size = n < 10 ? 38 : n < 50 ? 46 : 54;
  return L.divIcon({
    html: '<span>' + n + '</span>',
    className: 'flood-cluster',
    iconSize: L.point(size, size)
  });
}

/* ---- Init ---- */
function initMap() {
  map = L.map('map', {
    zoomControl: false,
    zoomSnap: 0.5,
    minZoom: 6,
    maxZoom: 18,
    attributionControl: true
  }).setView([40.35, 44.85], 8);

  L.tileLayer(OSM_URL, {
    attribution: OSM_ATTR,
    maxZoom: 19,
    subdomains: 'abc'
  }).addTo(map);

  L.control.zoom({ position: 'bottomright' }).addTo(map);

  floodIcon = makeFloodIcon();

  markerCluster = L.markerClusterGroup({
    maxClusterRadius: 46,
    disableClusteringAtZoom: 15,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    iconCreateFunction: makeClusterIcon
  });
  map.addLayer(markerCluster);

  map.on('click', function (e) {
    if (pickMode) finishPick(e.latlng.lat, e.latlng.lng);
  });
}

/* ---- Markers ---- */
function updateMarkers(data) {
  if (!markerCluster) return;
  markerCluster.clearLayers();

  var markers = data.map(function (item) {
    var m = L.marker([item.lat, item.lng], {
      icon: floodIcon,
      title: item.title,
      keyboard: true,
      alt: item.title
    });
    m.on('click', function () { openDetail(item); });
    return m;
  });

  markerCluster.addLayers(markers);
}

function flyToMarker(item) {
  if (!map) return;
  var zoom = Math.max(map.getZoom(), 14);
  /* On desktop the detail panel covers the right edge; nudge the target
     left so the selected pin stays visible next to it. */
  var offsetX = isMobile() ? 0 : -Math.round(map.getSize().x * 0.16);
  var offsetY = isMobile() ? -Math.round(map.getSize().y * 0.18) : 0;
  var pt = map.project([item.lat, item.lng], zoom).add([offsetX, offsetY]);
  map.flyTo(map.unproject(pt, zoom), zoom, { animate: true, duration: 0.7 });
}

function fitToData(data) {
  if (!map || !data.length) return;
  var bounds = L.latLngBounds(data.map(function (d) { return [d.lat, d.lng]; }));
  map.fitBounds(bounds, { padding: [70, 70], maxZoom: 12 });
}

/* ---- Detail panel ---- */
function openDetail(item) {
  var panel = document.getElementById('detail-panel');

  document.getElementById('detail-date').textContent  = formatFullDate(item.date);
  document.getElementById('detail-title').textContent = item.title;
  document.getElementById('detail-desc').textContent  = item.description;
  document.getElementById('detail-desc').hidden       = !item.description;

  var place = [item.settlement, regionName(item.region)].filter(Boolean).join(', ');
  var regionEl = document.getElementById('detail-region');
  regionEl.textContent = place;
  regionEl.hidden = !place;

  var srcEl = document.getElementById('detail-source');
  srcEl.textContent = item.source ? 'Աղբյուր՝ ' + item.source : '';
  srcEl.hidden = !item.source;

  var videosEl = document.getElementById('detail-videos');
  var html = (item.videos || []).map(buildVideoEmbed).join('');
  videosEl.innerHTML = html || '<p class="empty-note">Այս դեպքի համար տեսանյութ չկա։</p>';

  document.getElementById('detail-body').scrollTop = 0;
  panel.classList.add('active');
  panel.setAttribute('aria-hidden', 'false');

  setDeepLink(item.id);
  flyToMarker(item);
}

function closeDetail() {
  var panel = document.getElementById('detail-panel');
  panel.classList.remove('active');
  panel.setAttribute('aria-hidden', 'true');
  /* Stop playback by tearing the iframes down. */
  document.getElementById('detail-videos').innerHTML = '';
  setDeepLink(null);
}

function setDeepLink(id) {
  try {
    var u = new URL(window.location.href);
    if (id == null) u.searchParams.delete('id');
    else u.searchParams.set('id', id);
    history.replaceState({ id: id }, '', u.toString());
  } catch (e) {}
}

/* ---- "Pick a location on the map" mode, used by the submit form ---- */
function startPick(callback) {
  pickMode = true;
  onPickComplete = callback;
  document.body.classList.add('picking');
  document.getElementById('pick-banner').hidden = false;
}

function cancelPick() {
  pickMode = false;
  onPickComplete = null;
  document.body.classList.remove('picking');
  document.getElementById('pick-banner').hidden = true;
}

function finishPick(lat, lng) {
  var cb = onPickComplete;
  cancelPick();

  if (pickMarker) map.removeLayer(pickMarker);
  pickMarker = L.marker([lat, lng], { icon: floodIcon, opacity: 0.85 }).addTo(map);

  if (cb) cb(lat, lng);
}

function clearPickMarker() {
  if (pickMarker) {
    map.removeLayer(pickMarker);
    pickMarker = null;
  }
}
