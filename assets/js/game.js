import { FITDINO_VERSION, LS_BEST, LEVELS, MAX_LIVES } from './fitdino/constants.js';
import { clamp, getLevelIndexByScore, livesToHearts, makeToast, rand, rectsOverlap } from './fitdino/utils.js';
import { drawScene } from './fitdino/renderer.js';

console.info('[FitDino] game.js betöltve, verzió:', FITDINO_VERSION);

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const canvasWrap = document.getElementById('canvasWrap');

const elScore = document.getElementById('score');
const elBest = document.getElementById('best');
const elLives = document.getElementById('lives');
const elLevel = document.getElementById('level');

const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayText = document.getElementById('overlayText');

const btnStart = document.getElementById('btnStart');
const btnHow = document.getElementById('btnHow');
const help = document.getElementById('help');
const btnFullscreen = document.getElementById('btnFullscreen');

const cfg = {
  groundY: 0,
  gravity: 0,
  jumpVy: 0,
  dinoX: 0,
  dinoW: 0,
  dinoH: 0,
  baseSpeed: 0,
  baseMinGap: 0,
  baseMaxGap: 0,
  mobileLike: false,
  invulnMs: 1100,
  hitFreezeMs: 220,
  obsWMin: 0,
  obsWMax: 0,
  obsHMin: 0,
  obsHMax: 0,
  brickW: 0,
  brickH: 0,
  brickMinY: 0,
  brickMaxY: 0,
};

const dino = {
  x: 80,
  y: 200,
  w: 56,
  h: 50,
  vy: 0,
  onGround: true,
  invulnUntil: 0,
  prevY: 200,
};

const state = {
  W: 900,
  H: 320,
  running: false,
  paused: false,
  gameOver: false,
  lives: MAX_LIVES,
  score: 0,
  bestScore: loadBest(),
  freezeUntil: 0,
  lastT: 0,
  obstacles: [],
  currentLevelIndex: 0,
  levelToastUntil: 0,
  scoreToasts: [],
};

function hideOverlay() {
  if (!overlay) return;
  overlay.classList.add('hidden');
  overlay.setAttribute('aria-hidden', 'true');
  overlay.hidden = true;
  overlay.style.display = 'none';
  overlay.style.pointerEvents = 'none';
  help?.classList.remove('show');
}

function showOverlay() {
  if (!overlay) return;
  overlay.hidden = false;
  overlay.style.display = 'flex';
  overlay.style.pointerEvents = 'auto';
  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
}

function loadBest() {
  const value = Number(localStorage.getItem(LS_BEST) || '0');
  return Number.isFinite(value) ? value : 0;
}

function saveBest(value) {
  localStorage.setItem(LS_BEST, String(Math.floor(value)));
}

