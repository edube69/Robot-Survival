// Module des ennemis
const Enemy = {
    list: [],
    
    init() {
        this.list = [];
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
        
        // Déterminer le type d'ennemi
        const rand = Math.random();
        let enemyType = 'basic';
        
        if (Game.wave >= 2) {
            if (rand < 0.5) enemyType = 'basic';
            else if (rand < 0.75) enemyType = 'fast';
            else if (rand < 0.9) enemyType = 'tank';
            else enemyType = 'splitter';
        }
        
        const enemyData = CONFIG.ENEMIES.TYPES[enemyType];
        const enemy = {
            x, y,
            radius: enemyData.radius,
            speed: enemyData.speedBase + Math.random() * enemyData.speedVariation,
            color: enemyData.color,
            health: enemyData.health,
            maxHealth: enemyData.health,
            points: enemyData.points,
            shape: enemyData.shape,
            type: enemyType,
            // Propriétés d'animation
            animTime: Math.random() * Math.PI * 2,
            thrusterFlicker: 0,
            rotationAngle: Math.random() * Math.PI * 2,
            pulsePhase: Math.random() * Math.PI * 2
        };
        
        this.list.push(enemy);
    },
    
    update() {
        if (Game.state !== 'playing' || !Player.data) return;
        
        for (let i = this.list.length - 1; i >= 0; i--) {
            const enemy = this.list[i];
            
            // Mouvement vers le joueur
            const dx = Player.data.x - enemy.x;
            const dy = Player.data.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                enemy.x += (dx / distance) * enemy.speed;
                enemy.y += (dy / distance) * enemy.speed;
            }
            
            // Mise à jour des animations
            enemy.animTime += 0.1;
            enemy.thrusterFlicker = Math.random();
            enemy.rotationAngle += (enemy.type === 'fast' ? 0.15 : 0.05);
            enemy.pulsePhase += 0.08;
            
            // Collision avec le joueur
            const playerDistance = Math.sqrt((enemy.x - Player.data.x) ** 2 + (enemy.y - Player.data.y) ** 2);
            if (playerDistance < enemy.radius + Player.data.radius) {
                if (Player.takeDamage()) {
                    // Le joueur a pris des dégâts, on peut continuer
                }
            }
        }
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
            Particle.createExplosion(enemy.x, enemy.y, enemy.color, 8);
            Currency.create(enemy.x, enemy.y);
            Audio.playSoundEffect('enemyHit');
            
            if (Player.data.vampiric && Game.lives < CONFIG.LIMITS.MAX_LIVES) {
                Game.lives++;
            }
            
            const index = this.list.indexOf(enemy);
            if (index > -1) {
                this.list.splice(index, 1);
            }
            Game.score += enemy.points;
            return true;
        } else {
            Particle.createExplosion(enemy.x, enemy.y, enemy.color, 3);
            return false;
        }
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
        if (Game.state !== 'playing') return;
        
        // Spawn plus agressif pour les hordes
        const enemiesNeeded = Math.min(8 + Game.wave * 2, CONFIG.ENEMIES.MAX_COUNT);
        const spawnRate = 0.08 + Game.wave * 0.02;
        
        if (this.list.length < enemiesNeeded && Math.random() < spawnRate) {
            this.create();
            
            // Chance de spawn multiple (effet de horde)
            if (Game.wave > 2 && Math.random() < 0.3) {
                setTimeout(() => this.create(), 100);
            }
            if (Game.wave > 4 && Math.random() < 0.2) {
                setTimeout(() => this.create(), 200);
            }
            if (Game.wave > 6 && Math.random() < 0.1) {
                setTimeout(() => this.create(), 300);
            }
        }
        
        // Nouvelle vague si tous les ennemis sont morts
        if (this.list.length === 0) {
            Game.wave++;
            const initialSpawn = Math.min(5 + Game.wave * 2, 15);
            for (let i = 0; i < initialSpawn; i++) {
                setTimeout(() => this.create(), i * 200);
            }
        }
    }
};