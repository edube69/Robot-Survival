// Module des améliorations
const Upgrades = {
    options: [],
    
    generateOptions() {
        const upgrades = [
            { 
                name: "Fire Rate+", 
                desc: "Shoot faster", 
                apply: () => Player.upgrade('fireRate', 3)
            },
            { 
                name: "Speed+", 
                desc: "Move faster", 
                apply: () => Player.upgrade('speed', 0.8)
            },
            { 
                name: "Bullet Speed+", 
                desc: "Bullets fly faster", 
                apply: () => Player.upgrade('bulletSpeed', 1.5)
            },
            { 
                name: "Range+", 
                desc: "Shoot further", 
                apply: () => Player.upgrade('range', 40)
            },
            { 
                name: "Health+", 
                desc: "Gain extra life", 
                apply: () => Game.lives++
            },
            { 
                name: "Orbital Shield", 
                desc: "Add protective orb", 
                apply: () => Player.upgrade('orbCount', 1)
            }
        ];
        
        this.options = [];
        for (let i = 0; i < 3; i++) {
            const index = Math.floor(Math.random() * upgrades.length);
            this.options.push(upgrades.splice(index, 1)[0]);
        }
    },
    
    generateReviveOptions() {
        const reviveUpgrades = [
            { 
                name: "Phoenix Protocol", 
                desc: "Double fire rate + flame bullets",
                benefit: "+100% fire rate, flame damage",
                apply: () => {
                    Player.upgrade('fireRate', Math.floor(Player.data.fireRate * 0.5));
                    Player.upgrade('bulletSpeed', 3);
                }
            },
            { 
                name: "Ghost Mode", 
                desc: "Temporary invincibility + speed boost",
                benefit: "10 seconds invulnerable, +50% speed",
                apply: () => {
                    Player.upgrade('speed', 2);
                    Player.upgrade('invulnerability', 600);
                }
            },
            { 
                name: "Berserker Rage", 
                desc: "Triple orbs + massive damage",
                benefit: "+3 orbital shields, +50% damage",
                apply: () => {
                    for(let i = 0; i < 3; i++) {
                        Player.upgrade('orbCount', 1);
                    }
                    Player.data.orbDamage += 30;
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
            this.options[index].apply();
            Game.gems -= Game.gemsForUpgrade;
            Game.gemsForUpgrade = Math.floor(Game.gemsForUpgrade * CONFIG.UPGRADES.COST_MULTIPLIER);
            Game.state = 'playing';
            this.options = [];
        }
    },
    
    selectRevive(index) {
        if (this.options[index]) {
            this.options[index].apply();
            Game.resurrections++;
            
            // Restaurer les vies lors de la résurrection
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