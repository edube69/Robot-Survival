import { CONFIG } from './config.js';
import { Player } from './player.js';
import { Particle } from './particle.js';
import { Audio } from './audio.js';
import { Enemy } from './enemy.js';
import { Orb } from './orb.js';

// Module de gestion des gemmes/monnaie
export const Currency = {
    list: [],

    // ID de conteneur pour toasts d'upgrade
    _toastContainerId: 'loot-toasts-container',
    
    init() {
        this.list = [];
    },
    
    create(x, y, value = CONFIG.CURRENCY.LOW_VALUE) {
        const isHighValue = value > CONFIG.CURRENCY.LOW_VALUE;
        const radius = isHighValue ? 8 : 6;
        const colors = isHighValue ? CONFIG.CURRENCY.COLORS.HIGH : CONFIG.CURRENCY.COLORS.LOW;
        
        // Vérifier que CONFIG.CURRENCY.COLORS existe
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
    
    // === NOUVELLE MÉTHODE POUR CRÉER DES LOOT BOXES ===
    createLootBox(x, y, lootType) {
        const lootConfig = this.getLootBoxConfig(lootType);
        
        // Vérifier que lootConfig et lootConfig.color existent
        const safeColor = (lootConfig && lootConfig.color) ? lootConfig.color : '#FFD700';
        
        this.list.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            radius: 12,
            value: 0, // Valeur spéciale pour les loot boxes
            colors: { BRIGHT: safeColor, MEDIUM: safeColor, DARK: safeColor },
            magnetized: false,
            bobOffset: Math.random() * Math.PI * 2,
            spinAngle: Math.random() * Math.PI * 2,
            type: 'lootbox',
            lootType: lootType,
            // Animation spéciale
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
            'TREASURE': { color: '#FFD700', probability: 0.25 },
            'WEAPON': { color: '#FF4444', probability: 0.15 },
            'NUKE': { color: '#FF8800', probability: 0.15 },
            'MAGNET': { color: '#4488FF', probability: 0.1 },
            // === LOOT BOXES POUR ORBES ===
            'ORB_SHIELD': { color: '#FF8800', probability: 0.15 },
            'ORB_UPGRADE': { color: '#8844FF', probability: 0.1 },
            // === NOUVELLE LOOT BOX UTILITAIRE ===
            'UTILITY': { color: '#44FF88', probability: 0.1 }
        };
        return configs[lootType] || configs['TREASURE'];
    },

    // Compter le nombre de toasts actifs (encore dans le DOM)
    getActiveToastCount() {
        if (typeof document === 'undefined') return 0;
        const container = document.getElementById(this._toastContainerId);
        if (!container) return 0;
        return container.querySelectorAll('.loot-toast').length;
    },

    // === NOUVEAU: Déterminer si un type de loot apportera un vrai bénéfice maintenant =p==
    canLootTypeProvideBenefit(lootType) {
        if (!Player?.data) return false;
        const minFire = CONFIG.PLAYER.MIN_FIRE_RATE ?? 8;
        const maxOrbs = CONFIG.ORBS.MAX_TOTAL || 9;
        const maxOrbSpeed = CONFIG.ORBS.MAX_SPEED || 1.0;
        const hasGemsOnGround = this.list.some(i => i.type === 'gem');
        const hasEnemies = Enemy.list.length > 0;
        const weaponsLocked = !Player.data.tripleShot || !Player.data.shotgunBlast || !Player.data.homingMissiles || !Player.data.explosiveCannon;
        const orbsCanImprove = (Player.data.orbCount || 0) < maxOrbs || (Player.data.orbSpeed || 1.0) < maxOrbSpeed || !Orb.shootingEnabled;
        const utilitiesAvailable = (Player.data.magnetRange < 200) || (Player.data.speed < 6) || (Player.data.fireRate > minFire) || (!Player.data.range || Player.data.range < 400) || (!Player.data.shieldDuration || Player.data.shieldDuration < 200);
        
        switch(lootType) {
            case 'TREASURE':
                return true; // Donne toujours des gemmes
            case 'WEAPON':
                return weaponsLocked;
            case 'NUKE':
                return hasEnemies;
            case 'MAGNET':
                return hasGemsOnGround;
            case 'ORB_SHIELD':
                return (Player.data.orbCount || 0) < maxOrbs;
            case 'ORB_UPGRADE':
                return orbsCanImprove;
            case 'UTILITY':
                return utilitiesAvailable;
            default:
                return false;
        }
    },

    // Liste des types de loot utiles dans l'état actuel
    getBeneficialLootTypes() {
        const allTypes = ['TREASURE', 'WEAPON', 'NUKE', 'MAGNET', 'ORB_SHIELD', 'ORB_UPGRADE', 'UTILITY'];
        return allTypes.filter(t => this.canLootTypeProvideBenefit(t));
    },

    // Tout est-il déjà au maximum (armes, stats et orbes) ?
    areAllUpgradesMaxed() {
        if (!Player?.data) return false;
        const minFire = CONFIG.PLAYER.MIN_FIRE_RATE ?? 8;
        const maxOrbs = CONFIG.ORBS.MAX_TOTAL || 9;
        const maxOrbSpeed = CONFIG.ORBS.MAX_SPEED || 1.0;
        const weaponsMax = !!(Player.data.tripleShot && Player.data.shotgunBlast && Player.data.homingMissiles && Player.data.explosiveCannon);
        const statsMax = (Player.data.fireRate <= minFire) && (Player.data.speed >= 6) && (Player.data.bulletSpeed >= 12) && (Player.data.range && Player.data.range >= 400) && (Player.data.magnetRange >= 200);
        const orbsMax = ((Player.data.orbCount || 0) >= maxOrbs) && ((Player.data.orbSpeed || 1.0) >= maxOrbSpeed) && !!Orb.shootingEnabled;
        return weaponsMax && statsMax && orbsMax;
    },

    // Devrait-on faire apparaître une lootbox maintenant ?
    // On empêche le spawn si rien ne peut être utile ou si tout est max.
    shouldSpawnLootBox() {
        if (this.areAllUpgradesMaxed()) return false;
        const beneficial = this.getBeneficialLootTypes();
        return beneficial.length > 0;
    },

    // =================== UI COMPACTE: TOASTS D'UPGRADE ===================
    ensureToastContainer() {
        if (document.getElementById(this._toastContainerId)) return;
        const container = document.createElement('div');
        container.id = this._toastContainerId;
        container.style.cssText = `
            position: fixed;
            top: 200px;
            right: 12px;
            width: 220px;
            max-width: 28vw;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 6px;
            pointer-events: none;
        `;
        document.body.appendChild(container);

        // Injecter styles pour les toasts (version compacte)
        const style = document.createElement('style');
        style.textContent = `
            .loot-toast { 
                background: rgba(10, 16, 20, 0.85); 
                color: #e6f7ff; 
                border-left: 3px solid #44d9ff; 
                border-radius: 5px; 
                padding: 6px 8px; 
                box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                opacity: 0; 
                transform: translateX(6px); 
                transition: opacity 220ms ease, transform 220ms ease; 
                font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
                font-size: 11px;
                line-height: 1.3;
            }
            .loot-toast.show { opacity: 1; transform: translateX(0); }
            .loot-toast.hide { opacity: 0; transform: translateX(6px); }
            .loot-toast .title { font-weight: 700; letter-spacing: .2px; margin-bottom: 1px; font-size: 12px; }
            .loot-toast .desc { font-size: 11px; color: #9fe3ff; margin-bottom: 4px; }
            .loot-toast .changes { font-size: 11px; line-height: 1.3; }
            .loot-toast .change-row { display: flex; justify-content: space-between; gap: 6px; }
            .loot-toast .label { color: #8bdcff; }
            .loot-toast .vals { color: #e6f7ff; }
        `;
        document.head.appendChild(style);
    },

    showLootToast(toastData) {
        if (!toastData) return;
        this.ensureToastContainer();
        const container = document.getElementById(this._toastContainerId);
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'loot-toast';
        toast.style.borderLeftColor = toastData.color || '#44d9ff';

        const title = document.createElement('div');
        title.className = 'title';
        title.textContent = toastData.title || 'Upgrade';

        const desc = document.createElement('div');
        desc.className = 'desc';
        desc.textContent = toastData.description || '';

        const changes = document.createElement('div');
        changes.className = 'changes';
        (toastData.changes || []).forEach(ch => {
            const row = document.createElement('div');
            row.className = 'change-row';
            const label = document.createElement('div');
            label.className = 'label';
            label.textContent = ch.label;
            const vals = document.createElement('div');
            vals.className = 'vals';
            vals.textContent = `${ch.before} → ${ch.after}`;
            row.appendChild(label);
            row.appendChild(vals);
            changes.appendChild(row);
        });

        toast.appendChild(title);
        if (toastData.description) toast.appendChild(desc);
        if ((toastData.changes || []).length) toast.appendChild(changes);
        container.appendChild(toast);

        // Apparition
        requestAnimationFrame(() => toast.classList.add('show'));

        // Disparition après 20s
        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 300);
        }, 20000);
    },

    // Effets visuels de spawn pour loot box
    createLootBoxSpawnEffects(x, y, color) {
        // Stocker les coordonnées pour éviter les problèmes avec setTimeout
        const spawnX = x;
        const spawnY = y;
        
        // Explosion colorée plus importante
        Particle.createExplosion(spawnX, spawnY, color, 20);
        
        // Anneaux d'énergie
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
        
        // Son spécial
        Audio.playSoundEffect('lootBoxSpawn');
    },
    
    update() {
        if (!Player.data) return;
        
        for (let i = this.list.length - 1; i >= 0; i--) {
            const drop = this.list[i];
            
            // Vérification de sécurité : s'assurer que drop existe
            if (!drop || drop.x === undefined || drop.y === undefined) {
                this.list.splice(i, 1);
                continue;
            }
            
            const dx = Player.data.x - drop.x;
            const dy = Player.data.y - drop.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // === GESTION SPÉCIALE POUR LES LOOT BOXES ===
            if (drop.type === 'lootbox') {
                this.updateLootBox(drop, dx, dy, distance, i);
                continue;
            }
            
            // === GESTION NORMALE POUR LES GEMS ===
            // Magnétisme
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
                
                // Vérifier que drop.colors existe avant de l'utiliser
                if (drop.colors && drop.colors.BRIGHT) {
                    Particle.createExplosion(drop.x, drop.y, drop.colors.BRIGHT, 4);
                } else {
                    // Fallback couleur par défaut si colors est undefined
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
                continue; // éviter l'animation si l'objet est supprimé
            }
            
            // Animation: bobbing et rotation (seulement si l'objet n'a pas été collecté)
            if (drop.bobOffset !== undefined && drop.spinAngle !== undefined) {
                drop.bobOffset += 0.1;
                drop.spinAngle += CONFIG.CURRENCY.SPIN_SPEED || 0.08;
            }
        }
    },
    
    // Mise à jour spéciale pour les loot boxes
    updateLootBox(lootBox, dx, dy, distance, index) {
        // === NOUVEAU : MAGNÉTISME POUR LES LOOT BOXES ===
        // Les loot boxes sont attirées par le magnet mais plus lentement et à plus courte portée
        const lootBoxMagnetRange = Player.data.magnetRange * 0.7; // 70% de la portée normale
        
        if (distance < lootBoxMagnetRange && !lootBox.magnetized) {
            lootBox.magnetized = true;
            // Effet visuel spécial quand une loot box est magnétisée
            Particle.createExplosion(lootBox.x, lootBox.y, lootBox.colors.BRIGHT, 6);
        }
        
        if (lootBox.magnetized) {
            // Vitesse d'attraction plus lente pour les loot boxes (plus lourdes)
            const lootBoxMagnetSpeed = CONFIG.CURRENCY.MAGNET_SPEED * 0.6; // 60% de la vitesse normale
            const attractionForce = lootBoxMagnetSpeed * (lootBoxMagnetRange / Math.max(distance, 1));
            
            lootBox.vx += (dx / distance) * attractionForce * 0.3; // Attraction progressive
            lootBox.vy += (dy / distance) * attractionForce * 0.3;
            
            // Limite la vitesse maximale pour éviter que les loot boxes aillent trop vite
            const maxSpeed = 4;
            const currentSpeed = Math.sqrt(lootBox.vx * lootBox.vx + lootBox.vy * lootBox.vy);
            if (currentSpeed > maxSpeed) {
                lootBox.vx = (lootBox.vx / currentSpeed) * maxSpeed;
                lootBox.vy = (lootBox.vy / currentSpeed) * maxSpeed;
            }
        } else {
            // Physique normale pour les loot boxes non-magnétisées
            lootBox.vx *= 0.95;
            lootBox.vy *= 0.95;
        }
        
        lootBox.x += lootBox.vx;
        lootBox.y += lootBox.vy;
        
        // Animation spéciale
        lootBox.bobOffset += 0.08; // Plus lent que les gems
        lootBox.spinAngle += 0.03; // Plus lent
        lootBox.pulsePhase += 0.1;
        
        // Effet de pulsation
        lootBox.glowIntensity = 0.7 + Math.sin(lootBox.pulsePhase) * 0.3;
        
        // Effet spécial si magnétisé : pulsation plus intense
        if (lootBox.magnetized) {
            lootBox.glowIntensity += Math.sin(lootBox.pulsePhase * 2) * 0.2;
        }
        
        // Étincelles occasionnelles
        lootBox.sparkleTimer++;
        if (lootBox.sparkleTimer > 30 && Math.random() < 0.4) {
            lootBox.sparkleTimer = 0;
            this.createLootBoxSparkles(lootBox);
        }
        
        // Étincelles magnétiques supplémentaires quand magnétisé
        if (lootBox.magnetized && Math.random() < 0.3) {
            this.createMagneticSparkles(lootBox);
        }
        
        // Collection
        if (distance < lootBox.radius + Player.data.radius) {
            this.collectLootBox(lootBox, index);
        }
    },
    
    // Créer des étincelles autour de la loot box
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
    
    // === NOUVELLE MÉTHODE : étincelles magnétiques pour loot boxes ===
    createMagneticSparkles(lootBox) {
        const sparkleCount = 2;
        for (let i = 0; i < sparkleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 15 + Math.random() * 10;
            const sx = lootBox.x + Math.cos(angle) * distance;
            const sy = lootBox.y + Math.sin(angle) * distance;
            
            // Étincelles bleues pour indiquer l'effet magnétique
            Particle.createExplosion(sx, sy, '#88BBFF', 1);
        }
        
        // Traînée magnétique vers le joueur
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
        // Effets visuels (léger)
        Particle.createExplosion(lootBox.x, lootBox.y, lootBox.colors.BRIGHT, 18);
        
        // Snapshot avant application pour calculer "avant -> après"
        const pre = {
            gems: Game.gems,
            score: Game.score,
            player: {
                fireRate: Player.data.fireRate,
                speed: Player.data.speed,
                bulletSpeed: Player.data.bulletSpeed,
                range: Player.data.range,
                magnetRange: Player.data.magnetRange,
                orbCount: Player.data.orbCount || 0,
                orbSpeed: Player.data.orbSpeed || 1.0,
                tripleShot: !!Player.data.tripleShot,
                shotgunBlast: !!Player.data.shotgunBlast,
                homingMissiles: !!Player.data.homingMissiles,
                explosiveCannon: !!Player.data.explosiveCannon,
                shieldDuration: Player.data.shieldDuration || 0
            },
            orbShooting: !!Orb.shootingEnabled
        };
        
        // Appliquer l'effet selon le type et récupérer un résumé
        const toastData = this.applyLootBoxEffect(lootBox, pre);
        
        // Supprimer la lootbox
        this.list.splice(index, 1);
        
        // Son de collection
        Audio.playSoundEffect('lootBoxCollect');
        
        // Afficher le toast compact à droite (pile)
        this.showLootToast(toastData);
    },
    
    // === REMPLACE l'ancienne notification plein écran par un toast compact ===
    // applyXxx retournent maintenant un objet de résumé
    applyLootBoxEffect(lootBox, pre) {
        switch(lootBox.lootType) {
            case 'TREASURE':
                return this.applyTreasureEffect(lootBox, pre);
            case 'WEAPON':
                return this.applyWeaponEffect(lootBox, pre);
            case 'NUKE':
                return this.applyNukeEffect(lootBox, pre);
            case 'MAGNET':
                return this.applyMagnetEffect(lootBox, pre);
            case 'ORB_SHIELD':
                return this.applyOrbShieldEffect(lootBox, pre);
            case 'ORB_UPGRADE':
                return this.applyOrbUpgradeEffect(lootBox, pre);
            case 'UTILITY':
                return this.applyUtilityEffect(lootBox, pre);
        }
        return null;
    },
    
    // Effet trésor : grosse somme de gems
    applyTreasureEffect(lootBox, pre) {
        const baseAmount = 15 + Math.floor(Math.random() * 21); // 15-35 gems
        const gemMultiplier = Player.data.gemMultiplier || 1;
        const finalAmount = Math.floor(baseAmount * gemMultiplier);
        const before = pre.gems;
        Game.gems += finalAmount;

        return {
            title: 'Trésor',
            description: `Gems bonus (+${finalAmount})`,
            color: '#FFD700',
            changes: [
                { label: 'Gemmes', before: before, after: Game.gems }
            ]
        };
    },
    
    // Effet arme : déverrouiller une arme aléatoire
    applyWeaponEffect(lootBox, pre) {
        const availableWeapons = [];
        
        if (!Player.data.tripleShot) availableWeapons.push({ name: 'tripleShot', display: 'Triple Shot' });
        if (!Player.data.shotgunBlast) availableWeapons.push({ name: 'shotgunBlast', display: 'Shotgun Blast' });
        if (!Player.data.homingMissiles) availableWeapons.push({ name: 'homingMissiles', display: 'Homing Missiles' });
        if (!Player.data.explosiveCannon) availableWeapons.push({ name: 'explosiveCannon', display: 'Explosive Cannon' });
        
        if (availableWeapons.length > 0) {
            const randomWeapon = availableWeapons[Math.floor(Math.random() * availableWeapons.length)];
            const before = !!pre.player[randomWeapon.name];
            Player.upgrade(randomWeapon.name);
            const after = !!Player.data[randomWeapon.name];
            
            return {
                title: 'Arme débloquée',
                description: randomWeapon.display,
                color: '#FF4444',
                changes: [ { label: randomWeapon.display, before: before ? 'On' : 'Off', after: after ? 'On' : 'Off' } ]
            };
        } else {
            const gemMultiplier = Player.data.gemMultiplier || 1;
            const finalBonus = Math.floor(25 * gemMultiplier);
            const before = pre.gems;
            Game.gems += finalBonus;
            return {
                title: 'Armes maxées',
                description: `Bonus de consolation (+${finalBonus} gemmes)` ,
                color: '#FF4444',
                changes: [ { label: 'Gemmes', before, after: Game.gems } ]
            };
        }
    },
    
    // Effet bombe nucléaire
    applyNukeEffect(lootBox, pre) {
        const enemiesDestroyed = Enemy.list.length;
        let totalPoints = 0;
        let totalGems = 0;
        
        Enemy.list.forEach(enemy => {
            totalPoints += enemy.points;
            totalGems += Enemy.calculateGemValue(enemy);
        });
        
        // Explosion visuelle
        this.createNuclearExplosion(lootBox.x, lootBox.y);
        
        // Appliquer effets
        const beforeScore = pre.score;
        const beforeGems = pre.gems;
        Enemy.list = [];
        Game.score += totalPoints;
        Game.gems += totalGems;
        
        Audio.playSoundEffect('nukeExplosion');
        
        return {
            title: 'Nuclear Strike',
            description: `${enemiesDestroyed} ennemis détruits`,
            color: '#FF8800',
            changes: [
                { label: 'Score', before: beforeScore, after: Game.score },
                { label: 'Gemmes', before: beforeGems, after: Game.gems }
            ]
        };
    },
    
    // Effet magnet géant
    applyMagnetEffect(lootBox, pre) {
        const gemsCollected = this.list.filter(item => item.type === 'gem').length;
        let totalValue = 0;
        const gemsToCollect = []; // Stocker les infos des gems avant suppression
        
        // Effet spirale magnétique
        this.createMagneticEffect(lootBox.x, lootBox.y);
        
        // Collecter toutes les gems
        for (let i = this.list.length - 1; i >= 0; i--) {
            const item = this.list[i];
            if (item.type === 'gem') {
                totalValue += item.value;
                gemsToCollect.push({ x: item.x, y: item.y, colors: item.colors });
                this.list.splice(i, 1);
            }
        }
        
        // Effets visuels sur les positions originales des gemmes
        gemsToCollect.forEach((gemInfo) => {
            setTimeout(() => {
                Particle.createExplosion(gemInfo.x, gemInfo.y, gemInfo.colors.BRIGHT, 4);
            }, Math.random() * 800);
        });
        
        const before = pre.gems;
        Game.gems += totalValue;
        Audio.playSoundEffect('giantMagnet');
        
        return {
            title: 'Impulsion Magnétique',
            description: `${gemsCollected} gemmes récoltées`,
            color: '#4488FF',
            changes: [ { label: 'Gemmes', before, after: Game.gems } ]
        };
    },
    
    // === NOUVEAUX EFFETS POUR LES LOOT BOXES D'ORBES ===
    
    // Effet ORB_SHIELD : Ajouter 1-2 orbes de protection
    applyOrbShieldEffect(lootBox, pre) {
        const maxOrbs = CONFIG.ORBS.MAX_TOTAL || 9;
        const currentOrbs = Player.data.orbCount || 0;
        
        if (currentOrbs >= maxOrbs) {
            const gemMultiplier = Player.data.gemMultiplier || 1;
            const finalBonus = Math.floor(15 * gemMultiplier);
            const before = pre.gems;
            Game.gems += finalBonus;
            
            Particle.createExplosion(lootBox.x, lootBox.y, '#FFD700', 20);
            return {
                title: 'Orbes maxées',
                description: `Bonus de compensation (+${finalBonus} gemmes)`,
                color: '#FF8800',
                changes: [ { label: 'Gemmes', before, after: Game.gems } ]
            };
        }
        
        const orbsToAdd = Math.min(1 + Math.floor(Math.random() * 2), maxOrbs - currentOrbs); // 1-2
        const before = currentOrbs;
        for (let i = 0; i < orbsToAdd; i++) Player.upgrade('orbCount', 1);
        const after = Player.data.orbCount || (before + orbsToAdd);
        
        // Visuels (restent discrets)
        for (let i = 0; i < 12; i++) {
            setTimeout(() => {
                const angle = (i * Math.PI * 2) / 12 + i * 0.4;
                const radius = 24 + Math.sin(i * 0.8) * 12;
                const x = lootBox.x + Math.cos(angle) * radius;
                const y = lootBox.y + Math.sin(angle) * radius;
                Particle.createExplosion(x, y, '#FF8800', 5);
            }, i * 50);
        }
        
        return {
            title: 'Bouclier Orbital',
            description: `+${orbsToAdd} orbe(s)`,
            color: '#FF8800',
            changes: [ { label: 'Orbes', before, after } ]
        };
    },
    
    // Effet ORB_UPGRADE : Améliorer les orbes existantes
    applyOrbUpgradeEffect(lootBox, pre) {
        const maxOrbs = CONFIG.ORBS.MAX_TOTAL || 9;
        const maxSpeed = CONFIG.ORBS.MAX_SPEED || 1.0;
        const beforeCount = pre.player.orbCount || 0;
        const beforeSpeed = pre.player.orbSpeed || 1.0;
        const beforeShoot = pre.orbShooting;

        const changes = [];

        if (beforeCount === 0) {
            if (beforeCount < maxOrbs) {
                Player.upgrade('orbCount', 1);
                const afterCount = Player.data.orbCount || (beforeCount + 1);
                changes.push({ label: 'Orbes', before: beforeCount, after: afterCount });
                const inc = Math.min(0.15, maxSpeed - (Player.data.orbSpeed || beforeSpeed));
                if (inc > 0) {
                    const b = Player.data.orbSpeed || beforeSpeed;
                    Player.upgrade('orbSpeed', inc);
                    const a = Player.data.orbSpeed;
                    changes.push({ label: 'Vitesse Orbe', before: b.toFixed(2), after: a.toFixed(2) });
                }
            } else {
                const beforeG = pre.gems; Game.gems += 15;
                return { title:'Orbes maxées', description:'+15 gemmes', color:'#8844FF', changes:[{label:'Gemmes', before: beforeG, after: Game.gems}] };
            }
        } else {
            // Préparer les upgrades disponibles
            const available = [];
            if ((Player.data.orbSpeed || beforeSpeed) < maxSpeed) {
                const inc = Math.min(0.15, maxSpeed - (Player.data.orbSpeed || beforeSpeed));
                if (inc > 0) available.push({ kind:'orbSpeed', inc });
            }
            if (!Orb.shootingEnabled) available.push({ kind:'orbShooting' });
            if ((Player.data.orbCount || beforeCount) < maxOrbs) available.push({ kind:'orbCount' });

            if (available.length === 0) {
                const beforeG = pre.gems; const add = Math.floor((Player.data.gemMultiplier || 1) * 20); Game.gems += add;
                return { title:'Orbes maxées', description:`+${add} gemmes`, color:'#8844FF', changes:[{ label:'Gemmes', before: beforeG, after: Game.gems }] };
            }

            // Appliquer une amélioration aléatoire
            const pick = available[Math.floor(Math.random() * available.length)];
            if (pick.kind === 'orbCount') {
                const b = Player.data.orbCount || beforeCount; Player.upgrade('orbCount', 1); const a = (Player.data.orbCount || b + 1);
                changes.push({ label:'Orbes', before: b, after: a });
            } else if (pick.kind === 'orbSpeed') {
                const b = Player.data.orbSpeed || beforeSpeed; Player.upgrade('orbSpeed', pick.inc); const a = Player.data.orbSpeed;
                changes.push({ label:'Vitesse Orbe', before: b.toFixed(2), after: a.toFixed(2) });
            } else if (pick.kind === 'orbShooting') {
                const b = beforeShoot; Player.upgrade('orbShooting', true); const a = true;
                changes.push({ label:'Orbes armées', before: b ? 'Oui' : 'Non', after: a ? 'Oui' : 'Non' });
            }
        }

        return {
            title: 'Amélioration Orbes',
            description: 'Systèmes orbitaux améliorés',
            color: '#8844FF',
            changes
        };
    },
    
    // === NOUVELLE MÉTHODE : Effet UTILITY - Upgrades utilitaires ===
    applyUtilityEffect(lootBox, pre) {
        const availableUtilities = [];
        
        if (Player.data.magnetRange < 200) availableUtilities.push({ name: 'magnetRange', value: 30, display: 'Portée Aimant' });
        if (Player.data.speed < 6) availableUtilities.push({ name: 'speed', value: 0.8, display: 'Vitesse' });
        if (Player.data.fireRate > 8) availableUtilities.push({ name: 'fireRate', value: -3, display: 'Cadence de tir' });
        if (!Player.data.range || Player.data.range < 400) availableUtilities.push({ name: 'range', value: 50, display: 'Portée Armes' });
        if (!Player.data.shieldDuration || Player.data.shieldDuration < 200) availableUtilities.push({ name: 'shieldDuration', value: 30, display: 'Bouclier' });
        
        const changes = [];
        if (availableUtilities.length > 0) {
            const upgradeCount = Math.min(availableUtilities.length, 1 + Math.floor(Math.random() * 2));
            for (let i = 0; i < upgradeCount; i++) {
                const idx = Math.floor(Math.random() * availableUtilities.length);
                const up = availableUtilities.splice(idx, 1)[0];
                const before = pre.player[up.name] ?? Player.data[up.name] ?? 0;
                Player.upgrade(up.name, up.value);
                const after = Player.data[up.name];
                const fmt = (v) => typeof v === 'number' && v.toFixed ? (v % 1 === 0 ? v : v.toFixed(2)) : v;
                changes.push({ label: up.display, before: fmt(before), after: fmt(after) });
            }
            return {
                title: 'Amélioration Système',
                description: 'Mise à niveau utilitaire',
                color: '#44FF88',
                changes
            };
        } else {
            const before = pre.gems; const add = Math.floor((Player.data.gemMultiplier || 1) * 20); Game.gems += add;
            return { title:'Utilitaires maxés', description:`+${add} gemmes`, color:'#44FF88', changes:[{ label:'Gemmes', before, after: Game.gems }] };
        }
    },
    
    // Création d'une explosion nucléaire
    createNuclearExplosion(x, y) {
        const explosionX = x;
        const explosionY = y;
        
        Particle.createExplosion(explosionX, explosionY, '#FF8800', 60);
        
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
    
    // Effet magnétique
    createMagneticEffect(x, y) {
        const magnetX = x;
        const magnetY = y;
        
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
        
        setTimeout(() => {
            Particle.createExplosion(magnetX, magnetY, '#88BBFF', 40);
        }, 800);
    }
};