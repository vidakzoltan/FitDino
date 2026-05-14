import { LEVELS, MAX_LIVES } from './constants.js';

export function rand(min, max) {
  return Math.random() * (max - min) + min;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

export function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function livesToHearts(lives) {
  if (lives <= 0) return '💀';
  return '❤️'.repeat(lives) + '🖤'.repeat(Math.max(0, MAX_LIVES - lives));
}

export function getLevelIndexByScore(score) {
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i += 1) {
    if (score >= LEVELS[i].threshold) idx = i;
  }
  return idx;
}

export function makeToast(text, now, ttl = 1050) {
  return { text, until: now + ttl };
}
