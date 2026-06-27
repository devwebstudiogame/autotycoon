/* ==========================================================================
   GAME DATA - CATALOGUE DES VÉHICULES
   ========================================================================== */

const VEHICLE_CATALOG = [
    // 🏍️ CATÉGORIE : MOTOS (Accessibles dès le Niveau 1)
    {
        type: 'moto',
        brand: 'Yamaha',
        model: 'MT-07',
        basePrice: 6500,
        minLevel: 1,
        xpReward: 150
    },
    {
        type: 'moto',
        brand: 'Honda',
        model: 'CB500F',
        basePrice: 5500,
        minLevel: 1,
        xpReward: 120
    },
    {
        type: 'moto',
        brand: 'BMW',
        model: 'R 1250 GS',
        basePrice: 19000,
        minLevel: 2, // Demande un peu plus de réputation
        xpReward: 350
    },

    // 🚗 CATÉGORIE : VOITURES CITADINES / POPULAIRES (Niveau 1)
    {
        type: 'voiture',
        brand: 'Renault',
        model: 'Clio 5',
        basePrice: 14000,
        minLevel: 1,
        xpReward: 200
    },
    {
        type: 'voiture',
        brand: 'Peugeot',
        model: '208',
        basePrice: 15500,
        minLevel: 1,
        xpReward: 220
    },
    {
        type: 'voiture',
        brand: 'Dacia',
        model: 'Sandero',
        basePrice: 9500,
        minLevel: 1,
        xpReward: 150
    },

    // 🏎️ CATÉGORIE : BERLINES & SPORTIVES (Déblocage Niveau 2)
    {
        type: 'voiture',
        brand: 'Volkswagen',
        model: 'Golf 8 GTI',
        basePrice: 38000,
        minLevel: 2,
        xpReward: 500
    },
    {
        type: 'voiture',
        brand: 'BMW',
        model: 'Série 3',
        basePrice: 45000,
        minLevel: 2,
        xpReward: 600
    },
    {
        type: 'voiture',
        brand: 'Tesla',
        model: 'Model 3',
        basePrice: 42000,
        minLevel: 2,
        xpReward: 550
    },

    // 🚛 CATÉGORIE : CAMIONS / UTILITAIRES (Déblocage Niveau 3)
    {
        type: 'camion',
        brand: 'Iveco',
        model: 'Daily',
        basePrice: 32000,
        minLevel: 3,
        xpReward: 700
    },
    {
        type: 'camion',
        brand: 'Mercedes-Benz',
        model: 'Sprinter',
        basePrice: 48000,
        minLevel: 3,
        xpReward: 900
    },
    {
        type: 'camion',
        brand: 'Renault Trucks',
        model: 'Master',
        basePrice: 35000,
        minLevel: 3,
        xpReward: 750
    }
];

/**
 * Configuration globale de l'équilibrage économique de la V0.1
 */
const GAME_BALANCING = {
    startingCash: 20000,          // Capital de départ (20k € pour pouvoir acheter une Clio ou 3 motos)
    baseGarageSlots: 3,           // Emplacements initiaux
    upgradeSlotsCost: 5000,       // Coût de l'extension de garage
    upgradeSlotsAmount: 2,        // Combien d'emplacements achetés à la fois
    repairCostPerPercent: 25,     // Prix pour réparer 1% d'état (25€)
    marketSize: 4,                // Nombre de véhicules visibles sur le marché simultanément
    
    // Niveaux d'expérience requis (Index 0 = Niveau 1, Index 1 = Niveau 2...)
    xpThresholds: [500, 1500, 4000, 99999] 
};