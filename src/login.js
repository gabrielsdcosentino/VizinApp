import { auth } from './firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { initMap } from './map.js'; // Importa a função do mapa

// Desenha a tela de Login (HTML)
document.querySelector('#app').innerHTML = `
  <div style="padding: 20px; font-family: sans-serif; max-width: 400px; margin: 0 auto; display: flex; flex-direction: column; justify-content: center; height: 100vh;">
    <h1 style="text-align: center; color: #333;">VizinApp 🏠</h1>
    <p style="text-align: center; color: #666; margin-bottom: 30px;">Conecte-se com sua vizinhança</p>
    
    <input type="email" id="email" placeholder="Seu Email" style="padding: 15px; margin-bottom: 10px; border: 1px solid #ccc; border-radius: 8px; font-size: 16px;">
    <input type="password" id="password" placeholder="Sua Senha" style="padding: 15px; margin-bottom: 20px; border: 1px solid #ccc; border-radius: 8px; font-size: 16px;">
    
    <button id="btnLogin" style="padding: 15px; background: #2196F3; color: white; border: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin-bottom: 10px;">ENTRAR</button>
    <button id="btnRegister" style="padding: 15px; background: #4CAF50; color: white; border: none; border-radius: 8px; font-weight: bold; font-size: 16px;">CRIAR CONTA NOVA</button>
    
    <p id="status" style="margin-top: 20px; text-align: center; font-weight: bold; color: gray;"></p>
  </div>
`;

// Lógica do Botão ENTRAR
document.getElementById('btnLogin').addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    const status = document.getElementById('status');
    
    if(!email || !pass) { status.innerText = "⚠️ Preencha email e senha!"; return; }

    status.innerText = "⏳ Entrando...";
    
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        // SUCESSO! Chama o mapa
        status.innerText = "✅ Sucesso!";
        initMap(); 
    } catch (error) {
        status.innerText = "❌ Erro: " + error.message;
    }
});

// Lógica do Botão CRIAR CONTA
document.getElementById('btnRegister').addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    const status = document.getElementById('status');

    if(!email || !pass) { status.innerText = "⚠️ Preencha email e senha!"; return; }

    status.innerText = "⏳ Criando conta...";
    
    try {
        await createUserWithEmailAndPassword(auth, email, pass);
        // SUCESSO! Chama o mapa
        status.innerText = "🎉 Conta criada!";
        initMap();
    } catch (error) {
        status.innerText = "❌ Erro: " + error.message;
    }
});
