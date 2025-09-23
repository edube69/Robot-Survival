import { CONFIG } from './config.js';

// Module des particules
export const Particle = {
    list: [],
    
    init() {
        this.list = [];
    },
    
    createExplosion(x, y, color, count = CONFIG.PARTICLES.COUNT) {
        // Limitation dynamique : si au-dessus du soft cap on r�duit le nombre cr��
        const total = this.list.length;
        if (total > CONFIG.PARTICLES.MAX_ACTIVE) {
            return; // stop dur
        }
        if (total > CONFIG.PARTICLES.SOFT_CAP) {
            count = Math.max(1, Math.floor(count * CONFIG.PARTICLES.REDUCTION_FACTOR));
        }
        for (let i = 0; i < count; i++) {
            this.list.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                radius: Math.random() * 3 + 1,
                color: color,
                life: CONFIG.PARTICLES.LIFE,
                maxLife: CONFIG.PARTICLES.LIFE
            });
        }
    },
    
    update() {
        for (let i = this.list.length - 1; i >= 0; i--) {
            const particle = this.list[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vx *= 0.98;
            particle.vy *= 0.98;
            particle.life--;
            
            if (particle.life <= 0) {
                this.list.splice(i, 1);
            }
        }
    }
};