// mdToHtml (markdown.js) and icon (icons.js) are loaded as plain classic scripts before this
// one in index.html, not ES modules -- module imports are blocked by Chrome's CORS policy when
// the site is opened directly via file:// (confirmed: this is exactly why the page rendered
// completely blank when opened that way -- the module script failed before any render code ran,
// leaving only the static nav/footer HTML visible). Classic scripts have no such restriction and
// work identically under file:// and a real server.

const app = document.getElementById("app");

// Two distinctly-named globals, one per locale, each built by
// mockup/tools/build_content.py from content/*.md and content/en/*.md respectively.
// window.CONTENT keeps its original shape untouched (zero regression for Task 7/7c).
function C() {
  return locale === "en" ? window.CONTENT_EN : window.CONTENT;
}

// In-memory only — never persisted (localStorage, cookies, or a server write).
// Principle 5: a child's situation is GDPR Art. 9 special-category data and may
// only ever live in this tab, for this session. (The locale preference below is a UI
// setting, not situation data, so localStorage is fine for it — principle 5 doesn't apply.)
const inventoryState = { idx: 0 };

// ---------------- i18n: fixed, curated UI-chrome strings (not villkor content) ----------------
// Page titles/body text always come from content-data(.en).js — these are only the strings
// that belong to the app shell itself and have no source .md file, per Task 7d's brief.

