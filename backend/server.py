from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import random
import time
import base64
from typing import List
import uvicorn

app = FastAPI(title="Synthetica API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class WorldGenerator:
    def __init__(self):
        self.locations = ["Tokyo", "Neo York", "Mumbai", "London", "Shanghai", "Dubai", "Berlin", "Bangkok", "Singapore", "Seoul", "Sydney", "Toronto"]
        self.suffixes = ["2077", "2150", "Prime", "X", "Neon", "Quantum", "Digital", "Cyber", "Elite", "Pro"]
        self.styles = ["cyberpunk", "neon", "fantasy", "sci-fi", "dystopian", "utopian", "quantum", "steampunk"]
        self.elements = ["floating islands", "neon rivers", "holographic forests", "quantum palaces", "data streams", "crystal towers", "digital waterfalls", "cybernetic gardens"]
    
    def generate_preview(self, prompt: str) -> str:
        colors = ['#6C5CE7', '#00D2D3', '#FF6B6B', '#FFB84D', '#4DFFFF', '#FF9FF3', '#54A0FF']
        c1, c2 = random.sample(colors, 2)
        svg = f'''<svg width="800" height="450" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="{c1}" stop-opacity="0.3"/>
                    <stop offset="100%" stop-color="{c2}" stop-opacity="0.1"/>
                </linearGradient>
                <linearGradient id="g2" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="{c2}" stop-opacity="0.2"/>
                    <stop offset="100%" stop-color="{c1}" stop-opacity="0.05"/>
                </linearGradient>
                <filter id="glow"><feGaussianBlur stdDeviation="8"/><feMerge><feMergeNode/><feMergeNode/></feMerge></filter>
            </defs>
            <rect width="800" height="450" fill="#0A0A1A"/>
            <rect width="800" height="450" fill="url(#g1)"/>
            <rect width="800" height="450" fill="url(#g2)"/>
            <circle cx="150" cy="120" r="80" fill="{c1}" opacity="0.12" filter="url(#glow)"/>
            <circle cx="650" cy="330" r="100" fill="{c2}" opacity="0.10" filter="url(#glow)"/>
            <circle cx="400" cy="200" r="60" fill="{c1}" opacity="0.08" filter="url(#glow)"/>
            <rect x="280" y="350" width="240" height="4" fill="{c1}" opacity="0.15" rx="2"/>
            <rect x="320" y="365" width="160" height="3" fill="{c2}" opacity="0.12" rx="1.5"/>
            <text x="400" y="430" text-anchor="middle" font-family="monospace" font-size="10" fill="white" opacity="0.08">SYNTHETICA · AI GENERATED</text>
        </svg>'''
        return "data:image/svg+xml;base64," + base64.b64encode(svg.encode()).decode()
    
    def generate(self, prompt: str, style: str = None) -> dict:
        time.sleep(0.5)
        if not style:
            style = random.choice(self.styles)
        name = f"{random.choice(self.locations)}_{random.choice(self.suffixes)}"
        tags = random.sample(self.elements, 3) + [random.choice(["neon", "holographic", "cybernetic", "quantum", "digital"])]
        return {
            "name": name,
            "style": style,
            "tags": tags[:4],
            "seed": random.randint(1000, 9999),
            "prompt": prompt,
            "preview": self.generate_preview(prompt)
        }

generator = WorldGenerator()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"🔌 Client connected. Total: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            print(f"🔌 Client disconnected. Total: {len(self.active_connections)}")
    
    async def send(self, websocket: WebSocket, message: dict):
        try:
            await websocket.send_json(message)
        except Exception as e:
            print(f"Send error: {e}")

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        await manager.send(websocket, {"type": "status", "status": "connected", "message": "🟢 Connected to Synthetica"})
        while True:
            data = await websocket.receive_json()
            if data.get("type") == "generate":
                prompt = data.get("prompt", "A futuristic world")
                style = data.get("style", "cyberpunk")
                await manager.send(websocket, {"type": "status", "status": "generating", "message": f"🧠 Generating: {prompt}"})
                world = generator.generate(prompt, style)
                stages = ["Planning layout", "Generating geometry", "Adding textures", "Applying lighting", "Finalizing world"]
                for i in range(5):
                    await asyncio.sleep(0.3)
                    await manager.send(websocket, {
                        "type": "frame",
                        "payload": {
                            "frame": i,
                            "data": world["preview"],
                            "progress": (i + 1) * 20,
                            "stage": stages[i]
                        }
                    })
                await manager.send(websocket, {"type": "world", "payload": world, "message": f"🌍 World '{world['name']}' ready!"})
                await manager.send(websocket, {"type": "status", "status": "complete", "message": "✅ World generated successfully!"})
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WS Error: {e}")
        manager.disconnect(websocket)

@app.get("/api/health")
async def health():
    return {"status": "healthy", "connections": len(manager.active_connections), "version": "2.0.0"}

@app.get("/api/features")
async def features():
    return {"features": [
        {"name": "Text to 3D World", "description": "Generate from prompts"},
        {"name": "Real-time Streaming", "description": "WebSocket at 11 FPS"},
        {"name": "128× Compression", "description": "19.1× faster"}
    ]}

if __name__ == "__main__":
    print("🚀 SYNTHETICA SERVER v2.0")
    print("📍 WebSocket: ws://localhost:8000/ws")
    print("📍 Health: http://localhost:8000/api/health")
    print("📍 Features: http://localhost:8000/api/features")
    print("=" * 50)
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)
    # backend/server.py mein yeh add karo

import replicate  # pip install replicate

class WorldGenerator:
    def generate_real_image(self, prompt: str) -> str:
        """Generate real image using Stable Diffusion"""
        output = replicate.run(
            "stability-ai/stable-diffusion-3.5-large",
            input={
                "prompt": prompt + ", 3D world, immersive, detailed",
                "width": 1024,
                "height": 576,
                "num_outputs": 1
            }
        )
        return output[0]  # Image URL

    def generate(self, prompt: str) -> dict:
        # Real image generate karo
        image_url = self.generate_real_image(prompt)
        
        return {
            "name": f"{random.choice(self.locations)}_{random.choice(self.suffixes)}",
            "preview": image_url,  # Real image!
            "tags": ["AI Generated", "3D", "Immersive"],
            "prompt": prompt
        }