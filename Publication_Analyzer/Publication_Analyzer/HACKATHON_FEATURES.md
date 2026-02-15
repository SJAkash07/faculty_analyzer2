# Publication Analyzer — Hackathon Feature List

## One-line pitch
**Search faculty by name → view profiles and publications from 6+ open sources → get AI assessment summaries and side-by-side comparison with bar charts for hiring and promotion committees.**

---

## All features (for slides / judges)

### Search & profile
| # | Feature | What it does |
|---|--------|---------------|
| 1 | **Faculty search** | Type a name → list of matching researchers (name, institution, papers, citations, h-index). |
| 2 | **View profile** | Button in front of each name to open that faculty’s profile. |
| 3 | **Faculty profile** | Full profile: publications count, citations, h-index, i10-index, institutions, and full paper list. |
| 4 | **Research papers** | Each work shows title, year, venue, citations, DOI link. Sort by date / citations / title; filter by year and min citations. |
| 5 | **Load more** | Pagination to load more publications per author. |

### AI (Hugging Face)
| # | Feature | What it does |
|---|--------|---------------|
| 6 | **Assessment summary** | One-click AI summary of any paper for committees: key points, author’s interpretation, assessment of the researcher. |
| 7 | **Chat about a paper** | Ask questions about a specific paper; AI answers using only that paper’s title and abstract. |
| 8 | **Compare two faculty** | Select two researchers → AI-generated comparison (metrics + narrative assessment). |
| 9 | **Comparison bar charts** | After comparing: four bar charts (Publications, Citations, h-index, i10-index) for visual side-by-side comparison. |
| 10 | **Chat about comparison** | Follow-up Q&A about the faculty comparison in the same modal. |

### Data & export
| # | Feature | What it does |
|---|--------|---------------|
| 11 | **6+ data sources** | OpenAlex (primary), Semantic Scholar, ORCID, CrossRef, OpenAIRE, Europe PMC — all linked in footer. |
| 12 | **Saved list** | Save authors and papers locally for quick access. |
| 13 | **Batch summary** | Paste up to 50 names (one per line) → table: matched name, institution, publications, citations, h-index, i10-index. |
| 14 | **Export CSV** | Export saved items and batch results as CSV. |
| 15 | **Print / PDF** | Print or save as PDF: faculty profile (with papers) and faculty comparison (with assessment and charts). |

### UI & UX
| # | Feature | What it does |
|---|--------|---------------|
| 16 | **Light / dark theme** | Theme toggle in header; preference saved in browser. |
| 17 | **Single-page app** | No full-page reloads; tabs: Search, Saved, Compare faculty, Batch summary. |
| 18 | **Responsive** | Layout works on smaller screens. |
| 19 | **API docs** | Interactive Swagger docs at `/docs` for integrations. |

---

## Tech stack (one slide)

| Layer | Technology |
|-------|------------|
| **Backend** | Python 3, FastAPI, Uvicorn, httpx, Pydantic, python-dotenv |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript (no framework), Google Fonts |
| **Data** | OpenAlex, Semantic Scholar, ORCID, CrossRef, OpenAIRE, Europe PMC |
| **AI** | Hugging Face Inference API (free tier), token via `.env` or `HF_TOKEN` |

---

## Feature count summary
- **19 features** total  
- **5** search & profile  
- **5** AI (summary, chat, compare, bar charts, comparison chat)  
- **5** data & export  
- **4** UI (theme, SPA, responsive, API docs)  

---

## Demo flow (suggested)
1. **Search** → type a faculty name → show results and **View profile** button.  
2. **Profile** → open one → show stats, papers, **Assessment Summary** on a paper, then **Chat about this paper**.  
3. **Compare** → Compare faculty tab → pick two → **Compare** → show stats, **Comparison charts** (bar charts), AI assessment, **Chat about comparison**.  
4. **Batch** → Batch summary tab → paste a few names → show table → **Export CSV**.  
5. **Theme** → toggle **Dark** / **Light** in header.  

---

## Data sources (footer)
OpenAlex · Semantic Scholar · ORCID · CrossRef · OpenAIRE · Europe PMC · Hugging Face (AI)