const STRINGS = {
  sv: {
    nav: {
      home: "Hem",
      inventory: "Hitta försäkringar",
      matrix: "Min försäkring",
      claimProcess: "Anmälan",
      evidence: "Underlag",
      deadlines: "Tidsgränser",
      templates: "Mallar",
      aboutUs: "Om oss",
    },
    reviewedByLabel: "Granskat av",
    home: {
      heroTitle: "Se vad ni kan checka, kräva och dokumentera — och var det står.",
      heroLede:
        "Vi visar var ni kan ha ett skydd ni inte visste om, vad som brukar krävas för att få det " +
        "prövat, och vilka datum som inte går att skjuta upp. Om just er skada omfattas avgör " +
        "försäkringsbolagets medicinska bedömning — inte den här sidan.",
      trustTitle: "Ni loggar inte in. Vi sparar inget.",
      trustBody:
        "Inget konto, inget lösenord. Svaren ni ger här — om barnet, om vad som hänt — stannar i " +
        "den här webbläsarfliken och försvinner när ni stänger den. Vi skickar och lagrar aldrig " +
        "något om ert barns hälsa någonstans.",
      deadlineTitle: "Läs det här först, om ni bara läser en sak",
      deadlineBody:
        "En tidsgräns som passerats går inte att få tillbaka. Allt annat på sidan går att göra i morgon.",
      cards: [
        { title: "Hitta alla försäkringar", desc: "Sex frågor som visar var ni kan ha ett skydd ni inte kände till." },
        { title: "Vad ert villkor säger", desc: "Välj försäkringsbolag och produkt — se villkorets egna ord om varje ersättningsmoment." },
        { title: "Så går en anmälan till", desc: "Hela processen i ordning, från anmälan till nämnd." },
        { title: "Vad du ska samla in", desc: "Det som inte går att återskapa senare — börja i kväll." },
        { title: "Brev och meddelanden", desc: "Färdiga mallar att kopiera och skicka." },
        { title: "Sjukpenning eller VAB", desc: "Räkna på vad det skulle betyda för er ekonomi om en förälder blev sjukskriven i stället för att vabba." },
        { title: "Merkostnadsersättning från Försäkringskassan", desc: "Vad som räknas som en merkostnad, de fem nivåerna i kronor, och hur ni ansöker." },
        { title: "Omvårdnadsbidrag från Försäkringskassan", desc: "De fyra nivåerna i kronor, hur nivån faktiskt avgörs, och vad domstolar sagt om enskilda gränsfall." },
      ],
      govSectionTitle: "Statligt stöd",
    },
    matrix: {
      pickInsurerHeading: "Vilket bolag har ni försäkringen hos?",
      pickInsurerLede: "Välj försäkringsbolaget som står på försäkringsbrevet. Uppgifterna nedan kommer direkt ur försäkringsbolagets eget villkor, med källa till varje rad.",
      pickProductHeading: (insurer) => `${insurer} — vilken produkt?`,
      pickProductLede: "Samma bolag kan sälja mer än en barnförsäkring. Välj rätt produkt, annars visas fel villkor.",
      pickVariantHeading: "Vilken nivå eller omfattning har ni?",
      pickVariantLede: "Detta avgör vilka rader nedan gäller er. Står det inte i försäkringsbrevet, fråga försäkringsbolaget.",
      change: "Byt bolag/produkt",
      back: "Tillbaka",
      sourceLabel: "Källa",
      sourceLine: (version, from) => `Villkor ${version}, gäller från ${from}.`,
      sourceCaveat: "Det är detta villkor — inte vad som är aktuellt hos försäkringsbolaget idag — som avgör vad som gäller för en försäkring skriven eller en skada som inträffat under den perioden.",
      versionUnknown: "okänt villkor",
      benefitsHeading: "Vad villkoret säger om olika ersättningar",
      benefitsIntro: "Rakt av ur villkorets egen text, en rad per moment. Det säger inte om ni har rätt till något — det avgör försäkringsbolagets bedömning av just ert fall.",
      benefitsLegend: "\"Omfattas\" betyder att villkoret har en egen regel för just detta moment — inte att ni har rätt till ersättning. \"Omfattas inte\" betyder att villkoret uttryckligen säger nej. \"Kräver tillägg\" betyder att det bara gäller med en tilläggsförsäkring. \"Oklart\" betyder att villkorets text är genuint otydlig om momentet omfattas — inte samma sak som nej. \"Inte hittat i villkoret\" betyder att vi inte har hittat någon regel för just detta moment — det kan ändå finnas i försäkringen.",
      coverageCountNote: (n, total) => `${n} av ${total} ersättningsmoment i taxonomin har en registrerad rad för denna produkt.`,
      exclusionsHeading: "Begränsningar och undantag",
      exclusionsIntro: "Det som brukar avgöra om en annars giltig skada faktiskt betalas ut.",
      exclusionsLegend: "Här är det tvärtom mot ovan: \"Gäller\" betyder att begränsningen finns i villkoret och kan minska eller stoppa er ersättning — det är alltså inte en bra nyhet. \"Gäller inte\" betyder att just den begränsningen inte finns i det här villkoret. \"Oklart\" betyder att villkorets text är genuint otydlig om begränsningen gäller. \"Inte hittad i villkoret\" betyder att vi inte har hittat någon sådan begränsning — det är inte samma sak som att den inte finns, den kan stå i försäkringsbrevet istället.",
      citationLabel: "Källa i villkoret",
      amountLabel: "Belopp/underlag",
      conditionsLabel: "Villkor för att gälla",
      noSnippetNote: "Inget citat — se källan för var det söktes.",
      notesLabel: "Anteckning från granskningen",
      rulesCount: (n) => `${n} regler hittade för denna kategori — inte ett fel, villkoret har flera skilda bestämmelser här`,
      ruleLabel: (i, n) => `Regel ${i} av ${n}`,
      plainLanguageGapNote: "Denna sida visar villkorets egna ord rakt av, utan en genomarbetad förklaring på vardagsspråk för varje moment ännu — det är planerat men inte gjort.",
      triggerFilterLabel: "Var det ett olycksfall eller en sjukdom?",
      triggerFilterAll: "Visa allt",
      triggerFilterAccident: "Olycksfall",
      triggerFilterIllness: "Sjukdom",
      triggerHiddenNote: (n) => `${n} rader döljs av filtret ovan — de finns kvar i villkoret, bara filtrerade bort här. Rader där det är oklart vad som gäller visas alltid.`,
      statusLabels: {
        COVERED: "Omfattas",
        COVERED_OPTIONAL: "Kräver tillägg",
        NOT_COVERED: "Omfattas inte",
        UNCLEAR: "Oklart",
        NOT_FOUND: "Inte hittat i villkoret",
      },
      appliesLabels: {
        YES: "Gäller",
        NO: "Gäller inte",
        UNCLEAR: "Oklart",
        NOT_FOUND: "Inte hittad i villkoret",
      },
      confidenceFlags: {
        table_derived: "Läst ur en tabell — kontrolleras mot original-PDF",
        unclear: "Otydlig källtext",
      },
      // Private -> public cross-reference (OPEN_QUESTIONS 8a, Task 35): shown under any
      // vardersättning benefit-group whose row(s) are COVERED/COVERED_OPTIONAL. Frames the
      // link as "check," not "you'll get" — same discipline as every other line on this screen.
      vardersattningCrossRefText:
        "Det här försäkringsbolaget knyter vårdersättningen till Försäkringskassans omvårdnadsbidrag — samma " +
        "fyra nivåer (en fjärdedels/halv/tre fjärdedels/hel). Vet ni er omvårdnadsbidragsnivå går " +
        "det att räkna ut vilket av beloppen ovan som gäller er.",
      vardersattningCrossRefCta: "Läs om omvårdnadsbidrag och de fyra nivåerna →",
    },
    inventory: {
      start: (total) => `Börja — fråga 1 av ${total}`,
      prev: "Föregående",
      next: "Nästa fråga",
      done: "Klar — se sammanfattning",
      progress: (idx, total) => `Fråga ${idx} av ${total}`,
      restart: "Börja om",
      nextSection: (title) => `Nästa: ${title}`,
      matrixCta: "Se vad varje försäkring täcker",
    },
    templates: { copy: "Kopiera", copied: "Kopierat ✓" },
    calculator: {
      title: "Sjukpenning eller VAB — vad betyder det för er ekonomi?",
      lede:
        "Om en förälder själv blir sjuk av påfrestningen kan hen, om en läkare intygar att den " +
        "egna arbetsförmågan är nedsatt, gå från VAB till sjukskrivning för sin egen sjukdom. " +
        "Det är inte ett val mellan två sätt att få ersättning för samma vårdbehov — sjukpenning " +
        "kräver alltid ett läkarintyg om förälderns egen nedsatta arbetsförmåga. Den här sidan " +
        "gör bara talen konkreta för er egen lön, om ni redan är där eller är på väg dit.",
      warningTitle: "Viktigt att läsa innan ni räknar",
      warningBody:
        "Rätten till sjukpenning avgörs av att en läkare intygar att FÖRÄLDERNS EGEN " +
        "arbetsförmåga är nedsatt — inte av vad som ger mest pengar. Den här sidan visar inte " +
        "hur man blir sjukskriven på falska grunder, och det är inte vad de här siffrorna är till för.",
      salaryLabel: "Din månadslön före skatt (kr)",
      salaryPlaceholder: "T.ex. 35 000",
      salaryHelp:
        "Bruttolön. Det här är en förenkling av din faktiska sjukpenninggrundande inkomst " +
        "(SGI), som kan skilja sig något — se Försäkringskassans egen beräkning för exakt SGI.",
      cbaHeading:
        "Har din arbetsgivare en sjukförsäkring som ger mer än sjukpenningen — via " +
        "kollektivavtal eller på annat sätt?",
      cbaLede:
        "Det avgör om och när ett tillägg utöver sjukpenningen börjar betalas ut, oavsett om " +
        "tillägget kommer från ett kollektivavtal eller en egen försäkring som arbetsgivaren " +
        "tecknat.",
      cbaUnknownName: "Jag vet inte / inget kollektivavtal",
      cbaCustomName:
        "Jag vet min egen procentsats (via kollektivavtal eller en egen försäkring från " +
        "arbetsgivaren)",
      customPercentLabel: "Tilläggets storlek (% av sjukpenningen)",
      customStartDayLabel: "Från vilken dag av sjukperioden börjar tillägget gälla?",
      unknownNote:
        "Utan uppgift om kollektivavtal visar vi bara sjukpenningen på egen hand, utan " +
        "tillägg. Fråga din HR-avdelning eller ditt fackförbund vilket kollektivavtal som " +
        "gäller för dig och om det ger sjukpenningtillägg — och fråga även om arbetsgivaren " +
        "har tecknat en egen gruppsjukförsäkring även utan kollektivavtal, det är vanligare än " +
        "man tror. Båda kan höja beloppet efter viss tid.",
      startDayFrom: (day) => `Från dag ${day}`,
      resultsHeading: "Månad för månad",
      resultsIntro:
        "Uppskattad inkomst per månad, jämfört med er vanliga lön. Övergångsmånader (dag 15, " +
        "91, 365) visar ett snittvärde för hela månaden, eftersom ändringen sker mitt i den.",
      enterSalaryPrompt: "Ange månadslönen ovan för att se en jämförelse.",
      legendSalary: "Vanlig lön",
      legendVab: "VAB (endast)",
      legendSick: "Sjukpenning (+ ev. kollektivavtalstillägg)",
      monthLabel: (n) => `Månad ${n}`,
      dayRangeLabel: (from, to) => `dag ${from}–${to}`,
      pctOfSalary: (pct) => `${pct} % av lönen`,
      sourceLabel: "Källa",
      capSourceHeading: "Var taken och nivåerna kommer ifrån",
      capSourceNote:
        "Sjukpenningens inkomsttak (8 prisbasbelopp, 2026) och VAB:s inkomsttak (7,5 " +
        "prisbasbelopp, 2026), samt ersättningsnivåerna 80 %/75 %, kommer från " +
        "Försäkringskassan — se docs/SJUKPENNING_VS_VAB.md §1 för fullständig källa.",
      approxNote:
        "Den här beräkningen förenklar varje kollektivavtals exakta trappor till en modell — " +
        "se källan för varje tillägg för den fullständiga formeln, och fråga din arbetsgivare " +
        "eller ditt fackförbund för en exakt uppgift innan ni planerar er ekonomi efter den.",
      healthHeading: "Tecken på att det kan vara dags att prata med din egen läkare",
      healthIntro:
        "Det här är inga tecken som avgör något — bara exempel på skäl att söka vård för din " +
        "egen del. Det är läkaren, inte den här sidan, som bedömer din arbetsförmåga.",
      healthItems: [
        "Ihållande utmattning som inte går över med vila",
        "Sömnproblem som håller i sig över tid",
        "Förändrat humör — nedstämdhet, irritabilitet, känslomässig avtrubbning",
        "Fysiska stressymtom — huvudvärk, hjärtklappning, ont i magen, spänningar",
      ],
      healthClosing: "Om något av det här känns igen — prata med din vårdcentral om din egen situation.",
    },
    footer: {
      notice:
        "Ni loggar inte in. Vi sparar inget om ert barns hälsa — svaren stannar i er egen " +
        "webbläsarflik och försvinner när ni stänger den.",
    },
  },
  en: {
    nav: {
      home: "Home",
      inventory: "Find coverage",
      matrix: "Your policy",
      claimProcess: "Filing a claim",
      evidence: "Evidence",
      deadlines: "Deadlines",
      templates: "Templates",
      aboutUs: "About us",
    },
    reviewedByLabel: "Reviewed by",
    home: {
      heroTitle: "See what you can check, claim and document — and where it says so.",
      heroLede:
        "We show you where you may have cover you didn't know about, what it usually takes to " +
        "have a claim assessed, and which dates can't be pushed back. Whether your child's case " +
        "is covered is decided by the insurer's own medical assessment — not by this site.",
      trustTitle: "You don't log in. We don't save anything.",
      trustBody:
        "No account, no password. The answers you give here — about your child, about what " +
        "happened — stay in this browser tab and disappear when you close it. We never send or " +
        "store anything about your child's health anywhere.",
      deadlineTitle: "Read this first, if you only read one thing",
      deadlineBody:
        "A deadline that's passed can't be recovered. Everything else on this site can wait until tomorrow.",
      cards: [
        { title: "Find every insurance policy", desc: "Six questions that show where you may have cover you didn't know about." },
        { title: "What your policy says", desc: "Pick your insurer and product — see the policy's own words on each benefit." },
        { title: "How a claim works", desc: "The whole process in order, from filing to appeal board." },
        { title: "What to gather", desc: "The things you can't recreate later — start tonight." },
        { title: "Letters and messages", desc: "Ready-to-send templates you can copy." },
        { title: "Sickness benefit or VAB", desc: "See what it would mean for your finances if a parent went on sick leave instead of taking VAB." },
        { title: "Merkostnadsersättning (Försäkringskassan)", desc: "What counts as an extra cost, the five levels in kronor, and how to apply." },
        { title: "Omvårdnadsbidrag (Försäkringskassan)", desc: "The four levels in kronor, how the level is actually decided, and what courts have said about specific boundary cases." },
      ],
      govSectionTitle: "State support",
    },
    matrix: {
      pickInsurerHeading: "Which company is your policy with?",
      pickInsurerLede: "Pick the insurer named on your policy document. Everything below comes straight from that insurer's own policy wording, with a source for every line.",
      pickProductHeading: (insurer) => `${insurer} — which product?`,
      pickProductLede: "The same insurer can sell more than one child policy. Pick the right one, or the wrong terms will show.",
      pickVariantHeading: "Which level or scope do you have?",
      pickVariantLede: "This decides which rows below apply to you. If it's not on your policy document, ask the insurer.",
      change: "Change insurer/product",
      back: "Back",
      sourceLabel: "Source",
      sourceLine: (version, from) => `Policy terms ${version}, in force from ${from}.`,
      sourceCaveat: "These specific terms — not whatever the insurer currently sells — govern a policy written, or a claim arising, during that period.",
      versionUnknown: "unknown policy version",
      benefitsHeading: "What the policy terms say about each benefit",
      benefitsIntro: "Straight from the policy's own wording, one row per benefit. This doesn't say whether you're entitled to anything — that's decided by the insurer's assessment of your specific case.",
      benefitsLegend: "\"Covered\" means the policy has its own rule for this benefit — not that you're entitled to a payout. \"Not covered\" means the policy explicitly says no. \"Requires add-on\" means it only applies with an additional policy. \"Unclear\" means the policy's wording is genuinely ambiguous about whether this is covered — not the same as no. \"Not found in the policy\" means we haven't located a rule for this benefit — it may still exist in the policy.",
      coverageCountNote: (n, total) => `${n} of ${total} benefit types in our taxonomy have a recorded row for this product.`,
      exclusionsHeading: "Limitations and exclusions",
      exclusionsIntro: "What usually decides whether an otherwise valid claim actually gets paid.",
      exclusionsLegend: "It's the reverse of the section above: \"Applies\" means the limitation exists in the policy and can reduce or block your payout — that's not good news. \"Does not apply\" means that particular limitation isn't in this policy. \"Unclear\" means the policy's wording is genuinely ambiguous about whether this limitation applies. \"Not found in the policy\" means we haven't located such a limitation — that's not the same as it not existing; it may sit in the insurance certificate (försäkringsbrev) instead.",
      citationLabel: "Source in the policy terms",
      amountLabel: "Amount/basis",
      conditionsLabel: "Conditions to qualify",
      noSnippetNote: "No quote — see the source for where this was searched.",
      notesLabel: "Note from the review",
      rulesCount: (n) => `${n} separate rules found for this category — not an error, the policy terms have several distinct provisions here`,
      ruleLabel: (i, n) => `Rule ${i} of ${n}`,
      plainLanguageGapNote: "This page shows the policy's own wording as-is; a fully worked plain-language explanation for each benefit doesn't exist yet — that's planned, not done.",
      triggerFilterLabel: "Was it an accident or an illness?",
      triggerFilterAll: "Show everything",
      triggerFilterAccident: "Accident",
      triggerFilterIllness: "Illness",
      triggerHiddenNote: (n) => `${n} row(s) hidden by the filter above — they're still in the policy terms, just filtered out of this view. Rows where it's unclear which one applies are always shown.`,
      statusLabels: {
        COVERED: "Covered",
        COVERED_OPTIONAL: "Add-on required",
        NOT_COVERED: "Not covered",
        UNCLEAR: "Unclear",
        NOT_FOUND: "Not found in the policy",
      },
      appliesLabels: {
        YES: "Applies",
        NO: "Does not apply",
        UNCLEAR: "Unclear",
        NOT_FOUND: "Not found in the policy",
      },
      confidenceFlags: {
        table_derived: "Read from a table — being checked against the source PDF",
        unclear: "Unclear source wording",
      },
      vardersattningCrossRefText:
        "This insurer ties its care allowance to Försäkringskassan's omvårdnadsbidrag — the same " +
        "four levels (one-quarter/half/three-quarters/full). Once you know your omvårdnadsbidrag " +
        "level, you can work out which of the amounts above applies to you.",
      vardersattningCrossRefCta: "Read about omvårdnadsbidrag and the four levels →",
    },
    inventory: {
      start: (total) => `Start — question 1 of ${total}`,
      prev: "Previous",
      next: "Next question",
      done: "Done — see summary",
      progress: (idx, total) => `Question ${idx} of ${total}`,
      restart: "Start over",
      nextSection: (title) => `Next: ${title}`,
      matrixCta: "See what each policy covers",
    },
    templates: { copy: "Copy", copied: "Copied ✓" },
    calculator: {
      title: "Sickness benefit or VAB — what would it mean for your finances?",
      lede:
        "If a parent's own health breaks down from the strain, and a doctor certifies that " +
        "their own work capacity is reduced, they can move from VAB to sick leave for their " +
        "own illness. This isn't a choice between two ways to get paid for the same care need " +
        "— sjukpenning always requires a doctor's certificate about the parent's own reduced " +
        "capacity to work. This page just makes the numbers concrete for your own salary, if " +
        "you're already there or heading that way.",
      warningTitle: "Important — read before you calculate",
      warningBody:
        "The right to sjukpenning is decided by a doctor certifying that the PARENT'S OWN " +
        "work capacity is reduced — not by what pays the most. This page does not show how to " +
        "get signed off sick on false pretenses, and that is not what these numbers are for.",
      salaryLabel: "Your monthly salary before tax (kr)",
      salaryPlaceholder: "E.g. 35,000",
      salaryHelp:
        "Gross salary. This is a simplification of your actual SGI (sjukpenninggrundande " +
        "inkomst), which may differ slightly — see Försäkringskassan's own calculation for your exact SGI.",
      cbaHeading:
        "Does your employer have a sickness insurance that pays more than sjukpenning — " +
        "through a collective agreement or some other arrangement?",
      cbaLede:
        "This decides whether and when a top-up on top of sjukpenning starts, whether that " +
        "top-up comes from a collective agreement or an insurance the employer has arranged " +
        "on its own.",
      cbaUnknownName: "I don't know / no collective agreement",
      cbaCustomName:
        "I know my own percentage (via a collective agreement or the employer's own " +
        "insurance)",
      customPercentLabel: "Size of the top-up (% of the sjukpenning amount)",
      customStartDayLabel: "From which day of the sick period does the top-up start?",
      unknownNote:
        "Without a named collective agreement, we only show sjukpenning on its own, with no " +
        "top-up. Ask your HR department or your union which agreement applies to you and " +
        "whether it includes a sickness top-up — and also ask whether your employer has taken " +
        "out its own group sickness insurance even without a collective agreement, which is " +
        "more common than you'd think. Either one could raise the amount after a certain point.",
      startDayFrom: (day) => `From day ${day}`,
      resultsHeading: "Month by month",
      resultsIntro:
        "Estimated income per month, compared with your usual salary. Transition months (day " +
        "15, 91, 365) show an average for the whole month, since the change happens partway through it.",
      enterSalaryPrompt: "Enter your monthly salary above to see a comparison.",
      legendSalary: "Usual salary",
      legendVab: "VAB (only)",
      legendSick: "Sjukpenning (+ any collective-agreement top-up)",
      monthLabel: (n) => `Month ${n}`,
      dayRangeLabel: (from, to) => `day ${from}–${to}`,
      pctOfSalary: (pct) => `${pct}% of salary`,
      sourceLabel: "Source",
      capSourceHeading: "Where the caps and levels come from",
      capSourceNote:
        "Sjukpenning's income ceiling (8 prisbasbelopp, 2026) and VAB's income ceiling (7.5 " +
        "prisbasbelopp, 2026), and the 80%/75% compensation levels, come from Försäkringskassan " +
        "— see docs/SJUKPENNING_VS_VAB.md §1 for the full sourcing.",
      approxNote:
        "This calculation simplifies each collective agreement's exact tiered table into one " +
        "model — see the source for each top-up for the full formula, and ask your employer or " +
        "union for an exact figure before planning your finances around it.",
      healthHeading: "Signs it may be time to talk to your own doctor",
      healthIntro:
        "These signs don't decide anything by themselves — they're just examples of reasons to " +
        "seek care for yourself. It's your doctor, not this page, who assesses your work capacity.",
      healthItems: [
        "Persistent exhaustion that doesn't ease with rest",
        "Sleep problems that persist over time",
        "Changed mood — low mood, irritability, emotional numbness",
        "Physical stress symptoms — headaches, heart palpitations, stomach pain, tension",
      ],
      healthClosing: "If any of this sounds familiar — talk to your health centre about your own situation.",
    },
    footer: {
      notice:
        "You don't log in. We don't save anything about your child's health — answers stay in " +
        "your own browser tab and disappear when you close it.",
    },
  },
};

