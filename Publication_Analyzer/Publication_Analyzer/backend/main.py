"""
Publications Summary Generator - Backend API
Uses OpenAlex for author search and works (publications).
AI summaries via Hugging Face Inference API (free; set HF_TOKEN or HUGGINGFACE_TOKEN).
"""
import os
import re
from pathlib import Path
from io import BytesIO
from datetime import datetime

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

# Load .env from project root so HF_TOKEN is set even when server is started via uvicorn --reload
try:
    from dotenv import load_dotenv
    _root = Path(__file__).resolve().parent.parent
    load_dotenv(_root / ".env")
except ImportError:
    pass

from fastapi import FastAPI, Query, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
import httpx

# New Hugging Face router (api-inference.huggingface.co is deprecated)
HF_ROUTER_URL = "https://router.huggingface.co/v1/chat/completions"
# Default: HF Inference provider (often enabled by default). Override with HF_SUMMARY_MODEL env.
HF_SUMMARY_MODEL = os.environ.get("HF_SUMMARY_MODEL") or "HuggingFaceTB/SmolLM3-3B:hf-inference"

OPENALEX_BASE = "https://api.openalex.org"
FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"

app = FastAPI(
    title="Publications Summary Generator",
    description="Search faculty by name and view their research publications (OpenAlex).",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if FRONTEND_DIR.exists():
    app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")


@app.on_event("startup")
def _log_hf_config():
    token = os.environ.get("HF_TOKEN") or os.environ.get("HUGGINGFACE_TOKEN")
    if token:
        print("AI (Hugging Face): enabled — summaries, compare, and chat will work.")
    else:
        print("AI (Hugging Face): not set — set HF_TOKEN in this terminal before starting for summaries/compare/chat.")


def _hf_token() -> str | None:
    """Return HF token if set (from HF_TOKEN or HUGGINGFACE_TOKEN)."""
    return os.environ.get("HF_TOKEN") or os.environ.get("HUGGINGFACE_TOKEN") or None


@app.get("/")
async def root():
    """Serve the frontend app."""
    index_path = FRONTEND_DIR / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    return {"message": "Publications Summary API", "docs": "/docs"}


@app.get("/api/config")
async def get_config():
    """Check if AI summary (Hugging Face) is configured. Does not expose the token."""
    token = _hf_token()
    return {"ai_summary_available": bool(token)}


@app.get("/api/search")
async def search_authors(q: str = Query(..., min_length=2)):
    """Search authors by name. Returns a list of matching faculty (LinkedIn-style)."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(
            f"{OPENALEX_BASE}/authors",
            params={"search": q, "per_page": 25},
        )
        r.raise_for_status()
        data = r.json()
    results = []
    for author in data.get("results", []):
        inst = (author.get("last_known_institutions") or [None])[0]
        results.append({
            "id": author.get("id", "").replace("https://openalex.org/", ""),
            "display_name": author.get("display_name", ""),
            "works_count": author.get("works_count", 0),
            "cited_by_count": author.get("cited_by_count", 0),
            "h_index": (author.get("summary_stats") or {}).get("h_index"),
            "institution": inst.get("display_name") if inst else None,
            "country_code": inst.get("country_code") if inst else None,
        })
    return {"query": q, "count": len(results), "results": results}


@app.get("/api/author/{author_id}")
async def get_author(author_id: str):
    """Get a single author's profile (for the profile header)."""
    aid = author_id if author_id.startswith("A") else f"A{author_id}"
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(f"{OPENALEX_BASE}/authors/{aid}")
        if r.status_code == 404:
            raise HTTPException(status_code=404, detail="Author not found")
        r.raise_for_status()
        author = r.json()
    insts = author.get("last_known_institutions") or []
    return {
        "id": author.get("id", "").replace("https://openalex.org/", ""),
        "display_name": author.get("display_name", ""),
        "display_name_alternatives": author.get("display_name_alternatives", []),
        "works_count": author.get("works_count", 0),
        "cited_by_count": author.get("cited_by_count", 0),
        "summary_stats": author.get("summary_stats") or {},
        "orcid": author.get("orcid"),
        "last_known_institutions": [
            {"display_name": i.get("display_name"), "country_code": i.get("country_code")}
            for i in insts
        ],
        "works_api_url": author.get("works_api_url"),
    }


@app.get("/api/author/{author_id}/works")
async def get_author_works(
    author_id: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(25, ge=1, le=100),
    sort_by: str = Query("publication_date", regex="^(publication_date|cited_by_count|title)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    year_from: int | None = Query(None, ge=1900, le=2100),
    year_to: int | None = Query(None, ge=1900, le=2100),
    min_citations: int | None = Query(None, ge=0),
):
    """Get publications (works) for an author. Paginated, with optional sort and filters."""
    aid = author_id if author_id.startswith("A") else f"A{author_id}"
    sort_field = "publication_date" if sort_by == "publication_date" else "cited_by_count" if sort_by == "cited_by_count" else "title"
    sort_param = f"{sort_field}:{sort_order}"
    filters = [f"author.id:{aid}"]
    if year_from is not None:
        filters.append(f"from_publication_date:{year_from}-01-01")
    if year_to is not None:
        filters.append(f"to_publication_date:{year_to}-12-31")
    if min_citations is not None and min_citations > 0:
        filters.append(f"cited_by_count:>={min_citations}")
    async with httpx.AsyncClient(timeout=20.0) as client:
        r = await client.get(
            f"{OPENALEX_BASE}/works",
            params={
                "filter": ",".join(filters),
                "page": page,
                "per_page": per_page,
                "sort": sort_param,
            },
        )
        if r.status_code == 404:
            raise HTTPException(status_code=404, detail="Not found")
        r.raise_for_status()
        data = r.json()
    meta = data.get("meta", {})
    works = []
    for w in data.get("results", []):
        loc = w.get("primary_location") or {}
        src = loc.get("source") or {}
        works.append({
            "id": (w.get("id") or "").replace("https://openalex.org/", ""),
            "title": w.get("title", ""),
            "publication_year": w.get("publication_year"),
            "publication_date": w.get("publication_date"),
            "cited_by_count": w.get("cited_by_count", 0),
            "doi": (w.get("ids") or {}).get("doi"),
            "type": w.get("type"),
            "venue": src.get("display_name"),
            "is_oa": (w.get("open_access") or {}).get("is_oa"),
            "open_access_status": (w.get("open_access") or {}).get("oa_status"),
        })
    return {
        "results": works,
        "meta": {
            "page": meta.get("page", 1),
            "per_page": meta.get("per_page", 25),
            "count": meta.get("count", 0),
        },
    }


# --- External data sources (in addition to OpenAlex) ---
SEMANTIC_SCHOLAR_BASE = "https://api.semanticscholar.org/graph/v1"
ORCID_PUB_BASE = "https://pub.orcid.org/v3.0"
CROSSREF_BASE = "https://api.crossref.org"
OPENAIRE_BASE = "https://api.openaire.eu"
EUROPE_PMC_BASE = "https://www.ebi.ac.uk/europepmc/webservices/rest"


async def _fetch_semantic_scholar(client: httpx.AsyncClient, name: str) -> dict | None:
    """Search author on Semantic Scholar; return first match summary."""
    try:
        r = await client.get(
            f"{SEMANTIC_SCHOLAR_BASE}/author/search",
            params={"query": name, "limit": 1},
            timeout=8.0,
        )
        if r.status_code != 200 or not r.json().get("data"):
            return None
        author = r.json()["data"][0]
        aid = author.get("authorId")
        if not aid:
            return {"name": author.get("name"), "source": "Semantic Scholar"}
        r2 = await client.get(
            f"{SEMANTIC_SCHOLAR_BASE}/author/{aid}",
            params={"fields": "name,paperCount,citationCount,hIndex,url"},
            timeout=8.0,
        )
        if r2.status_code != 200:
            return {"name": author.get("name"), "url": f"https://www.semanticscholar.org/author/{aid}"}
        data = r2.json()
        return {
            "name": data.get("name"),
            "paper_count": data.get("paperCount"),
            "citation_count": data.get("citationCount"),
            "h_index": data.get("hIndex"),
            "url": data.get("url") or f"https://www.semanticscholar.org/author/{aid}",
            "source": "Semantic Scholar",
        }
    except Exception:
        return None


async def _fetch_orcid(client: httpx.AsyncClient, orcid: str) -> dict | None:
    """Fetch ORCID profile (employment, education, funding) if we have ORCID ID."""
    if not orcid or not isinstance(orcid, str):
        return None
    oid = orcid.replace("https://orcid.org/", "").strip().rstrip("/")
    if not oid or len(oid) < 16:
        return None
    try:
        r = await client.get(
            f"{ORCID_PUB_BASE}/{oid}",
            headers={"Accept": "application/json"},
            timeout=8.0,
        )
        if r.status_code != 200:
            return {"url": f"https://orcid.org/{oid}", "source": "ORCID"}
        data = r.json()
        person = data.get("person", {}) or {}
        name = (person.get("name", {}) or {}).get("credit-name", {}).get("value") or (person.get("name", {}) or {}).get("given-names", {}).get("value", "")
        employments = []
        for g in data.get("activities-summary", {}).get("employments", {}).get("employment-summary", []) or []:
            org = (g.get("organization", {}) or {}).get("name")
            role = (g.get("role-title") or "").strip() or None
            if org or role:
                employments.append({"organization": org, "role": role})
        educations = []
        for g in data.get("activities-summary", {}).get("educations", {}).get("education-summary", []) or []:
            org = (g.get("organization", {}) or {}).get("name")
            role = (g.get("role-title") or "").strip() or None
            if org or role:
                educations.append({"organization": org, "role": role})
        fundings = []
        for g in data.get("activities-summary", {}).get("fundings", {}).get("group", []) or []:
            for s in g.get("funding-summary", []) or []:
                title = (s.get("title", {}) or {}).get("title", {}).get("value") or (s.get("title") or "").strip()
                if title:
                    fundings.append({"title": title})
        return {
            "name": name,
            "url": f"https://orcid.org/{oid}",
            "employments": employments[:10],
            "educations": educations[:10],
            "fundings": fundings[:10],
            "source": "ORCID",
        }
    except Exception:
        return None


async def _fetch_crossref(client: httpx.AsyncClient, name: str) -> dict | None:
    """Search CrossRef for works by author name."""
    try:
        r = await client.get(
            f"{CROSSREF_BASE}/works",
            params={"query.author": name, "rows": 5, "select": "DOI,title,published,author"},
            timeout=8.0,
        )
        if r.status_code != 200:
            return None
        data = r.json()
        items = data.get("message", {}).get("items", []) or []
        works = []
        for w in items[:5]:
            title = (w.get("title", []) or [""])[0]
            pub = (w.get("published", {}) or {}).get("date-parts", [[]])[0]
            year = pub[0] if pub else None
            doi = w.get("DOI")
            works.append({"title": title, "year": year, "doi": doi})
        return {
            "works_count": len(items),
            "sample_works": works,
            "url": "https://search.crossref.org",
            "source": "CrossRef",
        }
    except Exception:
        return None


async def _fetch_openaire(client: httpx.AsyncClient, name: str) -> dict | None:
    """Search OpenAIRE for projects/grants (scholarships, funding)."""
    try:
        r = await client.get(
            f"{OPENAIRE_BASE}/search/projects",
            params={"author": name, "size": 5},
            timeout=10.0,
        )
        if r.status_code != 200:
            return None
        data = r.json()
        results = data.get("response", {}).get("results", []) or []
        if not results:
            return {"projects": [], "url": "https://explore.openaire.eu", "source": "OpenAIRE"}
        projects = []
        for r in results[:5]:
            md = (r.get("metadata", {}) or {}).get("entity", {}) or {}
            title = (md.get("title", {}) or {}).get("value") or (md.get("title") or "").strip()
            code = md.get("code") or md.get("acronym") or ""
            funder = (md.get("funder", {}) or {}).get("name") or (md.get("funder") or "").strip()
            if title or code:
                projects.append({"title": title or code, "code": code, "funder": funder})
        return {
            "projects_count": len(projects),
            "projects": projects,
            "url": "https://explore.openaire.eu",
            "source": "OpenAIRE",
        }
    except Exception:
        return None


async def _fetch_europe_pmc(client: httpx.AsyncClient, name: str) -> dict | None:
    """Search Europe PMC for publications (life sciences)."""
    try:
        r = await client.get(
            f"{EUROPE_PMC_BASE}/search",
            params={"query": f'AUTHOR:"{name}"', "format": "json", "pageSize": 5},
            timeout=8.0,
        )
        if r.status_code != 200:
            return None
        data = r.json()
        hits = data.get("resultList", {}).get("result", []) or []
        works = []
        for w in hits[:5]:
            works.append({
                "title": w.get("title"),
                "year": w.get("pubYear"),
                "pmid": w.get("id"),
                "doi": (w.get("doi") or "").strip() or None,
            })
        return {
            "hit_count": data.get("hitCount", 0),
            "sample_works": works,
            "url": "https://europepmc.org",
            "source": "Europe PMC",
        }
    except Exception:
        return None


@app.get("/api/author/{author_id}/external-sources")
async def get_author_external_sources(author_id: str):
    """Fetch data from 5 external sources: Semantic Scholar, ORCID, CrossRef, OpenAIRE, Europe PMC."""
    aid = author_id if author_id.startswith("A") else f"A{author_id}"
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(f"{OPENALEX_BASE}/authors/{aid}")
        if r.status_code == 404:
            raise HTTPException(status_code=404, detail="Author not found")
        r.raise_for_status()
        author = r.json()
    name = author.get("display_name", "").strip() or "Unknown"
    orcid = author.get("orcid")

    import asyncio
    async with httpx.AsyncClient(timeout=12.0) as client:
        sem, orc, cr, op, ep = await asyncio.gather(
            _fetch_semantic_scholar(client, name),
            _fetch_orcid(client, orcid or ""),
            _fetch_crossref(client, name),
            _fetch_openaire(client, name),
            _fetch_europe_pmc(client, name),
        )
    return {
        "semantic_scholar": sem,
        "orcid": orc,
        "crossref": cr,
        "openaire": op,
        "europe_pmc": ep,
        "sources_info": [
            {"id": "semantic_scholar", "name": "Semantic Scholar", "url": "https://www.semanticscholar.org", "description": "Papers & citations"},
            {"id": "orcid", "name": "ORCID", "url": "https://orcid.org", "description": "Researcher ID, employment, funding"},
            {"id": "crossref", "name": "CrossRef", "url": "https://www.crossref.org", "description": "DOI metadata & publications"},
            {"id": "openaire", "name": "OpenAIRE", "url": "https://explore.openaire.eu", "description": "Projects & grants (EU open science)"},
            {"id": "europe_pmc", "name": "Europe PMC", "url": "https://europepmc.org", "description": "Life sciences literature"},
        ],
    }


def _abstract_from_inverted_index(inverted: dict) -> str:
    """Build plain-text abstract from OpenAlex abstract_inverted_index."""
    if not inverted or not isinstance(inverted, dict):
        return ""
    pairs = []
    for word, positions in inverted.items():
        for pos in positions:
            pairs.append((pos, word))
    pairs.sort(key=lambda x: x[0])
    return " ".join(p for _, p in pairs)


@app.get("/api/works/{work_id}")
async def get_work(work_id: str):
    """Fetch a single work from OpenAlex (for abstract and full metadata)."""
    wid = work_id if work_id.upper().startswith("W") else f"W{work_id}"
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(f"{OPENALEX_BASE}/works/{wid}")
        if r.status_code == 404:
            raise HTTPException(status_code=404, detail="Work not found")
        r.raise_for_status()
        w = r.json()
    loc = w.get("primary_location") or {}
    src = loc.get("source") or {}
    abstract = w.get("abstract_inverted_index")
    if isinstance(abstract, dict):
        abstract = _abstract_from_inverted_index(abstract)
    elif not isinstance(abstract, str):
        abstract = ""
    return {
        "id": (w.get("id") or "").replace("https://openalex.org/", ""),
        "title": w.get("title", ""),
        "abstract": abstract,
        "publication_year": w.get("publication_year"),
        "publication_date": w.get("publication_date"),
        "venue": src.get("display_name"),
        "type": w.get("type"),
        "cited_by_count": w.get("cited_by_count", 0),
        "doi": (w.get("ids") or {}).get("doi"),
    }


class SummarizeRequest(BaseModel):
    work_id: str


def _strip_thinking(text: str) -> str:
    """Remove <think>...</think> blocks so only the final summary is shown."""
    if not text:
        return text
    # Strip <think>...</think> (reasoning/chain-of-thought) from models that output it
    open_tag = r"<think>"
    close_tag = r"<" + r"/" + "think>"
    return re.sub(open_tag + r".*?" + close_tag, "", text, flags=re.DOTALL | re.IGNORECASE).strip()


def _build_summary_user_message(title: str, abstract: str, year, venue: str, type_: str) -> str:
    """Build user message for chat completions (router API) — assessment summary with bullets and interpretation."""
    meta = []
    if year:
        meta.append(str(year))
    if venue:
        meta.append(venue)
    if type_:
        meta.append(type_)
    meta_str = ", ".join(meta) if meta else ""
    return f"""Write an assessment summary of this research paper for university committees (hiring, promotion, tenure, accreditation). Structure your response as follows:

**Key points of the research** (use bullet points)
• Summarise the main contributions, methods, and findings in clear bullet points (4–6 bullets).

**Author's interpretation**
• In one short paragraph, describe how the author interprets the topic: their perspective, framing, or stance (e.g. critical, applied, conceptual) and what it shows about their approach to the field.

**Assessment of the researcher**
• In one short paragraph, assess what this paper demonstrates about the researcher: rigor, originality, impact, and fit for academic evaluation. Be concise and evaluative.

Use clear, professional language. Output only the final summary—no <think> tags or reasoning.

Title: {title}
{f"Publication: {meta_str}" if meta_str else ""}

Abstract:
{abstract if abstract else "(No abstract available — summarize based on the title and context only.)"}"""


@app.post("/api/summarize")
async def summarize_work(body: SummarizeRequest = Body(...)):
    """Generate an AI summary of a research paper using a free Hugging Face LLM."""
    token = _hf_token()
    if not token:
        raise HTTPException(
            status_code=503,
            detail="AI summary requires a free Hugging Face token. Use: set HF_TOKEN=hf_xxxxxxxx (create one at huggingface.co/settings/tokens).",
        )
    work_id = body.work_id.strip()
    if not work_id:
        raise HTTPException(status_code=400, detail="work_id required")
    wid = work_id if work_id.upper().startswith("W") else f"W{work_id}"
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(f"{OPENALEX_BASE}/works/{wid}")
        if r.status_code == 404:
            raise HTTPException(status_code=404, detail="Work not found")
        r.raise_for_status()
        w = r.json()
    loc = w.get("primary_location") or {}
    src = loc.get("source") or {}
    title = w.get("title") or "Untitled"
    abstract_inv = w.get("abstract_inverted_index")
    if isinstance(abstract_inv, dict):
        abstract = _abstract_from_inverted_index(abstract_inv)
    else:
        abstract = ""
    year = w.get("publication_year")
    venue = src.get("display_name") or ""
    type_ = w.get("type") or ""

    if not abstract and not title:
        raise HTTPException(status_code=422, detail="No title or abstract available to summarize.")

    user_message = _build_summary_user_message(title, abstract, year, venue, type_)

    try:
        async with httpx.AsyncClient(timeout=90.0) as client:
            r = await client.post(
                HF_ROUTER_URL,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": HF_SUMMARY_MODEL,
                    "messages": [
                        {"role": "system", "content": "You write assessment summaries for university committees. Include: (1) bullet points for key research points, (2) how the author interprets the topic, (3) a short assessment of the researcher. Use professional language. Output only the summary—no <think> tags."},
                        {"role": "user", "content": user_message},
                    ],
                    "max_tokens": 1500,
                },
            )
        if r.status_code == 503:
            try:
                err_body = r.json()
                detail = err_body.get("error") or err_body.get("message") or "Model is loading. Please try again in 30 seconds."
            except Exception:
                detail = "Model is loading. Please try again in 30 seconds."
            raise HTTPException(status_code=503, detail=detail)
        if r.status_code == 401:
            raise HTTPException(status_code=401, detail="Invalid Hugging Face token. Check HF_TOKEN.")
        if r.status_code != 200:
            try:
                err_body = r.json()
                err = err_body.get("error") or err_body.get("message") or r.text
            except Exception:
                err = r.text or f"HTTP {r.status_code}"
            raise HTTPException(status_code=502, detail=f"Hugging Face API: {err}")
        data = r.json()
        choices = data.get("choices") or []
        if choices and isinstance(choices[0].get("message"), dict):
            summary = (choices[0]["message"].get("content") or "").strip()
        else:
            summary = ""
        summary = _strip_thinking(summary)
        if not summary:
            raise HTTPException(status_code=502, detail="No summary returned from model.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI service error: {str(e)}")

    return {
        "work_id": wid,
        "title": title,
        "summary": summary,
    }


class CompareAuthorsRequest(BaseModel):
    author_id_1: str
    author_id_2: str


@app.post("/api/compare-authors")
async def compare_authors(body: CompareAuthorsRequest = Body(...)):
    """Compare two faculty profiles (publications, citations, h-index, etc.) and generate an LLM assessment of who is stronger."""
    token = _hf_token()
    if not token:
        raise HTTPException(
            status_code=503,
            detail="Faculty comparison requires a free Hugging Face token. Use: set HF_TOKEN=hf_xxxxxxxx",
        )
    a1_id = (body.author_id_1 or "").strip()
    a2_id = (body.author_id_2 or "").strip()
    if not a1_id or not a2_id:
        raise HTTPException(status_code=400, detail="author_id_1 and author_id_2 required")

    async with httpx.AsyncClient(timeout=15.0) as client:
        r1 = await client.get(f"{OPENALEX_BASE}/authors/{a1_id if a1_id.startswith('A') else f'A{a1_id}'}")
        r2 = await client.get(f"{OPENALEX_BASE}/authors/{a2_id if a2_id.startswith('A') else f'A{a2_id}'}")
        if r1.status_code == 404:
            raise HTTPException(status_code=404, detail="Author 1 not found")
        if r2.status_code == 404:
            raise HTTPException(status_code=404, detail="Author 2 not found")
        r1.raise_for_status()
        r2.raise_for_status()
        auth1 = r1.json()
        auth2 = r2.json()

    def summary(a):
        insts = a.get("last_known_institutions") or []
        inst_names = ", ".join(i.get("display_name") or "" for i in insts if i.get("display_name"))
        stats = a.get("summary_stats") or {}
        return (
            a.get("display_name") or "Unknown",
            a.get("works_count") or 0,
            a.get("cited_by_count") or 0,
            stats.get("h_index"),
            stats.get("i10_index"),
            inst_names or "—",
        )

    n1, w1, c1, h1, i1, inst1 = summary(auth1)
    n2, w2, c2, h2, i2, inst2 = summary(auth2)

    user_message = f"""Compare these two faculty/researchers for university committees (hiring, promotion, tenure). Based only on the metrics below, write an assessment.

**Faculty 1: {n1}**
Institution(s): {inst1}
Publications: {w1}
Citations: {c1}
h-index: {h1 if h1 is not None else '—'}
i10-index: {i1 if i1 is not None else '—'}

**Faculty 2: {n2}**
Institution(s): {inst2}
Publications: {w2}
Citations: {c2}
h-index: {h2 if h2 is not None else '—'}
i10-index: {i2 if i2 is not None else '—'}

Provide:
1. **Summary comparison** (2–3 sentences): Who has stronger metrics overall and in what areas?
2. **Who is better and why**: Give a clear, fair assessment of who appears stronger for academic evaluation (publications, impact, consistency) and why. Be objective.
3. **Committee note**: One short paragraph on how this comparison might inform a hiring or promotion decision.

Use professional language. Output only the assessment—no <think> tags."""

    try:
        async with httpx.AsyncClient(timeout=90.0) as client:
            r = await client.post(
                HF_ROUTER_URL,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": HF_SUMMARY_MODEL,
                    "messages": [
                        {
                            "role": "system",
                            "content": "You compare faculty/researcher profiles for university committees. Use only the given metrics. Be objective and concise. Output only the assessment—no <think> tags.",
                        },
                        {"role": "user", "content": user_message},
                    ],
                    "max_tokens": 1500,
                },
            )
        if r.status_code == 503:
            try:
                err_body = r.json()
                detail = err_body.get("error") or err_body.get("message") or "Model loading. Try again in 30 seconds."
            except Exception:
                detail = "Model loading. Try again in 30 seconds."
            raise HTTPException(status_code=503, detail=detail)
        if r.status_code == 401:
            raise HTTPException(status_code=401, detail="Invalid Hugging Face token.")
        if r.status_code != 200:
            try:
                err_body = r.json()
                err = err_body.get("error") or err_body.get("message") or r.text
            except Exception:
                err = r.text or f"HTTP {r.status_code}"
            raise HTTPException(status_code=502, detail=f"Hugging Face API: {err}")
        data = r.json()
        choices = data.get("choices") or []
        if choices and isinstance(choices[0].get("message"), dict):
            assessment = (choices[0]["message"].get("content") or "").strip()
        else:
            assessment = ""
        assessment = _strip_thinking(assessment)
        if not assessment:
            raise HTTPException(status_code=502, detail="No assessment returned from model.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI service error: {str(e)}")

    return {
        "author_1": {"id": a1_id, "display_name": n1, "works_count": w1, "cited_by_count": c1, "h_index": h1, "i10_index": i1, "institutions": inst1},
        "author_2": {"id": a2_id, "display_name": n2, "works_count": w2, "cited_by_count": c2, "h_index": h2, "i10_index": i2, "institutions": inst2},
        "assessment": assessment,
    }


