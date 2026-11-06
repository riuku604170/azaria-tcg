function adjustCardCostForPassives(card, side) {
  var adjusted = {};
  Object.keys(card.cost || {}).forEach(function(k){ adjusted[k] = card.cost[k]; });
  if (card.category === 'equipo') { var oa = side.characters.some(function(c){ return c.id === 'oliver' && !c.dead; }); if (oa) { if (adjusted.any && adjusted.any > 0) adjusted.any = Math.max(0, adjusted.any - 1); else if (adjusted.same && adjusted.same > 0) adjusted.same = Math.max(0, adjusted.same - 1); } }
  if (card.tag === 'Curación') { var na = side.characters.some(function(c){ return c.id === 'noah' && !c.dead; }); if (na) { if (adjusted.any && adjusted.any > 0) adjusted.any = Math.max(0, adjusted.any - 1); else if (adjusted.same && adjusted.same > 0) adjusted.same = Math.max(0, adjusted.same - 1); } }
  // ✅ Facebook: siguiente carta -1 dado (se consume al jugarla)
  var act = side.characters[side.activeIndex];
  if (act && act.nextCardDiscount > 0) {
    var rem = act.nextCardDiscount;
    if (adjusted.any && adjusted.any > 0) { var r1 = Math.min(adjusted.any, rem); adjusted.any -= r1; rem -= r1; if (adjusted.any === 0) delete adjusted.any; }
    if (rem > 0 && adjusted.same && adjusted.same > 0) { var r2 = Math.min(adjusted.same, rem); adjusted.same -= r2; rem -= r2; if (adjusted.same === 0) delete adjusted.same; }
    if (rem > 0) {
      var keys = Object.keys(adjusted);
      for (var i = 0; i < keys.length && rem > 0; i++) {
        var k = keys[i];
        if (k === 'any' || k === 'same') continue;
        var take = Math.min(adjusted[k], rem);
        adjusted[k] -= take; rem -= take;
        if (adjusted[k] === 0) delete adjusted[k];
      }
    }
  }
  // ✅ EX Josemi (Arquitectura Creativa): cartas de apoyo cuestan 1 dado menos
  if (card.category === 'apoyo') {
    var josemiEx = side.characters.find(function(c){ return c.id === 'josemi' && c.exActive && !c.dead; });
    if (josemiEx) {
      if (adjusted.any && adjusted.any > 0) adjusted.any = Math.max(0, adjusted.any - 1);
      else if (adjusted.same && adjusted.same > 0) adjusted.same = Math.max(0, adjusted.same - 1);
      else {
        var _jk = Object.keys(adjusted);
        for (var _ji = 0; _ji < _jk.length; _ji++) {
          var _jk2 = _jk[_ji];
          if (_jk2 === 'any' || _jk2 === 'same') continue;
          adjusted[_jk2] = Math.max(0, adjusted[_jk2] - 1);
          if (adjusted[_jk2] === 0) delete adjusted[_jk2];
          break;
        }
      }
      if (adjusted.any === 0) delete adjusted.any;
      if (adjusted.same === 0) delete adjusted.same;
    }
  }
  return adjusted;
}
function applyCardEffect(card) {
  var side = getActiveSide(); if (!side || !combatState) return;
  var enemySide = combatState[getEnemyKey()];
  var active = side.characters[side.activeIndex]; if (!active || active.dead) return;
  var enemyActive = enemySide.characters[enemySide.activeIndex];
  switch (card.effectType) {
    case 'nextAttackBonus': active.cardNextAttackBonus = (active.cardNextAttackBonus || 0) + card.value; logCombat('🎴 Próximo ataque +' + card.value); break;
    case 'nextAttackPiercing': active.cardNextAttackPiercing = true; logCombat('🎴 Próximo ataque penetrante'); break;
    case 'nextAttackDouble': active.cardNextAttackDouble = true; logCombat('🎴 Próximo ataque x2'); break;
    case 'nextAttackCritical': active.cardNextAttackBonus = (active.cardNextAttackBonus || 0) + card.value; active.cardNextAttackPiercing = true; break;
    case 'heal': healChar(active, card.value); break;
    case 'healAll': side.characters.forEach(function(c){ if (!c.dead) healChar(c, card.value); }); break;
    case 'shield': addOrRefreshShield(active, 'card_' + card.id, card.value); playSound('shield'); break;
    case 'shieldAll': side.characters.forEach(function(c){ if (!c.dead) addOrRefreshShield(c, 'card_' + card.id, card.value); }); break;
    case 'removeEnemyShields': enemyActive.shields = []; logCombat('🎴 Escudos enemigos eliminados'); break;
    case 'energy': active.energy = Math.min(active.maxEnergy, active.energy + card.value); break;
    case 'drawDiceOfActive': for (var i = 0; i < card.value; i++) side.dice.push({ type:active.character.element, id:uid(), justAdded:true }); break;
    case 'drawTeamDice': var dr = 0; side.characters.forEach(function(c){ if (!c.dead && dr < 3) { side.dice.push({ type:c.character.element, id:uid(), justAdded:true }); dr++; } }); break;
    case 'rerollDice': { var te = computeTeamElements(side); var tE = active.character.element; var s = side.dice.slice().sort(function(a, b){ return getDiePriority(b, te, tE) - getDiePriority(a, te, tE); }); s.slice(0, Math.min(card.value, s.length)).forEach(function(d){ if (Math.random() < 0.125) d.type = 'omni'; else d.type = CONSONANCE_ORDER[Math.floor(Math.random() * 7)]; }); break; }
    case 'convertDice': { var te2 = computeTeamElements(side); var tE2 = active.character.element; var s2 = side.dice.slice().sort(function(a, b){ return getDiePriority(b, te2, tE2) - getDiePriority(a, te2, tE2); }); s2.slice(0, Math.min(card.value, s2.length)).forEach(function(d){ if (d.type !== tE2) d.type = tE2; }); break; }
    case 'sacrificeDie': { if (side.dice.length > 0) { var te3 = computeTeamElements(side); var tE3 = active.character.element; var w = side.dice.slice().sort(function(a, b){ return getDiePriority(b, te3, tE3) - getDiePriority(a, te3, tE3); })[0]; side.dice = side.dice.filter(function(d){ return d.id !== w.id; }); for (var k = 0; k < 2; k++) side.dice.push({ type:tE3, id:uid(), justAdded:true }); } break; }
    case 'quickChange': {
      var ni = getNextAliveIndex(side, side.activeIndex);
      if (ni >= 0) {
        var oldG = side.characters[side.activeIndex];
        side.activeIndex = ni;
        if (typeof applyGoogleExOnChange === 'function') applyGoogleExOnChange(oldG, side, ni, getTurnKey());
      }
      break;
    }
    case 'nextAbilityDiscount': active.cardNextAbilityDiscount = (active.cardNextAbilityDiscount || 0) + card.value; break;
    case 'nextAbilityFree': active.cardNextAbilityFree = true; break;
    case 'markEnemy': enemyActive.cardMarkBonus = (enemyActive.cardMarkBonus || 0) + card.value; break;
    case 'forceEnemyChange': { var niE = getNextAliveIndex(enemySide, enemySide.activeIndex); if (niE >= 0) { enemySide.activeIndex = niE; } break; }
    case 'enemyAttackDebuff': side.enemyAttackDebuff = (side.enemyAttackDebuff || 0) + card.value; break;
    case 'prepararContraataque': side.contraataque = (side.contraataque || 0) + (card.value || 2); break;
    case 'revive': {
      // Revive a un aliado caído (a elección). Solo si hay aliados caídos.
      var deadAllies = side.characters.filter(function(c){ return c.dead; });
      if (!deadAllies.length) { logCombat('❌ No hay aliados caídos para revivir'); playSound('error'); break; }
      // Por simplicidad: revivir al último caído (lastDeadAlly si existe) o al primero.
      var targetRev = null;
      if (side.lastDeadAlly) {
        targetRev = side.characters.find(function(c){ return c.id === side.lastDeadAlly && c.dead; });
      }
      if (!targetRev) targetRev = deadAllies[0];
      // Respetar "no puede ser resucitada" (Artemis)
      if (targetRev.id === 'artemis') { logCombat('❌ Artemis no puede ser revivida'); playSound('error'); break; }
      targetRev.dead = false;
      targetRev.hp = Math.min(card.value || 2, targetRev.maxHp);
      addOrRefreshShield(targetRev, 'resurreccion', 1);
      // Si es Adela y tiene marca, se transforma en Hunger
      if (targetRev.id === 'adela' && hasAnyMark(targetRev)) {
        transformAdelaToHunger(targetRev);
      }
      // Si es Hunger, se cura al máximo (pasiva)
      if (targetRev.id === 'hunger') {
        targetRev.hp = targetRev.maxHp;
      }
      logCombat('✝️ Resurrección: ' + targetRev.character.name + ' vuelve con ' + targetRev.hp + ' HP');
      break;
    }
  }
  // ✅ Hunger EX: Café solo le hace 2 de daño al usarlo
  if (card.id === 'c_cafe_solo' && active && active.id === 'hunger' && active.exActive) {
    var hSideKey = (combatState.player.characters.indexOf(active) >= 0) ? 'player' : 'bot';
    var hSide = combatState[hSideKey];
    var hIdx = hSide.characters.indexOf(active);
    dealDamageToChar(active, 2, { targetSide:hSide, targetSideKey:hSideKey, targetIdx:hIdx });
    logCombat('☕ Café amargo: Hunger recibe 2 de daño');
  }
}
function canPayCardCost(cost){ var side = getActiveSide(); if (!side) return false; var t = sumCost(cost); if (t === 0) return true; return trySpendDice(side.dice, cost).ok; }
function cardEnergyTargetType(card) {
  if (card.effectType === 'energy') return 'active';
  if (card.category === 'apoyo' && card.effect) {
    if (card.effect.energyPerRound) return 'active';
    if (card.effect.teamEnergyPerRound) return 'team';
  }
  if (card.category === 'equipo' && card.effect) {
    if (card.effect.teamEnergyBonus || card.effect.teamEnergyPerRound) return 'team';
    if (card.effect.energyBonus || card.effect.energyPerRound) return 'target';
  }
  return null;
}
function cardWouldGiveEnergyToArtemis(card, side) {
  var tt = cardEnergyTargetType(card);
  if (!tt) return false;
  if (tt === 'active') {
    var act = side.characters[side.activeIndex];
    return act && act.id === 'artemis';
  }
  if (tt === 'team') {
    return side.characters.some(function(c){ return c.id === 'artemis' && !c.dead; });
  }
  return false; // 'target' → se comprueba al elegir a quién equipar
}
function playCardRequest(cardId) {
  if (!combatState || combatState.phase !== 'playing') return;
  if (!canHumanControlCurrentTurn()) return;
  if (isTurnDone()) return;
  var side = getTurnSide(); if (!side) return;
  var card = CARD_DB[cardId] || PAINT_CARDS[cardId]; if (!card) return;

  if (card.oncePerRound && side.cardsUsedThisRound[cardId]) { playSound('error'); return; }
  if (card.oncePerGame && side.cardsUsedThisGame[cardId]) { playSound('error'); return; }

  var artemisBlock = cardWouldGiveEnergyToArtemis(card, side);
  var adjustedCost = adjustCardCostForPassives(card, side);
  // ✅ Hunger EX: Café solo gratis
  var hungerActive = side.characters[side.activeIndex];
  if (card.id === 'c_cafe_solo' && hungerActive && hungerActive.id === 'hunger' && hungerActive.exActive) {
    adjustedCost = {};
  }
  showCardConfirmation(cardId, adjustedCost, function(selectedDice){
    var spentIds = {}; selectedDice.forEach(function(d){ spentIds[d.id] = true; });
    side.dice = side.dice.filter(function(d){ return !spentIds[d.id]; });
    applyCardPlay(cardId, selectedDice);
  }, artemisBlock);
}
function finalizeCardPlay(cardId) {
  var card = CARD_DB[cardId] || PAINT_CARDS[cardId]; if (!card) return;
  var player = getActiveSide(); if (!player) return;
  // ✅ Facebook: consumir el descuento de carta
  var actDisc = player.characters[player.activeIndex];
  if (actDisc && actDisc.nextCardDiscount > 0) {
    actDisc.nextCardDiscount = 0;
    logCombat('📘 Protocolo de Seguridad: descuento consumido');
  }
  if (card.oncePerRound) player.cardsUsedThisRound[cardId] = true;
  if (card.oncePerGame) player.cardsUsedThisGame[cardId] = true;
  var hi = player.hand.indexOf(cardId); if (hi >= 0) player.hand.splice(hi, 1);
  if (!PAINT_CARDS[cardId]) { if (!player.discardPile) player.discardPile = []; player.discardPile.push(cardId); }
  playSound('card');
}
function refundDice(spent){ var side = getActiveSide(); if (!spent || !side) return; spent.forEach(function(d){ d.justAdded = false; side.dice.push(d); }); }
function applyCardPlay(cardId, spentDice) {
  if (!combatState) return;
  var card = CARD_DB[cardId] || PAINT_CARDS[cardId]; if (!card) return;
  var player = getActiveSide(); if (!player) return;
  if (card.category === 'pintura') {
    var erik = player.characters.find(function(c){ return c.id === 'erik' && !c.dead; });
    if (!erik) { playSound('error'); logCombat('❌ Erik no está en pie'); return; }
    if (erik.paintEquipped) { playSound('error'); logCombat('❌ Erik ya tiene pintura'); return; }
    finalizeCardPlay(cardId); erik.paintEquipped = card.paintColor; logCombat('🎨 ' + erik.character.name + ' equipa ' + card.name);
    renderCombat(); return;
  }
  if (card.category === 'equipo') {
    showEquipmentTargetDialog(cardId, function(ti, ri){
      finalizeCardPlay(cardId);
      var target = player.characters[ti];
      if (!target.equipment) target.equipment = [];
      if (ri >= 0) target.equipment[ri] = cardId; else target.equipment.push(cardId);
      var eq = CARD_DB[cardId];
      if (eq && eq.effect) {
        if (eq.effect.shieldBonus) addOrRefreshShield(target, 'eq_' + cardId, eq.effect.shieldBonus);
        if (eq.effect.energyBonus) target.energy = Math.min(target.maxEnergy, target.energy + eq.effect.energyBonus);
        if (eq.effect.healBonus) healChar(target, eq.effect.healBonus);
        if (eq.effect.selfDamage) { target.hp = Math.max(0, target.hp - eq.effect.selfDamage); if (target.hp <= 0) { var who = combatState.player.characters.indexOf(target) >= 0 ? 'player' : 'bot'; handleDeath(who, player.characters.indexOf(target)); } }
      }
      renderCombat();
    }, function cancel(){ refundDice(spentDice); renderCombat(); });
  } else if (card.category === 'apoyo') {
    if (!player.supports) player.supports = [null,null,null,null];
    var es = -1; for (var i = 0; i < 4; i++) if (!player.supports[i]) { es = i; break; }
    if (es === -1) {
      showSupportReplaceDialog(cardId, function(si){
        finalizeCardPlay(cardId);
        player.supports[si] = { cardId:cardId, duration:card.duration };
        if (card.effect && card.effect.shieldInstant) addOrRefreshShield(player.characters[player.activeIndex], 'support_' + cardId, card.effect.shieldInstant);
        if (card.effect && card.effect.teamShieldInstant) player.characters.forEach(function(c){ if (!c.dead) addOrRefreshShield(c, 'support_' + cardId, card.effect.teamShieldInstant); });
        renderCombat();
      }, function cancel(){ refundDice(spentDice); renderCombat(); });
    } else {
      finalizeCardPlay(cardId);
      player.supports[es] = { cardId:cardId, duration:card.duration };
      if (card.effect && card.effect.shieldInstant) addOrRefreshShield(player.characters[player.activeIndex], 'support_' + cardId, card.effect.shieldInstant);
      if (card.effect && card.effect.teamShieldInstant) player.characters.forEach(function(c){ if (!c.dead) addOrRefreshShield(c, 'support_' + cardId, card.effect.teamShieldInstant); });
      renderCombat();
    }
  } else { finalizeCardPlay(cardId); applyCardEffect(card); renderCombat(); }
}

