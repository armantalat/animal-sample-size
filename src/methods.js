import * as S from "./stats.js";

const f2 = (v, d = 2) => (Number.isFinite(v) ? Number(v.toFixed(d)).toString() : "—");

function attrLine(base, g) {
  return g.attr > 0 ? `n′ = n / (1 − ${g.attr / 100}) = ${base} / ${f2(1 - g.attr / 100)} = ${f2(base / (1 - g.attr / 100))} → ${S.attrition(base, g.attr)}` : null;
}
function attrText(g, fa) {
  if (!(g.attr > 0)) return "";
  return fa
    ? ` با در نظر گرفتن ${g.attr}٪ ریزش احتمالی، حجم نمونه بر (1 − ${g.attr / 100}) تقسیم شد (Charan & Kantharia, 2013).`
    : ` Allowing for ${g.attr}% expected attrition, the size was divided by (1 − ${g.attr / 100}) (Charan & Kantharia, 2013).`;
}

export const METHODS = [
  {
    id: "re",
    name: { fa: "معادله منابع", en: "Resource equation" },
    when: { fa: "مطالعه اکتشافی، SD و اندازه اثر نامعلوم", en: "Exploratory study, SD and effect size unknown" },
    usesPower: false,
    fields: [
      { key: "design", type: "select", label: { fa: "طرح آزمایش", en: "Design" }, options: [
        { v: "oneway", fa: "مقایسه گروه‌ها (ANOVA یک‌طرفه)", en: "Group comparison (one-way ANOVA)" },
        { v: "within", fa: "یک گروه، اندازه‌گیری تکراری", en: "One group, repeated measures" },
        { v: "mixed", fa: "چند گروه + اندازه‌گیری تکراری", en: "Groups × repeated measures" },
      ] },
      { key: "k", type: "int", label: { fa: "تعداد گروه‌ها (k)", en: "Number of groups (k)" }, min: 2, hide: (v) => v.design === "within" },
      { key: "r", type: "int", label: { fa: "تعداد اندازه‌گیری تکراری (r)", en: "Repeated measurements (r)" }, min: 2, hide: (v) => v.design === "oneway" },
      { key: "sacrifice", type: "bool", label: "sacrifice", hide: (v) => v.design === "oneway" },
    ],
    defaults: { design: "oneway", k: 4, r: 3, sacrifice: false },
    compute(v, g, lang) {
      const fa = lang === "fa";
      const R = S.resourceEquation(v);
      const minPer = S.attrition(R.nMin, g.attr), maxPer = S.attrition(R.nMax, g.attr);
      const den = v.design === "oneway" ? "k" : v.design === "within" ? "(r − 1)" : "k·r";
      const denV = v.design === "oneway" ? `${v.k}` : v.design === "within" ? `${v.r - 1}` : `${v.k}·${v.r}`;
      const lines = [
        v.design === "oneway" ? "E = N − k = k(n − 1),  10 ≤ E ≤ 20" : v.design === "within" ? "E = (N − 1)(r − 1),  10 ≤ E ≤ 20" : "E = k·r(n − 1),  10 ≤ E ≤ 20",
        `n_min = 10/${den} + 1 = 10/${denV} + 1 = ${f2(R.minRaw)} → ${Math.ceil(R.minRaw - 1e-9)}`,
        `n_max = 20/${den} + 1 = 20/${denV} + 1 = ${f2(R.maxRaw)} → ${Math.floor(R.maxRaw + 1e-9)}`,
      ];
      if (R.mult > 1) lines.push(`× r = ${v.r}  (${fa ? "کشتن در هر نقطه زمانی" : "sacrifice at each time point"})`);
      const al = attrLine(R.nMin, g); if (al) lines.push(al);
      const designTxt = this.fields[0].options.find((o) => o.v === v.design)[lang];
      const text = fa
        ? `حجم نمونه به روش معادله منابع (Resource Equation) تعیین شد که در آن درجه آزادی خطای ANOVA باید بین ۱۰ تا ۲۰ باشد (Festing & Altman, 2002؛ Arifin & Zahiruddin, 2017). برای طرح «${designTxt}» با ${R.groups} گروه${v.design !== "oneway" ? ` و ${v.r} بار اندازه‌گیری` : ""}، حداقل ${R.nMin} و حداکثر ${R.nMax} حیوان در هر گروه لازم است.${attrText(g, fa)} در مجموع ${minPer * R.groups} تا ${maxPer * R.groups} حیوان استفاده خواهد شد.`
        : `Sample size was determined with the resource equation approach, keeping the ANOVA error degrees of freedom between 10 and 20 (Festing & Altman, 2002; Arifin & Zahiruddin, 2017). For a “${designTxt}” design with ${R.groups} group(s)${v.design !== "oneway" ? ` and ${v.r} measurements` : ""}, ${R.nMin} to ${R.nMax} animals per group are required.${attrText(g, fa)} In total, ${minPer * R.groups}–${maxPer * R.groups} animals will be used.`;
      return {
        base: R.nMin, per: minPer, groups: R.groups, total: minPer * R.groups,
        range: { min: minPer, max: maxPer, totalMin: minPer * R.groups, totalMax: maxPer * R.groups },
        lines, text, refs: ["arifin", "festing", "mead", "charan"],
      };
    },
  },
];
