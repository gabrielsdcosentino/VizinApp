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
        
        // 1. O SEGREDO: Limpar os campos ANTES de tentar carregar os dados
        // Isso evita que dados de outro usuário fiquem "presos" na tela
        document.getElementById('profileName').value = '';
        document.getElementById('profilePhone').value = '';
        
        // 2. Carregar dados existentes
        const user = auth.currentUser;
        if(user) {
            try {
                const docSnap = await getDoc(doc(db, "users", user.uid));
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    // Se o usuário tem dados no banco, preenchemos os campos
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
        // Limpa os campos de perfil por segurança na hora de sair
        document.getElementById('profileName').value = '';
        document.getElementById('profilePhone').value = '';
        
        // Limpa também os campos de e-mail e senha da tela de login
        document.getElementById('authEmail').value = '';
        document.getElementById('authPassword').value = '';
        document.getElementById('authStatus').innerText = '';

        await signOut(auth);
        // O main.js vai detectar o logout e voltar para a tela de login limpa
    };
}

// Função exportada para o mapa poder ler os dados
export async function getUserProfile() {
    try {
        const docSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
        return docSnap.exists() ? docSnap.data() : null;
    } catch (e) { return null; }
}