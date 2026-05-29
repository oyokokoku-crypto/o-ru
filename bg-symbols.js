/* 浮遊する記号 — 背景パーティクル
   ○・＋・×・小さな点が、泡のようにゆっくり上へ漂う。
   白背景に黒の記号。文字の可読性を保つため、薄く・控えめに。 */
(function () {
  var canvas = document.getElementById("bg-symbols");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // --- 調整しやすいパラメータ -------------------------------------------
  var BASE_DENSITY = 0.000045; // 画面の広さに対する記号の数（多いほど密）
  var MAX_SYMBOLS = 60;        // 記号の数の上限
  var MIN_SYMBOLS = 22;        // 記号の数の下限
  var COLOR = "17, 17, 17";    // 記号の色（黒 = #111）
  var ALPHA_MIN = 0.07;        // 記号の薄さ（最小）
  var ALPHA_MAX = 0.2;         // 記号の濃さ（最大）
  var RISE_MIN = 0.15;         // 上昇スピード（最小）
  var RISE_MAX = 0.55;         // 上昇スピード（最大）
  // 記号の種類と出現比率
  var KINDS = ["circle", "circle", "cross", "plus", "dot", "ring-dot"];
  // ---------------------------------------------------------------------

  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0;
  var symbols = [];
  var t = 0;
  var raf = null;

  function rand(min, max) { return Math.random() * (max - min) + min; }
  function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }

  function makeSymbol(initial) {
    var kind = pick(KINDS);
    var r;
    if (kind === "dot") r = rand(1.5, 3.5);
    else if (kind === "ring-dot") r = rand(5, 11);
    else r = rand(5, 22);
    return {
      kind: kind,
      x: Math.random() * W,
      y: initial ? Math.random() * H : H + rand(20, 120),
      r: r,
      a: rand(ALPHA_MIN, ALPHA_MAX),
      vy: rand(RISE_MIN, RISE_MAX),
      swayAmp: rand(0.15, 0.5),
      swaySpeed: rand(0.005, 0.014),
      phase: Math.random() * Math.PI * 2,
      rot: Math.random() * Math.PI * 2,
      vr: rand(-0.004, 0.004)
    };
  }

  function createSymbols() {
    var area = W * H;
    var count = Math.round(area * BASE_DENSITY);
    count = Math.max(MIN_SYMBOLS, Math.min(MAX_SYMBOLS, count));
    symbols = [];
    for (var i = 0; i < count; i++) symbols.push(makeSymbol(true));
  }

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = "round";
    createSymbols();
  }

  function draw(p) {
    var stroke = "rgba(" + COLOR + "," + p.a + ")";
    ctx.strokeStyle = stroke;
    ctx.fillStyle = stroke;
    ctx.lineWidth = Math.max(1.1, p.r * 0.12);

    if (p.kind === "dot") {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    if (p.kind === "circle") {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.stroke();
      return;
    }

    if (p.kind === "ring-dot") {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1.2, p.r * 0.22), 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    // plus / cross
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.kind === "cross" ? p.rot + Math.PI / 4 : p.rot);
    ctx.beginPath();
    ctx.moveTo(-p.r, 0);
    ctx.lineTo(p.r, 0);
    ctx.moveTo(0, -p.r);
    ctx.lineTo(0, p.r);
    ctx.stroke();
    ctx.restore();
  }

  function step() {
    t += 1;
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < symbols.length; i++) {
      var p = symbols[i];
      p.y -= p.vy;
      p.x += Math.cos(t * p.swaySpeed + p.phase) * p.swayAmp;
      p.rot += p.vr;
      // 上に抜けたら下から出し直す
      if (p.y < -p.r - 30) {
        var fresh = makeSymbol(false);
        symbols[i] = fresh;
        p = fresh;
      }
      draw(p);
    }
    raf = requestAnimationFrame(step);
  }

  function renderStatic() {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < symbols.length; i++) draw(symbols[i]);
  }

  window.addEventListener("resize", function () {
    if (raf) cancelAnimationFrame(raf);
    resize();
    if (reduceMotion) renderStatic();
    else raf = requestAnimationFrame(step);
  });

  resize();
  if (reduceMotion) renderStatic();
  else raf = requestAnimationFrame(step);
})();
