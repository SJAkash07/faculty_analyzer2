# How to Run Publication Analyzer

## Prerequisites
- Python 3.8 or higher
- pip (Python package manager)

## Installation Steps

### 1. Navigate to the Project Directory
```bash
cd "Publication_Analyzer/Publication_Analyzer"
```

### 2. Install Required Packages
```bash
pip install -r requirements.txt
```

Required packages include:
- fastapi
- uvicorn
- httpx
- python-dotenv
- huggingface_hub

### 3. Set Up Environment Variables
Create or edit the `.env` file with your API keys:
```
HUGGINGFACE_API_KEY=your_huggingface_token_here
```

### 4. Run the Backend Server
```bash
uvicorn backend.main:app --reload
```

Or use the PowerShell script:
```powershell
.\run.ps1
```

The server will start at: **http://127.0.0.1:8000**

### 5. Open the Application
Open your web browser and go to:
```
http://127.0.0.1:8000
```

## Quick Start Commands

### Windows (PowerShell)
```powershell
cd "Publication_Analyzer\Publication_Analyzer"
pip install -r requirements.txt
uvicorn backend.main:app --reload
```

### Windows (Command Prompt)
```cmd
cd Publication_Analyzer\Publication_Analyzer
pip install -r requirements.txt
uvicorn backend.main:app --reload
```

### Linux/Mac
```bash
cd Publication_Analyzer/Publication_Analyzer
pip install -r requirements.txt
uvicorn backend.main:app --reload
```

## Troubleshooting

### Port Already in Use
If port 8000 is already in use, run on a different port:
```bash
uvicorn backend.main:app --reload --port 8001
```

### Module Not Found Error
Make sure you're in the correct directory:
```bash
cd Publication_Analyzer/Publication_Analyzer
```

### Missing Dependencies
Reinstall all dependencies:
```bash
pip install -r requirements.txt --force-reinstall
```

### HuggingFace API Issues
- Get a free API token from: https://huggingface.co/settings/tokens
- Add it to your `.env` file
- The app will work without it but AI features will be limited

## Features Available

Once running, you can:
1. **Search Faculty** - Search for researchers by name
2. **Rank Papers** - Search and rank papers by topic with AI analysis
3. **View Profiles** - See detailed faculty profiles with publications
4. **Save Items** - Save authors and papers for quick access
5. **Compare Faculty** - Compare two faculty members side-by-side
6. **Batch Summary** - Generate summaries for multiple faculty
7. **Dashboard** - Upload CSV for department-wide analysis

## API Endpoints

The backend provides these endpoints:
- `GET /` - Frontend interface
- `GET /api/search/authors` - Search for authors
- `GET /api/author/{author_id}` - Get author details
- `GET /api/author/{author_id}/works` - Get author's publications
- `GET /api/author/{author_id}/works/ranked` - Get ranked publications
- `GET /api/search/papers` - Search and rank papers by topic

## Stopping the Server

Press `Ctrl + C` in the terminal to stop the server.

## Development Mode

The `--reload` flag enables auto-reload when you make code changes. Remove it for production:
```bash
uvicorn backend.main:app
```

## Notes

- The application uses OpenAlex API (no key required)
- HuggingFace API is optional for AI features
- All data is fetched in real-time (no database required)
- The library background image should be in `frontend/library-bg.jpg`
