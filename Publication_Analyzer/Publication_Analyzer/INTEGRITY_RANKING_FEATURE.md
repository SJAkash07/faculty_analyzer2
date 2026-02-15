# Academic Integrity Analyzer + Smart Ranking System

## Overview

This feature extends the Publication Analyzer with advanced integrity analysis and intelligent ranking capabilities. It evaluates papers for credibility, detects citation anomalies, identifies suspicious patterns, and uses LLM-powered quality assessment to provide explainable rankings.

## Features

### 1. Integrity Analysis
- **CrossRef Verification**: Validates papers against CrossRef database
- **Citation Anomaly Detection**: Identifies suspicious citation patterns
- **Suspicious Journal Detection**: Flags predatory or low-quality venues
- **Title Quality Analysis**: Checks for buzzwords and quality indicators
- **Risk Scoring**: Assigns LOW/MEDIUM/HIGH risk levels

### 2. LLM Quality Evaluation
- **Quality Score**: Research methodology and contribution (0-10)
- **Credibility Score**: Venue reputation and citation patterns (0-10)
- **Relevance Score**: Relevance to search query (0-10)
- **Suspicious Detection**: Flags potential academic misconduct
- **Explainable Reasoning**: Provides brief explanations

### 3. Smart Ranking Engine
- **Multi-Factor Scoring**: Combines 5 different signals
- **Weighted Algorithm**: Optimized for academic quality
- **Explainable Rankings**: Shows why each paper ranks where it does
- **Customizable**: Can adjust weights and factors

## Architecture

```
backend/
├── services/
│   ├── __init__.py
│   ├── integrity_analyzer.py    # Integrity checks
│   ├── llm_quality.py            # LLM evaluation
│   └── ranking_engine.py         # Smart ranking
└── main.py                       # API integration
```

## API Endpoints

### GET /api/author/{author_id}/works/ranked

Returns papers with integrity analysis and smart ranking.

**Query Parameters:**
- `page` (int): Page number (default: 1)
- `per_page` (int): Results per page (default: 25, max: 100)
- `year_from` (int): Filter by start year
- `year_to` (int): Filter by end year
- `min_citations` (int): Minimum citation count
- `enable_llm` (bool): Enable LLM evaluation (default: true)
- `query` (str): Search query for relevance scoring

**Response:**
```json
{
  "results": [
    {
      "id": "W1234567890",
      "title": "Paper Title",
      "year": 2023,
      "cited_by_count": 45,
      "venue": "Nature",
      "doi": "10.1234/example",
      
      "integrity": {
        "integrity_score": 85,
        "risk_level": "LOW",
        "flags": [],
        "crossref_verified": true
      },
      
      "llm": {
        "quality_score": 8.5,
        "credibility_score": 9.0,
        "relevance_score": 7.5,
        "suspicious": false,
        "reason": "High-quality research in reputable venue"
      },
      
      "final_score": 87.5,
      "rank": 1,
      "rank_explanation": "High citation rate • High integrity score • High quality assessment",
      
      "score_components": {
        "citation": 75.2,
        "recency": 20,
        "author": 82.5,
        "integrity": 85,
        "llm": 85.5
      }
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 25,
    "count": 150
  },
  "analysis_enabled": true,
  "llm_enabled": true
}
```

## Scoring Algorithm

### Final Score Calculation

```
final_score = 
  citation_score * 0.20 +
  recency_bonus * 0.10 +
  author_reputation * 0.15 +
  integrity_score * 0.25 +
  llm_score * 0.30
```

### Component Scores

#### 1. Citation Score (20% weight)
- Normalized citations per year
- Log scale for better distribution
- Range: 0-100

```python
citation_rate = citations / paper_age
normalized = min(100, (log(citation_rate + 1) / log(51)) * 100)
```

#### 2. Recency Bonus (10% weight)
- Recent papers get bonus points
- Age ≤ 2 years: +20 points
- Age ≤ 5 years: +10 points
- Age > 5 years: 0 points

