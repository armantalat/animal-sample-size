import * as S from "./stats.js";

const f2 = (v, d = 2) => (Number.isFinite(v) ? Number(v.toFixed(d)).toString() : "—");
const pct = (v) => `${f2(v * 100, 1)}%`;
const sidesTxt = (s, fa) => (s === 2 ? (fa ? "دوطرفه" : "two-sided") : (fa ? "یک‌طرفه" : "one-sided"));

function finish(base, groups, g, extra) {
  const per = S.attrition(base, g.attr);
  return { base, per, groups, total: per * groups, ...extra };
}
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
  {
    id: "t2",
    name: { fa: "مقایسه دو میانگین", en: "Two independent means" },
    when: { fa: "درمان در برابر کنترل، متغیر کمّی (t-test)", en: "Treatment vs control, continuous outcome (t-test)" },
    usesPower: true,
    fields: [
      { key: "diff", type: "num", label: { fa: "اختلاف میانگین مورد انتظار (d)", en: "Expected mean difference (d)" } },
      { key: "sd", type: "num", label: { fa: "انحراف معیار (SD)", en: "Standard deviation (SD)" } },
      { key: "nonpar", type: "bool", label: "nonpar" },
    ],
    defaults: { diff: 40, sd: 25, nonpar: false },
    compute(v, g, lang) {
      const fa = lang === "fa";
      const R = S.twoMeans({ ...v, ...g });
      let base = R.n;
      const lines = [
        `n = 2·SD²·(Z₁₋α/${g.sides === 2 ? "2" : "1"} + Z₁₋β)² / d²`,
        `  = 2·${v.sd}²·(${f2(R.za, 3)} + ${f2(R.zb, 3)})² / ${v.diff}² = ${f2(R.zRaw)}  (${fa ? "تقریب z" : "z approx."})`,
        `${fa ? "دقیق (t غیرمرکزی)" : "exact (noncentral t)"}: n = ${R.n},  ES = ${f2(R.d)},  ${fa ? "توان" : "power"} = ${pct(R.achieved)}`,
      ];
      if (v.nonpar) { base = Math.ceil(R.n / S.ARE); lines.push(`n / ARE = ${R.n} / 0.864 = ${f2(R.n / S.ARE)} → ${base}`); }
      const al = attrLine(base, g); if (al) lines.push(al);
      const res = finish(base, 2, g);
      res.lines = lines; res.refs = ["charan", "dell", "faul", "lenth89", ...(v.nonpar ? ["lehmann"] : [])];
      res.extra = [{ k: fa ? "اندازه اثر Cohen d" : "Cohen’s d", v: f2(R.d) }, { k: fa ? "توان واقعی" : "Achieved power", v: pct(R.achieved) }];
      res.text = fa
        ? `حجم نمونه برای مقایسه دو گروه مستقل با آزمون t ${sidesTxt(g.sides, fa)} محاسبه شد. با فرض اختلاف میانگین ${v.diff} و انحراف معیار ${v.sd} (اندازه اثر d = ${f2(R.d)})، سطح معنی‌داری ${g.alpha} و توان ${g.power * 100}٪، ${R.n} حیوان در هر گروه لازم است (Charan & Kantharia, 2013؛ Faul et al., 2007).${v.nonpar ? ` به دلیل استفاده از آزمون ناپارامتری، حجم نمونه بر کارایی نسبی ۰٫۸۶۴ تقسیم شد (${base} حیوان؛ Lehmann, 1975).` : ""}${attrText(g, fa)} در نهایت ${res.per} حیوان در هر گروه و ${res.total} حیوان در کل استفاده خواهد شد.`
        : `Sample size was calculated for a ${sidesTxt(g.sides, fa)} two-sample t-test. Assuming a mean difference of ${v.diff} and SD of ${v.sd} (d = ${f2(R.d)}), α = ${g.alpha} and ${g.power * 100}% power, ${R.n} animals per group are required (Charan & Kantharia, 2013; Faul et al., 2007).${v.nonpar ? ` Because a non-parametric test will be used, n was divided by the ARE of 0.864 (${base}; Lehmann, 1975).` : ""}${attrText(g, fa)} Final: ${res.per} animals per group, ${res.total} in total.`;
      return res;
    },
  },
  {
    id: "paired",
    name: { fa: "قبل و بعد (زوجی)", en: "Paired / before–after" },
    when: { fa: "همان حیوان قبل و بعد از مداخله", en: "Same animal before and after intervention" },
    usesPower: true,
    fields: [
      { key: "diff", type: "num", label: { fa: "میانگین تغییر مورد انتظار", en: "Expected mean change" } },
      { key: "sdDiff", type: "num", label: { fa: "SD تفاضل‌ها", en: "SD of the differences" } },
      { key: "nonpar", type: "bool", label: "nonpar" },
    ],
    defaults: { diff: 10, sdDiff: 12, nonpar: false },
    compute(v, g, lang) {
      const fa = lang === "fa";
      const R = S.pairedMeans({ ...v, ...g });
      let base = R.n;
      const lines = [
        `n = SD_d²·(Z₁₋α/${g.sides === 2 ? "2" : "1"} + Z₁₋β)² / d²`,
        `  = ${v.sdDiff}²·(${f2(R.za, 3)} + ${f2(R.zb, 3)})² / ${v.diff}² = ${f2(R.zRaw)}  (${fa ? "تقریب z" : "z approx."})`,
        `${fa ? "دقیق (t غیرمرکزی)" : "exact (noncentral t)"}: n = ${R.n},  d_z = ${f2(R.d)},  ${fa ? "توان" : "power"} = ${pct(R.achieved)}`,
      ];
      if (v.nonpar) { base = Math.ceil(R.n / S.ARE); lines.push(`n / ARE = ${R.n} / 0.864 → ${base}`); }
      const al = attrLine(base, g); if (al) lines.push(al);
      const res = finish(base, 1, g);
      res.lines = lines; res.refs = ["dell", "faul", "lenth89", ...(v.nonpar ? ["lehmann"] : [])];
      res.extra = [{ k: "d_z", v: f2(R.d) }, { k: fa ? "توان واقعی" : "Achieved power", v: pct(R.achieved) }];
      res.text = fa
        ? `برای مقایسه زوجی (قبل و بعد) با آزمون t زوجی ${sidesTxt(g.sides, fa)}، با فرض میانگین تغییر ${v.diff} و انحراف معیار تفاضل‌ها ${v.sdDiff} (d_z = ${f2(R.d)})، α = ${g.alpha} و توان ${g.power * 100}٪، ${R.n} حیوان لازم است (Dell et al., 2002؛ Faul et al., 2007).${v.nonpar ? ` با آزمون ویلکاکسون و تصحیح ARE، ${base} حیوان.` : ""}${attrText(g, fa)} حجم نهایی: ${res.per} حیوان.`
        : `For a ${sidesTxt(g.sides, fa)} paired t-test, assuming a mean change of ${v.diff} and SD of differences of ${v.sdDiff} (d_z = ${f2(R.d)}), α = ${g.alpha} and ${g.power * 100}% power, ${R.n} animals are required (Dell et al., 2002; Faul et al., 2007).${v.nonpar ? ` With Wilcoxon signed-rank and ARE correction: ${base}.` : ""}${attrText(g, fa)} Final: ${res.per} animals.`;
      return res;
    },
  },
  {
    id: "anova",
    name: { fa: "چند گروه (ANOVA)", en: "Several groups (ANOVA)" },
    when: { fa: "سه گروه یا بیشتر، متغیر کمّی", en: "Three or more groups, continuous outcome" },
    usesPower: true,
    sidesFixed: true,
    fields: [
      { key: "k", type: "int", label: { fa: "تعداد گروه‌ها (k)", en: "Number of groups (k)" }, min: 2 },
      { key: "mode", type: "select", label: { fa: "اندازه اثر از", en: "Effect size from" }, options: [
        { v: "means", fa: "میانگین گروه‌ها + SD", en: "Group means + SD" },
        { v: "f", fa: "Cohen f مستقیم", en: "Cohen’s f directly" },
      ] },
      { key: "means", type: "text", label: { fa: "میانگین‌ها (با کاما)", en: "Means (comma-separated)" }, hide: (v) => v.mode !== "means" },
      { key: "sd", type: "num", label: { fa: "SD مشترک داخل گروه", en: "Common within-group SD" }, hide: (v) => v.mode !== "means" },
      { key: "f", type: "num", label: { fa: "Cohen f (کوچک 0.1، متوسط 0.25، بزرگ 0.4)", en: "Cohen’s f (small 0.1, medium 0.25, large 0.4)" }, hide: (v) => v.mode !== "f" },
    ],
    defaults: { k: 4, mode: "means", means: "120, 105, 95, 90", sd: 15, f: 0.4 },
    compute(v, g, lang) {
      const fa = lang === "fa";
      let f = v.f, k = v.k;
      if (v.mode === "means") {
        const m = String(v.means).split(/[,،\s]+/).map(Number).filter((x) => Number.isFinite(x));
        if (m.length < 2) return null;
        k = m.length; f = S.cohenFfromMeans(m, v.sd);
      }
      if (!(f > 0) || !(k >= 2)) return null;
      const R = S.anova({ f, k, alpha: g.alpha, power: g.power });
      const lines = [
        v.mode === "means" ? `f = σ_m / σ = ${f2(f * v.sd, 3)} / ${v.sd} = ${f2(f, 3)}` : `f = ${f2(f, 3)}`,
        `λ = f²·N = ${f2(f, 3)}²·${R.N} = ${f2(R.lambda)}`,
        `F_crit(${k - 1}, ${R.N - k}; α = ${g.alpha}),  1 − β = ${pct(R.achieved)}`,
        `n = ${R.n} × k = ${k} → N = ${R.N}`,
      ];
      const al = attrLine(R.n, g); if (al) lines.push(al);
      const res = finish(R.n, k, g);
      res.lines = lines; res.refs = ["cohen", "faul", "charan", "festing"];
      res.extra = [{ k: "Cohen f", v: f2(f, 3) }, { k: fa ? "توان واقعی" : "Achieved power", v: pct(R.achieved) }];
      res.text = fa
        ? `حجم نمونه برای ANOVA یک‌طرفه با ${k} گروه محاسبه شد. با اندازه اثر Cohen f = ${f2(f, 3)}، α = ${g.alpha} و توان ${g.power * 100}٪، ${R.n} حیوان در هر گروه (کل ${R.N}) لازم است (Cohen, 1988؛ Faul et al., 2007).${attrText(g, fa)} حجم نهایی: ${res.per} حیوان در هر گروه، ${res.total} حیوان در کل.`
        : `Sample size was calculated for a one-way ANOVA with ${k} groups. With Cohen’s f = ${f2(f, 3)}, α = ${g.alpha} and ${g.power * 100}% power, ${R.n} animals per group (N = ${R.N}) are required (Cohen, 1988; Faul et al., 2007).${attrText(g, fa)} Final: ${res.per} per group, ${res.total} in total.`;
      return res;
    },
  },
  {
    id: "props",
    name: { fa: "مقایسه دو نسبت", en: "Two proportions" },
    when: { fa: "مرگ‌ومیر، بروز تومور، پاسخ بله/خیر", en: "Mortality, tumour incidence, yes/no response" },
    usesPower: true,
    fields: [
      { key: "p1", type: "num", label: { fa: "نسبت در گروه کنترل (%)", en: "Proportion, control (%)" } },
      { key: "p2", type: "num", label: { fa: "نسبت در گروه درمان (%)", en: "Proportion, treatment (%)" } },
      { key: "cc", type: "bool", label: "cc" },
    ],
    defaults: { p1: 40, p2: 90, cc: false },
    compute(v, g, lang) {
      const fa = lang === "fa";
      const p1 = v.p1 / 100, p2 = v.p2 / 100;
      if (!(p1 > 0 && p1 < 1 && p2 > 0 && p2 < 1) || p1 === p2) return null;
      const R = S.twoProps({ p1, p2, cc: v.cc, ...g });
      const lines = [
        "n = [Z₁₋α/2·√(2p̄q̄) + Z₁₋β·√(p₁q₁ + p₂q₂)]² / (p₁ − p₂)²",
        `p̄ = (${p1} + ${p2}) / 2 = ${f2(R.pbar, 3)}  →  n = ${f2(R.n0)}`,
      ];
      if (v.cc) lines.push(`n_cc = n/4·[1 + √(1 + 4/(n·|p₁−p₂|))]² = ${f2(R.nCC)}`);
      lines.push(`Charan: 2(Z₁₋α/2 + Z₁₋β)²·p̄(1−p̄)/(p₁−p₂)² = ${f2(R.charan)}`);
      const al = attrLine(R.n, g); if (al) lines.push(al);
      const res = finish(R.n, 2, g);
      res.lines = lines; res.refs = ["fleiss", "charan"];
      res.extra = [{ k: "|p₁ − p₂|", v: pct(Math.abs(p1 - p2)) }];
      res.text = fa
        ? `برای مقایسه دو نسبت (${v.p1}٪ در برابر ${v.p2}٪) با آزمون کای‌دو ${sidesTxt(g.sides, fa)}، α = ${g.alpha} و توان ${g.power * 100}٪، ${R.n} حیوان در هر گروه لازم است (Fleiss et al., 2003${v.cc ? "، با اصلاح پیوستگی" : ""}).${attrText(g, fa)} حجم نهایی: ${res.per} حیوان در هر گروه، ${res.total} در کل.`
        : `To compare two proportions (${v.p1}% vs ${v.p2}%) with a ${sidesTxt(g.sides, fa)} chi-square test, α = ${g.alpha} and ${g.power * 100}% power, ${R.n} animals per group are required (Fleiss et al., 2003${v.cc ? ", continuity-corrected" : ""}).${attrText(g, fa)} Final: ${res.per} per group, ${res.total} in total.`;
      return res;
    },
  },
  {
    id: "surv",
    name: { fa: "بقا (زمان تا رخداد)", en: "Survival (time-to-event)" },
    when: { fa: "منحنی کاپلان-مایر، آزمون لاگ‌رنک", en: "Kaplan–Meier curves, log-rank test" },
    usesPower: true,
    fields: [
      { key: "hr", type: "num", label: { fa: "نسبت خطر مورد انتظار (HR)", en: "Expected hazard ratio (HR)" } },
      { key: "pEvent", type: "num", label: { fa: "احتمال رخداد تا پایان مطالعه (%)", en: "Probability of event by study end (%)" } },
    ],
    defaults: { hr: 0.4, pEvent: 80 },
    compute(v, g, lang) {
      const fa = lang === "fa";
      if (!(v.hr > 0) || v.hr === 1 || !(v.pEvent > 0 && v.pEvent <= 100)) return null;
      const R = S.survival({ hr: v.hr, pEvent: v.pEvent / 100, ...g });
      const lines = [
        "E = 4·(Z₁₋α/2 + Z₁₋β)² / (ln HR)²",
        `  = 4·(${f2(R.za, 3)} + ${f2(R.zb, 3)})² / (ln ${v.hr})² = ${f2(R.events)} → ${R.E}`,
        `N = E / P(event) = ${R.E} / ${v.pEvent / 100} = ${R.N}  →  n = ${R.n}`,
      ];
      const al = attrLine(R.n, g); if (al) lines.push(al);
      const res = finish(R.n, 2, g);
      res.lines = lines; res.refs = ["schoenfeld"];
      res.extra = [{ k: fa ? "رخداد لازم" : "Events needed", v: String(R.E) }];
      res.text = fa
        ? `برای مقایسه بقا با آزمون لاگ‌رنک و نسبت خطر ${v.hr}، α = ${g.alpha} و توان ${g.power * 100}٪، ${R.E} رخداد لازم است (Schoenfeld, 1983). با احتمال رخداد ${v.pEvent}٪، ${R.n} حیوان در هر گروه نیاز است.${attrText(g, fa)} حجم نهایی: ${res.per} حیوان در هر گروه، ${res.total} در کل.`
        : `For a log-rank comparison with HR = ${v.hr}, α = ${g.alpha} and ${g.power * 100}% power, ${R.E} events are required (Schoenfeld, 1983). With a ${v.pEvent}% event probability, ${R.n} animals per group are needed.${attrText(g, fa)} Final: ${res.per} per group, ${res.total} in total.`;
      return res;
    },
  },
  {
    id: "corr",
    name: { fa: "همبستگی", en: "Correlation" },
    when: { fa: "رابطه دو متغیر کمّی در یک گروه", en: "Association of two measures in one group" },
    usesPower: true,
    fields: [{ key: "r", type: "num", label: { fa: "ضریب همبستگی مورد انتظار (r)", en: "Expected correlation (r)" } }],
    defaults: { r: 0.6 },
    compute(v, g, lang) {
      const fa = lang === "fa";
      if (!(Math.abs(v.r) > 0 && Math.abs(v.r) < 1)) return null;
      const R = S.correlation({ r: Math.abs(v.r), ...g });
      const lines = [
        "n = [(Z₁₋α/2 + Z₁₋β) / C]² + 3,   C = ½·ln[(1 + r)/(1 − r)]",
        `C = ${f2(R.C, 3)}  →  n = ${f2(R.raw)} → ${R.n}`,
      ];
      const al = attrLine(R.n, g); if (al) lines.push(al);
      const res = finish(R.n, 1, g);
      res.lines = lines; res.refs = ["hulley", "cohen"];
      res.text = fa
        ? `برای آشکارسازی ضریب همبستگی ${v.r} با α = ${g.alpha} (${sidesTxt(g.sides, fa)}) و توان ${g.power * 100}٪، ${R.n} حیوان لازم است (Hulley et al., 2013).${attrText(g, fa)} حجم نهایی: ${res.per} حیوان.`
        : `To detect a correlation of ${v.r} with α = ${g.alpha} (${sidesTxt(g.sides, fa)}) and ${g.power * 100}% power, ${R.n} animals are required (Hulley et al., 2013).${attrText(g, fa)} Final: ${res.per} animals.`;
      return res;
    },
  },
  {
    id: "detect",
    name: { fa: "مشاهده حداقل یک مورد", en: "Detect at least one case" },
    when: { fa: "پایلوت، غربالگری عارضه یا عفونت", en: "Pilot, adverse-effect or infection screening" },
    usesPower: false,
    fields: [
      { key: "p", type: "num", label: { fa: "شیوع/احتمال رخداد (%)", en: "Event probability (%)" } },
      { key: "conf", type: "num", label: { fa: "اطمینان مورد نظر (%)", en: "Desired confidence (%)" } },
    ],
    defaults: { p: 10, conf: 95 },
    compute(v, g, lang) {
      const fa = lang === "fa";
      if (!(v.p > 0 && v.p < 100 && v.conf > 0 && v.conf < 100)) return null;
      const R = S.detectOne({ p: v.p / 100, conf: v.conf / 100 });
      const lines = [
        "n = ln(1 − confidence) / ln(1 − p)",
        `  = ln(${f2(1 - v.conf / 100, 3)}) / ln(${f2(1 - v.p / 100, 3)}) = ${f2(R.raw)} → ${R.n}`,
        `${fa ? "قاعده ۳" : "Rule of three"}: n ≈ 3/p = ${f2(3 / (v.p / 100), 1)}`,
      ];
      const al = attrLine(R.n, g); if (al) lines.push(al);
      const res = finish(R.n, 1, g);
      res.lines = lines; res.refs = ["hanley", "festing"];
      res.text = fa
        ? `برای اینکه با اطمینان ${v.conf}٪ حداقل یک مورد از رخدادی با احتمال ${v.p}٪ مشاهده شود، ${R.n} حیوان لازم است (توزیع دوجمله‌ای؛ Hanley & Lippman-Hand, 1983).${attrText(g, fa)} حجم نهایی: ${res.per} حیوان.`
        : `To observe at least one event with probability ${v.p}% at ${v.conf}% confidence, ${R.n} animals are required (binomial; Hanley & Lippman-Hand, 1983).${attrText(g, fa)} Final: ${res.per} animals.`;
      return res;
    },
  },
];
