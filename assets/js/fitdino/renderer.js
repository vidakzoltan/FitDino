import { clamp, roundRect } from './utils.js';

export function drawScene(ctx, state, now) {
  const { W, H, cfg, score, running, paused, gameOver, overlayVisible, dino, obstacles, currentLevel, levelToastUntil, scoreToasts } = state;

  ctx.clearRect(0, 0, W, H);

  drawSky(ctx, W, H, score);
  drawGround(ctx, W, H, cfg, score);
  drawObstacles(ctx, obstacles);
  drawDino(ctx, dino, cfg, now, running, paused);
  drawLevelToast(ctx, W, H, currentLevel, levelToastUntil, now, running, gameOver);
  drawScoreToasts(ctx, scoreToasts, now);
  drawHints(ctx, W, H, running, gameOver, overlayVisible);
  drawPauseOverlay(ctx, W, H, running, paused);
  drawDamageFlash(ctx, W, H, dino, now, running, paused);
}

function drawSky(ctx, W, H, score) {
  ctx.save();
  ctx.globalAlpha = 0.86;
  for (let i = 0; i < 44; i += 1) {
    const x = (i * 53 + (score * 2.2)) % (W + 80) - 40;
    const y = 18 + (i * 29) % Math.max(120, H * 0.45);
    const r = 1 + (i % 3) * 0.6;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fill();
  }

  ctx.globalAlpha = 0.20;
  for (let i = 0; i < 6; i += 1) {
    const x = (i * (W * 0.33) - (score * 3.4)) % (W + 300) - 120;
    const y = 50 + (i * 30) % Math.max(90, H * 0.30);
    cloud(ctx, x, y, 70, 22);
  }
  ctx.restore();
}

function cloud(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  roundRect(ctx, x, y, w, h, 18);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + w * 0.25, y + h * 0.20, h * 0.75, 0, Math.PI * 2);
  ctx.arc(x + w * 0.45, y, h * 0.85, 0, Math.PI * 2);
  ctx.arc(x + w * 0.65, y + h * 0.25, h * 0.70, 0, Math.PI * 2);
  ctx.fill();
}

function drawGround(ctx, W, H, cfg, score) {
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(0, cfg.groundY, W, H - cfg.groundY);

  ctx.fillStyle = 'rgba(94,234,212,0.22)';
  ctx.fillRect(0, cfg.groundY, W, 2);

  ctx.globalAlpha = 0.35;
  const step = Math.max(18, W / 28);
  for (let i = 0; i < 80; i += 1) {
    const x = (i * step - (score * 4.0)) % (W + 140);
    const y = cfg.groundY + 16 + (i * 7) % 32;
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(x, y, 10, 2);
  }
  ctx.restore();
}