function T() {
  return STRINGS[locale];
}

// ---------------- locale state ----------------

let locale = localStorage.getItem("bfk-locale") === "en" ? "en" : "sv";

function setLocale(next) {
  if (next !== "sv" && next !== "en") return;
  locale = next;
  localStorage.setItem("bfk-locale", locale);
  document.documentElement.lang = locale;
  updateNavChrome();
  route(); // re-renders the CURRENT route in the new locale; doesn't touch inventoryState.idx
}

function updateNavChrome() {
  const t = T();
  document.querySelectorAll("#top-nav a").forEach((a) => {
    const key = a.dataset.i18n;
    if (key && t.nav[key]) {
      const label = a.querySelector(".nav-label");
      if (label) label.textContent = t.nav[key];
    }
  });
  document.querySelectorAll("#lang-toggle button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.locale === locale);
  });
  const aboutLink = document.getElementById("footer-about-link");
  if (aboutLink) aboutLink.textContent = t.nav.aboutUs;
  const footerNotice = document.getElementById("footer-notice");
  if (footerNotice) footerNotice.textContent = t.footer.notice;
}

function reviewedBadge(reviewedBy) {
  if (!reviewedBy) return "";
  return `<div class="reviewed-badge">✓ ${T().reviewedByLabel} ${escapeHtml(reviewedBy)}</div>`;
}
function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function setActiveNav(path) {
  document.querySelectorAll("#top-nav a").forEach((a) => {
    a.classList.toggle("active", a.dataset.route === path);
  });
}

function backLink(route, label) {
  return `<a href="${route}" class="back-link">← ${label}</a>`;
}

// Same look as backLink, but for going back one step *within* the matrix flow. That flow's
// insurer/product/variant/result screens all share one hash route (#/coverage-matrix) and track
// the current step in matrixState, not in the URL -- so a plain <a href="#/coverage-matrix">
// is a same-hash link that never fires hashchange and does nothing when clicked. This renders a
// button instead and wires it to actually clear state and re-render (see callers).
function matrixBackButton(label) {
  return `<button type="button" class="back-link" data-action="matrix-back">← ${label}</button>`;
}

// ---------------- PER-POLICY COVERAGE MATRIX (mockup layer 2) ----------------
// Data comes from window.MATRIX, built by mockup/tools/build_matrix.py from
// analysis/coverage_matrix.csv + analysis/exclusions_matrix.csv + corpus/manifest.csv.
// Nothing insurer/product/variant-specific is hand-written here — every option the
// picker offers, and every row it renders, comes from that data file. Per Task 10's
// brief: villkor quotes and citations always stay Swedish, regardless of UI language
// (OPEN_QUESTIONS 6) — only this screen's own chrome (picker labels, section headings,
// enum labels below) is translated.

// Fixed, curated glosses for the 26 benefit_type / 24 exclusion_type taxonomy values
// (analysis/taxonomy_v1.md). Not villkor text -- these are the research taxonomy's own
// category names, de-slugified and given a short English gloss, same "curate, don't
// generate" discipline as every other UI string in this file. A type missing from
// this table (future taxonomy drift) still renders, just as its raw snake_case value,
// rather than throwing.
const BENEFIT_TYPE_LABELS = {
  medicinsk_invaliditet: { sv: "Medicinsk invaliditet", en: "Permanent medical impairment" },
  ekonomisk_invaliditet: { sv: "Ekonomisk invaliditet", en: "Permanent loss of earning capacity" },
  diagnoskapital: { sv: "Diagnoskapital", en: "Diagnosis lump sum" },
  arrersattning: { sv: "Ärrersättning", en: "Scar compensation" },
  kroppsskadeersattning: { sv: "Kroppsskadeersättning", en: "Fixed-tariff injury compensation" },
  utseendemassig_hudforandring: { sv: "Utseendemässig hudförändring", en: "Visible skin change (e.g. vitiligo/alopecia)" },
  dodsfall: { sv: "Dödsfall", en: "Death benefit" },
  vardersattning: { sv: "Vårdersättning", en: "Care allowance" },
  sjukersattning: { sv: "Sjukersättning", en: "Sickness benefit" },
  aktivitetskapital: { sv: "Aktivitetskapital", en: "Activity-compensation top-up" },
  premiebefrielse: { sv: "Premiebefrielse", en: "Premium waiver" },
  vard_och_behandlingskostnader: { sv: "Vård- och behandlingskostnader", en: "Medical treatment costs" },
  resekostnader: { sv: "Resekostnader", en: "Travel costs" },
  hjalpmedel: { sv: "Hjälpmedel", en: "Aids and equipment" },
  bostadsanpassning_och_engangskostnader: { sv: "Bostadsanpassning och engångskostnader", en: "Home adaptation and one-off costs" },
  rehabilitering: { sv: "Rehabilitering", en: "Rehabilitation" },
  tandskadekostnader: { sv: "Tandskadekostnader", en: "Dental injury costs" },
  klader_glasogon_personliga_saker: { sv: "Kläder, glasögon, personliga saker", en: "Clothing, glasses, personal items" },
  hjalpmedelsschablon_vissa_diagnoser: { sv: "Hjälpmedelsschablon vid vissa diagnoser", en: "Flat aid allowance for named diagnoses" },
  fritidsaktivitet: { sv: "Fritidsaktivitet", en: "Leisure-activity support" },
  sjukhusvistelse: { sv: "Sjukhusvistelse", en: "Hospital stay" },
  vard_i_hemmet: { sv: "Vård i hemmet", en: "Home care after admission" },
  akutvardsersattning: { sv: "Akutvårdsersättning", en: "Acute-care lump sum" },
  kristerapi: { sv: "Kristerapi", en: "Crisis therapy" },
  vardplanering_second_opinion: { sv: "Vårdplanering / second opinion", en: "Care planning / second opinion" },
  fortsatt_forsakring_utan_halsoprovning: { sv: "Fortsatt försäkring utan hälsoprövning", en: "Continued cover without new health assessment" },
};

