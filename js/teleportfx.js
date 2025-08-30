import { CONFIG } from './config.js';
import { Camera } from './camera.js';

// Effets visuels de téléportation (procédural)
export const TeleportFX = {
    list: [],

    init() {
        this.list = [];
    },

    create(x, y, options = {}) {
        const effect = {
            x, y,
            t: 0,
            duration: options.duration ?? 70,      // phase active
            fadeOut: options.fadeOut ?? 40,        // phase de disparition
            maxRadius: options.maxRadius ?? 120,
            rings: options.rings ?? 3,
            spirals: options.spirals ?? 2,
            bolts: options.bolts ?? 4
        };
        effect.totalDuration = effect.duration + effect.fadeOut;
        this.list.push(effect);
    },

    update() {
        for (let i = this.list.length - 1; i >= 0; i--) {
            const fx = this.list[i];
            fx.t++;
            // >= pour être sûr qu'on purge bien l'élément
            if (fx.t >= fx.totalDuration) this.list.splice(i, 1);
        }
    },

    draw(ctx) {
        const zoom = Camera.getZoom ? Camera.getZoom() : (CONFIG.CAMERA.ZOOM || 1);

        for (const fx of this.list) {
            // Progression bornée 0..1 pendant la phase active
            const pActive = Math.min(1, Math.max(0, fx.t / fx.duration));
            // Facteur d’opacité global : 1 pendant la phase active, puis 1→0 pendant le fadeOut
            const fadeP = fx.t <= fx.duration
                ? 1
                : Math.max(0, 1 - (fx.t - fx.duration) / Math.max(1, fx.fadeOut));

            if (fadeP <= 0) continue; // rien à dessiner

            const center = Camera.worldToScreen(fx.x, fx.y);

            // --- Lueur centrale ---
            const glowAlpha = Math.max(0, (0.7 - pActive * 0.7) * fadeP);
            if (glowAlpha > 0) {
                ctx.save();
                ctx.globalAlpha = glowAlpha;
                ctx.fillStyle = '#aaffff';
                ctx.beginPath();
                ctx.arc(center.x, center.y, 20 * zoom * (1 + pActive * 0.5), 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // --- Anneaux concentriques ---
            for (let r = 0; r < fx.rings; r++) {
                const rp = Math.min(1, Math.max(0, (fx.t - r * 14) / Math.max(1, (fx.duration - r * 10))));
                if (rp <= 0) continue;
                const radius = rp * fx.maxRadius * 0.7 + r * 16;
                const alpha = Math.max(0, (0.7 - rp * 0.7) * fadeP);
                if (alpha <= 0) continue;
                ctx.save();
                ctx.strokeStyle = `rgba(136,255,255,${alpha})`;
                ctx.lineWidth = Math.max(1, 3.5 * zoom * (1 - rp));
                ctx.beginPath();
                ctx.arc(center.x, center.y, radius * zoom, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }

            // --- Spirales énergétiques ---
            for (let s = 0; s < fx.spirals; s++) {
                ctx.save();
                ctx.strokeStyle = `rgba(180,255,255,${0.65 * fadeP})`;
                ctx.lineWidth = Math.max(1, 2.2 * zoom * (1 - pActive));
                ctx.beginPath();
                const turns = 3.0, segs = 34;
                for (let i = 0; i <= segs; i++) {
                    const k = i / segs;
                    const angle = (s * Math.PI) + k * (Math.PI * 2 * turns) + pActive * Math.PI * 2 * (s + 1);
                    const radius = (1 - k) * fx.maxRadius * 0.8;
                    const x = center.x + Math.cos(angle) * radius * zoom;
                    const y = center.y + Math.sin(angle) * radius * zoom;
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                }
                ctx.stroke();
                ctx.restore();
            }

            // --- Éclairs ---
            const boltAlpha = Math.max(0, (0.6 - pActive * 0.6) * fadeP);
            if (boltAlpha > 0.05) {
                ctx.save();
                ctx.strokeStyle = `rgba(255,255,136,${boltAlpha})`;
                ctx.lineWidth = Math.max(1, 2.2 * zoom * (1 - pActive));
                for (let b = 0; b < fx.bolts; b++) {
                    const angle = (b * Math.PI * 2) / fx.bolts + pActive * Math.PI * 2 * 0.25;
                    const endX = center.x + Math.cos(angle) * fx.maxRadius * 0.5 * zoom;
                    const endY = center.y + Math.sin(angle) * fx.maxRadius * 0.5 * zoom;
                    const segs = 7;
                    ctx.beginPath();
                    for (let i = 0; i <= segs; i++) {
                        const t = i / segs;
                        const x = center.x + (endX - center.x) * t + (Math.random() - 0.5) * 2.5 * (1 - pActive);
                        const y = center.y + (endY - center.y) * t + (Math.random() - 0.5) * 2.5 * (1 - pActive);
                        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                    }
                    ctx.stroke();
                }
                ctx.restore();
            }
        }
    }
};
