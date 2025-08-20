// Import des fonctions Firebase n�cessaires
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';


// On importe la configuration depuis le fichier secret (non versionn�)
import { firebaseConfig } from './firebase-secrets.js';


// Initialisation de Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);


// NOUVEAU : Fonction pour connecter l'utilisateur anonymement
// Elle retourne une promesse avec l'objet "user" une fois connect�.
export function getCurrentUser() {
    return new Promise((resolve, reject) => {
        // onAuthStateChanged est un �couteur qui se d�clenche d�s que l'�tat de connexion change.
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe(); // On se d�sabonne pour ne pas l'appeler plusieurs fois
            if (user) {
                // L'utilisateur est d�j� connect� ou vient de l'�tre
                resolve(user);
            } else {
                // L'utilisateur n'est pas connect�, on le connecte
                signInAnonymously(auth)
                    .then(userCredential => {
                        resolve(userCredential.user);
                    })
                    .catch(error => {
                        reject(error);
                    });
            }
        });
    });
}

// Fonction pour sauvegarder un score
export async function saveScore(playerName, score, time, kills) {
    if (!user) {
        console.error("Tentative de sauvegarde sans utilisateur authentifi�.");
        return false;
    }

    try {
        const docRef = await addDoc(collection(db, "highscores"), {
            userId: user.uid, // On ajoute l'ID unique de l'utilisateur
            playerName: playerName,
            score: score,
            time: time,
            kills: kills,
            timestamp: new Date()
        });
        console.log("Score saved with ID: ", docRef.id);
        return true;
    } catch (e) {
        console.error("Error saving score: ", e);
        return false;
    }
}

// Fonction pour r�cup�rer les meilleurs scores
export async function getHighScores(limit = 10) {
    try {
        const q = query(
            collection(db, "highscores"), 
            orderBy("score", "desc"),
            limit(limit)
        );
        
        const querySnapshot = await getDocs(q);
        const scores = [];
        
        querySnapshot.forEach((doc) => {
            scores.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return scores;
    } catch (e) {
        console.error("Error getting high scores: ", e);
        return [];
    }
}