// Configuration globale du jeu
export const CONFIG = {
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
        FIRE_RATE: 30,
        MIN_FIRE_RATE: 12, // cadence minimale (frames entre tirs) pour l'équilibrage
        BULLET_SPEED: 7,
        BULLET_SIZE: 3,
        BULLET_LENGTH: 10,
        RANGE: 260,
        MAGNET_RANGE: 60
    },
    
    // Configuration de la caméra
    CAMERA: {
        FOLLOW_SPEED: 0.08, // Légèrement plus rapide pour réduire la latence
        ZOOM: 1.25 // Zoom > 1 rapproche la caméra (tout apparaît plus gros)
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
                // Augmenté de 6 à 8 pour une meilleure lisibilité
                radius: 8, 
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
                // Augmenté de 4 à 6 (était trop petit)
                radius: 6, 
                speedBase: 2.8, // Réduit de 3.5 à 2.8 pour moins de vitesse initiale
                speedVariation: 1.0, // Réduit de 1.5 à 1.0 pour moins de variation
                color: '#f44', 
                health: 1, 
                points: 150, 
                shape: 'interceptor',
                name: 'Interceptor',
                description: 'High-speed assault drone'
            },
            tank: { 
                // Légèrement plus gros : 11 -> 13
                radius: 13, 
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
                // Augmenté de 8 à 11
                radius: 11, 
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
        COUNT: 8,
        MAX_ACTIVE: 1200, // Limite dure pour freiner la surcharge
        SOFT_CAP: 800,    // Au-dessus on réduit le spawn
        REDUCTION_FACTOR: 0.5 // Création divisée par 2 au-dessus du SOFT_CAP
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
    
    // Configuration des loot boxes
    LOOT_BOXES: {
        DROP_CHANCE: 0.08,  // Réduit de 15% à 8% pour être moins fréquent
        ELITE_DROP_CHANCE: 0.15, // Réduit de 25% à 15% pour les élites
        TYPES: {
            TREASURE: {
                COLOR: '#FFD700',
                GLOW_COLOR: '#FFFF88',
                VALUE: {min: 15, max: 35}, // Grosse somme d'argent
                PROBABILITY: 0.4
            },
            WEAPON: {
                COLOR: '#FF4444',
                GLOW_COLOR: '#FF8888',
                PROBABILITY: 0.25
            },
            NUKE: {
                COLOR: '#FF8800',
                GLOW_COLOR: '#FFAA44',
                PROBABILITY: 0.2
            },
            MAGNET: {
                COLOR: '#4488FF',
                GLOW_COLOR: '#88BBFF',
                PROBABILITY: 0.15
            }
        },
        ANIMATION: {
            PULSE_SPEED: 0.05,
            FLOAT_SPEED: 0.03,
            FLOAT_AMPLITUDE: 8,
            SPARKLE_RATE: 0.3
        }
    },
    
    // Configuration des orbes
    ORBS: {
        RADIUS: 5,
        DISTANCE: 40,        // Distance de la première orbite
        DISTANCE_INCREMENT: 25, // Distance supplémentaire pour chaque orbite
        COLOR: '#ff8800',
        DAMAGE: 40,
        MAX_PER_ORBIT: 3,    // === RÉDUIT DE 6 à 3 ORBES PAR ORBITE ===
        MAX_TOTAL: 9,        // === AJUSTÉ : 3 orbites à 3 orbes = 9 orbes max ===
        BASE_SPEED: 0.06,    // === RÉDUIT DE MOITIÉ : était 0.12, maintenant 0.06 ===
        SPEED_INCREMENT: 0.015, // === RÉDUIT DE MOITIÉ : était 0.03, maintenant 0.015 ===
        SPEED_MULTIPLIER: 1.0, // Multiplicateur de vitesse global pour upgrade
        MAX_SPEED: 1.0,      // === RÉDUIT : vitesse maximale de 1.5x à 1.0x ===
        SHOOTING_ENABLED: false, // Les orbes peuvent-elles tirer ?
        SHOOTING_RATE: 120,  // === DOUBLÉ : était 60, maintenant 120 (tire 2x moins vite) ===
        BULLET_SPEED: 5,     // Vitesse des projectiles d'orbes
        BULLET_DAMAGE: 25    // Dégâts des projectiles d'orbes
    },
    
    // Configuration des armements avancés
    WEAPONS: {
        TRIPLE_SHOT: {
            ENABLED: false,
            SPREAD_ANGLE: 0.3,  // Angle d'écartement en radians
            SPEED_MULTIPLIER: 0.9 // Légèrement plus lent
        },
        HOMING_MISSILE: {
            ENABLED: false,
            SPEED: 3,
            TURN_RATE: 0.08,    // Vitesse de rotation vers la cible
            LOCK_RANGE: 200,    // Distance de verrouillage
            DAMAGE: 60,         // Plus de dégâts que les balles normales
            COOLDOWN: 90        // Cooldown plus long
        },
        EXPLOSIVE_CANNON: {
            ENABLED: false,
            SPEED: 4,
            BLAST_RADIUS: 50,   // Rayon d'explosion
            DAMAGE: 80,         // Gros dégâts
            COOLDOWN: 120       // Cooldown très long
        },
        LASER_BEAM: {
            ENABLED: false,
            WIDTH: 3,
            LENGTH: 300,
            DAMAGE: 15,         // Dégâts continus
            ENERGY_COST: 2     // Coût en énergie par frame
        },
        SHOTGUN_BLAST: {
            ENABLED: false,
            PELLETS: 8,         // Nombre de projectiles
            SPREAD: 0.5,        // Angle de dispersion
            DAMAGE_PER_PELLET: 20,
            RANGE_MULTIPLIER: 0.6
        }
    },
    
    // Configuration des améliorations
    UPGRADES: {
        BASE_COST: 50, // Réduit de 75 à 50 car les gems ont plus de valeur maintenant
        COST_MULTIPLIER: 1.4 // Réduit de 1.5 à 1.4 pour une progression plus douce
    },
    
    // Limites du jeu
    LIMITS: {
        MAX_RESURRECTIONS: 1, // Autoriser au moins une résurrection maintenant
        MAX_LIVES: 3
    },

    // Système de combo / score
    COMBO: {
        WINDOW_FRAMES: 90,    // Temps max entre deux kills pour garder le combo (~1.5s)
        MULTIPLIER_STEP: 0.25, // Incrément par palier de kills
        KILLS_PER_STEP: 3,     // Tous les 3 kills le multiplicateur monte
        MAX_MULTIPLIER: 5      // Limite de sécurité
    }
};