# IRONforge Deployment Guide

## Deploying to Vercel

### Prerequisites
- GitHub account connected to Vercel
- Gemini API key from https://makersuite.google.com/app/apikey

### Step 1: Import Project to Vercel

1. Go to https://vercel.com
2. Click **"Add New Project"**
3. Import your repository: `llanesjoseph/IRONforge-`
4. Vercel will auto-detect Vite framework

### Step 2: Configure Environment Variables

**CRITICAL:** You must set BOTH versions of API keys:
- `VITE_*` prefixed vars = For frontend (browser)
- Non-prefixed vars = For serverless API functions

Add these environment variables in Vercel:

```bash
# Firebase Configuration (Frontend)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# AI Provider
VITE_AI_PROVIDER=gemini

# Gemini API Keys (BOTH versions required!)
VITE_GEMINI_API_KEY=your_gemini_api_key
GEMINI_API_KEY=your_gemini_api_key

# Optional: Anthropic fallback
VITE_ANTHROPIC_API_KEY=your_anthropic_key
ANTHROPIC_API_KEY=your_anthropic_key
```

### Step 3: Deploy

1. Click **"Deploy"**
2. Wait for build to complete (2-3 minutes)
3. Vercel will provide a live URL

### Step 4: Automatic Deployments

Once connected, every `git push` to the `main` branch will automatically:
- Trigger a new build
- Deploy to production
- Provide preview URLs

### Troubleshooting

**AI Features Not Working?**
- Verify `GEMINI_API_KEY` is set (without VITE_ prefix)
- Check Vercel Function Logs for errors
- Ensure Firestore rules are deployed

**Build Fails?**
- Check build logs in Vercel dashboard
- Ensure all dependencies are in package.json
- Run `npm run build` locally first

**Environment Variables Not Working?**
- Redeploy after adding/changing env vars
- Check that sensitive vars are not in git
- Verify .env.local is in .gitignore

## Local Development

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Add your API keys to .env.local

# Start dev server
npm run dev
```

## Firebase Setup

1. Deploy Firestore rules:
```bash
firebase deploy --only firestore:rules
```

2. Ensure authentication is enabled in Firebase Console

## Support

For issues, check:
- Vercel Function Logs
- Browser Console (F12)
- Firebase Console for auth/database errors
