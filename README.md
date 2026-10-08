# Animal Sample Size Calculator · محاسبه‌گر حجم نمونه مطالعات حیوانی

Free, open-source, bilingual (فارسی / English) calculator for sample size in animal (pre-clinical) studies.
Every result shows the formula with your numbers substituted, the source paper, and a ready-to-paste “Methods” paragraph.

**Live use:** open `index.html` in any browser (works offline except fonts), or enable GitHub Pages (Settings → Pages → Branch `main`, folder `/root`).

## Methods

| Study type | Method / formula | Source |
|---|---|---|
| Exploratory, SD unknown | Resource equation: error DF E between 10–20. One-way: n = 10/k+1 … 20/k+1; repeated (1 group): N = 10/(r−1)+1 … 20/(r−1)+1; groups × repeated: n = 10/(kr)+1 … 20/(kr)+1; ×r if animals are sacrificed at each time point | Mead 1988; Festing & Altman 2002; Arifin & Zahiruddin 2017 |
| Two independent means (t-test) | n = 2·SD²·(Z₁₋α/2+Z₁₋β)²/d², plus exact noncentral-t solution (matches G*Power) | Charan & Kantharia 2013; Dell et al. 2002; Faul et al. 2007 |
| Paired / before–after | n = SD_d²·(Z₁₋α/2+Z₁₋β)²/d², exact noncentral t | Dell et al. 2002 |
| ≥3 groups (one-way ANOVA) | Cohen’s f (from means + SD), noncentral F, λ = f²N | Cohen 1988; Faul et al. 2007 |
| Two proportions (mortality, incidence) | Fleiss formula ± continuity correction; Charan simplified form shown for comparison | Fleiss et al. 2003; Charan & Kantharia 2013 |
| Survival (log-rank) | Events E = 4(Z₁₋α/2+Z₁₋β)²/(ln HR)², N = E/P(event) | Schoenfeld 1983 |
| Correlation | n = [(Z₁₋α/2+Z₁₋β)/C]²+3, C = ½ln[(1+r)/(1−r)] | Hulley et al. 2013 |
| Detect ≥1 event (pilot/safety) | n = ln(1−conf)/ln(1−p) | Hanley & Lippman-Hand 1983 |
| Non-parametric option | n / ARE (0.864) | Lehmann 1975 |
| Attrition (all methods) | n′ = n / (1 − attrition) | Charan & Kantharia 2013 |

## Validation (`npm test`)
Reproduces: Arifin & Zahiruddin 2017 worked example; Charan & Kantharia 2013 examples (6.1 rats/group; 14.3 for 0.4 vs 0.9); G*Power for d = 0.96 → 19/group, paired dz = 0.5 → 34, ANOVA f = 0.25, k = 3 → N = 159; Schoenfeld HR 0.5 → 66 events. Distributions (noncentral t via Lenth AS 243, noncentral F via Poisson mixture) agree with SciPy to ~1e-8.

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
4. Dell RB, Holleran S, Ramakrishnan R. Sample size determination. ILAR J. 2002;43(4):207–213. doi:10.1093/ilar.43.4.207
5. Mead R, Gilmour SG, Mead A. Statistical Principles for the Design of Experiments. Cambridge University Press; 2012. doi:10.1017/CBO9781139020879
6. Cohen J. Statistical Power Analysis for the Behavioral Sciences. 2nd ed. Lawrence Erlbaum; 1988.
7. Faul F, Erdfelder E, Lang AG, Buchner A. G*Power 3. Behav Res Methods. 2007;39(2):175–191. doi:10.3758/BF03193146
8. Fleiss JL, Levin B, Paik MC. Statistical Methods for Rates and Proportions. 3rd ed. Wiley; 2003.
9. Schoenfeld DA. Sample-size formula for the proportional-hazards regression model. Biometrics. 1983;39(2):499–503. doi:10.2307/2531021
10. Hulley SB, et al. Designing Clinical Research. 4th ed. LWW; 2013.
11. Lehmann EL. Nonparametrics: Statistical Methods Based on Ranks. Holden-Day; 1975.
12. Hanley JA, Lippman-Hand A. If nothing goes wrong, is everything all right? JAMA. 1983;249(13):1743–1745.
13. Percie du Sert N, et al. The ARRIVE guidelines 2.0. PLoS Biol. 2020;18(7):e3000410. doi:10.1371/journal.pbio.3000410
14. Zhang X, Hartmann P. How to calculate sample size in animal and human studies. Front Med. 2023;10:1215927. doi:10.3389/fmed.2023.1215927
15. Lenth RV. Algorithm AS 243. J R Stat Soc C. 1989;38(1):185–189. doi:10.2307/2347693

---

## فارسی
ابزار رایگان و متن‌باز برای محاسبه حجم نمونه در مطالعات حیوانی. هشت روش (معادله منابع، دو میانگین مستقل، زوجی، ANOVA، دو نسبت، بقا، همبستگی، مشاهده حداقل یک مورد) به‌همراه تصحیح ریزش و گزینه ناپارامتری. برای هر نتیجه فرمول با اعداد شما، منبع علمی و متن آماده بخش «روش کار» پروپوزال نمایش داده می‌شود.

**استفاده:** فایل `index.html` را در مرورگر باز کنید یا GitHub Pages را فعال کنید.

> این ابزار جایگزین مشاوره آماری نیست. حجم نمونه را پیش از شروع مطالعه تعیین و طبق ARRIVE 2.0 گزارش کنید.
