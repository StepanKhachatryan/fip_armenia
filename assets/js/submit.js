/* =============================================
   SUBMIT.JS — public "report a flood" form
   ============================================= */

var MAX_VIDEOS = 10;

function addVideoInput(value) {
  var wrap = document.getElementById('video-inputs');
  if (wrap.children.length >= MAX_VIDEOS) return;

  var row = document.createElement('div');
  row.className = 'video-input-row';
  row.innerHTML =
    '<input type="url" class="video-url" maxlength="500" ' +
      'placeholder="https://www.youtube.com/watch?v=..." value="' + escHtml(value || '') + '">' +
    '<button type="button" class="icon-btn remove-video" aria-label="Հեռացնել հղումը">' +
      '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
        '<path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' +
      '</svg></button>';

  wrap.appendChild(row);
  syncVideoControls();
}

function syncVideoControls() {
  var wrap = document.getElementById('video-inputs');
  var rows = wrap.querySelectorAll('.video-input-row');
  /* The first row is always present, so it has nothing to remove. */
  rows.forEach(function (row, i) {
    row.querySelector('.remove-video').hidden = (rows.length === 1 && i === 0);
  });
  document.getElementById('btn-add-video').hidden = rows.length >= MAX_VIDEOS;
}

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
  if (msg) box.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

/* Collect + validate. Returns a payload, or null after showing an error. */
function collectSubmission() {
  var date  = document.getElementById('f-date').value;
  var title = document.getElementById('f-title').value.trim();
  var region = document.getElementById('f-region').value;
  var lat = parseFloat(document.getElementById('f-lat').value);
  var lng = parseFloat(document.getElementById('f-lng').value);
  var email = document.getElementById('f-email').value.trim();

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

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return showFormError('Էլ. փոստի հասցեն վավեր չէ։'), null;
  }

  var videos = [];
  var bad = null;
  document.querySelectorAll('.video-url').forEach(function (input) {
    var raw = input.value.trim();
    if (!raw) return;
    if (!normalizeVideoUrl(raw)) { bad = bad || raw; return; }
    videos.push(raw);
  });
  if (bad) {
    return showFormError('Հղումը չի ճանաչվել՝ «' + bad + '»։ Ընդունվում են միայն YouTube, Facebook, Instagram և TikTok հղումներ։'), null;
  }

  showFormError('');
  return {
    event_date: date,
    title: title,
    description: document.getElementById('f-desc').value.trim() || null,
    lat: lat,
    lng: lng,
    region_code: region,
    settlement: document.getElementById('f-settlement').value.trim() || null,
    videos: videos,
    source: document.getElementById('f-source').value.trim() || null,
    submitter_name: document.getElementById('f-name').value.trim() || null,
    submitter_email: email || null
  };
}

function resetSubmitForm() {
  document.getElementById('submit-form').reset();
  document.getElementById('video-inputs').innerHTML = '';
  addVideoInput('');
  document.getElementById('desc-count').textContent = '0';
  showFormError('');
  clearPickMarker();
  document.getElementById('submit-form').hidden = false;
  document.getElementById('submit-success').hidden = true;
}

function initSubmitForm() {
  fillRegionSelect();
  addVideoInput('');

  /* Today is the latest date a flood can have been observed. */
  var today = new Date();
  var iso = today.getFullYear() + '-' +
            String(today.getMonth() + 1).padStart(2, '0') + '-' +
            String(today.getDate()).padStart(2, '0');
  document.getElementById('f-date').max = iso;

  document.getElementById('btn-add-video').addEventListener('click', function () {
    addVideoInput('');
  });

  document.getElementById('video-inputs').addEventListener('click', function (e) {
    var btn = e.target.closest('.remove-video');
    if (!btn) return;
    var rows = document.querySelectorAll('.video-input-row');
    if (rows.length === 1) btn.closest('.video-input-row').querySelector('.video-url').value = '';
    else btn.closest('.video-input-row').remove();
    syncVideoControls();
  });

  document.getElementById('f-desc').addEventListener('input', function () {
    document.getElementById('desc-count').textContent = this.value.length;
  });

  /* Pick a point on the map: hide the dialog, let the user click, restore it. */
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

  document.getElementById('btn-cancel-submit').addEventListener('click', function () {
    closeModal('submit-modal');
  });

  document.getElementById('btn-close-success').addEventListener('click', function () {
    closeModal('submit-modal');
    resetSubmitForm();
  });

  document.getElementById('submit-form').addEventListener('submit', function (e) {
    e.preventDefault();

    var payload = collectSubmission();
    if (!payload) return;

    var btn = document.getElementById('btn-send-submit');
    btn.disabled = true;
    btn.textContent = 'Ուղարկվում է...';

    submitFlood(payload)
      .then(function () {
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
}
