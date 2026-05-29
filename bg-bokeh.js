/* つながる水玉模様 — 背景パーティクル
   柔らかい光の玉が漂い、近い玉どうしが線でつながる。
   カーソルに反応してさらに動き、つながる。 */
(function () {
  var canvas = document.getElementById("bg-bokeh");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // --- 調整しやすいパラメータ -------------------------------------------
  var BASE_DENSITY = 0.000034; // 画面の広さに対する玉の数（多いほど密）
  var MAX_PARTICLES = 46;      // 玉の数の上限
  var MIN_PARTICLES = 16;      // 玉の数の下限
  var LINK_DIST = 175;         // この距離より近い玉どうしを線でつなぐ
  var MOUSE_DIST = 210;        // カーソルとつながる距離
  var DOT_MIN = 12;            // 玉の最小サイズ
  var DOT_MAX = 46;            // 玉の最大サイズ（大きめ＆ふんわりでボケ感を出す）
  var DOT_COLOR = "0, 87, 255";   // 水玉の色（#0057ff = --blue）
  var LINE_COLOR = "0, 102, 255";  // 線の色（#0066ff = --sub-blue）
  var DOT_ALPHA = 0.085;       // 水玉の濃さ（薄め）
  var LINE_ALPHA = 0.085;      // 線の濃さ（距離で薄くなる）
  // ---------------------------------------------------------------------

  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0;
  var particles = [];
  var mouse = { x: -9999, y: -9999, active: false };

  // 柔らかい光の玉を1枚だけスプライトとして作っておき、使い回す（高速化）
  function makeSprite(size) {
    var s = document.createElement("canvas");
    s.width = s.height = size;
    var c = s.getContext("2d");
    var r = size / 2;
    var g = c.createRadialGradient(r, r, 0, r, r, r);
    g.addColorStop(0, "rgba(" + DOT_COLOR + "," + DOT_ALPHA + ")");
    g.addColorStop(0.5, "rgba(" + DOT_COLOR + "," + (DOT_ALPHA * 0.45) + ")");
    g.addColorStop(1, "rgba(" + DOT_COLOR + ",0)");
    c.fillStyle = g;
    c.beginPath();
    c.arc(r, r, r, 0, Math.PI * 2);
    c.fill();
    return s;
  }
  var sprite = makeSprite(120);

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function createParticles() {
    var area = W * H;
    var count = Math.round(area * BASE_DENSITY);
    count = Math.max(MIN_PARTICLES, Math.min(MAX_PARTICLES, count));
    particles = [];
    for (var i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: rand(-0.13, 0.13),
        vy: rand(-0.13, 0.13),
        r: rand(DOT_MIN, DOT_MAX) // 玉の大きさにばらつきを出してボケ感を演出
      });
    }
  }

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    createParticles();
  }

  function drawDot(p) {
    var d = p.r * 2;
    ctx.drawImage(sprite, p.x - p.r, p.y - p.r, d, d);
  }

  function step() {
    ctx.clearRect(0, 0, W, H);

    var i, j, p, q, dx, dy, dist;

    // 移動
    for (i = 0; i < particles.length; i++) {
      p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      // カーソル近くは少し押しのけて、ふわっと動かす
      if (mouse.active) {
        dx = p.x - mouse.x;
        dy = p.y - mouse.y;
        dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_DIST && dist > 0.1) {
          var force = (1 - dist / MOUSE_DIST) * 0.6;
          p.x += (dx / dist) * force;
          p.y += (dy / dist) * force;
        }
      }

      // 画面端で折り返し
      if (p.x < -40) p.x = W + 40;
      else if (p.x > W + 40) p.x = -40;
      if (p.y < -40) p.y = H + 40;
      else if (p.y > H + 40) p.y = -40;
    }

    // つながる線
    ctx.lineWidth = 1;
    for (i = 0; i < particles.length; i++) {
      p = particles[i];
      for (j = i + 1; j < particles.length; j++) {
        q = particles[j];
        dx = p.x - q.x;
        dy = p.y - q.y;
        dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < LINK_DIST) {
          var a = (1 - dist / LINK_DIST) * LINE_ALPHA;
          ctx.strokeStyle = "rgba(" + LINE_COLOR + "," + a + ")";
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
      }

      // カーソルともつながる
      if (mouse.active) {
        dx = p.x - mouse.x;
        dy = p.y - mouse.y;
        dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_DIST) {
          var ma = (1 - dist / MOUSE_DIST) * (LINE_ALPHA + 0.1);
          ctx.strokeStyle = "rgba(" + LINE_COLOR + "," + ma + ")";
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
    }

    // 水玉
    for (i = 0; i < particles.length; i++) {
      drawDot(particles[i]);
    }

    raf = requestAnimationFrame(step);
  }

  var raf = null;

  window.addEventListener("resize", function () {
    if (raf) cancelAnimationFrame(raf);
    resize();
    if (!reduceMotion) raf = requestAnimationFrame(step);
    else renderStatic();
  });

  window.addEventListener("mousemove", function (e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  });
  window.addEventListener("mouseout", function () {
    mouse.active = false;
    mouse.x = mouse.y = -9999;
  });

  // 動きを減らす設定の人には、静止した1枚だけ描く
  function renderStatic() {
    ctx.clearRect(0, 0, W, H);
    var i, j, p, q, dx, dy, dist;
    ctx.lineWidth = 1;
    for (i = 0; i < particles.length; i++) {
      p = particles[i];
      for (j = i + 1; j < particles.length; j++) {
        q = particles[j];
        dx = p.x - q.x; dy = p.y - q.y;
        dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < LINK_DIST) {
          ctx.strokeStyle = "rgba(" + LINE_COLOR + "," + ((1 - dist / LINK_DIST) * LINE_ALPHA) + ")";
          ctx.beginPath();
          ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
        }
      }
    }
    for (i = 0; i < particles.length; i++) drawDot(particles[i]);
  }

  resize();
  if (reduceMotion) renderStatic();
  else raf = requestAnimationFrame(step);
})();
