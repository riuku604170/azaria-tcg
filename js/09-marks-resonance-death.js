/* ═══ Número de daño flotante ═══ */
function showDamageNumber(who, idx, amount, opts) {
  opts = opts || {};
  if (!amount || amount <= 0) return;
  var sel = '.combat-char-card[data-team="' + who + '"][data-index="' + idx + '"]';
  var card = document.querySelector(sel);
  if (!card) return;
  var rect = card.getBoundingClientRect();
  var span = document.createElement('div');
  span.className = 'damage-float' + (opts.piercing ? ' piercing' : '');
  span.textContent = '−' + amount;
  span.style.left = (rect.left + rect.width / 2) + 'px';
  span.style.top  = (rect.top + rect.height * 0.35) + 'px';
  span.style.setProperty('--dx', (Math.random() * 40 - 20) + 'px');
  document.body.appendChild(span);
  setTimeout(function(){ if (span.parentNode) span.remove(); }, 1250);
}

/* ═══ CRUZ DE MADERA / SANGRE (Orath) ═══ */
function countCruzMadera(side) {
  if (!side || !side.structures) return 0;
  return side.structures.filter(function(s){ return s.kind === 'cruzMadera'; }).length;
}
function spawnCruzMadera(whoKey, allyId, source) {
  var side = combatState[whoKey];
  if (!side.structures) side.structures = [];
  if (!side.cruzMaderaByAlly) side.cruzMaderaByAlly = {};
  var tag = source || allyId;
  if (side.cruzMaderaByAlly[tag]) return false;
  side.structures.push({ kind:'cruzMadera', duration:999, ownerId:allyId, source:tag });
  side.cruzMaderaByAlly[tag] = true;
  logCombat('✝️ Se genera una Cruz de Madera (' + (source === 'shield' ? 'escudo de Orath' : allyId) + ')');
  return true;
}
function destroyCruzMadera(side, whoKey, st, opts) {
  opts = opts || {};
  var idx = side.structures.indexOf(st);
  if (idx < 0) return;
  side.structures.splice(idx, 1);
  if (side.cruzMaderaByAlly) {
    if (st.ownerId && side.cruzMaderaByAlly[st.ownerId]) delete side.cruzMaderaByAlly[st.ownerId];
    if (st.source && side.cruzMaderaByAlly[st.source]) delete side.cruzMaderaByAlly[st.source];
  }
  logCombat('✝️ Cruz de Madera destruida');
  if (!opts.silent) {
    var ea = getEnemyActiveOf(whoKey);
    if (ea.active && !ea.active.dead) {
      dealDamageToChar(ea.active, 1, { targetSide:ea.side, targetSideKey:ea.key, targetIdx:ea.side.activeIndex });
    }
  }
}
function destroyAllCruzMadera(whoKey, opts) {
  var side = combatState[whoKey];
  if (!side.structures) return 0;
  var cruces = side.structures.filter(function(s){ return s.kind === 'cruzMadera'; });
  var count = cruces.length;
  cruces.forEach(function(st){ destroyCruzMadera(side, whoKey, st, opts); });
  return count;
}
function spawnCruzSangre(whoKey) {
  var side = combatState[whoKey];
  if (!side.structures) side.structures = [];
  if (side.cruzSangreActive) return;
  side.structures.push({ kind:'cruzSangre', duration:999 });
  side.cruzSangreActive = true;
  logCombat('✝️ Se genera la Cruz de Sangre');
}
function destroyCruzSangre(whoKey) {
  var side = combatState[whoKey];
  if (!side.structures) return;
  var idx = side.structures.findIndex(function(s){ return s.kind === 'cruzSangre'; });
  if (idx < 0) return;
  side.structures.splice(idx, 1);
  side.cruzSangreActive = false;
  logCombat('✝️ Cruz de Sangre destruida');
  if (side.lastDeadAlly) {
    var rev = side.characters.find(function(c){ return c.id === side.lastDeadAlly; });
    if (rev && rev.dead) {
      rev.dead = false;
      rev.hp = 1;
      addOrRefreshShield(rev, 'cruzSangre', 2);
      if (rev.id === 'hunger') {
        rev.hp = rev.maxHp;
        logCombat('👹 Hunger revive y se cura al máximo (' + rev.hp + '/' + rev.maxHp + ')');
      }
      if (side.activeIndex === -1 || side.characters[side.activeIndex].dead) side.activeIndex = side.characters.indexOf(rev);
      logCombat('✝️ Cruz de Sangre revive a ' + rev.character.name + ' con 1 HP y 2 escudo');
      if (rev.id === 'adela' && hasAnyMark(rev)) {
        transformAdelaToHunger(rev);
      }
    }
  }
}

