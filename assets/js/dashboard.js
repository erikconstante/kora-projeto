// assets/js/dashboard.js

// Importa o módulo de API centralizado
import { api } from './api.js';

// Proteção de rota: verifica se o token existe antes de tudo.
// Esta função é auto-executável (IIFE).
(function () {
    const token = localStorage.getItem('kora_token');
    if (!token) {
        // Redireciona para o login se não houver token.
        // A lógica original para ignorar páginas de autenticação foi mantida.
        const isAuthPage = window.location.pathname.includes('/login/') ||
            window.location.pathname.includes('/cadastro/');
        if (!isAuthPage) {
            window.location.href = '/login/';
        }
    }
})();

document.addEventListener('DOMContentLoaded', function () {
    // --- 1. SELEÇÃO DOS ELEMENTOS DO DOM ---
    const productsContainer = document.getElementById('products-container');
    const noProductsMessage = document.getElementById('no-products-message');
    const openModalBtn = document.getElementById('open-create-product-modal-btn');
    const modal = document.getElementById('create-product-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelBtn = document.getElementById('cancel-create-btn');
    const createProductForm = document.getElementById('create-product-form');
    const userProfileButton = document.querySelector('.user-profile-button');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    const logoutBtn = document.getElementById('logout-btn');

    // --- 2. FUNÇÕES AUXILIARES ---

    /**
     * Cria e retorna o elemento HTML para um único produto.
     * @param {object} product - O objeto do produto vindo da API.
     * @returns {HTMLElement} O elemento div do item do produto.
     */
    function createProductElement(product) {
        const productItem = document.createElement('div');
        productItem.className = 'product-item';

        const formattedPrice = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(product.price);
        
        // Assume um status padrão 'Rascunho' se não vier da API
        const status = product.status || 'Rascunho';
        const statusText = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
        const statusClass = status.toLowerCase().replace(/\s/g, '-');

        productItem.innerHTML = `
            <div class="product-name" data-label="Produto">
                <a href="../editar-produto/?id=${product.id}">${product.name}</a>
            </div>
            <div class="product-price" data-label="Preço">${formattedPrice}</div>
            <div class="product-status" data-label="Status">
                <span class="status-badge ${statusClass}">${statusText}</span>
            </div>
        `;
        return productItem;
    }

    /**
     * Busca os produtos da API e os renderiza na página.
     */
    async function fetchAndRenderProducts() {
        try {
            const products = await api.get('/produtos');
            
            // Limpa a lista atual antes de renderizar os novos
            productsContainer.innerHTML = ''; 

            if (products.length === 0) {
                noProductsMessage.style.display = 'block';
            } else {
                noProductsMessage.style.display = 'none';
                products.forEach(product => {
                    const productElement = createProductElement(product);
                    productsContainer.appendChild(productElement);
                });
            }
        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
            noProductsMessage.textContent = `Ocorreu um erro ao carregar seus produtos: ${error.message}`;
            noProductsMessage.style.display = 'block';
        }
    }

    // --- 3. LÓGICA DE EVENTOS (EVENT LISTENERS) ---

    /**
     * Inicializa todos os event listeners para a UI do dashboard (menus, etc).
     */
    function initUIEventListeners() {
        if (userProfileButton) {
            userProfileButton.addEventListener('click', (event) => {
                event.stopPropagation();
                dropdownMenu.classList.toggle('show');
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', (event) => {
                event.preventDefault();
                localStorage.removeItem('kora_token');
                window.location.href = '/login/';
            });
        }

        window.addEventListener('click', () => {
            if (dropdownMenu && dropdownMenu.classList.contains('show')) {
                dropdownMenu.classList.remove('show');
            }
        });
    }

    /**
     * Inicializa a lógica do modal para criação de produtos.
     */
    function initModalLogic() {
        if (!modal) return;

        const openModal = () => modal.classList.add('show');
        const closeModal = () => modal.classList.remove('show');

        if (openModalBtn) openModalBtn.addEventListener('click', openModal);
        if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
        if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

        modal.addEventListener('click', (event) => {
            if (event.target === modal) closeModal();
        });

        if (createProductForm) {
            createProductForm.addEventListener('submit', async function (e) {
                e.preventDefault();
                const submitButton = this.querySelector('button[type="submit"]');
                const productData = {
                    name: document.getElementById('product-name-modal').value.trim(),
                    description: document.getElementById('product-description-modal').value.trim(),
                    price: document.getElementById('product-price-modal').value
                };

                if (!productData.name || !productData.price) {
                    alert('Nome e Preço são campos obrigatórios.');
                    return;
                }

                submitButton.disabled = true;
                submitButton.textContent = 'Salvando...';

                try {
                    // O backend deve retornar o produto recém-criado
                    const newProduct = await api.post('/produtos', productData);

                    // Adiciona o novo produto à lista na UI sem recarregar a página
                    const productElement = createProductElement({ ...productData, id: newProduct.productId });
                    productsContainer.appendChild(productElement);
                    noProductsMessage.style.display = 'none';

                    alert('Produto criado com sucesso!');
                    closeModal();
                    this.reset();
                } catch (error) {
                    console.error('Erro ao criar produto:', error);
                    alert(`Erro: ${error.message}`);
                } finally {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Salvar Produto';
                }
            });
        }
    }

    // --- 4. INICIALIZAÇÃO ---
    
    // Garante que o container de produtos exista antes de tentar buscar os dados
    if (productsContainer) {
        fetchAndRenderProducts();
    }
    
    initUIEventListeners();
    initModalLogic();
});