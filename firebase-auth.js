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
const EMAILJS_SERVICE_ID = "TON_SERVICE_ID";   // ⚠️ Remplace par ton Service ID EmailJS
const EMAILJS_PUBLIC_KEY = "TA_PUBLIC_KEY";     // ⚠️ Remplace par ta Public Key EmailJS

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
 * Inscription d'un nouveau joueur
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
            
            // Forcer l'initialisation des fonctions globales pour le premier jour
            if (typeof initPlayer === "function") initPlayer(); 
            if (typeof refreshMarket === "function") refreshMarket(); 

            // Attente des envois asynchrones (Email + Sauvegarde initiale avec argent de départ)
            try {
                errorEl.innerText = "Envoi du mail de bienvenue...";
                await sendWelcomeEmail(email);
            } catch(e) {
                console.warn("EmailJS bloqué ou mal configuré, création du compte maintenue.", e);
            }

            try {
                errorEl.innerText = "Génération du capital de départ (20 000 €)...";
                await saveDataToFirebase();
                errorEl.innerText = "Démarrage !";
                
                // Petit délai de confort avant de recharger pour laisser Firestore respirer
                setTimeout(() => {
                    location.reload();
                }, 1000);
            } catch (err) {
                console.error("Erreur d'écriture BDD : ", err);
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
 * Envoi du mail via EmailJS
 */
function sendWelcomeEmail(userEmail) {
    const templateParams = {
        user_email: userEmail,
        reply_to: "no-reply@garagetycoon.com"
    };
    return emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
}

/**
 * Pousse les données globales vers Cloud Firestore
 */
window.saveDataToFirebase = async function() {
    if (!currentUser) return;
    
    try {
        await setDoc(doc(db, "players", currentUser.uid), {
            gameState: window.gameState,
            player: window.player,
            marketVehicles: window.marketVehicles,
            lastSave: new Date()
        });
        console.log("Sauvegarde cloud synchronisée !");
    } catch (e) {
        console.error("Erreur lors de la sauvegarde cloud", e);
    }
}

/**
 * Observeur d'état de connexion
 */
onAuthStateChanged(auth, async (user) => {
    const authScreen = document.getElementById('auth-screen');
    const gameWrapper = document.getElementById('game-container-wrapper');

    if (user) {
        currentUser = user;
        authScreen.classList.add('hidden'); 
        gameWrapper.classList.remove('hidden'); 
        document.getElementById('user-display-email').innerText = user.email;

        // Récupération de la sauvegarde
        const docRef = doc(db, "players", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            window.gameState = data.gameState;
            window.player = data.player;
            window.marketVehicles = data.marketVehicles;
            console.log("Sauvegarde restaurée depuis Firebase Cloud !");
        } else {
            // Sécurité si un compte existe dans Auth mais n'a pas de document Firestore
            if (typeof initPlayer === "function") initPlayer(); 
            if (typeof refreshMarket === "function") refreshMarket();
            await saveDataToFirebase();
        }
        
        if(typeof window.updateGlobalUI === "function") window.updateGlobalUI();

    } else {
        currentUser = null;
        authScreen.classList.remove('hidden');
        gameWrapper.classList.add('hidden');
    }
});
