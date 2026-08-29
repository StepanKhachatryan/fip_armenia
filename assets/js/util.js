/* =============================================
   UTIL.JS — formatting, escaping, video embeds
   ============================================= */

var MONTHS_SHORT = ['Հնվ','Փտվ','Մրտ','Ապր','Մյս','Հնս','Հլս','Օգս','Սեպ','Հոկ','Նոյ','Դեկ'];
var MONTHS_GEN   = ['հունվարի','փետրվարի','մարտի','ապրիլի','մայիսի','հունիսի','հուլիսի',
                    'օգոստոսի','սեպտեմբերի','հոկտեմբերի','նոյեմբերի','դեկտեմբերի'];

/* ---- Escaping ---- */
function escHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* ---- Dates ----
   Event dates are plain YYYY-MM-DD strings; parse them as calendar dates
   so a timezone offset can never shift them onto the previous day. */
function parseDate(str) {
  var p = String(str).split('-');
  return new Date(+p[0], +p[1] - 1, +p[2]);
}

function formatFullDate(str) {
  var d = parseDate(str);
  return d.getDate() + ' ' + MONTHS_GEN[d.getMonth()] + ', ' + d.getFullYear() + ' թ.';
}

function formatShortDate(str) {
  var d = parseDate(str);
  return d.getDate() + ' ' + MONTHS_SHORT[d.getMonth()] + ' ' + d.getFullYear();
}

function formatMonthLabel(year, month) {
  return MONTHS_SHORT[month] + ' ' + year;
}

/* ---- Regions ---- */
function regionName(code) {
  for (var i = 0; i < REGIONS.length; i++) {
    if (REGIONS[i].code === code) return REGIONS[i].name;
  }
  return '';
}

/* ---- Video links ----
   Accepts either a ready-made embed URL or a normal share link and
   returns a safe embed URL, or null when the host is not on the
   allow-list. Everything rendered into an iframe passes through here. */
function normalizeVideoUrl(raw) {
  var url;
  try { url = new URL(String(raw).trim()); } catch (e) { return null; }
  if (url.protocol !== 'https:') return null;
  if (ALLOWED_VIDEO_HOSTS.indexOf(url.hostname.toLowerCase()) === -1) return null;

  var host = url.hostname.toLowerCase().replace(/^www\./, '');
  var path = url.pathname;

  if (host === 'youtube.com' || host === 'youtu.be') {
    var id = null;
    if (host === 'youtu.be')                 id = path.slice(1);
    else if (path.indexOf('/embed/') === 0)  id = path.slice(7);
    else if (path.indexOf('/shorts/') === 0) id = path.slice(8);
    else if (path === '/watch')              id = url.searchParams.get('v');
    if (!id) return null;
    id = id.split('/')[0];
    if (!/^[A-Za-z0-9_-]{6,20}$/.test(id)) return null;
    return { url: 'https://www.youtube.com/embed/' + id, portrait: false };
  }

  if (host === 'facebook.com' || host === 'fb.watch') {
    if (path.indexOf('/plugins/video.php') === 0) {
      var h = parseInt(url.searchParams.get('height'), 10);
      var w = parseInt(url.searchParams.get('width'), 10);
      return { url: url.href, portrait: !!(h && w && h > w) };
    }
    return {
      url: 'https://www.facebook.com/plugins/video.php?href=' +
           encodeURIComponent(url.href) + '&show_text=false&width=267&height=476',
      portrait: true
    };
  }

  if (host === 'instagram.com') {
    var ig = path.match(/^\/(reel|reels|p|tv)\/([A-Za-z0-9_-]+)/);
    if (!ig) return null;
    var kind = ig[1] === 'reels' ? 'reel' : ig[1];
    return { url: 'https://www.instagram.com/' + kind + '/' + ig[2] + '/embed/', portrait: true };
  }

  if (host === 'tiktok.com') {
    var tk = path.match(/(?:\/embed(?:\/v2)?\/|\/video\/)(\d{6,25})/);
    if (!tk) return null;
    return { url: 'https://www.tiktok.com/embed/v2/' + tk[1], portrait: true };
  }

  return null;
}

function buildVideoEmbed(raw) {
  var v = normalizeVideoUrl(raw);
  if (!v) return '';
  return '<div class="video-wrapper ' + (v.portrait ? 'is-portrait' : 'is-wide') + '">'
       + '<iframe src="' + escHtml(v.url) + '" loading="lazy" frameborder="0"'
       + ' referrerpolicy="strict-origin-when-cross-origin"'
       + ' allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"'
       + ' allowfullscreen title="Ջրհեղեղի տեսանյութ"></iframe></div>';
}

/* ---- Misc ---- */
function debounce(fn, wait) {
  var t;
  return function () {
    var args = arguments, self = this;
    clearTimeout(t);
    t = setTimeout(function () { fn.apply(self, args); }, wait);
  };
}

function isMobile() {
  return window.matchMedia('(max-width: 860px)').matches;
}
