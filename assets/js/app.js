/* =============================================
   APP.JS — boot, theme, modals, global wiring
   ============================================= */

/* ---- Modals ---- */
function openModal(id) {
  var m = document.getElementById(id);
  m.classList.add('active');
  m.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

function closeModal(id) {
  var m = document.getElementById(id);
  m.classList.remove('active');
  m.setAttribute('aria-hidden', 'true');
  if (!document.querySelector('.modal.active')) document.body.classList.remove('modal-open');
}

/* ---- Theme ---- */
function applyTheme(dark) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  document.getElementById('theme-icon-light').hidden = dark;
  document.getElementById('theme-icon-dark').hidden = !dark;
  try { localStorage.setItem('fip-theme', dark ? 'dark' : 'light'); } catch (e) {}
}

/* ---- Share ---- */
function shareIncident() {
  var url = window.location.href;
  var label = document.getElementById('share-label');

  if (navigator.share) {
    navigator.share({ title: document.title, url: url }).catch(function () {});
    return;
  }
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(function () {
      label.textContent = 'Պատճենվեց!';
      setTimeout(function () { label.textContent = 'Կիսվել'; }, 2000);
    }).catch(function () {});
  }
}

/* ---- Loading / error overlay ---- */
function hideLoading() {
  var o = document.getElementById('loading-overlay');
  o.classList.add('hidden');
  setTimeout(function () { o.style.display = 'none'; }, 400);
}

function showLoadError() {
  var o = document.getElementById('loading-overlay');
  o.querySelector('.spinner').style.display = 'none';
  document.getElementById('loading-text').textContent =
    'Տվյալները չհաջողվեց բեռնել։ Ստուգեք ինտերնետ կապը։';
  document.getElementById('btn-retry').hidden = false;
}

/* ---- Data ---- */
function loadData() {
  return fetchFloods().then(function (data) {
    if (!data.length) throw new Error('empty dataset');

    initFilters(data);
    fitToData(data);
    hideLoading();

    /* Deep link: ?id=<flood id> opens that incident. */
    try {
      var target = new URLSearchParams(window.location.search).get('id');
      if (target) {
        var found = data.find(function (d) { return String(d.id) === target; });
        if (found) setTimeout(function () { openDetail(found); }, 500);
      }
    } catch (e) {}
  });
}

/* =============================================
   BOOT
   ============================================= */
document.addEventListener('DOMContentLoaded', function () {

  var saved = null;
  try { saved = localStorage.getItem('fip-theme'); } catch (e) {}
  applyTheme(saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches);

  initMap();
  initSubmitForm();

  /* --- header --- */
  document.getElementById('theme-toggle').addEventListener('click', function () {
    applyTheme(document.documentElement.getAttribute('data-theme') !== 'dark');
  });

  document.getElementById('search-toggle').addEventListener('click', function () {
    document.body.classList.toggle('search-open');
    if (document.body.classList.contains('search-open')) {
      document.getElementById('search-input').focus();
    }
  });

  document.getElementById('view-toggle').addEventListener('click', openListPanel);
  document.getElementById('close-list').addEventListener('click', closeListPanel);
  document.getElementById('list-overlay').addEventListener('click', closeListPanel);

  document.getElementById('btn-more-info').addEventListener('click', function () {
    openModal('info-modal');
  });
  document.getElementById('close-info').addEventListener('click', function () {
    closeModal('info-modal');
  });

  document.getElementById('btn-submit-video').addEventListener('click', function () {
    openModal('submit-modal');
  });
  document.getElementById('close-submit').addEventListener('click', function () {
    closeModal('submit-modal');
  });

  /* --- filter panel --- */
  document.getElementById('filter-fab').addEventListener('click', openFilterPanel);
  document.getElementById('close-filters').addEventListener('click', closeFilterPanel);
  document.getElementById('filter-overlay').addEventListener('click', closeFilterPanel);

  /* --- detail panel --- */
  document.getElementById('close-detail').addEventListener('click', closeDetail);
  document.getElementById('btn-share').addEventListener('click', shareIncident);

  /* Add a clip to the incident currently open, rather than filing a new one. */
  document.getElementById('btn-add-video-here').addEventListener('click', function () {
    if (currentDetailItem) openAddVideoFor(currentDetailItem);
  });

  /* Swipe the grip down to dismiss the detail sheet on touch devices. */
  (function () {
    var grip = document.getElementById('detail-grip'), startY = 0;
    grip.addEventListener('touchstart', function (e) {
      startY = e.touches[0].clientY;
    }, { passive: true });
    grip.addEventListener('touchend', function (e) {
      if (e.changedTouches[0].clientY - startY > 50) closeDetail();
    }, { passive: true });
  })();

  /* --- modals: backdrop + escape --- */
  ['info-modal', 'submit-modal'].forEach(function (id) {
    document.getElementById(id).addEventListener('click', function (e) {
      if (e.target === this) closeModal(id);
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (pickMode) { cancelPick(); openModal('submit-modal'); return; }
    if (document.querySelector('.modal.active')) {
      closeModal('info-modal');
      closeModal('submit-modal');
      return;
    }
    closeDetail();
    closeListPanel();
    closeFilterPanel();
  });

  /* --- data --- */
  document.getElementById('btn-retry').addEventListener('click', function () {
    window.location.reload();
  });

  loadData().catch(function (err) {
    console.error('Data error:', err);
    showLoadError();
  });
});
