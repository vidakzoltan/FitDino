/* FitDino – Tatami harc külön mini-játék */
(function () {
  'use strict';

  const canvas = document.getElementById('tatamiGame');
  const ctx = canvas ? canvas.getContext('2d') : null;
  const wrap = document.getElementById('tatamiWrap');
  const overlay = document.getElementById('tatamiOverlay');
  const overlayTitle = document.getElementById('tatamiOverlayTitle');
  const overlayText = document.getElementById('tatamiOverlayText');
  const help = document.getElementById('tatamiHelp');
  const btnStart = document.getElementById('btnTatamiStart');
  const btnHow = document.getElementById('btnTatamiHow');
  const btnFullscreen = document.getElementById('btnTatamiFullscreen');
  const elDinoHp = document.getElementById('tatamiDinoHp');
  const elTurtleHp = document.getElementById('tatamiTurtleHp');
  const elScore = document.getElementById('tatamiScore');

  if (!canvas || !ctx) return;

  const keys = new Set();
  const mobileHold = { left: false, right: false, block: false };
  let W = 900;
  let H = 470;
  let groundY = 350;
  let lastT = 0;

  const dino = {
    x: 190,
    y: 0,
    w: 82,
    h: 78,
    hp: 100,
    facing: 1,
    strikingUntil: 0,
    blockUntil: 0,
    hurtUntil: 0,
    cooldownUntil: 0,
  };

  const turtle = {
    x: 690,
    y: 0,
    w: 94,
    h: 70,
    hp: 100,
    facing: -1,
    state: 'idle',
    stateUntil: 0,
    actionAt: 0,
    hitDone: false,
    hurtUntil: 0,
  };

  const state = {
    running: false,
    paused: false,
    gameOver: false,
    score: 0,
    message: 'FitDino és Kung-Fu Teknős a tatamin.',
    messageUntil: 0,
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function setOverlayVisible(visible) {
    if (!overlay) return;
    overlay.hidden = !visible;
    overlay.classList.toggle('hidden', !visible);
    overlay.setAttribute('aria-hidden', visible ? 'false' : 'true');
    overlay.style.display = visible ? 'flex' : 'none';
    overlay.style.pointerEvents = visible ? 'auto' : 'none';
  }

  function updateHud() {
    elDinoHp.textContent = `${Math.max(0, Math.round(dino.hp))}%`;
    elTurtleHp.textContent = `${Math.max(0, Math.round(turtle.hp))}%`;
    elScore.textContent = String(Math.floor(state.score));
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    W = Math.max(320, Math.round(rect.width));
    H = Math.max(280, Math.round(rect.height));
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    groundY = Math.round(H * 0.78);
    dino.y = groundY - dino.h;
    turtle.y = groundY - turtle.h;
    dino.x = clamp(dino.x, 30, W - 160);
    turtle.x = clamp(turtle.x, 150, W - 110);
    draw(performance.now());
  }

  function resetGame() {
    dino.x = Math.max(110, W * 0.22);
    dino.y = groundY - dino.h;
    dino.hp = 100;
    dino.facing = 1;
    dino.strikingUntil = 0;
    dino.blockUntil = 0;
    dino.hurtUntil = 0;
    dino.cooldownUntil = 0;

    turtle.x = Math.min(W - 150, W * 0.75);
    turtle.y = groundY - turtle.h;
    turtle.hp = 100;
    turtle.facing = -1;
    turtle.state = 'idle';
    turtle.stateUntil = 0;
    turtle.actionAt = 0;
    turtle.hitDone = false;
    turtle.hurtUntil = 0;

    state.running = false;
    state.paused = false;
    state.gameOver = false;
    state.score = 0;
    state.message = 'FitDino és Kung-Fu Teknős a tatamin.';
    state.messageUntil = 0;
    lastT = 0;
    updateHud();
    if (overlayTitle) overlayTitle.textContent = 'Tatami harc';
    if (overlayText) {
      overlayText.innerHTML = 'FitDino oldalnézetben mérkőzik a Kung-Fu Teknőssel.<br/>Mozgás: <b>← / →</b> vagy <b>A / D</b>. Blokk: <b>↑</b> vagy <b>W</b>. Mozdulat: <b>Space</b> vagy <b>K</b>.';
    }
    if (btnStart) btnStart.textContent = 'Kezdés';
    setOverlayVisible(true);
    draw(performance.now());
  }

  function startGame() {
    if (state.gameOver) resetGame();
    state.running = true;
    state.paused = false;
    setOverlayVisible(false);
  }

  function endGame(winner) {
    state.running = false;
    state.paused = false;
    state.gameOver = true;
    if (winner === 'dino') {
      state.score += 120;
      state.message = 'FitDino győzött a tatamin.';
      if (overlayTitle) overlayTitle.textContent = 'FitDino győzött';
      if (overlayText) overlayText.innerHTML = `Győzelem! Pontszám: <b>${Math.floor(state.score)}</b><br/>Új mérkőzéshez nyomd meg az <b>R</b> billentyűt vagy az Újra gombot.`;
    } else {
      state.message = 'Kung-Fu Teknős most jobb taktikát választott.';
      if (overlayTitle) overlayTitle.textContent = 'Mérkőzés vége';
      if (overlayText) overlayText.innerHTML = `Most a Kung-Fu Teknős nyert.<br/>Pontszám: <b>${Math.floor(state.score)}</b><br/>Új mérkőzéshez nyomd meg az <b>R</b> billentyűt vagy az Újra gombot.`;
    }
    if (btnStart) btnStart.textContent = 'Újra';
    updateHud();
    setOverlayVisible(true);
  }

  function dinoBlocking(now) {
    return now < dino.blockUntil;
  }

  function distance() {
    return Math.abs((dino.x + dino.w * 0.72) - (turtle.x + turtle.w * 0.32));
  }

  function strike(now) {
    if (!state.running || state.paused || state.gameOver) return;
    if (now < dino.cooldownUntil) return;
    dino.strikingUntil = now + 220;
    dino.cooldownUntil = now + 460;
    dino.facing = turtle.x > dino.x ? 1 : -1;

    if (distance() < 118) {
      if (turtle.state === 'block') {
        state.score += 4;
        state.message = 'A teknős páncélblokkal fogta a mozdulatot.';
      } else {
        turtle.hp = clamp(turtle.hp - 11, 0, 100);
        turtle.hurtUntil = now + 240;
        state.score += 18;
        state.message = 'Pontos FitDino-mozdulat.';
      }
    } else {
      state.score = Math.max(0, state.score - 2);
      state.message = 'A mozdulat rövid volt, közelebb kell lépni.';
    }
    state.messageUntil = now + 900;
    updateHud();
    if (turtle.hp <= 0) endGame('dino');
  }

  function chooseTurtleAction(now) {
    if (now < turtle.stateUntil) return;
    const gap = distance();
    const roll = Math.random();

    if (gap > 160) {
      turtle.state = 'approach';
      turtle.stateUntil = now + 650;
      return;
    }

    if (roll < 0.25) {
      turtle.state = 'block';
      turtle.stateUntil = now + 620;
      state.message = 'Kung-Fu Teknős kivár és blokkol.';
      state.messageUntil = now + 700;
      return;
    }

    if (roll < 0.58) {
      turtle.state = 'strike';
      turtle.stateUntil = now + 640;
      turtle.actionAt = now + 260;
      turtle.hitDone = false;
      state.message = 'A teknős oldalcsapást készít elő.';
      state.messageUntil = now + 700;
      return;
    }

    if (roll < 0.84) {
      turtle.state = 'shellDash';
      turtle.stateUntil = now + 760;
      turtle.actionAt = now + 310;
      turtle.hitDone = false;
      state.message = 'Páncélos roham indul.';
      state.messageUntil = now + 760;
      return;
    }

    turtle.state = 'feint';
    turtle.stateUntil = now + 520;
    state.score += 2;
    state.message = 'A teknős cselez, figyelni kell a ritmust.';
    state.messageUntil = now + 700;
  }

  function applyTurtleDamage(now, baseDamage) {
    if (turtle.hitDone || distance() > 126) return;
    const damage = dinoBlocking(now) ? Math.round(baseDamage * 0.35) : baseDamage;
    dino.hp = clamp(dino.hp - damage, 0, 100);
    dino.hurtUntil = now + 260;
    turtle.hitDone = true;
    if (dinoBlocking(now)) {
      state.score += 10;
      state.message = 'Jó blokk, a sebzés csökkent.';
    } else {
      state.score = Math.max(0, state.score - 6);
      state.message = 'Talált a teknős mozdulata.';
    }
    state.messageUntil = now + 900;
    updateHud();
    if (dino.hp <= 0) endGame('turtle');
  }

  function update(now, dt) {
    if (!state.running || state.paused || state.gameOver) return;

    const left = keys.has('ArrowLeft') || keys.has('a') || keys.has('A') || mobileHold.left;
    const right = keys.has('ArrowRight') || keys.has('d') || keys.has('D') || mobileHold.right;
    const block = keys.has('ArrowUp') || keys.has('w') || keys.has('W') || mobileHold.block;
    const speed = Math.max(180, W * 0.25);

    if (left) {
      dino.x -= speed * dt;
      dino.facing = -1;
    }
    if (right) {
      dino.x += speed * dt;
      dino.facing = 1;
    }
    if (block) {
      dino.blockUntil = now + 120;
    }

    dino.x = clamp(dino.x, 28, W - dino.w - 28);
    chooseTurtleAction(now);

    const turtleDir = turtle.x > dino.x ? -1 : 1;
    turtle.facing = turtleDir;

    if (turtle.state === 'approach') {
      turtle.x += turtleDir * Math.max(95, W * 0.13) * dt;
    }
    if (turtle.state === 'feint') {
      turtle.x -= turtleDir * Math.max(70, W * 0.10) * dt;
    }
    if (turtle.state === 'shellDash') {
      turtle.x += turtleDir * Math.max(230, W * 0.30) * dt;
      if (now >= turtle.actionAt) applyTurtleDamage(now, 16);
    }
    if (turtle.state === 'strike' && now >= turtle.actionAt) {
      applyTurtleDamage(now, 10);
    }

    turtle.x = clamp(turtle.x, 38, W - turtle.w - 34);
    updateHud();
  }

  function drawTatami() {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#142a55');
    sky.addColorStop(0.60, '#0f1b33');
    sky.addColorStop(1, '#07101d');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    for (let i = 0; i < 22; i += 1) {
      ctx.fillRect((i * 83) % W, 26 + (i * 37) % Math.max(90, H * 0.35), 2, 2);
    }

    const left = W * 0.08;
    const top = groundY - H * 0.18;
    const right = W * 0.92;
    const bottom = groundY + H * 0.09;
    const tatami = ctx.createLinearGradient(0, top, 0, bottom);
    tatami.addColorStop(0, '#d8b66f');
    tatami.addColorStop(1, '#9c6a32');
    ctx.fillStyle = tatami;
    ctx.beginPath();
    ctx.moveTo(left + W * 0.08, top);
    ctx.lineTo(right - W * 0.08, top);
    ctx.lineTo(right, bottom);
    ctx.lineTo(left, bottom);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.26)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i += 1) {
      const y = top + (bottom - top) * (i / 4);
      ctx.beginPath();
      ctx.moveTo(left + 18, y);
      ctx.lineTo(right - 18, y);
      ctx.stroke();
    }
    for (let i = 0; i < 6; i += 1) {
      const x = left + (right - left) * (i / 5);
      ctx.beginPath();
      ctx.moveTo(x, top + 8);
      ctx.lineTo(x, bottom - 8);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(left, bottom, right - left, 10);
  }

  function drawDino(now) {
    const x = dino.x;
    const y = dino.y;
    const s = dino.facing;
    const hurt = now < dino.hurtUntil;
    const block = dinoBlocking(now);
    const strikeActive = now < dino.strikingUntil;

    ctx.save();
    ctx.translate(x + dino.w / 2, y + dino.h / 2);
    ctx.scale(s, 1);
    ctx.translate(-dino.w / 2, -dino.h / 2);
    if (hurt && Math.floor(now / 80) % 2 === 0) ctx.globalAlpha = 0.55;

    ctx.fillStyle = 'rgba(0,0,0,0.24)';
    ctx.beginPath();
    ctx.ellipse(dino.w * 0.43, dino.h + 8, dino.w * 0.42, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    const body = ctx.createLinearGradient(0, 0, dino.w, dino.h);
    body.addColorStop(0, 'rgba(95,235,214,0.98)');
    body.addColorStop(1, 'rgba(22,152,125,0.98)');
    ctx.fillStyle = body;

    ctx.beginPath();
    ctx.moveTo(dino.w * 0.15, dino.h * 0.58);
    ctx.lineTo(-dino.w * 0.20, dino.h * 0.48);
    ctx.lineTo(dino.w * 0.10, dino.h * 0.42);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(dino.w * 0.42, dino.h * 0.56, dino.w * 0.34, dino.h * 0.27, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(dino.w * 0.70, dino.h * 0.31, dino.w * 0.19, dino.h * 0.19, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(190,255,240,0.92)';
    ctx.beginPath();
    ctx.ellipse(dino.w * 0.49, dino.h * 0.63, dino.w * 0.18, dino.h * 0.11, 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = block ? 'rgba(214,247,255,0.96)' : 'rgba(20,90,80,0.98)';
    ctx.lineWidth = Math.max(3, dino.w * 0.055);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(dino.w * 0.57, dino.h * 0.56);
    ctx.lineTo(dino.w * (strikeActive ? 1.04 : 0.73), dino.h * (strikeActive ? 0.48 : 0.63));
    ctx.stroke();

    ctx.strokeStyle = 'rgba(14,83,73,0.98)';
    ctx.lineWidth = Math.max(4, dino.w * 0.07);
    ctx.beginPath();
    ctx.moveTo(dino.w * 0.32, dino.h * 0.72);
    ctx.lineTo(dino.w * 0.25, dino.h + 1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(dino.w * 0.50, dino.h * 0.72);
    ctx.lineTo(dino.w * 0.57, dino.h + 1);
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(dino.w * 0.74, dino.h * 0.27, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.beginPath();
    ctx.arc(dino.w * 0.755, dino.h * 0.28, 1.8, 0, Math.PI * 2);
    ctx.fill();

    if (block) {
      ctx.strokeStyle = 'rgba(214,247,255,0.80)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(dino.w * 0.76, dino.h * 0.52, 28, -1.1, 1.2);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawTurtle(now) {
    const x = turtle.x;
    const y = turtle.y;
    const s = turtle.facing;
    const hurt = now < turtle.hurtUntil;
    const blocking = turtle.state === 'block';
    const striking = turtle.state === 'strike' || turtle.state === 'shellDash';

    ctx.save();
    ctx.translate(x + turtle.w / 2, y + turtle.h / 2);
    ctx.scale(s, 1);
    ctx.translate(-turtle.w / 2, -turtle.h / 2);
    if (hurt && Math.floor(now / 80) % 2 === 0) ctx.globalAlpha = 0.55;

    ctx.fillStyle = 'rgba(0,0,0,0.24)';
    ctx.beginPath();
    ctx.ellipse(turtle.w * 0.48, turtle.h + 8, turtle.w * 0.42, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    const shell = ctx.createRadialGradient(turtle.w * 0.45, turtle.h * 0.46, 10, turtle.w * 0.44, turtle.h * 0.48, turtle.w * 0.44);
    shell.addColorStop(0, 'rgba(140,225,112,0.98)');
    shell.addColorStop(1, 'rgba(50,116,55,0.98)');
    ctx.fillStyle = shell;
    ctx.beginPath();
    ctx.ellipse(turtle.w * 0.45, turtle.h * 0.50, turtle.w * 0.36, turtle.h * 0.34, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(18,70,28,0.72)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(turtle.w * 0.20, turtle.h * 0.50);
    ctx.quadraticCurveTo(turtle.w * 0.45, turtle.h * 0.24, turtle.w * 0.72, turtle.h * 0.50);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(turtle.w * 0.45, turtle.h * 0.18);
    ctx.lineTo(turtle.w * 0.45, turtle.h * 0.82);
    ctx.stroke();

    ctx.fillStyle = 'rgba(130,221,123,0.98)';
    ctx.beginPath();
    ctx.arc(turtle.w * 0.82, turtle.h * 0.40, turtle.w * 0.17, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,92,122,0.95)';
    ctx.fillRect(turtle.w * 0.71, turtle.h * 0.31, turtle.w * 0.22, 5);

    ctx.strokeStyle = blocking ? 'rgba(214,247,255,0.94)' : 'rgba(38,94,38,0.95)';
    ctx.lineWidth = Math.max(3, turtle.w * 0.05);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(turtle.w * 0.70, turtle.h * 0.58);
    ctx.lineTo(turtle.w * (striking ? 1.02 : 0.86), turtle.h * (striking ? 0.54 : 0.66));
    ctx.stroke();

    ctx.strokeStyle = 'rgba(38,94,38,0.95)';
    ctx.beginPath();
    ctx.moveTo(turtle.w * 0.28, turtle.h * 0.76);
    ctx.lineTo(turtle.w * 0.23, turtle.h + 1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(turtle.w * 0.56, turtle.h * 0.76);
    ctx.lineTo(turtle.w * 0.64, turtle.h + 1);
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(turtle.w * 0.86, turtle.h * 0.35, 3.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(turtle.w * 0.875, turtle.h * 0.36, 1.7, 0, Math.PI * 2);
    ctx.fill();

    if (blocking) {
      ctx.strokeStyle = 'rgba(214,247,255,0.85)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(turtle.w * 0.38, turtle.h * 0.50, 34, 0.2, Math.PI * 1.82);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawBars() {
    const barW = Math.min(280, W * 0.32);
    const y = 18;
    drawBar(22, y, barW, 13, dino.hp, 'rgba(94,234,212,0.95)');
    drawBar(W - barW - 22, y, barW, 13, turtle.hp, 'rgba(134,221,123,0.95)');
  }

  function drawBar(x, y, w, h, value, color) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w * clamp(value / 100, 0, 1), h);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.strokeRect(x, y, w, h);
  }

  function draw(now) {
    drawTatami();
    drawBars();
    drawDino(now);
    drawTurtle(now);

    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.font = `${Math.max(14, H * 0.035)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    const text = now < state.messageUntil ? state.message : 'Mozgás, blokk és pontos ütem dönt.';
    ctx.fillText(text, W / 2, Math.max(60, H * 0.14));

    if (state.paused && state.running) {
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '800 24px system-ui, sans-serif';
      ctx.fillText('Szünet', W / 2, H / 2);
    }
  }

  function loop(now) {
    const dt = lastT ? Math.min(0.033, (now - lastT) / 1000) : 0;
    lastT = now;
    update(now, dt);
    draw(now);
    requestAnimationFrame(loop);
  }

  function pressControl(control, pressed) {
    if (control === 'left') mobileHold.left = pressed;
    if (control === 'right') mobileHold.right = pressed;
    if (control === 'block') mobileHold.block = pressed;
    if (control === 'strike' && pressed) strike(performance.now());
  }

  document.addEventListener('keydown', (event) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', ' ', 'Spacebar'].includes(event.key)) event.preventDefault();
    if (event.key === ' ' || event.key === 'Spacebar' || event.key === 'k' || event.key === 'K') {
      strike(performance.now());
      return;
    }
    if (event.key === 'r' || event.key === 'R') {
      resetGame();
      startGame();
      return;
    }
    if (event.key === 'p' || event.key === 'P') {
      if (state.running && !state.gameOver) state.paused = !state.paused;
      return;
    }
    keys.add(event.key);
  });

  document.addEventListener('keyup', (event) => {
    keys.delete(event.key);
  });

  document.querySelectorAll('[data-control]').forEach((button) => {
    const control = button.getAttribute('data-control');
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      button.setPointerCapture?.(event.pointerId);
      pressControl(control, true);
    });
    button.addEventListener('pointerup', () => pressControl(control, false));
    button.addEventListener('pointercancel', () => pressControl(control, false));
    button.addEventListener('pointerleave', () => pressControl(control, false));
  });

  btnStart?.addEventListener('click', startGame);
  btnHow?.addEventListener('click', () => help?.classList.toggle('show'));
  btnFullscreen?.addEventListener('click', async () => {
    if (!wrap) return;
    try {
      if (!document.fullscreenElement) await wrap.requestFullscreen();
      else await document.exitFullscreen();
    } catch (error) {
      state.message = 'A teljes képernyő nem érhető el.';
      state.messageUntil = performance.now() + 1200;
    }
  });

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  resetGame();
  requestAnimationFrame(loop);
})();
