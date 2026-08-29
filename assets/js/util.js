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
   Accepts either a ready-made embed URL or a normal share link and returns
   { url, ratio } — ratio being width/height — or null when the host is not
   on the allow-list. Everything rendered into an iframe passes through here.

   The ratio is read from the link itself wherever the platform states it:
   Facebook plugin URLs carry explicit width/height per video, and the
   vertical formats (Shorts, Reels, TikTok) are identifiable from the path.
   Nothing else exposes real pixel dimensions to a browser — YouTube's and
   TikTok's oEmbed endpoints answer with the player's default box, not the
   video's — so the remaining cases fall back to the platform's own frame. */

/* Keep a video inside sane bounds: at most twice as wide as tall, and at
   most a little over twice as tall as wide. */
var RATIO_MIN = 0.45;
var RATIO_MAX = 2.2;
var RATIO_WIDE = 16 / 9;
var RATIO_TALL = 9 / 16;

function clampRatio(r) {
  if (!r || !isFinite(r) || r <= 0) return RATIO_WIDE;
  return Math.min(RATIO_MAX, Math.max(RATIO_MIN, r));
}

function normalizeVideoUrl(raw) {
  var url;
  try { url = new URL(String(raw).trim()); } catch (e) { return null; }
  if (url.protocol !== 'https:') return null;
  if (ALLOWED_VIDEO_HOSTS.indexOf(url.hostname.toLowerCase()) === -1) return null;

  var host = url.hostname.toLowerCase().replace(/^www\./, '');
  var path = url.pathname;

  if (host === 'youtube.com' || host === 'youtu.be') {
    var id = null, vertical = false;
    if (host === 'youtu.be')                 id = path.slice(1);
    else if (path.indexOf('/embed/') === 0)  id = path.slice(7);
    else if (path.indexOf('/shorts/') === 0) { id = path.slice(8); vertical = true; }
    else if (path === '/watch')              id = url.searchParams.get('v');
    if (!id) return null;
    id = id.split('/')[0];
    if (!/^[A-Za-z0-9_-]{6,20}$/.test(id)) return null;
    return {
      url: 'https://www.youtube.com/embed/' + id,
      ratio: vertical ? RATIO_TALL : RATIO_WIDE
    };
  }

  if (host === 'facebook.com' || host === 'fb.watch') {
    if (path.indexOf('/plugins/video.php') === 0) {
      /* Facebook states the real per-video box in the embed URL. */
      var w = parseInt(url.searchParams.get('width'), 10);
      var h = parseInt(url.searchParams.get('height'), 10);
      return { url: url.href, ratio: clampRatio(w && h ? w / h : RATIO_TALL) };
    }
    /* A plain reel/video link: reels are vertical, everything else 16:9. */
    var isReel = /^\/reels?\//.test(path);
    var box = isReel ? { w: 267, h: 476 } : { w: 560, h: 314 };
    return {
      url: 'https://www.facebook.com/plugins/video.php?href=' +
           encodeURIComponent(url.href) + '&show_text=false' +
           '&width=' + box.w + '&height=' + box.h,
      ratio: clampRatio(box.w / box.h)
    };
  }

  if (host === 'instagram.com') {
    var ig = path.match(/^\/(reel|reels|p|tv)\/([A-Za-z0-9_-]+)/);
    if (!ig) return null;
    var kind = ig[1] === 'reels' ? 'reel' : ig[1];
    /* Reels and IGTV are vertical; a feed post is square media in a
       slightly taller card. */
    return {
      url: 'https://www.instagram.com/' + kind + '/' + ig[2] + '/embed/',
      ratio: kind === 'p' ? 0.8 : RATIO_TALL
    };
  }

  if (host === 'tiktok.com') {
    var tk = path.match(/(?:\/embed(?:\/v2)?\/|\/video\/)(\d{6,25})/);
    if (!tk) return null;
    return { url: 'https://www.tiktok.com/embed/v2/' + tk[1], ratio: RATIO_TALL };
  }

  return null;
}

function buildVideoEmbed(raw) {
  var v = normalizeVideoUrl(raw);
  if (!v) return '';
  /* Reserve the exact box before the iframe loads, so the panel never
     reflows and nothing is letterboxed. */
  var padding = (100 / v.ratio).toFixed(3);
  return '<div class="video-wrapper" style="padding-top:' + padding + '%">'
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
