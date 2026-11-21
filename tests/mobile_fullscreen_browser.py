"""Browser regression: python -m pip install playwright==1.56.0
python -m playwright install chromium
python tests/mobile_fullscreen_browser.py
Uses a temporary local HTTP server; no production requests or changes.
"""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread

from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[1]


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def assert_layout(page, tatami):
    # Wait for flex layout and ResizeObserver after a fullscreen/orientation change.
    page.wait_for_function("""() => {
      const app = document.querySelector('[data-game-root]');
      const canvas = app.querySelector('canvas').getBoundingClientRect();
      return app.classList.contains('is-game-fullscreen') &&
        Math.abs(app.getBoundingClientRect().height - innerHeight) < 2 &&
        canvas.height > innerHeight - 170;
    }""")
    layout = page.evaluate("""() => {
      const app = document.querySelector('[data-game-root]');
      const canvas = app.querySelector('canvas').getBoundingClientRect();
      const toggle = app.querySelector('[data-fullscreen-toggle]').getBoundingClientRect();
      return {width:innerWidth, height:innerHeight, overflow:app.scrollWidth-app.clientWidth,
        canvas:{top:canvas.top,bottom:canvas.bottom,width:canvas.width,height:canvas.height},
        toggle:{left:toggle.left,right:toggle.right,top:toggle.top,bottom:toggle.bottom}};
    }""")
    assert layout['overflow'] <= 1, layout
    assert layout['canvas']['width'] >= layout['width'] - 2, layout
    assert 0 <= layout['toggle']['left'] < layout['toggle']['right'] <= layout['width'], layout
    assert 0 <= layout['toggle']['top'] < layout['toggle']['bottom'] <= layout['height'], layout
    if tatami:
        for button in page.locator('[data-control]').all():
            expect(button).to_be_visible()
            box = button.bounding_box()
            assert box['y'] >= layout['canvas']['bottom'] - 1, (layout, box)
            assert box['y'] + box['height'] <= layout['height'], (layout, box)
            assert box['height'] >= 44 and box['width'] >= 44, box


def run_case(browser, base_url, filename, mode, viewport):
    context = browser.new_context(viewport=viewport, is_mobile=True, has_touch=True,
                                  device_scale_factor=2)
    try:
        if mode == 'missing':
            context.add_init_script("""
              Element.prototype.requestFullscreen = undefined;
              Element.prototype.webkitRequestFullscreen = undefined;
            """)
        elif mode == 'denied':
            context.add_init_script("""
              Element.prototype.requestFullscreen = () =>
                Promise.reject(new DOMException('Test: fullscreen denied', 'NotAllowedError'));
            """)
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(base_url + filename, wait_until='networkidle')
        tatami = filename == 'tatami.html'
        overlay = page.locator('#tatamiOverlay' if tatami else '#overlay')
        pause = page.locator('#btnTatamiPause' if tatami else '#btnPause')
        toggle = page.locator('[data-fullscreen-toggle]')
        app = page.locator('[data-game-root]')
        page.locator('[data-fullscreen-start]').tap()
        expect(overlay).to_be_hidden()
        expect(toggle).to_have_attribute('aria-pressed', 'true')
        if mode == 'native':
            page.wait_for_function("document.fullscreenElement === document.querySelector('[data-game-root]')")
        else:
            assert page.evaluate('document.fullscreenElement === null')
        assert_layout(page, tatami)
        pause.tap()
        expect(pause).to_have_attribute('aria-pressed', 'true')
        expect(pause).to_have_accessible_name('Folytatás')
        page.set_viewport_size({'width': viewport['height'], 'height': viewport['width']})
        assert_layout(page, tatami)
        pause.tap()
        expect(pause).to_have_attribute('aria-pressed', 'false')
        if tatami:
            page.locator('[data-control="strike"]').tap()
        else:
            page.locator('canvas').tap()
        toggle.tap()
        expect(toggle).to_have_attribute('aria-pressed', 'false')
        page.wait_for_function("!document.querySelector('[data-game-root]').classList.contains('is-game-fullscreen')")
        expect(page.locator('.mode-switch')).to_be_visible()
        assert page.evaluate('document.fullscreenElement === null')
        # Native system exit and fallback Escape must also restore normal layout.
        toggle.tap()
        expect(toggle).to_have_attribute('aria-pressed', 'true')
        if mode == 'native':
            page.wait_for_function("document.fullscreenElement === document.querySelector('[data-game-root]')")
            page.evaluate('document.exitFullscreen()')
        else:
            page.keyboard.press('Escape')
        expect(toggle).to_have_attribute('aria-pressed', 'false')
        assert not errors, errors
        print(f'PASS {filename} {mode} {viewport}', flush=True)
    finally:
        context.close()


def main():
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(ROOT)))
    Thread(target=server.serve_forever, daemon=True).start()
    base_url = f'http://127.0.0.1:{server.server_port}/'
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch()
            try:
                for filename in ['index.html', 'tatami.html']:
                    for mode in ['native', 'missing', 'denied']:
                        for width, height in [(390, 844), (844, 390), (568, 320)]:
                            run_case(browser, base_url, filename, mode,
                                     {'width': width, 'height': height})
            finally:
                browser.close()
    finally:
        server.shutdown()
        server.server_close()


if __name__ == '__main__':
    main()
