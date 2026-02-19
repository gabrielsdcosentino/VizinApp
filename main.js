import './style.css';
import { auth } from './src/firebaseConfig.js';
import { onAuthStateChanged } from "firebase/auth";
import { setupLogin } from './src/login.js';
import { initMap } from './src/map.js';
import { setupProfile } from './src/profile.js';

// Função profissional para navegar entre as telas
export function showScreen(screenId) {
    document.getElementById('screen-login').classList.add('hidden');
    document.getElementById('screen-app').classList.add('hidden');
    document.getElementById('screen-profile').classList.add('hidden');
    
    document.getElementById(screenId).classList.remove('hidden');
}

// Ouve o estado da autenticação do Firebase em tempo real
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Usuário logado -> Mostra o App e inicializa as funções
        showScreen('screen-app');
        initMap(); // Garante que o mapa só carrega quando está visível
        setupProfile(); // Prepara os botões da tela de perfil
    } else {
        // Usuário deslogado -> Mostra o Login
        showScreen('screen-login');
        setupLogin();
    }
});