import L from 'leaflet';
import { db, auth } from './firebaseConfig';
import { collection, addDoc, doc, updateDoc, onSnapshot } from "firebase/firestore";
import { openProfile, getUserProfile } from './profile.js';

let map, markers = {};

export function initMap() {
    if (map) return; // Evita reinicializar o mapa e bugar

    // Inicializa o Mapa em SJC
    map = L.map('map', { zoomControl: false }).setView([-23.1791, -45.8872], 14);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(map);

    // Escuta o Banco de Dados
    onSnapshot(collection(db, "servicos"), (snap) => {
        snap.forEach(d => {
            const data = d.data();
            const id = d.id;

            if (data.status === "concluido") {
                if (markers[id]) { map.removeLayer(markers[id]); delete markers[id]; }
                return;
            }

            const color = data.status === "aceito" ? "#22c55e" : "#2563eb";
            const iconHtml = `<div style="background:${color}; width:15px; height:15px; border-radius:50%; border:3px solid white; box-shadow:0 2px 5px rgba(0,0,0,0.3)"></div>`;

            if (!markers[id]) {
                markers[id] = L.marker([data.lat, data.lng], {
                    icon: L.divIcon({ className: 'leaflet-vizin-icon', html: iconHtml })
                }).addTo(map);
            }

            markers[id].off('click').on('click', () => showDetails(id, data));
        });
    });

    // Função de Mostrar Detalhes (Estilo Uber)
    function showDetails(id, data) {
        const isMine = data.autor === auth.currentUser.email;
        const sheet = document.getElementById('bottomSheet');
        const content = document.getElementById('sheetContent');

        content.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <h2 class="text-2xl font-black text-slate-800">${data.titulo}</h2>
                <span class="text-xl font-bold text-blue-600">R$ ${data.valor}</span>
            </div>
            <p class="text-slate-500 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">${data.descricao || 'Sem instruções.'}</p>
            
            <div class="space-y-3">
                ${data.status === 'aberto' && !isMine ? `<button id="btnAction" class="w-full bg-blue-600 text-white p-4 rounded-2xl font-bold">ACEITAR SERVIÇO</button>` : ''}
                ${data.status === 'aceito' ? `
                    <div class="p-4 bg-green-50 rounded-2xl border border-green-100 text-center">
                        <p class="text-green-700 font-medium mb-2">Em andamento</p>
                        <a href="https://wa.me/55${data.workerPhone || data.whatsapp}" target="_blank" class="text-green-600 font-bold underline">Chamar no WhatsApp</a>
                    </div>
                    ${isMine ? `<button id="btnAction" class="w-full bg-slate-900 text-white p-4 rounded-2xl font-bold">FINALIZAR E PAGAR</button>` : ''}
                ` : ''}
                <button onclick="document.getElementById('bottomSheet').classList.add('translate-y-full')" class="w-full p-2 text-slate-400 font-medium">Fechar</button>
            </div>
        `;

        sheet.classList.remove('translate-y-full');

        const actionBtn = document.getElementById('btnAction');
        if (actionBtn) {
            actionBtn.onclick = async () => {
                const type = actionBtn.innerText.includes("ACEITAR") ? "accept" : "finish";
                const ref = doc(db, "servicos", id);
                
                if (type === "accept") {
                    const prof = await getUserProfile();
                    if(!prof) return alert("Preencha o perfil!");
                    await updateDoc(ref, { status: "aceito", worker: auth.currentUser.uid, workerName: prof.name, workerPhone: prof.phone });
                } else {
                    await updateDoc(ref, { status: "concluido" });
                }
                sheet.classList.add('translate-y-full');
            };
        }
    }

    // Configuração de Eventos Fixos (Não morrem mais)
    document.getElementById('mainProfileBtn').onclick = () => openProfile(() => {
        // Quando volta do perfil, não reinicia o app, só fecha o perfil
        initMap(); 
    });

    document.getElementById('gpsBtn').onclick = () => {
        navigator.geolocation.getCurrentPosition(p => map.flyTo([p.coords.latitude, p.coords.longitude], 17));
    };

    document.getElementById('addOrderBtn').onclick = () => {
        // Aqui você chamaria o modal de novo pedido (pode ser outro Bottom Sheet)
        alert("Abra o formulário de novo pedido");
    };
}
