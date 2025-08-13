// Module de gestion des entrées
const Input = {
    keys: {},
    mouse: { x: 400, y: 300 },
    
    init() {
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        }
    },
    
    handleKeyDown(e) {
        this.keys[e.key.toLowerCase()] = true;
        
        // Gestion des touches spéciales
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
        
        // Gestion des choix d'amélioration
        if (Game.state === 'upgrade') {
            if (e.key === '1') Upgrades.select(0);
            if (e.key === '2') Upgrades.select(1);
            if (e.key === '3') Upgrades.select(2);
        }
        
        // Gestion de la résurrection
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
    
    isKeyPressed(key) {
        return !!this.keys[key.toLowerCase()];
    }
};