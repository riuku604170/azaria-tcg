function adjustCardCostForPassives(card, side, targetCs) {
  var adjusted = {};
  Object.keys(card.cost || {}).forEach(function(k){ adjusted[k] = card.cost[k]; });
  // ✅ Monetización (EX de YouTube) sobre el lado que juega la carta
  var actSideKey = getTurnKey();
  var sideForMon = combatState[actSideKey];
  if (sideForMon && sideForMon.structures) {
    var mon = sideForMon.structures.find(function(st){ return st.kind === 'monetizacion' && st.usos > 0; });
    if (mon) {
      adjusted.any = (adjusted.any || 0) + 1;
      mon.usos -= 1;
      if (mon.usos <= 0) {
        sideForMon.structures.splice(sideForMon.structures.indexOf(mon), 1);
        logCombat('💸 Monetización agotada y eliminada');
      } else {
        logCombat('💸 Monetización: carta +1 genérico · usos restantes: ' + mon.usos);
      }
    }
  }
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
  // ✅ Opal: -1 dado a equipaciones SOLO si la equipación va sobre Opal.
  // Si no nos pasan target (bot, render de mano), usa el activo como aproximación
  // (el bot siempre equipa al activo, así que ahí es exacto).
  if (card.category === 'equipo') {
    var _targetCs = targetCs || (side.characters ? side.characters[side.activeIndex] : null);
    if (_targetCs && _targetCs.id === 'opal' && !_targetCs.dead) {
      if (adjusted.any && adjusted.any > 0) adjusted.any -= 1;
      else if (adjusted.same && adjusted.same > 0) adjusted.same -= 1;
      else {
        var _ok = Object.keys(adjusted);
        for (var _oi = 0; _oi < _ok.length; _oi++) {
          var _kk = _ok[_oi];
          if (_kk === 'any' || _kk === 'same') continue;
          if (adjusted[_kk] > 0) { adjusted[_kk] -= 1; break; }
        }
      }
      if (adjusted.any === 0) delete adjusted.any;
      if (adjusted.same === 0) delete adjusted.same;
      Object.keys(adjusted).forEach(function(k){ if (adjusted[k] === 0) delete adjusted[k]; });
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
  var card = CARD_DB[cardId] || PAINT_CARDS[cardId] || (typeof PLUSH_CARDS !== 'undefined' && PLUSH_CARDS[cardId]); if (!card) return;

  // ✅ Cartas de peluche (Traductor): confirmación normal, coste 0
  if (card.category === 'plush') {
    showCardConfirmation(cardId, {}, function(selectedDice){
      if (typeof showUsedCardOverlay === 'function') showUsedCardOverlay(card, getTurnKey());
      applyPlushCard(cardId);
      var hi = side.hand.indexOf(cardId);
      if (hi >= 0) side.hand.splice(hi, 1);
      if (!side.discardPile) side.discardPile = [];
      side.discardPile.push(cardId);
      playSound('card');
      renderCombat();
    }, false);
    return;
  }

  if (card.oncePerRound && side.cardsUsedThisRound[cardId]) { playSound('error'); return; }
  if (card.oncePerGame && side.cardsUsedThisGame[cardId]) { playSound('error'); return; }

  // ✅ EQUIPO: primero elegimos target (y slot si reemplaza), luego coste, luego confirmación
  if (card.category === 'equipo') {
    showEquipmentTargetDialog(cardId, function(ti, ri) {
      var targetCs = side.characters[ti];
      if (!targetCs) { renderCombat(); return; }
      var adjustedCost = adjustCardCostForPassives(card, side, targetCs);
      showCardConfirmation(cardId, adjustedCost, function(selectedDice) {
        var spentIds = {}; selectedDice.forEach(function(d){ spentIds[d.id] = true; });
        side.dice = side.dice.filter(function(d){ return !spentIds[d.id]; });
        applyEquipmentToTarget(cardId, ti, ri);
      }, false);  // artemisBlock ya lo maneja el target dialog (bloquea a Artemis)
    }, function cancel() {
      // Canceló la elección de target: no se ha gastado ningún dado, no hay nada que devolver
    });
    return;
  }

  var artemisBlock = cardWouldGiveEnergyToArtemis(card, side);
  var adjustedCost = adjustCardCostForPassives(card, side);
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
  var card = CARD_DB[cardId] || PAINT_CARDS[cardId] || (typeof PLUSH_CARDS !== 'undefined' && PLUSH_CARDS[cardId]); if (!card) return;
  var player = getActiveSide(); if (!player) return;
  // ✅ Overlay grande de carta usada
  showUsedCardOverlay(card, getTurnKey());
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
/* ✅ NUEVO: aplica la equipación al target elegido. NO cobra dados (los cobra el caller). */
function applyEquipmentToTarget(cardId, ti, ri) {
  if (!combatState) return;
  var card = CARD_DB[cardId]; if (!card) return;
  var player = getActiveSide(); if (!player) return;
  var target = player.characters[ti];
  if (!target) return;

  finalizeCardPlay(cardId);

  if (!target.equipment) target.equipment = [];

  // ✅ David: nunca reemplazar la Espada Dorada (slot 0)
  if (target.id === 'david' && target.equipment[0] === 'david_espada') {
    var _maxEq = (typeof getMaxEquipment === 'function') ? getMaxEquipment(target) : 2;
    if (target.equipment.length >= _maxEq) {
      var oldEq = target.equipment[1];
      if (!player.discardPile) player.discardPile = [];
      if (oldEq) player.discardPile.push(oldEq);
      target.equipment[1] = cardId;
    } else {
      target.equipment.push(cardId);
    }
  } else if (ri >= 0) {
    target.equipment[ri] = cardId;
  } else {
    target.equipment.push(cardId);
  }

  var eq = CARD_DB[cardId];
  if (eq && eq.effect) {
    if (eq.effect.shieldBonus) addOrRefreshShield(target, 'eq_' + cardId, eq.effect.shieldBonus);
    if (eq.effect.energyBonus) target.energy = Math.min(target.maxEnergy, target.energy + eq.effect.energyBonus);
    if (eq.effect.healBonus) healChar(target, eq.effect.healBonus);
    if (eq.effect.selfDamage) {
      target.hp = Math.max(0, target.hp - eq.effect.selfDamage);
      if (target.hp <= 0) {
        var who = combatState.player.characters.indexOf(target) >= 0 ? 'player' : 'bot';
        handleDeath(who, player.characters.indexOf(target));
      }
    }
  }

  renderCombat();
}
function applyCardPlay(cardId, spentDice) {
  if (!combatState) return;
  var card = CARD_DB[cardId] || PAINT_CARDS[cardId] || (typeof PLUSH_CARDS !== 'undefined' && PLUSH_CARDS[cardId]); if (!card) return;
  var player = getActiveSide(); if (!player) return;

  if (card.category === 'pintura') {
    var erik = player.characters.find(function(c){ return c.id === 'erik' && !c.dead; });
    if (!erik) { playSound('error'); logCombat('❌ Erik no está en pie'); return; }
    if (erik.paintEquipped) { playSound('error'); logCombat('❌ Erik ya tiene pintura'); return; }
    finalizeCardPlay(cardId); erik.paintEquipped = card.paintColor; logCombat('🎨 ' + erik.character.name + ' equipa ' + card.name);
    renderCombat(); return;
  }

  if (card.category === 'apoyo') {
    if (!player.supports) player.supports = [null,null,null,null,null];
    var _maxSupP = (typeof getMaxSupports === 'function') ? getMaxSupports(getTurnKey()) : 4;
    var es = -1; for (var i = 0; i < _maxSupP; i++) if (!player.supports[i]) { es = i; break; }
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
    return;
  }

  // evento (y cualquier otro)
  finalizeCardPlay(cardId);
  applyCardEffect(card);
  renderCombat();
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
    var _blocksEve = false;
    if (cs.id === 'eve') {
      var _evCard = CARD_DB[cardId];
      if (_evCard && _evCard.effect && (_evCard.effect.shieldBonus || _evCard.effect.shieldPerRound || _evCard.effect.healBonus || _evCard.effect.healPerRound || _evCard.effect.teamShieldBonus || _evCard.effect.teamShieldInstant)) _blocksEve = true;
    }
    var _blocksErikXD = (cs.id === 'erikxd');
    var _isBlocked = _isArtemisBlocked || _blocksEve || _blocksErikXD;
    var _blockTitle = _isArtemisBlocked ? 'Artemis no puede recibir energía' : (_blocksEve ? 'Eve no puede recibir equipaciones con escudo/salud' : (_blocksErikXD ? 'ErikXD no puede recibir equipaciones por cartas' : ''));
    html += '<div class="confirm-char-option' + (_isBlocked ? ' confirm-char-option-blocked' : '') + '" data-idx="' + i + '" style="--el: ' + ELEMENT_COLORS[cs.character.element] + ';"' + (_isBlocked ? ' title="' + _blockTitle + '"' : '') + '>';
    html += '<div class="confirm-char-emoji">' + cs.character.emoji + '</div><div class="confirm-char-name">' + cs.character.name + '</div><div class="confirm-char-equip">';
    if (!cs.equipment) cs.equipment = [];
    var _maxEqD = (typeof getMaxEquipment === 'function') ? getMaxEquipment(cs) : 2;
    for (var ei = 0; ei < _maxEqD; ei++) {
      var eqId = cs.equipment[ei];
      if (eqId && CARD_DB[eqId]) html += '<span class="confirm-char-equip-icon">' + CARD_DB[eqId].emoji + '</span>';
      else html += '<span class="confirm-char-equip-empty">+</span>';
    }
    html += '</div></div>';
  });
  html += '</div><div class="confirm-buttons"><button class="confirm-btn confirm-cancel" id="equipCancelBtn">Cancelar</button></div>';
  content.innerHTML = html;
  content.querySelectorAll('.confirm-char-option').forEach(function(el){ el.addEventListener('click', function(){
    if (el.classList.contains('confirm-char-option-blocked')) { playSound('error'); return; }
    var i = parseInt(el.dataset.idx, 10), t = player.characters[i];
    // ✅ Usa el máximo dinámico (Opal = 3, resto = 2)
    var _maxEq = (typeof getMaxEquipment === 'function') ? getMaxEquipment(t) : 2;
    if (t.equipment && t.equipment.length >= _maxEq) showEquipmentReplaceDialog(cardId, i, onConfirm, onCancel);
    else { hideConfirmation(); onConfirm(i, -1); }
  }); });
  document.getElementById('equipCancelBtn').addEventListener('click', function(){ hideConfirmation(); onCancel(); });
  ov.classList.add('show');
}
function showEquipmentReplaceDialog(cardId, ti, onConfirm, onCancel) {
  var card = CARD_DB[cardId]; if (!card) return;
  var player = getActiveSide(); if (!player) return;
  var target = player.characters[ti];
  if (!target) { onCancel(); return; }
  var ov = document.getElementById('confirmOverlay'), content = document.getElementById('confirmContent');
  if (!ov || !content) { onCancel(); return; }
  if (!target.equipment) target.equipment = [];                              // ✅
  var html = '<div class="confirm-title">⚠️ Reemplazar Equipamiento</div><div class="confirm-subtitle">' + target.character.name + '</div><div class="confirm-body">Selecciona el equipamiento a sustituir.</div><div class="confirm-char-equip-large">';
  var _maxEqR = (typeof getMaxEquipment === 'function') ? getMaxEquipment(target) : 2;
  var _clickableCount = 0;                                                   // ✅
  for (var i = 0; i < _maxEqR; i++) {
    var eqId = target.equipment[i];
    var eq = eqId ? CARD_DB[eqId] : null;
    if (!eq) continue;
    if (target.id === 'david' && eqId === 'david_espada') {
      html += '<div class="confirm-equip-card confirm-equip-card-locked"><div class="confirm-equip-emoji">' + eq.emoji + '</div><div class="confirm-equip-name">' + eq.name + '</div><div class="confirm-equip-effect">🔒 No desequipable (pasiva David)</div></div>';
    } else {
      _clickableCount++;                                                     // ✅
      html += '<div class="confirm-equip-card" data-idx="' + i + '"><div class="confirm-equip-emoji">' + eq.emoji + '</div><div class="confirm-equip-name">' + eq.name + '</div><div class="confirm-equip-effect">' + eq.effectText + '</div></div>';
    }
  }
  if (_clickableCount === 0) {                                               // ✅
    html += '<div class="confirm-body" style="color:var(--muted);font-style:italic;">No hay equipamiento sustituible (todos los slots están bloqueados).</div>';
  }
  html += '</div><div class="confirm-buttons"><button class="confirm-btn confirm-cancel" id="equipReplaceCancelBtn">Cancelar</button></div>';
  content.innerHTML = html;
  content.querySelectorAll('.confirm-equip-card[data-idx]').forEach(function(el){  // ✅ selector más preciso
    el.addEventListener('click', function(){
      var i = parseInt(el.dataset.idx, 10);
      if (isNaN(i)) return;                                                  // ✅ guard
      hideConfirmation();
      onConfirm(ti, i);
    });
  });
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
  var _maxSupR = (typeof getMaxSupports === 'function') ? getMaxSupports(getTurnKey()) : 4;
  for (var i = 0; i < _maxSupR; i++) { var sp = player.supports[i]; if (sp) { var spc = CARD_DB[sp.cardId]; if (spc) html += '<div class="confirm-support-card" data-idx="' + i + '"><div class="confirm-support-emoji">' + spc.emoji + '</div><div class="confirm-support-name">' + spc.name + '</div><div class="confirm-support-duration">⏳ ' + sp.duration + ' r</div></div>'; } }
  html += '</div><div class="confirm-buttons"><button class="confirm-btn confirm-cancel" id="supportReplaceCancelBtn">Cancelar</button></div>';
  content.innerHTML = html;
  content.querySelectorAll('.confirm-support-card').forEach(function(el){ el.addEventListener('click', function(){ var i = parseInt(el.dataset.idx, 10); hideConfirmation(); onConfirm(i); }); });
  document.getElementById('supportReplaceCancelBtn').addEventListener('click', function(){ hideConfirmation(); onCancel(); });
  ov.classList.add('show');
}

function showDiscardDieSelection(cardId, onConfirmDiscard) {
  var ov = document.getElementById('confirmOverlay'), content = document.getElementById('confirmContent'); if (!ov || !content) return;
  var card = CARD_DB[cardId] || PAINT_CARDS[cardId] || (typeof PLUSH_CARDS !== 'undefined' && PLUSH_CARDS[cardId]); if (!card) return;
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
  var card = CARD_DB[cardId] || PAINT_CARDS[cardId] || (typeof PLUSH_CARDS !== 'undefined' && PLUSH_CARDS[cardId]); if (!card) return;
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
    var catL = card.category === 'equipo' ? '⚔️ Equipo' : card.category === 'apoyo' ? '📜 Apoyo' : card.category === 'pintura' ? '🎨 Pintura' : card.category === 'plush' ? '🧸 Peluche' : '✨ Evento';
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
    if (side.dice.length > 0 && card.category !== 'plush') html += '<button class="confirm-btn confirm-discard" id="confirmDiscardBtn" title="...">🗑️ Descartar</button>';
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

function showCardInfo(cardId, opts) {
  opts = opts || {};
  var shopMode = !!opts.shopMode;
  var card = CARD_DB[cardId] || PAINT_CARDS[cardId];
  if (!card) { console.warn('[showCardInfo] Carta no encontrada:', cardId); return; }
  var ov = document.getElementById('cardInfoDialog');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = 'cardInfoDialog';
    ov.className = 'card-info-dialog';
    document.body.appendChild(ov);
  }
  var meta = CARD_CATEGORY_META[card.category] || { label: 'Evento', icon: '✨', color: '165,131,255' };
  var costText = formatCardCost(card);
  var durationText = card.duration ? ' · ⏳ ' + card.duration + ' ronda(s)' : '';
  var html = '<div class="card-info-content" style="--dc: ' + card.color + ';">' +
    '<button class="card-info-close" id="cardInfoClose" aria-label="Cerrar">✕</button>' +
    '<div class="card-info-emoji">' + card.emoji + '</div>' +
    '<div class="card-info-name">' + card.name + '</div>' +
    '<div class="card-info-cat" style="--cat: ' + meta.color + ';">' + meta.icon + ' ' + meta.label + ' · ' + card.tag + '</div>' +
    '<div class="card-info-cost">🎲 ' + costText + durationText + '</div>' +
    '<div class="card-info-effect">' + card.effectText + '</div>';
  if (shopMode) {
    if (typeof isUnlocked === 'function' && !isUnlocked(cardId)) {
      html += '<div class="shop-buy-bar" style="margin-top: 0.8rem; padding: 0.6rem 0; background: none; border-top: 1px solid rgba(240,200,96,0.2);">' +
        '<div class="shop-buy-price">💎 ' + (typeof SHOP_DEFAULT_PRICE !== 'undefined' ? SHOP_DEFAULT_PRICE : 100) + '</div>' +
        '<button class="shop-buy-btn" id="shopBuyBtn">Comprar</button></div>';
    } else {
      html += '<div class="shop-buy-bar" style="margin-top: 0.8rem; padding: 0.6rem 0; background: none; border-top: 1px solid rgba(240,200,96,0.2);"><div class="shop-buy-owned">✓ Ya lo tienes</div></div>';
    }
  }
  html += '</div>';
  ov.innerHTML = html;
  ov.classList.add('show');
  document.getElementById('cardInfoClose').addEventListener('click', function(){ ov.classList.remove('show'); });
  ov.addEventListener('click', function(e){ if (e.target === ov) ov.classList.remove('show'); });
  if (shopMode) {
    var bb = document.getElementById('shopBuyBtn');
    if (bb) bb.addEventListener('click', function(){ if (typeof buyShopItem === 'function') buyShopItem(cardId, 'cards'); });
  }
}
/* ═══ Cartas de peluche (Traductor) ═══ */
function triggerPlushOnDraw(who, cid) {
  var side = combatState[who];
  if (cid === 'plush_bar') {
    // 2 daño al activo del que la robó + marca con Ilusión + inyecta Katze en el mazo contrario
    var active = side.characters[side.activeIndex];
    if (active && !active.dead) {
      dealDamageToChar(active, 2, { targetSide: side, targetSideKey: who, targetIdx: side.activeIndex });
      if (!active.dead) triggerMarkOrResonance(active, 'ilusion', who, who, side.activeIndex);
    }
    var ek = who === 'player' ? 'bot' : 'player';
    var es = combatState[ek];
    es.deck.push('plush_katze');
    es.deck = shuffleArray(es.deck);
    logCombat('🐻 Plüschbär activado: 2 daño + marca + Plüschkatze inyectada');
  } else if (cid === 'plush_katze') {
    side.characters.forEach(function(c){ if (!c.dead) healChar(c, 1); });
    logCombat('🐱 Plüschkatze activado: +1 HP a todo el equipo');
  }
  // Freundschaft: +1 energía a Traductor
  ['player','bot'].forEach(function(wk){
    var t = combatState[wk].characters.find(function(c){ return c.id === 'traductor' && !c.dead; });
    if (t) {
      t.energy = Math.min(t.maxEnergy, t.energy + 1);
      logCombat('🧸 Freundschaft: Traductor +1 energía');
    }
  });
}
function applyPlushCard(cardId) {
  var side = getActiveSide(); if (!side) return;
  var active = side.characters[side.activeIndex];
  if (cardId === 'plush_hase') {
    if (active && !active.dead) healChar(active, 3);
    var ek = getEnemyKey();
    var es = combatState[ek];
    es.deck.push('plush_bar');
    es.deck = shuffleArray(es.deck);
    logCombat('🐰 Plüschhase: +3 HP al activo + Plüschbär inyectado en mazo rival');
    ['player','bot'].forEach(function(wk){
      var t = combatState[wk].characters.find(function(c){ return c.id === 'traductor' && !c.dead; });
      if (t) { t.energy = Math.min(t.maxEnergy, t.energy + 1); logCombat('🧸 Freundschaft: Traductor +1 energía'); }
    });
  }
}
