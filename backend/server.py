"""
Synthetica backend — FastAPI server
-------------------------------------
Provides:
  - GET  /api/health        Health check endpoint
  - WS   /ws                Real-time world generation over WebSocket

Image generation uses the free Pollinations.ai image API (no API key required):
  https://image.pollinations.ai/prompt/{encoded_prompt}?width=...&height=...&seed=...

Run locally:
  pip install -r requirements.txt
  uvicorn server:app --reload --port 8000
"""

import os
import random
import urllib.parse
import logging

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("synthetica")

app = FastAPI(title="Synthetica API", version="1.0.0")

# ---------------------------------------------------------------------------
# CORS — allow the frontend (Vercel) to talk to this backend.
# In production, replace "*" with your actual frontend origin for tighter security.
# ---------------------------------------------------------------------------
ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "*")
origins = ["*"] if ALLOWED_ORIGINS == "*" else [o.strip() for o in ALLOWED_ORIGINS.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

POLLINATIONS_BASE_URL = "https://image.pollinations.ai/prompt"
DEFAULT_WIDTH = 768
DEFAULT_HEIGHT = 576
STYLE_SUFFIX = ", cinematic lighting, highly detailed, digital art, 4k"


class GenerateRequest(BaseModel):
    prompt: str
    width: int = DEFAULT_WIDTH
    height: int = DEFAULT_HEIGHT


def build_pollinations_url(prompt: str, width: int = DEFAULT_WIDTH, height: int = DEFAULT_HEIGHT) -> str:
    """Builds a Pollinations.ai image generation URL for the given prompt."""
    enhanced_prompt = f"{prompt.strip()}{STYLE_SUFFIX}"
    encoded_prompt = urllib.parse.quote(enhanced_prompt)
    seed = random.randint(0, 999_999)
    return (
        f"{POLLINATIONS_BASE_URL}/{encoded_prompt}"
        f"?width={width}&height={height}&seed={seed}&nologo=true"
    )


@app.get("/api/health")
async def health_check():
    """Simple health check endpoint used by Railway and uptime monitors."""
    return {"status": "ok", "service": "synthetica-backend", "version": "1.0.0"}


@app.get("/")
async def root():
    return {"message": "Synthetica API is running. See /api/health and /ws."}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    Real-time world generation channel.

    Client sends:  {"prompt": "a floating crystal city", "width": 768, "height": 576}
    Server sends (in order):
      {"status": "generating"}
      {"status": "ready", "image_url": "...", "prompt": "..."}
      OR
      {"status": "error", "message": "..."}
    """
    await websocket.accept()
    logger.info("WebSocket client connected")

    try:
        while True:
            data = await websocket.receive_json()
            prompt = (data.get("prompt") or "").strip()
            width = int(data.get("width") or DEFAULT_WIDTH)
            height = int(data.get("height") or DEFAULT_HEIGHT)

            if not prompt:
                await websocket.send_json({"status": "error", "message": "Prompt cannot be empty."})
                continue

            # Let the client know generation has started
            await websocket.send_json({"status": "generating"})

            try:
                image_url = build_pollinations_url(prompt, width, height)
                # Pollinations generates the image lazily when the URL is first requested,
                # so we don't need to pre-fetch it server-side — we just hand the URL back.
                # The frontend's <img> tag will trigger the actual generation on load.
                await websocket.send_json({
                    "status": "ready",
                    "image_url": image_url,
                    "prompt": prompt,
                })
                logger.info(f"Generated world for prompt: {prompt!r}")
            except Exception as gen_error:
                logger.exception("Generation failed")
                await websocket.send_json({"status": "error", "message": str(gen_error)})

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    except Exception as e:
        logger.exception("Unexpected WebSocket error")
        try:
            await websocket.send_json({"status": "error", "message": "Internal server error."})
        except Exception:
            pass


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=True)
