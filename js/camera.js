// Module de gestion de la cam�ra
const Camera = {
    x: 0,
    y: 0,
    
    update() {
        if (!Player.data) return;
        
        // Calculer la position cible de la cam�ra (centrer le joueur � l'�cran)
        const targetX = Player.data.x - CONFIG.CANVAS.WIDTH / 2;
        const targetY = Player.data.y - CONFIG.CANVAS.HEIGHT / 2;
        
        // Suivre le joueur avec du lissage
        this.x += (targetX - this.x) * CONFIG.CAMERA.FOLLOW_SPEED;
        this.y += (targetY - this.y) * CONFIG.CAMERA.FOLLOW_SPEED;
        
        // Garder la cam�ra dans les limites du monde
        this.x = Math.max(0, Math.min(CONFIG.WORLD.WIDTH - CONFIG.CANVAS.WIDTH, this.x));
        this.y = Math.max(0, Math.min(CONFIG.WORLD.HEIGHT - CONFIG.CANVAS.HEIGHT, this.y));
    },
    
    // Convertir les coordonn�es du monde en coordonn�es d'�cran
    worldToScreen(worldX, worldY) {
        return {
            x: worldX - this.x,
            y: worldY - this.y
        };
    },
    
    // Convertir les coordonn�es d'�cran en coordonn�es du monde
    screenToWorld(screenX, screenY) {
        return {
            x: screenX + this.x,
            y: screenY + this.y
        };
    },
    
    // V�rifier si un objet est visible � l'�cran
    isVisible(worldX, worldY, margin = 50) {
        const screen = this.worldToScreen(worldX, worldY);
        return screen.x >= -margin && 
               screen.x <= CONFIG.CANVAS.WIDTH + margin && 
               screen.y >= -margin && 
               screen.y <= CONFIG.CANVAS.HEIGHT + margin;
    }
};