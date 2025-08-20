import { CONFIG } from './config.js';
import { Audio } from './audio.js';
import { Player } from './player.js';
import { Enemy } from './enemy.js';
import { Bullet } from './bullet.js';
import { Particle } from './particle.js';

// Module des orbes orbitales
export const Orb = {
    list: [],
    time: 0,
    shootingEnabled: false,
    
    init() {
        this.list = [];
        this.time = 0;
        this.shootingEnabled = false;
    },
    
    enableShooting() {
        this.shootingEnabled = true;
        // �quiper toutes les orbes existantes
        this.list.forEach(orb => {
            orb.shootingCooldown = Math.random() * CONFIG.ORBS.SHOOTING_RATE; // D�calage al�atoire
            orb.canShoot = true;
        });
    },
    
    create() {
        if (!Player.data) return;
        
        // Calculer quelle orbite et position pour cette nouvelle orbe
        const orbPosition = this.calculateOrbPosition();
        
        this.list.push({
            angle: orbPosition.angle,
            radius: CONFIG.ORBS.RADIUS,
            distance: orbPosition.distance,
            orbitIndex: orbPosition.orbitIndex,
            positionInOrbit: orbPosition.positionInOrbit,
            color: this.getOrbColor(orbPosition.orbitIndex),
            damage: Player.data.orbDamage,
            x: 0,
            y: 0,
            // Nouvelles propri�t�s pour le tir
            canShoot: this.shootingEnabled,
            shootingCooldown: this.shootingEnabled ? Math.random() * CONFIG.ORBS.SHOOTING_RATE : 0
        });
        
        console.log(`Orb created: orbit ${orbPosition.orbitIndex}, position ${orbPosition.positionInOrbit}, distance ${orbPosition.distance}`);
    },
    
    // Calcule la position optimale pour une nouvelle orbe
    calculateOrbPosition() {
        const maxPerOrbit = CONFIG.ORBS.MAX_PER_ORBIT;
        const orbitIndex = Math.floor(this.list.length / maxPerOrbit);
        const positionInOrbit = this.list.length % maxPerOrbit;
        
        const distance = CONFIG.ORBS.DISTANCE + (orbitIndex * CONFIG.ORBS.DISTANCE_INCREMENT);
        const orbsInThisOrbit = Math.min(maxPerOrbit, this.list.length - (orbitIndex * maxPerOrbit) + 1);
        const angle = (positionInOrbit * (Math.PI * 2)) / Math.max(orbsInThisOrbit, 1);
        
        return {
            orbitIndex,
            positionInOrbit,
            distance,
            angle
        };
    },
    
    // Couleur diff�rente selon l'orbite
    getOrbColor(orbitIndex) {
        const colors = [
            '#ff8800', // Orange (orbite 1)
            '#ff0080', // Rose (orbite 2) 
            '#8000ff', // Violet (orbite 3)
            '#00ff80', // Vert (orbite 4)
            '#0080ff', // Bleu (orbite 5)
            '#ffff00'  // Jaune (orbite 6+)
        ];
        return colors[orbitIndex % colors.length];
    },
    
    update() {
        if (!Player.data) return;
        
        // Augmenter la vitesse temporelle globale, modifi�e par l'upgrade
        this.time += 0.1 * Player.data.orbSpeed;
        
        // Version simplifi�e pour corriger le bug de rotation
        for (let i = 0; i < this.list.length; i++) {
            const orb = this.list[i];
            
            // Calculer l'angle de base pour cette orbe dans son orbite
            const maxPerOrbit = CONFIG.ORBS.MAX_PER_ORBIT;
            const orbitIndex = Math.floor(i / maxPerOrbit);
            const positionInOrbit = i % maxPerOrbit;
            
            // Compter combien d'orbes sont r�ellement dans cette orbite
            const orbsInThisOrbit = Math.min(maxPerOrbit, this.list.length - (orbitIndex * maxPerOrbit));
            
            // Vitesses de rotation modifi�es par l'upgrade de vitesse
            const baseSpeed = (CONFIG.ORBS.BASE_SPEED || 0.12) * Player.data.orbSpeed;
            const speedIncrement = (CONFIG.ORBS.SPEED_INCREMENT || 0.03) * Player.data.orbSpeed;
            
            // Formule progressive: orbites plus �loign�es tournent plus vite
            const orbitSpeed = baseSpeed + (orbitIndex * speedIncrement);
            
            // Angle de base pour cette position + rotation temporelle
            const baseAngle = (positionInOrbit * (Math.PI * 2)) / orbsInThisOrbit;
            orb.angle = baseAngle + (this.time * orbitSpeed);
            
            // Mettre � jour la distance (au cas o� elle aurait chang�)
            orb.distance = CONFIG.ORBS.DISTANCE + (orbitIndex * CONFIG.ORBS.DISTANCE_INCREMENT);
            
            // Position finale
            orb.x = Player.data.x + Math.cos(orb.angle) * orb.distance;
            orb.y = Player.data.y + Math.sin(orb.angle) * orb.distance;
            
            // Syst�me de tir des orbes
            if (orb.canShoot && this.shootingEnabled) {
                orb.shootingCooldown--;
                if (orb.shootingCooldown <= 0) {
                    this.orbShoot(orb);
                    orb.shootingCooldown = CONFIG.ORBS.SHOOTING_RATE;
                }
            }
            
            // Collision avec les ennemis
            for (let j = Enemy.list.length - 1; j >= 0; j--) {
                const enemy = Enemy.list[j];
                const distance = Math.sqrt((orb.x - enemy.x) ** 2 + (orb.y - enemy.y) ** 2);
                
                if (distance < orb.radius + enemy.radius) {
                    if (Enemy.takeDamage(enemy)) {
                        Game.score += orb.damage;
                        
                        // Effet visuel de l'impact orbital
                        Particle.createExplosion(orb.x, orb.y, orb.color, 6);
                        Audio.playSoundEffect('orbHit');
                    }
                    break;
                }
            }
        }
    },
    
    // Tir des orbes vers l'ennemi le plus proche
    orbShoot(orb) {
        const nearestResult = Enemy.findNearest();
        if (!nearestResult || nearestResult.distance > Player.data.range) return;
        
        const enemy = nearestResult.enemy;
        const dx = enemy.x - orb.x;
        const dy = enemy.y - orb.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // Cr�er projectile d'orbe
            Bullet.createOrbBullet(orb, dx / distance, dy / distance);
            
            // Effet visuel de tir
            Particle.createExplosion(orb.x, orb.y, orb.color, 3);
            Audio.playSoundEffect('orbShoot');
        }
    },
    
    // M�thode pour r�organiser les orbes apr�s destruction d'ennemis
    reorganizeOrbs() {
        // Cette m�thode pourrait �tre utilis�e si on veut r�organiser 
        // dynamiquement les orbes apr�s qu'une soit d�truite
        this.list.forEach((orb, index) => {
            const newPosition = this.calculateOrbPosition.call({list: this.list.slice(0, index + 1)});
            orb.distance = newPosition.distance;
            orb.orbitIndex = newPosition.orbitIndex;
            orb.positionInOrbit = newPosition.positionInOrbit;
            orb.color = this.getOrbColor(newPosition.orbitIndex);
        });
    }
};