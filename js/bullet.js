import { CONFIG } from './config.js';
import { Audio } from './audio.js';
import { Input } from './input.js';
import { Player } from './player.js';
import { Camera } from './camera.js';
import { Enemy } from './enemy.js';
import { Particle } from './particle.js';

// Module des projectiles
export const Bullet = {
    list: [],
    
    init() {
        this.list = [];
    },
    
    create(targetEnemy = null) {
        if (!Player.data) return;
        
        let dx, dy;
        
        if (targetEnemy) {
            dx = targetEnemy.x - Player.data.x;
            dy = targetEnemy.y - Player.data.y;
        } else {
            const worldMouse = Camera.screenToWorld(Input.mouse.x, Input.mouse.y);
            dx = worldMouse.x - Player.data.x;
            dy = worldMouse.y - Player.data.y;
        }
        
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance === 0) return;
        
        const normalizedDx = dx / distance;
        const normalizedDy = dy / distance;
        
        // === SYST�ME D'ARMES CUMULATIVES ===
        // Toutes les armes �quip�es tirent en m�me temps !
        
        // Tir de base (toujours actif)
        this.createBasicBullet(normalizedDx, normalizedDy);
        
        // Triple Shot (si �quip�, tir en plus du basic)
        if (Player.data.tripleShot) {
            this.createTripleShot(normalizedDx, normalizedDy);
        }
        
        // Shotgun Blast (si �quip�, tir en plus des autres)
        if (Player.data.shotgunBlast) {
            this.createShotgunBlast(normalizedDx, normalizedDy);
        }
        
        // Missiles � t�te chercheuse (tir suppl�mentaire avec cooldown)
        if (Player.data.homingMissiles && Player.data.missileCooldown <= 0) {
            this.createHomingMissile(targetEnemy);
            Player.data.missileCooldown = CONFIG.WEAPONS.HOMING_MISSILE.COOLDOWN;
        }
        
        // Canon explosif (tir suppl�mentaire avec cooldown)
        if (Player.data.explosiveCannon && Player.data.cannonCooldown <= 0) {
            this.createExplosiveCannon(normalizedDx, normalizedDy);
            Player.data.cannonCooldown = CONFIG.WEAPONS.EXPLOSIVE_CANNON.COOLDOWN;
        }
        
        Audio.playSoundEffect('shoot');
    },
    
    createBasicBullet(dx, dy) {
        this.list.push({
            x: Player.data.x,
            y: Player.data.y,
            vx: dx * Player.data.bulletSpeed,
            vy: dy * Player.data.bulletSpeed,
            radius: Player.data.bulletSize,
            length: Player.data.bulletLength,
            color: '#ff0',
            type: 'basic',
            damage: 1
        });
    },
    
    createTripleShot(dx, dy) {
        const spreadAngle = CONFIG.WEAPONS.TRIPLE_SHOT.SPREAD_ANGLE;
        const speedMult = CONFIG.WEAPONS.TRIPLE_SHOT.SPEED_MULTIPLIER;
        
        for (let i = -1; i <= 1; i++) {
            const angle = Math.atan2(dy, dx) + (i * spreadAngle);
            const bulletDx = Math.cos(angle);
            const bulletDy = Math.sin(angle);
            
            this.list.push({
                x: Player.data.x,
                y: Player.data.y,
                vx: bulletDx * Player.data.bulletSpeed * speedMult,
                vy: bulletDy * Player.data.bulletSpeed * speedMult,
                radius: Player.data.bulletSize * 0.8,
                length: Player.data.bulletLength,
                color: i === 0 ? '#ff0' : '#fa0',
                type: 'triple',
                damage: 0.8
            });
        }
    },
    
    createShotgunBlast(dx, dy) {
        const pellets = CONFIG.WEAPONS.SHOTGUN_BLAST.PELLETS;
        const spread = CONFIG.WEAPONS.SHOTGUN_BLAST.SPREAD;
        const rangeMult = CONFIG.WEAPONS.SHOTGUN_BLAST.RANGE_MULTIPLIER;
        
        for (let i = 0; i < pellets; i++) {
            const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * spread;
            const bulletDx = Math.cos(angle);
            const bulletDy = Math.sin(angle);
            
            this.list.push({
                x: Player.data.x + (Math.random() - 0.5) * 10,
                y: Player.data.y + (Math.random() - 0.5) * 10,
                vx: bulletDx * Player.data.bulletSpeed * (0.8 + Math.random() * 0.4),
                vy: bulletDy * Player.data.bulletSpeed * (0.8 + Math.random() * 0.4),
                radius: Player.data.bulletSize * 0.6,
                length: Player.data.bulletLength * 0.5,
                color: '#fa4',
                type: 'pellet',
                damage: CONFIG.WEAPONS.SHOTGUN_BLAST.DAMAGE_PER_PELLET / 100,
                maxDistance: Player.data.range * rangeMult,
                traveledDistance: 0
            });
        }
    },
    
    createHomingMissile(targetEnemy) {
        this.list.push({
            x: Player.data.x,
            y: Player.data.y,
            vx: 0,
            vy: 0,
            radius: 4,
            length: 12,
            color: '#f4f',
            type: 'homing',
            damage: CONFIG.WEAPONS.HOMING_MISSILE.DAMAGE / 100,
            target: targetEnemy,
            speed: CONFIG.WEAPONS.HOMING_MISSILE.SPEED,
            turnRate: CONFIG.WEAPONS.HOMING_MISSILE.TURN_RATE,
            trail: []
        });
    },
    
    createExplosiveCannon(dx, dy) {
        this.list.push({
            x: Player.data.x,
            y: Player.data.y,
            vx: dx * CONFIG.WEAPONS.EXPLOSIVE_CANNON.SPEED,
            vy: dy * CONFIG.WEAPONS.EXPLOSIVE_CANNON.SPEED,
            radius: 6,
            length: 15,
            color: '#f84',
            type: 'explosive',
            damage: CONFIG.WEAPONS.EXPLOSIVE_CANNON.DAMAGE / 100,
            blastRadius: CONFIG.WEAPONS.EXPLOSIVE_CANNON.BLAST_RADIUS
        });
    },
    
    createOrbBullet(orb, dx, dy) {
        this.list.push({
            x: orb.x,
            y: orb.y,
            vx: dx * CONFIG.ORBS.BULLET_SPEED,
            vy: dy * CONFIG.ORBS.BULLET_SPEED,
            radius: 2,
            length: 6,
            color: orb.color,
            type: 'orb',
            damage: CONFIG.ORBS.BULLET_DAMAGE / 100,
            fromOrb: true
        });
    },
    
    update() {
        // R�duire les cooldowns
        if (Player.data.missileCooldown > 0) Player.data.missileCooldown--;
        if (Player.data.cannonCooldown > 0) Player.data.cannonCooldown--;
        
        for (let i = this.list.length - 1; i >= 0; i--) {
            const bullet = this.list[i];
            
            // Mise � jour selon le type
            this.updateBulletByType(bullet);
            
            // Supprimer les balles qui sortent du monde
            if (bullet.x < -50 || bullet.x > CONFIG.WORLD.WIDTH + 50 || 
                bullet.y < -50 || bullet.y > CONFIG.WORLD.HEIGHT + 50) {
                this.list.splice(i, 1);
                continue;
            }
            
            // V�rifier la distance maximale pour les pellets
            if (bullet.type === 'pellet') {
                bullet.traveledDistance += Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy);
                if (bullet.traveledDistance > bullet.maxDistance) {
                    this.list.splice(i, 1);
                    continue;
                }
            }
            
            // Collision avec les ennemis
            let hitEnemy = false;
            for (let j = Enemy.list.length - 1; j >= 0; j--) {
                const enemy = Enemy.list[j];
                const distance = Math.sqrt((bullet.x - enemy.x) ** 2 + (bullet.y - enemy.y) ** 2);
                
                if (distance < bullet.radius + enemy.radius) {
                    // Effet d'explosion pour les projectiles explosifs
                    if (bullet.type === 'explosive') {
                        this.createExplosion(bullet.x, bullet.y, bullet.blastRadius, bullet.damage);
                    } else {
                        Enemy.takeDamage(enemy, bullet.damage);
                    }
                    
                    this.list.splice(i, 1);
                    hitEnemy = true;
                    break;
                }
            }
            
            if (hitEnemy) continue;
        }
    },
    
    updateBulletByType(bullet) {
        switch(bullet.type) {
            case 'homing':
                this.updateHomingMissile(bullet);
                break;
            default:
                bullet.x += bullet.vx;
                bullet.y += bullet.vy;
                break;
        }
    },
    
    updateHomingMissile(bullet) {
        // Ajouter � la tra�n�e
        bullet.trail.push({x: bullet.x, y: bullet.y});
        if (bullet.trail.length > 8) bullet.trail.shift();
        
        // Trouver une cible si on n'en a pas ou si elle est morte
        if (!bullet.target || !Enemy.list.includes(bullet.target)) {
            const nearest = Enemy.findNearest();
            bullet.target = nearest ? nearest.enemy : null;
        }
        
        if (bullet.target) {
            // Calculer la direction vers la cible
            const dx = bullet.target.x - bullet.x;
            const dy = bullet.target.y - bullet.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                const targetDx = dx / distance;
                const targetDy = dy / distance;
                
                // Rotation progressive vers la cible
                const currentAngle = Math.atan2(bullet.vy, bullet.vx);
                const targetAngle = Math.atan2(targetDy, targetDx);
                
                let angleDiff = targetAngle - currentAngle;
                if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                
                const newAngle = currentAngle + Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), bullet.turnRate);
                
                bullet.vx = Math.cos(newAngle) * bullet.speed;
                bullet.vy = Math.sin(newAngle) * bullet.speed;
            }
        }
        
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
    },
    
    createExplosion(x, y, radius, damage) {
        // Stocker les coordonn�es pour �viter les probl�mes avec setTimeout
        const explosionX = x;
        const explosionY = y;
        
        // D�g�ts d'explosion en zone
        Enemy.list.forEach(enemy => {
            const distance = Math.sqrt((enemy.x - explosionX) ** 2 + (enemy.y - explosionY) ** 2);
            if (distance < radius) {
                const damageRatio = 1 - (distance / radius);
                Enemy.takeDamage(enemy, damage * damageRatio);
            }
        });
        
        // Effets visuels
        Particle.createExplosion(explosionX, explosionY, '#ff4400', 15);
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const explosionRadius = 10 + i * 15;
                const particleCount = 8;
                for (let j = 0; j < particleCount; j++) {
                    const angle = (j * Math.PI * 2) / particleCount;
                    const px = explosionX + Math.cos(angle) * explosionRadius;
                    const py = explosionY + Math.sin(angle) * explosionRadius;
                    Particle.createExplosion(px, py, '#ff6600', 4);
                }
            }, i * 100);
        }
        
        Audio.playSoundEffect('explosion');
    }
};