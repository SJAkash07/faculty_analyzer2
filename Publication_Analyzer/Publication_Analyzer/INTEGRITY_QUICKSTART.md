# Quick Start: Integrity Analyzer + Smart Ranking

## 🚀 Get Started in 3 Steps

### Step 1: Server is Already Running
Your server should already be running at http://127.0.0.1:8000

If not:
```bash
cd Publication_Analyzer/Publication_Analyzer
uvicorn backend.main:app --reload
```

### Step 2: Test the New Endpoint

**Basic Request:**
```bash
curl "http://127.0.0.1:8000/api/author/A2208157607/works/ranked?per_page=5"
```

**With LLM Enabled:**
```bash
curl "http://127.0.0.1:8000/api/author/A2208157607/works/ranked?per_page=5&enable_llm=true&query=machine+learning"
```

**Without LLM (Faster):**
```bash
curl "http://127.0.0.1:8000/api/author/A2208157607/works/ranked?per_page=5&enable_llm=false"
```

### Step 3: View Results

The response includes:
- `integrity`: Integrity analysis with score and risk level
- `llm`: LLM quality evaluation (if enabled)
- `final_score`: Combined ranking score
- `rank`: Position in ranked list
- `rank_explanation`: Why this paper ranks here

## 📊 Example Response

```json
{
  "results": [
    {
      "id": "W2123456789",
      "title": "Deep Learning for Computer Vision",
      "year": 2022,
      "cited_by_count": 125,
      "venue": "Nature Machine Intelligence",
      
      "integrity": {
        "integrity_score": 90,
        "risk_level": "LOW",
        "flags": [],
        "crossref_verified": true
      },
      
      "llm": {
        "quality_score": 8.5,
        "credibility_score": 9.0,
        "relevance_score": 8.0,
        "suspicious": false,
        "reason": "High-quality research in reputable venue with strong methodology"
      },
      
      "final_score": 88.5,
      "rank": 1,
      "rank_explanation": "High citation rate • Very recent publication • High integrity score"
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 5,
    "count": 150
  },
  "analysis_enabled": true,
  "llm_enabled": true
}
```

## 🎯 Key Features

### Integrity Analysis
- ✅ CrossRef verification
- ✅ Citation anomaly detection
- ✅ Suspicious venue detection
- ✅ Title quality check
- ✅ Risk level: LOW/MEDIUM/HIGH

### LLM Evaluation (Optional)
- ✅ Quality score (0-10)
- ✅ Credibility score (0-10)
- ✅ Relevance score (0-10)
- ✅ Suspicious flag
- ✅ Explanation

### Smart Ranking
- ✅ Multi-factor scoring
- ✅ Weighted algorithm
- ✅ Explainable rankings
- ✅ Component breakdown

## 🔧 API Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `per_page` | int | 25 | Results per page (max 100) |
| `year_from` | int | - | Filter by start year |
| `year_to` | int | - | Filter by end year |
| `min_citations` | int | - | Minimum citations |
| `enable_llm` | bool | true | Enable LLM evaluation |
| `query` | string | - | Search query for relevance |

## 📈 Scoring Breakdown

### Final Score = Weighted Sum
```
20% Citation Score    (citations per year, normalized)
10% Recency Bonus     (recent papers get bonus)
15% Author Reputation (h-index, total citations)
25% Integrity Score   (CrossRef, anomalies, venue)
30% LLM Score         (quality, credibility, relevance)
```

### Risk Levels
- **LOW** (75-100): High integrity, trustworthy
- **MEDIUM** (50-74): Some concerns, review flags
- **HIGH** (0-49): Multiple issues, investigate

## 🎨 Frontend Integration

### Display Integrity Badge
```javascript
const badge = `
  <span class="badge ${paper.integrity.risk_level.toLowerCase()}">
    ${paper.integrity.risk_level} RISK
  </span>
`;
```

### Show Ranking
```javascript
const ranking = `
  <div class="ranking">
    <div class="rank">#${paper.rank}</div>
    <div class="score">${paper.final_score.toFixed(1)}</div>
    <div class="explanation">${paper.rank_explanation}</div>
  </div>
`;
```

### Display LLM Scores
```javascript
const scores = `
  <div class="llm-scores">
    <div>Quality: ${paper.llm.quality_score}/10</div>
    <div>Credibility: ${paper.llm.credibility_score}/10</div>
    <div>Relevance: ${paper.llm.relevance_score}/10</div>
  </div>
`;
```

## ⚡ Performance Tips

### Fast Mode (No LLM)
```bash
# Skip LLM for instant results
curl "http://127.0.0.1:8000/api/author/A2208157607/works/ranked?enable_llm=false"
```

### Filtered Results
```bash
# Get only recent high-quality papers
curl "http://127.0.0.1:8000/api/author/A2208157607/works/ranked?year_from=2020&min_citations=10"
```

### Pagination
```bash
# Get top 10 papers
curl "http://127.0.0.1:8000/api/author/A2208157607/works/ranked?per_page=10&page=1"
```

## 🐛 Troubleshooting

### LLM Not Working?
1. Check if HF_TOKEN is set: `echo $HF_TOKEN`
2. Set token: `export HF_TOKEN=hf_xxxxx`
3. Or disable LLM: `enable_llm=false`

### Slow Response?
1. Reduce `per_page` value
2. Disable LLM: `enable_llm=false`
3. Use filters to reduce dataset

### No Results?
1. Check author ID is correct
2. Try without filters first
3. Check if author has publications

## 📚 Next Steps

1. **Read Full Documentation**: See `INTEGRITY_RANKING_FEATURE.md`
2. **Test Different Authors**: Try various author IDs
3. **Experiment with Filters**: Test year ranges and citation filters
4. **Integrate Frontend**: Add UI components to display scores
5. **Customize Weights**: Adjust scoring algorithm if needed

## 🔗 Useful Links

- **API Docs**: http://127.0.0.1:8000/docs
- **Full Documentation**: `INTEGRITY_RANKING_FEATURE.md`
- **Main README**: `README.md`

## ✅ Quick Test

```bash
# Test with a known author (Andrew Ng)
curl "http://127.0.0.1:8000/api/author/A2208157607/works/ranked?per_page=3&enable_llm=false" | python -m json.tool

# Expected: 3 papers with integrity scores and rankings
```

---

**Ready to use!** The feature is fully integrated and working. 🎉
