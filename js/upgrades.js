import { CONFIG } from './config.js';
import { Audio } from './audio.js';
import { Player } from './player.js';
import { Enemy } from './enemy.js';
import { Particle } from './particle.js';
import { Orb } from './orb.js';


// Module des am�liorations
export const Upgrades = {
    options: [],
    
    generateOptions() {
        // === NOUVELLE FONCTION : Calculer les informations de niveau ===
        const getUpgradeInfo = (upgradeName, currentValue, increment, minValue) => {
            let nextValue;
            if (upgradeName === 'fireRate') {
                // Pour fireRate, on diminue la valeur (frames entre tirs)
                nextValue = Math.max(minValue, currentValue + increment); // increment est négatif, minValue est la valeur minimale
                // S'assurer que nextValue n'est jamais supérieur à currentValue
                if (nextValue > currentValue) nextValue = currentValue;
            } else {
                nextValue = Math.min(minValue, currentValue + increment);
            }
            
            return {
                current: currentValue,
                next: nextValue,
                max: minValue
            };
        };
        
        // === NOUVEAU SYST�ME : Upgrades intelligentes avec v�rification des pr�requis ===
        const getAllAvailableUpgrades = () => {
            const upgrades = [];
            
            // === UPGRADES DE BASE (toujours disponibles avec limites) ===
            if (Player.data.fireRate > (CONFIG.PLAYER.MIN_FIRE_RATE ?? 8)) {
                const info = getUpgradeInfo('fireRate', Player.data.fireRate, -1, (CONFIG.PLAYER.MIN_FIRE_RATE ?? 8));
                // Ne proposer l'upgrade que si nextValue < current
                if (info.next < info.current) {
                    upgrades.push({ 
                        name: "Fire Rate+", 
                        desc: `Shoot faster (${info.current}->${info.next} frames, max: ${info.max})`, 
                        priority: 3,
                        apply: () => Player.upgrade('fireRate', -1)
                    });
                }
            }
            
            if (Player.data.speed < 6) {
                const info = getUpgradeInfo('speed', Player.data.speed, 0.8, 6);
                upgrades.push({ 
                    name: "Speed+", 
                    desc: `Move faster (${info.current.toFixed(1)}?${info.next.toFixed(1)}, max: ${info.max})`, 
                    priority: 3,
                    apply: () => Player.upgrade('speed', 0.8)
                });
            }
            
            if (Player.data.bulletSpeed < 12) {
                const info = getUpgradeInfo('bulletSpeed', Player.data.bulletSpeed, 1.5, 12);
                upgrades.push({ 
                    name: "Bullet Speed+", 
                    desc: `Bullets fly faster (${info.current.toFixed(1)}?${info.next.toFixed(1)}, max: ${info.max})`, 
                    priority: 2,
                    apply: () => Player.upgrade('bulletSpeed', 1.5)
                });
            }
            
            if (!Player.data.range || Player.data.range < 400) {
                const currentRange = Player.data.range || 200; // Valeur par d�faut
                const info = getUpgradeInfo('range', currentRange, 40, 400);
                upgrades.push({ 
                    name: "Range+", 
                    desc: `Shoot further (${info.current}?${info.next}, max: ${info.max})`, 
                    priority: 2,
                    apply: () => Player.upgrade('range', 40)
                });
            }
            
            if (Player.data.magnetRange < 200) {
                const info = getUpgradeInfo('magnetRange', Player.data.magnetRange, 30, 200);
                upgrades.push({ 
                    name: "Magnet Upgrade", 
                    desc: `Attract gems from further away (${info.current}?${info.next}, max: ${info.max})`, 
                    priority: 2,
                    apply: () => Player.upgrade('magnetRange', 30)
                });
            }
            
            // === UPGRADES D'ARMES (une seule fois chacune) ===
            if (!Player.data.tripleShot) {
                upgrades.push({ 
                    name: "Triple Shot", 
                    desc: "Fire 3 bullets at once (UNLOCK)", 
                    priority: 4,
                    apply: () => Player.upgrade('tripleShot')
                });
            }
            
            if (!Player.data.shotgunBlast) {
                upgrades.push({ 
                    name: "Shotgun Blast", 
                    desc: "Spread shot pellets (UNLOCK)", 
                    priority: 4,
                    apply: () => Player.upgrade('shotgunBlast')
                });
            }
            
            if (!Player.data.homingMissiles) {
                upgrades.push({ 
                    name: "Homing Missiles", 
                    desc: "Heat-seeking rockets (UNLOCK)", 
                    priority: 4,
                    apply: () => Player.upgrade('homingMissiles')
                });
            }
            
            if (!Player.data.explosiveCannon) {
                upgrades.push({ 
                    name: "Explosive Cannon", 
                    desc: "Area damage blasts (UNLOCK)", 
                    priority: 4,
                    apply: () => Player.upgrade('explosiveCannon')
                });
            }
            
            // === UPGRADES D'ORBES (avec limites) ===
            const maxOrbs = CONFIG.ORBS.MAX_TOTAL || 9;
            const currentOrbs = Player.data.orbCount || 0;
            
            if (currentOrbs < maxOrbs) {
                upgrades.push({ 
                    name: "Orbital Shield", 
                    desc: `Add protective orb (${currentOrbs}?${currentOrbs + 1}, max: ${maxOrbs})`, 
                    priority: 3,
                    apply: () => Player.upgrade('orbCount', 1)
                });
            }
            
            const maxOrbSpeed = CONFIG.ORBS.MAX_SPEED || 1.0;
            const currentOrbSpeed = Player.data.orbSpeed || 1.0;
            
            if (currentOrbs > 0 && currentOrbSpeed < maxOrbSpeed) {
                const info = getUpgradeInfo('orbSpeed', currentOrbSpeed, 0.15, maxOrbSpeed);
                upgrades.push({ 
                    name: "Orb Velocity+", 
                    desc: `Orbs rotate faster (${info.current.toFixed(2)}?${info.next.toFixed(2)}, max: ${info.max})`, 
                    priority: 2,
                    apply: () => Player.upgrade('orbSpeed', 0.15)
                });
            }
            
            if (currentOrbs > 0 && !Orb.shootingEnabled) {
                upgrades.push({ 
                    name: "Armed Orbs", 
                    desc: "Orbs can shoot enemies (UNLOCK)", 
                    priority: 4,
                    apply: () => Player.upgrade('orbShooting')
                });
            }
            
            // === UPGRADE DE VIE (toujours disponible mais co�teuse) ===
            upgrades.push({ 
                name: "Health+", 
                desc: `Gain extra life (${Game.lives}?${Game.lives + 1})`, 
                priority: 1, // Priorit� basse
                apply: () => Game.lives++
            });
            
            return upgrades;
        };
        
        // Obtenir toutes les upgrades disponibles
        const availableUpgrades = getAllAvailableUpgrades();
        
        if (availableUpgrades.length === 0) {
            // === FALLBACK : Si aucune upgrade disponible, donner des gems ===
            const bonus = 25 + Math.floor(Game.wave * 5);
            this.options = [
                {
                    name: `${bonus} Gem Bonus`,
                    desc: "Receive extra gems",
                    apply: () => {
                        Game.gems += bonus;
                        console.log(`?? All upgrades maxed! Received ${bonus} gems bonus!`);
                    }
                },
                {
                    name: "?? Gem Windfall",
                    desc: "Receive massive gem bonus",
                    apply: () => {
                        const bonus = 50 + Math.floor(Game.wave * 8);
                        Game.gems += bonus;
                        console.log(`?? All upgrades maxed! Received ${bonus} gems windfall!`);
                    }
                },
                {
                    name: "?? Full Health",
                    desc: "Restore all lives",
                    apply: () => {
                        Game.lives = Math.max(Game.lives, 3);
                        const bonus = 15 + Math.floor(Game.wave * 3);
                        Game.gems += bonus;
                        console.log(`?? Health restored + ${bonus} gems bonus!`);
                    }
                }
            ];
            return;
        }
        
        // === S�LECTION INTELLIGENTE : Prioriser les upgrades importantes ===
        const selectUpgradesByPriority = () => {
            const selected = [];
            
            // S�parer par priorit�
            const highPriority = availableUpgrades.filter(u => u.priority >= 4);
            const mediumPriority = availableUpgrades.filter(u => u.priority === 3);
            const lowPriority = availableUpgrades.filter(u => u.priority <= 2);
            
            // S�lectionner 1-2 upgrades de haute priorit� si disponibles
            if (highPriority.length > 0) {
                const count = Math.min(2, highPriority.length);
                for (let i = 0; i < count; i++) {
                    const index = Math.floor(Math.random() * highPriority.length);
                    selected.push(highPriority.splice(index, 1)[0]);
                }
            }
            
            // Compl�ter avec des upgrades de priorit� moyenne/basse
            const remaining = [...mediumPriority, ...lowPriority];
            while (selected.length < 3 && remaining.length > 0) {
                const index = Math.floor(Math.random() * remaining.length);
                selected.push(remaining.splice(index, 1)[0]);
            }
            
            return selected;
        };
        
        this.options = selectUpgradesByPriority();
        
        // S'assurer qu'on a toujours 3 options
        while (this.options.length < 3 && availableUpgrades.length > 0) {
            const index = Math.floor(Math.random() * availableUpgrades.length);
            this.options.push(availableUpgrades.splice(index, 1)[0]);
        }
        
        // Fallback final : dupliquer les derni�res options si n�cessaire
        while (this.options.length < 3) {
            const gemBonus = 20 + Math.floor(Game.wave * 3);
            this.options.push({
                name: `?? ${gemBonus} Gems`,
                desc: "Extra currency bonus",
                apply: () => {
                    Game.gems += gemBonus;
                    console.log(`?? Received ${gemBonus} gems bonus!`);
                }
            });
        }
        
        console.log(`Generated upgrades: ${this.options.map(o => o.name).join(', ')}`);
    },
    
    generateReviveOptions() {
        // === NOUVEAU : V�rifier si tous les upgrades sont max�s ===
        const areAllUpgradesMaxed = () => {
            const maxOrbs = CONFIG.ORBS.MAX_TOTAL || 9;
            const maxOrbSpeed = CONFIG.ORBS.MAX_SPEED || 1.0;
            const currentOrbs = Player.data.orbCount || 0;
            const currentOrbSpeed = Player.data.orbSpeed || 1.0;
            
            return (
                // Armes toutes d�bloqu�es
                Player.data.tripleShot &&
                Player.data.shotgunBlast &&
                Player.data.homingMissiles &&
                Player.data.explosiveCannon &&
                
                // Stats de base max�es
                Player.data.fireRate <= 8 &&
                Player.data.speed >= 6 &&
                Player.data.bulletSpeed >= 12 &&
                (Player.data.range && Player.data.range >= 400) &&
                Player.data.magnetRange >= 200 &&
                
                // Orbes max�es
                currentOrbs >= maxOrbs &&
                currentOrbSpeed >= maxOrbSpeed &&
                Orb.shootingEnabled
            );
        };
        
        if (areAllUpgradesMaxed()) {
            // === SI TOUS LES UPGRADES SONT MAX�S : Multiplicateurs de gems ===
            const reviveMultipliers = [
                { 
                    name: "?? Gem Multiplier x2", 
                    desc: "Double all gem gains permanently",
                    benefit: "x2 gem multiplier for this run",
                    apply: () => {
                        if (!Player.data.gemMultiplier) Player.data.gemMultiplier = 1;
                        Player.data.gemMultiplier *= 2;
                        
                        // Bonus imm�diat de gems
                        const immediateBonus = 100 + Math.floor(Game.wave * 20);
                        Game.gems += immediateBonus;
                        
                        console.log(`?? GEM MULTIPLIER x2! Now at x${Player.data.gemMultiplier} multiplier! +${immediateBonus} bonus gems!`);
                    }
                },
                { 
                    name: "?? Gem Windfall x3", 
                    desc: "Triple gem gains + massive bonus",
                    benefit: "x3 gem multiplier + windfall bonus",
                    apply: () => {
                        if (!Player.data.gemMultiplier) Player.data.gemMultiplier = 1;
                        Player.data.gemMultiplier *= 3;
                        
                        // Bonus massif imm�diat
                        const windfall = 200 + Math.floor(Game.wave * 35);
                        Game.gems += windfall;
                        
                        console.log(`?? GEM WINDFALL x3! Now at x${Player.data.gemMultiplier} multiplier! +${windfall} windfall bonus!`);
                    }
                },
                { 
                    name: "?? Gem Mastery x5", 
                    desc: "Ultimate gem multiplier + mega bonus",
                    benefit: "x5 gem multiplier + ultimate bonus",
                    apply: () => {
                        if (!Player.data.gemMultiplier) Player.data.gemMultiplier = 1;
                        Player.data.gemMultiplier *= 5;
                        
                        // Bonus ultime
                        const megaBonus = 500 + Math.floor(Game.wave * 50);
                        Game.gems += megaBonus;
                        
                        console.log(`?? GEM MASTERY x5! Now at x${Player.data.gemMultiplier} multiplier! +${megaBonus} mega bonus!`);
                    }
                }
            ];
            
            this.options = [];
            for (let i = 0; i < 3; i++) {
                const index = Math.floor(Math.random() * reviveMultipliers.length);
                this.options.push(reviveMultipliers.splice(index, 1)[0]);
            }
            
            console.log("?? All upgrades maxed! Offering gem multipliers instead.");
            return;
        }
        
        // === SYST�ME NORMAL : Upgrades de r�surrection classiques ===
        const reviveUpgrades = [
            { 
                name: "Phoenix Protocol", 
                desc: "Massive fire rate + flame bullets",
                benefit: "Fire rate boost + bullet speed",
                apply: () => {
                    // Am�lioration significative mais �quilibr�e du taux de tir
                    const currentFireRate = Player.data.fireRate;
                    const minFireRate = 8;
                    let fireRateBoost = Math.min(Math.floor(currentFireRate * 0.4), 15); // Max 15 frames de r�duction
                    let newFireRate = Math.max(minFireRate, currentFireRate - fireRateBoost);
                    let actualBoost = currentFireRate - newFireRate;
                    if (actualBoost > 0) {
                        Player.upgrade('fireRate', -actualBoost);
                        console.log(`?? PHOENIX PROTOCOL! Fire rate boosted by ${actualBoost} frames, bullet speed +3!`);
                    } else {
                        console.log("?? PHOENIX PROTOCOL! Fire rate already at minimum, only bullet speed boosted!");
                    }
                    // Boost de vitesse des balles
                    Player.upgrade('bulletSpeed', 3);
                }
            },
            { 
                name: "Ghost Mode", 
                desc: "Extended invincibility + speed boost", 
                benefit: "12 seconds invulnerable + speed",
                apply: () => {
                    // Boost de vitesse �quilibr� 
                    const currentSpeed = Player.data.speed;
                    const speedBoost = Math.min(1.5, 6 - currentSpeed); // Respecter la limite de vitesse
                    Player.upgrade('speed', speedBoost);
                    
                    // Invuln�rabilit� �tendue (12 secondes au lieu de 10)
                    Player.data.invulnerable = true;
                    Player.data.invulnerableTime = 720; // 12 secondes � 60 FPS
                    
                    console.log(`?? GHOST MODE! Speed boosted by ${speedBoost}, 12 seconds invulnerability!`);
                }
            },
            { 
                name: "Berserker Rage", 
                desc: "Orbital shields + massive damage",
                benefit: "Max orbs + +50% damage boost",
                apply: () => {
                    // === NOUVEAU : Respecter les limites d'orbes ===
                    const maxOrbs = CONFIG.ORBS.MAX_TOTAL || 9;
                    const currentOrbs = Player.data.orbCount || 0;
                    const orbsToAdd = Math.min(3, maxOrbs - currentOrbs); // Maximum 3 orbes ou jusqu'� la limite
                    
                    if (orbsToAdd > 0) {
                        for(let i = 0; i < orbsToAdd; i++) {
                            Player.upgrade('orbCount', 1);
                        }
                        console.log(`?? BERSERKER RAGE! +${orbsToAdd} orbital shields added! (${currentOrbs + orbsToAdd}/${maxOrbs})`);
                    } else {
                        console.log(`?? BERSERKER RAGE! Max orbs reached, but damage boost applied!`);
                    }
                    
                    // Toujours appliquer le bonus de d�g�ts
                    Player.data.orbDamage += 30;
                    
                    // === BONUS SUPPL�MENTAIRE si on ne peut pas ajouter d'orbes ===
                    if (orbsToAdd < 3) {
                        // Compensation avec autres am�liorations
                        const compensation = 3 - orbsToAdd;
                        
                        // Am�liorer la vitesse de rotation des orbes existantes
                        const maxOrbSpeed = CONFIG.ORBS.MAX_SPEED || 1.0;
                        const currentOrbSpeed = Player.data.orbSpeed || 1.0;
                        if (currentOrbSpeed < maxOrbSpeed) {
                            const speedBoost = Math.min(0.3, maxOrbSpeed - currentOrbSpeed);
                            Player.upgrade('orbSpeed', speedBoost);
                            console.log(`?? BERSERKER COMPENSATION! Orb speed boosted by ${speedBoost}!`);
                        }
                        
                        // Donner des gems bonus pour la compensation
                        const gemBonus = compensation * 15;
                        Game.gems += gemBonus;
                        console.log(`?? BERSERKER COMPENSATION! +${gemBonus} gems for maxed orbs!`);
                    }
                }
            }
        ];
        
        this.options = [];
        for (let i = 0; i < 3; i++) {
            const index = Math.floor(Math.random() * reviveUpgrades.length);
            this.options.push(reviveUpgrades.splice(index, 1)[0]);
        }
    },
    
    select(index) {
        if (this.options[index]) {
            const selectedUpgrade = this.options[index]; // Sauvegarder avant de vider
            selectedUpgrade.apply();
            Game.gems -= Game.gemsForUpgrade;
            Game.gemsForUpgrade = Math.floor(Game.gemsForUpgrade * CONFIG.UPGRADES.COST_MULTIPLIER);
            
            // Notifier le syst�me qu'une upgrade a �t� faite
            Game.onUpgrade();
            
            Game.state = 'playing';
            this.options = [];
            
            // Effets visuels et sonores
            Audio.playSoundEffect('upgrade');
            Particle.createExplosion(Player.data.x, Player.data.y, '#FFD700', 20);
            
            console.log(`Upgrade applied: ${selectedUpgrade.name}`);
        }
    },
    
    selectRevive(index) {
        if (this.options[index]) {
            this.options[index].apply();
            Game.resurrections++;
            
            // Restaurer les vies lors de la r�surrection
            Game.lives = 3;
            
            Game.state = 'playing';
            this.options = [];
            Audio.playSoundEffect('revive');
            document.getElementById('reviveScreen').style.display = 'none';
            
            Player.data.x = CONFIG.WORLD.WIDTH / 2;
            Player.data.y = CONFIG.WORLD.HEIGHT / 2;
            
            // Nettoyer les ennemis proches
            Enemy.clearNearby(Player.data.x, Player.data.y, 150);
            
            Particle.createExplosion(Player.data.x, Player.data.y, '#0ff', 20);
        }
    },
    
    skipResurrection() {
        Game.state = 'gameOver';
        document.getElementById('reviveScreen').style.display = 'none';
        document.getElementById('gameOver').style.display = 'block';
    }
};