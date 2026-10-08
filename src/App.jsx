/*
  SUBJECT: Free, open-source sample size calculator for animal studies (Persian-first, bilingual FA/EN),
  audience: Iranian graduate students & preclinical researchers writing proposals / ethics forms.
  Single job: pick the study design → get a defensible N with the formula and citation shown.

  DESIGN PLAN — borrowed from the rodent CAGE CARD clipped to every lab cage:
  coloured top band, terse typed fields, a big hand-written count.
  Type: Vazirmatn (Persian) + Source Sans 3 600 (Latin headings) + Source Code Pro (formulas, numbers).
  Color: steel paper #eef1f5 · card #fbfcfd · ink #1d2740 · lab-tape orange #e35e28 (lead) ·
         attrition teal #1c9d7c · rule #d9dee6
  Layout: [design index] [inputs] [cage card result]   (mirrors in RTL)
  Signature: the result is a cage card: each animal is a tiny mouse glyph, one row per group,
  teal mice = the attrition buffer. The count is felt, not just read.
*/
import { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { METHODS } from "./methods.js";
import { REFS } from "./refs.js";
import { T } from "./i18n.js";
import "./styles.css";

const toLatin = (s) => String(s).replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/٫/g, ".");
const num = (s) => { const v = parseFloat(toLatin(s)); return Number.isFinite(v) ? v : NaN; };

function Mouse({ kind, i }) {
  const fill = kind === "buffer" ? "var(--buffer)" : kind === "range" ? "none" : "var(--ink)";
  const stroke = kind === "range" ? "var(--muted)" : "none";
  return (
    <motion.svg
      viewBox="0 0 24 14" width="22" height="13" className="mouse"
      initial={{ opacity: 0, y: 4, scale: 0.6 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: Math.min(i * 0.012, 0.6), type: "spring", stiffness: 420, damping: 22 }}
      aria-hidden="true"
    >
      <path d="M1 9 C 2.5 12, 5 12, 6.5 10" fill="none" stroke={kind === "range" ? "var(--muted)" : fill} strokeWidth="1.2" strokeLinecap="round" />
      <ellipse cx="13" cy="8" rx="7" ry="4.6" fill={fill} stroke={stroke} strokeWidth="1" />
      <circle cx="18.5" cy="4" r="2.2" fill={fill} stroke={stroke} strokeWidth="1" />
      <circle cx="21.5" cy="8.6" r="0.9" fill={kind === "range" ? "var(--muted)" : fill} />
    </motion.svg>
  );
}

function Cage({ res, t, fmt }) {
  const rows = Math.min(res.groups, 12);
  const per = res.per, base = res.base;
  const max = res.range ? res.range.max : per;
  const condensed = max > 60 || res.groups > 12;
  const showPer = Math.min(max, 60);
  return (
    <div className="cage" aria-label={`${res.total} ${t.total}`}>
      {Array.from({ length: rows }).map((_, g) => (
        <div className="cage-row" key={g}>
          <span className="cage-label">{res.groups > 1 ? `${t.group} ${fmt(g + 1)}` : "N"}</span>
          <div className="cage-mice">
            {Array.from({ length: showPer }).map((_, i) => {
              const kind = i < Math.min(base, showPer) ? "base" : i < per ? "buffer" : "range";
              return <Mouse key={i} kind={kind} i={g * showPer + i} />;
            })}
          </div>
        </div>
      ))}
      {condensed && <p className="cage-note">{t.tooMany}</p>}
    </div>
  );
}

