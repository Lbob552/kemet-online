// Sands of Kemet website - the visit and download counter (backend/supabase/migrations/0012_site_stats.sql).
// Counts a visit when a page opens and a download when the Android download link is clicked.
// It stores nothing on the visitor's device and sends only the page name and the host of the
// site the visitor came from; the counter keeps no address (see the privacy page).
// Each page includes it as:
//   <script src="stats.js" data-kemet-stats data-page="home" data-url="__SUPABASE_URL__" data-key="__SUPABASE_ANON_KEY__" defer></script>
// pages_finalize.py fills in the URL and key; until then (a local preview) it does nothing.
(function () {
  'use strict';
  var me = document.currentScript;
  if (!me) return;
  var url = String(me.getAttribute('data-url') || '').replace(/\/$/, '');
  var key = me.getAttribute('data-key') || '';
  var page = me.getAttribute('data-page') || 'home';
  if (!/^https:\/\/[^/]+$/.test(url) || !key || key.indexOf('__') === 0) return;

  function send(kind) {
    var from = '';
    if (kind === 'visit' && document.referrer) {
      try {
        var host = new URL(document.referrer).hostname;
        if (host !== location.hostname) from = host;
      } catch (e) { /* not a URL */ }
    }
    try {
      fetch(url + '/rest/v1/rpc/site_track', {
        method: 'POST',
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_kind: kind, p_page: page, p_ref: from }),
      }).catch(function () {});
    } catch (e) { /* counting must never break the page */ }
  }

  send('visit');
  document.addEventListener('click', function (event) {
    var link = event.target && event.target.closest ? event.target.closest('a[href]') : null;
    if (link && /\/kemet\.apk([?#]|$)/.test(link.href)) send('download');
  }, true);
})();
