# Koptic Karen Site

This is the functioning responsive website based on the approved Koptic Karen dashboard design.

## Included
- All 366 Coptic calendar dates
- Search across every commemoration in the included dataset
- Gregorian-to-Coptic date conversion
- Date selection and month navigation
- Story, reflection, practical application, and related-saints tabs
- Saved saints and sharing
- Anonymous prayer-request preview
- Reminder-time preference
- Install-to-phone guide
- Responsive phone, tablet, and desktop layouts
- Realistic hoodie image based on the approved design

## Run locally
Do not double-click the HTML file when testing installation or offline behavior.

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Historical text and sources
The calendar associates every entry with its Coptic date and source link. The included historical paragraphs are concise original summaries. The complete source account opens from each saint window. This avoids presenting copied Coptic Reader or source-site text as original Koptic Karen material.

The contemporary reflections and “How to Apply This Today” sections are original Koptic Karen devotional content and are visibly separated from historical source material.

## Before public launch
- Obtain written permission for any third-party icon or full story text you plan to host.
- Replace icon placeholders only with high-resolution, permission-approved icons.
- Deploy a secure prayer-request backend.
- Connect a push provider for reliable daily reminders.
- Have clergy or a trusted theological editor review the content.


## Data verification

The embedded library contains 366 Coptic calendar dates and 696 commemorations. The JavaScript reads `window.KK_SYNAXARIUM_DATA`, matching the bundled data file.
