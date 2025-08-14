// Module de gestion de la cam�ra
const Camera = {
    x: 0,
    y: 0,
    zoom: null,
    targetZoom: null,

    init() {
        this.zoom = CONFIG.CAMERA.ZOOM || 1;
        this.targetZoom = this.zoom;
        // Initialiser la position de la cam�ra sur le joueur
        if (Player.data) {
            this.x = Player.data.x - (CONFIG.CANVAS.WIDTH / 2) / this.zoom;
            this.y = Player.data.y - (CONFIG.CANVAS.HEIGHT / 2) / this.zoom;
        }
    },
    
    setTargetZoom(value) {
        this.targetZoom = Math.max(0.6, Math.min(3, value));
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
        
        // Calculer la position cible de la cam�ra (centrer le joueur � l'�cran)
        const targetX = Player.data.x - visibleW / 2;
        const targetY = Player.data.y - visibleH / 2;
        
        // Suivre le joueur avec du lissage
        this.x += (targetX - this.x) * CONFIG.CAMERA.FOLLOW_SPEED;
        this.y += (targetY - this.y) * CONFIG.CAMERA.FOLLOW_SPEED;
        
        // Interpolation du zoom vers la cible (lissage)
        this.zoom += (this.targetZoom - this.zoom) * 0.08; // easing
        
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