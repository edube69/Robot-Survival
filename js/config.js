// Configuration globale du jeu
const CONFIG = {
    // Dimensions du monde
    WORLD: {
        WIDTH: 2400,
        HEIGHT: 1800
    },
    
    // Dimensions du canvas
    CANVAS: {
        WIDTH: 800,
        HEIGHT: 600
    },
    
    // Configuration du joueur
    PLAYER: {
        RADIUS: 12,
        SPEED: 4,
        COLOR: '#0ff',
        FIRE_RATE: 18,
        BULLET_SPEED: 7,
        BULLET_SIZE: 3,
        BULLET_LENGTH: 10,
        RANGE: 280,
        MAGNET_RANGE: 60
    },
    
    // Configuration de la caméra
    CAMERA: {
        FOLLOW_SPEED: 0.1
    },
    
    // Configuration des ennemis
    ENEMIES: {
        SPAWN_DISTANCE: 400,
        MAX_COUNT: 35,
        TYPES: {
            basic: { 
                radius: 6, 
                speedBase: 1.5,
                speedVariation: 1.5,
                color: '#f0f', 
                health: 1, 
                points: 100, 
                shape: 'triangle' 
            },
            fast: { 
                radius: 4, 
                speedBase: 3.5,
                speedVariation: 1.5, 
                color: '#f44', 
                health: 1, 
                points: 150, 
                shape: 'diamond' 
            },
            tank: { 
                radius: 11, 
                speedBase: 1,
                speedVariation: 0.8,
                color: '#84f', 
                health: 4, 
                points: 400, 
                shape: 'hexagon' 
            },
            splitter: { 
                radius: 8, 
                speedBase: 1.5,
                speedVariation: 1, 
                color: '#f80', 
                health: 3, 
                points: 350, 
                shape: 'star' 
            }
        }
    },
    
    // Configuration des particules
    PARTICLES: {
        LIFE: 30,
        COUNT: 8
    },
    
    // Configuration des gemmes
    CURRENCY: {
        HIGH_VALUE_CHANCE: 0.2,
        HIGH_VALUE: 3,
        LOW_VALUE: 1,
        MAGNET_SPEED: 6
    },
    
    // Configuration des orbes
    ORBS: {
        RADIUS: 5,
        DISTANCE: 40,
        COLOR: '#ff8800',
        DAMAGE: 40
    },
    
    // Configuration des améliorations
    UPGRADES: {
        BASE_COST: 75,
        COST_MULTIPLIER: 1.5
    },
    
    // Limites du jeu
    LIMITS: {
        MAX_RESURRECTIONS: 3,
        MAX_LIVES: 10
    }
};