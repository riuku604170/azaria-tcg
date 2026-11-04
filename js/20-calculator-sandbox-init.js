function populateCalcSelects(){ var a = document.getElementById('calcAttacker'), d = document.getElementById('calcDefender'); if (!a || !d) return; var ids = Object.keys(COMBAT_CHARS); var opts = ids.map(function(id){ var ch = COMBAT_CHARS[id]; return '<option value="' + id + '">' + ch.emoji + ' ' + ch.name + ' — ' + ELEMENT_NAMES[ch.element] + '</option>'; }).join(''); a.innerHTML = opts; d.innerHTML = opts; a.value = 'jose'; d.value = 'eloy'; }
function getCalcAbilityType(){ var t = document.querySelector('.calc-ability-tab.active'); return t ? t.dataset.type : 'normal'; }
function getCalcAbility(){ var a = document.getElementById('calcAttacker'); if (!a) return null; var ch = COMBAT_CHARS[a.value]; if (!ch) return null; return ch.abilities[getCalcAbilityType()] || null; }
function renderCalcAbilityInfo(){ var el = document.getElementById('calcAbilityInfo'); if (!el) return; var ab = getCalcAbility(); if (!ab) { el.innerHTML = ''; return; } var costHtml = ''; if (ab.cost) { var cs = formatCost(ab.cost, ab.energyCost); costHtml = '<div style="margin-top: 0.4rem; font-size: 0.75rem;">' + cs + '</div>'; } var notes = []; if (ab.damage) notes.push('Daño base: ' + ab.damage); if (ab.piercing) notes.push('Penetrante'); if (ab.selfDamage) notes.push('Autodaño ' + ab.selfDamage); el.innerHTML = '<div class="calc-ability-info-name">' + ab.name + '</div>' + (notes.length ? '<div style="color: var(--accent); margin-top: 0.4rem;">' + notes.join(' · ') + '</div>' : '') + costHtml; }
function computeCalcDamage(){
  var a = document.getElementById('calcAttacker'), d = document.getElementById('calcDefender'); if (!a || !d) return null;
  var attacker = COMBAT_CHARS[a.value], defender = COMBAT_CHARS[d.value]; if (!attacker || !defender) return null;
  var ab = getCalcAbility(); if (!ab) return null;
  var aHp = parseInt(document.getElementById('calcAttackerHp').value, 10) || 0;
  var buff = parseInt(document.getElementById('calcAttackerBuff').value, 10) || 0;
  var redLv = parseInt(document.getElementById('calcRedencionConsonance').value, 10) || 0;
  var first = document.getElementById('calcFirstAttack').checked;
  var dHp = parseInt(document.getElementById('calcDefenderHp').value, 10) || 0;
  var dSh = parseInt(document.getElementById('calcDefenderShield').value, 10) || 0;
  var flat = parseInt(document.getElementById('calcDefenderFlatReduction').value, 10) || 0;
  var pct = parseInt(document.getElementById('calcDefenderPctReduction').value, 10) || 0;
  var mod = parseInt(document.getElementById('calcDefenderDmgModifier').value, 10) || 0;
  var base = ab.damage || 0, buffD = 0, redD = 0;
  if (ab.target === 'enemy' && base > 0) { buffD = buff; if (redLv > 0 && first) redD = redLv === 3 ? 3 : 2; }
  var sub = base + buffD + redD;
  var afterMod = sub * (1 + mod / 100);
  var afterFlat = Math.max(0, afterMod - flat);
  var totalD = Math.round(afterFlat * (1 - pct / 100));
  var pierce = !!ab.piercing, shieldAbs = 0, trueD = totalD, dShAfter = dSh;
  if (!pierce && dSh > 0 && totalD > 0) { shieldAbs = Math.min(dSh, totalD); trueD = totalD - shieldAbs; dShAfter = dSh - shieldAbs; }
  var dHpAfter = Math.max(0, dHp - trueD), dKilled = dHpAfter <= 0;
  var selfD = ab.selfDamage || 0, aHpAfter = Math.max(0, aHp - selfD), aKilled = aHpAfter <= 0;
  return { attacker:attacker, defender:defender, ability:ab, isPiercing:pierce, baseDmg:base, buffDmg:buffD, redencionDmg:redD, subtotal:sub, dmgModifier:mod, flatReduction:flat, pctReduction:pct, totalDamage:totalD, shieldAbsorbed:shieldAbs, trueDamage:trueD, defenderHpBefore:dHp, defenderHpAfter:dHpAfter, defenderShieldBefore:dSh, defenderShieldAfter:dShAfter, defenderKilled:dKilled, selfDamage:selfD, attackerHpBefore:aHp, attackerHpAfter:aHpAfter, attackerKilled:aKilled };
}
function renderCalcResult(){
  var c = document.getElementById('calcResult'); if (!c) return;
  var r = computeCalcDamage(); if (!r) { c.innerHTML = '<div class="calc-result-empty">Configura el atacante y el defensor.</div>'; return; }
  var isAtk = r.ability.target === 'enemy' && r.baseDmg > 0;
  var html = '<div class="calc-result-grid">';
  html += '<div class="calc-result-section attacker"><div class="calc-result-section-title">⚔️ ' + r.attacker.emoji + ' ' + r.attacker.name + '</div>';
  if (isAtk) { if (r.baseDmg) html += '<div class="calc-result-row"><span class="calc-result-label">Daño base</span><span class="calc-result-value damage">' + r.baseDmg + '</span></div>'; if (r.buffDmg) html += '<div class="calc-result-row"><span class="calc-result-label">+ Impulso</span><span class="calc-result-value bonus">+' + r.buffDmg + '</span></div>'; if (r.redencionDmg) html += '<div class="calc-result-row"><span class="calc-result-label">+ Redención</span><span class="calc-result-value bonus">+' + r.redencionDmg + '</span></div>'; if (r.flatReduction) html += '<div class="calc-result-row"><span class="calc-result-label">− Reducción</span><span class="calc-result-value shield">−' + r.flatReduction + '</span></div>'; html += '<div class="calc-result-total"><div class="calc-result-total-label">Daño total</div><div class="calc-result-total-value damage">' + r.totalDamage + '</div></div>'; }
  if (r.selfDamage) html += '<div class="calc-result-row"><span class="calc-result-label">Autodaño</span><span class="calc-result-value damage">−' + r.selfDamage + '</span></div>';
  html += '</div>';
  html += '<div class="calc-result-section defender"><div class="calc-result-section-title">🛡️ ' + r.defender.emoji + ' ' + r.defender.name + '</div>';
  if (isAtk) { html += '<div class="calc-result-total"><div class="calc-result-total-label">Daño verdadero</div><div class="calc-result-total-value true-dmg">' + r.trueDamage + '</div></div>'; html += '<div class="calc-hp-change"><div class="calc-hp-box"><div class="calc-hp-value">' + r.defenderHpBefore + '</div><div class="calc-hp-label">HP antes</div></div><div class="calc-hp-arrow">→</div><div class="calc-hp-box"><div class="calc-hp-value ' + (r.defenderHpAfter < r.defenderHpBefore ? 'down' : '') + '">' + r.defenderHpAfter + '</div><div class="calc-hp-label">HP después</div></div></div>'; }
  else html += '<div class="calc-result-row"><span class="calc-result-label">Habilidad sobre sí mismo</span><span class="calc-result-value neutral">sin daño</span></div>';
  html += '</div></div>';
  if (isAtk && r.defenderKilled) html += '<div class="calc-result-warning kill">💀 ¡' + r.defender.name + ' moriría!</div>';
  c.innerHTML = html;
}
function setupDamageCalculator(){
  populateCalcSelects();
  var a = document.getElementById('calcAttacker'), d = document.getElementById('calcDefender'); if (!a || !d) return;
  a.addEventListener('change', function(){ var ch = COMBAT_CHARS[a.value]; if (ch) { var hp = document.getElementById('calcAttackerHp'); hp.value = ch.hp; hp.max = ch.hp; } renderCalcAbilityInfo(); renderCalcResult(); });
  d.addEventListener('change', function(){ var ch = COMBAT_CHARS[d.value]; if (ch) { var hp = document.getElementById('calcDefenderHp'); hp.value = ch.hp; hp.max = ch.hp; } renderCalcResult(); });
  document.querySelectorAll('.calc-ability-tab').forEach(function(tab){ tab.addEventListener('click', function(){ document.querySelectorAll('.calc-ability-tab').forEach(function(t){ t.classList.remove('active'); }); tab.classList.add('active'); renderCalcAbilityInfo(); renderCalcResult(); }); });
  ['calcAttackerHp','calcAttackerShield','calcAttackerBuff','calcRedencionConsonance','calcFirstAttack','calcDefenderHp','calcDefenderShield','calcDefenderFlatReduction','calcDefenderPctReduction','calcDefenderDmgModifier'].forEach(function(id){ var el = document.getElementById(id); if (!el) return; el.addEventListener('input', renderCalcResult); el.addEventListener('change', renderCalcResult); });
  var aCh = COMBAT_CHARS[a.value]; if (aCh) { var hp1 = document.getElementById('calcAttackerHp'); hp1.value = aCh.hp; hp1.max = aCh.hp; }
  var dCh = COMBAT_CHARS[d.value]; if (dCh) { var hp2 = document.getElementById('calcDefenderHp'); hp2.value = dCh.hp; hp2.max = dCh.hp; }
  renderCalcAbilityInfo(); renderCalcResult();
}

