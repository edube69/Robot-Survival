// Module principal du jeu
import { getCurrentUser, saveScore } from './firebase-config.js';
import { CONFIG } from './config.js';
import { Audio } from './audio.js';
import { Input } from './input.js';
import { Renderer } from './renderer.js';
import { Player } from './player.js';
import { Camera } from './camera.js';
import { Enemy } from './enemy.js';
import { Bullet } from './bullet.js';
import { Particle } from './particle.js';
import { Currency } from './currency.js';
import { Orb } from './orb.js';
import { TeleportFX } from './teleportfx.js';
import { Upgrades } from './upgrades.js';

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
    waveAnnouncementTimer: 0, // Timer pour l'annonce de vague
    upgradesThisWave: 0, // Compteur d'upgrades dans cette vague
    upgradeOptions: [], // Options d'upgrade disponibles
    startTime: 0, // Pour suivre le temps de jeu
    kills: 0, // Pour suivre le nombre de kills
    
    init() {
        // Initialiser dans un ordre qui respecte les dépendances
        this.startTime = Date.now();
        
        // Modules de base d'abord
        Audio.init();
        Input.init();
        
        // Ensuite le joueur (car beaucoup de modules en dépendent)
        Player.init();
        
        // Puis les modules qui dépendent du joueur
        Camera.init();
        Enemy.init();
        Bullet.init();
        Particle.init();
        Currency.init();
        Orb.init();
        TeleportFX.init();
        
        // Renderer en dernier car il dépend de tout le reste
        Renderer.init();
        
        // Event listeners
        document.getElementById('startButton').addEventListener('click', () => this.start());
        document.getElementById('submitScore').addEventListener('click', () => this.submitScore());
        
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
        this.upgradesThisWave = 0; // R�initialiser le compteur d'upgrades
        
        // R�initialiser tous les modules
        Player.reset();
        Camera.init(); // R�initialiser la cam�ra apr�s le joueur
        Enemy.init(); // Ceci initialise waveEnemiesSpawned = 0 et setWaveLimit()
        Bullet.init();
        Particle.init();
        Currency.init();
        Orb.init();
        TeleportFX.init();
        
        // Masquer les �crans
        document.getElementById('gameOver').style.display = 'none';
        document.getElementById('reviveScreen').style.display = 'none';
        
        console.log('Game restarted - Wave 1 begins');
        
        // Spawn initial d'ennemis plus important pour la vague 1
        const initialSpawn = 10; // Augment� de 6 � 10
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
        // Ne pas incr�menter si c'est la premi�re vague (d�j� � 1)
        if (Game.wave > 0) {
            this.wave++;
        }
        
        // R�initialiser le compteur d'upgrades pour la nouvelle vague
        this.upgradesThisWave = 0;
        
        this.state = 'waveAnnouncement';
        this.waveAnnouncementTimer = 180; // 3 secondes
        
        console.log(`Starting Wave ${this.wave}`); // Debug
        
        // R�initialiser le syst�me d'ennemis pour la nouvelle vague (important!)
        Enemy.waveEnemiesSpawned = 0;
        Enemy.bonusWaveActive = false; // S'assurer que la vague bonus est d�sactiv�e
        Enemy.bonusWaveSpawned = 0;
        Enemy.bonusWaveTarget = 0;
        Enemy.setWaveLimit();
        
        // Effets visuels de nouvelle vague
        this.createWaveAnnouncementEffects();
        
        // Son d'annonce de vague
        Audio.playSoundEffect('newWave');
        
        // Spawn des ennemis apr�s l'annonce (spawn initial plus important)
        setTimeout(() => {
            console.log(`Spawning initial enemies for Wave ${this.wave}`); // Debug
            const initialSpawn = Math.min(8 + Math.floor(this.wave * 1.2), 15); // Spawn initial plus important
            for (let i = 0; i < initialSpawn; i++) {
                setTimeout(() => {
                    Enemy.create();
                    Enemy.waveEnemiesSpawned++;
                }, i * 250); // L�g�rement plus rapide
            }
            this.state = 'playing';
            console.log(`State changed back to playing. Initial spawn: ${initialSpawn}`); // Debug
        }, 2000);
    },
    
    // M�thode appel�e quand le joueur fait une upgrade
    onUpgrade() {
        this.upgradesThisWave++;
        console.log(`Upgrade ${this.upgradesThisWave} acquired this wave`);
    },
    
    createWaveAnnouncementEffects() {
        // Effets de particules pour l'annonce
        const centerX = Player.data.x;
        const centerY = Player.data.y;
        
        // Explosion centrale dor�e
        Particle.createExplosion(centerX, centerY, '#FFD700', 40);
        
        // Anneaux d'�nergie qui s'expandent
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
        
        // �toiles qui tombent du ciel
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
            // Touches 1, 2, 3 pour s�lectionner les upgrades
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
            // Continue � mettre � jour les particules et effets
            Particle.update();
            TeleportFX.update();
            return;
        }
        
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
    
    // showGameOverModal()
    async showGameOverModal() {
        Input.suspend(); // ⬅️ important
        const gameTime = Math.floor((Date.now() - this.startTime) / 1000);
        
        // Supprimer toute modal existante
        const existingModal = document.querySelector('.game-over-modal');
        if (existingModal) existingModal.remove();
        
        const modal = document.createElement('div');
        modal.className = 'game-over-modal';
        modal.innerHTML = `
            <div class="modal-header">
                <h2 class="modal-title">MISSION FAILED</h2>
                <div class="mission-stats">
                    <div class="stat-row">
                        <span class="stat-label">Final Score:</span>
                        <span class="stat-value">${this.score.toLocaleString()}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Enemies Destroyed:</span>
                        <span class="stat-value">${this.kills}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Mission Duration:</span>
                        <span class="stat-value">${Math.floor(gameTime / 60)}:${(gameTime % 60).toString().padStart(2, '0')}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Wave Reached:</span>
                        <span class="stat-value">${this.wave}</span>
                    </div>
                </div>
            </div>
            <div class="modal-content">
                <div class="leaderboard-prompt">
                    <p class="prompt-text">Enter the leaderboard, warrior!</p>
                    <div class="input-section">
                        <input type="text" 
                               id="playerName" 
                               class="player-name-input" 
                               placeholder="Your Call Sign" 
                               maxlength="15"
                               autocomplete="off">
                        <div class="modal-actions">
                            <button id="submitScoreBtn" class="action-btn primary">
                                <span class="btn-icon">🏆</span>
                                <span class="btn-text">Submit Score</span>
                            </button>
                            <button id="skipScoreBtn" class="action-btn secondary">
                                <span class="btn-icon">⏭️</span>
                                <span class="btn-text">Skip</span>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <p class="footer-text">Press ESC to return to main menu</p>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Animation d'apparition
        setTimeout(() => modal.classList.add('show'), 50);

        // Event listeners
        document.getElementById('submitScoreBtn').addEventListener('click', () => this.submitScore());
        document.getElementById('skipScoreBtn').addEventListener('click', () => this.skipScore());
        
        // Enter pour submit
        document.getElementById('playerName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.submitScore();
        });
        
        // ESC pour skip
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                this.skipScore();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
        
        // Focus sur l'input
        setTimeout(() => document.getElementById('playerName').focus(), 100);
    },

    async submitScore() {
        // 1. CORRECTION DE L'ID
        const playerNameInput = document.getElementById('playerName');

        // Bonne pratique : on vérifie que l'élément existe bien
        if (!playerNameInput) {
            console.error("L'élément 'playerName' est introuvable dans le modal.");
            return;
        }

        const playerName = playerNameInput.value.trim();

        if (!playerName) {
            // Ajouter un feedback visuel
            playerNameInput.classList.add('error');
            playerNameInput.placeholder = "Name required!";
            setTimeout(() => {
                playerNameInput.classList.remove('error');
                playerNameInput.placeholder = "Your Call Sign";
            }, 2000);
            return;
        }

        // Désactiver le bouton pendant le processing
        const submitBtn = document.getElementById('submitScoreBtn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="btn-icon">⏳</span><span class="btn-text">Submitting...</span>';
        submitBtn.disabled = true;

        // 2. UTILISATION DES VRAIES DONNÉES
        const finalScore = this.score;
        const finalKills = this.kills;
        const finalTime = Math.floor((Date.now() - this.startTime) / 1000); // Temps en secondes

        try {
            console.log("Connexion de l'utilisateur...");
            const user = await getCurrentUser();
            console.log("Utilisateur connecté avec l'ID :", user.uid);

            const success = await saveScore(user, playerName, finalScore, `${finalTime}s`, finalKills);

            if (success) {
                // === AMÉLIORÉ : mémoriser aussi la date pour l'affichage immédiat ===
                sessionStorage.setItem('lastScore', JSON.stringify({
                    name: playerName, 
                    score: finalScore, 
                    kills: finalKills, 
                    time: finalTime,
                    timestamp: Date.now() // Ajouter la date locale pour l'affichage immédiat
                }));
                
                // Feedback de succès
                submitBtn.innerHTML = '<span class="btn-icon">✅</span><span class="btn-text">Score Saved!</span>';
                submitBtn.classList.add('success');
                
                setTimeout(() => {
                    this.skipScore(); // On ferme le modal et on retourne au menu
                }, 1500);
            } else {
                throw new Error("Failed to save score");
            }

        } catch (error) {
            console.error("Erreur d'authentification ou de sauvegarde :", error);
            
            // Feedback d'erreur
            submitBtn.innerHTML = '<span class="btn-icon">❌</span><span class="btn-text">Error - Try Again</span>';
            submitBtn.classList.add('error');
            submitBtn.disabled = false;
            
            setTimeout(() => {
                submitBtn.innerHTML = originalText;
                submitBtn.classList.remove('error');
            }, 3000);
        }
    },

    skipScore() {
        const modal = document.querySelector('.game-over-modal');
        if (modal) {
            modal.classList.add('hide');
            setTimeout(() => modal.remove(), 300);
        }
        Input.resume();            // ⬅️ réactiver les inputs
        this.returnToMenu();
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
                this.showGameOverModal();
            }
        } else {
            // Trouver une position sûre pour réapparaître
            const safeLocation = Player.findSafeSpawnLocation();
            
            console.log(`Player death completed, teleporting to safe location: (${safeLocation.x}, ${safeLocation.y})`);
            
            // Passer en état "teleporting" pour éviter les mises à jour normales
            this.state = 'teleporting';
            
            // Zoom arrière progressif pour montrer la zone de téléportation
            Camera.setTargetZoom(Math.max(0.8, (CONFIG.CAMERA.ZOOM || 1) * 0.6));
            
            // Démarrer la téléportation fluide de la caméra vers la nouvelle position
            Camera.startTeleportation(safeLocation.x, safeLocation.y);
            
            // Déclencher l'effet procédural de téléportation avec durée plus longue
            TeleportFX.create(safeLocation.x, safeLocation.y, { duration: 120, maxRadius: 160 });
            
            // Jouer le son de téléportation
            Audio.playSoundEffect('teleport');
            
            // Attendre que l'effet de téléportation soit bien visible avant de déplacer le joueur
            setTimeout(() => {
                console.log(`Moving player to safe location: (${safeLocation.x}, ${safeLocation.y})`);
                
                // Téléporter le joueur
                Player.data.x = safeLocation.x;
                Player.data.y = safeLocation.y;
                
                // Nettoyer les ennemis proches
                Enemy.clearNearby(Player.data.x, Player.data.y, 180);
                
                // Invulnérabilité temporaire
                Player.data.invulnerable = true;
                Player.data.invulnerableTime = 180; // 3 secondes
                
                console.log(`Player teleported, starting zoom back to normal`);
                
                // Zoom avant progressif pour revenir au zoom par défaut
                Camera.setTargetZoom(CONFIG.CAMERA.ZOOM || 1);
                
                // Attendre que la téléportation de caméra soit terminée avant de reprendre le jeu
                setTimeout(() => {
                    console.log(`Teleportation sequence complete, resuming game`);
                    
                    // Terminer la téléportation de caméra et reprendre le suivi normal
                    Camera.finishTeleportation();
                    
                    // Reprendre le jeu
                    this.state = 'playing';
                }, 800); // Plus de temps pour la transition complète
                
            }, 1200); // Plus d'attente pour apprécier l'effet
        }
    },
    
    // M�thode pour incr�menter le compteur de kills
    addKill() {
        this.kills++;
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
        
        // V�rifier si on peut faire une upgrade
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

// Exporter le module Game
export { Game };

// L'exposer aussi sur window pour la compatibilité
window.Game = Game;

// Initialiser le jeu quand la page est chargée
window.addEventListener('load', () => {
    Game.init();
});