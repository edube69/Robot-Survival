// Module des orbes orbitales
const Orb = {
    list: [],
    time: 0,
    
    init() {
        this.list = [];
        this.time = 0;
    },
    
    create() {
        if (!Player.data) return;
        
        this.list.push({
            angle: (this.list.length * (Math.PI * 2)) / Math.max(Player.data.orbCount, 1),
            radius: CONFIG.ORBS.RADIUS,
            distance: CONFIG.ORBS.DISTANCE,
            color: CONFIG.ORBS.COLOR,
            damage: Player.data.orbDamage,
            x: 0,
            y: 0
        });
    },
    
    update() {
        if (!Player.data) return;
        
        this.time += 0.05;
        
        for (let i = 0; i < this.list.length; i++) {
            const orb = this.list[i];
            orb.angle = (i * (Math.PI * 2)) / Math.max(this.list.length, 1) + this.time;
            
            orb.x = Player.data.x + Math.cos(orb.angle) * orb.distance;
            orb.y = Player.data.y + Math.sin(orb.angle) * orb.distance;
            
            // Collision avec les ennemis
            for (let j = Enemy.list.length - 1; j >= 0; j--) {
                const enemy = Enemy.list[j];
                const distance = Math.sqrt((orb.x - enemy.x) ** 2 + (orb.y - enemy.y) ** 2);
                
                if (distance < orb.radius + enemy.radius) {
                    if (Enemy.takeDamage(enemy)) {
                        Game.score += orb.damage;
                    }
                    break;
                }
            }
        }
    }
};