/* ==========================================================================
   GAME ENGINE - MAIN COLLABORATOR WITH SAVE SYSTEM
   ========================================================================== */

let gameState = {
    currentDay: 1,
    stats: {
        totalSold: 0,
        totalProfit: 0
    }
};

/**
 * Initialisation au chargement de la page
 */
function initGame() {
    console.log("Initialisation de Garage Tycoon V0.2...");
    setupEventListeners();
}

/**
 * Branchement des écouteurs de clics statiques
 */
function setupEventListeners() {
    // Fin de journée
    document.getElementById('btn-next-day').addEventListener('click', nextDay);
    
    // Agrandir le garage
    document.getElementById('btn-upgrade-garage').addEventListener('click', () => {
        if (typeof upgradeGarageSpace === "function") upgradeGarageSpace();
    });

    // Événements d'ouverture/fermeture du menu principal
    const modal = document.getElementById('game-modal');
    document.getElementById('btn-menu-open').addEventListener('click', () => {
        modal.classList.remove('hidden');
    });
    document.getElementById('btn-menu-close').addEventListener('click', () => {
        modal.classList.add('hidden');
    });
}

/**
 * Cycle temporel du jeu avec auto-save cloud
 */
function nextDay() {
    gameState.currentDay++;
    if (typeof refreshMarket === "function") refreshMarket();
    updateGlobalUI();
    
    // Sauvegarde automatique cloud à chaque fin de journée
    if (typeof saveDataToFirebase === "function") {
        saveDataToFirebase();
    }
}

/**
 * Mise à jour globale de l'interface
 */
function updateGlobalUI() {
    document.getElementById('calendar').innerText = `Jour ${gameState.currentDay}`;
    if (typeof updatePlayerUI === "function") updatePlayerUI();
    if (typeof updateMarketUI === "function") updateMarketUI();
    if (typeof updateGarageUI === "function") updateGarageUI();
    
    document.getElementById('stat-total-sold').innerText = gameState.stats.totalSold;
    document.getElementById('stat-total-profit').innerText = `${gameState.stats.totalProfit.toLocaleString()} €`;
}

window.onload = initGame;