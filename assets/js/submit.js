/* =============================================
   SUBMIT.JS — public "report a flood" form
   Two modes: a brand new incident, or extra video
   links attached to an incident already on the map.
   ============================================= */

var submitMode = 'new';      /* 'new' | 'addition' */
var targetFlood = null;      /* the incident an addition is attached to */

/* ---------- video rows ---------- */

function addVideoInput(value) {
  var wrap = document.getElementById('video-inputs');
  if (wrap.querySelectorAll('.video-input-row').length >= MAX_VIDEOS) return;

  var row = document.createElement('div');
  row.className = 'video-input-row';
  row.innerHTML =
    '<div class="video-input-line">' +
      '<input type="url" class="video-url" maxlength="500" ' +
        'placeholder="https://www.youtube.com/watch?v=..." value="' + escHtml(value || '') + '">' +
      '<button type="button" class="icon-btn remove-video" aria-label="Հեռացնել հղումը">' +
        '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
          '<path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' +
        '</svg></button>' +
    '</div>' +
    '<div class="video-status" hidden></div>' +
    '<div class="video-preview" hidden></div>';

  wrap.appendChild(row);
  syncVideoControls();
  if (value) refreshPreview(row);
  return row;
}

function syncVideoControls() {
  var rows = document.querySelectorAll('#video-inputs .video-input-row');
  /* The first row is always present, so it has nothing to remove. */
  rows.forEach(function (row, i) {
    row.querySelector('.remove-video').hidden = (rows.length === 1 && i === 0);
  });
  document.getElementById('btn-add-video').hidden = rows.length >= MAX_VIDEOS;
}

/* Show what the link resolved to, and embed it so the reporter can
   confirm it is the right clip before sending. */
function refreshPreview(row) {
  var raw     = row.querySelector('.video-url').value.trim();
  var status  = row.querySelector('.video-status');
  var preview = row.querySelector('.video-preview');

  row.classList.remove('is-valid', 'is-invalid');
  preview.innerHTML = '';

  if (!raw) {
    status.hidden = true;
    preview.hidden = true;
    return;
  }

  var v = normalizeVideoUrl(raw);

  if (!v) {
    row.classList.add('is-invalid');
    status.hidden = false;
    preview.hidden = true;
    status.innerHTML =
      '<span class="status-icon">✕</span>' +
      '<span>Հղումը չի ճանաչվել։ Տեղադրեք տեսանյութի սովորական հասցեն YouTube-ից, ' +
      'Facebook-ից, Instagram-ից կամ TikTok-ից (հասցեագոտուց կամ «Share» կոճակից)։</span>';
    return;
  }

  row.classList.add('is-valid');
  status.hidden = false;
  status.innerHTML =
    '<span class="status-icon">✓</span>' +
    '<span>' + escHtml(v.platform) + ' — ստորև ստուգեք, որ սա ճիշտ տեսանյութն է</span>';

  /* Keep previews small: fit inside a 240x240 box at the video's ratio. */
  var w = 240, h = 240 / v.ratio;
  if (h > 240) { h = 240; w = 240 * v.ratio; }

  preview.hidden = false;
  preview.innerHTML =
    '<div class="video-preview-box" style="width:' + w.toFixed(0) + 'px;height:' + h.toFixed(0) + 'px">' +
      '<iframe src="' + escHtml(v.url) + '" loading="lazy" frameborder="0"' +
      ' referrerpolicy="strict-origin-when-cross-origin"' +
      ' allow="clipboard-write; encrypted-media; picture-in-picture; web-share"' +
      ' allowfullscreen title="Նախադիտում"></iframe>' +
    '</div>';
}

function collectVideoLinks() {
  var links = [], invalid = null;
  document.querySelectorAll('#video-inputs .video-url').forEach(function (input) {
    var raw = input.value.trim();
    if (!raw) return;
    if (!normalizeVideoUrl(raw)) { invalid = invalid || raw; return; }
    links.push(raw);
  });
  return { links: links, invalid: invalid };
}

