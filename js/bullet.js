// Module des balles
const Bullet = {
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
        
        if (distance > 0) {
            this.list.push({
                x: Player.data.x,
                y: Player.data.y,
                vx: (dx / distance) * Player.data.bulletSpeed,
                vy: (dy / distance) * Player.data.bulletSpeed,
                radius: Player.data.bulletSize,
                length: Player.data.bulletLength,
                color: '#ff0'
            });
            Audio.playSoundEffect('shoot');
        }
    },
    
    update() {
        for (let i = this.list.length - 1; i >= 0; i--) {
            const bullet = this.list[i];
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            
            // Supprimer les balles qui sortent du monde
            if (bullet.x < 0 || bullet.x > CONFIG.WORLD.WIDTH || 
                bullet.y < 0 || bullet.y > CONFIG.WORLD.HEIGHT) {
                this.list.splice(i, 1);
                continue;
            }
            
            // Collision avec les ennemis
            for (let j = Enemy.list.length - 1; j >= 0; j--) {
                const enemy = Enemy.list[j];
                const distance = Math.sqrt((bullet.x - enemy.x) ** 2 + (bullet.y - enemy.y) ** 2);
                
                if (distance < bullet.radius + enemy.radius) {
                    this.list.splice(i, 1);
                    Enemy.takeDamage(enemy);
                    break;
                }
            }
        }
    }
};