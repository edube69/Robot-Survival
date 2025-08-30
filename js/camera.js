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
    teleportProgress: 0,
    teleportSpeed: 0.015, // Vitesse plus lente pour plus de fluidité
    originalPosition: null,
    
    init() {
        this.x = Player.data.x;
        this.y = Player.data.y;
        this.teleporting = false;
        this.teleportTarget = null;
        this.teleportProgress = 0;
        this.originalPosition = null;
    },
    
    update() {
        if (this.teleporting) {
            this.updateTeleport();
            return;
        }
        
        // Mise à jour progressive vers la position du joueur
        if (Player.data) {
            this.x += (Player.data.x - this.x) * this.smoothing;
            this.y += (Player.data.y - this.y) * this.smoothing;
            
            // Mise à jour progressive du zoom
            if (this.zoom !== this.targetZoom) {
                this.zoom += (this.targetZoom - this.zoom) * 0.1;
            }
        }
    },
    
    startTeleportation(targetX, targetY) {
        this.teleporting = true;
        this.teleportTarget = { x: targetX, y: targetY };
        this.originalPosition = { x: this.x, y: this.y };
        this.teleportProgress = 0;
        console.log(`Starting camera teleportation from (${this.x.toFixed(1)}, ${this.y.toFixed(1)}) to (${targetX}, ${targetY})`);
    },
    
    updateTeleport() {
        if (!this.teleporting || !this.teleportTarget || !this.originalPosition) return;
        
        this.teleportProgress += this.teleportSpeed;
        
        // Utiliser une courbe d'easing smooth (ease-in-out cubic)
        const t = this.teleportProgress;
        const smoothT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        
        // Interpolation fluide entre la position originale et la cible
        this.x = this.originalPosition.x + (this.teleportTarget.x - this.originalPosition.x) * smoothT;
        this.y = this.originalPosition.y + (this.teleportTarget.y - this.originalPosition.y) * smoothT;
        
        if (this.teleportProgress >= 1) {
            console.log(`Camera teleportation completed at (${this.x.toFixed(1)}, ${this.y.toFixed(1)})`);
            this.finishTeleportation();
        }
    },
    
    finishTeleportation() {
        if (this.teleportTarget) {
            // S'assurer que la position finale est exactement la cible
            this.x = this.teleportTarget.x;
            this.y = this.teleportTarget.y;
        }
        
        this.teleporting = false;
        this.teleportTarget = null;
        this.teleportProgress = 0;
        this.originalPosition = null;
        console.log(`Camera teleportation finished, position: (${this.x.toFixed(1)}, ${this.y.toFixed(1)})`);
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
    }
};