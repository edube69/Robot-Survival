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
        // Adapter � la taille de la fen�tre au chargement
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    },
    
    resizeCanvas() {
        // Garde un ratio max tout en remplissant une bonne partie de l'�cran
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

        // Points aux intersections (l�ger motif)
        const dotSize = CONFIG.FLOOR.DOT_SIZE;
        this.ctx.fillStyle = CONFIG.FLOOR.DOT_COLOR;
        for (let x = startWorldX; x <= endWorldX; x += tile) {
            for (let y = startWorldY; y <= endWorldY; y += tile) {
                const idx = Math.floor(x / tile);
                const idy = Math.floor(y / tile);
                // Pour all�ger, ne dessiner des points que sur une sous-grille (ex: un sur deux)
                if ((idx + idy) % 2 !== 0) continue;
                const sx = (x - Camera.x) * zoom;
                const sy = (y - Camera.y) * zoom;
                this.ctx.beginPath();
                this.ctx.arc(sx, sy, dotSize, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    },
    
    drawPlayer() {
        if (!Player.data) return;
        
        const screen = Camera.worldToScreen(Player.data.x, Player.data.y);
        const zoom = Camera.getZoom ? Camera.getZoom() : (CONFIG.CAMERA.ZOOM || 1);
        
        this.ctx.save();
        this.ctx.translate(screen.x, screen.y);
        this.ctx.scale(zoom, zoom);
        
        // === CERCLE DE PORT�E DU MAGNET ===
        if (Player.data.magnetRange > 50) { // Afficher seulement si am�lior�
            this.ctx.strokeStyle = 'rgba(100, 200, 255, 0.3)';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([8, 4]);
            this.ctx.beginPath();
            this.ctx.arc(0, 0, Player.data.magnetRange, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.setLineDash([]); // R�initialiser le style de ligne
        }
        
        // Couleurs de base (plus de flash rouge santé, instant-kill)
        const invul = Player.data.invulnerable;
        const pulse = invul && Math.sin(Date.now()*0.02)>0;
        const robotColor = pulse? '#fff':'#0ff';
        const bodyColor = pulse? '#fff':'#0dd';
        const detailColor = pulse? '#fff':'#0aa';
        
        this.ctx.shadowColor = robotColor;
        this.ctx.shadowBlur = 15;
        
        // Corps du robot
        this.ctx.fillStyle = robotColor;
        this.ctx.fillRect(-8, -10, 16, 20);
        
        // T�te
        this.ctx.fillStyle = bodyColor;
        this.ctx.fillRect(-6, -14, 12, 6);
        
        // Yeux
        this.ctx.fillStyle = '#ff0';
        this.ctx.fillRect(-4, -12, 2, 2);
        this.ctx.fillRect(2, -12, 2, 2);
        
        // Armes sur les �paules
        this.ctx.fillStyle = detailColor;
        this.ctx.fillRect(-12, -8, 4, 6);
        this.ctx.fillRect(8, -8, 4, 6);
        
        // Bras
        this.ctx.fillStyle = detailColor;
        this.ctx.fillRect(-10, -2, 3, 8);
        this.ctx.fillRect(7, -2, 3, 8);
        
        // Jambes
        this.ctx.fillStyle = '#088';
        this.ctx.fillRect(-6, 6, 4, 8);
        this.ctx.fillRect(2, 6, 4, 8);
        
        // Flash de tir
        if (Player.bulletCooldown > Player.data.fireRate - 4) {
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
            
            // Rendu sp�cialis� selon le type de projectile
            this.drawBulletByType(bullet, screen, zoom);
        });
    },
    
    drawBulletByType(bullet, screen, zoom) {
        this.ctx.save();
        
        switch(bullet.type) {
            case 'homing':
                this.drawHomingMissile(bullet, screen, zoom);
                break;
            case 'explosive':
                this.drawExplosiveBullet(bullet, screen, zoom);
                break;
            case 'orb':
                this.drawOrbBullet(bullet, screen, zoom);
                break;
            case 'pellet':
                this.drawPellet(bullet, screen, zoom);
                break;
            default:
                this.drawBasicBullet(bullet, screen, zoom);
        }
        
        this.ctx.restore();
    },
    
    drawHomingMissile(bullet, screen, zoom) {
        // Tra�n�e du missile
        if (bullet.trail && bullet.trail.length > 1) {
            this.ctx.strokeStyle = bullet.color + '60';
            this.ctx.lineWidth = 3 * zoom;
            this.ctx.lineCap = 'round';
            this.ctx.beginPath();
            
            for (let i = 0; i < bullet.trail.length; i++) {
                const trailPoint = Camera.worldToScreen(bullet.trail[i].x, bullet.trail[i].y);
                if (i === 0) this.ctx.moveTo(trailPoint.x, trailPoint.y);
                else this.ctx.lineTo(trailPoint.x, trailPoint.y);
            }
            this.ctx.stroke();
        }
        
        // Corps du missile
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
        
        // === CORPS PRINCIPAL DU PROJECTILE ===
        const length = bullet.length * zoom;
        const width = bullet.radius * 2 * zoom;
        
        // Gradient pour le corps principal (aspect m�tallique)
        const gradient = this.ctx.createLinearGradient(-length/2, -width/2, -length/2, width/2);
        gradient.addColorStop(0, '#ff8844');
        gradient.addColorStop(0.3, '#ff4400');
        gradient.addColorStop(0.7, '#cc2200');
        gradient.addColorStop(1, '#ff8844');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(-length/2, -width/2, length, width);
        
        // === OGIVE POINTUE ===
        this.ctx.fillStyle = '#ffaa66';
        this.ctx.beginPath();
        this.ctx.moveTo(length/2, 0);
        this.ctx.lineTo(length/2 - width, -width/2);
        this.ctx.lineTo(length/2 - width, width/2);
        this.ctx.closePath();
        this.ctx.fill();
        
        // === AILETTES STABILISATRICES ===
        this.ctx.fillStyle = '#ff6622';
        // Ailette sup�rieure
        this.ctx.beginPath();
        this.ctx.moveTo(-length/2, -width/2);
        this.ctx.lineTo(-length/2 - width*0.8, -width*1.2);
        this.ctx.lineTo(-length/2 + width*0.3, -width/2);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Ailette inf�rieure
        this.ctx.beginPath();
        this.ctx.moveTo(-length/2, width/2);
        this.ctx.lineTo(-length/2 - width*0.8, width*1.2);
        this.ctx.lineTo(-length/2 + width*0.3, width/2);
        this.ctx.closePath();
        this.ctx.fill();
        
        // === BANDES DE MARQUAGE EXPLOSIF ===
        this.ctx.fillStyle = '#ffff00';
        for (let i = 0; i < 3; i++) {
            const x = -length/2 + (i + 1) * (length / 5);
            this.ctx.fillRect(x, -width/4, width/8, width/2);
        }
        
        // === LUEUR DANGEREUSE PULSANTE ===
        const pulseIntensity = Math.sin(time * 8) * 0.4 + 0.6;
        this.ctx.shadowColor = '#ff4400';
        this.ctx.shadowBlur = 20 * pulseIntensity * zoom;
        this.ctx.strokeStyle = '#ff6600';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(-length/2, -width/2, length, width);
        
        this.ctx.restore();
        
        // === EFFETS AUTOUR DU PROJECTILE ===
        
        // Tra�n�e de fum�e chaude
        if (Math.random() < 0.6) {
            const trailX = bullet.x - Math.cos(angle) * (length/2 + 10);
            const trailY = bullet.y - Math.sin(angle) * (length/2 + 10);
            Particle.createExplosion(trailX, trailY, '#ff8844', 2);
        }
        
        // �tincelles qui s'�chappent
        if (Math.random() < 0.4) {
            const sparkAngle = angle + (Math.random() - 0.5) * 0.8;
            const sparkDistance = 8 + Math.random() * 12;
            const sparkX = bullet.x + Math.cos(sparkAngle) * sparkDistance;
            const sparkY = bullet.y + Math.sin(sparkAngle) * sparkDistance;
            Particle.createExplosion(sparkX, sparkY, '#ffaa00', 1);
        }
        
        // Aura d'�nergie explosive (cercle pulsant)
        this.ctx.save();
        this.ctx.globalAlpha = 0.3 * pulseIntensity;
        this.ctx.strokeStyle = '#ff4400';
        this.ctx.lineWidth = 3 * zoom;
        this.ctx.beginPath();
        this.ctx.arc(screen.x, screen.y, (bullet.radius + 8) * zoom * pulseIntensity, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.restore();
        
        // Distorsion de l'air (effet de chaleur)
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
        
        // Points d'�nergie clignotants sur l'ogive
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
        // Projectile d'orbe plus petit et brillant
        this.ctx.fillStyle = bullet.color;
        this.ctx.shadowColor = bullet.color;
        this.ctx.shadowBlur = 8;
        this.ctx.beginPath();
        this.ctx.arc(screen.x, screen.y, bullet.radius * zoom, 0, Math.PI * 2);
        this.ctx.fill();
    },
    
    drawPellet(bullet, screen, zoom) {
        // Petits projectiles de shotgun
        this.ctx.fillStyle = bullet.color;
        this.ctx.beginPath();
        this.ctx.arc(screen.x, screen.y, bullet.radius * zoom, 0, Math.PI * 2);
        this.ctx.fill();
    },
    
    drawBasicBullet(bullet, screen, zoom) {
        // Projectile de base (code original)
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
            
            // Dessiner l'ennemi selon son type avec des animations
            this.drawEnemyByType(enemy);
            
            this.ctx.restore();
            
            // Barre de vie pour les ennemis multi-HP
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
        
        // === EFFET DE SPAWN ===
        if (enemy.spawning) {
            // Effet de mat�rialisation progressive
            this.ctx.save();
            this.ctx.scale(enemy.spawnScale, enemy.spawnScale);
            
            // Lueur intense pendant le spawn
            this.ctx.shadowColor = baseColor;
            this.ctx.shadowBlur = 25 * (1 - enemy.spawnScale);
            
            // Transparence progressive
            this.ctx.globalAlpha = 0.3 + enemy.spawnScale * 0.7;
            
            // Couleur plus brillante pendant le spawn
            const spawnGlow = Math.sin(Date.now() * 0.02) * 0.3 + 0.7;
            this.ctx.fillStyle = this.lightenColor(baseColor, spawnGlow);
        } else {
            this.ctx.shadowColor = baseColor;
            this.ctx.shadowBlur = 12 * pulseIntensity;
        }
        
        switch(enemy.shape) {
            case 'scout':
                this.drawScout(enemy, baseColor, pulseIntensity);
                break;
            case 'interceptor':
                this.drawInterceptor(enemy, baseColor, pulseIntensity);
                break;
            case 'crusher':
                this.drawCrusher(enemy, baseColor, pulseIntensity);
                break;
            case 'shredder':
                this.drawShredder(enemy, baseColor, pulseIntensity);
                break;
            default:
                // Fallback vers les anciennes formes g�om�triques
                this.drawBasicShape(enemy, baseColor);
        }
        
        if (enemy.spawning) {
            this.ctx.restore();
        }
        
        this.ctx.shadowBlur = 0;
        this.ctx.globalAlpha = 1;
    },
    
    // Utilitaire pour �claircir une couleur pendant le spawn
    lightenColor(color, intensity) {
        // Convertit #f0f en couleur plus brillante
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
        
        // Corps principal triangulaire
        this.ctx.fillStyle = baseColor;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -r);
        this.ctx.lineTo(-r * 0.7, r * 0.5);
        this.ctx.lineTo(r * 0.7, r * 0.5);
        this.ctx.closePath();
        this.ctx.fill();
        
        // R�acteurs clignotants
        const thrusterGlow = enemy.thrusterFlicker > 0.5 ? '#ff8' : '#f84';
        this.ctx.fillStyle = thrusterGlow;
        this.ctx.beginPath();
        this.ctx.arc(-r * 0.4, r * 0.3, r * 0.2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(r * 0.4, r * 0.3, r * 0.2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // D�tecteur avant
        this.ctx.fillStyle = '#0ff';
        this.ctx.beginPath();
        this.ctx.arc(0, -r * 0.5, r * 0.15, 0, Math.PI * 2);
        this.ctx.fill();
    },
    
    drawInterceptor(enemy, baseColor, pulseIntensity) {
        const r = enemy.radius;
        
        this.ctx.save();
        this.ctx.rotate(enemy.rotationAngle);
        
        // Corps en losange
        this.ctx.fillStyle = baseColor;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -r);
        this.ctx.lineTo(r * 0.6, 0);
        this.ctx.lineTo(0, r);
        this.ctx.lineTo(-r * 0.6, 0);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Ailes avec r�acteurs
        this.ctx.fillStyle = '#f66';
        this.ctx.fillRect(-r * 0.9, -r * 0.2, r * 0.4, r * 0.4);
        this.ctx.fillRect(r * 0.5, -r * 0.2, r * 0.4, r * 0.4);
        
        // R�acteurs principales (arri�re)
        const mainThruster = enemy.thrusterFlicker > 0.3 ? '#fff' : '#ff4';
        this.ctx.fillStyle = mainThruster;
        this.ctx.fillRect(-r * 0.3, r * 0.8, r * 0.2, r * 0.4);
        this.ctx.fillRect(r * 0.1, r * 0.8, r * 0.2, r * 0.4);
        
        this.ctx.restore();
        
        // Cockpit
        this.ctx.fillStyle = '#4ff';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2);
        this.ctx.fill();
    },
    
    drawCrusher(enemy, baseColor, pulseIntensity) {
        const r = enemy.radius;
        const armor = Math.sin(enemy.animTime * 0.5) * 0.1 + 0.9;
        
        // Corps hexagonal blind�
        this.ctx.fillStyle = baseColor;
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const x = Math.cos(angle) * r * armor;
            const y = Math.sin(angle) * r * armor;
            if (i === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        }
        this.ctx.closePath();
        this.ctx.fill();
        
        // Plaques d'armure
        this.ctx.strokeStyle = '#aaf';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Tourelle centrale rotative
        this.ctx.save();
        this.ctx.rotate(enemy.rotationAngle * 0.5);
        this.ctx.fillStyle = '#66f';
        this.ctx.fillRect(-r * 0.6, -r * 0.1, r * 1.2, r * 0.2);
        this.ctx.fillRect(-r * 0.1, -r * 0.6, r * 0.2, r * 1.2);
        this.ctx.restore();
        
        // R�acteurs de propulsion
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
        
        // �il central
        this.ctx.fillStyle = '#f84';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, r * 0.2 * pulseIntensity, 0, Math.PI * 2);
        this.ctx.fill();
    },
    
    drawShredder(enemy, baseColor, pulseIntensity) {
        const r = enemy.radius;
        
        this.ctx.save();
        this.ctx.rotate(enemy.rotationAngle * 0.3);
        
        // Corps en �toile avec lames rotatives
        this.ctx.fillStyle = baseColor;
        const spikes = 8;
        this.ctx.beginPath();
        for (let i = 0; i < spikes; i++) {
            const angle = (i * Math.PI * 2) / spikes;
            const radiusVariation = i % 2 === 0 ? r : r * 0.6;
            const x = Math.cos(angle) * radiusVariation;
            const y = Math.sin(angle) * radiusVariation;
            if (i === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        }
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.restore();
        
        // Lames de d�coupe rotatives
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
        
        // Core �nerg�tique central
        const coreColor = Math.sin(enemy.animTime * 2) > 0 ? '#ff0' : '#f80';
        this.ctx.fillStyle = coreColor;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Indicateurs d'armes multiples
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
        // Formes g�om�triques de base pour compatibilit�
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
                    if (i === 0) this.ctx.moveTo(x, y);
                    else this.ctx.lineTo(x, y);
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
                    if (i === 0) this.ctx.moveTo(x, y);
                    else this.ctx.lineTo(x, y);
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
            
            // Dessiner une pi�ce d'or 3D qui tourne
            this.drawGoldCoin(drop);
            
            this.ctx.restore();
            
            // Afficher la valeur pour les pi�ces de haute valeur
            if (drop.value > 1) {
                this.ctx.fillStyle = '#fff';
                this.ctx.font = `${Math.floor(10 * zoom)}px Courier New`;
                this.ctx.textAlign = 'center';
                this.ctx.fillText(drop.value.toString(), screen.x, bobY + 3 * zoom);
            }
        });
    },
    
    drawGoldCoin(drop) {
        // === RENDU SP�CIAL POUR LES LOOT BOXES ===
        if (drop.type === 'lootbox') {
            this.drawLootBox(drop);
            return;
        }
        
        // === RENDU NORMAL POUR LES GEMS ===
        const radius = drop.radius;
        const spin = drop.spinAngle;
        
        // Calcul de l'effet 3D: la pi�ce appara�t plus �troite selon l'angle
        const perspective = Math.abs(Math.cos(spin));
        const width = radius * perspective;
        
        // Couleurs selon l'orientation de la pi�ce
        let mainColor, edgeColor, highlightColor;
        if (Math.cos(spin) > 0.3) {
            // Face visible
            mainColor = drop.colors.BRIGHT;
            edgeColor = drop.colors.MEDIUM;
            highlightColor = '#FFFF88';
        } else if (Math.cos(spin) < -0.3) {
            // Dos visible
            mainColor = drop.colors.MEDIUM;
            edgeColor = drop.colors.DARK;
            highlightColor = drop.colors.BRIGHT;
        } else {
            // Tranche visible
            mainColor = drop.colors.DARK;
            edgeColor = drop.colors.MEDIUM;
            highlightColor = drop.colors.BRIGHT;
        }
        
        // Ombre port�e
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        this.ctx.shadowBlur = 4;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;
        
        // Corps principal de la pi�ce (ellipse)
        this.ctx.fillStyle = mainColor;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, width, radius, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // D�sactiver l'ombre pour les d�tails
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        
        // Bord de la pi�ce
        this.ctx.strokeStyle = edgeColor;
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, width, radius, 0, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Reflet brillant si la face est visible
        if (Math.cos(spin) > 0.1) {
            this.ctx.fillStyle = highlightColor;
            this.ctx.globalAlpha = 0.6;
            this.ctx.beginPath();
            this.ctx.ellipse(-width * 0.3, -radius * 0.3, width * 0.4, radius * 0.4, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        }
        
        // Motif central (pour les pi�ces de haute valeur)
        if (drop.value > 1 && Math.abs(Math.cos(spin)) > 0.5) {
            this.ctx.strokeStyle = edgeColor;
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, width * 0.6, radius * 0.6, 0, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        // Effet de lueur si magn�tis�
        if (drop.magnetized) {
            this.ctx.shadowColor = mainColor;
            this.ctx.shadowBlur = 15;
            this.ctx.strokeStyle = mainColor;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, width, radius, 0, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
        }
    },
    
    // Nouveau rendu pour les loot boxes
    drawLootBox(lootBox) {
        const radius = lootBox.radius;
        const spin = lootBox.spinAngle;
        const floatOffset = Math.sin(lootBox.bobOffset) * 3;
        const glowIntensity = lootBox.glowIntensity || 1.0;
        
        this.ctx.save();
        this.ctx.translate(0, floatOffset);
        this.ctx.rotate(spin * 0.3); // Rotation plus lente
        
        // === LUEUR INTENSIVE ===
        this.ctx.shadowColor = lootBox.colors.BRIGHT;
        this.ctx.shadowBlur = 20 * glowIntensity;
        
        // === CORPS PRINCIPAL DE LA LOOT BOX ===
        // Forme de coffre/cube 3D
        this.ctx.fillStyle = lootBox.colors.MEDIUM;
        this.ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
        
        // Face sup�rieure (effet 3D)
        this.ctx.fillStyle = lootBox.colors.BRIGHT;
        this.ctx.beginPath();
        this.ctx.moveTo(-radius, -radius);
        this.ctx.lineTo(-radius + 4, -radius - 4);
        this.ctx.lineTo(radius + 4, -radius - 4);
        this.ctx.lineTo(radius, -radius);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Face droite (effet 3D)
        this.ctx.fillStyle = lootBox.colors.DARK;
        this.ctx.beginPath();
        this.ctx.moveTo(radius, -radius);
        this.ctx.lineTo(radius + 4, -radius - 4);
        this.ctx.lineTo(radius + 4, radius - 4);
        this.ctx.lineTo(radius, radius);
        this.ctx.closePath();
        this.ctx.fill();
        
        // === SYMBOLE SELON LE TYPE ===
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        let symbol = '?';
        switch(lootBox.lootType) {
            case 'TREASURE':
                symbol = '$';
                break;
            case 'WEAPON':
                symbol = '?';
                break;
            case 'NUKE':
                symbol = '??';
                break;
            case 'MAGNET':
                symbol = '??';
                break;
            case 'ORB_SHIELD':
                symbol = '??';
                break;
            case 'ORB_UPGRADE':
                symbol = '?';
                break;
            case 'UTILITY':
                symbol = '??';
                break;
        }
        
        this.ctx.fillText(symbol, 0, 0);
        
        // === CONTOUR BRILLANT ===
        this.ctx.strokeStyle = lootBox.colors.BRIGHT;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(-radius, -radius, radius * 2, radius * 2);
        
        // === �TINCELLES AUTOUR ===
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
        
        this.ctx.restore();
        this.ctx.shadowBlur = 0;
    },
    
    drawOrbs() {
        const zoom = Camera.getZoom ? Camera.getZoom() : (CONFIG.CAMERA.ZOOM || 1);
        if (!Player.data) return;
        
        Orb.list.forEach(orb => {
            const screen = Camera.worldToScreen(orb.x, orb.y);
            
            this.ctx.fillStyle = orb.color;
            this.ctx.shadowColor = orb.color;
            this.ctx.shadowBlur = 12;
            this.ctx.beginPath();
            this.ctx.arc(screen.x, screen.y, orb.radius * zoom, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });
        
        // Cercle orbital
        if (Orb.list.length > 0) {
            const playerScreen = Camera.worldToScreen(Player.data.x, Player.data.y);
            this.ctx.strokeStyle = CONFIG.ORBS.COLOR + '40';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.arc(playerScreen.x, playerScreen.y, CONFIG.ORBS.DISTANCE * zoom, 0, Math.PI * 2);
            this.ctx.stroke();
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

        // Dessiner l'effet de t�l�portation proc�dural au-dessus des particules
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
        
        // D�tection de hover
        let anyHover = false;
        const left = 100;
        const width = this.canvas.width - 200;
        
        this.ctx.font = '18px Courier New';
        for (let i = 0; i < Upgrades.options.length; i++) {
            const option = Upgrades.options[i];
            const centerY = 250 + i * 80;
            const top = centerY - 30;
            const height = 60;
            const hovered = (Input.mouse.x >= left && Input.mouse.x <= left + width && Input.mouse.y >= top && Input.mouse.y <= top + height);
            if (hovered) anyHover = true;
            
            // Fond hover
            if (hovered) {
                this.ctx.fillStyle = 'rgba(255, 255, 0, 0.12)';
                this.ctx.fillRect(left, top, width, height);
            }
            
            // Cadre
            this.ctx.strokeStyle = hovered ? '#ff0' : '#0f0';
            this.ctx.lineWidth = hovered ? 3 : 2;
            this.ctx.strokeRect(left, top, width, height);
            
            // Texte
            this.ctx.fillStyle = hovered ? '#ff0' : '#0f0';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`${i + 1}. ${option.name}`, left + 20, centerY - 5);
            this.ctx.font = '14px Courier New';
            this.ctx.fillStyle = '#888';
            this.ctx.fillText(option.desc, left + 20, centerY + 15);
            this.ctx.font = '18px Courier New';
        }
        
        // Curseur
        this.canvas.style.cursor = anyHover ? 'pointer' : 'default';
        
        this.ctx.font = '16px Courier New';
        this.ctx.fillStyle = '#fff';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Press 1, 2, 3 or click to choose', this.canvas.width / 2, this.canvas.height - 50);
    },
    
    drawWaveAnnouncement() {
        if (Game.state !== 'waveAnnouncement') return;
        
        // Fond semi-transparent
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Animation de pulsation
        const pulseIntensity = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
        
        // Titre principal
        this.ctx.fillStyle = `rgba(255, 215, 0, ${pulseIntensity})`;
        this.ctx.font = 'bold 48px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.strokeStyle = '#FFA500';
        this.ctx.lineWidth = 3;
        this.ctx.strokeText(`WAVE ${Game.wave}`, this.canvas.width / 2, this.canvas.height / 2 - 40);
        this.ctx.fillText(`WAVE ${Game.wave}`, this.canvas.width / 2, this.canvas.height / 2 - 40);
        
        // Sous-titre
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = '24px Courier New';
        this.ctx.fillText('INCOMING HOSTILES', this.canvas.width / 2, this.canvas.height / 2 + 20);
        
        // Informations de progression
        const enemyCount = Enemy.maxEnemiesPerWave || Math.min(15 + Game.wave * 2.5, 40);
        const difficultyText = Game.wave <= 3 ? 'EASY' : Game.wave <= 6 ? 'MEDIUM' : Game.wave <= 10 ? 'HARD' : 'EXTREME';
        
        this.ctx.fillStyle = '#FFFF88';
        this.ctx.font = '18px Courier New';
        this.ctx.fillText(`Enemies: ${Math.floor(enemyCount)} | Difficulty: ${difficultyText}`, this.canvas.width / 2, this.canvas.height / 2 + 60);
        
        // Barre de progression du timer
        const progress = (180 - Game.waveAnnouncementTimer) / 180;
        const barWidth = 300;
        const barHeight = 6;
        const barX = this.canvas.width / 2 - barWidth / 2;
        const barY = this.canvas.height / 2 + 100;
        
        this.ctx.fillStyle = '#444';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);
    },
    
    drawOffscreenEnemyIndicators() {
        if (!Player.data || Enemy.list.length === 0) return;
        
        const margin = 20; // Distance du bord de l'�cran
        const indicatorSize = 8; // Taille des indicateurs
        
        Enemy.list.forEach(enemy => {
            // V�rifier si l'ennemi est hors �cran
            if (Camera.isVisible(enemy.x, enemy.y, 50)) return;
            
            // Calculer la direction de l'ennemi par rapport au joueur
            const playerScreen = Camera.worldToScreen(Player.data.x, Player.data.y);
            const enemyScreen = Camera.worldToScreen(enemy.x, enemy.y);
            
            // Vecteur du joueur vers l'ennemi
            const dx = enemyScreen.x - playerScreen.x;
            const dy = enemyScreen.y - playerScreen.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance === 0) return;
            
            // Normaliser la direction
            const dirX = dx / distance;
            const dirY = dy / distance;
            
            // Calculer l'intersection avec les bords de l'�cran
            let indicatorX, indicatorY;
            
            // Limites de l'�cran avec marge
            const minX = margin;
            const maxX = this.canvas.width - margin;
            const minY = margin;
            const maxY = this.canvas.height - margin;
            
            // Trouver l'intersection avec le bord de l'�cran
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;
            
            // �chelle pour aller du centre vers les bords
            const scaleX = dirX !== 0 ? Math.abs((dirX > 0 ? maxX : minX) - centerX) / Math.abs(dirX) : Infinity;
            const scaleY = dirY !== 0 ? Math.abs((dirY > 0 ? maxY : minY) - centerY) / Math.abs(dirY) : Infinity;
            
            const scale = Math.min(scaleX, scaleY);
            
            indicatorX = centerX + dirX * scale;
            indicatorY = centerY + dirY * scale;
            
            // S'assurer que l'indicateur reste dans les limites
            indicatorX = Math.max(minX, Math.min(maxX, indicatorX));
            indicatorY = Math.max(minY, Math.min(maxY, indicatorY));
            
            // Dessiner l'indicateur
            this.drawEnemyIndicator(indicatorX, indicatorY, enemy, dirX, dirY);
        });
    },
    
    drawEnemyIndicator(x, y, enemy, dirX, dirY) {
        this.ctx.save();
        
        // Couleur selon le type d'ennemi
        let indicatorColor = enemy.color;
        let pulseIntensity = Math.sin(Date.now() * 0.008) * 0.4 + 0.6;
        
        // Effet de pulsation plus intense pour les ennemis dangereux
        if (enemy.type === 'tank' || enemy.type === 'splitter') {
            pulseIntensity = Math.sin(Date.now() * 0.012) * 0.6 + 0.4;
            indicatorColor = enemy.color;
        }
        
        // Triangle pointant vers l'ennemi
        const size = 8;
        const angle = Math.atan2(dirY, dirX);
        
        this.ctx.translate(x, y);
        this.ctx.rotate(angle);
        
        // Ombre pour la visibilit�
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        this.ctx.shadowBlur = 4;
        this.ctx.shadowOffsetX = 1;
        this.ctx.shadowOffsetY = 1;
        
        // Corps de l'indicateur (triangle)
        this.ctx.fillStyle = indicatorColor;
        this.ctx.globalAlpha = pulseIntensity;
        this.ctx.beginPath();
        this.ctx.moveTo(size, 0);
        this.ctx.lineTo(-size * 0.6, -size * 0.7);
        this.ctx.lineTo(-size * 0.6, size * 0.7);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Contour pour la visibilit�
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = pulseIntensity * 0.8;
        this.ctx.stroke();
        
        // Point central selon le type d'ennemi
        this.ctx.fillStyle = enemy.type === 'tank' ? '#fff' : 
                           enemy.type === 'splitter' ? '#ff0' : 
                           enemy.type === 'fast' ? '#f00' : '#fff';
        this.ctx.globalAlpha = 1;
        this.ctx.beginPath();
        this.ctx.arc(-1, 0, 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    },
    
    drawMiniRadar() {
        if (!Player.data || Enemy.list.length === 0) return;
        
        const radarSize = 80;
        const radarX = this.canvas.width - radarSize - 15;
        const radarY = 15;
        const radarRadius = radarSize / 2;
        
        // Fond du radar
        this.ctx.save();
        this.ctx.globalAlpha = 0.7;
        this.ctx.fillStyle = 'rgba(0, 40, 40, 0.8)';
        this.ctx.beginPath();
        this.ctx.arc(radarX + radarRadius, radarY + radarRadius, radarRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Contour du radar
        this.ctx.strokeStyle = '#0ff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Lignes de grille
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        // Lignes crois�es
        this.ctx.moveTo(radarX, radarY + radarRadius);
        this.ctx.lineTo(radarX + radarSize, radarY + radarRadius);
        this.ctx.moveTo(radarX + radarRadius, radarY);
        this.ctx.lineTo(radarX + radarRadius, radarY + radarSize);
        this.ctx.stroke();
        
        // Cercles concentriques
        this.ctx.beginPath();
        this.ctx.arc(radarX + radarRadius, radarY + radarRadius, radarRadius * 0.5, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Joueur au centre
        this.ctx.fillStyle = '#0ff';
        this.ctx.beginPath();
        this.ctx.arc(radarX + radarRadius, radarY + radarRadius, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Ennemis sur le radar
        const radarRange = 600; // Port�e du radar en unit�s monde
        const scale = radarRadius / radarRange;
        
        Enemy.list.forEach(enemy => {
            const dx = enemy.x - Player.data.x;
            const dy = enemy.y - Player.data.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > radarRange) return;
            
            const enemyRadarX = radarX + radarRadius + dx * scale;
            const enemyRadarY = radarY + radarRadius + dy * scale;
            
            // Couleur selon le type et la distance
            let enemyColor = enemy.color;
            let enemySize = 2;
            
            if (enemy.type === 'tank') {
                enemySize = 3;
                enemyColor = '#84f';
            } else if (enemy.type === 'splitter') {
                enemySize = 2.5;
                enemyColor = '#f80';
            } else if (enemy.type === 'fast') {
                enemySize = 1.5;
                enemyColor = '#f44';
            }
            
            // Pulsation pour les ennemis proches
            if (distance < 150) {
                const pulse = Math.sin(Date.now() * 0.02) * 0.5 + 0.5;
                enemySize += pulse;
                this.ctx.globalAlpha = 0.8 + pulse * 0.2;
            } else {
                this.ctx.globalAlpha = 0.6;
            }
            
            this.ctx.fillStyle = enemyColor;
            this.ctx.beginPath();
            this.ctx.arc(enemyRadarX, enemyRadarY, enemySize, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        this.ctx.restore();
    },
    
    drawDeathFlash() {
        if (Game.state !== 'deathSequence') return;
        const t = Game.deathSequenceTimer / 180; // 0..1
        const alpha = Math.min(0.8, 1 - t); // plus opaque au début
        const grd = this.ctx.createRadialGradient(
            this.canvas.width/2, this.canvas.height/2, 50,
            this.canvas.width/2, this.canvas.height/2, Math.max(this.canvas.width,this.canvas.height)/1.2
        );
        grd.addColorStop(0, `rgba(255,0,40,${alpha*0.55})`);
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        this.ctx.fillStyle = grd;
        this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
        // flash blanc court frame initiale
        if (Game.deathSequenceTimer > 150) {
            const f = (Game.deathSequenceTimer-150)/30; // 1 -> 0
            this.ctx.fillStyle = `rgba(255,255,255,${f*0.6})`;
            this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
        }
    },
    
    render() {
        this.clear();
        Camera.update();

        // R�initialiser le curseur si pas en upgrade
        if (Game.state !== 'upgrade') {
            this.canvas.style.cursor = 'default';
        }

        // Dessiner le sol avant les entit�s
        this.drawFloor();
        
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
    }
};