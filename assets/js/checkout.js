document.addEventListener('DOMContentLoaded', function () {
    const productNameEl = document.getElementById('product-name');
    const productPriceEl = document.getElementById('product-price');
    const totalPriceEl = document.getElementById('total-price');
    const paymentForm = document.getElementById('payment-form');


    // --- ADICIONE ESTE BLOCO NO SEU checkout.js ---

    // --- LÓGICA PARA TROCA DE ABAS DE PAGAMENTO ---
    const paymentMethodBtns = document.querySelectorAll('.payment-method-btn');
    const paymentContents = document.querySelectorAll('.payment-content');

    paymentMethodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove a classe 'active' de todos os botões e conteúdos
            paymentMethodBtns.forEach(b => b.classList.remove('active'));
            paymentContents.forEach(c => c.classList.remove('active'));

            // Adiciona a classe 'active' ao botão clicado
            btn.classList.add('active');

            // Mostra o conteúdo correspondente
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });

    // Pega o ID do produto da URL (ex: ?productId=1)
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('productId');

    if (!productId) {
        productNameEl.textContent = 'Produto não encontrado!';
        return;
    }

    // Função para buscar os dados do produto na nossa nova API pública
    async function fetchProductData() {
        try {
            const response = await fetch(`http://localhost:3000/api/public/produto/${productId}`);
            if (!response.ok) {
                throw new Error('Produto indisponível.');
            }
            const product = await response.json();

            // Formata o preço para o padrão brasileiro
            const formattedPrice = new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            }).format(product.price);

            // Preenche os dados na tela
            productNameEl.textContent = product.name;
            productPriceEl.textContent = formattedPrice;
            totalPriceEl.textContent = formattedPrice;

            // Caso backend no futuro exponha status aqui, já tratamos (defensivo)
            if (product.status && product.status !== 'Ativo') {
                applyInactiveState(product.status);
            }

        } catch (error) {
            console.error('Erro:', error);
            productNameEl.textContent = error.message;
            applyInactiveState();
        }
    }

    function applyInactiveState(statusLabel) {
        const submitBtn = paymentForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.classList.add('disabled');
        submitBtn.textContent = 'Indisponível';
        const noticeId = 'inactive-product-notice';
        if (!document.getElementById(noticeId)) {
            const msg = document.createElement('div');
            msg.id = noticeId;
            msg.style.marginTop = '18px';
            msg.style.padding = '14px 16px';
            msg.style.border = '1px solid #f1c5c5';
            msg.style.borderRadius = '8px';
            msg.style.background = '#ffecec';
            msg.style.color = '#8a1f1f';
            msg.style.fontSize = '.85rem';
            msg.style.fontWeight = '600';
            msg.style.lineHeight = '1.4';
            msg.textContent = statusLabel === 'Inativo' || statusLabel === 'Rascunho'
                ? 'Este produto não está ativo. Pagamentos temporariamente bloqueados.'
                : 'Produto indisponível para pagamento.';
            paymentForm.appendChild(msg);
        }
    }

    // Lida com o envio do formulário (por enquanto, apenas simulação)
    paymentForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const submitButton = this.querySelector('button[type="submit"]');
        if (submitButton.disabled) {
            return; // bloqueado
        }
        submitButton.disabled = true;
        submitButton.textContent = 'Processando...';

        // Simulação de processamento
        setTimeout(() => {
            alert('Pagamento aprovado! (Simulação)');
            submitButton.disabled = false;
            submitButton.textContent = 'Finalizar Pagamento';
        }, 2000);
    });

    // Inicia o carregamento dos dados
    fetchProductData();
});