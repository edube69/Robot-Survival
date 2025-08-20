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
    waveAnnouncementTimer: 0, // Timer pour l'annonce de vague
    upgradesThisWave: 0, // Compteur d'upgrades dans cette vague
    upgradeOptions: [], // Options d'upgrade disponibles
    
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
        this.waveAnnouncementTimer = 0; // Initialiser le timer d'annonce
        this.upgradesThisWave = 0; // Réinitialiser le compteur d'upgrades
        
        // Réinitialiser tous les modules
        Player.reset();
        Camera.init(); // Réinitialiser la caméra après le joueur
        Enemy.init(); // Ceci initialise waveEnemiesSpawned = 0 et setWaveLimit()
        Bullet.init();
        Particle.init();
        Currency.init();
        Orb.init();
        TeleportFX.init();
        
        // Masquer les écrans
        document.getElementById('gameOver').style.display = 'none';
        document.getElementById('reviveScreen').style.display = 'none';
        
        console.log('Game restarted - Wave 1 begins');
        
        // Spawn initial d'ennemis plus important pour la vague 1
        const initialSpawn = 10; // Augmenté de 6 à 10
        for (let i = 0; i < initialSpawn; i++) {
            setTimeout(() => {
                Enemy.create();
                Enemy.waveEnemiesSpawned++;
                console.log(`Initial spawn ${Enemy.waveEnemiesSpawned}/${Enemy.maxEnemiesPerWave}`);
            }, i * 200);
        }
    },
    
    returnToMenu() {
        document.getElementById('gameScreen').style.display = 'none';
        document.getElementById('startScreen').style.display = 'flex';
        this.state = 'menu';
        this.timeScale = 1.0;
        this.deathSequenceTimer = 0;
    },
    
    announceNewWave() {
        // Ne pas incrémenter si c'est la première vague (déjà à 1)
        if (Game.wave > 0) {
            this.wave++;
        }
        
        // Réinitialiser le compteur d'upgrades pour la nouvelle vague
        this.upgradesThisWave = 0;
        
        this.state = 'waveAnnouncement';
        this.waveAnnouncementTimer = 180; // 3 secondes
        
        console.log(`Starting Wave ${this.wave}`); // Debug
        
        // Réinitialiser le système d'ennemis pour la nouvelle vague (important!)
        Enemy.waveEnemiesSpawned = 0;
        Enemy.bonusWaveActive = false; // S'assurer que la vague bonus est désactivée
        Enemy.bonusWaveSpawned = 0;
        Enemy.bonusWaveTarget = 0;
        Enemy.setWaveLimit();
        
        // Effets visuels de nouvelle vague
        this.createWaveAnnouncementEffects();
        
        // Son d'annonce de vague
        Audio.playSoundEffect('newWave');
        
        // Spawn des ennemis après l'annonce (spawn initial plus important)
        setTimeout(() => {
            console.log(`Spawning initial enemies for Wave ${this.wave}`); // Debug
            const initialSpawn = Math.min(8 + Math.floor(this.wave * 1.2), 15); // Spawn initial plus important
            for (let i = 0; i < initialSpawn; i++) {
                setTimeout(() => {
                    Enemy.create();
                    Enemy.waveEnemiesSpawned++;
                }, i * 250); // Légèrement plus rapide
            }
            this.state = 'playing';
            console.log(`State changed back to playing. Initial spawn: ${initialSpawn}`); // Debug
        }, 2000);
    },
    
    // Méthode appelée quand le joueur fait une upgrade
    onUpgrade() {
        this.upgradesThisWave++;
        console.log(`Upgrade ${this.upgradesThisWave} acquired this wave`);
    },
    
    createWaveAnnouncementEffects() {
        // Effets de particules pour l'annonce
        const centerX = Player.data.x;
        const centerY = Player.data.y;
        
        // Explosion centrale dorée
        Particle.createExplosion(centerX, centerY, '#FFD700', 40);
        
        // Anneaux d'énergie qui s'expandent
        for (let ring = 0; ring < 5; ring++) {
            setTimeout(() => {
                const radius = 50 + ring * 30;
                const particleCount = 16;
                
                for (let i = 0; i < particleCount; i++) {
                    const angle = (i * Math.PI * 2) / particleCount;
                    const x = centerX + Math.cos(angle) * radius;
                    const y = centerY + Math.sin(angle) * radius;
                    
                    Particle.createExplosion(x, y, '#FFD700', 6);
                }
            }, ring * 200);
        }
        
        // Étoiles qui tombent du ciel
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const x = centerX + (Math.random() - 0.5) * 400;
                const y = centerY - 200 - Math.random() * 100;
                
                Particle.createExplosion(x, y, '#FFFF00', 8);
            }, Math.random() * 1500);
        }
    },
    
    update() {
        // Gestion des inputs pour les upgrades
        if (this.state === 'upgrade') {
            // Touches 1, 2, 3 pour sélectionner les upgrades
            if (Input.isKeyPressed('1')) {
                Upgrades.select(0);
            } else if (Input.isKeyPressed('2')) {
                Upgrades.select(1);
            } else if (Input.isKeyPressed('3')) {
                Upgrades.select(2);
            }
            return;
        }
        
        // Gestion de l'annonces de vague
        if (this.state === 'waveAnnouncement') {
            this.waveAnnouncementTimer--;
            if (this.waveAnnouncementTimer <= 0) {
                this.state = 'playing';
            }
            // Continue à mettre à jour les particules et effets
            Particle.update();
            TeleportFX.update();
            return;
        }
        
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
            
            // Démarrer la téléportation de la caméra vers la nouvelle position
            Camera.startTeleportation(safeLocation.x, safeLocation.y);
            
            // Zoom arrière pour dévoiler la scène (plus fluide)
            Camera.setTargetZoom(Math.max(1.0, (CONFIG.CAMERA.ZOOM || 1) * 0.75));
            
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
                
                // Zoom avant pour revenir au zoom par défaut (plus progressif)
                Camera.setTargetZoom(CONFIG.CAMERA.ZOOM || 1);
                
                // Terminer la téléportation de caméra et reprendre le suivi normal
                setTimeout(() => {
                    Camera.finishTeleportation();
                    this.state = 'playing';
                }, 400); // Plus de temps pour la transition
            }, 1000); // augmente l'attente
        }
    },
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('wave').textContent = this.wave;
        document.getElementById('lives').textContent = this.lives;
        
        // === NOUVEAU : Afficher le multiplicateur de gems ===
        const gemMultiplier = Player.data && Player.data.gemMultiplier ? Player.data.gemMultiplier : 1;
        if (gemMultiplier > 1) {
            document.getElementById('gems').textContent = `${this.gems} (x${gemMultiplier})`;
        } else {
            document.getElementById('gems').textContent = this.gems;
        }
        
        document.getElementById('nextUpgrade').textContent = Math.max(0, this.gemsForUpgrade - this.gems);
        document.getElementById('resurrections').textContent = this.resurrections;
        document.getElementById('movementMode').textContent = 
            Player.data && Player.data.followMouse ? 'MODE: MOUSE' : 'MODE: WASD';
        
        // Vérifier si on peut faire une upgrade
        if (this.gems >= this.gemsForUpgrade && this.state === 'playing') {
            this.state = 'upgrade';
            Upgrades.generateOptions(); // Utiliser le module Upgrades existant
        }
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