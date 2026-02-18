import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDkiAA80swcXAve6nXtPK_J6MhWuhXNUYM",
  authDomain: "vizinapp-93af1.firebaseapp.com",
  projectId: "vizinapp-93af1",
  storageBucket: "vizinapp-93af1.firebasestorage.app",
  messagingSenderId: "1055138948978",
  appId: "1:1055138948978:web:5ba41af068fe3c52c25feb"
};

// Inicializa e EXPORTA as funções (isso que faltava)
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