function addInfoButtons() {
  var cards = document.querySelectorAll('.char-card');
  for (var i = 0; i < cards.length; i++) (function(card){
    var portrait = card.querySelector('.portrait'); if (!portrait) return;
    var btn = document.createElement('button');
    btn.className = 'card-info-btn';
    btn.innerHTML = 'i';
    btn.title = 'Ver detalles del personaje';
    btn.setAttribute('aria-label', 'Ver detalles');
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      openCharacter(card.dataset.character);
    });
    portrait.appendChild(btn);
  })(cards[i]);
}

/* ═══ SANDBOX ═══ */
var sandboxOpen = false;
var sandboxTab = 'global';   // antes: 'char'
var sandboxCharSide = 'player';
var sandboxCharIdx = 0;

function openSandboxPanel() {
  console.log('[Sandbox] openSandboxPanel called');
  var p = document.getElementById('sandboxPanel');
  var t = document.getElementById('sandboxToggleBtn');
  if (!p) { console.error('[Sandbox] #sandboxPanel NOT FOUND'); return; }
  sandboxOpen = true;
  p.hidden = false;
  p.style.display = 'flex';       // ✅ forzar display por si acaso
  p.style.zIndex = '3000';        // ✅ por encima del modal
  if (t && currentGameMode !== 'sandbox') t.style.display = 'none';
  try {
    renderSandboxPanel();
  } catch (err) {
    console.error('[Sandbox] renderSandboxPanel ERROR:', err);
  }
  var sb = document.getElementById('sandboxBody');
  if (!sb || !sb.innerHTML.trim()) {
    if (sb) sb.innerHTML = '<div class="sb-empty">No hay combate activo.</div>';
  }
  console.log('[Sandbox] panel visible? hidden=', p.hidden, '| display=', p.style.display, '| zIndex=', p.style.zIndex);
}
function closeSandboxPanel() {
  var p = document.getElementById('sandboxPanel');
  var t = document.getElementById('sandboxToggleBtn');
  if (!p) return;
  sandboxOpen = false;
  p.hidden = true;
  if (t) t.style.display = (currentGameMode === 'sandbox') ? '' : 'none';
}
function renderSandboxPanel() {
  var body = document.getElementById('sandboxBody');   // ✅ AÑADIR
  if (!combatState) {
    if (body) body.innerHTML = '<div class="sb-empty">No hay combate activo.</div>';
    return;
  }
  if (!body) return;
  var html = '';
  if (sandboxTab === 'global') html = sbRenderGlobal();
  else if (sandboxTab === 'char') html = sbRenderChar();
  else if (sandboxTab === 'dice') html = sbRenderDice();
  else if (sandboxTab === 'cards') html = sbRenderCards();
  else if (sandboxTab === 'fx') html = sbRenderFx();
  body.innerHTML = html;
  sbBindEvents();
}

/* ═══════════════════════════════════════════════════════════════
   SANDBOX v2 — Entorno de pruebas completo
   ═══════════════════════════════════════════════════════════════ */

var SB_STATE_KEYS = [
  'castigada','vulnerable','amenaza','furia','furiaPending',
  'defensaActiva','sintonia','acelerado','vuelo','carrerilla',
  'minutoSilencioShield','hipotesisShieldActive','internetEnergyGranted'
];
var SB_NUMERIC_KEYS = ['condena','invulnerabilidad','rencor'];
var SB_SIDE_NUMS = ['enemyAttackDebuff','contraataque','obraMaestraTurns'];
var SB_EQUIP_IDS = Object.keys(EQUIPMENT_CARDS);
var SB_SUPPORT_IDS = Object.keys(SUPPORT_CARDS);
var SB_CARD_IDS = Object.keys(CARD_DB);

function sbAllChars() {
  var out = [];
  if (!combatState) return out;
  ['player','bot'].forEach(function(sk){
    combatState[sk].characters.forEach(function(cs, i){
      out.push({ sideKey: sk, idx: i, cs: cs, side: combatState[sk] });
    });
  });
  return out;
}
function sbTargetSelect(selected, id) {
  var opts = sbAllChars().map(function(item){
    var label = (item.sideKey === 'player' ? 'J1' : 'J2') + ' · ' + item.cs.character.name;
    var val = item.sideKey + ':' + item.idx;
    return '<option value="' + val + '"' + (selected === val ? ' selected' : '') + '>' + label + '</option>';
  }).join('');
  return '<select id="' + id + '">' + opts + '</select>';
}
function sbConsonanceLabel(c) {
  if (!c) return '—';
  if (c.type === 'diverse') return '🌈 Diverso';
  return (PHILOSOPHIES[c.element] ? PHILOSOPHIES[c.element].emoji : '') + ' ' + (c.level || 0) + '/3';
}

