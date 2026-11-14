import type { GuideChapter, GuideAppendix } from './types';
import { chapter as c01 } from './chapters/01-first-year-roadmap';
import { chapter as c02 } from './chapters/02-law-and-neighbours';
import { chapter as c03 } from './chapters/03-apiary-site';
import { chapter as c04 } from './chapters/04-the-colony';
import { chapter as c05 } from './chapters/05-hives-and-tools';
import { chapter as c06 } from './chapters/06-choosing-bees';
import { chapter as c07 } from './chapters/07-inspections';
import { chapter as c08 } from './chapters/08-brood-and-queen-cells';
import { chapter as c09 } from './chapters/09-space-and-feeding';
import { chapter as c10 } from './chapters/10-swarming';
import { chapter as c11 } from './chapters/11-swarms-moving-combining';
import { chapter as c12 } from './chapters/12-queens-and-increase';
import { chapter as c13 } from './chapters/13-forage';
import { chapter as c14 } from './chapters/14-weather-and-climate';
import { chapter as c15 } from './chapters/15-seasons';
import { chapter as c16 } from './chapters/16-calendar';
import { chapter as c17 } from './chapters/17-nectar-to-honey';
import { chapter as c18 } from './chapters/18-extraction-and-bottling';
import { chapter as c19 } from './chapters/19-selling-honey';
import { chapter as c20 } from './chapters/20-disease';
import { chapter as c21 } from './chapters/21-varroa';
import { chapter as c22 } from './chapters/22-medicines-and-records';
import { chapter as c23 } from './chapters/23-hornets-and-threats';
import { chapter as c24 } from './chapters/24-biosecurity';
import { chapter as c25 } from './chapters/25-troubleshooting';
import { chapter as c26 } from './chapters/26-sustainable-breeding';
import { chapter as c27 } from './chapters/27-hobby-to-small-apiary';
import { chapter as c28 } from './chapters/28-development';
import { appendix as aA } from './appendices/a-before-you-buy';
import { appendix as aB } from './appendices/b-inspection-record';
import { appendix as aC } from './appendices/c-swarm-action-card';
import { appendix as aD } from './appendices/d-medicine-register';
import { appendix as aE } from './appendices/e-extraction-register';
import { appendix as aF } from './appendices/f-national-rules';
import { appendix as aG } from './appendices/g-glossary';
import { appendix as aH } from './appendices/h-sources';

export const guideChapters: readonly GuideChapter[] = [c01, c02, c03, c04, c05, c06, c07, c08, c09, c10, c11, c12, c13, c14, c15, c16, c17, c18, c19, c20, c21, c22, c23, c24, c25, c26, c27, c28];
export const guideAppendices: readonly GuideAppendix[] = [aA, aB, aC, aD, aE, aF, aG, aH];
export const guideParts = [
  {
    "part": "I",
    "title": "Getting started"
  },
  {
    "part": "II",
    "title": "The bees and their equipment"
  },
  {
    "part": "III",
    "title": "Managing a live colony"
  },
  {
    "part": "IV",
    "title": "Forage, weather and the seasons"
  },
  {
    "part": "V",
    "title": "Honey and other hive products"
  },
  {
    "part": "VI",
    "title": "Diseases, pests, medicines and emergencies"
  },
  {
    "part": "VII",
    "title": "Becoming an experienced beekeeper"
  }
] as const;
