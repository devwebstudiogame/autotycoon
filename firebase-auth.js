import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. CONFIGURATION CONFIG FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyCgWe1xwe-eZqw0jlza7RzMU_jTpN-kWZo",
  authDomain: "autotycoon-f6387.firebaseapp.com",
  projectId: "autotycoon-f6387",
  storageBucket: "autotycoon-f6387.firebasestorage.app",
  messagingSenderId: "410099236214",
  appId: "1:410099236214:web:92a3a482eccea2a0424e57"
};

// 2. CONFIGURATION EMAILJS
const EMAILJS_TEMPLATE_ID = "template_3i7lovf"; 
const EMAILJS_SERVICE_ID = "TON_SERVICE_ID";   // ⚠️ Ton Service ID EmailJS
const EMAILJS_PUBLIC_KEY = "TA_PUBLIC_KEY";     // ⚠️ Ta Public Key EmailJS

// Initialisations
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
emailjs.init(EMAILJS_PUBLIC_KEY);

let currentUser = null;

// --- ÉCOUTEURS D'ÉVÉNEMENTS AUTH ---
document.getElementById('btn-login').addEventListener('click', loginUser);
document.getElementById('btn-register').addEventListener('click', registerUser);
document.getElementById('btn-logout').addEventListener('click', logoutUser);

/**
 * Inscription d'un nouveau joueur (CORRIGÉE)
 */
function registerUser() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const errorEl = document.getElementById('auth-error');

    if(!email || !password) {
        errorEl.innerText = "Veuillez remplir tous les champs.";
        return;
    }

    errorEl.style.color = "var(--secondary)";
    errorEl.innerText = "Création de l'empire en cours...";

    createUserWithEmailAndPassword(auth, email, password)
        .then(async (userCredential) => {
            currentUser = userCredential.user;
            
            // CORRECTION BUG 1 : Initialiser le joueur ET générer directement le premier marché
            if (typeof initPlayer === "function") initPlayer(); 
            if (typeof refreshMarket === "function") refreshMarket(); // Génère les voitures J1 !

            // CORRECTION BUG 2 : On utilise 'await' pour s'assurer que le mail part ET que la BDD enregistre avant le reload
            try {
                errorEl.innerText = "Envoi du mail de bienvenue...";
                await sendWelcomeEmail(email);

                errorEl.innerText = "Génération du premier stock...";
                await saveDataToFirebase();
                
                errorEl.innerText = "Démarrage !";
                location.reload(); // Maintenant on peut recharger sans coupure !
            } catch (err) {
                console.error("Erreur durant la phase de création : ", err);
                location.reload();
            }
        })
        .catch((error) => {
            errorEl.style.color = "var(--danger)";
            errorEl.innerText = "Erreur inscription : " + error.message;
        });
}

/**
 * Connexion d'un joueur existant
 */
function loginUser() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const errorEl = document.getElementById('auth-error');

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            currentUser = userCredential.user;
        })
        .catch((error) => {
            errorEl.innerText = "Identifiants incorrects ou inexistants.";
        });
}

/**
 * Déconnexion
 */
function logoutUser() {
    signOut(auth).then(() => {
        location.reload();
    });
}

/**
 * Envoi du mail de bienvenue (EmailJS - Converti en Promise pour l'asynchrone)
 */
function sendWelcomeEmail(userEmail) {
    const templateParams = {
        user_email: userEmail,
        reply_to: "no-reply@garagetycoon.com"
    };

    // On retourne la promesse pour que le script attende la fin de l'envoi
    return emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
}

// --- LOGIQUE DE SAUVEGARDE FIRESTORE ---

/**
 * Pousse les données locales vers le cloud Firebase
 */
window.saveDataToFirebase = async function() {
    if (!currentUser) return;
    
    try {
        await setDoc(doc(db, "players", currentUser.uid), {
            gameState: gameState,
            player: player,
            marketVehicles: marketVehicles,
            lastSave: new Date()
        });
        console.log("Sauvegarde cloud synchronisée !");
    } catch (e) {
        console.error("Erreur lors de la sauvegarde cloud", e);
    }
}

/**
 * Observeur en temps réel de l'état de connexion du joueur
 */
onAuthStateChanged(auth, async (user) => {
    const authScreen = document.getElementById('auth-screen');
    const gameWrapper = document.getElementById('game-container-wrapper');

    if (user) {
        currentUser = user;
        authScreen.classList.add('hidden'); 
        gameWrapper.classList.remove('hidden'); 
        document.getElementById('user-display-email').innerText = user.email;

        // Récupération de la sauvegarde depuis Firestore
        const docRef = doc(db, "players", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            window.gameState = data.gameState;
            window.player = data.player;
            window.marketVehicles = data.marketVehicles;
            console.log("Sauvegarde restaurée depuis Firebase Cloud !");
        }
        
        if(typeof updateGlobalUI === "function") updateGlobalUI();

    } else {
        currentUser = null;
        authScreen.classList.remove('hidden');
        gameWrapper.classList.add('hidden');
    }
});