#### 3. Author Reputation (15% weight)
- Based on author's total citations and h-index
- Range: 0-100

```python
score = log(citations + 1) * 5 + h_index * 2
```

#### 4. Integrity Score (25% weight)
- Starts at 100, penalties applied
- CrossRef not found: -15
- Citation anomaly: -20
- Suspicious venue: -25
- Title issues: -10 to -15
- Missing DOI: -5

#### 5. LLM Score (30% weight)
- Weighted combination of quality, credibility, relevance
- Suspicious papers get 50% penalty
- Range: 0-100

```python
score = (quality * 2 + credibility * 2 + relevance * 1.5) / 5.5 * 10
if suspicious: score *= 0.5
```

## Integrity Checks

### 1. CrossRef Verification
Queries CrossRef API to verify paper exists in their database.

**Penalty**: -15 points if not found

### 2. Citation Anomaly Detection

**Rules:**
- Age ≤ 1 year AND citations > 150 → Suspicious
- Age ≥ 6 years AND citations = 0 → Suspicious

**Penalty**: -20 points

### 3. Suspicious Venue Patterns

**Flagged patterns:**
- "international journal of"
- "global journal"
- "world journal"
- "ijar"
- "ijcrt"

**Penalty**: -25 points

### 4. Title Quality Check

**Issues detected:**
- < 4 words: -10 points
- > 3 buzzwords: -15 points
- Repeated words: -10 points

**Buzzwords:**
novel, efficient, hybrid, smart, advanced, innovative, revolutionary, cutting-edge, state-of-the-art, breakthrough

## LLM Evaluation

### Prompt Template

```
You are an academic reviewer. Evaluate this research paper objectively.

TITLE: {title}
ABSTRACT: {abstract}
VENUE: {venue}
YEAR: {year}
CITATIONS: {citations}
SEARCH QUERY: {query}

Return ONLY valid JSON:
{
  "quality_score": <0-10>,
  "credibility_score": <0-10>,
  "relevance_score": <0-10>,
  "suspicious": <true or false>,
  "reason": "<brief explanation>"
}
```

### Scoring Guidelines

**Quality Score (0-10):**
- Research methodology
- Clarity of presentation
- Contribution to field

**Credibility Score (0-10):**
- Venue reputation
- Citation patterns
- Author credibility

**Relevance Score (0-10):**
- Relevance to search query
- General relevance if no query

**Suspicious Flag:**
- Signs of predatory publishing
- Academic misconduct indicators

## Usage Examples

### Basic Usage

```python
# Fetch ranked papers
response = await client.get(
    f"/api/author/{author_id}/works/ranked",
    params={"per_page": 25}
)

papers = response.json()["results"]

for paper in papers:
    print(f"Rank #{paper['rank']}: {paper['title']}")
    print(f"Score: {paper['final_score']}")
    print(f"Integrity: {paper['integrity']['risk_level']}")
    print(f"Explanation: {paper['rank_explanation']}")
```

### With Filters

```python
# Get recent high-quality papers
response = await client.get(
    f"/api/author/{author_id}/works/ranked",
    params={
        "year_from": 2020,
        "min_citations": 10,
        "enable_llm": True,
        "query": "machine learning"
    }
)
```

### Disable LLM (Faster)

```python
# Skip LLM evaluation for faster results
response = await client.get(
    f"/api/author/{author_id}/works/ranked",
    params={"enable_llm": False}
)
```

## Performance Considerations

### Batch Processing
- Integrity analysis runs in parallel for all papers
- LLM evaluation limited to 3 concurrent requests
- CrossRef queries have 5-second timeout

### Caching Recommendations
Consider caching:
- Integrity analysis results (by paper ID)
- LLM evaluation results (by paper ID + query)
- Author reputation scores (by author ID)

### Optimization Tips
1. **Disable LLM for large datasets**: Set `enable_llm=false`
2. **Use pagination**: Don't fetch all papers at once
3. **Filter before ranking**: Use year/citation filters
4. **Cache results**: Store rankings for frequently accessed authors