function hideConfirmation(){ var ov = document.getElementById('confirmOverlay'); if (ov) ov.classList.remove('show'); }
function showEquipmentTargetDialog(cardId, onConfirm, onCancel) {
  var card = CARD_DB[cardId]; if (!card) return;
  var _targetType = cardEnergyTargetType(card);
  var _blocksArtemisTarget = (_targetType === 'target');
  var player = getActiveSide(); if (!player) return;
  if (silentActionApply) { onConfirm(player.activeIndex, (player.characters[player.activeIndex].equipment||[]).length >= 2 ? 0 : -1); return; }
  var ov = document.getElementById('confirmOverlay'), content = document.getElementById('confirmContent');
  if (!ov || !content) { onCancel(); return; }
  hideTooltip();
  var html = '<div class="confirm-title">⚔️ Equipar Carta</div><div class="confirm-subtitle">' + card.emoji + ' ' + card.name + '</div><div class="confirm-body">' + card.effectText + '</div><div class="confirm-char-selector">';
  player.characters.forEach(function(cs, i){
    if (cs.dead) return;
    var _isArtemisBlocked = _blocksArtemisTarget && cs.id === 'artemis';
    html += '<div class="confirm-char-option' + (_isArtemisBlocked ? ' confirm-char-option-blocked' : '') + '" data-idx="' + i + '" style="--el: ' + ELEMENT_COLORS[cs.character.element] + ';"' + (_isArtemisBlocked ? ' title="Artemis no puede recibir energía"' : '') + '><div class="confirm-char-emoji">' + cs.character.emoji + '</div><div class="confirm-char-name">' + cs.character.name + '</div><div class="confirm-char-equip">';
    if (!cs.equipment) cs.equipment = [];
    for (var ei = 0; ei < 2; ei++) { var eqId = cs.equipment[ei]; if (eqId && CARD_DB[eqId]) html += '<span class="confirm-char-equip-icon">' + CARD_DB[eqId].emoji + '</span>'; else html += '<span class="confirm-char-equip-empty">+</span>'; }
    html += '</div></div>';
  });
  html += '</div><div class="confirm-buttons"><button class="confirm-btn confirm-cancel" id="equipCancelBtn">Cancelar</button></div>';
  content.innerHTML = html;
  content.querySelectorAll('.confirm-char-option').forEach(function(el){ el.addEventListener('click', function(){
    if (el.classList.contains('confirm-char-option-blocked')) { playSound('error'); return; }
    var i = parseInt(el.dataset.idx, 10), t = player.characters[i];
    if (t.equipment && t.equipment.length >= 2) showEquipmentReplaceDialog(cardId, i, onConfirm, onCancel);
    else { hideConfirmation(); onConfirm(i, -1); }
  }); });
  document.getElementById('equipCancelBtn').addEventListener('click', function(){ hideConfirmation(); onCancel(); });
  ov.classList.add('show');
}
function showEquipmentReplaceDialog(cardId, ti, onConfirm, onCancel) {
  var card = CARD_DB[cardId]; if (!card) return;
  var player = getActiveSide(); if (!player) return;
  var target = player.characters[ti];
  var ov = document.getElementById('confirmOverlay'), content = document.getElementById('confirmContent');
  if (!ov || !content) { onCancel(); return; }
  var html = '<div class="confirm-title">⚠️ Reemplazar Equipamiento</div><div class="confirm-subtitle">' + target.character.name + '</div><div class="confirm-body">Selecciona el equipamiento a sustituir.</div><div class="confirm-char-equip-large">';
  for (var i = 0; i < 2; i++) { var eqId = target.equipment[i]; var eq = eqId ? CARD_DB[eqId] : null; if (eq) html += '<div class="confirm-equip-card" data-idx="' + i + '"><div class="confirm-equip-emoji">' + eq.emoji + '</div><div class="confirm-equip-name">' + eq.name + '</div><div class="confirm-equip-effect">' + eq.effectText + '</div></div>'; }
  html += '</div><div class="confirm-buttons"><button class="confirm-btn confirm-cancel" id="equipReplaceCancelBtn">Cancelar</button></div>';
  content.innerHTML = html;
  content.querySelectorAll('.confirm-equip-card').forEach(function(el){ el.addEventListener('click', function(){ var i = parseInt(el.dataset.idx, 10); hideConfirmation(); onConfirm(ti, i); }); });
  document.getElementById('equipReplaceCancelBtn').addEventListener('click', function(){ hideConfirmation(); onCancel(); });
  ov.classList.add('show');
}
function showSupportReplaceDialog(cardId, onConfirm, onCancel) {
  var card = CARD_DB[cardId]; if (!card) return;
  var player = getActiveSide(); if (!player) return;
  if (silentActionApply) { onConfirm(0); return; }
  var ov = document.getElementById('confirmOverlay'), content = document.getElementById('confirmContent');
  if (!ov || !content) { onCancel(); return; }
  var html = '<div class="confirm-title">⚠️ Apoyos Llenos</div><div class="confirm-subtitle">' + card.emoji + ' ' + card.name + '</div><div class="confirm-body">Selecciona un apoyo a sustituir.</div><div class="confirm-support-grid">';
  for (var i = 0; i < 4; i++) { var sp = player.supports[i]; if (sp) { var spc = CARD_DB[sp.cardId]; if (spc) html += '<div class="confirm-support-card" data-idx="' + i + '"><div class="confirm-support-emoji">' + spc.emoji + '</div><div class="confirm-support-name">' + spc.name + '</div><div class="confirm-support-duration">⏳ ' + sp.duration + ' r</div></div>'; } }
  html += '</div><div class="confirm-buttons"><button class="confirm-btn confirm-cancel" id="supportReplaceCancelBtn">Cancelar</button></div>';
  content.innerHTML = html;
  content.querySelectorAll('.confirm-support-card').forEach(function(el){ el.addEventListener('click', function(){ var i = parseInt(el.dataset.idx, 10); hideConfirmation(); onConfirm(i); }); });
  document.getElementById('supportReplaceCancelBtn').addEventListener('click', function(){ hideConfirmation(); onCancel(); });
  ov.classList.add('show');
}

