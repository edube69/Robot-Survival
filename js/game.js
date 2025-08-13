// Module principal du jeu
const Game = {
    state: 'menu',
    score: 0,
    wave: 1,
    lives: 3,
    gems: 0,
    gemsForUpgrade: CONFIG.UPGRADES.BASE_COST,
    resurrections: 0,
    
    init() {
        // Initialiser tous les modules
        Audio.init();
        Input.init();
        Renderer.init();
        Player.init();
        Enemy.init();
        Bullet.init();
        Particle.init();
        Currency.init();
        Orb.init();
        
        // Commencer la boucle de jeu
        this.gameLoop();
    },
    
    start() {
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('gameScreen').style.display = 'flex';
        this.restart();
    },
    
    restart() {
        this.state = 'playing';
        this.score = 0;
        this.wave = 1;
        this.lives = 3;
        this.gems = 0;
        this.gemsForUpgrade = CONFIG.UPGRADES.BASE_COST;
        this.resurrections = 0;
        
        // Réinitialiser tous les modules
        Player.reset();
        Enemy.init();
        Bullet.init();
        Particle.init();
        Currency.init();
        Orb.init();
        
        // Masquer les écrans
        document.getElementById('gameOver').style.display = 'none';
        document.getElementById('reviveScreen').style.display = 'none';
        
        // Spawn initial d'ennemis
        for (let i = 0; i < 6; i++) {
            setTimeout(() => Enemy.create(), i * 200);
        }
    },
    
    returnToMenu() {
        document.getElementById('gameScreen').style.display = 'none';
        document.getElementById('startScreen').style.display = 'flex';
        this.state = 'menu';
    },
    
    update() {
        if (this.state === 'playing') {
            Player.update();
            Bullet.update();
            Enemy.update();
            Enemy.spawn();
            Currency.update();
            Orb.update();
            Particle.update();
        }
        
        this.updateUI();
    },
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('wave').textContent = this.wave;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('gems').textContent = this.gems;
        document.getElementById('nextUpgrade').textContent = Math.max(0, this.gemsForUpgrade - this.gems);
        document.getElementById('resurrections').textContent = this.resurrections;
        document.getElementById('movementMode').textContent = 
            Player.data && Player.data.followMouse ? 'MODE: MOUSE' : 'MODE: WASD';
    },
    
    gameLoop() {
        this.update();
        Renderer.render();
        requestAnimationFrame(() => this.gameLoop());
    }
};

// Créer un module UI pour les écrans spéciaux
const UI = {
    showReviveScreen() {
        document.getElementById('reviveScreen').style.display = 'block';
        const optionsDiv = document.getElementById('reviveOptions');
        optionsDiv.innerHTML = '';
        for (let i = 0; i < Upgrades.options.length; i++) {
            const option = Upgrades.options[i];
            optionsDiv.innerHTML += `
                <div class="revive-option">
                    <h4>${i + 1}. ${option.name}</h4>
                    <p>${option.desc}</p>
                    <div class="upgrade-benefit">${option.benefit}</div>
                </div>
            `;
        }
    }
};

// Démarrer le jeu quand la page est chargée
window.addEventListener('load', () => {
    Game.init();
});