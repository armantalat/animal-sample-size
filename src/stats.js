// Statistical engine for animal-study sample size. Pure JS, no deps.
// Normal, t, F (central + noncentral) distributions, implemented from standard algorithms:
//  - Normal quantile: Acklam (2003) rational approximation + one Halley refinement
//  - Regularized incomplete beta: Lentz continued fraction (Numerical Recipes, Press et al. 2007)
//  - Noncentral t CDF: Lenth (1989) Algorithm AS 243
//  - Noncentral F CDF: Poisson mixture of incomplete beta (Johnson, Kotz & Balakrishnan 1995)

export function normCdf(x) {
  // Abramowitz-Stegun 26.2.17 via erfc with high precision (W. J. Cody style)
  return 0.5 * erfc(-x / Math.SQRT2);
}
function erfc(x) {
  const z = Math.abs(x);
  const t = 1 / (1 + 0.5 * z);
  const r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 +
    t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 +
    t * (-0.82215223 + t * 0.17087277)))))))));
  return x >= 0 ? r : 2 - r;
}
export function normInv(p) {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
  const pl = 0.02425;
  let q, r, x;
  if (p < pl) {
    q = Math.sqrt(-2 * Math.log(p));
    x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else if (p <= 1 - pl) {
    q = p - 0.5; r = q * q;
    x = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  return x;
}

export function lgamma(x) {
  const g = 7;
  const coef = [0.9999999999998099, 676.5203681218851, -1259.1392167224028, 771.3234287776531, -176.6150291621406, 12.507343278686905, -0.13857109526572012, 9.984369578019572e-6, 1.5056327351493116e-7];
  if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lgamma(1 - x);
  x -= 1;
  let a = coef[0];
  const t = x + g + 0.5;
  for (let i = 1; i < g + 2; i++) a += coef[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

function betacf(a, b, x) {
  const MAXIT = 300, EPS = 1e-14, FPMIN = 1e-300;
  let qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d; let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d; h *= d * c;
    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d; const del = d * c; h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}
export function ibeta(x, a, b) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  if (x < (a + 1) / (a + b + 2)) return bt * betacf(a, b, x) / a;
  return 1 - bt * betacf(b, a, 1 - x) / b;
}

export function tCdf(t, df) {
  const x = df / (df + t * t);
  const tail = 0.5 * ibeta(x, df / 2, 0.5);
  return t > 0 ? 1 - tail : tail;
}
export function tInv(p, df) {
  let lo = -1e3, hi = 1e3;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (tCdf(mid, df) < p) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}
export function fCdf(f, d1, d2) {
  if (f <= 0) return 0;
  return ibeta(d1 * f / (d1 * f + d2), d1 / 2, d2 / 2);
}
export function fInv(p, d1, d2) {
  let lo = 0, hi = 1e4;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (fCdf(mid, d1, d2) < p) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

// Lenth (1989) AS 243: P(T <= t) for noncentral t with df and noncentrality delta
export function nctCdf(t, df, delta) {
  const itrmax = 1000, errmax = 1e-12;
  if (df <= 0) return NaN;
  let tt = t, del = delta, negdel = false;
  if (t < 0) { negdel = true; tt = -t; del = -delta; }
  const x = tt * tt / (tt * tt + df);
  let tnc = 0;
  if (x > 0) {
    const lambda = del * del;
    let p = 0.5 * Math.exp(-0.5 * lambda);
    let q = Math.sqrt(2 / Math.PI) * p * del;
    let s = 0.5 - p;
    let a = 0.5, b = 0.5 * df;
    const rxb = Math.pow(1 - x, b);
    const albeta = 0.5 * Math.log(Math.PI) + lgamma(b) - lgamma(0.5 + b);
    let xodd = ibeta(x, a, b);
    let godd = 2 * rxb * Math.exp(a * Math.log(x) - albeta);
    let xeven = 1 - rxb;
    let geven = b * x * rxb;
    tnc = p * xodd + q * xeven;
    let en = 1;
    for (let it = 0; it < itrmax; it++) {
      a += 1;
      xodd -= godd; xeven -= geven;
      godd *= x * (a + b - 1) / a;
      geven *= x * (a + b - 0.5) / (a + 0.5);
      p *= lambda / (2 * en);
      q *= lambda / (2 * en + 1);
      s -= p; en += 1;
      tnc += p * xodd + q * xeven;
      const errbd = 2 * s * (xodd - godd);
      if (Math.abs(errbd) <= errmax && it > 2) break;
    }
  }
  tnc += normCdf(-del);
  if (negdel) tnc = 1 - tnc;
  return Math.min(1, Math.max(0, tnc));
}

// Noncentral F CDF via Poisson mixture
export function ncfCdf(f, d1, d2, lambda) {
  if (f <= 0) return 0;
  const x = d1 * f / (d1 * f + d2);
  const half = lambda / 2;
  // start at the Poisson mode and sum outward for stability
  const mode = Math.max(0, Math.floor(half));
  const logw = (j) => -half + j * Math.log(half || 1e-300) - lgamma(j + 1);
  let sum = 0;
  for (let j = mode; j < mode + 2000; j++) {
    const w = half === 0 ? (j === 0 ? 1 : 0) : Math.exp(logw(j));
    sum += w * ibeta(x, d1 / 2 + j, d2 / 2);
    if (w < 1e-14 && j > mode + 5) break;
  }
  for (let j = mode - 1; j >= 0; j--) {
    const w = half === 0 ? (j === 0 ? 1 : 0) : Math.exp(logw(j));
    sum += w * ibeta(x, d1 / 2 + j, d2 / 2);
    if (w < 1e-14) break;
  }
  return Math.min(1, Math.max(0, sum));
}

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

// 2) Two independent means — z approximation (Charan & Kantharia 2013) and exact noncentral t
export function twoMeans({ diff, sd, alpha, power, sides }) {
  const d = Math.abs(diff) / sd;
  const za = normInv(1 - alpha / sides), zb = normInv(power);
  const zN = 2 * Math.pow(za + zb, 2) / (d * d);
  let n = 2, achieved = 0;
  for (; n < 100000; n++) {
    const df = 2 * n - 2, ncp = d * Math.sqrt(n / 2);
    const tc = tInv(1 - alpha / sides, df);
    achieved = 1 - nctCdf(tc, df, ncp) + (sides === 2 ? nctCdf(-tc, df, ncp) : 0);
    if (achieved >= power) break;
  }
  return { d, za, zb, zRaw: zN, zN: ceil(zN), n, achieved };
}

// 3) Paired / before–after (one-sample t on differences)
export function pairedMeans({ diff, sdDiff, alpha, power, sides }) {
  const d = Math.abs(diff) / sdDiff;
  const za = normInv(1 - alpha / sides), zb = normInv(power);
  const zN = Math.pow(za + zb, 2) / (d * d);
  let n = 2, achieved = 0;
  for (; n < 100000; n++) {
    const df = n - 1, ncp = d * Math.sqrt(n);
    const tc = tInv(1 - alpha / sides, df);
    achieved = 1 - nctCdf(tc, df, ncp) + (sides === 2 ? nctCdf(-tc, df, ncp) : 0);
    if (achieved >= power) break;
  }
  return { d, za, zb, zRaw: zN, zN: ceil(zN), n, achieved };
}

// 4) One-way ANOVA, k groups, Cohen's f (Cohen 1988; Faul et al. 2007)
export function cohenFfromMeans(means, sd) {
  const m = means.reduce((a, b) => a + b, 0) / means.length;
  const sm = Math.sqrt(means.reduce((a, b) => a + (b - m) ** 2, 0) / means.length);
  return sm / sd;
}
export function anova({ f, k, alpha, power }) {
  let n = 2, achieved = 0;
  for (; n < 100000; n++) {
    const N = n * k, d1 = k - 1, d2 = N - k;
    const fc = fInv(1 - alpha, d1, d2);
    achieved = 1 - ncfCdf(fc, d1, d2, f * f * N);
    if (achieved >= power) break;
  }
  return { n, N: n * k, achieved, lambda: f * f * n * k };
}

// 5) Two proportions (Fleiss, Levin & Paik 2003), optional continuity correction; Charan simplified form
export function twoProps({ p1, p2, alpha, power, sides, cc }) {
  const za = normInv(1 - alpha / sides), zb = normInv(power);
  const pbar = (p1 + p2) / 2, delta = Math.abs(p1 - p2);
  const n0 = Math.pow(za * Math.sqrt(2 * pbar * (1 - pbar)) + zb * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2)), 2) / (delta * delta);
  const nCC = (n0 / 4) * Math.pow(1 + Math.sqrt(1 + 4 / (n0 * delta)), 2);
  const charan = 2 * Math.pow(za + zb, 2) * pbar * (1 - pbar) / (delta * delta);
  const raw = cc ? nCC : n0;
  return { za, zb, pbar, n0, nCC, charan, raw, n: ceil(raw) };
}

// 6) Survival / time-to-event, log-rank (Schoenfeld 1983)
export function survival({ hr, pEvent, alpha, power, sides }) {
  const za = normInv(1 - alpha / sides), zb = normInv(power);
  const events = 4 * Math.pow(za + zb, 2) / Math.pow(Math.log(hr), 2);
  const E = ceil(events);
  const N = ceil(E / pEvent);
  const n = Math.ceil(N / 2);
  return { za, zb, events, E, N, n };
}

// 7) Correlation (Fisher z; Hulley et al. 2013)
export function correlation({ r, alpha, power, sides }) {
  const za = normInv(1 - alpha / sides), zb = normInv(power);
  const C = 0.5 * Math.log((1 + r) / (1 - r));
  const raw = Math.pow((za + zb) / C, 2) + 3;
  return { za, zb, C, raw, n: ceil(raw) };
}

// 8) Detect at least one event (pilot / safety screening)
export function detectOne({ p, conf }) {
  const raw = Math.log(1 - conf) / Math.log(1 - p);
  return { raw, n: ceil(raw) };
}

export const ARE = 0.864; // Lehmann (1975) minimum asymptotic relative efficiency, Wilcoxon/Mann–Whitney vs t
export const attrition = (n, pct) => ceil(n / (1 - pct / 100));
