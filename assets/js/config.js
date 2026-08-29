/* =============================================
   CONFIG.JS — backend endpoint + static reference data
   ============================================= */

/* Supabase REST endpoint. The publishable key is meant to be public:
   every table is protected by row level security, so this key grants
   read access to published floods and nothing else. */
var SUPABASE_URL = 'https://mejjprejtcyoyfoiocrq.supabase.co';
var SUPABASE_KEY = 'sb_publishable_pewwcXn6lNkQz39IUo1r4Q_kij-hqd0';

/* Marker colour — one colour for every incident. */
var MARKER_COLOR = '#0b6fa4';

/* Administrative divisions of Armenia: 10 marzes + Yerevan.
   Mirrors public.regions in the database. */
var REGIONS = [
  { code: 'yerevan',     name: 'Երևան' },
  { code: 'aragatsotn',  name: 'Արագածոտն' },
  { code: 'ararat',      name: 'Արարատ' },
  { code: 'armavir',     name: 'Արմավիր' },
  { code: 'gegharkunik', name: 'Գեղարքունիք' },
  { code: 'lori',        name: 'Լոռի' },
  { code: 'kotayk',      name: 'Կոտայք' },
  { code: 'shirak',      name: 'Շիրակ' },
  { code: 'syunik',      name: 'Սյունիք' },
  { code: 'vayots_dzor', name: 'Վայոց ձոր' },
  { code: 'tavush',      name: 'Տավուշ' }
];

/* How many video links a single incident may carry. Mirrors the
   cardinality check on floods.videos / flood_submissions.videos. */
var MAX_VIDEOS = 25;

/* Video hosts we are willing to embed in an iframe. */
var ALLOWED_VIDEO_HOSTS = [
  'youtube.com', 'www.youtube.com', 'youtu.be', 'www.youtu.be',
  'facebook.com', 'www.facebook.com', 'fb.watch', 'www.fb.watch',
  'instagram.com', 'www.instagram.com',
  'tiktok.com', 'www.tiktok.com'
];
