/* ==========================================================================
   MODULE : MARKET LOGIC & NEGOTIATION (CLOUD COMPATIBLE)
   ========================================================================== */

/**
 * Génère un nouvel arrivage de véhicules sur le marché global window
 */
function refreshMarket() {
    window.marketVehicles = [];
    
    if (!window.player) return;
    const availableModels = VEHICLE_CATALOG.filter(v => v.minLevel <= window.player.level);
    
    if (availableModels.length === 0) return;

    for (let i = 0; i < GAME_BALANCING.marketSize; i++) {
        const randomModel = availableModels[Math.floor(Math.random() * availableModels.length)];
        const condition = Math.floor(Math.random() * 55) + 35;
        const conditionDiscount = (100 - condition) * 0.006;
        const baseProposedPrice = Math.floor(randomModel.basePrice * (1 - conditionDiscount));
        const estimatedValue = Math.floor(randomModel.basePrice * 1.15);

        window.marketVehicles.push({
            id: Date.now() + i + Math.floor(Math.random() * 1000),
            type: randomModel.type,
            brand: randomModel.brand,
            model: randomModel.model,
            condition: condition,
            purchasePrice: baseProposedPrice,
            estimatedValue: estimatedValue,
            xpReward: randomModel.xpReward,
            hasNegotiated: false
        });
    }
}

/**
 * Tente de négocier le prix d'achat d'un véhicule
 */
function negotiateVehiclePrice(vehicleId) {
    const vehicle = window.marketVehicles.find(v => v.id === vehicleId);
    if (!vehicle || vehicle.hasNegotiated) return;

    vehicle.hasNegotiated = true;
    const isSuccess = Math.random() < 0.60;

    if (isSuccess) {
        const priceDropPercent = Math.floor(Math.random() * 12) + 7;
        const discount = Math.floor(vehicle.purchasePrice * (priceDropPercent / 100));
        vehicle.purchasePrice -= discount;
        alert(`🤝 Succès ! Le vendeur accepte de baisser son prix de ${priceDropPercent}% (-${discount} €) !`);
    } else {
        alert("😤 Le vendeur a pris la mouche face à votre offre et s'en va avec son véhicule !");
        window.marketVehicles = window.marketVehicles.filter(v => v.id !== vehicleId);
    }

    if (typeof window.saveDataToFirebase === "function") window.saveDataToFirebase();
    if (typeof window.updateGlobalUI === "function") window.updateGlobalUI();
}

/**
 * Achète un véhicule sur le marché
 */
function buyVehicleFromMarket(vehicleId) {
    const index = window.marketVehicles.findIndex(v => v.id === vehicleId);
    if (index === -1) return;
    
    const vehicle = window.marketVehicles[index];

    if (window.player.garage.length >= window.player.garageSlots) {
        alert("Votre garage est plein ! Vendez un véhicule ou achetez une extension au Bureau.");
        return;
    }

    if (window.player.cash < vehicle.purchasePrice) {
        alert("Fonds insuffisants pour acquérir ce véhicule !");
        return;
    }

    window.player.cash -= vehicle.purchasePrice;
    window.player.garage.push(vehicle);
    window.marketVehicles.splice(index, 1);

    if (typeof window.saveDataToFirebase === "function") window.saveDataToFirebase();
    if (typeof window.updateGlobalUI === "function") window.updateGlobalUI();
}

/* ==========================================================================
   FONCTIONS DE RENDU GRAPHIQUE (UI)
   ========================================================================== */

function updateMarketUI() {
    const container = document.getElementById('market-container');
    if (!container || !window.marketVehicles || !window.player) return;

    container.innerHTML = '';

    if (window.marketVehicles.length === 0) {
        container.innerHTML = '<div class="empty-message">Plus d\'offres aujourd\'hui. Passez à la journée suivante !</div>';
        return;
    }

    window.marketVehicles.forEach(vehicle => {
        const canBuy = (window.player.cash >= vehicle.purchasePrice) && (window.player.garage.length < window.player.garageSlots);
        
        const card = document.createElement('div');
        card.className = 'vehicle-card';
        card.innerHTML = `
            <div class="vehicle-info">
                <h3><span class="badge badge-${vehicle.type}">${vehicle.type}</span> ${vehicle.brand} ${vehicle.model}</h3>
                <div class="vehicle-details">
                    <p>État du véhicule : <strong style="color: var(--warning);">${vehicle.condition}%</strong></p>
                    <p>Prix demandé : <strong style="color: #ffffff;">${vehicle.purchasePrice.toLocaleString()} €</strong></p>
                    <p>Revente estimée (à 100%) : <span style="color: var(--text-muted);">${vehicle.estimatedValue.toLocaleString()} €</span></p>
                </div>
            </div>
            <div class="card-actions">
                <button class="btn-repair" onclick="negotiateVehiclePrice(${vehicle.id})" ${vehicle.hasNegotiated ? 'disabled' : ''}>
                    ${vehicle.hasNegotiated ? 'Négocié' : '🤝 Négocier'}
                </button>
                <button class="btn-buy" onclick="buyVehicleFromMarket(${vehicle.id})" ${!canBuy ? 'disabled' : ''}>
                    Acheter
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

// Globalisation des fonctions du marché
window.refreshMarket = refreshMarket;
window.updateMarketUI = updateMarketUI;
