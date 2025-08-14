// Module de rendu
const Renderer = {
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

        // Points aux intersections (léger motif)
        const dotSize = CONFIG.FLOOR.DOT_SIZE;
        this.ctx.fillStyle = CONFIG.FLOOR.DOT_COLOR;
        for (let x = startWorldX; x <= endWorldX; x += tile) {
            for (let y = startWorldY; y <= endWorldY; y += tile) {
                const idx = Math.floor(x / tile);
                const idy = Math.floor(y / tile);
                // Pour alléger, ne dessiner des points que sur une sous-grille (ex: un sur deux)
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
        
        // Effet d'invulnérabilité
        if (Player.data.invulnerable) {
            const flash = Math.sin(Date.now() * 0.02) > 0;
            if (flash) {
                this.ctx.shadowColor = '#fff';
                this.ctx.shadowBlur = 25;
            } else {
                this.ctx.shadowColor = Player.data.color;
                this.ctx.shadowBlur = 15;
            }
        } else {
            this.ctx.shadowColor = Player.data.color;
            this.ctx.shadowBlur = 15;
        }
        
        const robotColor = Player.data.invulnerable && Math.sin(Date.now() * 0.02) > 0 ? '#fff' : '#0ff';
        const bodyColor = Player.data.invulnerable && Math.sin(Date.now() * 0.02) > 0 ? '#fff' : '#0dd';
        const detailColor = Player.data.invulnerable && Math.sin(Date.now() * 0.02) > 0 ? '#fff' : '#0aa';
        
        // Corps du robot
        this.ctx.fillStyle = robotColor;
        this.ctx.fillRect(-8, -10, 16, 20);
        
        // Tête
        this.ctx.fillStyle = bodyColor;
        this.ctx.fillRect(-6, -14, 12, 6);
        
        // Yeux
        this.ctx.fillStyle = '#ff0';
        this.ctx.fillRect(-4, -12, 2, 2);
        this.ctx.fillRect(2, -12, 2, 2);
        
        // Armes sur les épaules
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
        });
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
        
        this.ctx.shadowColor = baseColor;
        this.ctx.shadowBlur = 12 * pulseIntensity;
        
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
                // Fallback vers les anciennes formes géométriques
                this.drawBasicShape(enemy, baseColor);
        }
        
        this.ctx.shadowBlur = 0;
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
        
        // Réacteurs clignotants
        const thrusterGlow = enemy.thrusterFlicker > 0.5 ? '#ff8' : '#f84';
        this.ctx.fillStyle = thrusterGlow;
        this.ctx.beginPath();
        this.ctx.arc(-r * 0.4, r * 0.3, r * 0.2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(r * 0.4, r * 0.3, r * 0.2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Détecteur avant
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
        
        // Ailes avec réacteurs
        this.ctx.fillStyle = '#f66';
        this.ctx.fillRect(-r * 0.9, -r * 0.2, r * 0.4, r * 0.4);
        this.ctx.fillRect(r * 0.5, -r * 0.2, r * 0.4, r * 0.4);
        
        // Réacteurs principales (arrière)
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
        
        // Corps hexagonal blindé
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
        
        // Réacteurs de propulsion
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
        
        // Œil central
        this.ctx.fillStyle = '#f84';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, r * 0.2 * pulseIntensity, 0, Math.PI * 2);
        this.ctx.fill();
    },
    
    drawShredder(enemy, baseColor, pulseIntensity) {
        const r = enemy.radius;
        
        this.ctx.save();
        this.ctx.rotate(enemy.rotationAngle * 0.3);
        
        // Corps en étoile avec lames rotatives
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
        
        // Lames de découpe rotatives
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
        
        // Core énergétique central
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
        // Formes géométriques de base pour compatibilité
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
            
            // Dessiner une pièce d'or 3D qui tourne
            this.drawGoldCoin(drop);
            
            this.ctx.restore();
            
            // Afficher la valeur pour les pièces de haute valeur
            if (drop.value > 1) {
                this.ctx.fillStyle = '#fff';
                this.ctx.font = `${Math.floor(10 * zoom)}px Courier New`;
                this.ctx.textAlign = 'center';
                this.ctx.fillText(drop.value.toString(), screen.x, bobY + 3 * zoom);
            }
        });
    },
    
    drawGoldCoin(drop) {
        const radius = drop.radius;
        const spin = drop.spinAngle;
        
        // Calcul de l'effet 3D: la pièce apparaît plus étroite selon l'angle
        const perspective = Math.abs(Math.cos(spin));
        const width = radius * perspective;
        
        // Couleurs selon l'orientation de la pièce
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
        
        // Ombre portée
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        this.ctx.shadowBlur = 4;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;
        
        // Corps principal de la pièce (ellipse)
        this.ctx.fillStyle = mainColor;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, width, radius, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Désactiver l'ombre pour les détails
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        
        // Bord de la pièce
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
        
        // Motif central (pour les pièces de haute valeur)
        if (drop.value > 1 && Math.abs(Math.cos(spin)) > 0.5) {
            this.ctx.strokeStyle = edgeColor;
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, width * 0.6, radius * 0.6, 0, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        // Effet de lueur si magnétisé
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

        // Dessiner l'effet de téléportation procédural au-dessus des particules
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
        
        // Détection de hover
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
    
    render() {
        this.clear();
        Camera.update();

        // Réinitialiser le curseur si pas en upgrade
        if (Game.state !== 'upgrade') {
            this.canvas.style.cursor = 'default';
        }

        // Dessiner le sol avant les entités
        this.drawFloor();
        
        this.drawPlayer();
        this.drawBullets();
        this.drawEnemies();
        this.drawCurrency();
        this.drawOrbs();
        this.drawParticles();
        this.drawUpgradeScreen();
    }
};