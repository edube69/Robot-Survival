// js/firebase-config.js

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
    getFirestore, collection, addDoc, query, orderBy,
    limit as fsLimit, getDocs, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import {
    getAuth, signInAnonymously, onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

import { firebaseConfig } from './firebase-secrets.js';

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Connexion anonyme (retourne l'utilisateur)
export function getCurrentUser() {
    return new Promise((resolve, reject) => {
        const unsub = onAuthStateChanged(auth, (user) => {
            if (user) {
                unsub();
                resolve(user);
            } else {
                signInAnonymously(auth)
                    .then(cred => { unsub(); resolve(cred.user); })
                    .catch(reject);
            }
        }, reject);
    });
}

// >>> NOTE: signature attend 'user' (comme dans game.js)
export async function saveScore(user, playerName, score, time, kills) {
    try {
        if (!user || !user.uid) throw new Error('User not authenticated');

        await addDoc(collection(db, 'highscores'), {
            userId: user.uid,
            playerName,
            score,
            time,       // ex.: "123s" si tu veux l’afficher tel quel
            kills,
            timestamp: serverTimestamp()
        });
        return true;
    } catch (e) {
        console.error('Error saving score: ', e);
        return false;
    }
}

// top = nombre d’entrées à retourner
export async function getHighScores(top = 10) {
    try {
        const q = query(
            collection(db, 'highscores'),
            orderBy('score', 'desc'),
            fsLimit(top) // ← pas de collision de nom
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
        console.error('Error getting high scores: ', e);
        return [];
    }
}