function Field({ f, value, onChange, lang, t }) {
  if (f.type === "bool") {
    const label = f.label === "nonpar" ? t.nonpar : f.label === "cc" ? t.cc : t.sacrifice;
    return (
      <label className="check">
        <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
        <span className="box" aria-hidden="true" />
        <span>{label}</span>
      </label>
    );
  }
  if (f.type === "select") {
    return (
      <div className="field">
        <span className="flabel">{f.label[lang]}</span>
        <div className="seg" role="radiogroup">
          {f.options.map((o) => (
            <button type="button" role="radio" aria-checked={value === o.v} key={o.v} className={value === o.v ? "on" : ""} onClick={() => onChange(o.v)}>{o[lang]}</button>
          ))}
        </div>
      </div>
    );
  }
  return (
    <label className="field">
      <span className="flabel">{f.label[lang]}</span>
      <input className="inp" dir="ltr" inputMode={f.type === "text" ? "text" : "decimal"} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function Calc({ lang, t, fmt }) {
  const [mid, setMid] = useState("re");
  const [vals, setVals] = useState(() => Object.fromEntries(METHODS.map((m) => [m.id, Object.fromEntries(Object.entries(m.defaults).map(([k, v]) => [k, typeof v === "number" ? String(v) : v]))])));
  const [glob, setGlob] = useState({ alpha: "0.05", power: "80", sides: 2, attr: "10" });
  const [copied, setCopied] = useState(false);
  const m = METHODS.find((x) => x.id === mid);
  const v = vals[mid];

  const res = useMemo(() => {
    const parsed = {};
    for (const f of m.fields) {
      const raw = v[f.key];
      parsed[f.key] = f.type === "num" || f.type === "int" ? num(raw) : raw;
      if (f.type === "int") parsed[f.key] = Math.round(parsed[f.key]);
      if ((f.type === "num" || f.type === "int") && !(f.hide && f.hide(v)) && !Number.isFinite(parsed[f.key])) return null;
      if (f.type === "int" && f.min && !(f.hide && f.hide(v)) && parsed[f.key] < f.min) return null;
    }
    const g = { alpha: num(glob.alpha), power: num(glob.power) / 100, sides: m.sidesFixed ? 2 : glob.sides, attr: num(glob.attr) || 0 };
    if (!(g.alpha > 0 && g.alpha < 0.5 && g.power > 0.5 && g.power < 1 && g.attr >= 0 && g.attr < 90)) return null;
    if (m.id === "t2" && !(parsed.sd > 0 && parsed.diff !== 0)) return null;
    if (m.id === "paired" && !(parsed.sdDiff > 0 && parsed.diff !== 0)) return null;
    if (m.id === "anova" && parsed.mode === "means" && !(parsed.sd > 0)) return null;
    try { const r = m.compute(parsed, g, lang); return r && Number.isFinite(r.total) && r.total < 1e6 ? r : null; } catch { return null; }
  }, [m, v, glob, lang]);

  const set = (k, val) => setVals((s) => ({ ...s, [mid]: { ...s[mid], [k]: val } }));
  const copy = async () => {
    if (!res) return;
    try { await navigator.clipboard.writeText(res.text); } catch {
      const ta = document.createElement("textarea"); ta.value = res.text; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove();
    }
    setCopied(true); setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="grid-main">
      <nav className="index" aria-label="designs">
        {METHODS.map((x) => (
          <button key={x.id} className={`tab ${x.id === mid ? "on" : ""}`} onClick={() => setMid(x.id)} type="button">
            <span className="tname">{x.name[lang]}</span>
            <span className="twhen">{x.when[lang]}</span>
          </button>
        ))}
      </nav>

      <section className="inputs">
        <h2 className="mtitle">{m.name[lang]}</h2>
        <p className="mwhen">{m.when[lang]}</p>
        <div className="fields">
          {m.fields.filter((f) => !(f.hide && f.hide(v))).map((f) => (
            <Field key={f.key} f={f} value={v[f.key]} onChange={(val) => set(f.key, val)} lang={lang} t={t} />
          ))}
        </div>
        <div className="globals">
          {m.usesPower && (
            <div className="grow2">
              <label className="field"><span className="flabel">{t.alpha}</span><input className="inp" dir="ltr" inputMode="decimal" value={glob.alpha} onChange={(e) => setGlob({ ...glob, alpha: e.target.value })} /></label>
              <label className="field"><span className="flabel">{t.power} %</span><input className="inp" dir="ltr" inputMode="decimal" value={glob.power} onChange={(e) => setGlob({ ...glob, power: e.target.value })} /></label>
            </div>
          )}
          {m.usesPower && !m.sidesFixed && m.id !== "detect" && (
            <div className="field">
              <span className="flabel">{t.sides}</span>
              <div className="seg" role="radiogroup">
                {[2, 1].map((s) => <button type="button" role="radio" aria-checked={glob.sides === s} key={s} className={glob.sides === s ? "on" : ""} onClick={() => setGlob({ ...glob, sides: s })}>{s === 2 ? t.two : t.one}</button>)}
              </div>
            </div>
          )}
          <label className="field"><span className="flabel">{t.attr}</span><input className="inp" dir="ltr" inputMode="decimal" value={glob.attr} onChange={(e) => setGlob({ ...glob, attr: e.target.value })} /></label>
        </div>
      </section>

      <section className="card" aria-live="polite">
        <div className="band"><span>{m.name[lang]}</span><span className="band-meta" dir="ltr">{m.usesPower ? `α ${glob.alpha} · 1−β ${glob.power}%` : "E = 10–20"}</span></div>
        {res ? (
          <div className="card-body">
            <div className="bignum-row">
              <motion.span key={`${mid}-${res.total}-${res.range?.totalMax}`} className="bignum" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}>
                {res.range && res.range.totalMax !== res.range.totalMin ? <>{fmt(res.range.totalMin)}<span className="dash">–</span>{fmt(res.range.totalMax)}</> : fmt(res.total)}
              </motion.span>
              <span className="bigcap">{t.total}</span>
            </div>
            <p className="pergroup">
              <b>{res.range && res.range.max !== res.range.min ? `${fmt(res.range.min)}–${fmt(res.range.max)}` : fmt(res.per)}</b> {t.perGroup}
              {res.groups > 1 && <> × {fmt(res.groups)} {t.groups}</>}
            </p>
            <Cage res={res} t={t} fmt={fmt} />
            <div className="legend">
              <span><i className="lg base" />{t.base} {fmt(res.base)}</span>
              {res.per > res.base && <span><i className="lg buffer" />{t.buffer} +{fmt(res.per - res.base)}</span>}
              {res.range && res.range.max > res.range.min && <span><i className="lg range" />{t.range}</span>}
              {res.extra?.map((e) => <span key={e.k}>{e.k}: <b dir="ltr">{e.v}</b></span>)}
            </div>
            <div className="formula" dir="ltr">
              {res.lines.map((l, i) => <div key={i}>{l}</div>)}
            </div>
            <div className="srcs">
              {res.refs.map((r) => <span key={r} className="src">{REFS[r].cite.split(".")[0].replace(/,.*$/, "")} {REFS[r].cite.match(/(19|20)\d\d/)?.[0]}</span>)}
            </div>
            <button type="button" className="copy" onClick={copy}>{copied ? t.copied : t.copy}</button>
          </div>
        ) : (
          <div className="card-body empty">{t.invalid}</div>
        )}
      </section>
    </div>
  );
}

function Refs({ lang, t }) {
  return (
    <div className="refs">
      <div className="refs-methods">
        {METHODS.map((m) => {
          const r = m.compute(Object.fromEntries(Object.entries(m.defaults).map(([k, v]) => [k, typeof v === "string" && m.fields.find((f) => f.key === k)?.type !== "text" && m.fields.find((f) => f.key === k)?.type !== "select" ? Number(v) : v])), { alpha: 0.05, power: 0.8, sides: 2, attr: 0 }, lang);
          return (
            <article key={m.id} className="rm">
              <h3>{m.name[lang]}</h3>
              <p className="mwhen">{m.when[lang]}</p>
              <div className="formula small" dir="ltr">{r.lines[0]}</div>
              <p className="rm-src" dir="ltr">{r.refs.map((k) => REFS[k].cite.split(".")[0].replace(/,.*$/, "") + " " + (REFS[k].cite.match(/(19|20)\d\d/)?.[0] || "")).join(" · ")}</p>
            </article>
          );
        })}
      </div>
      <h2 className="mtitle">{t.refsTitle}</h2>
      <p className="mwhen">{t.refsLead}</p>
      <ol className="reflist" dir="ltr">
        {Object.values(REFS).map((r) => (
          <li key={r.cite}>{r.cite} {r.doi && <a href={`https://doi.org/${r.doi}`} target="_blank" rel="noreferrer">doi:{r.doi}</a>}</li>
        ))}
      </ol>
    </div>
  );
}

export default function App() {
  const [lang, setLang] = useState("fa");
  const [tab, setTab] = useState("calc");
  const t = T[lang];
  const fmt = (n) => (lang === "fa" ? Number(n).toLocaleString("fa-IR") : Number(n).toLocaleString("en-US"));
  useEffect(() => { document.documentElement.dir = t.dir; document.documentElement.lang = lang; }, [lang, t.dir]);
  return (
    <div className={`app ${lang}`} dir={t.dir}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;700;800&family=Source+Sans+3:wght@400;600;700&family=Source+Code+Pro:wght@400;500;600&display=swap" />
      <header className="top">
        <div className="brand">
          <h1>{t.title}</h1>
          <span className="sub">{t.subtitle}</span>
        </div>
        <div className="topnav">
          <button type="button" className={tab === "calc" ? "on" : ""} onClick={() => setTab("calc")}>{t.tabCalc}</button>
          <button type="button" className={tab === "refs" ? "on" : ""} onClick={() => setTab("refs")}>{t.tabRefs}</button>
          <button type="button" className="lang" onClick={() => setLang(lang === "fa" ? "en" : "fa")} aria-label="language">{t.lang}</button>
        </div>
      </header>
      <main>{tab === "calc" ? <Calc lang={lang} t={t} fmt={fmt} /> : <Refs lang={lang} t={t} />}</main>
      <footer className="foot"><span>{t.honest}</span><span dir="ltr">{t.footer}</span></footer>
    </div>
  );
}