const EXCLUSION_TYPE_LABELS = {
  symtom_fore_teckning: { sv: "Symtom före teckning", en: "Symptoms before the policy started" },
  karens_kvalifikationstid: { sv: "Karens / kvalifikationstid", en: "Waiting period / qualification time" },
  undantagna_diagnoser_npf: { sv: "Undantagna diagnoser: NPF", en: "Excluded diagnoses: neuropsychiatric" },
  undantagna_diagnoser_medfodda: { sv: "Undantagna diagnoser: medfödda", en: "Excluded diagnoses: congenital" },
  undantagna_diagnoser_neurologiska: { sv: "Undantagna diagnoser: neurologiska", en: "Excluded diagnoses: neurological" },
  undantagna_diagnoser_ovriga: { sv: "Undantagna diagnoser: övriga", en: "Excluded diagnoses: other" },
  tak_pa_ersattning_vid_undantagen_diagnos: { sv: "Tak på ersättning vid undantagen diagnos", en: "Cap on payout for an excluded diagnosis" },
  slutalder_och_alderskrav: { sv: "Slutålder och ålderskrav", en: "Expiry age and age requirements" },
  aktsamhetskrav_grov_vardsloshet: { sv: "Aktsamhetskrav / grov vårdslöshet", en: "Duty of care / gross negligence" },
  sjalvrisk: { sv: "Självrisk", en: "Deductible" },
  preskription: { sv: "Preskription", en: "Statutory time limit" },
  anmalningsplikt_och_medverkan: { sv: "Anmälningsplikt och medverkan", en: "Duty to report and pre-approval" },
  pandemi: { sv: "Pandemi", en: "Pandemic" },
  krig: { sv: "Krig", en: "War" },
  terror_atom_bcn: { sv: "Terror, atom, BCN-vapen", en: "Terrorism, nuclear, CBRN weapons" },
  professionell_idrott: { sv: "Professionell idrott", en: "Professional sport" },
  upplysningsplikt: { sv: "Upplysningsplikt", en: "Duty of disclosure" },
  uppsat_och_brottslig_garning: { sv: "Uppsåt och brottslig gärning", en: "Intent and criminal acts" },
  geografisk_begransning: { sv: "Geografisk begränsning", en: "Geographic limitation" },
  behandlingsskada_medicinska_preparat: { sv: "Behandlingsskada / medicinska preparat", en: "Treatment injury / medical products" },
  subsidiaritet_annan_ersattning: { sv: "Subsidiaritet mot annan ersättning", en: "Subsidiary to other compensation" },
  forsakringen_ur_kraft_obetald_premie: { sv: "Försäkringen ur kraft / obetald premie", en: "Lapsed policy / unpaid premium" },
  valdsamma_aktiviteter: { sv: "Våldsamma aktiviteter", en: "Violent activities" },
  psykisk_ohalsa_ej_kroppsskada: { sv: "Psykisk ohälsa (ej kroppsskada)", en: "Mental illness (not physical injury)" },
};

function typeLabel(table, slug) {
  const entry = table[slug];
  if (!entry) return slug;
  return locale === "en" ? entry.en : entry.sv;
}

// In-memory only, same discipline as inventoryState — never persisted. Not situation
// data, but there's no reason for it to outlive the tab either.
const matrixState = { insurerSlug: null, productName: null, variant: null, triggerFilter: "all" };

function matrixInsurers() {
  return (window.MATRIX && window.MATRIX.insurers) || [];
}
function findInsurer(slug) {
  return matrixInsurers().find((i) => i.slug === slug) || null;
}
function selectedProduct(insurer) {
  if (!insurer) return null;
  if (insurer.products.length === 1) return insurer.products[0];
  return insurer.products.find((p) => p.name === matrixState.productName) || null;
}

// The matrix flow's insurer/product/variant/result screens used to all share the single hash
// route "#/coverage-matrix", with the actual step tracked only in matrixState (in-memory, never
// in the URL). That meant every step of the flow was one browser-history entry, not several --
// so the browser's own native back button (not an in-app link) had nothing to step back *to*
// within the flow, and jumped straight to whatever page was open before "Min försäkring" was
// clicked at all (found by Maximilian, 2026-08-04: Moderna -> Large, native back button landed on
// Hem instead of the variant picker). Fixed by encoding the selection into the hash itself, so
// each step is a real, distinct history entry and the native back button works like any other
// browser navigation. Mirrors matrixStep()/selectedProduct()'s own skip-logic: a product segment
// is only present in the hash if the insurer actually has more than one product to choose from,
// and a variant segment only if the resolved product actually has more than one variant.
function encodeMatrixHash(insurerSlug, productName, variant) {
  const parts = ["coverage-matrix"];
  if (!insurerSlug) return "#/" + parts.join("/");
  const insurer = findInsurer(insurerSlug);
  parts.push(encodeURIComponent(insurerSlug));
  if (!insurer) return "#/" + parts.join("/");
  if (insurer.products.length > 1) {
    if (!productName) return "#/" + parts.join("/");
    parts.push(encodeURIComponent(productName));
    const product = insurer.products.find((p) => p.name === productName);
    if (product && product.variants.length > 1 && variant) parts.push(encodeURIComponent(variant));
  } else {
    const product = insurer.products[0];
    if (product && product.variants.length > 1 && variant) parts.push(encodeURIComponent(variant));
  }
  return "#/" + parts.join("/");
}

// Reverse of encodeMatrixHash: reads the raw (still URI-encoded) path segments after
// "coverage-matrix" and sets matrixState from them. Never guesses -- an unknown insurer slug,
// product name or variant in the URL (stale bookmark, hand-edited hash, taxonomy change) just
// stops there rather than resolving to something it doesn't actually mean.
function applyMatrixHashSegments(segments) {
  matrixState.insurerSlug = null;
  matrixState.productName = null;
  matrixState.variant = null;
  if (segments.length === 0) return;
  const insurer = findInsurer(decodeURIComponent(segments[0]));
  if (!insurer) return;
  matrixState.insurerSlug = insurer.slug;
  if (segments.length === 1) return;
  if (insurer.products.length > 1) {
    const product = insurer.products.find((p) => p.name === decodeURIComponent(segments[1]));
    if (!product) return;
    matrixState.productName = product.name;
    if (segments.length === 2) return;
    if (product.variants.length > 1) {
      const variant = decodeURIComponent(segments[2]);
      if (product.variants.includes(variant)) matrixState.variant = variant;
    }
  } else {
    const product = insurer.products[0];
    if (product && product.variants.length > 1) {
      const variant = decodeURIComponent(segments[1]);
      if (product.variants.includes(variant)) matrixState.variant = variant;
    }
  }
}

// All matrix navigation -- forward selections and in-app "back" controls alike -- goes through
// this single function so the hash (and therefore browser history) is always the source of
// truth, never a side channel that can drift from it.
function navigateMatrix(insurerSlug, productName, variant) {
  location.hash = encodeMatrixHash(insurerSlug, productName, variant);
}
function matrixStep() {
  const insurer = findInsurer(matrixState.insurerSlug);
  if (!insurer) return "insurer";
  const product = selectedProduct(insurer);
  if (!product) return "product";
  if (product.variants.length > 1 && matrixState.variant === null) return "variant";
  return "result";
}
function rowMatchesVariant(productVariant, variant) {
  if (variant === null) return true; // no variant chosen/needed -> everything applies
  if (productVariant === "alla") return true;
  return productVariant
    .split(";")
    .map((s) => s.trim())
    .includes(variant);
}

// Presentation filter only -- never changes a row's own trigger_type, citation, status or
// text, and never hides an "unclear" row (principle 6: UNCLEAR must stay visibly distinct,
// not disappear because a guess would have been required to sort it one way or the other).
function rowMatchesTrigger(triggerType, filter) {
  if (!filter || filter === "all") return true;
  if (!triggerType || triggerType === "unclear") return true;
  if (filter === "accident") return triggerType === "accident_and_illness" || triggerType === "accident_only";
  if (filter === "illness") return triggerType === "accident_and_illness" || triggerType === "illness_only";
  return true;
}

function statusPill(status, t) {
  const label = t.matrix.statusLabels[status] || status;
  const cls =
    status === "COVERED" ? "status-pill--yes" :
    status === "COVERED_OPTIONAL" ? "status-pill--optional" :
    status === "UNCLEAR" ? "status-pill--unclear" :
    status === "NOT_FOUND" ? "status-pill--notfound" :
    "status-pill--no";
  return `<span class="status-pill ${cls}">${escapeHtml(label)}</span>`;
}
function appliesPill(applies, t) {
  const label = t.matrix.appliesLabels[applies] || applies;
  const cls =
    applies === "YES" ? "status-pill--optional" : // confirmed-applying limitation: same "attention" weight as an add-on requirement
    applies === "NO" ? "status-pill--yes" :
    applies === "UNCLEAR" ? "status-pill--unclear" :
    "status-pill--notfound";
  return `<span class="status-pill ${cls}">${escapeHtml(label)}</span>`;
}
function confidenceBadge(confidence, t) {
  if (confidence === "confirmed" || !confidence) return "";
  const label = t.matrix.confidenceFlags[confidence] || confidence;
  return `<div class="confidence-flag">${escapeHtml(label)}</div>`;
}

