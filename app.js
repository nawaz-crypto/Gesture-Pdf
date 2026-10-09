const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------- Viewer State & Data ---------- */
const demo = [
  ["#0ea5e9", "Axiomatic Probability", "Sample space, σ-algebras, probability measure", [
    "P: F → [0,1], P(Ω) = 1",
    "P(⋃ Aᵢ) = ∑ P(Aᵢ) for disjoint Aᵢ",
    "P(A|B) = P(B|A)·P(A) / P(B)"
  ]],
  ["#10b981", "Random Variables", "Expectation, variance and covariance", [
    "E[X] = ∫ x·f(x) dx",
    "Var(X) = E[X²] − (E[X])²",
    "Σ = E[(X−μ)(X−μ)ᵀ]"
  ]],
  ["#f59e0b", "Limit Theorems", "Law of large numbers and CLT", [
    "P(|X̄ₙ − μ| ≥ ε) → 0 as n → ∞",
    "√n (X̄ₙ − μ) → N(0, σ²)",
    "M(t) = E[e^{tX}]"
  ]],
  ["#8b5cf6", "Markov Chains", "Transition kernels and stationarity", [
    "P(Xₜ₊₁ | Xₜ, …, X₀) = P(Xₜ₊₁ | Xₜ)",
    "π·P = π",
    "P⁽ᵐ⁺ⁿ⁾ = P⁽ᵐ⁾·P⁽ⁿ⁾"
  ]]
];

const MAX_ZOOM = 3.0;
const MIN_ZOOM = 0.5;
const V = {
  pdf: null,
  page: 1,
  total: demo.length,
  zoom: 1,
  demo: true,
  baseW: 0,
  baseH: 0,
  renderedW: 0,
  renderedH: 0,
  timer: null,
  busy: false,
  again: false,
  canvas: $('pdf'),
  stage: $('stage'),
  wrap: $('wrap'),
  vp: $('viewport'),
  px: 0,
  py: 0
};
V.ctx = V.canvas.getContext('2d', { alpha: false });
const DPR = Math.min(window.devicePixelRatio || 1, 2);

function ui() {
  $('jump').value = V.page;
  $('total').textContent = '/ ' + V.total;
  $('d-info').textContent = V.page + ' / ' + V.total;
  $('zoom-lbl').textContent = Math.round(V.zoom * 100) + '%';
  const t = $('thumbs');
  t.innerHTML = '';
  for (let i = 1; i <= V.total; i++) {
    const d = document.createElement('div');
    d.className = 't' + (i === V.page ? ' on' : '');
    d.textContent = 'Page ' + i;
    d.onclick = () => go(i);
    t.appendChild(d);
  }
}

function go(p) {
  p = clamp(p, 1, V.total);
  if (p === V.page) return false;
  V.page = p;
  V.px = 0;
  V.py = 0;
  V.vp.scrollTo(0, 0);
  render();
  applyPan();
  return true;
}

const next = () => go(V.page + 1);
const prev = () => go(V.page - 1);

function updateZoomLayout(keepCenter = true) {
  const oldW = V.stage.clientWidth;
  const oldH = V.stage.clientHeight;
  const w = V.baseW * V.zoom;
  const h = V.baseH * V.zoom;

  if (!w || !h) return;

  const oldCenterX = V.vp.scrollLeft + V.vp.clientWidth / 2;
  const oldCenterY = V.vp.scrollTop + V.vp.clientHeight / 2;

  V.stage.style.width = w + 'px';
  V.stage.style.height = h + 'px';
  V.canvas.style.width = V.baseW + 'px';
  V.canvas.style.height = V.baseH + 'px';
  V.canvas.style.transform = `scale(${V.zoom})`;

  if (keepCenter && oldW > 0 && oldH > 0) {
    const dx = (w - oldW) / 2;
    const dy = (h - oldH) / 2;
    const maxLeft = Math.max(0, V.vp.scrollWidth - V.vp.clientWidth);
    const maxTop = Math.max(0, V.vp.scrollHeight - V.vp.clientHeight);
    V.vp.scrollLeft = clamp(oldCenterX + dx - V.vp.clientWidth / 2, 0, maxLeft);
    V.vp.scrollTop = clamp(oldCenterY + dy - V.vp.clientHeight / 2, 0, maxTop);
  }
}

