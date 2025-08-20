// Module LootBox - Gestion centralisée des loot boxes
// Note: L'implémentation principale est dans currency.js pour la compatibilité

const LootBox = {
    // Types de loot boxes disponibles
    TYPES: {
        TREASURE: 'TREASURE',
        WEAPON: 'WEAPON', 
        NUKE: 'NUKE',
        MAGNET: 'MAGNET'
    },
    
    // Méthode utilitaire pour créer une loot box via Currency
    create(x, y, type = 'TREASURE') {
        if (Currency && Currency.createLootBox) {
            Currency.createLootBox(x, y, type);
        } else {
            console.warn('Currency module not available for LootBox creation');
        }
    },
    
    // Méthode utilitaire pour obtenir un type aléatoire
    getRandomType() {
        const types = Object.values(this.TYPES);
        return types[Math.floor(Math.random() * types.length)];
    },
    
    // Méthode pour obtenir la configuration d'un type
    getConfig(type) {
        if (Currency && Currency.getLootBoxConfig) {
            return Currency.getLootBoxConfig(type);
        }
        
        // Fallback si Currency n'est pas disponible
        const configs = {
            'TREASURE': { color: '#FFD700', probability: 0.4 },
            'WEAPON': { color: '#FF4444', probability: 0.25 },
            'NUKE': { color: '#FF8800', probability: 0.2 },
            'MAGNET': { color: '#4488FF', probability: 0.15 }
        };
        return configs[type] || configs['TREASURE'];
    }
};

// Exporter pour utilisation éventuelle
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LootBox;
}