// Private -> public cross-reference, OPEN_QUESTIONS 8a / Task 35: shown once per
// vardersättning benefit-group, only when at least one of its rows actually offers the
// benefit (COVERED/COVERED_OPTIONAL). Data-driven off benefit_type/status, not an insurer
// name list -- Skandia's NOT_COVERED row, Trygg-Hansa grund's NOT_FOUND row, Moderna
// Grund's NOT_COVERED row and Länsförsäkringar's "tillfälligt olycksfallsskydd" NOT_COVERED
// row (the 4 non-offering rows per docs/TASK_AUDIT.md's Task 29 correction) all render this
// group with no prompt, automatically, because none of their rows pass the status check.
function vardersattningCrossRefHtml(group, t) {
  if (group.benefit_type !== "vardersattning") return "";
  const offersBenefit = group.rows.some((r) => r.status === "COVERED" || r.status === "COVERED_OPTIONAL");
  if (!offersBenefit) return "";
  return `
        <div class="cross-ref-note">
          <p>${escapeHtml(t.matrix.vardersattningCrossRefText)}</p>
          <a href="#/forsakringskassan/omvardnadsbidrag" class="inline-link">${escapeHtml(t.matrix.vardersattningCrossRefCta)}</a>
        </div>`;
}

function matrixBreadcrumb(insurer, product, variant) {
  const parts = [insurer.name];
  if (insurer.products.length > 1) parts.push(product.name);
  if (variant) parts.push(variant);
  return parts.map(escapeHtml).join(" › ");
}

function renderMatrix() {
  const step = matrixStep();
  const insurer = findInsurer(matrixState.insurerSlug);
  if (step === "insurer") return renderMatrixPickInsurer();
  if (step === "product") return renderMatrixPickProduct(insurer);
  const product = selectedProduct(insurer);
  if (step === "variant") return renderMatrixPickVariant(insurer, product);
  return renderMatrixResult(insurer, product);
}

function renderMatrixPickInsurer() {
  const t = T();
  const options = matrixInsurers()
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, "sv"))
    .map((ins) => `<button class="option-card" data-insurer="${escapeHtml(ins.slug)}">${escapeHtml(ins.name)}</button>`)
    .join("");
  app.innerHTML = `
    ${backLink("#/", t.nav.home)}
    <h1 class="page-title">${escapeHtml(t.matrix.pickInsurerHeading)}</h1>
    <p class="lede">${escapeHtml(t.matrix.pickInsurerLede)}</p>
    <div class="option-grid">${options}</div>
  `;
  app.querySelectorAll("[data-insurer]").forEach((btn) => {
    btn.addEventListener("click", () => {
      navigateMatrix(btn.dataset.insurer, null, null);
    });
  });
}

function renderMatrixPickProduct(insurer) {
  const t = T();
  const options = insurer.products
    .map(
      (p) => `
      <button class="option-card" data-product="${escapeHtml(p.name)}">
        <span class="option-card__title">${escapeHtml(p.name)}</span>
        <span class="option-card__sub">${escapeHtml(p.villkorVersion || t.matrix.versionUnknown)}</span>
      </button>`
    )
    .join("");
  app.innerHTML = `
    ${matrixBackButton(t.matrix.change)}
    <h1 class="page-title">${escapeHtml(t.matrix.pickProductHeading(insurer.name))}</h1>
    <p class="lede">${escapeHtml(t.matrix.pickProductLede)}</p>
    <div class="option-grid">${options}</div>
  `;
  // Back one step from product-picker is insurer-picker -- there's nothing in between.
  app.querySelector('[data-action="matrix-back"]').addEventListener("click", () => {
    navigateMatrix(null, null, null);
  });
  app.querySelectorAll("[data-product]").forEach((btn) => {
    btn.addEventListener("click", () => {
      navigateMatrix(insurer.slug, btn.dataset.product, null);
    });
  });
}

function renderMatrixPickVariant(insurer, product) {
  const t = T();
  const options = product.variants
    .map((v) => `<button class="option-card" data-variant="${escapeHtml(v)}">${escapeHtml(v)}</button>`)
    .join("");
  app.innerHTML = `
    ${matrixBackButton(t.matrix.change)}
    <h1 class="page-title">${escapeHtml(t.matrix.pickVariantHeading)}</h1>
    <p class="lede">${escapeHtml(t.matrix.pickVariantLede)}</p>
    <div class="option-grid option-grid--list">${options}</div>
  `;
  // Back one step from variant-picker is product-picker -- unless this insurer only has one
  // product, in which case product-picker is auto-skipped (see selectedProduct()) and was never
  // a screen the family actually saw, so one step back is insurer-picker instead.
  app.querySelector('[data-action="matrix-back"]').addEventListener("click", () => {
    navigateMatrix(insurer.products.length > 1 ? insurer.slug : null, null, null);
  });
  app.querySelectorAll("[data-variant]").forEach((btn) => {
    btn.addEventListener("click", () => {
      navigateMatrix(insurer.slug, product.name, btn.dataset.variant);
    });
  });
}

function renderMatrixResult(insurer, product) {
  const t = T();
  const variant = product.variants.length > 1 ? matrixState.variant : null;

  const benefitRows = product.benefits.filter((r) => rowMatchesVariant(r.product_variant, variant));
  const distinctTypes = new Set(benefitRows.map((r) => r.benefit_type)).size;
  const totalTypes = window.MATRIX.benefitTypeOrder.length;

  // Accident/illness filter is presentation-only, applied on top of the variant filter above --
  // it never changes distinctTypes/totalTypes (that count is about the taxonomy coverage for
  // this product/variant as a whole, not about what the toggle currently shows), and it never
  // hides an "unclear" row (see rowMatchesTrigger).
  const triggerFilter = matrixState.triggerFilter || "all";
  const visibleBenefitRows = benefitRows.filter((r) => rowMatchesTrigger(r.trigger_type, triggerFilter));
  const hiddenByTriggerCount = benefitRows.length - visibleBenefitRows.length;

  // Group by benefit_type before rendering so the heading appears once, not once per row --
  // a benefit_type with more than one row (e.g. a main rule + its own escalation table, or a
  // genuinely separate provision like temporary underwriting-period cover) is real, sourced
  // data, not a duplicate, but showing the same heading N times with no explanation is exactly
  // what a family reading this can't parse. Grouping is purely presentational: it never merges,
  // reorders, or drops a row, and never guesses which rows are "the same rule" -- each row keeps
  // its own citation, status, and full text, just under one shared heading with a rule count.
  const benefitGroups = [];
  for (const r of visibleBenefitRows) {
    const last = benefitGroups[benefitGroups.length - 1];
    if (last && last.benefit_type === r.benefit_type) last.rows.push(r);
    else benefitGroups.push({ benefit_type: r.benefit_type, rows: [r] });
  }

  const benefitsHtml = benefitGroups
    .map((group) => {
      const multi = group.rows.length > 1;
      const rowsHtml = group.rows
        .map((r, i) => {
          const snippet = r.verbatim_snippet
            ? `<blockquote class="villkor-quote">${escapeHtml(r.verbatim_snippet)}</blockquote>`
            : `<p class="no-snippet">${escapeHtml(t.matrix.noSnippetNote)}</p>`;
          return `
          <div class="benefit-row">
            <div class="benefit-row__head">
              ${multi ? `<span class="rule-label">${escapeHtml(t.matrix.ruleLabel(i + 1, group.rows.length))}</span>` : ""}
              ${statusPill(r.status, t)}
            </div>
            ${confidenceBadge(r.confidence, t)}
            ${snippet}
            <div class="citation-label">${escapeHtml(t.matrix.citationLabel)}: ${escapeHtml(r.citation)}</div>
            ${r.notes ? `<div class="field-row"><span class="field-label">${escapeHtml(t.matrix.notesLabel)}:</span> ${escapeHtml(r.notes)}</div>` : ""}
            ${r.amount_or_basis ? `<div class="field-row"><span class="field-label">${escapeHtml(t.matrix.amountLabel)}:</span> ${escapeHtml(r.amount_or_basis)}</div>` : ""}
            ${r.conditions ? `<div class="field-row"><span class="field-label">${escapeHtml(t.matrix.conditionsLabel)}:</span> ${escapeHtml(r.conditions)}</div>` : ""}
          </div>`;
        })
        .join("");
      return `
      <div class="benefit-group">
        <div class="benefit-group__head">
          <h4>${escapeHtml(typeLabel(BENEFIT_TYPE_LABELS, group.benefit_type))}</h4>
          ${multi ? `<span class="rules-count-note">${escapeHtml(t.matrix.rulesCount(group.rows.length))}</span>` : ""}
        </div>
        ${rowsHtml}
        ${vardersattningCrossRefHtml(group, t)}
      </div>`;
    })
    .join("");

  // Same grouping treatment as the benefits section above, same reasoning: an exclusion_type
  // with several rows (e.g. Bliwa's karens_kvalifikationstid, 4 rows) is real per-tier/per-case
  // data, not a duplicate, but repeating the heading N times with no explanation is the same
  // confusing pattern the benefits section had.
  const exclusionGroups = [];
  for (const r of product.exclusions) {
    const last = exclusionGroups[exclusionGroups.length - 1];
    if (last && last.exclusion_type === r.exclusion_type) last.rows.push(r);
    else exclusionGroups.push({ exclusion_type: r.exclusion_type, rows: [r] });
  }

  const exclusionsHtml = exclusionGroups
    .map((group) => {
      const multi = group.rows.length > 1;
      const rowsHtml = group.rows
        .map((r, i) => {
          const snippet = r.verbatim_snippet
            ? `<blockquote class="villkor-quote">${escapeHtml(r.verbatim_snippet)}</blockquote>`
            : `<p class="no-snippet">${escapeHtml(t.matrix.noSnippetNote)}</p>`;
          return `
          <div class="benefit-row">
            <div class="benefit-row__head">
              ${multi ? `<span class="rule-label">${escapeHtml(t.matrix.ruleLabel(i + 1, group.rows.length))}</span>` : ""}
              ${appliesPill(r.applies, t)}
            </div>
            ${confidenceBadge(r.confidence, t)}
            ${snippet}
            <div class="citation-label">${escapeHtml(t.matrix.citationLabel)}: ${escapeHtml(r.citation)}</div>
            ${r.notes ? `<div class="field-row"><span class="field-label">${escapeHtml(t.matrix.notesLabel)}:</span> ${escapeHtml(r.notes)}</div>` : ""}
            ${r.scope ? `<div class="field-row"><span class="field-label">${escapeHtml(t.matrix.conditionsLabel)}:</span> ${escapeHtml(r.scope)}</div>` : ""}
          </div>`;
        })
        .join("");
      return `
      <div class="benefit-group">
        <div class="benefit-group__head">
          <h4>${escapeHtml(typeLabel(EXCLUSION_TYPE_LABELS, group.exclusion_type))}</h4>
          ${multi ? `<span class="rules-count-note">${escapeHtml(t.matrix.rulesCount(group.rows.length))}</span>` : ""}
        </div>
        ${rowsHtml}
      </div>`;
    })
    .join("");

  app.innerHTML = `
    ${matrixBackButton(t.matrix.back)}
    <h1 class="page-title">${matrixBreadcrumb(insurer, product, variant)}</h1>
    <div class="nav-row" style="margin-top:-6px;margin-bottom:20px;justify-content:flex-end;">
      <button class="pill-btn ghost" data-action="change-selection">${escapeHtml(t.matrix.change)}</button>
    </div>

    <div class="card source-card">
      <div class="source-card__label">${escapeHtml(t.matrix.sourceLabel)}</div>
      <p style="margin-bottom:6px">${escapeHtml(t.matrix.sourceLine(product.villkorVersion || t.matrix.versionUnknown, product.effectiveFrom || "?"))}</p>
      <p style="margin-bottom:0;font-size:14px">${escapeHtml(t.matrix.sourceCaveat)}</p>
    </div>

    <h3>${escapeHtml(t.matrix.benefitsHeading)}</h3>
    <p class="lede" style="font-size:16px">${escapeHtml(t.matrix.benefitsIntro)}</p>
    <p class="status-legend">${escapeHtml(t.matrix.benefitsLegend)}</p>
    <p class="coverage-count-note">${escapeHtml(t.matrix.coverageCountNote(distinctTypes, totalTypes))}</p>

    <div class="trigger-filter" role="group" aria-label="${escapeHtml(t.matrix.triggerFilterLabel)}">
      <span class="trigger-filter__label">${escapeHtml(t.matrix.triggerFilterLabel)}</span>
      <div class="trigger-filter__buttons">
        <button class="pill-btn ${triggerFilter === "all" ? "" : "ghost"}" data-trigger-filter="all">${escapeHtml(t.matrix.triggerFilterAll)}</button>
        <button class="pill-btn ${triggerFilter === "accident" ? "" : "ghost"}" data-trigger-filter="accident">${escapeHtml(t.matrix.triggerFilterAccident)}</button>
        <button class="pill-btn ${triggerFilter === "illness" ? "" : "ghost"}" data-trigger-filter="illness">${escapeHtml(t.matrix.triggerFilterIllness)}</button>
      </div>
    </div>
    ${triggerFilter !== "all" && hiddenByTriggerCount > 0 ? `<p class="coverage-count-note">${escapeHtml(t.matrix.triggerHiddenNote(hiddenByTriggerCount))}</p>` : ""}
    ${benefitsHtml}

    <hr>
    <h3>${escapeHtml(t.matrix.exclusionsHeading)}</h3>
    <p class="lede" style="font-size:16px">${escapeHtml(t.matrix.exclusionsIntro)}</p>
    <p class="status-legend">${escapeHtml(t.matrix.exclusionsLegend)}</p>
    ${exclusionsHtml}

    <hr>
    <p class="plain-language-gap-note">${escapeHtml(t.matrix.plainLanguageGapNote)}</p>
  `;

  app.querySelector("[data-action=change-selection]").addEventListener("click", () => {
    navigateMatrix(null, null, null);
  });

  // Back one step from the result screen -- to variant-picker if this product actually has one
  // (more than one variant), else to product-picker if this insurer actually has one (more than
  // one product), else there was never anything between insurer-picker and here, so that's one
  // step back. Distinct from the "Byt bolag/produkt" pill above, which always resets fully.
  app.querySelector('[data-action="matrix-back"]').addEventListener("click", () => {
    if (product.variants.length > 1) {
      navigateMatrix(insurer.slug, product.name, null);
    } else if (insurer.products.length > 1) {
      navigateMatrix(insurer.slug, null, null);
    } else {
      navigateMatrix(null, null, null);
    }
  });

  app.querySelectorAll("[data-trigger-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      matrixState.triggerFilter = btn.dataset.triggerFilter;
      renderMatrix();
      // Deliberately no scrollTo(0,0) here -- unlike a navigation action, toggling the filter
      // should keep the family at the point in the list they were looking at.
    });
  });
}

