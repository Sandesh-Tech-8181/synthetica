# Synthetica — AI World Generator

Type a sentence, get a unique AI-generated world image, in real time, over a live WebSocket connection.

```
synthetica/
├── index.html              # Landing page + live demo
├── dashboard.html           # User dashboard (Your Worlds gallery)
├── start.sh                 # One-command local startup (backend + frontend)
├── vercel.json               # Frontend deploy config
├── railway.json              # Backend deploy config
└── backend/
    ├── server.py             # FastAPI app (WebSocket + health check)
    └── requirements.txt
```

---

## 1. Run it locally (fastest path)

**On Mac / Linux:**
```bash
chmod +x start.sh
./start.sh
```

**On Windows:**
Double-click `start.bat`, or run it from `cmd`:
```cmd
start.bat
```
(Requires Python installed and on PATH — get it from python.org if `python` isn't recognized. The script opens two new terminal windows, one for the backend and one for the frontend, and opens your browser automatically.)

This single command will:
- create a Python virtual environment for the backend (first run only)
- install backend dependencies
- start FastAPI on `http://localhost:8000`
- start a static file server for the frontend on `http://localhost:3000`
- check that the backend is healthy

Then open:
- **Landing page:** http://localhost:3000/index.html
- **Dashboard:** http://localhost:3000/dashboard.html
- **Backend health check:** http://localhost:8000/api/health

Stop everything:
- Mac/Linux: `CTRL+C`. If processes linger, run `kill $(jobs -p)`.
- Windows: just close the two "Synthetica Backend" / "Synthetica Frontend" windows that opened.

If you'd rather run the two services manually:

```bash
# Terminal 1 — backend
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --port 8000

# Terminal 2 — frontend
python -m http.server 3000
```

---

## 2. Deploy the backend (Railway)

```bash
npm i -g @railway/cli
railway login
railway init          # choose "Empty Project" if prompted
railway up
```

Railway reads `railway.json`, installs `backend/requirements.txt`, and runs the FastAPI app with the start command already configured.

After deploy, Railway gives you a public URL, e.g.:
```
https://synthetica-backend-production.up.railway.app
```

**Set environment variables** (Railway dashboard → your service → Variables):
| Variable | Value | Why |
|---|---|---|
| `ALLOWED_ORIGINS` | `https://your-frontend.vercel.app` | Locks CORS down to your real frontend domain instead of `*` |

Verify it's live:
```bash
curl https://your-backend-url.up.railway.app/api/health
```

---

## 3. Deploy the frontend (Vercel)

First, point the frontend at your live backend. In **both** `index.html` and `dashboard.html`, find:

```js
const BACKEND_HTTP = window.SYNTHETICA_BACKEND || "http://localhost:8000";
```

Replace `"http://localhost:8000"` with your Railway URL:

```js
const BACKEND_HTTP = window.SYNTHETICA_BACKEND || "https://synthetica-backend-production.up.railway.app";
```

Then deploy:

```bash
npm i -g vercel
vercel login
vercel --prod
```

Vercel uses `vercel.json` to serve the static files with no build step. You'll get a URL like `https://synthetica.vercel.app`.

Finally, go back to Railway and set `ALLOWED_ORIGINS` to that exact Vercel URL, then redeploy the backend (`railway up`) so CORS only allows your real frontend.

---

## 4. Connecting frontend → backend, end to end

1. Backend deployed on Railway → copy its URL.
2. Paste that URL into `BACKEND_HTTP` in `index.html` and `dashboard.html`.
3. Redeploy frontend (`vercel --prod`).
4. Set `ALLOWED_ORIGINS` on Railway to the Vercel URL, redeploy backend.
5. Open the Vercel URL, generate a world, confirm the status pill shows "Connected" → "Generating…" → "Ready".

---

## 5. Pre-launch checklist (things to do before sharing it)

**Correctness**
- [ ] `curl https://<backend>/api/health` returns `{"status":"ok",...}`
- [ ] WebSocket connects on first load (status pill turns "Connected" without a manual reconnect)
- [ ] Generating a world on the landing page demo works
- [ ] Generating a world on the dashboard works, and it's added to "Your Worlds"
- [ ] Download button produces a real `.png` file
- [ ] Quick-prompt chips (Forest / Cyberpunk / Temple / Space) all populate the input and generate correctly
- [ ] CORS is locked to your real frontend domain (not `*`) once you're past testing

**Resilience**
- [ ] Backend down → frontend falls back to direct Pollinations calls instead of breaking (already built in — just confirm it still works)
- [ ] Slow network → loading state and spinner stay visible until the image actually loads, no flash of broken image icon
- [ ] Empty prompt → Generate button doesn't fire, input gets focus instead

**Cross-device**
- [ ] Test on a real phone (not just dev tools emulation) — check the hero, demo card, and dashboard grid all reflow correctly
- [ ] Test on tablet width (iPad portrait/landscape)
- [ ] Test in Safari specifically — `backdrop-filter` and WebSocket behavior can differ from Chrome

**Performance / cost**
- [ ] Pollinations.ai is free and has no API key, but it is a shared public service — under heavy concurrent load it can slow down or rate-limit. If you expect real traffic, plan to add your own image-generation backend (e.g. a hosted Stable Diffusion endpoint) behind the same WebSocket contract
- [ ] Railway's free tier sleeps/limits usage — check your plan before expecting 24/7 uptime
- [ ] Vercel's free tier is generally fine for a static frontend at low-to-moderate traffic

**Trust signals for users**
- [ ] Add a real favicon (currently none — browsers will show a blank tab icon)
- [ ] Add an Open Graph image/meta tags so links shared on social/Slack preview nicely
- [ ] Add a simple privacy note if you start storing prompts/images server-side (currently nothing is persisted server-side — the dashboard gallery is in-memory per browser session and clears on refresh)

**Nice-to-haves for a stronger MVP**
- [ ] Persist "Your Worlds" across sessions (e.g. browser localStorage as a quick fix, or a real database/auth system for multi-device access)
- [ ] Add basic rate limiting on `/ws` to stop one user from spamming generations
- [ ] Add a "Copy link" action per generated world so users can share a specific result
- [ ] Swap the Inter/Space Grotesk Google Fonts CDN for self-hosted fonts if you want to drop the external font request entirely

---

## 6. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Status pill stuck on "Connecting…" | Backend URL wrong, or backend not deployed/running | Check `BACKEND_HTTP` value and `/api/health` |
| Browser console shows CORS error | `ALLOWED_ORIGINS` on Railway doesn't match your Vercel domain | Update the env var, redeploy backend |
| Image never loads, spinner stays forever | Pollinations.ai temporarily slow/down | Wait and retry — frontend fallback already tries the direct API on WS failure, but a Pollinations outage affects both paths |
| `start.sh: command not found` | Script isn't executable | `chmod +x start.sh` |
| `uvicorn: command not found` after running start.sh manually | Virtual environment not activated | Use `start.sh`, or manually `source backend/.venv/bin/activate` |
