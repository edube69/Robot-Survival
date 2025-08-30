import { CONFIG } from './config.js';
import { Player } from './player.js';
import { Particle } from './particle.js';
import { Audio } from './audio.js';
import { Enemy } from './enemy.js';
import { Orb } from './orb.js';

// Module de gestion des gemmes/monnaie
export const Currency = {
    list: [],
    
    init() {
        this.list = [];
    },
    
    create(x, y, value = CONFIG.CURRENCY.LOW_VALUE) {
        const isHighValue = value > CONFIG.CURRENCY.LOW_VALUE;
        const radius = isHighValue ? 8 : 6;
        const colors = isHighValue ? CONFIG.CURRENCY.COLORS.HIGH : CONFIG.CURRENCY.COLORS.LOW;
        
        // V�rifier que CONFIG.CURRENCY.COLORS existe
        const safeColors = colors || {
            BRIGHT: '#FFD700',
            MEDIUM: '#FFD700', 
            DARK: '#FFA500'
        };
        
        this.list.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            radius: radius,
            value: value,
            colors: safeColors, // stocke les couleurs d'or avec fallback
            magnetized: false,
            bobOffset: Math.random() * Math.PI * 2,
            spinAngle: Math.random() * Math.PI * 2, // angle de rotation initial
            type: 'gem' // Type normal
        });
    },
    
    // === NOUVELLE M�THODE POUR CR�ER DES LOOT BOXES ===
    createLootBox(x, y, lootType) {
        const lootConfig = this.getLootBoxConfig(lootType);
        
        // V�rifier que lootConfig et lootConfig.color existent
        const safeColor = (lootConfig && lootConfig.color) ? lootConfig.color : '#FFD700';
        
        this.list.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            radius: 12,
            value: 0, // Valeur sp�ciale pour les loot boxes
            colors: { BRIGHT: safeColor, MEDIUM: safeColor, DARK: safeColor },
            magnetized: false,
            bobOffset: Math.random() * Math.PI * 2,
            spinAngle: Math.random() * Math.PI * 2,
            type: 'lootbox',
            lootType: lootType,
            // Animation sp�ciale
            pulsePhase: Math.random() * Math.PI * 2,
            sparkleTimer: 0,
            glowIntensity: 1.0
        });
        
        // Effets visuels de spawn
        this.createLootBoxSpawnEffects(x, y, safeColor);
    },
    
    // Configuration des loot boxes
    getLootBoxConfig(lootType) {
        const configs = {
            'TREASURE': { color: '#FFD700', probability: 0.25 },    // R�duit pour faire place aux nouvelles
            'WEAPON': { color: '#FF4444', probability: 0.15 },      // R�duit pour faire place aux nouvelles  
            'NUKE': { color: '#FF8800', probability: 0.15 },        // Maintenu
            'MAGNET': { color: '#4488FF', probability: 0.1 },       // Maintenu
            // === LOOT BOXES POUR ORBES ===
            'ORB_SHIELD': { color: '#FF8800', probability: 0.15 },  // Ajoute des orbes de protection
            'ORB_UPGRADE': { color: '#8844FF', probability: 0.1 },  // Am�liore les orbes existantes
            // === NOUVELLE LOOT BOX UTILITAIRE ===
            'UTILITY': { color: '#44FF88', probability: 0.1 }       // Upgrades utilitaires (magnet, speed, etc.)
        };
        return configs[lootType] || configs['TREASURE'];
    },
    
    // Effets visuels de spawn pour loot box
    createLootBoxSpawnEffects(x, y, color) {
        // Stocker les coordonn�es pour �viter les probl�mes avec setTimeout
        const spawnX = x;
        const spawnY = y;
        
        // Explosion color�e plus importante
        Particle.createExplosion(spawnX, spawnY, color, 20);
        
        // Anneaux d'�nergie
        for (let ring = 0; ring < 4; ring++) {
            setTimeout(() => {
                const radius = 25 + ring * 20;
                const particleCount = 12;
                
                for (let i = 0; i < particleCount; i++) {
                    const angle = (i * Math.PI * 2) / particleCount;
                    const px = spawnX + Math.cos(angle) * radius;
                    const py = spawnY + Math.sin(angle) * radius;
                    
                    Particle.createExplosion(px, py, color, 4);
                }
            }, ring * 200);
        }
        
        // Son sp�cial
        Audio.playSoundEffect('lootBoxSpawn');
    },
    
    update() {
        if (!Player.data) return;
        
        for (let i = this.list.length - 1; i >= 0; i--) {
            const drop = this.list[i];
            
            // V�rification de s�curit� : s'assurer que drop existe
            if (!drop || drop.x === undefined || drop.y === undefined) {
                this.list.splice(i, 1);
                continue;
            }
            
            const dx = Player.data.x - drop.x;
            const dy = Player.data.y - drop.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // === GESTION SP�CIALE POUR LES LOOT BOXES ===
            if (drop.type === 'lootbox') {
                this.updateLootBox(drop, dx, dy, distance, i);
                continue;
            }
            
            // === GESTION NORMALE POUR LES GEMS ===
            // Magn�tisme
            if (distance < Player.data.magnetRange && !drop.magnetized) {
                drop.magnetized = true;
            }
            
            if (drop.magnetized) {
                const speed = CONFIG.CURRENCY.MAGNET_SPEED;
                drop.vx = (dx / distance) * speed;
                drop.vy = (dy / distance) * speed;
            } else {
                drop.vx *= 0.95;
                drop.vy *= 0.95;
            }
            
            drop.x += drop.vx;
            drop.y += drop.vy;
            
            // Collection
            if (distance < drop.radius + Player.data.radius) {
                // === NOUVEAU : Appliquer le multiplicateur de gems ===
                const gemMultiplier = Player.data.gemMultiplier || 1;
                const finalValue = Math.floor(drop.value * gemMultiplier);
                Game.gems += finalValue;
                
                // V�rifier que drop.colors existe avant de l'utiliser
                if (drop.colors && drop.colors.BRIGHT) {
                    Particle.createExplosion(drop.x, drop.y, drop.colors.BRIGHT, 4);
                } else {
                    // Fallback couleur par d�faut si colors est undefined
                    Particle.createExplosion(drop.x, drop.y, '#FFD700', 4);
                }
                
                this.list.splice(i, 1);
                Audio.playSoundEffect('gemCollect');
                
                // === NOUVEAU : Afficher le multiplicateur dans les logs ===
                if (gemMultiplier > 1) {
                    console.log(`Collected ${drop.value} x${gemMultiplier} = ${finalValue} gems! Total: ${Game.gems}/${Game.gemsForUpgrade}`);
                } else {
                    console.log(`Collected ${finalValue} gems! Total: ${Game.gems}/${Game.gemsForUpgrade}`);
                }
                continue; // ? AJOUT: �viter l'animation si l'objet est supprim�
            }
            
            // Animation: bobbing et rotation (seulement si l'objet n'a pas �t� collect�)
            if (drop.bobOffset !== undefined && drop.spinAngle !== undefined) {
                drop.bobOffset += 0.1;
                drop.spinAngle += CONFIG.CURRENCY.SPIN_SPEED || 0.08;
            }
        }
    },
    
    // Mise � jour sp�ciale pour les loot boxes
    updateLootBox(lootBox, dx, dy, distance, index) {
        // === NOUVEAU : MAGN�TISME POUR LES LOOT BOXES ===
        // Les loot boxes sont attir�es par le magnet mais plus lentement et � plus courte port�e
        const lootBoxMagnetRange = Player.data.magnetRange * 0.7; // 70% de la port�e normale
        
        if (distance < lootBoxMagnetRange && !lootBox.magnetized) {
            lootBox.magnetized = true;
            // Effet visuel sp�cial quand une loot box est magn�tis�e
            Particle.createExplosion(lootBox.x, lootBox.y, lootBox.colors.BRIGHT, 6);
        }
        
        if (lootBox.magnetized) {
            // Vitesse d'attraction plus lente pour les loot boxes (plus lourdes)
            const lootBoxMagnetSpeed = CONFIG.CURRENCY.MAGNET_SPEED * 0.6; // 60% de la vitesse normale
            const attractionForce = lootBoxMagnetSpeed * (lootBoxMagnetRange / Math.max(distance, 1));
            
            lootBox.vx += (dx / distance) * attractionForce * 0.3; // Attraction progressive
            lootBox.vy += (dy / distance) * attractionForce * 0.3;
            
            // Limite la vitesse maximale pour �viter que les loot boxes aillent trop vite
            const maxSpeed = 4;
            const currentSpeed = Math.sqrt(lootBox.vx * lootBox.vx + lootBox.vy * lootBox.vy);
            if (currentSpeed > maxSpeed) {
                lootBox.vx = (lootBox.vx / currentSpeed) * maxSpeed;
                lootBox.vy = (lootBox.vy / currentSpeed) * maxSpeed;
            }
        } else {
            // Physique normale pour les loot boxes non-magn�tis�es
            lootBox.vx *= 0.95;
            lootBox.vy *= 0.95;
        }
        
        lootBox.x += lootBox.vx;
        lootBox.y += lootBox.vy;
        
        // Animation sp�ciale
        lootBox.bobOffset += 0.08; // Plus lent que les gems
        lootBox.spinAngle += 0.03; // Plus lent
        lootBox.pulsePhase += 0.1;
        
        // Effet de pulsation
        lootBox.glowIntensity = 0.7 + Math.sin(lootBox.pulsePhase) * 0.3;
        
        // Effet sp�cial si magn�tis� : pulsation plus intense
        if (lootBox.magnetized) {
            lootBox.glowIntensity += Math.sin(lootBox.pulsePhase * 2) * 0.2;
        }
        
        // �tincelles occasionnelles
        lootBox.sparkleTimer++;
        if (lootBox.sparkleTimer > 30 && Math.random() < 0.4) {
            lootBox.sparkleTimer = 0;
            this.createLootBoxSparkles(lootBox);
        }
        
        // �tincelles magn�tiques suppl�mentaires quand magn�tis�
        if (lootBox.magnetized && Math.random() < 0.3) {
            this.createMagneticSparkles(lootBox);
        }
        
        // Collection
        if (distance < lootBox.radius + Player.data.radius) {
            this.collectLootBox(lootBox, index);
        }
    },
    
    // Cr�er des �tincelles autour de la loot box
    createLootBoxSparkles(lootBox) {
        const sparkleCount = 4;
        for (let i = 0; i < sparkleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 10 + Math.random() * 15;
            const sx = lootBox.x + Math.cos(angle) * distance;
            const sy = lootBox.y + Math.sin(angle) * distance;
            
            Particle.createExplosion(sx, sy, lootBox.colors.BRIGHT, 2);
        }
    },
    
    // === NOUVELLE M�THODE : �tincelles magn�tiques pour loot boxes ===
    createMagneticSparkles(lootBox) {
        const sparkleCount = 2;
        for (let i = 0; i < sparkleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 15 + Math.random() * 10;
            const sx = lootBox.x + Math.cos(angle) * distance;
            const sy = lootBox.y + Math.sin(angle) * distance;
            
            // �tincelles bleues pour indiquer l'effet magn�tique
            Particle.createExplosion(sx, sy, '#88BBFF', 1);
        }
        
        // Tra�n�e magn�tique vers le joueur
        if (Player.data && Math.random() < 0.5) {
            const dx = Player.data.x - lootBox.x;
            const dy = Player.data.y - lootBox.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                const trailX = lootBox.x + (dx / distance) * 20;
                const trailY = lootBox.y + (dy / distance) * 20;
                Particle.createExplosion(trailX, trailY, '#4499FF', 1);
            }
        }
    },
    
    // Collecter une loot box
    collectLootBox(lootBox, index) {
        // Effets visuels spectaculaires
        Particle.createExplosion(lootBox.x, lootBox.y, lootBox.colors.BRIGHT, 25);
        
        // Stocker les informations de la loot box avant suppression
        const lootInfo = {
            type: lootBox.lootType,
            x: lootBox.x,
            y: lootBox.y,
            color: lootBox.colors.BRIGHT
        };
        
        // Appliquer l'effet selon le type
        this.applyLootBoxEffect(lootBox);
        
        // === NOUVELLE FONCTIONNALITÉ : Animation de notification ===
        this.showLootBoxNotification(lootInfo);
        
        // Supprimer
        this.list.splice(index, 1);
        
        // Son de collection
        Audio.playSoundEffect('lootBoxCollect');
    },
    
    // === NOUVELLE MÉTHODE : Afficher une notification animée pour les loot boxes ===
    showLootBoxNotification(lootInfo) {
        // Obtenir les détails de la loot box
        const lootDetails = this.getLootBoxNotificationDetails(lootInfo.type);
        
        // Créer l'élément de notification
        const notification = document.createElement('div');
        notification.className = 'lootbox-notification';
        notification.innerHTML = `
            <div class="lootbox-notification-inner">
                <div class="loot-icon" style="color: ${lootInfo.color}; text-shadow: 0 0 20px ${lootInfo.color};">
                    ${lootDetails.icon}
                </div>
                <div class="loot-content">
                    <div class="loot-title">${lootDetails.title}</div>
                    <div class="loot-description">${lootDetails.description}</div>
                    <div class="loot-benefits">
                        ${lootDetails.benefits.map(benefit => `<div class="benefit-item">• ${benefit}</div>`).join('')}
                    </div>
                </div>
            </div>
        `;
        
        // Ajouter au DOM
        document.body.appendChild(notification);
        
        // Animation d'apparition
        setTimeout(() => notification.classList.add('show'), 50);
        
        // Supprimer après 4 secondes
        setTimeout(() => {
            notification.classList.add('hide');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 500);
        }, 4000);
        
        // Effet de particules à l'écran
        this.createScreenParticleEffect(lootInfo.color, lootDetails.icon);
    },
    
    // === NOUVELLE MÉTHODE : Obtenir les détails pour la notification ===
    getLootBoxNotificationDetails(lootType) {
        const details = {
            'TREASURE': {
                icon: '💎',
                title: 'TREASURE CACHE',
                description: 'Massive gem windfall discovered!',
                benefits: ['15-35 gems bonus', 'Multiplier applied', 'Golden particle rain']
            },
            'WEAPON': {
                icon: '🚀',
                title: 'WEAPON UNLOCK',
                description: 'Advanced arsenal acquired!',
                benefits: ['New weapon system', 'Enhanced firepower', 'Tactical advantage']
            },
            'NUKE': {
                icon: '💥',
                title: 'NUCLEAR STRIKE',
                description: 'Orbital bombardment activated!',
                benefits: ['All enemies eliminated', 'Massive score bonus', 'Screen cleared']
            },
            'MAGNET': {
                icon: '🧲',
                title: 'MAGNETIC PULSE',
                description: 'Gravitational field deployed!',
                benefits: ['All gems collected', 'Instant gathering', 'Area effect']
            },
            'ORB_SHIELD': {
                icon: '🛡️',
                title: 'ORBITAL DEFENSE',
                description: 'Shield satellites deployed!',
                benefits: ['1-2 orbital defenders', 'Autonomous protection', 'Rotating shields']
            },
            'ORB_UPGRADE': {
                icon: '⚡',
                title: 'ORB ENHANCEMENT',
                description: 'Satellite systems upgraded!',
                benefits: ['Increased orb speed', 'Enhanced abilities', 'Armed orbs unlocked']
            },
            'UTILITY': {
                icon: '🔧',
                title: 'SYSTEM UPGRADE',
                description: 'Core systems enhanced!',
                benefits: ['Movement speed+', 'Magnet range+', 'Fire rate+', 'Weapon range+']
            }
        };
        
        return details[lootType] || details['TREASURE'];
    },
    
    // === NOUVELLE MÉTHODE : Effet de particules à l'écran ===
    createScreenParticleEffect(color, icon) {
        // Créer plusieurs particules qui traversent l'écran
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'screen-particle';
                particle.textContent = icon;
                particle.style.cssText = `
                    position: fixed;
                    font-size: ${20 + Math.random() * 20}px;
                    color: ${color};
                    text-shadow: 0 0 20px ${color};
                    pointer-events: none;
                    z-index: 9999;
                    left: ${Math.random() * 100}vw;
                    top: ${Math.random() * 100}vh;
                    animation: floatAway 3s ease-out forwards;
                `;
                
                document.body.appendChild(particle);
                
                setTimeout(() => {
                    if (particle.parentNode) {
                        particle.parentNode.removeChild(particle);
                    }
                }, 3000);
                
            }, i * 100);
        }
    },
    
    update() {
        if (!Player.data) return;
        
        for (let i = this.list.length - 1; i >= 0; i--) {
            const drop = this.list[i];
            
            // V�rification de s�curit� : s'assurer que drop existe
            if (!drop || drop.x === undefined || drop.y === undefined) {
                this.list.splice(i, 1);
                continue;
            }
            
            const dx = Player.data.x - drop.x;
            const dy = Player.data.y - drop.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // === GESTION SP�CIALE POUR LES LOOT BOXES ===
            if (drop.type === 'lootbox') {
                this.updateLootBox(drop, dx, dy, distance, i);
                continue;
            }
            
            // === GESTION NORMALE POUR LES GEMS ===
            // Magn�tisme
            if (distance < Player.data.magnetRange && !drop.magnetized) {
                drop.magnetized = true;
            }
            
            if (drop.magnetized) {
                const speed = CONFIG.CURRENCY.MAGNET_SPEED;
                drop.vx = (dx / distance) * speed;
                drop.vy = (dy / distance) * speed;
            } else {
                drop.vx *= 0.95;
                drop.vy *= 0.95;
            }
            
            drop.x += drop.vx;
            drop.y += drop.vy;
            
            // Collection
            if (distance < drop.radius + Player.data.radius) {
                // === NOUVEAU : Appliquer le multiplicateur de gems ===
                const gemMultiplier = Player.data.gemMultiplier || 1;
                const finalValue = Math.floor(drop.value * gemMultiplier);
                Game.gems += finalValue;
                
                // V�rifier que drop.colors existe avant de l'utiliser
                if (drop.colors && drop.colors.BRIGHT) {
                    Particle.createExplosion(drop.x, drop.y, drop.colors.BRIGHT, 4);
                } else {
                    // Fallback couleur par d�faut si colors est undefined
                    Particle.createExplosion(drop.x, drop.y, '#FFD700', 4);
                }
                
                this.list.splice(i, 1);
                Audio.playSoundEffect('gemCollect');
                
                // === NOUVEAU : Afficher le multiplicateur dans les logs ===
                if (gemMultiplier > 1) {
                    console.log(`Collected ${drop.value} x${gemMultiplier} = ${finalValue} gems! Total: ${Game.gems}/${Game.gemsForUpgrade}`);
                } else {
                    console.log(`Collected ${finalValue} gems! Total: ${Game.gems}/${Game.gemsForUpgrade}`);
                }
                continue; // ? AJOUT: �viter l'animation si l'objet est supprim�>
            }
            
            // Animation: bobbing et rotation (seulement si l'objet n'a pas �t� collect�)
            if (drop.bobOffset !== undefined && drop.spinAngle !== undefined) {
                drop.bobOffset += 0.1;
                drop.spinAngle += CONFIG.CURRENCY.SPIN_SPEED || 0.08;
            }
        }
    },
    
    // Mise � jour sp�ciale pour les loot boxes
    updateLootBox(lootBox, dx, dy, distance, index) {
        // === NOUVEAU : MAGN�TISME POUR LES LOOT BOXES ===
        // Les loot boxes sont attir�es par le magnet mais plus lentement et � plus courte port�e
        const lootBoxMagnetRange = Player.data.magnetRange * 0.7; // 70% de la port�e normale
        
        if (distance < lootBoxMagnetRange && !lootBox.magnetized) {
            lootBox.magnetized = true;
            // Effet visuel sp�cial quand une loot box est magn�tis�e
            Particle.createExplosion(lootBox.x, lootBox.y, lootBox.colors.BRIGHT, 6);
        }
        
        if (lootBox.magnetized) {
            // Vitesse d'attraction plus lente pour les loot boxes (plus lourdes)
            const lootBoxMagnetSpeed = CONFIG.CURRENCY.MAGNET_SPEED * 0.6; // 60% de la vitesse normale
            const attractionForce = lootBoxMagnetSpeed * (lootBoxMagnetRange / Math.max(distance, 1));
            
            lootBox.vx += (dx / distance) * attractionForce * 0.3; // Attraction progressive
            lootBox.vy += (dy / distance) * attractionForce * 0.3;
            
            // Limite la vitesse maximale pour �viter que les loot boxes aillent trop vite
            const maxSpeed = 4;
            const currentSpeed = Math.sqrt(lootBox.vx * lootBox.vx + lootBox.vy * lootBox.vy);
            if (currentSpeed > maxSpeed) {
                lootBox.vx = (lootBox.vx / currentSpeed) * maxSpeed;
                lootBox.vy = (lootBox.vy / currentSpeed) * maxSpeed;
            }
        } else {
            // Physique normale pour les loot boxes non-magn�tis�es
            lootBox.vx *= 0.95;
            lootBox.vy *= 0.95;
        }
        
        lootBox.x += lootBox.vx;
        lootBox.y += lootBox.vy;
        
        // Animation sp�ciale
        lootBox.bobOffset += 0.08; // Plus lent que les gems
        lootBox.spinAngle += 0.03; // Plus lent
        lootBox.pulsePhase += 0.1;
        
        // Effet de pulsation
        lootBox.glowIntensity = 0.7 + Math.sin(lootBox.pulsePhase) * 0.3;
        
        // Effet sp�cial si magn�tis� : pulsation plus intense
        if (lootBox.magnetized) {
            lootBox.glowIntensity += Math.sin(lootBox.pulsePhase * 2) * 0.2;
        }
        
        // �tincelles occasionnelles
        lootBox.sparkleTimer++;
        if (lootBox.sparkleTimer > 30 && Math.random() < 0.4) {
            lootBox.sparkleTimer = 0;
            this.createLootBoxSparkles(lootBox);
        }
        
        // �tincelles magn�tiques suppl�mentaires quand magn�tis�
        if (lootBox.magnetized && Math.random() < 0.3) {
            this.createMagneticSparkles(lootBox);
        }
        
        // Collection
        if (distance < lootBox.radius + Player.data.radius) {
            this.collectLootBox(lootBox, index);
        }
    },
    
    // Cr�er des �tincelles autour de la loot box
    createLootBoxSparkles(lootBox) {
        const sparkleCount = 4;
        for (let i = 0; i < sparkleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 10 + Math.random() * 15;
            const sx = lootBox.x + Math.cos(angle) * distance;
            const sy = lootBox.y + Math.sin(angle) * distance;
            
            Particle.createExplosion(sx, sy, lootBox.colors.BRIGHT, 2);
        }
    },
    
    // === NOUVELLE M�THODE : �tincelles magn�tiques pour loot boxes ===
    createMagneticSparkles(lootBox) {
        const sparkleCount = 2;
        for (let i = 0; i < sparkleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 15 + Math.random() * 10;
            const sx = lootBox.x + Math.cos(angle) * distance;
            const sy = lootBox.y + Math.sin(angle) * distance;
            
            // �tincelles bleues pour indiquer l'effet magn�tique
            Particle.createExplosion(sx, sy, '#88BBFF', 1);
        }
        
        // Tra�n�e magn�tique vers le joueur
        if (Player.data && Math.random() < 0.5) {
            const dx = Player.data.x - lootBox.x;
            const dy = Player.data.y - lootBox.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                const trailX = lootBox.x + (dx / distance) * 20;
                const trailY = lootBox.y + (dy / distance) * 20;
                Particle.createExplosion(trailX, trailY, '#4499FF', 1);
            }
        }
    },
    
    // Collecter une loot box
    collectLootBox(lootBox, index) {
        // Effets visuels spectaculaires
        Particle.createExplosion(lootBox.x, lootBox.y, lootBox.colors.BRIGHT, 25);
        
        // Stocker les informations de la loot box avant suppression
        const lootInfo = {
            type: lootBox.lootType,
            x: lootBox.x,
            y: lootBox.y,
            color: lootBox.colors.BRIGHT
        };
        
        // Appliquer l'effet selon le type
        this.applyLootBoxEffect(lootBox);
        
        // === NOUVELLE FONCTIONNALITÉ : Animation de notification ===
        this.showLootBoxNotification(lootInfo);
        
        // Supprimer
        this.list.splice(index, 1);
        
        // Son de collection
        Audio.playSoundEffect('lootBoxCollect');
    },
    
    // === NOUVELLE MÉTHODE : Afficher une notification animée pour les loot boxes ===
    showLootBoxNotification(lootInfo) {
        // Obtenir les détails de la loot box
        const lootDetails = this.getLootBoxNotificationDetails(lootInfo.type);
        
        // Créer l'élément de notification
        const notification = document.createElement('div');
        notification.className = 'lootbox-notification';
        notification.innerHTML = `
            <div class="lootbox-notification-inner">
                <div class="loot-icon" style="color: ${lootInfo.color}; text-shadow: 0 0 20px ${lootInfo.color};">
                    ${lootDetails.icon}
                </div>
                <div class="loot-content">
                    <div class="loot-title">${lootDetails.title}</div>
                    <div class="loot-description">${lootDetails.description}</div>
                    <div class="loot-benefits">
                        ${lootDetails.benefits.map(benefit => `<div class="benefit-item">• ${benefit}</div>`).join('')}
                    </div>
                </div>
            </div>
        `;
        
        // Ajouter au DOM
        document.body.appendChild(notification);
        
        // Animation d'apparition
        setTimeout(() => notification.classList.add('show'), 50);
        
        // Supprimer après 4 secondes
        setTimeout(() => {
            notification.classList.add('hide');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 500);
        }, 4000);
        
        // Effet de particules à l'écran
        this.createScreenParticleEffect(lootInfo.color, lootDetails.icon);
    },
    
    // === NOUVELLE MÉTHODE : Obtenir les détails pour la notification ===
    getLootBoxNotificationDetails(lootType) {
        const details = {
            'TREASURE': {
                icon: '💎',
                title: 'TREASURE CACHE',
                description: 'Massive gem windfall discovered!',
                benefits: ['15-35 gems bonus', 'Multiplier applied', 'Golden particle rain']
            },
            'WEAPON': {
                icon: '🚀',
                title: 'WEAPON UNLOCK',
                description: 'Advanced arsenal acquired!',
                benefits: ['New weapon system', 'Enhanced firepower', 'Tactical advantage']
            },
            'NUKE': {
                icon: '💥',
                title: 'NUCLEAR STRIKE',
                description: 'Orbital bombardment activated!',
                benefits: ['All enemies eliminated', 'Massive score bonus', 'Screen cleared']
            },
            'MAGNET': {
                icon: '🧲',
                title: 'MAGNETIC PULSE',
                description: 'Gravitational field deployed!',
                benefits: ['All gems collected', 'Instant gathering', 'Area effect']
            },
            'ORB_SHIELD': {
                icon: '🛡️',
                title: 'ORBITAL DEFENSE',
                description: 'Shield satellites deployed!',
                benefits: ['1-2 orbital defenders', 'Autonomous protection', 'Rotating shields']
            },
            'ORB_UPGRADE': {
                icon: '⚡',
                title: 'ORB ENHANCEMENT',
                description: 'Satellite systems upgraded!',
                benefits: ['Increased orb speed', 'Enhanced abilities', 'Armed orbs unlocked']
            },
            'UTILITY': {
                icon: '🔧',
                title: 'SYSTEM UPGRADE',
                description: 'Core systems enhanced!',
                benefits: ['Movement speed+', 'Magnet range+', 'Fire rate+', 'Weapon range+']
            }
        };
        
        return details[lootType] || details['TREASURE'];
    },
    
    // === NOUVELLE MÉTHODE : Effet de particules à l'écran ===
    createScreenParticleEffect(color, icon) {
        // Créer plusieurs particules qui traversent l'écran
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'screen-particle';
                particle.textContent = icon;
                particle.style.cssText = `
                    position: fixed;
                    font-size: ${20 + Math.random() * 20}px;
                    color: ${color};
                    text-shadow: 0 0 20px ${color};
                    pointer-events: none;
                    z-index: 9999;
                    left: ${Math.random() * 100}vw;
                    top: ${Math.random() * 100}vh;
                    animation: floatAway 3s ease-out forwards;
                `;
                
                document.body.appendChild(particle);
                
                setTimeout(() => {
                    if (particle.parentNode) {
                        particle.parentNode.removeChild(particle);
                    }
                }, 3000);
                
            }, i * 100);
        }
    },
    
    // Mise � jour sp�ciale pour les loot boxes
    updateLootBox(lootBox, dx, dy, distance, index) {
        // === NOUVEAU : MAGN�TISME POUR LES LOOT BOXES ===
        // Les loot boxes sont attir�es par le magnet mais plus lentement et � plus courte port�e
        const lootBoxMagnetRange = Player.data.magnetRange * 0.7; // 70% de la port�e normale
        
        if (distance < lootBoxMagnetRange && !lootBox.magnetized) {
            lootBox.magnetized = true;
            // Effet visuel sp�cial quand une loot box est magn�tis�e
            Particle.createExplosion(lootBox.x, lootBox.y, lootBox.colors.BRIGHT, 6);
        }
        
        if (lootBox.magnetized) {
            // Vitesse d'attraction plus lente pour les loot boxes (plus lourdes)
            const lootBoxMagnetSpeed = CONFIG.CURRENCY.MAGNET_SPEED * 0.6; // 60% de la vitesse normale
            const attractionForce = lootBoxMagnetSpeed * (lootBoxMagnetRange / Math.max(distance, 1));
            
            lootBox.vx += (dx / distance) * attractionForce * 0.3; // Attraction progressive
            lootBox.vy += (dy / distance) * attractionForce * 0.3;
            
            // Limite la vitesse maximale pour �viter que les loot boxes aillent trop vite
            const maxSpeed = 4;
            const currentSpeed = Math.sqrt(lootBox.vx * lootBox.vx + lootBox.vy * lootBox.vy);
            if (currentSpeed > maxSpeed) {
                lootBox.vx = (lootBox.vx / currentSpeed) * maxSpeed;
                lootBox.vy = (lootBox.vy / currentSpeed) * maxSpeed;
            }
        } else {
            // Physique normale pour les loot boxes non-magn�tis�es
            lootBox.vx *= 0.95;
            lootBox.vy *= 0.95;
        }
        
        lootBox.x += lootBox.vx;
        lootBox.y += lootBox.vy;
        
        // Animation sp�ciale
        lootBox.bobOffset += 0.08; // Plus lent que les gems
        lootBox.spinAngle += 0.03; // Plus lent
        lootBox.pulsePhase += 0.1;
        
        // Effet de pulsation
        lootBox.glowIntensity = 0.7 + Math.sin(lootBox.pulsePhase) * 0.3;
        
        // Effet sp�cial si magn�tis� : pulsation plus intense
        if (lootBox.magnetized) {
            lootBox.glowIntensity += Math.sin(lootBox.pulsePhase * 2) * 0.2;
        }
        
        // �tincelles occasionnelles
        lootBox.sparkleTimer++;
        if (lootBox.sparkleTimer > 30 && Math.random() < 0.4) {
            lootBox.sparkleTimer = 0;
            this.createLootBoxSparkles(lootBox);
        }
        
        // �tincelles magn�tiques suppl�mentaires quand magn�tis�
        if (lootBox.magnetized && Math.random() < 0.3) {
            this.createMagneticSparkles(lootBox);
        }
        
        // Collection
        if (distance < lootBox.radius + Player.data.radius) {
            this.collectLootBox(lootBox, index);
        }
    },
    
    // Cr�er des �tincelles autour de la loot box
    createLootBoxSparkles(lootBox) {
        const sparkleCount = 4;
        for (let i = 0; i < sparkleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 10 + Math.random() * 15;
            const sx = lootBox.x + Math.cos(angle) * distance;
            const sy = lootBox.y + Math.sin(angle) * distance;
            
            Particle.createExplosion(sx, sy, lootBox.colors.BRIGHT, 2);
        }
    },
    
    // === NOUVELLE M�THODE : �tincelles magn�tiques pour loot boxes ===
    createMagneticSparkles(lootBox) {
        const sparkleCount = 2;
        for (let i = 0; i < sparkleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 15 + Math.random() * 10;
            const sx = lootBox.x + Math.cos(angle) * distance;
            const sy = lootBox.y + Math.sin(angle) * distance;
            
            // �tincelles bleues pour indiquer l'effet magn�tique
            Particle.createExplosion(sx, sy, '#88BBFF', 1);
        }
        
        // Tra�n�e magn�tique vers le joueur
        if (Player.data && Math.random() < 0.5) {
            const dx = Player.data.x - lootBox.x;
            const dy = Player.data.y - lootBox.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                const trailX = lootBox.x + (dx / distance) * 20;
                const trailY = lootBox.y + (dy / distance) * 20;
                Particle.createExplosion(trailX, trailY, '#4499FF', 1);
            }
        }
    },
    
    // Collecter une loot box
    collectLootBox(lootBox, index) {
        // Effets visuels spectaculaires
        Particle.createExplosion(lootBox.x, lootBox.y, lootBox.colors.BRIGHT, 25);
        
        // Stocker les informations de la loot box avant suppression
        const lootInfo = {
            type: lootBox.lootType,
            x: lootBox.x,
            y: lootBox.y,
            color: lootBox.colors.BRIGHT
        };
        
        // Appliquer l'effet selon le type
        this.applyLootBoxEffect(lootBox);
        
        // === NOUVELLE FONCTIONNALITÉ : Animation de notification ===
        this.showLootBoxNotification(lootInfo);
        
        // Supprimer
        this.list.splice(index, 1);
        
        // Son de collection
        Audio.playSoundEffect('lootBoxCollect');
    },
    
    // === NOUVELLE MÉTHODE : Afficher une notification animée pour les loot boxes ===
    showLootBoxNotification(lootInfo) {
        // Obtenir les détails de la loot box
        const lootDetails = this.getLootBoxNotificationDetails(lootInfo.type);
        
        // Créer l'élément de notification
        const notification = document.createElement('div');
        notification.className = 'lootbox-notification';
        notification.innerHTML = `
            <div class="lootbox-notification-inner">
                <div class="loot-icon" style="color: ${lootInfo.color}; text-shadow: 0 0 20px ${lootInfo.color};">
                    ${lootDetails.icon}
                </div>
                <div class="loot-content">
                    <div class="loot-title">${lootDetails.title}</div>
                    <div class="loot-description">${lootDetails.description}</div>
                    <div class="loot-benefits">
                        ${lootDetails.benefits.map(benefit => `<div class="benefit-item">• ${benefit}</div>`).join('')}
                    </div>
                </div>
            </div>
        `;
        
        // Ajouter au DOM
        document.body.appendChild(notification);
        
        // Animation d'apparition
        setTimeout(() => notification.classList.add('show'), 50);
        
        // Supprimer après 4 secondes
        setTimeout(() => {
            notification.classList.add('hide');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 500);
        }, 4000);
        
        // Effet de particules à l'écran
        this.createScreenParticleEffect(lootInfo.color, lootDetails.icon);
    },
    
    // === NOUVELLE MÉTHODE : Obtenir les détails pour la notification ===
    getLootBoxNotificationDetails(lootType) {
        const details = {
            'TREASURE': {
                icon: '💎',
                title: 'TREASURE CACHE',
                description: 'Massive gem windfall discovered!',
                benefits: ['15-35 gems bonus', 'Multiplier applied', 'Golden particle rain']
            },
            'WEAPON': {
                icon: '🚀',
                title: 'WEAPON UNLOCK',
                description: 'Advanced arsenal acquired!',
                benefits: ['New weapon system', 'Enhanced firepower', 'Tactical advantage']
            },
            'NUKE': {
                icon: '💥',
                title: 'NUCLEAR STRIKE',
                description: 'Orbital bombardment activated!',
                benefits: ['All enemies eliminated', 'Massive score bonus', 'Screen cleared']
            },
            'MAGNET': {
                icon: '🧲',
                title: 'MAGNETIC PULSE',
                description: 'Gravitational field deployed!',
                benefits: ['All gems collected', 'Instant gathering', 'Area effect']
            },
            'ORB_SHIELD': {
                icon: '🛡️',
                title: 'ORBITAL DEFENSE',
                description: 'Shield satellites deployed!',
                benefits: ['1-2 orbital defenders', 'Autonomous protection', 'Rotating shields']
            },
            'ORB_UPGRADE': {
                icon: '⚡',
                title: 'ORB ENHANCEMENT',
                description: 'Satellite systems upgraded!',
                benefits: ['Increased orb speed', 'Enhanced abilities', 'Armed orbs unlocked']
            },
            'UTILITY': {
                icon: '🔧',
                title: 'SYSTEM UPGRADE',
                description: 'Core systems enhanced!',
                benefits: ['Movement speed+', 'Magnet range+', 'Fire rate+', 'Weapon range+']
            }
        };
        
        return details[lootType] || details['TREASURE'];
    },
    
    // === NOUVELLE MÉTHODE : Effet de particules à l'écran ===
    createScreenParticleEffect(color, icon) {
        // Créer plusieurs particules qui traversent l'écran
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'screen-particle';
                particle.textContent = icon;
                particle.style.cssText = `
                    position: fixed;
                    font-size: ${20 + Math.random() * 20}px;
                    color: ${color};
                    text-shadow: 0 0 20px ${color};
                    pointer-events: none;
                    z-index: 9999;
                    left: ${Math.random() * 100}vw;
                    top: ${Math.random() * 100}vh;
                    animation: floatAway 3s ease-out forwards;
                `;
                
                document.body.appendChild(particle);
                
                setTimeout(() => {
                    if (particle.parentNode) {
                        particle.parentNode.removeChild(particle);
                    }
                }, 3000);
                
            }, i * 100);
        }
    },
    
    // D�finition des nouvelles r�actions aux buffs des loot boxes
    applyLootBoxEffect(lootBox) {
        switch(lootBox.lootType) {
            case 'TREASURE':
                this.applyTreasureEffect(lootBox);
                break;
            case 'WEAPON':
                this.applyWeaponEffect(lootBox);
                break;
            case 'NUKE':
                this.applyNukeEffect(lootBox);
                break;
            case 'MAGNET':
                this.applyMagnetEffect(lootBox);
                break;
            case 'ORB_SHIELD':
                this.applyOrbShieldEffect(lootBox);
                break;
            case 'ORB_UPGRADE':
                this.applyOrbUpgradeEffect(lootBox);
                break;
            case 'UTILITY':
                this.applyUtilityEffect(lootBox);
                break;
        }
    },
    
    // Effet tr�sor : grosse somme de gems
    applyTreasureEffect(lootBox) {
        const baseAmount = 15 + Math.floor(Math.random() * 21); // 15-35 gems
        
        // === NOUVEAU : Appliquer le multiplicateur de gems ===
        const gemMultiplier = Player.data.gemMultiplier || 1;
        const finalAmount = Math.floor(baseAmount * gemMultiplier);
        Game.gems += finalAmount;
        
        // Stocker les coordonn�es AVANT la suppression potentielle
        const treasureX = lootBox.x;
        const treasureY = lootBox.y;
        
        // Pluie de gems dor�es
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * 80;
                const x = treasureX + Math.cos(angle) * distance;
                const y = treasureY + Math.sin(angle) * distance;
                
                Particle.createExplosion(x, y, '#FFD700', 3);
            }, i * 100);
        }
        
        // === NOUVEAU : Message avec multiplicateur ===
        if (gemMultiplier > 1) {
            console.log(`?? TREASURE! ${baseAmount} x${gemMultiplier} = +${finalAmount} gems! Total: ${Game.gems}`);
        } else {
            console.log(`?? TREASURE! +${finalAmount} gems! Total: ${Game.gems}`);
        }
    },
    
    // Effet arme : d�verrouiller une arme al�atoire
    applyWeaponEffect(lootBox) {
        const availableWeapons = [];
        
        if (!Player.data.tripleShot) availableWeapons.push({ name: 'tripleShot', display: 'Triple Shot' });
        if (!Player.data.shotgunBlast) availableWeapons.push({ name: 'shotgunBlast', display: 'Shotgun Blast' });
        if (!Player.data.homingMissiles) availableWeapons.push({ name: 'homingMissiles', display: 'Homing Missiles' });
        if (!Player.data.explosiveCannon) availableWeapons.push({ name: 'explosiveCannon', display: 'Explosive Cannon' });
        
        if (availableWeapons.length > 0) {
            const randomWeapon = availableWeapons[Math.floor(Math.random() * availableWeapons.length)];
            Player.upgrade(randomWeapon.name);
            
            // Stocker les coordonn�es AVANT la suppression potentielle
            const weaponX = lootBox.x;
            const weaponY = lootBox.y;
            
            // Explosion en spirale
            for (let i = 0; i < 15; i++) {
                setTimeout(() => {
                    const angle = (i * Math.PI * 2) / 15 + i * 0.3;
                    const distance = 25 + i * 3;
                    const x = weaponX + Math.cos(angle) * distance;
                    const y = weaponY + Math.sin(angle) * distance;
                    
                    Particle.createExplosion(x, y, '#FF4444', 5);
                }, i * 80);
            }
            
            console.log(`?? WEAPON UNLOCKED: ${randomWeapon.display}!`);
        } else {
            // Si toutes les armes sont d�j� d�verrouill�es
            const gemMultiplier = Player.data.gemMultiplier || 1;
            const finalBonus = Math.floor(25 * gemMultiplier);
            Game.gems += finalBonus;
            
            if (gemMultiplier > 1) {
                console.log(`?? All weapons unlocked! 25 x${gemMultiplier} = +${finalBonus} gems instead!`);
            } else {
                console.log(`?? All weapons unlocked! +${finalBonus} gems instead!`);
            }
        }
    },
    
    // Effet bombe nucl�aire
    applyNukeEffect(lootBox) {
        const enemiesDestroyed = Enemy.list.length;
        let totalPoints = 0;
        let totalGems = 0;
        
        // Stocker les coordonn�es AVANT la suppression potentielle
        const nukeX = lootBox.x;
        const nukeY = lootBox.y;
        
        // Calculer r�compenses
        Enemy.list.forEach(enemy => {
            totalPoints += enemy.points;
            totalGems += Enemy.calculateGemValue(enemy);
        });
        
        // EXPLOSION NUCL�AIRE !
        this.createNuclearExplosion(nukeX, nukeY);
        
        // D�truire tous les ennemis
        Enemy.list = [];
        
        // Ajouter r�compenses
        Game.score += totalPoints;
        Game.gems += totalGems;
        
        Audio.playSoundEffect('nukeExplosion');
        
        console.log(`?? NUCLEAR STRIKE! ${enemiesDestroyed} enemies destroyed! +${totalPoints} points, +${totalGems} gems`);
    },
    
    // Effet magnet g�ant
    applyMagnetEffect(lootBox) {
        const gemsCollected = this.list.filter(item => item.type === 'gem').length;
        let totalValue = 0;
        const gemsToCollect = []; // Stocker les infos des gems avant suppression
        
        // Stocker les coordonn�es AVANT la suppression potentielle
        const magnetX = lootBox.x;
        const magnetY = lootBox.y;
        
        // Effet spirale magn�tique
        this.createMagneticEffect(magnetX, magnetY);
        
        // Collecter toutes les gems
        for (let i = this.list.length - 1; i >= 0; i--) {
            const item = this.list[i];
            if (item.type === 'gem') {
                totalValue += item.value;
                
                // Stocker les infos de la gem AVANT de la supprimer
                gemsToCollect.push({
                    x: item.x,
                    y: item.y,
                    colors: item.colors
                });
                
                this.list.splice(i, 1);
            }
        }
        
        // Cr�er les effets visuels avec les donn�es stock�es
        gemsToCollect.forEach((gemInfo, index) => {
            setTimeout(() => {
                Particle.createExplosion(gemInfo.x, gemInfo.y, gemInfo.colors.BRIGHT, 4);
            }, Math.random() * 800);
        });
        
        Game.gems += totalValue;
        Audio.playSoundEffect('giantMagnet');
        
        // === NOUVEAU : Message avec multiplicateur si applicable ===
        const gemMultiplier = Player.data.gemMultiplier || 1;
        if (gemMultiplier > 1) {
            console.log(`?? GIANT MAGNET! Collected ${gemsCollected} gems worth ${totalValue} (multiplier applied separately)!`);
        } else {
            console.log(`?? GIANT MAGNET! Collected ${gemsCollected} gems worth ${totalValue}!`);
        }
    },
    
    // === NOUVEAUX EFFETS POUR LES LOOT BOXES D'ORBES ===
    
    // Effet ORB_SHIELD : Ajouter 1-2 orbes de protection
    applyOrbShieldEffect(lootBox) {
        // === NOUVEAU : V�rifier la limite maximale d'orbes ===
        const maxOrbs = CONFIG.ORBS.MAX_TOTAL || 9; // Ajust� � 9
        const currentOrbs = Player.data.orbCount || 0;
        
        if (currentOrbs >= maxOrbs) {
            // Si limite atteinte, donner des gems � la place
            const gemMultiplier = Player.data.gemMultiplier || 1;
            const finalBonus = Math.floor(15 * gemMultiplier);
            Game.gems += finalBonus;
            
            if (gemMultiplier > 1) {
                console.log(`?? ORB SHIELD: Max orbs reached (${maxOrbs})! 15 x${gemMultiplier} = +${finalBonus} gems instead!`);
            } else {
                console.log(`?? ORB SHIELD: Max orbs reached (${maxOrbs})! +${finalBonus} gems instead!`);
            }
            
            // Effets visuels mais pas d'orbes
            const orbX = lootBox.x;
            const orbY = lootBox.y;
            Particle.createExplosion(orbX, orbY, '#FFD700', 20);
            return;
        }
        
        // === R�DUIT : 1-2 orbes au lieu de 2-3 ===
        const orbsToAdd = Math.min(1 + Math.floor(Math.random() * 2), maxOrbs - currentOrbs); // 1-2 orbes max
        
        if (orbsToAdd <= 0) {
            const gemMultiplier = Player.data.gemMultiplier || 1;
            const finalBonus = Math.floor(10 * gemMultiplier);
            Game.gems += finalBonus;
            
            if (gemMultiplier > 1) {
                console.log(`?? ORB SHIELD: Cannot add more orbs! 10 x${gemMultiplier} = +${finalBonus} gems instead!`);
            } else {
                console.log(`?? ORB SHIELD: Cannot add more orbs! +${finalBonus} gems instead!`);
            }
            return;
        }
        
        // Stocker les coordonn�es AVANT la suppression potentielle
        const orbX = lootBox.x;
        const orbY = lootBox.y;
        
        // Ajouter les orbes
        for (let i = 0; i < orbsToAdd; i++) {
            Player.upgrade('orbCount', 1);
        }
        
        // Effets visuels spectaculaires en spirale orbitale
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const angle = (i * Math.PI * 2) / 20 + i * 0.5;
                const radius = 30 + Math.sin(i * 0.8) * 15;
                const x = orbX + Math.cos(angle) * radius;
                const y = orbY + Math.sin(angle) * radius;
                
                Particle.createExplosion(x, y, '#FF8800', 6);
            }, i * 60);
        }
        
        // Anneaux d'�nergie orbitale
        for (let ring = 0; ring < 4; ring++) {
            setTimeout(() => {
                const ringRadius = 25 + ring * 20;
                const particleCount = 12;
                
                for (let i = 0; i < particleCount; i++) {
                    const angle = (i * Math.PI * 2) / particleCount;
                    const px = orbX + Math.cos(angle) * ringRadius;
                    const py = orbY + Math.sin(angle) * ringRadius;
                    
                    Particle.createExplosion(px, py, '#FFAA44', 4);
                }
            }, ring * 150);
        }
        
        console.log(`?? ORB SHIELD! +${orbsToAdd} orbital defenders added! (${currentOrbs + orbsToAdd}/${maxOrbs})`);
    },
    
    // Effet ORB_UPGRADE : Am�liorer toutes les orbes existantes
    applyOrbUpgradeEffect(lootBox) {
        const maxOrbs = CONFIG.ORBS.MAX_TOTAL || 9; // Ajust� � 9
        const maxSpeed = CONFIG.ORBS.MAX_SPEED || 1.0; // Ajust� � 1.0
        const currentOrbs = Player.data.orbCount || 0;
        const currentSpeed = Player.data.orbSpeed || 1.0;
        
        if (currentOrbs === 0) {
            // Si pas d'orbes, en donner une et l'am�liorer (si possible)
            if (currentOrbs < maxOrbs) {
                Player.upgrade('orbCount', 1);
                // === R�DUIT : augmentation de vitesse plus petite ===
                Player.upgrade('orbSpeed', Math.min(0.15, maxSpeed - currentSpeed));
                console.log('?? No orbs detected! Creating and upgrading first orbital defender!');
            } else {
                Game.gems += 15;
                console.log('?? Cannot create orb (limit reached)! +15 gems instead!');
                return;
            }
        } else {
            // Am�liorer les orbes existantes
            const availableUpgrades = [];
            
            // === NOUVEAU : V�rifier les limites avant d'ajouter les upgrades ===
            if (currentSpeed < maxSpeed) {
                // === R�DUIT : augmentation de vitesse plus petite ===
                const speedIncrease = Math.min(0.15, maxSpeed - currentSpeed);
                if (speedIncrease > 0) {
                    availableUpgrades.push({ 
                        name: 'orbSpeed', 
                        value: speedIncrease, 
                        display: 'Orbital Velocity+' 
                    });
                }
            }
            
            if (!Orb.shootingEnabled) {
                availableUpgrades.push({ 
                    name: 'orbShooting', 
                    value: true, 
                    display: 'Armed Orbs' 
                });
            }
            
            // Ajouter une orbe suppl�mentaire seulement si sous la limite
            if (currentOrbs < maxOrbs) {
                availableUpgrades.push({ 
                    name: 'orbCount', 
                    value: 1, 
                    display: 'Extra Orbital Shield' 
                });
            }
            
            if (availableUpgrades.length === 0) {
                // Si aucune am�lioration possible, donner des gems
                const gemMultiplier = Player.data.gemMultiplier || 1;
                const finalBonus = Math.floor(20 * gemMultiplier);
                Game.gems += finalBonus;
                
                if (gemMultiplier > 1) {
                    console.log(`? ORB UPGRADE: All orb upgrades maxed! 20 x${gemMultiplier} = +${finalBonus} gems instead!`);
                } else {
                    console.log(`? ORB UPGRADE: All orb upgrades maxed! +${finalBonus} gems instead!`);
                }
                return;
            }
            
            // Appliquer 1 am�lioration al�atoire (r�duits de 1-2 � 1 pour �quilibrer)
            const upgradeCount = 1;
            const appliedUpgrades = [];
            
            for (let i = 0; i < upgradeCount; i++) {
                if (availableUpgrades.length === 0) break;
                
                const randomIndex = Math.floor(Math.random() * availableUpgrades.length);
                const upgrade = availableUpgrades[randomIndex];
                
                // Appliquer l'am�lioration
                if (upgrade.name === 'orbCount') {
                    Player.upgrade('orbCount', 1);
                    appliedUpgrades.push('Extra Orbital Shield');
                } else if (upgrade.name === 'orbSpeed') {
                    Player.upgrade('orbSpeed', upgrade.value);
                    appliedUpgrades.push('Orbital Velocity+');
                } else if (upgrade.name === 'orbShooting') {
                    Player.upgrade('orbShooting', true);
                    appliedUpgrades.push('Armed Orbs');
                }
                
                // Supprimer les am�liorations appliqu�es de la liste
                availableUpgrades.splice(randomIndex, 1);
            }
            
            console.log(`? ORB UPGRADE: ${appliedUpgrades.join(', ')} applied!`);
        }
    },
    
    // === NOUVELLE M�THODE : Effet UTILITY - Upgrades utilitaires ===
    applyUtilityEffect(lootBox) {
        const availableUtilities = [];
        
        // V�rifier quelles am�liorations utilitaires sont disponibles
        if (Player.data.magnetRange < 200) {
            availableUtilities.push({ 
                name: 'magnetRange', 
                value: 30, 
                display: 'Magnet Range+' 
            });
        }
        
        if (Player.data.speed < 6) {
            availableUtilities.push({ 
                name: 'speed', 
                value: 0.8, 
                display: 'Movement Speed+' 
            });
        }
        
        if (Player.data.fireRate > 8) {
            availableUtilities.push({ 
                name: 'fireRate', 
                value: -3, 
                display: 'Fire Rate+' 
            });
        }
        
        // Am�lioration de la port�e (nouvelle propri�t�)
        if (!Player.data.range || Player.data.range < 400) {
            availableUtilities.push({ 
                name: 'range', 
                value: 50, 
                display: 'Weapon Range+' 
            });
        }
        
        // Am�lioration du bouclier �nerg�tique (invuln�rabilit� plus longue)
        if (!Player.data.shieldDuration || Player.data.shieldDuration < 200) {
            availableUtilities.push({ 
                name: 'shieldDuration', 
                value: 30, 
                display: 'Energy Shield+' 
            });
        }
        
        if (availableUtilities.length > 0) {
            // Appliquer 1-2 am�liorations utilitaires al�atoires
            const upgradeCount = Math.min(availableUtilities.length, 1 + Math.floor(Math.random() * 2));
            const appliedUpgrades = [];
            
            for (let i = 0; i < upgradeCount; i++) {
                if (availableUtilities.length === 0) break;
                
                const randomIndex = Math.floor(Math.random() * availableUtilities.length);
                const upgrade = availableUtilities.splice(randomIndex, 1)[0];
                
                Player.upgrade(upgrade.name, upgrade.value);
                appliedUpgrades.push(upgrade.display);
            }
            
            console.log(`?? UTILITY UPGRADE! Applied: ${appliedUpgrades.join(', ')}`);
        } else {
            // Si toutes les am�liorations utilitaires sont au maximum, donner des gems
            const gemMultiplier = Player.data.gemMultiplier || 1;
            const finalBonus = Math.floor(20 * gemMultiplier);
            Game.gems += finalBonus;
            
            if (gemMultiplier > 1) {
                console.log(`?? All utilities maxed! 20 x${gemMultiplier} = +${finalBonus} gems instead!`);
            } else {
                console.log(`?? All utilities maxed! +${finalBonus} gems instead!`);
            }
        }
    },
    
    // Cr�ation d'une explosion nucl�aire
    createNuclearExplosion(x, y) {
        // Stocker les coordonn�es pour �viter les probl�mes avec setTimeout
        const explosionX = x;
        const explosionY = y;
        
        // Explosion centrale
        Particle.createExplosion(explosionX, explosionY, '#FF8800', 60);
        
        // Ondes de choc
        for (let wave = 0; wave < 10; wave++) {
            setTimeout(() => {
                const radius = 60 + wave * 50;
                const particleCount = 20;
                
                for (let i = 0; i < particleCount; i++) {
                    const angle = (i * Math.PI * 2) / particleCount;
                    const px = explosionX + Math.cos(angle) * radius;
                    const py = explosionY + Math.sin(angle) * radius;
                    
                    const color = wave < 5 ? '#FF4400' : '#FFAA00';
                    Particle.createExplosion(px, py, color, 10);
                }
            }, wave * 200);
        }
        
        // Champignon nucl�aire
        setTimeout(() => {
            for (let i = 0; i < 40; i++) {
                setTimeout(() => {
                    const px = explosionX + (Math.random() - 0.5) * 300;
                    const py = explosionY - 150 - Math.random() * 200;
                    
                    Particle.createExplosion(px, py, '#FFFF88', 15);
                }, i * 150);
            }
        }, 1000);
    },
    
    // Effet magn�tique
    createMagneticEffect(x, y) {
        // Stocker les coordonn�es pour �viter les probl�mes avec setTimeout
        const magnetX = x;
        const magnetY = y;
        
        // Spirales magn�tiques
        for (let spiral = 0; spiral < 6; spiral++) {
            for (let i = 0; i < 25; i++) {
                setTimeout(() => {
                    const angle = (spiral * Math.PI * 2 / 6) + (i * 0.4);
                    const radius = 100 - i * 3;
                    const px = magnetX + Math.cos(angle) * radius;
                    const py = magnetY + Math.sin(angle) * radius;
                    
                    Particle.createExplosion(px, py, '#4488FF', 4);
                }, spiral * 120 + i * 60);
            }
        }
        
        // Impulsion finale
        setTimeout(() => {
            Particle.createExplosion(magnetX, magnetY, '#88BBFF', 40);
        }, 800);
    }
};