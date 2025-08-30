import { CONFIG } from './config.js';
import { Player } from './player.js';

// Module de gestion de la caméra
export const Camera = {
    x: 0,
    y: 0,
    zoom: CONFIG.CAMERA.ZOOM || 1,
    targetZoom: CONFIG.CAMERA.ZOOM || 1,
    smoothing: 0.1,
    
    // État de téléportation amélioré
    teleporting: false,
    teleportTarget: null,
    teleportStart: 0,
    teleportDuration: 600,  
    teleportProgress: 0,
    teleportSpeed: 0.015, // Vitesse plus lente pour plus de fluidité
    originalPosition: null,

    // Verrou de suivi (empêche de suivre le joueur)
    followLocked: false,

    originalPosition: null,


    init() {
        this.x = Player.data.x;
        this.y = Player.data.y;
        this.teleporting = false;
        this.teleportTarget = null;
        this.teleportStart = 0;
        this.teleportDuration = 600;
        this.teleportProgress = 0;
        this.followLocked = false;
        this.originalPosition = null;
    },
    
    update() {
        // Zoom lissé en permanence
        if (this.zoom !== this.targetZoom) {
            this.zoom += (this.targetZoom - this.zoom) * 0.1;
        }

        // Téléportation: interpolation vers la cible + on ignore le joueur
        if (this.teleporting) {
            this.updateTeleport();
            return;
        }

        // Verrou de suivi actif (ex.: juste après la TP, en attendant que Game déplace le joueur)
        if (this.followLocked) return;

        // Suivi normal du joueur
        if (Player.data) {
            this.x += (Player.data.x - this.x) * this.smoothing;
            this.y += (Player.data.y - this.y) * this.smoothing;
        }
    },

    
    startTeleportation(targetX, targetY, durationMs = 600) {
        this.teleporting = true;
        this.followLocked = true; // ← empêche le suivi du joueur
        this.teleportTarget = { x: targetX, y: targetY };
        this.originalPosition = { x: this.x, y: this.y };
        this.teleportStart = performance.now();
        this.teleportDuration = Math.max(100, durationMs);
        this.teleportProgress = 0;
        // (optionnel) léger zoom-out déjà géré par Game via setTargetZoom
    },
    
    updateTeleport() {
        if (!this.teleporting || !this.teleportTarget || !this.originalPosition) return;

        const now = performance.now();
        const t = Math.min(1, (now - this.teleportStart) / this.teleportDuration);
        this.teleportProgress = t;

        // easing: easeInOutCubic
        const smoothT = (t < 0.5) ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

        this.x = this.originalPosition.x + (this.teleportTarget.x - this.originalPosition.x) * smoothT;
        this.y = this.originalPosition.y + (this.teleportTarget.y - this.originalPosition.y) * smoothT;

        if (t >= 1) {
            this.finishTeleportation();
        }
    },

    
    finishTeleportation() {
        if (this.teleportTarget) {
            this.x = this.teleportTarget.x;
            this.y = this.teleportTarget.y;
        }
        this.teleporting = false;
        this.teleportTarget = null;
        this.originalPosition = null;
        this.teleportStart = 0;
        this.teleportDuration = 600;
        this.teleportProgress = 1;
        // IMPORTANT: followLocked RESTE TRUE.
        // Game appellera Camera.releaseFollow() quand le joueur aura été déplacé.
    },

    
    setTargetZoom(value) {
        this.targetZoom = value;
    },
    
    worldToScreen(worldX, worldY) {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return { x: 0, y: 0 };
        
        return {
            x: (worldX - this.x) * this.zoom + canvas.width / 2,
            y: (worldY - this.y) * this.zoom + canvas.height / 2
        };
    },

    screenToWorld(screenX, screenY) {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return { x: 0, y: 0 };
        return {
            x: (screenX - canvas.width / 2) / this.zoom + this.x,
            y: (screenY - canvas.height / 2) / this.zoom + this.y
        };
    },

    isVisible(worldX, worldY, margin = 0) {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return false;
        const zoom = this.zoom || 1;
        const screenX = (worldX - this.x) * zoom + canvas.width / 2;
        const screenY = (worldY - this.y) * zoom + canvas.height / 2;
        return (
            screenX >= -margin &&
            screenX <= canvas.width + margin &&
            screenY >= -margin &&
            screenY <= canvas.height + margin
        );
    },

    releaseFollow() { this.followLocked = false; },
    isTeleporting() { return this.teleporting; },
    getTeleportProgress() { return this.teleportProgress; },
    getZoom() { return this.zoom; },

};