class ChatCompareRequest(BaseModel):
    author_id_1: str
    author_id_2: str
    assessment: str
    message: str


@app.post("/api/chat-compare")
async def chat_compare(body: ChatCompareRequest = Body(...)):
    """Answer a follow-up question about a faculty comparison (chatbot)."""
    token = _hf_token()
    if not token:
        raise HTTPException(
            status_code=503,
            detail="Chat requires a Hugging Face token. Use: set HF_TOKEN=hf_xxxxxxxx",
        )
    a1_id = (body.author_id_1 or "").strip()
    a2_id = (body.author_id_2 or "").strip()
    assessment = (body.assessment or "").strip()
    message = (body.message or "").strip()
    if not a1_id or not a2_id:
        raise HTTPException(status_code=400, detail="author_id_1 and author_id_2 required")
    if not assessment:
        raise HTTPException(status_code=400, detail="assessment required")
    if not message:
        raise HTTPException(status_code=400, detail="message required")

    context = f"""You are helping a user understand a faculty comparison. Here is the comparison assessment:

{assessment}

The two faculty were compared by their publication counts, citations, h-index, and i10-index. Answer the user's question based only on this assessment and the metrics it refers to. If the question cannot be answered from the comparison, say so. Be concise. Do not use <think> tags—output only your answer.

User question: {message}"""

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            r = await client.post(
                HF_ROUTER_URL,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": HF_SUMMARY_MODEL,
                    "messages": [
                        {"role": "system", "content": "You answer questions about a faculty comparison. Use only the provided assessment. Be concise. No <think> tags."},
                        {"role": "user", "content": context},
                    ],
                    "max_tokens": 1024,
                },
            )
        if r.status_code == 503:
            try:
                err_body = r.json()
                detail = err_body.get("error") or err_body.get("message") or "Model loading. Try again."
            except Exception:
                detail = "Model loading. Try again."
            raise HTTPException(status_code=503, detail=detail)
        if r.status_code == 401:
            raise HTTPException(status_code=401, detail="Invalid Hugging Face token.")
        if r.status_code != 200:
            try:
                err_body = r.json()
                err = err_body.get("error") or err_body.get("message") or r.text
            except Exception:
                err = r.text or f"HTTP {r.status_code}"
            raise HTTPException(status_code=502, detail=f"Hugging Face API: {err}")
        data = r.json()
        choices = data.get("choices") or []
        if choices and isinstance(choices[0].get("message"), dict):
            answer = (choices[0]["message"].get("content") or "").strip()
        else:
            answer = ""
        answer = _strip_thinking(answer)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI service error: {str(e)}")

    return {"answer": answer or "No response generated."}


