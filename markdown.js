// Minimal, deterministic markdown -> HTML renderer.
// Deliberately does not "understand" or rewrite content — it only maps markdown syntax
// to HTML tags so that content/*.md can be rendered verbatim (principle 3: no runtime
// generation of family-facing text). Internal links to other content/*.md files are
// rewritten to in-app hash routes.

const FILE_TO_ROUTE = {
  "coverage-inventory.md": "#/inventory",
  "claim-process.md": "#/claim-process",
  "evidence-checklist.md": "#/evidence",
  "deadlines.md": "#/deadlines",
  "templates.md": "#/templates",
};

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Inline formatting: **bold**, [text](link.md) -> in-app route or external href.
function renderInline(text) {
  let out = escapeHtml(text);
  out = out.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, label, href) => {
    const route = FILE_TO_ROUTE[href];
    if (route) return `<a href="${route}" class="inline-link">${label}</a>`;
    // A link already written as an in-app hash route (e.g. content/forsakringskassan/*.md
    // cross-referencing "#/coverage-matrix", Task 35) renders as a normal in-page link,
    // not target="_blank" -- it isn't actually leaving the app.
    if (href.startsWith("#/")) return `<a href="${escapeHtml(href)}" class="inline-link">${label}</a>`;
    return `<a href="${escapeHtml(href)}" class="inline-link" target="_blank" rel="noopener">${label}</a>`;
  });
  return out;
}

// Render a block of markdown (headings, paragraphs, lists, hr, tables, blockquotes) to HTML.
// Supports: #/##/### headings, "- " bullet lists, "---" horizontal rules,
// blank-line-separated paragraphs, pipe tables with a "|---|---|" header separator, and
// "> " blockquotes (Task 40) -- including a blockquote nested inside a "- " list item,
// which is why a list item's content is a small ordered sequence of segments (accumulated
// text runs interleaved with pre-rendered blockquote HTML) rather than a single string.
function mdToHtml(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let para = [];
  let list = null; // array of items; each item is an array of segments:
                    // {type:"text", value} (joined+inline-rendered at flush time) or
                    // {type:"html", value} (pre-rendered block HTML, spliced in verbatim)
  let quote = null; // array of raw blockquote-content lines currently being accumulated

  function currentListItem() {
    return list[list.length - 1];
  }
  function pushListText(text) {
    const item = currentListItem();
    const last = item[item.length - 1];
    if (last && last.type === "text") {
      last.value += " " + text;
    } else {
      item.push({ type: "text", value: text });
    }
  }
  function pushListHtml(htmlStr) {
    currentListItem().push({ type: "html", value: htmlStr });
  }
  function flushPara() {
    if (para.length) {
      html.push(`<p>${renderInline(para.join(" "))}</p>`);
      para = [];
    }
  }
  function renderListItem(item) {
    return item
      .map((seg) => (seg.type === "html" ? seg.value : renderInline(seg.value)))
      .join("");
  }
  function flushList() {
    if (list) {
      html.push(
        `<ul>${list.map((item) => `<li>${renderListItem(item)}</li>`).join("")}</ul>`
      );
      list = null;
    }
  }
  function flushQuote() {
    if (quote && quote.length) {
      const bq = `<blockquote>${renderInline(quote.join(" "))}</blockquote>`;
      if (list) {
        pushListHtml(bq);
      } else {
        html.push(bq);
      }
    }
    quote = null;
  }
  function isTableRow(line) {
    return /^\|.+\|$/.test(line.trim());
  }
  function isTableSeparator(line) {
    return /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/.test(line.trim());
  }
  function splitTableRow(line) {
    const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
    return trimmed.split("|").map((c) => c.trim());
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd();
    const trimmed = line.trim();

    // A line whose trimmed content starts with ">" opens or continues a blockquote --
    // works both at the top level (content/*.md's standalone quotes) and nested inside
    // a "- " list item (the leading indent is irrelevant here, only the ">" matters).
    if (trimmed.startsWith(">")) {
      flushPara();
      let content = trimmed.slice(1);
      if (content.startsWith(" ")) content = content.slice(1);
      if (!quote) quote = [];
      quote.push(content);
      continue;
    }
    // Any non-blockquote line ends a blockquote that was in progress.
    if (quote) flushQuote();

    if (trimmed === "") {
      flushPara();
      // A blank line does NOT unconditionally close an open list (Task 40): it may just
      // separate a bullet's own multi-paragraph content, or a nested blockquote, from the
      // rest of that same bullet -- or simply separate one loose-list item from the next.
      // Only close the list once we can tell it has actually ended, i.e. the next line is
      // neither an indented continuation (>=2 spaces -- covers wrapped text, a further
      // paragraph, or a nested "> " blockquote) nor the start of another "- " item.
      if (list) {
        const next = lines[i + 1];
        const staysOpen =
          next !== undefined && (/^\s{2,}/.test(next) || /^-\s+/.test(next.trim()));
        if (!staysOpen) flushList();
      }
      continue;
    }
    if (trimmed === "---") {
      flushPara();
      flushList();
      html.push("<hr>");
      continue;
    }
    // A "| a | b |" row immediately followed by a "|---|---|" separator opens a table --
    // same two-line lookahead every other markdown table syntax uses.
    if (isTableRow(line) && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      flushPara();
      flushList();
      const headerCells = splitTableRow(line);
      let j = i + 2;
      const bodyRows = [];
      while (j < lines.length && isTableRow(lines[j])) {
        bodyRows.push(splitTableRow(lines[j]));
        j++;
      }
      const thead = `<thead><tr>${headerCells.map((c) => `<th>${renderInline(c)}</th>`).join("")}</tr></thead>`;
      const tbody = `<tbody>${bodyRows
        .map((r) => `<tr>${r.map((c) => `<td>${renderInline(c)}</td>`).join("")}</tr>`)
        .join("")}</tbody>`;
      html.push(`<table class="md-table">${thead}${tbody}</table>`);
      i = j - 1; // resume the outer loop right after the consumed table block
      continue;
    }
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) {
      flushPara();
      flushList();
      const level = h[1].length + 2; // keep h1s reserved for page chrome
      html.push(`<h${level}>${renderInline(h[2])}</h${level}>`);
      continue;
    }
    const li = /^-\s+(.*)$/.exec(trimmed);
    if (li) {
      flushPara();
      if (!list) list = [];
      list.push([{ type: "text", value: li[1] }]);
      continue;
    }
    // A line that doesn't open a new block while we're inside a list is a
    // wrapped continuation of the current bullet (markdown line-wrapping),
    // or -- after a nested blockquote -- the bullet's remaining trailing text.
    if (list) {
      pushListText(trimmed);
      continue;
    }
    para.push(line);
  }
  flushPara();
  if (quote) flushQuote();
  flushList();
  return html.join("\n");
}
