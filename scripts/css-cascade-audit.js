#!/usr/bin/env node
// CSS cascade audit — read-only analysis, no changes made
"use strict";

const fs = require("fs");
const path = require("path");

// ════════════════════════════════════════════════════════════════
// CSS-safe selector-list splitter
// ════════════════════════════════════════════════════════════════
// Splits "a, b, c" into ["a","b","c"] only at commas that are:
//   • not inside parentheses  (...)
//   • not inside attribute brackets  [...]
//   • not inside a single- or double-quoted string
//   • not backslash-escaped
function splitSelectorList(sel) {
  const parts = [];
  let parenDepth = 0, bracketDepth = 0;
  let inDouble = false, inSingle = false, escaped = false;
  let current = "";

  for (const ch of sel) {
    if (escaped)        { current += ch; escaped = false; continue; }
    if (ch === "\\")    { current += ch; escaped = true;  continue; }
    if (inDouble)       { current += ch; if (ch === '"')  inDouble  = false; continue; }
    if (inSingle)       { current += ch; if (ch === "'")  inSingle  = false; continue; }
    if (ch === '"')     { inDouble   = true;  current += ch; continue; }
    if (ch === "'")     { inSingle   = true;  current += ch; continue; }
    if (ch === "(")     { parenDepth++;        current += ch; continue; }
    if (ch === ")")     { parenDepth   = Math.max(0, parenDepth   - 1); current += ch; continue; }
    if (ch === "[")     { bracketDepth++;       current += ch; continue; }
    if (ch === "]")     { bracketDepth = Math.max(0, bracketDepth - 1); current += ch; continue; }
    if (ch === "," && parenDepth === 0 && bracketDepth === 0) {
      const part = current.trim().replace(/\s+/g, " ");
      if (part) parts.push(part);
      current = "";
      continue;
    }
    current += ch;
  }
  const part = current.trim().replace(/\s+/g, " ");
  if (part) parts.push(part);
  return parts;
}

// ════════════════════════════════════════════════════════════════
// Pure deletion-candidate classifier
// ════════════════════════════════════════════════════════════════
// Input: shadowedPairsByRule  Map<ruleIndex, RuleEntry>
//   RuleEntry shape:
//     { ruleIndex, line, section, media, fullSelector,
//       allIndividuals: string[],
//       shadowed: Set<string>,
//       propsByIndividual: { [sel]: PropDetail[] } }
//
// Returns { wholeRuleCandidates, selectorListItemCandidates }
//   wholeRuleCandidates      — every individual in allIndividuals is shadowed
//   selectorListItemCandidates — only SOME are shadowed; one entry per shadowed sel
function classifyDeletionCandidates(shadowedPairsByRule) {
  const wholeRuleCandidates = [];
  const selectorListItemCandidates = [];

  for (const [, entry] of shadowedPairsByRule) {
    const allCovered = entry.allIndividuals.every(s => entry.shadowed.has(s));
    if (allCovered) {
      wholeRuleCandidates.push(entry);
    } else {
      for (const indSel of entry.shadowed) {
        selectorListItemCandidates.push({
          ...entry,
          individual: indSel,
          siblings: entry.allIndividuals.filter(s => s !== indSel),
          props: (entry.propsByIndividual[indSel] || []).map(d => d.prop),
        });
      }
    }
  }

  wholeRuleCandidates.sort((a, b) => a.ruleIndex - b.ruleIndex);
  selectorListItemCandidates.sort((a, b) => a.ruleIndex - b.ruleIndex);
  return { wholeRuleCandidates, selectorListItemCandidates };
}

// ════════════════════════════════════════════════════════════════
// Regression fixtures
// ════════════════════════════════════════════════════════════════