function setZoom(z) {
  z = clamp(z, MIN_ZOOM, MAX_ZOOM);
  z = Math.round(z * 1000) / 1000;
  if (Math.abs(z - V.zoom) < 0.0005) return;

  V.zoom = z;
  $('zoom-lbl').textContent = Math.round(z * 100) + '%';
  updateZoomLayout(true);
}

function scrollBy(dy) {
  V.vp.scrollTop += dy;
}

function render() {
  ui();
  V.demo ? drawDemo() : drawPDF();
}

function rr(c, x, y, w, h, r) {
  c.beginPath();
  c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h);
}

function setCanvasBaseSize(w, h) {
  V.baseW = w;
  V.baseH = h;
  V.stage.style.width = w * V.zoom + 'px';
  V.stage.style.height = h * V.zoom + 'px';
  V.canvas.style.width = w + 'px';
  V.canvas.style.height = h + 'px';
  V.canvas.style.transform = `scale(${V.zoom})`;
}

function drawDemo() {
  const [ac, title, sub, eq] = demo[V.page - 1];
  const W = 1000, H = 625, c = V.ctx;

  const fitW = Math.min(
    W,
    Math.max(400, V.vp.clientWidth - 60),
    ((V.vp.clientHeight - 50) * W) / H
  );
  const fitH = (fitW * H) / W;
  const backingScale = Math.min(MAX_ZOOM, Math.max(1, DPR));

  V.canvas.width = Math.round(W * backingScale);
  V.canvas.height = Math.round(H * backingScale);
  setCanvasBaseSize(fitW, fitH);

  c.save();
  c.setTransform(backingScale, 0, 0, backingScale, 0, 0);
  c.fillStyle = '#fff';
  c.fillRect(0, 0, W, H);
  c.fillStyle = ac;
  c.fillRect(0, 0, W, 10);
  c.fillStyle = '#0f172a';
  c.font = '700 34px Inter,sans-serif';
  c.fillText(title, 50, 90);
  c.fillStyle = '#475569';
  c.font = '500 17px Inter,sans-serif';
  c.fillText(sub, 50, 122);
  eq.forEach((t, i) => {
    const y = 170 + i * 120;
    c.fillStyle = '#f8fafc';
    c.strokeStyle = '#e2e8f0';
    rr(c, 50, y, 900, 90, 10);
    c.fill();
    c.stroke();
    c.fillStyle = ac;
    c.fillRect(50, y, 6, 90);
    c.fillStyle = '#1e293b';
    c.font = '600 24px Inter,sans-serif';
    c.fillText(t, 84, y + 54);
  });
  c.fillStyle = '#94a3b8';
  c.font = '12px Inter,sans-serif';
  c.fillText('Slide ' + V.page + ' of ' + V.total + ' · open any PDF with the button above', 50, H - 22);
  c.restore();

  updateZoomLayout(false);
}

async function drawPDF() {
  if (V.busy) {
    V.again = true;
    return;
  }

  V.busy = true;
  try {
    const pg = await V.pdf.getPage(V.page);
    const v1 = pg.getViewport({ scale: 1 });

    const fit = Math.min(
      (V.vp.clientWidth - 60) / v1.width,
      (V.vp.clientHeight - 50) / v1.height
    );

    const renderScale = fit * MAX_ZOOM * Math.min(DPR, 1.5);
    const maxPixels = 4800;
    const finalScale = Math.min(renderScale, maxPixels / v1.width);
    const renderViewport = pg.getViewport({ scale: finalScale });

    V.canvas.width = Math.max(1, Math.round(renderViewport.width));
    V.canvas.height = Math.max(1, Math.round(renderViewport.height));

    const baseW = v1.width * fit;
    const baseH = v1.height * fit;
    setCanvasBaseSize(baseW, baseH);

    await pg.render({ canvasContext: V.ctx, viewport: renderViewport }).promise;
    updateZoomLayout(false);
  } catch (e) {
    console.error('PDF render error:', e);
  }

  V.busy = false;
  if (V.again) {
    V.again = false;
    drawPDF();
  }
}

