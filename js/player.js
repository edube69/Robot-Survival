import { CONFIG } from './config.js';
import { Audio } from './audio.js';
import { Input } from './input.js';
import { Camera } from './camera.js';
import { Enemy } from './enemy.js';
import { Bullet } from './bullet.js';
import { Particle } from './particle.js';
import { Orb } from './orb.js';


// Module du joueur
export const Player = {
    data: null,
    bulletCooldown: 0,
    
    init() {
        this.reset();
    },
    
    reset() {
        this.data = {
            x: CONFIG.WORLD.WIDTH / 2,
            y: CONFIG.WORLD.HEIGHT / 2,
            radius: CONFIG.PLAYER.RADIUS,
            speed: CONFIG.PLAYER.SPEED,
            color: CONFIG.PLAYER.COLOR,
            fireRate: CONFIG.PLAYER.FIRE_RATE,
            bulletSpeed: CONFIG.PLAYER.BULLET_SPEED,
            bulletSize: CONFIG.PLAYER.BULLET_SIZE,
            bulletLength: CONFIG.PLAYER.BULLET_LENGTH,
            range: CONFIG.PLAYER.RANGE,
            magnetRange: CONFIG.PLAYER.MAGNET_RANGE,
            followMouse: true,
            orbCount: 0,
            orbDamage: CONFIG.ORBS.DAMAGE,
            orbSpeed: 1.0, // Multiplicateur de vitesse des orbes
            invulnerable: false,
            invulnerableTime: 0,
            vampiric: false,
            flameMode: false,
            // Nouveaux syst�mes d'armes
            tripleShot: false,
            homingMissiles: false,
            explosiveCannon: false,
            laserBeam: false,
            shotgunBlast: false,
            // Cooldowns pour armes sp�ciales
            missileCooldown: 0,
            cannonCooldown: 0,
            laserEnergy: 100
        };
        this.bulletCooldown = 0;
    },
    
    update() {
        if (Game.state !== 'playing' || !this.data) return;
        
        // Gestion de l'invuln�rabilit�
        if (this.data.invulnerable && this.data.invulnerableTime > 0) {
            this.data.invulnerableTime--;
            if (this.data.invulnerableTime <= 0) {
                this.data.invulnerable = false;
            }
        }
        
        this.handleMovement();
        this.handleShooting();
    },
    
    handleMovement() {
        let moveX = 0, moveY = 0;
        
        if (this.data.followMouse) {
            // Convertir la position de la souris en coordonn�es du monde
            const worldMouse = Camera.screenToWorld(Input.mouse.x, Input.mouse.y);
            
            const dx = worldMouse.x - this.data.x;
            const dy = worldMouse.y - this.data.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 20) {
                const normalizedSpeed = Math.min(distance / 100, 1);
                moveX = (dx / distance) * this.data.speed * normalizedSpeed;
                moveY = (dy / distance) * this.data.speed * normalizedSpeed;
            }
        } else {
            // Mouvement WASD
            if (Input.isKeyPressed('w') || Input.isKeyPressed('arrowup')) moveY -= this.data.speed;
            if (Input.isKeyPressed('s') || Input.isKeyPressed('arrowdown')) moveY += this.data.speed;
            if (Input.isKeyPressed('a') || Input.isKeyPressed('arrowleft')) moveX -= this.data.speed;
            if (Input.isKeyPressed('d') || Input.isKeyPressed('arrowright')) moveX += this.data.speed;
            
            // Normaliser la vitesse diagonale
            if (moveX !== 0 && moveY !== 0) {
                moveX *= 0.707;
                moveY *= 0.707;
            }
        }
        
        // Appliquer le mouvement
        this.data.x += moveX;
        this.data.y += moveY;
        
        // Garder le joueur dans les limites du monde
        this.data.x = Math.max(this.data.radius, Math.min(CONFIG.WORLD.WIDTH - this.data.radius, this.data.x));
        this.data.y = Math.max(this.data.radius, Math.min(CONFIG.WORLD.HEIGHT - this.data.radius, this.data.y));
    },
    
    handleShooting() {
        if (this.bulletCooldown <= 0) {
            const nearestResult = Enemy.findNearest();
            if (nearestResult && nearestResult.distance < this.data.range) {
                Bullet.create(nearestResult.enemy);
                this.bulletCooldown = this.data.fireRate;
            }
        }
        if (this.bulletCooldown > 0) this.bulletCooldown--;
    },
    
    findSafeSpawnLocation() {
        // Chercher une position avec le moins d'ennemis proches
        const candidates = [];
        const gridSize = 8;
        const cellWidth = CONFIG.WORLD.WIDTH / gridSize;
        const cellHeight = CONFIG.WORLD.HEIGHT / gridSize;
        
        for (let i = 1; i < gridSize - 1; i++) {
            for (let j = 1; j < gridSize - 1; j++) {
                const x = i * cellWidth + cellWidth / 2;
                const y = j * cellHeight + cellHeight / 2;
                
                // Compter les ennemis dans un rayon de s�curit�
                let enemyCount = 0;
                const safeRadius = 200;
                
                Enemy.list.forEach(enemy => {
                    const distance = Math.sqrt((enemy.x - x) ** 2 + (enemy.y - y) ** 2);
                    if (distance < safeRadius) {
                        enemyCount++;
                    }
                });
                
                candidates.push({ x, y, enemyCount });
            }
        }
        
        // Trier par nombre d'ennemis (moins d'ennemis = mieux)
        candidates.sort((a, b) => a.enemyCount - b.enemyCount);
        
        // Prendre une des 3 meilleures positions au hasard
        const bestCandidates = candidates.slice(0, Math.min(3, candidates.length));
        const chosen = bestCandidates[Math.floor(Math.random() * bestCandidates.length)];
        
        return chosen || { x: CONFIG.WORLD.WIDTH / 2, y: CONFIG.WORLD.HEIGHT / 2 };
    },
    
    takeDamage() {
        if (this.data.invulnerable) return false;
        
        // D�clencher la s�quence de mort dramatique
        this.createDeathExplosion();
        
        Game.lives--;
        
        // Jouer le son de mort dramatique au lieu du simple playerHit
        Audio.playSoundEffect('playerDeath');
        
        // D�marrer la s�quence de ralenti dramatique
        Game.startDeathSequence();
        
        return true;
    },
    
    createTeleportationEffect(targetX, targetY) {
        // Effet de t�l�portation optimis� et plus fluide
        
        // 1. Portal d'ouverture simplifi� (r�duite de 25 � 15 particules)
        Particle.createExplosion(targetX, targetY, '#00ffff', 15);
        
        // 2. Anneaux �nerg�tiques concentriques (3 au lieu de 5)
        for (let ring = 0; ring < 3; ring++) {
            setTimeout(() => {
                const radius = 25 + ring * 20;
                const particleCount = 8 + ring; // R�duite: 8, 9, 10 particules
                
                for (let i = 0; i < particleCount; i++) {
                    const angle = (i * Math.PI * 2) / particleCount;
                    const x = targetX + Math.cos(angle) * radius;
                    const y = targetY + Math.sin(angle) * radius;
                    
                    Particle.createExplosion(x, y, '#44ffff', 4); // R�duite de 8 � 4
                }
            }, ring * 100);
        }
        
        // 3. Spirales �nerg�tiques simplifi�es (2 au lieu de 3, 12 au lieu de 20)
        for (let spiral = 0; spiral < 2; spiral++) {
            for (let i = 0; i < 12; i++) {
                setTimeout(() => {
                    const progress = i / 12;
                    const angle = spiral * Math.PI + progress * Math.PI * 4;
                    const distance = 80 * (1 - progress);
                    const x = targetX + Math.cos(angle) * distance;
                    const y = targetY + Math.sin(angle) * distance;
                    
                    const colors = ['#00ffff', '#44ffff', '#88ffff'];
                    const color = colors[Math.floor(progress * colors.length)];
                    Particle.createExplosion(x, y, color, 3); // R�duite de 6 � 3
                }, spiral * 60 + i * 25);
            }
        }
        
        // 4. Colonnes d'�nergie simplifi�es (6 au lieu de 8, 4 au lieu de 6 �tages)
        for (let col = 0; col < 6; col++) {
            setTimeout(() => {
                const angle = (col * Math.PI * 2) / 6;
                const baseX = targetX + Math.cos(angle) * 35;
                const baseY = targetY + Math.sin(angle) * 35;
                
                for (let height = 0; height < 4; height++) {
                    setTimeout(() => {
                        const x = baseX + (Math.random() - 0.5) * 8;
                        const y = baseY + (Math.random() - 0.5) * 8;
                        Particle.createExplosion(x, y, '#66ffff', 6); // R�duite de 10 � 6
                    }, height * 40);
                }
            }, col * 80);
        }
        
        // 5. Explosion finale de mat�rialisation (r�duite)
        setTimeout(() => {
            Particle.createExplosion(targetX, targetY, '#ffffff', 25); // R�duite de 40 � 25
        }, 400); // Plus t�t: 400ms au lieu de 500ms
        
        // 6. Ondes de choc simplifi�es (2 au lieu de 3)
        setTimeout(() => {
            for (let wave = 0; wave < 2; wave++) {
                setTimeout(() => {
                    const radius = 50 + wave * 30;
                    const particleCount = 12; // R�duite de 16 � 12
                    
                    for (let i = 0; i < particleCount; i++) {
                        const angle = (i * Math.PI * 2) / particleCount;
                        const x = targetX + Math.cos(angle) * radius;
                        const y = targetY + Math.sin(angle) * radius;
                        
                        Particle.createExplosion(x, y, '#00ccff', 3); // R�duite de 5 � 3
                    }
                }, wave * 120);
            }
        }, 500);
        
        // 7. Particules flottantes r�duites (15 au lieu de 30)
        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * 60; // R�duite de 80 � 60
                const x = targetX + Math.cos(angle) * distance;
                const y = targetY + Math.sin(angle) * distance;
                
                const floatColors = ['#88ffff', '#aaffff'];
                const color = floatColors[Math.floor(Math.random() * floatColors.length)];
                Particle.createExplosion(x, y, color, 2); // R�duite de 4 � 2
            }, 300 + Math.random() * 400); // Dur�e r�duite
        }
        
        // 8. �clairs simplifi�s (4 au lieu de 6, 6 au lieu de 8 segments)
        setTimeout(() => {
            for (let bolt = 0; bolt < 4; bolt++) {
                const angle = (bolt * Math.PI * 2) / 4;
                const endX = targetX + Math.cos(angle) * 50;
                const endY = targetY + Math.sin(angle) * 50;
                
                // Cr�er un �clair en segments r�duits
                for (let segment = 0; segment < 6; segment++) {
                    const progress = segment / 6;
                    const x = targetX + (endX - targetX) * progress + (Math.random() - 0.5) * 15;
                    const y = targetY + (endY - targetY) * progress + (Math.random() - 0.5) * 15;
                    
                    setTimeout(() => {
                        Particle.createExplosion(x, y, '#ffff88', 2); // R�duite de 3 � 2
                    }, segment * 15);
                }
            }
        }, 150);
    },
    
    createDeathExplosion() {
        const centerX = this.data.x;
        const centerY = this.data.y;
        
        // EXPLOSION MASSIVE avec beaucoup plus de particules
        
        // Explosion principale gigantesque (imm�diate)
        Particle.createExplosion(centerX, centerY, '#ff2222', 80);
        
        // Premi�re onde - cercle rapproch� avec plus d'explosions
        for (let i = 0; i < 20; i++) {
            const angle = (i * Math.PI * 2) / 20;
            const radius = 20 + Math.random() * 25;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            setTimeout(() => {
                Particle.createExplosion(x, y, '#ff4444', 25);
            }, 30 + i * 20);
        }
        
        // Deuxi�me onde - cercle moyen avec variations
        for (let i = 0; i < 16; i++) {
            const angle = (i * Math.PI * 2) / 16 + Math.PI / 16;
            const radius = 45 + Math.random() * 35;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            setTimeout(() => {
                Particle.createExplosion(x, y, '#ff6644', 30);
            }, 150 + i * 40);
        }
        
        // Troisi�me onde - cercle large
        for (let i = 0; i < 12; i++) {
            const angle = (i * Math.PI * 2) / 12;
            const radius = 75 + Math.random() * 40;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            setTimeout(() => {
                Particle.createExplosion(x, y, '#ff8844', 22);
            }, 350 + i * 60);
        }
        
        // Quatri�me onde - explosion lointaine
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8 + Math.PI / 8;
            const radius = 110 + Math.random() * 50;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            setTimeout(() => {
                Particle.createExplosion(x, y, '#ffaa66', 18);
            }, 600 + i * 80);
        }
        
        // �NORM�MENT de d�bris/fragments en vagues successives
        for (let wave = 0; wave < 5; wave++) {
            for (let i = 0; i < 25; i++) {
                setTimeout(() => {
                    const angle = Math.random() * Math.PI * 2;
                    const distance = 30 + wave * 25 + Math.random() * 60;
                    const x = centerX + Math.cos(angle) * distance;
                    const y = centerY + Math.sin(angle) * distance;
                    
                    const colors = ['#ffaa44', '#ff6644', '#ff8866', '#ffcc88', '#ff4422', '#ffdd99'];
                    const color = colors[Math.floor(Math.random() * colors.length)];
                    Particle.createExplosion(x, y, color, 12);
                }, wave * 150 + Math.random() * 300);
            }
        }
        
        // Ondes de choc multiples plus intenses
        setTimeout(() => {
            Particle.createExplosion(centerX, centerY, '#ffff44', 70);
        }, 200);
        
        setTimeout(() => {
            Particle.createExplosion(centerX, centerY, '#ffff88', 85);
        }, 400);
        
        setTimeout(() => {
            Particle.createExplosion(centerX, centerY, '#ffffff', 100);
        }, 700);
        
        // Explosion finale MASSIVE
        setTimeout(() => {
            Particle.createExplosion(centerX, centerY, '#ffffdd', 120);
        }, 1000);
        
        // Pluie d'�tincelles qui continue longtemps
        for (let i = 0; i < 60; i++) {
            setTimeout(() => {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * 150;
                const x = centerX + Math.cos(angle) * distance;
                const y = centerY + Math.sin(angle) * distance;
                
                const sparkColors = ['#ff9944', '#ffaa55', '#ffbb66', '#ffcc77'];
                const color = sparkColors[Math.floor(Math.random() * sparkColors.length)];
                Particle.createExplosion(x, y, color, 6);
            }, 500 + Math.random() * 1200);
        }
        
        // Explosions de r�sonance tardives (effet d'onde de choc)
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                const angle = Math.random() * Math.PI * 2;
                const distance = 80 + Math.random() * 80;
                const x = centerX + Math.cos(angle) * distance;
                const y = centerY + Math.sin(angle) * distance;
                
                Particle.createExplosion(x, y, '#ffddaa', 15);
            }, 800 + i * 150);
        }
    },
    
    toggleMouseMode() {
        this.data.followMouse = !this.data.followMouse;
    },
    
    upgrade(type, value) {
        switch(type) {
            case 'fireRate':
                const newFireRate = this.data.fireRate - value;
                // Limite minimum plus basse pour permettre plus d'am�liorations
                this.data.fireRate = Math.max(3, newFireRate);
                console.log(`Fire rate upgraded: ${this.data.fireRate} (reduced by ${value})`);
                break;
            case 'speed':
                this.data.speed += value;
                break;
            case 'bulletSpeed':
                this.data.bulletSpeed += value;
                break;
            case 'range':
                this.data.range += value;
                break;
            case 'orbCount':
                this.data.orbCount++;
                Orb.create();
                break;
            case 'orbSpeed':
                this.data.orbSpeed += value;
                console.log(`Orb speed upgraded: ${this.data.orbSpeed.toFixed(2)}x`);
                break;
            case 'orbShooting':
                Orb.enableShooting();
                console.log('Orbs now equipped with weapons!');
                break;
            case 'tripleShot':
                this.data.tripleShot = true;
                console.log('Triple shot enabled!');
                break;
            case 'homingMissiles':
                this.data.homingMissiles = true;
                console.log('Homing missiles enabled!');
                break;
            case 'explosiveCannon':
                this.data.explosiveCannon = true;
                console.log('Explosive cannon enabled!');
                break;
            case 'laserBeam':
                this.data.laserBeam = true;
                console.log('Laser beam enabled!');
                break;
            case 'shotgunBlast':
                this.data.shotgunBlast = true;
                console.log('Shotgun blast enabled!');
                break;
            case 'magnetRange':
                this.data.magnetRange += value;
                console.log(`Magnet range upgraded: ${this.data.magnetRange} pixels`);
                break;
            case 'invulnerability':
                this.data.invulnerable = true;
                this.data.invulnerableTime = value;
                break;
            case 'vampiric':
                this.data.vampiric = true;
                break;
        }
    }
};