// — Splitter fixtures —
function assertSplit(input, expected) {
  const got = splitSelectorList(input);
  const ok = got.length === expected.length && got.every((v, i) => v === expected[i]);
  if (!ok) {
    console.error(`SPLITTER REGRESSION\n  input   : ${input}\n  expected: ${JSON.stringify(expected)}\n  got     : ${JSON.stringify(got)}`);
    process.exit(1);
  }
}
assertSplit(".a,.b,.c",                [[".a", ".b", ".c"]].flat());
assertSplit('[style*="46,233,255"]',   ['[style*="46,233,255"]']);
assertSplit('.foo[data-x="a,b"],.bar', ['.foo[data-x="a,b"]', ".bar"]);
assertSplit(".foo:not(.a,.b),.bar",    [".foo:not(.a,.b)", ".bar"]);
assertSplit(".foo::part(a,b),.bar",    [".foo::part(a,b)", ".bar"]);
assertSplit(".foo[data-x='a,b'],.bar", [".foo[data-x='a,b']", ".bar"]);
assertSplit(".single",                 [".single"]);
assertSplit("",                        []);

// — Classifier fixtures —
// These exercise the real classifyDeletionCandidates function.
function makeEntry(fullSelector, shadowed) {
  const allIndividuals = splitSelectorList(fullSelector);
  const shadowedSet = new Set(shadowed);
  const propsByIndividual = {};
  for (const s of shadowed) propsByIndividual[s] = [{ prop: "color", shadowedValue: "red", shadowedImportant: false, winner: null }];
  return new Map([[0, { ruleIndex: 0, line: 1, section: "test", media: null,
    fullSelector, allIndividuals, shadowed: shadowedSet, propsByIndividual }]]);
}
function assertClassifier(label, map, expectWhole, expectItem) {
  const { wholeRuleCandidates: w, selectorListItemCandidates: s } = classifyDeletionCandidates(map);
  if (w.length !== expectWhole || s.length !== expectItem) {
    console.error(`CLASSIFIER REGRESSION: ${label}\n  expected whole=${expectWhole} items=${expectItem}\n  got      whole=${w.length} items=${s.length}`);
    process.exit(1);
  }
}
// Partial shadow: only .a shadowed in ".a,.b" → 0 whole-rule, 1 item
assertClassifier("partial shadow", makeEntry(".a,.b", [".a"]), 0, 1);
// Full shadow: both .a and .b shadowed → 1 whole-rule, 0 items
assertClassifier("full shadow", makeEntry(".a,.b", [".a", ".b"]), 1, 0);
// Single selector fully shadowed → 1 whole-rule, 0 items
assertClassifier("single selector", makeEntry(".a", [".a"]), 1, 0);
// Three selectors, two shadowed → 0 whole-rule, 2 items
assertClassifier("three partial", makeEntry(".a,.b,.c", [".a", ".b"]), 0, 2);

// Verify partial-shadow item identifies the correct individual and sibling
(function() {
  const { selectorListItemCandidates } = classifyDeletionCandidates(makeEntry(".a,.b", [".a"]));
  if (selectorListItemCandidates[0].individual !== ".a" || !selectorListItemCandidates[0].siblings.includes(".b")) {
    console.error("CLASSIFIER REGRESSION: partial shadow item has wrong individual or sibling");
    process.exit(1);
  }
})();

// ════════════════════════════════════════════════════════════════
// Suspicious-fragment guard
// ════════════════════════════════════════════════════════════════
const FRAGMENT_RE = /^\d+$|^\d+["']\]$|^["']\]$/;
function assertNotFragment(sel) {
  if (FRAGMENT_RE.test(sel)) {
    console.error(`SPLITTER PRODUCED FAKE FRAGMENT: "${sel}"`);
    process.exit(1);
  }
}

// ════════════════════════════════════════════════════════════════
// Load & parse
// ════════════════════════════════════════════════════════════════
const FILE = path.resolve(__dirname, "../styles.css");
const raw = fs.readFileSync(FILE, "utf8");
const importantCount = (raw.match(/!important/g) || []).length;
let src = raw.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, " "));

