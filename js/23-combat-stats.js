/* ═══════════════════════════════════════════════════════════════════
   STATS + REPLAYS + TIMER DE TURNO
   ═══════════════════════════════════════════════════════════════════ */

/* ─── INIT de stats al arrancar un combate ─── */
function initCombatStats() {
  if (!combatState) return;
  if (combatState.stats) {
    // Save antiguo: asegurar campos nuevos sin romper datos
    if (!combatState.stats.snapshots) combatState.stats.snapshots = [];
    if (!combatState.stats.startTime) combatState.stats.startTime = Date.now();
    return;
  }
  var blank = function() { return { damageDealt: 0, damageTaken: 0, healing: 0, cardsPlayed: 0, diceSpent: 0, energySpent: 0 }; };
  combatState.stats = { player: blank(), bot: blank(), startTime: Date.now(), snapshots: [] };
}

function _statsSideForCs(cs) {
  if (!combatState || !combatState.stats || !cs) return null;
  if (combatState.player.characters.indexOf(cs) >= 0) return combatState.stats.player;
  if (combatState.bot.characters.indexOf(cs) >= 0) return combatState.stats.bot;
  return null;
}

function _ensureCharStats(cs) {
  if (!cs) return null;
  if (!cs._stats) cs._stats = { damageDealt: 0, damageTaken: 0, healing: 0 };
  return cs._stats;
}

/* ─── Hooks de tracking ─── */
function trackDamage(targetCs, amount, attackerCs) {
  if (!combatState || !combatState.stats || !amount || amount <= 0) return;
  var tSide = _statsSideForCs(targetCs);
  if (tSide) tSide.damageTaken += amount;
  if (targetCs) { var tCharS = _ensureCharStats(targetCs); if (tCharS) tCharS.damageTaken += amount; }
  if (attackerCs) {
    var aSide = _statsSideForCs(attackerCs);
    if (aSide) aSide.damageDealt += amount;
    var aCharS = _ensureCharStats(attackerCs);
    if (aCharS) aCharS.damageDealt += amount;
  }
}
function trackHeal(cs, amount) {
  if (!combatState || !combatState.stats || !amount || amount <= 0) return;
  var side = _statsSideForCs(cs);
  if (side) side.healing += amount;
  var charS = _ensureCharStats(cs);
  if (charS) charS.healing += amount;
}
function trackCardPlayed(who) {
  if (!combatState || !combatState.stats) return;
  var s = combatState.stats[who];
  if (s) s.cardsPlayed += 1;
}
function trackDiceSpent(who, n) {
  if (!combatState || !combatState.stats || !n) return;
  var s = combatState.stats[who];
  if (s) s.diceSpent += n;
}
function trackEnergySpent(who, n) {
  if (!combatState || !combatState.stats || !n) return;
  var s = combatState.stats[who];
  if (s) s.energySpent += n;
}

/* ─── Snapshot al final de cada ronda ─── */
function captureRoundSnapshot() {
  if (!combatState || !combatState.stats) return;
  var snap = {
    round: combatState.round,
    timestamp: Date.now() - combatState.stats.startTime,
    player: { hp: [], maxHp: [], names: [] },
    bot:    { hp: [], maxHp: [], names: [] },
    stats:  { player: JSON.parse(JSON.stringify(combatState.stats.player)), bot: JSON.parse(JSON.stringify(combatState.stats.bot)) },
    logIndex: combatState.log.length
  };
  ['player','bot'].forEach(function(sk){
    combatState[sk].characters.forEach(function(c){
      snap[sk].hp.push(c.dead ? 0 : c.hp);
      snap[sk].maxHp.push(c.maxHp);
      snap[sk].names.push(c.character.name);
    });
  });
  combatState.stats.snapshots.push(snap);
  if (combatState.stats.snapshots.length > 50) combatState.stats.snapshots.shift();
  try { saveCombatState(); } catch(e) {}
}

