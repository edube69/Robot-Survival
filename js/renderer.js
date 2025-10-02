import { CONFIG } from './config.js';
import { Input } from './input.js';
import { Player } from './player.js';
import { Camera } from './camera.js';
import { Enemy } from './enemy.js';
import { Bullet } from './bullet.js';
import { Particle } from './particle.js';
import { Currency } from './currency.js';
import { Orb } from './orb.js';
import { TeleportFX } from './teleportfx.js';
import { Upgrades } from './upgrades.js';

// Module de rendu
export const Renderer = {
    canvas: null,
    ctx: null,
    
    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        // Adapter à la taille de la fenêtre au chargement
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    },
    
    resizeCanvas() {
        // Garde un ratio max tout en remplissant une bonne partie de l'écran
        const maxWidth = Math.min(window.innerWidth - 80, CONFIG.WORLD.WIDTH);
        const maxHeight = Math.min(window.innerHeight - 160, CONFIG.WORLD.HEIGHT);
        const aspect = CONFIG.CANVAS.WIDTH / CONFIG.CANVAS.HEIGHT; // 4:3
        let w = maxWidth;
        let h = Math.floor(w / aspect);
        if (h > maxHeight) {
            h = maxHeight;
            w = Math.floor(h * aspect);
        }
        this.canvas.width = w;
        this.canvas.height = h;
    },
    
    clear() {
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    },

    drawFloor() {
        const tile = CONFIG.FLOOR.TILE;
        const majorEvery = CONFIG.FLOOR.MAJOR_EVERY;
        const zoom = Camera.getZoom ? Camera.getZoom() : (CONFIG.CAMERA.ZOOM || 1);
        // zone monde visible
        const startWorldX = Math.floor(Camera.x / tile) * tile;
        const endWorldX = Camera.x + Math.ceil(this.canvas.width / zoom);
        const startWorldY = Math.floor(Camera.y / tile) * tile;
        const endWorldY = Camera.y + Math.ceil(this.canvas.height / zoom);

        // Lignes verticales
        for (let x = startWorldX; x <= endWorldX; x += tile) {
            const screenX = (x - Camera.x) * zoom;
            const idx = Math.floor(x / tile);
            this.ctx.strokeStyle = (idx % majorEvery === 0) ? CONFIG.FLOOR.MAJOR_LINE_COLOR : CONFIG.FLOOR.LINE_COLOR;
            this.ctx.lineWidth = (idx % majorEvery === 0) ? 1.25 : 1;
            this.ctx.beginPath();
            this.ctx.moveTo(screenX, 0);
            this.ctx.lineTo(screenX, this.canvas.height);
            this.ctx.stroke();
        }

        // Lignes horizontales
        for (let y = startWorldY; y <= endWorldY; y += tile) {
            const screenY = (y - Camera.y) * zoom;
            const idy = Math.floor(y / tile);
            this.ctx.strokeStyle = (idy % majorEvery === 0) ? CONFIG.FLOOR.MAJOR_LINE_COLOR : CONFIG.FLOOR.LINE_COLOR;
            this.ctx.lineWidth = (idy % majorEvery === 0) ? 1.25 : 1;
            this.ctx.beginPath();
            this.ctx.moveTo(0, screenY);
            this.ctx.lineTo(this.canvas.width, screenY);
            this.ctx.stroke();
        }

        // Points aux intersections
        const dotSize = CONFIG.FLOOR.DOT_SIZE;
        this.ctx.fillStyle = CONFIG.FLOOR.DOT_COLOR;
        for (let x = startWorldX; x <= endWorldX; x += tile) {
            for (let y = startWorldY; y <= endWorldY; y += tile) {
                const idx = Math.floor(x / tile);
                const idy = Math.floor(y / tile);
                if ((idx + idy) % 2 !== 0) continue; // allègement
                const sx = (x - Camera.x) * zoom;
                const sy = (y - Camera.y) * zoom;
                this.ctx.beginPath();
                this.ctx.arc(sx, sy, dotSize, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    },
    
    // === NOUVEAU RENDU DES MURS : couleur fixe + arcs électriques optionnels ===
    drawWorldBoundaries() {
        const zoom = Camera.getZoom ? Camera.getZoom() : (CONFIG.CAMERA.ZOOM || 1);
        const wallThicknessWorld = 16;
        const wt = wallThicknessWorld * zoom;
        const topLeft = Camera.worldToScreen(0, 0);
        const topRight = Camera.worldToScreen(CONFIG.WORLD.WIDTH, 0);
        const bottomLeft = Camera.worldToScreen(0, CONFIG.WORLD.HEIGHT);

        // Couleur fixe (modifiable ici)
        const wallFill = 'rgba(0,180,255,0.35)';
        const borderGlow = '#4fe4ff'; // utilisé pour l'effet électrique
        const electric = true; // mettre à false pour désactiver l'effet dynamique

        this.ctx.save();
        this.ctx.globalCompositeOperation = 'lighter';

        // Mur gauche
        if (topLeft.x <= this.canvas.width && topRight.x >= 0) {
            this.ctx.fillStyle = wallFill;
            this.ctx.fillRect(topLeft.x, 0, wt, this.canvas.height);
            if (electric) this.drawElectricEdge(topLeft.x + wt, 0, topLeft.x + wt, this.canvas.height, 'v', borderGlow);
        }
        // Mur droit
        if (topRight.x >= -wt && topRight.x <= this.canvas.width + wt) {
            this.ctx.fillStyle = wallFill;
            this.ctx.fillRect(topRight.x - wt, 0, wt, this.canvas.height);
            if (electric) this.drawElectricEdge(topRight.x - wt, 0, topRight.x - wt, this.canvas.height, 'v', borderGlow);
        }
        // Mur haut
        if (topLeft.y <= this.canvas.height && bottomLeft.y >= 0) {
            this.ctx.fillStyle = wallFill;
            this.ctx.fillRect(0, topLeft.y, this.canvas.width, wt);
            if (electric) this.drawElectricEdge(0, topLeft.y + wt, this.canvas.width, topLeft.y + wt, 'h', borderGlow);
        }
        // Mur bas
        if (bottomLeft.y >= -wt && bottomLeft.y <= this.canvas.height + wt) {
            this.ctx.fillStyle = wallFill;
            this.ctx.fillRect(0, bottomLeft.y - wt, this.canvas.width, wt);
            if (electric) this.drawElectricEdge(0, bottomLeft.y - wt, this.canvas.width, bottomLeft.y - wt, 'h', borderGlow);
        }

        this.ctx.restore();
    },

    // Génération procédurale d'un trait électrique animé le long d'un bord
    // dir: 'h' ou 'v'
    drawElectricEdge(x1, y1, x2, y2, dir, color) {
        const ctx = this.ctx;
        const t = performance.now() * 0.004; // vitesse d'animation
        const segments = 20; // nombre de segments (plus => plus détaillé)
        const amplitude = 8; // écart max (pixels)
        ctx.save();
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;

        // Dessiner plusieurs couches pour un effet d'éclair
        for (let layer = 0; layer < 3; layer++) {
            const layerAmp = amplitude * (1 - layer * 0.45);
            ctx.beginPath();
            for (let i = 0; i <= segments; i++) {
                const p = i / segments;
                if (dir === 'h') {
                    const x = x1 + (x2 - x1) * p;
                    // bruit pseudo cohérent (combinaison de sin) + léger random impulsif
                    const wav = Math.sin(p * 18 + t * 2) + 0.5 * Math.sin(p * 34 - t * 3.2);
                    const jitter = (Math.random() - 0.5) * 0.6; // micro variation pour le côté nerveux
                    const yOffset = (wav + jitter) * layerAmp;
                    const y = y1 + yOffset * (layer === 0 ? 1 : 0.7);
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                } else { // vertical
                    const y = y1 + (y2 - y1) * p;
                    const wav = Math.sin(p * 18 + t * 2.2) + 0.5 * Math.sin(p * 30 - t * 2.4);
                    const jitter = (Math.random() - 0.5) * 0.6;
                    const xOffset = (wav + jitter) * layerAmp;
                    const x = x1 + xOffset * (layer === 0 ? 1 : 0.7);
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
            }
            ctx.lineWidth = 3 - layer; // 3,2,1
            ctx.strokeStyle = layer === 0 ? color : (layer === 1 ? '#aff6ff' : '#ffffff');
            ctx.globalAlpha = layer === 0 ? 0.85 : (layer === 1 ? 0.55 : 0.35);
            ctx.stroke();
        }

        // Étincelles aléatoires (petits points lumineux qui jaillissent)
        for (let s = 0; s < 6; s++) {
            if (Math.random() < 0.3) {
                ctx.beginPath();
                if (dir === 'h') {
                    const px = x1 + Math.random() * (x2 - x1);
                    const py = y1 + (Math.random() - 0.5) * 18;
                    ctx.fillStyle = 'rgba(255,255,255,0.55)';
                    ctx.arc(px, py, 1.2, 0, Math.PI * 2);
                } else {
                    const py = y1 + Math.random() * (y2 - y1);
                    const px = x1 + (Math.random() - 0.5) * 18;
                    ctx.fillStyle = 'rgba(255,255,255,0.55)';
                    ctx.arc(px, py, 1.2, 0, Math.PI * 2);
                }
                ctx.fill();
            }
        }

        ctx.restore();
    },

    strokeWallLines(x,y,w,h,dir){
        this.ctx.save();
        this.ctx.globalAlpha = 0.45;
        this.ctx.strokeStyle = '#ffffff22';
        this.ctx.lineWidth = 1;
        const step = 10;
        if (dir==='v') {
            for (let yy = y+4; yy < y+h-4; yy+=step){
                this.ctx.beginPath();
                this.ctx.moveTo(x+3,yy);
                this.ctx.lineTo(x+w-3,yy+2);
                this.ctx.stroke();
            }
        } else {
            for (let xx = x+4; xx < x+w-4; xx+=step){
                this.ctx.beginPath();
                this.ctx.moveTo(xx,y+3);
                this.ctx.lineTo(xx+2,y+h-3);
                this.ctx.stroke();
            }
        }
        this.ctx.restore();
    },
    
    drawPlayer() {
        if (!Player.data) return;
        
        const screen = Camera.worldToScreen(Player.data.x, Player.data.y);
        const zoom = Camera.getZoom ? Camera.getZoom() : (CONFIG.CAMERA.ZOOM || 1);
        
        this.ctx.save();
        this.ctx.translate(screen.x, screen.y);
        this.ctx.scale(zoom, zoom);
        
        // === CERCLE DE PORTÉE DU MAGNET ===
        if (Player.data.magnetRange > 50) { // Afficher seulement si amélioré
            this.ctx.strokeStyle = 'rgba(100, 200, 255, 0.3)';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([8, 4]);
            this.ctx.beginPath();
            this.ctx.arc(0, 0, Player.data.magnetRange, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.setLineDash([]); // Réinitialiser le style de ligne
        }
        
        const invul = Player.data.invulnerable;
        const pulse = invul && Math.sin(Date.now()*0.02)>0;
        const robotColor = pulse? '#fff':'#0ff';
        const bodyColor = pulse? '#fff':'#0dd';
        const detailColor = pulse? '#fff':'#0aa';
        
        this.ctx.shadowColor = robotColor;
        this.ctx.shadowBlur = 15;
        
        this.ctx.fillStyle = robotColor; // Corps
        this.ctx.fillRect(-8, -10, 16, 20);
        
        this.ctx.fillStyle = bodyColor; // Tête
        this.ctx.fillRect(-6, -14, 12, 6);
        
        this.ctx.fillStyle = '#ff0'; // Yeux
        this.ctx.fillRect(-4, -12, 2, 2);
        this.ctx.fillRect(2, -12, 2, 2);
        
        this.ctx.fillStyle = detailColor; // Armes épaules
        this.ctx.fillRect(-12, -8, 4, 6);
        this.ctx.fillRect(8, -8, 4, 6);
        
        this.ctx.fillStyle = detailColor; // Bras
        this.ctx.fillRect(-10, -2, 3, 8);
        this.ctx.fillRect(7, -2, 3, 8);
        
        this.ctx.fillStyle = '#088'; // Jambes
        this.ctx.fillRect(-6, 6, 4, 8);
        this.ctx.fillRect(2, 6, 4, 8);
        
        if (Player.bulletCooldown > Player.data.fireRate - 4) { // Flash tir
            this.ctx.fillStyle = '#ff0';
            this.ctx.fillRect(-15, -7, 4, 2);
            this.ctx.fillRect(11, -7, 4, 2);
        }
        
        this.ctx.restore();
        this.ctx.shadowBlur = 0;
    },
    
    drawBullets() {
        const zoom = Camera.getZoom ? Camera.getZoom() : (CONFIG.CAMERA.ZOOM || 1);
        Bullet.list.forEach(bullet => {
            const screen = Camera.worldToScreen(bullet.x, bullet.y);
            
            if (!Camera.isVisible(bullet.x, bullet.y, 20)) return;
            this.drawBulletByType(bullet, screen, zoom);
        });
    },
    
    drawBulletByType(bullet, screen, zoom) {
        this.ctx.save();
        switch(bullet.type) {
            case 'homing': this.drawHomingMissile(bullet, screen, zoom); break;
            case 'explosive': this.drawExplosiveBullet(bullet, screen, zoom); break;
            case 'orb': this.drawOrbBullet(bullet, screen, zoom); break;
            case 'pellet': this.drawPellet(bullet, screen, zoom); break;
            default: this.drawBasicBullet(bullet, screen, zoom);
        }
        this.ctx.restore();
    },
    
    drawHomingMissile(bullet, screen, zoom) {
        if (bullet.trail && bullet.trail.length > 1) {
            this.ctx.strokeStyle = bullet.color + '60';
            this.ctx.lineWidth = 3 * zoom;
            this.ctx.lineCap = 'round';
            this.ctx.beginPath();
            for (let i = 0; i < bullet.trail.length; i++) {
                const trailPoint = Camera.worldToScreen(bullet.trail[i].x, bullet.trail[i].y);
                if (i === 0) this.ctx.moveTo(trailPoint.x, trailPoint.y); else this.ctx.lineTo(trailPoint.x, trailPoint.y);
            }
            this.ctx.stroke();
        }
        this.ctx.fillStyle = bullet.color;
        this.ctx.shadowColor = bullet.color;
        this.ctx.shadowBlur = 10;
        const angle = Math.atan2(bullet.vy, bullet.vx);
        const length = bullet.length * zoom;
        this.ctx.save();
        this.ctx.translate(screen.x, screen.y);
        this.ctx.rotate(angle);
        this.ctx.fillRect(-length/2, -bullet.radius * zoom, length, bullet.radius * 2 * zoom);
        this.ctx.restore();
    },
    
    drawExplosiveBullet(bullet, screen, zoom) {
        const time = Date.now() * 0.01;
        const angle = Math.atan2(bullet.vy, bullet.vx);
        this.ctx.save();
        this.ctx.translate(screen.x, screen.y);
        this.ctx.rotate(angle);
        const length = bullet.length * zoom;
        const width = bullet.radius * 2 * zoom;
        const gradient = this.ctx.createLinearGradient(-length/2, -width/2, -length/2, width/2);
        gradient.addColorStop(0, '#ff8844');
        gradient.addColorStop(0.3, '#ff4400');
        gradient.addColorStop(0.7, '#cc2200');
        gradient.addColorStop(1, '#ff8844');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(-length/2, -width/2, length, width);
        this.ctx.fillStyle = '#ffaa66';
        this.ctx.beginPath();
        this.ctx.moveTo(length/2, 0);
        this.ctx.lineTo(length/2 - width, -width/2);
        this.ctx.lineTo(length/2 - width, width/2);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.fillStyle = '#ff6622';
        this.ctx.beginPath();
        this.ctx.moveTo(-length/2, -width/2);
        this.ctx.lineTo(-length/2 - width*0.8, -width*1.2);
        this.ctx.lineTo(-length/2 + width*0.3, -width/2);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.moveTo(-length/2, width/2);
        this.ctx.lineTo(-length/2 - width*0.8, width*1.2);
        this.ctx.lineTo(-length/2 + width*0.3, width/2);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.fillStyle = '#ffff00';
        for (let i = 0; i < 3; i++) {
            const x = -length/2 + (i + 1) * (length / 5);
            this.ctx.fillRect(x, -width/4, width/8, width/2);
        }
        const pulseIntensity = Math.sin(time * 8) * 0.4 + 0.6;
        this.ctx.shadowColor = '#ff4400';
        this.ctx.shadowBlur = 20 * pulseIntensity * zoom;
        this.ctx.strokeStyle = '#ff6600';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(-length/2, -width/2, length, width);
        this.ctx.restore();
        if (Math.random() < 0.6) {
            const trailX = bullet.x - Math.cos(angle) * (length/2 + 10);
            const trailY = bullet.y - Math.sin(angle) * (length/2 + 10);
            Particle.createExplosion(trailX, trailY, '#ff8844', 2);
        }
        if (Math.random() < 0.4) {
            const sparkAngle = angle + (Math.random() - 0.5) * 0.8;
            const sparkDistance = 8 + Math.random() * 12;
            const sparkX = bullet.x + Math.cos(sparkAngle) * sparkDistance;
            const sparkY = bullet.y + Math.sin(sparkAngle) * sparkDistance;
            Particle.createExplosion(sparkX, sparkY, '#ffaa00', 1);
        }
        this.ctx.save();
        this.ctx.globalAlpha = 0.3 * pulseIntensity;
        this.ctx.strokeStyle = '#ff4400';
        this.ctx.lineWidth = 3 * zoom;
        this.ctx.beginPath();
        this.ctx.arc(screen.x, screen.y, (bullet.radius + 8) * zoom * pulseIntensity, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.restore();
        if (Math.random() < 0.3) {
            this.ctx.save();
            this.ctx.globalAlpha = 0.2;
            this.ctx.fillStyle = '#ff6600';
            const heatRadius = (bullet.radius + 5) * zoom;
            this.ctx.beginPath();
            this.ctx.arc(screen.x + (Math.random() - 0.5) * 6, 
                        screen.y + (Math.random() - 0.5) * 6, 
                        heatRadius * (0.8 + Math.random() * 0.4), 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
        if (Math.sin(time * 12) > 0.5) {
            this.ctx.save();
            this.ctx.translate(screen.x, screen.y);
            this.ctx.rotate(angle);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.shadowColor = '#ffffff';
            this.ctx.shadowBlur = 10;
            this.ctx.beginPath();
            this.ctx.arc(length/2 - width/3, 0, 2 * zoom, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
    },
    
    drawOrbBullet(bullet, screen, zoom) {
        this.ctx.fillStyle = bullet.color;
        this.ctx.shadowColor = bullet.color;
        this.ctx.shadowBlur = 8;
        this.ctx.beginPath();
        this.ctx.arc(screen.x, screen.y, bullet.radius * zoom, 0, Math.PI * 2);
        this.ctx.fill();
    },
    
    drawPellet(bullet, screen, zoom) {
        this.ctx.fillStyle = bullet.color;
        this.ctx.beginPath();
        this.ctx.arc(screen.x, screen.y, bullet.radius * zoom, 0, Math.PI * 2);
        this.ctx.fill();
    },
    
    drawBasicBullet(bullet, screen, zoom) {
        this.ctx.strokeStyle = bullet.color;
        this.ctx.shadowColor = bullet.color;
        this.ctx.shadowBlur = 8;
        this.ctx.lineWidth = bullet.radius * zoom;
        this.ctx.lineCap = 'round';
        const angle = Math.atan2(bullet.vy, bullet.vx);
        const length = bullet.length * zoom;
        const startX = screen.x - Math.cos(angle) * length / 2;
        const startY = screen.y - Math.sin(angle) * length / 2;
        const endX = screen.x + Math.cos(angle) * length / 2;
        const endY = screen.y + Math.sin(angle) * length / 2;
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
    },
    
    drawEnemies() {
        const zoom = Camera.getZoom ? Camera.getZoom() : (CONFIG.CAMERA.ZOOM || 1);
        Enemy.list.forEach(enemy => {
            const screen = Camera.worldToScreen(enemy.x, enemy.y);
            if (!Camera.isVisible(enemy.x, enemy.y, 50)) return;
            this.ctx.save();
            this.ctx.translate(screen.x, screen.y);
            this.ctx.scale(zoom, zoom);
            this.drawEnemyByType(enemy);
            this.ctx.restore();
            if (enemy.maxHealth > 1) {
                const barWidth = enemy.radius * 2 * zoom;
                const barHeight = Math.max(2, 3 * zoom);
                const barY = screen.y - enemy.radius * zoom - 10;
                this.ctx.fillStyle = '#444';
                this.ctx.fillRect(screen.x - barWidth/2, barY, barWidth, barHeight);
                const healthPercent = enemy.health / enemy.maxHealth;
                this.ctx.fillStyle = healthPercent > 0.5 ? '#0f0' : '#f80';
                this.ctx.fillRect(screen.x - barWidth/2, barY, barWidth * healthPercent, barHeight);
            }
        });
    },
    
    drawEnemyByType(enemy) {
        const baseColor = enemy.color;
        const pulseIntensity = Math.sin(enemy.pulsePhase) * 0.3 + 0.7;
        if (enemy.spawning) {
            this.ctx.save();
            this.ctx.scale(enemy.spawnScale, enemy.spawnScale);
            this.ctx.shadowColor = baseColor;
            this.ctx.shadowBlur = 25 * (1 - enemy.spawnScale);
            this.ctx.globalAlpha = 0.3 + enemy.spawnScale * 0.7;
            const spawnGlow = Math.sin(Date.now() * 0.02) * 0.3 + 0.7;
            this.ctx.fillStyle = this.lightenColor(baseColor, spawnGlow);
        } else {
            this.ctx.shadowColor = baseColor;
            this.ctx.shadowBlur = 12 * pulseIntensity;
        }
        switch(enemy.shape) {
            case 'scout': this.drawScout(enemy, baseColor, pulseIntensity); break;
            case 'interceptor': this.drawInterceptor(enemy, baseColor, pulseIntensity); break;
            case 'crusher': this.drawCrusher(enemy, baseColor, pulseIntensity); break;
            case 'shredder': this.drawShredder(enemy, baseColor, pulseIntensity); break;
            default: this.drawBasicShape(enemy, baseColor);
        }
        if (enemy.spawning) { this.ctx.restore(); }
        this.ctx.shadowBlur = 0; this.ctx.globalAlpha = 1;
    },
    
    lightenColor(color, intensity) {
        const r = parseInt(color.substr(1,1), 16) * 16;
        const g = parseInt(color.substr(2,1), 16) * 16;
        const b = parseInt(color.substr(3,1), 16) * 16;
        const newR = Math.min(255, Math.floor(r + (255 - r) * intensity * 0.5));
        const newG = Math.min(255, Math.floor(g + (255 - g) * intensity * 0.5));
        const newB = Math.min(255, Math.floor(b + (255 - b) * intensity * 0.5));
        return `rgb(${newR}, ${newG}, ${newB})`;
    },
    
    drawScout(enemy, baseColor, pulseIntensity) {
        const r = enemy.radius;
        this.ctx.fillStyle = baseColor;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -r);
        this.ctx.lineTo(-r * 0.7, r * 0.5);
        this.ctx.lineTo(r * 0.7, r * 0.5);
        this.ctx.closePath();
        this.ctx.fill();
        const thrusterGlow = enemy.thrusterFlicker > 0.5 ? '#ff8' : '#f84';
        this.ctx.fillStyle = thrusterGlow;
        this.ctx.beginPath();
        this.ctx.arc(-r * 0.4, r * 0.3, r * 0.2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(r * 0.4, r * 0.3, r * 0.2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#0ff';
        this.ctx.beginPath();
        this.ctx.arc(0, -r * 0.5, r * 0.15, 0, Math.PI * 2);
        this.ctx.fill();
    },
    
    drawInterceptor(enemy, baseColor, pulseIntensity) {
        const r = enemy.radius;
        this.ctx.save();
        this.ctx.rotate(enemy.rotationAngle);
        this.ctx.fillStyle = baseColor;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -r);
        this.ctx.lineTo(r * 0.6, 0);
        this.ctx.lineTo(0, r);
        this.ctx.lineTo(-r * 0.6, 0);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.fillStyle = '#f66';
        this.ctx.fillRect(-r * 0.9, -r * 0.2, r * 0.4, r * 0.4);
        this.ctx.fillRect(r * 0.5, -r * 0.2, r * 0.4, r * 0.4);
        const mainThruster = enemy.thrusterFlicker > 0.3 ? '#fff' : '#ff4';
        this.ctx.fillStyle = mainThruster;
        this.ctx.fillRect(-r * 0.3, r * 0.8, r * 0.2, r * 0.4);
        this.ctx.fillRect(r * 0.1, r * 0.8, r * 0.2, r * 0.4);
        this.ctx.restore();
        this.ctx.fillStyle = '#4ff';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2);
        this.ctx.fill();
    },
    
    drawCrusher(enemy, baseColor, pulseIntensity) {
        const r = enemy.radius;
        const armor = Math.sin(enemy.animTime * 0.5) * 0.1 + 0.9;
        this.ctx.fillStyle = baseColor;
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const x = Math.cos(angle) * r * armor;
            const y = Math.sin(angle) * r * armor;
            if (i === 0) this.ctx.moveTo(x, y); else this.ctx.lineTo(x, y);
        }
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.strokeStyle = '#aaf';
        this.ctx.lineWidth = 2; this.ctx.stroke();
        this.ctx.save();
        this.ctx.rotate(enemy.rotationAngle * 0.5);
        this.ctx.fillStyle = '#66f';
        this.ctx.fillRect(-r * 0.6, -r * 0.1, r * 1.2, r * 0.2);
        this.ctx.fillRect(-r * 0.1, -r * 0.6, r * 0.2, r * 1.2);
        this.ctx.restore();
        const engineGlow = Math.sin(enemy.animTime) > 0 ? '#8cf' : '#4af';
        this.ctx.fillStyle = engineGlow;
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const x = Math.cos(angle) * r * 0.7;
            const y = Math.sin(angle) * r * 0.7;
            this.ctx.beginPath();
            this.ctx.arc(x, y, r * 0.1, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.fillStyle = '#f84';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, r * 0.2 * pulseIntensity, 0, Math.PI * 2);
        this.ctx.fill();
    },
    
    drawShredder(enemy, baseColor, pulseIntensity) {
        const r = enemy.radius;
        this.ctx.save();
        this.ctx.rotate(enemy.rotationAngle * 0.3);
        this.ctx.fillStyle = baseColor;
        const spikes = 8;
        this.ctx.beginPath();
        for (let i = 0; i < spikes; i++) {
            const angle = (i * Math.PI * 2) / spikes;
            const radiusVariation = i % 2 === 0 ? r : r * 0.6;
            const x = Math.cos(angle) * radiusVariation;
            const y = Math.sin(angle) * radiusVariation;
            if (i === 0) this.ctx.moveTo(x, y); else this.ctx.lineTo(x, y);
        }
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();
        this.ctx.save();
        this.ctx.rotate(-enemy.rotationAngle * 0.8);
        this.ctx.strokeStyle = '#fa4';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(-r * 0.8, 0);
        this.ctx.lineTo(r * 0.8, 0);
        this.ctx.moveTo(0, -r * 0.8);
        this.ctx.lineTo(0, r * 0.8);
        this.ctx.stroke();
        this.ctx.restore();
        const coreColor = Math.sin(enemy.animTime * 2) > 0 ? '#ff0' : '#f80';
        this.ctx.fillStyle = coreColor;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
        this.ctx.fill();
        const weaponGlow = enemy.thrusterFlicker > 0.6 ? '#f44' : '#a22';
        this.ctx.fillStyle = weaponGlow;
        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI) / 2;
            const x = Math.cos(angle) * r * 0.9;
            const y = Math.sin(angle) * r * 0.9;
            this.ctx.beginPath();
            this.ctx.arc(x, y, r * 0.08, 0, Math.PI * 2);
            this.ctx.fill();
        }
    },
    
    drawBasicShape(enemy, baseColor) {
        this.ctx.fillStyle = baseColor;
        this.ctx.beginPath();
        switch(enemy.shape) {
            case 'triangle':
                this.ctx.moveTo(0, -enemy.radius);
                this.ctx.lineTo(-enemy.radius * 0.8, enemy.radius * 0.6);
                this.ctx.lineTo(enemy.radius * 0.8, enemy.radius * 0.6);
                this.ctx.closePath();
                break;
            case 'diamond':
                this.ctx.moveTo(0, -enemy.radius);
                this.ctx.lineTo(enemy.radius, 0);
                this.ctx.lineTo(0, enemy.radius);
                this.ctx.lineTo(-enemy.radius, 0);
                this.ctx.closePath();
                break;
            case 'hexagon':
                for (let i = 0; i < 6; i++) {
                    const angle = (i * Math.PI) / 3;
                    const x = Math.cos(angle) * enemy.radius;
                    const y = Math.sin(angle) * enemy.radius;
                    if (i === 0) this.ctx.moveTo(x, y); else this.ctx.lineTo(x, y);
                }
                this.ctx.closePath();
                break;
            case 'star':
                const spikes = 5;
                for (let i = 0; i < spikes * 2; i++) {
                    const angle = (i * Math.PI) / spikes;
                    const radius = i % 2 === 0 ? enemy.radius : enemy.radius * 0.5;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    if (i === 0) this.ctx.moveTo(x, y); else this.ctx.lineTo(x, y);
                }
                this.ctx.closePath();
                break;
            default:
                this.ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
        }
        this.ctx.fill();
    },
    
    drawCurrency() {
        const zoom = Camera.getZoom ? Camera.getZoom() : (CONFIG.CAMERA.ZOOM || 1);
        Currency.list.forEach(drop => {
            const screen = Camera.worldToScreen(drop.x, drop.y);
            const bobY = screen.y + Math.sin(drop.bobOffset) * 2;
            this.ctx.save();
            this.ctx.translate(screen.x, bobY);
            this.ctx.scale(zoom, zoom);
            this.drawGoldCoin(drop);
            this.ctx.restore();
            if (drop.value > 1) {
                this.ctx.fillStyle = '#fff';
                this.ctx.font = `${Math.floor(10 * zoom)}px Courier New`;
                this.ctx.textAlign = 'center';
                this.ctx.fillText(drop.value.toString(), screen.x, bobY + 3 * zoom);
            }
        });
    },
    
    drawGoldCoin(drop) {
        if (drop.type === 'lootbox') { this.drawLootBox(drop); return; }
        const radius = drop.radius;
        const spin = drop.spinAngle;
        const perspective = Math.abs(Math.cos(spin));
        const width = radius * perspective;
        let mainColor, edgeColor, highlightColor;
        if (Math.cos(spin) > 0.3) { mainColor = drop.colors.BRIGHT; edgeColor = drop.colors.MEDIUM; highlightColor = '#FFFF88'; }
        else if (Math.cos(spin) < -0.3) { mainColor = drop.colors.MEDIUM; edgeColor = drop.colors.DARK; highlightColor = drop.colors.BRIGHT; }
        else { mainColor = drop.colors.DARK; edgeColor = drop.colors.MEDIUM; highlightColor = drop.colors.BRIGHT; }
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        this.ctx.shadowBlur = 4; this.ctx.shadowOffsetX = 2; this.ctx.shadowOffsetY = 2;
        this.ctx.fillStyle = mainColor;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, width, radius, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0; this.ctx.shadowOffsetX = 0; this.ctx.shadowOffsetY = 0;
        this.ctx.strokeStyle = edgeColor;
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, width, radius, 0, 0, Math.PI * 2);
        this.ctx.stroke();
        if (Math.cos(spin) > 0.1) {
            this.ctx.fillStyle = highlightColor;
            this.ctx.globalAlpha = 0.6;
            this.ctx.beginPath();
            this.ctx.ellipse(-width * 0.3, -radius * 0.3, width * 0.4, radius * 0.4, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        }
        if (drop.value > 1 && Math.abs(Math.cos(spin)) > 0.5) {
            this.ctx.strokeStyle = edgeColor; this.ctx.lineWidth = 1; this.ctx.beginPath(); this.ctx.ellipse(0,0,width*0.6,radius*0.6,0,0,Math.PI*2); this.ctx.stroke();
        }
        if (drop.magnetized) {
            this.ctx.shadowColor = mainColor; this.ctx.shadowBlur = 15; this.ctx.strokeStyle = mainColor; this.ctx.lineWidth = 2; this.ctx.beginPath(); this.ctx.ellipse(0,0,width,radius,0,0,Math.PI*2); this.ctx.stroke(); this.ctx.shadowBlur = 0;
        }
    },
    
    drawLootBox(lootBox) {
        const radius = lootBox.radius;
        const spin = lootBox.spinAngle;
        const floatOffset = Math.sin(lootBox.bobOffset) * 3;
        const glowIntensity = lootBox.glowIntensity || 1.0;
        this.ctx.save();
        this.ctx.translate(0, floatOffset);
        this.ctx.rotate(spin * 0.3);
        this.ctx.shadowColor = lootBox.colors.BRIGHT;
        this.ctx.shadowBlur = 20 * glowIntensity;
        this.ctx.fillStyle = lootBox.colors.MEDIUM;
        this.ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
        this.ctx.fillStyle = lootBox.colors.BRIGHT;
        this.ctx.beginPath();
        this.ctx.moveTo(-radius, -radius);
        this.ctx.lineTo(-radius + 4, -radius - 4);
        this.ctx.lineTo(radius + 4, -radius - 4);
        this.ctx.lineTo(radius, -radius);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.fillStyle = lootBox.colors.DARK;
        this.ctx.beginPath();
        this.ctx.moveTo(radius, -radius);
        this.ctx.lineTo(radius + 4, -radius - 4);
        this.ctx.lineTo(radius + 4, radius - 4);
        this.ctx.lineTo(radius, radius);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        let symbol = '?';
        switch(lootBox.lootType) {
            case 'TREASURE': symbol = '$'; break;
            case 'WEAPON': symbol = '?'; break;
            case 'NUKE': symbol = '??'; break;
            case 'MAGNET': symbol = '??'; break;
            case 'ORB_SHIELD': symbol = '??'; break;
            case 'ORB_UPGRADE': symbol = '?'; break;
            case 'UTILITY': symbol = '??'; break;
        }
        this.ctx.fillText(symbol, 0, 0);
        this.ctx.strokeStyle = lootBox.colors.BRIGHT;
        this.ctx.lineWidth = 2; this.ctx.strokeRect(-radius, -radius, radius * 2, radius * 2);
        if (Math.random() < 0.3) {
            for (let i = 0; i < 3; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = radius + 5 + Math.random() * 10;
                const sx = Math.cos(angle) * distance;
                const sy = Math.sin(angle) * distance;
                this.ctx.fillStyle = lootBox.colors.BRIGHT;
                this.ctx.beginPath();
                this.ctx.arc(sx, sy, 1 + Math.random() * 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        this.ctx.restore(); this.ctx.shadowBlur = 0;
    },
    
    drawOrbs() {
        const zoom = Camera.getZoom ? Camera.getZoom() : (CONFIG.CAMERA.ZOOM || 1);
        if (!Player.data) return;
        Orb.list.forEach(orb => {
            const screen = Camera.worldToScreen(orb.x, orb.y);
            this.ctx.fillStyle = orb.color; this.ctx.shadowColor = orb.color; this.ctx.shadowBlur = 12;
            this.ctx.beginPath(); this.ctx.arc(screen.x, screen.y, orb.radius * zoom, 0, Math.PI * 2); this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });
        if (Orb.list.length > 0) {
            const playerScreen = Camera.worldToScreen(Player.data.x, Player.data.y);
            this.ctx.strokeStyle = CONFIG.ORBS.COLOR + '40';
            this.ctx.lineWidth = 1; this.ctx.beginPath(); this.ctx.arc(playerScreen.x, playerScreen.y, CONFIG.ORBS.DISTANCE * zoom, 0, Math.PI * 2); this.ctx.stroke();
        }
    },

    drawParticles() {
        const zoom = Camera.getZoom ? Camera.getZoom() : (CONFIG.CAMERA.ZOOM || 1);
        Particle.list.forEach(particle => {
            const screen = Camera.worldToScreen(particle.x, particle.y);
            const alpha = particle.life / particle.maxLife;
            this.ctx.fillStyle = particle.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
            this.ctx.beginPath();
            this.ctx.arc(screen.x, screen.y, particle.radius * alpha * zoom, 0, Math.PI * 2);
            this.ctx.fill();
        });
        TeleportFX.draw(this.ctx);
    },
    
    drawUpgradeScreen() {
        if (Game.state !== 'upgrade') return;
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#0f0';
        this.ctx.font = '32px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('LEVEL UP!', this.canvas.width / 2, 150);
        let anyHover = false;
        const left = 100; const width = this.canvas.width - 200;
        this.ctx.font = '18px Courier New';
        for (let i = 0; i < Upgrades.options.length; i++) {
            const option = Upgrades.options[i];
            const centerY = 250 + i * 80; const top = centerY - 30; const height = 60;
            const hovered = (Input.mouse.x >= left && Input.mouse.x <= left + width && Input.mouse.y >= top && Input.mouse.y <= top + height);
            if (hovered) anyHover = true;
            if (hovered) { this.ctx.fillStyle = 'rgba(255, 255, 0, 0.12)'; this.ctx.fillRect(left, top, width, height); }
            this.ctx.strokeStyle = hovered ? '#ff0' : '#0f0';
            this.ctx.lineWidth = hovered ? 3 : 2; this.ctx.strokeRect(left, top, width, height);
            this.ctx.fillStyle = hovered ? '#ff0' : '#0f0';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`${i + 1}. ${option.name}`, left + 20, centerY - 5);
            this.ctx.font = '14px Courier New'; this.ctx.fillStyle = '#888';
            this.ctx.fillText(option.desc, left + 20, centerY + 15);
            this.ctx.font = '18px Courier New';
        }
        this.canvas.style.cursor = anyHover ? 'pointer' : 'default';
        this.ctx.font = '16px Courier New'; this.ctx.fillStyle = '#fff'; this.ctx.textAlign = 'center';
        this.ctx.fillText('Press 1, 2, 3 or click to choose', this.canvas.width / 2, this.canvas.height - 50);
    },
    
    drawWaveAnnouncement() {
        if (Game.state !== 'waveAnnouncement') return;
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        const pulseIntensity = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
        this.ctx.fillStyle = `rgba(255, 215, 0, ${pulseIntensity})`;
        this.ctx.font = 'bold 48px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.strokeStyle = '#FFA500';
        this.ctx.lineWidth = 3;
        this.ctx.strokeText(`WAVE ${Game.wave}`, this.canvas.width / 2, this.canvas.height / 2 - 40);
        this.ctx.fillText(`WAVE ${Game.wave}`, this.canvas.width / 2, this.canvas.height / 2 - 40);
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = '24px Courier New';
        this.ctx.fillText('INCOMING HOSTILES', this.canvas.width / 2, this.canvas.height / 2 + 20);
        const enemyCount = Enemy.maxEnemiesPerWave || Math.min(15 + Game.wave * 2.5, 40);
        const difficultyText = Game.wave <= 3 ? 'EASY' : Game.wave <= 6 ? 'MEDIUM' : Game.wave <= 10 ? 'HARD' : 'EXTREME';
        this.ctx.fillStyle = '#FFFF88';
        this.ctx.font = '18px Courier New';
        this.ctx.fillText(`Enemies: ${Math.floor(enemyCount)} | Difficulty: ${difficultyText}`, this.canvas.width / 2, this.canvas.height / 2 + 60);
        const progress = (180 - Game.waveAnnouncementTimer) / 180;
        const barWidth = 300; const barHeight = 6; const barX = this.canvas.width / 2 - barWidth / 2; const barY = this.canvas.height / 2 + 100;
        this.ctx.fillStyle = '#444'; this.ctx.fillRect(barX, barY, barWidth, barHeight);
        this.ctx.fillStyle = '#FFD700'; this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);
    },
    
    drawOffscreenEnemyIndicators() {
        if (!Player.data || Enemy.list.length === 0) return;
        const margin = 20; // Distance bord
        Enemy.list.forEach(enemy => {
            if (Camera.isVisible(enemy.x, enemy.y, 50)) return;
            const playerScreen = Camera.worldToScreen(Player.data.x, Player.data.y);
            const enemyScreen = Camera.worldToScreen(enemy.x, enemy.y);
            const dx = enemyScreen.x - playerScreen.x; const dy = enemyScreen.y - playerScreen.y;
            const distance = Math.sqrt(dx * dx + dy * dy); if (distance === 0) return;
            const dirX = dx / distance; const dirY = dy / distance;
            const minX = margin; const maxX = this.canvas.width - margin; const minY = margin; const maxY = this.canvas.height - margin;
            const centerX = this.canvas.width / 2; const centerY = this.canvas.height / 2;
            const scaleX = dirX !== 0 ? Math.abs((dirX > 0 ? maxX : minX) - centerX) / Math.abs(dirX) : Infinity;
            const scaleY = dirY !== 0 ? Math.abs((dirY > 0 ? maxY : minY) - centerY) / Math.abs(dirY) : Infinity;
            const scale = Math.min(scaleX, scaleY);
            let indicatorX = centerX + dirX * scale; let indicatorY = centerY + dirY * scale;
            indicatorX = Math.max(minX, Math.min(maxX, indicatorX)); indicatorY = Math.max(minY, Math.min(maxY, indicatorY));
            this.drawEnemyIndicator(indicatorX, indicatorY, enemy, dirX, dirY);
        });
    },
    
    drawEnemyIndicator(x, y, enemy, dirX, dirY) {
        this.ctx.save();
        let indicatorColor = enemy.color;
        let pulseIntensity = Math.sin(Date.now() * 0.008) * 0.4 + 0.6;
        if (enemy.type === 'tank' || enemy.type === 'splitter') {
            pulseIntensity = Math.sin(Date.now() * 0.012) * 0.6 + 0.4;
            indicatorColor = enemy.color;
        }
        const size = 8; const angle = Math.atan2(dirY, dirX);
        this.ctx.translate(x, y); this.ctx.rotate(angle);
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'; this.ctx.shadowBlur = 4; this.ctx.shadowOffsetX = 1; this.ctx.shadowOffsetY = 1;
        this.ctx.fillStyle = indicatorColor; this.ctx.globalAlpha = pulseIntensity;
        this.ctx.beginPath(); this.ctx.moveTo(size, 0); this.ctx.lineTo(-size * 0.6, -size * 0.7); this.ctx.lineTo(-size * 0.6, size * 0.7); this.ctx.closePath(); this.ctx.fill();
        this.ctx.strokeStyle = '#fff'; this.ctx.lineWidth = 1; this.ctx.globalAlpha = pulseIntensity * 0.8; this.ctx.stroke();
        this.ctx.fillStyle = enemy.type === 'tank' ? '#fff' : enemy.type === 'splitter' ? '#ff0' : enemy.type === 'fast' ? '#f00' : '#fff';
        this.ctx.globalAlpha = 1; this.ctx.beginPath(); this.ctx.arc(-1, 0, 2, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.restore();
    },
    
    drawMiniRadar() {
        if (!Player.data || Enemy.list.length === 0) return;
        const radarSize = 80; const radarX = this.canvas.width - radarSize - 15; const radarY = 15; const radarRadius = radarSize / 2;
        this.ctx.save(); this.ctx.globalAlpha = 0.7; this.ctx.fillStyle = 'rgba(0, 40, 40, 0.8)';
        this.ctx.beginPath(); this.ctx.arc(radarX + radarRadius, radarY + radarRadius, radarRadius, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.strokeStyle = '#0ff'; this.ctx.lineWidth = 2; this.ctx.stroke();
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)'; this.ctx.lineWidth = 1; this.ctx.beginPath();
        this.ctx.moveTo(radarX, radarY + radarRadius); this.ctx.lineTo(radarX + radarSize, radarY + radarRadius);
        this.ctx.moveTo(radarX + radarRadius, radarY); this.ctx.lineTo(radarX + radarRadius, radarY + radarSize); this.ctx.stroke();
        this.ctx.beginPath(); this.ctx.arc(radarX + radarRadius, radarY + radarRadius, radarRadius * 0.5, 0, Math.PI * 2); this.ctx.stroke();
        this.ctx.fillStyle = '#0ff'; this.ctx.beginPath(); this.ctx.arc(radarX + radarRadius, radarY + radarRadius, 3, 0, Math.PI * 2); this.ctx.fill();
        const radarRange = 600; const scale = radarRadius / radarRange;
        Enemy.list.forEach(enemy => {
            const dx = enemy.x - Player.data.x; const dy = enemy.y - Player.data.y; const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > radarRange) return;
            const enemyRadarX = radarX + radarRadius + dx * scale;
            const enemyRadarY = radarY + radarRadius + dy * scale;
            let enemyColor = enemy.color;
            let enemySize = 2;
            if (enemy.type === 'tank') { enemySize = 3; enemyColor = '#84f'; }
            else if (enemy.type === 'splitter') { enemySize = 2.5; enemyColor = '#f80'; }
            else if (enemy.type === 'fast') { enemySize = 1.5; enemyColor = '#f44'; }
            if (distance < 150) {
                const pulse = Math.sin(Date.now() * 0.02) * 0.5 + 0.5;
                enemySize += pulse; this.ctx.globalAlpha = 0.8 + pulse * 0.2;
            } else this.ctx.globalAlpha = 0.6;
            this.ctx.fillStyle = enemyColor; this.ctx.beginPath(); this.ctx.arc(enemyRadarX, enemyRadarY, enemySize, 0, Math.PI * 2); this.ctx.fill();
        });
        this.ctx.restore();
    },
    
    drawDeathFlash() {
        if (Game.state !== 'deathSequence') return;
        const t = Game.deathSequenceTimer / 180; const alpha = Math.min(0.8, 1 - t);
        const grd = this.ctx.createRadialGradient(this.canvas.width/2, this.canvas.height/2, 50, this.canvas.width/2, this.canvas.height/2, Math.max(this.canvas.width,this.canvas.height)/1.2);
        grd.addColorStop(0, `rgba(255,0,40,${alpha*0.55})`); grd.addColorStop(1, 'rgba(0,0,0,0)');
        this.ctx.fillStyle = grd; this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
        if (Game.deathSequenceTimer > 150) {
            const f = (Game.deathSequenceTimer-150)/30;
            this.ctx.fillStyle = `rgba(255,255,255,${f*0.6})`; this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
        }
    },
    
    render() {
        this.clear();
        Camera.update();
        if (Game.state !== 'upgrade') { this.canvas.style.cursor = 'default'; }
        this.drawFloor();
        this.drawWorldBoundaries();
        this.drawPlayer();
        this.drawBullets();
        this.drawEnemies();
        this.drawCurrency();
        this.drawOrbs();
        this.drawParticles();
        this.drawOffscreenEnemyIndicators?.();
        this.drawMiniRadar?.();
        this.drawUpgradeScreen();
        this.drawWaveAnnouncement();
        this.drawDeathFlash();
        if (typeof Game !== 'undefined' && Game.state === 'paused') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.55)'; this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
            this.ctx.fillStyle = '#fff'; this.ctx.font = 'bold 48px Courier New'; this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', this.canvas.width/2, this.canvas.height/2 - 10);
            this.ctx.font = '18px Courier New'; this.ctx.fillStyle = '#ccc';
            this.ctx.fillText('Press P to resume', this.canvas.width/2, this.canvas.height/2 + 30);
        }
        // === DEBUG MODE (DOM panel sous COMBO) ===
        try {
            const screen = document.getElementById('gameScreen');
            let panel = document.getElementById('debugPanel');
            if (!panel) {
                panel = document.createElement('div');
                panel.id = 'debugPanel';
                panel.style.cssText = 'position:absolute;left:12px;top:160px;color:#fff;font-family:Courier New;font-size:14px;pointer-events:none;'+
                    'background:rgba(12,18,24,0.9);border:1px solid #0ff;padding:8px 10px;white-space:pre;';
                screen.appendChild(panel);
            }
            if (debugMode && Player?.data) {
                const d = Player.data;
                panel.style.display = 'block';
                panel.textContent = [
                    'DEBUG MODE',
                    `Fire Rate: ${d.fireRate}`,
                    `Bullet Speed: ${d.bulletSpeed}`,
                    `Speed: ${d.speed}`,
                    `Range: ${d.range}`,
                    `Magnet Range: ${d.magnetRange}`,
                    `Orb Count: ${d.orbCount}`,
                    `Orb Speed: ${d.orbSpeed}`,
                    `Triple Shot: ${d.tripleShot ? 'ON' : 'OFF'}`,
                    `Homing Missiles: ${d.homingMissiles ? 'ON' : 'OFF'}`,
                    `Explosive Cannon: ${d.explosiveCannon ? 'ON' : 'OFF'}`,
                    `Shotgun Blast: ${d.shotgunBlast ? 'ON' : 'OFF'}`
                ].join('\n');
            } else {
                if (panel) panel.style.display = 'none';
            }
        } catch { /* DOM not ready yet */ }
    }
};

let debugMode = false;
window.addEventListener('keydown', (e) => {
    if (e.key === 'd' || e.key === 'D') {
        debugMode = !debugMode;
        try { const p = document.getElementById('debugPanel'); if (p) p.style.display = debugMode ? 'block' : 'none'; } catch {}
        window.debugMode = debugMode;
        return;
    }

    // Debug hotkeys to tweak Fire Rate live
    if (debugMode && Player?.data) {
        if (e.key === 'F') { // increase value (slower fire)
            Player.data.fireRate = Math.min(120, (Player.data.fireRate || 0) + 1);
            e.preventDefault();
        } else if (e.key === 'f') { // decrease value (faster fire)
            Player.data.fireRate = Math.max(3, (Player.data.fireRate || 0) - 1);
            e.preventDefault();
        }
    }
});