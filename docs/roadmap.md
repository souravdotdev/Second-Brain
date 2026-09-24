# Feature Roadmap

Feature list derived from a competitive analysis of [mymind.com](https://mymind.com), ordered by priority and grouped by target version.

## V1 — MVP (core value prop must work before anything else)

1. **Save/capture items** — URL, text note, image, document (single unified "item" model)
2. **Note taking** — plain text/rich text notes
3. **Basic keyword search**
4. **Manual tagging** — simplest organization primitive before AI auto-tagging
5. **Sync across devices** — cloud backend, not local-only (table stakes for a "second brain")
6. **Accounts/auth**
7. **Grid/masonry view UI**

## V1.x — Fast follow (rounds out capture, still no AI)

8. **Chrome extension** — quick save without opening the app
9. **Save entire articles** (reader-mode archive, not just a link)
10. **Full-page screenshot capture**
11. **PDF/document upload & storage**
12. **Full-text search** across saved article/document content
13. **Saving highlighted text** — capture a highlight + backlink to source

## V2 — Smart/differentiating features

14. **Auto-tagging / AI organization** — the "no folders needed" pitch
15. **AI summaries (TLDR)**
16. **Text recognition from images (OCR)**
17. **Smart spaces** — auto-grouped collections
18. **Pins / Top of mind**
19. **Search by date/brand/multi-attribute**
20. **Search by color** — needs image color indexing, build after OCR/tagging infra exists
21. **Focus mode**
22. **Duplicate detection**

## V3 — Platform expansion

23. **iOS app**
24. **Android app**
25. **Bidirectional linking**
26. **Rediscover/resurface** ("on this day" style nudges)
27. **Shareable spaces** (public read-only links)
28. **Offline access**

## V4 — Long-tail / polish

29. **Recipe recognition**
30. **Product/shopping recognition** (price + image extraction)
31. **Handwriting recognition**
32. **Apple ecosystem** — Shortcuts, widgets, Share Sheet, native macOS app
33. **Import tools** — Pinterest, Instagram, Are.na

## Not a version — a day-one architecture decision

**Privacy-first / no-ads / no-feed positioning** (and, if used as a differentiator, encryption-at-rest). This isn't a feature bolted on later — it shapes the data model and business model (e.g. paid-only, no ad SDKs) starting in V1; retrofitting it afterward is painful.
