/* =============================================
   FILTERS.JS — month range, regions, search, list
   ============================================= */

var allData = [];
var filteredData = [];

var months = [];                 /* [{ year, month, label }] — one entry per month covered */
var monthRange = { min: 0, max: 0 };
var selectedRegions = null;      /* Set of region codes, null until built */
var searchQuery = '';

/* ---- Month axis ---- */
function monthIndex(dateStr) {
  var d = parseDate(dateStr);
  if (!months.length) return 0;
  return (d.getFullYear() - months[0].year) * 12 + (d.getMonth() - months[0].month);
}

function buildMonthAxis(data) {
  var times = data.map(function (d) { return parseDate(d.date); });
  var first = new Date(Math.min.apply(null, times));
  var last  = new Date(Math.max.apply(null, times));

  months = [];
  var y = first.getFullYear(), m = first.getMonth();
  while (y < last.getFullYear() || (y === last.getFullYear() && m <= last.getMonth())) {
    months.push({ year: y, month: m, label: formatMonthLabel(y, m) });
    if (++m > 11) { m = 0; y++; }
  }
  monthRange = { min: 0, max: months.length - 1 };
}

function updateRangeReadout() {
  var a = months[monthRange.min], b = months[monthRange.max];
  document.getElementById('range-from').textContent = a ? a.label : '—';
  document.getElementById('range-to').textContent   = b ? b.label : '—';
}

function initMonthSlider() {
  var el = document.getElementById('month-slider');
  if (el.noUiSlider) el.noUiSlider.destroy();

  /* A single-month dataset has no range to drag. */
  if (months.length < 2) {
    el.classList.add('is-disabled');
    updateRangeReadout();
    return;
  }
  el.classList.remove('is-disabled');

  /* Show a tick at every January, thinning out when the span is long. */
  var januaries = [];
  for (var i = 0; i < months.length; i++) if (months[i].month === 0) januaries.push(i);
  var yearStep = Math.ceil(januaries.length / 6) || 1;
  var pipValues = januaries.filter(function (_, i) { return i % yearStep === 0; });

  noUiSlider.create(el, {
    start: [monthRange.min, monthRange.max],
    connect: true,
    behaviour: 'tap-drag',
    step: 1,
    margin: 0,
    range: { min: monthRange.min, max: monthRange.max },
    format: {
      to: function (v) { return Math.round(v); },
      from: function (v) { return Number(v); }
    },
    pips: {
      mode: 'values',
      values: pipValues,
      density: -1,
      format: { to: function (v) { return months[Math.round(v)].year; } }
    }
  });

  el.noUiSlider.on('update', function (values) {
    monthRange.min = Math.round(values[0]);
    monthRange.max = Math.round(values[1]);
    updateRangeReadout();
    applyFilters();
  });
}

function setMonthRange(min, max) {
  var el = document.getElementById('month-slider');
  monthRange.min = Math.max(0, min);
  monthRange.max = Math.min(months.length - 1, max);
  if (el.noUiSlider) el.noUiSlider.set([monthRange.min, monthRange.max]);
  else { updateRangeReadout(); applyFilters(); }
}

function applyPreset(preset) {
  if (preset === 'all') return setMonthRange(0, months.length - 1);

  var now = new Date();
  var startIdx;
  if (preset === 'year') {
    startIdx = (now.getFullYear() - months[0].year) * 12 - months[0].month;
  } else { /* last 12 months */
    startIdx = (now.getFullYear() - months[0].year) * 12 + (now.getMonth() - months[0].month) - 11;
  }
  setMonthRange(Math.max(0, startIdx), months.length - 1);
}

/* ---- Region checkboxes ---- */
function buildRegionList() {
  var container = document.getElementById('region-list');

  container.innerHTML = REGIONS.map(function (r) {
    return '<label class="region-item" data-code="' + escHtml(r.code) + '">' +
             '<input type="checkbox" value="' + escHtml(r.code) + '" checked>' +
             '<span class="region-name">' + escHtml(r.name) + '</span>' +
             '<span class="region-count" data-count-for="' + escHtml(r.code) + '">0</span>' +
           '</label>';
  }).join('');

  container.addEventListener('change', function (e) {
    if (e.target.type !== 'checkbox') return;
    if (e.target.checked) selectedRegions.add(e.target.value);
    else selectedRegions.delete(e.target.value);
    applyFilters();
  });
}

function setAllRegions(on) {
  var boxes = document.querySelectorAll('#region-list input[type="checkbox"]');
  selectedRegions = new Set();
  for (var i = 0; i < boxes.length; i++) {
    boxes[i].checked = on;
    if (on) selectedRegions.add(boxes[i].value);
  }
  applyFilters();
}

function updateRegionCounts(dataBeforeRegionFilter) {
  var counts = {};
  dataBeforeRegionFilter.forEach(function (d) {
    counts[d.region] = (counts[d.region] || 0) + 1;
  });

  REGIONS.forEach(function (r) {
    var n = counts[r.code] || 0;
    var el = document.querySelector('[data-count-for="' + r.code + '"]');
    if (el) el.textContent = n;
    var item = document.querySelector('.region-item[data-code="' + r.code + '"]');
    if (item) item.classList.toggle('is-empty', n === 0);
  });
}

