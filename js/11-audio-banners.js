var audioCtx = null;
function initAudio(){ if (!audioCtx) { try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { audioCtx = null; } } if (audioCtx && audioCtx.state === 'suspended') { try { audioCtx.resume(); } catch (e) {} } }
function playSound(name) {
  if (!audioCtx) return;
  try {
    var t = audioCtx.currentTime;
    function beep(f, d, type, v, delay){ delay = delay || 0; var o = audioCtx.createOscillator(), g = audioCtx.createGain(); o.type = type||'sine'; o.frequency.value = f; o.connect(g); g.connect(audioCtx.destination); g.gain.setValueAtTime(v||0.15, t+delay); g.gain.exponentialRampToValueAtTime(0.001, t+delay+d); o.start(t+delay); o.stop(t+delay+d); }
    function sweep(f1, f2, d, type, v, delay){ delay = delay || 0; var o = audioCtx.createOscillator(), g = audioCtx.createGain(); o.type = type||'sine'; o.frequency.setValueAtTime(f1, t+delay); o.frequency.exponentialRampToValueAtTime(f2, t+delay+d); o.connect(g); g.connect(audioCtx.destination); g.gain.setValueAtTime(v||0.15, t+delay); g.gain.exponentialRampToValueAtTime(0.001, t+delay+d); o.start(t+delay); o.stop(t+delay+d); }
    switch (name) {
      case 'select': beep(1100, 0.06, 'sine', 0.08); break;
      case 'deselect': sweep(1100, 700, 0.06, 'sine', 0.06); break;
      case 'roll': sweep(200, 800, 0.15, 'sawtooth', 0.05); break;
      case 'diceReveal': beep(880, 0.06, 'triangle', 0.06); beep(1174, 0.08, 'triangle', 0.06, 0.04); beep(1568, 0.1, 'sine', 0.05, 0.08); break;
      case 'impact': beep(90, 0.15, 'square', 0.15); beep(60, 0.25, 'sine', 0.12, 0.03); break;
      case 'pierce': sweep(1400, 200, 0.2, 'sawtooth', 0.12); break;
      case 'shield': beep(300, 0.18, 'triangle', 0.12); break;
      case 'heal': beep(523, 0.1, 'sine', 0.1); beep(659, 0.1, 'sine', 0.1, 0.06); beep(784, 0.18, 'sine', 0.1, 0.12); break;
      case 'ult': beep(392, 0.15, 'square', 0.12); beep(523, 0.15, 'square', 0.12, 0.1); beep(659, 0.3, 'square', 0.14, 0.2); beep(784, 0.35, 'sawtooth', 0.1, 0.35); break;
      case 'change': sweep(800, 200, 0.22, 'sine', 0.1); break;
      case 'endRound': beep(440, 0.3, 'sine', 0.1); beep(330, 0.5, 'sine', 0.08, 0.15); break;
      case 'victory': beep(523, 0.15, 'square', 0.12); beep(659, 0.15, 'square', 0.12, 0.1); beep(784, 0.15, 'square', 0.12, 0.2); beep(1047, 0.55, 'square', 0.12, 0.35); break;
      case 'defeat': beep(392, 0.2, 'sawtooth', 0.1); beep(330, 0.2, 'sawtooth', 0.1, 0.15); beep(262, 0.55, 'sawtooth', 0.1, 0.3); break;
      case 'error': beep(140, 0.1, 'square', 0.1); break;
      case 'banner': beep(660, 0.08, 'sine', 0.06); beep(880, 0.12, 'sine', 0.07, 0.08); break;
      case 'omni': beep(660, 0.12, 'sine', 0.1); beep(880, 0.12, 'sine', 0.1, 0.08); break;
      case 'confirm': beep(523, 0.1, 'sine', 0.1); beep(659, 0.15, 'sine', 0.1, 0.08); break;
      case 'warning': beep(220, 0.1, 'square', 0.12); beep(180, 0.15, 'square', 0.12, 0.12); break;
      case 'card': beep(660, 0.06, 'sine', 0.1); beep(880, 0.1, 'sine', 0.1, 0.05); break;
      case 'draw': beep(440, 0.08, 'triangle', 0.08); beep(660, 0.1, 'triangle', 0.08, 0.08); break;
    }
  } catch (e) {}
}

var bannerToken = 0;
function showBanner(text, duration){ var b = document.getElementById('combatBanner'), t = document.getElementById('combatBannerText'); if (!b || !t) return; bannerToken++; var tok = bannerToken; t.textContent = text; b.classList.add('show'); playSound('banner'); setTimeout(function(){ if (tok === bannerToken) b.classList.remove('show'); }, duration || 1400); }
function hideBanner(){ var b = document.getElementById('combatBanner'); if (b) b.classList.remove('show'); }
function showDiversoToast(text){ var toast = document.getElementById('diversoToast'); if (!toast) return; if (text) toast.textContent = text; toast.classList.add('show'); setTimeout(function(){ toast.classList.remove('show'); }, 1800); }
function triggerVibrate(who, idx){ setTimeout(function(){ var card = document.querySelector('.combat-char-card[data-team="' + who + '"][data-index="' + idx + '"]'); if (card) { card.classList.add('vibrate', 'hit-flash'); setTimeout(function(){ card.classList.remove('vibrate', 'hit-flash'); }, 450); } }, 30); }