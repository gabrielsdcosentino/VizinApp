import { db, auth } from './firebaseConfig.js';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { showScreen } from '../main.js'; // Importa a função de trocar tela

// Função auxiliar para outros arquivos (como map.js) buscarem dados
export async function getUserProfile() {
    if(!auth.currentUser) return null;
    const snap = await getDoc(doc(db, "users", auth.currentUser.uid));
    return snap.exists() ? snap.data() : null;
}

export function setupProfile() {
    const btnOpen = document.getElementById('btnOpenProfile');
    const btnClose = document.getElementById('btnCloseProfile');
    const btnSave = document.getElementById('btnSaveProfile');
    const btnLogout = document.getElementById('btnLogout');

    if(btnOpen) {
        btnOpen.onclick = async () => {
            showScreen('screen-profile');
            
            const data = await getUserProfile();
            if (data) {
                // Preenche os inputs
                document.getElementById('profileName').value = data.name || '';
                document.getElementById('profileCpf').value = data.cpf || '';
                document.getElementById('profilePhone').value = data.phone || '';
                
                // Exibe o Nome no Topo (Pega apenas o primeiro nome)
                document.getElementById('profileDisplayName').innerText = data.name ? data.name.split(' ')[0] : "Conta";
                
                // Exibe a Carteira
                document.getElementById('profileSaldo').innerText = (data.saldo || 0).toFixed(2).replace('.', ',');
                
                // Exibe as Estrelas (A Mágica acontece aqui!)
                const ratingSpan = document.getElementById('profileRating');
                if (data.estrelas !== undefined) {
                    ratingSpan.innerText = parseFloat(data.estrelas).toFixed(1);
                } else {
                    ratingSpan.innerText = "Novo Vizin";
                }
                
                // Bloqueia CPF se já estiver preenchido
                if (data.cpf) {
                    document.getElementById('profileCpf').disabled = true;
                    document.getElementById('profileCpf').classList.add('bg-slate-200', 'text-slate-500');
                }
            }
        };
    }

    if(btnClose) btnClose.onclick = () => showScreen('screen-app');

    if(btnSave) {
        btnSave.onclick = async () => {
            const name = document.getElementById('profileName').value.trim();
            const cpf = document.getElementById('profileCpf').value.trim();
            const phone = document.getElementById('profilePhone').value.trim();

            if(!name || !cpf || !phone) return alert("Preencha todos os dados!");

            btnSave.innerText = "Salvando...";
            try {
                // Usamos merge: true para não apagar o saldo ou as estrelas
                await setDoc(doc(db, "users", auth.currentUser.uid), {
                    name: name,
                    cpf: cpf,
                    phone: phone
                }, { merge: true });
                
                alert("Perfil atualizado com sucesso!");
                document.getElementById('profileDisplayName').innerText = name.split(' ')[0];
            } catch (e) {
                console.error(e);
                alert("Erro ao salvar.");
            } finally {
                btnSave.innerText = "Salvar Alterações";
            }
        };
    }

    if(btnLogout) {
        btnLogout.onclick = () => {
            if(confirm("Deseja realmente sair?")) auth.signOut();
        };
    }
}
