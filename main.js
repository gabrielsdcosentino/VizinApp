import './style.css'

// 1. CONFIGURAÇÃO DO FIREBASE (Mantenha as suas chaves aqui!)
// IMPORTANTE: Se você já tinha as chaves no outro arquivo, cole-as aqui.
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "seu-id-aqui"
};

// Se você estiver usando o Firebase via CDN (mais fácil para Termux),
// garanta que as importações no topo do arquivo ou no index estão corretas.
// Aqui vou focar na lógica dos botões do IONIC:

document.addEventListener('DOMContentLoaded', () => {
    
    // SELETORES DOS ELEMENTOS IONIC
    const btnLogin = document.querySelector('#btnLogin');
    const btnRegister = document.querySelector('#btnRegister');
    const screenLogin = document.querySelector('#screen-login');
    const screenApp = document.querySelector('#screen-app');
    const authStatus = document.querySelector('#authStatus');
    
    // inputs do Ionic precisam do .value de forma específica às vezes, 
    // mas o seletor por ID continua funcionando
    const emailInput = document.querySelector('#authEmail');
    const passInput = document.querySelector('#authPassword');

    // FUNÇÃO PARA TROCAR DE TELA
    const showApp = () => {
        screenLogin.style.display = 'none';
        screenApp.style.display = 'block';
        // Aqui você chamaria a função de iniciar o mapa que já tínhamos
        console.log("Login feito! Abrindo mapa...");
    };

    // EVENTO DE CLIQUE NO BOTÃO ENTRAR (IONIC)
    btnLogin.addEventListener('click', async () => {
        const email = emailInput.value;
        const password = passInput.value;

        if(!email || !password) {
            authStatus.innerText = "Preencha todos os campos!";
            return;
        }

        authStatus.innerText = "Entrando...";
        
        // Simulação de login para teste visual imediato
        // Depois você volta a lógica do firebaseAuth aqui
        setTimeout(() => {
            showApp();
        }, 1000);
    });

    // ABRIR MODAL DE NOVO PEDIDO
    const btnAddOrder = document.querySelector('#btnAddOrder');
    const modalNewOrder = document.querySelector('#modalNewOrder');

    btnAddOrder.addEventListener('click', () => {
        modalNewOrder.present(); // Função nativa do Ionic para abrir modal
    });
});
