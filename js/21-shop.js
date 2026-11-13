/* ═══════════════════════════════════════════════════════════════════
   TIENDA / INVENTARIO
   ═══════════════════════════════════════════════════════════════════ */

var SHOP_TABS = [
  { id: 'characters', label: '🎭 Personajes' },
  { id: 'cards',      label: '🎴 Cartas de Mazo' },
  { id: 'skins',      label: '✨ Skins' },
  { id: 'frames',     label: '🖼️ Marcos' },
  { id: 'cardbacks',  label: '🃏 Dorsos' },
  { id: 'themes',     label: '🎨 Temas' }
];
var SHOP_DEFAULT_PRICE = 100;
var SHOP_ACTIVE_TAB = 'characters';

function getShopItemsForTab(tab) {
  if (tab === 'characters') {
    return Object.keys(CHARACTERS).filter(function(id){
      return id !== 'hunger' && id !== 'exmaria';
    }).map(function(id){ return { id: id, category: 'characters', kind: 'character', data: CHARACTERS[id] }; });
  }
  if (tab === 'cards') {
    if (typeof CARD_DB === 'undefined') return [];
    return Object.keys(CARD_DB).filter(function(id){
      var c = CARD_DB[id];
      // ✅ Excluir cartas generadas/especiales que no son comprables
      if (c._opalGear || c._erikxdGear || c._davidGear) return false;
      return true;
    }).map(function(id){
      return { id: id, category: 'cards', kind: 'card', data: CARD_DB[id] };
    });
  }
  if (tab === 'themes') {
    if (typeof THEMES === 'undefined') return [];
    return Object.keys(THEMES).filter(function(id){ return !THEMES[id].isDefault; }).map(function(id){
      return { id: id, category: 'themes', kind: 'theme', data: THEMES[id] };
    });
  }
  return [];
}

function openShop() {
  var m = document.getElementById('shopModal'); if (!m) return;
  m.classList.add('open');
  document.body.classList.add('shop-open');
  document.body.style.overflow = 'hidden';
  renderShop();
}
function closeShop() {
  var m = document.getElementById('shopModal'); if (!m) return;
  m.classList.remove('open');
  document.body.classList.remove('shop-open');
  document.body.style.overflow = '';
}
function renderShop() {
  renderShopMoney(); renderShopTabs(); renderShopBody();
}
function renderShopMoney() {
  var el = document.getElementById('shopMoney');
  if (el) el.textContent = playerMoney;
}
function renderShopTabs() {
  var cont = document.getElementById('shopTabs'); if (!cont) return;
  cont.innerHTML = SHOP_TABS.map(function(t){
    return '<button class="shop-tab' + (t.id === SHOP_ACTIVE_TAB ? ' active' : '') + '" data-shop-tab="' + t.id + '">' + t.label + '</button>';
  }).join('');
  cont.querySelectorAll('.shop-tab').forEach(function(btn){
    btn.addEventListener('click', function(){ SHOP_ACTIVE_TAB = btn.dataset.shopTab; renderShop(); });
  });
}
function renderShopBody() {
  var body = document.getElementById('shopBody'); if (!body) return;
  var items = getShopItemsForTab(SHOP_ACTIVE_TAB);
  if (!items.length) {
    body.innerHTML = '<div class="shop-empty"><div class="shop-empty-icon">🕸️</div><div>Aún no hay nada disponible en esta categoría.</div></div>';
    return;
  }

  var html = '';

  if (SHOP_ACTIVE_TAB === 'characters') {
    var byCat = {};
    items.forEach(function(it){
      var cat = (it.data.category || 'Otros');
      if (!byCat[cat]) byCat[cat] = [];
      byCat[cat].push(it);
    });
    CHARACTER_CATEGORIES.forEach(function(cat){
      if (byCat[cat] && byCat[cat].length) { html += renderShopGroup(cat, byCat[cat]); delete byCat[cat]; }
    });
    Object.keys(byCat).forEach(function(cat){ if (byCat[cat].length) html += renderShopGroup(cat, byCat[cat]); });
  }
  else if (SHOP_ACTIVE_TAB === 'cards') {
    var cardOrder = ['equipo', 'apoyo', 'evento', 'pintura'];
    var byCat2 = {};
    items.forEach(function(it){
      var cat = (it.data.category || 'evento');
      if (!byCat2[cat]) byCat2[cat] = [];
      byCat2[cat].push(it);
    });
    cardOrder.forEach(function(cat){
      if (byCat2[cat] && byCat2[cat].length) { html += renderShopGroup(getCardCategoryLabel(cat), byCat2[cat]); delete byCat2[cat]; }
    });
    Object.keys(byCat2).forEach(function(cat){ if (byCat2[cat].length) html += renderShopGroup(getCardCategoryLabel(cat), byCat2[cat]); });
  }
  else if (SHOP_ACTIVE_TAB === 'themes') {
    var sorted = items.slice().sort(function(a, b){
      var nA = (a.data.name || a.id).toLowerCase();
      var nB = (b.data.name || b.id).toLowerCase();
      return nA.localeCompare(nB);
    });
    html = '<div class="shop-grid">' + sorted.map(function(it){
      var un = (typeof isThemeUnlocked === 'function') ? isThemeUnlocked(it.id) : false;
      return renderShopItem(it, un);
    }).join('') + '</div>';
  }
  else {
    var sorted2 = items.slice().sort(function(a, b){
      var nA = (a.data.name || a.id).toLowerCase();
      var nB = (b.data.name || b.id).toLowerCase();
      return nA.localeCompare(nB);
    });
    html = '<div class="shop-grid">' + sorted2.map(function(it){ return renderShopItem(it, isUnlocked(it.id)); }).join('') + '</div>';
  }

  body.innerHTML = html;
  body.querySelectorAll('.shop-item').forEach(function(el){
    el.addEventListener('click', function(){ showShopItemDetail(el.dataset.shopId, el.dataset.shopCategory); });
  });
}

