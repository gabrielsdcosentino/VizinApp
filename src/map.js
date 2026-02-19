import L from 'leaflet';
import { db, auth } from './firebaseConfig.js';
// ATENÇÃO AOS IMPORTS NOVOS AQUI (query, orderBy):
import { collection, doc, updateDoc, onSnapshot, addDoc, serverTimestamp, increment, getDoc, query, orderBy } from "firebase/firestore";
import { getUserProfile } from './profile.js'; 

let map, markers = {};
let unsubscribeChat = null; // Fica de olho nas novas mensagens

export function initMap() {
    if (map) { setTimeout(() => map.invalidateSize(), 100); return; }

    map = L.map('map', { zoomControl: false }).setView([-23.1791, -45.8872], 14);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);
    setTimeout(() => map.invalidateSize(), 100);

    onSnapshot(collection(db, "servicos"), (snap) => {
        snap.forEach(d => {
            const data = d.data();
            const id = d.id;

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
        const isWorker = data.worker === auth.currentUser.uid;
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
                        
                        <button id="btnOpenChat" class="w-full bg-blue-600 text-white font-bold py-3 rounded-xl mt-2 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path fill-rule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" clip-rule="evenodd" /></svg>
                            Abrir Chat
                        </button>
                    </div>
                    
                    ${isMine ? `<button id="btnAction" class="w-full bg-slate-900 text-white p-4 rounded-2xl font-bold mt-2 active:scale-95 transition-all">FINALIZAR (Liberar Pagamento)</button>` : ''}
                    
                    ${isWorker ? `<button id="btnWorkerCancel" class="w-full p-3 bg-red-50 text-red-600 rounded-xl font-bold active:scale-95 transition-all mt-2 border border-red-100">Tive um imprevisto (Cancelar)</button>` : ''}
                ` : ''}
                
                <button id="btnFecharDetalhes" class="w-full p-2 text-slate-400 font-medium">Fechar Painel</button>
            </div>
        `;

        sheet.classList.remove('translate-y-full');
        document.getElementById('btnFecharDetalhes').onclick = () => { sheet.classList.add('translate-y-full'); };

        // ABRE A TELA DO CHAT
        const btnOpenChat = document.getElementById('btnOpenChat');
        if (btnOpenChat) {
            btnOpenChat.onclick = () => abrirChat(id, data.titulo);
        }

        // CRIADOR CANCELA (Só se estiver aberto, reembolsa)
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

        // CORREÇÃO DO CANCELAMENTO DO TRABALHADOR (Volta pro Mapa!)
        const btnWorkerCancel = document.getElementById('btnWorkerCancel');
        if (btnWorkerCancel) {
            btnWorkerCancel.onclick = async () => {
                if(confirm("Deseja cancelar? O pedido voltará para o mapa para outro vizinho aceitar.")){
                    btnWorkerCancel.innerText = "Cancelando...";
                    // MUDANÇA: O dinheiro não é estornado pro criador agora, ele continua retido.
                    // O status muda para aberto e a gente limpa os dados do trabalhador atual.
                    await updateDoc(doc(db, "servicos", id), { 
                        status: "aberto",
                        worker: "",
                        workerName: "",
                        workerPhone: ""
                    });
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

    // ==========================================
    // LÓGICA DO CHAT INTERNO (EM TEMPO REAL)
    // ==========================================
    function abrirChat(orderId, orderTitle) {
        const screenChat = document.getElementById('screen-chat');
        document.getElementById('chatTitle').innerText = orderTitle;
        screenChat.classList.remove('hidden');
        screenChat.classList.add('flex');

        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '<p class="text-center text-slate-400 mt-4">Carregando segurança Vizin...</p>';

        // Busca mensagens antigas e fica ouvindo as novas em tempo real
        const q = query(collection(db, "servicos", orderId, "mensagens"), orderBy("timestamp", "asc"));

        if(unsubscribeChat) unsubscribeChat();
        unsubscribeChat = onSnapshot(q, (snap) => {
            chatMessages.innerHTML = '';
            if(snap.empty) {
                chatMessages.innerHTML = '<p class="text-center text-slate-400 mt-4">Nenhuma mensagem ainda. Combine os detalhes por aqui!</p>';
            }
            snap.forEach(d => {
                const msg = d.data();
                const isMe = msg.senderId === auth.currentUser.uid;
                const align = isMe ? 'self-end bg-blue-600 text-white rounded-tr-none' : 'self-start bg-white border border-slate-200 text-slate-800 rounded-tl-none';
                
                chatMessages.innerHTML += `
                    <div class="max-w-[80%] p-3 rounded-2xl ${align} shadow-sm text-sm">
                        ${msg.text}
                    </div>
                `;
            });
            // Rola pro final sempre que chega mensagem
            chatMessages.scrollTo(0, chatMessages.scrollHeight);
        });

        // Enviar nova mensagem
        const btnSend = document.getElementById('btnSendChat');
        const input = document.getElementById('chatInput');

        // Remove listener antigo para não duplicar envios
        btnSend.replaceWith(btnSend.cloneNode(true));
        const newBtnSend = document.getElementById('btnSendChat');

        newBtnSend.onclick = async () => {
            const text = input.value.trim();
            if(!text) return;
            input.value = ''; // Limpa a caixa na hora
            await addDoc(collection(db, "servicos", orderId, "mensagens"), {
                text: text,
                senderId: auth.currentUser.uid,
                timestamp: serverTimestamp()
            });
        };

        // Fechar chat
        document.getElementById('btnCloseChat').onclick = () => {
            screenChat.classList.add('hidden');
            screenChat.classList.remove('flex');
            if(unsubscribeChat) unsubscribeChat(); // Para de gastar internet
        };
    }

    // ==========================================
    // AVALIAÇÃO E TRANSFERÊNCIA BANCÁRIA
    // ==========================================
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

    // ==========================================
    // NOVO PEDIDO (COBRANÇA)
    // ==========================================
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
                creatorId: auth.currentUser.uid, 
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