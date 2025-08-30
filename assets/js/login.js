// assets/js/login.js

// Importa o nosso módulo de API para fazer a comunicação com o backend
import { api } from './api.js';

document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('login-form');

    if (loginForm) {
        loginForm.addEventListener('submit', async function (event) {
            event.preventDefault(); // Impede o envio padrão do formulário

            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const submitButton = this.querySelector('button[type="submit"]');

            if (!email || !password) {
                alert('Por favor, preencha o e-mail e a senha.');
                return;
            }

            // Desabilita o botão para evitar múltiplos cliques
            submitButton.disabled = true;
            submitButton.textContent = 'Entrando...';

            try {
                // Usa o módulo 'api' que já criamos. O código fica mais limpo e seguro.
                const data = await api.post('/login', { email, password });

                if (data.token) {
                    // Guarda o token no localStorage para ser usado em outras páginas
                    localStorage.setItem('kora_token', data.token);

                    // Redireciona para o dashboard em caso de sucesso
                    window.location.href = '../home-dashboard/';
                }
            } catch (error) {
                // O módulo 'api.js' já formata a mensagem de erro para nós
                alert(`Erro: ${error.message}`);
                
                // Reabilita o botão em caso de erro
                submitButton.disabled = false;
                submitButton.textContent = 'Entrar';
            }
        });
    }
});