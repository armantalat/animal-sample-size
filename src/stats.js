// Statistical engine for the animal-study resource equation calculator. Pure JS, no deps.

const ceil = (v) => Math.ceil(v - 1e-9);

// ---------- Methods ----------

// 1) Resource equation (Mead 1988; Festing & Altman 2002; Arifin & Zahiruddin 2017)
export function resourceEquation({ design, k, r, sacrifice }) {
  let minRaw, maxRaw, denom, formula;
  if (design === "oneway") { denom = k; formula = "n = DF/k + 1"; }
  else if (design === "within") { denom = r - 1; formula = "N = DF/(r − 1) + 1"; }
  else { denom = k * r; formula = "n = DF/(k·r) + 1"; }
  minRaw = 10 / denom + 1; maxRaw = 20 / denom + 1;
  const groups = design === "within" ? 1 : k;
  let nMin = ceil(minRaw), nMax = Math.floor(maxRaw + 1e-9);
  if (nMax < nMin) nMax = nMin;
  const mult = sacrifice && design !== "oneway" ? r : 1;
  return {
    minRaw, maxRaw, nMin: nMin * mult, nMax: nMax * mult, groups, mult, formula, denom,
    totalMin: nMin * mult * groups, totalMax: nMax * mult * groups,
  };
}

export const attrition = (n, pct) => ceil(n / (1 - pct / 100));
