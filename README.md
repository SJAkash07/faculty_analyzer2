# 📚 Publication Analyzer

A comprehensive web application for analyzing faculty research profiles, publications, and academic metrics. Perfect for university committees handling hiring, promotion, tenure, and accreditation decisions.

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![Python](https://img.shields.io/badge/python-3.8+-green)
![License](https://img.shields.io/badge/license-MIT-orange)

## 🌟 Overview

Publication Analyzer aggregates data from 7 academic databases to provide comprehensive faculty research profiles with AI-powered insights. Search researchers, view publications, generate summaries, compare faculty, and create accreditation reports - all in one place.

## ✨ Key Features

- 🔍 **Multi-Database Search** - Search across OpenAlex, Google Scholar, and 5 other databases
- 📊 **Comprehensive Metrics** - h-index, i10-index, citations, publication counts
- 🤖 **AI-Powered Summaries** - Generate assessment summaries using Hugging Face models
- ⚖️ **Faculty Comparison** - Side-by-side comparison with AI analysis
- 📦 **Batch Processing** - Upload CSV to analyze multiple faculty at once
- 📄 **PDF Reports** - Generate professional accreditation reports
- 💾 **Save & Export** - Bookmark items and export to CSV
- 🎨 **Modern UI** - Responsive design with dark/light themes

## 🚀 Quick Start

### Installation

```bash
# Navigate to project directory
cd Publication_Analyzer/Publication_Analyzer

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn backend.main:app --reload
```

### Access the App

Open your browser and go to: **http://127.0.0.1:8000**

### Optional: Enable AI Features

1. Get a free Hugging Face token: https://huggingface.co/settings/tokens
2. Create `.env` file:
   ```env
   HF_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
3. Restart the server

## 📖 Usage

### Search Faculty
1. Enter researcher name
2. View results with metrics and photos
3. Click to see full profile

### View Profile
- Browse publications with filters
- See research fingerprint chart
- Check 7 external data sources
- Download PDF report

### Compare Faculty
1. Save two or more faculty
2. Go to Compare tab
3. Select two faculty
4. View AI-powered comparison

### Batch Analysis
1. Go to Batch tab
2. Upload CSV with names
3. View summary table
4. Export results

## 🗂️ Project Structure

```
Publication_Analyzer/
├── backend/
│   ├── main.py          # FastAPI application
│   ├── config.py        # Configuration
│   └── utils.py         # Utilities
├── frontend/
│   ├── index.html       # Main page
│   ├── app.js           # JavaScript
│   └── styles.css       # Styling
├── requirements.txt     # Dependencies
├── .env.example         # Config template
└── README.md           # Documentation
```

## 📊 Data Sources

1. **OpenAlex** - Publications, citations, metrics (primary)
2. **Google Scholar** - Profile photos, interests, emails
3. **Semantic Scholar** - Papers and citations
4. **ORCID** - Researcher IDs, employment
5. **CrossRef** - DOI metadata
6. **OpenAIRE** - EU projects and grants
7. **Europe PMC** - Life sciences literature

## 🔧 Configuration

### Environment Variables

Create `.env` file:

```env
# Required for AI features
HF_TOKEN=your_hugging_face_token

# Optional: Disable Google Scholar
USE_GOOGLE_SCHOLAR=true

# Optional: Custom AI model
HF_SUMMARY_MODEL=HuggingFaceTB/SmolLM3-3B:hf-inference
```

### Google Scholar Note

Google Scholar may rate-limit requests. When this happens, the app automatically falls back to OpenAlex (reliable and fast). This is expected behavior.

## 🤖 AI Features

### Requirements
- Free Hugging Face account
- API token from https://huggingface.co/settings/tokens

### Capabilities
- **Paper Summaries**: Assessment summaries for research papers
- **Faculty Comparison**: AI-powered comparative analysis
- **Chat**: Ask questions about papers

## 🚢 Deployment

### Render.com
1. Push to GitHub
2. Connect Render to repository
3. Set environment variables
4. Deploy

### Heroku
```bash
# Create Procfile
echo "web: uvicorn backend.main:app --host 0.0.0.0 --port \$PORT" > Procfile

# Deploy
git push heroku main
```

### Docker
```bash
docker build -t publication-analyzer .
docker run -p 8000:8000 publication-analyzer
```

## 📚 Documentation

- **Full Documentation**: See `Publication_Analyzer/Publication_Analyzer/README.md`
- **API Docs**: http://127.0.0.1:8000/docs (when server is running)
- **Features**: See `FEATURES.md`
- **Changelog**: See `CHANGELOG.md`

## 🐛 Troubleshooting

### Google Scholar Not Working
- **Cause**: Rate limiting (normal)
- **Solution**: App uses OpenAlex fallback automatically

### AI Features Not Working
- **Cause**: Missing HF_TOKEN
- **Solution**: Set token in `.env` file

### Port Already in Use
```bash
uvicorn backend.main:app --reload --port 8001
```

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

See `CONTRIBUTING.md` for details.

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Credits

Built with:
- **FastAPI** - Web framework
- **OpenAlex** - Primary data source
- **Hugging Face** - AI models
- **Chart.js** - Visualizations
- **scholarly** - Google Scholar integration

## 📧 Support

- **Issues**: Open an issue on GitHub
- **Documentation**: Check `/docs` endpoint
- **API Reference**: http://127.0.0.1:8000/docs

## 🎯 Roadmap

- [ ] Manual photo upload
- [ ] More AI models
- [ ] Citation network visualization
- [ ] Collaboration analysis
- [ ] Multi-language support
- [ ] Mobile app

---

**Made for academic committees** | **Version 2.0.0** | **2024**

**Get Started**: `cd Publication_Analyzer/Publication_Analyzer && uvicorn backend.main:app --reload`
