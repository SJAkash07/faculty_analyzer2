# Publications Summary Generator for Faculty Profiles

Automated system that collects and displays faculty publication data from academic databases with AI-powered analysis.

## Features

- **Faculty Search** — Search researchers by name from OpenAlex database
- **Detailed Profiles** — View publications, citations, h-index, i10-index, and institutional affiliations
- **AI Assessment Summaries** — Generate evaluation-oriented summaries for hiring/promotion committees
- **Faculty Comparison** — Side-by-side comparison with AI-generated assessments
- **Batch Processing** — Analyze up to 50 faculty members at once
- **Research Fingerprint** — Visualize publication type distribution
- **PDF Reports** — Generate accreditation reports
- **Multi-source Data** — Integrates OpenAlex, Semantic Scholar, ORCID, CrossRef, OpenAIRE, Europe PMC
- **Dark Mode** — Light/dark theme support

## Quick Start

### Prerequisites

- Python 3.10 or higher
- pip (Python package manager)

### Installation

1. **Clone or download the project**

2. **Navigate to the project directory:**
   ```bash
   cd Publication_Analyzer/Publication_Analyzer
   ```

3. **Create a virtual environment (recommended):**
   ```bash
   python -m venv venv
   ```

4. **Activate the virtual environment:**
   - Windows (PowerShell): `.\venv\Scripts\Activate.ps1`
   - Windows (CMD): `.\venv\Scripts\activate.bat`
   - macOS/Linux: `source venv/bin/activate`

5. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

6. **Configure environment variables (optional for AI features):**
   ```bash
   copy .env.example .env
   ```
   Edit `.env` and add your Hugging Face token (get one free at https://huggingface.co/settings/tokens)

### Running the Application

**Option 1: Using the run script (from workspace root):**
```powershell
.\run.ps1
```

**Option 2: Manual start:**
```bash
cd Publication_Analyzer/Publication_Analyzer
uvicorn backend.main:app --reload
```

**Option 3: From project root:**
```bash
python -m uvicorn Publication_Analyzer.Publication_Analyzer.backend.main:app --reload
```

The application will be available at: **http://127.0.0.1:8000**

## Usage

1. **Search** — Enter a faculty name (e.g., "Carl Sagan", "Marie Curie")
2. **View Profile** — Click on a researcher to see their publications
3. **Assessment Summary** — Click "Assessment Summary" on any paper for AI evaluation
4. **Compare** — Use the "Compare faculty" tab to compare two researchers
5. **Batch** — Use "Batch summary" to analyze multiple faculty at once
6. **Save** — Save authors and papers for quick access later

## API Documentation

Interactive API documentation is available at:
- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

### Key Endpoints

- `GET /api/search?q=<name>` — Search authors
- `GET /api/author/{id}` — Get author profile
- `GET /api/author/{id}/works` — Get publications (paginated, filterable)
- `POST /api/summarize` — Generate AI assessment summary
- `POST /api/compare-authors` — Compare two faculty members
- `POST /api/batch-faculty` — Batch lookup
- `POST /api/generate-pdf` — Generate PDF report

## Configuration

### Environment Variables

Create a `.env` file (copy from `.env.example`):

```env
# Required for AI features
HF_TOKEN=your_huggingface_token_here

# Optional overrides
HF_SUMMARY_MODEL=HuggingFaceTB/SmolLM3-3B:hf-inference
API_TIMEOUT=30
HF_TIMEOUT=90
```

### AI Features

AI features (summaries, comparisons, chat) require a free Hugging Face token:
1. Sign up at https://huggingface.co
2. Go to https://huggingface.co/settings/tokens
3. Create a new token (read access is sufficient)
4. Add it to your `.env` file

**Note:** First AI request may take 30-60 seconds while the model loads (cold start).

## Data Sources

- **OpenAlex** (primary) — Open catalog of scholarly works
- **Semantic Scholar** — Papers and citations
- **ORCID** — Researcher IDs and employment history
- **CrossRef** — DOI metadata
- **OpenAIRE** — EU research projects and grants
- **Europe PMC** — Life sciences literature

## Tech Stack

- **Backend:** FastAPI (Python), httpx, Pydantic
- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **AI:** Hugging Face Inference API
- **Charts:** Chart.js
- **PDF:** ReportLab
- **Data:** OpenAlex API + 5 additional sources

## Project Structure

```
Publication_Analyzer/
├── backend/
│   └── main.py          # FastAPI application
├── frontend/
│   ├── index.html       # Main UI
│   ├── app.js           # Frontend logic
│   └── styles.css       # Styling
├── .env.example         # Environment template
├── .gitignore          # Git ignore rules
├── requirements.txt     # Python dependencies
└── README.md           # This file
```

## Troubleshooting

### "Module not found" error
Make sure you're in the correct directory and the virtual environment is activated.

### AI features not working
1. Check that `HF_TOKEN` is set in `.env`
2. Verify the token is valid at https://huggingface.co/settings/tokens
3. First request may take 30-60 seconds (model loading)

### Port already in use
Change the port: `uvicorn backend.main:app --reload --port 8001`

### Search returns no results
- Try different name variations
- Check your internet connection
- OpenAlex API may be temporarily unavailable

## Development

### Running Tests
```bash
pytest
```

### Code Quality
```bash
# Format code
black backend/

# Lint
flake8 backend/

# Type checking
mypy backend/
```

## License

This project uses data from OpenAlex and other open academic databases. Please review their respective terms of service.

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review API documentation at `/docs`
3. Check OpenAlex status at https://openalex.org

## Acknowledgments

- OpenAlex for open academic data
- Hugging Face for free AI inference
- All contributing open data sources
