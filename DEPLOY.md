# Frontend - Vercel Deployment Guide

## Deployed URL
`https://gnxt.vercel.app`

---

## GitHub Repo
```
https://github.com/madhuragnxt/Gnxt-frontend
```

---

## How to Push Updates

```powershell
cd D:\Gnxt-backend-main\Frontend
git add .
git commit -m "your message"
git push
```

Vercel auto-deploys from the `main` branch.

---

## Environment Variables

Set in `.env.production` (committed to repo):
```
VITE_API_URL=https://gnxt-backend.onrender.com/api
```

Vercel picks this up automatically during build. No manual entry needed.

---

## How Frontend Connects to Backend

```
Frontend (Vercel) ──── HTTPS ────> Backend (Render)
   gnxt.vercel.app            gnxt-backend.onrender.com
```

1. All API calls go to `VITE_API_URL` (default: `https://gnxt-backend.onrender.com/api`)
2. Backend CORS allows requests from `https://gnxt.vercel.app`
3. Socket.io for real-time GPS tracking (also via Render URL)
4. Backend health checked every 30s — green/red indicator in top header

---

## Vercel Deploy Settings
| Setting | Value |
|---------|-------|
| Framework | Vite |
| Build Command | `vite build` |
| Output Directory | `dist` |
| Node Version | 18.x (auto) |

---

## Key Frontend Files
| File | Purpose |
|------|---------|
| `.env.production` | Backend API URL |
| `src/app/context/BackendHealthContext.jsx` | Pings backend every 30s, shows API status |
| `src/app/utils/useKeepAlive.js` | Pings every 4 min to keep Render awake |
| `src/app/components/Layout.jsx` | Header with API health indicator + online/offline badge |
| `src/main.jsx` | Global fetch interceptor, IndexedDB sync |
