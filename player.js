/* ==========================================================================
   MODULE : PLAYER & GARAGE LOGIC (CLOUD COMPATIBLE)
   ========================================================================== */

/**
 * Initialise les données du joueur sur l'objet global window
 */
function initPlayer() {
    window.player = {
        cash: GAME_BALANCING.startingCash,
        level: 1,
        xp: 0,
        garageSlots: GAME_BALANCING.baseGarageSlots,
        garage: []
    };
    console.log("Capital initialisé : " + window.player.cash + " €");
}

/**
 * Ajoute de l'expérience au joueur et gère le passage de niveau
 */
function addXp(amount) {
    window.player.xp += amount;
    
    let currentThreshold = GAME_BALANCING.xpThresholds[window.player.level - 1];
    
    if (window.player.xp >= currentThreshold) {
        window.player.level++;
        alert(`🎉 Félicitations ! Vous passez Niveau ${window.player.level} ! De nouveaux véhicules sont disponibles sur le marché.`);
    }
}

/**
 * Achète une extension pour obtenir plus de places dans le garage
 */
function upgradeGarageSpace() {
    const cost = GAME_BALANCING.upgradeSlotsCost;
    
    if (window.player.cash >= cost) {
        window.player.cash -= cost;
        window.player.garageSlots += GAME_BALANCING.upgradeSlotsAmount;
        
        if (typeof window.saveDataToFirebase === "function") window.saveDataToFirebase();
        if (typeof window.updateGlobalUI === "function") window.updateGlobalUI();
    } else {
        alert("Fonds insuffisants pour agrandir le garage !");
    }
}

/**
 * Répare un véhicule du garage à 100% et ajoute le coût au prix d'achat
 */
function repairVehicleInGarage(vehicleId) {
    const vehicle = window.player.garage.find(v => v.id === vehicleId);
    if (!vehicle || vehicle.condition >= 100) return;

    const missingCondition = 100 - vehicle.condition;
    const cost = missingCondition * GAME_BALANCING.repairCostPerPercent;

    if (window.player.cash >= cost) {
        window.player.cash -= cost;
        vehicle.purchasePrice += cost;
        vehicle.condition = 100;
        
        if (typeof window.saveDataToFirebase === "function") window.saveDataToFirebase();
        if (typeof window.updateGlobalUI === "function") window.updateGlobalUI();
    } else {
        alert("Vous n'avez pas assez d'argent pour payer les réparations !");
    }
}

/**
 * Vend un véhicule présent dans le garage
 */
function sellVehicleFromGarage(vehicleId) {
    const index = window.player.garage.findIndex(v => v.id === vehicleId);
    if (index === -1) return;
    
    const vehicle = window.player.garage[index];
    const finalPrice = Math.floor(vehicle.estimatedValue * (vehicle.condition / 100));
    const profit = finalPrice - vehicle.purchasePrice;

    window.player.cash += finalPrice;
    
    window.gameState.stats.totalSold++;
    window.gameState.stats.totalProfit += profit;

    addXp(vehicle.xpReward);
    window.player.garage.splice(index, 1);

    if (typeof window.saveDataToFirebase === "function") window.saveDataToFirebase();
    if (typeof window.updateGlobalUI === "function") window.updateGlobalUI();
}

/* ==========================================================================
   FONCTIONS DE RENDU GRAPHIQUE (UI)
   ========================================================================== */

function updatePlayerUI() {
    if (!window.player) return;

    document.getElementById('player-cash').innerText = `${window.player.cash.toLocaleString()} €`;
    document.getElementById('player-level').innerText = window.player.level;
    document.getElementById('player-xp').innerText = window.player.xp;
    document.getElementById('garage-slots').innerText = `${window.player.garage.length} / ${window.player.garageSlots}`;

    const btnUpgrade = document.getElementById('btn-upgrade-garage');
    if (btnUpgrade) {
        btnUpgrade.innerText = `Agrandir (+${GAME_BALANCING.upgradeSlotsAmount} places) - ${GAME_BALANCING.upgradeSlotsCost.toLocaleString()} €`;
        btnUpgrade.disabled = (window.player.cash < GAME_BALANCING.upgradeSlotsCost);
    }
}

function updateGarageUI() {
    const container = document.getElementById('garage-container');
    if (!container || !window.player) return;

    container.innerHTML = '';

    if (window.player.garage.length === 0) {
        container.innerHTML = '<div class="empty-message">Votre garage est vide. Achetez un véhicule au marché.</div>';
        return;
    }

    window.player.garage.forEach(vehicle => {
        const missingCondition = 100 - vehicle.condition;
        const repairCost = missingCondition * GAME_BALANCING.repairCostPerPercent;
        const currentResaleValue = Math.floor(vehicle.estimatedValue * (vehicle.condition / 100));

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

// Globalisation des fonctions de rendu
window.initPlayer = initPlayer;
window.updatePlayerUI = updatePlayerUI;
window.updateGarageUI = updateGarageUI;
