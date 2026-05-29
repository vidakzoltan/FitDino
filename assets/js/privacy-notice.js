/*
YAML:
  assets/js/privacy-notice.js:
    description: |
      FitDino kliensoldali adatvédelmi/footer link és egyszer megjelenő felső
      tájékoztató sáv a működéshez szükséges sütikről és helyi böngészőtárolásról.
      A tájékoztató sáv a topbar fölé kerül.
      A tájékoztató sáv nem marketing-cookie hozzájárulás, hanem működési
      tájékoztatás tudomásulvétele.
    version: "1.0.0"
    functions:
      - fitDinoPrivacy.ensure
      - fitDinoPrivacy.ensureNotice
      - fitDinoPrivacy.acceptNotice
    modification_guidelines:
      - A link célja a publikus ZenitPrograms adatvédelmi irányelvek oldala.
      - A footer link mindig publikus maradjon, üzleti logika nélkül.
      - A tájékoztató sáv a topbar fölött jelenjen meg, ne alsó lebegő bannerként.
      - A tájékoztató sáv csak a működéshez szükséges sütikről és helyi böngészőtárolásról szólhat.
      - Ne kerüljön bele analytics, marketing vagy reklám-cookie engedélyezési logika.
      - A tudomásulvétel localStorage-ban és technikai cookie-ban tárolható, személyes adat nélkül.
*/

(function (w, d) {
  'use strict';

  const NOTICE_ID = 'fitdino-privacy-storage-notice';
  const POLICY_URL = 'https://www.zenitprograms.hu/?page_id=226';
  const NOTICE_VERSION = '2026-05-29';
  const NOTICE_STORAGE_KEY = 'fitdino_privacy_storage_notice_ok';
  const NOTICE_COOKIE_NAME = 'fitdino_privacy_storage_notice_ok';

  function getStoredNoticeDecision() {
    try {
      return w.localStorage ? w.localStorage.getItem(NOTICE_STORAGE_KEY) : null;
    } catch (error) {
      return null;
    }
  }

  function setStoredNoticeDecision() {
    try {
      if (w.localStorage) {
        w.localStorage.setItem(NOTICE_STORAGE_KEY, NOTICE_VERSION);
      }
    } catch (error) {
      // A localStorage tiltása nem akadályozhatja a játék használatát.
    }

    d.cookie = NOTICE_COOKIE_NAME + '=' + encodeURIComponent(NOTICE_VERSION) + '; path=/; max-age=31536000; SameSite=Lax';
  }

  function hasCookieNoticeDecision() {
    const expected = NOTICE_COOKIE_NAME + '=' + encodeURIComponent(NOTICE_VERSION);
    return String(d.cookie || '').split(';').map(function (item) {
      return item.trim();
    }).indexOf(expected) !== -1;
  }

  function hasAcceptedNotice() {
    return getStoredNoticeDecision() === NOTICE_VERSION || hasCookieNoticeDecision();
  }

  function acceptNotice() {
    setStoredNoticeDecision();
    const notice = d.getElementById(NOTICE_ID);
    if (notice) {
      notice.setAttribute('hidden', 'hidden');
    }
  }

  function noticeInsertTarget() {
    const topbar = d.querySelector('.topbar');
    if (topbar && topbar.parentNode) {
      return { parent: topbar.parentNode, before: topbar };
    }

    return { parent: d.body, before: d.body.firstChild };
  }

  function ensureNotice() {
    if (!d.body || d.getElementById(NOTICE_ID)) return;

    const notice = d.createElement('div');
    notice.id = NOTICE_ID;
    notice.className = 'privacy-storage-notice';
    notice.setAttribute('role', 'region');
    notice.setAttribute('aria-label', 'Adatvédelmi és cookie tájékoztató');

    if (hasAcceptedNotice()) {
      notice.setAttribute('hidden', 'hidden');
    }

    const text = d.createElement('div');
    text.className = 'privacy-storage-notice__text';
    text.appendChild(d.createTextNode('A FitDino a működéséhez szükséges technikai sütit és helyi böngészőtárolást használ. Ezek a játékállapot, a rekord és a tájékoztató tudomásulvételének megőrzéséhez szükségesek. '));

    const link = d.createElement('a');
    link.href = POLICY_URL;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Részletek: Adatvédelmi irányelvek.';
    text.appendChild(link);

    const button = d.createElement('button');
    button.type = 'button';
    button.className = 'privacy-storage-notice__button';
    button.textContent = 'Rendben';
    button.addEventListener('click', acceptNotice);

    notice.appendChild(text);
    notice.appendChild(button);

    const target = noticeInsertTarget();
    target.parent.insertBefore(notice, target.before || null);
  }

  function ensure() {
    if (!d.body) return;

    ensureNotice();
  }

  w.fitDinoPrivacy = Object.assign(w.fitDinoPrivacy || {}, {
    ensure: ensure,
    ensureNotice: ensureNotice,
    acceptNotice: acceptNotice
  });

  if (d.readyState === 'loading') {
    d.addEventListener('DOMContentLoaded', ensure);
  } else {
    ensure();
  }
})(window, document);