/* ═══ MARKS / STATES ═══ */
function csHasState(cs, k){ return !!(cs && cs.states && cs.states[k]); }
function csSetState(cs, k, v){ if (!cs.states) cs.states = {}; cs.states[k] = v; }
function csAddMark(cs, el){ if (!cs.marks) cs.marks = {}; if (cs.marks[el]) return false; cs.marks[el] = true; return true; }
function csRemoveMark(cs, el){ if (cs && cs.marks) delete cs.marks[el]; }
function csHasMark(cs, el){ return !!(cs && cs.marks && cs.marks[el]); }
function csAllMarks(cs){ return cs && cs.marks ? Object.keys(cs.marks) : []; }

/* ═══ KILLER TUNES ═══ */
function triggerKillerTunesDamage(sideKey) {
  if (!combatState) return;
  var side = combatState[sideKey];
  if (!side || !side.neonUltChangeDamage) return;
  var ek = sideKey === 'player' ? 'bot' : 'player';
  var es = combatState[ek];
  var ea = es.characters[es.activeIndex];
  if (ea && !ea.dead) {
    dealDamageToChar(ea, 1, {
      targetSide: es,
      targetSideKey: ek,
      targetIdx: es.activeIndex
    });
    logCombat('🎵 Killer Tunes: cambio de personaje → 1 daño a ' + ea.character.name);
  }
}

/* ═══ MARKS / RESONANCE ═══ */
function triggerMarkOrResonance(targetCs, newEl, who, targetSideKey, targetIdx) {
  // ✅ EX Ren (Espejismo): los aliados de Ren no pueden ser marcados con Ilusión
  if (newEl === 'ilusion' && combatState) {
    var tSide = (combatState.player.characters.indexOf(targetCs) >= 0) ? combatState.player : combatState.bot;
    var renEx = tSide.characters.find(function(c){ return c.id === 'ren' && c.exActive && !c.dead; });
    if (renEx) {
      logCombat('🌟 EX Ren: ' + targetCs.character.name + ' no puede ser marcado con Ilusión');
      return;
    }
  }
  var existing = csAllMarks(targetCs);
  if (existing.length > 0) {
    var oldEl = existing[0];
    csRemoveMark(targetCs, oldEl); csRemoveMark(targetCs, newEl);
    logCombat('✨ Resonancia: ' + ELEMENT_EMOJI[oldEl] + ' + ' + ELEMENT_EMOJI[newEl]);
    applyResonanceEffect(oldEl, newEl, who, targetSideKey);
  } else {
    csAddMark(targetCs, newEl);
    logCombat('🏷️ ' + targetCs.character.name + ' marcado con ' + ELEMENT_EMOJI[newEl]);
  }
}
function applyResonanceEffect(elA, elB, who, targetSideKey) {
  var side = combatState[who];
  var active = side.characters[side.activeIndex];
  var found = null;
  for (var i = 0; i < RESONANCES.length; i++) { var r = RESONANCES[i]; if ((r.a === elA && r.b === elB) || (r.a === elB && r.b === elA)) { found = r; break; } }
  if (!found) return;
  switch (found.name) {
    case 'Fortaleza': if (active && !active.dead) addOrRefreshShield(active, 'resonancia', 2); break;
    case 'Revelación': side.characters.forEach(function(c){ if (!c.dead && c.energy === 0) c.energy = Math.min(c.maxEnergy, c.energy + 1); }); break;
    case 'Obra Maestra': for (var d = 0; d < 2; d++) drawFromDeck(who); break;
    case 'Expiación': if (active) active.cardNextAttackBonus = (active.cardNextAttackBonus || 0) + 1; break;
    case 'Serenidad': { var alive = side.characters.filter(function(c){ return !c.dead; }); if (alive.length) { alive.sort(function(a,b){ return a.hp - b.hp; }); alive[0].hp = Math.min(alive[0].maxHp, alive[0].hp + 2); } break; }
    case 'Preparación': side.characters.forEach(function(c){ if (!c.dead && totalShield(c) > 0) c.energy = Math.min(c.maxEnergy, c.energy + 1); }); break;
    case 'Paradoja': side.dice = side.dice.map(function(d){ return { type: Math.random() < 0.125 ? 'omni' : CONSONANCE_ORDER[Math.floor(Math.random()*7)], id: d.id, justAdded: true }; }); break;
    default: logCombat('🔮 Resonancia aplicada: ' + found.name); break;
  }
}