/* ---- The filter pipeline ---- */
function applyFilters() {
  var q = searchQuery.trim().toLowerCase();

  /* Stage 1 — time + text. Region counts are derived from this stage so
     each marz shows how many incidents it *would* contribute. */
  var stage1 = allData.filter(function (d) {
    var idx = monthIndex(d.date);
    if (idx < monthRange.min || idx > monthRange.max) return false;
    if (!q) return true;
    return d.title.toLowerCase().indexOf(q) !== -1
        || d.description.toLowerCase().indexOf(q) !== -1
        || d.settlement.toLowerCase().indexOf(q) !== -1
        || regionName(d.region).toLowerCase().indexOf(q) !== -1;
  });

  updateRegionCounts(stage1);

  /* Stage 2 — regions. */
  filteredData = stage1.filter(function (d) {
    return !selectedRegions || selectedRegions.has(d.region);
  });

  updateMarkers(filteredData);
  updateStats();
  updateFilterBadge();
  if (document.getElementById('list-panel').classList.contains('active')) buildList();
  return filteredData;
}

function updateStats() {
  document.getElementById('stats-count').textContent = filteredData.length + ' դեպք';
  document.getElementById('stats-total').textContent =
    filteredData.length === allData.length ? 'ընդամենը' : 'ընդհանուր ' + allData.length + '-ից';
}

function activeFilterCount() {
  var n = 0;
  if (monthRange.min !== 0 || monthRange.max !== months.length - 1) n++;
  if (selectedRegions && selectedRegions.size !== REGIONS.length) n++;
  if (searchQuery.trim()) n++;
  return n;
}

function updateFilterBadge() {
  var badge = document.getElementById('filter-fab-badge');
  var n = activeFilterCount();
  badge.textContent = n;
  badge.hidden = n === 0;

  var toggle = document.getElementById('btn-toggle-regions');
  toggle.textContent = (selectedRegions && selectedRegions.size === 0) ? 'Բոլորը' : 'Ոչ մեկը';
}

function resetFilters() {
  searchQuery = '';
  document.getElementById('search-input').value = '';
  setAllRegions(true);
  setMonthRange(0, months.length - 1);
}

/* ---- List panel ---- */
function buildList() {
  var container = document.getElementById('incidents-list');

  if (!filteredData.length) {
    container.innerHTML = '<p class="empty-note">Ընտրված պայմաններով դեպքեր չեն գտնվել։</p>';
    return;
  }

  var sorted = filteredData.slice().sort(function (a, b) {
    return parseDate(b.date) - parseDate(a.date);
  });

  container.innerHTML = sorted.map(function (item) {
    var place = [item.settlement, regionName(item.region)].filter(Boolean).join(', ');
    return '<button class="incident-card" data-id="' + escHtml(item.id) + '" role="listitem">' +
             '<span class="incident-card-top">' +
               '<span class="incident-card-date">' + escHtml(formatShortDate(item.date)) + '</span>' +
               '<span class="incident-card-region">' + escHtml(place) + '</span>' +
             '</span>' +
             '<span class="incident-card-title">' + escHtml(item.title) + '</span>' +
             (item.description
               ? '<span class="incident-card-desc">' + escHtml(item.description) + '</span>' : '') +
             (item.videos.length
               ? '<span class="incident-card-badge">' + item.videos.length + ' տեսանյութ</span>' : '') +
           '</button>';
  }).join('');
}

function openListPanel() {
  buildList();
  document.getElementById('list-panel').classList.add('active');
  document.getElementById('list-panel').setAttribute('aria-hidden', 'false');
  document.getElementById('list-overlay').classList.add('active');
}

function closeListPanel() {
  document.getElementById('list-panel').classList.remove('active');
  document.getElementById('list-panel').setAttribute('aria-hidden', 'true');
  document.getElementById('list-overlay').classList.remove('active');
}

/* ---- Mobile filter sheet ---- */
function openFilterPanel() {
  document.getElementById('filter-panel').classList.add('open');
  document.getElementById('filter-overlay').classList.add('active');
}

function closeFilterPanel() {
  document.getElementById('filter-panel').classList.remove('open');
  document.getElementById('filter-overlay').classList.remove('active');
}

/* ---- Wire up ---- */
function initFilters(data) {
  allData = data;
  buildMonthAxis(data);
  buildRegionList();
  selectedRegions = new Set(REGIONS.map(function (r) { return r.code; }));
  initMonthSlider();
  updateRangeReadout();
  applyFilters();

  document.querySelectorAll('.preset-row .chip').forEach(function (btn) {
    btn.addEventListener('click', function () { applyPreset(btn.dataset.preset); });
  });

  document.getElementById('btn-reset-filters').addEventListener('click', resetFilters);

  document.getElementById('btn-toggle-regions').addEventListener('click', function () {
    setAllRegions(selectedRegions.size === 0);
  });

  document.getElementById('search-input').addEventListener('input', debounce(function () {
    searchQuery = this.value;
    applyFilters();
  }, 180));

  document.getElementById('incidents-list').addEventListener('click', function (e) {
    var card = e.target.closest('.incident-card');
    if (!card) return;
    var item = allData.find(function (d) { return String(d.id) === card.dataset.id; });
    if (!item) return;
    closeListPanel();
    openDetail(item);
  });
}