/* ─── Panel sidebar compacto ─── */
function renderCombatStatsSidebar() {
  var c = document.getElementById('combatStatsInline');
  if (!c || !combatState || !combatState.stats) return;
  var p = combatState.stats.player, b = combatState.stats.bot;
  c.innerHTML =
    '<div class="csi-row"><span class="csi-label">⚔️ Tú</span>' +
      '<span class="csi-val" title="Daño infligido">🗡️ ' + p.damageDealt + '</span>' +
      '<span class="csi-val" title="Daño recibido">💔 ' + p.damageTaken + '</span>' +
      '<span class="csi-val" title="Curado">💚 ' + p.healing + '</span>' +
    '</div>' +
    '<div class="csi-row"><span class="csi-label">📖 Rival</span>' +
      '<span class="csi-val" title="Daño infligido">🗡️ ' + b.damageDealt + '</span>' +
      '<span class="csi-val" title="Daño recibido">💔 ' + b.damageTaken + '</span>' +
      '<span class="csi-val" title="Curado">💚 ' + b.healing + '</span>' +
    '</div>';
}

/* ─── Modal de stats + replay ─── */
function openStatsModal() {
  // ✅ NO tocar body.overflow: el combate ya lo tiene bloqueado
  if (!combatState || !combatState.stats) {
    if (typeof showTeamMissingToast === 'function') showTeamMissingToast('No hay stats disponibles.');
    return;
  }
  var m = document.getElementById('statsModal');
  if (!m) return;
  renderStatsModal();
  m.classList.add('open');
}

function closeStatsModal() {
  var m = document.getElementById('statsModal');
  if (m) m.classList.remove('open');
  // ✅ Solo restaurar scroll si NO hay combate abierto
  if (!document.querySelector('.combat-modal.open')) {
    document.body.style.overflow = '';
  }
}
function renderStatsModal() {
  var body = document.getElementById('statsBody');
  if (!body || !combatState || !combatState.stats) return;
  var stats = combatState.stats;
  var html = '';

  // ── Resumen ──
  var elapsed = Math.round((Date.now() - stats.startTime) / 1000);
  html += '<div class="stats-section">';
  html += '<div class="stats-sec-title">📊 Resumen de la partida</div>';
  html += '<div class="stats-summary">';
  html += '<div class="stats-summ-item"><div class="ssi-label">Rondas</div><div class="ssi-value">' + (combatState.round) + '</div></div>';
  html += '<div class="stats-summ-item"><div class="ssi-label">Duración</div><div class="ssi-value">' + elapsed + 's</div></div>';
  html += '</div>';
  html += '</div>';

  // ── Tabla por lado ──
  var rows = [
    ['Daño infligido', 'damageDealt', '🗡️'],
    ['Daño recibido', 'damageTaken', '💔'],
    ['Curación', 'healing', '💚'],
    ['Cartas jugadas', 'cardsPlayed', '🎴'],
    ['Dados gastados', 'diceSpent', '🎲'],
    ['Energía gastada', 'energySpent', '⚡']
  ];
  html += '<div class="stats-section">';
  html += '<div class="stats-sec-title">🎯 Comparativa</div>';
  html += '<table class="stats-table"><thead><tr><th></th><th>⚔️ Tú</th><th>📖 Rival</th></tr></thead><tbody>';
  rows.forEach(function(r){
    html += '<tr><td>' + r[2] + ' ' + r[0] + '</td><td>' + stats.player[r[1]] + '</td><td>' + stats.bot[r[1]] + '</td></tr>';
  });
  html += '</tbody></table>';
  html += '</div>';

  // ── Replay: timeline de rondas ──
  html += '<div class="stats-section">';
  html += '<div class="stats-sec-title">🎬 Timeline por ronda</div>';
  if (!stats.snapshots || !stats.snapshots.length) {
    html += '<div class="stats-empty">Aún no ha terminado ninguna ronda.</div>';
  } else {
    html += '<div class="stats-timeline">';
    stats.snapshots.forEach(function(s, idx){
      html += '<div class="stats-snap">';
      html += '<div class="snap-header">Ronda ' + s.round + ' · ' + Math.round(s.timestamp / 1000) + 's</div>';
      ['player','bot'].forEach(function(sk){
        var label = sk === 'player' ? '⚔️' : '📖';
        html += '<div class="snap-team">' + label + ' ';
        s[sk].names.forEach(function(n, i){
          var pct = s[sk].maxHp[i] ? Math.round(s[sk].hp[i] / s[sk].maxHp[i] * 100) : 0;
          var col = pct > 60 ? '#7aff9a' : pct > 30 ? '#f0c860' : '#ff5a6e';
          html += '<span class="snap-char" style="--hp-pct:' + pct + '%; --hp-col:' + col + ';" title="' + n + ' ' + s[sk].hp[i] + '/' + s[sk].maxHp[i] + '">' +
                  '<span class="snap-char-name">' + n.substring(0, 2) + '</span>' +
                  '<span class="snap-char-hp" style="color:' + col + ';">' + s[sk].hp[i] + '</span></span>';
        });
        html += '</div>';
      });
      html += '</div>';
    });
    html += '</div>';
  }
  html += '</div>';

  // ── Log completo ──
  html += '<div class="stats-section">';
  html += '<div class="stats-sec-title">📜 Log completo</div>';
  html += '<div class="stats-log">';
  (combatState.log || []).forEach(function(l){ html += '<div class="stats-log-line">' + l + '</div>'; });
  html += '</div></div>';

  body.innerHTML = html;
}

