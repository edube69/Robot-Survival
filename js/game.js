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
    deathSequenceTimer: 0, // Timer pour la s�quence de mort
    
    init() {
        // Initialiser tous les modules
        Audio.init();
        Input.init();
        Renderer.init();
        Player.init(); // Initialiser le joueur AVANT la cam�ra
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
        
        // R�initialiser tous les modules
        Player.reset();
        Camera.init(); // R�initialiser la cam�ra apr�s le joueur
        Enemy.init();
        Bullet.init();
        Particle.init();
        Currency.init();
        Orb.init();
        TeleportFX.init();
        
        // Masquer les �crans
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
        // Gestion de la s�quence de mort
        if (this.state === 'deathSequence') {
            this.deathSequenceTimer--;
            if (this.deathSequenceTimer <= 0) {
                // Basculer imm�diatement pour �viter des appels multiples
                this.deathSequenceTimer = 0;
                this.completeDeathSequence();
            }
            // Continue � mettre � jour les particules et l'effet de TP pendant la s�quence
            Particle.update();
            TeleportFX.update();
            return;
        }
        
        // Gestion de l'attente de t�l�portation (�vite les doublons)
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
            
            // Si timeScale < 1, on fait plusieurs micro-updates pour garder la fluidit�
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
            // Trouver une position s�re pour r�appara�tre
            const safeLocation = Player.findSafeSpawnLocation();
            
            // Passer en �tat "teleporting"
            this.state = 'teleporting';
            
            // Zoom arri�re pour d�voiler la sc�ne
            Camera.setTargetZoom(Math.max(1.0, (CONFIG.CAMERA.ZOOM || 1) * 0.7));
            
            // D�clencher l'effet proc�dural de t�l�portation avec dur�e plus longue
            TeleportFX.create(safeLocation.x, safeLocation.y, { duration: 100, maxRadius: 140 });
            
            // Jouer le son de t�l�portation
            Audio.playSoundEffect('teleport');
            
            // Attendre pour appr�cier l'effet, puis t�l�porter
            setTimeout(() => {
                Player.data.x = safeLocation.x;
                Player.data.y = safeLocation.y;
                
                // Nettoyer les ennemis proches
                Enemy.clearNearby(Player.data.x, Player.data.y, 150);
                
                // Invuln�rabilit� temporaire
                Player.data.invulnerable = true;
                Player.data.invulnerableTime = 150; // un peu plus long
                
                // Zoom avant pour revenir au zoom par d�faut
                Camera.setTargetZoom(CONFIG.CAMERA.ZOOM || 1);
                
                // Reprendre le jeu apr�s un court d�lai pour laisser le zoom se recaler l�g�rement
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

// Cr�er un module UI pour les �crans sp�ciaux
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

        // Activer la s�lection par clic de souris
        const items = optionsDiv.querySelectorAll('.revive-option');
        items.forEach(el => {
            el.addEventListener('click', () => {
                const idx = parseInt(el.getAttribute('data-index'), 10);
                Upgrades.selectRevive(idx);
            });
        });
    }
};

// D�marrer le jeu quand la page est charg�e
window.addEventListener('load', () => {
    Game.init();
});