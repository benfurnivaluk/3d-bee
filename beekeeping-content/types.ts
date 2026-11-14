// Content extracted from "The Complete UK Beekeeping Field Guide", 2026 edition (research checked 13 November 2026).
export type GuideListItem = { text: string; lead?: string };
export type GuideBlock =
  | { type: 'p'; text: string; lead?: string }
  | { type: 'callout'; text: string; lead?: string }
  | { type: 'heading'; id: string; text: string }
  | { type: 'ol' | 'ul'; items: GuideListItem[] }
  | { type: 'checklist'; items: string[] }
  | { type: 'table'; columns: string[]; rows: string[][] }
  | { type: 'figure'; figure: 'development-times' | 'hive-components' | 'harvest-workflow' | 'unknown'; caption: string };
export type GuideLink = { text: string; href: string };
export interface GuideChapter {
  number: number; slug: string; title: string; shortTitle: string; part: string; partTitle: string;
  level: number; readingMinutes: number; toc: { id: string; text: string }[]; blocks: GuideBlock[]; links: GuideLink[];
}
export interface GuideAppendix {
  letter: string; slug: string; title: string; shortTitle: string; printable: boolean; blocks: GuideBlock[]; links: GuideLink[];
}
export interface GuideCalendar {
  source: string; intro: string; seasonalPriorities: { type: 'callout'; text: string; lead?: string };
  months: { month: string; focus: string; jobs: string[]; forage: { period: string; plants: string; note: string } | null }[];
}
