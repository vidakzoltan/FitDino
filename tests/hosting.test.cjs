const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const script = path.join(root, 'scripts/configure-directory-index.sh');

function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fitdino-hosting-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function configure(dir) {
  return spawnSync('/bin/sh', [script, dir], { encoding: 'utf8' });
}

test('Deploy sets the HTML entry point and preserves existing server rules', (t) => {
  const dir = fixture(t);
  fs.writeFileSync(path.join(dir, 'index.html'), '<h1>FitDino</h1>');
  const target = path.join(dir, '.htaccess');
  const existing = 'Options -Indexes\nDirectoryIndex index.php\n# custom hosting rule';
  fs.writeFileSync(target, existing);
  assert.equal(configure(dir).status, 0);
  const once = fs.readFileSync(target, 'utf8');
  assert.ok(once.startsWith(existing + '\n'));
  assert.ok(once.endsWith('DirectoryIndex disabled\nDirectoryIndex index.html\n'));
  assert.equal(configure(dir).status, 0);
  assert.equal(fs.readFileSync(target, 'utf8'), once, 'repeat deploy must not duplicate settings');
});

test('First deploy creates local index configuration without PHP', (t) => {
  const dir = fixture(t);
  fs.writeFileSync(path.join(dir, 'index.html'), '<h1>FitDino</h1>');
  assert.equal(configure(dir).status, 0);
  assert.match(fs.readFileSync(path.join(dir, '.htaccess'), 'utf8'), /DirectoryIndex index\.html/);
});

test('Invalid deploy destination cannot modify configuration', (t) => {
  const dir = fixture(t);
  const target = path.join(dir, '.htaccess');
  fs.writeFileSync(target, 'original');
  assert.notEqual(configure(dir).status, 0);
  assert.equal(fs.readFileSync(target, 'utf8'), 'original');
});

test('Symlink configuration cannot modify a file outside the deploy target', (t) => {
  const dir = fixture(t);
  fs.writeFileSync(path.join(dir, 'index.html'), '<h1>FitDino</h1>');
  const original = path.join(dir, 'server-config');
  fs.writeFileSync(original, 'original');
  fs.symlinkSync(original, path.join(dir, '.htaccess'));
  assert.notEqual(configure(dir).status, 0);
  assert.equal(fs.readFileSync(original, 'utf8'), 'original');
});

test('Deployment selects the index after sync and keeps helper scripts private', () => {
  const deploy = fs.readFileSync(path.join(root, '.cpanel.yml'), 'utf8');
  assert.match(deploy, /--exclude='scripts\/'/);
  const configureStep = deploy.indexOf('- /bin/sh ./scripts/configure-directory-index.sh "$DEPLOYPATH"');
  assert.ok(configureStep > deploy.indexOf('"$DEPLOYPATH/"'));
  assert.ok(configureStep < deploy.indexOf('- /usr/bin/find'));
});