class BatchFacultyRequest(BaseModel):
    names: list[str]


@app.post("/api/batch-faculty")
async def batch_faculty(body: BatchFacultyRequest = Body(...)):
    """Look up multiple faculty by name and return a summary table (for search committees)."""
    names = [n.strip() for n in (body.names or []) if n and n.strip()]
    if not names:
        raise HTTPException(status_code=400, detail="names list required (one name per entry)")
    if len(names) > 50:
        raise HTTPException(status_code=400, detail="Maximum 50 names per request")

    results = []
    needs_selection = []
    
    async with httpx.AsyncClient(timeout=20.0) as client:
        for name in names:
            try:
                r = await client.get(
                    f"{OPENALEX_BASE}/authors",
                    params={"search": name, "per_page": 10},  # Get up to 10 matches
                )
                r.raise_for_status()
                data = r.json()
                authors = data.get("results") or []
                
                if not authors:
                    results.append({
                        "name_requested": name,
                        "found": False,
                        "author_id": None,
                        "display_name": None,
                        "works_count": None,
                        "cited_by_count": None,
                        "h_index": None,
                        "i10_index": None,
                        "institution": None,
                    })
                    continue
                
                # If multiple matches found, add to needs_selection
                if len(authors) > 1:
                    options = []
                    for author in authors:
                        aid = author.get("id", "").replace("https://openalex.org/", "")
                        inst = (author.get("last_known_institutions") or [None])[0]
                        stats = author.get("summary_stats") or {}
                        options.append({
                            "author_id": aid,
                            "display_name": author.get("display_name"),
                            "works_count": author.get("works_count"),
                            "cited_by_count": author.get("cited_by_count"),
                            "h_index": stats.get("h_index"),
                            "i10_index": stats.get("i10_index"),
                            "institution": inst.get("display_name") if inst else None,
                        })
                    needs_selection.append({
                        "name_requested": name,
                        "options": options
                    })
                    continue
                
                # Single match - add directly to results
                author = authors[0]
                aid = author.get("id", "").replace("https://openalex.org/", "")
                inst = (author.get("last_known_institutions") or [None])[0]
                stats = author.get("summary_stats") or {}
                results.append({
                    "name_requested": name,
                    "found": True,
                    "author_id": aid,
                    "display_name": author.get("display_name"),
                    "works_count": author.get("works_count"),
                    "cited_by_count": author.get("cited_by_count"),
                    "h_index": stats.get("h_index"),
                    "i10_index": stats.get("i10_index"),
                    "institution": inst.get("display_name") if inst else None,
                })
            except Exception:
                results.append({
                    "name_requested": name,
                    "found": False,
                    "author_id": None,
                    "display_name": None,
                    "works_count": None,
                    "cited_by_count": None,
                    "h_index": None,
                    "i10_index": None,
                    "institution": None,
                })
    
    return {
        "count": len(results),
        "results": results,
        "needs_selection": needs_selection if needs_selection else None
    }


