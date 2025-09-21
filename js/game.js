// Module principal du jeu
import { getCurrentUser, saveScore, db } from './firebase-config.js';
import { CONFIG } from './config.js';
import { Audio } from './audio.js';
import { Input } from './input.js';
import { Renderer } from './renderer.js';
import { Player } from './player.js';
import { Camera } from './camera.js'; // <-- parenthèse corrigée
import { Enemy } from './enemy.js';
import { Bullet } from './bullet.js';
import { Particle } from './particle.js';
import { Currency } from './currency.js';
import { Orb } from './orb.js';
import { TeleportFX } from './teleportfx.js';
import { Upgrades } from './upgrades.js';
import { collection, query, where, getCountFromServer } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const Game = {
    state: 'menu',
    score: 0,
    wave: 1,
    lives: 3,
    gems: 0,
    gemsForUpgrade: CONFIG.UPGRADES.BASE_COST,
    resurrections: 2,
    timeScale: 1.0, // Facteur de ralenti global
    deathSequenceTimer: 0, // Timer pour la s�quence de mort
    waveAnnouncementTimer: 0, // Timer pour l'annonce de vague
    upgradesThisWave: 0, // Compteur d'upgrades dans cette vague
    upgradeOptions: [], // Options d'upgrade disponibles
    startTime: 0, // Pour suivre le temps de jeu
    kills: 0, // Pour suivre le nombre de kills

    // === COMBO SYSTEM ===
    combo: 0,
    comboTimer: 0,
    comboMultiplier: 1,
    bestCombo: 0,

    init() {
        this.startTime = Date.now();
        Audio.init();
        Input.init();
        Player.init();
        Camera.init();
        Enemy.init();
        Bullet.init();
        Particle.init();
        Currency.init();
        Orb.init();
        TeleportFX.init();
        Renderer.init();
        document.getElementById('startButton')
            .addEventListener('click', () => this.start());
        const pageSubmitBtn = document.getElementById('submitScore');
        if (pageSubmitBtn) {
            pageSubmitBtn.addEventListener('click', () => this.submitScore());
        }
        this.gameLoop();
    },

    start: async function () {
        document.getElementById('startScreen').style.display = 'none';
        try { const m = await import('./attract-mode.js'); m.stopAttract?.(); } catch { }
        document.getElementById('gameScreen').style.display = 'flex';
        if (Renderer && typeof Renderer.resizeCanvas === 'function') Renderer.resizeCanvas();
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
        this.waveAnnouncementTimer = 0;
        this.upgradesThisWave = 0;
        this.kills = 0;
        // reset combo
        this.combo = 0; this.comboMultiplier = 1; this.comboTimer = 0; this.bestCombo = 0;
        Player.reset();
        Camera.init();
        Enemy.init();
        Bullet.init();
        Particle.init();
        Currency.init();
        Orb.init();
        TeleportFX.init();
        document.getElementById('gameOver').style.display = 'none';
        document.getElementById('reviveScreen').style.display = 'none';
        const initialSpawn = 10;
        for (let i = 0; i < initialSpawn; i++) {
            setTimeout(() => { Enemy.create(); Enemy.waveEnemiesSpawned++; }, i * 200);
        }
    },

    returnToMenu() {
        document.getElementById('gameScreen').style.display = 'none';
        document.getElementById('startScreen').style.display = 'flex';
        this.state = 'menu';
        this.timeScale = 1.0;
        this.deathSequenceTimer = 0;
        document.dispatchEvent(new CustomEvent('game:returnToMenu'));
    },

    announceNewWave() {
        if (Game.wave > 0) { this.wave++; }
        this.upgradesThisWave = 0;
        this.state = 'waveAnnouncement';
        this.waveAnnouncementTimer = 180;
        // reset combo between waves softly (keep best)
        this.combo = 0; this.comboMultiplier = 1; this.comboTimer = 0;
        Enemy.waveEnemiesSpawned = 0;
        Enemy.bonusWaveActive = false;
        Enemy.bonusWaveSpawned = 0;
        Enemy.bonusWaveTarget = 0;
        Enemy.setWaveLimit();
        this.createWaveAnnouncementEffects();
        Audio.playSoundEffect('newWave');
        setTimeout(() => {
            const initialSpawn = Math.min(8 + Math.floor(this.wave * 1.2), 15);
            for (let i = 0; i < initialSpawn; i++) {
                setTimeout(() => { Enemy.create(); Enemy.waveEnemiesSpawned++; }, i * 250);
            }
            this.state = 'playing';
        }, 2000);
    },

    onUpgrade() { this.upgradesThisWave++; },

    createWaveAnnouncementEffects() {
        const centerX = Player.data.x; const centerY = Player.data.y;
        Particle.createExplosion(centerX, centerY, '#FFD700', 40);
        for (let ring = 0; ring < 5; ring++) {
            setTimeout(() => {
                const radius = 50 + ring * 30; const particleCount = 16;
                for (let i = 0; i < particleCount; i++) {
                    const angle = (i * Math.PI * 2) / particleCount;
                    const x = centerX + Math.cos(angle) * radius;
                    const y = centerY + Math.sin(angle) * radius;
                    Particle.createExplosion(x, y, '#FFD700', 6);
                }
            }, ring * 200);
        }
    },

    completeDeathSequence() {
        this.timeScale = 1.0; this.deathSequenceTimer = 0;
        if (this.lives <= 0) {
            // CORRECTION: proposer revive AVANT game over (si limite pas atteinte)
            if (this.resurrections < CONFIG.LIMITS.MAX_RESURRECTIONS) {
                this.state = 'revive';
                Upgrades.generateReviveOptions();
                UI.showReviveScreen();
                return;
            } else {
                this.state = 'gameOver';
                this.showGameOverModal();
                return;
            }
        }
        const safe = Player.findSafeSpawnLocation();
        this.state = 'teleporting';
        Camera.setTargetZoom(Math.max(0.75, (CONFIG.CAMERA.ZOOM || 1) * 0.75));
        Camera.startTeleportation(safe.x, safe.y, 700);
        TeleportFX.create(safe.x, safe.y, { duration: 120, maxRadius: 160 });
        Audio.playSoundEffect('teleport');
        setTimeout(() => {
            Player.data.x = safe.x; Player.data.y = safe.y;
            Enemy.clearNearby(safe.x, safe.y, 180);
            Player.data.invulnerable = true; Player.data.invulnerableTime = 180;
        }, 350);
        setTimeout(() => {
            Camera.setTargetZoom(CONFIG.CAMERA.ZOOM || 1);
            if (typeof Camera.releaseFollow === 'function') Camera.releaseFollow();
            this.state = 'playing';
        }, 900);
    },

    updateCombo(deltaKills) {
        if (deltaKills > 0) {
            this.combo += deltaKills;
            this.comboTimer = CONFIG.COMBO.WINDOW_FRAMES;
            if (this.combo > this.bestCombo) this.bestCombo = this.combo;
            // recalcul multiplier
            const steps = Math.floor(this.combo / CONFIG.COMBO.KILLS_PER_STEP);
            this.comboMultiplier = Math.min(1 + steps * CONFIG.COMBO.MULTIPLIER_STEP, CONFIG.COMBO.MAX_MULTIPLIER);
        } else {
            if (this.comboTimer > 0) this.comboTimer--; else {
                // reset
                this.combo = 0; this.comboMultiplier = 1; this.comboTimer = 0;
            }
        }
    },

    update() {
        if (this.state === 'upgrade') {
            if (Input.isKeyPressed('1')) { Upgrades.select(0); } else if (Input.isKeyPressed('2')) { Upgrades.select(1); } else if (Input.isKeyPressed('3')) { Upgrades.select(2); }
            return;
        }
        if (this.state === 'waveAnnouncement') {
            this.waveAnnouncementTimer--; if (this.waveAnnouncementTimer <= 0) { this.state = 'playing'; }
            Particle.update(); TeleportFX.update(); this.updateCombo(0); return;
        }
        if (this.state === 'deathSequence') {
            this.deathSequenceTimer--; if (this.deathSequenceTimer <= 0) { this.deathSequenceTimer = 0; this.completeDeathSequence(); }
            Particle.update(); TeleportFX.update(); this.updateCombo(0); return;
        }
        if (this.state === 'teleporting') { Particle.update(); TeleportFX.update(); this.updateCombo(0); return; }
        if (this.state === 'playing') {
            const timeAdjustedUpdate = () => { Player.update(); Bullet.update(); Enemy.update(); Enemy.spawn(); Currency.update(); Orb.update(); Particle.update(); TeleportFX.update(); };
            if (this.timeScale < 1) { const steps = Math.ceil(1 / this.timeScale); for (let i = 0; i < steps; i++) { if (Math.random() < this.timeScale * steps) { timeAdjustedUpdate(); } } } else { timeAdjustedUpdate(); }
            // combo tick
            this.updateCombo(0);
        }
        this.updateUI();
    },

    startDeathSequence() { this.state = 'deathSequence'; this.timeScale = 0.3; this.deathSequenceTimer = 180; this.combo = 0; this.comboMultiplier = 1; },

    // showGameOverModal()
    async showGameOverModal() {
        Input.suspend();
        const gameTime = Math.floor((Date.now() - this.startTime) / 1000);
        const existingModal = document.querySelector('.game-over-modal');
        if (existingModal) existingModal.remove();
        const modal = document.createElement('div');
        modal.className = 'game-over-modal neon-theme';
        modal.innerHTML = `
            <div class="gom-header">
                <h2 class="gom-title">MISSION FAILED</h2>
                <div class="gom-divider"></div>
                <div class="gom-stats-grid">
                    <div class="stat"><span class="lbl">SCORE</span><span class="val">${this.score.toLocaleString()}</span></div>
                    <div class="stat"><span class="lbl">KILLS</span><span class="val">${this.kills}</span></div>
                    <div class="stat"><span class="lbl">WAVE</span><span class="val">${this.wave}</span></div>
                    <div class="stat"><span class="lbl">TIME</span><span class="val">${Math.floor(gameTime/60)}:${(gameTime%60).toString().padStart(2,'0')}</span></div>
                    <div class="stat wide"><span class="lbl">BEST COMBO</span><span class="val">${this.bestCombo}x</span></div>
                </div>
            </div>
            <div class="gom-body">
                <p class="prompt">ENTER YOUR CALL SIGN</p>
                <div class="gom-form">
                    <input id="playerName" maxlength="15" autocomplete="off" placeholder="ACE PILOT" class="gom-input" />
                    <button id="submitScoreBtn" class="gom-btn primary">SUBMIT</button>
                    <button id="skipScoreBtn" class="gom-btn secondary">SKIP</button>
                </div>
                <div class="rank-feedback" id="rankFeedback" style="display:none"></div>
                <p class="hint">Press ENTER to submit, ESC to skip</p>
            </div>`;
        document.body.appendChild(modal);
        setTimeout(()=>modal.classList.add('show'),10);
        const submitBtn = modal.querySelector('#submitScoreBtn');
        const skipBtn = modal.querySelector('#skipScoreBtn');
        submitBtn.addEventListener('click', ()=>this.submitScore());
        skipBtn.addEventListener('click', ()=>this.skipScore());
        const nameInput = modal.querySelector('#playerName');
        nameInput.addEventListener('keypress', e=>{ if(e.key==='Enter') this.submitScore(); });
        const handleEsc = e=>{ if(e.key==='Escape'){ this.skipScore(); document.removeEventListener('keydown',handleEsc);} }; document.addEventListener('keydown',handleEsc);
        setTimeout(()=>nameInput.focus(),50);
    },
    async submitScore() {
        const playerNameInput = document.getElementById('playerName');
        if (!playerNameInput) { console.error("playerName input introuvable"); return; }
        const playerName = playerNameInput.value.trim();
        if (!playerName) {
            playerNameInput.classList.add('error');
            playerNameInput.placeholder = "Name required!";
            setTimeout(()=>{ playerNameInput.classList.remove('error'); playerNameInput.placeholder='Your Call Sign'; },2000);
            return;
        }
        const submitBtn = document.getElementById('submitScoreBtn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="btn-icon">⏳</span><span class="btn-text">Submitting...</span>';
        submitBtn.disabled = true;

        const finalScore = this.score;
        const finalKills = this.kills;
        const finalTime = Math.floor((Date.now() - this.startTime) / 1000);

        try {
            const user = await getCurrentUser();
            const success = await saveScore(user, playerName, finalScore, `${finalTime}s`, finalKills);
            if (success) {
                // Calcul du rang (nombre de scores strictement supérieurs + 1)
                let rank = null;
                try {
                    const rankQ = query(collection(db,'highscores'), where('score','>', finalScore));
                    const snap = await getCountFromServer(rankQ);
                    rank = (snap.data().count || 0) + 1;
                } catch(e){ console.warn('Rank calc failed', e); }

                sessionStorage.setItem('lastScore', JSON.stringify({
                    name: playerName,
                    score: finalScore,
                    kills: finalKills,
                    time: finalTime,
                    timestamp: Date.now(),
                    rank
                }));

                submitBtn.innerHTML = '<span class="btn-icon">✅</span><span class="btn-text">Saved!</span>';
                submitBtn.classList.add('success');

                // Redirection rapide vers la page des highscores pour montrer le rang
                setTimeout(()=>{
                    window.location.href = 'highscores.html';
                }, 900);
            } else {
                throw new Error('Failed to save score');
            }
        } catch (error) {
            console.error('Erreur sauvegarde score:', error);
            submitBtn.innerHTML = '<span class="btn-icon">❌</span><span class="btn-text">Error - Retry</span>';
            submitBtn.classList.add('error');
            submitBtn.disabled = false;
            setTimeout(()=>{ submitBtn.innerHTML = originalText; submitBtn.classList.remove('error'); }, 2600);
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

    // M�thode pour incr�menter le compteur de kills
    addKill() {
        this.kills++;
        // application multiplicateur combo sur score (points ajoutés côté Enemy.takeDamage)
    },

    applyScore(basePoints) {
        const points = Math.floor(basePoints * this.comboMultiplier);
        this.score += points;
    },

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('wave').textContent = this.wave;
        document.getElementById('lives').textContent = this.lives;
        const gemMultiplier = Player.data && Player.data.gemMultiplier ? Player.data.gemMultiplier : 1;
        if (gemMultiplier > 1) { document.getElementById('gems').textContent = `${this.gems} (x${gemMultiplier})`; } else { document.getElementById('gems').textContent = this.gems; }
        document.getElementById('nextUpgrade').textContent = Math.max(0, this.gemsForUpgrade - this.gems);
        document.getElementById('resurrections').textContent = this.resurrections;
        document.getElementById('movementMode').textContent = Player.data && Player.data.followMouse ? 'MODE: MOUSE' : 'MODE: WASD';
        if (this.gems >= this.gemsForUpgrade && this.state === 'playing') { this.state = 'upgrade'; Upgrades.generateOptions(); }
        // UI combo ephemeral (utiliser un element existant ou text overlay)
        let comboEl = document.getElementById('combo');
        if (!comboEl) {
            comboEl = document.createElement('div'); comboEl.id = 'combo'; comboEl.style.cssText = 'position:absolute;left:12px;top:120px;color:#ff0;font-family:Courier New;font-size:16px;pointer-events:none;';
            document.getElementById('gameScreen').appendChild(comboEl);
        }
        if (this.combo > 0) {
            comboEl.textContent = `COMBO ${this.combo}  x${this.comboMultiplier.toFixed(2)}`;
            comboEl.style.opacity = '1';
        } else {
            comboEl.style.opacity = '0.3'; comboEl.textContent = 'COMBO x1';
        }
        // Wave progression panel
        let waveProg = document.getElementById('waveProgress');
        if (!waveProg) {
            waveProg = document.createElement('div');
            waveProg.id = 'waveProgress';
            waveProg.style.cssText = 'position:absolute;right:12px;top:120px;color:#0ff;font-family:Courier New;font-size:14px;text-align:right;pointer-events:none;';
            document.getElementById('gameScreen').appendChild(waveProg);
        }
        const spawned = Enemy.waveEnemiesSpawned;
        const max = Enemy.maxEnemiesPerWave || 0;
        waveProg.innerHTML = `Wave ${this.wave}<br>${spawned}/${max} spawned<br>Upgrades ${this.upgradesThisWave}/2`;
    },

    gameLoop() { this.update(); Renderer.render(); requestAnimationFrame(() => this.gameLoop()); }
};

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
                    <div class="upgrade-benefit">${option.benefit || ''}</div>
                </div>`;
        }
        const items = optionsDiv.querySelectorAll('.revive-option');
        items.forEach(el => { el.addEventListener('click', () => { const idx = parseInt(el.getAttribute('data-index'), 10); Upgrades.selectRevive(idx); }); });
    }
};

export { Game }; window.Game = Game; window.addEventListener('load', () => { Game.init(); });