/* ═══ MUERTE ═══ */
function handleDeath(who, index) {
  var side = combatState[who], t = side.characters[index];
  if (!t || t.dead) return 'ok';
  t.dead = true;
  logCombat('💀 ' + t.character.name + ' ha caído');
  side.anyAllyDiedThisRound = true;

  // ── Entorno del que era dueño ──
  if (combatState.environment && combatState.environment.ownerCsId === t.id) {
    logCombat('🌍 El entorno ' + combatState.environment.name + ' desaparece al caer ' + t.character.name);
    combatState.environment = null;
    if (typeof updateEnvironmentVisuals === 'function') updateEnvironmentVisuals();
  }

  // ── Cruz de Sangre (Orath) ──
  var orathCs = side.characters.find(function(c){ return c.id === 'orath'; });
  var cruzSangreAllowed = !!(orathCs && orathCs.exActive);
  if (t.id === 'orath') {
    if (cruzSangreAllowed) spawnCruzSangre(who);
    else logCombat('✝️ Orath cae sin su EX activa: no se genera la Cruz de Sangre');
  }
  if (t.id !== 'orath') {
    side.lastDeadAlly = t.id;
    if (side.cruzSangreActive) destroyCruzSangre(who);
  }

  // ── ✅ LIMPIEZA TOTAL DEL PERSONAJE CAÍDO ──
  t.equipment = [];
  t.paintEquipped = null;
  t.energy = 0;
  t.shields = [];
  t.marks = {};
  t.states = {};
  t.pendingBuff = 0;
  t.cardNextAttackBonus = 0;
  t.cardNextAttackPiercing = false;
  t.cardNextAttackDouble = false;
  t.cardNextAbilityDiscount = 0;
  t.cardNextAbilityFree = false;
  t.cardMarkBonus = 0;
  t.manuelStacks = 0;
  t.nextCardDiscount = 0;

  // ── Estructuras creadas por este aliado ──
  if (side.structures) {
    side.structures = side.structures.filter(function(st){
      return st.ownerId !== t.id && st.source !== t.id;
    });
  }
  if (side.cruzMaderaByAlly) {
    delete side.cruzMaderaByAlly[t.id];
  }

  // ── Cambio de activo si era él ──
  if (side.activeIndex === index) {
    var nx = getNextAliveIndex(side, index);
    if (nx === -1) return 'all_dead';
    side.activeIndex = nx;
    logCombat('➡️ ' + side.characters[nx].character.name + ' pasa a activo');
  }
  return 'ok';
}

