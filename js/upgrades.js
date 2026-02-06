import { CONFIG } from './config.js';
import { Audio } from './audio.js';
import { Player } from './player.js';
import { Enemy } from './enemy.js';
import { Particle } from './particle.js';
import { Orb } from './orb.js';
import { i18n } from './i18n.js';


// Upgrades module
export const Upgrades = {
    options: [],

    generateOptions() {
        const getUpgradeInfo = (upgradeName, currentValue, increment, minValue) => {
            let nextValue;
            if (upgradeName === 'fireRate') {
                nextValue = Math.max(minValue, currentValue + increment);
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

        const getAllAvailableUpgrades = () => {
            const upgrades = [];

            // === BASE UPGRADES ===
            if (Player.data.fireRate > (CONFIG.PLAYER.MIN_FIRE_RATE ?? 8)) {
                const info = getUpgradeInfo('fireRate', Player.data.fireRate, -1, (CONFIG.PLAYER.MIN_FIRE_RATE ?? 8));
                if (info.next < info.current) {
                    upgrades.push({
                        name: i18n.t('upgrade_fire_rate_name'),
                        desc: i18n.t('upgrade_fire_rate_desc', { current: info.current, next: info.next, max: info.max }),
                        priority: 3,
                        apply: () => Player.upgrade('fireRate', -1)
                    });
                }
            }

            if (Player.data.speed < 6) {
                const info = getUpgradeInfo('speed', Player.data.speed, 0.8, 6);
                upgrades.push({
                    name: i18n.t('upgrade_speed_name'),
                    desc: i18n.t('upgrade_speed_desc', { current: info.current.toFixed(1), next: info.next.toFixed(1), max: info.max }),
                    priority: 3,
                    apply: () => Player.upgrade('speed', 0.8)
                });
            }

            if (Player.data.bulletSpeed < 12) {
                const info = getUpgradeInfo('bulletSpeed', Player.data.bulletSpeed, 1.5, 12);
                upgrades.push({
                    name: i18n.t('upgrade_bullet_speed_name'),
                    desc: i18n.t('upgrade_bullet_speed_desc', { current: info.current.toFixed(1), next: info.next.toFixed(1), max: info.max }),
                    priority: 2,
                    apply: () => Player.upgrade('bulletSpeed', 1.5)
                });
            }

            if (!Player.data.range || Player.data.range < 400) {
                const currentRange = Player.data.range || 200;
                const info = getUpgradeInfo('range', currentRange, 40, 400);
                upgrades.push({
                    name: i18n.t('upgrade_range_name'),
                    desc: i18n.t('upgrade_range_desc', { current: info.current, next: info.next, max: info.max }),
                    priority: 2,
                    apply: () => Player.upgrade('range', 40)
                });
            }

            if (Player.data.magnetRange < 200) {
                const info = getUpgradeInfo('magnetRange', Player.data.magnetRange, 30, 200);
                upgrades.push({
                    name: i18n.t('upgrade_magnet_name'),
                    desc: i18n.t('upgrade_magnet_desc', { current: info.current, next: info.next, max: info.max }),
                    priority: 2,
                    apply: () => Player.upgrade('magnetRange', 30)
                });
            }

            // === WEAPON UPGRADES (one-time each) ===
            if (!Player.data.tripleShot) {
                upgrades.push({
                    name: i18n.t('upgrade_triple_name'),
                    desc: i18n.t('upgrade_triple_desc'),
                    priority: 4,
                    apply: () => Player.upgrade('tripleShot')
                });
            }

            if (!Player.data.shotgunBlast) {
                upgrades.push({
                    name: i18n.t('upgrade_shotgun_name'),
                    desc: i18n.t('upgrade_shotgun_desc'),
                    priority: 4,
                    apply: () => Player.upgrade('shotgunBlast')
                });
            }

            if (!Player.data.homingMissiles) {
                upgrades.push({
                    name: i18n.t('upgrade_homing_name'),
                    desc: i18n.t('upgrade_homing_desc'),
                    priority: 4,
                    apply: () => Player.upgrade('homingMissiles')
                });
            }

            if (!Player.data.explosiveCannon) {
                upgrades.push({
                    name: i18n.t('upgrade_explosive_name'),
                    desc: i18n.t('upgrade_explosive_desc'),
                    priority: 4,
                    apply: () => Player.upgrade('explosiveCannon')
                });
            }

            // === ORB UPGRADES (with limits) ===
            const maxOrbs = CONFIG.ORBS.MAX_TOTAL || 9;
            const currentOrbs = Player.data.orbCount || 0;

            if (currentOrbs < maxOrbs) {
                upgrades.push({
                    name: i18n.t('upgrade_orbital_name'),
                    desc: i18n.t('upgrade_orbital_desc', { current: currentOrbs, next: currentOrbs + 1, max: maxOrbs }),
                    priority: 3,
                    apply: () => Player.upgrade('orbCount', 1)
                });
            }

            const maxOrbSpeed = CONFIG.ORBS.MAX_SPEED || 1.0;
            const currentOrbSpeed = Player.data.orbSpeed || 1.0;

            if (currentOrbs > 0 && currentOrbSpeed < maxOrbSpeed) {
                const info = getUpgradeInfo('orbSpeed', currentOrbSpeed, 0.15, maxOrbSpeed);
                upgrades.push({
                    name: i18n.t('upgrade_orb_speed_name'),
                    desc: i18n.t('upgrade_orb_speed_desc', { current: info.current.toFixed(2), next: info.next.toFixed(2), max: info.max }),
                    priority: 2,
                    apply: () => Player.upgrade('orbSpeed', 0.15)
                });
            }

            if (currentOrbs > 0 && !Orb.shootingEnabled) {
                upgrades.push({
                    name: i18n.t('upgrade_armed_orbs_name'),
                    desc: i18n.t('upgrade_armed_orbs_desc'),
                    priority: 4,
                    apply: () => Player.upgrade('orbShooting')
                });
            }

            // === HEALTH UPGRADE ===
            upgrades.push({
                name: i18n.t('upgrade_health_name'),
                desc: i18n.t('upgrade_health_desc', { current: Game.lives, next: Game.lives + 1 }),
                priority: 1,
                apply: () => Game.lives++
            });

            return upgrades;
        };

        const availableUpgrades = getAllAvailableUpgrades();

        if (availableUpgrades.length === 0) {
            // === FALLBACK: No upgrades available, give gems ===
            const bonus = 25 + Math.floor(Game.wave * 5);
            this.options = [
                {
                    name: i18n.t('upgrade_gem_bonus_name'),
                    desc: i18n.t('upgrade_gem_bonus_desc'),
                    apply: () => {
                        Game.gems += bonus;
                    }
                },
                {
                    name: i18n.t('upgrade_gem_windfall_name'),
                    desc: i18n.t('upgrade_gem_windfall_desc'),
                    apply: () => {
                        const bonus = 50 + Math.floor(Game.wave * 8);
                        Game.gems += bonus;
                    }
                },
                {
                    name: i18n.t('upgrade_full_health_name'),
                    desc: i18n.t('upgrade_full_health_desc'),
                    apply: () => {
                        Game.lives = Math.max(Game.lives, 3);
                        const bonus = 15 + Math.floor(Game.wave * 3);
                        Game.gems += bonus;
                    }
                }
            ];
            return;
        }

        // === SMART SELECTION: Prioritize important upgrades ===
        const selectUpgradesByPriority = () => {
            const selected = [];
            const highPriority = availableUpgrades.filter(u => u.priority >= 4);
            const mediumPriority = availableUpgrades.filter(u => u.priority === 3);
            const lowPriority = availableUpgrades.filter(u => u.priority <= 2);

            if (highPriority.length > 0) {
                const count = Math.min(2, highPriority.length);
                for (let i = 0; i < count; i++) {
                    const index = Math.floor(Math.random() * highPriority.length);
                    selected.push(highPriority.splice(index, 1)[0]);
                }
            }

            const remaining = [...mediumPriority, ...lowPriority];
            while (selected.length < 3 && remaining.length > 0) {
                const index = Math.floor(Math.random() * remaining.length);
                selected.push(remaining.splice(index, 1)[0]);
            }

            return selected;
        };

        this.options = selectUpgradesByPriority();

        while (this.options.length < 3 && availableUpgrades.length > 0) {
            const index = Math.floor(Math.random() * availableUpgrades.length);
            this.options.push(availableUpgrades.splice(index, 1)[0]);
        }

        while (this.options.length < 3) {
            const gemBonus = 20 + Math.floor(Game.gemsForUpgrade / 5);
            this.options.push({
                name: i18n.t('upgrade_gems_name', { amount: gemBonus }),
                desc: i18n.t('upgrade_gems_desc'),
                apply: () => {
                    Game.gems += gemBonus;
                }
            });
        }

        console.log(`Generated upgrades: ${this.options.map(o => o.name).join(', ')}`);
    },

    generateReviveOptions() {
        const areAllUpgradesMaxed = () => {
            const maxOrbs = CONFIG.ORBS.MAX_TOTAL || 9;
            const maxOrbSpeed = CONFIG.ORBS.MAX_SPEED || 1.0;
            const currentOrbs = Player.data.orbCount || 0;
            const currentOrbSpeed = Player.data.orbSpeed || 1.0;

            return (
                Player.data.tripleShot &&
                Player.data.shotgunBlast &&
                Player.data.homingMissiles &&
                Player.data.explosiveCannon &&
                Player.data.fireRate <= 8 &&
                Player.data.speed >= 6 &&
                Player.data.bulletSpeed >= 12 &&
                (Player.data.range && Player.data.range >= 400) &&
                Player.data.magnetRange >= 200 &&
                currentOrbs >= maxOrbs &&
                currentOrbSpeed >= maxOrbSpeed &&
                Orb.shootingEnabled
            );
        };

        if (areAllUpgradesMaxed()) {
            // === ALL UPGRADES MAXED: Gem multipliers ===
            const reviveMultipliers = [
                {
                    name: i18n.t('revive_gem_x2_name'),
                    desc: i18n.t('revive_gem_x2_desc'),
                    benefit: i18n.t('revive_gem_x2_benefit'),
                    apply: () => {
                        if (!Player.data.gemMultiplier) Player.data.gemMultiplier = 1;
                        Player.data.gemMultiplier *= 2;
                        const immediateBonus = 100 + Math.floor(Game.wave * 20);
                        Game.gems += immediateBonus;
                    }
                },
                {
                    name: i18n.t('revive_gem_x3_name'),
                    desc: i18n.t('revive_gem_x3_desc'),
                    benefit: i18n.t('revive_gem_x3_benefit'),
                    apply: () => {
                        if (!Player.data.gemMultiplier) Player.data.gemMultiplier = 1;
                        Player.data.gemMultiplier *= 3;
                        const windfall = 200 + Math.floor(Game.wave * 35);
                        Game.gems += windfall;
                    }
                },
                {
                    name: i18n.t('revive_gem_x5_name'),
                    desc: i18n.t('revive_gem_x5_desc'),
                    benefit: i18n.t('revive_gem_x5_benefit'),
                    apply: () => {
                        if (!Player.data.gemMultiplier) Player.data.gemMultiplier = 1;
                        Player.data.gemMultiplier *= 5;
                        const megaBonus = 500 + Math.floor(Game.wave * 50);
                        Game.gems += megaBonus;
                    }
                }
            ];

            this.options = [];
            for (let i = 0; i < 3; i++) {
                const index = Math.floor(Math.random() * reviveMultipliers.length);
                this.options.push(reviveMultipliers.splice(index, 1)[0]);
            }
            return;
        }

        // === NORMAL: Classic resurrection upgrades ===
        const reviveUpgrades = [
            {
                name: i18n.t('revive_phoenix_name'),
                desc: i18n.t('revive_phoenix_desc'),
                benefit: i18n.t('revive_phoenix_benefit'),
                apply: () => {
                    const currentFireRate = Player.data.fireRate;
                    const minFireRate = 8;
                    let fireRateBoost = Math.min(Math.floor(currentFireRate * 0.4), 15);
                    let newFireRate = Math.max(minFireRate, currentFireRate - fireRateBoost);
                    let actualBoost = currentFireRate - newFireRate;
                    if (actualBoost > 0) {
                        Player.upgrade('fireRate', -actualBoost);
                    }
                    Player.upgrade('bulletSpeed', 3);
                }
            },
            {
                name: i18n.t('revive_ghost_name'),
                desc: i18n.t('revive_ghost_desc'),
                benefit: i18n.t('revive_ghost_benefit'),
                apply: () => {
                    const currentSpeed = Player.data.speed;
                    const speedBoost = Math.min(1.5, 6 - currentSpeed);
                    Player.upgrade('speed', speedBoost);
                    Player.data.invulnerable = true;
                    Player.data.invulnerableTime = 720;
                }
            },
            {
                name: i18n.t('revive_berserker_name'),
                desc: i18n.t('revive_berserker_desc'),
                benefit: i18n.t('revive_berserker_benefit'),
                apply: () => {
                    const maxOrbs = CONFIG.ORBS.MAX_TOTAL || 9;
                    const currentOrbs = Player.data.orbCount || 0;
                    const orbsToAdd = Math.min(3, maxOrbs - currentOrbs);

                    if (orbsToAdd > 0) {
                        for(let i = 0; i < orbsToAdd; i++) {
                            Player.upgrade('orbCount', 1);
                        }
                    }

                    Player.data.orbDamage += 30;

                    if (orbsToAdd < 3) {
                        const compensation = 3 - orbsToAdd;
                        const maxOrbSpeed = CONFIG.ORBS.MAX_SPEED || 1.0;
                        const currentOrbSpeed = Player.data.orbSpeed || 1.0;
                        if (currentOrbSpeed < maxOrbSpeed) {
                            const speedBoost = Math.min(0.3, maxOrbSpeed - currentOrbSpeed);
                            Player.upgrade('orbSpeed', speedBoost);
                        }
                        const gemBonus = compensation * 15;
                        Game.gems += gemBonus;
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
            const selectedUpgrade = this.options[index];
            selectedUpgrade.apply();
            Game.gems -= Game.gemsForUpgrade;
            Game.gemsForUpgrade = Math.floor(Game.gemsForUpgrade * CONFIG.UPGRADES.COST_MULTIPLIER);

            Game.onUpgrade();

            Game.state = 'playing';
            this.options = [];

            Audio.playSoundEffect('upgrade');
            Particle.createExplosion(Player.data.x, Player.data.y, '#FFD700', 20);

            console.log(`Upgrade applied: ${selectedUpgrade.name}`);
        }
    },

    selectRevive(index) {
        if (this.options[index]) {
            this.options[index].apply();
            Game.resurrections++;

            Game.lives = 3;

            Game.state = 'playing';
            this.options = [];
            Audio.playSoundEffect('revive');
            document.getElementById('reviveScreen').style.display = 'none';

            Player.data.x = CONFIG.WORLD.WIDTH / 2;
            Player.data.y = CONFIG.WORLD.HEIGHT / 2;

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