/* ─── MVP al final del combate ─── */
function renderMVPSection(winnerKey) {
  if (!combatState || !combatState.stats) return '';
  var sides = ['player','bot'];
  var candidates = [];
  sides.forEach(function(sk){
    combatState[sk].characters.forEach(function(c){
      var s = c._stats || { damageDealt: 0, damageTaken: 0, healing: 0 };
      var score = s.damageDealt * 2 + s.healing * 1.5 - s.damageTaken * 0.2;
      candidates.push({
        name: c.character.name,
        side: sk,
        emoji: c.character.emoji,
        score: score,
        stats: s
      });
    });
  });
  candidates.sort(function(a,b){ return b.score - a.score; });
  var mvp = candidates[0];
  if (!mvp || mvp.score <= 0) return '';
  var col = mvp.side === 'player' ? '#f0c860' : '#ff8a98';
  var html = '<div class="mvp-box" style="--mvp-col: ' + col + ';">';
  html += '<div class="mvp-title">🏆 MVP de la partida</div>';
  html += '<div class="mvp-name">' + mvp.emoji + ' ' + mvp.name + '</div>';
  html += '<div class="mvp-stats">🗡️ ' + mvp.stats.damageDealt + ' · 💚 ' + mvp.stats.healing + ' · 💔 ' + mvp.stats.damageTaken + '</div>';
  html += '</div>';
  return html;
}

/* ─── Timer de turno ─── */
var TURN_TIMER_OPTIONS = [0, 15, 30, 60];
function getTurnTimerSeconds() {
  try { return parseInt(localStorage.getItem('azaria_turn_timer') || '0', 10) || 0; } catch(e) { return 0; }
}
function setTurnTimerSeconds(n) {
  try { localStorage.setItem('azaria_turn_timer', String(n)); } catch(e) {}
}
function cycleTurnTimer() {
  var current = getTurnTimerSeconds();
  var idx = TURN_TIMER_OPTIONS.indexOf(current);
  var next = TURN_TIMER_OPTIONS[(idx + 1) % TURN_TIMER_OPTIONS.length];
  setTurnTimerSeconds(next);
  updateTurnTimerButton();
  playSound('select');
}

var _turnTimerInterval = null;
var _turnTimerRemaining = 0;

function updateTurnTimerButton() {
  var btn = document.getElementById('turnTimerBtn');
  if (!btn) return;
  var secs = getTurnTimerSeconds();
  if (secs === 0) {
    btn.textContent = '∞';
    btn.title = 'Sin límite de turno (clic para cambiar)';
    btn.classList.remove('active', 'warning');
  } else if (_turnTimerRemaining > 0 && _turnTimerRemaining <= secs) {
    btn.textContent = _turnTimerRemaining + 's';
    btn.title = 'Tiempo restante en este turno';
    btn.classList.add('active');
    btn.classList.toggle('warning', _turnTimerRemaining <= 5);
  } else {
    btn.textContent = secs + 's';
    btn.title = 'Límite: ' + secs + 's (clic para cambiar)';
    btn.classList.add('active');
    btn.classList.remove('warning');
  }
}

