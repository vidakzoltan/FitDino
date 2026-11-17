// FitDino regressziós ellenőrzések, külső függőség nélkül: node --test tests/audit.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const file = (name) => fs.readFileSync(path.join(root, name), 'utf8');

test('Mindkét belépő és a hozzájuk tartozó vezérlők léteznek', () => {
  for (const name of ['index.html', 'tatami.html']) {
    const html = file(name);
    assert.match(html, /<canvas[^>]+tabindex="0"/);
    for (const match of html.matchAll(/(?:src|href)="(assets\/[^"?]+)/g)) {
      assert.ok(fs.existsSync(path.join(root, match[1])), name + ' hiányzó asset: ' + match[1]);
    }
  }
});

test('A rekordtárolás hibája nem szakíthatja meg a futást', () => {
  const js = file('assets/js/game.js');
  const load = js.slice(js.indexOf('function loadBest()'), js.indexOf('function isMobileLikeLayout()'));
  assert.match(load, /try\s*\{/);
  assert.match(load, /catch\s*\(/);
  assert.match(load, /return 0;/);
});

test('Képkockától független fizika és akadáktávolság', () => {
  const js = file('assets/js/game.js');
  assert.match(js, /cfg\.gravity \* frameStep/);
  assert.match(js, /dino\.vy \* frameStep/);
  assert.match(js, /jumpFrames \+ 8/);
  assert.match(js, /state\.gameOver \|\| state\.paused/);
});

test('Tatami szünet alatt nem halad a játékóra', () => {
  const js = file('assets/js/tatami.js');
  assert.match(js, /state\.running && !state\.paused && !state\.gameOver\) gameClock \+=/);
  assert.match(js, /strike\(gameClock\)/);
  assert.match(js, /document\.addEventListener\('visibilitychange'/);
});

test('A kis képernyős súgó nem lóg le a játékmezőről', () => {
  const css = file('assets/css/style.css');
  assert.match(css, /\.card\{[^}]*max-height:100%/);
  assert.match(css, /\.card\{[^}]*overflow-y:auto/);
});

test('Deploy nem publikál teszteket és környezeti titkokat', () => {
  const deploy = file('.cpanel.yml');
  assert.match(deploy, /--exclude='tests\/'/);
  assert.match(deploy, /--exclude='\.env\*'/);
  assert.match(deploy, /\/home\/zenitpr1\/public_html\/webapps\/fitdino\//);
});
