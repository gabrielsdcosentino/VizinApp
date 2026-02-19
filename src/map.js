import L from 'leaflet';
import { db, auth } from './firebaseConfig.js';
import { collection, doc, updateDoc, onSnapshot, addDoc, serverTimestamp, increment, getDoc } from "firebase/firestore";
import { getUserProfile } from './profile.js'; 

let map, markers = {};

export function initMap() {
    if (map) { setTimeout(() => map.invalidateSize(), 100); return; }

    map = L.map('map', { zoomControl: false }).setView([-23.1791, -45.8872], 14);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(map);
    setTimeout(() => map.invalidateSize(), 100);

    onSnapshot(collection(db, "servicos"), (snap) => {
        snap.forEach(d => {
            const data = d.data();
            const id = d.id;

            // SOME COM PINOS CANCELADOS E CONCLUÍDOS
            if (data.status === "concluido" || data.status === "cancelado") {
                if (markers[id]) { map.removeLayer(markers[id]); delete markers[id]; }
                return;
            }

            const isAceito = data.status === "aceito";
            const colorFill = isAceito ? "#22c55e" : "#2563eb"; 
            const colorStroke = isAceito ? "#166534" : "#1e40af"; 
            
            const svgIcon = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${colorFill}" stroke="${colorStroke}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3" fill="white"></circle>
                </svg>
            `;

            if (!markers[id]) {
                markers[id] = L.marker([data.lat, data.lng], {
                    icon: L.divIcon({ 
                        className: 'bg-transparent border-none',
                        html: `<div style="width: 36px; height: 36px; transform: translate(-50%, -100%); filter: drop-shadow(0px 4px 4px rgba(0,0,0,0.4));">${svgIcon}</div>`,
                    })
                }).addTo(map);
            }

            markers[id].off('click').on('click', () => showDetails(id, data));
        });
    });

    function showDetails(id, data) {
        const isMine = data.autor === auth.currentUser.email;
        const isWorker = data.worker === auth.currentUser.uid; // Verifica se sou eu quem está executando
        const phoneToCall = isMine ? data.workerPhone : data.creatorPhone;
        const otherPersonName = isMine ? data.workerName : data.creatorName;
        const roleLabel = isMine ? "Fazendo:" : "Pediu:";

        const sheet = document.getElementById('bottomSheet');
        const content = document.getElementById('sheetContent');

        content.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <h2 class="text-2xl font-black text-slate-800">${data.titulo}</h2>
                <div class="text-right">
                    <span class="text-xl font-bold text-blue-600 block">R$ ${data.valor}</span>
                    <span class="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase">Pago no App</span>
                </div>
            </div>
            <p class="text-slate-500 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">${data.descricao || 'Sem instruções.'}</p>
            
            <div class="space-y-3">
                ${data.status === 'aberto' && !isMine ? `<button id="btnAction" class="w-full bg-blue-600 text-white p-4 rounded-2xl font-bold active:scale-95 transition-all">ACEITAR SERVIÇO</button>` : ''}
                
                ${data.status === 'aberto' && isMine ? `<button id="btnCancelOrder" class="w-full p-3 bg-red-50 text-red-600 rounded-xl font-bold active:scale-95 transition-all mt-2 border border-red-100">Cancelar e Reembolsar</button>` : ''}
                
                ${data.status === 'aceito' ? `
                    <div class="p-4 bg-green-50 rounded-2xl border border-green-100 text-center">
                        <p class="text-green-800 font-bold mb-1">Serviço em Andamento</p>
                        ${otherPersonName ? `<p class="text-sm text-green-700 mb-3">👤 ${roleLabel} <b>${otherPersonName}</b></p>` : ''}
                        ${phoneToCall ? `<a href="https://wa.me/55${phoneToCall}" target="_blank" class="block w-full bg-green-600 text-white font-bold py-3 rounded-xl mt-2 active:scale-95">Chamar no WhatsApp</a>` : ''}
                    </div>
                    
                    ${isMine ? `<button id="btnAction" class="w-full bg-slate-900 text-white p-4 rounded-2xl font-bold mt-2 active:scale-95 transition-all">FINALIZAR (Liberar Pagamento)</button>` : ''}
                    
                    ${isWorker ? `<button id="btnWorkerCancel" class="w-full p-3 bg-red-50 text-red-600 rounded-xl font-bold active:scale-95 transition-all mt-2 border border-red-100">Tive um imprevisto (Cancelar e Devolver R$)</button>` : ''}
                ` : ''}
                
                <button id="btnFecharDetalhes" class="w-full p-2 text-slate-400 font-medium">Fechar</button>
            </div>
        `;

        sheet.classList.remove('translate-y-full');
        document.getElementById('btnFecharDetalhes').onclick = () => { sheet.classList.add('translate-y-full'); };

        // CANCELAMENTO DO SOLICITANTE (Só na fase aberta)
        const btnCancel = document.getElementById('btnCancelOrder');
        if (btnCancel) {
            btnCancel.onclick = async () => {
                if(confirm("Deseja realmente cancelar? O valor retornará para sua carteira.")){
                    btnCancel.innerText = "Cancelando...";
                    await updateDoc(doc(db, "users", auth.currentUser.uid), { saldo: increment(parseFloat(data.valor)) });
                    await updateDoc(doc(db, "servicos", id), { status: "cancelado" });
                    sheet.classList.add('translate-y-full');
                }
            };
        }

        // DESISTÊNCIA DO PRESTADOR DE SERVIÇO (Fase Aceito)
        const btnWorkerCancel = document.getElementById('btnWorkerCancel');
        if (btnWorkerCancel) {
            btnWorkerCancel.onclick = async () => {
                if(!data.creatorId) return alert("Erro: Pedido antigo de teste não pode ser estornado.");
                
                if(confirm("Deseja cancelar o serviço? O dinheiro será devolvido automaticamente ao seu vizinho.")){
                    btnWorkerCancel.innerText = "Devolvendo...";
                    // Devolve o dinheiro para o ID de quem criou o pedido
                    await updateDoc(doc(db, "users", data.creatorId), { saldo: increment(parseFloat(data.valor)) });
                    await updateDoc(doc(db, "servicos", id), { status: "cancelado" });
                    sheet.classList.add('translate-y-full');
                }
            };
        }

        // ACEITAR E FINALIZAR
        const actionBtn = document.getElementById('btnAction');
        if (actionBtn) {
            actionBtn.onclick = async () => {
                const type = actionBtn.innerText.includes("ACEITAR") ? "accept" : "finish";
                const ref = doc(db, "servicos", id);
                
                if (type === "accept") {
                    const prof = await getUserProfile();
                    if(!prof || !prof.cpf) return alert("Valide sua identidade no perfil antes de aceitar!");
                    await updateDoc(ref, { status: "aceito", worker: auth.currentUser.uid, workerName: prof.name, workerPhone: prof.phone });
                    sheet.classList.add('translate-y-full');
                } else {
                    if(confirm("Confirma que o serviço foi concluído? O dinheiro será transferido agora.")){
                        abrirModalAvaliacao(id, data);
                        sheet.classList.add('translate-y-full');
                    }
                }
            };
        }
    }

    // AVALIAÇÃO E TRANSFERÊNCIA BANCÁRIA
    let notaSelecionada = 0;
    const modalRating = document.getElementById('modalRating');
    const stars = document.querySelectorAll('.star-btn');
    const btnSubmitRating = document.getElementById('btnSubmitRating');

    stars.forEach(star => {
        star.onclick = (e) => {
            notaSelecionada = parseInt(e.target.getAttribute('data-value'));
            btnSubmitRating.disabled = false;
            stars.forEach((s, index) => {
                if(index < notaSelecionada) {
                    s.classList.remove('text-slate-300'); s.classList.add('text-yellow-400');
                } else {
                    s.classList.remove('text-yellow-400'); s.classList.add('text-slate-300');
                }
            });
        };
    });

    function abrirModalAvaliacao(orderId, orderData) {
        document.getElementById('ratingWorkerName').innerText = orderData.workerName;
        modalRating.classList.remove('hidden');
        modalRating.classList.add('flex');
        
        notaSelecionada = 0;
        btnSubmitRating.disabled = true;
        stars.forEach(s => { s.classList.remove('text-yellow-400'); s.classList.add('text-slate-300'); });

        btnSubmitRating.onclick = async () => {
            btnSubmitRating.innerText = "Processando...";
            try {
                const valorNum = parseFloat(orderData.valor);
                const workerRef = doc(db, "users", orderData.worker);
                
                const workerSnap = await getDoc(workerRef);
                const currentStars = workerSnap.exists() && workerSnap.data().estrelas !== undefined ? workerSnap.data().estrelas : 5.0;
                const totalAvaliacoes = workerSnap.exists() && workerSnap.data().avaliacoes !== undefined ? workerSnap.data().avaliacoes : 0;
                
                const novaMedia = ((currentStars * totalAvaliacoes) + notaSelecionada) / (totalAvaliacoes + 1);

                await updateDoc(workerRef, { 
                    saldo: increment(valorNum),
                    estrelas: novaMedia,
                    avaliacoes: increment(1)
                });
                
                await updateDoc(doc(db, "servicos", orderId), { 
                    status: "concluido", 
                    nota: notaSelecionada 
                });

                modalRating.classList.add('hidden');
                modalRating.classList.remove('flex');
                alert("Serviço finalizado! O dinheiro foi transferido.");
            } catch(e) {
                console.error(e); alert("Erro ao finalizar.");
            } finally {
                btnSubmitRating.innerText = "Avaliar e Fechar";
            }
        };
    }

    // NOVO PEDIDO
    const modalOrder = document.getElementById('modalNewOrder');

    document.getElementById('btnAddOrder').onclick = () => {
        modalOrder.classList.remove('hidden'); modalOrder.classList.add('flex');
        if (map) map.dragging.disable(); 
    };

    document.getElementById('btnCloseOrderModal').onclick = () => {
        modalOrder.classList.add('hidden'); modalOrder.classList.remove('flex');
        if (map) map.dragging.enable(); 
    };

    document.getElementById('btnSubmitOrder').onclick = async () => {
        const title = document.getElementById('orderTitle').value.trim();
        const desc = document.getElementById('orderDesc').value.trim();
        const valueStr = document.getElementById('orderValue').value.trim();
        
        if (!title || !valueStr) return alert("Preencha título e valor!");
        const valorNum = parseFloat(valueStr);
        if (valorNum <= 0) return alert("O valor deve ser maior que zero.");

        const prof = await getUserProfile();
        if(!prof || !prof.cpf) return alert("⚠️ Valide seu CPF no Perfil antes de pedir ajuda.");

        if (!prof.saldo || prof.saldo < valorNum) {
            return alert(`❌ Saldo Insuficiente. Você tem R$ ${prof.saldo || 0}, mas o serviço custa R$ ${valorNum}.`);
        }

        const btn = document.getElementById('btnSubmitOrder');
        btn.innerText = "Descontando da Carteira..."; btn.disabled = true;

        try {
            await updateDoc(doc(db, "users", auth.currentUser.uid), { saldo: increment(-valorNum) });

            const center = map.getCenter();
            await addDoc(collection(db, "servicos"), {
                titulo: title,
                descricao: desc,
                valor: valorNum,
                lat: center.lat,
                lng: center.lng,
                status: "aberto",
                autor: auth.currentUser.email,
                creatorId: auth.currentUser.uid, // <-- MUDANÇA VITAL PARA O ESTORNO FUNCIONAR
                creatorPhone: prof.phone,
                creatorName: prof.name,
                criadoEm: serverTimestamp()
            });

            document.getElementById('orderTitle').value = '';
            document.getElementById('orderDesc').value = '';
            document.getElementById('orderValue').value = '';
            
            modalOrder.classList.add('hidden'); modalOrder.classList.remove('flex');
            if (map) map.dragging.enable(); 
            
        } catch (error) {
            alert("Erro ao publicar o pedido.");
        } finally {
            btn.innerText = "Publicar Pedido"; btn.disabled = false;
        }
    };

    document.getElementById('btnGps').onclick = () => {
        navigator.geolocation.getCurrentPosition(
            p => map.flyTo([p.coords.latitude, p.coords.longitude], 17),
            err => alert("Ative a localização do navegador.")
        );
    };
}