async function loadPDF(buf, name) {
  try {
    V.pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    V.total = V.pdf.numPages;
    V.page = 1;
    V.zoom = 1;
    V.demo = false;
    V.px = 0;
    V.py = 0;
    $('doc-title').textContent = name;
    render();
    toast('PDF loaded');
  } catch (e) {
    alert('Could not open PDF: ' + e.message);
  }
}

function loadDemo() {
  V.pdf = null;
  V.demo = true;
  V.total = demo.length;
  V.page = 1;
  V.zoom = 1;
  V.px = 0;
  V.py = 0;
  $('doc-title').textContent = 'Sample deck';
  render();
}

let tt;
function toast(msg, color = '#10b981') {
  const t = $('toast');
  t.textContent = msg;
  t.style.borderColor = color;
  t.style.opacity = 1;
  t.style.transform = 'translate(-50%,0)';
  clearTimeout(tt);
  tt = setTimeout(() => {
    t.style.opacity = 0;
    t.style.transform = 'translate(-50%,-8px)';
  }, 1100);
}

/* ---------- Gesture Engine ---------- */
const video = $('video');
const radar = $('radar');
const rc = radar.getContext('2d');
const D = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

const S = { rev: false, gain: 1.5 };
try { Object.assign(S, JSON.parse(localStorage.getItem('airpdf') || '{}')); } catch (e) {}
const saveS = () => { try { localStorage.setItem('airpdf', JSON.stringify(S)); } catch (e) {} };
$('set-rev').checked = S.rev;
$('set-gain').value = S.gain;
$('set-rev').onchange = (e) => { S.rev = e.target.checked; saveS(); };$('set-gain').oninput = (e) => { S.gain = +e.target.value; saveS(); };

function applyPan() {
  const cw = V.stage.clientWidth;
  const ch = V.stage.clientHeight;
  const vw = V.vp.clientWidth;
  const vh = V.vp.clientHeight;
  const maxX = Math.max(0, (cw - vw) / 2);
  const maxY = Math.max(0, (ch - vh) / 2);
  V.px = clamp(V.px, -maxX, maxX);
  V.py = clamp(V.py, -maxY, maxY);
  V.wrap.style.transform = `translate3d(${V.px}px,${V.py}px,0)`;
  V.wrap.style.transformOrigin = 'center center';
}

const G = {
  label: 'none',
  gx: null,
  gy: null,
  zoomReady: false,
  zoomDistance: null,
  zoomStableDistance: null,
  zoomLastTime: 0,
  scrollY: null,
  pinchActive: false,
  pinchTriggered: false,
  pinchSide: null,
  pinkySince: 0,
  gestureLocked: false
};

function ext(lm, tip, pip) {
  return D(lm[tip], lm[0]) > D(lm[pip], lm[0]) * 1.12;
}

function fingerState(lm) {
  return {
    i: ext(lm, 8, 6),
    m: ext(lm, 12, 10),
    r: ext(lm, 16, 14),
    p: ext(lm, 20, 18)
  };
}

function pose(lm) {
  const { i, m, r, p } = fingerState(lm);
  if (i && m && r && p) return 'open';
  if (i && m && !r && !p) return 'two';
  if (p && !i && !m && !r) return 'pinky';
  if (i && !m && !r && !p) return 'point';
  if (!i && !m && !r && !p) return 'fist';
  return 'none';
}

const px = (p) => ({ x: p.x * 640, y: p.y * 480 });
const hsize = (lm) => Math.max(D(px(lm[0]), px(lm[9])), 1);