class ChatRequest(BaseModel):
    work_id: str
    message: str


@app.post("/api/chat")
async def chat_about_work(body: ChatRequest = Body(...)):
    """Answer a question about a specific research paper using its title and abstract."""
    token = _hf_token()
    if not token:
        raise HTTPException(
            status_code=503,
            detail="Chat requires a Hugging Face token. Use: set HF_TOKEN=hf_xxxxxxxx",
        )
    work_id = body.work_id.strip()
    message = (body.message or "").strip()
    if not work_id:
        raise HTTPException(status_code=400, detail="work_id required")
    if not message:
        raise HTTPException(status_code=400, detail="message required")
    wid = work_id if work_id.upper().startswith("W") else f"W{work_id}"
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(f"{OPENALEX_BASE}/works/{wid}")
        if r.status_code == 404:
            raise HTTPException(status_code=404, detail="Work not found")
        r.raise_for_status()
        w = r.json()
    title = w.get("title") or "Untitled"
    abstract_inv = w.get("abstract_inverted_index")
    if isinstance(abstract_inv, dict):
        abstract = _abstract_from_inverted_index(abstract_inv)
    else:
        abstract = ""
    context = f"Title: {title}\n\nAbstract:\n{abstract if abstract else '(No abstract available.)'}"
    system_content = (
        "You are a helpful assistant. Answer questions based ONLY on the following research paper. "
        "Use the title and abstract below. If the answer is not in the paper or you are unsure, say so. "
        "Be concise and accurate. Do not use <think> tags—output only your answer."
    )
    user_content = f"{context}\n\n---\nQuestion: {message}"

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            r = await client.post(
                HF_ROUTER_URL,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": HF_SUMMARY_MODEL,
                    "messages": [
                        {"role": "system", "content": system_content},
                        {"role": "user", "content": user_content},
                    ],
                    "max_tokens": 1024,
                },
            )
        if r.status_code == 503:
            try:
                err_body = r.json()
                detail = err_body.get("error") or err_body.get("message") or "Model loading. Try again in 30 seconds."
            except Exception:
                detail = "Model loading. Try again in 30 seconds."
            raise HTTPException(status_code=503, detail=detail)
        if r.status_code == 401:
            raise HTTPException(status_code=401, detail="Invalid Hugging Face token.")
        if r.status_code != 200:
            try:
                err_body = r.json()
                err = err_body.get("error") or err_body.get("message") or r.text
            except Exception:
                err = r.text or f"HTTP {r.status_code}"
            raise HTTPException(status_code=502, detail=f"Hugging Face API: {err}")
        data = r.json()
        choices = data.get("choices") or []
        if choices and isinstance(choices[0].get("message"), dict):
            answer = (choices[0]["message"].get("content") or "").strip()
        else:
            answer = ""
        answer = _strip_thinking(answer)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI service error: {str(e)}")

    return {"work_id": wid, "answer": answer or "No response generated."}


