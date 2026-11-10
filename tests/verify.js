#!/usr/bin/env node
/*
 * Chistan self-test.  Run with:  node tests/verify.js   (or: npm test)
 *
 *  1. Word banks: valid letters, unique answers, sensible lengths, clues present.
 *  2. Every level, both languages, several seeds: puzzle is valid, reaches its
 *     word target and fits its size.
 *  3. Session simulation: many puzzles in a row with the same history rules the
 *     app uses; no repeated puzzle and little word reuse between neighbours.
 *
 * Options:  --runs=N  (seeds per level, default 6)   --quick (2 seeds per level)
 */
'use strict';
var path = require('path');
var C = require(path.join(__dirname, '..', 'js', 'generator.js'));
var FA = require(path.join(__dirname, '..', 'js', 'words-fa.js'));
var EN = require(path.join(__dirname, '..', 'js', 'words-en.js'));

var args = process.argv.slice(2);
var quick = args.indexOf('--quick') >= 0;
var runsArg = args.filter(function (a) { return a.indexOf('--runs=') === 0; })[0];
var RUNS = quick ? 2 : (runsArg ? parseInt(runsArg.split('=')[1], 10) : 6);

var failures = 0;
function fail(msg) { failures++; console.log('  FAIL  ' + msg); }
function pad(s, n) { s = String(s); while (s.length < n) s += ' '; return s; }

/* ---------- 1. word banks ---------- */
var FA_ALPHABET = 'ابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهیآ';
function checkBank(name, bank, lang) {
  console.log('Word bank [' + name + ']: ' + bank.length + ' entries');
  var seen = {}, lenHist = {};
  bank.forEach(function (e, i) {
    var word = e[0], clue = e[1];
    var letters = Array.from(word);
    if (seen[word]) fail(name + ': duplicate answer "' + word + '"');
    seen[word] = true;
    if (!clue || clue.length < 3) fail(name + ': missing clue for "' + word + '"');
    if (lang === 'fa') {
      letters.forEach(function (ch) {
        if (FA_ALPHABET.indexOf(ch) < 0) fail(name + ': invalid letter U+' + ch.charCodeAt(0).toString(16) + ' in "' + word + '"');
      });
    } else if (!/^[A-Z]+$/.test(word)) {
      fail(name + ': answer must be A-Z only: "' + word + '"');
    }
    if (letters.length < 3 || letters.length > 9) fail(name + ': length out of 3..9: "' + word + '"');
    lenHist[letters.length] = (lenHist[letters.length] || 0) + 1;
  });
  console.log('  length histogram: ' + Object.keys(lenHist).sort().map(function (k) { return k + ':' + lenHist[k]; }).join('  '));
  if (bank.length < 200) fail(name + ': fewer than 200 entries');
}
checkBank('fa', FA, 'fa');
checkBank('en', EN, 'en');

/* ---------- 2. every level ---------- */
function runLevels(lang) {
  console.log('\nLevels [' + lang + '] (' + RUNS + ' seeds each)');
  console.log('  ' + pad('lvl', 4) + pad('size', 7) + pad('target', 8) + pad('words(min/avg)', 16) + pad('largest', 9) + pad('ms avg/max', 12) + 'valid');
  var allMs = [];
  C.LEVELS.forEach(function (cfg) {
    var minW = 99, sumW = 0, maxDim = 0, sumMs = 0, maxMs = 0, bad = 0;
    for (var s = 0; s < RUNS; s++) {
      var t0 = Date.now();
      var p = C.generate({ lang: lang, level: cfg.level, seed: 1000 * cfg.level + s * 7919 + 13 });
      var ms = Date.now() - t0;
      sumMs += ms; if (ms > maxMs) maxMs = ms; allMs.push(ms);
      var errs = C.validate(p);
      if (errs.length) { bad++; fail('level ' + cfg.level + ' seed ' + p.seed + ': ' + errs.slice(0, 3).join('; ')); }
      if (p.words.length < cfg.words) fail('level ' + cfg.level + ' seed ' + p.seed + ': only ' + p.words.length + '/' + cfg.words + ' words');
      if (p.rows > cfg.size || p.cols > cfg.size) fail('level ' + cfg.level + ': grid ' + p.rows + 'x' + p.cols + ' exceeds size ' + cfg.size);
      minW = Math.min(minW, p.words.length); sumW += p.words.length;
      maxDim = Math.max(maxDim, p.rows, p.cols);
    }
    console.log('  ' + pad(cfg.level, 4) + pad(cfg.size + 'x' + cfg.size, 7) + pad(cfg.words, 8) +
      pad(minW + ' / ' + (sumW / RUNS).toFixed(1), 16) + pad(maxDim, 9) +
      pad(Math.round(sumMs / RUNS) + ' / ' + maxMs, 12) + (bad ? 'NO' : 'yes'));
  });
  allMs.sort(function (a, b) { return a - b; });
  console.log('  generation time: median ' + allMs[Math.floor(allMs.length / 2)] + ' ms, max ' + allMs[allMs.length - 1] + ' ms');
}
runLevels('fa');
runLevels('en');

/* ---------- 3. session simulation ---------- */
function simulate(lang, bankSize) {
  var count = quick ? 40 : 120;
  var avoid = [], sigs = [], seen = {}, dupes = 0, overlapSum = 0, overlapN = 0, prev = null;
  for (var i = 0; i < count; i++) {
    var level = 1 + (i % 20);
    var p = C.generate({ lang: lang, level: level, avoid: avoid, seen: sigs });
    if (seen[p.signature]) dupes++;
    seen[p.signature] = true;
    var answers = p.words.map(function (w) { return w.answer; });
    if (prev) {
      var shared = answers.filter(function (a) { return prev.indexOf(a) >= 0; }).length;
      overlapSum += shared / answers.length; overlapN++;
    }
    prev = answers;
    avoid = avoid.concat(answers).slice(-Math.floor(bankSize * 0.6));
    sigs = sigs.concat([p.signature]).slice(-400);
  }
  console.log('\nSession simulation [' + lang + ']: ' + count + ' puzzles in a row');
  console.log('  identical puzzles: ' + dupes + '   average word overlap with the previous puzzle: ' + (100 * overlapSum / overlapN).toFixed(1) + '%');
  if (dupes) fail('session simulation produced repeated puzzles in ' + lang);
}
simulate('fa', FA.length);
simulate('en', EN.length);

console.log('\n' + (failures ? failures + ' check(s) FAILED' : 'All checks passed'));
process.exit(failures ? 1 : 0);
