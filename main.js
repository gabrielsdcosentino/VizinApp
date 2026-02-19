import './style.css';
import { auth } from './src/firebaseConfig.js';
import { onAuthStateChanged } from "firebase/auth";
import { setupLogin } from './src/login.js';
import { initMap } from './src/map.js';
import { setupProfile } from './src/profile.js';
import { setupOrders } from './src/orders.js';

export function showScreen(screenId) {
    document.getElementById('screen-login').classList.add('hidden');
    document.getElementById('screen-app').classList.add('hidden');
    document.getElementById('screen-profile').classList.add('hidden');
    document.getElementById('screen-orders').classList.add('hidden');
    
    document.getElementById(screenId).classList.remove('hidden');
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        showScreen('screen-app');
        initMap();
        setupProfile();
        setupOrders();
    } else {
        showScreen('screen-login');
        setupLogin();
    }
});