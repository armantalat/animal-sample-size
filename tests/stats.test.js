// Validation against published examples. Run: npm test
import test from "node:test";
import assert from "node:assert/strict";
import * as S from "../src/stats.js";

test("resource equation, Arifin & Zahiruddin 2017 example (k=3, r=4)", () => {
  const r = S.resourceEquation({ design: "mixed", k: 3, r: 4, sacrifice: false });
  assert.equal(r.nMin, 2); assert.equal(r.nMax, 2);
});
test("resource equation, one-way, k = 4 → 3 to 6 per group", () => {
  const r = S.resourceEquation({ design: "oneway", k: 4, r: 3, sacrifice: false });
  assert.equal(r.nMin, 4); assert.equal(r.nMax, 6);
});
test("resource equation, repeated measures (1 group, r = 5) → N = 4 to 6", () => {
  const r = S.resourceEquation({ design: "within", k: 1, r: 5, sacrifice: false });
  assert.equal(r.nMin, 4); assert.equal(r.nMax, 6);
});
test("attrition 10% inflates n / 0.9, rounded up", () => {
  assert.equal(S.attrition(10, 10), 12);
});
