import { auth } from './firebaseConfig.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

export function setupLogin() {
    const btnLogin = document.getElementById('btnLogin');
    const btnRegister = document.getElementById('btnRegister');
    const emailInput = document.getElementById('authEmail');
    const passInput = document.getElementById('authPassword');
    const statusMsg = document.getElementById('authStatus');

    btnLogin.replaceWith(btnLogin.cloneNode(true));
    btnRegister.replaceWith(btnRegister.cloneNode(true));

    document.getElementById('btnLogin').addEventListener('click', async () => {
        const email = emailInput.value.trim();
        const pass = passInput.value.trim();
        if(!email || !pass) { statusMsg.innerText = "Preencha e-mail e senha."; return; }
        statusMsg.innerText = "Entrando...";
        try { await signInWithEmailAndPassword(auth, email, pass); statusMsg.innerText = ""; } 
        catch (error) { statusMsg.innerText = "Erro: Verifique seus dados."; }
    });

    document.getElementById('btnRegister').addEventListener('click', async () => {
        const email = emailInput.value.trim();
        const pass = passInput.value.trim();
        if(!email || !pass) { statusMsg.innerText = "Preencha e-mail e senha."; return; }
        if(pass.length < 6) { statusMsg.innerText = "Senha deve ter 6+ caracteres."; return; }
        statusMsg.innerText = "Criando...";
        try { await createUserWithEmailAndPassword(auth, email, pass); statusMsg.innerText = ""; } 
        catch (error) { statusMsg.innerText = "Erro ao criar conta."; }
    });
}