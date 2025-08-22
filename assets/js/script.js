document.addEventListener('DOMContentLoaded', function () {

    // LÓGICA PARA SOMBRA NO HEADER AO ROLAR A PÁGINA
    const header = document.querySelector('.main-header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    // LÓGICA PARA MENU HAMBÚRGUER E TRAVA DE ROLAGEM
    const hamburger = document.querySelector('.hamburger-menu');
    const mobileMenu = document.querySelector('.mobile-menu');
    const bodyElement = document.body;

    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
            if (mobileMenu.classList.contains('active')) {
                bodyElement.classList.add('scroll-lock');
            } else {
                bodyElement.classList.remove('scroll-lock');
            }
        });
        const mobileNavLinks = document.querySelectorAll('.mobile-menu a');
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (mobileMenu.classList.contains('active')) {
                    mobileMenu.classList.remove('active');
                    bodyElement.classList.remove('scroll-lock');
                }
            });
        });
    }

    // LÓGICA PARA O ACORDEÃO DO FAQ
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                }
            });
            item.classList.toggle('active');
        });
    });

    // LÓGICA PARA SCROLL SUAVE
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === "#") return;
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerOffset = document.querySelector('.main-header')?.offsetHeight || 0;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                window.scrollTo({ top: offsetPosition, behavior: "smooth" });
            }
        });
    });

    // --- LÓGICA PARA VALIDAÇÃO DO FORMULÁRIO DE CADASTRO (ATUALIZADA) ---
    const cadastroForm = document.querySelector('#cadastro-form');
    if (cadastroForm) {
        const emailInput = document.querySelector('#email');
        const emailConfirmInput = document.querySelector('#email-confirm');
        const passwordInput = document.querySelector('#password');
        const submitBtn = document.querySelector('#submit-btn');
        const emailError = document.querySelector('#email-error');
        const criteria = {
            length: document.querySelector('#length'),
            uppercase: document.querySelector('#uppercase'),
            lowercase: document.querySelector('#lowercase'),
            number: document.querySelector('#number')
        };
        let passwordIsValid = false;
        let emailsAreValid = false;

        function validatePassword() {
            const value = passwordInput.value;
            const validations = {
                length: value.length >= 8,
                uppercase: /[A-Z]/.test(value),
                lowercase: /[a-z]/.test(value),
                number: /[0-9]/.test(value)
            };
            criteria.length.classList.toggle('valid', validations.length);
            criteria.uppercase.classList.toggle('valid', validations.uppercase);
            criteria.lowercase.classList.toggle('valid', validations.lowercase);
            criteria.number.classList.toggle('valid', validations.number);
            passwordIsValid = Object.values(validations).every(Boolean);
            checkFormValidity();
        }

        function validateEmails() {
            const emailValue = emailInput.value.trim();
            const emailConfirmValue = emailConfirmInput.value.trim();
            if (emailValue && emailConfirmValue) {
                if (emailValue !== emailConfirmValue) {
                    emailError.style.display = 'block';
                    emailConfirmInput.classList.add('input-error');
                    emailsAreValid = false;
                } else {
                    emailError.style.display = 'none';
                    emailConfirmInput.classList.remove('input-error');
                    emailsAreValid = true;
                }
            } else {
                emailError.style.display = 'none';
                emailConfirmInput.classList.remove('input-error');
                emailsAreValid = false;
            }
            checkFormValidity();
        }

        function checkFormValidity() {
            submitBtn.disabled = !(passwordIsValid && emailsAreValid);
        }

        submitBtn.disabled = true;
        emailInput.addEventListener('input', validateEmails);
        emailConfirmInput.addEventListener('input', validateEmails);
        passwordInput.addEventListener('input', validatePassword);

        cadastroForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            if (submitBtn.disabled) {
                alert("Por favor, corrija os erros no formulário antes de continuar.");
                return;
            }
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            try {
                const response = await fetch('http://localhost:3000/api/cadastro', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });
                const data = await response.json();

                if (response.ok) {
                    alert(data.message);
                    cadastroForm.reset();
                    validateEmails();
                    validatePassword();
                } else {
                    alert(`Erro: ${data.message}`);
                }
            } catch (error) {
                console.error('Erro ao conectar com o servidor:', error);
                alert('Não foi possível conectar ao servidor. Tente novamente mais tarde.');
            }
        });
    }
    
    // --- NOVA LÓGICA PARA A PÁGINA DE VERIFICAÇÃO ---
    const statusMessageElement = document.getElementById('status-message');
    if (statusMessageElement) {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const statusSubtitle = document.getElementById('status-subtitle');
        const loginButtonContainer = document.getElementById('login-button-container');

        if (!token) {
            statusMessageElement.textContent = 'Token não encontrado!';
            statusSubtitle.textContent = 'O link que você usou parece estar incompleto.';
        } else {
            fetch(`http://localhost:3000/api/verificar-email?token=${token}`)
                .then(response => response.json().then(data => ({ ok: response.ok, data })))
                .then(({ ok, data }) => {
                    statusMessageElement.textContent = data.message;
                    if (ok) {
                        loginButtonContainer.style.display = 'block';
                    } else {
                         statusSubtitle.textContent = 'Por favor, tente se cadastrar novamente.';
                    }
                })
                .catch(err => {
                    console.error(err);
                    statusMessageElement.textContent = 'Erro ao verificar o e-mail.';
                    statusSubtitle.textContent = 'Não foi possível conectar ao servidor.';
                });
        }
    }


    // --- LÓGICA PARA VALIDAÇÃO DO FORMULÁRIO DE ALTERAR SENHA ---
    const alterarSenhaForm = document.querySelector('#alterar-senha-form');
    if (alterarSenhaForm) {
        const newPasswordInput = document.querySelector('#new-password');
        const confirmPasswordInput = document.querySelector('#confirm-password');
        const submitBtn = document.querySelector('#submit-btn');
        const passwordError = document.querySelector('#password-error');
        const criteria = {
            length: document.querySelector('#length'),
            uppercase: document.querySelector('#uppercase'),
            lowercase: document.querySelector('#lowercase'),
            number: document.querySelector('#number')
        };
        let isPasswordStrong = false;
        let doPasswordsMatch = false;

        function validateNewPassword() {
            const value = newPasswordInput.value;
            const validations = {
                length: value.length >= 8,
                uppercase: /[A-Z]/.test(value),
                lowercase: /[a-z]/.test(value),
                number: /[0-9]/.test(value)
            };
            criteria.length.classList.toggle('valid', validations.length);
            criteria.uppercase.classList.toggle('valid', validations.uppercase);
            criteria.lowercase.classList.toggle('valid', validations.lowercase);
            criteria.number.classList.toggle('valid', validations.number);
            isPasswordStrong = Object.values(validations).every(Boolean);
            checkFormValidity();
        }

        function validatePasswordConfirmation() {
            const newPasswordValue = newPasswordInput.value;
            const confirmPasswordValue = confirmPasswordInput.value;
            if (newPasswordValue && confirmPasswordValue) {
                if (newPasswordValue !== confirmPasswordValue) {
                    passwordError.style.display = 'block';
                    confirmPasswordInput.classList.add('input-error');
                    doPasswordsMatch = false;
                } else {
                    passwordError.style.display = 'none';
                    confirmPasswordInput.classList.remove('input-error');
                    doPasswordsMatch = true;
                }
            } else {
                passwordError.style.display = 'none';
                confirmPasswordInput.classList.remove('input-error');
                doPasswordsMatch = false;
            }
            checkFormValidity();
        }

        function checkFormValidity() {
            submitBtn.disabled = !(isPasswordStrong && doPasswordsMatch);
        }

        submitBtn.disabled = true;
        newPasswordInput.addEventListener('input', validateNewPassword);
        newPasswordInput.addEventListener('input', validatePasswordConfirmation);
        confirmPasswordInput.addEventListener('input', validatePasswordConfirmation);

        alterarSenhaForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            if (submitBtn.disabled) {
                alert("Por favor, verifique se a senha atende a todos os critérios e se os campos coincidem.");
                return;
            }
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get('token');
            if (!token) {
                alert('Token de redefinição não encontrado. Por favor, solicite um novo link.');
                return;
            }
            const password = newPasswordInput.value;
            try {
                const response = await fetch('http://localhost:3000/api/alterar-senha', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: token, password: password }),
                });
                const data = await response.json();
                if (response.ok) {
                    showSuccessNotification();
                    setTimeout(() => {
                        window.location.href = '../login/';
                    }, 3500);
                } else {
                    alert(`Erro: ${data.message}`);
                }
            } catch (error) {
                console.error('Erro ao conectar com o servidor:', error);
                alert('Não foi possível conectar ao servidor.');
            }
        });
    }

    // --- LÓGICA PARA NOTIFICAÇÃO DE SUCESSO ---
    const successNotification = document.getElementById('success-notification');
    function showSuccessNotification() {
        if (successNotification) {
            successNotification.classList.add('show');
            setTimeout(() => {
                successNotification.classList.remove('show');
            }, 3000);
        }
    }
    
    // Conecta o formulário de redefinir senha ao backend
    const redefinirSenhaForm = document.querySelector('#redefinir-senha-form');
    if (redefinirSenhaForm) {
        redefinirSenhaForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const emailInput = this.querySelector('input[type="email"]');
            const button = this.querySelector('button[type="submit"]');
            const email = emailInput.value.trim();
            if (!email) {
                alert('Por favor, preencha seu e-mail.');
                return;
            }
            button.disabled = true;
            button.textContent = 'Enviando...';
            try {
                await fetch('http://localhost:3000/api/redefinir-senha', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email }),
                });
                showSuccessNotification();
            } catch (error) {
                console.error('Erro ao conectar com o servidor:', error);
                alert('Não foi possível conectar ao servidor. Tente novamente mais tarde.');
            } finally {
                button.disabled = false;
                button.textContent = 'Redefinir senha';
            }
        });
    }
    
});