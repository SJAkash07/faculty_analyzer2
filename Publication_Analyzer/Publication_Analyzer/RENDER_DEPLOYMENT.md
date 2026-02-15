# Render Deployment Guide

## ✅ Latest Push Completed

The render.yaml has been updated and pushed to GitHub.

## 🔧 Render Configuration

### In Render Dashboard:

1. **Go to your service**: https://dashboard.render.com/
2. **Click on your service** (faculty-analyzer2)
3. **Go to Settings**
4. **Verify these settings:**

#### Build & Deploy
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `cd Publication_Analyzer/Publication_Analyzer && gunicorn backend.main:app -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`
- **Branch**: `master`

#### Environment
- **Python Version**: `3.11.0`
- **Add Environment Variable** (optional):
  - Key: `HUGGINGFACE_API_KEY`
  - Value: Your HuggingFace token

### Manual Deploy
1. Go to your Render dashboard
2. Click **"Manual Deploy"** → **"Deploy latest commit"**
3. Wait for build to complete (5-10 minutes)

## 🐛 Troubleshooting "Loading..." Issue

### Check Render Logs
1. Go to Render Dashboard
2. Click on your service
3. Click **"Logs"** tab
4. Look for errors

### Common Issues:

#### 1. Port Binding Issue
**Error**: `Address already in use`
**Fix**: Render automatically sets `$PORT` - make sure start command uses it

#### 2. Static Files Not Found
**Error**: `404 on /static/styles.css`
**Fix**: Ensure frontend directory exists and is committed to git

#### 3. Module Import Error
**Error**: `ModuleNotFoundError: No module named 'backend'`
**Fix**: Start command must `cd` into correct directory first

#### 4. Gunicorn Worker Timeout
**Error**: `Worker timeout`
**Fix**: Add to start command: `--timeout 120 --workers 2`

### Updated Start Command (if needed):
```bash
cd Publication_Analyzer/Publication_Analyzer && gunicorn backend.main:app -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT --timeout 120 --workers 2
```

## 📝 Verify Deployment

Once deployed, check:
1. **Homepage loads**: Should see library background
2. **Static files work**: Check browser console for 404 errors
3. **API works**: Try searching for a faculty member
4. **Background image**: Should see library/bookshelf image

## 🔍 Debug Steps

### 1. Check Build Logs
Look for:
- ✅ `Successfully installed fastapi uvicorn...`
- ✅ `Build succeeded`

### 2. Check Deploy Logs
Look for:
- ✅ `Starting gunicorn`
- ✅ `Uvicorn running on`
- ✅ `Application startup complete`
- ❌ Any error messages

### 3. Test Endpoints
```bash
# Test if server is responding
curl https://faculty-analyzer2.onrender.com/

# Test API
curl https://faculty-analyzer2.onrender.com/api/search/authors?q=John+Smith
```

## 🚀 Force Redeploy

If still stuck on "Loading...":

1. **Clear Build Cache**:
   - Settings → Build & Deploy
   - Click "Clear build cache & deploy"

2. **Restart Service**:
   - Click "Manual Deploy" → "Clear build cache & deploy"

3. **Check Browser**:
   - Clear browser cache (Ctrl+Shift+Delete)
   - Try incognito/private mode
   - Check browser console (F12) for errors

## 📊 Expected Behavior

After successful deployment:
- Homepage loads with library background
- Icon navigation visible on right side
- Search box centered
- No console errors
- API endpoints respond

## 🆘 Still Not Working?

Check these files are committed:
```bash
git ls-files | grep -E "(render.yaml|Procfile|requirements.txt|frontend/library-bg.jpg)"
```

Should show:
- ✅ render.yaml
- ✅ Procfile  
- ✅ requirements.txt
- ✅ Publication_Analyzer/Publication_Analyzer/frontend/library-bg.jpg

## 📞 Support

If issues persist:
1. Check Render logs for specific errors
2. Verify all files are in git: `git status`
3. Ensure latest commit is deployed
4. Try manual deploy with cache clear