function isMobileLikeLayout() {
  const coarsePointer = window.matchMedia?.('(pointer: coarse)')?.matches ?? false;
  const narrowViewport = window.innerWidth <= 820;
  const touchCapable = (navigator.maxTouchPoints || 0) > 0;
  return coarsePointer || (touchCapable && narrowViewport);
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  state.W = Math.max(320, Math.round(rect.width));
  state.H = Math.max(260, Math.round(rect.height));

  canvas.width = Math.round(state.W * dpr);
  canvas.height = Math.round(state.H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  recalcMetrics();
}

function recalcMetrics() {
  const { W, H } = state;
  cfg.mobileLike = isMobileLikeLayout();

  const gravityMul = cfg.mobileLike ? 0.90 : 1;
  const jumpMul = cfg.mobileLike ? 1.16 : 1;
  const speedMul = cfg.mobileLike ? 0.82 : 1;
  const gapMul = cfg.mobileLike ? 1.14 : 1;
  const obstacleMul = cfg.mobileLike ? 0.90 : 1;

  cfg.groundY = Math.round(H * 0.82);
  cfg.gravity = H * 0.00170 * gravityMul;
  cfg.jumpVy = -H * 0.0405 * jumpMul;

  cfg.dinoX = Math.round(W * (cfg.mobileLike ? 0.07 : 0.09));
  cfg.dinoW = Math.round(Math.max(50, H * 0.18));
  cfg.dinoH = Math.round(Math.max(44, H * 0.17));

  cfg.baseSpeed = (W / 184) * speedMul;
  cfg.baseMinGap = W * 0.29 * gapMul;
  cfg.baseMaxGap = W * 0.64 * gapMul;

  cfg.obsWMin = Math.max(18, Math.round(H * 0.060 * obstacleMul));
  cfg.obsWMax = Math.max(cfg.obsWMin + 8, Math.round(H * 0.13 * obstacleMul));
  cfg.obsHMin = Math.max(24, Math.round(H * 0.11 * obstacleMul));
  cfg.obsHMax = Math.max(cfg.obsHMin + 12, Math.round(H * 0.24 * obstacleMul));

  cfg.brickW = Math.max(26, Math.round(H * 0.090));
  cfg.brickH = Math.max(22, Math.round(H * 0.078));
  cfg.brickMinY = Math.round(cfg.groundY - cfg.dinoH - (H * 0.30));
  cfg.brickMaxY = Math.round(cfg.groundY - cfg.dinoH - (H * 0.16));

  dino.x = cfg.dinoX;
  dino.w = cfg.dinoW;
  dino.h = cfg.dinoH;
  dino.y = clamp(dino.y, 0, cfg.groundY - dino.h);
}

function getCurrentLevel() {
  return LEVELS[state.currentLevelIndex];
}

function updateScoreUI() {
  elScore.textContent = String(Math.floor(state.score));
}

function updateBestUI() {
  elBest.textContent = String(Math.floor(state.bestScore));
}

function updateLivesUI() {
  elLives.textContent = livesToHearts(state.lives);
}

function updateLevelUI() {
  elLevel.textContent = `${state.currentLevelIndex + 1}. ${LEVELS[state.currentLevelIndex].name}`;
}

function addScore(points, worldX, worldY, color = 'rgba(255,248,190,0.96)') {
  if (!points) return;
  state.score += points;
  updateScoreUI();

  const toastX = clamp(worldX, 16, state.W - 90);
  const toastY = clamp(worldY, 24, state.H - 26);
  state.scoreToasts.push({
    text: `+${points}`,
    x: toastX,
    y: toastY,
    until: performance.now() + 900,
    color,
    size: Math.max(15, state.H * 0.05),
  });
}

function clearScoreToasts(now) {
  state.scoreToasts = state.scoreToasts.filter((toast) => toast.until > now);
}

function currentSpeed() {
  return cfg.baseSpeed * getCurrentLevel().speedMul;
}

function currentMinGap() {
  return cfg.baseMinGap * getCurrentLevel().gapMul;
}

function currentMaxGap() {
  return cfg.baseMaxGap * getCurrentLevel().gapMul;
}

function resetRoundAfterHit() {
  state.obstacles = [];
  dino.y = cfg.groundY - dino.h;
  dino.prevY = dino.y;
  dino.vy = 0;
  dino.onGround = true;
}

function resetGame() {
  state.running = false;
  state.paused = false;
  state.gameOver = false;
  state.lastT = 0;
  state.freezeUntil = 0;
  state.lives = MAX_LIVES;
  state.score = 0;
  state.obstacles = [];
  state.currentLevelIndex = 0;
  state.levelToastUntil = 0;
  state.scoreToasts = [];

  dino.x = cfg.dinoX;
  dino.y = cfg.groundY - dino.h;
  dino.prevY = dino.y;
  dino.vy = 0;
  dino.onGround = true;
  dino.invulnUntil = 0;

  updateScoreUI();
  updateLivesUI();
  updateBestUI();
  updateLevelUI();

  overlayTitle.textContent = 'FitDino';
  overlayText.innerHTML = 'Nyomd a <b>Fel</b> nyilat (↑) a kezdéshez és az ugráshoz.<br/>Mobilon: <b>tapints</b> egyet a pályára.<br/>Pont most főleg az átugrott akadályokból, a piros kaktuszokból és a fejjel megütött téglákból jön.';
  btnStart.textContent = 'Kezdés';
  showOverlay();
}

function startGame(now) {
  if (state.gameOver) return;
  if (!state.running) {
    state.running = true;
  }
  state.paused = false;
  hideOverlay();
}

function endGame() {
  state.running = false;
  state.paused = false;
  state.gameOver = true;

  if (state.score > state.bestScore) {
    state.bestScore = state.score;
    saveBest(state.bestScore);
    updateBestUI();
  }

  overlayTitle.textContent = 'Game Over';
  overlayText.innerHTML = `Vége! Pontszám: <b>${Math.floor(state.score)}</b><br/>Rekord: <b>${Math.floor(state.bestScore)}</b><br/>Elért szint: <b>${getCurrentLevel().name}</b><br/>Nyomd az <b>R</b>-t vagy kattints az <b>Újra</b>-ra.`;
  btnStart.textContent = 'Újra';
  showOverlay();
}

function jump(now) {
  if (state.gameOver) return;
  startGame(now);
  if (state.paused) return;
  if (dino.onGround) {
    dino.vy = cfg.jumpVy;
    dino.onGround = false;
  }
}

function spawnGroundObstacleAt(x) {
  const level = getCurrentLevel();
  const sizeMul = level.sizeMul;
  const w = Math.round(rand(cfg.obsWMin, cfg.obsWMax) * sizeMul);
  const h = Math.round(rand(cfg.obsHMin, cfg.obsHMax) * sizeMul);
  const y = cfg.groundY - h;

  const pick = Math.random();
  let variant = 'rock';
  if (pick < 0.18) variant = 'redCactus';
  else if (pick < 0.66) variant = 'cactus';

  state.obstacles.push({
    x,
    y,
    w,
    h,
    variant,
    passed: false,
    harmful: true,
  });
}

function spawnBrickAt(x) {
  const y = Math.round(rand(cfg.brickMinY, cfg.brickMaxY));
  state.obstacles.push({
    x,
    y,
    w: cfg.brickW,
    h: cfg.brickH,
    variant: 'brick',
    passed: true,
    harmful: false,
    hit: false,
    bumpOffset: 0,
  });
}

function spawnEntityAt(x) {
  const shouldBrick = Math.random() < 0.24;
  if (shouldBrick) {
    spawnBrickAt(x);
    return;
  }
  spawnGroundObstacleAt(x);
}

function ensureObstacles() {
  let farthestX = -Infinity;
  for (const obstacle of state.obstacles) farthestX = Math.max(farthestX, obstacle.x);

  const bufferX = state.W + (state.W * 0.82);
  while (!Number.isFinite(farthestX) || farthestX < bufferX) {
    const baseX = Number.isFinite(farthestX) ? farthestX : (state.W + 130);
    const gap = rand(currentMinGap(), currentMaxGap());
    const x = Math.max(state.W + 110, baseX + gap);
    spawnEntityAt(x);
    farthestX = x;
  }
}

function updateLevelState(now) {
  const nextLevelIndex = getLevelIndexByScore(state.score);
  if (nextLevelIndex !== state.currentLevelIndex) {
    state.currentLevelIndex = nextLevelIndex;
    state.levelToastUntil = now + 1500;
    updateLevelUI();
  }
}

function getDinoHitBox() {
  return {
    x: dino.x + dino.w * 0.16,
    y: dino.y + dino.h * 0.18,
    w: dino.w * 0.58,
    h: dino.h * 0.72,
  };
}

function getHeadHitBox() {
  return {
    x: dino.x + dino.w * 0.50,
    y: dino.y + dino.h * 0.02,
    w: dino.w * 0.24,
    h: Math.max(8, dino.h * 0.16),
  };
}

function handleBrickHit(obstacle) {
  if (obstacle.hit) return;
  const headBox = getHeadHitBox();
  const previousTop = dino.prevY;
  const currentTop = dino.y;
  const crossedFromBelow = previousTop >= obstacle.y + obstacle.h && currentTop <= obstacle.y + obstacle.h;
  const rising = dino.vy < 0;

  if (rising && crossedFromBelow && rectsOverlap(headBox, obstacle)) {
    obstacle.hit = true;
    obstacle.bumpOffset = -8;
    dino.y = obstacle.y + obstacle.h + 1;
    dino.vy = Math.abs(dino.vy) * 0.25;

    const points = getCurrentLevel().brickPoints;
    addScore(points, obstacle.x, obstacle.y - 10, 'rgba(255,224,132,0.98)');
  }
}

function handleObstaclePass(obstacle) {
  if (obstacle.passed || obstacle.variant === 'brick') return;
  if (obstacle.x + obstacle.w >= dino.x) return;

  obstacle.passed = true;
  const level = getCurrentLevel();
  const points = obstacle.variant === 'redCactus' ? level.redCactusPoints : level.passPoints;
  const color = obstacle.variant === 'redCactus' ? 'rgba(255,184,184,0.98)' : 'rgba(193,255,206,0.98)';
  addScore(points, obstacle.x, obstacle.y - 6, color);
}

function handleHit(now) {
  state.lives -= 1;
  updateLivesUI();

  state.freezeUntil = now + cfg.hitFreezeMs;
  dino.invulnUntil = now + cfg.invulnMs;

  if (state.lives <= 0) {
    endGame();
    return;
  }

  resetRoundAfterHit();
}

function update(now, dt) {
  clearScoreToasts(now);
  if (!state.running || state.paused) return;
  if (now < state.freezeUntil) return;

  dino.prevY = dino.y;
  dino.vy += cfg.gravity;
  dino.y += dino.vy;

  if (dino.y >= cfg.groundY - dino.h) {
    dino.y = cfg.groundY - dino.h;
    dino.vy = 0;
    dino.onGround = true;
  }

  ensureObstacles();

  const speed = currentSpeed() * (dt / 16.6667);
  for (const obstacle of state.obstacles) {
    obstacle.x -= speed;

    if (obstacle.variant === 'brick') {
      obstacle.bumpOffset *= 0.72;
      if (Math.abs(obstacle.bumpOffset) < 0.35) obstacle.bumpOffset = 0;
      handleBrickHit(obstacle);
      continue;
    }

    handleObstaclePass(obstacle);
  }

  if (now > dino.invulnUntil) {
    for (const obstacle of state.obstacles) {
      if (!obstacle.harmful) continue;
      if (rectsOverlap(getDinoHitBox(), obstacle)) {
        handleHit(now);
        break;
      }
    }
  }

  state.obstacles = state.obstacles.filter((obstacle) => obstacle.x + obstacle.w > -140);
  updateLevelState(now);
}

function onKeyDown(event) {
  const key = event.key;
  const now = performance.now();

  if (key === 'ArrowUp' || key === ' ' || key === 'Spacebar') {
    event.preventDefault();
    jump(now);
  }

  if (key === 'p' || key === 'P') {
    if (state.running && !state.gameOver) state.paused = !state.paused;
  }

  if (key === 'r' || key === 'R') {
    if (state.gameOver) {
      resetGame();
      startGame(now);
    }
  }
}

function onPointerDown() {
  jump(performance.now());
}

document.addEventListener('keydown', onKeyDown, { passive: false });
canvas.addEventListener('pointerdown', onPointerDown);

function handleStartButton(event) {
  event.preventDefault();
  event.stopPropagation();

  const now = performance.now();

  if (state.gameOver) {
    resetGame();
    startGame(now);
    return;
  }

  startGame(now);
}

btnStart?.addEventListener('click', handleStartButton);
btnStart?.addEventListener('pointerup', handleStartButton);

btnHow?.addEventListener('click', () => {
  help?.classList.toggle('show');
});

btnFullscreen?.addEventListener('click', async () => {
  try {
    const element = canvasWrap || document.documentElement;
    if (!document.fullscreenElement) {
      await element.requestFullscreen?.();
    } else {
      await document.exitFullscreen?.();
    }
  } catch (error) {
    console.warn('Fullscreen nem elérhető:', error);
  }
});

function loop(t) {
  if (!state.lastT) state.lastT = t;
  const dt = Math.min(40, t - state.lastT);
  state.lastT = t;

  update(t, dt);
  drawScene(ctx, {
    W: state.W,
    H: state.H,
    cfg,
    score: state.score,
    running: state.running,
    paused: state.paused,
    gameOver: state.gameOver,
    overlayVisible: !overlay?.classList.contains('hidden'),
    dino,
    obstacles: state.obstacles,
    currentLevel: getCurrentLevel(),
    levelToastUntil: state.levelToastUntil,
    scoreToasts: state.scoreToasts,
  }, t);

  if (state.running && !state.gameOver && overlay && (!overlay.hidden || !overlay.classList.contains('hidden'))) {
    hideOverlay();
  }

  requestAnimationFrame(loop);
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas, { passive: true });

state.bestScore = loadBest();
updateBestUI();
resetGame();
requestAnimationFrame(loop);
