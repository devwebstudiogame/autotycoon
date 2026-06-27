import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. CONFIGURATION CONFIG FIREBASE (Remplie avec tes identifiants)
const firebaseConfig = {
  apiKey: "AIzaSyCgWe1xwe-eZqw0jlza7RzMU_jTpN-kWZo",
  authDomain: "autotycoon-f6387.firebaseapp.com",
  projectId: "autotycoon-f6387",
  storageBucket: "autotycoon-f6387.firebasestorage.app",
  messagingSenderId: "410099236214",
  appId: "1:410099236214:web:92a3a482eccea2a0424e57"
};

// 2. CONFIGURATION EMAILJS (Remplie avec ton Template ID)
const EMAILJS_TEMPLATE_ID = "template_3i7lovf"; 
const EMAILJS_SERVICE_ID = "TON_SERVICE_ID";   // ⚠️ À remplacer par ton Service ID EmailJS
const EMAILJS_PUBLIC_KEY = "TA_PUBLIC_KEY";     // ⚠️ À remplacer par ta Public Key EmailJS

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

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            currentUser = userCredential.user;
            
            // 1. Envoyer le mail de confirmation via EmailJS
            sendWelcomeEmail(email);

            // 2. Créer une sauvegarde vierge par défaut sur Firestore
            if (typeof initPlayer === "function") initPlayer(); 
            saveDataToFirebase().then(() => {
                location.reload(); 
            });
        })
        .catch((error) => {
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
 * Envoi du mail de bienvenue (EmailJS)
 */
function sendWelcomeEmail(userEmail) {
    const templateParams = {
        user_email: userEmail,
        reply_to: "no-reply@garagetycoon.com"
    };

    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
        .then(() => {
            console.log("E-mail de confirmation envoyé avec succès !");
        }, (err) => {
            console.error("Échec de l'envoi du mail...", err);
        });
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