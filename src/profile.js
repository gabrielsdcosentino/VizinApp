import { db, auth } from './firebaseConfig';
import { doc, setDoc, getDoc } from "firebase/firestore";

export async function openProfile(callbackVoltar) {
    const user = auth.currentUser;
    
    document.querySelector('#app').innerHTML = `
        <div style="padding: 20px; font-family: sans-serif; max-width: 500px; margin: 0 auto;">
            <h2>Meu Perfil 👤</h2>
            <p>Complete seus dados para passar confiança.</p>
            
            <label style="display:block; margin-top:15px">Nome Completo</label>
            <input id="profileName" type="text" placeholder="Ex: João da Silva" style="width: 100%; padding: 12px; border: 1px solid #ccc; border-radius: 8px;">
            
            <label style="display:block; margin-top:15px">WhatsApp (Só números)</label>
            <input id="profilePhone" type="tel" placeholder="Ex: 11999999999" style="width: 100%; padding: 12px; border: 1px solid #ccc; border-radius: 8px;">
            
            <button id="btnSaveProfile" style="width: 100%; padding: 15px; background: #2196F3; color: white; border: none; border-radius: 8px; margin-top: 20px; font-weight: bold;">SALVAR DADOS</button>
            <button id="btnBack" style="width: 100%; padding: 15px; background: transparent; color: #666; border: none; margin-top: 10px;">Voltar ao Mapa</button>
        </div>
    `;

    // Carregar dados existentes
    try {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) {
            const data = docSnap.data();
            document.getElementById('profileName').value = data.name || '';
            document.getElementById('profilePhone').value = data.phone || '';
        }
    } catch (e) { console.error("Erro ao carregar perfil:", e); }

    // Botão Salvar
    document.getElementById('btnSaveProfile').onclick = async () => {
        const name = document.getElementById('profileName').value;
        const phone = document.getElementById('profilePhone').value;

        if (!name || !phone) return alert("Por favor, preencha tudo!");

        document.getElementById('btnSaveProfile').innerText = "Salvando...";
        
        try {
            await setDoc(doc(db, "users", user.uid), {
                name: name,
                phone: phone,
                email: user.email
            }, { merge: true });
            
            alert("✅ Perfil Salvo!");
            if(callbackVoltar) callbackVoltar(); // Volta pro mapa
        } catch (e) {
            alert("Erro ao salvar: " + e.message);
            document.getElementById('btnSaveProfile').innerText = "SALVAR DADOS";
        }
    };

    document.getElementById('btnBack').onclick = () => {
        if(callbackVoltar) callbackVoltar();
    };
}

// Função auxiliar para pegar dados do usuário sem abrir a tela
export async function getUserProfile() {
    try {
        const docSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
        return docSnap.exists() ? docSnap.data() : null;
    } catch (e) { return null; }
}
