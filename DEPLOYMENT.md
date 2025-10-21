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
VITE_FIREBASE_API_KEY=AIzaSyA1uKZJz1HTdC7AjecxOaHtY13NCJYLZok
VITE_FIREBASE_AUTH_DOMAIN=gridforge-dc5c5.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=gridforge-dc5c5
VITE_FIREBASE_STORAGE_BUCKET=gridforge-dc5c5.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=864306324243
VITE_FIREBASE_APP_ID=1:864306324243:web:7c8b37e096d4b52a39b0e6

# AI Provider
VITE_AI_PROVIDER=gemini

# Gemini API Keys (BOTH versions required!)
VITE_GEMINI_API_KEY=AIzaSyAKiJISwAo745DcARdvzTvvmfarh_CubIk
GEMINI_API_KEY=AIzaSyAKiJISwAo745DcARdvzTvvmfarh_CubIk

# Optional: Anthropic fallback
VITE_ANTHROPIC_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
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
