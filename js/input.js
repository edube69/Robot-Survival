import { Audio } from './audio.js';
import { Player } from './player.js';
import { Upgrades } from './upgrades.js';

// Module de gestion des entr�es
export const Input = {
    keys: {},
    mouse: { x: 400, y: 300 },
    
    init() {
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
        document.addEventListener('click', this.handleDocumentClick.bind(this));
        
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
            canvas.addEventListener('click', this.handleClick.bind(this));
        }
    },
    
    handleKeyDown(e) {
        this.keys[e.key.toLowerCase()] = true;
        
        // Gestion des touches sp�ciales
        if (e.key === ' ' && Game.state === 'gameOver') {
            Game.restart();
        }
        
        if (e.key === 'Escape' && (Game.state === 'gameOver' || Game.state === 'playing')) {
            Game.returnToMenu();
        }
        
        if (e.key.toLowerCase() === 'm' && Game.state === 'playing') {
            Player.toggleMouseMode();
        }
        
        if (e.key.toLowerCase() === 's') {
            Audio.toggle();
        }
        
        // Gestion des choix d'am�lioration
        if (Game.state === 'upgrade') {
            if (e.key === '1') Upgrades.select(0);
            if (e.key === '2') Upgrades.select(1);
            if (e.key === '3') Upgrades.select(2);
        }
        
        // Gestion de la r�surrection
        if (Game.state === 'revive') {
            if (e.key === '1') Upgrades.selectRevive(0);
            if (e.key === '2') Upgrades.selectRevive(1);
            if (e.key === '3') Upgrades.selectRevive(2);
            if (e.key === '4') Upgrades.skipResurrection();
        }
    },
    
    handleKeyUp(e) {
        this.keys[e.key.toLowerCase()] = false;
    },
    
    handleMouseMove(e) {
        const canvas = document.getElementById('gameCanvas');
        const rect = canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
    },

    // Clic dans le canvas pour l'�cran de level up
    handleClick(e) {
        if (Game.state !== 'upgrade') return;
        const canvas = document.getElementById('gameCanvas');
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Coordonn�es des cartes d'upgrade (doivent correspondre � Renderer.drawUpgradeScreen)
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

    // Clics sur l'�cran de r�surrection et Mission Failed (DOM overlay)
    handleDocumentClick(e) {
        if (Game.state === 'revive') {
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
        
        if (Game.state === 'gameOver') {
            const goEl = e.target.closest && e.target.closest('.go-option');
            if (goEl) {
                const action = goEl.getAttribute('data-action');
                if (action === 'restart') {
                    Game.restart();
                } else if (action === 'menu') {
                    Game.returnToMenu();
                }
            }
        }
    },
    
    isKeyPressed(key) {
        return !!this.keys[key.toLowerCase()];
    }
};