## Error Handling

### Graceful Degradation
- Network errors don't crash analysis
- Missing fields handled safely
- LLM failures return default scores
- Exceptions caught and logged

### Default Scores
When analysis fails:
- Integrity score: 50 (MEDIUM risk)
- LLM scores: 5/10 (neutral)
- Final score: Calculated with available data

## Configuration

### Environment Variables

```env
# Required for LLM evaluation
HF_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional: Custom model
HF_SUMMARY_MODEL=HuggingFaceTB/SmolLM3-3B:hf-inference
```

### Adjusting Weights

Edit `ranking_engine.py`:

```python
final_score = (
    citation_score * 0.20 +    # Adjust these weights
    recency_bonus * 0.10 +
    author_score * 0.15 +
    integrity_score * 0.25 +
    llm_score * 0.30
)
```

### Customizing Penalties

Edit `integrity_analyzer.py`:

```python
# Adjust penalty values
if not crossref_verified:
    score -= 15  # Change this value

if is_suspicious_venue:
    score -= 25  # Change this value
```

## Frontend Integration

### Display Integrity Score

```javascript
// Show integrity badge
const badge = document.createElement('span');
badge.className = `integrity-badge ${paper.integrity.risk_level.toLowerCase()}`;
badge.textContent = `${paper.integrity.risk_level} RISK`;
```

### Show Ranking

```javascript
// Display rank and score
const rankInfo = document.createElement('div');
rankInfo.innerHTML = `
  <div class="rank">#${paper.rank}</div>
  <div class="score">Score: ${paper.final_score.toFixed(1)}</div>
  <div class="explanation">${paper.rank_explanation}</div>
`;
```

### Show LLM Scores

```javascript
// Display quality metrics
const metrics = document.createElement('div');
metrics.innerHTML = `
  <div>Quality: ${paper.llm.quality_score}/10</div>
  <div>Credibility: ${paper.llm.credibility_score}/10</div>
  <div>Relevance: ${paper.llm.relevance_score}/10</div>
`;
```

## Testing

### Test Integrity Analysis

```python
from backend.services.integrity_analyzer import analyze_paper_integrity

paper = {
    "title": "Novel Hybrid Approach",
    "year": 2023,
    "cited_by_count": 200,
    "venue": "International Journal of Advanced Research",
    "doi": None
}

result = await analyze_paper_integrity(paper)
print(result)
# Expected: High penalties for buzzwords and suspicious venue
```

### Test Ranking

```python
from backend.services.ranking_engine import rank_papers

papers = [...]  # List of papers with integrity and llm attached
ranked = rank_papers(papers, author=author_data, query="machine learning")

for paper in ranked[:5]:
    print(f"{paper['rank']}. {paper['title']} - Score: {paper['final_score']}")
```

## Troubleshooting

### LLM Not Working
- Check HF_TOKEN is set
- Verify token is valid
- Check API rate limits
- Try with `enable_llm=false`

### Slow Performance
- Reduce `per_page` value
- Disable LLM evaluation
- Use pagination
- Implement caching

### Incorrect Rankings
- Check component weights
- Verify integrity penalties
- Review LLM prompt
- Check author data availability

## Future Enhancements

### Planned Features
- [ ] Caching layer for results
- [ ] Configurable weights via API
- [ ] Batch analysis endpoint
- [ ] Historical ranking trends
- [ ] Custom integrity rules
- [ ] More LLM models support
- [ ] Collaborative filtering
- [ ] Citation network analysis

### Possible Improvements
- Add more integrity checks
- Improve LLM prompt engineering
- Optimize batch processing
- Add real-time updates
- Support custom scoring functions

## References

- CrossRef API: https://api.crossref.org
- Hugging Face: https://huggingface.co
- OpenAlex: https://openalex.org
- Academic integrity guidelines

## License

Same as main project (MIT License)

## Support

For issues or questions:
- Check API documentation at `/docs`
- Review error messages in response
- Enable debug logging
- Contact development team

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Status**: Production Ready