@app.post("/api/generate-pdf")
async def generate_pdf(
    author_id: str = Body(..., embed=True),
    author_name: str = Body(..., embed=True),
    works_count: int = Body(0, embed=True),
    cited_by_count: int = Body(0, embed=True),
    h_index: int = Body(None, embed=True),
):
    """Generate an accreditation report PDF for a faculty member."""
    try:
        # Create PDF in memory
        pdf_buffer = BytesIO()
        doc = SimpleDocTemplate(pdf_buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#3b82f6'),
            spaceAfter=12,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=10,
            spaceBefore=10,
            fontName='Helvetica-Bold'
        )
        
        normal_style = ParagraphStyle(
            'CustomNormal',
            parent=styles['Normal'],
            fontSize=11,
            spaceAfter=8,
            alignment=TA_LEFT
        )
        
        # Build PDF content
        content = []
        
        # Header
        content.append(Paragraph("FACULTY ACCREDITATION REPORT", title_style))
        content.append(Spacer(1, 0.3*inch))
        
        # Faculty Info
        content.append(Paragraph(f"<b>Faculty Member:</b> {author_name}", normal_style))
        content.append(Paragraph(f"<b>Author ID:</b> {author_id}", normal_style))
        content.append(Paragraph(f"<b>Report Generated:</b> {datetime.now().strftime('%B %d, %Y')}", normal_style))
        content.append(Spacer(1, 0.2*inch))
        
        # Research Statistics
        content.append(Paragraph("RESEARCH STATISTICS", heading_style))
        
        stats_data = [
            ['Metric', 'Value'],
            ['Total Publications', str(works_count)],
            ['Citations Received', str(cited_by_count)],
            ['H-Index', str(h_index) if h_index else 'N/A'],
        ]
        
        stats_table = Table(stats_data, colWidths=[2.5*inch, 2*inch])
        stats_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 11),
        ]))
        
        content.append(stats_table)
        content.append(Spacer(1, 0.3*inch))
        
        # Assessment Summary
        content.append(Paragraph("ASSESSMENT SUMMARY", heading_style))
        
        assessment_text = f"""
        The faculty member {author_name} has demonstrated significant academic productivity with {works_count} publications 
        and {cited_by_count} total citations. This report provides a comprehensive overview of research impact and scholarly achievement 
        for use in hiring, promotion, tenure, and accreditation decisions.
        """
        content.append(Paragraph(assessment_text, normal_style))
        content.append(Spacer(1, 0.2*inch))
        
        # Footer
        content.append(Paragraph("---", normal_style))
        content.append(Spacer(1, 0.1*inch))
        content.append(Paragraph(
            "Data source: <i>OpenAlex</i>. Generated by Publications Summary System.",
            ParagraphStyle('footer', parent=styles['Normal'], fontSize=9, textColor=colors.grey)
        ))
        
        # Build PDF
        doc.build(content)
        pdf_buffer.seek(0)
        
        return StreamingResponse(
            iter([pdf_buffer.getvalue()]),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=accreditation_{author_id}.pdf"}
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation error: {str(e)}")


@app.get("/api/author/{author_id}/research-fingerprint")
async def get_research_fingerprint(author_id: str):
    """Analyze research areas and publication types for a faculty member."""
    aid = author_id if author_id.startswith("A") else f"A{author_id}"
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.get(
                f"{OPENALEX_BASE}/works",
                params={
                    "filter": f"author.id:{aid}",
                    "per_page": 100,
                },
            )
            r.raise_for_status()
            data = r.json()
        
        # Analyze publication types and topics
        type_counts = {}
        topic_counts = {}
        
        for work in data.get("results", []):
            # Count by work type
            work_type = work.get("type", "Other")
            type_counts[work_type] = type_counts.get(work_type, 0) + 1
            
            # Count by topics from concepts
            concepts = work.get("concepts", [])
            for concept in concepts:
                if concept.get("score", 0) > 0.1:  # High confidence only
                    topic = concept.get("display_name", "")
                    if topic:
                        topic_counts[topic] = topic_counts.get(topic, 0) + 1
        
        # Get top topics
        top_topics = sorted(topic_counts.items(), key=lambda x: x[1], reverse=True)[:8]
        
        return {
            "author_id": aid.replace("A", ""),
            "publication_types": dict(sorted(type_counts.items(), key=lambda x: x[1], reverse=True)[:6]),
            "top_research_areas": {topic: count for topic, count in top_topics},
            "total_works": len(data.get("results", [])),
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fingerprint analysis error: {str(e)}")


class BatchFacultyRequest(BaseModel):
    faculty_names: list[str]


@app.post("/api/batch-faculty-analysis")
async def batch_faculty_analysis(request: BatchFacultyRequest):
    """Analyze multiple faculty members for department dashboard."""
    try:
        results = []
        for name in request.faculty_names[:50]:  # Max 50
            try:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    r = await client.get(
                        f"{OPENALEX_BASE}/authors",
                        params={"search": name, "per_page": 1},
                    )
                    r.raise_for_status()
                    data = r.json()
                
                if data.get("results"):
                    author = data["results"][0]
                    results.append({
                        "name": author.get("display_name", name),
                        "works_count": author.get("works_count", 0),
                        "cited_by_count": author.get("cited_by_count", 0),
                        "h_index": (author.get("summary_stats") or {}).get("h_index"),
                        "i10_index": (author.get("summary_stats") or {}).get("i10_index"),
                        "id": author.get("id", "").replace("https://openalex.org/", ""),
                    })
            except Exception:
                results.append({
                    "name": name,
                    "works_count": 0,
                    "cited_by_count": 0,
                    "h_index": None,
                    "i10_index": None,
                    "id": None,
                    "error": "Not found"
                })
        
        # Calculate departmental statistics
        valid_results = [r for r in results if "error" not in r]
        if valid_results:
            avg_works = sum(r["works_count"] for r in valid_results) / len(valid_results)
            avg_citations = sum(r["cited_by_count"] for r in valid_results) / len(valid_results)
            avg_h_index = sum(r["h_index"] or 0 for r in valid_results) / len(valid_results)
            total_works = sum(r["works_count"] for r in valid_results)
            total_citations = sum(r["cited_by_count"] for r in valid_results)
        else:
            avg_works = avg_citations = avg_h_index = total_works = total_citations = 0
        
        return {
            "faculty_count": len(results),
            "faculty": results,
            "department_stats": {
                "total_faculty": len(results),
                "faculty_found": len(valid_results),
                "avg_publications": round(avg_works, 2),
                "avg_citations": round(avg_citations, 2),
                "avg_h_index": round(avg_h_index, 2),
                "total_publications": total_works,
                "total_citations": total_citations,
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch analysis error: {str(e)}")