// ---------------- HOME ----------------

function renderHome() {
  const t = T();
  const allRoutes = ["#/inventory", "#/coverage-matrix", "#/claim-process", "#/evidence", "#/templates", "#/sjukpenning-vab", "#/forsakringskassan/merkostnadsersattning", "#/forsakringskassan/omvardnadsbidrag"];
  const allIcons = ["inventory", "matrix", "claimProcess", "evidence", "templates", "calculator", "fk", "fk"];

  // Home page hierarchy, per Maximilian's 2026-08-03 review of a screenshot (docs/DECISIONS.md):
  // "Vad ert villkor säger" (index 1) is the single most useful thing here once a family already
  // knows they have a policy, so it gets its own prominent primary-CTA treatment instead of
  // competing with four other equally-weighted cards. The privacy note ("Ni loggar inte in...")
  // and the deadline note are both real and both stay reachable, but neither is the main event,
  // so both are demoted to quiet, compact treatments rather than a full card / full-bleed banner.
  const primaryIdx = 1;
  // Phase 2 / Försäkringskassan content (the calculator from Task 32, plus merkostnadsersättning
  // from Task 33) is kept out of the private-insurance nav-grid per Task 33's brief: those other
  // cards are all insurer-agnostic private-cover flows, and mixing in state-benefit content would
  // blur that. Grouped instead under its own "Statligt stöd" heading, same card styling.
  const govIdx = new Set([5, 6, 7]);
  const matrixCard = t.home.cards[primaryIdx];
  const withMeta = t.home.cards.map((c, i) => ({ ...c, route: allRoutes[i], icon: allIcons[i] }));
  const secondaryCards = withMeta.filter((_, i) => i !== primaryIdx && !govIdx.has(i));
  const govCards = withMeta.filter((_, i) => govIdx.has(i));

  const cardHtml = (c) => `
      <a href="${c.route}" class="nav-card">
        ${icon(c.icon)}
        <h3>${escapeHtml(c.title)}</h3>
        <p>${escapeHtml(c.desc)}</p>
      </a>`;

  const cardsHtml = secondaryCards.map(cardHtml).join("");
  const govCardsHtml = govCards.map(cardHtml).join("");

  app.innerHTML = `
    <section class="hero">
      <h1 class="page-title">${escapeHtml(t.home.heroTitle)}</h1>
      <p class="lede">${escapeHtml(t.home.heroLede)}</p>
    </section>

    <a href="#/coverage-matrix" class="primary-cta">
      ${icon("matrix")}
      <span class="primary-cta__text">
        <h2>${escapeHtml(matrixCard.title)}</h2>
        <p>${escapeHtml(matrixCard.desc)}</p>
      </span>
      <span class="primary-cta__arrow" aria-hidden="true">→</span>
    </a>

    <div class="nav-grid">${cardsHtml}</div>

    <h2 class="home-section-heading">${escapeHtml(t.home.govSectionTitle)}</h2>
    <div class="nav-grid">${govCardsHtml}</div>
  `;
}

// ---------------- COVERAGE INVENTORY (interactive question flow) ----------------

function renderInventory() {
  const t = T();
  const data = C().coverageInventory;
  const total = data.questions.length;
  // Range is 0 (intro) .. total (last question) .. total+1 (closing screen) -- the clamp's
  // upper bound must allow one past the last question, or the closing screen is unreachable
  // through the actual "next" click flow (found + fixed 2026-08-03, see docs/TASK_AUDIT.md).
  const idx = Math.min(Math.max(inventoryState.idx, 0), total + 1);

  if (idx === 0) {
    app.innerHTML = `
      ${backLink("#/", t.nav.home)}
      ${reviewedBadge(data.reviewedBy)}
      <h1 class="page-title">${escapeHtml(data.title)}</h1>
      <div class="card">${mdToHtml(data.introMarkdown)}</div>
      <div class="nav-row">
        <span></span>
        <button class="pill-btn" data-action="start">${escapeHtml(t.inventory.start(total))}</button>
      </div>
    `;
    app.querySelector("[data-action=start]").addEventListener("click", () => {
      inventoryState.idx = 1;
      renderInventory();
      window.scrollTo(0, 0);
    });
    return;
  }

  if (idx > total) {
    app.innerHTML = `
      ${backLink("#/", t.nav.home)}
      <div class="card finish-card">${mdToHtml(data.closingMarkdown)}</div>
      <div class="nav-row">
        <button class="pill-btn ghost" data-action="restart">${escapeHtml(t.inventory.restart)}</button>
        <a href="#/coverage-matrix" class="pill-btn">${escapeHtml(t.inventory.matrixCta)}</a>
        <a href="#/claim-process" class="pill-btn">${escapeHtml(t.inventory.nextSection(C().claimProcess.title))}</a>
      </div>
    `;
    app.querySelector("[data-action=restart]")?.addEventListener("click", () => {
      inventoryState.idx = 0;
      renderInventory();
      window.scrollTo(0, 0);
    });
    return;
  }

  const q = data.questions[idx - 1];
  const dots = Array.from({ length: total }, (_, i) => {
    const n = i + 1;
    const cls = n < idx ? "done" : n === idx ? "active" : "";
    return `<span class="progress-dot ${cls}"></span>`;
  }).join("");

  app.innerHTML = `
    ${backLink("#/", t.nav.home)}
    <div class="progress-row">${dots}<span class="progress-label">${escapeHtml(t.inventory.progress(idx, total))}</span></div>
    <div class="card question-card">${stripQuestionHeadingLine(q.markdown, q.heading)}</div>
    <div class="nav-row">
      <button class="pill-btn ghost" data-action="prev" ${idx === 1 ? "disabled" : ""}>${escapeHtml(t.inventory.prev)}</button>
      <button class="pill-btn" data-action="next">${escapeHtml(idx === total ? t.inventory.done : t.inventory.next)}</button>
    </div>
  `;

  app.querySelector("[data-action=prev]").addEventListener("click", () => {
    inventoryState.idx = Math.max(0, idx - 1);
    renderInventory();
    window.scrollTo(0, 0);
  });
  app.querySelector("[data-action=next]").addEventListener("click", () => {
    inventoryState.idx = idx + 1;
    renderInventory();
    window.scrollTo(0, 0);
  });
}

