# Beekeeping field guide content

Typed content extracted from Ben's PDF "The Complete UK Beekeeping Field Guide" (2026 edition, research checked 13 November 2026).

- types.ts: content schema.
- index.ts: ordered lists of all 28 chapters and 8 appendices, plus the seven parts.
- chapters/NN-slug.ts: one file per chapter (blocks: p, callout, heading, ol, ul, checklist, table, figure). `links` lists the PDF's hyperlinks: wrap the first occurrence of each `text` in the chapter with a link to `href`.
- appendices/X-slug.ts: printable field sheets (A–E) and reference appendices (F–H).
- calendar.ts: month-by-month jobs (chapter 16) and forage (chapter 13), used for the hub's "This month" cards.
