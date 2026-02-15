# Google Scholar Integration

## Overview

Google Scholar has been added as the 7th data source in the Publication Analyzer. It provides additional academic publication data, citation metrics, and researcher profiles.

## What's New

### Backend Changes
- Added `scholarly` library for Google Scholar data scraping
- New `_fetch_google_scholar()` function in `backend/main.py`
- Integrated into the `/api/author/{author_id}/external-sources` endpoint
- Runs asynchronously with other data sources

### Frontend Changes
- Google Scholar card added to external sources section
- Displays: publications count, citations, h-index, i10-index, affiliation, research interests, and sample publications
- Direct link to Google Scholar profile

### Data Retrieved
- Author name and affiliation
- Email (if public)
- Research interests
- Total citations
- h-index and i10-index
- Publications count
- Sample publications (up to 5) with titles, years, venues, and citation counts
- Google Scholar profile URL

## Installation

The `scholarly` library has been added to `requirements.txt`. To install:

```bash
cd Publication_Analyzer/Publication_Analyzer
pip install -r requirements.txt
```

Or install just the new dependency:

```bash
pip install scholarly>=1.7.0
```

## Usage

Google Scholar data is automatically fetched when viewing a faculty profile. It appears in the "Data from other sources" section alongside:
- Semantic Scholar
- ORCID
- CrossRef
- OpenAIRE
- Europe PMC

## Important Notes

### Rate Limiting
Google Scholar may rate-limit requests if too many are made in a short time. The implementation includes:
- 15-second timeout per request
- Graceful error handling (returns None if unavailable)
- Runs in a thread pool to avoid blocking

### No Official API
Google Scholar doesn't provide an official API. The `scholarly` library uses web scraping, which means:
- Slower than API-based sources
- May occasionally fail if Google Scholar's HTML structure changes
- Should be used responsibly to avoid being blocked

### Best Practices
1. Don't make excessive requests in a short time
2. The first request may take longer (10-15 seconds)
3. If Google Scholar data fails to load, other sources will still work
4. Consider caching results for frequently accessed profiles

## Troubleshooting

### Google Scholar data not loading
- Check internet connection
- Wait a few minutes if rate-limited
- Verify `scholarly` is installed: `pip show scholarly`

### Slow performance
- Google Scholar scraping is slower than API calls
- First request may take 10-15 seconds
- Subsequent requests should be faster

### Import errors
```bash
pip install --upgrade scholarly
```

## Technical Details

### Function Signature
```python
async def _fetch_google_scholar(name: str) -> dict | None
```

### Return Format
```python
{
    "name": str,
    "affiliation": str,
    "email": str,
    "interests": list[str],
    "citations": int,
    "h_index": int,
    "i10_index": int,
    "publications_count": int,
    "sample_publications": [
        {
            "title": str,
            "year": str,
            "venue": str,
            "citations": int
        }
    ],
    "url": str,
    "scholar_id": str,
    "source": "Google Scholar"
}
```

## Future Enhancements

Potential improvements:
- Caching Google Scholar results to reduce requests
- Retry logic with exponential backoff
- Proxy support for rate limit avoidance
- More detailed publication metadata
- Co-author network visualization

## References

- [scholarly library documentation](https://scholarly.readthedocs.io/)
- [Google Scholar](https://scholar.google.com)
