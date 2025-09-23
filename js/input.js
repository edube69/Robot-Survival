import { Audio } from './audio.js';
import { Player } from './player.js';
import { Upgrades } from './upgrades.js';

// Gestion des entrées
export const Input = {
    keys: {},
    mouse: { x: 400, y: 300 },
    active: true, // ← interrupteur global

    init() {
        // On ne traite les events que si "active" est true
        document.addEventListener('keydown', (e) => { if (this.active) this.handleKeyDown(e); });
        document.addEventListener('keyup', (e) => { if (this.active) this.handleKeyUp(e); });
        document.addEventListener('click', this.handleDocumentClick.bind(this));

        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
            canvas.addEventListener('click', this.handleClick.bind(this));
        }
    },

    suspend() { this.active = false; },
    resume() { this.active = true; },

    // Évite les hotkeys si l'utilisateur tape dans un champ
    isTypingInForm() {
        const el = document.activeElement;
        return !!el && (
            el.tagName === 'INPUT' ||
            el.tagName === 'TEXTAREA' ||
            el.isContentEditable === true
        );
    },

    handleKeyDown(e) {
        if (!e || typeof e.key !== 'string') return;  // garde-fou
        if (this.isTypingInForm()) return;            // on n'interfère pas avec la saisie

        const k = e.key.toLowerCase();
        this.keys[k] = true;

        // Toggle pause
        if (k === 'p' && typeof Game !== 'undefined') {
            if (Game.state === 'playing' || Game.state === 'paused') {
                e.preventDefault();
                Game.togglePause();
                return;
            }
        }

        // Espace pour restart au game over (empêche aussi un éventuel scroll)
        if ((k === ' ' || k === 'spacebar') && typeof Game !== 'undefined' && Game.state === 'gameOver') {
            e.preventDefault();
            Game.restart();
            return;
        }

        if (k === 'escape' && typeof Game !== 'undefined' && (Game.state === 'gameOver' || Game.state === 'playing')) {
            Game.returnToMenu();
        }

        if (k === 'm' && typeof Game !== 'undefined' && Game.state === 'playing') {
            Player.toggleMouseMode();
        }

        if (k === 's') {
            Audio.toggle();
        }

        // Choix d'amélioration
        if (typeof Game !== 'undefined' && Game.state === 'upgrade') {
            if (k === '1') Upgrades.select(0);
            if (k === '2') Upgrades.select(1);
            if (k === '3') Upgrades.select(2);
        }

        // Résurrection
        if (typeof Game !== 'undefined' && Game.state === 'revive') {
            if (k === '1') Upgrades.selectRevive(0);
            if (k === '2') Upgrades.selectRevive(1);
            if (k === '3') Upgrades.selectRevive(2);
            if (k === '4') Upgrades.skipResurrection();
        }
    },

    handleKeyUp(e) {
        if (!e || typeof e.key !== 'string') return;  // garde-fou
        if (this.isTypingInForm()) return;
        this.keys[e.key.toLowerCase()] = false;
    },

    handleMouseMove(e) {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return; // ex. highscores.html
        const rect = canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
    },

    // Clic dans le canvas pour l’écran de level up
    handleClick(e) {
        if (typeof Game === 'undefined' || Game.state !== 'upgrade') return;
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Coordonnées des cartes d'upgrade (doivent correspondre à Renderer.drawUpgradeScreen)
        const left = 100;
        const right = canvas.width - 100;
        for (let i = 0; i < (Upgrades.options ? Upgrades.options.length : 0); i++) {
            const centerY = 250 + i * 80;
            const top = centerY - 30;
            const bottom = centerY + 30;
            if (x >= left && x <= right && y >= top && y <= bottom) {
                Upgrades.select(i);
                break;
            }
        }
    },

    // Clics sur l’écran de résurrection et Mission Failed (DOM overlay)
    handleDocumentClick(e) {
        if (typeof Game !== 'undefined' && Game.state === 'revive') {
            const optionEl = e.target.closest && e.target.closest('.revive-option');
            if (optionEl) {
                const idxAttr = optionEl.getAttribute('data-index');
                let idx = idxAttr != null ? parseInt(idxAttr, 10) : -1;
                if (Number.isNaN(idx) || idx < 0) {
                    const optionsDiv = document.getElementById('reviveOptions');
                    const list = Array.from(optionsDiv.querySelectorAll('.revive-option'));
                    idx = list.indexOf(optionEl);
                }
                if (idx >= 0) Upgrades.selectRevive(idx);
                return;
            }
        }

        if (typeof Game !== 'undefined' && Game.state === 'gameOver') {
            const goEl = e.target.closest && e.target.closest('.go-option');
            if (goEl) {
                const action = goEl.getAttribute('data-action');
                if (action === 'restart') Game.restart();
                else if (action === 'menu') Game.returnToMenu();
            }
        }
    },

    isKeyPressed(key) {
        return !!this.keys[key.toLowerCase()];
    }
};
