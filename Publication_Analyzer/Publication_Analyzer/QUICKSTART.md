# Quick Start Guide

Get up and running with Publication Analyzer in 5 minutes.

## Prerequisites

- Python 3.10 or higher
- Internet connection

## Installation

### 1. Open Terminal/PowerShell

Navigate to the project directory:
```bash
cd Publication_Analyzer/Publication_Analyzer
```

### 2. Create Virtual Environment (Recommended)

**Windows (PowerShell):**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**Windows (CMD):**
```cmd
python -m venv venv
.\venv\Scripts\activate.bat
```

**macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment (Optional)

For AI features (summaries, comparisons, chat):

1. Copy the example environment file:
   ```bash
   copy .env.example .env  # Windows
   cp .env.example .env    # macOS/Linux
   ```

2. Get a free Hugging Face token:
   - Go to https://huggingface.co/settings/tokens
   - Create a new token (read access is enough)

3. Edit `.env` and add your token:
   ```env
   HF_TOKEN=hf_your_token_here
   ```

### 5. Run the Application

**Option A: Using the run script (from workspace root):**
```powershell
.\run.ps1
```

**Option B: Manual start:**
```bash
uvicorn backend.main:app --reload
```

### 6. Open in Browser

Navigate to: **http://127.0.0.1:8000**

## First Steps

### Search for a Researcher

1. Enter a name in the search box (e.g., "Carl Sagan")
2. Click "Search" or press Enter
3. Click on a researcher to view their profile

### View Publications

- Publications are listed with title, year, venue, and citations
- Use filters to sort by date, citations, or title
- Filter by year range or minimum citations
- Click "Load more" to see additional publications

### Generate AI Summary

1. Click "Assessment Summary" on any paper
2. Wait 30-60 seconds for first request (model loading)
3. View the AI-generated assessment
4. Use "Ask about this paper" to ask questions

### Compare Faculty

1. Go to the "Compare faculty" tab
2. Select two researchers (from search or saved)
3. Click "Compare"
4. View side-by-side metrics and AI assessment

### Batch Analysis

1. Go to the "Batch summary" tab
2. Paste faculty names (one per line, max 50)
3. Click "Run batch"
4. Export results as CSV

## Troubleshooting

### "Module not found" error
- Make sure virtual environment is activated
- Run `pip install -r requirements.txt`

### AI features not working
- Check that `HF_TOKEN` is set in `.env`
- Verify token at https://huggingface.co/settings/tokens
- First request takes 30-60 seconds (model loading)

### Port already in use
```bash
uvicorn backend.main:app --reload --port 8001
```

### Search returns no results
- Try different name variations
- Check internet connection
- OpenAlex API may be temporarily unavailable

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check [API documentation](http://127.0.0.1:8000/docs) for integration
- See [CONTRIBUTING.md](CONTRIBUTING.md) to contribute

## Getting Help

- Check the [README.md](README.md) troubleshooting section
- Review [API docs](http://127.0.0.1:8000/docs)
- Open an issue on the project repository

## Tips

- **Save items**: Click "Save" on authors or papers for quick access
- **Dark mode**: Toggle theme in the header
- **Export data**: Use CSV export for saved items and batch results
- **PDF reports**: Generate accreditation reports from faculty profiles
- **Keyboard shortcuts**: Press Enter to search

Enjoy using Publication Analyzer! 🎓
