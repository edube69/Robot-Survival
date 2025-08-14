// Module principal du jeu
const Game = {
    state: 'menu',
    score: 0,
    wave: 1,
    lives: 3,
    gems: 0,
    gemsForUpgrade: CONFIG.UPGRADES.BASE_COST,
    resurrections: 0,
    timeScale: 1.0, // Facteur de ralenti global
    deathSequenceTimer: 0, // Timer pour la séquence de mort
    
    init() {
        // Initialiser tous les modules
        Audio.init();
        Input.init();
        Renderer.init();
        Player.init(); // Initialiser le joueur AVANT la caméra
        Camera.init();
        Enemy.init();
        Bullet.init();
        Particle.init();
        Currency.init();
        Orb.init();
        TeleportFX.init();
        
        // Commencer la boucle de jeu
        this.gameLoop();
    },
    
    start() {
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('gameScreen').style.display = 'flex';
        // Ajuster la taille du canvas quand le jeu devient visible
        if (Renderer && typeof Renderer.resizeCanvas === 'function') {
            Renderer.resizeCanvas();
        }
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
        this.timeScale = 1.0;
        this.deathSequenceTimer = 0;
        
        // Réinitialiser tous les modules
        Player.reset();
        Camera.init(); // Réinitialiser la caméra après le joueur
        Enemy.init();
        Bullet.init();
        Particle.init();
        Currency.init();
        Orb.init();
        TeleportFX.init();
        
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
        this.timeScale = 1.0;
        this.deathSequenceTimer = 0;
    },
    
    update() {
        // Gestion de la séquence de mort
        if (this.state === 'deathSequence') {
            this.deathSequenceTimer--;
            if (this.deathSequenceTimer <= 0) {
                // Basculer immédiatement pour éviter des appels multiples
                this.deathSequenceTimer = 0;
                this.completeDeathSequence();
            }
            // Continue à mettre à jour les particules et l'effet de TP pendant la séquence
            Particle.update();
            TeleportFX.update();
            return;
        }
        
        // Gestion de l'attente de téléportation (évite les doublons)
        if (this.state === 'teleporting') {
            Particle.update();
            TeleportFX.update();
            return;
        }
        
        if (this.state === 'playing') {
            // Appliquer le facteur de temps aux updates
            const timeAdjustedUpdate = () => {
                Player.update();
                Bullet.update();
                Enemy.update();
                Enemy.spawn();
                Currency.update();
                Orb.update();
                Particle.update();
                TeleportFX.update();
            };
            
            // Si timeScale < 1, on fait plusieurs micro-updates pour garder la fluidité
            if (this.timeScale < 1) {
                const steps = Math.ceil(1 / this.timeScale);
                for (let i = 0; i < steps; i++) {
                    if (Math.random() < this.timeScale * steps) {
                        timeAdjustedUpdate();
                    }
                }
            } else {
                timeAdjustedUpdate();
            }
        }
        
        this.updateUI();
    },
    
    startDeathSequence() {
        this.state = 'deathSequence';
        this.timeScale = 0.3; // Ralenti dramatique
        this.deathSequenceTimer = 180; // 3 secondes en 60 FPS
    },
    
    completeDeathSequence() {
        // Restaurer la vitesse normale
        this.timeScale = 1.0;
        this.deathSequenceTimer = 0;
        
        if (this.lives <= 0) {
            if (this.resurrections < CONFIG.LIMITS.MAX_RESURRECTIONS) {
                this.state = 'revive';
                Upgrades.generateReviveOptions();
                UI.showReviveScreen();
            } else {
                this.state = 'gameOver';
                document.getElementById('gameOver').style.display = 'block';
            }
        } else {
            // Trouver une position sûre pour réapparaître
            const safeLocation = Player.findSafeSpawnLocation();
            
            // Passer en état "teleporting"
            this.state = 'teleporting';
            
            // Zoom arrière pour dévoiler la scène
            Camera.setTargetZoom(Math.max(1.0, (CONFIG.CAMERA.ZOOM || 1) * 0.7));
            
            // Déclencher l'effet procédural de téléportation avec durée plus longue
            TeleportFX.create(safeLocation.x, safeLocation.y, { duration: 100, maxRadius: 140 });
            
            // Jouer le son de téléportation
            Audio.playSoundEffect('teleport');
            
            // Attendre pour apprécier l'effet, puis téléporter
            setTimeout(() => {
                Player.data.x = safeLocation.x;
                Player.data.y = safeLocation.y;
                
                // Nettoyer les ennemis proches
                Enemy.clearNearby(Player.data.x, Player.data.y, 150);
                
                // Invulnérabilité temporaire
                Player.data.invulnerable = true;
                Player.data.invulnerableTime = 150; // un peu plus long
                
                // Zoom avant pour revenir au zoom par défaut
                Camera.setTargetZoom(CONFIG.CAMERA.ZOOM || 1);
                
                // Reprendre le jeu après un court délai pour laisser le zoom se recaler légèrement
                setTimeout(() => {
                    this.state = 'playing';
                }, 250);
            }, 1000); // augmente l'attente
        }
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
                <div class="revive-option" data-index="${i}">
                    <h4>${i + 1}. ${option.name}</h4>
                    <p>${option.desc}</p>
                    <div class="upgrade-benefit">${option.benefit}</div>
                </div>
            `;
        }

        // Activer la sélection par clic de souris
        const items = optionsDiv.querySelectorAll('.revive-option');
        items.forEach(el => {
            el.addEventListener('click', () => {
                const idx = parseInt(el.getAttribute('data-index'), 10);
                Upgrades.selectRevive(idx);
            });
        });
    }
};

// Démarrer le jeu quand la page est chargée
window.addEventListener('load', () => {
    Game.init();
});