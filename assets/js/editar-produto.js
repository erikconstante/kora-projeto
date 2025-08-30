// assets/js/editar-produto.js

// Importa o módulo de API centralizado para fazer as requisições
import { api } from './api.js'; 

document.addEventListener('DOMContentLoaded', function () {
    const editForm = document.getElementById('edit-product-form');
    const productNameInput = document.getElementById('product-name');
    const productDescInput = document.getElementById('product-description');
    const productPriceInput = document.getElementById('product-price');
    const deleteButton = document.getElementById('delete-btn');
    const checkoutLinkInput = document.getElementById('checkout-link');
    const copyButton = document.querySelector('.btn-copy');

    // Pega o ID do produto da URL para saber qual produto carregar/editar
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

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

            // Gera e exibe o link de checkout
            const checkoutUrl = `${window.location.origin}/checkout/?productId=${productId}`;
            checkoutLinkInput.value = checkoutUrl;

        } catch (error) {
            console.error('Erro ao carregar dados do produto:', error);
            alert(`Não foi possível carregar os dados do produto: ${error.message}`);
            window.location.href = '../produtos/'; // Volta para a lista se der erro
        }
    }

    // Event listener para o envio do formulário (salvar as alterações)
    editForm.addEventListener('submit', async function (event) {
        event.preventDefault(); // Impede o recarregamento padrão da página

        const updatedProduct = {
            name: productNameInput.value.trim(),
            description: productDescInput.value.trim(),
            price: productPriceInput.value
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

    // Carrega os dados do produto assim que a página é carregada
    loadProductData();
});