import type { GuideAppendix } from '../types';

export const appendix: GuideAppendix = {
  "letter": "D",
  "slug": "medicine-register",
  "title": "Veterinary-medicine register template",
  "shortTitle": "Medicine register",
  "printable": true,
  "blocks": [
    {
      "type": "p",
      "lead": "This form supports recordkeeping but does not replace any legally required fields or current instructions.",
      "text": "Keep statutory medicine records for at least five years where applicable."
    },
    {
      "type": "table",
      "columns": [
        "Field",
        "Record"
      ],
      "rows": [
        [
          "Apiary / hive / colony ID",
          "__________________________________________"
        ],
        [
          "Product trade name and VMD number",
          "__________________________________________"
        ],
        [
          "Active substance / supplier / purchase date",
          "__________________________________________"
        ],
        [
          "Product batch/lot and quantity purchased",
          "__________________________________________"
        ],
        [
          "Current authorised territory and SPC checked on",
          "__________________________________________"
        ],
        [
          "Administration date(s) and amount/route used",
          "__________________________________________"
        ],
        [
          "Colony conditions and temperature where relevant",
          "__________________________________________"
        ],
        [
          "Treatment end / removal date",
          "__________________________________________"
        ],
        [
          "Honey-super / withdrawal restrictions observed",
          "__________________________________________"
        ],
        [
          "Operator / veterinary direction, if applicable",
          "__________________________________________"
        ],
        [
          "Follow-up mite check and effectiveness",
          "__________________________________________"
        ],
        [
          "Unused product disposal / other notes",
          "__________________________________________"
        ]
      ]
    },
    {
      "type": "p",
      "lead": "Reminder:",
      "text": "never infer instructions from the table in Chapter 22; consult the current official product SPC and label for each application."
    }
  ],
  "links": []
};
