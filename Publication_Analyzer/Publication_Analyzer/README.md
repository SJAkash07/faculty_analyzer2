# 📚 Publication Analyzer

A comprehensive web application for analyzing faculty research profiles, publications, and academic metrics. Built for university committees (hiring, promotion, tenure, accreditation).

## ✨ Features

### Core Functionality
- **Faculty Search**: Search researchers by name across multiple databases
- **Profile View**: Comprehensive researcher profiles with metrics and publications
- **AI Summaries**: Generate assessment summaries for research papers (Hugging Face)
- **Faculty Comparison**: AI-powered side-by-side comparison of researchers
- **Batch Processing**: Upload CSV files to analyze multiple faculty at once
- **PDF Reports**: Generate accreditation reports for faculty members
- **Research Fingerprint**: Visual analysis of publication types and research areas

### Data Sources (7 Databases)
1. **OpenAlex** - Primary source for publications and metrics
2. **Google Scholar** - Profile photos, research interests, verified emails
3. **Semantic Scholar** - Papers and citations
4. **ORCID** - Researcher IDs, employment, funding
5. **CrossRef** - DOI metadata and publications
6. **OpenAIRE** - EU projects and grants
7. **Europe PMC** - Life sciences literature

### Advanced Features
- Save/bookmark authors and papers
- Filter publications by year, citations, type
- Export data to CSV
- Dark/light theme
- Responsive design (mobile-friendly)
- Browser history support (bookmarkable URLs)

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- pip (Python package manager)

### Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd Publication_Analyzer/Publication_Analyzer
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables (optional)**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add:
   - `HF_TOKEN` - Hugging Face API token (for AI summaries/comparisons)
   - `USE_GOOGLE_SCHOLAR` - Set to `false` to disable Google Scholar

4. **Run the server**
   ```bash
   uvicorn backend.main:app --reload
   ```

5. **Open your browser**
   ```
   http://127.0.0.1:8000
   ```

## 📖 Usage

### Search for Faculty
1. Enter a researcher's name in the search box
2. Click "Search" or press Enter
3. View results with metrics (papers, citations, h-index, i10-index)
4. Click on any result to view full profile

### View Profile
- See comprehensive metrics and statistics
- Browse publications with filters
- Generate AI summaries for papers
- Download PDF accreditation report
- View data from 7 external sources
- See research fingerprint chart

### Compare Faculty
1. Go to "Compare" tab
2. Select two faculty from saved list
3. Click "Compare"
4. View AI-powered comparison assessment
5. Ask follow-up questions in chat

### Batch Processing
1. Go to "Batch" tab
2. Upload CSV file with faculty names (one per line)
3. View summary table with all metrics
4. Export results to CSV

### Save & Export
- Click "Save" on any author or paper
- Go to "Saved" tab to view saved items
- Export saved data to CSV
- Print profiles and comparisons

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Hugging Face API Token (for AI features)
# Get free token at: https://huggingface.co/settings/tokens
HF_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Google Scholar (optional)
# Set to false to disable Google Scholar and use only OpenAlex
USE_GOOGLE_SCHOLAR=true

