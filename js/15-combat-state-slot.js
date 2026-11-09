var combatStarsInited = false;
function initCombatStars() {
  if (combatStarsInited) return; combatStarsInited = true;
  var cvs = document.getElementById('combatStars'); if (!cvs) return;
  var cctx = cvs.getContext('2d'), cs = [], cW, cH;
  function resizeC() { cW = cvs.width = window.innerWidth; cH = cvs.height = window.innerHeight; cs = []; for (var i = 0; i < 140; i++) cs.push({ x:Math.random()*cW, y:Math.random()*cH, r:Math.random()*1.4+0.3, vx:(Math.random()-0.5)*0.12, vy:(Math.random()-0.5)*0.12, a:Math.random()*0.5+0.2 }); }
  function drawC() {
    cctx.clearRect(0, 0, cW, cH);

    // ✅ Color de las estrellas según entorno activo (o dorado por defecto)
    var starFillColor = combatEnvColor
      ? 'rgba(' + combatEnvColor.r + ', ' + combatEnvColor.g + ', ' + combatEnvColor.b + ', '
      : 'rgba(240, 220, 180, ';
    var starLineBase = combatEnvColor
      ? 'rgba(' + combatEnvColor.r + ', ' + combatEnvColor.g + ', ' + combatEnvColor.b + ', '
      : 'rgba(240, 200, 96, ';

    for (var i = 0; i < cs.length; i++) {
      var s = cs[i];
      s.x += s.vx; s.y += s.vy;
      if (s.x < 0) s.x = cW; if (s.x > cW) s.x = 0;
      if (s.y < 0) s.y = cH; if (s.y > cH) s.y = 0;
      cctx.beginPath();
      cctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      cctx.fillStyle = starFillColor + s.a + ')';
      cctx.fill();
    }
    for (var p = 0; p < cs.length; p++) for (var q = p + 1; q < cs.length; q++) {
      var dx = cs[p].x - cs[q].x, dy = cs[p].y - cs[q].y, d = Math.sqrt(dx*dx + dy*dy);
      if (d < 120) {
        cctx.beginPath();
        cctx.moveTo(cs[p].x, cs[p].y);
        cctx.lineTo(cs[q].x, cs[q].y);
        cctx.strokeStyle = starLineBase + ((1 - d/120) * 0.12) + ')';
        cctx.lineWidth = 0.5;
        cctx.stroke();
      }
    }
    requestAnimationFrame(drawC);
  }
  window.addEventListener('resize', resizeC); resizeC(); drawC();

  var envDisplay = document.getElementById('combatEnvironmentDisplay');
  if (envDisplay && !envDisplay.dataset.bound) {
    envDisplay.dataset.bound = '1';
    envDisplay.addEventListener('mouseenter', function() {
      if (!combatState || !combatState.environment) return;
      var env = combatState.environment;
      hoverTooltip.innerHTML =
        '<div class="ht-header">🌍 Entorno activo</div>' +
        '<div class="ht-name">' + (env.def.emoji || '🌍') + ' ' + env.name + '</div>' +
        '<div class="ht-sub">' + ELEMENT_EMOJI[env.element] + ' ' + ELEMENT_NAMES[env.element] + ' · ' + env.roundsLeft + ' ronda(s) restantes</div>' +
        '<div class="ht-effect">' + env.def.effectText + '</div>';
      hoverTooltip.classList.add('show');
      positionTooltip(hoverTooltip, envDisplay.getBoundingClientRect(), 'above');
    });
    envDisplay.addEventListener('mouseleave', hideTooltip);
  }
}

var COMBAT_SLOT_COUNT = 3;
var currentCombatSlot = null;

function getCombatSlotKey(s){ return 'azaria_saved_combat_' + currentSlotMode + '_' + s; }
function getSavedCombat(s){ try { var st = localStorage.getItem(getCombatSlotKey(s)); if (!st) return null; var p = JSON.parse(st); if (p.phase === 'ended') return null; return p; } catch (e) { return null; } }
function saveCombatToSlot(s){ if (!combatState || combatState.phase === 'ended') return; if (!currentSlotMode) return; combatState.player.dice.forEach(function(d){ d.justAdded = false; }); try { localStorage.setItem(getCombatSlotKey(s), JSON.stringify(combatState)); } catch (e) {} }
function clearCombatSlot(s){ try { localStorage.removeItem(getCombatSlotKey(s)); } catch (e) {} }
function saveCombatState(){ if (!combatState || combatState.phase === 'ended') return; if (currentCombatSlot === null) return; saveCombatToSlot(currentCombatSlot); }
function clearSavedCombat(){ if (currentCombatSlot === null) return; clearCombatSlot(currentCombatSlot); }
function findEmptyCombatSlot(){ for (var i = 0; i < COMBAT_SLOT_COUNT; i++) if (!getSavedCombat(i)) return i; return -1; }
function hasAnySavedCombat(){ for (var i = 0; i < COMBAT_SLOT_COUNT; i++) if (getSavedCombat(i)) return true; return false; }

var combatState = null;
function rollCombatDice(baseCount) { var t = CONSONANCE_ORDER, d = []; for (var i = 0; i < baseCount; i++) { if (Math.random() < 0.125) d.push({ type:'omni', id:uid() }); else d.push({ type:t[Math.floor(Math.random()*7)], id:uid() }); } return d; }
function logCombat(msg){ if (!combatState) return; combatState.log.push(msg); if (combatState.log.length > 100) combatState.log.shift(); }
function showTeamMissingToast(msg) {
  var ex = document.querySelector('.team-missing-toast'); if (ex) ex.remove();
  var toast = document.createElement('div'); toast.className = 'team-missing-toast';
  toast.innerHTML = '<span class="team-missing-toast-icon">⚠️</span>' + msg;
  document.body.appendChild(toast); playSound('warning');
  setTimeout(function(){ toast.classList.add('show'); }, 10);
  setTimeout(function(){ toast.classList.remove('show'); setTimeout(function(){ if (toast.parentNode) toast.remove(); }, 400); }, 3500);
}
function scrollToCollection(){ setTimeout(function(){ var s = document.getElementById('cartas'); if (s) s.scrollIntoView({ behavior:'smooth', block:'start' }); }, 250); }
function scrollToDeck(){ setTimeout(function(){ var s = document.getElementById('mazo'); if (s) s.scrollIntoView({ behavior:'smooth', block:'start' }); }, 300); }
function drawFromDeck(who) {
  var side = combatState[who]; if (!side.discardPile) side.discardPile = [];
  if (side.deck.length === 0) {
    if (side.discardPile.length > 0) {
      side.deck = shuffleArray(side.discardPile.slice());
      side.discardPile = [];
      logCombat('♻️ Descarte barajado (' + side.deck.length + ')');
    } else return null;
  }
  var cid = side.deck.shift();
  // ✅ Auto-trigger de cartas de peluche
  if (typeof PLUSH_CARDS !== 'undefined' && PLUSH_CARDS[cid] && PLUSH_CARDS[cid].autoTrigger) {
    side.discardPile.push(cid);
    if (typeof triggerPlushOnDraw === 'function') triggerPlushOnDraw(who, cid);
    return cid;
  }
  side.hand.push(cid);
  return cid;
}