function showDiscardDieSelection(cardId, onConfirmDiscard) {
  var ov = document.getElementById('confirmOverlay'), content = document.getElementById('confirmContent'); if (!ov || !content) return;
  var card = CARD_DB[cardId] || PAINT_CARDS[cardId]; if (!card) return;
  var side = getActiveSide(); if (!side) return;
  var active = side.characters[side.activeIndex]; if (!active || active.dead) return;
  var targetElement = active.character.element;
  var selectedDieId = null;
  // ✅ Usar la prioridad real de "qué dado es más prescindible":
  //   1 = tipo que no tienes en el equipo (mejor candidato a convertir)
  //   2 = tipo de aliado muerto
  //   3 = tipo de aliado vivo (no activo)
  //   4 = tipo del activo (no se puede convertir, ya es del tipo correcto)
  //   5 = omni (nunca se convierte)
  // Elegimos el dado con MENOR prioridad (más prescindible) que no sea
  // del tipo del activo ni omni.
  var teamEls = computeTeamElements(side);
  var bestPriority = 999;
  for (var i = 0; i < side.dice.length; i++) {
    var d = side.dice[i];
    if (d.type === targetElement) continue; // ya es del tipo del activo
    if (d.type === 'omni') continue;         // nunca convertir un omni
    var prio = getDiePriority(d, teamEls, targetElement);
    if (prio < bestPriority) {
      bestPriority = prio;
      selectedDieId = d.id;
    }
  }
  function build() {
    var html = '<div class="confirm-title">🗑️ Descartar Carta</div>';
    html += '<div class="confirm-subtitle">' + card.emoji + ' ' + card.name + '</div>';
    html += '<div class="confirm-body"><div style="margin-bottom: 0.5rem;">Descarta esta carta para cambiar <strong>1 dado</strong> al tipo del activo (<strong style="color: rgb(' + ELEMENT_COLORS[targetElement] + ');">' + ELEMENT_EMOJI[targetElement] + ' ' + ELEMENT_NAMES[targetElement] + '</strong>).</div><div style="font-size: 0.75rem; color: var(--muted); font-style: italic;">Acción rápida: no pasa el turno.</div></div>';
    html += '<div class="confirm-dice-picker"><div class="confirm-dice-label"><span>Selecciona 1 dado</span><span class="confirm-dice-count' + (selectedDieId ? ' is-complete' : '') + '">' + (selectedDieId ? '1 / 1' : '0 / 1') + '</span></div><div class="confirm-dice-pool">';
    sortDiceForDisplay(side.dice, side).forEach(function(d){
      var alreadyTarget = d.type === targetElement;
      var isOmni = d.type === 'omni';
      // ✅ Omnidado: bloqueado (no se puede seleccionar para convertir)
      // ✅ Dado ya del tipo del activo: bloqueado (no tiene sentido convertirlo)
      var col = isOmni ? '240, 200, 96' : ELEMENT_COLORS[d.type];
      var em = isOmni ? '✨' : ELEMENT_EMOJI[d.type];
      var isSel = selectedDieId === d.id;
      var isLocked = alreadyTarget || isOmni || (!isSel && selectedDieId !== null);
      var cls = 'confirm-die';
      if (isSel) cls += ' selected';
      if (isLocked) cls += ' locked';
      html += '<div class="' + cls + '" data-die-id="' + d.id + '" style="--dc: ' + col + ';">' + em + '</div>';
    });
    html += '</div></div>';
    html += '<div class="confirm-buttons"><button class="confirm-btn confirm-cancel" id="discardCancelBtn">Cancelar</button><button class="confirm-btn confirm-accept" id="discardAcceptBtn"' + (!selectedDieId ? ' disabled' : '') + '>Convertir dado</button></div>';
    content.innerHTML = html;
    var picker = content.querySelector('.confirm-dice-pool');
    if (picker) picker.addEventListener('click', function(e){
      var de = e.target.closest('.confirm-die');
      if (!de || de.classList.contains('locked')) return;
      var id = de.dataset.dieId;
      if (selectedDieId === id) { selectedDieId = null; playSound('deselect'); } else { selectedDieId = id; playSound('select'); }
      build();
    });
    document.getElementById('discardCancelBtn').addEventListener('click', function(){ hideConfirmation(); playSound('deselect'); });
    var ab = document.getElementById('discardAcceptBtn');
    if (ab && !ab.disabled) ab.addEventListener('click', function(){ hideConfirmation(); playSound('confirm'); onConfirmDiscard(selectedDieId); });
  }
  build(); ov.classList.add('show');
}
function showCardConfirmation(cardId, adjustedCost, onConfirm, artemisBlock) {
  var ov = document.getElementById('confirmOverlay'), content = document.getElementById('confirmContent'); if (!ov || !content) return;
  hideTooltip();
  var card = CARD_DB[cardId] || PAINT_CARDS[cardId]; if (!card) return;
  var side = getActiveSide(); if (!side) return;
  var totalCost = sumCost(adjustedCost);
  var active = side.characters[side.activeIndex];
  var autoIds = autoSelectDiceForCost(adjustedCost, { targetElement: active ? active.character.element : null });
  var selectedIds = {}; autoIds.forEach(function(id){ selectedIds[id] = true; });
  function getSel(){ return side.dice.filter(function(d){ return selectedIds[d.id]; }); }
  function build() {
    var sc = Object.keys(selectedIds).length, isFull = sc === totalCost;
    var isComplete = totalCost === 0 || (isFull && trySpendDice(getSel(), adjustedCost).ok);
    var canPlay = isComplete && !artemisBlock;
    var catL = card.category === 'equipo' ? '⚔️ Equipo' : card.category === 'apoyo' ? '📜 Apoyo' : card.category === 'pintura' ? '🎨 Pintura' : '✨ Evento';
    var html = '<div class="confirm-title">' + catL + ' · ' + card.tag + '</div><div class="confirm-subtitle">' + card.emoji + ' ' + card.name + '</div><div class="confirm-body">' + card.effectText + '</div>';
    if (totalCost === 0) html += '<div class="confirm-cost-section"><div class="confirm-cost-label">Coste</div><div class="confirm-cost-dice"><span class="die die-energy">Sin coste</span></div></div>';
    else {
      html += '<div class="confirm-cost-section"><div class="confirm-cost-label">Coste requerido</div><div class="confirm-cost-dice">';
      if (adjustedCost.any) html += '<span class="die die-any">🎲 <b>×' + adjustedCost.any + '</b></span>';
      if (adjustedCost.same) html += '<span class="die die-any">🎲 <b>×' + adjustedCost.same + ' iguales</b></span>';
      html += '</div></div>';
      var dh = ''; sortDiceForDisplay(side.dice, side).forEach(function(d){ var col = d.type === 'omni' ? '240, 200, 96' : ELEMENT_COLORS[d.type]; var em = d.type === 'omni' ? '✨' : ELEMENT_EMOJI[d.type]; var sel = selectedIds[d.id], lk = !sel && isFull; var cls = 'confirm-die'; if (sel) cls += ' selected'; if (lk) cls += ' locked'; dh += '<div class="' + cls + '" data-die-id="' + d.id + '" style="--dc: ' + col + ';">' + em + '</div>'; });
      html += '<div class="confirm-dice-picker"><div class="confirm-dice-label"><span>Selecciona dados</span><span class="confirm-dice-count' + (isFull ? ' is-complete' : '') + '">' + sc + ' / ' + totalCost + '</span></div><div class="confirm-dice-pool">' + dh + '</div></div>';
      if (isComplete) html += '<div class="confirm-valid-msg ok">✓ Listo</div>';
    }
    if (artemisBlock) {
      html += '<div class="confirm-warning">🦅 Artemis no puede recibir energía. Puedes descartar esta carta, pero no jugarla.</div>';
    }
    html += '<div class="confirm-buttons"><button class="confirm-btn confirm-cancel" id="confirmCancelBtn">Cancelar</button>';
    if (side.dice.length > 0) html += '<button class="confirm-btn confirm-discard" id="confirmDiscardBtn" title="Descartar esta carta para cambiar un dado al tipo del activo">🗑️ Descartar</button>';
    html += '<button class="confirm-btn confirm-accept" id="confirmAcceptBtn"' + (!canPlay ? ' disabled' : '') + '>Jugar</button></div>';
    content.innerHTML = html;                       // ← LÍNEA QUE FALTABA
    var picker = content.querySelector('.confirm-dice-pool');
    if (picker) picker.addEventListener('click', function(e){ var de = e.target.closest('.confirm-die'); if (!de || de.classList.contains('locked')) return; var id = de.dataset.dieId; if (selectedIds[id]) { delete selectedIds[id]; playSound('deselect'); } else { if (Object.keys(selectedIds).length >= totalCost) { playSound('error'); return; } selectedIds[id] = true; playSound('select'); } build(); });
    document.getElementById('confirmCancelBtn').addEventListener('click', function(){ hideConfirmation(); playSound('deselect'); });
    var discardBtn = document.getElementById('confirmDiscardBtn');
    if (discardBtn) discardBtn.addEventListener('click', function(){
      if (!side || side.dice.length === 0) { playSound('error'); return; }
      showDiscardDieSelection(cardId, function(dieId) {
        var hi = side.hand.indexOf(cardId);
        if (hi >= 0) side.hand.splice(hi, 1);
        if (!PAINT_CARDS[cardId]) { if (!side.discardPile) side.discardPile = []; side.discardPile.push(cardId); }
        var die = side.dice.find(function(d){ return d.id === dieId; });
        if (die) {
          var act = side.characters[side.activeIndex];
          if (act && !act.dead) { die.type = act.character.element; die.justAdded = true; logCombat('🗑️ Descartas ' + card.name + ' → dado convertido a ' + ELEMENT_EMOJI[act.character.element]); }
        }
        playSound('card'); renderCombat();
      });
    });
    var ab = document.getElementById('confirmAcceptBtn');
    if (ab && !ab.disabled) ab.addEventListener('click', function(){ var fd = getSel(); if (totalCost > 0) { var t = trySpendDice(fd, adjustedCost); if (!t.ok) return; } hideConfirmation(); playSound('confirm'); onConfirm(fd); });
  }
  build(); ov.classList.add('show');
}