/* ─── GLOBAL ─── */
function sbRenderGlobal() {
  if (!combatState) return '';
  var c = combatState, h = '';

  h += '<div class="sb-section"><div class="sb-section-title">Modo de turno (Sandbox)</div>';
  h += '<div class="sb-row"><select id="sbTurnMode" style="flex:1;padding:0.3rem 0.5rem;background:rgba(0,0,0,0.4);border:1px solid rgba(92,179,255,0.3);border-radius:8px;color:#fff;font-family:inherit;font-size:0.78rem;">';
  h += '<option value="player-only"' + (sandboxTurnMode === 'player-only' ? ' selected' : '') + '>Solo usuario (turno permanente)</option>';
  h += '<option value="bot"' + (sandboxTurnMode === 'bot' ? ' selected' : '') + '>Jugar contra bot</option>';
  h += '<option value="two-users"' + (sandboxTurnMode === 'two-users' ? ' selected' : '') + '>Control manual de ambos</option>';
  h += '</select></div>';
  h += '<div class="sb-row" style="font-size:0.65rem;color:var(--muted);font-style:italic;">Solo usuario: tus acciones no ceden turno. Contra bot: el rival responde. Manual: controlas ambos equipos.</div>';
  h += '</div>';

  h += '<div class="sb-section"><div class="sb-section-title">Ronda, turno y fase</div>';
  h += '<div class="sb-row"><label>Ronda</label><input type="number" id="sbRound" value="' + c.round + '" min="1"></div>';
  h += '<div class="sb-row"><button class="sb-btn" id="sbNextRoundBtn" style="flex:1;">⏭️ Siguiente ronda</button><button class="sb-btn danger" id="sbForceEndRoundBtn" style="flex:1;">⏹️ Fin de ronda</button></div>';
  h += '<div class="sb-row"><label>Turno</label><select id="sbTurn" style="flex:1;"><option value="player"' + (c.turn === 'player' ? ' selected' : '') + '>J1</option><option value="bot"' + (c.turn === 'bot' ? ' selected' : '') + '>J2</option></select></div>';
  h += '<div class="sb-row"><label>Fase</label><select id="sbPhase" style="flex:1;">' + ['playing','rolling','drawing','ended'].map(function(p){ return '<option value="' + p + '"' + (c.phase === p ? ' selected' : '') + '>' + p + '</option>'; }).join('') + '</select></div>';
  h += '<div class="sb-row"><label>J1 fin</label><input type="checkbox" id="sbPlayerDone"' + (c.playerDone ? ' checked' : '') + '></div>';
  h += '<div class="sb-row"><label>J2 fin</label><input type="checkbox" id="sbBotDone"' + (c.botDone ? ' checked' : '') + '></div>';
  h += '</div>';

  h += '<div class="sb-section"><div class="sb-section-title">Forzar resultado</div>';
  h += '<div class="sb-row"><button class="sb-btn warn" id="sbWinPlayerBtn" style="flex:1;">🏆 Gana J1</button><button class="sb-btn warn" id="sbWinBotBtn" style="flex:1;">🏆 Gana J2</button></div>';
  h += '</div>';

  h += '<div class="sb-section"><div class="sb-section-title">Consonancia (forzar)</div>';
  ['player','bot'].forEach(function(sk){
    var cons = c[sk].consonance || {};
    var curEl = cons.element || '';
    var curType = cons.type || 'diverse';
    h += '<div class="sb-row"><label>' + (sk === 'player' ? 'J1' : 'J2') + '</label><select data-sb-cons="' + sk + '" style="flex:1;">';
    h += '<option value="diverse"' + (curType === 'diverse' ? ' selected' : '') + '>🌈 Diverso</option>';
    CONSONANCE_ORDER.forEach(function(el){
      h += '<option value="' + el + '"' + (curType === 'single' && curEl === el ? ' selected' : '') + '>' + ELEMENT_EMOJI[el] + ' ' + ELEMENT_NAMES[el] + '</option>';
    });
    h += '</select></div>';
  });
  h += '</div>';

  h += '<div class="sb-section"><div class="sb-section-title">Contadores del lado</div>';
  ['player','bot'].forEach(function(sk){
    var side = c[sk];
    h += '<div style="margin:0.4rem 0 0.2rem;font-size:0.68rem;font-weight:800;color:#5cb3ff;text-transform:uppercase;">' + (sk === 'player' ? 'J1' : 'J2') + '</div>';
    SB_SIDE_NUMS.forEach(function(k){
      h += '<div class="sb-row"><label>' + k + '</label><input type="number" data-sb-snum="' + sk + ':' + k + '" value="' + (side[k] || 0) + '" min="0"></div>';
    });
    h += '<div class="sb-row"><label>firstChangeUsed</label><input type="checkbox" data-sb-sbool="' + sk + ':firstChangeUsed"' + (side.firstChangeUsed ? ' checked' : '') + '></div>';
    h += '<div class="sb-row"><label>firstAttackUsed</label><input type="checkbox" data-sb-sbool="' + sk + ':firstAttackUsed"' + (side.firstAttackUsed ? ' checked' : '') + '></div>';
    h += '<div class="sb-row"><label>alterUltBuff amount</label><input type="number" data-sb-alter-amt="' + sk + '" value="' + ((side.alterUltBuff && side.alterUltBuff.amount) || 0) + '" min="0"></div>';
    h += '<div class="sb-row"><label>alterUltBuff rounds</label><input type="number" data-sb-alter-rnd="' + sk + '" value="' + ((side.alterUltBuff && side.alterUltBuff.roundsLeft) || 0) + '" min="0"></div>';
  });
  h += '</div>';

  h += '<div class="sb-section"><div class="sb-section-title">Vista general</div>';
  ['player','bot'].forEach(function(sk){
    var side = c[sk];
    h += '<div style="margin:0.3rem 0 0.1rem;font-size:0.68rem;font-weight:800;color:#5cb3ff;">' + (sk === 'player' ? 'J1' : 'J2') + '</div>';
    side.characters.forEach(function(cs, i){
      var isActive = i === side.activeIndex;
      h += '<div class="sb-row" style="font-size:0.7rem;"><span style="flex:1;">' + (isActive ? '⭐ ' : '') + cs.character.name + (cs.dead ? ' 💀' : '') + '</span><span style="color:' + (cs.dead ? '#ff8a98' : '#7aff9a') + ';">' + (cs.dead ? 'KO' : cs.hp + 'HP · ' + cs.energy + 'E') + '</span></div>';
    });
    h += '<div class="sb-row" style="font-size:0.7rem;"><span style="flex:1;">Deck/Hand/Discard</span><span>' + side.deck.length + ' / ' + side.hand.length + ' / ' + (side.discardPile ? side.discardPile.length : 0) + '</span></div>';
  });
  h += '</div>';

  h += '<div class="sb-section"><div class="sb-section-title">Global</div>';
  h += '<div class="sb-row"><label>EX combate</label><input type="checkbox" id="sbExEnabled"' + (c.exCombatEnabled ? ' checked' : '') + '></div>';
  h += '<div class="sb-row"><button class="sb-btn warn" id="sbEndCombatBtn" style="width:100%;">⏹ Terminar combate</button></div>';
  h += '</div>';

  return h;
}

