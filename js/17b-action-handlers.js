// 17b-action-handlers.js
// Despachador de efectos por tipo de habilidad.
// Cada handler recibe un contexto `ctx` que expone el estado del combate
// en el momento de resolver la habilidad y puede mutar `ctx.shouldEndTurn`
// y `ctx.pendingBuffConsumed`.

/* ═══ Helper central: aplica Obra Maestra al DAÑO BASE de una definitiva ═══ */
function applyObraMaestraToBase(attackerCs, ability, actionType, baseDmg) {
  if (!combatState) return baseDmg;
  if (actionType !== 'ultimate') return baseDmg;
  if (ability.kind === 'instinto') return baseDmg;
  var side = (combatState.player.characters.indexOf(attackerCs) >= 0) ? combatState.player : combatState.bot;
  if (!side.obraMaestraTurns || side.obraMaestraTurns <= 0) return baseDmg;
  var hasPortatil = side.structures && side.structures.some(function(st){ return st.kind === 'optimizacion'; });
  if (!hasPortatil) return baseDmg;
  // ✅ EX Óliver: NO dobla base; el doblado se hace al FINAL en dealDamageToChar
  var oliverEx = side.characters.find(function(c){ return c.id === 'oliver' && c.exActive && !c.dead; });
  if (oliverEx) return baseDmg;
  return baseDmg * 2;
}

/* ═══ Iris: Suela a la Cara (reutilizable por su definitiva) ═══ */
function executeSuelaALaCaraDamage(a, ea, es, ek, side, who, extraBaseDmg, ctx) {
  var dmg = 2 + (extraBaseDmg || 0);
  // Romper equipación propia (no cuenta pinturas)
  if (a.equipment && a.equipment.length > 0) {
    var equipCount = a.equipment.length;
    dmg += equipCount;
    logCombat('🥊 Suela a la Cara: +' + equipCount + ' daño por romper equipación');
    if (!side.discardPile) side.discardPile = [];
    a.equipment.forEach(function(eqId){
      var eqName = CARD_DB[eqId] ? CARD_DB[eqId].name : eqId;
      side.discardPile.push(eqId);
      logCombat('💥 Equipación rota: ' + eqName);
    });
    a.equipment = [];
  }
  // Modificadores genéricos (aplica como ataque normal)
  dmg = applyGenericDamageMods(a, dmg, false);
  if (a.pendingBuff && ctx) ctx.pendingBuffConsumed = true;
  var ob = getOptimizationBonus(side);
  if (ob > 0) { dmg += ob; logCombat('🏛️ Optimización: +' + ob); }
  // EX: consume cargas de Advertido para +2 daño por carga
  if (a.exActive && ea.states && ea.states.advertido > 0) {
    var charges = ea.states.advertido;
    dmg += 2 * charges;
    ea.states.advertido = 0;
    logCombat('🌟 EX Iris: +' + (2 * charges) + ' daño por ' + charges + ' carga(s) de Advertido consumida(s)');
  }
  applyDamageWithMods(ea, dmg, false, ek, es.activeIndex, a);
}

