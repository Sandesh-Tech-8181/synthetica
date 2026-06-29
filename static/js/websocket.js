class SyntheticaWS {
    constructor(options = {}) {
        this.url = options.url || 'ws://localhost:8000/ws';
        this.socket = null;
        this.isConnected = false;
        this.onFrame = options.onFrame || function() {};
        this.onStatus = options.onStatus || function() {};
        this.onError = options.onError || function() {};
        this.onWorldGenerated = options.onWorldGenerated || function() {};
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.autoReconnect = true;
        this.reconnectTimeout = null;
    }

    connect() {
        try {
            console.log('🔌 Connecting to Synthetica WebSocket...');
            this.socket = new WebSocket(this.url);
            this.socket.onopen = function() {
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.onStatus('connected', '🟢 LIVE');
                this.updateBadge(true);
                console.log('✅ WebSocket connected!');
            }.bind(this);
            this.socket.onmessage = function(event) {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'frame') {
                        this.onFrame(data.payload);
                        if (data.payload.progress !== undefined) {
                            const bar = document.getElementById('progressBar');
                            if (bar) bar.style.width = data.payload.progress + '%';
                        }
                        if (data.payload.stage) {
                            const stageEl = document.getElementById('generationStage');
                            if (stageEl) {
                                stageEl.textContent = '🧠 ' + data.payload.stage;
                                stageEl.style.display = 'block';
                            }
                        }
                    } else if (data.type === 'world') {
                        this.onWorldGenerated(data.payload);
                        this.onStatus('world', '🌍 ' + data.payload.name);
                        const stageEl = document.getElementById('generationStage');
                        if (stageEl) stageEl.style.display = 'none';
                    } else if (data.type === 'status') {
                        this.onStatus(data.status, data.message);
                    }
                } catch (e) {
                    console.warn('Failed to parse WebSocket message:', e);
                }
            }.bind(this);
            this.socket.onclose = function() {
                this.isConnected = false;
                this.updateBadge(false);
                this.onStatus('disconnected', '🔴 Offline');
                console.log('❌ WebSocket disconnected');
                if (this.autoReconnect) this.attemptReconnect();
            }.bind(this);
            this.socket.onerror = function(error) {
                this.onError(error);
                console.error('WebSocket error:', error);
            }.bind(this);
        } catch (error) {
            this.onError(error);
            console.error('Failed to create WebSocket:', error);
        }
    }

    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.onStatus('failed', '❌ Max reconnection attempts');
            return;
        }
        this.reconnectAttempts++;
        const delay = 2000 * this.reconnectAttempts;
        this.onStatus('reconnecting', '🔄 Reconnect ' + this.reconnectAttempts + '/' + this.maxReconnectAttempts);
        this.reconnectTimeout = setTimeout(function() {
            this.connect();
        }.bind(this), delay);
    }

    sendPrompt(prompt, options = {}) {
        if (!this.isConnected) {
            this.onError(new Error('Not connected'));
            return false;
        }
        const message = {
            type: 'generate',
            prompt: prompt,
            width: options.width || 1920,
            height: options.height || 1080,
            style: options.style || 'cyberpunk',
            seed: options.seed || Math.floor(Math.random() * 1000000)
        };
        this.socket.send(JSON.stringify(message));
        console.log('📤 Sent prompt:', prompt);
        return true;
    }

    updateBadge(connected) {
        document.querySelectorAll('.websocket-badge .status').forEach(function(badge) {
            badge.textContent = connected ? 'LIVE' : 'OFF';
            badge.className = 'status ' + (connected ? 'live' : 'off');
        });
        document.querySelectorAll('.websocket-badge i').forEach(function(dot) {
            dot.style.color = connected ? '#28C840' : '#FF5F57';
        });
    }

    disconnect() {
        this.autoReconnect = false;
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        if (this.socket) {
            this.socket.close();
        }
    }
}

const ws = new SyntheticaWS({
    onFrame: function(frame) {
        const scene = document.getElementById('previewScene');
        if (scene && frame && frame.data) {
            scene.style.backgroundImage = 'url(' + frame.data + ')';
            scene.style.backgroundSize = 'cover';
            scene.style.backgroundPosition = 'center';
        }
    },
    onStatus: function(status, message) {
        console.log('📡 Status:', status, message);
        const badge = document.querySelector('.live-badge');
        if (badge) {
            badge.innerHTML = '<i class="fas fa-circle"></i> ' + (message || status);
        }
        const statusText = document.getElementById('statusText');
        const statusDot = document.getElementById('statusDot');
        if (statusText && statusDot) {
            if (status === 'connected') {
                statusText.textContent = '🟢 Connected to Synthetica';
                statusDot.className = 'dot green';
            } else if (status === 'reconnecting') {
                statusText.textContent = '🔄 ' + message;
                statusDot.className = 'dot yellow';
            } else if (status === 'complete') {
                statusText.textContent = '✅ ' + message;
                statusDot.className = 'dot green';
            } else {
                statusText.textContent = '⚪ ' + (message || 'Disconnected');
                statusDot.className = 'dot red';
            }
        }
    },
    onError: function(error) {
        console.error('WebSocket error:', error);
    },
    onWorldGenerated: function(world) {
        console.log('🌍 World generated:', world.name);
        const worldName = document.querySelector('.world-name');
        if (worldName && world.name) {
            worldName.textContent = world.name;
        }
        if (world.tags) {
            const tagsContainer = document.querySelector('.world-tags');
            if (tagsContainer) {
                tagsContainer.innerHTML = world.tags.map(function(tag) {
                    return '<span class="tag">' + tag + '</span>';
                }).join('');
            }
        }
        const bar = document.getElementById('progressBar');
        if (bar) {
            bar.style.width = '100%';
            setTimeout(function() {
                bar.style.width = '0%';
            }, 2000);
        }
        const list = document.getElementById('worldList');
        if (list) {
            const newWorld = document.createElement('div');
            newWorld.className = 'world-item';
            const colors = ['#6C5CE7', '#00D2D3', '#FF6B6B', '#FFB84D', '#4DFFFF'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            newWorld.innerHTML = `
                <div class="thumb" style="background:linear-gradient(135deg,${color},${color}88);"></div>
                <div class="info">
                    <h4>${world.name || 'New World'}</h4>
                    <p>Generated just now</p>
                </div>
                <span class="status"><i class="fas fa-check-circle"></i> Ready</span>
            `;
            list.prepend(newWorld);
        }
    }
});

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        ws.connect();
    }, 1000);
    window.addEventListener('beforeunload', function() {
        ws.disconnect();
    });
});

console.log('🔌 WebSocket client ready!');