/* ═══ DAÑO / CURACIÓN ═══ */
function dealDamageToChar(targetCs, rawDamage, opts) {
  opts = opts || {};
  if (targetCs.dead) return 0;
  var hadProteccionMark = csHasMark(targetCs, 'proteccion');   // ✅ EX Noah
  rawDamage = exHookModifyIncomingDamage(targetCs, rawDamage, opts.attackerCs);

  // ✅ EX-María: reduce el daño A 1 y difiere el resto al final de la ronda
  if (targetCs.id === 'exmaria' && targetCs.exActive && rawDamage > 1 && !opts.skipExmariaDelay) {
    if (!targetCs.states) targetCs.states = {};
    var excessDmg = rawDamage - 1;
    targetCs.states.delayedDamage = (targetCs.states.delayedDamage || 0) + excessDmg;
    rawDamage = 1;
    logCombat('🌻 EX-María reduce el daño a 1 y difiere ' + excessDmg + ' al final de la ronda');
  }

  var side = opts.targetSide, sideKey = opts.targetSideKey, idx = opts.targetIdx;
  var flat = getDamageReduction(targetCs, side);
  if (csHasState(targetCs, 'vuelo')) flat += 2;
  if (flat > 0) rawDamage = Math.max(0, rawDamage - flat);
  if (csHasState(targetCs, 'vuelo') && rawDamage >= 0) logCombat('🦅 Vuelo: -2 daño');
  var vulnRed = 0;
  if (csHasState(targetCs, 'vulnerable') && rawDamage > 0) {
    vulnRed = 1;
    csSetState(targetCs, 'vulnerable', false);
    if (opts.attackerCs) {
      var wasAlreadyAmenaza = csHasState(opts.attackerCs, 'amenaza');
      csSetState(opts.attackerCs, 'amenaza', true);
      // ✅ Q5: si el atacante YA era Amenaza y golpea a un Vulnerable → se marca con Protección.
      if (wasAlreadyAmenaza) {
        triggerMarkOrResonance(opts.attackerCs, 'proteccion', undefined, undefined, undefined);
        logCombat('⚠️ Amenaza → atacó a Vulnerable: ' + opts.attackerCs.character.name + ' marcado con Protección');
      }
    }
  }
  rawDamage = Math.max(0, rawDamage - vulnRed);
  var defensaReduction = 0;
  if (csHasState(targetCs, 'defensaActiva') && rawDamage > 0 && opts.attackerCs) {
    defensaReduction = 1;
    rawDamage = Math.max(0, rawDamage - 1);
    csSetState(targetCs, 'defensaActiva', false);
    logCombat('💠 Defensa Activa: -1 daño');
  }

  // ✅ Número flotante con el DAÑO FINAL (tras reducciones, ANTES de escudos)
  if (rawDamage > 0) {
    showDamageNumber(sideKey, idx, rawDamage, { piercing: !!opts.piercing });
  }
  // ✅ EX Óliver (Perfeccionamiento Absoluto): dobla el daño FINAL de las definitivas
  if (opts.attackerCs && combatState && combatState._currentActionType === 'ultimate') {
    var atkSide = (combatState.player.characters.indexOf(opts.attackerCs) >= 0) ? combatState.player : combatState.bot;
    if (atkSide.obraMaestraTurns > 0) {
      var hasPortatil = atkSide.structures && atkSide.structures.some(function(st){ return st.kind === 'optimizacion'; });
      var oliverEx = atkSide.characters.find(function(c){ return c.id === 'oliver' && c.exActive && !c.dead; });
      if (hasPortatil && oliverEx) {
        rawDamage *= 2;
        logCombat('🌟 EX Óliver: daño final ×2');
      }
    }
  }

  var res = absorbWithShields(targetCs, rawDamage, !!opts.piercing);
  if (res.absorbed > 0) {
    logCombat('🛡️ Escudo absorbe ' + res.absorbed + (totalShield(targetCs) > 0 ? ' (queda ' + totalShield(targetCs) + ')' : ' ¡roto!'));
    if (opts.attackerCs && targetCs.id === 'orath' && csHasState(targetCs, 'minutoSilencioShield')) {
      var okCruz = spawnCruzMadera(sideKey, 'orath_shield', 'shield');
      if (okCruz) logCombat('✝️ El escudo de Orath es golpeado: Cruz de Madera propia');
    }
    if (csHasState(targetCs, 'hipotesisShieldActive') && opts.attackerCs && !opts.attackerCs.dead) {
      var attKey = (combatState.player.characters.indexOf(opts.attackerCs) >= 0) ? 'player' : 'bot';
      var attSide = combatState[attKey];
      var attIdx = attSide.characters.indexOf(opts.attackerCs);
      triggerMarkOrResonance(opts.attackerCs, 'comprension', sideKey, attKey, attIdx);
      logCombat('🛡️ Hipótesis Sólida: ' + opts.attackerCs.character.name + ' marcado con comprensión');
    }
  }
  if (res.overflow > 0) {
    // ✅ Podrida (NC): el daño verdadero recibido aumenta en 1 y causa 1 al enemigo activo.
    // Aplica a CUALQUIER fuente de daño verdadero (propio, enemigo, entorno, etc.).
    // El `skipPodrida` evita que el daño reflejado dispare la Podrida del enemigo (bucle en espejo).
    if (targetCs.id === 'nc' && csHasState(targetCs, 'podrida') && !opts.podridaApplied && !opts.skipPodrida) {
      opts.podridaApplied = true;
      res.overflow += 1;
      logCombat('🦠 Podrida: daño verdadero sobre NC +1 (total: ' + res.overflow + ')');
      var podridaSide = sideOfChar(targetCs);
      if (podridaSide) {
        var podridaEKey = podridaSide.key === 'player' ? 'bot' : 'player';
        var podridaESide = combatState[podridaEKey];
        var podridaEActive = podridaESide.characters[podridaESide.activeIndex];
        if (podridaEActive && !podridaEActive.dead) {
          dealDamageToChar(podridaEActive, 1, {
            targetSide: podridaESide, targetSideKey: podridaEKey,
            targetIdx: podridaESide.activeIndex, skipPodrida: true
          });
          logCombat('🦠 Podrida: 1 daño a ' + podridaEActive.character.name);
        }
      }
    }

    if (targetCs.id === 'alter' && targetCs.states && targetCs.states.invulnerabilidad > 0) {
      var inv = targetCs.states.invulnerabilidad;
      var reduced = Math.min(inv, res.overflow);
      res.overflow -= reduced;
      logCombat('🛡️ Invulnerabilidad de Alter: -' + reduced + ' daño (invulnerabilidad sigue en ' + inv + ')');
      if (res.overflow <= 0) {
        logCombat('💥 Daño verdadero anulado por invulnerabilidad');
        return 0;
      }
    }
    targetCs.hp = Math.max(0, targetCs.hp - res.overflow);
    logCombat('💥 Daño verdadero: ' + res.overflow + ' · HP: ' + targetCs.hp + '/' + targetCs.maxHp);
    // ✅ NC: +1 energía cada vez que recibe daño verdadero
    if (targetCs.id === 'nc' && !targetCs.dead) {
      var beforeEn = targetCs.energy;
      targetCs.energy = Math.min(targetCs.maxEnergy, targetCs.energy + 1);
      if (targetCs.energy > beforeEn) logCombat('🎯 NC gana 1 energía (daño verdadero recibido)');
    }
    if (targetCs.id === 'internet' && targetCs.hp > 0 && targetCs.hp <= 2 && !targetCs.states.internetEnergyGranted) {
      targetCs.energy = Math.min(targetCs.maxEnergy, targetCs.energy + 1);
      targetCs.states.internetEnergyGranted = true;
      logCombat('🌐 Orgullo de la Creadora: Internet gana 1 energía al bajar a ' + targetCs.hp + ' HP');
    }
    triggerVibrate(sideKey, idx); playSound(opts.piercing ? 'pierce' : 'impact');
    if (csHasState(targetCs, 'vuelo')) {
      targetCs.hp = Math.max(0, targetCs.hp - 3);
      targetCs.energy = Math.min(targetCs.maxEnergy, targetCs.energy + 1);
      csSetState(targetCs, 'vuelo', false);
      logCombat('🦅 Vuelo perdido: +3 daño, +1 energía · HP: ' + targetCs.hp + '/' + targetCs.maxHp);
    }
    if (targetCs.id === 'eevee' && !targetCs.dead && targetCs.hp > 0 && opts.attackerCs) {
      // ✅ Furia se activa al recibir daño verdadero (no cualquier golpe)
      csSetState(targetCs, 'furia', true);
      csSetState(targetCs, 'furiaTarget', opts.attackerCs.id);
      logCombat('🔥 Eevee entra en Furia contra ' + opts.attackerCs.character.name);
    }
    if (res.overflow > 0 && targetCs.id !== 'orath' && sideKey) {
      var orathAlly = combatState[sideKey].characters.find(function(c){ return c.id === 'orath' && !c.dead; });
      if (orathAlly) {
        spawnCruzMadera(sideKey, targetCs.id, targetCs.id);
      }
    }
    if (targetCs.hp <= 0) {
      if (!exHookPreventDeath(targetCs, sideKey, idx)) {
        handleDeath(sideKey, idx);
      }
    }
  }
  // ✅ EX Noah (Vibración Compasiva): al golpear a un enemigo con Protección, cura 1 HP a aliados no Sintonizados
  if (opts.attackerCs && opts.attackerCs.id === 'noah' && opts.attackerCs.exActive && hadProteccionMark) {
    var noahSide = (combatState.player.characters.indexOf(opts.attackerCs) >= 0) ? combatState.player : combatState.bot;
    var healedNoah = 0;
    noahSide.characters.forEach(function(c){
      if (c.dead || csHasState(c, 'sintonia')) return;
      var h = healChar(c, 1);
      if (h > 0) healedNoah++;
    });
    if (healedNoah > 0) logCombat('🌟 EX Noah: enemigo con Protección → ' + healedNoah + ' aliado(s) +1 HP');
  }
  if (defensaReduction > 0 && opts.attackerCs && !opts.attackerCs.dead && combatState) {
    var attCs = opts.attackerCs;
    var attKey2 = (combatState.player.characters.indexOf(attCs) >= 0) ? 'player' : 'bot';
    var attSide2 = combatState[attKey2];
    var attIdx2 = attSide2.characters.indexOf(attCs);
    var eeveeEx = targetCs.exActive;   // capturado antes del setTimeout
    setTimeout(function() {
      if (!combatState || !attCs || attCs.dead) return;
      dealDamageToChar(attCs, 2, { attackerCs: targetCs, targetSide: attSide2, targetSideKey: attKey2, targetIdx: attIdx2 });
      logCombat('⚡ Eevee contraataca a ' + attCs.character.name);
      // ✅ EX Eevee (Territorial): el contraataque marca con Protección
      if (eeveeEx && !attCs.dead) {
        triggerMarkOrResonance(attCs, 'proteccion', attKey2, attKey2, attIdx2);
        logCombat('🌟 EX Eevee: contraataque marca con Protección');
      }
    }, 120);
  }
  return res.overflow;
}

