document.addEventListener('DOMContentLoaded', function () {
    const productNameEl = document.getElementById('product-name');
    const productPriceEl = document.getElementById('product-price');
    const totalPriceEl = document.getElementById('total-price');
    const paymentForm = document.getElementById('payment-form');


    // --- ADICIONE ESTE BLOCO NO SEU checkout.js ---

    // --- LÓGICA PARA TROCA DE ABAS DE PAGAMENTO ---
    const paymentMethodBtns = document.querySelectorAll('.payment-method-btn');
    const paymentContents = document.querySelectorAll('.payment-content');

    const submitButton = document.querySelector('#payment-form button[type="submit"]');

    function updateSubmitLabel() {
        // Identifica qual aba está ativa olhando o botão com classe 'active'
        const activeBtn = document.querySelector('.payment-method-btn.active');
        if (!activeBtn || !submitButton) return;
        const target = activeBtn.getAttribute('data-target');
        if (target === 'pix-content') {
            submitButton.textContent = 'Gerar Pix';
        } else if (target === 'boleto-content') {
            submitButton.textContent = 'Gerar Boleto';
        } else {
            submitButton.textContent = 'Finalizar Pagamento';
        }
    }

    paymentMethodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            paymentMethodBtns.forEach(b => b.classList.remove('active'));
            paymentContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
            updateSubmitLabel();
        });
    });
    // Inicializa label correta para o default (cartão de crédito)
    updateSubmitLabel();

    /**
     * Preenche o select de parcelas no cartão de crédito conforme o limite salvo.
     * @param {number} price - Preço total do produto.
     * @param {number} maxInstallments - Número máximo de parcelas permitidas.
     */
    function populateInstallments(price, maxInstallments) {
        const select = document.getElementById('installments');
        if (!select) return;
        select.innerHTML = '';
        const baseValue = Number(price);
        // Juros padrão: 2% ao mês em parcelamento acima de 1x
        const rate = 0.02;
        for (let i = 1; i <= maxInstallments; i++) {
            let totalWithInterest = baseValue;
            if (i > 1) {
                // Aplicar juros compostos: price * (1+rate)^i
                totalWithInterest = baseValue * Math.pow(1 + rate, i);
            }
            const installmentAmount = totalWithInterest / i;
            const formattedInstallment = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(installmentAmount);
            const formattedTotal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalWithInterest);
            const option = document.createElement('option');
            option.value = i;
            if (i === 1) {
                option.textContent = `1x de ${formattedInstallment}`;
            } else {
                option.textContent = `${i}x de ${formattedInstallment} (total ${formattedTotal})`;
            }
            select.appendChild(option);
        }
    }

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
            // Popula opções de parcelas para cartão de crédito
            populateInstallments(product.price, product.installments_limit);

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
            // Mensagem diferenciada conforme método
            const activeBtn = document.querySelector('.payment-method-btn.active');
            const target = activeBtn ? activeBtn.getAttribute('data-target') : '';
            if (target === 'pix-content') {
                alert('Pix gerado! (Simulação)');
            } else if (target === 'boleto-content') {
                alert('Boleto gerado! (Simulação)');
            } else {
                alert('Pagamento aprovado! (Simulação)');
            }
            submitButton.disabled = false;
            updateSubmitLabel();
        }, 2000);
    });

    // Inicia o carregamento dos dados
    fetchProductData();
});