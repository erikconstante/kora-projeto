// Proteção de rota: verifica se o token existe
(function () {
    const token = localStorage.getItem('kora_token');
    if (!token) {
        const isAuthPage = window.location.pathname.includes('/login/') ||
            window.location.pathname.includes('/cadastro/') ||
            window.location.pathname.includes('/redefinir-senha/') ||
            window.location.pathname.includes('/alterar-senha/');
        if (!isAuthPage) {
            // A LINHA ABAIXO FOI CORRIGIDA
            window.location.href = '/login/';
        }
    }
})();

document.addEventListener('DOMContentLoaded', function () {
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    const userProfileButton = document.querySelector('.user-profile-button');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    const logoutBtn = document.getElementById('logout-btn');

    // Lógica do menu lateral mobile
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', (event) => {
            event.stopPropagation();
            if (dropdownMenu && dropdownMenu.classList.contains('show')) {
                dropdownMenu.classList.remove('show');
            }
            sidebar.classList.toggle('active');
        });
        mainContent.addEventListener('click', () => {
            if (sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
            }
        });
        const sidebarLinks = document.querySelectorAll('.sidebar-menu a');
        sidebarLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (sidebar.classList.contains('active')) {
                    sidebar.classList.remove('active');
                }
            });
        });
    }

    // Lógica para Dropdown e Logout
    if (userProfileButton && dropdownMenu) {
        userProfileButton.addEventListener('click', (event) => {
            event.stopPropagation();
            if (sidebar && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
            }
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

    // Lógica para fechar dropdowns abertos ao clicar fora
    window.addEventListener('click', () => {
        if (dropdownMenu && dropdownMenu.classList.contains('show')) {
            dropdownMenu.classList.remove('show');
        }
        document.querySelectorAll('.actions-dropdown.show').forEach(dropdown => {
            dropdown.classList.remove('show');
        });
    });

    // --- LÓGICA ATUALIZADA PARA LISTAR PRODUTOS ---
    const productsContainer = document.getElementById('products-container');
    const noProductsMessage = document.getElementById('no-products-message');
    if (productsContainer) {
        const token = localStorage.getItem('kora_token');
        fetch('http://localhost:3000/api/produtos', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(response => {
                if (response.status === 401 || response.status === 403) {
                    window.location.href = '/login/';
                    return;
                }
                if (!response.ok) {
                    throw new Error('Não foi possível buscar os produtos.');
                }
                return response.json();
            })
            .then(products => {
                if (!products) return;
                if (products.length === 0) {
                    noProductsMessage.style.display = 'block';
                } else {
                    products.forEach(product => {
                        const productItem = document.createElement('div');
                        productItem.className = 'product-item';
                        const formattedPrice = new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                        }).format(product.price);
                        const statusText = product.status.charAt(0).toUpperCase() + product.status.slice(1).toLowerCase();
                        const statusClass = product.status.toLowerCase().replace(/\s/g, '-');
                        
                        productItem.innerHTML = `
                            <div class="product-name" data-label="Produto">
                                <a href="../editar-produto/?id=${product.id}">${product.name}</a>
                            </div>
                            <div class="product-price" data-label="Preço">${formattedPrice}</div>
                            <div class="product-status" data-label="Status">
                                <span class="status-badge ${statusClass}">${statusText}</span>
                            </div>
                        `;
                        productsContainer.appendChild(productItem);
                    });
                }
            })
            .catch(error => {
                console.error('Erro:', error);
                noProductsMessage.textContent = 'Ocorreu um erro ao carregar seus produtos.';
                noProductsMessage.style.display = 'block';
            });
    }

    // --- NOVA LÓGICA PARA O MODAL DE CRIAÇÃO DE PRODUTO ---
    const openModalBtn = document.getElementById('open-create-product-modal-btn');
    const modal = document.getElementById('create-product-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelBtn = document.getElementById('cancel-create-btn');
    const createProductForm = document.getElementById('create-product-form');

    // Função para abrir o modal
    const openModal = () => {
        if (modal) modal.classList.add('show');
    };

    // Função para fechar o modal
    const closeModal = () => {
        if (modal) modal.classList.remove('show');
    };

    // Adiciona eventos aos botões
    if (openModalBtn) openModalBtn.addEventListener('click', openModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    // Fecha o modal se clicar fora dele (na área escura)
    if (modal) {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModal();
            }
        });
    }

    // Lógica para submeter o formulário de criação
    if (createProductForm) {
        createProductForm.addEventListener('submit', async function (e) {
            e.preventDefault(); // Impede o recarregamento da página
            const submitButton = this.querySelector('button[type="submit"]');
            const name = document.getElementById('product-name').value.trim();
            const description = document.getElementById('product-description').value.trim();
            const price = document.getElementById('product-price').value;
            if (!name || !price) {
                alert('Nome e Preço são campos obrigatórios.');
                return;
            }
            const productData = { name, description, price };
            const token = localStorage.getItem('kora_token');
            submitButton.disabled = true;
            submitButton.textContent = 'Salvando...';
            try {
                const response = await fetch('http://localhost:3000/api/produtos', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(productData)
                });
                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.message || 'Falha ao criar o produto.');
                }
                alert('Produto criado com sucesso!');
                closeModal();
                this.reset();
                window.location.reload();
            } catch (error) {
                console.error('Erro ao criar produto:', error);
                alert(`Erro: ${error.message}`);
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Salvar Produto';
            }
        });
    }
});