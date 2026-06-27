/* ==========================================================================
   MODULE : PLAYER & GARAGE LOGIC
   ========================================================================== */

// Déclaration de l'objet joueur
let player = {
    cash: 0,
    level: 1,
    xp: 0,
    garageSlots: 0,
    garage: [] // Contient les véhicules achetés
};

/**
 * Initialise les données du joueur à partir du fichier équilibrage (data.js)
 */
function initPlayer() {
    player.cash = GAME_BALANCING.startingCash;
    player.garageSlots = GAME_BALANCING.baseGarageSlots;
    player.level = 1;
    player.xp = 0;
    player.garage = [];
}

/**
 * Ajoute de l'expérience au joueur et gère le passage de niveau
 */
function addXp(amount) {
    player.xp += amount;
    
    // Vérification du passage de niveau (basé sur les paliers de data.js)
    let currentThreshold = GAME_BALANCING.xpThresholds[player.level - 1];
    
    if (player.xp >= currentThreshold) {
        player.level++;
        alert(`🎉 Félicitations ! Vous passez Niveau ${player.level} ! De nouveaux véhicules sont disponibles sur le marché.`);
    }
}

/**
 * Achète une extension pour obtenir plus de places dans le garage
 */
function upgradeGarageSpace() {
    const cost = GAME_BALANCING.upgradeSlotsCost;
    
    if (player.cash >= cost) {
        player.cash -= cost;
        player.garageSlots += GAME_BALANCING.upgradeSlotsAmount;
        
        // Notification et mise à jour de l'écran
        if (typeof updateGlobalUI === "function") updateGlobalUI();
    } else {
        alert("Fonds insuffisants pour agrandir le garage !");
    }
}

/**
 * Répare un véhicule du garage à 100% et ajoute le coût au prix d'achat
 */
function repairVehicleInGarage(vehicleId) {
    const vehicle = player.garage.find(v => v.id === vehicleId);
    if (!vehicle || vehicle.condition >= 100) return;

    const missingCondition = 100 - vehicle.condition;
    const cost = missingCondition * GAME_BALANCING.repairCostPerPercent;

    if (player.cash >= cost) {
        player.cash -= cost;
        
        // AJOUT : Le coût de la réparation s'ajoute au prix d'achat initial (coût de revient)
        vehicle.purchasePrice += cost;
        
        vehicle.condition = 100; // Remis à neuf !
        
        if (typeof updateGlobalUI === "function") updateGlobalUI();
    } else {
        alert("Vous n'avez pas assez d'argent pour payer les réparations !");
    }
}

/**
 * Vend un véhicule présent dans le garage
 */
function sellVehicleFromGarage(vehicleId) {
    const index = player.garage.findIndex(v => v.id === vehicleId);
    if (index === -1) return;
    
    const vehicle = player.garage[index];

    // Calcul du prix de vente final basé sur l'état actuel
    const finalPrice = Math.floor(vehicle.estimatedValue * (vehicle.condition / 100));
    
    // Le profit prend maintenant en compte le prix d'achat + les réparations (grâce à la modification ci-dessus)
    const profit = finalPrice - vehicle.purchasePrice;

    // Mise à jour du portefeuille du joueur
    player.cash += finalPrice;
    
    // Mise à jour des statistiques globales du Bureau (main.js)
    gameState.stats.totalSold++;
    gameState.stats.totalProfit += profit;

    // Octroi de l'XP
    addXp(vehicle.xpReward);

    // Retrait du véhicule du garage
    player.garage.splice(index, 1);

    // Rafraîchissement de l'affichage
    if (typeof updateGlobalUI === "function") updateGlobalUI();
}

/* ==========================================================================
   FONCTIONS DE RENDU GRAPHIQUE (UI)
   ========================================================================== */

function updatePlayerUI() {
    // Éléments du Header
    document.getElementById('player-cash').innerText = `${player.cash.toLocaleString()} €`;
    document.getElementById('player-level').innerText = player.level;
    document.getElementById('player-xp').innerText = player.xp;
    document.getElementById('garage-slots').innerText = `${player.garage.length} / ${player.garageSlots}`;

    // Bouton de mise à niveau du Bureau
    const btnUpgrade = document.getElementById('btn-upgrade-garage');
    if (btnUpgrade) {
        btnUpgrade.innerText = `Agrandir (+${GAME_BALANCING.upgradeSlotsAmount} places) - ${GAME_BALANCING.upgradeSlotsCost.toLocaleString()} €`;
        btnUpgrade.disabled = (player.cash < GAME_BALANCING.upgradeSlotsCost);
    }
}

function updateGarageUI() {
    const container = document.getElementById('garage-container');
    if (!container) return;

    container.innerHTML = '';

    if (player.garage.length === 0) {
        container.innerHTML = '<div class="empty-message">Votre garage est vide. Achetez un véhicule au marché.</div>';
        return;
    }

    player.garage.forEach(vehicle => {
        const missingCondition = 100 - vehicle.condition;
        const repairCost = missingCondition * GAME_BALANCING.repairCostPerPercent;
        const currentResaleValue = Math.floor(vehicle.estimatedValue * (vehicle.condition / 100));

        // Création de la carte HTML
        const card = document.createElement('div');
        card.className = 'vehicle-card';
        card.innerHTML = `
            <div class="vehicle-info">
                <h3><span class="badge badge-${vehicle.type}">${vehicle.type}</span> ${vehicle.brand} ${vehicle.model}</h3>
                <div class="vehicle-details">
                    <p>État actuel : <strong style="color: var(--warning);">${vehicle.condition}%</strong></p>
                    <p>Coût total (Achat + Rép.) : <strong style="color: #ffffff;">${vehicle.purchasePrice.toLocaleString()} €</strong></p>
                    <p>Prix de revente : <strong style="color: var(--primary);">${currentResaleValue.toLocaleString()} €</strong></p>
                </div>
            </div>
            <div class="card-actions">
                ${vehicle.condition < 100 
                    ? `<button class="btn-repair" onclick="repairVehicleInGarage(${vehicle.id})">Réparer (+${missingCondition}% pour ${repairCost}€)</button>`
                    : `<button class="btn-repair" disabled>État Parfait</button>`
                }
                <button class="btn-sell" onclick="sellVehicleFromGarage(${vehicle.id})">Vendre</button>
            </div>
        `;
        container.appendChild(card);
    });
}