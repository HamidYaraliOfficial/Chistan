#!/usr/bin/env node
/*
 * Export ready-made puzzles to JSON files.
 *
 *   node tools/export-puzzles.js                       # 20 puzzles per language (one per level)
 *   node tools/export-puzzles.js --lang=fa --per-level=3
 *   node tools/export-puzzles.js --out=./my-puzzles --seed=2026
 *
 * Options
 *   --lang=fa|en|both   language(s) to export          (default: both)
 *   --per-level=N       puzzles for each of the 20 levels (default: 1)
 *   --out=DIR           output folder                  (default: ./puzzles)
 *   --seed=N            base seed, same seed = same output (default: 1)
 *
 * Every exported puzzle is validated, and no two puzzles in one file share a
 * layout. The generator avoids reusing the same words back to back.
 */
'use strict';
var fs = require('fs');
var path = require('path');
var C = require(path.join(__dirname, '..', 'js', 'generator.js'));
global.CHISTAN_WORDS = {
  fa: require(path.join(__dirname, '..', 'js', 'words-fa.js')),
  en: require(path.join(__dirname, '..', 'js', 'words-en.js'))
};

var opt = { lang: 'both', 'per-level': '1', out: path.join(__dirname, '..', 'puzzles'), seed: '1' };
process.argv.slice(2).forEach(function (a) {
  var m = /^--([\w-]+)=(.*)$/.exec(a);
  if (m) opt[m[1]] = m[2];
});
var langs = opt.lang === 'both' ? ['fa', 'en'] : [opt.lang];
var perLevel = Math.max(1, parseInt(opt['per-level'], 10) || 1);
var baseSeed = parseInt(opt.seed, 10) || 1;
var outDir = path.resolve(opt.out);
fs.mkdirSync(outDir, { recursive: true });

function publicPuzzle(p, index) {
  return {
    id: p.lang + '-L' + (p.level < 10 ? '0' : '') + p.level + '-' + (index + 1),
    lang: p.lang, level: p.level, rows: p.rows, cols: p.cols, seed: p.seed,
    grid: p.grid.map(function (r) { return r.map(function (c) { return c || null; }); }),
    words: p.words.map(function (w) {
      return { number: w.num, direction: w.dir, row: w.r, col: w.c, length: w.len, answer: w.answer, clue: w.clue };
    })
  };
}

langs.forEach(function (lang) {
  var bank = global.CHISTAN_WORDS[lang], avoid = [], sigs = [], list = [];
  for (var round = 0; round < perLevel; round++) {
    C.LEVELS.forEach(function (cfg) {
      var p = C.generate({
        lang: lang, level: cfg.level, avoid: avoid, seen: sigs,
        seed: (baseSeed * 7919 + cfg.level * 104729 + round * 1299709 + (lang === 'fa' ? 11 : 23)) >>> 0
      });
      var errs = C.validate(p);
      if (errs.length) throw new Error('Invalid puzzle (' + lang + ' level ' + cfg.level + '): ' + errs[0]);
      if (p.words.length < cfg.words) throw new Error('Puzzle ' + lang + ' level ' + cfg.level + ' is short of words');
      list.push(publicPuzzle(p, round));
      avoid = avoid.concat(p.words.map(function (w) { return w.answer; })).slice(-Math.floor(bank.length * 0.6));
      sigs.push(p.signature);
    });
  }
  var file = path.join(outDir, 'sample-' + lang + '.json');
  fs.writeFileSync(file, JSON.stringify({ language: lang, count: list.length, puzzles: list }, null, 1) + '\n');
  var uniq = {}; list.forEach(function (p) { uniq[JSON.stringify(p.grid)] = true; });
  console.log(lang + ': wrote ' + list.length + ' puzzles (' + Object.keys(uniq).length + ' distinct layouts) to ' + path.relative(process.cwd(), file));
});