/* ─── PERSONAJE ─── */
function sbRenderChar() {
  if (!combatState) return '';
  var sideKey = sandboxCharSide, side = combatState[sideKey];
  var cs = side.characters[sandboxCharIdx] || side.characters[0];
  if (!cs) return '';
  var h = '';

  h += '<div class="sb-section"><div class="sb-section-title">Selecciona personaje</div><div class="sb-char-selector">';
  h += '<button class="sb-char-chip' + (sideKey === 'player' ? ' active' : '') + '" data-sb-side="player" style="--el: 140,180,230;">J1</button>';
  h += '<button class="sb-char-chip' + (sideKey === 'bot' ? ' active' : '') + '" data-sb-side="bot" style="--el: 200,45,60;">J2</button>';
  side.characters.forEach(function(c, i){
    h += '<button class="sb-char-chip' + (i === sandboxCharIdx ? ' active' : '') + '" data-sb-char-idx="' + i + '" style="--el:' + ELEMENT_COLORS[c.character.element] + ';">' + c.character.emoji + ' ' + c.character.name + '</button>';
  });
  h += '</div>';
  h += '<div class="sb-row"><label>ID</label><span>' + cs.id + '</span></div>';
  h += '<div class="sb-row"><label>HP</label><input type="number" id="sbHp" value="' + cs.hp + '" min="0" max="' + cs.maxHp + '"> / ' + cs.maxHp + '</div>';
  h += '<div class="sb-row"><label>Max HP</label><input type="number" id="sbMaxHp" value="' + cs.maxHp + '" min="1"></div>';
  h += '<div class="sb-row"><label>Energía</label><input type="number" id="sbEnergy" value="' + cs.energy + '" min="0" max="' + cs.maxEnergy + '"> / ' + cs.maxEnergy + '</div>';
  h += '<div class="sb-row"><label>Max energía</label><input type="number" id="sbMaxEnergy" value="' + cs.maxEnergy + '" min="1"></div>';
  h += '<div class="sb-row"><button class="sb-btn" id="sbSetActiveBtn" style="flex:1;">⭐ Poner activo</button><button class="sb-btn danger" id="sbKillChar" style="flex:1;">💀 Matar</button></div>';
  h += '<div class="sb-row"><button class="sb-btn warn" id="sbFullHeal" style="width:100%;">💚 Curar al máximo</button></div>';
  h += '</div>';

  h += '<div class="sb-section"><div class="sb-section-title">Escudos</div>';
  h += '<div class="sb-row"><label>Total</label><span>' + totalShield(cs) + '</span></div>';
  (cs.shields || []).forEach(function(sh, i){
    h += '<div class="sb-row"><span style="flex:1;font-size:0.72rem;">🛡️ ' + sh.hp + '/' + sh.maxHp + ' (' + sh.source + ')</span><button class="sb-btn danger" data-sb-rm-shield="' + i + '">✕</button></div>';
  });
  h += '<div class="sb-row"><input type="number" id="sbShieldAmt" value="1" min="0" style="width:55px;"><input type="text" id="sbShieldSrc" placeholder="fuente" value="sandbox" style="flex:1;padding:0.3rem 0.5rem;background:rgba(0,0,0,0.4);border:1px solid rgba(92,179,255,0.3);border-radius:8px;color:#fff;font-family:inherit;font-size:0.78rem;"><button class="sb-btn" id="sbAddShield">+</button></div>';
  h += '<div class="sb-row"><button class="sb-btn danger" id="sbShieldClear" style="width:100%;">Vaciar escudos</button></div>';
  h += '</div>';

  h += '<div class="sb-section"><div class="sb-section-title">Estados</div>';
  SB_STATE_KEYS.forEach(function(k){
    h += '<div class="sb-row"><label>' + k + '</label><input type="checkbox" data-sb-state="' + k + '"' + (cs.states && cs.states[k] ? ' checked' : '') + '></div>';
  });
  SB_NUMERIC_KEYS.forEach(function(k){
    h += '<div class="sb-row"><label>' + k + '</label><input type="number" data-sb-state-num="' + k + '" value="' + ((cs.states && cs.states[k]) || 0) + '" min="0"></div>';
  });
  h += '<div class="sb-row"><label>manuelStacks</label><input type="number" id="sbManuelStacks" value="' + (cs.manuelStacks || 0) + '" min="0"></div>';
  h += '</div>';

  h += '<div class="sb-section"><div class="sb-section-title">Marcas</div>';
  CONSONANCE_ORDER.forEach(function(el){
    h += '<div class="sb-row"><label>' + ELEMENT_EMOJI[el] + ' ' + ELEMENT_NAMES[el] + '</label><input type="checkbox" data-sb-mark="' + el + '"' + (cs.marks && cs.marks[el] ? ' checked' : '') + '></div>';
  });
  h += '</div>';

  h += '<div class="sb-section"><div class="sb-section-title">Bonos y modificadores</div>';
  h += '<div class="sb-row"><label>pendingBuff</label><input type="number" id="sbPendingBuff" value="' + (cs.pendingBuff || 0) + '" min="0"></div>';
  h += '<div class="sb-row"><label>cardNextAttackBonus</label><input type="number" id="sbCardAtkBonus" value="' + (cs.cardNextAttackBonus || 0) + '" min="0"></div>';
  h += '<div class="sb-row"><label>cardNextAttackPiercing</label><input type="checkbox" id="sbCardPierce"' + (cs.cardNextAttackPiercing ? ' checked' : '') + '></div>';
  h += '<div class="sb-row"><label>cardNextAttackDouble</label><input type="checkbox" id="sbCardDouble"' + (cs.cardNextAttackDouble ? ' checked' : '') + '></div>';
  h += '<div class="sb-row"><label>cardNextAbilityDiscount</label><input type="number" id="sbCardDisc" value="' + (cs.cardNextAbilityDiscount || 0) + '" min="0"></div>';
  h += '<div class="sb-row"><label>cardNextAbilityFree</label><input type="checkbox" id="sbCardFree"' + (cs.cardNextAbilityFree ? ' checked' : '') + '></div>';
  h += '<div class="sb-row"><label>cardMarkBonus</label><input type="number" id="sbCardMarkBonus" value="' + (cs.cardMarkBonus || 0) + '" min="0"></div>';
  h += '<div class="sb-row"><label>🌟 EX activa</label><input type="checkbox" id="sbExActive"' + (cs.exActive ? ' checked' : '') + '></div>';
  h += '</div>';

  h += '<div class="sb-section"><div class="sb-section-title">Equipamiento</div>';
  (cs.equipment || []).forEach(function(eqId, i){
    var eq = CARD_DB[eqId]; if (!eq) return;
    h += '<div class="sb-row"><span style="flex:1;font-size:0.72rem;">' + eq.emoji + ' ' + eq.name + '</span><button class="sb-btn danger" data-sb-rm-equip="' + i + '">✕</button></div>';
  });
  if (!cs.equipment || !cs.equipment.length) h += '<div class="sb-row" style="font-style:italic;color:var(--muted);font-size:0.72rem;">Sin equipamiento</div>';
  h += '<div class="sb-row"><select id="sbAddEquipSel" style="flex:1;font-size:0.7rem;"><option value="">— Añadir —</option>' + SB_EQUIP_IDS.map(function(id){ var eq = EQUIPMENT_CARDS[id]; return '<option value="' + id + '">' + eq.emoji + ' ' + eq.name + '</option>'; }).join('') + '</select><button class="sb-btn" id="sbAddEquipBtn">+</button></div>';
  h += '<div class="sb-row"><button class="sb-btn danger" id="sbClearEquip" style="width:100%;">Vaciar equipamiento</button></div>';
  h += '<div class="sb-row"><label>Pintura Erik</label><select id="sbPaint" style="flex:1;"><option value="">—</option>' + ['roja','azul','verde'].map(function(c){ return '<option value="' + c + '"' + (cs.paintEquipped === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></div>';
  h += '</div>';

  return h;
}

/* ─── DADOS ─── */
function sbRenderDice() {
  if (!combatState) return '';
  var h = '';
  ['player','bot'].forEach(function(sk){
    var side = combatState[sk];
    h += '<div class="sb-section"><div class="sb-section-title">Dados ' + (sk === 'player' ? 'J1' : 'J2') + ' (' + side.dice.length + ')</div>';
    if (side.dice.length) {
      side.dice.forEach(function(d, i){
        var isOm = d.type === 'omni';
        h += '<div class="sb-row"><span style="width:24px;text-align:center;">' + (isOm ? '✨' : ELEMENT_EMOJI[d.type]) + '</span>';
        h += '<select data-sb-die-type="' + sk + ':' + i + '" style="flex:1;font-size:0.7rem;"><option value="omni"' + (isOm ? ' selected' : '') + '>omni</option>' + CONSONANCE_ORDER.map(function(el){ return '<option value="' + el + '"' + (d.type === el ? ' selected' : '') + '>' + ELEMENT_NAMES[el] + '</option>'; }).join('') + '</select>';
        h += '<button class="sb-btn danger" data-sb-rm-die="' + sk + ':' + i + '">✕</button></div>';
      });
    } else {
      h += '<div class="sb-row" style="font-style:italic;color:var(--muted);font-size:0.72rem;">Sin dados</div>';
    }
    h += '<div class="sb-row"><select data-sb-add-die-sel="' + sk + '" style="flex:1;font-size:0.7rem;"><option value="omni">✨ omni</option>' + CONSONANCE_ORDER.map(function(el){ return '<option value="' + el + '">' + ELEMENT_EMOJI[el] + ' ' + ELEMENT_NAMES[el] + '</option>'; }).join('') + '</select><input type="number" data-sb-add-die-count="' + sk + '" value="1" min="1" style="width:50px;padding:0.3rem;background:rgba(0,0,0,0.4);border:1px solid rgba(92,179,255,0.3);border-radius:8px;color:#fff;font-family:inherit;font-size:0.8rem;"><button class="sb-btn" data-sb-add-die-btn="' + sk + '">+</button></div>';
    h += '<div class="sb-row"><button class="sb-btn" data-sb-add-specific="' + sk + ':omni" title="+1 omni">✨</button>';
    CONSONANCE_ORDER.forEach(function(el){
      h += '<button class="sb-btn" data-sb-add-specific="' + sk + ':' + el + '" style="background:rgba(' + ELEMENT_COLORS[el] + ',0.2);border-color:rgba(' + ELEMENT_COLORS[el] + ',0.6);color:rgb(' + ELEMENT_COLORS[el] + ');" title="+1 ' + ELEMENT_NAMES[el] + '">' + ELEMENT_EMOJI[el] + '</button>';
    });
    h += '</div>';
    h += '<div class="sb-row"><button class="sb-btn" data-sb-roll-dice="' + sk + '">🎲 Tirar 8</button><button class="sb-btn danger" data-sb-clear-dice="' + sk + '" style="flex:1;">Vaciar</button></div>';
    h += '</div>';
  });
  return h;
}

/* ─── CARTAS ─── */
function sbRenderCards() {
  if (!combatState) return '';
  var h = '';
  ['player','bot'].forEach(function(sk){
    var side = combatState[sk];
    h += '<div class="sb-section"><div class="sb-section-title">Mano ' + (sk === 'player' ? 'J1' : 'J2') + ' (' + side.hand.length + ')</div>';
    side.hand.forEach(function(cid, i){
      var card = CARD_DB[cid] || PAINT_CARDS[cid];
      h += '<div class="sb-row"><span style="flex:1;font-size:0.7rem;">' + (card ? card.emoji + ' ' + card.name : cid) + '</span><button class="sb-btn danger" data-sb-rm-hand="' + sk + ':' + i + '">✕</button></div>';
    });
    if (!side.hand.length) h += '<div class="sb-row" style="font-style:italic;color:var(--muted);font-size:0.72rem;">Mano vacía</div>';
    h += '<div class="sb-row"><select data-sb-add-card-sel="' + sk + '" style="flex:1;font-size:0.7rem;"><option value="">— Elegir carta —</option>' + SB_CARD_IDS.map(function(id){ var c = CARD_DB[id]; return '<option value="' + id + '">' + c.emoji + ' ' + c.name + ' [' + c.category + ']</option>'; }).join('') + '</select><input type="number" data-sb-add-card-count="' + sk + '" value="1" min="1" style="width:50px;padding:0.3rem;background:rgba(0,0,0,0.4);border:1px solid rgba(92,179,255,0.3);border-radius:8px;color:#fff;font-family:inherit;font-size:0.8rem;"><button class="sb-btn" data-sb-add-card-btn="' + sk + '">+</button></div>';
    h += '<div class="sb-row"><button class="sb-btn" data-sb-draw="' + sk + '">Robar 1</button><button class="sb-btn" data-sb-draw-n="' + sk + '">Robar 5</button><button class="sb-btn danger" data-sb-clear-hand="' + sk + '">Vaciar</button></div>';
    h += '<div class="sb-row" style="font-size:0.7rem;"><span style="flex:1;">Deck/Discard</span><span>' + side.deck.length + ' / ' + (side.discardPile ? side.discardPile.length : 0) + '</span></div>';
    h += '<div class="sb-row"><button class="sb-btn warn" data-sb-reshuffle="' + sk + '">♻️ Barajar descarte al mazo</button></div>';
    h += '</div>';

    h += '<div class="sb-section"><div class="sb-section-title">Apoyos ' + (sk === 'player' ? 'J1' : 'J2') + '</div>';
    for (var i = 0; i < 4; i++) {
      var sp = side.supports[i];
      if (sp) {
        var spC = CARD_DB[sp.cardId];
        h += '<div class="sb-row"><span style="flex:1;font-size:0.72rem;">' + (spC ? spC.emoji + ' ' + spC.name : sp.cardId) + ' (' + sp.duration + 'r)</span><button class="sb-btn danger" data-sb-rm-support="' + sk + ':' + i + '">✕</button></div>';
      } else {
        h += '<div class="sb-row"><span style="flex:1;font-size:0.72rem;color:var(--muted);">Slot ' + (i+1) + ' vacío</span></div>';
      }
    }
    h += '<div class="sb-row"><select data-sb-add-support-sel="' + sk + '" style="flex:1;font-size:0.7rem;"><option value="">— Añadir apoyo —</option>' + SB_SUPPORT_IDS.map(function(id){ var c = SUPPORT_CARDS[id]; return '<option value="' + id + '">' + c.emoji + ' ' + c.name + '</option>'; }).join('') + '</select><button class="sb-btn" data-sb-add-support-btn="' + sk + '">+</button></div>';
    h += '</div>';
  });
  return h;
}

/* ─── EFECTOS ─── */
function sbRenderFx() {
  if (!combatState) return '';
  var h = '';

  h += '<div class="sb-section"><div class="sb-section-title">Daño / Curación / Escudo</div>';
  h += '<div class="sb-row"><label>Objetivo</label>' + sbTargetSelect(null, 'sbFxTarget') + '</div>';
  h += '<div class="sb-row"><label>Daño</label><input type="number" id="sbFxDmg" value="1" min="0" style="width:60px;"><label style="flex:0;min-width:auto;">Piercing</label><input type="checkbox" id="sbFxPierce"></div>';
  h += '<div class="sb-row"><button class="sb-btn" id="sbApplyDmg" style="flex:1;">💥 Daño</button><button class="sb-btn warn" id="sbApplyDmgAll" style="flex:1;">💥 A todos</button></div>';
  h += '<div class="sb-row"><label>Curación</label><input type="number" id="sbFxHeal" value="1" min="0" style="width:60px;"></div>';
  h += '<div class="sb-row"><button class="sb-btn" id="sbApplyHeal" style="flex:1;">💚 Curar</button><button class="sb-btn warn" id="sbApplyHealAll" style="flex:1;">💚 A todos</button></div>';
  h += '<div class="sb-row"><label>Escudo</label><input type="number" id="sbFxShield" value="1" min="0" style="width:60px;"><input type="text" id="sbFxShieldSrc" value="sandbox" style="flex:1;padding:0.3rem 0.5rem;background:rgba(0,0,0,0.4);border:1px solid rgba(92,179,255,0.3);border-radius:8px;color:#fff;font-family:inherit;font-size:0.78rem;"></div>';
  h += '<div class="sb-row"><button class="sb-btn" id="sbApplyShield" style="flex:1;">🛡️ Dar escudo</button><button class="sb-btn danger" id="sbClearShields" style="flex:1;">Vaciar escudos</button></div>';
  h += '</div>';

  h += '<div class="sb-section"><div class="sb-section-title">Estados / Marcas</div>';
  h += '<div class="sb-row"><label>Objetivo</label>' + sbTargetSelect(null, 'sbFxTarget2') + '</div>';
  h += '<div class="sb-row"><label>Estado</label><select id="sbFxState" style="flex:1;">' + SB_STATE_KEYS.map(function(k){ return '<option value="' + k + '">' + k + '</option>'; }).join('') + '</select></div>';
  h += '<div class="sb-row"><button class="sb-btn" id="sbFxStateOn">✅ Activar</button><button class="sb-btn danger" id="sbFxStateOff">❌ Desactivar</button></div>';
  h += '<div class="sb-row"><label>Marca</label><select id="sbFxMark" style="flex:1;">' + CONSONANCE_ORDER.map(function(el){ return '<option value="' + el + '">' + ELEMENT_EMOJI[el] + ' ' + ELEMENT_NAMES[el] + '</option>'; }).join('') + '</select></div>';
  h += '<div class="sb-row"><button class="sb-btn" id="sbFxMarkAdd">🏷️ Aplicar</button><button class="sb-btn danger" id="sbFxMarkRemove">❌ Quitar</button></div>';
  h += '</div>';

  h += '<div class="sb-section"><div class="sb-section-title">Resonancias</div>';
  h += '<div class="sb-row"><label>A</label><select id="sbResA" style="flex:1;">' + CONSONANCE_ORDER.map(function(el){ return '<option value="' + el + '">' + ELEMENT_EMOJI[el] + ' ' + ELEMENT_NAMES[el] + '</option>'; }).join('') + '</select></div>';
  h += '<div class="sb-row"><label>B</label><select id="sbResB" style="flex:1;">' + CONSONANCE_ORDER.map(function(el){ return '<option value="' + el + '">' + ELEMENT_EMOJI[el] + ' ' + ELEMENT_NAMES[el] + '</option>'; }).join('') + '</select></div>';
  h += '<div class="sb-row"><button class="sb-btn" id="sbForceResonance" style="width:100%;">🔮 Disparar resonancia</button></div>';
  h += '</div>';

  h += '<div class="sb-section"><div class="sb-section-title">Probar carta</div>';
  h += '<div class="sb-row"><select id="sbTestCard" style="flex:1;font-size:0.7rem;"><option value="">— Elegir carta —</option>' + SB_CARD_IDS.map(function(id){ var c = CARD_DB[id]; return '<option value="' + id + '">' + c.emoji + ' ' + c.name + '</option>'; }).join('') + '</select><button class="sb-btn" id="sbTestCardBtn">▶️</button></div>';
  h += '<div class="sb-row" style="font-size:0.65rem;color:var(--muted);font-style:italic;">Aplica el efecto sin gastar dados. Usa el turno actual para determinar el lado.</div>';
  h += '</div>';

  return h;
}

/* ─── EVENTOS ─── */
function sbBindEvents() {
  var body = document.getElementById('sandboxBody');
  if (!body || !combatState) return;

  function getCs() { return combatState[sandboxCharSide].characters[sandboxCharIdx]; }
  function refresh() { renderCombat(); renderSandboxPanel(); }

  body.querySelectorAll('[data-sb-side]').forEach(function(el){
    el.addEventListener('click', function(){ sandboxCharSide = el.dataset.sbSide; sandboxCharIdx = 0; renderSandboxPanel(); });
  });
  body.querySelectorAll('[data-sb-char-idx]').forEach(function(el){
    el.addEventListener('click', function(){ sandboxCharIdx = parseInt(el.dataset.sbCharIdx, 10); renderSandboxPanel(); });
  });

  // ── Personaje: HP / energía / acciones ──
  var hpEl = document.getElementById('sbHp');
  if (hpEl) hpEl.addEventListener('change', function(){ getCs().hp = Math.max(0, Math.min(getCs().maxHp, parseInt(hpEl.value, 10) || 0)); refresh(); });
  var maxHpEl = document.getElementById('sbMaxHp');
  if (maxHpEl) maxHpEl.addEventListener('change', function(){ getCs().maxHp = Math.max(1, parseInt(maxHpEl.value, 10) || 1); if (getCs().hp > getCs().maxHp) getCs().hp = getCs().maxHp; refresh(); });
  var enEl = document.getElementById('sbEnergy');
  if (enEl) enEl.addEventListener('change', function(){ getCs().energy = Math.max(0, Math.min(getCs().maxEnergy, parseInt(enEl.value, 10) || 0)); refresh(); });
  var maxEnEl = document.getElementById('sbMaxEnergy');
  if (maxEnEl) maxEnEl.addEventListener('change', function(){ getCs().maxEnergy = Math.max(1, parseInt(maxEnEl.value, 10) || 1); if (getCs().energy > getCs().maxEnergy) getCs().energy = getCs().maxEnergy; refresh(); });
  var activeBtn = document.getElementById('sbSetActiveBtn');
  if (activeBtn) activeBtn.addEventListener('click', function(){ combatState[sandboxCharSide].activeIndex = sandboxCharIdx; refresh(); });
  var killBtn = document.getElementById('sbKillChar');
  if (killBtn) killBtn.addEventListener('click', function(){ getCs().hp = 0; handleDeath(sandboxCharSide, sandboxCharIdx); refresh(); });
  var healBtn = document.getElementById('sbFullHeal');
  if (healBtn) healBtn.addEventListener('click', function(){ getCs().hp = getCs().maxHp; getCs().dead = false; refresh(); });

  // ── Escudos ──
  body.querySelectorAll('[data-sb-rm-shield]').forEach(function(el){
    el.addEventListener('click', function(){ if (getCs().shields) getCs().shields.splice(parseInt(el.dataset.sbRmShield, 10), 1); refresh(); });
  });
  var addShieldBtn = document.getElementById('sbAddShield');
  if (addShieldBtn) addShieldBtn.addEventListener('click', function(){
    var amt = parseInt(document.getElementById('sbShieldAmt').value, 10) || 1;
    var src = document.getElementById('sbShieldSrc').value || 'sandbox';
    addOrRefreshShield(getCs(), src, amt); refresh();
  });
  var shieldClearBtn = document.getElementById('sbShieldClear');
  if (shieldClearBtn) shieldClearBtn.addEventListener('click', function(){ getCs().shields = []; refresh(); });

  // ── Estados y numéricos ──
  body.querySelectorAll('[data-sb-state]').forEach(function(el){
    el.addEventListener('change', function(){ csSetState(getCs(), el.dataset.sbState, el.checked); refresh(); });
  });
  body.querySelectorAll('[data-sb-state-num]').forEach(function(el){
    el.addEventListener('change', function(){ csSetState(getCs(), el.dataset.sbStateNum, Math.max(0, parseInt(el.value, 10) || 0)); refresh(); });
  });
  var manuelEl = document.getElementById('sbManuelStacks');
  if (manuelEl) manuelEl.addEventListener('change', function(){ getCs().manuelStacks = Math.max(0, parseInt(manuelEl.value, 10) || 0); refresh(); });

  // ── Marcas ──
  body.querySelectorAll('[data-sb-mark]').forEach(function(el){
    el.addEventListener('change', function(){
      if (el.checked) { if (!getCs().marks) getCs().marks = {}; getCs().marks[el.dataset.sbMark] = true; }
      else { csRemoveMark(getCs(), el.dataset.sbMark); }
      refresh();
    });
  });

  // ── Bonos numéricos / booleanos ──
  var numMap = { sbPendingBuff:'pendingBuff', sbCardAtkBonus:'cardNextAttackBonus', sbCardDisc:'cardNextAbilityDiscount', sbCardMarkBonus:'cardMarkBonus' };
  Object.keys(numMap).forEach(function(id){
    var el = document.getElementById(id);
    if (el) el.addEventListener('change', function(){ getCs()[numMap[id]] = Math.max(0, parseInt(el.value, 10) || 0); refresh(); });
  });
  var boolMap = { sbCardPierce:'cardNextAttackPiercing', sbCardDouble:'cardNextAttackDouble', sbCardFree:'cardNextAbilityFree' };
  Object.keys(boolMap).forEach(function(id){
    var el = document.getElementById(id);
    if (el) el.addEventListener('change', function(){
      getCs()[boolMap[id]] = el.checked;
      refresh();
    });
  });

  // ✅ EX en Sandbox: activa/desactiva EX por personaje y sincroniza flags
  var exChk = document.getElementById('sbExActive');
  if (exChk) exChk.addEventListener('change', function(){
    var cs = getCs();
    cs.exActive = exChk.checked;

    // Mantener exCharId coherente (aunque el Sandbox permita varias EX,
    // esta propiedad se usa como "fallback" en algunos sitios)
    if (!combatState.exCharId) combatState.exCharId = { player: null, bot: null };
    if (exChk.checked) {
      combatState.exCharId[sandboxCharSide] = cs.id;
      combatState.exCombatEnabled = true;
    } else if (combatState.exCharId[sandboxCharSide] === cs.id) {
      combatState.exCharId[sandboxCharSide] = null;
    }

    // Neón: la EX cambia su HP máximo entre 6 y 8
    if (cs.id === 'neon') {
      var targetMax = exChk.checked ? 8 : 6;
      var diff = targetMax - cs.maxHp;
      cs.maxHp = targetMax;
      if (diff > 0) cs.hp = Math.min(cs.maxHp, cs.hp + diff);
      else cs.hp = Math.min(cs.hp, cs.maxHp);
    }

    logCombat('🌟 Sandbox: EX de ' + cs.character.name + ' → ' + (exChk.checked ? 'ON' : 'OFF'));
    refresh();
  });

  // ── Equipamiento ──
  body.querySelectorAll('[data-sb-rm-equip]').forEach(function(el){
    el.addEventListener('click', function(){ if (getCs().equipment) getCs().equipment.splice(parseInt(el.dataset.sbRmEquip, 10), 1); refresh(); });
  });
  var addEquipBtn = document.getElementById('sbAddEquipBtn');
  if (addEquipBtn) addEquipBtn.addEventListener('click', function(){
    var sel = document.getElementById('sbAddEquipSel');
    if (!sel.value) return;
    if (!getCs().equipment) getCs().equipment = [];
    if (getCs().equipment.length >= 2) getCs().equipment.shift();
    getCs().equipment.push(sel.value);
    refresh();
  });
  var clearEquipBtn = document.getElementById('sbClearEquip');
  if (clearEquipBtn) clearEquipBtn.addEventListener('click', function(){ getCs().equipment = []; refresh(); });
  var paintEl = document.getElementById('sbPaint');
  if (paintEl) paintEl.addEventListener('change', function(){ getCs().paintEquipped = paintEl.value || null; refresh(); });

  // ── GLOBAL: ronda / turno / fase / fin ──
  var rEl = document.getElementById('sbRound');
  if (rEl) rEl.addEventListener('change', function(){ combatState.round = Math.max(1, parseInt(rEl.value, 10) || 1); refresh(); });
  var tEl = document.getElementById('sbTurn');
  if (tEl) tEl.addEventListener('change', function(){ combatState.turn = tEl.value; refresh(); });
  var pEl = document.getElementById('sbPhase');
  if (pEl) pEl.addEventListener('change', function(){ combatState.phase = pEl.value; refresh(); });
  var pd = document.getElementById('sbPlayerDone');
  if (pd) pd.addEventListener('change', function(){ combatState.playerDone = pd.checked; refresh(); });
  var bd = document.getElementById('sbBotDone');
  if (bd) bd.addEventListener('change', function(){ combatState.botDone = bd.checked; refresh(); });

  var nextRoundBtn = document.getElementById('sbNextRoundBtn');
  if (nextRoundBtn) nextRoundBtn.addEventListener('click', function(){ try { endRound(); } catch (e) { console.error(e); } });
  var forceEndRoundBtn = document.getElementById('sbForceEndRoundBtn');
  if (forceEndRoundBtn) forceEndRoundBtn.addEventListener('click', function(){ try { endRound(); } catch (e) { console.error(e); } });

  var winP = document.getElementById('sbWinPlayerBtn');
  if (winP) winP.addEventListener('click', function(){ endCombat('player'); });
  var winB = document.getElementById('sbWinBotBtn');
  if (winB) winB.addEventListener('click', function(){ endCombat('bot'); });

  // ── GLOBAL: consonancia forzada ──
  body.querySelectorAll('[data-sb-cons]').forEach(function(sel){
    sel.addEventListener('change', function(){
      var sk = sel.dataset.sbCons;
      var v = sel.value;
      if (v === 'diverse') combatState[sk].consonance = { type:'diverse', level:3 };
      else combatState[sk].consonance = { type:'single', element:v, level:3 };
      refresh();
    });
  });

  // ── GLOBAL: contadores del lado ──
  body.querySelectorAll('[data-sb-snum]').forEach(function(el){
    el.addEventListener('change', function(){
      var parts = el.dataset.sbSnum.split(':');
      combatState[parts[0]][parts[1]] = Math.max(0, parseInt(el.value, 10) || 0);
      refresh();
    });
  });
  body.querySelectorAll('[data-sb-sbool]').forEach(function(el){
    el.addEventListener('change', function(){
      var parts = el.dataset.sbSbool.split(':');
      combatState[parts[0]][parts[1]] = el.checked;
      refresh();
    });
  });
  body.querySelectorAll('[data-sb-alter-amt]').forEach(function(el){
    el.addEventListener('change', function(){
      var sk = el.dataset.sbAlterAmt;
      if (!combatState[sk].alterUltBuff) combatState[sk].alterUltBuff = { amount:0, roundsLeft:0 };
      combatState[sk].alterUltBuff.amount = Math.max(0, parseInt(el.value, 10) || 0);
      refresh();
    });
  });
  body.querySelectorAll('[data-sb-alter-rnd]').forEach(function(el){
    el.addEventListener('change', function(){
      var sk = el.dataset.sbAlterRnd;
      if (!combatState[sk].alterUltBuff) combatState[sk].alterUltBuff = { amount:0, roundsLeft:0 };
      combatState[sk].alterUltBuff.roundsLeft = Math.max(0, parseInt(el.value, 10) || 0);
      refresh();
    });
  });

  var exE = document.getElementById('sbExEnabled');
  if (exE) exE.addEventListener('change', function(){ combatState.exCombatEnabled = exE.checked; refresh(); });
  var endC = document.getElementById('sbEndCombatBtn');
  if (endC) endC.addEventListener('click', function(){ closeSandboxPanel(); endCombat(combatState.winner || 'player'); });

  // ── DADOS ──
  body.querySelectorAll('[data-sb-die-type]').forEach(function(sel){
    sel.addEventListener('change', function(){
      var parts = sel.dataset.sbDieType.split(':');
      var d = combatState[parts[0]].dice[parseInt(parts[1], 10)];
      if (d) { d.type = sel.value; refresh(); }
    });
  });
  body.querySelectorAll('[data-sb-rm-die]').forEach(function(el){
    el.addEventListener('click', function(){
      var parts = el.dataset.sbRmDie.split(':');
      combatState[parts[0]].dice.splice(parseInt(parts[1], 10), 1);
      refresh();
    });
  });
  body.querySelectorAll('[data-sb-add-die-btn]').forEach(function(el){
    el.addEventListener('click', function(){
      var sk = el.dataset.sbAddDieBtn;
      var sel = document.querySelector('[data-sb-add-die-sel="' + sk + '"]');
      var cnt = parseInt(document.querySelector('[data-sb-add-die-count="' + sk + '"]').value, 10) || 1;
      for (var i = 0; i < cnt; i++) combatState[sk].dice.push({ type: sel.value, id: uid(), justAdded: true });
      refresh();
    });
  });
  body.querySelectorAll('[data-sb-add-specific]').forEach(function(el){
    el.addEventListener('click', function(){
      var parts = el.dataset.sbAddSpecific.split(':');
      combatState[parts[0]].dice.push({ type: parts[1], id: uid(), justAdded: true });
      refresh();
    });
  });
  body.querySelectorAll('[data-sb-roll-dice]').forEach(function(el){
    el.addEventListener('click', function(){ combatState[el.dataset.sbRollDice].dice = rollCombatDice(8); refresh(); });
  });
  body.querySelectorAll('[data-sb-clear-dice]').forEach(function(el){
    el.addEventListener('click', function(){ combatState[el.dataset.sbClearDice].dice = []; refresh(); });
  });

  // ── CARTAS ──
  body.querySelectorAll('[data-sb-rm-hand]').forEach(function(el){
    el.addEventListener('click', function(){
      var parts = el.dataset.sbRmHand.split(':');
      combatState[parts[0]].hand.splice(parseInt(parts[1], 10), 1);
      refresh();
    });
  });
  body.querySelectorAll('[data-sb-add-card-btn]').forEach(function(el){
    el.addEventListener('click', function(){
      var sk = el.dataset.sbAddCardBtn;
      var sel = document.querySelector('[data-sb-add-card-sel="' + sk + '"]');
      if (!sel.value) return;
      var cnt = parseInt(document.querySelector('[data-sb-add-card-count="' + sk + '"]').value, 10) || 1;
      for (var i = 0; i < cnt; i++) combatState[sk].hand.push(sel.value);
      refresh();
    });
  });
  body.querySelectorAll('[data-sb-draw]').forEach(function(el){
    el.addEventListener('click', function(){ drawFromDeck(el.dataset.sbDraw); refresh(); });
  });
  body.querySelectorAll('[data-sb-draw-n]').forEach(function(el){
    el.addEventListener('click', function(){ for (var i = 0; i < 5; i++) drawFromDeck(el.dataset.sbDrawN); refresh(); });
  });
  body.querySelectorAll('[data-sb-clear-hand]').forEach(function(el){
    el.addEventListener('click', function(){ combatState[el.dataset.sbClearHand].hand = []; refresh(); });
  });
  body.querySelectorAll('[data-sb-reshuffle]').forEach(function(el){
    el.addEventListener('click', function(){
      var side = combatState[el.dataset.sbReshuffle];
      if (!side.discardPile) side.discardPile = [];
      side.deck = side.deck.concat(side.discardPile);
      side.deck = shuffleArray(side.deck);
      side.discardPile = [];
      refresh();
    });
  });

  // ── APOYOS ──
  body.querySelectorAll('[data-sb-rm-support]').forEach(function(el){
    el.addEventListener('click', function(){
      var parts = el.dataset.sbRmSupport.split(':');
      combatState[parts[0]].supports[parseInt(parts[1], 10)] = null;
      refresh();
    });
  });
  body.querySelectorAll('[data-sb-add-support-btn]').forEach(function(el){
    el.addEventListener('click', function(){
      var sk = el.dataset.sbAddSupportBtn;
      var sel = document.querySelector('[data-sb-add-support-sel="' + sk + '"]');
      if (!sel.value) return;
      var side = combatState[sk];
      if (!side.supports) side.supports = [null,null,null,null];
      var empty = side.supports.indexOf(null);
      if (empty === -1) empty = 0;
      var card = CARD_DB[sel.value];
      side.supports[empty] = { cardId: sel.value, duration: card.duration || 2 };
      refresh();
    });
  });

  // ── FX: daño / curación / escudo ──
  function splitTarget(sel) { var p = sel.value.split(':'); return { sk: p[0], idx: parseInt(p[1], 10) }; }

  var apD = document.getElementById('sbApplyDmg');
  if (apD) apD.addEventListener('click', function(){
    var t = splitTarget(document.getElementById('sbFxTarget'));
    var dmg = parseInt(document.getElementById('sbFxDmg').value, 10) || 0;
    var pierce = document.getElementById('sbFxPierce').checked;
    var s = combatState[t.sk];
    dealDamageToChar(s.characters[t.idx], dmg, { piercing: pierce, targetSide: s, targetSideKey: t.sk, targetIdx: t.idx });
    refresh();
  });
  var apDAll = document.getElementById('sbApplyDmgAll');
  if (apDAll) apDAll.addEventListener('click', function(){
    var t = splitTarget(document.getElementById('sbFxTarget'));
    var dmg = parseInt(document.getElementById('sbFxDmg').value, 10) || 0;
    var pierce = document.getElementById('sbFxPierce').checked;
    var enemySk = t.sk === 'player' ? 'bot' : 'player';
    var s = combatState[enemySk];
    s.characters.forEach(function(c, i){ if (!c.dead) dealDamageToChar(c, dmg, { piercing: pierce, targetSide: s, targetSideKey: enemySk, targetIdx: i }); });
    refresh();
  });

  var apH = document.getElementById('sbApplyHeal');
  if (apH) apH.addEventListener('click', function(){
    var t = splitTarget(document.getElementById('sbFxTarget'));
    var amt = parseInt(document.getElementById('sbFxHeal').value, 10) || 0;
    healChar(combatState[t.sk].characters[t.idx], amt);
    refresh();
  });
  var apHAll = document.getElementById('sbApplyHealAll');
  if (apHAll) apHAll.addEventListener('click', function(){
    var t = splitTarget(document.getElementById('sbFxTarget'));
    var amt = parseInt(document.getElementById('sbFxHeal').value, 10) || 0;
    var s = combatState[t.sk];
    s.characters.forEach(function(c){ if (!c.dead) healChar(c, amt); });
    refresh();
  });

  var apS = document.getElementById('sbApplyShield');
  if (apS) apS.addEventListener('click', function(){
    var t = splitTarget(document.getElementById('sbFxTarget'));
    var amt = parseInt(document.getElementById('sbFxShield').value, 10) || 0;
    var src = document.getElementById('sbFxShieldSrc').value || 'sandbox';
    addOrRefreshShield(combatState[t.sk].characters[t.idx], src, amt);
    refresh();
  });
  var clearShBtn = document.getElementById('sbClearShields');
  if (clearShBtn) clearShBtn.addEventListener('click', function(){
    var t = splitTarget(document.getElementById('sbFxTarget'));
    combatState[t.sk].characters[t.idx].shields = [];
    refresh();
  });

  // ── FX: estado / marca ──
  var stateOn = document.getElementById('sbFxStateOn');
  if (stateOn) stateOn.addEventListener('click', function(){
    var t = splitTarget(document.getElementById('sbFxTarget2'));
    var k = document.getElementById('sbFxState').value;
    csSetState(combatState[t.sk].characters[t.idx], k, true);
    refresh();
  });
  var stateOff = document.getElementById('sbFxStateOff');
  if (stateOff) stateOff.addEventListener('click', function(){
    var t = splitTarget(document.getElementById('sbFxTarget2'));
    var k = document.getElementById('sbFxState').value;
    csSetState(combatState[t.sk].characters[t.idx], k, false);
    refresh();
  });
  var markAdd = document.getElementById('sbFxMarkAdd');
  if (markAdd) markAdd.addEventListener('click', function(){
    var t = splitTarget(document.getElementById('sbFxTarget2'));
    var el = document.getElementById('sbFxMark').value;
    if (!combatState[t.sk].characters[t.idx].marks) combatState[t.sk].characters[t.idx].marks = {};
    combatState[t.sk].characters[t.idx].marks[el] = true;
    refresh();
  });
  var markRem = document.getElementById('sbFxMarkRemove');
  if (markRem) markRem.addEventListener('click', function(){
    var t = splitTarget(document.getElementById('sbFxTarget2'));
    var el = document.getElementById('sbFxMark').value;
    csRemoveMark(combatState[t.sk].characters[t.idx], el);
    refresh();
  });

  // ── FX: resonancia manual ──
  var fRes = document.getElementById('sbForceResonance');
  if (fRes) fRes.addEventListener('click', function(){
    var a = document.getElementById('sbResA').value, b = document.getElementById('sbResB').value;
    applyResonanceEffect(a, b, 'player', 'bot');
    refresh();
  });

  // ── FX: probar carta ──
  var testBtn = document.getElementById('sbTestCardBtn');
  if (testBtn) testBtn.addEventListener('click', function(){
    var sel = document.getElementById('sbTestCard');
    if (!sel.value) return;
    var card = CARD_DB[sel.value] || PAINT_CARDS[sel.value];
    if (!card) return;
    try { applyCardEffect(card); } catch (e) { console.error(e); }
    refresh();
  });

  var tmSel = document.getElementById('sbTurnMode');
  if (tmSel) tmSel.addEventListener('change', function(){
    var newMode = tmSel.value;
    var wasBot  = sandboxTurnMode === 'bot';
    var nowBot  = newMode === 'bot';

    sandboxTurnMode = newMode;

    if (combatState) {
      combatState.pvp = !nowBot;

      // ── A "solo usuario": forzar el turno al jugador y limpiar flags de fin
      if (newMode === 'player-only') {
        combatState.turn       = 'player';
        combatState.playerDone = false;
        combatState.botDone    = false;
      }

      // ── De dos-usuarios → bot: si es turno del rival, que el bot lo juegue
      if (nowBot && !wasBot && combatState.turn === 'bot'
          && !combatState.botDone && combatState.phase === 'playing') {
        setTimeout(botTurn, 800);
      }
    }

    renderCombat();
    renderSandboxPanel();
  });
}

var initFns = [
  ['renderPhilosophies', renderPhilosophies],
  ['renderConsonancias', renderConsonancias],
  ['renderCharFilter', renderCharFilter],
  ['renderResonances', renderResonances],
  ['renderDiceSimulator', renderDiceSimulator],
  ['applyFilters', applyFilters],
  ['addInfoButtons', addInfoButtons],
  ['setupCardClicks', setupCardClicks],
  ['setupCharSort', setupCharSort],
  ['renderTeamPanel', renderTeamPanel],
  ['renderCardFilter', renderCardFilter],
  ['renderDeckGrid', renderDeckGrid],
  ['setupDamageCalculator', setupDamageCalculator],
  ['renderTemplateSlots', renderTemplateSlots],
  ['initPatches', initPatches],
  ['initSandbox', initSandbox]
];
initFns.forEach(function(p){ try { p[1](); } catch (e) { console.error('Init error in ' + p[0] + ':', e); } });

// En initSandbox:
function initSandbox() {
  // Toggle y cierre del panel
  document.addEventListener('click', function(e){
    var tgl = e.target.closest('#sandboxToggleBtn');
    if (tgl) {
      e.preventDefault();
      e.stopPropagation();
      if (sandboxOpen) closeSandboxPanel(); else openSandboxPanel();
      return;
    }
    var cl = e.target.closest('#sandboxCloseBtn');
    if (cl) {
      e.preventDefault();
      e.stopPropagation();
      closeSandboxPanel();
    }
  });

  // ✅ NUEVO: click en las pestañas del panel
  document.querySelectorAll('.sandbox-tab').forEach(function(tab){
    tab.addEventListener('click', function(e){
      e.preventDefault();
      document.querySelectorAll('.sandbox-tab').forEach(function(t){ t.classList.remove('active'); });
      tab.classList.add('active');
      sandboxTab = tab.dataset.sbTab || 'char';
      if (sandboxOpen) renderSandboxPanel();
    });
  });
}

// Delegación permanente para el botón 👁️ de las plantillas
(function setupTemplateInfoDelegation(){
  var container = document.getElementById('templateSlots');
  if (!container) return;
  container.addEventListener('click', function(e){
    var btn = e.target.closest('.template-info-btn');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    var s = parseInt(btn.dataset.slot, 10);
    if (isNaN(s)) return;
    var t = getTemplate(s);
    if (t) showTemplatePreview(t, s, null);
  });
})();

setTimeout(function(){ var rv = document.querySelectorAll('.reveal'); for (var i = 0; i < rv.length; i++) if (!rv[i].classList.contains('visible')) rv[i].classList.add('visible'); }, 2000);

console.log('Azaria TCG — init completado');

var canvas = document.getElementById('stars'), ctx = canvas ? canvas.getContext('2d') : null;
var stars = [], W, H;
function resizeBg(){ if (!canvas) return; W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; stars = []; for (var i = 0; i < 160; i++) stars.push({ x:Math.random()*W, y:Math.random()*H, r:Math.random()*1.4+0.3, vx:(Math.random()-0.5)*0.12, vy:(Math.random()-0.5)*0.12, a:Math.random()*0.5+0.2 }); }
function drawBg(){ if (!ctx) return; ctx.clearRect(0,0,W,H); for (var i = 0; i < stars.length; i++){ var s = stars[i]; s.x += s.vx; s.y += s.vy; if (s.x<0) s.x=W; if (s.x>W) s.x=0; if (s.y<0) s.y=H; if (s.y>H) s.y=0; ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fillStyle='rgba(240,220,180,'+s.a+')'; ctx.fill(); } for (var p=0;p<stars.length;p++) for (var q=p+1;q<stars.length;q++){ var dx=stars[p].x-stars[q].x, dy=stars[p].y-stars[q].y, d=Math.sqrt(dx*dx+dy*dy); if (d<120){ ctx.beginPath(); ctx.moveTo(stars[p].x,stars[p].y); ctx.lineTo(stars[q].x,stars[q].y); ctx.strokeStyle='rgba(240,200,96,'+((1-d/120)*0.12)+')'; ctx.lineWidth=0.5; ctx.stroke(); } } requestAnimationFrame(drawBg); }
window.addEventListener('resize', resizeBg); resizeBg(); drawBg();

var observer = new IntersectionObserver(function(entries){ entries.forEach(function(e, i){ if (e.isIntersecting) { setTimeout(function(){ e.target.classList.add('visible'); }, i * 60); observer.unobserve(e.target); } }); }, { threshold:0.1 });
document.querySelectorAll('.reveal').forEach(function(el){ observer.observe(el); });

var counterObs = new IntersectionObserver(function(entries){
  entries.forEach(function(entry){ if (!entry.isIntersecting) return; var el = entry.target, tgt = +el.dataset.target, sfx = el.dataset.suffix || '', start = performance.now();
    function up(now){ var p = Math.min((now - start) / 1800, 1), ez = 1 - Math.pow(1 - p, 3); el.textContent = Math.floor(ez * tgt).toLocaleString('es-ES') + sfx; if (p < 1) requestAnimationFrame(up); else el.textContent = tgt.toLocaleString('es-ES') + sfx; }
    requestAnimationFrame(up); counterObs.unobserve(el);
  });
}, { threshold:0.5 });
document.querySelectorAll('.num').forEach(function(n){ counterObs.observe(n); });

var heroT = document.querySelector('.hero h1');
if (heroT) window.addEventListener('mousemove', function(e){ var x = (e.clientX / window.innerWidth - 0.5) * 16, y = (e.clientY / window.innerHeight - 0.5) * 16; heroT.style.transform = 'translate(' + x + 'px, ' + y + 'px)'; });
