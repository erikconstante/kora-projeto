// utils/emailSender.js

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export const sendVerificationEmail = async (email, token) => {
    const verificationLink = `http://127.0.0.1:5500/verificacao/?token=${token}`;
    await transporter.sendMail({
        from: `"Plataforma KORA" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Confirme seu Cadastro - Plataforma KORA',
        html: `<p>Bem-vindo à KORA! Por favor, clique no link abaixo para confirmar seu cadastro:</p><a href="${verificationLink}">${verificationLink}</a><p>Este link expira em 1 hora.</p>`
    });
};

export const sendPasswordResetEmail = async (email, token) => {
    const resetLink = `http://127.0.0.1:5500/alterar-senha/?token=${token}`;
    await transporter.sendMail({
        from: `"Plataforma KORA" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Redefinição de Senha - Plataforma KORA',
        html: `<p>Você solicitou uma redefinição de senha. Clique no link abaixo para criar uma nova senha:</p><a href="${resetLink}">${resetLink}</a><p>Este link expira em 1 hora.</p>`
    });
};