function healChar(cs, amount, opts) {
  opts = opts || {};
  if (!cs || cs.dead) return 0;
  amount = exHookModifyHealing(cs, amount);

  // ✅ Campo de Girasoles: +1 a toda curación del equipo dueño
  if (combatState && combatState.environment && combatState.environment.id === 'campo_girasoles' && amount > 0) {
    var csSide = sideOfChar(cs);
    if (csSide && csSide.key === combatState.environment.ownerSide) {
      amount += 1;
      logCombat('🌻 Campo de Girasoles: +1 curación');
    }
  }

  // ✅ NC: los efectos de salud sobre ella se reducen en 1 (salvo que se ignore explícitamente)
  if (cs.id === 'nc' && amount > 0 && !opts.ignoreNC) {
    amount = Math.max(0, amount - 1);
  }

  // ✅ EX-María: difiere 1 curación al final de la ronda
  if (cs.id === 'exmaria' && cs.exActive && amount > 0 && !opts.skipExmariaDelay) {
    if (!cs.states) cs.states = {};
    cs.states.delayedHealing = (cs.states.delayedHealing || 0) + 1;
    amount -= 1;
    logCombat('🌻 EX-María difiere 1 curación al final de la ronda');
    if (amount === 0) return 0;
  }

  if (cs.id === 'alaya' && csHasState(cs, 'castigada')) {
    logCombat('🩸 Alaya castigada: curación → daño verdadero');
    var sideKey = (combatState.player.characters.indexOf(cs) >= 0) ? 'player' : 'bot';
    var side = combatState[sideKey];
    var idx = side.characters.indexOf(cs);
    // 1 punto de condena por cada punto de curación convertido
    var condenaGain = amount;
    cs.states.condena = (cs.states.condena || 0) + condenaGain;
    logCombat('💀 Alaya gana ' + condenaGain + ' condena (total: ' + cs.states.condena + ')');
    dealDamageToChar(cs, amount, { piercing:true, targetSide:side, targetSideKey:sideKey, targetIdx:idx });
    return -amount;
  }
  var before = cs.hp; cs.hp = Math.min(cs.maxHp, cs.hp + amount); var eff = cs.hp - before;
  if (eff > 0) logCombat('💚 ' + cs.character.name + ' +' + eff + ' HP');

  // ✅ Podrida (NC): si es curada → 1 daño al enemigo activo.
  // Se pasa `skipPodrida:true` para que este daño reflejado NO dispare
  // a su vez la Podrida del enemigo (evita bucles en espejo).
  if (cs.id === 'nc' && csHasState(cs, 'podrida') && eff > 0) {
    var podridaHealSide = sideOfChar(cs);
    if (podridaHealSide) {
      var podridaHKey = podridaHealSide.key === 'player' ? 'bot' : 'player';
      var podridaHSide = combatState[podridaHKey];
      var podridaHActive = podridaHSide.characters[podridaHSide.activeIndex];
      if (podridaHActive && !podridaHActive.dead) {
        dealDamageToChar(podridaHActive, 1, {
          targetSide: podridaHSide, targetSideKey: podridaHKey,
          targetIdx: podridaHSide.activeIndex, skipPodrida: true
        });
        logCombat('🦠 Podrida: NC curada → 1 daño a ' + podridaHActive.character.name);
      }
    }
  }
  if (csHasState(cs, 'sintonia') && combatState) {
    var side2 = (combatState.player.characters.indexOf(cs) >= 0) ? combatState.player : combatState.bot;
    var sints = side2.characters.filter(function(c){ return c !== cs && !c.dead && csHasState(c, 'sintonia'); });
    if (sints.length) {
      sints.forEach(function(ally){ ally.hp = Math.min(ally.maxHp, ally.hp + eff); });
      logCombat('🎵 Sintonía: ' + sints.length + ' aliado(s) curan ' + eff);
      csSetState(cs, 'sintonia', false);
      sints.forEach(function(a){ csSetState(a, 'sintonia', false); });
    }
  }
  return eff;
}

