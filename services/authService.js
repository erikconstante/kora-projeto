// services/authService.js

import pool from '../config/database.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/emailSender.js'; // Vamos criar este arquivo também

const saltRounds = 10;
const JWT_SECRET = process.env.JWT_SECRET;

export const registerUser = async (email, password) => {
    const existingUser = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (existingUser[0].length > 0) {
        throw new Error('Este e-mail já está cadastrado.');
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const token = crypto.randomBytes(20).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hora

    await pool.query("DELETE FROM pending_users WHERE email = ?", [email]);
    const sqlInsertPending = "INSERT INTO pending_users (email, password, verification_token, token_expires) VALUES (?, ?, ?, ?)";
    await pool.query(sqlInsertPending, [email, hashedPassword, token, expires]);

    await sendVerificationEmail(email, token);
};

export const verifyEmail = async (token) => {
    const [pendingUsers] = await pool.query("SELECT * FROM pending_users WHERE verification_token = ? AND token_expires > NOW()", [token]);
    if (pendingUsers.length === 0) {
        throw new Error('Token de verificação inválido ou expirado.');
    }

    const pendingUser = pendingUsers[0];
    await pool.query("INSERT INTO users (email, password) VALUES (?, ?)", [pendingUser.email, pendingUser.password]);
    await pool.query("DELETE FROM pending_users WHERE email = ?", [pendingUser.email]);
};

export const loginUser = async (email, password) => {
    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0) {
        throw new Error('Usuário não encontrado ou e-mail não verificado.');
    }

    const user = users[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
        throw new Error('Senha incorreta.');
    }

    const authToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    return authToken;
};

export const requestPasswordReset = async (email) => {
    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length > 0) {
        const token = crypto.randomBytes(20).toString('hex');
        const expires = new Date(Date.now() + 3600000); // 1 hora
        await pool.query("UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?", [token, expires, email]);
        await sendPasswordResetEmail(email, token);
    }
};

export const resetPassword = async (token, password) => {
    const [users] = await pool.query("SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW()", [token]);
    if (users.length === 0) {
        throw new Error('Token inválido ou expirado.');
    }

    const user = users[0];
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    await pool.query("UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?", [hashedPassword, user.id]);
};