// The question's own markdown starts with "## Fråga N — heading" (or, in English,
// "## Question N — heading"); render that as a plain h3 instead of letting mdToHtml turn
// it into a generic h4/h5, so it reads as one clear screen rather than a floating heading
// level. The progress row above already says "Question N of 6", so the heading doesn't
// need its own repeated number.
function stripQuestionHeadingLine(markdown, heading) {
  const withoutHeading = markdown.replace(/^## (Fråga|Question) \d+ — .+\n/, "");
  return `<h3>${escapeHtml(heading)}</h3>` + mdToHtml(withoutHeading);
}

// ---------------- long-form guided-reading pages ----------------

function renderLongform(key) {
  const t = T();
  // Fall back to the Swedish content when this locale's translation doesn't exist yet -- same
  // reasoning as the pre-Task-8b aboutUs fallback (see build_content.py's comment on this same
  // gap for content/forsakringskassan/*.md, first hit by Task 33's merkostnadsersättning page).
  const data = C()[key] || window.CONTENT[key];
  app.innerHTML = `
    ${backLink("#/", t.nav.home)}
    ${reviewedBadge(data.reviewedBy)}
    <h1 class="page-title">${escapeHtml(data.title)}</h1>
    ${mdToHtml(data.markdown.replace(/^# .+\n/, ""))}
  `;
}

function renderClaimProcess() {
  renderLongform("claimProcess");
}
function renderEvidence() {
  renderLongform("evidenceChecklist");
}
function renderDeadlines() {
  renderLongform("deadlines");
}

function renderAboutUs() {
  renderLongform("aboutUs");
}

function renderMerkostnadsersattning() {
  renderLongform("merkostnadsersattning");
}

function renderOmvardnadsbidrag() {
  renderLongform("omvardnadsbidrag");
}

// ---------------- templates (copy-to-clipboard) ----------------

function renderTemplates() {
  const t = T();
  const data = C().templates;
  const itemsHtml = data.items
    .map(
      (item) => `
      <div class="template-item">
        <h3>${item.num}. ${escapeHtml(item.heading)}</h3>
        ${item.proseBeforeMarkdown ? mdToHtml(item.proseBeforeMarkdown) : ""}
        <div class="template-quote" id="quote-${item.num}">${escapeHtml(item.quoteText)}
          <button class="copy-btn" data-copy-target="quote-${item.num}">${escapeHtml(t.templates.copy)}</button>
        </div>
        ${item.proseAfterMarkdown ? mdToHtml(item.proseAfterMarkdown) : ""}
      </div>`
    )
    .join("");

  app.innerHTML = `
    ${backLink("#/", t.nav.home)}
    ${reviewedBadge(data.reviewedBy)}
    <h1 class="page-title">${escapeHtml(data.title)}</h1>
    ${mdToHtml(data.introMarkdown.replace(/^# .+\n/, ""))}
    ${itemsHtml}
    <hr>
    ${mdToHtml(data.closingMarkdown)}
  `;

  app.querySelectorAll(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const box = document.getElementById(btn.dataset.copyTarget);
      const copyLabel = T().templates.copy;
      const text = box.textContent.replace(new RegExp(`${copyLabel}\\s*$`), "").trim();
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // Fallback for environments without clipboard permission (e.g. plain file://).
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      }
      const copiedLabel = T().templates.copied;
      btn.textContent = copiedLabel;
      btn.classList.add("copied");
      setTimeout(() => {
        btn.textContent = T().templates.copy;
        btn.classList.remove("copied");
      }, 1800);
    });
  });
}

// ---------------- SJUKPENNING VS VAB CALCULATOR (Task 32, gated on Task 31) ----------------
// Data comes from window.CBA_PRESETS (mockup/cba-data.js), sourced by Task 31
// (docs/SJUKPENNING_VS_VAB.md). Every named agreement is one array entry read generically by
// dailyPathFraction() below -- no per-agreement "if (id === ...)" branches, same discipline as
// the coverage matrix's insurer-agnostic rendering.
//
// Framing discipline (Task 32 brief, non-negotiable points 1-2): this is a calculator, not a
// verdict, and never a suggestion to obtain sjukskrivning under false pretenses. The warning
// box in renderCalculator() states the doctor-certification requirement before any input field,
// not after the numbers -- and every number a family sees traces to a stated source (point 5).
//
// In-memory only, resets on reload (point 3) -- same discipline as inventoryState/matrixState,
// even though salary/employer figures aren't health data themselves.
const calcState = { salary: null, cbaId: "unknown", customPercent: 10, customStartDay: 91 };

const PBB_2026 = 59200; // Försäkringskassan, Aktuella belopp — see docs/SJUKPENNING_VS_VAB.md §1
const MONTHLY_PBB = PBB_2026 / 12;
const SJUKPENNING_CAP_MONTHLY = 8 * MONTHLY_PBB; // ≈39 467 kr — sjukpenning's own income ceiling
const VAB_CAP_MONTHLY = 7.5 * MONTHLY_PBB; // 37 000 kr — VAB's income ceiling (a DIFFERENT cap, see §1)
const TIER1_CAP_MONTHLY = 7.5 * MONTHLY_PBB; // AGS-KL/ITP tier 1 boundary — numerically the same as the VAB cap
const TIER2_CAP_MONTHLY = 20 * MONTHLY_PBB;
const TIER3_CAP_MONTHLY = 30 * MONTHLY_PBB;

function findCbaPreset(id) {
  return (window.CBA_PRESETS || []).find((p) => p.id === id) || null;
}

// Resolves the current calcState.cbaId to a preset-shaped object for dailyPathFraction(), or
// null for "unknown" (no top-up assumed -- principle 6, point 6 of the brief: never guess a
// default). "custom" is built from the two free-entry fields rather than looked up.
function resolvedCba() {
  if (calcState.cbaId === "unknown") return null;
  if (calcState.cbaId === "custom") {
    const pct = Number(calcState.customPercent);
    const day = Number(calcState.customStartDay);
    if (!Number.isFinite(pct) || !Number.isFinite(day) || pct <= 0 || day <= 0) return null;
    return { model: "custom", startDay: day, customPercent: pct / 100 };
  }
  return findCbaPreset(calcState.cbaId);
}

// Fraction of monthly salary `salary` the sjukpenning-path pays on sick-day `d` (1-indexed day
// of the parent's OWN continuous sick period): sjuklön days 1-14, sjukpenning day 15 onward,
// plus any collectively-bargained top-up from its own start day. Karensavdrag (a one-time
// deduction, not an ongoing rate) is applied separately, once, in computeMonths().
function dailyPathFraction(d, salary, cba) {
  if (d <= 14) return 0.8; // sjuklön -- % of actual pay, no SGI-style ceiling found (see §2)
  const normalPeriod = d <= 364;
  const r = normalPeriod ? 0.8 : 0.75; // sjukpenning: normalnivå / fortsättningsnivå
  const sjukpenningKr = r * Math.min(salary, SJUKPENNING_CAP_MONTHLY);
  let topUpKr = 0;
  if (cba && d >= cba.startDay) {
    if (cba.model === "tiered") {
      const band1 = Math.min(salary, TIER1_CAP_MONTHLY);
      const band2 = Math.max(0, Math.min(salary, TIER2_CAP_MONTHLY) - TIER1_CAP_MONTHLY);
      const band3 = Math.max(0, Math.min(salary, TIER3_CAP_MONTHLY) - TIER2_CAP_MONTHLY);
      const tier1Pct = normalPeriod ? cba.tier1PercentOfSjukpenningNormal : cba.tier1PercentOfSjukpenningContinuation;
      topUpKr = tier1Pct * (r * band1) + cba.tier2PercentOfSalary * band2 + cba.tier3PercentOfSalary * band3;
    } else if (cba.model === "flat") {
      const base = Math.min(salary, cba.flatCapMonthly || SJUKPENNING_CAP_MONTHLY);
      topUpKr = cba.flatPercentOfSjukpenning * (r * base);
    } else if (cba.model === "custom") {
      topUpKr = cba.customPercent * (r * Math.min(salary, SJUKPENNING_CAP_MONTHLY));
    }
  }
  const totalKr = Math.min(sjukpenningKr + topUpKr, salary); // safety clamp -- formula shouldn't exceed salary
  return totalKr / salary;
}

// 13 months of 30 days each (390 sick-days), day-by-day, then averaged per month -- this is
// deliberately NOT a closed-form shortcut: the day-15, day-91 and day-364/365 transitions each
// land inside a real month for at least one CBA choice (the "ags" preset starts its top-up at
// day 15, inside month 1), and a family reading a transition month should see a blended
// average, not a value that silently picks one side of the change.
function computeMonths(salary, cba) {
  const months = [];
  const weeklyPay = salary / 4.348; // 365 / 7 / 12
  const karensavdrag = 0.2 * weeklyPay; // one-time -- Lag (1991:1047) om sjuklön §6
  const vabFraction = (0.8 * Math.min(salary, VAB_CAP_MONTHLY)) / salary;

  for (let m = 1; m <= 13; m++) {
    const fromDay = (m - 1) * 30 + 1;
    const toDay = m * 30;
    let sum = 0;
    for (let d = fromDay; d <= toDay; d++) sum += dailyPathFraction(d, salary, cba);
    let sickKr = (sum / 30) * salary;
    if (m === 1) sickKr = Math.max(0, sickKr - karensavdrag);
    months.push({ month: m, fromDay, toDay, salaryKr: salary, vabKr: vabFraction * salary, sickKr });
  }
  return months;
}

function calcNumber(kr) {
  return Math.round(kr).toLocaleString(locale === "en" ? "en-GB" : "sv-SE") + " kr";
}

