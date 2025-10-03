import { CONFIG } from './config.js';
import { Audio } from './audio.js';
import { Player } from './player.js';
import { Particle } from './particle.js';
import { Currency } from './currency.js';

// Module des ennemis
export const Enemy = {
    list: [],
    waveEnemiesSpawned: 0, // Compteur d'ennemis générés pour cette vague
    maxEnemiesPerWave: 0, // Maximum d'ennemis à générer pour cette vague
    targetedId: null, // id de l'ennemi actuellement visé pour halo
    _nextId: 1,

    // Multiplieur dynamique basé sur le Fire Rate du joueur
    getDynamicSpeedMultiplier() {
        if (!Player?.data) return 1;
        const base = CONFIG.PLAYER.FIRE_RATE || 18; // frames
        const minCap = CONFIG.PLAYER.MIN_FIRE_RATE ?? 12;
        const current = Player.data.fireRate ?? base;
        const improvement = Math.max(0, Math.min(base, base - Math.max(current, minCap))); // frames gagnées effectives
        const perFrameBoost = 0.05; // +3% par frame gagnée (plus fort pour compenser)
        const cap = 1.6; // +60% max
        return Math.min(1 + improvement * perFrameBoost, cap);
    },
    
    init() {
        this.list = [];
        this.waveEnemiesSpawned = 0;
        this.bonusWaveActive = false; // Indicateur de vague bonus active
        this.bonusWaveSpawned = 0; // Compteur d'ennemis de la vague bonus
        this.bonusWaveTarget = 0; // Objectif d'ennemis pour la vague bonus
        this.setWaveLimit();
        this.targetedId = null;
    },
    
    setWaveLimit() {
        // Nombre d'ennemis plus élevé pour des vagues plus longues
        const baseEnemies = 20; // Augmenté de 15 à 20
        const enemiesPerWave = Math.floor(Game.wave * 3.5); // Augmenté de 2.5 à 3.5
        this.maxEnemiesPerWave = Math.min(baseEnemies + enemiesPerWave, 60); // Max augmenté de 40 à 60
        console.log(`Wave ${Game.wave}: Max enemies = ${this.maxEnemiesPerWave}`);
    },
    
    create() {
        if (!Player.data) return;
        
        // Générer une position autour du joueur
        const side = Math.floor(Math.random() * 4);
        let x, y;
        const spawnDistance = CONFIG.ENEMIES.SPAWN_DISTANCE;
        
        switch(side) {
            case 0: // haut
                x = Player.data.x + (Math.random() - 0.5) * spawnDistance * 2;
                y = Player.data.y - spawnDistance;
                break;
            case 1: // droite
                x = Player.data.x + spawnDistance;
                y = Player.data.y + (Math.random() - 0.5) * spawnDistance * 2;
                break;
            case 2: // bas
                x = Player.data.x + (Math.random() - 0.5) * spawnDistance * 2;
                y = Player.data.y + spawnDistance;
                break;
            case 3: // gauche
                x = Player.data.x - spawnDistance;
                y = Player.data.y + (Math.random() - 0.5) * spawnDistance * 2;
                break;
        }
        
        // Garder dans les limites du monde
        x = Math.max(20, Math.min(CONFIG.WORLD.WIDTH - 20, x));
        y = Math.max(20, Math.min(CONFIG.WORLD.HEIGHT - 20, y));
        
        // Déterminer le type d'ennemi avec une progression plus équilibrée
        const rand = Math.random();
        let enemyType = 'basic';
        
        // Répartition améliorée selon la vague avec difficulté progressive
        if (Game.wave === 1) {
            // Vague 1: principalement basic, quelques fast
            if (rand < 0.7) enemyType = 'basic';
            else enemyType = 'fast';
        } else if (Game.wave === 2) {
            // Vague 2: introduction des tanks
            if (rand < 0.4) enemyType = 'basic';
            else if (rand < 0.7) enemyType = 'fast';
            else enemyType = 'tank';
        } else if (Game.wave <= 5) {
            // Vagues 3-5: tous les types avec équilibre
            if (rand < 0.3) enemyType = 'basic';
            else if (rand < 0.55) enemyType = 'fast';
            else if (rand < 0.8) enemyType = 'tank';
            else enemyType = 'splitter';
        } else if (Game.wave <= 10) {
            // Vagues 6-10: plus de types avancés
            if (rand < 0.2) enemyType = 'basic';
            else if (rand < 0.4) enemyType = 'fast';
            else if (rand < 0.7) enemyType = 'tank';
            else enemyType = 'splitter';
        } else {
            // Vagues 11+: principalement des ennemis avancés
            if (rand < 0.1) enemyType = 'basic';
            else if (rand < 0.25) enemyType = 'fast';
            else if (rand < 0.6) enemyType = 'tank';
            else enemyType = 'splitter';
        }
        
        const enemyData = CONFIG.ENEMIES.TYPES[enemyType];
        
        // Scaling de difficulté plus équilibré 
        const waveMultiplier = 1 + (Game.wave - 1) * 0.1; // +10% par vague
        
        // Vitesse plus progressive, surtout pour les fast
        let speedMultiplier;
        if (enemyType === 'fast') {
            // Les interceptors ont une croissance de vitesse plus limitée
            speedMultiplier = 1 + (Game.wave - 1) * 0.05; // +2.5%/vague
        } else {
            // Autres types
            speedMultiplier = 1 + (Game.wave - 1) * 0.05; // +4%/vague
        }
        
        const healthBonus = Math.floor((Game.wave - 3) / 3); // +1 HP toutes les 3 vagues
        
        const enemy = {
            id: this._nextId++,
            x, y,
            radius: enemyData.radius,
            speed: (enemyData.speedBase + Math.random() * enemyData.speedVariation) * speedMultiplier,
            color: enemyData.color,
            health: enemyData.health + healthBonus,
            maxHealth: enemyData.health + healthBonus,
            points: Math.floor(enemyData.points * waveMultiplier),
            shape: enemyData.shape,
            type: enemyType,
            // Propriétés d'animation
            animTime: Math.random() * Math.PI * 2,
            thrusterFlicker: 0,
            rotationAngle: Math.random() * Math.PI * 2,
            pulsePhase: Math.random() * Math.PI * 2,
            // Propriétés d'apparition
            spawning: true,
            spawnTimer: 30, // 0.5 seconde d'effet de spawn
            spawnScale: 0.1 // Commence petit
        };
        
        this.list.push(enemy);
        
        // === EFFETS DE SPAWN ===
        this.createSpawnEffects(x, y, enemyType);
    },
    
    // Nouveaux effets visuels et sonores pour le spawn
    createSpawnEffects(x, y, enemyType) {
        // Stocker les coordonnées pour éviter les problèmes avec setTimeout
        const spawnX = x;
        const spawnY = y;
        
        // Effet visuel selon le type d'ennemi
        const spawnColors = {
            'basic': '#ff00ff',
            'fast': '#ff4444', 
            'tank': '#8844ff',
            'splitter': '#ff8800'
        };
        
        const spawnColor = spawnColors[enemyType] || '#ff00ff';
        
        // === EFFETS VISUELS ===
        
        // 1. Portal d'apparition
        Particle.createExplosion(spawnX, spawnY, spawnColor, 12);
        
        // 2. Anneaux d'énergie qui se contractent
        for (let ring = 0; ring < 3; ring++) {
            setTimeout(() => {
                const radius = 60 - ring * 15; // Se contracte
                const particleCount = 8;
                
                for (let i = 0; i < particleCount; i++) {
                    const angle = (i * Math.PI * 2) / particleCount;
                    const px = spawnX + Math.cos(angle) * radius;
                    const py = spawnY + Math.sin(angle) * radius;
                    
                    Particle.createExplosion(px, py, spawnColor, 3);
                }
            }, ring * 100);
        }
        
        // 3. Colonnes d'énergie verticales
        for (let col = 0; col < 4; col++) {
            setTimeout(() => {
                const angle = (col * Math.PI * 2) / 4;
                const distance = 25;
                const px = spawnX + Math.cos(angle) * distance;
                const py = spawnY + Math.sin(angle) * distance;
                
                // Colonne d'énergie qui monte
                for (let height = 0; height < 5; height++) {
                    setTimeout(() => {
                        Particle.createExplosion(px, py - height * 8, spawnColor, 2);
                    }, height * 30);
                }
            }, col * 50);
        }
        
        // 4. Étincelles qui jaillissent
        setTimeout(() => {
            for (let spark = 0; spark < 8; spark++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = 20 + Math.random() * 30;
                const px = spawnX + Math.cos(angle) * distance;
                const py = spawnY + Math.sin(angle) * distance;
                
                Particle.createExplosion(px, py, '#ffffff', 1);
            }
        }, 200);
        
        // === EFFETS SONORES ===
        this.playSpawnSound(enemyType);
    },
    
    // Sons spécialisés pour le spawn selon le type d'ennemi
    playSpawnSound(enemyType) {
        switch(enemyType) {
            case 'basic':
                Audio.playSoundEffect('scoutSpawn');
                break;
            case 'fast':
                Audio.playSoundEffect('interceptorSpawn');
                break;
            case 'tank':
                Audio.playSoundEffect('crusherSpawn');
                break;
            case 'splitter':
                Audio.playSoundEffect('shredderSpawn');
                break;
            default:
                Audio.playSoundEffect('enemySpawn');
        }
    },
    
    update() {
        if (Game.state !== 'playing' || !Player.data) return;
        
        const dynSpeed = this.getDynamicSpeedMultiplier();
        
        for (let i = this.list.length - 1; i >= 0; i--) {
            const enemy = this.list[i];
            
            // === GESTION DU SPAWN ANIMATION ===
            if (enemy.spawning) {
                enemy.spawnTimer--;
                // Grossissement progressif pendant le spawn
                enemy.spawnScale = Math.min(1.0, (30 - enemy.spawnTimer) / 30);
                
                if (enemy.spawnTimer <= 0) {
                    enemy.spawning = false;
                    enemy.spawnScale = 1.0;
                }
                
                // Pendant le spawn, l'ennemi ne bouge pas et ne peut pas toucher le joueur
                continue;
            }
            
            // Mouvement vers le joueur (seulement après le spawn)
            const dx = Player.data.x - enemy.x;
            const dy = Player.data.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                // Appliquer le multiplicateur dynamique basé sur le Fire Rate du joueur
                const effectiveSpeed = enemy.speed * dynSpeed;
                enemy.x += (dx / distance) * effectiveSpeed;
                enemy.y += (dy / distance) * effectiveSpeed;
            }
            
            // Mise à jour des animations
            enemy.animTime += 0.1;
            enemy.thrusterFlicker = Math.random();
            enemy.rotationAngle += (enemy.type === 'fast' ? 0.15 : 0.05);
            enemy.pulsePhase += 0.08;
            
            // Collision avec le joueur (seulement après le spawn)
            const playerDistance = Math.sqrt((enemy.x - Player.data.x) ** 2 + (enemy.y - Player.data.y) ** 2);
            if (playerDistance < enemy.radius + Player.data.radius) {
                if (Player.takeDamage()) {
                    // Le joueur a pris des dégâts, on peut continuer
                }
            }
        }
        // mettre à jour le ciblage pour halo (nearest)
        const nearest = this.findNearest();
        this.targetedId = nearest ? nearest.enemy.id : null;
    },
    
    findNearest() {
        if (this.list.length === 0 || !Player.data) return null;
        
        let nearest = this.list[0];
        let nearestDistance = Math.sqrt((Player.data.x - nearest.x) ** 2 + (Player.data.y - nearest.y) ** 2);
        
        for (let i = 1; i < this.list.length; i++) {
            const enemy = this.list[i];
            const distance = Math.sqrt((Player.data.x - enemy.x) ** 2 + (Player.data.y - enemy.y) ** 2);
            if (distance < nearestDistance) {
                nearest = enemy;
                nearestDistance = distance;
            }
        }
        
        return { enemy: nearest, distance: nearestDistance };
    },
    
    takeDamage(enemy, damage = 1) {
        enemy.health -= damage;
        
        if (enemy.health <= 0) {
            // Increment kill counter
            Game.addKill();

            // Score avec combo multiplier
            Game.applyScore(enemy.points);
            Game.updateCombo(1); // kill -> feed combo

            // Effets spéalisisés par type d'ennemi
            this.createEnemyDeathEffects(enemy);
            
            // === NOUVEAU SYSTÈME DE LOOT ===
            // Chance de drop loot box au lieu de gems normales
            const lootDropped = this.tryDropLootBox(enemy);
            
            if (!lootDropped) {
                // Drop normal de gems si pas de loot box
                const baseGemValue = this.calculateGemValue(enemy);
                Currency.create(enemy.x, enemy.y, baseGemValue);
            }

            // Son spéciialisé par type d'ennemi
            this.playEnemyDeathSound(enemy.type);

            if (Player.data.vampiric && Game.lives < CONFIG.LIMITS.MAX_LIVES) {
                Game.lives++;
            }
            
            const index = this.list.indexOf(enemy);
            if (index > -1) {
                this.list.splice(index, 1);
            }
            return true;
        } else {
            // Effet de dégâts selon le type d'ennemi
            this.createEnemyHitEffect(enemy);
            return false;
        }
    },
    
    // Nouvelle méthode pour essayer de drop une loot box
    tryDropLootBox(enemy) {
        // Calculer les chances selon le type d'ennemi
        let dropChance = CONFIG.LOOT_BOXES.DROP_CHANCE;
        if (enemy.type === 'tank' || enemy.type === 'splitter') {
            dropChance = CONFIG.LOOT_BOXES.ELITE_DROP_CHANCE;
        }

        // Réduction des chances si des lootboxes sont déjà présentes
        // -10% par lootbox actuellement au sol (réduction multiplicative)
        const activeLootboxes = Array.isArray(Currency.list) ? Currency.list.filter(i => i && i.type === 'lootbox').length : 0;
        if (activeLootboxes > 0) {
            dropChance *= Math.pow(0.9, activeLootboxes);
        }
        
        // Vérifier si on doit créer une loot box
        if (Math.random() <= dropChance) {
            // Validation: n'essaie pas de spawn si aucune loot utile
            if (!Currency.shouldSpawnLootBox()) {
                return false;
            }
            return this.createLootBox(enemy.x, enemy.y, enemy.type);
        }
        
        return false;
    },
    
    // Créer une loot box (cette méthode sera liée au module LootBox)
    createLootBox(x, y, enemyType) {
        // Choisir uniquement des types bénéfiques au joueur actuellement
        const beneficial = Currency.getBeneficialLootTypes();
        if (!beneficial || beneficial.length === 0) {
            return false; // Aucun intérêt à drop une lootbox
        }
        
        const lootType = beneficial[Math.floor(Math.random() * beneficial.length)];
        
        // Créer l'objet loot box via Currency
        Currency.createLootBox(x, y, lootType);
        
        console.log(`Loot box dropped: ${lootType} from ${enemyType}`);
        return true;
    },
    
    // Effets visuels spéciisés à la mort de l'ennemi
    createEnemyDeathEffects(enemy) {
        // Stocker les coordonnés pour éviter les problêmes avec setTimeout
        const enemyX = enemy.x;
        const enemyY = enemy.y;
        
        switch(enemy.type) {
            case 'basic': // Scout - explosion simple et rapide
                Particle.createExplosion(enemyX, enemyY, enemy.color, 8);
                // Étincelles qui s'échappent
                for (let i = 0; i < 6; i++) {
                    setTimeout(() => {
                        const angle = Math.random() * Math.PI * 2;
                        const distance = 15 + Math.random() * 20;
                        const x = enemyX + Math.cos(angle) * distance;
                        const y = enemyY + Math.sin(angle) * distance;
                        Particle.createExplosion(x, y, '#ff66ff', 3);
                    }, i * 50);
                }
                break;
                
            case 'fast': // Interceptor - explosion rapide avec traînées
                Particle.createExplosion(enemyX, enemyY, enemy.color, 12);
                // Traînées de vitesse qui se dissipent
                for (let i = 0; i < 8; i++) {
                    const angle = (i * Math.PI * 2) / 8;
                    for (let j = 0; j < 4; j++) {
                        setTimeout(() => {
                            const distance = (j + 1) * 10;
                            const x = enemyX + Math.cos(angle) * distance;
                            const y = enemyY + Math.sin(angle) * distance;
                            Particle.createExplosion(x, y, '#ff4444', 2);
                        }, j * 25);
                    }
                }
                break;
                
            case 'tank': // Crusher - explosion massive et prolongée
                Particle.createExplosion(enemyX, enemyY, enemy.color, 20);
                // Explosions secondaires en chaîne
                for (let i = 0; i < 12; i++) {
                    setTimeout(() => {
                        const angle = Math.random() * Math.PI * 2;
                        const distance = 10 + Math.random() * 40;
                        const x = enemyX + Math.cos(angle) * distance;
                        const y = enemyY + Math.sin(angle) * distance;
                        Particle.createExplosion(x, y, '#8844ff', 8);
                    }, i * 80);
                }
                // Onde de choc finale
                setTimeout(() => {
                    for (let ring = 0; ring < 3; ring++) {
                        setTimeout(() => {
                            const radius = 20 + ring * 15;
                            const particleCount = 12;
                            for (let i = 0; i < particleCount; i++) {
                                const angle = (i * Math.PI * 2) / particleCount;
                                const x = enemyX + Math.cos(angle) * radius;
                                const y = enemyY + Math.sin(angle) * radius;
                                Particle.createExplosion(x, y, '#aaccff', 4);
                            }
                        }, ring * 100);
                    }
                }, 400);
                break;
                
            case 'splitter': // Shredder - explosion chaotique avec fragments
                Particle.createExplosion(enemyX, enemyY, enemy.color, 15);
                // Fragments qui explosent en cascade
                for (let i = 0; i < 16; i++) {
                    setTimeout(() => {
                        const angle = Math.random() * Math.PI * 2;
                        const distance = 20 + Math.random() * 35;
                        const x = enemyX + Math.cos(angle) * distance;
                        const y = enemyY + Math.sin(angle) * distance;
                        Particle.createExplosion(x, y, '#ff8800', 6);
                        
                        // Mini-explosions secondaires
                        setTimeout(() => {
                            for (let j = 0; j < 4; j++) {
                                const subAngle = Math.random() * Math.PI * 2;
                                const subDistance = 5 + Math.random() * 10;
                                const subX = x + Math.cos(subAngle) * subDistance;
                                const subY = y + Math.sin(subAngle) * subDistance;
                                Particle.createExplosion(subX, subY, '#ffaa44', 2);
                            }
                        }, 100);
                    }, i * 40);
                }
                break;
                
            default:
                Particle.createExplosion(enemyX, enemyY, enemy.color, 8);
        }
    },
    
    // Effets visuels quand l'ennemi prend des dégâts sans mourir
    createEnemyHitEffect(enemy) {
        switch(enemy.type) {
            case 'basic':
                Particle.createExplosion(enemy.x, enemy.y, enemy.color, 3);
                break;
            case 'fast':
                Particle.createExplosion(enemy.x, enemy.y, '#ff6666', 4);
                break;
            case 'tank':
                Particle.createExplosion(enemy.x, enemy.y, '#9966ff', 5);
                // Étincelles sur l'armure
                for (let i = 0; i < 3; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const distance = enemy.radius + Math.random() * 10;
                    const x = enemy.x + Math.cos(angle) * distance;
                    const y = enemy.y + Math.sin(angle) * distance;
                    Particle.createExplosion(x, y, '#ffff88', 1);
                }
                break;
            case 'splitter':
                Particle.createExplosion(enemy.x, enemy.y, '#ffaa66', 4);
                break;
            default:
                Particle.createExplosion(enemy.x, enemy.y, enemy.color, 3);
        }
    },
    
    // Sons spéciilisés par type d'ennemi
    playEnemyDeathSound(enemyType) {
        switch(enemyType) {
            case 'basic':
                Audio.playSoundEffect('scoutDestroyed');
                break;
            case 'fast':
                Audio.playSoundEffect('interceptorDestroyed');
                break;
            case 'tank':
                Audio.playSoundEffect('crusherDestroyed');
                break;
            case 'splitter':
                Audio.playSoundEffect('shredderDestroyed');
                break;
            default:
                Audio.playSoundEffect('enemyHit');
        }
    },
    
    // Nouvelle méthode pour calculer la valeur des gems selon l'ennemi
    calculateGemValue(enemy) {
        const enemyData = CONFIG.ENEMIES.TYPES[enemy.type];
        
        // Valeur de base selon le type d'ennemi
        let baseValue;
        switch(enemy.type) {
            case 'basic':
                baseValue = 1;
                break;
            case 'fast':
                baseValue = 2; // Plus rapide = plus de gems
                break;
            case 'tank':
                baseValue = 4; // Plus de vie = plus de gems
                break;
            case 'splitter':
                baseValue = 3; // Type avancé = plus de gems
                break;
            default:
                baseValue = 1;
        }
        
        // Multiplicateur basé sur la vague (ennemis plus forts = plus de gems)
        const waveMultiplier = 1 + (Game.wave - 1) * 0.15; // +15% par vague
        
        // Bonus pour les ennemis avec bonus de vie
        const healthBonus = enemy.maxHealth > enemyData.health ? 0.5 : 0;
        
        // Calculer la valeur finale
        const finalValue = Math.floor((baseValue + healthBonus) * waveMultiplier);
        
        // Minimum 1 gem, maximum raisonnable
        return Math.max(1, Math.min(finalValue, 15));
    },
    
    clearNearby(x, y, radius) {
        for (let i = this.list.length - 1; i >= 0; i--) {
            const enemy = this.list[i];
            const distance = Math.sqrt((enemy.x - x) ** 2 + (enemy.y - y) ** 2);
            if (distance < radius) {
                this.list.splice(i, 1);
            }
        }
    },
    
    spawn() {
        // Ne pas spawner pendant les annonces de vagues
        if (Game.state !== 'playing') return;
        
        // Debug: afficher l'état actuel avec plus de détails
        if (this.list.length === 0 && Math.random() < 0.01) { // Log occasionnel pour debug
            console.log(`SPAWN DEBUG - Wave: ${Game.wave}, Enemies: ${this.list.length}, Spawned: ${this.waveEnemiesSpawned}/${this.maxEnemiesPerWave}, Upgrades: ${Game.upgradesThisWave}, BonusActive: ${this.bonusWaveActive}, BonusSpawned: ${this.bonusWaveSpawned}/${this.bonusWaveTarget}, Gems: ${Game.gems}/${Game.gemsForUpgrade}`);
        }
        
        // Conditions pour terminer la vague:
        // 1. Tous les ennemis sont morts
        // 2. Maximum d'ennemis atteint pour cette vague
        // 3. ET au moins 2 upgrades ont été obtenues (augmenté de 1 à 2)
        const hasMinimumUpgrades = Game.wave === 1 || Game.upgradesThisWave >= 2; // Exiger plus d'upgrades
        const waveComplete = this.list.length === 0 && 
                            this.waveEnemiesSpawned >= this.maxEnemiesPerWave && 
                            hasMinimumUpgrades;
        
        if (waveComplete) {
            console.log(`Wave ${Game.wave} completed! Spawned: ${this.waveEnemiesSpawned}/${this.maxEnemiesPerWave}, Upgrades: ${Game.upgradesThisWave}`);
            // Réinitialiser les flags de vague bonus
            this.bonusWaveActive = false;
            this.bonusWaveSpawned = 0;
            this.bonusWaveTarget = 0;
            Game.announceNewWave();
            return;
        }
        
        // Si tous les ennemis sont morts mais qu'on n'a pas encore assez d'upgrades,
        // relancer une vague complète pour maintenir l'action !
        if (this.list.length === 0 && 
            this.waveEnemiesSpawned >= this.maxEnemiesPerWave && 
            !hasMinimumUpgrades &&
            !this.bonusWaveActive) { // éviter de relancer plusieurs fois
            
            console.log(`Need ${2 - Game.upgradesThisWave} more upgrades this wave, launching full bonus wave for gems!`);
            
            // Calculer le nombre d'ennemis pour une vague bonus substantielle
            const bonusWaveSize = Math.max(12, Math.floor(this.maxEnemiesPerWave * 0.8)); // Augmenté de 0.6 à 0.8
            const maxActiveBonus = Math.min(20, 8 + Math.floor(Game.wave * 1.2)); // Limites augmentées
            
            // Spawn initial rapide de la vague bonus
            const initialBonusSpawn = Math.min(bonusWaveSize, maxActiveBonus);
            for (let i = 0; i < initialBonusSpawn; i++) {
                setTimeout(() => {
                    this.create();
                    console.log(`Bonus enemy ${i + 1}/${bonusWaveSize} spawned for upgrade quest`);
                }, i * 200); // Spawn rapide pour relancer l'action
            }
            
            // Marquer qu'on est en vague bonus pour continuer le spawn
            this.bonusWaveActive = true;
            this.bonusWaveSpawned = initialBonusSpawn;
            this.bonusWaveTarget = bonusWaveSize;
            
            return;
        }
        
        // Gestion du spawn continu pour la vague bonus
        if (this.bonusWaveActive && !hasMinimumUpgrades) {
            const maxActiveBonus = Math.min(20, 8 + Math.floor(Game.wave * 1.2));
            const bonusSpawnRate = 0.08; // Taux de spawn pour maintenir l'action
            
            if (this.list.length < maxActiveBonus && 
                this.bonusWaveSpawned < this.bonusWaveTarget && 
                Math.random() < bonusSpawnRate) {
                
                this.create();
                this.bonusWaveSpawned++;
                console.log(`Bonus wave: ${this.bonusWaveSpawned}/${this.bonusWaveTarget} spawned`);
            }
            
            // NOUVEAU: Si tous les ennemis bonus sont générés et tués, mais pas assez d'upgrades
            // Relancer automatiquement une nouvelle vague bonus pour éviter le blocage
            if (this.list.length === 0 && 
                this.bonusWaveSpawned >= this.bonusWaveTarget) {
                
                console.log(`Bonus wave completed but need more upgrades. Launching new bonus wave to continue...`);
                
                // Réinitialiser et relancer une nouvelle vague bonus
                const newBonusWaveSize = Math.max(8, Math.floor(this.maxEnemiesPerWave * 0.5)); 
                const maxActiveBonus = Math.min(15, 6 + Math.floor(Game.wave * 0.8));
                
                // Spawn immédiat de nouveaux ennemis
                const newInitialSpawn = Math.min(newBonusWaveSize, maxActiveBonus);
                for (let i = 0; i < newInitialSpawn; i++) {
                    setTimeout(() => {
                        this.create();
                        console.log(`New bonus cycle enemy ${i + 1}/${newBonusWaveSize} spawned`);
                    }, i * 150);
                }
                
                // Réinitialiser les compteurs pour la nouvelle vague bonus
                this.bonusWaveSpawned = newInitialSpawn;
                this.bonusWaveTarget = newBonusWaveSize;
                
                return;
            }
            
            // Terminer la vague bonus si le joueur obtient suffisamment d'upgrades
            if (hasMinimumUpgrades) {
                console.log(`Sufficient upgrades obtained! Ending bonus wave and proceeding to next wave.`);
                this.bonusWaveActive = false;
                this.bonusWaveSpawned = 0;
                this.bonusWaveTarget = 0;
                
                // Maintenant on peut terminer la vague si tous les ennemis sont morts
                if (this.list.length === 0) {
                    Game.announceNewWave();
                    return;
                }
            }
            
            return;
        }
        
        // Fallback de sécurité amélioré : si on est bloqué sans ennemis
        if (this.list.length === 0 && 
            this.waveEnemiesSpawned >= this.maxEnemiesPerWave) {
            
            // Si on est en vague bonus mais bloqué sans upgrade depuis trop longtemps
            if (this.bonusWaveActive && this.bonusWaveSpawned >= this.bonusWaveTarget) {
                console.log(`EMERGENCY FALLBACK: Bonus wave exhausted, forcing progression to prevent infinite loop`);
                this.bonusWaveActive = false;
                this.bonusWaveSpawned = 0;
                this.bonusWaveTarget = 0;
                Game.announceNewWave();
                return;
            }
            
            // Si pas de vague bonus active
            if (!this.bonusWaveActive) {
                console.log(`SAFETY FALLBACK: No enemies and no bonus wave active, forcing wave progression...`);
                Game.announceNewWave();
                return;
            }
        }
        
        // Spawn normal - ralentir légèrement le spawn pour vagues plus longues
        const maxActiveEnemies = Math.min(25, 10 + Math.floor(Game.wave * 1.5)); // Augmenté
        const baseSpawnRate = 0.04; // Réduit de 0.06 à 0.04 pour spawn plus lent
        const waveSpawnBonus = Game.wave * 0.005; // Réduction du bonus par vague
        const spawnRate = Math.min(baseSpawnRate + waveSpawnBonus, 0.08); // Cap réduit
        
        if (this.list.length < maxActiveEnemies && 
            this.waveEnemiesSpawned < this.maxEnemiesPerWave && 
            Math.random() < spawnRate) {
            
            this.create();
            this.waveEnemiesSpawned++;
            console.log(`Spawned enemy ${this.waveEnemiesSpawned}/${this.maxEnemiesPerWave} for wave ${Game.wave}`);
        }
    }
};