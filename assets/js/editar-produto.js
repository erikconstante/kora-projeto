document.addEventListener('DOMContentLoaded', function () {
    const editForm = document.getElementById('edit-product-form');
    const productNameInput = document.getElementById('product-name');
    const productDescInput = document.getElementById('product-description');
    const productPriceInput = document.getElementById('product-price');
    const deleteButton = document.getElementById('delete-btn');

    // Pega o ID do produto da URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    const token = localStorage.getItem('kora_token');

    if (!productId) {
        alert('ID do produto não encontrado!');
        window.location.href = '../produtos/';
        return;
    }

    // Função para carregar os dados do produto e preencher o formulário
    async function loadProductData() {
        try {
            const response = await fetch(`http://localhost:3000/api/produtos/${productId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Não foi possível carregar os dados do produto.');
            }

            const product = await response.json();

            // Preenche os campos do formulário
            productNameInput.value = product.name;
            productDescInput.value = product.description;
            productPriceInput.value = product.price;

        } catch (error) {
            console.error('Erro:', error);
            alert(error.message);
            window.location.href = '../produtos/';
        }
    }

    // Event listener para salvar as alterações
    editForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        const updatedProduct = {
            name: productNameInput.value.trim(),
            description: productDescInput.value.trim(),
            price: productPriceInput.value
        };

        if (!updatedProduct.name || !updatedProduct.price) {
            alert('Nome e preço são obrigatórios.');
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/produtos/${productId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updatedProduct)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Falha ao salvar as alterações.');
            }

            alert('Produto atualizado com sucesso!');
            window.location.href = '../produtos/'; // Volta para a lista de produtos

        } catch (error) {
            console.error('Erro ao salvar:', error);
            alert(`Erro: ${error.message}`);
        }
    });

    // Carrega os dados do produto assim que a página é carregada
    loadProductData();

    // Event listener para o botão de excluir
    deleteButton.addEventListener('click', async function () {
        if (confirm('Tem certeza de que deseja excluir este produto? Esta ação não pode ser desfeita.')) {
            try {
                const response = await fetch(`http://localhost:3000/api/produtos/${productId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || 'Falha ao excluir o produto.');
                }

                alert('Produto excluído com sucesso!');
                window.location.href = '../produtos/'; // Volta para a lista de produtos

            } catch (error) {
                console.error('Erro ao excluir:', error);
                alert(`Erro: ${error.message}`);
            }
        }
    });
});