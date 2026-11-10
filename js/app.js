/*
 * Chistan UI controller.
 * Plain ES5-style JavaScript, no build step, no dependencies.
 */
(function () {
  'use strict';

  var C = window.Chistan;
  var I18N = window.CHISTAN_I18N;
  var TOTAL_LEVELS = C.LEVELS.length;

  var LS = {
    settings: 'chistan.settings.v1',
    progress: 'chistan.progress.v1',
    history: 'chistan.history.v1',
    game: 'chistan.game.v1.'
  };

  /* ---------- keyboards ---------- */
  var FA_SET = 'ابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهیآ';
  // Standard Persian layout, used when the person types on an English layout.
  var FA_KEYS = {
    KeyQ: 'ض', KeyW: 'ص', KeyE: 'ث', KeyR: 'ق', KeyT: 'ف', KeyY: 'غ', KeyU: 'ع', KeyI: 'ه', KeyO: 'خ', KeyP: 'ح',
    BracketLeft: 'ج', BracketRight: 'چ', KeyA: 'ش', KeyS: 'س', KeyD: 'ی', KeyF: 'ب', KeyG: 'ل', KeyH: 'ا',
    KeyJ: 'ت', KeyK: 'ن', KeyL: 'م', Semicolon: 'ک', Quote: 'گ', KeyZ: 'ظ', KeyX: 'ط', KeyC: 'ز', KeyV: 'ر',
    KeyB: 'ذ', KeyN: 'د', KeyM: 'پ', Comma: 'و'
  };
  var FA_SHIFT_KEYS = { KeyC: 'ژ', KeyH: 'آ' };
  var KB = {
    fa: ['ضصثقفغعهخحجچ', 'شسیبلاتنمکگ', 'ظطزرذدپوژآ'],
    en: ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM']
  };
  var BACKSPACE_SVG = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M9 6h10a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 18H9l-5.5-6z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12.5 9.5l5 5m0-5l-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  var CHECK_SVG = '<svg viewBox="0 0 24 24" width="15" height="15"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

  /* ---------- state ---------- */
  var state = {
    lang: 'fa', theme: 'light', view: 'home',
    level: 0, puzzle: null, entries: null, marks: null,
    sel: { r: 0, c: 0, dir: 'across' },
    elapsed: 0, hints: 0, solved: false, gaveUp: false,
    tickBase: 0, tickStart: 0, timerId: null
  };
  var cellWord = [], numAt = [], cellEls = [], clueBtns = [], hlCells = [], activeClueBtn = null;
  var saveTimer = null, toastTimer = null, winTimer = null;

  /* ---------- helpers ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function load(key, def) {
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch (e) { return def; }
  }
  function save(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* storage full or blocked */ } }
  function drop(key) { try { localStorage.removeItem(key); } catch (e) { /* ignore */ } }

  function t(key, vars) {
    var s = I18N[state.lang][key];
    if (typeof s !== 'string') return s;
    if (vars) for (var k in vars) if (Object.prototype.hasOwnProperty.call(vars, k)) s = s.split('{' + k + '}').join(vars[k]);
    return s;
  }
  function num(n) {
    var s = String(n);
    if (state.lang !== 'fa') return s;
    return s.replace(/\d/g, function (d) { return FA_DIGITS.charAt(d); });
  }
  function fmtTime(sec) {
    var s = Math.max(0, Math.floor(sec)), m = Math.floor(s / 60), r = s % 60;
    return num(m) + ':' + num(r < 10 ? '0' + r : r);
  }
  function sizeLabel(a, b) { return num(a) + '×' + num(b); }

  /* ---------- toast, busy, confirm ---------- */
  function toast(msg) {
    var n = $('#toast');
    n.textContent = msg; n.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { n.classList.remove('show'); }, 2400);
  }
  function showBusy(on) {
    $('#busy').hidden = !on;
    if (on) $('#busy-text').textContent = t('generating');
  }
  function askConfirm(msg, okText) {
    return new Promise(function (resolve) {
      var dlg = $('#dlg-confirm');
      $('#confirm-msg').textContent = msg;
      $('#confirm-ok').textContent = okText || t('ok');
      dlg.returnValue = '';
      function done() { dlg.removeEventListener('close', done); resolve(dlg.returnValue === 'ok'); }
      dlg.addEventListener('close', done);
      dlg.showModal();
    });
  }
  function anyDialogOpen() { return $$('dialog').some(function (d) { return d.open; }); }

  /* ---------- settings: theme and language ---------- */
  function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    var meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', state.theme === 'dark' ? '#0a1230' : '#e7eef0');
  }
  function saveSettings() { save(LS.settings, { lang: state.lang, theme: state.theme }); }

  function renderTiles(box, word) {
    box.innerHTML = '';
    Array.from(word).forEach(function (ch, i) {
      var s = el('span', 't', ch);
      s.style.setProperty('--i', i);
      s.style.setProperty('--tilt', (((i % 3) - 1) * 1.8) + 'deg');
      box.appendChild(s);
    });
  }

  function applyLang() {
    var dict = I18N[state.lang];
    var root = document.documentElement;
    root.lang = state.lang; root.dir = dict.dir;
    document.title = dict.docTitle;
    $$('[data-i18n]').forEach(function (n) { n.textContent = dict[n.getAttribute('data-i18n')]; });
    $$('[data-i18n-aria]').forEach(function (n) { n.setAttribute('aria-label', dict[n.getAttribute('data-i18n-aria')]); });
    $$('[data-i18n-title]').forEach(function (n) { n.setAttribute('title', dict[n.getAttribute('data-i18n-title')]); });
    $$('#seg-lang button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === state.lang)); });
    $('#help-title').textContent = dict.helpTitle;
    $('#help-close').textContent = dict.close;
    $('#confirm-cancel').textContent = dict.cancel;
    var steps = $('#help-steps'); steps.innerHTML = '';
    dict.helpSteps.forEach(function (s) { steps.appendChild(el('li', null, s)); });
    renderTiles($('#title-tiles'), dict.tileWord);
    buildKeyboard();
  }

  function setLang(lang) {
    if (lang === state.lang) return;
    if (state.view === 'game') { saveGameNow(); stopTimer(); }
    clearTimeout(winTimer);
    state.lang = lang;
    saveSettings();
    applyLang();
    showHome();
  }

  /* ---------- home ---------- */
  function levelItem(cfg, rec) {
    var li = el('li');
    var b = el('button', 'lvl'); b.type = 'button'; b.dataset.level = cfg.level;
    var done = !!(rec && rec.solved > 0);
    if (done) b.dataset.done = '1';
    b.setAttribute('aria-label', t('level') + ' ' + num(cfg.level) + ', ' + sizeLabel(cfg.size, cfg.size) + ', ' +
      t('wordsN', { n: num(cfg.words) }) + (done ? ', ' + t('solvedMark') : ''));

    var badge = el('span', 'badge'); badge.setAttribute('aria-hidden', 'true'); badge.innerHTML = CHECK_SVG;
    var n = el('span', 'lvl-n', num(cfg.level));
    var mini = el('span', 'mini'); mini.style.setProperty('--n', cfg.size); mini.setAttribute('aria-hidden', 'true');
    var meta = el('span', 'lvl-meta');
    meta.appendChild(el('b', null, sizeLabel(cfg.size, cfg.size)));
    meta.appendChild(el('span', null, t('wordsN', { n: num(cfg.words) })));
    if (rec && rec.best) meta.appendChild(el('span', null, t('bestTime', { time: fmtTime(rec.best) })));
    b.appendChild(badge); b.appendChild(n); b.appendChild(mini); b.appendChild(meta);
    li.appendChild(b);
    return li;
  }

  function renderHome() {
    var prog = load(LS.progress, {})[state.lang] || {};
    var box = $('#levels'); box.innerHTML = '';
    var solvedCount = 0;
    for (var tier = 1; tier <= 5; tier++) {
      var first = (tier - 1) * 4, last = first + 3;
      var sec = el('section', 'tier'), head = el('div', 'tier-head');
      head.appendChild(el('h3', null, t('tier' + tier)));
      head.appendChild(el('p', null, t('sizeRange', {
        a: sizeLabel(C.LEVELS[first].size, C.LEVELS[first].size),
        b: sizeLabel(C.LEVELS[last].size, C.LEVELS[last].size)
      })));
      var ol = el('ol', 'tier-levels');
      for (var i = first; i <= last; i++) {
        var cfg = C.LEVELS[i], rec = prog[cfg.level];
        if (rec && rec.solved > 0) solvedCount++;
        ol.appendChild(levelItem(cfg, rec));
      }
      sec.appendChild(head); sec.appendChild(ol); box.appendChild(sec);
    }
    $('#progress-text').textContent = solvedCount === TOTAL_LEVELS
      ? t('allDone')
      : t('progress', { n: num(solvedCount), total: num(TOTAL_LEVELS) });
  }

  function renderResume() {
    var btn = $('#resume'), g = load(LS.game + state.lang, null);
    if (!g || !g.puzzle || g.puzzle.lang !== state.lang) { btn.hidden = true; return; }
    var total = 0, filled = 0;
    g.puzzle.grid.forEach(function (row, r) {
      row.forEach(function (ch, c) { if (ch) { total++; if (g.entries[r][c]) filled++; } });
    });
    if (!filled) { btn.hidden = true; return; }
    $('#resume-title').textContent = t('resumeTitle');
    $('#resume-sub').textContent = t('resumeSub', {
      level: num(g.level), pct: num(Math.round(100 * filled / total)) + (state.lang === 'fa' ? '٪' : '%')
    });
    btn.hidden = false;
  }

  function showHome() {
    stopTimer();
    state.view = 'home';
    $('#view-game').hidden = true; $('#view-home').hidden = false;
    renderHome(); renderResume();
    window.scrollTo(0, 0);
  }

  /* ---------- starting / loading a game ---------- */
  function startLevel(level, resumeData) {
    showBusy(true);
    // let the busy overlay paint before the (short) generation work
    setTimeout(function () {
      try {
        if (resumeData) loadGame(resumeData); else newGame(level);
        showGame();
      } catch (err) {
        if (window.console) console.error(err);
        toast(t('errorGen'));
      } finally {
        showBusy(false);
      }
    }, 40);
  }

  function blankGrid(p, fill) {
    var g = [];
    for (var r = 0; r < p.rows; r++) g.push(new Array(p.cols).fill(fill));
    return g;
  }

  function newGame(level) {
    var hist = load(LS.history, {});
    var h = hist[state.lang] || { words: [], sigs: [] };
    var puzzle = C.generate({ lang: state.lang, level: level, avoid: h.words, seen: h.sigs });
    var bankSize = (window.CHISTAN_WORDS[state.lang] || []).length;
    h.words = h.words.concat(puzzle.words.map(function (w) { return w.answer; })).slice(-Math.floor(bankSize * 0.6));
    h.sigs = h.sigs.concat([puzzle.signature]).slice(-500);
    hist[state.lang] = h; save(LS.history, hist);

    state.puzzle = puzzle; state.level = level;
    state.entries = blankGrid(puzzle, ''); state.marks = blankGrid(puzzle, '');
    state.elapsed = 0; state.hints = 0; state.solved = false; state.gaveUp = false;
    var first = puzzle.words[0];
    state.sel = { r: first.r, c: first.c, dir: first.dir };
    saveGameNow();
  }

  function loadGame(g) {
    state.puzzle = g.puzzle; state.level = g.level;
    state.entries = g.entries; state.marks = g.marks;
    state.elapsed = g.elapsed || 0; state.hints = g.hints || 0;
    state.solved = false; state.gaveUp = false;
    var first = g.puzzle.words[0];
    state.sel = { r: first.r, c: first.c, dir: first.dir };
  }

  function showGame() {
    state.view = 'game';
    $('#view-home').hidden = true; $('#view-game').hidden = false;
    $('#g-level').textContent = t('level') + ' ' + num(state.level);
    $('#g-size').textContent = sizeLabel(state.puzzle.rows, state.puzzle.cols);
    $('#board').classList.remove('solved');
    buildBoard(); buildClues(); paintAll(); updateClueStates(); setToolsEnabled();
    // start on the first clue, on its first empty cell
    focusWord(state.puzzle.words[0]);
    fitBoard();
    startTimer();
    window.scrollTo(0, 0);
  }

  /* ---------- board ---------- */
  function buildBoard() {
    var p = state.puzzle, board = $('#board'), r, c;
    board.innerHTML = '';
    board.setAttribute('dir', I18N[state.lang].dir);
    board.style.setProperty('--cols', p.cols);
    cellEls = []; cellWord = []; numAt = []; hlCells = [];
    for (r = 0; r < p.rows; r++) {
      cellWord.push(new Array(p.cols).fill(null));
      numAt.push(new Array(p.cols).fill(0));
      cellEls.push(new Array(p.cols).fill(null));
    }
    p.words.forEach(function (w) {
      numAt[w.r][w.c] = w.num;
      for (var k = 0; k < w.len; k++) {
        var rr = w.r + (w.dir === 'down' ? k : 0), cc = w.c + (w.dir === 'across' ? k : 0);
        if (!cellWord[rr][cc]) cellWord[rr][cc] = { across: -1, down: -1 };
        cellWord[rr][cc][w.dir] = w.id;
      }
    });
    var frag = document.createDocumentFragment();
    for (r = 0; r < p.rows; r++) {
      for (c = 0; c < p.cols; c++) {
        if (!cellWord[r][c]) { frag.appendChild(el('div', 'void')); continue; }
        var d = el('div', 'cell');
        d.dataset.r = r; d.dataset.c = c;
        d.setAttribute('aria-label', t('cellLabel', { r: num(r + 1), c: num(c + 1) }));
        if (numAt[r][c]) d.appendChild(el('span', 'num', num(numAt[r][c])));
        d.appendChild(el('span', 'ch', ''));
        cellEls[r][c] = d; frag.appendChild(d);
      }
    }
    board.appendChild(frag);
  }

  function buildClues() {
    var p = state.puzzle;
    clueBtns = []; activeClueBtn = null;
    ['across', 'down'].forEach(function (dir) {
      var ol = $('#clues-' + dir + ' ol'); ol.innerHTML = '';
      p.words.filter(function (w) { return w.dir === dir; }).forEach(function (w) {
        var li = el('li'), b = el('button'); b.type = 'button'; b.dataset.id = w.id;
        b.appendChild(el('span', 'n', num(w.num)));
        b.appendChild(el('span', 'tx', w.clue + ' (' + t('letters', { n: num(w.len) }) + ')'));
        clueBtns[w.id] = b; li.appendChild(b); ol.appendChild(li);
      });
    });
  }

  function paint(r, c) {
    var d = cellEls[r][c]; if (!d) return;
    d.lastChild.textContent = state.entries[r][c];
    var m = state.marks[r][c];
    d.classList.toggle('wrong', m === 'wrong');
    d.classList.toggle('hint', m === 'hint');
  }
  function paintAll() {
    for (var r = 0; r < state.puzzle.rows; r++) for (var c = 0; c < state.puzzle.cols; c++) paint(r, c);
  }

  function wordCells(w) {
    var out = [];
    for (var k = 0; k < w.len; k++) out.push([w.r + (w.dir === 'down' ? k : 0), w.c + (w.dir === 'across' ? k : 0)]);
    return out;
  }
  function activeWord() {
    var cw = cellWord[state.sel.r][state.sel.c];
    var id = cw[state.sel.dir];
    if (id < 0) id = cw[state.sel.dir === 'across' ? 'down' : 'across'];
    return state.puzzle.words[id];
  }

  function paintSelection() {
    hlCells.forEach(function (d) { d.classList.remove('hl', 'sel'); });
    hlCells = [];
    var w = activeWord();
    wordCells(w).forEach(function (rc) { var d = cellEls[rc[0]][rc[1]]; d.classList.add('hl'); hlCells.push(d); });
    var sd = cellEls[state.sel.r][state.sel.c]; sd.classList.add('sel'); hlCells.push(sd);

    $('#cb-tag').textContent = num(w.num) + ' ' + t(w.dir);
    $('#cb-text').textContent = w.clue + ' (' + t('letters', { n: num(w.len) }) + ')';

    if (activeClueBtn) activeClueBtn.classList.remove('active');
    activeClueBtn = clueBtns[w.id]; activeClueBtn.classList.add('active');
    ensureVisible($('#clues'), activeClueBtn);
  }

  function ensureVisible(box, node) {
    if (box.scrollHeight <= box.clientHeight + 1) return;
    var b = box.getBoundingClientRect(), n = node.getBoundingClientRect();
    if (n.top < b.top) box.scrollTop -= (b.top - n.top) + 8;
    else if (n.bottom > b.bottom) box.scrollTop += (n.bottom - b.bottom) + 8;
  }

  function updateClueStates() {
    state.puzzle.words.forEach(function (w) {
      var full = wordCells(w).every(function (rc) { return state.entries[rc[0]][rc[1]] !== ''; });
      clueBtns[w.id].classList.toggle('filled', full);
    });
  }

  function fitBoard() {
    if (state.view !== 'game' || !state.puzzle) return;
    var wrap = $('#board-wrap'), board = $('#board'), p = state.puzzle;
    if (!wrap.clientWidth) return;
    var gap = 3, pad = 24;
    var availW = wrap.clientWidth - pad;
    var availH = Math.max(300, window.innerHeight - 340);
    var byW = Math.floor((availW - gap * (p.cols - 1)) / p.cols);
    var byH = Math.floor((availH - gap * (p.rows - 1)) / p.rows);
    var size = Math.max(30, Math.min(byW, byH, 58));
    board.style.setProperty('--cell', size + 'px');
    board.style.setProperty('--gap', gap + 'px');
  }

  /* ---------- selection and movement ---------- */
  function select(r, c, toggle) {
    var cw = cellWord[r][c]; if (!cw) return;
    var s = state.sel, other = s.dir === 'across' ? 'down' : 'across';
    if (s.r === r && s.c === c) {
      if (toggle && cw[other] >= 0) s.dir = other;
    } else if (cw[s.dir] < 0) {
      s.dir = other;
    }
    s.r = r; s.c = c;
    paintSelection();
  }

  function focusWord(w) {
    var cells = wordCells(w), pick = cells[0], i;
    for (i = 0; i < cells.length; i++) {
      if (!state.entries[cells[i][0]][cells[i][1]]) { pick = cells[i]; break; }
    }
    state.sel.dir = w.dir; state.sel.r = pick[0]; state.sel.c = pick[1];
    paintSelection();
  }

  function gotoWord(step) {
    var words = state.puzzle.words, w = activeWord();
    focusWord(words[(w.id + step + words.length) % words.length]);
  }

  function stepInWord(delta) {
    var w = activeWord(), across = state.sel.dir === 'across';
    var k = (across ? state.sel.c - w.c : state.sel.r - w.r) + delta;
    if (k < 0 || k >= w.len) return false;
    state.sel.r = w.r + (across ? 0 : k);
    state.sel.c = w.c + (across ? k : 0);
    return true;
  }

  function arrow(key) {
    var rtl = I18N[state.lang].dir === 'rtl', dr = 0, dc = 0;
    if (key === 'ArrowUp') dr = -1;
    else if (key === 'ArrowDown') dr = 1;
    else if (key === 'ArrowLeft') dc = rtl ? 1 : -1;
    else dc = rtl ? -1 : 1;
    var r = state.sel.r + dr, c = state.sel.c + dc, p = state.puzzle;
    while (r >= 0 && c >= 0 && r < p.rows && c < p.cols && !cellWord[r][c]) { r += dr; c += dc; }
    if (r < 0 || c < 0 || r >= p.rows || c >= p.cols) return;
    var want = dr !== 0 ? 'down' : 'across';
    if (cellWord[r][c][want] >= 0) state.sel.dir = want;
    select(r, c, false);
  }

  /* ---------- editing ---------- */
  function setEntry(r, c, v) {
    state.entries[r][c] = v; state.marks[r][c] = '';
    paint(r, c);
  }
  function afterEdit() {
    updateClueStates(); paintSelection(); saveGameSoon(); checkSolved();
  }

  function typeChar(ch) {
    if (state.solved || state.view !== 'game') return;
    var r = state.sel.r, c = state.sel.c;
    if (state.marks[r][c] !== 'hint') setEntry(r, c, ch);
    stepInWord(1);
    afterEdit();
  }

  function backspace() {
    if (state.solved || state.view !== 'game') return;
    var r = state.sel.r, c = state.sel.c;
    if (state.entries[r][c] && state.marks[r][c] !== 'hint') { setEntry(r, c, ''); afterEdit(); return; }
    if (stepInWord(-1)) {
      r = state.sel.r; c = state.sel.c;
      if (state.marks[r][c] !== 'hint') setEntry(r, c, '');
      afterEdit();
    }
  }

  function answerAt(r, c) { return state.puzzle.grid[r][c]; }

  function checkSolved() {
    var p = state.puzzle;
    for (var r = 0; r < p.rows; r++) for (var c = 0; c < p.cols; c++) {
      if (p.grid[r][c] && state.entries[r][c] !== p.grid[r][c]) return false;
    }
    win();
    return true;
  }

  /* ---------- tools ---------- */
  function setToolsEnabled() {
    ['#btn-check', '#btn-hint-letter', '#btn-hint-word', '#btn-clear', '#btn-solve'].forEach(function (id) {
      $(id).disabled = state.solved;
    });
  }

  function doCheck() {
    if (state.solved) return;
    var p = state.puzzle, wrong = 0, filled = 0;
    for (var r = 0; r < p.rows; r++) for (var c = 0; c < p.cols; c++) {
      var v = state.entries[r][c];
      if (!p.grid[r][c] || !v) continue;
      filled++;
      if (v !== p.grid[r][c]) { state.marks[r][c] = 'wrong'; wrong++; paint(r, c); }
    }
    if (!filled) toast(t('nothingToCheck'));
    else if (wrong) toast(t('wrongN', { n: num(wrong) }));
    else toast(t('allGood'));
    saveGameSoon();
  }

  function reveal(r, c) {
    state.entries[r][c] = answerAt(r, c); state.marks[r][c] = 'hint';
    state.hints++; paint(r, c);
  }

  function doHintLetter() {
    if (state.solved) return;
    var r = state.sel.r, c = state.sel.c;
    if (state.entries[r][c] === answerAt(r, c) && state.marks[r][c] !== 'wrong') {
      var next = wordCells(activeWord()).filter(function (rc) { return state.entries[rc[0]][rc[1]] !== answerAt(rc[0], rc[1]); })[0];
      if (!next) { toast(t('nothingToHint')); return; }
      r = next[0]; c = next[1];
    }
    reveal(r, c);
    afterEdit();
  }

  function doHintWord() {
    if (state.solved) return;
    var todo = wordCells(activeWord()).filter(function (rc) { return state.entries[rc[0]][rc[1]] !== answerAt(rc[0], rc[1]); });
    if (!todo.length) { toast(t('nothingToHint')); return; }
    todo.forEach(function (rc) { reveal(rc[0], rc[1]); });
    afterEdit();
  }

  function doClear() {
    if (state.solved) return;
    askConfirm(t('confirmClear')).then(function (ok) {
      if (!ok) return;
      state.entries = blankGrid(state.puzzle, ''); state.marks = blankGrid(state.puzzle, '');
      paintAll(); updateClueStates(); focusWord(state.puzzle.words[0]); saveGameSoon();
    });
  }

  function doSolve() {
    if (state.solved) return;
    askConfirm(t('confirmSolve')).then(function (ok) {
      if (!ok) return;
      var p = state.puzzle;
      for (var r = 0; r < p.rows; r++) for (var c = 0; c < p.cols; c++) {
        if (p.grid[r][c]) { state.entries[r][c] = p.grid[r][c]; state.marks[r][c] = 'hint'; }
      }
      state.solved = true; state.gaveUp = true;
      stopTimer(); drop(LS.game + state.lang);
      paintAll(); updateClueStates(); setToolsEnabled();
      toast(t('revealed'));
    });
  }

  function doNew() {
    var any = state.entries.some(function (row) { return row.some(Boolean); });
    var go = function () { startLevel(state.level); };
    if (!any || state.solved) { go(); return; }
    askConfirm(t('confirmNew')).then(function (ok) { if (ok) go(); });
  }

  /* ---------- timer and persistence ---------- */
  function tick() {
    state.elapsed = state.tickBase + (Date.now() - state.tickStart) / 1000;
    $('#timer').textContent = fmtTime(state.elapsed);
  }
  function startTimer() {
    stopTimer();
    if (state.solved) { $('#timer').textContent = fmtTime(state.elapsed); return; }
    state.tickBase = state.elapsed; state.tickStart = Date.now();
    state.timerId = setInterval(tick, 500); tick();
  }
  function stopTimer() {
    if (state.timerId) { clearInterval(state.timerId); state.timerId = null; tick(); }
  }

  function saveGameNow() {
    clearTimeout(saveTimer);
    if (!state.puzzle || state.solved) return;
    if (state.timerId) tick();
    save(LS.game + state.lang, {
      level: state.level, puzzle: state.puzzle, entries: state.entries, marks: state.marks,
      elapsed: state.elapsed, hints: state.hints
    });
  }
  function saveGameSoon() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveGameNow, 350);
  }

  /* ---------- winning ---------- */
  function win() {
    if (state.solved) return;
    state.solved = true;
    stopTimer(); clearTimeout(saveTimer); drop(LS.game + state.lang);

    var prog = load(LS.progress, {});
    var lp = prog[state.lang] = prog[state.lang] || {};
    var rec = lp[state.level] = lp[state.level] || { solved: 0 };
    var newBest = false;
    rec.solved++;
    if (state.hints === 0 && (!rec.best || state.elapsed < rec.best)) { rec.best = Math.round(state.elapsed); newBest = true; }
    save(LS.progress, prog);

    setToolsEnabled();
    $('#board').classList.add('solved');
    confetti();
    clearTimeout(winTimer);
    winTimer = setTimeout(function () { showWin(newBest); }, 1100);
  }

  function showWin(newBest) {
    renderTiles($('#win-tiles'), t('winWord'));
    $('#win-title').textContent = t('winTitle');
    $('#win-body').textContent = t('winBody', { level: num(state.level), time: fmtTime(state.elapsed) });
    var extra = $('#win-extra'); extra.innerHTML = '';
    extra.appendChild(el('span', null, state.hints ? t('winHints', { n: num(state.hints) }) : t('winClean')));
    if (newBest) { extra.appendChild(document.createElement('br')); extra.appendChild(el('span', null, t('winBest'))); }
    var last = state.level >= TOTAL_LEVELS;
    if (last) { extra.appendChild(document.createElement('br')); extra.appendChild(el('span', null, t('allDone'))); }
    $('#win-next').textContent = t('nextLevel'); $('#win-next').hidden = last;
    $('#win-again').textContent = t('sameLevel');
    $('#win-home').textContent = t('toHome');
    var dlg = $('#dlg-win');
    if (!dlg.open) dlg.showModal();
  }

  function confetti() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var box = $('#confetti'); box.innerHTML = '';
    var colors = ['#16316f', '#0e9f95', '#f4aa1c', '#c4372e', '#ffffff', '#6f8ff0'];
    for (var i = 0; i < 80; i++) {
      var p = document.createElement('i');
      p.style.left = (Math.random() * 100) + '%';
      p.style.background = colors[i % colors.length];
      p.style.setProperty('--dx', (Math.random() * 160 - 80) + 'px');
      p.style.setProperty('--rot', (Math.random() * 900 - 450) + 'deg');
      p.style.setProperty('--dur', (1.6 + Math.random() * 1.6) + 's');
      p.style.animationDelay = (Math.random() * 0.4) + 's';
      box.appendChild(p);
    }
    setTimeout(function () { box.innerHTML = ''; }, 4200);
  }

  /* ---------- keyboards ---------- */
  function buildKeyboard() {
    var box = $('#kbd'); box.innerHTML = '';
    var rows = KB[state.lang];
    rows.forEach(function (row, i) {
      var d = el('div', 'krow');
      Array.from(row).forEach(function (ch) {
        var b = el('button', 'key', ch); b.type = 'button'; b.dataset.k = ch; d.appendChild(b);
      });
      if (i === rows.length - 1) {
        var bs = el('button', 'key key-wide'); bs.type = 'button'; bs.dataset.act = 'back';
        bs.setAttribute('aria-label', t('del')); bs.innerHTML = BACKSPACE_SVG; d.appendChild(bs);
      }
      box.appendChild(d);
    });
  }

  function keyToLetter(e) {
    var k = e.key;
    if (!k || k.length !== 1) return null;
    if (state.lang === 'fa') {
      k = k.replace('ي', 'ی').replace('ك', 'ک');
      if (FA_SET.indexOf(k) >= 0) return k;
      if (/^[A-Za-z;,'\[\]]$/.test(k)) return (e.shiftKey && FA_SHIFT_KEYS[e.code]) || FA_KEYS[e.code] || null;
      return null;
    }
    return /^[A-Za-z]$/.test(k) ? k.toUpperCase() : null;
  }

  function onKeyDown(e) {
    if (state.view !== 'game' || anyDialogOpen() || e.ctrlKey || e.metaKey || e.altKey) return;
    var k = e.key, onButton = e.target && e.target.closest && e.target.closest('button, a, input, select, textarea');
    switch (k) {
      case 'ArrowLeft': case 'ArrowRight': case 'ArrowUp': case 'ArrowDown':
        e.preventDefault(); arrow(k); return;
      case 'Backspace': case 'Delete':
        e.preventDefault(); backspace(); return;
      case 'Enter':
        if (onButton) return;
        e.preventDefault(); gotoWord(e.shiftKey ? -1 : 1); return;
      case ' ':
        if (onButton) return;
        e.preventDefault(); select(state.sel.r, state.sel.c, true); return;
    }
    var ch = keyToLetter(e);
    if (ch) { e.preventDefault(); typeChar(ch); }
  }

  /* ---------- events ---------- */
  function bind() {
    $('#btn-home').addEventListener('click', function () { if (state.view === 'game') { saveGameNow(); } showHome(); });
    $('#btn-back').addEventListener('click', function () { saveGameNow(); showHome(); });

    $('#seg-lang').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-lang]'); if (b) setLang(b.getAttribute('data-lang'));
    });
    $('#btn-theme').addEventListener('click', function () {
      state.theme = state.theme === 'dark' ? 'light' : 'dark'; applyTheme(); saveSettings();
    });
    $('#btn-help').addEventListener('click', function () { $('#dlg-help').showModal(); });

    $('#levels').addEventListener('click', function (e) {
      var b = e.target.closest('.lvl'); if (b) startLevel(parseInt(b.dataset.level, 10));
    });
    $('#resume').addEventListener('click', function () {
      var g = load(LS.game + state.lang, null);
      if (g && g.puzzle) startLevel(g.level, g);
    });

    $('#board').addEventListener('click', function (e) {
      var cell = e.target.closest('.cell');
      if (cell) select(parseInt(cell.dataset.r, 10), parseInt(cell.dataset.c, 10), true);
    });
    $('#clues').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-id]'); if (!b) return;
      focusWord(state.puzzle.words[parseInt(b.dataset.id, 10)]);
      if (window.innerWidth <= 960) $('#board-wrap').scrollIntoView({ block: 'center', behavior: 'smooth' });
    });

    var kbd = $('#kbd');
    kbd.addEventListener('mousedown', function (e) { e.preventDefault(); });
    kbd.addEventListener('click', function (e) {
      var b = e.target.closest('.key'); if (!b) return;
      if (b.dataset.act === 'back') backspace(); else typeChar(b.dataset.k);
    });

    $('#btn-check').addEventListener('click', doCheck);
    $('#btn-hint-letter').addEventListener('click', doHintLetter);
    $('#btn-hint-word').addEventListener('click', doHintWord);
    $('#btn-clear').addEventListener('click', doClear);
    $('#btn-solve').addEventListener('click', doSolve);
    $('#btn-new').addEventListener('click', doNew);

    $('#win-next').addEventListener('click', function () { $('#dlg-win').close(); startLevel(Math.min(TOTAL_LEVELS, state.level + 1)); });
    $('#win-again').addEventListener('click', function () { $('#dlg-win').close(); startLevel(state.level); });
    $('#win-home').addEventListener('click', function () { $('#dlg-win').close(); showHome(); });

    document.addEventListener('keydown', onKeyDown);
    var resizeRaf = 0;
    window.addEventListener('resize', function () {
      cancelAnimationFrame(resizeRaf); resizeRaf = requestAnimationFrame(fitBoard);
    });
    document.addEventListener('visibilitychange', function () {
      if (state.view !== 'game' || state.solved) return;
      if (document.hidden) { saveGameNow(); stopTimer(); } else { startTimer(); }
    });
    window.addEventListener('pagehide', saveGameNow);
  }

  /* ---------- init ---------- */
  function init() {
    var st = load(LS.settings, {});
    var langs = navigator.languages || [navigator.language || ''];
    state.lang = st.lang || (langs.some(function (l) { return /^fa/i.test(l); }) ? 'fa' : 'en');
    state.theme = st.theme || ((window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light');
    applyTheme(); applyLang(); bind(); showHome();
  }

  init();
})();
