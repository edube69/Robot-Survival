// Module de gestion de la caméra
const Camera = {
    x: 0,
    y: 0,
    
    update() {
        if (!Player.data) return;
        
        // Calculer la position cible de la caméra (centrer le joueur à l'écran)
        const targetX = Player.data.x - CONFIG.CANVAS.WIDTH / 2;
        const targetY = Player.data.y - CONFIG.CANVAS.HEIGHT / 2;
        
        // Suivre le joueur avec du lissage
        this.x += (targetX - this.x) * CONFIG.CAMERA.FOLLOW_SPEED;
        this.y += (targetY - this.y) * CONFIG.CAMERA.FOLLOW_SPEED;
        
        // Garder la caméra dans les limites du monde
        this.x = Math.max(0, Math.min(CONFIG.WORLD.WIDTH - CONFIG.CANVAS.WIDTH, this.x));
        this.y = Math.max(0, Math.min(CONFIG.WORLD.HEIGHT - CONFIG.CANVAS.HEIGHT, this.y));
    },
    
    // Convertir les coordonnées du monde en coordonnées d'écran
    worldToScreen(worldX, worldY) {
        return {
            x: worldX - this.x,
            y: worldY - this.y
        };
    },
    
    // Convertir les coordonnées d'écran en coordonnées du monde
    screenToWorld(screenX, screenY) {
        return {
            x: screenX + this.x,
            y: screenY + this.y
        };
    },
    
    // Vérifier si un objet est visible à l'écran
    isVisible(worldX, worldY, margin = 50) {
        const screen = this.worldToScreen(worldX, worldY);
        return screen.x >= -margin && 
               screen.x <= CONFIG.CANVAS.WIDTH + margin && 
               screen.y >= -margin && 
               screen.y <= CONFIG.CANVAS.HEIGHT + margin;
    }
};