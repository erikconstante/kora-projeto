// controllers/authController.js

import * as authService from '../services/authService.js';

export const handleRegister = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
        }
        await authService.registerUser(email, password);
        res.status(201).json({ message: 'Cadastro recebido! Verifique seu e-mail para ativar sua conta.' });
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
};

export const handleVerifyEmail = async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) {
            return res.status(400).json({ message: 'Token não fornecido.' });
        }
        await authService.verifyEmail(token);
        res.status(200).json({ message: 'E-mail verificado com sucesso! Sua conta foi ativada.' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const handleLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
        }
        const token = await authService.loginUser(email, password);
        res.status(200).json({ message: 'Login bem-sucedido!', token });
    } catch (error) {
        res.status(401).json({ message: error.message });
    }
};

export const handlePasswordResetRequest = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'O e-mail é obrigatório.' });
        }
        await authService.requestPasswordReset(email);
        res.status(200).json({ message: 'Se um usuário com este e-mail existir, um link foi enviado.' });
    } catch (error) {
        res.status(500).json({ message: 'Ocorreu um erro no servidor.' });
    }
};

export const handleResetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) {
            return res.status(400).json({ message: 'Token e nova senha são obrigatórios.' });
        }
        await authService.resetPassword(token, password);
        res.status(200).json({ message: 'Senha alterada com sucesso!' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};