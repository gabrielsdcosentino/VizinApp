import { db, auth } from './firebaseConfig.js';
import { collection, query, where, getDocs } from "firebase/firestore";
import { showScreen } from '../main.js';

export function setupOrders() {
    const btnOpenOrders = document.getElementById('btnOpenOrders');
    const btnCloseOrders = document.getElementById('btnCloseOrders');
    const tabPedi = document.getElementById('tabPedi');
    const tabAceitei = document.getElementById('tabAceitei');
    const ordersList = document.getElementById('ordersList');

    let currentTab = 'pedi'; 

    btnOpenOrders.onclick = () => {
        showScreen('screen-orders');
        loadOrders();
    };

    btnCloseOrders.onclick = () => { showScreen('screen-app'); };

    // Trocar de abas
    tabPedi.onclick = () => {
        currentTab = 'pedi';
        tabPedi.className = "flex-1 py-2 bg-white text-blue-600 rounded-lg font-bold shadow-sm transition-all";
        tabAceitei.className = "flex-1 py-2 bg-transparent text-slate-500 rounded-lg font-bold transition-all";
        loadOrders();
    };

    tabAceitei.onclick = () => {
        currentTab = 'aceitei';
        tabAceitei.className = "flex-1 py-2 bg-white text-blue-600 rounded-lg font-bold shadow-sm transition-all";
        tabPedi.className = "flex-1 py-2 bg-transparent text-slate-500 rounded-lg font-bold transition-all";
        loadOrders();
    };

    async function loadOrders() {
        ordersList.innerHTML = '<p class="text-center text-slate-500 mt-10">Buscando na base de dados segura...</p>';
        const user = auth.currentUser;
        if(!user) return;

        // Regra de segurança: Busca só o que é do usuário logado
        const campoBusca = currentTab === 'pedi' ? 'autor' : 'worker';
        const valorBusca = currentTab === 'pedi' ? user.email : user.uid;

        try {
            const q = query(collection(db, "servicos"), where(campoBusca, "==", valorBusca));
            const querySnapshot = await getDocs(q);
            
            if(querySnapshot.empty) {
                ordersList.innerHTML = '<p class="text-center text-slate-400 mt-10">Você não tem nenhum pedido aqui.</p>';
                return;
            }

            let html = '';
            querySnapshot.forEach((docSnap) => {
                const d = docSnap.data();
                const corStatus = d.status === 'aberto' ? 'bg-blue-100 text-blue-700' : (d.status === 'aceito' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700');
                
                html += `
                    <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative">
                        <div class="flex justify-between items-center mb-2">
                            <h3 class="font-bold text-lg text-slate-800">${d.titulo}</h3>
                            <span class="text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider ${corStatus}">${d.status}</span>
                        </div>
                        <p class="text-sm text-slate-500 mb-4">Valor ofertado: <b class="text-blue-600">R$ ${d.valor}</b></p>
                        
                        ${currentTab === 'pedi' && d.workerName ? `<div class="bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center justify-between"><span class="text-xs text-slate-500">Aceito por:</span><span class="font-bold text-slate-700">${d.workerName}</span></div>` : ''}
                        
                        ${currentTab === 'aceitei' && d.creatorName ? `<div class="bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center justify-between"><span class="text-xs text-slate-500">Solicitante:</span><span class="font-bold text-slate-700">${d.creatorName}</span></div>` : ''}
                    </div>
                `;
            });
            ordersList.innerHTML = html;

        } catch(e) {
            console.error(e);
            ordersList.innerHTML = '<p class="text-center text-red-500 mt-10">Erro ao carregar dados.</p>';
        }
    }
}