function isStrictPinch(lm) {
  const { i, m, r, p } = fingerState(lm);
  const hs = hsize(lm);
  const thumbTip = px(lm[4]);
  const indexTip = px(lm[8]);
  const thumbIP = px(lm[3]);
  const wrist = px(lm[0]);

  const tipGap = D(thumbTip, indexTip) / hs;
  const indexLength = D(indexTip, wrist);
  const indexFold = D(px(lm[6]), wrist);
  const thumbLength = D(thumbTip, wrist);
  const thumbFold = D(thumbIP, wrist);

  const close = tipGap < 0.38;
  const indexReady = i || indexLength > indexFold * 1.04;
  const thumbReady = thumbLength > thumbFold * 1.03;
  const otherFingersFolded = !m && !r && !p;

  return close && indexReady && thumbReady && otherFingersFolded;
}

function pinchX(lm) {
  return 1 - (lm[4].x + lm[8].x) / 2;
}

function pinchSide(x) {
  if (x < 0.24) return 'left';
  if (x > 0.76) return 'right';
  return 'center';
}

function resetZoomGesture() {
  G.zoomReady = false;
  G.zoomDistance = null;
  G.zoomStableDistance = null;
  G.zoomLastTime = 0;
}

function resetMotion() {
  G.gx = null;
  G.gy = null;
}

function show(g, p) {
  $('s-gest').textContent = g;
  $('s-pinch').textContent = p || '–';
}

function toggleGestureLock() {
  G.gestureLocked = !G.gestureLocked;
  G.pinchActive = false;
  G.pinchTriggered = false;
  G.pinchSide = null;
  resetMotion();
  resetZoomGesture();
  G.scrollY = null;
  toast(G.gestureLocked ? '🔒 Gestures LOCKED' : '🔓 Gestures UNLOCKED', G.gestureLocked ? '#f59e0b' : '#10b981');
  show(G.gestureLocked ? '🔒 Locked' : '🔓 Unlocked');
}

function handlePinkyLock(lm, now) {
  if (pose(lm) !== 'pinky') {
    G.pinkySince = 0;
    return false;
  }
  if (!G.pinkySince) G.pinkySince = now;
  const held = now - G.pinkySince;
  show(G.gestureLocked ? 'Pinky: hold to unlock' : 'Pinky: hold to lock', (Math.min(held, 2000) / 1000).toFixed(1) + 's');
  if (held >= 2000) {
    G.pinkySince = 0;
    toggleGestureLock();
  }
  return true;
}

function handlePinchPageTurn(lm) {
  if (!isStrictPinch(lm)) {
    if (G.pinchActive) {
      G.pinchActive = false;
      G.pinchTriggered = false;
      G.pinchSide = null;
    }
    return false;
  }

  const x = pinchX(lm);
  const zone = pinchSide(x);
  const side = zone === 'center' ? null : zone;

  if (!G.pinchActive) {
    G.pinchActive = true;
    G.pinchTriggered = false;
    G.pinchSide = side;
  }

  if (G.pinchSide === null && side === null) {
    show('🤏 Pinch: center disabled', 'move to side before pinching');
    return true;
  }
  if (G.pinchSide === null) {
    show('🤏 Pinch: center disabled', 'release and pinch on side');
    return true;
  }

  if (!G.pinchTriggered && side) {
    G.pinchTriggered = true;
    G.pinchSide = side;
    if (side === 'right') {
      if (next()) toast('Next ▶');
    } else {
      if (prev()) toast('◀ Previous');
    }
  }

  show(side ? '🤏 Pinch: ' + side : '🤏 Pinch: move to side', side || 'center');
  return true;
}

