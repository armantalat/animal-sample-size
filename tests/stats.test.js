// Validation against published examples and G*Power 3.1. Run: npm test
import test from "node:test";
import assert from "node:assert/strict";
import * as S from "../src/stats.js";

test("resource equation, Arifin & Zahiruddin 2017 example (k=3, r=4)", () => {
  const r = S.resourceEquation({ design: "mixed", k: 3, r: 4, sacrifice: false });
  assert.equal(r.nMin, 2); assert.equal(r.nMax, 2);
});
test("two means, Charan & Kantharia 2013 example (z ≈ 6.1)", () => {
  const r = S.twoMeans({ diff: 40, sd: 25, alpha: 0.05, power: 0.8, sides: 2 });
  assert.ok(Math.abs(r.zRaw - 6.1) < 0.1);
});
test("two means exact, d = 0.96 → 19/group (Zhang & Hartmann 2023, G*Power)", () => {
  assert.equal(S.twoMeans({ diff: 0.96, sd: 1, alpha: 0.05, power: 0.8, sides: 2 }).n, 19);
});
test("paired, dz = 0.5 → 34 (G*Power)", () => {
  assert.equal(S.pairedMeans({ diff: 0.5, sdDiff: 1, alpha: 0.05, power: 0.8, sides: 2 }).n, 34);
});
test("ANOVA f = 0.25, k = 3 → N = 159 (G*Power)", () => {
  assert.equal(S.anova({ f: 0.25, k: 3, alpha: 0.05, power: 0.8 }).N, 159);
});
test("two proportions, Charan example 0.4 vs 0.9 → 14.3", () => {
  assert.ok(Math.abs(S.twoProps({ p1: 0.4, p2: 0.9, alpha: 0.05, power: 0.8, sides: 2 }).charan - 14.28) < 0.05);
});
test("Schoenfeld, HR = 0.5 → 66 events", () => {
  assert.equal(S.survival({ hr: 0.5, pEvent: 1, alpha: 0.05, power: 0.8, sides: 2 }).E, 66);
});
test("detect one, p = 10%, 95% → 29", () => {
  assert.equal(S.detectOne({ p: 0.1, conf: 0.95 }).n, 29);
});
