import { CONFIG } from './config.js';
import { Player } from './player.js';

// Module de gestion de la caméra
export const Camera = {
    x: 0,
    y: 0,
    zoom: CONFIG.CAMERA.ZOOM || 1,
    targetZoom: CONFIG.CAMERA.ZOOM || 1,
    smoothing: 0.1,
    
    // État de téléportation
    teleporting: false,
    teleportTarget: null,
    teleportProgress: 0,
    
    init() {
        this.x = Player.data.x;
        this.y = Player.data.y;
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
        this.teleportProgress = 0;
    },
    
    updateTeleport() {
        if (!this.teleporting || !this.teleportTarget) return;
        
        this.teleportProgress += 0.02;
        
        // Interpolation entre la position actuelle et la cible
        this.x = this.x + (this.teleportTarget.x - this.x) * this.teleportProgress;
        this.y = this.y + (this.teleportTarget.y - this.y) * this.teleportProgress;
        
        if (this.teleportProgress >= 1) {
            this.finishTeleportation();
        }
    },
    
    finishTeleportation() {
        this.teleporting = false;
        this.teleportTarget = null;
        this.teleportProgress = 0;
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