/* ---------- mode + target incident ---------- */

function setSubmitMode(mode) {
  submitMode = mode;
  var form = document.getElementById('submit-form');
  form.classList.toggle('mode-is-new', mode === 'new');
  form.classList.toggle('mode-is-addition', mode === 'addition');

  document.getElementById('mode-new').classList.toggle('is-active', mode === 'new');
  document.getElementById('mode-addition').classList.toggle('is-active', mode === 'addition');
  document.getElementById('mode-new').setAttribute('aria-selected', mode === 'new');
  document.getElementById('mode-addition').setAttribute('aria-selected', mode === 'addition');

  document.getElementById('submit-title').textContent =
    mode === 'new' ? 'Ներկայացնել ջրհեղեղի դեպք' : 'Ավելացնել տեսանյութ առկա դեպքին';

  showFormError('');
}

function setTargetFlood(item) {
  targetFlood = item;
  var chosen = document.getElementById('target-chosen');
  var picker = document.getElementById('target-picker');

  if (!item) {
    chosen.hidden = true;
    picker.hidden = false;
    return;
  }

  document.getElementById('target-date').textContent  = formatShortDate(item.date);
  document.getElementById('target-title').textContent = item.title;
  document.getElementById('target-region').textContent =
    [item.settlement, regionName(item.region)].filter(Boolean).join(', ') +
    ' · ' + item.videos.length + ' տեսանյութ';

  chosen.hidden = false;
  picker.hidden = true;
  showFormError('');
}

function renderTargetResults(query) {
  var box = document.getElementById('target-results');
  var q = query.trim().toLowerCase();

  var matches = allData.filter(function (d) {
    if (!q) return true;
    return d.title.toLowerCase().indexOf(q) !== -1
        || d.settlement.toLowerCase().indexOf(q) !== -1
        || regionName(d.region).toLowerCase().indexOf(q) !== -1;
  }).sort(function (a, b) { return parseDate(b.date) - parseDate(a.date); }).slice(0, 40);

  if (!matches.length) {
    box.innerHTML = '<p class="empty-note">Համընկնող դեպք չգտնվեց։</p>';
    return;
  }

  box.innerHTML = matches.map(function (d) {
    var place = [d.settlement, regionName(d.region)].filter(Boolean).join(', ');
    return '<button type="button" class="target-option" role="option" data-id="' + escHtml(d.id) + '">' +
             '<span class="target-option-date">' + escHtml(formatShortDate(d.date)) + '</span>' +
             '<span class="target-option-title">' + escHtml(d.title) + '</span>' +
             '<span class="target-option-region">' + escHtml(place) + '</span>' +
           '</button>';
  }).join('');
}

/* ---------- form plumbing ---------- */

function fillRegionSelect() {
  var sel = document.getElementById('f-region');
  REGIONS.forEach(function (r) {
    var opt = document.createElement('option');
    opt.value = r.code;
    opt.textContent = r.name;
    sel.appendChild(opt);
  });
}

function showFormError(msg) {
  var box = document.getElementById('form-error');
  box.textContent = msg;
  box.hidden = !msg;
  /* Jump rather than animate: a smooth scroll keeps moving the Send button
     for a few hundred ms, which swallows the user's next click on it. */
  if (msg) box.scrollIntoView({ block: 'nearest' });
}