function startTurnTimer() {
  stopTurnTimer();
  var secs = getTurnTimerSeconds();
  if (secs === 0) return;
  if (!combatState || combatState.phase !== 'playing') return;
  if (!combatState.pvp && combatState.turn !== 'player') return;
  _turnTimerRemaining = secs;
  updateTurnTimerButton();
  _turnTimerInterval = setInterval(function() {
    if (!combatState || combatState.phase !== 'playing') { stopTurnTimer(); return; }
    _turnTimerRemaining--;
    updateTurnTimerButton();
    if (_turnTimerRemaining <= 0) {
      stopTurnTimer();
      if (combatState && !isTurnDone()) {
        logCombat('⏱️ Tiempo agotado → fin de turno automático');
        declareEnd(getTurnKey());
      }
    }
  }, 1000);
}

function stopTurnTimer() {
  if (_turnTimerInterval) { clearInterval(_turnTimerInterval); _turnTimerInterval = null; }
  _turnTimerRemaining = 0;
  updateTurnTimerButton();
}
function updateTurnTimerDisplay() {
  var el = document.getElementById('turnTimerDisplay');
  if (!el) return;
  var secs = getTurnTimerSeconds();
  if (secs === 0) { el.hidden = true; return; }
  el.hidden = false;
  el.textContent = '⏱️ ' + (_turnTimerRemaining > 0 ? _turnTimerRemaining : secs) + 's';
  el.classList.toggle('warning', _turnTimerRemaining > 0 && _turnTimerRemaining <= 5);
}

/* ─── Init ─── */
(function initCombatStatsSystem() {
  // Hook initCombatStats en los flujos de arranque
  var origStartCombat = window.startCombat;
  // Simplemente: llamar initCombatStats cada vez que se renderiza
  var origRenderCombat = typeof renderCombat === 'function' ? renderCombat : null;
  // Poll cada 500ms para detectar nuevo combate y reiniciar stats
  var lastCombatId = null;
  setInterval(function() {
    if (combatState && !combatState.stats) initCombatStats();
    if (combatState) {
      var cid = combatState.stats && combatState.stats.startTime;
      if (cid !== lastCombatId) {
        lastCombatId = cid;
        renderCombatStatsSidebar();
      }
    }
    renderCombatStatsSidebar();
  }, 700);

  // Enganchar al final de ronda
  var _origEndRound = window.endRound;
  if (typeof _origEndRound === 'function') {
    window.endRound = function() {
      var res = _origEndRound.apply(this, arguments);
      setTimeout(function() { try { captureRoundSnapshot(); } catch(e) {} }, 50);
      return res;
    };
  }

  // Enganchar al final de combate
  var _origEndCombat = window.endCombat;
  if (typeof _origEndCombat === 'function') {
    window.endCombat = function(winner) {
      var res = _origEndCombat.apply(this, arguments);
      setTimeout(function() {
        try {
          captureRoundSnapshot();
          var mvp = renderMVPSection(winner);
          var endSub = document.getElementById('combatEndSub');
          if (endSub && mvp) {
            var mvpHolder = document.getElementById('combatEndMVPHolder');
            if (!mvpHolder) {
              mvpHolder = document.createElement('div');
              mvpHolder.id = 'combatEndMVPHolder';
              endSub.parentNode.insertBefore(mvpHolder, endSub.nextSibling);
            }
            mvpHolder.innerHTML = mvp;
          }
        } catch(e) {}
      }, 100);
      return res;
    };
  }

  // Enganchar al inicio de turno para el timer
  var _origNextTurn = window.nextTurn;
  if (typeof _origNextTurn === 'function') {
    window.nextTurn = function() {
      var res = _origNextTurn.apply(this, arguments);
      setTimeout(function() { startTurnTimer(); }, 100);
      return res;
    };
  }
  var _origBeginRoundPlay = window.beginRoundPlay;
  if (typeof _origBeginRoundPlay === 'function') {
    window.beginRoundPlay = function() {
      var res = _origBeginRoundPlay.apply(this, arguments);
      setTimeout(function() { startTurnTimer(); }, 200);
      return res;
    };
  }

  // Cargar timer al iniciar
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', updateTurnTimerButton);
  else updateTurnTimerButton();
    
  // Bind botones
  document.addEventListener('click', function(e){
    if (e.target.closest('#statsBtn')) { e.preventDefault(); openStatsModal(); return; }
    if (e.target.closest('#statsCloseBtn') || e.target.closest('#statsBackdrop')) { e.preventDefault(); closeStatsModal(); return; }
    if (e.target.closest('#turnTimerBtn')) { e.preventDefault(); cycleTurnTimer(); return; }
  });
})();