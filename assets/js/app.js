/* =============================================
   APP.JS — data, slider, search, modals, UI
   ============================================= */

var allData = [];
var sliderRange = { min: 0, max: Infinity };
var searchQuery = '';

/* ---- Locale-aware date formatter ---- */
function formatDateLabel(timestamp) {
  try {
    return new Date(+timestamp).toLocaleDateString('hy-AM', { month: 'short', year: 'numeric' });
  } catch(e) {
    return new Date(+timestamp).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
}

/* ---- Filter logic ---- */
function applyFilters() {
  var q = searchQuery.trim().toLowerCase();

  var filtered = allData.filter(function(item) {
    var t = new Date(item.date).getTime();
    var inRange = t >= sliderRange.min && t <= sliderRange.max;
    var matchSearch = !q
      || item.title.toLowerCase().indexOf(q) !== -1
      || item.description.toLowerCase().indexOf(q) !== -1;
    return inRange && matchSearch;
  });

  updateMarkers(filtered);
  updateStats(filtered);
  return filtered;
}

/* ---- Stats bar ---- */
function updateStats(data) {
  var countEl = document.getElementById('stats-count');
  var rangeEl = document.getElementById('stats-range');

  countEl.textContent = data.length + ' դեպք';

  if (data.length && sliderRange.min !== 0) {
    var from = new Date(sliderRange.min).getFullYear();
    var to   = new Date(sliderRange.max).getFullYear();
    rangeEl.textContent = from === to ? String(from) : from + '–' + to;
  } else {
    rangeEl.textContent = '';
  }
}

/* ---- Slider init ---- */
function initSlider(data) {
  var el = document.getElementById('slider');
  var dates = data.map(function(d) { return new Date(d.date).getTime(); });
  var minTs = Math.min.apply(null, dates);
  var maxTs = Math.max.apply(null, dates);

  sliderRange.min = new Date(new Date(minTs).getFullYear(), 0, 1).getTime();
  sliderRange.max = new Date(new Date(maxTs).getFullYear(), 11, 31).getTime();

  if (el.noUiSlider) el.noUiSlider.destroy();

  noUiSlider.create(el, {
    start: [sliderRange.min, sliderRange.max],
    connect: true,
    range: { min: sliderRange.min, max: sliderRange.max },
    step: 24 * 60 * 60 * 1000,
    tooltips: [
      { to: formatDateLabel },
      { to: formatDateLabel }
    ],
    pips: {
      mode: 'range',
      density: 100,
      format: { to: function(v) { return new Date(v).getFullYear(); } }
    }
  });

  el.noUiSlider.on('update', function(values) {
    sliderRange.min = parseInt(values[0]);
    sliderRange.max = parseInt(values[1]);
    applyFilters();
  });
}

/* ---- List panel ---- */
function buildList(data) {
  var container = document.getElementById('incidents-list');
  if (!data.length) {
    container.innerHTML = '<p style="padding:20px;color:var(--c-text-muted);font-size:13px">Դեպքեր չեն գտնվել։</p>';
    return;
  }

  var sorted = data.slice().sort(function(a, b) { return new Date(b.date) - new Date(a.date); });

  container.innerHTML = sorted.map(function(item) {
    var d = new Date(item.date).toLocaleDateString('hy-AM', { year:'numeric', month:'short', day:'numeric' });
    return '<div class="incident-card" data-id="' + item.id + '" role="listitem" tabindex="0">'
      + '<span class="incident-card-date">' + d + '</span>'
      + '<span class="incident-card-title">' + escHtml(item.title) + '</span>'
      + '<span class="incident-card-desc">' + escHtml(item.description || '') + '</span>'
      + '</div>';
  }).join('');

  container.querySelectorAll('.incident-card').forEach(function(card) {
    function activate() {
      var id = card.getAttribute('data-id');
      var item = allData.find(function(d) { return String(d.id) === id; });
      if (item) {
        closeListPanel();
        openSidebar(item);
      }
    }
    card.addEventListener('click', activate);
    card.addEventListener('keydown', function(e) { if (e.key === 'Enter' || e.key === ' ') activate(); });
  });
}

function openListPanel() {
  var panel   = document.getElementById('list-panel');
  var overlay = document.getElementById('list-overlay');
  buildList(applyFilters());
  panel.classList.add('active');
  overlay.classList.add('active');
  panel.setAttribute('aria-hidden', 'false');
}

function closeListPanel() {
  var panel   = document.getElementById('list-panel');
  var overlay = document.getElementById('list-overlay');
  panel.classList.remove('active');
  overlay.classList.remove('active');
  panel.setAttribute('aria-hidden', 'true');
}

/* ---- List inline search ---- */
function filterList(q) {
  var container = document.getElementById('incidents-list');
  container.querySelectorAll('.incident-card').forEach(function(card) {
    var text = card.textContent.toLowerCase();
    card.style.display = text.indexOf(q.toLowerCase()) !== -1 ? '' : 'none';
  });
}

/* ---- Modal helpers ---- */
function openModal(id) {
  var m = document.getElementById(id);
  m.classList.add('active');
  m.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  var m = document.getElementById(id);
  m.classList.remove('active');
  m.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

/* ---- Theme toggle ---- */
function applyTheme(dark) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  document.getElementById('theme-icon-light').style.display = dark ? 'none' : '';
  document.getElementById('theme-icon-dark').style.display  = dark ? '' : 'none';
  if (typeof switchTiles === 'function') switchTiles(dark);
  try { localStorage.setItem('fip-theme', dark ? 'dark' : 'light'); } catch(e) {}
}

/* ---- Share ---- */
function shareIncident() {
  if (navigator.share) {
    navigator.share({ title: document.title, url: window.location.href }).catch(function(){});
  } else {
    try {
      navigator.clipboard.writeText(window.location.href);
      var btn = document.getElementById('btn-share');
      var orig = btn.textContent;
      btn.textContent = 'Պատճենված!';
      setTimeout(function() { btn.innerHTML = '<svg viewBox="0 0 16 16" fill="none" style="width:14px;height:14px"><circle cx="13" cy="3" r="1.5" stroke="currentColor" stroke-width="1.4"/><circle cx="3" cy="8" r="1.5" stroke="currentColor" stroke-width="1.4"/><circle cx="13" cy="13" r="1.5" stroke="currentColor" stroke-width="1.4"/><path d="M4.5 7.5l7-3.5M4.5 8.5l7 3.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg> Կիսվել'; }, 2000);
    } catch(e) {}
  }
}

/* ---- Utility ---- */
function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* =============================================
   BOOT
   ============================================= */
document.addEventListener('DOMContentLoaded', function() {

  /* Theme: restore saved or detect system preference */
  var saved = null;
  try { saved = localStorage.getItem('fip-theme'); } catch(e) {}
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(saved ? saved === 'dark' : prefersDark);

  /* Init map */
  initMap();

  /* Close sidebar */
  document.getElementById('close-sidebar').addEventListener('click', closeSidebar);

  /* Sidebar drag-to-dismiss on mobile */
  var drag = document.getElementById('sidebar-drag');
  var dragStartY = 0;
  drag.addEventListener('touchstart', function(e) { dragStartY = e.touches[0].clientY; }, { passive: true });
  drag.addEventListener('touchend', function(e) {
    if (e.changedTouches[0].clientY - dragStartY > 60) closeSidebar();
  }, { passive: true });

  /* Share button */
  document.getElementById('btn-share').addEventListener('click', shareIncident);

  /* Theme toggle */
  document.getElementById('theme-toggle').addEventListener('click', function() {
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    applyTheme(!isDark);
  });

  /* List view toggle */
  document.getElementById('view-toggle').addEventListener('click', openListPanel);
  document.getElementById('close-list').addEventListener('click', closeListPanel);
  document.getElementById('list-overlay').addEventListener('click', closeListPanel);

  /* List inline search */
  document.getElementById('list-search').addEventListener('input', function() {
    filterList(this.value);
  });

  /* Global search */
  document.getElementById('search-input').addEventListener('input', function() {
    searchQuery = this.value;
    applyFilters();
  });

  /* Info modal */
  document.getElementById('btn-more-info').addEventListener('click', function() { openModal('info-modal'); });
  document.getElementById('close-info').addEventListener('click', function() { closeModal('info-modal'); });

  /* Submit modal */
  document.getElementById('btn-submit-video').addEventListener('click', function(e) {
    e.preventDefault();
    openModal('submit-modal');
  });
  document.getElementById('close-submit').addEventListener('click', function() { closeModal('submit-modal'); });

  /* Close modals on backdrop click */
  ['info-modal', 'submit-modal'].forEach(function(id) {
    document.getElementById(id).addEventListener('click', function(e) {
      if (e.target === this) closeModal(id);
    });
  });

  /* Keyboard: Escape closes everything */
  document.addEventListener('keydown', function(e) {
    if (e.key !== 'Escape') return;
    closeSidebar();
    closeModal('info-modal');
    closeModal('submit-modal');
    closeListPanel();
  });

  /* Load data — uses the inline FLOODS_DATA variable from data/floods.js */
  (function() {
    try {
      if (typeof FLOODS_DATA === 'undefined' || !FLOODS_DATA.length) throw new Error('No data');

      allData = FLOODS_DATA;
      updateMarkers(allData);
      initSlider(allData);
      updateStats(allData);

      /* Deep-link: open incident from ?id= param */
      try {
        var params = new URLSearchParams(window.location.search);
        var targetId = params.get('id');
        if (targetId) {
          var found = allData.find(function(d) { return String(d.id) === targetId; });
          if (found) setTimeout(function() { openSidebar(found); }, 400);
        }
      } catch(e) {}

      /* Hide loading overlay */
      var overlay = document.getElementById('loading-overlay');
      overlay.classList.add('hidden');
      setTimeout(function() { overlay.style.display = 'none'; }, 450);

    } catch(err) {
      console.error('Data error:', err);
      var overlay = document.getElementById('loading-overlay');
      overlay.querySelector('p').textContent = 'Սխալ. Թարմացրեք էջը։';
      overlay.querySelector('.spinner').style.display = 'none';
    }
  })();
});
