// Module de gestion de la cam�ra
const Camera = {
    x: 0,
    y: 0,
    zoom: null,
    targetZoom: null,
    targetX: null,
    targetY: null,
    teleporting: false,

    init() {
        this.zoom = CONFIG.CAMERA.ZOOM || 1;
        this.targetZoom = this.zoom;
        this.teleporting = false;
        // Initialiser la position de la cam�ra sur le joueur
        if (Player.data) {
            this.x = Player.data.x - (CONFIG.CANVAS.WIDTH / 2) / this.zoom;
            this.y = Player.data.y - (CONFIG.CANVAS.HEIGHT / 2) / this.zoom;
            this.targetX = this.x;
            this.targetY = this.y;
        }
    },
    
    setTargetZoom(value) {
        this.targetZoom = Math.max(0.6, Math.min(3, value));
    },

    startTeleportation(targetX, targetY) {
        this.teleporting = true;
        this.targetX = targetX;
        this.targetY = targetY;
    },

    finishTeleportation() {
        this.teleporting = false;
        this.targetX = null;
        this.targetY = null;
    },

    getZoom() {
        if (this.zoom == null) this.zoom = CONFIG.CAMERA.ZOOM || 1;
        return this.zoom;
    },
    
    update() {
        if (!Player.data) return;
        if (this.zoom == null) this.zoom = CONFIG.CAMERA.ZOOM || 1;
        if (this.targetZoom == null) this.targetZoom = this.zoom;
        
        // Dimensions visibles actuelles du canvas (apr�s zoom logique)
        const viewW = (Renderer && Renderer.canvas) ? Renderer.canvas.width : CONFIG.CANVAS.WIDTH;
        const viewH = (Renderer && Renderer.canvas) ? Renderer.canvas.height : CONFIG.CANVAS.HEIGHT;
        const zoom = this.getZoom();
        const visibleW = Math.floor(viewW / zoom);
        const visibleH = Math.floor(viewH / zoom);
        
        // D�terminer la cible de position selon le contexte
        let finalTargetX, finalTargetY;
        
        if (this.teleporting && this.targetX !== null && this.targetY !== null) {
            // Pendant la t�l�portation, centrer sur la position de t�l�portation
            finalTargetX = this.targetX - visibleW / 2;
            finalTargetY = this.targetY - visibleH / 2;
        } else {
            // Suivi normal du joueur
            finalTargetX = Player.data.x - visibleW / 2;
            finalTargetY = Player.data.y - visibleH / 2;
        }
        
        // Vitesse de suivi adaptative selon le contexte
        let followSpeed = CONFIG.CAMERA.FOLLOW_SPEED;
        if (this.teleporting) {
            // Mouvement plus fluide pendant la t�l�portation
            followSpeed = 0.04; // Plus lent pour plus de fluidit�
        } else if (Math.abs(this.targetZoom - this.zoom) > 0.1) {
            // Suivi l�g�rement plus rapide pendant les changements de zoom
            followSpeed = CONFIG.CAMERA.FOLLOW_SPEED * 1.5;
        }
        
        // Appliquer le lissage de position
        this.x += (finalTargetX - this.x) * followSpeed;
        this.y += (finalTargetY - this.y) * followSpeed;
        
        // Interpolation du zoom avec vitesse adaptative
        let zoomSpeed = 0.08;
        if (this.teleporting) {
            zoomSpeed = 0.06; // Zoom plus fluide pendant t�l�portation
        }
        this.zoom += (this.targetZoom - this.zoom) * zoomSpeed;
        
        // Garder la cam�ra dans les limites du monde
        this.x = Math.max(0, Math.min(CONFIG.WORLD.WIDTH - visibleW, this.x));
        this.y = Math.max(0, Math.min(CONFIG.WORLD.HEIGHT - visibleH, this.y));
    },
    
    // Convertir les coordonn�es du monde en coordonn�es d'�cran
    worldToScreen(worldX, worldY) {
        const zoom = this.getZoom();
        return {
            x: (worldX - this.x) * zoom,
            y: (worldY - this.y) * zoom
        };
    },
    
    // Convertir les coordonn�es d'�cran en coordonn�es du monde
    screenToWorld(screenX, screenY) {
        const zoom = this.getZoom();
        return {
            x: screenX / zoom + this.x,
            y: screenY / zoom + this.y
        };
    },
    
    // V�rifier si un objet est visible � l'�cran
    isVisible(worldX, worldY, margin = 50) {
        const screen = this.worldToScreen(worldX, worldY);
        const viewW = (Renderer && Renderer.canvas) ? Renderer.canvas.width : CONFIG.CANVAS.WIDTH;
        const viewH = (Renderer && Renderer.canvas) ? Renderer.canvas.height : CONFIG.CANVAS.HEIGHT;
        return screen.x >= -margin && 
               screen.x <= viewW + margin && 
               screen.y >= -margin && 
               screen.y <= viewH + margin;
    }
};