function oneHand(lm) {
  const now = performance.now();
  if (handlePinkyLock(lm, now)) return;

  if (G.gestureLocked) {
    G.pinchActive = false;
    G.pinchTriggered = false;
    G.pinchSide = null;
    resetMotion();
    resetZoomGesture();
    G.scrollY = null;
    show('🔒 Gestures locked');
    return;
  }

  if (handlePinchPageTurn(lm)) return;

  const raw = pose(lm);
  if (raw === 'fist') {
    resetMotion();
    resetZoomGesture();
    G.scrollY = null;
    G.label = 'fist';
    show('Fist: idle');
    return;
  }

  if (raw === 'open') {
    if (G.label !== 'open') {
      resetMotion();
      G.label = 'open';
      G.gx = lm[9].x;
      G.gy = lm[9].y;
    }
    show('Palm: dragging page');
    const sx = G.gx + (lm[9].x - G.gx) * 0.3;
    const sy = G.gy + (lm[9].y - G.gy) * 0.3;
    const dx = sx - G.gx;
    const dy = sy - G.gy;
    if (Math.hypot(dx, dy) > 0.002) {
      V.px += -dx * V.vp.clientWidth * S.gain * 1.05;
      V.py += dy * V.vp.clientHeight * S.gain * 1.05;
      applyPan();
    }
    G.gx = sx;
    G.gy = sy;
    return;
  }

  if (raw === 'two') {
    resetMotion();
    resetZoomGesture();
    if (G.label !== 'two') {
      G.label = 'two';
      G.scrollY = (lm[8].y + lm[12].y) / 2;
    }
    const y = (lm[8].y + lm[12].y) / 2;
    const dy = y - G.scrollY;
    if (Math.abs(dy) > 0.012) {
      V.vp.scrollTop += dy * V.vp.clientHeight * 2.4;
      G.scrollY = y;
    }
    show('✌️ 2 fingers: scroll');
    return;
  }

  G.label = raw;
  show(raw === 'point' ? 'Point: idle' : '–');
}

function twoHands(a, b) {
  if (G.gestureLocked) {
    resetZoomGesture();
    show('🔒 Gestures locked');
    return;
  }

  const pa = pose(a), pb = pose(b);
  if (pa !== 'open' || pb !== 'open') {
    resetZoomGesture();
    show('–');
    return;
  }

  const d = D(px(a[9]), px(b[9])) / ((hsize(a) + hsize(b)) / 2);
  show('🤲 Two palms: zoom', d.toFixed(2));

  const now = performance.now();
  if (!G.zoomReady) {
    G.zoomReady = true;
    G.zoomDistance = d;
    G.zoomStableDistance = d;
    G.zoomLastTime = now;
    return;
  }

  const smoothed = G.zoomStableDistance + (d - G.zoomStableDistance) * 0.2;
  const delta = smoothed - G.zoomStableDistance;
  G.zoomStableDistance = smoothed;

  if (Math.abs(delta) > 0.006) {
    const step = clamp(delta * 0.42, -0.018, 0.018);
    setZoom(V.zoom + step);
  }
  G.zoomLastTime = now;
}

function lost() {
  resetMotion();
  resetZoomGesture();
  G.scrollY = null;
  G.pinkySince = 0;
  G.pinchActive = false;
  G.pinchTriggered = false;
  G.pinchSide = null;
  $('s-hand').innerHTML = '<i class="dot"></i>Not found';
  show(G.gestureLocked ? '🔒 Gestures locked' : '–');
}

