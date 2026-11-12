/* ═══════════════════════════════════════════════════════════════════
   TEMAS DE FONDO + AJUSTES
   ═══════════════════════════════════════════════════════════════════ */

/* ═══ Helpers para temas ═══ */
function _createMeteor(W, H, initial) {
  var startX = initial ? Math.random() * W : (Math.random() < 0.5 ? -50 : W + 50);
  var startY = initial ? Math.random() * H * 0.6 : Math.random() * H * 0.6;
  var speed = 3 + Math.random() * 4;
  var angle = Math.PI / 4 + Math.random() * Math.PI / 6;
  var dirX = startX < 0 ? 1 : -1;
  return {
    x: startX, y: startY,
    vx: Math.cos(angle) * speed * dirX,
    vy: Math.sin(angle) * speed,
    r: 1.5 + Math.random() * 1.5,
    trail: [{ x: startX, y: startY }]
  };
}

var THEMES = {

  /* ─── Default (gratis) ─── */
  estrellas: {
    id: 'estrellas', name: 'Estrellas', emoji: '✨',
    description: 'Constelaciones doradas sobre negro profundo.',
    price: 0, isDefault: true, acceptsTint: true,
    init: function(W, H) {
      var stars = [];
      var count = Math.min(180, Math.floor((W * H) / 8000));
      for (var i = 0; i < count; i++) stars.push({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.random() * 1.4 + 0.3,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        a: Math.random() * 0.5 + 0.2
      });
      return { stars: stars };
    },
    draw: function(ctx, W, H, state, opts) {
      ctx.clearRect(0, 0, W, H);
      var t = opts.tint;
      var fillBase = t ? 'rgba(' + t.r + ',' + t.g + ',' + t.b + ',' : 'rgba(240,220,180,';
      var lineBase = t ? 'rgba(' + t.r + ',' + t.g + ',' + t.b + ',' : 'rgba(240,200,96,';
      var stars = state.stars;
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        s.x += s.vx; s.y += s.vy;
        if (s.x < 0) s.x = W; if (s.x > W) s.x = 0;
        if (s.y < 0) s.y = H; if (s.y > H) s.y = 0;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = fillBase + s.a + ')';
        ctx.fill();
      }
      for (var p = 0; p < stars.length; p++) for (var q = p + 1; q < stars.length; q++) {
        var dx = stars[p].x - stars[q].x, dy = stars[p].y - stars[q].y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < 120) {
          ctx.beginPath();
          ctx.moveTo(stars[p].x, stars[p].y);
          ctx.lineTo(stars[q].x, stars[q].y);
          ctx.strokeStyle = lineBase + ((1 - d / 120) * 0.12) + ')';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  },

  /* ─── Ascuas ─── */
  ascuas: {
    id: 'ascuas', name: 'Ascuas', emoji: '🔥',
    description: 'Brasas ardientes que ascienden desde el fondo.',
    price: 150, acceptsTint: false,
    init: function(W, H) {
      var particles = [];
      for (var i = 0; i < 80; i++) particles.push({
        x: Math.random() * W, y: Math.random() * H,
        r: 1 + Math.random() * 2,
        vy: -0.3 - Math.random() * 0.7,
        hue: 15 + Math.random() * 30,
        a: 0.5 + Math.random() * 0.5
      });
      return { particles: particles };
    },
    draw: function(ctx, W, H, state, opts) {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < state.particles.length; i++) {
        var p = state.particles[i];
        p.y += p.vy;
        if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'hsla(' + p.hue + ', 90%, 60%, ' + p.a + ')';
        ctx.fill();
      }
    }
  },

  /* ─── Pétalos ─── */
  petalos: {
    id: 'petalos', name: 'Pétalos', emoji: '🌸',
    description: 'Pétalos de cerezo cayendo con suavidad.',
    price: 150, acceptsTint: true,
    init: function(W, H) {
      var petals = [];
      for (var i = 0; i < 40; i++) petals.push({
        x: Math.random() * W, y: Math.random() * H,
        r: 3 + Math.random() * 4,
        vx: -0.2 + Math.random() * 0.4,
        vy: 0.3 + Math.random() * 0.5,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.02,
        hue: 340 + Math.random() * 30,
        a: 0.5 + Math.random() * 0.4
      });
      return { petals: petals };
    },
    draw: function(ctx, W, H, state, opts) {
      ctx.clearRect(0, 0, W, H);
      var t = opts.tint;
      var tHue = t ? (t.r * 360 / 255) : null;
      for (var i = 0; i < state.petals.length; i++) {
        var p = state.petals[i];
        p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        if (p.y > H + 20) { p.y = -20; p.x = Math.random() * W; }
        if (p.x < -20) p.x = W + 20;
        if (p.x > W + 20) p.x = -20;
        var hue = tHue !== null ? tHue : p.hue;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.beginPath();
        ctx.ellipse(0, 0, p.r, p.r * 0.6, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'hsla(' + hue + ', 80%, 75%, ' + p.a + ')';
        ctx.fill();
        ctx.restore();
      }
    }
  },

  /* ─── Arena Estelar ─── */
  arena_estelar: {
    id: 'arena_estelar', name: 'Arena Estelar', emoji: '🌫️',
    description: 'Polvo de estrellas que fluye lentamente.',
    price: 150, acceptsTint: true,
    init: function(W, H) {
      var particles = [];
      for (var i = 0; i < 320; i++) particles.push({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.random() * 0.8 + 0.2,
        vx: (Math.random() - 0.5) * 0.05,
        vy: (Math.random() - 0.5) * 0.05,
        a: 0.2 + Math.random() * 0.6
      });
      return { particles: particles };
    },
    draw: function(ctx, W, H, state, opts) {
      ctx.clearRect(0, 0, W, H);
      var t = opts.tint;
      var fillBase = t ? 'rgba(' + t.r + ',' + t.g + ',' + t.b + ',' : 'rgba(220,200,255,';
      for (var i = 0; i < state.particles.length; i++) {
        var p = state.particles[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = fillBase + p.a + ')';
        ctx.fill();
      }
    }
  },

  /* ─── Meteoros ─── */
  meteoros: {
    id: 'meteoros', name: 'Meteoros', emoji: '🌠',
    description: 'Estrellas fugaces que cruzan el cielo nocturno.',
    price: 200, acceptsTint: true,
    init: function(W, H) {
      var meteors = [];
      for (var i = 0; i < 4; i++) meteors.push(_createMeteor(W, H, true));
      return { meteors: meteors, spawnTimer: 0, stars: null };
    },
    draw: function(ctx, W, H, state, opts) {
      ctx.clearRect(0, 0, W, H);
      var t = opts.tint;
      var rgbStr = t ? (t.r + ',' + t.g + ',' + t.b) : '255,220,150';

      if (!state.stars) {
        state.stars = [];
        for (var s = 0; s < 80; s++) state.stars.push({
          x: Math.random() * W, y: Math.random() * H,
          r: Math.random() * 1 + 0.3,
          a: Math.random() * 0.4 + 0.1
        });
      }
      state.stars.forEach(function(st) {
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + rgbStr + ',' + st.a + ')';
        ctx.fill();
      });

      state.spawnTimer++;
      if (state.spawnTimer > 60 + Math.random() * 100 && state.meteors.length < 6) {
        state.spawnTimer = 0;
        state.meteors.push(_createMeteor(W, H, false));
      }

      state.meteors = state.meteors.filter(function(m) {
        for (var g = 0; g < m.trail.length; g++) {
          var tr = m.trail[g];
          var alpha = (g / m.trail.length) * 0.6;
          ctx.beginPath();
          ctx.arc(tr.x, tr.y, m.r * (g / m.trail.length), 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(' + rgbStr + ',' + alpha + ')';
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + rgbStr + ',0.95)';
        ctx.fill();
        m.x += m.vx;
        m.y += m.vy;
        m.trail.push({ x: m.x, y: m.y });
        if (m.trail.length > 15) m.trail.shift();
        return m.x > -100 && m.x < W + 100 && m.y > -100 && m.y < H + 100;
      });
    }
  },

  /* ─── Burbujas ─── */
  burbujas: {
    id: 'burbujas', name: 'Burbujas', emoji: '🫧',
    description: 'Burbujas que ascienden meciéndose.',
    price: 150, acceptsTint: true,
    init: function(W, H) {
      var bubbles = [];
      for (var i = 0; i < 25; i++) bubbles.push({
        x: Math.random() * W, y: Math.random() * H,
        r: 4 + Math.random() * 12,
        vy: -0.4 - Math.random() * 0.6,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.02 + Math.random() * 0.02,
        wobbleAmp: 0.5 + Math.random() * 1
      });
      return { bubbles: bubbles };
    },
    draw: function(ctx, W, H, state, opts) {
      ctx.clearRect(0, 0, W, H);
      var t = opts.tint;
      var rgbStr = t ? (t.r + ',' + t.g + ',' + t.b) : '180,220,255';
      state.bubbles.forEach(function(b) {
        b.y += b.vy;
        b.wobble += b.wobbleSpeed;
        var wobbleX = Math.sin(b.wobble) * b.wobbleAmp * 3;
        if (b.y < -b.r * 2) { b.y = H + b.r * 2; b.x = Math.random() * W; }
        ctx.beginPath();
        ctx.arc(b.x + wobbleX, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + rgbStr + ',0.15)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(' + rgbStr + ',0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(b.x + wobbleX - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.25, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fill();
      });
    }
  },

  /* ─── Nieve ─── */
  nieve: {
    id: 'nieve', name: 'Nieve', emoji: '❄️',
    description: 'Copos de nieve cayendo con vaivén.',
    price: 150, acceptsTint: true,
    init: function(W, H) {
      var flakes = [];
      for (var i = 0; i < 100; i++) flakes.push({
        x: Math.random() * W, y: Math.random() * H,
        r: 1 + Math.random() * 2.5,
        vy: 0.3 + Math.random() * 0.5,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.01 + Math.random() * 0.02,
        wobbleAmp: 0.5 + Math.random() * 1.5
      });
      return { flakes: flakes };
    },
    draw: function(ctx, W, H, state, opts) {
      ctx.clearRect(0, 0, W, H);
      var t = opts.tint;
      var rgbStr = t ? (t.r + ',' + t.g + ',' + t.b) : '255,255,255';
      state.flakes.forEach(function(f) {
        f.y += f.vy;
        f.wobble += f.wobbleSpeed;
        var wobbleX = Math.sin(f.wobble) * f.wobbleAmp;
        if (f.y > H + 5) { f.y = -5; f.x = Math.random() * W; }
        ctx.beginPath();
        ctx.arc(f.x + wobbleX, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + rgbStr + ',0.85)';
        ctx.fill();
      });
    }
  },

  /* ─── Luciérnagas ─── */
  luciernagas: {
    id: 'luciernagas', name: 'Luciérnagas', emoji: '🐝',
    description: 'Puntos de luz que vagan y parpadean.',
    price: 150, acceptsTint: true,
    init: function(W, H) {
      var bugs = [];
      for (var i = 0; i < 30; i++) bugs.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: 1.5 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2,
        phaseSpeed: 0.02 + Math.random() * 0.03,
        baseA: 0.4 + Math.random() * 0.4
      });
      return { bugs: bugs };
    },
    draw: function(ctx, W, H, state, opts) {
      ctx.clearRect(0, 0, W, H);
      var t = opts.tint;
      var rgbStr = t ? (t.r + ',' + t.g + ',' + t.b) : '255,230,130';
      state.bugs.forEach(function(b) {
        b.x += b.vx; b.y += b.vy;
        b.phase += b.phaseSpeed;
        b.vx += (Math.random() - 0.5) * 0.1;
        b.vy += (Math.random() - 0.5) * 0.1;
        b.vx = Math.max(-0.6, Math.min(0.6, b.vx));
        b.vy = Math.max(-0.6, Math.min(0.6, b.vy));
        if (b.x < 0) b.x = W; if (b.x > W) b.x = 0;
        if (b.y < 0) b.y = H; if (b.y > H) b.y = 0;
        var alpha = b.baseA * (0.5 + 0.5 * Math.sin(b.phase));
        var g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r * 4);
        g.addColorStop(0, 'rgba(' + rgbStr + ',' + alpha + ')');
        g.addColorStop(1, 'rgba(' + rgbStr + ',0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r * 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + rgbStr + ',' + alpha + ')';
        ctx.fill();
      });
    }
  },

  /* ─── Hojas de Otoño ─── */
  hojas_otono: {
    id: 'hojas_otono', name: 'Hojas de Otoño', emoji: '🍂',
    description: 'Hojas alargadas que caen girando.',
    price: 150, acceptsTint: true,
    init: function(W, H) {
      var leaves = [];
      for (var i = 0; i < 35; i++) leaves.push({
        x: Math.random() * W, y: Math.random() * H,
        size: 4 + Math.random() * 4,
        vx: (Math.random() - 0.5) * 0.5,
        vy: 0.3 + Math.random() * 0.5,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.04,
        hue: 20 + Math.random() * 30,
        a: 0.55 + Math.random() * 0.35
      });
      return { leaves: leaves };
    },
    draw: function(ctx, W, H, state, opts) {
      ctx.clearRect(0, 0, W, H);
      var t = opts.tint;
      var tHue = t ? (t.r * 360 / 255) : null;
      state.leaves.forEach(function(l) {
        l.x += l.vx; l.y += l.vy; l.rot += l.vr;
        if (l.y > H + 20) { l.y = -20; l.x = Math.random() * W; }
        if (l.x < -20) l.x = W + 20;
        if (l.x > W + 20) l.x = -20;
        var hue = tHue !== null ? tHue : l.hue;
        ctx.save();
        ctx.translate(l.x, l.y);
        ctx.rotate(l.rot);
        ctx.beginPath();
        ctx.ellipse(0, 0, l.size, l.size * 0.35, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'hsla(' + hue + ', 70%, 55%, ' + l.a + ')';
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-l.size, 0);
        ctx.lineTo(l.size, 0);
        ctx.strokeStyle = 'hsla(' + hue + ', 70%, 35%, ' + l.a + ')';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        ctx.restore();
      });
    }
  },

  /* ─── Polvo Dorado ─── */
  polvo_dorado: {
    id: 'polvo_dorado', name: 'Polvo Dorado', emoji: '🌾',
    description: 'Partículas de oro flotando en un rayo de luz.',
    price: 150, acceptsTint: true,
    init: function(W, H) {
      var particles = [];
      for (var i = 0; i < 200; i++) particles.push({
        x: Math.random() * W, y: Math.random() * H,
        r: 0.3 + Math.random() * 1,
        vx: (Math.random() - 0.5) * 0.08,
        vy: (Math.random() - 0.5) * 0.08,
        phase: Math.random() * Math.PI * 2,
        phaseSpeed: 0.005 + Math.random() * 0.01,
        baseA: 0.3 + Math.random() * 0.5
      });
      return { particles: particles };
    },
    draw: function(ctx, W, H, state, opts) {
      ctx.clearRect(0, 0, W, H);
      var t = opts.tint;
      var rgbStr = t ? (t.r + ',' + t.g + ',' + t.b) : '255,220,130';
      state.particles.forEach(function(p) {
        p.x += p.vx; p.y += p.vy;
        p.phase += p.phaseSpeed;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        var alpha = p.baseA * (0.6 + 0.4 * Math.sin(p.phase));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + rgbStr + ',' + alpha + ')';
        ctx.fill();
      });
    }
  },

  /* ─── Chispas ─── */
  chispas: {
    id: 'chispas', name: 'Chispas', emoji: '🕯️',
    description: 'Chispas que nacen, brillan y se desvanecen.',
    price: 100, acceptsTint: false,
    init: function(W, H) {
      var sparks = [];
      for (var i = 0; i < 40; i++) sparks.push({
        x: Math.random() * W, y: Math.random() * H,
        r: 1 + Math.random() * 1.5,
        life: Math.random() * 100,
        maxLife: 60 + Math.random() * 60,
        vy: -0.2 - Math.random() * 0.4
      });
      return { sparks: sparks };
    },
    draw: function(ctx, W, H, state, opts) {
      ctx.clearRect(0, 0, W, H);
      state.sparks.forEach(function(s) {
        s.life++;
        s.y += s.vy;
        if (s.life > s.maxLife || s.y < -10) {
          s.life = 0;
          s.x = Math.random() * W;
          s.y = H + 10;
          s.maxLife = 60 + Math.random() * 60;
        }
        var lr = s.life / s.maxLife;
        var alpha = lr < 0.2 ? lr * 5 : (1 - lr) * 1.2;
        alpha = Math.max(0, Math.min(1, alpha));
        var g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 3);
        g.addColorStop(0, 'rgba(255,180,100,' + (alpha * 0.6) + ')');
        g.addColorStop(1, 'rgba(255,180,100,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,230,150,' + alpha + ')';
        ctx.fill();
      });
    }
  },

  /* ─── Ceniza ─── */
  ceniza: {
    id: 'ceniza', name: 'Ceniza', emoji: '🕸️',
    description: 'Ceniza gris que asciende lentamente.',
    price: 100, acceptsTint: false,
    init: function(W, H) {
      var ash = [];
      for (var i = 0; i < 60; i++) ash.push({
        x: Math.random() * W, y: Math.random() * H,
        r: 0.8 + Math.random() * 1.5,
        vy: -0.1 - Math.random() * 0.3,
        vx: (Math.random() - 0.5) * 0.15,
        a: 0.2 + Math.random() * 0.4
      });
      return { ash: ash };
    },
    draw: function(ctx, W, H, state, opts) {
      ctx.clearRect(0, 0, W, H);
      state.ash.forEach(function(p) {
        p.y += p.vy; p.x += p.vx;
        if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(140,140,150,' + p.a + ')';
        ctx.fill();
      });
    }
  },

  /* ─── Confeti ─── */
  confeti: {
    id: 'confeti', name: 'Confeti', emoji: '🎊',
    description: 'Confeti de colores cayendo en celebración.',
    price: 150, acceptsTint: true,
    init: function(W, H) {
      var colors = ['#ff6b9d', '#ffd93d', '#6bcfff', '#95e1a3', '#c084fc', '#ff9f68'];
      var confetti = [];
      for (var i = 0; i < 60; i++) confetti.push({
        x: Math.random() * W, y: Math.random() * H,
        w: 4 + Math.random() * 4,
        h: 6 + Math.random() * 4,
        vx: (Math.random() - 0.5) * 0.6,
        vy: 0.5 + Math.random() * 0.7,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.15,
        color: colors[Math.floor(Math.random() * colors.length)],
        a: 0.75 + Math.random() * 0.25
      });
      return { confetti: confetti };
    },
    draw: function(ctx, W, H, state, opts) {
      ctx.clearRect(0, 0, W, H);
      var t = opts.tint;
      state.confetti.forEach(function(c) {
        c.x += c.vx; c.y += c.vy; c.rot += c.vr;
        if (c.y > H + 20) { c.y = -20; c.x = Math.random() * W; }
        if (c.x < -20) c.x = W + 20;
        if (c.x > W + 20) c.x = -20;
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rot);
        ctx.globalAlpha = c.a;
        ctx.fillStyle = t ? 'rgb(' + t.r + ',' + t.g + ',' + t.b + ')' : c.color;
        ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
        ctx.restore();
      });
      ctx.globalAlpha = 1;
    }
  },

  /* ─── Plumas ─── */
  plumas: {
    id: 'plumas', name: 'Plumas', emoji: '🪶',
    description: 'Plumas que descienden lentamente meciéndose.',
    price: 150, acceptsTint: true,
    init: function(W, H) {
      var feathers = [];
      for (var i = 0; i < 20; i++) feathers.push({
        x: Math.random() * W, y: Math.random() * H,
        size: 6 + Math.random() * 8,
        vy: 0.15 + Math.random() * 0.25,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.01 + Math.random() * 0.015,
        wobbleAmp: 1 + Math.random() * 2,
        rot: (Math.random() - 0.5) * 0.6,
        a: 0.5 + Math.random() * 0.4
      });
      return { feathers: feathers };
    },
    draw: function(ctx, W, H, state, opts) {
      ctx.clearRect(0, 0, W, H);
      var t = opts.tint;
      var rgbStr = t ? (t.r + ',' + t.g + ',' + t.b) : '240,240,250';
      state.feathers.forEach(function(f) {
        f.y += f.vy;
        f.wobble += f.wobbleSpeed;
        var wobbleX = Math.sin(f.wobble) * f.wobbleAmp;
        if (f.y > H + 30) { f.y = -30; f.x = Math.random() * W; }
        ctx.save();
        ctx.translate(f.x + wobbleX, f.y);
        ctx.rotate(f.rot + Math.sin(f.wobble * 0.5) * 0.2);
        ctx.beginPath();
        ctx.moveTo(0, -f.size);
        ctx.quadraticCurveTo(f.size * 0.6, 0, 0, f.size);
        ctx.quadraticCurveTo(-f.size * 0.6, 0, 0, -f.size);
        ctx.fillStyle = 'rgba(' + rgbStr + ',' + f.a + ')';
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(0, -f.size);
        ctx.lineTo(0, f.size);
        ctx.strokeStyle = 'rgba(' + rgbStr + ',' + (f.a * 0.5) + ')';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        ctx.restore();
      });
    }
  },

  /* ─── Gotas de Lluvia ─── */
  gotas_lluvia: {
    id: 'gotas_lluvia', name: 'Gotas de Lluvia', emoji: '💧',
    description: 'Lluvia fina cayendo en la oscuridad.',
    price: 100, acceptsTint: false,
    init: function(W, H) {
      var drops = [];
      for (var i = 0; i < 120; i++) drops.push({
        x: Math.random() * W, y: Math.random() * H,
        len: 8 + Math.random() * 12,
        vy: 6 + Math.random() * 8,
        a: 0.3 + Math.random() * 0.4
      });
      return { drops: drops };
    },
    draw: function(ctx, W, H, state, opts) {
      ctx.clearRect(0, 0, W, H);
      state.drops.forEach(function(d) {
        d.y += d.vy;
        if (d.y > H + 20) { d.y = -20; d.x = Math.random() * W; }
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x, d.y + d.len);
        ctx.strokeStyle = 'rgba(150,190,230,' + d.a + ')';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    }
  },

  /* ─── Destellos ─── */
  destellos: {
    id: 'destellos', name: 'Destellos', emoji: '🎆',
    description: 'Estrellas que aparecen y se desvanecen.',
    price: 100, acceptsTint: true,
    init: function(W, H) {
      var sparkles = [];
      for (var i = 0; i < 60; i++) sparkles.push({
        x: Math.random() * W, y: Math.random() * H,
        r: 1 + Math.random() * 2,
        phase: Math.random() * Math.PI * 2,
        phaseSpeed: 0.02 + Math.random() * 0.03
      });
      return { sparkles: sparkles };
    },
    draw: function(ctx, W, H, state, opts) {
      ctx.clearRect(0, 0, W, H);
      var t = opts.tint;
      var rgbStr = t ? (t.r + ',' + t.g + ',' + t.b) : '255,240,200';
      state.sparkles.forEach(function(s) {
        s.phase += s.phaseSpeed;
        var alpha = (Math.sin(s.phase) + 1) / 2;
        alpha = Math.pow(alpha, 3);
        if (alpha < 0.05) return;
        var g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 3);
        g.addColorStop(0, 'rgba(' + rgbStr + ',' + alpha + ')');
        g.addColorStop(1, 'rgba(' + rgbStr + ',0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + rgbStr + ',' + alpha + ')';
        ctx.fill();
      });
    }
  },

  /* ─── Olas ─── */
  olas: {
    id: 'olas', name: 'Olas', emoji: '🌊',
    description: 'Partículas que fluyen en ondas suaves.',
    price: 150, acceptsTint: true,
    init: function(W, H) {
      var particles = [];
      for (var i = 0; i < 120; i++) particles.push({
        x: Math.random() * W,
        baseY: Math.random() * H,
        r: 0.8 + Math.random() * 1.5,
        speed: 0.3 + Math.random() * 0.5,
        waveAmp: 20 + Math.random() * 40,
        waveFreq: 0.005 + Math.random() * 0.01,
        phase: Math.random() * Math.PI * 2,
        a: 0.3 + Math.random() * 0.5
      });
      return { particles: particles, t: 0 };
    },
    draw: function(ctx, W, H, state, opts) {
      ctx.clearRect(0, 0, W, H);
      state.t += 0.01;
      var t = opts.tint;
      var rgbStr = t ? (t.r + ',' + t.g + ',' + t.b) : '130,190,240';
      state.particles.forEach(function(p) {
        p.x += p.speed;
        if (p.x > W + 10) p.x = -10;
        var y = p.baseY + Math.sin(p.x * p.waveFreq + state.t + p.phase) * p.waveAmp;
        ctx.beginPath();
        ctx.arc(p.x, y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + rgbStr + ',' + p.a + ')';
        ctx.fill();
      });
    }
  }

};

/* ═══ Estado del tema (persistente) ═══ */
function getTheme(id) { return THEMES[id] || null; }

function isThemeUnlocked(id) {
  var t = THEMES[id];
  if (!t) return false;
  if (t.isDefault) return true;
  return !!unlockedIds['theme_' + id];
}

function unlockTheme(id) {
  if (!THEMES[id]) return;
  unlockedIds['theme_' + id] = true;
  if (typeof saveShopState === 'function') saveShopState();
}

function getCurrentThemeId() {
  try {
    var v = localStorage.getItem('azaria_theme');
    if (v && THEMES[v] && isThemeUnlocked(v)) return v;
  } catch (e) {}
  return 'estrellas';
}

function setCurrentTheme(id) {
  if (!isThemeUnlocked(id)) return false;
  try { localStorage.setItem('azaria_theme', id); } catch (e) {}
  applyTheme(id);
  return true;
}

function applyTheme(id) {
  document.body.dataset.theme = id;
  restartBackground();
  restartCombatBackground();
}

/* ═══ Renderizado de canvas ═══ */
var _bgRaf = null;
var _combatBgRaf = null;

function restartBackground() {
  if (_bgRaf) { cancelAnimationFrame(_bgRaf); _bgRaf = null; }
  var cvs = document.getElementById('stars');
  if (!cvs) return;
  _startThemeCanvas(cvs, false, function(raf) { _bgRaf = raf; });
}

function restartCombatBackground() {
  if (_combatBgRaf) { cancelAnimationFrame(_combatBgRaf); _combatBgRaf = null; }
  var cvs = document.getElementById('combatStars');
  if (!cvs) return;
  _startThemeCanvas(cvs, true, function(raf) { _combatBgRaf = raf; });
}

function _startThemeCanvas(cvs, isCombat, setRaf) {
  var ctx = cvs.getContext('2d');
  var themeId = getCurrentThemeId();
  var theme = getTheme(themeId) || THEMES.estrellas;
  var W = cvs.width = window.innerWidth;
  var H = cvs.height = window.innerHeight;
  var state = theme.init(W, H);

  // ✅ Transición suave del tinte de fondo
  cvs.style.transition = 'background-color 0.8s ease';
  cvs.dataset.currentTint = '';

  function resize() {
    W = cvs.width = window.innerWidth;
    H = cvs.height = window.innerHeight;
    state = theme.init(W, H);
  }
  window.addEventListener('resize', resize);

  function loop() {
    // ✅ Tinte de fondo sutil SOLO en combate con entorno activo
    var tintKey = '';
    if (isCombat && typeof combatEnvColor !== 'undefined' && combatEnvColor) {
      tintKey = combatEnvColor.r + ',' + combatEnvColor.g + ',' + combatEnvColor.b;
    }
    if (cvs.dataset.currentTint !== tintKey) {
      cvs.dataset.currentTint = tintKey;
      if (tintKey) {
        cvs.style.backgroundColor = 'rgba(' + tintKey + ', 0.12)';
      } else {
        cvs.style.backgroundColor = 'transparent';
      }
    }
    // ✅ Ya NO se pasa tint a theme.draw — las partículas mantienen sus colores naturales
    theme.draw(ctx, W, H, state, { isCombat: isCombat });
    setRaf(requestAnimationFrame(loop));
  }
  loop();
}

/* ═══ Modal de Ajustes ═══ */
function openSettingsModal() {
  var m = document.getElementById('settingsModal');
  if (!m) return;
  m.classList.add('open');
  document.body.style.overflow = 'hidden';
  renderSettingsApariencia();
}
function closeSettingsModal() {
  var m = document.getElementById('settingsModal');
  if (!m) return;
  m.classList.remove('open');
  document.body.style.overflow = '';
}

function renderSettingsApariencia() {
  var panel = document.getElementById('settingsPanelApariencia');
  if (!panel) return;
  var current = getCurrentThemeId();
  var html = '<div class="settings-section"><div class="settings-section-title">🎨 Tema de fondo</div>';
  html += '<p class="settings-section-hint">Cambia el fondo animado de toda la aplicación. Algunos temas cambian de color durante el combate según el entorno activo.</p>';
  html += '<div class="settings-theme-grid">';
  Object.keys(THEMES).forEach(function(id) {
    var t = THEMES[id];
    var unlocked = isThemeUnlocked(id);
    var isActive = (id === current);
    var cls = 'settings-theme-card';
    if (isActive) cls += ' active';
    if (!unlocked) cls += ' locked';
    html += '<div class="' + cls + '" data-theme-id="' + id + '">';
    html += '<div class="theme-card-emoji">' + t.emoji + '</div>';
    html += '<div class="theme-card-name">' + t.name + '</div>';
    html += '<div class="theme-card-desc">' + t.description + '</div>';
    if (isActive) html += '<div class="theme-card-action theme-card-action-active">✓ En uso</div>';
    else if (unlocked) html += '<div class="theme-card-action">Activar</div>';
    else html += '<div class="theme-card-action theme-card-action-locked">🔒 💎 ' + t.price + '</div>';
    html += '</div>';
  });
  html += '</div></div>';
  panel.innerHTML = html;

  panel.querySelectorAll('.settings-theme-card').forEach(function(card) {
    card.addEventListener('click', function() {
      var id = card.dataset.themeId;
      if (!isThemeUnlocked(id)) {
        if (typeof showTeamMissingToast === 'function') showTeamMissingToast('🔒 Este tema está bloqueado. Cómpralo en la Tienda o canjea el código <strong>AZARIATCG</strong>.');
        return;
      }
      if (id === getCurrentThemeId()) return;
      setCurrentTheme(id);
      renderSettingsApariencia();
      if (typeof playSound === 'function') playSound('confirm');
    });
  });
}

/* ═══ Modal de detalle de tema (Tienda) ═══ */
function showThemeDetail(id) {
  var t = THEMES[id];
  if (!t) return;
  var ov = document.getElementById('cardInfoDialog');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = 'cardInfoDialog';
    ov.className = 'card-info-dialog';
    document.body.appendChild(ov);
  }
  var unlocked = isThemeUnlocked(id);
  var html = '<div class="card-info-content" style="--dc: 240,200,96;">' +
    '<button class="card-info-close" id="cardInfoClose" aria-label="Cerrar">✕</button>' +
    '<div class="card-info-emoji">' + t.emoji + '</div>' +
    '<div class="card-info-name">' + t.name + '</div>' +
    '<div class="card-info-cat" style="--cat: 240,200,96;">🎨 Tema de fondo</div>' +
    '<div class="card-info-effect">' + t.description + '</div>';
  if (!unlocked) {
    html += '<div class="shop-buy-bar" style="margin-top:0.8rem;padding:0.6rem 0;background:none;border-top:1px solid rgba(240,200,96,0.2);">' +
      '<div class="shop-buy-price">💎 ' + t.price + '</div>' +
      '<button class="shop-buy-btn" id="themeBuyBtn">Comprar</button></div>';
  } else {
    html += '<div class="shop-buy-bar" style="margin-top:0.8rem;padding:0.6rem 0;background:none;border-top:1px solid rgba(240,200,96,0.2);"><div class="shop-buy-owned">✓ Ya lo tienes</div></div>';
  }
  html += '</div>';
  ov.innerHTML = html;
  ov.classList.add('show');
  document.getElementById('cardInfoClose').addEventListener('click', function() { ov.classList.remove('show'); });
  var bb = document.getElementById('themeBuyBtn');
  if (bb) bb.addEventListener('click', function() {
    if (typeof buyShopItem === 'function') buyShopItem(id, 'themes');
  });
}

/* ═══ Init ═══ */
function initThemes() {
  // Nav
  var navBtn = document.getElementById('settingsNavBtn');
  if (navBtn) navBtn.addEventListener('click', function(e) { e.preventDefault(); openSettingsModal(); });
  var closeBtn = document.getElementById('settingsCloseBtn');
  if (closeBtn) closeBtn.addEventListener('click', closeSettingsModal);
  var backdrop = document.getElementById('settingsBackdrop');
  if (backdrop) backdrop.addEventListener('click', closeSettingsModal);
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      var m = document.getElementById('settingsModal');
      if (m && m.classList.contains('open')) closeSettingsModal();
    }
  });

  // Tabs (de momento solo Apariencia, pero preparado para futuros)
  document.querySelectorAll('.settings-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      var tabKey = tab.dataset.settingsTab;
      document.querySelectorAll('.settings-tab').forEach(function(t) { t.classList.toggle('active', t.dataset.settingsTab === tabKey); });
      document.querySelectorAll('.settings-panel').forEach(function(p) { p.classList.remove('active'); });
      var panel = document.getElementById('settingsPanel' + tabKey.charAt(0).toUpperCase() + tabKey.slice(1));
      if (panel) panel.classList.add('active');
    });
  });

  // Aplicar tema guardado
  applyTheme(getCurrentThemeId());
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initThemes);
else initThemes();