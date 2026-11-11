# Animal Sample Size Calculator · محاسبه‌گر حجم نمونه مطالعات حیوانی

Free, open-source, bilingual (فارسی / English) calculator for sample size in animal (pre-clinical) studies using the **resource equation** approach.
Every result shows the formula with your numbers substituted, the source paper, and a ready-to-paste “Methods” paragraph.

**Live use:** open `index.html` in any browser (works offline except fonts), or enable GitHub Pages (Settings → Pages → Branch `main`, folder `/root`).

## Method

| Study type | Method / formula | Source |
|---|---|---|
| Exploratory, SD and effect size unknown | Resource equation: error DF E between 10–20. One-way: n = 10/k+1 … 20/k+1; repeated (1 group): N = 10/(r−1)+1 … 20/(r−1)+1; groups × repeated: n = 10/(kr)+1 … 20/(kr)+1; ×r if animals are sacrificed at each time point | Mead 1988; Festing & Altman 2002; Arifin & Zahiruddin 2017 |
| Attrition | n′ = n / (1 − attrition) | Charan & Kantharia 2013 |

## Validation (`npm test`)
Reproduces the Arifin & Zahiruddin 2017 worked example (k = 3, r = 4) and checks the one-way, repeated-measures and attrition formulas.

## Develop
```bash
npm install
npm run dev      # local dev server
npm run build    # single-file build in build/index.html → copy to repo root
npm test
```

## References
1. Arifin WN, Zahiruddin WM. Sample size calculation in animal studies using resource equation approach. Malays J Med Sci. 2017;24(5):101–105. doi:10.21315/mjms2017.24.5.11
2. Charan J, Kantharia ND. How to calculate sample size in animal studies? J Pharmacol Pharmacother. 2013;4(4):303–306. doi:10.4103/0976-500X.119726
3. Festing MFW, Altman DG. Guidelines for the design and statistical analysis of experiments using laboratory animals. ILAR J. 2002;43(4):244–258. doi:10.1093/ilar.43.4.244
4. Mead R, Gilmour SG, Mead A. Statistical Principles for the Design of Experiments. Cambridge University Press; 2012. doi:10.1017/CBO9781139020879
5. Percie du Sert N, et al. The ARRIVE guidelines 2.0. PLoS Biol. 2020;18(7):e3000410. doi:10.1371/journal.pbio.3000410

---

## فارسی
ابزار رایگان و متن‌باز برای محاسبه حجم نمونه در مطالعات حیوانی به روش **معادله منابع** (Resource Equation)، مناسب مطالعات اکتشافی که SD و اندازه اثر نامعلوم است؛ همراه با تصحیح ریزش. برای هر نتیجه فرمول با اعداد شما، منبع علمی و متن آماده بخش «روش کار» پروپوزال نمایش داده می‌شود.

**استفاده:** فایل `index.html` را در مرورگر باز کنید یا GitHub Pages را فعال کنید.

> این ابزار جایگزین مشاوره آماری نیست. حجم نمونه را پیش از شروع مطالعه تعیین و طبق ARRIVE 2.0 گزارش کنید.
