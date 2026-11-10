/*
 * Chistan crossword generator.
 *
 * Works in the browser (global `Chistan`) and in Node (`require`).
 * - Seeded PRNG, so a puzzle can be reproduced from its seed.
 * - Greedy crossing placement inside a size x size window, many restarts,
 *   keeps the densest result that reaches the requested word count.
 * - `avoid` (recently used answers) and `seen` (puzzle signatures) keep
 *   consecutive puzzles fresh.
 * - `validate` independently re-checks a finished puzzle.
 *
 * Coordinates are logical: column 0 is the first column in reading
 * direction, so for Persian the UI mirrors the grid (column 0 on the right).
 */
(function (root) {
  'use strict';

  /* ------------------------------------------------------------------ */
  /* Levels: small to large                                              */
  /* ------------------------------------------------------------------ */
  var LEVELS = [
    { level: 1,  size: 6,  words: 4,  minLen: 3, maxLen: 5 },
    { level: 2,  size: 7,  words: 5,  minLen: 3, maxLen: 6 },
    { level: 3,  size: 7,  words: 6,  minLen: 3, maxLen: 6 },
    { level: 4,  size: 8,  words: 7,  minLen: 3, maxLen: 7 },
    { level: 5,  size: 9,  words: 8,  minLen: 3, maxLen: 7 },
    { level: 6,  size: 9,  words: 9,  minLen: 3, maxLen: 8 },
    { level: 7,  size: 10, words: 10, minLen: 3, maxLen: 8 },
    { level: 8,  size: 11, words: 11, minLen: 3, maxLen: 8 },
    { level: 9,  size: 11, words: 12, minLen: 3, maxLen: 9 },
    { level: 10, size: 12, words: 13, minLen: 3, maxLen: 9 },
    { level: 11, size: 12, words: 14, minLen: 3, maxLen: 9 },
    { level: 12, size: 13, words: 15, minLen: 3, maxLen: 9 },
    { level: 13, size: 14, words: 17, minLen: 3, maxLen: 9 },
    { level: 14, size: 14, words: 18, minLen: 3, maxLen: 9 },
    { level: 15, size: 15, words: 20, minLen: 3, maxLen: 9 },
    { level: 16, size: 16, words: 22, minLen: 3, maxLen: 9 },
    { level: 17, size: 17, words: 24, minLen: 3, maxLen: 9 },
    { level: 18, size: 18, words: 26, minLen: 3, maxLen: 9 },
    { level: 19, size: 19, words: 28, minLen: 3, maxLen: 9 },
    { level: 20, size: 21, words: 32, minLen: 3, maxLen: 9 }
  ];

  /** 1..5: mini, small, medium, large, giant (four levels each). */
  function tierOf(level) { return Math.ceil(level / 4); }

  /* ------------------------------------------------------------------ */
  /* Utilities                                                           */
  /* ------------------------------------------------------------------ */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function makeRng(seed) {
    var f = mulberry32(seed >>> 0);
    return {
      next: f,
      int: function (n) { return Math.floor(f() * n); },
      shuffle: function (arr) {
        var a = arr.slice();
        for (var i = a.length - 1; i > 0; i--) {
          var j = Math.floor(f() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
      }
    };
  }

  function randomSeed() {
    try {
      if (root.crypto && root.crypto.getRandomValues) {
        var a = new Uint32Array(1); root.crypto.getRandomValues(a); return a[0];
      }
    } catch (e) { /* fall through */ }
    return (Math.random() * 4294967296) >>> 0;
  }

  function now() {
    return (root.performance && root.performance.now) ? root.performance.now() : Date.now();
  }

  function fnv1a(str) {
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(16);
  }

  function toSet(x) {
    if (!x) return { has: function () { return false; } };
    if (typeof x.has === 'function') return x;
    var o = {}; for (var i = 0; i < x.length; i++) o[x[i]] = true;
    return { has: function (k) { return o[k] === true; } };
  }

  /** Split a word into grid letters (one letter = one cell). */
  function normalize(word, lang) {
    var w = String(word);
    if (lang === 'fa') {
      w = w.replace(/ي/g, 'ی').replace(/ك/g, 'ک')
           .replace(/[‌‍ً-ْـ\s]/g, '');
    } else {
      w = w.toUpperCase().replace(/[^A-Z]/g, '');
    }
    return Array.from(w);
  }

  var prepared = {};
  function prepare(lang, bank) {
    var key = lang + ':' + bank.length;
    if (prepared[key]) return prepared[key];
    var seen = {}, out = [];
    for (var i = 0; i < bank.length; i++) {
      var letters = normalize(bank[i][0], lang), word = letters.join('');
      if (letters.length < 2 || seen[word]) continue;
      seen[word] = true;
      out.push({ w: letters, word: word, clue: bank[i][1] });
    }
    prepared[key] = out;
    return out;
  }

  /* ------------------------------------------------------------------ */
  /* One greedy build                                                    */
  /* ------------------------------------------------------------------ */
  // dir: 0 = across, 1 = down
  function buildOnce(pool, S, target, rng, deadline) {
    var g = [], mask = [], r, c;
    for (r = 0; r < S; r++) {
      g.push(new Array(S).fill('')); mask.push(new Array(S).fill(0));
    }
    var placed = [], used = new Array(pool.length).fill(false);
    var bb = { r0: S, r1: -1, c0: S, c1: -1 }, crossings = 0;

    function inb(rr, cc) { return rr >= 0 && cc >= 0 && rr < S && cc < S; }

    function check(L, r0, c0, dir) {
      var dr = dir, dc = 1 - dir, len = L.length;
      var er = r0 + dr * (len - 1), ec = c0 + dc * (len - 1);
      if (r0 < 0 || c0 < 0 || er >= S || ec >= S) return -1;
      var br = r0 - dr, bc = c0 - dc;
      if (inb(br, bc) && g[br][bc] !== '') return -1;
      var ar = er + dr, ac = ec + dc;
      if (inb(ar, ac) && g[ar][ac] !== '') return -1;
      var cross = 0, bit = dir === 0 ? 1 : 2;
      for (var k = 0; k < len; k++) {
        var rr = r0 + dr * k, cc = c0 + dc * k, ch = g[rr][cc];
        if (ch !== '') {
          if (ch !== L[k] || (mask[rr][cc] & bit)) return -1;
          cross++;
        } else {
          var r1 = rr + dc, c1 = cc + dr, r2 = rr - dc, c2 = cc - dr;
          if ((inb(r1, c1) && g[r1][c1] !== '') || (inb(r2, c2) && g[r2][c2] !== '')) return -1;
        }
      }
      return cross;
    }

    function put(idx, r0, c0, dir, cross) {
      var L = pool[idx].w, dr = dir, dc = 1 - dir, bit = dir === 0 ? 1 : 2;
      for (var k = 0; k < L.length; k++) {
        var rr = r0 + dr * k, cc = c0 + dc * k;
        g[rr][cc] = L[k]; mask[rr][cc] |= bit;
      }
      var er = r0 + dr * (L.length - 1), ec = c0 + dc * (L.length - 1);
      if (r0 < bb.r0) bb.r0 = r0; if (er > bb.r1) bb.r1 = er;
      if (c0 < bb.c0) bb.c0 = c0; if (ec > bb.c1) bb.c1 = ec;
      used[idx] = true; crossings += cross;
      placed.push({ e: pool[idx], r: r0, c: c0, dir: dir });
    }

    // --- first word: a long one, near the middle ---
    var firstIdx = -1, firstScore = -1, i;
    for (i = 0; i < pool.length && i < 40; i++) {
      if (pool[i].w.length > S) continue;
      var sc = pool[i].w.length + rng.next() * 2.5;
      if (sc > firstScore) { firstScore = sc; firstIdx = i; }
    }
    if (firstIdx < 0) return null;
    var fl = pool[firstIdx].w.length;
    put(firstIdx, Math.max(0, Math.min(S - 1, Math.floor((S - 1) / 2) + rng.int(3) - 1)),
        Math.floor((S - fl) / 2), 0, 0);

    // --- grow ---
    while (placed.length < target && now() < deadline) {
      var open = [];
      for (i = 0; i < pool.length && open.length < 150; i++) if (!used[i]) open.push(i);
      if (!open.length) break;
      var cands = rng.shuffle(open).slice(0, 44);
      var area0 = (bb.r1 - bb.r0 + 1) * (bb.c1 - bb.c0 + 1), options = [];

      for (var ci = 0; ci < cands.length; ci++) {
        var idx = cands[ci], L = pool[idx].w;
        for (var pi = 0; pi < placed.length; pi++) {
          var p = placed[pi], pl = p.e.w;
          for (var j = 0; j < pl.length; j++) {
            var pr = p.dir === 0 ? p.r : p.r + j, pc = p.dir === 0 ? p.c + j : p.c;
            if (mask[pr][pc] === 3) continue;
            var nd = 1 - p.dir;
            for (var k = 0; k < L.length; k++) {
              if (L[k] !== pl[j]) continue;
              var nr = nd === 1 ? pr - k : pr, nc = nd === 1 ? pc : pc - k;
              var cr = check(L, nr, nc, nd);
              if (cr < 1) continue;
              var er = nr + nd * (L.length - 1), ec = nc + (1 - nd) * (L.length - 1);
              var area1 = (Math.max(bb.r1, er) - Math.min(bb.r0, nr) + 1) *
                          (Math.max(bb.c1, ec) - Math.min(bb.c0, nc) + 1);
              options.push({
                idx: idx, r: nr, c: nc, dir: nd, cross: cr,
                score: cr * 14 - (area1 - area0) * 0.8 + rng.next() * 8
              });
            }
          }
        }
      }
      if (!options.length) break;
      options.sort(function (a, b) { return b.score - a.score; });
      var pick = options[Math.floor(Math.pow(rng.next(), 2.2) * Math.min(4, options.length))];
      put(pick.idx, pick.r, pick.c, pick.dir, pick.cross);
    }

    return { placed: placed, bb: bb, crossings: crossings };
  }

  function quality(res, target) {
    var h = res.bb.r1 - res.bb.r0 + 1, w = res.bb.c1 - res.bb.c0 + 1;
    // reach the word target first, then prefer many crossings, a compact
    // bounding box and a shape close to a square (nicer on every screen)
    return Math.min(res.placed.length, target) * 10000 + res.crossings * 40 -
           h * w * 6 - Math.abs(h - w) * 45;
  }

  /* ------------------------------------------------------------------ */
  /* Public: generate                                                    */
  /* ------------------------------------------------------------------ */
  function generateOne(lang, cfg, bank, avoid, seed, budget) {
    var rng = makeRng(seed);
    var entries = prepare(lang, bank).filter(function (e) {
      return e.w.length >= cfg.minLen && e.w.length <= Math.min(cfg.maxLen, cfg.size);
    });
    var fresh = [], stale = [];
    entries.forEach(function (e) { (avoid.has(e.word) ? stale : fresh).push(e); });
    var pool = rng.shuffle(fresh).concat(rng.shuffle(stale));

    var best = null, bestQ = -Infinity, attempts = 0, reached = 0;
    var start = now(), deadline = start + budget;
    var wantReached = 14, maxAttempts = 90;
    while (now() < deadline && attempts < maxAttempts) {
      attempts++;
      // reshuffle the order a little between attempts for variety
      var res = buildOnce(attempts === 1 ? pool : rng.shuffle(pool.slice(0, 160)).concat(pool.slice(160)),
                          cfg.size, cfg.words, rng, deadline);
      if (!res) continue;
      var q = quality(res, cfg.words);
      if (q > bestQ) { bestQ = q; best = res; }
      if (res.placed.length >= cfg.words) { reached++; if (reached >= wantReached) break; }
    }
    if (!best) throw new Error('Could not generate a puzzle for level ' + cfg.level);
    return finalize(best, lang, cfg, seed, attempts, cfg.words);
  }

  function finalize(res, lang, cfg, seed, attempts, target) {
    var bb = res.bb, rows = bb.r1 - bb.r0 + 1, cols = bb.c1 - bb.c0 + 1;
    var grid = [], r, c;
    for (r = 0; r < rows; r++) grid.push(new Array(cols).fill(''));

    var words = res.placed.map(function (p) {
      var w = {
        dir: p.dir === 0 ? 'across' : 'down',
        r: p.r - bb.r0, c: p.c - bb.c0,
        len: p.e.w.length, answer: p.e.word, letters: p.e.w.slice(), clue: p.e.clue
      };
      for (var k = 0; k < w.len; k++) {
        grid[w.r + (p.dir === 1 ? k : 0)][w.c + (p.dir === 0 ? k : 0)] = w.letters[k];
      }
      return w;
    });

    // numbering in reading order
    var starts = {};
    words.forEach(function (w) { starts[w.r + ',' + w.c] = true; });
    var num = 0, numAt = {};
    for (r = 0; r < rows; r++) for (c = 0; c < cols; c++) {
      if (starts[r + ',' + c]) numAt[r + ',' + c] = ++num;
    }
    words.forEach(function (w) { w.num = numAt[w.r + ',' + w.c]; });
    words.sort(function (a, b) {
      if (a.dir !== b.dir) return a.dir === 'across' ? -1 : 1;
      return a.num - b.num;
    });
    words.forEach(function (w, i) { w.id = i; });

    var sigSrc = words.map(function (w) { return w.answer + '@' + w.r + ',' + w.c + w.dir[0]; })
                      .sort().join('|');
    return {
      lang: lang, level: cfg.level, rows: rows, cols: cols,
      grid: grid, words: words, seed: seed >>> 0,
      signature: fnv1a(sigSrc) + '-' + words.length,
      target: target, partial: words.length < target, attempts: attempts
    };
  }

  /**
   * generate({ lang, level, seed?, avoid?, seen?, bank?, timeBudget? })
   * avoid: answers used recently (Set or array), seen: signatures (Set or array)
   */
  function generate(opts) {
    var lang = opts.lang === 'fa' ? 'fa' : 'en';
    var cfg = LEVELS[(opts.level | 0) - 1];
    if (!cfg) throw new Error('level must be between 1 and ' + LEVELS.length);
    var bank = opts.bank || (root.CHISTAN_WORDS && root.CHISTAN_WORDS[lang]);
    if (!bank || !bank.length) throw new Error('No word bank for language: ' + lang);

    var avoid = toSet(opts.avoid), seen = toSet(opts.seen);
    var budget = opts.timeBudget || (120 + cfg.size * 22);
    var seed = opts.seed != null ? (opts.seed >>> 0) : randomSeed();
    var puzzle, tries = 0;
    do {
      puzzle = generateOne(lang, cfg, bank, avoid, seed, budget);
      // a puzzle that falls short of its target gets one more chance
      if (puzzle.partial && tries < 2) { seed = randomSeed(); tries++; continue; }
      if (!seen.has(puzzle.signature)) break;
      seed = randomSeed(); tries++;
    } while (tries < 8);
    return puzzle;
  }

  /* ------------------------------------------------------------------ */
  /* Validation (used by tests and handy when editing the word banks)    */
  /* ------------------------------------------------------------------ */
  function validate(p) {
    var errors = [], r, c, k;
    var g = [];
    for (r = 0; r < p.rows; r++) g.push(new Array(p.cols).fill(''));
    var seenWords = {};
    p.words.forEach(function (w) {
      if (seenWords[w.answer]) errors.push('duplicate word ' + w.answer);
      seenWords[w.answer] = true;
      if (w.letters.length !== w.len) errors.push('length mismatch ' + w.answer);
      for (k = 0; k < w.len; k++) {
        var rr = w.r + (w.dir === 'down' ? k : 0), cc = w.c + (w.dir === 'across' ? k : 0);
        if (rr >= p.rows || cc >= p.cols) { errors.push('out of bounds ' + w.answer); return; }
        if (g[rr][cc] !== '' && g[rr][cc] !== w.letters[k]) errors.push('letter conflict in ' + w.answer);
        g[rr][cc] = w.letters[k];
      }
    });
    for (r = 0; r < p.rows; r++) for (c = 0; c < p.cols; c++) {
      if (g[r][c] !== p.grid[r][c]) errors.push('grid mismatch at ' + r + ',' + c);
    }
    function runs(lines, dirName) {
      lines.forEach(function (line, li) {
        var start = -1;
        for (var i = 0; i <= line.length; i++) {
          var has = i < line.length && line[i] !== '';
          if (has && start < 0) start = i;
          if (!has && start >= 0) {
            var len = i - start;
            if (len >= 2) {
              var ok = p.words.some(function (w) {
                return w.dir === dirName && w.len === len &&
                  (dirName === 'across' ? (w.r === li && w.c === start) : (w.c === li && w.r === start));
              });
              if (!ok) errors.push('unintended ' + dirName + ' run at line ' + li + ' start ' + start);
            }
            start = -1;
          }
        }
      });
    }
    runs(g, 'across');
    var cols = [];
    for (c = 0; c < p.cols; c++) { var col = []; for (r = 0; r < p.rows; r++) col.push(g[r][c]); cols.push(col); }
    runs(cols, 'down');

    // connectivity
    var total = 0, sr = -1, sc = -1;
    for (r = 0; r < p.rows; r++) for (c = 0; c < p.cols; c++) if (g[r][c] !== '') { total++; if (sr < 0) { sr = r; sc = c; } }
    var seenCell = {}, stack = [[sr, sc]], count = 0;
    while (stack.length) {
      var cur = stack.pop(), key = cur[0] + ',' + cur[1];
      if (seenCell[key]) continue;
      if (cur[0] < 0 || cur[1] < 0 || cur[0] >= p.rows || cur[1] >= p.cols || g[cur[0]][cur[1]] === '') continue;
      seenCell[key] = true; count++;
      stack.push([cur[0] + 1, cur[1]], [cur[0] - 1, cur[1]], [cur[0], cur[1] + 1], [cur[0], cur[1] - 1]);
    }
    if (count !== total) errors.push('grid is not connected');

    // every word starting cell must be numbered, numbers unique per start cell
    var numByCell = {};
    p.words.forEach(function (w) {
      var key = w.r + ',' + w.c;
      if (numByCell[key] !== undefined && numByCell[key] !== w.num) errors.push('inconsistent number at ' + key);
      numByCell[key] = w.num;
    });
    return errors;
  }

  var api = {
    LEVELS: LEVELS, tierOf: tierOf, generate: generate, validate: validate,
    normalize: normalize, randomSeed: randomSeed
  };
  root.Chistan = api;
  if (typeof module === 'object' && module.exports) { module.exports = api; }
})(typeof self !== 'undefined' ? self : globalThis);
