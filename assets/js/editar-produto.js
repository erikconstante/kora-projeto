// assets/js/editar-produto.js

// Importa o módulo de API centralizado para fazer as requisições
import { api } from './api.js'; 

document.addEventListener('DOMContentLoaded', function () {
    const editForm = document.getElementById('edit-product-form');
    const productNameInput = document.getElementById('product-name');
    const productDescInput = document.getElementById('product-description');
    const productPriceInput = document.getElementById('product-price');
    const statusOptions = document.querySelectorAll('input[name="status"]');
    const deleteButton = document.getElementById('delete-btn');
    const checkoutLinkInput = document.getElementById('checkout-link');
    const copyButton = document.querySelector('.btn-copy');
    const openCheckoutButton = document.querySelector('.btn-open-checkout');

    // Pega o ID do produto da URL para saber qual produto carregar/editar
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    let originalStatus = null; // guarda status carregado do backend

    // Se não houver ID na URL, redireciona de volta para a lista de produtos
    if (!productId) {
        alert('ID do produto não encontrado!');
        window.location.href = '../produtos/';
        return;
    }

    // Função para carregar os dados do produto e preencher o formulário
    async function loadProductData() {
        try {
            // Usa o módulo 'api' para buscar os dados do produto. Mais limpo e centralizado.
            const product = await api.get(`/produtos/${productId}`);

            // Preenche os campos do formulário com os dados recebidos
            productNameInput.value = product.name;
            productDescInput.value = product.description;
            productPriceInput.value = product.price;

            // Define o status do produto
            const currentStatus = product.status || 'Rascunho';
            originalStatus = currentStatus;
            const statusRadioButton = document.querySelector(`input[name="status"][value="${currentStatus}"]`);
            if (statusRadioButton) {
                statusRadioButton.checked = true;
            }

            // Atualiza UI do link conforme status
            updateCheckoutLinkUI();

        } catch (error) {
            console.error('Erro ao carregar dados do produto:', error);
            alert(`Não foi possível carregar os dados do produto: ${error.message}`);
            window.location.href = '../produtos/'; // Volta para a lista se der erro
        }
    }

    // Atualiza UI do link de checkout dependendo do status selecionado e do status salvo
    function updateCheckoutLinkUI() {
        const selected = document.querySelector('input[name="status"]:checked');
        const currentSelection = selected ? selected.value : 'Rascunho';
        const checkoutUrl = `${window.location.origin}/checkout/?productId=${productId}`;

        // Caso esteja realmente ativo e já salvo como ativo
        if (currentSelection === 'Ativo' && originalStatus === 'Ativo') {
            checkoutLinkInput.value = checkoutUrl;
            if (openCheckoutButton) {
                openCheckoutButton.disabled = false;
                openCheckoutButton.title = 'Abrir página de checkout';
            }
        } else if (currentSelection === 'Ativo' && originalStatus !== 'Ativo') {
            checkoutLinkInput.value = 'Salve para habilitar o checkout';
            if (openCheckoutButton) {
                openCheckoutButton.disabled = true;
                openCheckoutButton.title = 'Salve o produto como Ativo para habilitar';
            }
        } else { // Rascunho ou Inativo
            checkoutLinkInput.value = 'Indisponível (status não ativo)';
            if (openCheckoutButton) {
                openCheckoutButton.disabled = true;
                openCheckoutButton.title = 'Disponível somente quando status = Ativo';
            }
        }
    }

    statusOptions.forEach(r => {
        r.addEventListener('change', updateCheckoutLinkUI);
    });

    // Event listener para o envio do formulário (salvar as alterações)
    editForm.addEventListener('submit', async function (event) {
        event.preventDefault(); // Impede o recarregamento padrão da página

        const updatedProduct = {
            name: productNameInput.value.trim(),
            description: productDescInput.value.trim(),
            price: productPriceInput.value,
            status: document.querySelector('input[name="status"]:checked').value
        };

        // Simples validação no frontend
        if (!updatedProduct.name || !updatedProduct.price) {
            alert('Nome e preço são obrigatórios.');
            return;
        }

        try {
            // Usa o módulo 'api' para enviar os dados atualizados via método PUT
            await api.put(`/produtos/${productId}`, updatedProduct);

            alert('Produto atualizado com sucesso!');
            window.location.href = '../produtos/'; // Redireciona para a lista de produtos

        } catch (error) {
            console.error('Erro ao salvar produto:', error);
            alert(`Erro ao salvar: ${error.message}`);
        }
    });

    // Event listener para o botão de excluir
    deleteButton.addEventListener('click', async function () {
        if (confirm('Tem certeza de que deseja excluir este produto? Esta ação não pode ser desfeita.')) {
            try {
                // Usa o módulo 'api' para enviar a requisição de exclusão via método DELETE
                await api.del(`/produtos/${productId}`);

                alert('Produto excluído com sucesso!');
                window.location.href = '../produtos/'; // Redireciona para a lista

            } catch (error) {
                console.error('Erro ao excluir produto:', error);
                alert(`Erro ao excluir: ${error.message}`);
            }
        }
    });

    // Lógica para o botão de copiar o link de checkout
    if (copyButton) {
        copyButton.addEventListener('click', function () {
            checkoutLinkInput.select();
            checkoutLinkInput.setSelectionRange(0, 99999); // Para compatibilidade com mobile

            try {
                navigator.clipboard.writeText(checkoutLinkInput.value);

                // Feedback visual para o usuário
                const originalText = this.textContent;
                this.textContent = 'Copiado!';
                setTimeout(() => {
                    this.textContent = originalText;
                }, 2000); // Volta ao texto original após 2 segundos

            } catch (err) {
                console.error('Falha ao copiar o link: ', err);
                alert('Não foi possível copiar o link. Por favor, copie manualmente.');
            }
        });
    }

    // Lógica para o botão de abrir o checkout em nova guia
    if (openCheckoutButton) {
        openCheckoutButton.addEventListener('click', function () {
            if (this.disabled) return; // bloqueia se desabilitado
            const selected = document.querySelector('input[name="status"]:checked');
            if (!selected || selected.value !== 'Ativo' || originalStatus !== 'Ativo') {
                alert('O checkout só fica disponível após salvar o produto como Ativo.');
                return;
            }
            const url = `${window.location.origin}/checkout/?productId=${productId}`;
            window.open(url, '_blank', 'noopener');
        });
    }

    // Carrega os dados do produto assim que a página é carregada
    loadProductData();
});