function getCardCategoryLabel(cat) {
  var m = (typeof CARD_CATEGORY_META !== 'undefined') ? CARD_CATEGORY_META[cat] : null;
  return m ? (m.icon + ' ' + m.label) : cat;
}

function renderShopGroup(title, items) {
  var sortByName = function(a, b) {
    var nA = (a.data.name || a.id).toLowerCase();
    var nB = (b.data.name || b.id).toLowerCase();
    return nA.localeCompare(nB);
  };
  var locked   = items.filter(function(it){ return !isUnlocked(it.id); }).sort(sortByName);
  var unlocked = items.filter(function(it){ return  isUnlocked(it.id); }).sort(sortByName);
  var sorted = locked.concat(unlocked);
  var html = '<div class="shop-group">' +
    '<div class="shop-group-title">' + title + ' <span class="shop-group-count">(' + sorted.length + ')</span></div>' +
    '<div class="shop-grid">';
  sorted.forEach(function(it){ html += renderShopItem(it, isUnlocked(it.id)); });
  html += '</div></div>';
  return html;
}

function getItemPrice(it) {
  if (it.data && typeof it.data.price === 'number') return it.data.price;
  return SHOP_DEFAULT_PRICE;
}

function renderShopItem(it, isUn) {
  var cls = 'shop-item' + (isUn ? ' unlocked' : '');
  var price = getItemPrice(it);
  var html = '<div class="' + cls + '" data-shop-id="' + it.id + '" data-shop-category="' + it.category + '">';

  if (it.kind === 'character') {
    var c = it.data;
    html += '<div class="shop-item-img">';
    if (c.img) html += '<img src="' + c.img + '" alt="' + c.name + '" onerror="this.style.display=\'none\';this.parentNode.textContent=\'' + (c.emoji||'🎭') + '\';">';
    else html += (c.emoji || '🎭');
    html += '</div>';
    html += '<div class="shop-item-name">' + (c.name || it.id) + '</div>';
    html += '<div class="shop-item-category">' + (c.category || '') + '</div>';
  } else if (it.kind === 'theme') {
    var th = it.data;
    html += '<div class="shop-item-img" style="font-size:3rem;">' + (th.emoji || '🎨') + '</div>';
    html += '<div class="shop-item-name">' + (th.name || it.id) + '</div>';
    html += '<div class="shop-item-category">Tema</div>';
  } else {
    var card = it.data;
    html += '<div class="shop-item-img" style="font-size:3rem;">' + (card.emoji || '🎴') + '</div>';
    html += '<div class="shop-item-name">' + (card.name || it.id) + '</div>';
    html += '<div class="shop-item-category">' + (card.tag || card.category || '') + '</div>';
  }

  if (isUn) html += '<div class="shop-item-status">✓ Ya lo tienes</div>';
  else html += '<div class="shop-item-price">💎 ' + price + '</div>';
  html += '</div>';
  return html;
}

function showShopItemDetail(id, category) {
  if (category === 'characters') { if (typeof openCharacter === 'function') openCharacter(id, null, { shopMode: true }); }
  else if (category === 'cards') { if (typeof showCardInfo === 'function') showCardInfo(id, { shopMode: true }); }
  else if (category === 'themes') { if (typeof showThemeDetail === 'function') showThemeDetail(id); }
}

