// Module de rendu
const Renderer = {
    canvas: null,
    ctx: null,
    
    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
    },
    
    clear() {
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    },
    
    drawPlayer() {
        if (!Player.data) return;
        
        const screen = Camera.worldToScreen(Player.data.x, Player.data.y);
        
        this.ctx.save();
        this.ctx.translate(screen.x, screen.y);
        
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
        Bullet.list.forEach(bullet => {
            const screen = Camera.worldToScreen(bullet.x, bullet.y);
            
            if (!Camera.isVisible(bullet.x, bullet.y, 20)) return;
            
            this.ctx.strokeStyle = bullet.color;
            this.ctx.shadowColor = bullet.color;
            this.ctx.shadowBlur = 8;
            this.ctx.lineWidth = bullet.radius;
            this.ctx.lineCap = 'round';
            
            const angle = Math.atan2(bullet.vy, bullet.vx);
            const length = bullet.length;
            
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
        Enemy.list.forEach(enemy => {
            const screen = Camera.worldToScreen(enemy.x, enemy.y);
            
            if (!Camera.isVisible(enemy.x, enemy.y, 50)) return;
            
            this.ctx.save();
            this.ctx.translate(screen.x, screen.y);
            
            this.ctx.shadowColor = enemy.color;
            this.ctx.shadowBlur = 12;
            this.ctx.fillStyle = enemy.color;
            
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
            this.ctx.restore();
            this.ctx.shadowBlur = 0;
            
            // Barre de vie pour les ennemis multi-HP
            if (enemy.maxHealth > 1) {
                const barWidth = enemy.radius * 2;
                const barHeight = 3;
                const barY = screen.y - enemy.radius - 10;
                
                this.ctx.fillStyle = '#444';
                this.ctx.fillRect(screen.x - barWidth/2, barY, barWidth, barHeight);
                
                const healthPercent = enemy.health / enemy.maxHealth;
                this.ctx.fillStyle = healthPercent > 0.5 ? '#0f0' : '#f80';
                this.ctx.fillRect(screen.x - barWidth/2, barY, barWidth * healthPercent, barHeight);
            }
        });
    },
    
    drawCurrency() {
        Currency.list.forEach(drop => {
            const screen = Camera.worldToScreen(drop.x, drop.y);
            const bobY = screen.y + Math.sin(drop.bobOffset) * 2;
            
            this.ctx.fillStyle = drop.color;
            this.ctx.shadowColor = drop.color;
            this.ctx.shadowBlur = drop.magnetized ? 15 : 8;
            this.ctx.beginPath();
            this.ctx.arc(screen.x, bobY, drop.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
            
            if (drop.value > 1) {
                this.ctx.fillStyle = '#fff';
                this.ctx.font = '10px Courier New';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(drop.value.toString(), screen.x, bobY + 3);
            }
        });
    },
    
    drawOrbs() {
        if (!Player.data) return;
        
        Orb.list.forEach(orb => {
            const screen = Camera.worldToScreen(orb.x, orb.y);
            
            this.ctx.fillStyle = orb.color;
            this.ctx.shadowColor = orb.color;
            this.ctx.shadowBlur = 12;
            this.ctx.beginPath();
            this.ctx.arc(screen.x, screen.y, orb.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });
        
        // Cercle orbital
        if (Orb.list.length > 0) {
            const playerScreen = Camera.worldToScreen(Player.data.x, Player.data.y);
            this.ctx.strokeStyle = CONFIG.ORBS.COLOR + '40';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.arc(playerScreen.x, playerScreen.y, CONFIG.ORBS.DISTANCE, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    },
    
    drawParticles() {
        Particle.list.forEach(particle => {
            const screen = Camera.worldToScreen(particle.x, particle.y);
            const alpha = particle.life / particle.maxLife;
            this.ctx.fillStyle = particle.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
            this.ctx.beginPath();
            this.ctx.arc(screen.x, screen.y, particle.radius * alpha, 0, Math.PI * 2);
            this.ctx.fill();
        });
    },
    
    drawUpgradeScreen() {
        if (Game.state !== 'upgrade') return;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#0f0';
        this.ctx.font = '32px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('LEVEL UP!', this.canvas.width / 2, 150);
        
        this.ctx.font = '18px Courier New';
        for (let i = 0; i < Upgrades.options.length; i++) {
            const option = Upgrades.options[i];
            const y = 250 + i * 80;
            
            this.ctx.strokeStyle = '#0f0';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(100, y - 30, this.canvas.width - 200, 60);
            
            this.ctx.fillStyle = '#0f0';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`${i + 1}. ${option.name}`, 120, y - 5);
            this.ctx.font = '14px Courier New';
            this.ctx.fillStyle = '#888';
            this.ctx.fillText(option.desc, 120, y + 15);
            this.ctx.font = '18px Courier New';
            this.ctx.fillStyle = '#0f0';
        }
        
        this.ctx.font = '16px Courier New';
        this.ctx.fillStyle = '#fff';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Press 1, 2, or 3 to choose', this.canvas.width / 2, this.canvas.height - 50);
    },
    
    render() {
        this.clear();
        Camera.update();
        
        this.drawPlayer();
        this.drawBullets();
        this.drawEnemies();
        this.drawCurrency();
        this.drawOrbs();
        this.drawParticles();
        this.drawUpgradeScreen();
    }
};