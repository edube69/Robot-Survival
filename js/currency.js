// Module des gemmes/monnaie
const Currency = {
    list: [],
    
    init() {
        this.list = [];
    },
    
    create(x, y) {
        const value = Math.random() < CONFIG.CURRENCY.HIGH_VALUE_CHANCE ? CONFIG.CURRENCY.HIGH_VALUE : CONFIG.CURRENCY.LOW_VALUE;
        const colors = value === CONFIG.CURRENCY.HIGH_VALUE ? CONFIG.CURRENCY.COLORS.HIGH : CONFIG.CURRENCY.COLORS.LOW;
        this.list.push({
            x: x + (Math.random() - 0.5) * 20,
            y: y + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            radius: value === CONFIG.CURRENCY.HIGH_VALUE ? 6 : 4,
            value: value,
            colors: colors, // stocke les couleurs d'or
            magnetized: false,
            bobOffset: Math.random() * Math.PI * 2,
            spinAngle: Math.random() * Math.PI * 2 // angle de rotation initial
        });
    },
    
    update() {
        if (!Player.data) return;
        
        for (let i = this.list.length - 1; i >= 0; i--) {
            const drop = this.list[i];
            
            const dx = Player.data.x - drop.x;
            const dy = Player.data.y - drop.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
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
                Game.gems += drop.value;
                Particle.createExplosion(drop.x, drop.y, drop.colors.BRIGHT, 4);
                this.list.splice(i, 1);
                Audio.playSoundEffect('gemCollect');
                
                // Vérifier s'il faut déclencher une amélioration
                if (Game.gems >= Game.gemsForUpgrade) {
                    Game.state = 'upgrade';
                    Upgrades.generateOptions();
                    Audio.playSoundEffect('upgrade');
                }
            }
            
            // Animation: bobbing et rotation
            drop.bobOffset += 0.1;
            drop.spinAngle += CONFIG.CURRENCY.SPIN_SPEED;
        }
    }
};