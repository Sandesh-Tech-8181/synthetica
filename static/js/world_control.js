// ============================================
// SYNTHETICA 3.0 — World Controls
// ============================================

const WORLD_THEMES = [
    { name: 'Tokyo_2077', tags: ['Neon', 'Cyberpunk', 'Rain', 'Holographic'] },
    { name: 'CyberForest', tags: ['Futuristic', 'Nature', 'Glow', 'Bioluminescent'] },
    { name: 'Neon Desert', tags: ['Desert', 'Neon', 'Dystopian', 'Sand'] },
    { name: 'Floating Islands', tags: ['Fantasy', 'Sky', 'Magic', 'Clouds'] },
    { name: 'AI Cityscape', tags: ['Sci-Fi', 'Metropolis', 'Digital', 'Data'] },
    { name: 'Neo York 2150', tags: ['Urban', 'Neon', 'Futuristic', 'Cyber'] },
    { name: 'Mumbai Neon', tags: ['India', 'Neon', 'Cyberpunk', 'Chaos'] },
    { name: 'Quantum Garden', tags: ['Quantum', 'Nature', 'Glow', 'Surreal'] },
    { name: 'Berlin_Prime', tags: ['Europe', 'Cyber', 'Digital', 'Neon'] },
    { name: 'Bangkok_2077', tags: ['Asia', 'Neon', 'Rain', 'Holographic'] },
];

let currentWorldIndex = 0;
let isGenerating = false;

window.generateWorld = function() {
    if (isGenerating) return;
    isGenerating = true;

    const btn = document.querySelector('.world-btn');
    if (!btn) return;

    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    btn.disabled = true;

    setTimeout(function() {
        currentWorldIndex = (currentWorldIndex + 1) % WORLD_THEMES.length;
        const world = WORLD_THEMES[currentWorldIndex];

        // Update UI
        const worldName = document.querySelector('.world-name');
        if (worldName) worldName.textContent = world.name;

        const tagsContainer = document.querySelector('.world-tags');
        if (tagsContainer) {
            tagsContainer.innerHTML = world.tags.map(function(tag) {
                return '<span class="tag">' + tag + '</span>';
            }).join('');
        }

        // Update background with gradient
        const scene = document.getElementById('previewScene');
        if (scene) {
            const gradients = [
                'radial-gradient(circle at 30% 20%, rgba(108,92,231,0.3), transparent 50%), radial-gradient(circle at 70% 80%, rgba(0,210,211,0.2), transparent 50%)',
                'radial-gradient(circle at 40% 30%, rgba(255,107,107,0.2), transparent 50%), radial-gradient(circle at 60% 70%, rgba(0,210,211,0.2), transparent 50%)',
                'radial-gradient(circle at 20% 50%, rgba(108,92,231,0.25), transparent 50%), radial-gradient(circle at 80% 50%, rgba(255,107,107,0.15), transparent 50%)',
                'radial-gradient(circle at 50% 20%, rgba(0,210,211,0.2), transparent 50%), radial-gradient(circle at 50% 80%, rgba(108,92,231,0.2), transparent 50%)',
            ];
            scene.style.background = gradients[currentWorldIndex % gradients.length];
            scene.style.transition = 'background 0.5s ease';
        }

        // Send to WebSocket if connected
        if (ws && ws.isConnected) {
            ws.sendPrompt(world.name, { style: world.tags[0].toLowerCase() });
        }

        btn.innerHTML = originalText;
        btn.disabled = false;
        isGenerating = false;

        console.log('🌍 Generated world:', world.name);
    }, 1500);
};

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'r' || e.key === 'R') window.generateWorld();
});