var ACTION_HANDLERS = {

  carrerilla: function(ctx) {
    var a = ctx.active;
    csSetState(a, 'carrerilla', true);
    logCombat('🏃 Carrerilla: siguiente ataque +2 daño · +1 energía extra si es normal');
  },

  estratosfera: function(ctx) {
    var a = ctx.active, es = ctx.enemySide, ek = ctx.enemyKey, who = ctx.who, side = ctx.side;
    if (!csHasState(a, 'vuelo')) {
      csSetState(a, 'vuelo', true);
      logCombat('🦅 Artemis entra en Vuelo');
      return;
    }
    var carrB = 0;
    if (csHasState(a, 'carrerilla')) { carrB = 2; csSetState(a, 'carrerilla', false); logCombat('🏃 Carrerilla: +2 daño a cada enemigo'); }
    var exB = a.exActive ? 2 : 0;
    // ✅ Obra Maestra dobla SOLO el daño base (6 + exB); Carrerilla es bono
    var baseDmg = applyObraMaestraToBase(a, ctx.ability, ctx.actionType, 6 + exB);
    var dmg = baseDmg + carrB;
    var hitCount = 0;
    es.characters.forEach(function(c, i){
      if (c.dead) return;
      applyDamageWithMods(c, dmg, false, ek, i, a);
      hitCount++;
      if (!c.dead) triggerMarkOrResonance(c, 'aceptacion', who, ek, i);
    });
    logCombat('💥 Estratosfera: ' + dmg + ' daño a ' + hitCount + ' enemigo(s)');
    if (!a.dead) { a.hp = 0; handleDeath(who, side.activeIndex); logCombat('💀 Artemis muere por el precio de su definitiva'); }
  },

  damage: function(ctx) {
    var a = ctx.active, es = ctx.enemySide, ea = ctx.enemyActive, ek = ctx.enemyKey, side = ctx.side;
    var ab = ctx.ability, at = ctx.actionType;
    var dmg = ab.damage || 0;
    dmg = applyObraMaestraToBase(a, ab, at, dmg);
    var carrerillaEnergy = 0;
    if (a.id === 'artemis' && csHasState(a, 'carrerilla')) {
      dmg += 2; csSetState(a, 'carrerilla', false);
      logCombat('🏃 Carrerilla: +2 daño');
      if (at === 'normal') carrerillaEnergy = 1;
    }
    dmg = applyGenericDamageMods(a, dmg, at === 'elemental');
    if (a.pendingBuff) ctx.pendingBuffConsumed = true;
    if (at === 'normal' || at === 'elemental') { var ob = getOptimizationBonus(side); if (ob > 0) { dmg += ob; logCombat('🏛️ Optimización: +' + ob); } }
    if (a.id === 'erik') { var eb = applyErikPassive(a); if (eb > 0) { dmg += eb; logCombat('🩸 Inspiración: +' + eb); } }
    if (a.id === 'eevee' && csHasState(a, 'furia') && a.states.furiaTarget === ea.id && at === 'normal') { dmg += 1; logCombat('🔥 Furia: +1'); }
    applyDamageWithMods(ea, dmg, predictPiercing(a, ab), ek, es.activeIndex, a);
    if (carrerillaEnergy > 0 && !a.dead) {
      var pe = a.energy; a.energy = Math.min(a.maxEnergy, a.energy + carrerillaEnergy);
      if (a.energy > pe) logCombat('🏃 Carrerilla: +' + (a.energy - pe) + ' energía extra');
    }
  },

  autolesion: function(ctx) {
    var a = ctx.active, side = ctx.side, who = ctx.who, ab = ctx.ability;
    var selfDmg = ab.selfDamage || 1;
    logCombat('🩸 ' + a.character.name + ' se autolesiona ' + selfDmg);
    // ✅ Sin attackerCs → cuenta como fuente no-enemiga (activa Mártir Afligida de Alaya)
    dealDamageToChar(a, selfDmg, { targetSide: side, targetSideKey: who, targetIdx: side.activeIndex });
    playSound('impact');
  },

  penitencia: function(ctx) {
    var a = ctx.active;
    a.states = a.states || {}; a.states.castigada = true;
    a.marks = {}; a.states.vulnerable = false; a.states.amenaza = false;
    logCombat('🩸 ' + a.character.name + ' entra en Castigada');
  },

  finComienzo: function(ctx) {
    var a = ctx.active, es = ctx.enemySide, ek = ctx.enemyKey, who = ctx.who, side = ctx.side;
    var condenaRaw = (a.states && a.states.condena) ? a.states.condena : 0;
    logCombat('💥 Condena acumulada: ' + condenaRaw);
    // ✅ Obra Maestra dobla el daño base (la condena consumida)
    var condena = applyObraMaestraToBase(a, ctx.ability, ctx.actionType, condenaRaw);
    if (condena !== condenaRaw) logCombat('💥 Obra Maestra: condena doblada ' + condenaRaw + ' → ' + condena);
    var target = es.characters[es.activeIndex];
    if (condena > 0 && target && !target.dead) {
      applyDamageWithMods(target, condena, true, ek, es.activeIndex, a);
      logCombat('💥 Daño de condena: ' + condena + ' (penetrante)');
    } else { logCombat('⚠️ Alaya no tiene condena: no inflige daño'); }
    if (a.states) a.states.condena = 0;
    var marked = 0;
    es.characters.forEach(function(c, i){ if (!c.dead) { triggerMarkOrResonance(c, 'redencion', who, ek, i); marked++; } });
    logCombat('🏷️ Marcados con redención: ' + marked + ' enemigo(s)');
    var targetDied = target ? (target.dead || target.hp <= 0) : true;

    // ✅ EX Resurrección Afligida
    if (a.exActive && !targetDied) {
      var hasRevive = (side.hand || []).some(function(cid){ return cid === 'c_resurreccion'; });
      if (hasRevive) {
        logCombat('🌟 EX Alaya: consume Resurrección + todos los dados y repite el golpe');
        var revIdx = side.hand.indexOf('c_resurreccion');
        if (revIdx >= 0) side.hand.splice(revIdx, 1);
        side.dice = [];
        a.dead = false; a.hp = a.maxHp;
        var target2 = es.characters[es.activeIndex];
        if (target2 && !target2.dead) {
          applyDamageWithMods(target2, condena, true, ek, es.activeIndex, a);
          logCombat('💥 Repetición del Fin: ' + condena + ' de daño penetrante');
        }
        es.characters.forEach(function(c, i){ if (!c.dead) triggerMarkOrResonance(c, 'redencion', who, ek, i); });
        a.hp = 0;
        handleDeath(who, side.activeIndex);
        logCombat('💀 ' + a.character.name + ' se sacrifica definitivamente');
        return;
      } else {
        logCombat('❌ EX Alaya: no hay Resurrección en mano, se suicida sin repetir');
      }
    }

    if (!targetDied && !a.dead) { a.hp = 0; handleDeath(who, side.activeIndex); logCombat('💀 ' + a.character.name + ' muere por el precio de su definitiva (' + target.character.name + ' sobrevivió)'); }
    else if (targetDied) { logCombat('✅ ' + target.character.name + ' ha caído: Alaya sobrevive'); }
  },

  trazoVivo: function(ctx) {
    var a = ctx.active, ea = ctx.enemyActive, es = ctx.enemySide, ek = ctx.enemyKey, side = ctx.side, who = ctx.who, at = ctx.actionType, ab = ctx.ability;
    var paint = a.paintEquipped;
    var baseDmg = ab.damage || 1;
    if (paint === 'roja') { baseDmg += 2; logCombat('🎨 Pintura Roja: +2'); }
    baseDmg = applyGenericDamageMods(a, baseDmg);
    if (a.pendingBuff) ctx.pendingBuffConsumed = true;
    if (at === 'normal') { var ob = getOptimizationBonus(side); if (ob > 0) { baseDmg += ob; logCombat('🏛️ Optimización: +' + ob); } }
    var eb = applyErikPassive(a); if (eb > 0) { baseDmg += eb; logCombat('🩸 Inspiración: +' + eb); }
    applyDamageWithMods(ea, baseDmg, predictPiercing(a, ab), ek, es.activeIndex, a);
    if (paint === 'azul') { addOrRefreshShield(a, 'erik_paint_azul', 1); logCombat('🎨 Pintura Azul: +1 escudo'); }
    if (paint === 'verde') { healChar(a, 2); logCombat('🎨 Pintura Verde: cura 2'); }
    // ✅ EX Erik (Paleta Inagotable): marca con Expresión siempre (aunque haya pintura)
    var shouldMark = !paint || a.exActive;
    if (shouldMark && !ea.dead) {
      triggerMarkOrResonance(ea, 'expresion', who, ek, es.activeIndex);
      if (a.exActive && paint) logCombat('🌟 EX Erik: marca con Expresión (aun con pintura)');
    }
    if (paint) { a.paintEquipped = null; logCombat('🎨 La pintura se ha consumido'); }
  },

  interpretacion: function(ctx) {
    var a = ctx.active, side = ctx.side, who = ctx.who;
    a.hp = Math.max(0, a.hp - 1); logCombat('🩸 ' + a.character.name + ' pierde 1 HP');
    if (a.hp <= 0) handleDeath(who, side.activeIndex);
    ['paint_roja', 'paint_azul', 'paint_verde'].forEach(function(pid){ if (!side.hand) side.hand = []; side.hand.push(pid); logCombat('🎨 Generada: ' + PAINT_CARDS[pid].name); });
  },

  lienzoSangre: function(ctx) {
    var a = ctx.active, ea = ctx.enemyActive, es = ctx.enemySide, ek = ctx.enemyKey, side = ctx.side;
    var pR = 0, pA = 0, pV = 0;
    if (!side.hand) side.hand = [];
    for (var i = side.hand.length - 1; i >= 0; i--) {
      var cid = side.hand[i];
      if (cid === 'paint_roja') { pR++; side.hand.splice(i, 1); }
      else if (cid === 'paint_azul') { pA++; side.hand.splice(i, 1); }
      else if (cid === 'paint_verde') { pV++; side.hand.splice(i, 1); }
    }
    // ✅ Obra Maestra dobla el daño base por pintura roja (1 → 2)
    var baseDmgRed = applyObraMaestraToBase(a, ctx.ability, ctx.actionType, 1);
    if (pR > 0) { applyDamageWithMods(ea, pR * baseDmgRed, false, ek, es.activeIndex, a); logCombat('🔴 ' + (pR * baseDmgRed) + ' daño por pinturas rojas'); }
    if (pA > 0) { var hs = healShieldBy(a, pA); logCombat('🔵 Escudo +' + hs + ' HP'); }
    if (pV > 0) { healChar(a, pV); logCombat('🟢 Cura ' + pV); }
    if (!pR && !pA && !pV) logCombat('❌ No había pinturas en la mano');
  },

  intervencion: function(ctx) {
    var a = ctx.active, ea = ctx.enemyActive, es = ctx.enemySide, ek = ctx.enemyKey, side = ctx.side, at = ctx.actionType, ab = ctx.ability;
    var d = ab.damage || 2;
    if (csHasState(ea, 'amenaza')) { d += 1; csSetState(ea, 'amenaza', false); logCombat('🚨 Amenaza: +1 daño, ya no es Amenaza'); }
    d = applyGenericDamageMods(a, d);
    if (a.pendingBuff) ctx.pendingBuffConsumed = true;
    if (at === 'normal') { var ob = getOptimizationBonus(side); if (ob > 0) { d += ob; logCombat('🏛️ Optimización: +' + ob); } }
    applyDamageWithMods(ea, d, predictPiercing(a, ab), ek, es.activeIndex, a);
  },

  bajoAlas: function(ctx) {
    var side = ctx.side;
    var allies = side.characters.filter(function(c){ return !c.dead && c.id !== 'tenshi'; });
    if (!allies.length) { logCombat('❌ No hay aliados a proteger'); return; }
    allies.sort(function(a, b){ return a.hp - b.hp; });
    csSetState(allies[0], 'vulnerable', true);
    logCombat('💔 ' + allies[0].character.name + ' es Vulnerable');
  },

  suficiente: function(ctx) {
    var side = ctx.side, es = ctx.enemySide, ek = ctx.enemyKey, who = ctx.who, a = ctx.active;
    var amz = es.characters.filter(function(c){ return !c.dead && csHasState(c, 'amenaza'); });
    if (!amz.length) logCombat('❌ No hay Amenazas');
    var baseDmg = applyObraMaestraToBase(a, ctx.ability, ctx.actionType, 3);
    amz.forEach(function(cs){
      applyDamageWithMods(cs, baseDmg, true, ek, es.characters.indexOf(cs), a);
      csSetState(cs, 'amenaza', false);
      // ✅ EX Tenshi (Resguardo Divino): marca con Protección a los golpeados
      if (!cs.dead && a.exActive) {
        triggerMarkOrResonance(cs, 'proteccion', who, ek, es.characters.indexOf(cs));
        logCombat('🌟 EX Tenshi: ' + cs.character.name + ' marcado con Protección');
      }
    });
    if (amz.length) logCombat('🚨 Amenazas dejan de ser Amenaza');
    var vuln = side.characters.filter(function(c){ return !c.dead && csHasState(c, 'vulnerable'); });
    vuln.forEach(function(c){ addOrRefreshShield(c, 'tenshi_ultimate', 3); });
    if (vuln.length) logCombat('🛡️ ' + vuln[0].character.name + ' +3 escudo');
  },

  hipotesisSolida: function(ctx) {
    var a = ctx.active;
    addOrRefreshShield(a, 'eloy_hipotesis', 2);
    a.states = a.states || {}; a.states.hipotesisShieldActive = true;
    logCombat('🛡️ +2 escudo (Hipótesis Sólida)');
  },

  conclusion: function(ctx) {
    var a = ctx.active, side = ctx.side;
    var energyPer = a.exActive ? 2 : 1;
    side.characters.forEach(function(c){
      if (c === a || c.dead) return;
      addOrRefreshShield(c, 'eloy_conclusion', 1);
      c.energy = Math.min(c.maxEnergy, c.energy + energyPer);
    });
    logCombat('🛡️ Aliados +1 escudo y +' + energyPer + ' energía');
    if (a.exActive) logCombat('🌟 EX Eloy: +2 energía por aliado (en lugar de +1)');
  },

  defensaActiva: function(ctx) {
    var a = ctx.active;
    csSetState(a, 'defensaActiva', true);
    logCombat('💠 Defensa Activa');
  },

  contraofensiva: function(ctx) {
    var a = ctx.active, ea = ctx.enemyActive, es = ctx.enemySide, ek = ctx.enemyKey, who = ctx.who, ab = ctx.ability;
    var baseDmg = 3;
    if (csHasState(a, 'furia')) { baseDmg = 5; if (a.states && a.states.furiaTarget === ea.id) baseDmg = 6; }
    // ✅ Obra Maestra dobla el daño base (3/5/6 → 6/10/12)
    baseDmg = applyObraMaestraToBase(a, ctx.ability, ctx.actionType, baseDmg);
    applyDamageWithMods(ea, baseDmg, predictPiercing(a, ab), ek, es.activeIndex, a);
    if (a.states && a.states.furiaTarget === ea.id && !ea.dead) triggerMarkOrResonance(ea, 'proteccion', who, ek, es.activeIndex);
  },

  conversionPsicologica: function(ctx) {
    var a = ctx.active, side = ctx.side;
    var invBefore = (a.states && a.states.invulnerabilidad) || 0;
    var invAfter = Math.min(3, invBefore + 1);
    csSetState(a, 'invulnerabilidad', invAfter);
    logCombat('🛡️ Alter: invulnerabilidad ' + invBefore + ' → ' + invAfter);
    var stolen = 0;
    side.characters.forEach(function(ally){
      if (ally === a || ally.dead) return;
      if (ally.energy > 0) { stolen += ally.energy; logCombat('🔮 ' + ally.character.name + ' pierde ' + ally.energy + ' energía'); ally.energy = 0; }
    });
    if (stolen === 0) { logCombat('🔮 No había energía que robar'); return; }
    var room = Math.max(0, a.maxEnergy - a.energy);
    var gain = Math.min(room, stolen);
    var over = stolen - gain;
    a.energy += gain;
    if (gain > 0) logCombat('🔮 Alter recupera ' + gain + ' energía (total: ' + a.energy + '/' + a.maxEnergy + ')');
    if (over > 0) {
      for (var i = 0; i < over; i++) side.dice.push({ type:'ilusion', id:uid(), justAdded:true });
      logCombat('🔮 ' + over + ' energía sobrante → ' + over + ' dado(s) de ilusión');
    }
  },

  omnesDeam: function(ctx) {
    var side = ctx.side;
    if (!side.alterUltBuff) side.alterUltBuff = { amount: 0, roundsLeft: 0 };
    side.alterUltBuff.amount = (side.alterUltBuff.amount || 0) + 3;
    side.alterUltBuff.roundsLeft = 2;
    logCombat('💥 Omnes Deam Salutate: +' + side.alterUltBuff.amount + ' daño a elementales del equipo (2 rondas)');
  },

  inconsistencia: function(ctx) {
    var a = ctx.active, ea = ctx.enemyActive, es = ctx.enemySide, ek = ctx.enemyKey, side = ctx.side, who = ctx.who, at = ctx.actionType;
    var d = 2;
    if (at === 'elemental' && side.alterUltBuff && side.alterUltBuff.amount > 0 && side.alterUltBuff.roundsLeft > 0 && a.id !== 'alter') {
      d += side.alterUltBuff.amount; logCombat('💥 Omnes Deam Salutate: +' + side.alterUltBuff.amount + ' daño');
    }
    applyDamageWithMods(ea, d, true, ek, es.activeIndex, a);
    var nx = getNextAliveIndex(es, es.activeIndex);
    if (nx >= 0) { es.activeIndex = nx; logCombat('🔄 Enemigo forzado a ' + es.characters[nx].character.name); triggerMarkOrResonance(es.characters[nx], 'ilusion', who, ek, nx); }
    var rsv = getNextAliveIndex(side, side.activeIndex);
    if (rsv >= 0) { logCombat('👻 Paso Fantasma: Ren a reserva'); side.activeIndex = rsv; triggerKillerTunesDamage(who); }
  },

  destruccionLogica: function(ctx) {
    var a = ctx.active, ea = ctx.enemyActive, es = ctx.enemySide, ek = ctx.enemyKey, side = ctx.side, who = ctx.who;
    if (!ea.dead) triggerMarkOrResonance(ea, 'ilusion', who, ek, es.activeIndex);
    // ✅ Obra Maestra dobla el daño base (3 → 6)
    var baseDmg = applyObraMaestraToBase(a, ctx.ability, ctx.actionType, 3);
    applyDamageWithMods(ea, baseDmg, true, ek, es.activeIndex, a);
    var nx = getNextAliveIndex(es, es.activeIndex);
    if (nx >= 0) { es.activeIndex = nx; logCombat('🔄 Enemigo forzado'); }
    var rsv = getNextAliveIndex(side, side.activeIndex);
    if (rsv >= 0) { logCombat('👻 Paso Fantasma: Ren a reserva'); side.activeIndex = rsv; triggerKillerTunesDamage(who); }
  },

  ecoVital: function(ctx) {
    var a = ctx.active, side = ctx.side;
    // Recopilar aliados vivos (sin contar a Noah)
    var allies = side.characters.filter(function(c){ return c !== a && !c.dead; });
    if (allies.length === 0) {
      healChar(a, 2);
      logCombat('🎵 Eco Vital: sin aliados, Noah +2 HP');
      return;
    }

    // Empate de HP entre los dos aliados → Noah se cura a sí misma
    var allSameHp = allies.length >= 2 && allies.every(function(c){ return c.hp === allies[0].hp; });
    if (allSameHp) {
      healChar(a, 2);
      logCombat('🎵 Eco Vital: empate de HP → Noah +2 HP (no cura aliados)');
      return;
    }

    var sintonicos = allies.filter(function(c){ return csHasState(c, 'sintonia'); });
    var target, healAmt;

    if (sintonicos.length === 0) {
      // 0 en Sintonía: curar al de menos HP, leve (2)
      allies.sort(function(x,y){ return x.hp - y.hp; });
      target = allies[0];
      healAmt = 2;
    } else if (sintonicos.length === 1) {
      // 1 en Sintonía: curar al otro, leve (2)
      target = allies.filter(function(c){ return !csHasState(c, 'sintonia'); })[0] || sintonicos[0];
      healAmt = 2;
    } else {
      // 2 en Sintonía: curar al de menos HP, leve reducido (1)
      allies.sort(function(x,y){ return x.hp - y.hp; });
      target = allies[0];
      healAmt = 1;
    }

    var healed = healChar(target, healAmt);
    csSetState(target, 'sintonia', true);
    logCombat('🎵 Eco Vital: ' + target.character.name + ' +' + healed + ' HP · Sintonía');
  },

  armonia: function(ctx) {
    var a = ctx.active, side = ctx.side, ea = ctx.enemyActive, es = ctx.enemySide, ek = ctx.enemyKey, who = ctx.who;
    var sint = side.characters.filter(function(c){ return c !== a && !c.dead && csHasState(c, 'sintonia'); }).length;
    var heal = Math.max(0, 5 - sint);
    csSetState(a, 'sintonia', true);
    healChar(a, heal);
    if (!ea.dead) triggerMarkOrResonance(ea, 'proteccion', who, ek, es.activeIndex);
    logCombat('🎵 Armonía: cura ' + heal + ' y marca protección');
  },

  deudaSangre: function(ctx) {
    var a = ctx.active, ea = ctx.enemyActive, es = ctx.enemySide, ek = ctx.enemyKey, at = ctx.actionType, ab = ctx.ability;
    var base = applyGenericDamageMods(a, 3, at === 'elemental');
    var dealt = applyDamageWithMods(ea, base, predictPiercing(a, ab), ek, es.activeIndex, a);
    if (!ea.dead) { ea.states = ea.states || {}; ea.states.rencor = (ea.states.rencor || 0) + 1; logCombat('💢 ' + ea.character.name + ' acumula Rencor (' + ea.states.rencor + ')'); }
    logCombat('🩸 Deuda de Sangre: ' + base + ' daño');
    if (dealt > 0) {
      // ✅ Curación FIJA de 1 si hubo daño verdadero (no el daño entero)
      var healBonus = 0;
      if (a.equipment) a.equipment.forEach(function(eqId){ var eq = CARD_DB[eqId]; if (eq && eq.effect && eq.effect.healBonus) healBonus += eq.effect.healBonus; });
      var totalHeal = 1 + healBonus;
      if (totalHeal > 0) { var healed = healChar(a, totalHeal); logCombat('🩸 Deuda de Sangre: +' + healed + ' HP' + (healBonus > 0 ? ' (incluye +' + healBonus + ' de bonos)' : '')); }
    }
  },

  retribucionFinal: function(ctx) {
    var a = ctx.active, es = ctx.enemySide, ek = ctx.enemyKey;
    // ✅ Obra Maestra dobla el daño base (3 → 6); el bono por Rencor extra NO se dobla
    var baseDmg = applyObraMaestraToBase(a, ctx.ability, ctx.actionType, 3);
    var total = 0;
    es.characters.forEach(function(cs){
      if (cs.dead || !cs.states || !cs.states.rencor) return;
      var acum = cs.states.rencor;
      var d = baseDmg + Math.max(0, acum - 1);
      applyDamageWithMods(cs, d, false, ek, es.characters.indexOf(cs), a);
      cs.states.rencor = 0;
      total++;
      logCombat('💥 ' + cs.character.name + ' recibe ' + d + ' de Retribución Final (consumido Rencor)');
    });
    if (total === 0) logCombat('❌ Ningún enemigo tenía Rencor');
  },

  degradacion: function(ctx) {
    var a = ctx.active, ea = ctx.enemyActive, es = ctx.enemySide, ek = ctx.enemyKey, side = ctx.side, who = ctx.who, at = ctx.actionType, ab = ctx.ability;
    ctx.hadStacks = (a.manuelStacks || 0) > 0;
    var self = 2 + (a.manuelStacks || 0);
    a.hp = Math.max(0, a.hp - self);
    logCombat('🩸 Autolesión ' + self);
    if (a.hp <= 0) { handleDeath(who, side.activeIndex); return; }
    var d = 4 + (a.manuelStacks || 0);
    if (at === 'elemental' && side.alterUltBuff && side.alterUltBuff.amount > 0 && side.alterUltBuff.roundsLeft > 0 && a.id !== 'alter') {
      d += side.alterUltBuff.amount; logCombat('💥 Omnes Deam Salutate: +' + side.alterUltBuff.amount + ' daño');
    }
    var dealt = applyDamageWithMods(ea, d, predictPiercing(a, ab), ek, es.activeIndex, a);
    if (!ea.dead) triggerMarkOrResonance(ea, 'redencion', who, ek, es.activeIndex);
    a.manuelStacks = 0;
    es.characters.forEach(function(c){ csRemoveMark(c, 'redencion'); });
    if (ea.dead && a.id === 'manuel' && dealt > 0 && !a.dead) {
      var healed = healChar(a, dealt);
      logCombat('🩸 Tributo Vital: +' + healed + ' HP por derrotar a ' + ea.character.name);
    }
  },

  decadencia: function(ctx) {
    var a = ctx.active;
    a.manuelStacks = (a.manuelStacks || 0) + 1;
    logCombat('📈 Manuel acumula +1 (stack ' + a.manuelStacks + ')');
  },

  aceleron: function(ctx) {
    var a = ctx.active, ea = ctx.enemyActive, es = ctx.enemySide, ek = ctx.enemyKey, side = ctx.side, who = ctx.who, at = ctx.actionType, ab = ctx.ability;
    var isAcel = csHasState(a, 'acelerado');
    var d = 2 + (isAcel ? 1 : 0);
    d = applyGenericDamageMods(a, d);
    if (a.pendingBuff) ctx.pendingBuffConsumed = true;
    if (at === 'normal') { var ob = getOptimizationBonus(side); if (ob > 0) { d += ob; logCombat('🏛️ Optimización: +' + ob); } }
    applyDamageWithMods(ea, d, predictPiercing(a, ab), ek, es.activeIndex, a);
    if (isAcel && !ea.dead) triggerMarkOrResonance(ea, 'transformacion', who, ek, es.activeIndex);
  },

  impulso: function(ctx) {
    var a = ctx.active, side = ctx.side, who = ctx.who;
    a.pendingBuff = (a.pendingBuff || 0) + 2;
    logCombat('💪 Impulso: +2 al siguiente ataque normal (persiste hasta consumirse)');
    var jr = getNextAliveIndex(side, side.activeIndex);
    if (jr >= 0) { logCombat('🦋 Jose a reserva'); side.activeIndex = jr; triggerKillerTunesDamage(who); ctx.shouldEndTurn = false; }
  },

  instinto: function(ctx) {
    var a = ctx.active, ea = ctx.enemyActive, es = ctx.enemySide, ek = ctx.enemyKey, side = ctx.side, who = ctx.who, ab = ctx.ability;
    var isAc = csHasState(a, 'acelerado');
    var d = 3 + (isAc ? 2 : 0);
    d = applyGenericDamageMods(a, d);
    if (a.pendingBuff) ctx.pendingBuffConsumed = true;
    // ✅ Instinto se considera ataque normal: recibe buff de Portátil, NO de Obra Maestra
    if (side.structures && side.structures.some(function(st){ return st.kind === 'optimizacion'; })) {
      var obI = getOptimizationBonus(side);
      if (obI > 0) { d += obI; logCombat('🏛️ Portátil: +' + obI); }
    }
    applyDamageWithMods(ea, d, predictPiercing(a, ab), ek, es.activeIndex, a);
    if (isAc && !ea.dead) triggerMarkOrResonance(ea, 'transformacion', who, ek, es.activeIndex);
  },

  reescritura: function(ctx) {
    var a = ctx.active, es = ctx.enemySide, ea = ctx.enemyActive, ek = ctx.enemyKey, side = ctx.side, who = ctx.who;
    var destroyed = false;
    for (var i = 0; i < 4; i++) {
      if (side.supports && side.supports[i]) {
        var spc = CARD_DB[side.supports[i].cardId];
        if (spc && spc.duration) { side.supports[i].duration = spc.duration; logCombat('📜 ' + spc.name + ' restablecido a ' + spc.duration + ' rondas'); }
        break;
      }
    }
    if (side.structures) {
      for (var j = 0; j < side.structures.length; j++) {
        if (side.structures[j].kind === 'optimizacion') { side.structures[j].duration = 2; logCombat('🏛️ Optimización restablecida a 2 rondas'); break; }
      }
    }
    for (var k = 0; k < 4; k++) { if (es.supports && es.supports[k]) { logCombat('📜 Apoyo enemigo destruido'); es.supports[k] = null; destroyed = true; break; } }
    if (!destroyed && !ea.dead) triggerMarkOrResonance(ea, 'expresion', who, ek, es.activeIndex);
  },

  canon: function(ctx) {
    var a = ctx.active, side = ctx.side, who = ctx.who;
    var dc = 0;
    for (var i = side.deck.length - 1; i >= 0 && dc < 3; i--) {
      var cid = side.deck[i]; var c = CARD_DB[cid];
      if (c && c.category === 'apoyo') { side.hand.push(cid); side.deck.splice(i, 1); dc++; logCombat('📜 Robas ' + c.name); }
    }
    if (side.supports) {
      side.supports.forEach(function(sp){
        if (!sp) return;
        var sc = CARD_DB[sp.cardId]; if (!sc || !sc.effect) return;
        var e = sc.effect, activated = false;
        if (e.shieldInstant && a && !a.dead) { addOrRefreshShield(a, 'canon_' + sc.id + '_' + uid(), e.shieldInstant); activated = true; }
        if (e.teamShieldInstant) { side.characters.forEach(function(c){ if (!c.dead) addOrRefreshShield(c, 'canon_' + sc.id + '_' + uid(), e.teamShieldInstant); }); activated = true; }
        if (e.healPerRound && a && !a.dead) { healChar(a, e.healPerRound); activated = true; }
        if (e.shieldPerRound && a && !a.dead) { addOrRefreshShield(a, 'canon_' + sc.id + '_' + uid(), e.shieldPerRound); activated = true; }
        if (e.teamShieldPerRound) { side.characters.forEach(function(c){ if (!c.dead) addOrRefreshShield(c, 'canon_' + sc.id + '_' + uid(), e.teamShieldPerRound); }); activated = true; }
        if (e.teamHealPerRound) { side.characters.forEach(function(c){ if (!c.dead) healChar(c, e.teamHealPerRound); }); activated = true; }
        if (e.energyPerRound && a && !a.dead) { a.energy = Math.min(a.maxEnergy, a.energy + e.energyPerRound); activated = true; }
        if (e.teamEnergyPerRound) { side.characters.forEach(function(c){ if (!c.dead) c.energy = Math.min(c.maxEnergy, c.energy + e.teamEnergyPerRound); }); activated = true; }
        if (e.drawPerRound) { for (var d = 0; d < e.drawPerRound; d++) drawFromDeck(who); activated = true; }
        if (e.elementDiePerRound && a && !a.dead) { for (var ei = 0; ei < e.elementDiePerRound; ei++) side.dice.push({ type:a.character.element, id:uid(), justAdded:true }); activated = true; }
        if (e.omniDiePerRound) { for (var oi = 0; oi < e.omniDiePerRound; oi++) side.dice.push({ type:'omni', id:uid(), justAdded:true }); activated = true; }
        if (activated) logCombat('📜 Canon activa: ' + sc.name);
      });
    }
  },

  optimizacion: function(ctx) {
    var side = ctx.side;
    if (!side.structures) side.structures = [];
    var existing = null;
    for (var i = 0; i < side.structures.length; i++) { if (side.structures[i].kind === 'optimizacion') { existing = side.structures[i]; break; } }
    if (existing) { existing.duration = Math.min(3, existing.duration + 1); logCombat('🏛️ Optimización extendida a ' + existing.duration + ' rondas'); }
    else { side.structures.push({ kind:'optimizacion', duration:2, initialDuration:2 }); logCombat('🏛️ Optimización colocada (2 rondas)'); }
  },

  obraMaestra: function(ctx) {
    var side = ctx.side;
    var has = side.structures && side.structures.some(function(st){ return st.kind === 'optimizacion'; });
    if (!has) { logCombat('❌ Obra Maestra requiere la estructura de Optimización en el campo'); ctx.shouldEndTurn = false; return; }
    side.obraMaestraTurns = 2;
    logCombat('💥 Obra Maestra activa durante 2 rondas: definitivas doblan su daño base');
  },

  ojoPorOjo: function(ctx) {
    var a = ctx.active, ea = ctx.enemyActive, es = ctx.enemySide, ek = ctx.enemyKey, side = ctx.side, ab = ctx.ability;
    var cruces = countCruzMadera(side);
    var d = 1 + cruces;
    logCombat('✝️ Ojo por ojo: ' + cruces + ' cruz(es) → ' + d + ' daño');
    d = applyGenericDamageMods(a, d);
    applyDamageWithMods(ea, d, predictPiercing(a, ab), ek, es.activeIndex, a);
  },

  minutoSilencio: function(ctx) {
    var a = ctx.active;
    addOrRefreshShield(a, 'orath_minuto', 2);
    csSetState(a, 'minutoSilencioShield', true);
    logCombat('🔮 Minuto de silencio: +2 escudo (se desvanece al final de la ronda)');
  },

  diosTeAmpare: function(ctx) {
    var a = ctx.active, es = ctx.enemySide, ek = ctx.enemyKey;
    var countP = destroyAllCruzMadera('player');
    var countB = destroyAllCruzMadera('bot');
    var total = countP + countB;
    logCombat('💥 Dios te ampare: ' + total + ' Cruz(es) de Madera destruida(s)');
    // ✅ Obra Maestra dobla el daño base (total)
    var baseDmg = applyObraMaestraToBase(a, ctx.ability, ctx.actionType, total);
    var reserva = es.characters.filter(function(c, i){ return !c.dead && i !== es.activeIndex; });
    reserva.forEach(function(c){ applyDamageWithMods(c, baseDmg, false, ek, es.characters.indexOf(c), a); });
    if (reserva.length) logCombat('💥 ' + baseDmg + ' daño adicional a ' + reserva.length + ' enemigo(s) en reserva');
  },

  ex: function(ctx) {
    var a = ctx.active, ab = ctx.ability;
    a.exActive = true;
    logCombat('🌟 EX activada (pasiva permanente): ' + (ab.name || 'Habilidad EX') + ' de ' + a.character.name);
  },

  graciaPicara: function(ctx) {
    var a = ctx.active, ea = ctx.enemyActive, es = ctx.enemySide, ek = ctx.enemyKey, ab = ctx.ability;
    var d = 1 + adelaEffectBonus(a);
    d = applyGenericDamageMods(a, d, true);
    var dealt = applyDamageWithMods(ea, d, predictPiercing(a, ab), ek, es.activeIndex, a);
    if (dealt > 0) { var h = 1 + adelaEffectBonus(a); healChar(a, h); logCombat('🩸 Gracia Pícara: cura ' + h + ' HP'); }
  },

  flechazoTentador: function(ctx) {
    var a = ctx.active, ea = ctx.enemyActive, es = ctx.enemySide, ek = ctx.enemyKey, who = ctx.who;
    var d = 2 + adelaEffectBonus(a);
    var hadMark = csAllMarks(ea).length > 0;
    if (hadMark) {
      var oldMarks = csAllMarks(ea);
      oldMarks.forEach(function(el){ csRemoveMark(ea, el); });
      logCombat('🏷️ Flechazo Tentador: marca quitada (' + oldMarks.map(function(e){ return ELEMENT_EMOJI[e]; }).join(' ') + ')');
      applyDamageWithMods(ea, d, true, ek, es.activeIndex, a);
    }
    if (!ea.dead) triggerMarkOrResonance(ea, 'transformacion', who, ek, es.activeIndex);
  },

  misModales: function(ctx) {
    var a = ctx.active, ea = ctx.enemyActive, es = ctx.enemySide, ek = ctx.enemyKey, side = ctx.side, who = ctx.who, ab = ctx.ability;
    var marks = csAllMarks(a);
    if (marks.length === 0) {
      triggerMarkOrResonance(a, 'transformacion', who, who, side.activeIndex);
      a.hp = Math.min(5, a.maxHp);
      logCombat('💥 Mis Modales en el Suelo: Adela se marca y pasa a ' + a.hp + ' HP');
    } else if (marks.indexOf('transformacion') !== -1) {
      // ✅ Obra Maestra dobla el daño base (4 → 8); adelaEffectBonus es bono
      var baseDmg = applyObraMaestraToBase(a, ctx.ability, ctx.actionType, 4);
      var d = baseDmg + adelaEffectBonus(a);
      applyDamageWithMods(ea, d, predictPiercing(a, ab), ek, es.activeIndex, a);
    } else {
      a.hp = 0;
      logCombat('💀 Adela se suicida (marcada con ' + marks.map(function(e){ return ELEMENT_EMOJI[e]; }).join(' ') + ')');
      handleDeath(who, side.activeIndex);
    }
  },

  muereNormal: function(ctx) {
    var a = ctx.active, ea = ctx.enemyActive, es = ctx.enemySide, ek = ctx.enemyKey, ab = ctx.ability;
    var d = (1 + (hasAnyMark(ea) ? 1 : 0)) * hungerMarkMultiplier(a);
    applyDamageWithMods(ea, d, predictPiercing(a, ab), ek, es.activeIndex, a);
  },

  muereElemental: function(ctx) {
    var a = ctx.active, ea = ctx.enemyActive, es = ctx.enemySide, ek = ctx.enemyKey, who = ctx.who;
    var d = 2 * hungerMarkMultiplier(a);
    if (csAllMarks(ea).length > 0) {
      var oldMe = csAllMarks(ea);
      oldMe.forEach(function(el){ csRemoveMark(ea, el); });
      logCombat('🏷️ MUERE: marca quitada (' + oldMe.map(function(e){ return ELEMENT_EMOJI[e]; }).join(' ') + ')');
      applyDamageWithMods(ea, d, true, ek, es.activeIndex, a);
    }
    if (!ea.dead) triggerMarkOrResonance(ea, 'transformacion', who, ek, es.activeIndex);
    var nx = getNextAliveIndex(es, es.activeIndex);
    if (nx >= 0) { es.activeIndex = nx; logCombat('🔄 Enemigo forzado a ' + es.characters[nx].character.name); }
  },

  miCordura: function(ctx) {
    var a = ctx.active, ea = ctx.enemyActive, es = ctx.enemySide, ek = ctx.enemyKey, side = ctx.side, who = ctx.who, ab = ctx.ability;
    if (csAllMarks(a).indexOf('transformacion') === -1) {
      triggerMarkOrResonance(a, 'transformacion', who, who, side.activeIndex);
      var before = a.hp; a.hp = a.maxHp;
      logCombat('💥 Mi cordura: Hunger se marca y se cura ' + (a.hp - before) + ' HP (total ' + a.hp + '/' + a.maxHp + ')');
    } else {
      // ✅ Obra Maestra dobla el daño base (4); el multiplicador por marca se aplica después
      var baseDmg = applyObraMaestraToBase(a, ctx.ability, ctx.actionType, 4);
      var d = baseDmg * hungerMarkMultiplier(a);
      applyDamageWithMods(ea, d, predictPiercing(a, ab), ek, es.activeIndex, a);
    }
  },

  dagaDeOla: function(ctx) {
    var a = ctx.active, ea = ctx.enemyActive, es = ctx.enemySide, ek = ctx.enemyKey, ab = ctx.ability;
    var mult = (a.id === 'internet' && a.exActive && a.hp <= 2) ? 2 : 1;
    var d = 3 * mult;
    applyDamageWithMods(ea, d, predictPiercing(a, ab), ek, es.activeIndex, a);
    addOrRefreshShield(a, 'internet_daga', 1);
    logCombat('🌊 Daga de Ola: +1 escudo a Internet');
  },

  faseDeLimpieza: function(ctx) {
    var a = ctx.active, es = ctx.enemySide, ek = ctx.enemyKey, who = ctx.who, ab = ctx.ability;
    var mult = (a.id === 'internet' && a.exActive && a.hp <= 2) ? 2 : 1;
    // ✅ Obra Maestra dobla el daño base (2); el ×2 por EX Internet se aplica después
    var baseDmg = applyObraMaestraToBase(a, ctx.ability, ctx.actionType, 2);
    var d = baseDmg * mult;
    var activeDead = false;
    es.characters.forEach(function(c, i){
      if (c.dead) return;
      var wasActive = (i === es.activeIndex);
      applyDamageWithMods(c, d, predictPiercing(a, ab), ek, i, a);
      if (wasActive && c.dead) activeDead = true;
    });
    if (!activeDead && !a.dead) {
      var s = sideOfChar(a);
      dealDamageToChar(a, 2, { targetSide:s.side, targetSideKey:s.key, targetIdx:s.side.characters.indexOf(a) });
      logCombat('💥 Fase de Limpieza: Internet recibe 2 de daño por no derrotar al activo');
    } else if (activeDead) {
      drawFromDeck(who);
      logCombat('🎴 Fase de Limpieza: robas 1 carta por derrotar al activo');
    }
  },

  scratch: function(ctx) {
    var a = ctx.active, ea = ctx.enemyActive, es = ctx.enemySide, ek = ctx.enemyKey, side = ctx.side, at = ctx.actionType, ab = ctx.ability;
    var d = 1;
    if (combatState.environment && combatState.environment.id === 'sobrecarga_epileptica') { d += 1; logCombat('⚡ Scratch: +1 daño (Sobrecarga Epiléptica)'); }
    if (side.structures && side.structures.some(function(s){ return s.kind === 'mesaDJ'; })) { d += 1; logCombat('🎧 Scratch: +1 daño (Mesa de DJ)'); }
    d = applyGenericDamageMods(a, d);
    if (a.pendingBuff) ctx.pendingBuffConsumed = true;
    if (at === 'normal') { var ob = getOptimizationBonus(side); if (ob > 0) { d += ob; logCombat('🏛️ Optimización: +' + ob); } }
    applyDamageWithMods(ea, d, predictPiercing(a, ab), ek, es.activeIndex, a);
  },

  remix: function(ctx) {
    var side = ctx.side, ea = ctx.enemyActive, es = ctx.enemySide, ek = ctx.enemyKey, who = ctx.who;
    if (!side.structures) side.structures = [];
    var mesa = side.structures.find(function(s){ return s.kind === 'mesaDJ'; });
    if (mesa) {
      if (!ea.dead) { triggerMarkOrResonance(ea, 'ilusion', who, ek, es.activeIndex); logCombat('🎭 Remix: enemigo marcado con Ilusión'); }
    } else {
      side.structures.push({ kind:'mesaDJ', duration:2 });
      logCombat('🎧 Remix: Mesa de DJ colocada (2 rondas)');
    }
  },

  killerTunes: function(ctx) {
    var a = ctx.active, side = ctx.side, who = ctx.who;
    setEnvironment('sobrecarga_epileptica', a, who);
    side.neonUltChangeDamage = true;
    logCombat('🎵 Killer Tunes: durante el resto de la ronda, los cambios de personaje de tu equipo causan 1 daño al enemigo');
  },

  // ═══════════════════════════════════════════════════════════════
  // ✅ MARÍA (base)
  // ═══════════════════════════════════════════════════════════════

  cosecha: function(ctx) {
    var a = ctx.active, ea = ctx.enemyActive, es = ctx.enemySide, ek = ctx.enemyKey, side = ctx.side, at = ctx.actionType, ab = ctx.ability;
    var counter = (a.states && a.states.cosechaCounter) || 0;
    var cDmg = 1;
    cDmg = applyGenericDamageMods(a, cDmg);
    if (a.pendingBuff) ctx.pendingBuffConsumed = true;
    if (at === 'normal') { var ob = getOptimizationBonus(side); if (ob > 0) { cDmg += ob; logCombat('🏛️ Optimización: +' + ob); } }
    applyDamageWithMods(ea, cDmg, predictPiercing(a, ab), ek, es.activeIndex, a);
    if (counter >= 1) {
      var cTarget = getMariaTarget(side, a);
      if (cTarget >= 0) {
        healChar(side.characters[cTarget], 1);
        logCombat('🌻 Cosecha (repetición): ' + side.characters[cTarget].character.name + ' +1 HP');
      } else {
        logCombat('🌻 Cosecha: no hay aliados que curar');
      }
    }
    if (!a.states) a.states = {};
    a.states.cosechaCounter = counter + 1;
    logCombat('🌻 Cosecha #' + (counter + 1) + ' esta ronda');
  },

  caricia: function(ctx) {
    var a = ctx.active, side = ctx.side, who = ctx.who, ea = ctx.enemyActive, es = ctx.enemySide, ek = ctx.enemyKey;
    var carTarget = getMariaTarget(side, a);
    var noOneToHeal = (carTarget < 0) || (side.characters[carTarget].hp >= side.characters[carTarget].maxHp);
    if (!noOneToHeal) {
      var carCs = side.characters[carTarget];
      healChar(carCs, 3);
      logCombat('🌻 Caricia: ' + carCs.character.name + ' +3 HP');
    } else {
      healChar(a, 2);
      logCombat('🌻 Caricia: no hay aliados a los que curar → María se cura 2 HP');
      if (!ea.dead) {
        triggerMarkOrResonance(ea, 'aceptacion', who, ek, es.activeIndex);
        logCombat('🌻 Caricia: enemigo marcado con Aceptación');
      }
    }
  },

  amor: function(ctx) {
    var a = ctx.active, side = ctx.side, who = ctx.who;
    var fallenA = null;
    if (side.lastDeadAlly) {
      fallenA = side.characters.find(function(c){ return c.id === side.lastDeadAlly && c.dead; });
    }
    if (!fallenA) fallenA = side.characters.find(function(c){ return c.dead; });
    if (fallenA) {
      var reviveHp = Math.min(3, 5);
      fallenA.dead = false;
      fallenA.hp = Math.min(reviveHp, fallenA.maxHp);
      if (fallenA.id === 'hunger') fallenA.hp = fallenA.maxHp;
      logCombat('🌻 Amor: revive a ' + fallenA.character.name + ' con ' + fallenA.hp + ' HP');
    } else {
      logCombat('🌻 Amor: no hay aliado derrotado, solo se establece/refresca el entorno');
    }
    setEnvironment('campo_girasoles', a, who);
    logCombat('🌻 Amor: Campo de Girasoles colocado/refrescado (2 rondas)');
  },

  // ═══════════════════════════════════════════════════════════════
  // ✅ EX-María
  // ═══════════════════════════════════════════════════════════════

  rocePosible: function(ctx) {
    var a = ctx.active, ea = ctx.enemyActive, es = ctx.enemySide, ek = ctx.enemyKey, side = ctx.side, at = ctx.actionType, ab = ctx.ability;
    var rCounter = (a.states && a.states.roceCounter) || 0;
    var rDmg = 1 + rCounter;
    rDmg = applyGenericDamageMods(a, rDmg);
    if (a.pendingBuff) ctx.pendingBuffConsumed = true;
    if (at === 'normal') { var ob = getOptimizationBonus(side); if (ob > 0) { rDmg += ob; logCombat('🏛️ Optimización: +' + ob); } }
    if (!side.pendingRoceHits) side.pendingRoceHits = [];
    side.pendingRoceHits.push({ targetSideKey: ek, targetIdx: es.activeIndex, targetCharId: ea.id, damage: rDmg });
    if (!a.states) a.states = {};
    a.states.roceCounter = rCounter + 1;
    logCombat('🌻 Roce posible: ' + rDmg + ' daño programado al final de la ronda sobre ' + ea.character.name + ' (repetición #' + (rCounter + 1) + ')');
  },

  amorVerdadero: function(ctx) {
    var a = ctx.active, ea = ctx.enemyActive, es = ctx.enemySide, ek = ctx.enemyKey, side = ctx.side, who = ctx.who;
    if (!ea.dead) {
      triggerMarkOrResonance(ea, 'aceptacion', who, ek, es.activeIndex);
    }
    if (!side.pendingAmorVerdadero) side.pendingAmorVerdadero = [];
    side.pendingAmorVerdadero.push({ enemySideKey: ek, enemyIdx: es.activeIndex, enemyCharId: ea.id });
    logCombat('🌻 Amor verdadero: chequeo registrado para el final de la ronda');
  },

  amorSuficiente: function(ctx) {
    var a = ctx.active, side = ctx.side;
    if (a.hp <= 1) { logCombat('❌ Amor suficiente: María necesita más de 1 HP'); ctx.shouldEndTurn = false; return; }
    var fallenS = side.characters.find(function(c){ return c.dead; });
    if (!fallenS) { logCombat('❌ Amor suficiente: no hay aliado derrotado'); ctx.shouldEndTurn = false; return; }
    var lostHp = a.hp - 1;
    a.hp = 1;
    fallenS.dead = false;
    fallenS.hp = Math.max(1, Math.min(lostHp, fallenS.maxHp));
    if (fallenS.id === 'hunger') fallenS.hp = fallenS.maxHp;
    logCombat('🌻 Amor suficiente: María desciende a 1 HP, revive a ' + fallenS.character.name + ' con ' + fallenS.hp + ' HP');
    if (!side.pendingAmorSuficiente) side.pendingAmorSuficiente = [];
    side.pendingAmorSuficiente.push({ revivedId: fallenS.id });
  },

  // ═══════════════════════════════════════════════════════════════
  // ✅ NC
  // ═══════════════════════════════════════════════════════════════

  lectura: function(ctx) {
    var a = ctx.active, ea = ctx.enemyActive, es = ctx.enemySide, ek = ctx.enemyKey, side = ctx.side, who = ctx.who, ab = ctx.ability;
    var dmg = ab.damage || 1;
    dmg = applyGenericDamageMods(a, dmg);
    if (a.pendingBuff) ctx.pendingBuffConsumed = true;
    applyDamageWithMods(ea, dmg, predictPiercing(a, ab), ek, es.activeIndex, a);
    if (csHasState(a, 'podrida')) {
      csSetState(a, 'podrida', false);
      if (!ea.dead) triggerMarkOrResonance(ea, 'proteccion', who, ek, es.activeIndex);
      logCombat('🎯 Lectura: Podrida consumida · enemigo marcado con Protección');
    }
  },

  interpretacionNC: function(ctx) {
    var a = ctx.active, side = ctx.side;
    if (csHasState(a, 'podrida')) {
      var beforeHp = a.hp;
      var dSide = sideOfChar(a);
      dealDamageToChar(a, 1, { targetSide: dSide.side, targetSideKey: dSide.key, targetIdx: dSide.side.characters.indexOf(a) });
      logCombat('🎯 Interpretación: NC se inflige 1 daño (tenía Podrida)');
      if (a.hp < beforeHp && !a.dead) {
        addOrRefreshShield(a, 'nc_interpretacion', 2);
        logCombat('🎯 Interpretación: daño verdadero recibido → +2 escudo');
      }
    } else {
      csSetState(a, 'podrida', true);
      logCombat('🎯 Interpretación: NC aplica Podrida a sí misma');
    }
  },

  sobreExageracion: function(ctx) {
    var a = ctx.active, ea = ctx.enemyActive, es = ctx.enemySide, ek = ctx.enemyKey, side = ctx.side, who = ctx.who;
    side.podridaHitsAll = true;
    logCombat('🎯 Sobre-exageración: Podrida afectará a todos los enemigos esta ronda');

    // ✅ Obra Maestra dobla el daño base (1 → 2)
    var baseDmg = applyObraMaestraToBase(a, ctx.ability, ctx.actionType, 1);

    if (csHasState(a, 'podrida')) {
      es.characters.forEach(function(c, i){
        if (c.dead) return;
        applyDamageWithMods(c, baseDmg, true, ek, i, a);
        if (!c.dead) triggerMarkOrResonance(c, 'proteccion', who, ek, i);
      });
      logCombat('🎯 Sobre-exageración: ' + baseDmg + ' daño penetrante a todos los enemigos');
      var dSide = sideOfChar(a);
      dealDamageToChar(a, 1, { targetSide: dSide.side, targetSideKey: dSide.key, targetIdx: dSide.side.characters.indexOf(a) });
      logCombat('🎯 Sobre-exageración: NC se inflige 1 daño');
    } else {
      applyDamageWithMods(ea, baseDmg, true, ek, es.activeIndex, a);
      logCombat('🎯 Sobre-exageración: ' + baseDmg + ' daño penetrante a ' + ea.character.name);
      healChar(a, 3, { ignoreNC: true });
      csSetState(a, 'podrida', true);
      logCombat('🎯 Sobre-exageración: NC aplica Podrida y recibe 3 HP');
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // ✅ Google
  // ═══════════════════════════════════════════════════════════════

  android: function(ctx) {
    var a = ctx.active, ea = ctx.enemyActive, es = ctx.enemySide, ek = ctx.enemyKey, side = ctx.side, ab = ctx.ability;
    var dmg = ab.damage || 1;
    applyDamageWithMods(ea, dmg, true, ek, es.activeIndex, a);
    logCombat('🔍 Android: 1 daño penetrante a ' + ea.character.name);
    if (!side.structures) side.structures = [];
    var existing = side.structures.find(function(st){ return st.kind === 'android'; });
    if (existing) {
      existing.duration = 2;
      logCombat('🤖 Android: duración reestablecida (2 rondas)');
    } else {
      side.structures.push({ kind:'android', duration:2 });
      logCombat('🤖 Android: estructura colocada (2 rondas)');
    }
  },

  descansoMental: function(ctx) {
    var a = ctx.active, side = ctx.side;
    side.characters.forEach(function(c){ if (!c.dead) healChar(c, 2); });
    logCombat('🔍 Descanso Mental: aliados +2 HP');
    a.states = { internetEnergyGranted: false };
    a.marks = {};
    a.pendingBuff = 0;
    a.cardNextAttackBonus = 0;
    a.cardNextAttackPiercing = false;
    a.cardNextAttackDouble = false;
    a.cardNextAbilityDiscount = 0;
    a.cardNextAbilityFree = false;
    a.cardMarkBonus = 0;
    a.manuelStacks = 0;
    logCombat('🔍 Descanso Mental: Google limpiada de todos sus efectos');
  },

  // ═══════════════════════════════════════════════════════════════
  // ✅ Facebook
  // ═══════════════════════════════════════════════════════════════

  protocoloSeguridad: function(ctx) {
    var a = ctx.active;
    addOrRefreshShield(a, 'facebook_protocolo', 2);
    a.nextCardDiscount = (a.nextCardDiscount || 0) + 1;
    logCombat('📘 Protocolo de Seguridad: +2 escudo · siguiente carta -1 dado');
  },

  pilarFundamental: function(ctx) {
    var a = ctx.active, ea = ctx.enemyActive, es = ctx.enemySide, ek = ctx.enemyKey, side = ctx.side, ab = ctx.ability, at = ctx.actionType;
    var dmg = ab.damage || 3;
    // ✅ Obra Maestra dobla SOLO el daño base (3 → 6); se elimina el doblado manual antiguo
    dmg = applyObraMaestraToBase(a, ab, at, dmg);
    dmg = applyGenericDamageMods(a, dmg, at === 'elemental');
    if (a.pendingBuff) ctx.pendingBuffConsumed = true;
    applyDamageWithMods(ea, dmg, predictPiercing(a, ab), ek, es.activeIndex, a);
    logCombat('📘 Pilar Fundamental: ' + dmg + ' daño a ' + ea.character.name);

    if (!side.structures) side.structures = [];
    var existing = side.structures.find(function(s){ return s.kind === 'metaQuest'; });
    if (existing) {
      logCombat('📘 Meta Quest: ya estaba activa');
    } else {
      side.structures.push({ kind:'metaQuest', duration:2 });
      logCombat('📘 Meta Quest: colocada (2 rondas)');
    }
  },

  suelaALaCara: function(ctx) {
    executeSuelaALaCaraDamage(ctx.active, ctx.enemyActive, ctx.enemySide, ctx.enemyKey, ctx.side, ctx.who, 0, ctx);
  },

  irisAdvertencia: function(ctx) {
    var a = ctx.active, side = ctx.side, who = ctx.who;
    addOrRefreshShield(a, 'iris_advertencia', 3);
    csSetState(a, 'advertenciaShieldActive', true);
    logCombat('🛡️ Advertencia: Iris +3 escudo (se desvanece al fin de ronda si no se destruye)');
    csSetState(a, 'advertenciaActive', true);
    logCombat('⚔️ Advertencia: durante el resto de la ronda, los ataques a aliados se redirigen a Iris (+1 daño)');
    // Cambia al siguiente aliado activo
    var nx = getNextAliveIndex(side, side.activeIndex);
    if (nx >= 0 && nx !== side.activeIndex) {
      side.activeIndex = nx;
      logCombat('🔄 Advertencia: ' + side.characters[nx].character.name + ' pasa a activo');
      if (typeof triggerKillerTunesDamage === 'function') triggerKillerTunesDamage(who);
    }
  },

  liderPunoHierro: function(ctx) {
    var a = ctx.active, ea = ctx.enemyActive, es = ctx.enemySide, ek = ctx.enemyKey, side = ctx.side, who = ctx.who;
    var hasCharges = ea && ea.states && ea.states.advertido > 0;
    if (hasCharges) {
      logCombat('💥 Líder de Puño de Hierro: ataca con Suela a la Cara (+2 daño base fijo)');
      executeSuelaALaCaraDamage(a, ea, es, ek, side, who, 2, ctx);
    } else {
      logCombat('💥 Líder de Puño de Hierro: sin cargas → reparte Buen Recaudo y +2 escudo a Iris');
      side.characters.forEach(function(c){
        if (c !== a && !c.dead) {
          csSetState(c, 'buenRecaudo', true);
          logCombat('🛡️ ' + c.character.name + ' recibe Buen Recaudo');
        }
      });
      addOrRefreshShield(a, 'iris_definitiva', 2);
      logCombat('🛡️ Iris +2 escudo');
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // ✅ VITTORIA
  // ═══════════════════════════════════════════════════════════════

  vittoriaNormal: function(ctx) {
    var a = ctx.active, ea = ctx.enemyActive, es = ctx.enemySide, ek = ctx.enemyKey, side = ctx.side, ab = ctx.ability;
    var dmg = ab.damage || 1;
    dmg = applyGenericDamageMods(a, dmg);
    if (a.pendingBuff) ctx.pendingBuffConsumed = true;
    var ob = getOptimizationBonus(side);
    if (ob > 0) { dmg += ob; logCombat('🏛️ Optimización: +' + ob); }
    applyDamageWithMods(ea, dmg, false, ek, es.activeIndex, a);
    // ✅ Reembolso de dados si el enemigo muere por este ataque
    if (ea.dead && ctx._preSpentDice && ctx._preSpentDice.length > 0) {
      ctx._preSpentDice.forEach(function(d){ d.justAdded = false; side.dice.push(d); });
      logCombat('🎲 Habilidad normal: enemigo derrotado → +' + ctx._preSpentDice.length + ' dado(s) recuperado(s)');
    }
  },

  vittoriaAceptacion: function(ctx) {
    var a = ctx.active, ea = ctx.enemyActive, es = ctx.enemySide, ek = ctx.enemyKey, side = ctx.side, who = ctx.who;
    if (csHasMark(ea, 'aceptacion')) {
      // Enemigo marcado → Vittoria cura 2
      var healed = healChar(a, 2);
      logCombat('🌿 Aceptación: enemigo marcado → Vittoria +' + healed + ' HP');
    } else {
      // Enemigo sin marcar → 1 daño penetrante + marca
      applyDamageWithMods(ea, 1, true, ek, es.activeIndex, a);
      logCombat('🌿 Aceptación: 1 daño penetrante a ' + ea.character.name);
      if (!ea.dead) {
        triggerMarkOrResonance(ea, 'aceptacion', who, ek, es.activeIndex);
      }
    }
  },

  vistoUltimate: function(ctx) {
    var a = ctx.active, ea = ctx.enemyActive, side = ctx.side;
    // Aplicar "visto" a los otros aliados (no a Vittoria)
    side.characters.forEach(function(c){
      if (c === a || c.dead) return;
      csSetState(c, 'visto', true);
      logCombat('👁️ ' + c.character.name + ' recibe "Visto"');
    });
    // Y al enemigo activo en ese momento
    if (ea && !ea.dead) {
      csSetState(ea, 'visto', true);
      logCombat('👁️ ' + ea.character.name + ' recibe "Visto"');
    }
  },

};
