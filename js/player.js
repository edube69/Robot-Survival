// Module du joueur
const Player = {
    data: null,
    bulletCooldown: 0,
    
    init() {
        this.reset();
    },
    
    reset() {
        this.data = {
            x: CONFIG.WORLD.WIDTH / 2,
            y: CONFIG.WORLD.HEIGHT / 2,
            radius: CONFIG.PLAYER.RADIUS,
            speed: CONFIG.PLAYER.SPEED,
            color: CONFIG.PLAYER.COLOR,
            fireRate: CONFIG.PLAYER.FIRE_RATE,
            bulletSpeed: CONFIG.PLAYER.BULLET_SPEED,
            bulletSize: CONFIG.PLAYER.BULLET_SIZE,
            bulletLength: CONFIG.PLAYER.BULLET_LENGTH,
            range: CONFIG.PLAYER.RANGE,
            magnetRange: CONFIG.PLAYER.MAGNET_RANGE,
            followMouse: false,
            orbCount: 0,
            orbDamage: CONFIG.ORBS.DAMAGE,
            invulnerable: false,
            invulnerableTime: 0,
            vampiric: false,
            flameMode: false
        };
        this.bulletCooldown = 0;
    },
    
    update() {
        if (Game.state !== 'playing' || !this.data) return;
        
        // Gestion de l'invulnérabilité
        if (this.data.invulnerable && this.data.invulnerableTime > 0) {
            this.data.invulnerableTime--;
            if (this.data.invulnerableTime <= 0) {
                this.data.invulnerable = false;
            }
        }
        
        this.handleMovement();
        this.handleShooting();
    },
    
    handleMovement() {
        let moveX = 0, moveY = 0;
        
        if (this.data.followMouse) {
            // Convertir la position de la souris en coordonnées du monde
            const worldMouse = Camera.screenToWorld(Input.mouse.x, Input.mouse.y);
            
            const dx = worldMouse.x - this.data.x;
            const dy = worldMouse.y - this.data.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 20) {
                const normalizedSpeed = Math.min(distance / 100, 1);
                moveX = (dx / distance) * this.data.speed * normalizedSpeed;
                moveY = (dy / distance) * this.data.speed * normalizedSpeed;
            }
        } else {
            // Mouvement WASD
            if (Input.isKeyPressed('w') || Input.isKeyPressed('arrowup')) moveY -= this.data.speed;
            if (Input.isKeyPressed('s') || Input.isKeyPressed('arrowdown')) moveY += this.data.speed;
            if (Input.isKeyPressed('a') || Input.isKeyPressed('arrowleft')) moveX -= this.data.speed;
            if (Input.isKeyPressed('d') || Input.isKeyPressed('arrowright')) moveX += this.data.speed;
            
            // Normaliser la vitesse diagonale
            if (moveX !== 0 && moveY !== 0) {
                moveX *= 0.707;
                moveY *= 0.707;
            }
        }
        
        // Appliquer le mouvement
        this.data.x += moveX;
        this.data.y += moveY;
        
        // Garder le joueur dans les limites du monde
        this.data.x = Math.max(this.data.radius, Math.min(CONFIG.WORLD.WIDTH - this.data.radius, this.data.x));
        this.data.y = Math.max(this.data.radius, Math.min(CONFIG.WORLD.HEIGHT - this.data.radius, this.data.y));
    },
    
    handleShooting() {
        if (this.bulletCooldown <= 0) {
            const nearestResult = Enemy.findNearest();
            if (nearestResult && nearestResult.distance < this.data.range) {
                Bullet.create(nearestResult.enemy);
                this.bulletCooldown = this.data.fireRate;
            }
        }
        if (this.bulletCooldown > 0) this.bulletCooldown--;
    },
    
    takeDamage() {
        if (this.data.invulnerable) return false;
        
        Particle.createExplosion(this.data.x, this.data.y, '#f00', 12);
        Game.lives--;
        Audio.playSoundEffect('playerHit');
        
        if (Game.lives <= 0) {
            if (Game.resurrections < CONFIG.LIMITS.MAX_RESURRECTIONS) {
                Game.state = 'revive';
                Upgrades.generateReviveOptions();
                UI.showReviveScreen();
            } else {
                Game.state = 'gameOver';
                document.getElementById('gameOver').style.display = 'block';
            }
        } else {
            // Réapparaître au centre
            this.data.x = CONFIG.WORLD.WIDTH / 2;
            this.data.y = CONFIG.WORLD.HEIGHT / 2;
            // Nettoyer les ennemis proches
            Enemy.clearNearby(this.data.x, this.data.y, 100);
        }
        
        return true;
    },
    
    toggleMouseMode() {
        this.data.followMouse = !this.data.followMouse;
    },
    
    upgrade(type, value) {
        switch(type) {
            case 'fireRate':
                this.data.fireRate = Math.max(6, this.data.fireRate - value);
                break;
            case 'speed':
                this.data.speed += value;
                break;
            case 'bulletSpeed':
                this.data.bulletSpeed += value;
                break;
            case 'range':
                this.data.range += value;
                break;
            case 'orbCount':
                this.data.orbCount++;
                Orb.create();
                break;
            case 'invulnerability':
                this.data.invulnerable = true;
                this.data.invulnerableTime = value;
                break;
            case 'vampiric':
                this.data.vampiric = true;
                break;
        }
    }
};