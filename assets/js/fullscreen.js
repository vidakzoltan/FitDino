/* Shared fullscreen layout for the runner and Tatami, including touch controls. */
(function () {
  'use strict';

  const app = document.querySelector('[data-game-root]');
  const toggle = document.querySelector('[data-fullscreen-toggle]');
  if (!app || !toggle) return;

  let active = false;
  let nativeOwned = false;
  let busy = false;
  let previousScroll = 0;
  const fullscreenElement = () => document.fullscreenElement || document.webkitFullscreenElement;
  const resize = () => window.dispatchEvent(new Event('fitdino:resize'));

  function setActive(enabled) {
    if (enabled === active) return;
    if (enabled) previousScroll = window.scrollY;
    active = enabled;
    app.classList.toggle('is-game-fullscreen', enabled);
    document.documentElement.classList.toggle('game-fullscreen-open', enabled);
    toggle.setAttribute('aria-pressed', String(enabled));
    const label = enabled ? 'Kilépés a teljes képernyőből' : 'Teljes képernyő';
    toggle.setAttribute('aria-label', label);
    toggle.title = label;
    toggle.textContent = enabled ? '⛶ Kilépés' : '⛶ Teljes képernyő';
    if (!enabled) {
      window.scrollTo(0, previousScroll);
      toggle.focus({ preventScroll: true });
    }
    requestAnimationFrame(resize);
  }

  function syncNativeState() {
    if (fullscreenElement() === app) {
      nativeOwned = true;
      setActive(true);
    } else if (nativeOwned) {
      nativeOwned = false;
      setActive(false);
    }
    requestAnimationFrame(resize);
  }

  async function enter() {
    if (active) return;
    // The layout also works when the browser cannot hide its own bars.
    setActive(true);
    const request = app.requestFullscreen || app.webkitRequestFullscreen;
    if (request) {
      try {
        await request.call(app, { navigationUI: 'hide' });
        nativeOwned = fullscreenElement() === app;
      } catch (error) {
        // Keep the viewport-filling layout when fullscreen is unavailable or denied.
      }
    }
    await new Promise(requestAnimationFrame);
    resize();
  }

  async function leave() {
    if (fullscreenElement() === app) {
      const exit = document.exitFullscreen || document.webkitExitFullscreen;
      try {
        if (exit) await exit.call(document);
      } catch (error) {
        return; // Keep a usable layout if the browser refuses to leave fullscreen.
      }
      if (fullscreenElement() === app) return;
    }
    nativeOwned = false;
    setActive(false);
  }

  async function activate(startGame) {
    if (busy) return;
    busy = true;
    try {
      if (active && !startGame) await leave();
      else await enter();
      if (startGame) document.getElementById(app.dataset.startButton)?.click();
      if (active) app.querySelector('canvas')?.focus({ preventScroll: true });
    } finally {
      busy = false;
    }
  }

  toggle.addEventListener('click', () => activate(false));
  app.querySelectorAll('[data-fullscreen-start]').forEach((button) => {
    button.addEventListener('click', () => activate(true));
  });
  document.addEventListener('fullscreenchange', syncNativeState);
  document.addEventListener('webkitfullscreenchange', syncNativeState);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && active && !fullscreenElement()) leave();
  });
  window.visualViewport?.addEventListener('resize', resize);
})();