function drawDino(ctx, dino, cfg, now, running, paused) {
  const invuln = now < dino.invulnUntil;
  const blink = invuln && (Math.floor(now / 120) % 2 === 0);
  const x = dino.x;
  const y = dino.y;
  const w = dino.w;
  const h = dino.h;
  const runningStep = running && !paused && dino.onGround ? (Math.sin(now / 85) > 0 ? 1 : -1) : 0;

  ctx.save();
  if (blink) ctx.globalAlpha = 0.35;

  ctx.fillStyle = 'rgba(0,0,0,0.20)';
  ctx.beginPath();
  ctx.ellipse(x + w * 0.42, cfg.groundY + 4, w * 0.36, h * 0.10, 0, 0, Math.PI * 2);
  ctx.fill();

  const bodyGrad = ctx.createLinearGradient(x, y, x + w, y + h);
  bodyGrad.addColorStop(0, 'rgba(95,235,214,0.96)');
  bodyGrad.addColorStop(1, 'rgba(22,152,125,0.96)');

  const bellyGrad = ctx.createLinearGradient(x, y, x, y + h);
  bellyGrad.addColorStop(0, 'rgba(191,255,246,0.92)');
  bellyGrad.addColorStop(1, 'rgba(132,232,214,0.88)');

  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.14, y + h * 0.56);
  ctx.lineTo(x - w * 0.18, y + h * 0.50);
  ctx.lineTo(x - w * 0.06, y + h * 0.40);
  ctx.lineTo(x + w * 0.12, y + h * 0.44);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(x + w * 0.40, y + h * 0.58, w * 0.34, h * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(x + w * 0.69, y + h * 0.35, w * 0.18, h * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = bellyGrad;
  ctx.beginPath();
  ctx.ellipse(x + w * 0.46, y + h * 0.66, w * 0.18, h * 0.12, 0.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x + w * 0.58, y + h * 0.39);
  ctx.quadraticCurveTo(x + w * 0.73, y + h * 0.39, x + w * 0.83, y + h * 0.46);
  ctx.quadraticCurveTo(x + w * 0.71, y + h * 0.48, x + w * 0.57, y + h * 0.46);
  ctx.closePath();
  ctx.fillStyle = 'rgba(190,255,240,0.92)';
  ctx.fill();

  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = Math.max(1.2, w * 0.03);
  ctx.beginPath();
  ctx.moveTo(x + w * 0.56, y + h * 0.34);
  ctx.quadraticCurveTo(x + w * 0.47, y + h * 0.17, x + w * 0.28, y + h * 0.23);
  ctx.stroke();

  ctx.fillStyle = 'rgba(0,0,0,0.14)';
  for (let i = 0; i < 4; i += 1) {
    const sx = x + w * (0.15 + i * 0.10);
    const sy = y + h * (0.28 - (i % 2) * 0.04);
    ctx.beginPath();
    ctx.moveTo(sx, sy + 4);
    ctx.lineTo(sx + w * 0.05, sy - h * 0.08);
    ctx.lineTo(sx + w * 0.10, sy + 4);
    ctx.closePath();
    ctx.fill();
  }

  const armSwing = dino.onGround ? runningStep * h * 0.04 : -h * 0.02;
  ctx.strokeStyle = 'rgba(20,90,80,0.95)';
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(2, w * 0.05);

  ctx.beginPath();
  ctx.moveTo(x + w * 0.57, y + h * 0.60);
  ctx.lineTo(x + w * 0.65, y + h * (0.66 + armSwing / h));
  ctx.lineTo(x + w * 0.71, y + h * (0.62 + armSwing / h));
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + w * 0.49, y + h * 0.61);
  ctx.lineTo(x + w * 0.56, y + h * (0.67 - armSwing / h));
  ctx.lineTo(x + w * 0.61, y + h * (0.64 - armSwing / h));
  ctx.stroke();

  const legShift = dino.onGround ? runningStep * w * 0.055 : 0;
  const rearLegX = x + w * (0.26 - legShift / w);
  const frontLegX = x + w * (0.48 + legShift / w);
  const hipY = y + h * 0.70;
  const footY = cfg.groundY;

  function drawLeg(legX, kneeOffset, footOffset) {
    ctx.strokeStyle = 'rgba(14,83,73,0.98)';
    ctx.lineWidth = Math.max(3, w * 0.072);
    ctx.beginPath();
    ctx.moveTo(legX, hipY);
    ctx.lineTo(legX + kneeOffset, y + h * 0.88);
    ctx.lineTo(legX + footOffset, footY - 2);
    ctx.stroke();

    ctx.lineWidth = Math.max(2, w * 0.05);
    ctx.beginPath();
    ctx.moveTo(legX + footOffset - w * 0.05, footY - 2);
    ctx.lineTo(legX + footOffset + w * 0.05, footY - 2);
    ctx.stroke();
  }

  if (dino.onGround) {
    drawLeg(rearLegX, -w * 0.03, -w * 0.06);
    drawLeg(frontLegX, w * 0.04, w * 0.08);
  } else {
    drawLeg(x + w * 0.34, w * 0.01, w * 0.03);
    drawLeg(x + w * 0.48, -w * 0.01, -w * 0.02);
  }

  ctx.fillStyle = 'rgba(255,255,255,0.94)';
  ctx.beginPath();
  ctx.arc(x + w * 0.73, y + h * 0.30, Math.max(2.8, w * 0.045), 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(0,0,0,0.70)';
  ctx.beginPath();
  ctx.arc(x + w * 0.742, y + h * 0.31, Math.max(1.3, w * 0.022), 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(0,0,0,0.28)';
  ctx.lineWidth = Math.max(1.2, w * 0.022);
  ctx.beginPath();
  ctx.moveTo(x + w * 0.71, y + h * 0.41);
  ctx.quadraticCurveTo(x + w * 0.80, y + h * 0.45, x + w * 0.86, y + h * 0.43);
  ctx.stroke();

  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.arc(x + w * 0.83, y + h * 0.35, Math.max(1.2, w * 0.018), 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawObstacles(ctx, obstacles) {
  ctx.save();
  for (const obstacle of obstacles) {
    if (obstacle.variant === 'rock') {
      drawRock(ctx, obstacle);
      continue;
    }
    if (obstacle.variant === 'brick') {
      drawBrick(ctx, obstacle);
      continue;
    }
    if (obstacle.variant === 'redCactus') {
      drawCactus(ctx, obstacle, true);
      continue;
    }
    drawCactus(ctx, obstacle, false);
  }
  ctx.restore();
}

function drawRock(ctx, obstacle) {
  const rockGrad = ctx.createLinearGradient(obstacle.x, obstacle.y, obstacle.x, obstacle.y + obstacle.h);
  rockGrad.addColorStop(0, 'rgba(188,198,214,0.88)');
  rockGrad.addColorStop(1, 'rgba(104,116,138,0.92)');
  ctx.fillStyle = rockGrad;
  ctx.beginPath();
  ctx.moveTo(obstacle.x + obstacle.w * 0.08, obstacle.y + obstacle.h);
  ctx.lineTo(obstacle.x, obstacle.y + obstacle.h * 0.52);
  ctx.lineTo(obstacle.x + obstacle.w * 0.18, obstacle.y + obstacle.h * 0.18);
  ctx.lineTo(obstacle.x + obstacle.w * 0.55, obstacle.y);
  ctx.lineTo(obstacle.x + obstacle.w * 0.92, obstacle.y + obstacle.h * 0.26);
  ctx.lineTo(obstacle.x + obstacle.w, obstacle.y + obstacle.h * 0.70);
  ctx.lineTo(obstacle.x + obstacle.w * 0.78, obstacle.y + obstacle.h);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(obstacle.x + obstacle.w * 0.24, obstacle.y + obstacle.h * 0.28);
  ctx.lineTo(obstacle.x + obstacle.w * 0.54, obstacle.y + obstacle.h * 0.18);
  ctx.lineTo(obstacle.x + obstacle.w * 0.72, obstacle.y + obstacle.h * 0.36);
  ctx.stroke();
}

function drawCactus(ctx, obstacle, isRed) {
  const cactusGrad = ctx.createLinearGradient(obstacle.x, obstacle.y, obstacle.x, obstacle.y + obstacle.h);
  if (isRed) {
    cactusGrad.addColorStop(0, 'rgba(255,168,168,0.95)');
    cactusGrad.addColorStop(1, 'rgba(204,42,42,0.96)');
  } else {
    cactusGrad.addColorStop(0, 'rgba(114,255,203,0.90)');
    cactusGrad.addColorStop(1, 'rgba(22,161,117,0.95)');
  }

  ctx.fillStyle = cactusGrad;
  roundRect(ctx, obstacle.x + obstacle.w * 0.30, obstacle.y, obstacle.w * 0.40, obstacle.h, Math.max(8, obstacle.w * 0.20));
  ctx.fill();

  roundRect(ctx, obstacle.x, obstacle.y + obstacle.h * 0.34, obstacle.w * 0.24, obstacle.h * 0.28, Math.max(6, obstacle.w * 0.10));
  ctx.fill();
  roundRect(ctx, obstacle.x + obstacle.w * 0.76, obstacle.y + obstacle.h * 0.18, obstacle.w * 0.22, obstacle.h * 0.28, Math.max(6, obstacle.w * 0.10));
  ctx.fill();

  ctx.fillStyle = isRed ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.16)';
  for (let i = 0; i < 3; i += 1) {
    const xx = obstacle.x + obstacle.w * (0.38 + i * 0.09);
    ctx.fillRect(xx, obstacle.y + 6, 2, obstacle.h - 12);
  }

  if (isRed) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,241,212,0.95)';
    ctx.font = `800 ${Math.max(11, obstacle.w * 0.42)}px ui-sans-serif, system-ui, Arial`;
    ctx.fillText('+', obstacle.x + obstacle.w * 0.37, obstacle.y + obstacle.h * 0.28);
    ctx.restore();
  }
}

function drawBrick(ctx, obstacle) {
  const isHit = obstacle.hit;
  const fill = isHit ? 'rgba(203,150,96,0.75)' : 'rgba(210,126,52,0.96)';
  const fill2 = isHit ? 'rgba(146,97,48,0.78)' : 'rgba(148,78,22,0.94)';

  const brickY = obstacle.y + (obstacle.bumpOffset || 0);

  ctx.fillStyle = fill;
  roundRect(ctx, obstacle.x, brickY, obstacle.w, obstacle.h, Math.max(4, obstacle.w * 0.12));
  ctx.fill();

  ctx.fillStyle = fill2;
  ctx.fillRect(obstacle.x + obstacle.w * 0.48, brickY + 2, 2, obstacle.h - 4);
  ctx.fillRect(obstacle.x + 2, brickY + obstacle.h * 0.46, obstacle.w - 4, 2);
  ctx.fillRect(obstacle.x + obstacle.w * 0.24, brickY + 2, 2, obstacle.h * 0.40);
  ctx.fillRect(obstacle.x + obstacle.w * 0.74, brickY + obstacle.h * 0.56, 2, obstacle.h * 0.36);

  ctx.strokeStyle = 'rgba(255,245,230,0.22)';
  ctx.lineWidth = 1.2;
  roundRect(ctx, obstacle.x + 1, brickY + 1, obstacle.w - 2, obstacle.h - 2, Math.max(3, obstacle.w * 0.10));
  ctx.stroke();
}

function drawLevelToast(ctx, W, H, currentLevel, levelToastUntil, now, running, gameOver) {
  if (now > levelToastUntil || !running || gameOver) return;
  const alpha = clamp((levelToastUntil - now) / 1500, 0, 1);

  ctx.save();
  ctx.globalAlpha = 0.22 + alpha * 0.55;
  ctx.fillStyle = `rgba(${currentLevel.color},0.25)`;
  roundRect(ctx, W * 0.34, H * 0.10, W * 0.32, H * 0.11, 16);
  ctx.fill();

  ctx.globalAlpha = 0.92;
  ctx.fillStyle = 'rgba(255,255,255,0.96)';
  ctx.font = `800 ${Math.max(14, H * 0.055)}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
  ctx.fillText(`Új szint: ${currentLevel.name}`, W * 0.375, H * 0.17);
  ctx.restore();
}

function drawScoreToasts(ctx, toasts, now) {
  if (!toasts || !toasts.length) return;
  ctx.save();
  for (const toast of toasts) {
    const remain = toast.until - now;
    if (remain <= 0) continue;
    const alpha = clamp(remain / 900, 0, 1);
    const lift = (1 - alpha) * 24;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = toast.color || 'rgba(255,248,190,0.96)';
    ctx.font = `800 ${Math.max(14, toast.size || 20)}px ui-sans-serif, system-ui, Arial`;
    ctx.fillText(toast.text, toast.x, toast.y - lift);
  }
  ctx.restore();
}

function drawHints(ctx, W, H, running, gameOver, overlayVisible) {
  if (running || gameOver || !overlayVisible) return;
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.38)';
  ctx.font = `700 ${Math.max(14, H * 0.05)}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
  ctx.fillText('↑ / Space = ugrás • Tap = ugrás', 18, 28);
  ctx.restore();
}

function drawPauseOverlay(ctx, W, H, running, paused) {
  if (!running || !paused) return;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.40)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = `800 ${Math.max(18, H * 0.08)}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
  ctx.fillText('SZÜNET', W * 0.42, H * 0.46);
  ctx.font = `600 ${Math.max(12, H * 0.045)}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
  ctx.fillText('P = folytatás', W * 0.40, H * 0.53);
  ctx.restore();
}

function drawDamageFlash(ctx, W, H, dino, now, running, paused) {
  if (!running || paused || now >= dino.invulnUntil) return;
  ctx.save();
  ctx.fillStyle = 'rgba(255,92,122,0.12)';
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}