function cbaSourceHtml(cba, t) {
  if (!cba || !cba.sourceLabel) return "";
  const note = cba.confidenceNote ? `<div class="confidence-flag">${escapeHtml(cba.confidenceNote[locale])}</div>` : "";
  return `
    <div class="citation-label">${escapeHtml(t.calculator.sourceLabel)}: <a href="${escapeHtml(cba.sourceUrl)}" class="inline-link" target="_blank" rel="noopener">${escapeHtml(cba.sourceLabel[locale])}</a></div>
    ${note}`;
}

// Renders only the results section (#calc-results) so a keystroke in the salary/custom-percent/
// custom-day inputs never re-renders the inputs themselves -- rebuilding the whole form on every
// keystroke would reset the text cursor to the end of the field on each character typed.
function updateCalcResults() {
  const t = T();
  const el = document.getElementById("calc-results");
  if (!el) return;
  const salary = Number(calcState.salary);
  if (!Number.isFinite(salary) || salary <= 0) {
    el.innerHTML = `<p class="lede" style="font-size:16px">${escapeHtml(t.calculator.enterSalaryPrompt)}</p>`;
    return;
  }
  const cba = resolvedCba();
  const months = computeMonths(salary, cba);
  const maxKr = salary; // 100%-width reference for every bar -- never rescaled per row, or rows stop being comparable to each other

  const rowsHtml = months
    .map((mo) => {
      const vabPct = Math.round((mo.vabKr / maxKr) * 100);
      const sickPct = Math.round((mo.sickKr / maxKr) * 100);
      return `
      <div class="calc-month">
        <div class="calc-month__head">
          <span class="calc-month__title">${escapeHtml(t.calculator.monthLabel(mo.month))}</span>
          <span class="calc-month__days">${escapeHtml(t.calculator.dayRangeLabel(mo.fromDay, mo.toDay))}</span>
        </div>
        <div class="calc-bar-row">
          <span class="calc-bar-label">${escapeHtml(t.calculator.legendVab)}</span>
          <span class="calc-bar-track"><span class="calc-bar-fill calc-bar-fill--vab" style="width:${Math.min(vabPct, 100)}%"></span></span>
          <span class="calc-bar-value">${calcNumber(mo.vabKr)}</span>
        </div>
        <div class="calc-bar-row">
          <span class="calc-bar-label">${escapeHtml(t.calculator.legendSick)}</span>
          <span class="calc-bar-track"><span class="calc-bar-fill calc-bar-fill--sick" style="width:${Math.min(sickPct, 100)}%"></span></span>
          <span class="calc-bar-value">${calcNumber(mo.sickKr)}</span>
        </div>
      </div>`;
    })
    .join("");

  el.innerHTML = `
    <div class="calc-legend">
      <span><span class="calc-legend__swatch" style="background:var(--card-border)"></span>${escapeHtml(t.calculator.legendSalary)}: ${calcNumber(salary)}/${locale === "en" ? "mo" : "mån"}</span>
      <span><span class="calc-legend__swatch" style="background:var(--sage)"></span>${escapeHtml(t.calculator.legendVab)}</span>
      <span><span class="calc-legend__swatch" style="background:var(--ochre)"></span>${escapeHtml(t.calculator.legendSick)}</span>
    </div>
    ${rowsHtml}
    <p class="plain-language-gap-note">${escapeHtml(t.calculator.approxNote)}</p>
  `;
}

function renderCalculator() {
  const t = T();
  const presets = window.CBA_PRESETS || [];

  // Single <select>, data-driven from window.CBA_PRESETS -- adding a 4th preset to
  // cba-data.js requires zero changes here (Task 32c).
  const cbaOptionsHtml = presets
    .map(
      (p) => `<option value="${escapeHtml(p.id)}" ${calcState.cbaId === p.id ? "selected" : ""}>${escapeHtml(p.name[locale])}</option>`
    )
    .join("");

  // Exactly one info panel below the select, for the currently-selected option only --
  // "custom" has its own input fields (no source panel needed) and "unknown" has its own
  // unknownNote paragraph (rendered further down, unchanged); only a resolved preset gets
  // the administrator/start-day/source-link/confidence-note panel.
  const selectedPreset = findCbaPreset(calcState.cbaId);
  const cbaInfoPanelHtml = selectedPreset
    ? `
    <div class="cba-info-panel">
      <p class="option-card__sub">${escapeHtml(t.calculator.startDayFrom(selectedPreset.startDay))} · ${escapeHtml(selectedPreset.administrator)}</p>
      ${cbaSourceHtml(selectedPreset, t)}
    </div>`
    : "";

  app.innerHTML = `
    ${backLink("#/", t.nav.home)}
    <h1 class="page-title">${escapeHtml(t.calculator.title)}</h1>
    <p class="lede">${escapeHtml(t.calculator.lede)}</p>

    <div class="calc-warning">
      <div class="calc-warning__title">${escapeHtml(t.calculator.warningTitle)}</div>
      <p>${escapeHtml(t.calculator.warningBody)}</p>
    </div>

    <div class="calc-input-group">
      <label class="calc-label" for="calc-salary">${escapeHtml(t.calculator.salaryLabel)}</label>
      <input type="number" min="0" step="500" inputmode="numeric" id="calc-salary" class="calc-input"
        placeholder="${escapeHtml(t.calculator.salaryPlaceholder)}" value="${calcState.salary || ""}">
      <p class="calc-help">${escapeHtml(t.calculator.salaryHelp)}</p>
    </div>

    <h3>${escapeHtml(t.calculator.cbaHeading)}</h3>
    <p class="lede" style="font-size:16px">${escapeHtml(t.calculator.cbaLede)}</p>
    <label class="sr-only" for="calc-cba-select">${escapeHtml(t.calculator.cbaHeading)}</label>
    <select id="calc-cba-select" class="calc-input">
      ${cbaOptionsHtml}
      <option value="custom" ${calcState.cbaId === "custom" ? "selected" : ""}>${escapeHtml(t.calculator.cbaCustomName)}</option>
      <option value="unknown" ${calcState.cbaId === "unknown" ? "selected" : ""}>${escapeHtml(t.calculator.cbaUnknownName)}</option>
    </select>
    ${cbaInfoPanelHtml}

    ${
      calcState.cbaId === "custom"
        ? `
    <div class="calc-input-group calc-input-group--inline">
      <div>
        <label class="calc-label" for="calc-custom-pct">${escapeHtml(t.calculator.customPercentLabel)}</label>
        <input type="number" min="0" step="1" id="calc-custom-pct" class="calc-input calc-input--small" value="${calcState.customPercent}">
      </div>
      <div>
        <label class="calc-label" for="calc-custom-day">${escapeHtml(t.calculator.customStartDayLabel)}</label>
        <input type="number" min="1" step="1" id="calc-custom-day" class="calc-input calc-input--small" value="${calcState.customStartDay}">
      </div>
    </div>`
        : ""
    }
    ${calcState.cbaId === "unknown" ? `<p class="calc-help">${escapeHtml(t.calculator.unknownNote)}</p>` : ""}

    <hr>
    <h3>${escapeHtml(t.calculator.resultsHeading)}</h3>
    <p class="lede" style="font-size:16px">${escapeHtml(t.calculator.resultsIntro)}</p>
    <div id="calc-results"></div>

    <hr>
    <h4>${escapeHtml(t.calculator.capSourceHeading)}</h4>
    <p class="calc-help">${escapeHtml(t.calculator.capSourceNote)}</p>

    <div class="card">
      <h3 style="margin-top:0">${escapeHtml(t.calculator.healthHeading)}</h3>
      <p>${escapeHtml(t.calculator.healthIntro)}</p>
      <ul>${t.calculator.healthItems.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>
      <p style="margin-bottom:0">${escapeHtml(t.calculator.healthClosing)}</p>
    </div>
  `;

  document.getElementById("calc-salary").addEventListener("input", (e) => {
    calcState.salary = e.target.value;
    updateCalcResults();
  });
  document.getElementById("calc-custom-pct")?.addEventListener("input", (e) => {
    calcState.customPercent = e.target.value;
    updateCalcResults();
  });
  document.getElementById("calc-custom-day")?.addEventListener("input", (e) => {
    calcState.customStartDay = e.target.value;
    updateCalcResults();
  });
  document.getElementById("calc-cba-select").addEventListener("change", (e) => {
    calcState.cbaId = e.target.value;
    renderCalculator(); // full re-render -- switching to/from "custom" changes which fields show
  });

  updateCalcResults();
}

// ---------------- router ----------------

const routes = {
  "/": renderHome,
  "/inventory": renderInventory,
  "/coverage-matrix": renderMatrix,
  "/claim-process": renderClaimProcess,
  "/evidence": renderEvidence,
  "/deadlines": renderDeadlines,
  "/templates": renderTemplates,
  "/om-oss": renderAboutUs,
  "/sjukpenning-vab": renderCalculator,
  "/forsakringskassan/merkostnadsersattning": renderMerkostnadsersattning,
  "/forsakringskassan/omvardnadsbidrag": renderOmvardnadsbidrag,
};

function route() {
  const hash = location.hash || "#/";
  const path = hash.replace(/^#/, "").split("?")[0] || "/";
  if (path !== "/inventory") inventoryState.idx = 0; // leaving the flow always resets it

  if (path === "/coverage-matrix" || path.startsWith("/coverage-matrix/")) {
    const segments = path.split("/").filter(Boolean).slice(1); // drop the "coverage-matrix" segment itself
    applyMatrixHashSegments(segments);
    matrixState.triggerFilter = "all";
    setActiveNav("/coverage-matrix");
    renderMatrix();
    window.scrollTo(0, 0);
    return;
  }

  const handler = routes[path] || renderHome;
  setActiveNav(path);
  handler();
}

function initLangToggle() {
  document.querySelectorAll("#lang-toggle button").forEach((btn) => {
    btn.addEventListener("click", () => setLocale(btn.dataset.locale));
  });
}

document.documentElement.lang = locale;
window.addEventListener("hashchange", route);
window.addEventListener("DOMContentLoaded", () => {
  initLangToggle();
  updateNavChrome();
  route();
});
route();
