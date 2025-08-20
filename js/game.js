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
        document.getElementById('highscoresButton').addEventListener('click', () => {
            window.location.href = 'highscores.html';
        });
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
    
    async showGameOverModal() {
        const gameTime = Math.floor((Date.now() - this.startTime) / 1000);
        const modal = document.createElement('div');
        modal.className = 'game-over-modal';

        // On donne des ID aux boutons pour pouvoir y attacher des écouteurs d'événements
        modal.innerHTML = `
            <h2>Game Over!</h2>
            <p>Score: ${this.score}</p>
            <p>Kills: ${this.kills}</p>
            <p>Time: ${gameTime}s</p>
            <input type="text" id="playerName" placeholder="Enter your name" maxlength="20">
            <button id="submitScoreBtn">Submit Score</button>
            <button id="skipScoreBtn">Skip</button>
        `;
        document.body.appendChild(modal);

        // AMÉLIORATION : On attache les événements ici, c'est plus propre que "onclick"
        document.getElementById('submitScoreBtn').addEventListener('click', () => this.submitScore());
        document.getElementById('skipScoreBtn').addEventListener('click', () => this.skipScore());
    },

    async submitScore() {
        // 1. CORRECTION DE L'ID
        const playerNameInput = document.getElementById('playerName');

        // Bonne pratique : on vérifie que l'élément existe bien
        if (!playerNameInput) {
            console.error("L'élément 'playerName' est introuvable dans le modal.");
            return;
        }

        const playerName = playerNameInput.value;

        if (!playerName) {
            alert("Veuillez entrer un nom !");
            return;
        }

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
                alert("Score sauvegardé !");
                this.skipScore(); // On ferme le modal et on retourne au menu
            } else {
                alert("La sauvegarde du score a échoué.");
            }

        } catch (error) {
            console.error("Erreur d'authentification ou de sauvegarde :", error);
            alert("Une erreur est survenue. Impossible de sauvegarder le score.");
        }
    },

    skipScore() {
        // On s'assure que le modal existe avant de le supprimer
        const modal = document.querySelector('.game-over-modal');
        if (modal) {
            modal.remove();
        }
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
            // Trouver une position s�re pour r�appara�tre
            const safeLocation = Player.findSafeSpawnLocation();
            
            // Passer en �tat "teleporting"
            this.state = 'teleporting';
            
            // D�marrer la t�l�portation de la cam�ra vers la nouvelle position
            Camera.startTeleportation(safeLocation.x, safeLocation.y);
            
            // Zoom arri�re pour d�voiler la sc�ne (plus fluide)
            Camera.setTargetZoom(Math.max(1.0, (CONFIG.CAMERA.ZOOM || 1) * 0.75));
            
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
                
                // Zoom avant pour revenir au zoom par d�faut (plus progressif)
                Camera.setTargetZoom(CONFIG.CAMERA.ZOOM || 1);
                
                // Terminer la t�l�portation de cam�ra et reprendre le suivi normal
                setTimeout(() => {
                    Camera.finishTeleportation();
                    this.state = 'playing';
                }, 400); // Plus de temps pour la transition
            }, 1000); // augmente l'attente
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