function previewPlayerAction(actionType) {
  var side = getTurnSide(); var enemySide = getEnemySide();
  if (!side || !enemySide) return null;
  var active = side.characters[side.activeIndex];
  var ability = active.character.abilities[actionType];
  var target = enemySide.characters[enemySide.activeIndex];
  var preview = {
    ability:ability, active:active, target:target,
    piercing:false, baseDmg:0, buffDmg:0, cardBonus:0, redencionDmg:0, markBonus:0,
    equipDmg:0, supportDmg:0, optimizationDmg:0, erikBonus:0, obraMaestraDmg:0, carrerillaBonus:0,
    alterBuffDmg:0,
    flatReduction:0, rawDmg:0, totalDmg:0, trueDmg:0, shieldAbsorbed:0,
    heal:0, healApplied:0, shieldSelf:0, selfDamage:0, reflectDmg:0, condenaGain:0,
    energyGain:ability.energy || 0, energyCost:ability.energyCost || 0,
    targetHpBefore:target ? target.hp : 0, targetHpAfter:target ? target.hp : 0,
    targetShieldBefore:target ? totalShield(target) : 0, targetShieldAfter:target ? totalShield(target) : 0,
    activeHpBefore:active.hp, activeHpAfter:active.hp,
    activeShieldBefore:totalShield(active), activeShieldAfter:totalShield(active),
    willKill:false, willDieFromSelf:false, notes:[]
  };
  preview.baseDmg = computeBaseDamageForAbility(active, ability, actionType);
  preview.selfDamage = predictSelfDamage(ability, active);
  preview.heal = predictHeal(ability, active);
  preview.healApplied = Math.min(preview.heal, active.maxHp - active.hp);
  preview.shieldSelf = predictShieldGain(ability);
  preview.reflectDmg = getReflectDamage(enemySide);

  var applyGeneric = ['damage','trazoVivo','intervencion','aceleron','instinto','deudaSangre','graciaPicara'].indexOf(ability.kind) !== -1;
  if (ability.target === 'enemy' && preview.baseDmg > 0 && target) {
    if (applyGeneric) {
      var gb = getGenericBonuses(active);
      preview.buffDmg = gb.pendingBuff;
      preview.cardBonus = gb.cardBonus;
      preview.equipDmg = gb.equipBonus;
      preview.supportDmg = getSupportAttackBonus(side);
      if (actionType === 'normal' || actionType === 'elemental') preview.optimizationDmg = getOptimizationBonus(side);
      if (active.id === 'erik') preview.erikBonus = applyErikPassive(active);
      if (active.id === 'eevee' && csHasState(active, 'furia') && active.states.furiaTarget === target.id && actionType === 'normal') preview.notes.push('🔥 Furia: +1');
      var consR = side.consonance;
      if (consR && consR.type === 'single' && consR.element === 'redencion' && !side.firstAttackUsed) preview.redencionDmg = consR.level === 3 ? 3 : 2;
      if (target.cardMarkBonus) preview.markBonus = target.cardMarkBonus;
      // ✅ Alter: bono a elementales del equipo (si hay buff activo)
      // ✅ Adela graciaPicara y elementales reciben el buff de Alter
      var isElementalLike = (actionType === 'elemental') || (ability.kind === 'graciaPicara');
      if (isElementalLike && side.alterUltBuff && side.alterUltBuff.amount > 0 && side.alterUltBuff.roundsLeft > 0 && active.id !== 'alter') {
        preview.alterBuffDmg = side.alterUltBuff.amount;
        preview.notes.push('💥 Omnes Deam Salutate: +' + side.alterUltBuff.amount + ' daño');
      }
      if (active.id === 'artemis' && csHasState(active, 'carrerilla') && ability.kind === 'damage') {
        preview.carrerillaBonus = 2;
        preview.notes.push('🏃 Carrerilla: +2 daño');
        if (actionType === 'normal') preview.notes.push('⚡ +1 energía extra');
      }
    }
    // ✅ Buff de Alter también para elementales que no pasan por applyGeneric
    // (inconsistencia, degradacion)
    if (!applyGeneric && actionType === 'elemental' && side.alterUltBuff && side.alterUltBuff.amount > 0 && side.alterUltBuff.roundsLeft > 0 && active.id !== 'alter') {
      if (ability.kind === 'inconsistencia' || ability.kind === 'degradacion') {
        preview.alterBuffDmg = side.alterUltBuff.amount;
        preview.notes.push('💥 Omnes Deam Salutate: +' + side.alterUltBuff.amount + ' daño');
      }
    }
    if (actionType === 'ultimate' && side.obraMaestraTurns > 0 && applyGeneric) preview.obraMaestraDmg = preview.baseDmg;
    var coreDmg = preview.baseDmg + (preview.carrerillaBonus || 0);
    if (active.cardNextAttackDouble && applyGeneric) coreDmg *= 2;
    if (preview.obraMaestraDmg > 0) coreDmg += preview.obraMaestraDmg;
    var raw = coreDmg + preview.buffDmg + preview.cardBonus + preview.equipDmg + preview.supportDmg + preview.optimizationDmg + preview.erikBonus + preview.markBonus + preview.redencionDmg + (preview.alterBuffDmg || 0);
    if (preview.notes.indexOf('🔥 Furia: +1') !== -1) raw += 1;
    preview.rawDmg = raw;
    preview.flatReduction = getDamageReduction(target, enemySide);
    var afterRed = Math.max(0, raw - preview.flatReduction);
    if (csHasState(target, 'vulnerable') && afterRed > 0) { afterRed = Math.max(0, afterRed - 1); preview.notes.push('💔 Vulnerable: -1'); }
    preview.totalDmg = afterRed;
    preview.piercing = predictPiercing(active, ability);
    if (preview.piercing) preview.trueDmg = afterRed;
    else { preview.shieldAbsorbed = Math.min(preview.targetShieldBefore, afterRed); preview.trueDmg = afterRed - preview.shieldAbsorbed; preview.targetShieldAfter = preview.targetShieldBefore - preview.shieldAbsorbed; }
    preview.targetHpAfter = Math.max(0, target.hp - preview.trueDmg);
    preview.willKill = preview.targetHpAfter <= 0;
  }

  // ==== Predicciones específicas por habilidad ====

  if (ability.kind === 'carrerilla') {
    preview.notes.push('🏃 Siguiente ataque +2 daño (+1 energía extra si es el ataque normal)');
    preview.notes.push('⚡ No gana energía con esta habilidad');
  }
  if (ability.kind === 'estratosfera') {
    if (csHasState(active, 'vuelo')) {
      var carrP = csHasState(active, 'carrerilla') ? 2 : 0;
      var exP = (active.exActive && exSystemEnabled) ? 2 : 0;
      if (carrP > 0) preview.notes.push('🏃 Carrerilla: +2 daño (aplicado)');
      if (exP > 0) preview.notes.push('🌟 EX Artemis: +2 daño base');
      preview.notes.push('💥 ' + (6 + carrP + exP) + ' daño penetrante a TODOS los enemigos');
      preview.notes.push('🏷️ Marca con aceptación a los que sobrevivan');
      preview.notes.push('💀 Artemis muere');
      preview.willDieFromSelf = true;
    } else {
      preview.notes.push('🦅 Entra en Vuelo (no hace daño)');
    }
  }

  if (ability.kind === 'autolesion' && active.id === 'alaya' && csHasState(active, 'castigada')) {
    preview.condenaGain = 1;
    preview.notes.push('💀 +1 condena');
  }

  if (ability.kind === 'trazoVivo') {
    var paint = active.paintEquipped;
    if (paint === 'roja') preview.notes.push('🔴 Pintura Roja: +2 daño');
    else if (paint === 'azul') { preview.shieldSelf = (preview.shieldSelf || 0) + 1; preview.notes.push('🔵 Pintura Azul: +1 escudo'); }
    else if (paint === 'verde') { var healV = Math.min(2, active.maxHp - active.hp); preview.healApplied = (preview.healApplied || 0) + healV; preview.notes.push('🟢 Pintura Verde: +' + healV + ' HP'); }
    else preview.notes.push('🏷️ Marca con expresión');
    if (paint) preview.notes.push('🎨 La pintura se consume');
  }

  if (ability.kind === 'interpretacion') {
    var healI = 0; // no cura
    preview.notes.push('🎨 Genera 3 cartas de pintura (roja/azul/verde)');
  }

  if (ability.kind === 'lienzoSangre') {
    var pr = (side.hand||[]).filter(function(id){ return id === 'paint_roja'; }).length;
    var pa = (side.hand||[]).filter(function(id){ return id === 'paint_azul'; }).length;
    var pv = (side.hand||[]).filter(function(id){ return id === 'paint_verde'; }).length;
    if (pr + pa + pv === 0) preview.notes.push('❌ Sin pinturas en mano');
    else {
      if (pr) preview.notes.push('🔴 +' + pr + ' daño por pinturas rojas');
      if (pa) { preview.shieldSelf = (preview.shieldSelf || 0) + pa; preview.notes.push('🔵 +' + pa + ' HP al primer escudo'); }
      if (pv) { var healL = Math.min(pv, active.maxHp - active.hp); preview.healApplied = (preview.healApplied || 0) + healL; preview.notes.push('🟢 +' + healL + ' HP'); }
    }
  }

  if (ability.kind === 'deudaSangre') {
    preview.notes.push('💢 Aplica 1 Rencor al enemigo');
    if (preview.trueDmg > 0) {
      // ✅ Tope de 3 HP de curación por la habilidad misma (daño base).
      // Los bonos de curación se suman después.
      var healBonusPrev = 0;
      if (active && active.equipment) active.equipment.forEach(function(eqId){
        var eq = CARD_DB[eqId]; if (eq && eq.effect && eq.effect.healBonus) healBonusPrev += eq.effect.healBonus;
      });
      var healD = Math.min(preview.trueDmg, 3) + healBonusPrev;
      healD = Math.min(healD, active.maxHp - active.hp);
      preview.healApplied = healD;
      preview.notes.push('🩸 Cura ' + healD + ' HP (máx. 3 por daño + bonos)');
    } else {
      preview.notes.push('🩸 No cura (no hubo daño verdadero)');
    }
  }

  if (ability.kind === 'ecoVital') {
    var alliesEco = side.characters.filter(function(c){ return c !== active && !c.dead; });
    preview.notes.push('🎵 ' + alliesEco.length + ' aliado(s) +2 HP y Sintonía');
    preview.healApplied = 0;
  }

  if (ability.kind === 'armonia') {
    preview.notes.push('🏷️ Marca al enemigo con protección');
  }

  if (ability.kind === 'hipotesisSolida') {
    preview.notes.push('🛡️ +2 escudo; si un enemigo lo golpea, lo marca con comprensión');
  }

  if (ability.kind === 'conclusion') {
    var alliesCon = side.characters.filter(function(c){ return c !== active && !c.dead; });
    preview.notes.push('🛡️ ' + alliesCon.length + ' aliado(s) +1 escudo y +1 energía');
  }

  if (ability.kind === 'defensaActiva') {
    preview.notes.push('💠 Al próximo ataque: -1 daño y contraataque');
  }

  if (ability.kind === 'suficiente') {
    var amz = enemySide.characters.filter(function(c){ return !c.dead && csHasState(c, 'amenaza'); });
    if (!amz.length) preview.notes.push('❌ No hay Amenazas');
    else preview.notes.push('🚨 Afecta a ' + amz.length + ' enemigo(s) Amenaza (3 daño penetrante c/u)');
    var vuln = side.characters.filter(function(c){ return !c.dead && csHasState(c, 'vulnerable'); });
    if (vuln.length) preview.notes.push('🛡️ ' + vuln.length + ' aliado(s) Vulnerable(s) +3 escudo');
  }

  if (ability.kind === 'retribucionFinal') {
    var conRencor = enemySide.characters.filter(function(c){ return !c.dead && c.states && c.states.rencor > 0; });
    if (!conRencor.length) preview.notes.push('❌ Ningún enemigo tiene Rencor');
    else {
      var totalRetr = conRencor.reduce(function(acc, c){ return acc + 3 + Math.max(0, c.states.rencor - 1); }, 0);
      preview.notes.push('💢 Afecta a ' + conRencor.length + ' enemigo(s) con Rencor (' + totalRetr + ' daño total)');
    }
  }

  if (ability.kind === 'degradacion') {
    var selfDeg = 2 + (active.manuelStacks || 0);
    preview.selfDamage = selfDeg;
    preview.notes.push('🩸 Autodaño: ' + selfDeg);
  }

  if (ability.kind === 'decadencia') {
    preview.notes.push('📈 +1 stack (Degradación: +1 daño, -1 coste)');
  }

  if (ability.kind === 'optimizacion') preview.notes.push('🏛️ Coloca estructura (2 rondas): +2 daño aliados, 1 daño final de ronda + marca comprensión');
  if (ability.kind === 'obraMaestra') {
    var hasOpt = side.structures && side.structures.some(function(st){ return st.kind === 'optimizacion'; });
    if (hasOpt) preview.notes.push('💥 Definitivas x2 daño (2 rondas)');
    else preview.notes.push('❌ Requiere estructura Optimización en campo');
  }
  if (ability.kind === 'penitencia') preview.notes.push('🩸 Entra en Castigada');
  if (ability.kind === 'bajoAlas') preview.notes.push('💔 Aliado con menos vida → Vulnerable');
  if (ability.kind === 'impulso') preview.notes.push('💪 +2 al siguiente ataque normal; pasa a reserva');
  if (ability.kind === 'contraofensiva' && csHasState(active, 'furia')) {
    preview.notes.push('🔥 Furia activa');
  }
  if (ability.kind === 'reescritura') preview.notes.push('📜 Restaura apoyo propio / destruye apoyo enemigo');
  if (ability.kind === 'canon') preview.notes.push('📜 Roba hasta 3 apoyos y activa los del campo');

  // Cálculo de autodaño / muerte propia
  var selfTot = preview.selfDamage + preview.reflectDmg;
  if (selfTot > 0) preview.activeHpAfter = Math.max(0, active.hp - selfTot);
  preview.willDieFromSelf = preview.activeHpAfter <= 0 && selfTot > 0;
  if (preview.shieldSelf > 0) preview.activeShieldAfter = preview.activeShieldBefore + preview.shieldSelf;

  if (ability.kind === 'finComienzo') {
    var condenaNow = (active.states && active.states.condena) || 0;
    preview.baseDmg = condenaNow;
    preview.piercing = true;
    preview.trueDmg = condenaNow;
    preview.targetHpAfter = Math.max(0, preview.targetHpBefore - condenaNow);
    preview.willKill = preview.targetHpAfter <= 0;
    if (condenaNow === 0) {
      preview.willDieFromSelf = true;
      preview.notes.push('⚠️ Sin condena: no infliges daño y mueres');
    } else {
      preview.notes.push('🔻 Daño = condena (' + condenaNow + ') penetrante');
      preview.notes.push('💀 Si el objetivo sobrevive, Alaya muere');
    }
    preview.notes.push('🏷️ Marca con redención a TODOS los enemigos vivos');
  }

  if (ability.kind === 'ojoPorOjo') {
    var cP = countCruzMadera(side);
    preview.notes.push('✝️ ' + cP + ' cruz(es) en campo → +' + cP + ' daño');
  }
  if (ability.kind === 'minutoSilencio') {
    preview.notes.push('🔮 +2 escudo; se desvanece al final de la ronda');
    preview.notes.push('✝️ Si el escudo es golpeado: Cruz de Madera');
  }
  if (ability.kind === 'diosTeAmpare') {
    var cPP = countCruzMadera(combatState.player), cBB = countCruzMadera(combatState.bot);
    var totC = cPP + cBB;
    var resN = enemySide.characters.filter(function(c, i){ return !c.dead && i !== enemySide.activeIndex; }).length;
    preview.notes.push('💥 Destruye ' + totC + ' Cruz(es) de Madera en el campo');
    preview.notes.push('💥 ' + totC + ' daño a ' + resN + ' enemigo(s) en reserva');
  }
  if (ability.kind === 'conversionPsicologica') {
    var invNow = (active.states && active.states.invulnerabilidad) || 0;
    preview.notes.push('🛡️ Invulnerabilidad: ' + invNow + ' → ' + Math.min(3, invNow + 1));
    var totalStolenEnergy = 0;
    var ownSide = (combatState.player.characters.indexOf(active) >= 0) ? combatState.player : combatState.bot;
    ownSide.characters.forEach(function(a){ if (a !== active && !a.dead && a.energy > 0) totalStolenEnergy += a.energy; });
    if (totalStolenEnergy === 0) preview.notes.push('🔮 No hay energía que robar');
    else {
      var roomE = Math.max(0, active.maxEnergy - active.energy);
      var gainE = Math.min(roomE, totalStolenEnergy);
      var overE = totalStolenEnergy - gainE;
      if (gainE > 0) preview.notes.push('🔮 +' + gainE + ' energía (total: ' + (active.energy + gainE) + '/' + active.maxEnergy + ')');
      if (overE > 0) preview.notes.push('🔮 ' + overE + ' sobrante → ' + overE + ' dado(s) de ilusión');
    }
  }
  if (ability.kind === 'omnesDeam') {
    var ultNow = (ownSide && ownSide.alterUltBuff) ? (ownSide.alterUltBuff.amount || 0) : 0;
    preview.notes.push('💥 +3 daño a elementales del equipo durante 2 rondas (total: +' + (ultNow + 3) + ')');
  }

  if (ability.kind === 'scratch') {
    if (combatState.environment && combatState.environment.id === 'sobrecarga_epileptica') preview.notes.push('⚡ +1 daño por Sobrecarga Epiléptica');
    var hasMesaPrev = side.structures && side.structures.some(function(s){ return s.kind === 'mesaDJ'; });
    if (hasMesaPrev) preview.notes.push('🎧 +1 daño por Mesa de DJ (coste +1 ilusión)');
  }
  if (ability.kind === 'remix') {
    var hasMesaPrev2 = side.structures && side.structures.some(function(s){ return s.kind === 'mesaDJ'; });
    if (hasMesaPrev2) preview.notes.push('🎭 Mesa de DJ ya activa → marca al enemigo con Ilusión');
    else preview.notes.push('🎧 Coloca Mesa de DJ (2 rondas)');
  }
  if (ability.kind === 'killerTunes') {
    preview.notes.push('🌍 Establece entorno: Sobrecarga Epiléptica (2 rondas)');
    preview.notes.push('🎵 Cambios de personaje del equipo → 1 daño al enemigo (resto de ronda)');
  }

  return preview;
}
function buildPreviewBodyHTML(preview) {
  var html = '<div class="confirm-body">';
  if (preview.rawDmg > 0 || preview.trueDmg > 0) {
    var hasB = preview.buffDmg || preview.cardBonus || preview.equipDmg || preview.supportDmg || preview.optimizationDmg || preview.erikBonus || preview.markBonus || preview.redencionDmg || preview.obraMaestraDmg || preview.carrerillaBonus || preview.alterBuffDmg;
    if (hasB) {
      html += '<div class="confirm-row"><span class="confirm-row-label">Daño base</span><span class="confirm-row-value damage">' + preview.baseDmg + '</span></div>';
      if (preview.buffDmg) html += '<div class="confirm-row"><span class="confirm-row-label">+ Impulso</span><span class="confirm-row-value bonus">+' + preview.buffDmg + '</span></div>';
      if (preview.cardBonus) html += '<div class="confirm-row"><span class="confirm-row-label">+ Carta</span><span class="confirm-row-value bonus">+' + preview.cardBonus + '</span></div>';
      if (preview.equipDmg) html += '<div class="confirm-row"><span class="confirm-row-label">+ Equipo</span><span class="confirm-row-value bonus">+' + preview.equipDmg + '</span></div>';
      if (preview.supportDmg) html += '<div class="confirm-row"><span class="confirm-row-label">+ Apoyos</span><span class="confirm-row-value bonus">+' + preview.supportDmg + '</span></div>';
      if (preview.optimizationDmg) html += '<div class="confirm-row"><span class="confirm-row-label">+ Optimización</span><span class="confirm-row-value bonus">+' + preview.optimizationDmg + '</span></div>';
      if (preview.obraMaestraDmg) html += '<div class="confirm-row"><span class="confirm-row-label">+ Obra Maestra</span><span class="confirm-row-value bonus">+' + preview.obraMaestraDmg + '</span></div>';
      if (preview.erikBonus) html += '<div class="confirm-row"><span class="confirm-row-label">+ Inspiración</span><span class="confirm-row-value bonus">+' + preview.erikBonus + '</span></div>';
      if (preview.alterBuffDmg) html += '<div class="confirm-row"><span class="confirm-row-label">+ Omnes Deam</span><span class="confirm-row-value bonus">+' + preview.alterBuffDmg + '</span></div>';
      if (preview.redencionDmg) html += '<div class="confirm-row"><span class="confirm-row-label">+ Redención</span><span class="confirm-row-value bonus">+' + preview.redencionDmg + '</span></div>';
      if (preview.markBonus) html += '<div class="confirm-row"><span class="confirm-row-label">+ Marca</span><span class="confirm-row-value bonus">+' + preview.markBonus + '</span></div>';
            if (preview.carrerillaBonus) html += '<div class="confirm-row"><span class="confirm-row-label">+ Carrerilla</span><span class="confirm-row-value bonus">+' + preview.carrerillaBonus + '</span></div>';
    } else {
      html += '<div class="confirm-row"><span class="confirm-row-label">Daño base</span><span class="confirm-row-value damage">' + preview.baseDmg + '</span></div>';
    }
    if (preview.flatReduction) html += '<div class="confirm-row"><span class="confirm-row-label">− Reducción</span><span class="confirm-row-value shield">−' + preview.flatReduction + '</span></div>';
    if (!preview.piercing && preview.shieldAbsorbed > 0) html += '<div class="confirm-row"><span class="confirm-row-label">− Escudo absorbe</span><span class="confirm-row-value shield">−' + preview.shieldAbsorbed + '</span></div>';
    html += '<div class="confirm-row"><span class="confirm-row-label">Daño verdadero</span><span class="confirm-row-value true-dmg">' + preview.trueDmg + '</span></div>';
  }
  if (preview.healApplied > 0) html += '<div class="confirm-row"><span class="confirm-row-label">Curación propia</span><span class="confirm-row-value heal">+' + preview.healApplied + ' HP</span></div>';
  if (preview.shieldSelf) html += '<div class="confirm-row"><span class="confirm-row-label">Escudo propio</span><span class="confirm-row-value shield">+' + preview.shieldSelf + '</span></div>';
  if (preview.selfDamage) html += '<div class="confirm-row"><span class="confirm-row-label">Autodaño</span><span class="confirm-row-value damage">−' + preview.selfDamage + ' HP</span></div>';
  if (preview.reflectDmg) html += '<div class="confirm-row"><span class="confirm-row-label">Trampa refleja</span><span class="confirm-row-value damage">−' + preview.reflectDmg + ' HP</span></div>';
  if (preview.condenaGain) html += '<div class="confirm-row"><span class="confirm-row-label">+ Condena</span><span class="confirm-row-value bonus">+' + preview.condenaGain + '</span></div>';
  html += '</div>';
  if (preview.notes && preview.notes.length) html += '<div style="margin-top: 0.5rem; padding: 0.6rem 0.8rem; background: rgba(240,200,96,0.08); border: 1px solid rgba(240,200,96,0.25); border-radius: 8px; font-size: 0.78rem; line-height: 1.5;">' + preview.notes.join(' · ') + '</div>';
  if (preview.willKill) html += '<div class="confirm-warning">💀 ¡Eliminará a ' + preview.target.character.name + '!</div>';
  if (preview.willDieFromSelf) html += '<div class="confirm-warning">💀 ¡' + preview.active.character.name + ' morirá tras usar esta habilidad!</div>';
  return html;
}
function showActionConfirmation(actionType, ability, onConfirm) {
  var ov = document.getElementById('confirmOverlay'), content = document.getElementById('confirmContent'); if (!ov || !content) return;
  hideTooltip();
  var side = getTurnSide(); if (!side) return;
  var active = side.characters[side.activeIndex];
  var effCost = getEffectiveCostFull(active, ability);
  var totalCost = sumCost(effCost);
  var autoIds = autoSelectDiceForCost(effCost, { targetElement: active ? active.character.element : null });
  var selectedIds = {}; autoIds.forEach(function(id){ selectedIds[id] = true; });
  var typeIcon = actionType === 'normal' ? '⚔️' : (actionType === 'elemental' ? '🔮' : '💥');
  var typeName = actionType === 'normal' ? 'Ataque Normal' : (actionType === 'elemental' ? 'Habilidad Elemental' : 'Habilidad Definitiva');
  var preview = previewPlayerAction(actionType);
  function getSel(){ return side.dice.filter(function(d){ return selectedIds[d.id]; }); }
  function build() {
    var sc = Object.keys(selectedIds).length, isFull = sc === totalCost;
    var isComplete = totalCost === 0 || (isFull && trySpendDice(getSel(), effCost).ok);
    var html = '<div class="confirm-title">' + typeIcon + ' ' + typeName + '</div><div class="confirm-subtitle">' + ability.name + '</div>';
    html += '<div class="confirm-cost-section"><div class="confirm-cost-label">Coste requerido</div><div class="confirm-cost-dice">';
    if (totalCost === 0) html += '<span class="die die-energy">Sin coste</span>';
    if (effCost.any) html += '<span class="die die-any">🎲 <b>×' + effCost.any + '</b></span>';
    if (effCost.same) html += '<span class="die die-any">🎲 <b>×' + effCost.same + ' iguales</b></span>';
    Object.keys(effCost).forEach(function(k){ if (k === 'any' || k === 'same') return; html += '<span class="die" style="--dc:' + ELEMENT_COLORS[k] + ';">' + ELEMENT_EMOJI[k] + ' <b>×' + effCost[k] + '</b></span>'; });
    if (ability.energyCost && !active.cardNextAbilityFree) html += '<span class="die die-energy">⚡ <b>×' + ability.energyCost + '</b></span>';
    html += '</div></div>';
    if (totalCost > 0) {
      var dh = ''; sortDiceForDisplay(side.dice, side).forEach(function(d){ var col = d.type === 'omni' ? '240, 200, 96' : ELEMENT_COLORS[d.type]; var em = d.type === 'omni' ? '✨' : ELEMENT_EMOJI[d.type]; var sel = selectedIds[d.id], lk = !sel && isFull; var cls = 'confirm-die'; if (sel) cls += ' selected'; if (lk) cls += ' locked'; dh += '<div class="' + cls + '" data-die-id="' + d.id + '" style="--dc: ' + col + ';">' + em + '</div>'; });
      html += '<div class="confirm-dice-picker"><div class="confirm-dice-label"><span>Selecciona dados</span><span class="confirm-dice-count' + (isFull ? ' is-complete' : '') + '">' + sc + ' / ' + totalCost + '</span></div><div class="confirm-dice-pool">' + dh + '</div></div>';
      if (!isComplete) html += '<div class="confirm-valid-msg error">Selecciona ' + (totalCost - sc) + ' dado(s) más</div>';
    }
    if (preview) html += buildPreviewBodyHTML(preview);
    html += '<div class="confirm-buttons"><button class="confirm-btn confirm-cancel" id="confirmCancelBtn">Cancelar</button><button class="confirm-btn confirm-accept" id="confirmAcceptBtn"' + (!isComplete ? ' disabled' : '') + '>Ejecutar</button></div>';
    content.innerHTML = html;
    var picker = content.querySelector('.confirm-dice-pool');
    if (picker) picker.addEventListener('click', function(e){ var de = e.target.closest('.confirm-die'); if (!de || de.classList.contains('locked')) return; var id = de.dataset.dieId; if (selectedIds[id]) { delete selectedIds[id]; playSound('deselect'); } else { if (Object.keys(selectedIds).length >= totalCost) { playSound('error'); return; } selectedIds[id] = true; playSound('select'); } build(); });
    document.getElementById('confirmCancelBtn').addEventListener('click', function(){ hideConfirmation(); playSound('deselect'); });
    var ab = document.getElementById('confirmAcceptBtn');
    if (ab && !ab.disabled) ab.addEventListener('click', function(){ var fd = getSel(); if (totalCost > 0) { var t = trySpendDice(fd, effCost); if (!t.ok) return; } hideConfirmation(); playSound('confirm'); onConfirm(fd); });
  }
  build(); ov.classList.add('show');
}
function playerActionRequest(actionType) {
  if (!combatState || combatState.phase !== 'playing') return;
  if (!canHumanControlCurrentTurn()) return;
  if (isTurnDone()) return;
  // (El botón EX del sidebar ya no se usa: la EX se elige en combatStartConfirm)
  if (actionType === 'ex') { playSound('error'); return; }
  var turnKey = getTurnKey();
  var side = combatState[turnKey];
  var active = side.characters[side.activeIndex]; if (!active || active.dead) return;
  var ability = active.character.abilities[actionType]; if (!ability) return;
  if (ability.kind === 'obraMaestra') {
    var hasOptim = side.structures && side.structures.some(function(st){ return st.kind === 'optimizacion'; });
    if (!hasOptim) { playSound('error'); var btnIdU = actionType === 'ultimate' ? 'ultimateBtn' : (actionType === 'elemental' ? 'elementalBtn' : 'normalBtn'); var bU = document.getElementById(btnIdU); if (bU) { bU.classList.add('shake'); setTimeout(function(){ bU.classList.remove('shake'); }, 400); } return; }
  }
  if (ability.energyCost && active.energy < ability.energyCost && !active.cardNextAbilityFree) { playSound('error'); return; }
  var effCost = getEffectiveCostFull(active, ability);
  if (sumCost(effCost) > 0 && !trySpendDice(side.dice, effCost).ok) {
    playSound('error');
    var btnId = actionType === 'normal' ? 'normalBtn' : (actionType === 'elemental' ? 'elementalBtn' : 'ultimateBtn');
    var btn = document.getElementById(btnId); if (btn) { btn.classList.add('shake'); setTimeout(function(){ btn.classList.remove('shake'); }, 400); }
    return;
  }
  showActionConfirmation(actionType, ability, function(selectedDice){
    var spentIds = {}; selectedDice.forEach(function(d){ spentIds[d.id] = true; });
    side.dice = side.dice.filter(function(d){ return !spentIds[d.id]; });
    renderCombat(); executeAction(turnKey, actionType, selectedDice);
  });
}

