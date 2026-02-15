# Render Deployment Guide

## Quick Fix for "Loading..." Issue

The app shows "Loading..." because:
1. Google Scholar library (`scholarly`) causes startup issues on Render
2. Need to disable Google Scholar and use OpenAlex only

## Solution

### Step 1: Push Updated Configuration

The following files have been updated:
- `render.yaml` - Uses `requirements-render.txt` (without scholarly)
- `requirements-render.txt` - Dependencies without Google Scholar
- Environment variable `USE_GOOGLE_SCHOLAR=false` added

### Step 2: Deploy to Render

**Option A: Automatic (Recommended)**
```bash
git add .
git commit -m "Fix Render deployment: disable Google Scholar, add timeouts"
git push origin master
```
Render will automatically detect and redeploy.

**Option B: Manual Deploy**
1. Go to https://dashboard.render.com
2. Select your service (faculty-analyzer2)
3. Click "Manual Deploy" > "Deploy latest commit"

### Step 3: Verify Deployment

1. **Check Render Logs**:
   - Go to your service dashboard
   - Click "Logs" tab
   - Look for: "Uvicorn running on http://0.0.0.0:10000"
   - Should NOT see Google Scholar errors

2. **Test the App**:
   - Visit: https://faculty-analyzer2.onrender.com
   - Should see the search page with library background
   - Try searching for "Andrew Ng" or any author
   - Results will come from OpenAlex (no profile photos)

### Step 4: Add Environment Variable (Important!)

In Render Dashboard:
1. Go to your service
2. Click "Environment" tab
3. Add: `USE_GOOGLE_SCHOLAR` = `false`
4. Click "Save Changes"

## What Changed

- **Removed**: Google Scholar integration (causes issues on free tier)
- **Added**: Timeout settings (120s for cold starts)
- **Added**: Single worker configuration (better for free tier)
- **Added**: Logging for debugging

## Expected Behavior

- **First load**: May take 30-60 seconds (cold start)
- **After 15 min idle**: App sleeps, next request takes 30-60s
- **Search results**: From OpenAlex (no profile photos)
- **All features work**: Rank papers, integrity analysis, compare, etc.

## Troubleshooting

### Still showing "Loading..."?

1. **Check browser console** (F12):
   - Look for API errors
   - Check if requests to `/api/config` succeed

2. **Check Render logs**:
   - Look for Python errors
   - Check if Gunicorn started successfully

3. **Try these URLs**:
   - `/` - Should show the app
   - `/docs` - Should show FastAPI docs
   - `/api/config` - Should return JSON

### Common Issues

**Issue**: "Module not found" error
**Fix**: Make sure `requirements-render.txt` is committed and pushed

**Issue**: Timeout errors
**Fix**: Already set to 120s, should be enough for free tier

**Issue**: App works locally but not on Render
**Fix**: Check environment variables are set correctly

## Performance Tips

- **First request**: Always slow on free tier (cold start)
- **Keep alive**: Visit the app every 10 minutes to prevent sleep
- **Upgrade**: Consider paid tier for production use

## Local Development

For local development with Google Scholar:
```bash
pip install -r Publication_Analyzer/Publication_Analyzer/requirements.txt
cd Publication_Analyzer/Publication_Analyzer
python -m uvicorn backend.main:app --reload
```

For local testing without Google Scholar (like Render):
```bash
pip install -r requirements-render.txt
cd Publication_Analyzer/Publication_Analyzer
USE_GOOGLE_SCHOLAR=false python -m uvicorn backend.main:app --reload
```
