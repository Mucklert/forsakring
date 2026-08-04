// Named kollektivavtal ("CBA") sickness-insurance top-up presets, sourced by Task 31
// (docs/SJUKPENNING_VS_VAB.md) -- loaded as window.CBA_PRESETS, a plain data array, so the
// calculator in app.js reads every preset generically (same field shape, one calculation
// function) rather than branching per named agreement. Same discipline as
// mockup/tools/build_matrix.py's insurer-agnostic approach: a new agreement is a new array
// entry, never a new "if (id === ...)" branch.
//
// Every number here traces to a specific PRIMARY/SECONDARY source in docs/SJUKPENNING_VS_VAB.md
// -- sourceLabel/sourceUrl are shown inline in the calculator (Task 32 brief, point 5:
// "state every number's source ... visibly attributed to Task 31's sourcing"). "confidence"
// flags where Task 31 itself could not independently re-verify a figure at decimal precision
// (ITP Sjukpension) or found no tiered detail above the first band (AGS) -- rendered as a
// visible caveat, never silently smoothed over (principle 6: honest outputs).
//
// model:
//   "tiered" -- three salary bands, matching AGS-KL's own kompletteringstabell structure:
//     tier1 (up to 7,5 prisbasbelopp): topUpPct is a percentage OF THE SJUKPENNING AMOUNT
//       (this is what makes combined income land near ~90% on that portion), with a separate
//       percentage for normalnivå (days 1-364 of sjukpenning) vs fortsättningsnivå (365+).
//     tier2 (7,5-20 pbb) and tier3 (20-30 pbb): flat percentages OF THE SALARY IN THAT BAND,
//       since Försäkringskassan's own sjukpenning pays nothing above its own 8-pbb cap there.
//   "flat" -- a single percentage of the sjukpenning amount, applied up to a stated cap, with
//     no tiered detail found above that cap (AGS/base -- flagged explicitly rather than assumed).
//
// This is a calculator approximation of each agreement's real kompletteringstabell, not a
// verbatim reproduction of it -- see docs/SJUKPENNING_VS_VAB.md for the full sourcing and
// named gaps before treating any of these numbers as exact.

window.CBA_PRESETS = [
  {
    id: "ags-kl",
    name: { sv: "AGS-KL (kommun, region, Sobona, Svenska kyrkan)", en: "AGS-KL (municipality, region, Sobona, Church of Sweden)" },
    administrator: "AFA Försäkring",
    startDay: 91,
    model: "tiered",
    tier1PercentOfSjukpenningNormal: 0.12887,
    tier1PercentOfSjukpenningContinuation: 0.13746,
    tier2PercentOfSalary: 0.65,
    tier3PercentOfSalary: 0.325,
    confidence: "confirmed",
    sourceLabel: { sv: "AFA Försäkring, Avtalet försäkrar 2026", en: "AFA Försäkring, Avtalet försäkrar 2026" },
    sourceUrl: "https://www.afaforsakring.se/dokument/p8s39orvsj2a16dp32gw/f6282-avtalet-forsakrar-2026.pdf",
  },
  {
    id: "itp-sjukpension",
    name: { sv: "ITP Sjukpension (privata tjänstemän)", en: "ITP Sjukpension (private-sector salaried employees)" },
    administrator: "Collectum / Alecta",
    startDay: 91,
    model: "tiered",
    tier1PercentOfSjukpenningNormal: 0.12887,
    tier1PercentOfSjukpenningContinuation: 0.13746,
    tier2PercentOfSalary: 0.65,
    tier3PercentOfSalary: 0.325,
    confidence: "unclear",
    confidenceNote: {
      sv: "Samma modell som AGS-KL används här som approximation för ITP Sjukpension. Task 31 bekräftade samma dag-91-start och samma trappstruktur i sak, men Alectas exakta procentsatser/brytpunkter kunde inte oberoende verifieras vid decimalprecision (se docs/SJUKPENNING_VS_VAB.md, namngivna luckor).",
      en: "AGS-KL's model is used here as an approximation for ITP Sjukpension. Task 31 confirmed the same day-91 start and the same tiered structure in kind, but Alecta's exact percentages/breakpoints could not be independently re-verified at decimal precision (see docs/SJUKPENNING_VS_VAB.md, named gaps).",
    },
    sourceLabel: { sv: "Alecta, ITP Sjukpension", en: "Alecta, ITP Sjukpension" },
    sourceUrl: "https://www.alecta.se/tjanstepension/ersattning-vid-sjukdom/sa-har-mycket-far-du-fran-itp-sjukpension",
  },
  {
    id: "ags",
    name: { sv: "AGS (privat sektor, LO/arbetare — t.ex. via Fastigo, Almega eller Fremia)", en: "AGS (private sector, LO/blue-collar — e.g. via Fastigo, Almega or Fremia)" },
    administrator: "AFA Försäkring",
    startDay: 15,
    model: "flat",
    flatPercentOfSjukpenning: 0.10,
    flatCapMonthly: 37000,
    confidence: "unclear",
    confidenceNote: {
      sv: "Task 31 fann att AGS ger ungefär 10 procentenheter utöver sjukpenningen, upp till samma lönetak som AGS-KL:s första trappsteg (7,5 prisbasbelopp) — men ingen trappa för lön över den nivån hittades specifikt för AGS. Ovanför taket visas därför ingen kollektivavtalsersättning här; fråga ditt fackförbund.",
      en: "Task 31 found AGS adds roughly 10 percentage points on top of sjukpenning, up to the same salary ceiling as AGS-KL's first tier (7.5 prisbasbelopp) — but no tier for salary above that level was found specifically for AGS. Above that ceiling this calculator shows no collectively-bargained top-up; ask your union.",
    },
    sourceLabel: { sv: "AFA Försäkring / avtalat.se", en: "AFA Försäkring / avtalat.se" },
    sourceUrl: "https://www.avtalat.se/arbetare/sjukdom/avtalsgruppsjukforsakring/",
  },
];
