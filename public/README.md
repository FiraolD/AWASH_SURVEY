# Public assets

Place these files here before running `npm run dev`:

- `logo.jpg`  — the Awash Insurance logo. The HTML prototype embeds it as a
  30 KB base64 data URI; save that decoded PNG here. Any reasonably-sized
  version (e.g. ~1000×300) works.
- `fonts/NotoSansEthiopic-Regular.ttf`
- `fonts/NotoSansEthiopic-Bold.ttf`

Download the fonts from Google Fonts:
https://fonts.google.com/noto/specimen/Noto+Sans+Ethiopic

Without `logo.jpg` the PDF renders without a logo (the code checks with
`existsSync`). Without the Ethiopic font, Amharic text in the PDF will not
render correctly — this is not optional.

The Excel parts list should be saved as `db/seed/parts.xlsx` (Sheet1, two
columns: English, Amharic). `scripts/import-parts.ts` reads it directly.