import { auth } from './firebaseConfig.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

export function setupLogin() {
    const btnLogin = document.getElementById('btnLogin');
    const btnRegister = document.getElementById('btnRegister');
    const emailInput = document.getElementById('authEmail');
    const passInput = document.getElementById('authPassword');
    const statusMsg = document.getElementById('authStatus');

    // Remove listeners antigos para evitar duplicação caso deslogue e logue novamente
    btnLogin.replaceWith(btnLogin.cloneNode(true));
    btnRegister.replaceWith(btnRegister.cloneNode(true));

    document.getElementById('btnLogin').addEventListener('click', async () => {
        const email = emailInput.value.trim();
        const pass = passInput.value.trim();
        
        if(!email || !pass) { statusMsg.innerText = "Preencha e-mail e senha."; return; }

        statusMsg.innerText = "Entrando...";
        statusMsg.classList.replace('text-red-500', 'text-slate-500');
        
        try {
            await signInWithEmailAndPassword(auth, email, pass);
            // Se der certo, o main.js detecta a mudança e muda a tela automaticamente
            statusMsg.innerText = ""; 
        } catch (error) {
            statusMsg.classList.replace('text-slate-500', 'text-red-500');
            statusMsg.innerText = "Erro: Verifique seus dados.";
            console.error(error);
        }
    });

    document.getElementById('btnRegister').addEventListener('click', async () => {
        const email = emailInput.value.trim();
        const pass = passInput.value.trim();

        if(!email || !pass) { statusMsg.innerText = "Preencha e-mail e senha para criar."; return; }
        if(pass.length < 6) { statusMsg.innerText = "A senha deve ter pelo menos 6 caracteres."; return; }

        statusMsg.innerText = "Criando conta...";
        statusMsg.classList.replace('text-red-500', 'text-slate-500');
        
        try {
            await createUserWithEmailAndPassword(auth, email, pass);
            statusMsg.innerText = "";
        } catch (error) {
            statusMsg.classList.replace('text-slate-500', 'text-red-500');
            statusMsg.innerText = "Erro ao criar conta. E-mail já existe?";
            console.error(error);
        }
    });
}