// Section map: version comment → nearest line above
const sectionMap = {};
for (const m of raw.matchAll(/\/\*\s*(v\d+[^*]*)\*\//g)) {
  const ln = raw.slice(0, m.index).split("\n").length;
  sectionMap[ln] = m[1].trim().split(/[\r\n]/)[0].trim();
}
function sectionFor(line) {
  let best = 0, label = "v376-clean-style";
  for (const [l, name] of Object.entries(sectionMap)) {
    const n = Number(l);
    if (n <= line && n > best) { best = n; label = name; }
  }
  return label;
}

// Recursive-descent CSS parser; assigns monotonic ruleIndex per rule
const rules = [];
let pos = 0, lineNum = 1, ruleCounter = 0;
function advance(n = 1) { for (let i = 0; i < n; i++) { if (src[pos] === "\n") lineNum++; pos++; } }
function skipWS() { while (pos < src.length && /\s/.test(src[pos])) advance(); }
function readUntil(stops) { let o = ""; while (pos < src.length && !stops.includes(src[pos])) { o += src[pos]; advance(); } return o; }

function parseBlock(depth, media) {
  while (pos < src.length) {
    skipWS();
    if (pos >= src.length) break;
    if (src[pos] === "}" && depth > 0) { advance(); return; }
    if (src[pos] === "@") {
      const atLine = readUntil(["{", ";"]);
      if (src[pos] === ";") { advance(); continue; }
      advance();
      const atRule = atLine.trim();
      if (/^@keyframes/i.test(atRule)) {
        let d = 1;
        while (pos < src.length && d > 0) { if (src[pos] === "{") d++; else if (src[pos] === "}") d--; advance(); }
      } else { parseBlock(depth + 1, atRule); }
      continue;
    }
    const selStart = lineNum;
    const selectorRaw = readUntil(["{", "}"]);
    if (src[pos] === "}") { advance(); if (depth > 0) return; continue; }
    if (pos >= src.length) break;
    advance();
    const selector = selectorRaw.trim().replace(/\s+/g, " ");
    if (!selector) continue;
    const declsRaw = readUntil(["}"]);
    if (src[pos] === "}") advance();
    const declarations = [];
    for (const declRaw of declsRaw.split(";")) {
      const decl = declRaw.trim(); if (!decl) continue;
      const colon = decl.indexOf(":");  if (colon < 0) continue;
      const prop = decl.slice(0, colon).trim().toLowerCase();
      let value = decl.slice(colon + 1).trim();
      const important = value.endsWith("!important");
      if (important) value = value.slice(0, -"!important".length).trim();
      if (prop) declarations.push({ prop, value, important });
    }
    if (declarations.length > 0 || selector.startsWith(":root"))
      rules.push({ selector, declarations, lineStart: selStart, ruleIndex: ruleCounter++, section: sectionFor(selStart), media: media || null });
  }
}
parseBlock(0, null);

// ════════════════════════════════════════════════════════════════
// Expand selector lists → bySelector
// ════════════════════════════════════════════════════════════════
const bySelector = {};
let totalExpandedEntries = 0;
for (const rule of rules) {
  const mediaPrefix = rule.media ? `@media(${rule.media}) ` : "";
  for (const indSel of splitSelectorList(rule.selector)) {
    assertNotFragment(indSel);
    const key = mediaPrefix + indSel;
    if (!bySelector[key]) bySelector[key] = [];
    bySelector[key].push({ ...rule, individualSelector: indSel });
    totalExpandedEntries++;
  }
}

// ════════════════════════════════════════════════════════════════
// Cascade analysis per duplicated selector
// ════════════════════════════════════════════════════════════════
const duplicated = Object.entries(bySelector)
  .filter(([, arr]) => arr.length > 1)
  .sort((a, b) => b[1].length - a[1].length);

function analyzeSelector(occurrences) {
  const propHistory = {};
  for (const rule of occurrences) {
    for (const decl of rule.declarations) {
      if (!propHistory[decl.prop]) propHistory[decl.prop] = [];
      propHistory[decl.prop].push({ value: decl.value, important: decl.important,
        lineStart: rule.lineStart, ruleIndex: rule.ruleIndex, section: rule.section, media: rule.media });
    }
  }
  const winners = {};
  for (const [prop, history] of Object.entries(propHistory)) {
    const imps = history.filter(h => h.important);
    const winner = imps.length
      ? imps.reduce((a, b) => b.ruleIndex > a.ruleIndex ? b : a)
      : history.reduce((a, b) => b.ruleIndex > a.ruleIndex ? b : a);
    winners[prop] = { winner, history };
  }
  const shadowedEarlier = [];
  for (const [prop, { history, winner }] of Object.entries(winners)) {
    for (const entry of history) {
      if (entry.ruleIndex !== winner.ruleIndex &&
          winner.ruleIndex > entry.ruleIndex &&
          (winner.important || !entry.important))
        shadowedEarlier.push({ prop, shadowed: entry, winner });
    }
  }
  return { propHistory, winners, shadowedEarlier,
    repeatedProps: Object.entries(propHistory).filter(([, h]) => h.length > 1).map(([p]) => p) };
}

const PRIORITY_PATTERNS = [
  /workspace|\.app-shell|\.app$/,
  /canvas|\.stage|\.panel-svg/,
  /sidebar/,
  /canvas-tool-rail|\.rail\b|\.inspector-rail/,
  /mobile.*dock|dock.*mobile|\.mobile-bottom-nav/,
  /template.*dialog|template-manager/,
  /export.*dialog|export-dialog/,
];
function isPriority(sel) { return PRIORITY_PATTERNS.some(p => p.test(sel)); }

const ranked = duplicated.map(([key, occs]) => {
  const analysis = analyzeSelector(occs);
  const shadowCount = analysis.shadowedEarlier.length;
  const repeatCount = analysis.repeatedProps.length;
  const score = shadowCount * 3 + repeatCount * 2 + occs.length;
  return { key, occs, analysis, score, shadowCount, repeatCount };
}).sort((a, b) => b.score - a.score);

// ════════════════════════════════════════════════════════════════
// Build shadowedPairsByRule
// ════════════════════════════════════════════════════════════════
const shadowedPairsByRule = new Map();
for (const { key, occs, analysis } of ranked) {
  const nonMediaOccs = occs.filter(o => !o.media).sort((a, b) => a.ruleIndex - b.ruleIndex);
  if (nonMediaOccs.length < 2) continue;
  const lastRuleIndex = nonMediaOccs[nonMediaOccs.length - 1].ruleIndex;

  for (const occ of nonMediaOccs) {
    if (occ.ruleIndex === lastRuleIndex) continue;
    const allShadowed = occ.declarations.length > 0 && occ.declarations.every(decl =>
      analysis.shadowedEarlier.some(s => s.prop === decl.prop && s.shadowed.ruleIndex === occ.ruleIndex)
    );
    if (!allShadowed) continue;

    const ri = occ.ruleIndex;
    if (!shadowedPairsByRule.has(ri)) {
      shadowedPairsByRule.set(ri, {
        ruleIndex: ri, line: occ.lineStart, section: occ.section, media: occ.media,
        fullSelector: occ.selector,
        allIndividuals: splitSelectorList(occ.selector),
        shadowed: new Set(),
        propsByIndividual: {},
      });
    }
    const entry = shadowedPairsByRule.get(ri);
    entry.shadowed.add(occ.individualSelector);
    // Rich prop data including winner reference for each shadowed prop
    entry.propsByIndividual[occ.individualSelector] = occ.declarations
      .filter(decl => analysis.shadowedEarlier.some(s => s.prop === decl.prop && s.shadowed.ruleIndex === occ.ruleIndex))
      .map(decl => {
        const w = analysis.winners[decl.prop]?.winner ?? null;
        return {
          prop: decl.prop,
          shadowedValue: decl.value,
          shadowedImportant: decl.important,
          winner: w ? { ruleIndex: w.ruleIndex, lineStart: w.lineStart, value: w.value, important: w.important, section: w.section } : null,
        };
      });
  }
}

// ════════════════════════════════════════════════════════════════
// Classify candidates via pure function
// ════════════════════════════════════════════════════════════════
const { wholeRuleCandidates, selectorListItemCandidates } = classifyDeletionCandidates(shadowedPairsByRule);

// ════════════════════════════════════════════════════════════════
// Regression guards on production output
// ════════════════════════════════════════════════════════════════
for (const c of wholeRuleCandidates) {
  for (const s of c.allIndividuals) {
    if (!c.shadowed.has(s)) {
      console.error(`REGRESSION: whole-rule candidate rule #${c.ruleIndex} has un-shadowed selector: ${s}`);
      process.exit(1);
    }
  }
}
for (const c of selectorListItemCandidates) {
  if (wholeRuleCandidates.some(w => w.ruleIndex === c.ruleIndex)) {
    console.error(`REGRESSION: rule #${c.ruleIndex} appears in both whole-rule and item-removal lists`);
    process.exit(1);
  }
}

// ════════════════════════════════════════════════════════════════
// Emit JSON sidecar (complete — all candidates)
// ════════════════════════════════════════════════════════════════
function serializeEntry(c) {
  return {
    ruleIndex: c.ruleIndex,
    lineStart: c.line,
    section: c.section,
    media: c.media ?? null,
    fullSelector: c.fullSelector,
    allIndividuals: c.allIndividuals,
    shadowedIndividuals: [...c.shadowed],
    propsByIndividual: c.propsByIndividual,
  };
}
function serializeItemEntry(c) {
  return {
    ruleIndex: c.ruleIndex,
    lineStart: c.line,
    section: c.section,
    media: c.media ?? null,
    fullSelector: c.fullSelector,
    allIndividuals: c.allIndividuals,
    shadowedIndividual: c.individual,
    unshadowedSiblings: c.siblings,
    props: c.props,
    propDetail: c.propsByIndividual[c.individual] || [],
  };
}

const jsonPayload = {
  generatedAt: new Date().toISOString(),
  sourceFile: "styles.css",
  stats: {
    totalLines: raw.split("\n").length,
    rawRulesParsed: rules.length,
    expandedEntries: totalExpandedEntries,
    uniqueSelKeys: Object.keys(bySelector).length,
    duplicatedSelKeys: duplicated.length,
    importantCount,
    shadowedDeclarations: ranked.reduce((n, r) => n + r.shadowCount, 0),
    wholeRuleCandidateCount: wholeRuleCandidates.length,
    selectorListItemCandidateCount: selectorListItemCandidates.length,
  },
  wholeRuleCandidates: wholeRuleCandidates.map(serializeEntry),
  selectorListItemCandidates: selectorListItemCandidates.map(serializeItemEntry),
};

const jsonPath = path.resolve(__dirname, "../design-review/css-cascade-audit.json");
fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
fs.writeFileSync(jsonPath, JSON.stringify(jsonPayload, null, 2) + "\n");

// Verify JSON round-trips cleanly
const parsed = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
if (parsed.wholeRuleCandidates.length !== wholeRuleCandidates.length ||
    parsed.selectorListItemCandidates.length !== selectorListItemCandidates.length) {
  console.error("REGRESSION: JSON sidecar candidate counts do not match in-memory counts");
  process.exit(1);
}

// ════════════════════════════════════════════════════════════════
// Build text report
// ════════════════════════════════════════════════════════════════
const PREVIEW_LIMIT = 15;
const out = [];
const p = s => out.push(String(s));

p("═══════════════════════════════════════════════════════════════");
p("CSS CASCADE AUDIT — styles.css");
p("═══════════════════════════════════════════════════════════════");
p(`Total lines              : ${raw.split("\n").length}`);
p(`Raw rules parsed         : ${rules.length}`);
p(`Expanded entries         : ${totalExpandedEntries}  (after selector-list expansion)`);
p(`Unique sel keys          : ${Object.keys(bySelector).length}`);
p(`Duplicated sel keys      : ${duplicated.length}`);
p(`!important count         : ${importantCount}`);
p(`Shadowed declarations    : ${ranked.reduce((n, r) => n + r.shadowCount, 0)}`);
p(`Whole-rule del. cands.   : ${wholeRuleCandidates.length}`);
p(`Sel-list item rem. cands.: ${selectorListItemCandidates.length}`);
p(`Full candidate list      : design-review/css-cascade-audit.json`);
p("");

p("── TOP 20 WORST DUPLICATED SELECTORS ──────────────────────────");
for (let i = 0; i < Math.min(20, ranked.length); i++) {
  const { key, occs, analysis, score, shadowCount, repeatCount } = ranked[i];
  p(`\n${i + 1}. [score:${score}] ${key}${isPriority(key) ? " ★" : ""}`);
  p(`   Occurrences   : ${occs.length}  (lines ${occs.map(o => o.lineStart).join(", ")})`);
  p(`   Rule indices  : ${occs.map(o => o.ruleIndex).join(", ")}`);
  p(`   Sections      : ${[...new Set(occs.map(o => o.section))].join(" → ")}`);
  p(`   Repeated props: ${repeatCount}  Shadowed earlier: ${shadowCount}`);
  if (analysis.repeatedProps.length)
    p(`   Props list    : ${analysis.repeatedProps.slice(0, 10).join(", ")}${analysis.repeatedProps.length > 10 ? "…" : ""}`);
  for (const prop of analysis.repeatedProps.slice(0, 6)) {
    const { winner, history } = analysis.winners[prop];
    p(`     ${prop}: ${winner.value}${winner.important ? " !important" : ""} (rule #${winner.ruleIndex} line ${winner.lineStart}, ${history.length} decls)`);
  }
  if (analysis.repeatedProps.length > 6) p(`     … and ${analysis.repeatedProps.length - 6} more`);
}

p("\n── PRIORITY UI AREAS WITH DUPLICATES ──────────────────────────");
const priorityDups = ranked.filter(r => isPriority(r.key));
p(`Found ${priorityDups.length} priority selectors with duplicates`);
for (const { key, occs, shadowCount } of priorityDups.slice(0, 20)) {
  p(`  ${key}`);
  p(`    ${occs.length} occs @ lines ${occs.map(o => o.lineStart).join(", ")} | ${shadowCount} shadowed`);
}

p(`\n── WHOLE-RULE DELETION CANDIDATES (preview ${PREVIEW_LIMIT}/${wholeRuleCandidates.length}) ───`);
p("(safe to delete entire rule: every selector shadowed — see JSON for complete list)");
for (const c of wholeRuleCandidates.slice(0, PREVIEW_LIMIT)) {
  p(`  Rule #${c.ruleIndex} line ${c.line} [${c.section}]`);
  p(`    Full rule: ${c.fullSelector}`);
  p(`    All shadowed: ${c.allIndividuals.join(", ")}`);
}
if (wholeRuleCandidates.length > PREVIEW_LIMIT)
  p(`  … and ${wholeRuleCandidates.length - PREVIEW_LIMIT} more in design-review/css-cascade-audit.json`);

p(`\n── SELECTOR-LIST ITEM REMOVAL CANDIDATES (preview ${PREVIEW_LIMIT}/${selectorListItemCandidates.length}) ───`);
p("(only THIS selector is shadowed — do NOT delete the whole rule — see JSON for full list)");
for (const c of selectorListItemCandidates.slice(0, PREVIEW_LIMIT)) {
  p(`  Rule #${c.ruleIndex} line ${c.line} [${c.section}]`);
  p(`    Full rule:         ${c.fullSelector}`);
  p(`    Shadowed selector: ${c.individual}`);
  p(`    Unshadowed siblings: ${c.siblings.join(", ")}`);
  p(`    NOTE: Do not delete the whole rule; only the individual selector may be removed.`);
}
if (selectorListItemCandidates.length > PREVIEW_LIMIT)
  p(`  … and ${selectorListItemCandidates.length - PREVIEW_LIMIT} more in design-review/css-cascade-audit.json`);

p("\n── SECTIONS × DUPLICATE COUNTS ────────────────────────────────");
const sectionCounts = {};
for (const r of ranked) for (const occ of r.occs)
  sectionCounts[occ.section] = (sectionCounts[occ.section] || 0) + 1;
for (const [sec, cnt] of Object.entries(sectionCounts).sort((a, b) => b[1] - a[1]).slice(0, 20))
  p(`  ${cnt.toString().padStart(4)}  ${sec}`);

const report = out.join("\n");

if (report.includes("undefined")) {
  const hits = report.split("\n").filter(l => l.includes("undefined")).slice(0, 5);
  console.error("REGRESSION: report contains 'undefined':\n" + hits.join("\n"));
  process.exit(1);
}

console.log(report);

const reportPath = path.resolve(__dirname, "../design-review/css-cascade-audit.txt");
fs.writeFileSync(reportPath, report + "\n");
console.error(`\nReport  → ${reportPath}`);
console.error(`JSON    → ${jsonPath}`);
