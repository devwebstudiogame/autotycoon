/* ==========================================================================
   MODULE : MARKET LOGIC & NEGOTIATION
   ========================================================================== */

let marketVehicles = [];

/**
 * Génère un nouvel arrivage de véhicules sur le marché
 */
function refreshMarket() {
    marketVehicles = [];
    
    // Filtrer le catalogue global (data.js) pour ne garder que les véhicules accessibles au niveau du joueur
    const availableModels = VEHICLE_CATALOG.filter(v => v.minLevel <= player.level);
    
    if (availableModels.length === 0) return;

    // Générer le nombre de véhicules défini dans GAME_BALANCING
    for (let i = 0; i < GAME_BALANCING.marketSize; i++) {
        const randomModel = availableModels[Math.floor(Math.random() * availableModels.length)];
        
        // Génération d'un état aléatoire (entre 35% et 90%)
        const condition = Math.floor(Math.random() * 55) + 35;
        
        // Calcul du prix initial basé sur l'état (décote proportionnelle à l'usure)
        const conditionDiscount = (100 - condition) * 0.006; // Moins l'état est bon, moins c'est cher
        const baseProposedPrice = Math.floor(randomModel.basePrice * (1 - conditionDiscount));
        
        // Valeur de revente maximale théorique si remis à 100% d'état (+15% de marge brute)
        const estimatedValue = Math.floor(randomModel.basePrice * 1.15);

        marketVehicles.push({
            id: Date.now() + i + Math.floor(Math.random() * 1000),
            type: randomModel.type,
            brand: randomModel.brand,
            model: randomModel.model,
            condition: condition,
            purchasePrice: baseProposedPrice,
            estimatedValue: estimatedValue,
            xpReward: randomModel.xpReward,
            hasNegotiated: false // Empêche de négocier plusieurs fois le même véhicule
        });
    }
}

/**
 * Tente de négocier le prix d'achat d'un véhicule (Mécanique Gameplay V0.1)
 */
function negotiateVehiclePrice(vehicleId) {
    const vehicle = marketVehicles.find(v => v.id === vehicleId);
    if (!vehicle || vehicle.hasNegotiated) return;

    vehicle.hasNegotiated = true; // Verrouille la négociation pour ce véhicule

    // 60% de chances de réussite, 40% de chances d'échec
    const isSuccess = Math.random() < 0.60;

    if (isSuccess) {
        // Baisse le prix aléatoirement entre 7% et 18%
        const priceDropPercent = Math.floor(Math.random() * 12) + 7;
        const discount = Math.floor(vehicle.purchasePrice * (priceDropPercent / 100));
        vehicle.purchasePrice -= discount;
        
        alert(`🤝 Succès ! Le vendeur accepte de baisser son prix de ${priceDropPercent}% (-${discount} €) !`);
    } else {
        // Échec de la négociation : le vendeur retire son véhicule du marché
        alert("😤 Le vendeur a pris la mouche face à votre offre et s'en va avec son véhicule !");
        marketVehicles = marketVehicles.filter(v => v.id !== vehicleId);
    }

    if (typeof updateGlobalUI === "function") updateGlobalUI();
}

/**
 * Achète un véhicule sur le marché pour le mettre dans le garage du joueur
 */
function buyVehicleFromMarket(vehicleId) {
    const index = marketVehicles.findIndex(v => v.id === vehicleId);
    if (index === -1) return;
    
    const vehicle = marketVehicles[index];

    // Vérification des règles de gestion (Garage plein ou manque de fonds)
    if (player.garage.length >= player.garageSlots) {
        alert("Votre garage est plein ! Vendez un véhicule ou achetez une extension au Bureau.");
        return;
    }

    if (player.cash < vehicle.purchasePrice) {
        alert("Fonds insuffisants pour acquérir ce véhicule !");
        return;
    }

    // Processus de transaction
    player.cash -= vehicle.purchasePrice;
    player.garage.push(vehicle); // Ajout au garage
    marketVehicles.splice(index, 1); // Retrait du marché

    if (typeof updateGlobalUI === "function") updateGlobalUI();
}

/* ==========================================================================
   FONCTIONS DE RENDU GRAPHIQUE (UI)
   ========================================================================== */

function updateMarketUI() {
    const container = document.getElementById('market-container');
    if (!container) return;

    container.innerHTML = '';

    if (marketVehicles.length === 0) {
        container.innerHTML = '<div class="empty-message">Plus d\'offres aujourd\'hui. Passez à la journée suivante !</div>';
        return;
    }

    marketVehicles.forEach(vehicle => {
        // Bouton acheter désactivé si le joueur n'a pas les moyens ou si le garage est plein
        const canBuy = (player.cash >= vehicle.purchasePrice) && (player.garage.length < player.garageSlots);
        
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