/* Collect + validate. Returns a payload, or null after showing an error. */
function collectSubmission() {
  var video = collectVideoLinks();
  if (video.invalid) {
    return showFormError('Հղումը չի ճանաչվել՝ «' + video.invalid + '»։ Ընդունվում են միայն ' +
                         'YouTube, Facebook, Instagram և TikTok հղումներ։'), null;
  }

  var note  = document.getElementById('f-note').value.trim() || null;
  var email = document.getElementById('f-email').value.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return showFormError('Էլ. փոստի հասցեն վավեր չէ։'), null;
  }
  var name = document.getElementById('f-name').value.trim() || null;

  if (submitMode === 'addition') {
    if (!targetFlood) return showFormError('Ընտրեք այն դեպքը, որին ավելացնում եք տեսանյութը։'), null;
    if (!video.links.length) {
      return showFormError('Ավելացրեք առնվազն մեկ տեսանյութի հղում։'), null;
    }
    showFormError('');
    return {
      kind: 'addition',
      target_flood_id: targetFlood.id,
      videos: video.links,
      submitter_note: note,
      submitter_name: name,
      submitter_email: email || null
    };
  }

  var date   = document.getElementById('f-date').value;
  var title  = document.getElementById('f-title').value.trim();
  var region = document.getElementById('f-region').value;
  var lat    = parseFloat(document.getElementById('f-lat').value);
  var lng    = parseFloat(document.getElementById('f-lng').value);

  if (!date) return showFormError('Նշեք դեպքի ամսաթիվը։'), null;

  var today = new Date(); today.setHours(0, 0, 0, 0);
  if (parseDate(date) > today) return showFormError('Ամսաթիվը չի կարող լինել ապագայում։'), null;
  if (parseDate(date).getFullYear() < 2000) return showFormError('Ամսաթիվը պետք է լինի 2000 թվականից հետո։'), null;

  if (title.length < 3) return showFormError('Վերնագիրը պետք է պարունակի առնվազն 3 նիշ։'), null;
  if (!region) return showFormError('Ընտրեք մարզը։'), null;

  if (isNaN(lat) || isNaN(lng)) return showFormError('Նշեք դեպքի վայրը քարտեզի վրա կամ մուտքագրեք կոորդինատները։'), null;
  if (lat < 38.7 || lat > 41.4 || lng < 43.3 || lng > 46.8) {
    return showFormError('Կոորդինատները դուրս են Հայաստանի սահմաններից։'), null;
  }

  showFormError('');
  return {
    kind: 'new',
    event_date: date,
    title: title,
    description: document.getElementById('f-desc').value.trim() || null,
    lat: lat,
    lng: lng,
    region_code: region,
    settlement: document.getElementById('f-settlement').value.trim() || null,
    videos: video.links,
    source: document.getElementById('f-source').value.trim() || null,
    submitter_note: note,
    submitter_name: name,
    submitter_email: email || null
  };
}

function resetSubmitForm() {
  document.getElementById('submit-form').reset();
  document.getElementById('video-inputs').innerHTML = '';
  addVideoInput('');
  document.getElementById('desc-count').textContent = '0';
  document.getElementById('target-search').value = '';
  renderTargetResults('');
  setTargetFlood(null);
  setSubmitMode('new');
  showFormError('');
  clearPickMarker();
  document.getElementById('submit-form').hidden = false;
  document.getElementById('submit-success').hidden = true;
}

/* Open the form pre-aimed at an incident already on the map. */
function openAddVideoFor(item) {
  resetSubmitForm();
  setSubmitMode('addition');
  setTargetFlood(item);
  openModal('submit-modal');
}

