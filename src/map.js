// ==========================================
    // LÓGICA DO NOVO PEDIDO
    // ==========================================
    const modalOrder = document.getElementById('modalNewOrder');

    // Abre o formulário
    document.getElementById('btnAddOrder').onclick = () => {
        modalOrder.classList.remove('hidden');
        modalOrder.classList.add('flex');
        if (map) map.dragging.disable(); // Trava o mapa para não arrastar
    };

    // Fecha o formulário
    document.getElementById('btnCloseOrderModal').onclick = () => {
        modalOrder.classList.add('hidden');
        modalOrder.classList.remove('flex');
        if (map) map.dragging.enable(); // Destrava o mapa
    };

    // Salvar o pedido no banco
    document.getElementById('btnSubmitOrder').onclick = async () => {
        const title = document.getElementById('orderTitle').value.trim();
        const desc = document.getElementById('orderDesc').value.trim();
        const value = document.getElementById('orderValue').value.trim();
        
        if (!title || !value) return alert("Preencha o título e o valor!");

        const btn = document.getElementById('btnSubmitOrder');
        btn.innerText = "Publicando...";
        btn.disabled = true;

        try {
            const center = map.getCenter();
            
            await addDoc(collection(db, "servicos"), {
                titulo: title,
                descricao: desc,
                valor: value,
                lat: center.lat,
                lng: center.lng,
                status: "aberto",
                autor: auth.currentUser.email,
                criadoEm: serverTimestamp()
            });

            document.getElementById('orderTitle').value = '';
            document.getElementById('orderDesc').value = '';
            document.getElementById('orderValue').value = '';
            
            modalOrder.classList.add('hidden');
            modalOrder.classList.remove('flex');
            if (map) map.dragging.enable(); // Destrava o mapa ao fechar
            
        } catch (error) {
            console.error("Erro ao criar pedido:", error);
            alert("Erro ao publicar o pedido.");
        } finally {
            btn.innerText = "Publicar Pedido";
            btn.disabled = false;
        }
    };