# AI Model (optional)
# Default: HuggingFaceTB/SmolLM3-3B:hf-inference
HF_SUMMARY_MODEL=HuggingFaceTB/SmolLM3-3B:hf-inference
```

### Google Scholar Note

Google Scholar has no official API. The app uses web scraping via the `scholarly` library, which may be rate-limited by Google. When this happens:
- The app automatically falls back to OpenAlex (reliable, fast)
- You'll see placeholder letters instead of profile photos
- All other data (metrics, publications) works perfectly

This is expected behavior and not a bug. OpenAlex provides all essential data for faculty evaluation.

## 🎨 User Interface

### Search Results
- Colorful profile photos or placeholder letters
- Research interests as tags (when available)
- Email addresses (when available)
- All metrics: papers, citations, h-index, i10-index
- Institution names
- Source indicator (Google Scholar or OpenAlex)

### Profile Page
- Large profile photo or placeholder
- Comprehensive statistics
- Publications list with sorting and filtering
- Research fingerprint chart (publication types)
- External sources section (6 additional databases)
- PDF report download button
- Back button to preserve search results

### Navigation
- **Search**: Find faculty by name
- **Saved**: View bookmarked authors and papers
- **Compare**: Side-by-side faculty comparison
- **Batch**: Upload CSV for bulk analysis
- **Dashboard**: Overview and statistics

## 🤖 AI Features

### Requirements
- Free Hugging Face account
- API token (get at https://huggingface.co/settings/tokens)
- Set `HF_TOKEN` environment variable

### AI Summary
- Click "Summarize" on any paper
- Get structured assessment with:
  - Key research points (bullet points)
  - Author's interpretation
  - Assessment for committees

### Faculty Comparison
- Select two faculty
- Get AI-powered comparison
- Ask follow-up questions
- Export or print comparison

### Chat
- Ask questions about papers
- Get answers based on title and abstract
- Helpful for understanding research

## 📊 Metrics Explained

- **Publications**: Total number of research papers
- **Citations**: Total times cited by other researchers
- **h-index**: Researcher has h papers with at least h citations each
- **i10-index**: Number of papers with at least 10 citations

## 🛠️ Development

### Project Structure
```
Publication_Analyzer/
├── backend/
│   ├── main.py          # FastAPI application
│   ├── config.py        # Configuration
│   └── utils.py         # Utility functions
├── frontend/
│   ├── index.html       # Main HTML
│   ├── app.js           # JavaScript logic
│   └── styles.css       # Styling
├── tests/
│   └── test_utils.py    # Unit tests
├── requirements.txt     # Python dependencies
├── .env.example         # Environment template
└── README.md           # This file
```

### Running Tests
```bash
pytest tests/
```

### Development Mode
```bash
uvicorn backend.main:app --reload --log-level debug
```

## 🚢 Deployment

### Render.com (Recommended)
1. Push code to GitHub
2. Connect Render to your repository
3. Set environment variables in Render dashboard
4. Deploy automatically

### Heroku
1. Create `Procfile`: `web: uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
2. Push to Heroku
3. Set config vars (HF_TOKEN)

### Docker
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 📝 API Documentation

Once the server is running, visit:
- **Interactive API docs**: http://127.0.0.1:8000/docs
- **Alternative docs**: http://127.0.0.1:8000/redoc

### Key Endpoints

- `GET /api/search?q={name}` - Search for authors
- `GET /api/author/{id}` - Get author profile
- `GET /api/author/{id}/works` - Get publications
- `GET /api/author/{id}/external-sources` - Get data from 6 external sources
- `POST /api/summarize` - Generate AI summary for paper
- `POST /api/compare-authors` - Compare two faculty
- `POST /api/batch-faculty` - Batch process multiple faculty
- `POST /api/generate-pdf` - Generate PDF report

## 🔒 Privacy & Data

- No user data is stored on the server
- Saved items stored in browser local storage only
- API calls go directly to public databases
- No tracking or analytics
- Open source and transparent

## 🐛 Troubleshooting

### Google Scholar Not Working
**Issue**: Seeing "Results from OpenAlex" instead of "Results from Google Scholar"

**Cause**: Google is rate-limiting requests (normal behavior)

**Solution**: 
- Wait 10-30 minutes and try again
- Use VPN to change IP address
- Disable Google Scholar: `USE_GOOGLE_SCHOLAR=false` in `.env`
- Accept OpenAlex (provides all essential data)

### AI Features Not Working
**Issue**: "AI summary requires a Hugging Face token"

**Solution**: 
1. Get free token at https://huggingface.co/settings/tokens
2. Set `HF_TOKEN` environment variable
3. Restart server

### Server Won't Start
**Issue**: Port already in use

**Solution**: 
```bash
# Use different port
uvicorn backend.main:app --reload --port 8001
```

### Slow Performance
**Issue**: Searches taking too long

**Cause**: External APIs may be slow

**Solution**: 
- Check internet connection
- Try different search terms
- Disable Google Scholar for faster results

## 📚 Additional Documentation

- **FEATURES.md** - Detailed feature list
- **CHANGELOG.md** - Version history
- **CONTRIBUTING.md** - Contribution guidelines
- **GOOGLE_SCHOLAR_INTEGRATION.md** - Google Scholar setup

## 🤝 Contributing

Contributions welcome! Please read CONTRIBUTING.md first.

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- **OpenAlex** - Primary data source
- **Google Scholar** - Profile photos and interests
- **Hugging Face** - AI models
- **Semantic Scholar** - Additional publication data
- **ORCID** - Researcher identifiers
- **CrossRef** - DOI metadata
- **OpenAIRE** - EU research projects
- **Europe PMC** - Life sciences literature

## 📧 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review API docs at `/docs`

## 🎯 Roadmap

- [ ] Manual photo upload feature
- [ ] More AI models support
- [ ] Advanced analytics dashboard
- [ ] Collaboration network visualization
- [ ] Citation network analysis
- [ ] Export to more formats (Word, LaTeX)
- [ ] Multi-language support
- [ ] Mobile app

---

**Built with ❤️ for academic committees**

**Version**: 2.0.0  
**Last Updated**: 2024
