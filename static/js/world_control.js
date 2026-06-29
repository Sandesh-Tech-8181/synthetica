// ============================================
// SYNTHETICA — World Controls (FIXED)
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
];

let currentWorldIndex = 0;
let isGenerating = false;

// Make sure function is globally accessible
window.generateWorld = function() {
    console.log('🔄 generateWorld() called!');
    
    if (isGenerating) {
        console.log('⏳ Already generating...');
        return;
    }
    isGenerating = true;

    const btn = document.querySelector('.world-btn');
    if (!btn) {
        console.log('❌ Button not found!');
        isGenerating = false;
        return;
    }

    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    btn.disabled = true;
    console.log('🎯 Generating new world...');

    // Update progress
    const bar = document.getElementById('progressBar');
    if (bar) bar.style.width = '20%';

    const stageEl = document.getElementById('generationStage');
    if (stageEl) {
        stageEl.textContent = '🧠 Generating...';
        stageEl.style.display = 'block';
    }

    setTimeout(function() {
        // Select next world
        currentWorldIndex = (currentWorldIndex + 1) % WORLD_THEMES.length;
        const world = WORLD_THEMES[currentWorldIndex];
        console.log('🌍 Selected world:', world.name);

        // Update world name
        const worldName = document.querySelector('.world-name');
        if (worldName) {
            worldName.textContent = world.name;
            console.log('✅ Name updated:', world.name);
        }

        // Update tags
        const tagsContainer = document.querySelector('.world-tags');
        if (tagsContainer) {
            tagsContainer.innerHTML = world.tags.map(function(tag) {
                return '<span class="tag">' + tag + '</span>';
            }).join('');
            console.log('✅ Tags updated:', world.tags);
        }

        // Update scene background
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

        // Update watermark
        const watermark = document.querySelector('.world-watermark');
        if (watermark) {
            const elements = world.tags.slice(0, 2);
            watermark.innerHTML = elements.map(function(el) {
                return '<span>' + el + '</span>';
            }).join('');
        }

        // Update progress
        if (bar) {
            bar.style.width = '100%';
            setTimeout(function() {
                bar.style.width = '0%';
            }, 1500);
        }

        if (stageEl) {
            stageEl.style.display = 'none';
        }

        // Reset button
        btn.innerHTML = originalText;
        btn.disabled = false;
        isGenerating = false;
        console.log('✅ World generation complete!');

        // Try WebSocket if connected
        if (typeof ws !== 'undefined' && ws && ws.isConnected) {
            ws.sendPrompt(world.name, { style: world.tags[0].toLowerCase() });
            console.log('📤 Sent to WebSocket:', world.name);
        }

    }, 2000);
};

console.log('🎮 World controls loaded successfully!');
console.log('✅ Click "Regenerate World" or press R key');