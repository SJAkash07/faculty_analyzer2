# Publication Analyzer — Feature List

## Core
- **Faculty search** — Search by name; see a list of matching researchers (name, institution, papers, citations, h-index).
- **View profile** — Button in front of each faculty name to open their profile.
- **Faculty profile** — Summary stats (publications, citations, h-index, i10-index) and full list of research papers.
- **Research papers** — Sort by date, citations, or title; filter by year and min citations; pagination; DOI links.
- **Load more** — Load more publications per author.

## AI
- **Assessment summary** — One-click AI summary of any paper for committees (key points, interpretation, assessment).
- **Chat about a paper** — Ask questions about a paper; AI answers using only that paper’s title and abstract.
- **Compare two faculty** — Select two researchers and get an AI comparison (metrics + narrative assessment).
- **Chat about comparison** — Follow-up Q&A about the faculty comparison in the same modal.

## Data & export
- **7 data sources** — OpenAlex, Semantic Scholar, ORCID, CrossRef, OpenAIRE, Europe PMC, Google Scholar (see footer).
- **Saved list** — Save authors and papers locally.
- **Batch summary** — Paste up to 50 names; get a table (matched name, institution, pubs, citations, h-index, i10).
- **Export CSV** — Export saved items and batch results.
- **Print / PDF** — Print or save profile and comparison view.

## Graphs / charts
- **Comparison bar charts** — In the **Compare faculty** modal, after you run a comparison you see:
  - **Comparison charts** section with four bar charts: **Publications**, **Citations**, **h-index**, **i10-index**.
  - Each chart shows both faculty side-by-side (bars with numbers) so you can compare at a glance.
- **Where to see it:** Open the **Compare faculty** tab → select two faculty → click **Compare** → scroll down in the modal to the **Comparison charts** heading and the bar charts below it.

## UI
- **Light / dark theme** — Toggle in the header (Dark / Light); preference saved.
- **Single-page app** — Tabs: Search, Saved, Compare faculty, Batch summary.
- **Responsive** — Layout adapts to smaller screens.
- **API docs** — Interactive docs at `/docs`.