let frames = 0, lastFps = performance.now();
const hands = new Hands({
  locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${f}`
});

hands.setOptions({
  maxNumHands: 2,
  modelComplexity: 1,
  minDetectionConfidence: 0.72,
  minTrackingConfidence: 0.70
});

hands.onResults((res) => {
  frames++;
  const n = performance.now();
  if (n - lastFps >= 1000) {
    $('fps').textContent = frames + ' FPS';
    frames = 0;
    lastFps = n;
  }

  radar.width = video.videoWidth || 640;
  radar.height = video.videoHeight || 480;
  rc.clearRect(0, 0, radar.width, radar.height);

  const H = res.multiHandLandmarks || [];
  if (!H.length) {
    lost();
    return;
  }

  $('s-hand').innerHTML = '<i class="dot on"></i>' + H.length + (H.length > 1 ? ' hands' : ' hand');

  H.forEach((lm) => {
    const q = pose(lm);
    const pinch = isStrictPinch(lm);
    rc.fillStyle = pinch ? '#38bdf8' : q === 'pinky' ? '#f59e0b' : q === 'fist' ? '#ef4444' : '#10b981';
    lm.forEach((p, i) => {
      rc.beginPath();
      rc.arc(p.x * radar.width, p.y * radar.height, i % 4 === 0 ? 5 : 3, 0, 6.28);
      rc.fill();
    });
  });

  if (H.length >= 2) twoHands(H[0], H[1]);
  else oneHand(H[0]);
});

const cam = new Camera(video, {
  onFrame: async () => {
    await hands.send({ image: video });
  },
  width: 640,
  height: 480
});

function startCam() {
  cam.start().then(() => {
    $('cam-prompt').style.display = 'none';
    toast('Camera ready');
  }).catch(() => {
    $('cam-prompt').style.display = 'flex';
  });
}

/* ---------- Event Listeners & Controls ---------- */
$('t-next').onclick =$('d-next').onclick = next;
$('t-prev').onclick =$('d-prev').onclick = prev;
$('d-zi').onclick = () => setZoom(V.zoom + 0.1);
$('d-zo').onclick = () => setZoom(V.zoom - 0.1);$('b-reset').onclick = () => {
  V.zoom = 1;
  updateZoomLayout(true);
  V.px = 0;
  V.py = 0;
  applyPan();
  ui();
};
$('d-su').onclick = () => scrollBy(-200);$('d-sd').onclick = () => scrollBy(200);

$('jump').onchange = (e) => {
  const p = parseInt(e.target.value) || 1;
  V.page = clamp(p, 1, V.total);
  render();
};

$('b-thumbs').onclick = () => $('thumbs').classList.toggle('open');$('b-panel').onclick = () => $('side').classList.toggle('hide');$('b-demo').onclick = loadDemo;
$('b-cam').onclick = startCam;

function fs() {
  document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen().catch(() => {});
}
$('b-fs').onclick = fs;

$('file').onchange = (e) => {
  const f = e.target.files[0];
  if (f && f.type === 'application/pdf') {
    const r = new FileReader();
    r.onload = () => loadPDF(new Uint8Array(r.result), f.name);
    r.readAsArrayBuffer(f);
  }
};

addEventListener('dragover', (e) => e.preventDefault());
addEventListener('drop', (e) => {
  e.preventDefault();
  const f = e.dataTransfer.files[0];
  if (f && f.type === 'application/pdf') {
    const r = new FileReader();
    r.onload = () => loadPDF(new Uint8Array(r.result), f.name);
    r.readAsArrayBuffer(f);
  }
});

addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  const k = e.key;
  if (k === 'ArrowRight' || k === 'PageDown' || k === 'n') next();
  else if (k === 'ArrowLeft' || k === 'PageUp' || k === 'p') prev();
  else if (k === '+' || k === '=') setZoom(V.zoom + 0.1);
  else if (k === '-' || k === '_') setZoom(V.zoom - 0.1);
  else if (k === '0' || k === 'r') setZoom(1);
  else if (k === 'ArrowUp') scrollBy(-120);
  else if (k === 'ArrowDown') scrollBy(120);
  else if (k === 'f' || k === 'F11') { e.preventDefault(); fs(); }
  else if (k === 'h') $('side').classList.toggle('hide');
});

let rz;
addEventListener('resize', () => {
  clearTimeout(rz);
  rz = setTimeout(() => {
    if (V.pdf && V.busy) {
      V.again = true;
      return;
    }
    render();
  }, 350);
});

// Initial boot
render();
startCam();
/* ---------- About Project Modal Listeners ---------- */
const aboutModal = $('about-modal');
const openModalBtn = $('b-about');
const closeModalBtn = $('modal-close');

if (openModalBtn && aboutModal) {
  openModalBtn.onclick = () => aboutModal.classList.add('open');
  closeModalBtn.onclick = () => aboutModal.classList.remove('open');
  
  // for closing when clicking outside of model
  aboutModal.onclick = (e) => {
    if (e.target === aboutModal) aboutModal.classList.remove('open');
  };
  
  // Escape key close
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && aboutModal.classList.contains('open')) {
      aboutModal.classList.remove('open');
    }
  });
}