function buyShopItem(id, category) {
  // ✅ Temas
  if (category === 'themes') {
    if (typeof THEMES === 'undefined' || !THEMES[id]) return false;
    if (typeof isThemeUnlocked === 'function' && isThemeUnlocked(id)) {
      if (typeof showTeamMissingToast === 'function') showTeamMissingToast('Ya tienes este tema.');
      return false;
    }
    var priceT = THEMES[id].price || SHOP_DEFAULT_PRICE;
    if (playerMoney < priceT) {
      if (typeof showTeamMissingToast === 'function') showTeamMissingToast('No tienes suficiente dinero (<strong>' + playerMoney + '</strong> / ' + priceT + ').');
      if (typeof playSound === 'function') playSound('error');
      return false;
    }
    if (!confirm('¿Comprar el tema "' + THEMES[id].name + '" por 💎 ' + priceT + '?')) return false;
    playerMoney -= priceT;
    if (typeof unlockTheme === 'function') unlockTheme(id);
    saveShopState();
    if (typeof playSound === 'function') playSound('confirm');
    if (typeof showTeamMissingToast === 'function') showTeamMissingToast('✅ ¡Tema "' + THEMES[id].name + '" comprado!');
    renderShop();
    var cd = document.getElementById('cardInfoDialog'); if (cd) cd.classList.remove('show');
    return true;
  }

  // ✅ Personajes / Cartas (comportamiento original)
  if (isUnlocked(id)) { if (typeof showTeamMissingToast === 'function') showTeamMissingToast('Ya tienes este artículo.'); return false; }
  if (playerMoney < SHOP_DEFAULT_PRICE) {
    if (typeof showTeamMissingToast === 'function') showTeamMissingToast('No tienes suficiente dinero (<strong>' + playerMoney + '</strong> / ' + SHOP_DEFAULT_PRICE + ').');
    if (typeof playSound === 'function') playSound('error');
    return false;
  }
  if (!confirm('¿Comprar por 💎 ' + SHOP_DEFAULT_PRICE + '?')) return false;
  playerMoney -= SHOP_DEFAULT_PRICE;
  unlockId(id); saveShopState();
  if (typeof playSound === 'function') playSound('confirm');
  if (typeof showTeamMissingToast === 'function') showTeamMissingToast('✅ ¡Comprado!');
  renderShop();
  if (typeof refreshCollectionLocks === 'function') refreshCollectionLocks();
  if (typeof closeModal === 'function') closeModal();
  var ci = document.getElementById('cardInfoDialog'); if (ci) ci.classList.remove('show');
  return true;
}

/* ═══ Códigos ═══ */
function openShopCodeModal() {
  var m = document.getElementById('shopCodeModal'); if (!m) return;
  m.classList.add('open');
  var input = document.getElementById('shopCodeInput');
  if (input) { input.value = ''; setTimeout(function(){ input.focus(); }, 100); }
}
function closeShopCodeModal() { var m = document.getElementById('shopCodeModal'); if (m) m.classList.remove('open'); }
function redeemCode(rawCode) {
  var code = String(rawCode || '').trim().toUpperCase();
  if (!code) return { ok: false, msg: 'Introduce un código.' };
  if (redeemedCodes[code]) return { ok: false, msg: 'Este código ya ha sido canjeado.' };
  if (code === 'AZARIATCG') {
    var count = 0;
    Object.keys(CHARACTERS).forEach(function(id){
      var c = CHARACTERS[id];
      if (c.category === 'Azaria') return;
      if (!unlockedIds[id]) { unlockedIds[id] = true; count++; }
    });
    if (typeof CARD_DB !== 'undefined') Object.keys(CARD_DB).forEach(function(id){
      if (!unlockedIds[id]) { unlockedIds[id] = true; count++; }
    });
    // ✅ Temas: desbloquear todos excepto el default
    if (typeof THEMES !== 'undefined') Object.keys(THEMES).forEach(function(id){
      if (THEMES[id].isDefault) return;
      if (!unlockedIds['theme_' + id]) { unlockedIds['theme_' + id] = true; count++; }
    });
    redeemedCodes[code] = true; saveShopState();
    return { ok: true, msg: 'Código AZARIATCG canjeado. Todos los personajes y cartas (excepto Azaria) y todos los temas desbloqueados.' };
  }
  if (code === 'ALAYANOEXISTE') {
    var count2 = 0;
    Object.keys(CHARACTERS).forEach(function(id){
      var c = CHARACTERS[id];
      if (c.category !== 'Azaria') return;
      if (!unlockedIds[id]) { unlockedIds[id] = true; count2++; }
    });
    redeemedCodes[code] = true; saveShopState();
    var msg2 = count2 > 0
      ? ('Código canjeado. ' + count2 + ' personaje(s) de Azaria desbloqueado(s).')
      : 'Código canjeado. (Todavía no hay personajes de Azaria en el juego.)';
    return { ok: true, msg: msg2 };
  }
  return { ok: false, msg: 'Código no válido.' };
}
function resetShopProgress() {
  var msg = '¿Resetear inventario y moneda?\n\n' +
    'Se activará el MODO PRUEBA: todo se verá bloqueado hasta que lo compres o canjees un código.\n\n' +
    'También se vaciará tu equipo y tu mazo (los personajes y cartas seleccionados dejan de estar disponibles).\n\n' +
    'Para volver al modo BETA (todo desbloqueado), ejecuta en consola:\n' +
    '  azariaBetaRestore()';
  if (!confirm(msg)) return;

  playerMoney = 0;
  unlockedIds = {};
  redeemedCodes = {};
  shopForceLocked = true;
  saveShopState();

  try {
    if (typeof team !== 'undefined') { team = []; if (typeof saveTeam === 'function') saveTeam(); }
    if (typeof deck !== 'undefined') { deck = []; if (typeof saveDeck === 'function') saveDeck(); }
  } catch (e) { console.warn('resetShopProgress: limpiando team/deck:', e); }

  renderShop();
  if (typeof renderTeamPanel === 'function') renderTeamPanel();
  if (typeof renderDeckGrid === 'function') renderDeckGrid();
  if (typeof refreshCollectionLocks === 'function') refreshCollectionLocks();
  if (typeof playSound === 'function') playSound('deselect');
  if (typeof showTeamMissingToast === 'function') {
    showTeamMissingToast('🔄 Modo prueba activado. Equipo y mazo vaciados. Usa <strong>azariaBetaRestore()</strong> en consola para volver.');
  }
}

