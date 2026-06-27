/* ==========================================================================
   GAME ENGINE - MAIN COLLABORATOR WITH SAVE SYSTEM
   ========================================================================== */

// Initialisation des variables globales attachées à la fenêtre (window) pour casser l'isolement des modules
window.gameState = {
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
    window.gameState.currentDay++;
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
    // Protection si les variables ne sont pas encore chargées depuis Firebase
    if (!window.player || !window.gameState) return;

    document.getElementById('calendar').innerText = `Jour ${window.gameState.currentDay}`;
    if (typeof updatePlayerUI === "function") updatePlayerUI();
    if (typeof updateMarketUI === "function") updateMarketUI();
    if (typeof updateGarageUI === "function") updateGarageUI();
    
    document.getElementById('stat-total-sold').innerText = window.gameState.stats.totalSold;
    document.getElementById('stat-total-profit').innerText = `${window.gameState.stats.totalProfit.toLocaleString()} €`;
}

// Rend la fonction accessible aux autres scripts
window.updateGlobalUI = updateGlobalUI;

window.onload = initGame;