function showChangeConfirmation(targetIndex, onConfirm) {
  var ov = document.getElementById('confirmOverlay'), content = document.getElementById('confirmContent'); if (!ov || !content) return;
  hideTooltip();
  var turnKey = getTurnKey();
  var side = combatState[turnKey];
  var rules = getChangeRulesForTarget(turnKey, targetIndex), diceCost = rules.diceCost;
  var newChar = side.characters[targetIndex];
  var oldChar = side.characters[side.activeIndex];
  var newCol = ELEMENT_COLORS[newChar.character.element];
  var selectedIds = {};
  if (diceCost > 0) { var auto = autoSelectDiceForCost({ any:diceCost }, { targetElement:newChar.character.element }); auto.forEach(function(id){ selectedIds[id] = true; }); }
  function getSel(){ return side.dice.filter(function(d){ return selectedIds[d.id]; }); }
  function build() {
    var sc = Object.keys(selectedIds).length;
    var isComplete = diceCost === 0 || (sc === diceCost && trySpendDice(getSel(), { any:diceCost }).ok);
    var html = '<div class="confirm-title">🔄 Cambio de Personaje</div>';
    html += '<div class="confirm-subtitle">' + oldChar.character.name + ' → ' + newChar.character.name + '</div>';
    html += '<div class="confirm-target" style="background: rgba(' + newCol + ', 0.1);"><span style="font-size: 1.2rem;">' + newChar.character.emoji + '</span>Nuevo activo: <b>' + newChar.character.name + '</b><span class="confirm-target-sub">' + ELEMENT_EMOJI[newChar.character.element] + ' ' + ELEMENT_NAMES[newChar.character.element] + '</span></div>';
    if (diceCost > 0) {
      html += '<div class="confirm-cost-section"><div class="confirm-cost-label">Coste requerido</div><div class="confirm-cost-dice"><span class="die die-any">🎲 <b>×' + diceCost + '</b></span></div></div>';
      var dh = ''; sortDiceForDisplay(side.dice, side).forEach(function(d){ var col = d.type === 'omni' ? '240, 200, 96' : ELEMENT_COLORS[d.type]; var em = d.type === 'omni' ? '✨' : ELEMENT_EMOJI[d.type]; var sel = selectedIds[d.id], lk = !sel && sc >= diceCost; var cls = 'confirm-die'; if (sel) cls += ' selected'; if (lk) cls += ' locked'; dh += '<div class="' + cls + '" data-die-id="' + d.id + '" style="--dc: ' + col + ';">' + em + '</div>'; });
      html += '<div class="confirm-dice-picker"><div class="confirm-dice-label"><span>Selecciona dados</span><span class="confirm-dice-count' + (sc === diceCost ? ' is-complete' : '') + '">' + sc + ' / ' + diceCost + '</span></div><div class="confirm-dice-pool">' + dh + '</div></div>';
      if (isComplete) html += '<div class="confirm-valid-msg ok">✓ Coste cubierto</div>';
      else if (sc === diceCost) html += '<div class="confirm-valid-msg error">✕ Selección no válida</div>';
      else html += '<div class="confirm-valid-msg error">Selecciona ' + (diceCost - sc) + ' dado(s) más</div>';
    } else {
      html += '<div class="confirm-body" style="margin-top: 0.8rem;"><strong style="color: var(--accent);">Cambio gratuito</strong> por consonancia de Transformación.</div>';
    }
    if (newChar.id === 'jose') html += '<div class="confirm-body" style="margin-top: 0.4rem; font-size: 0.8rem; color: var(--accent);">🦋 Jose se considera Acelerado hasta terminar su acción.</div>';
    html += '<div class="confirm-body"><div class="confirm-hp-change"><div class="confirm-hp-box"><div class="confirm-hp-value">' + newChar.hp + '/' + newChar.maxHp + '</div><div class="confirm-hp-label">HP</div></div><div class="confirm-hp-arrow">·</div><div class="confirm-hp-box"><div class="confirm-hp-value" style="color: var(--accent);">' + newChar.energy + '/' + newChar.maxEnergy + '</div><div class="confirm-hp-label">Energía</div></div></div>';
    html += '<div class="confirm-rows">';
    if (rules.quick) html += '<div class="confirm-row"><span class="confirm-row-label">Tipo</span><span class="confirm-row-value bonus">Acción Rápida (no pasa turno)</span></div>';
    else html += '<div class="confirm-row"><span class="confirm-row-label">Tipo</span><span class="confirm-row-value">Pasa turno</span></div>';
    html += '</div></div>';
    html += '<div class="confirm-buttons"><button class="confirm-btn confirm-cancel" id="confirmCancelBtn">Cancelar</button><button class="confirm-btn confirm-accept" id="confirmAcceptBtn"' + (!isComplete ? ' disabled' : '') + '>Cambiar</button></div>';
    content.innerHTML = html;
    var picker = content.querySelector('.confirm-dice-pool');
    if (picker) picker.addEventListener('click', function(e){ var de = e.target.closest('.confirm-die'); if (!de || de.classList.contains('locked')) return; var id = de.dataset.dieId; if (selectedIds[id]) { delete selectedIds[id]; playSound('deselect'); } else { if (Object.keys(selectedIds).length >= diceCost) { playSound('error'); return; } selectedIds[id] = true; playSound('select'); } build(); });
    document.getElementById('confirmCancelBtn').addEventListener('click', function(){ hideConfirmation(); playSound('deselect'); });
    var ab = document.getElementById('confirmAcceptBtn');
    if (ab && !ab.disabled) ab.addEventListener('click', function(){ var fd = getSel(); if (diceCost > 0) { var t = trySpendDice(fd, { any:diceCost }); if (!t.ok) return; } hideConfirmation(); playSound('confirm'); onConfirm(fd); });
  }
  build(); ov.classList.add('show');
}
function playerChangeCharacterRequest(targetIndex) {
  if (!combatState || combatState.phase !== 'playing') return;
  if (!canHumanControlCurrentTurn()) return;
  if (isTurnDone()) return;
  var turnKey = getTurnKey();
  var side = combatState[turnKey];
  if (side.activeIndex === targetIndex) {
    if (typeof renderCombat === 'function') renderCombat();
    return;
  }
  if (side.characters[targetIndex].dead) return;
  var rules = getChangeRulesForTarget(turnKey, targetIndex);
  if (rules.diceCost > 0 && !trySpendDice(side.dice, { any:rules.diceCost }).ok) { playSound('error'); return; }
  showChangeConfirmation(targetIndex, function(selectedDice){
    if (rules.diceCost > 0) { var spentIds = {}; selectedDice.forEach(function(d){ spentIds[d.id] = true; }); side.dice = side.dice.filter(function(d){ return !spentIds[d.id]; }); }
    if (rules.discounted) side.firstChangeUsed = true;
    var oldN = side.characters[side.activeIndex].character.name;
    var newN = side.characters[targetIndex].character.name;
    var oldChar = side.characters[side.activeIndex];
    if (oldChar.id === 'jose') csSetState(oldChar, 'acelerado', false);
    side.activeIndex = targetIndex;
    hungerOnEnter(turnKey, side.characters[targetIndex], oldChar);
    if (side.characters[targetIndex].id === 'jose') csSetState(side.characters[targetIndex], 'acelerado', true);

    // ✅ FIX Google EX: llamada que faltaba (la de 17a quedaba pisada)
    applyGoogleExOnChange(oldChar, side, targetIndex, turnKey);

    var sfx = rules.quick ? ' (acción rápida)' : (rules.discounted ? ' (gratis)' : '');
    var label = combatState.pvp ? (turnKey === 'player' ? 'J1' : 'J2') : 'Tú';
    logCombat('🔄 ' + label + ': ' + oldN + ' → ' + newN + sfx);
    if (typeof triggerKillerTunesDamage === 'function') triggerKillerTunesDamage(turnKey);
    playSound('change'); renderCombat();
    if (!rules.quick) setTimeout(nextTurn, 400);
  });
}
