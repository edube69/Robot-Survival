// Configuration globale du jeu
const CONFIG = {
    // Dimensions du monde
    WORLD: {
        WIDTH: 2400,
        HEIGHT: 1800
    },
    
    // Dimensions du canvas (ratio de référence)
    CANVAS: {
        WIDTH: 1000,
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
        FOLLOW_SPEED: 0.1,
        ZOOM: 1.8 // Zoom > 1 rapproche la caméra (tout apparaît plus gros)
    },
    
    // Sol / motif du fond
    FLOOR: {
        TILE: 64, // taille de la tuile en pixels (unités monde)
        LINE_COLOR: 'rgba(0,255,255,0.07)',
        MAJOR_LINE_COLOR: 'rgba(0,255,255,0.12)',
        DOT_COLOR: 'rgba(0,255,255,0.10)',
        DOT_SIZE: 2,
        MAJOR_EVERY: 4 // une ligne renforcée toutes les N tuiles
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
                shape: 'scout',
                name: 'Scout',
                description: 'Fast and agile recon unit'
            },
            fast: { 
                radius: 4, 
                speedBase: 3.5,
                speedVariation: 1.5, 
                color: '#f44', 
                health: 1, 
                points: 150, 
                shape: 'interceptor',
                name: 'Interceptor',
                description: 'High-speed assault drone'
            },
            tank: { 
                radius: 11, 
                speedBase: 1,
                speedVariation: 0.8,
                color: '#84f', 
                health: 4, 
                points: 400, 
                shape: 'crusher',
                name: 'Crusher',
                description: 'Heavy armored destroyer'
            },
            splitter: { 
                radius: 8, 
                speedBase: 1.5,
                speedVariation: 1, 
                color: '#f80', 
                health: 3, 
                points: 350, 
                shape: 'shredder',
                name: 'Shredder',
                description: 'Multi-weapon platform'
            }
        }
    },
    
    // Configuration des particules
    PARTICLES: {
        LIFE: 30,
        COUNT: 8
    },
    
    // Configuration des gemmes/pièces d'or
    CURRENCY: {
        HIGH_VALUE_CHANCE: 0.2,
        HIGH_VALUE: 3,
        LOW_VALUE: 1,
        MAGNET_SPEED: 6,
        SPIN_SPEED: 0.08, // vitesse de rotation
        COLORS: {
            LOW: {
                BRIGHT: '#FFEF00',  // jaune plus vif
                MEDIUM: '#FFD700',  // or classique
                DARK: '#FFA500'     // or orange pour les reflets
            },
            HIGH: {
                BRIGHT: '#FFFF00',  // or brillant
                MEDIUM: '#FFD700',  // or classique
                DARK: '#FFA500'     // or moyen
            }
        }
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