/* ═══ Init ═══ */
function initShop() {
  var navBtn = document.getElementById('shopNavBtn');
  if (navBtn) navBtn.addEventListener('click', function(e){ e.preventDefault(); openShop(); });
  var closeBtn = document.getElementById('shopCloseBtn'); if (closeBtn) closeBtn.addEventListener('click', closeShop);
  var backdrop = document.getElementById('shopBackdrop'); if (backdrop) backdrop.addEventListener('click', closeShop);
  var redeemBtn = document.getElementById('shopRedeemBtn'); if (redeemBtn) redeemBtn.addEventListener('click', openShopCodeModal);
  var resetBtn = document.getElementById('shopResetBtn'); if (resetBtn) resetBtn.addEventListener('click', resetShopProgress);

  var codeCancel = document.getElementById('shopCodeCancel'); if (codeCancel) codeCancel.addEventListener('click', closeShopCodeModal);
  var codeAccept = document.getElementById('shopCodeAccept'); if (codeAccept) codeAccept.addEventListener('click', function(){
    var input = document.getElementById('shopCodeInput');
    var res = redeemCode(input ? input.value : '');
    if (res.ok) {
      showTeamMissingToast('✅ ' + res.msg);
      closeShopCodeModal();
      renderShop();
      if (typeof refreshCollectionLocks === 'function') refreshCollectionLocks();
      if (typeof renderDeckGrid === 'function') renderDeckGrid();
      playSound('confirm');
    }
    else { showTeamMissingToast('⚠️ ' + res.msg); playSound('error'); }
  });
  var codeBackdrop = document.getElementById('shopCodeBackdrop'); if (codeBackdrop) codeBackdrop.addEventListener('click', closeShopCodeModal);
  var codeInput = document.getElementById('shopCodeInput');
  if (codeInput) codeInput.addEventListener('keydown', function(e){ if (e.key === 'Enter') { var ab = document.getElementById('shopCodeAccept'); if (ab) ab.click(); } });

  window.redeemAlayanoexiste = function() {
    var res = redeemCode('alayanoexiste');
    console.log(res.msg);
    if (res.ok) {
      if (typeof showTeamMissingToast === 'function') showTeamMissingToast('✅ ' + res.msg);
      if (typeof renderShop === 'function') renderShop();
      if (typeof refreshCollectionLocks === 'function') refreshCollectionLocks();
      if (typeof renderDeckGrid === 'function') renderDeckGrid();
    }
    return res;
  };
  window.azariaAddMoney = function(n) {
    n = parseInt(n, 10) || 0; addMoney(n);
    console.log('💰 +' + n + ' dinero. Total: ' + playerMoney);
    if (typeof renderShopMoney === 'function') renderShopMoney();
    return playerMoney;
  };
  window.azariaBetaRestore = function() {
    shopForceLocked = false;
    saveShopState();
    if (typeof renderShop === 'function') renderShop();
    if (typeof refreshCollectionLocks === 'function') refreshCollectionLocks();
    if (typeof renderDeckGrid === 'function') renderDeckGrid();
    console.log('✅ Modo BETA restaurado: todo desbloqueado.');
  };

  if (typeof refreshCollectionLocks === 'function') refreshCollectionLocks();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initShop);
else initShop();
