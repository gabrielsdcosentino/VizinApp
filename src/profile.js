import { db, auth } from './firebaseConfig.js';
import { doc, setDoc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { showScreen } from '../main.js';

export function setupProfile() {
    const btnOpenProfile = document.getElementById('btnOpenProfile');
    const btnCloseProfile = document.getElementById('btnCloseProfile');
    const btnSaveProfile = document.getElementById('btnSaveProfile');
    const btnLogout = document.getElementById('btnLogout');

    // Abrir Perfil
    btnOpenProfile.onclick = async () => {
        showScreen('screen-profile');
        
        // Carregar dados existentes
        const user = auth.currentUser;
        if(user) {
            try {
                const docSnap = await getDoc(doc(db, "users", user.uid));
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    document.getElementById('profileName').value = data.name || '';
                    document.getElementById('profilePhone').value = data.phone || '';
                }
            } catch (e) { console.error("Erro ao carregar perfil:", e); }
        }
    };

    // Fechar Perfil
    btnCloseProfile.onclick = () => {
        showScreen('screen-app');
    };

    // Salvar Dados
    btnSaveProfile.onclick = async () => {
        const name = document.getElementById('profileName').value.trim();
        const phone = document.getElementById('profilePhone').value.trim();
        const user = auth.currentUser;

        if (!name || !phone) return alert("Preencha todos os campos!");

        btnSaveProfile.innerText = "Salvando...";
        
        try {
            await setDoc(doc(db, "users", user.uid), {
                name: name,
                phone: phone,
                email: user.email
            }, { merge: true });
            
            btnSaveProfile.innerText = "Dados Salvos!";
            btnSaveProfile.classList.replace('bg-green-500', 'bg-blue-500');
            
            setTimeout(() => {
                btnSaveProfile.innerText = "Salvar Dados";
                btnSaveProfile.classList.replace('bg-blue-500', 'bg-green-500');
                showScreen('screen-app'); // Volta pro mapa após salvar
            }, 1000);

        } catch (e) {
            alert("Erro ao salvar.");
            btnSaveProfile.innerText = "Salvar Dados";
        }
    };

    // Deslogar
    btnLogout.onclick = async () => {
        await signOut(auth);
        // O main.js vai detectar o logout e voltar para a tela de login
    };
}