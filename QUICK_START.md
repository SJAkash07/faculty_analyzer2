# Quick Start Guide - Publication Analyzer

## 🚀 Fastest Way to Run

### Option 1: Using PowerShell Script (Recommended for Windows)
```powershell
.\run.ps1
```

### Option 2: Manual Start
```powershell
cd Publication_Analyzer\Publication_Analyzer
uvicorn backend.main:app --reload
```

## 📋 First Time Setup

1. **Install Python Dependencies**
   ```powershell
   cd Publication_Analyzer\Publication_Analyzer
   pip install -r requirements.txt
   ```

2. **Run the Application**
   ```powershell
   cd ..\..
   .\run.ps1
   ```

3. **Open in Browser**
   ```
   http://127.0.0.1:8000
   ```

## ✅ That's It!

The application will open with:
- Beautiful library background
- Modern dark gradient UI
- All features ready to use

## 🎯 What You Can Do

1. **Search Faculty** - Type a researcher's name
2. **Rank Papers** - Search papers by topic with AI ranking
3. **View Profiles** - See publications, citations, h-index
4. **Save Items** - Bookmark authors and papers
5. **Compare** - Compare two faculty members
6. **Batch Process** - Analyze multiple faculty at once

## 🔧 Optional: HuggingFace API

For AI quality evaluation features:
1. Get free token: https://huggingface.co/settings/tokens
2. Add to `.env` file:
   ```
   HUGGINGFACE_API_KEY=your_token_here
   ```

The app works fine without it!

## 🛑 Stop Server

Press `Ctrl + C` in the terminal

## 💡 Tips

- The app uses OpenAlex API (free, no key needed)
- All data is real-time (no database setup)
- Works on any modern browser
- Responsive design for mobile/tablet

## ❓ Problems?

**Port 8000 in use?**
```powershell
uvicorn backend.main:app --reload --port 8001
```

**Module not found?**
```powershell
cd Publication_Analyzer\Publication_Analyzer
pip install -r requirements.txt
```

**Need help?**
Check `HOW_TO_RUN.md` for detailed instructions
