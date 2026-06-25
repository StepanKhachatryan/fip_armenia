/* =============================================
   MAP.JS — Leaflet init, markers, sidebar
   ============================================= */

var map;
var markerCluster;
var allMarkers = [];

var TILE_LIGHT = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
var TILE_DARK  = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
var TILE_ATTR  = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>';

var tileLayer;

function getMarkerColor(dateStr) {
  var y = new Date(dateStr).getFullYear();
  if (y >= 2025) return '#00a97a';
  if (y >= 2020) return '#1a6fa8';
  if (y >= 2016) return '#f59e0b';
  return '#e85d3a';
}

function makeIcon(color) {
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="34" viewBox="0 0 26 34">'
    + '<path d="M13 0C5.82 0 0 5.82 0 13c0 9.5 11.4 20.4 12.4 21.3a.8.8 0 0 0 1.2 0C14.6 33.4 26 22.5 26 13 26 5.82 20.18 0 13 0z" fill="' + color + '" stroke="rgba(255,255,255,0.6)" stroke-width="1.2"/>'
    + '<circle cx="13" cy="13" r="5.5" fill="rgba(255,255,255,0.85)"/>'
    + '</svg>';
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [26, 34],
    iconAnchor: [13, 34],
    popupAnchor: [0, -36]
  });
}

function initMap() {
  if (!document.getElementById('map')) return;

  map = L.map('map', {
    zoomControl: true,
    tap: false,
    zoomSnap: 0.5
  }).setView([40.30, 44.70], 8);

  var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  tileLayer = L.tileLayer(isDark ? TILE_DARK : TILE_LIGHT, {
    attribution: TILE_ATTR,
    maxZoom: 19,
    subdomains: 'abcd'
  }).addTo(map);

  markerCluster = L.markerClusterGroup({
    maxClusterRadius: 50,
    disableClusteringAtZoom: 14,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    animate: true
  });

  map.addLayer(markerCluster);
}

function switchTiles(dark) {
  if (!map || !tileLayer) return;
  map.removeLayer(tileLayer);
  tileLayer = L.tileLayer(dark ? TILE_DARK : TILE_LIGHT, {
    attribution: TILE_ATTR,
    maxZoom: 19,
    subdomains: 'abcd'
  }).addTo(map);
}

function updateMarkers(data) {
  if (!markerCluster) return;
  markerCluster.clearLayers();
  allMarkers = [];

  data.forEach(function(item) {
    var marker = L.marker([item.lat, item.lng], { icon: makeIcon(getMarkerColor(item.date)) });
    marker.itemData = item;
    marker.on('click', function() { openSidebar(item); });
    allMarkers.push(marker);
  });

  markerCluster.addLayers(allMarkers);
}

function flyToMarker(item) {
  if (!map) return;
  map.flyTo([item.lat, item.lng], 15, { animate: true, duration: 0.8 });
}

/* ---- Video embed builder ---- */
function getVideoEmbed(url) {
  var isFB = url.indexOf('facebook.com') !== -1;
  var isYT = url.indexOf('youtube.com') !== -1 || url.indexOf('youtu.be') !== -1;
  var isIG = url.indexOf('instagram.com') !== -1;
  var isTK = url.indexOf('tiktok.com') !== -1;

  var aspectClass = 'aspect-16-9';

  if (isFB) {
    var hMatch = url.match(/height=(\d+)/);
    var wMatch = url.match(/width=(\d+)/);
    var h = hMatch ? parseInt(hMatch[1]) : 315;
    var w = wMatch ? parseInt(wMatch[1]) : 560;
    if (h > w) aspectClass = 'aspect-portrait';
  } else if (isIG || isTK) {
    aspectClass = 'aspect-portrait';
  }

  return '<div class="video-wrapper ' + aspectClass + '">'
    + '<iframe src="' + url + '" frameborder="0" loading="lazy"'
    + ' allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"'
    + ' allowfullscreen></iframe>'
    + '</div>';
}

/* ---- Sidebar ---- */
function openSidebar(item) {
  var sidebar  = document.getElementById('video-sidebar');
  var titleEl  = document.getElementById('sidebar-title');
  var dateEl   = document.getElementById('sidebar-date');
  var descEl   = document.getElementById('sidebar-desc');
  var videosEl = document.getElementById('sidebar-videos');

  titleEl.textContent = item.title;
  dateEl.textContent  = new Date(item.date).toLocaleDateString('hy-AM', { year:'numeric', month:'long', day:'numeric' });
  descEl.textContent  = item.description || '';

  if (item.videos && item.videos.length) {
    videosEl.innerHTML = item.videos.map(getVideoEmbed).join('');
  } else {
    videosEl.innerHTML = '<p style="color:var(--c-text-muted);font-size:13px">Տեսանյութ չկա։</p>';
  }

  sidebar.classList.add('active');
  sidebar.setAttribute('aria-hidden', 'false');

  /* Deep-link: update URL */
  try {
    var u = new URL(window.location.href);
    u.searchParams.set('id', item.id);
    history.pushState({ id: item.id }, '', u.toString());
  } catch(e) {}

  flyToMarker(item);
}

function closeSidebar() {
  var sidebar = document.getElementById('video-sidebar');
  sidebar.classList.remove('active');
  sidebar.setAttribute('aria-hidden', 'true');

  try {
    var u = new URL(window.location.href);
    u.searchParams.delete('id');
    history.pushState({}, '', u.toString());
  } catch(e) {}
}