function applyErikPassive(cs) {
  if (!cs || cs.id !== 'erik' || !combatState) return 0;
  var side = combatState.player.characters.indexOf(cs) >= 0 ? combatState.player : combatState.bot;
  var alive = side.characters.filter(function(c){ return !c.dead; }).length;
  if (alive === 2) return 1;
  if (alive === 1) return 2;
  return 0;
}

/* ═══ ADELA / HUNGER ═══ */
function hasAnyMark(cs){ return cs && cs.marks && Object.keys(cs.marks).length > 0; }
function adelaEffectBonus(cs){
  if (!cs || cs.id !== 'adela') return 0;
  return hasAnyMark(cs) ? 1 : 0;
}
function adelaCostBonus(cs){
  if (!cs || cs.id !== 'adela') return 0;
  return hasAnyMark(cs) ? 1 : 0;
}
function hungerMarkMultiplier(cs){
  if (!cs || cs.id !== 'hunger') return 1;
  return hasAnyMark(cs) ? 2 : 1;
}
function hungerOnEnter(sideKey, newHungerCs, oldActiveCs){
  if (!newHungerCs || newHungerCs.id !== 'hunger') return;
  if (oldActiveCs && !oldActiveCs.dead) {
    var oldSide = sideOfChar(oldActiveCs);
    if (oldSide) {
      dealDamageToChar(oldActiveCs, 1, { targetSide:oldSide.side, targetSideKey:oldSide.key, targetIdx:oldSide.side.characters.indexOf(oldActiveCs) });
    }
  }
  if (!newHungerCs.dead) healChar(newHungerCs, 1);
}
function transformAdelaToHunger(cs){
  if (!cs || cs.id !== 'adela') return;
  var hungerChar = COMBAT_CHARS.hunger;
  cs.id = 'hunger';
  cs.character = hungerChar;
  cs.hp = hungerChar.hp;
  cs.maxHp = hungerChar.hp;
  cs.energy = 0;
  cs.maxEnergy = getMaxEnergyFor(hungerChar);
  cs.marks = {};
  cs.states = cs.states || {};
  cs.states.invulnerabilidad = 0;
  cs.noResurrectLimit = true;
  logCombat('👹 Adela se transforma en Hunger Incarnate');
}

/* ═══ HOOKS EX (pasivas permanentes) ═══ */
function exHookModifyIncomingDamage(targetCs, damage, attackerCs) {
  if (!targetCs || !targetCs.exActive) return damage;
  return damage;
}
function exHookModifyHealing(targetCs, amount) {
  if (!targetCs || !targetCs.exActive) return amount;
  return amount;
}
function exHookPreventDeath(cs, sideKey, idx) {
  if (!cs || !cs.exActive) return false;
  return false;
}
function exHookRoundStart(cs, sideKey) {
  if (!cs || !cs.exActive) return;
  // ✅ EX NC: comienza cada ronda con Podrida
  if (cs.id === 'nc') {
    csSetState(cs, 'podrida', true);
    logCombat('🎯 EX NC: comienza la ronda con Podrida');
  }
}
function exHookModifyOutgoingDamage(attackerCs, damage, targetCs) {
  if (!attackerCs || !attackerCs.exActive) return damage;
  return damage;
}
