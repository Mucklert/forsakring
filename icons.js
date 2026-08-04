// Small line icons, single stroke, currentColor — echoes pantamera.nu's icon-led nav
// (each top-level section has its own icon) without borrowing its playful color/mascot
// register, which doesn't fit this subject matter. Deliberately plain and monochrome.

const ICONS = {
  inventory: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="10.5" cy="10.5" r="6.5"/><line x1="15.4" y1="15.4" x2="21" y2="21"/></svg>`,
  claimProcess: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3.5h6a1 1 0 0 1 1 1V6H8V4.5a1 1 0 0 1 1-1Z"/><path d="M8.5 11.5l2 2 4.5-4.5"/><line x1="8.5" y1="17" x2="15.5" y2="17"/></svg>`,
  evidence: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8a2 2 0 0 1 2-2h1.2l.9-1.5A1 1 0 0 1 9 4h6a1 1 0 0 1 .9.5L16.8 6H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z"/><circle cx="12" cy="13" r="3.2"/></svg>`,
  deadlines: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 8.5V13l3 2"/><path d="M9.5 2.5h5"/></svg>`,
  templates: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4 7l8 6 8-6"/></svg>`,
  matrix: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5l7 3v5.5c0 4.5-3 7.5-7 8.5-4-1-7-4-7-8.5V6.5l7-3Z"/><path d="M9 12.2l2.2 2.2L15.5 10"/></svg>`,
  calculator: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3.5" width="14" height="17" rx="2"/><line x1="8" y1="7.5" x2="16" y2="7.5"/><line x1="8" y1="12" x2="8" y2="12"/><line x1="12" y1="12" x2="12" y2="12"/><line x1="16" y1="12" x2="16" y2="12"/><line x1="8" y1="15.5" x2="8" y2="15.5"/><line x1="12" y1="15.5" x2="12" y2="15.5"/><line x1="16" y1="15.5" x2="16" y2="15.5"/></svg>`,
  fk: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9.5" cy="14.5" r="5"/><circle cx="14.5" cy="9.5" r="5"/></svg>`,
};

function icon(name, cls = "") {
  return `<span class="nav-icon ${cls}" aria-hidden="true">${ICONS[name] || ""}</span>`;
}
