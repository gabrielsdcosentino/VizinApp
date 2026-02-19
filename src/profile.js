import { db, auth } from './firebaseConfig.js';
import { doc, setDoc, getDoc, onSnapshot } from "firebase/firestore"; // Importamos o onSnapshot aqui
import { signOut } from "firebase/auth";
import { showScreen } from '../main.js';

function validarCPF(cpf) {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf === '11111111111') return true; 
    if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
    let soma = 0, resto;
    for (let i = 1; i <= 9; i++) soma = soma + parseInt(cpf.substring(i - 1, i)) * (11 - i);
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;
    soma = 0;
    for (let i = 1; i <= 10; i++) soma = soma + parseInt(cpf.substring(i - 1, i)) * (12 - i);
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(10, 11))) return false;
    return true;
}

let isSetup = false;
let unsubscribeSaldo = null;

export function setupProfile() {
    const btnOpenProfile = document.getElementById('btnOpenProfile');
    const btnCloseProfile = document.getElementById('btnCloseProfile');
    const btnSaveProfile = document.getElementById('btnSaveProfile');
    const btnLogout = document.getElementById('btnLogout');

    // ==========================================
    // MAGIA FINANCEIRA: CARTEIRA EM TEMPO REAL
    // ==========================================
    if (auth.currentUser) {
        if(unsubscribeSaldo) unsubscribeSaldo(); // Limpa o radar antigo
        // Fica vigiando o saldo do usuário logado 24h por dia
        unsubscribeSaldo = onSnapshot(doc(db, "users", auth.currentUser.uid), (docSnap) => {
            if (docSnap.exists() && docSnap.data().saldo !== undefined) {
                document.getElementById('profileSaldo').innerText = parseFloat(docSnap.data().saldo).toFixed(2).replace('.', ',');
            }
        });
    }

    // Trava para os botões não se multiplicarem
    if (isSetup) return;
    isSetup = true;

    btnOpenProfile.onclick = async () => {
        showScreen('screen-profile');
        document.getElementById('profileName').value = '';
        document.getElementById('profileCpf').value = '';
        document.getElementById('profilePhone').value = '';
        
        try {
            const docSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
            if (docSnap.exists()) {
                const data = docSnap.data();
                document.getElementById('profileName').value = data.name || '';
                document.getElementById('profileCpf').value = data.cpf || '';
                document.getElementById('profilePhone').value = data.phone || '';
                
                if (data.cpf) {
                    document.getElementById('profileCpf').disabled = true;
                    document.getElementById('profileCpf').classList.add('bg-slate-100', 'text-slate-500');
                }
            }
        } catch (e) { console.error("Erro:", e); }
    };

    btnCloseProfile.onclick = () => { showScreen('screen-app'); };

    btnSaveProfile.onclick = async () => {
        const name = document.getElementById('profileName').value.trim();
        const cpfRaw = document.getElementById('profileCpf').value.trim();
        const phone = document.getElementById('profilePhone').value.trim();
        const user = auth.currentUser;

        if (!name || !cpfRaw || !phone) return alert("Preencha todos os campos.");
        if (!validarCPF(cpfRaw)) return alert("❌ CPF Inválido.");

        btnSaveProfile.innerText = "Salvando...";
        
        try {
            const docSnap = await getDoc(doc(db, "users", user.uid));
            let saldoAtual = 100; // Se a pessoa não tiver saldo, ganha 100.
            if (docSnap.exists() && docSnap.data().saldo !== undefined) {
                saldoAtual = docSnap.data().saldo; // Mantém o saldo exato que está no banco
            }

            await setDoc(doc(db, "users", user.uid), {
                name: name,
                cpf: cpfRaw.replace(/[^\d]+/g, ''),
                phone: phone,
                email: user.email,
                saldo: saldoAtual,
                verifiedLevel: 1
            }, { merge: true });
            
            btnSaveProfile.innerText = "Salvo!";
            setTimeout(() => {
                btnSaveProfile.innerText = "Salvar e Verificar Conta";
                showScreen('screen-app');
            }, 1000);

        } catch (e) { alert("Erro ao salvar."); btnSaveProfile.innerText = "Salvar"; }
    };

    btnLogout.onclick = async () => { 
        if(unsubscribeSaldo) unsubscribeSaldo(); // Desliga o radar ao sair
        await signOut(auth); 
    };
}

export async function getUserProfile() {
    try {
        const docSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
        return docSnap.exists() ? docSnap.data() : null;
    } catch (e) { return null; }
}