function initSubmitForm() {
  fillRegionSelect();
  addVideoInput('');

  document.getElementById('max-videos-hint').textContent = MAX_VIDEOS;

  /* Today is the latest date a flood can have been observed. */
  var today = new Date();
  document.getElementById('f-date').max = today.getFullYear() + '-' +
    String(today.getMonth() + 1).padStart(2, '0') + '-' +
    String(today.getDate()).padStart(2, '0');

  /* --- mode tabs --- */
  document.getElementById('mode-new').addEventListener('click', function () {
    setSubmitMode('new');
  });
  document.getElementById('mode-addition').addEventListener('click', function () {
    setSubmitMode('addition');
    if (!targetFlood) renderTargetResults(document.getElementById('target-search').value);
  });

  /* --- target incident picker --- */
  document.getElementById('target-search').addEventListener('input', debounce(function () {
    renderTargetResults(this.value);
  }, 150));

  document.getElementById('target-results').addEventListener('click', function (e) {
    var opt = e.target.closest('.target-option');
    if (!opt) return;
    var item = allData.find(function (d) { return String(d.id) === opt.dataset.id; });
    if (item) setTargetFlood(item);
  });

  document.getElementById('btn-change-target').addEventListener('click', function () {
    setTargetFlood(null);
    renderTargetResults(document.getElementById('target-search').value);
    document.getElementById('target-search').focus();
  });

  /* --- video rows --- */
  document.getElementById('btn-add-video').addEventListener('click', function () {
    var row = addVideoInput('');
    if (row) row.querySelector('.video-url').focus();
  });

  var videoInputs = document.getElementById('video-inputs');

  videoInputs.addEventListener('click', function (e) {
    var btn = e.target.closest('.remove-video');
    if (!btn) return;
    var row = btn.closest('.video-input-row');
    if (document.querySelectorAll('#video-inputs .video-input-row').length === 1) {
      row.querySelector('.video-url').value = '';
      refreshPreview(row);
    } else {
      row.remove();
    }
    syncVideoControls();
  });

  var livePreview = debounce(function (row) { refreshPreview(row); }, 500);
  videoInputs.addEventListener('input', function (e) {
    if (!e.target.classList.contains('video-url')) return;
    livePreview(e.target.closest('.video-input-row'));
  });
  /* Pasting or leaving the field should confirm immediately. */
  videoInputs.addEventListener('change', function (e) {
    if (e.target.classList.contains('video-url')) refreshPreview(e.target.closest('.video-input-row'));
  });
  videoInputs.addEventListener('paste', function (e) {
    if (!e.target.classList.contains('video-url')) return;
    var row = e.target.closest('.video-input-row');
    setTimeout(function () { refreshPreview(row); }, 0);
  });

  document.getElementById('f-desc').addEventListener('input', function () {
    document.getElementById('desc-count').textContent = this.value.length;
  });

  /* --- pick a point on the map --- */
  document.getElementById('btn-pick-location').addEventListener('click', function () {
    closeModal('submit-modal');
    if (isMobile()) closeFilterPanel();
    startPick(function (lat, lng) {
      document.getElementById('f-lat').value = lat.toFixed(6);
      document.getElementById('f-lng').value = lng.toFixed(6);
      openModal('submit-modal');
      showFormError('');
    });
  });

  document.getElementById('cancel-pick').addEventListener('click', function () {
    cancelPick();
    openModal('submit-modal');
  });

  /* --- open / close --- */
  document.getElementById('btn-cancel-submit').addEventListener('click', function () {
    closeModal('submit-modal');
  });

  document.getElementById('btn-close-success').addEventListener('click', function () {
    closeModal('submit-modal');
    resetSubmitForm();
  });

  /* --- send --- */
  document.getElementById('submit-form').addEventListener('submit', function (e) {
    e.preventDefault();

    var payload = collectSubmission();
    if (!payload) return;

    var btn = document.getElementById('btn-send-submit');
    btn.disabled = true;
    btn.textContent = 'Ուղարկվում է...';

    submitFlood(payload)
      .then(function () {
        document.getElementById('submit-success-text').textContent = payload.kind === 'addition'
          ? 'Ձեր տեսանյութը ստացվել է և սպասում է ստուգման։ Հաստատվելուց հետո այն կավելանա ընտրված դեպքին։'
          : 'Ձեր ներկայացրած դեպքը ստացվել է և սպասում է ստուգման։ Հաստատվելուց հետո այն կհայտնվի քարտեզի վրա։';
        document.getElementById('submit-form').hidden = true;
        document.getElementById('submit-success').hidden = false;
        clearPickMarker();
      })
      .catch(function (err) {
        console.error('Submit failed:', err);
        showFormError('Ուղարկումը չհաջողվեց։ Ստուգեք ինտերնետ կապը և փորձեք կրկին։');
      })
      .then(function () {
        btn.disabled = false;
        btn.textContent = 'Ուղարկել';
      });
  });

  setSubmitMode('new');
}
