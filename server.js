// Usando a sintaxe de ES Modules que escolhemos
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import dotenv from 'dotenv'; // IMPORTA O PACOTE DOTENV

// CARREGA AS VARIÁVEIS DO ARQUIVO .ENV
dotenv.config();

// 1. Inicializa o Express
const app = express();
const PORT = 3000;

// USA A VARIÁVEL DO .ENV
const JWT_SECRET = process.env.JWT_SECRET;

// 2. Configura os Middlewares
app.use(cors());
app.use(express.json());

// 3. Configuração da Conexão com o Banco de Dados (USANDO VARIÁVEIS DO .ENV)
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
};

const pool = mysql.createPool(dbConfig);

// 4. CONFIGURAÇÃO DO NODEMAILER (USANDO VARIÁVEIS DO .ENV)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});


// --- ROTAS PÚBLICAS (NÃO PRECISAM DE LOGIN) ---

// API DE CADASTRO DE USUÁRIO
app.post('/api/cadastro', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
    }
    try {
        const sqlFindUser = "SELECT * FROM users WHERE email = ?";
        const [existingUsers] = await pool.query(sqlFindUser, [email]);
        if (existingUsers.length > 0) {
            return res.status(409).json({ message: 'Este e-mail já está cadastrado.' });
        }
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const token = crypto.randomBytes(20).toString('hex');
        const expires = new Date(Date.now() + 3600000); // 1 hora
        await pool.query("DELETE FROM pending_users WHERE email = ?", [email]);
        const sqlInsertPending = "INSERT INTO pending_users (email, password, verification_token, token_expires) VALUES (?, ?, ?, ?)";
        await pool.query(sqlInsertPending, [email, hashedPassword, token, expires]);
        const verificationLink = `http://127.0.0.1:5500/verificacao/?token=${token}`;
        await transporter.sendMail({
            from: `"Plataforma KORA" <${process.env.EMAIL_USER}>`, // USA A VARIÁVEL AQUI TAMBÉM
            to: email,
            subject: 'Confirme seu Cadastro - Plataforma KORA',
            html: `<p>Bem-vindo à KORA! Por favor, clique no link abaixo para confirmar seu cadastro:</p><a href="${verificationLink}">${verificationLink}</a><p>Este link expira em 1 hora.</p>`
        });
        res.status(201).json({ message: 'Cadastro recebido! Por favor, verifique seu e-mail para ativar sua conta.' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Este e-mail já foi cadastrado e aguarda confirmação. Verifique sua caixa de entrada.' });
        }
        console.error('Erro no servidor:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

// ROTA PARA VERIFICAR O E-MAIL E COMPLETAR O CADASTRO
app.get('/api/verificar-email', async (req, res) => {
    const { token } = req.query;
    if (!token) {
        return res.status(400).json({ message: 'Token de verificação não fornecido.' });
    }
    try {
        const sqlFindPending = "SELECT * FROM pending_users WHERE verification_token = ? AND token_expires > NOW()";
        const [pendingUsers] = await pool.query(sqlFindPending, [token]);
        if (pendingUsers.length === 0) {
            return res.status(400).json({ message: 'Token de verificação inválido ou expirado.' });
        }
        const pendingUser = pendingUsers[0];
        const sqlInsertUser = "INSERT INTO users (email, password) VALUES (?, ?)";
        await pool.query(sqlInsertUser, [pendingUser.email, pendingUser.password]);
        const sqlDeletePending = "DELETE FROM pending_users WHERE email = ?";
        await pool.query(sqlDeletePending, [pendingUser.email]);
        res.status(200).json({ message: 'E-mail verificado com sucesso! Sua conta foi ativada.' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
             return res.status(409).json({ message: 'Este e-mail já foi verificado e a conta já está ativa.' });
        }
        console.error('Erro ao verificar e-mail:', error);
        res.status(500).json({ message: 'Ocorreu um problema ao verificar seu e-mail.' });
    }
});


// API DE LOGIN DE USUÁRIO
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
    }
    try {
        const sql = "SELECT * FROM users WHERE email = ?";
        const [users] = await pool.query(sql, [email]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado ou e-mail não verificado.' });
        }
        const user = users[0];
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Senha incorreta.' });
        }
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ message: 'Login bem-sucedido!', token: token });
    } catch (error) {
        console.error('Erro no servidor:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

// API DE REDEFINIÇÃO DE SENHA (PARTE 1: O PEDIDO)
app.post('/api/redefinir-senha', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'O e-mail é obrigatório.' });
    }
    try {
        const sqlFindUser = "SELECT * FROM users WHERE email = ?";
        const [users] = await pool.query(sqlFindUser, [email]);
        if (users.length > 0) {
            const token = crypto.randomBytes(20).toString('hex');
            const expires = new Date(Date.now() + 3600000); // 1 hora
            const sqlUpdateToken = "UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?";
            await pool.query(sqlUpdateToken, [token, expires, email]);
            const resetLink = `http://127.0.0.1:5500/alterar-senha/?token=${token}`;
            await transporter.sendMail({
                from: `"Plataforma KORA" <${process.env.EMAIL_USER}>`, // USA A VARIÁVEL AQUI TAMBÉM
                to: email,
                subject: 'Redefinição de Senha - Plataforma KORA',
                html: `<p>Você solicitou uma redefinição de senha. Clique no link abaixo para criar uma nova senha:</p><a href="${resetLink}">${resetLink}</a><p>Este link expira em 1 hora.</p>`
            });
        }
        res.status(200).json({ message: 'Se um usuário com este e-mail existir, um link de redefinição foi enviado.' });
    } catch (error) {
        console.error('Erro no servidor ao redefinir senha:', error);
        res.status(200).json({ message: 'Se um usuário com este e-mail existir, um link de redefinição foi enviado.' });
    }
});

// API DE REDEFINIÇÃO DE SENHA (PARTE 2: A TROCA)
app.post('/api/alterar-senha', async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) {
        return res.status(400).json({ message: 'Token e nova senha são obrigatórios.' });
    }
    try {
        const sqlFindUser = "SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW()";
        const [users] = await pool.query(sqlFindUser, [token]);
        if (users.length === 0) {
            return res.status(400).json({ message: 'Token inválido ou expirado.' });
        }
        const user = users[0];
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const sqlUpdatePass = "UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?";
        await pool.query(sqlUpdatePass, [hashedPassword, user.id]);
        res.status(200).json({ message: 'Senha alterada com sucesso!' });
    } catch (error) {
        console.error('Erro no servidor ao alterar senha:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});


// --- LÓGICA DE AUTENTICAÇÃO E ROTAS PROTEGIDAS ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

app.get('/api/dashboard', authenticateToken, (req, res) => {
    res.json({ message: `Bem-vindo ao seu dashboard, usuário com ID: ${req.user.id}!` });
});

// --- NOVAS ROTAS PARA PRODUTOS ---

// ROTA PARA CRIAR UM NOVO PRODUTO (PROTEGIDA)
app.post('/api/produtos', authenticateToken, async (req, res) => {
    const { name, description, price } = req.body;
    const userId = req.user.id; // Pegamos o ID do usuário do token JWT

    if (!name || !price) {
        return res.status(400).json({ message: 'Nome e preço são obrigatórios.' });
    }

    try {
        const sql = "INSERT INTO products (user_id, name, description, price) VALUES (?, ?, ?, ?)";
        const [result] = await pool.query(sql, [userId, name, description, price]);
        res.status(201).json({ message: 'Produto criado com sucesso!', productId: result.insertId });
    } catch (error) {
        console.error('Erro ao criar produto:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

// ROTA PARA LISTAR OS PRODUTOS DO USUÁRIO LOGADO (PROTEGIDA)
app.get('/api/produtos', authenticateToken, async (req, res) => {
    const userId = req.user.id; // Pegamos o ID do usuário do token JWT

    try {
        const sql = "SELECT * FROM products WHERE user_id = ?";
        const [products] = await pool.query(sql, [userId]);
        res.status(200).json(products);
    } catch (error) {
        console.error('Erro ao listar produtos:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});


// Rota de Teste
app.get('/', (req, res) => {
  res.send('Servidor KORA no ar!');
});

// Inicia o Servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

// Adicione esta rota no seu server.js

// ROTA PARA BUSCAR UM ÚNICO PRODUTO POR ID (PROTEGIDA)
app.get('/api/produtos/:id', authenticateToken, async (req, res) => {
    const { id } = req.params; // Pega o ID da URL
    const userId = req.user.id;

    try {
        const sql = "SELECT * FROM products WHERE id = ? AND user_id = ?";
        const [products] = await pool.query(sql, [id, userId]);

        if (products.length === 0) {
            return res.status(404).json({ message: 'Produto não encontrado ou você não tem permissão para vê-lo.' });
        }

        res.status(200).json(products[0]); // Retorna apenas o primeiro (e único) resultado
    } catch (error) {
        console.error('Erro ao buscar produto:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

// ROTA PARA ATUALIZAR UM PRODUTO (PROTEGIDA)
app.put('/api/produtos/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { name, description, price } = req.body;
    const userId = req.user.id;

    if (!name || !price) {
        return res.status(400).json({ message: 'Nome e preço são obrigatórios.' });
    }

    try {
        const sql = "UPDATE products SET name = ?, description = ?, price = ? WHERE id = ? AND user_id = ?";
        const [result] = await pool.query(sql, [name, description, price, id, userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Produto não encontrado ou você não tem permissão para editá-lo.' });
        }

        res.status(200).json({ message: 'Produto atualizado com sucesso!' });
    } catch (error) {
        console.error('Erro ao atualizar produto:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

// ROTA PARA EXCLUIR UM PRODUTO (PROTEGIDA)
app.delete('/api/produtos/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const sql = "DELETE FROM products WHERE id = ? AND user_id = ?";
        const [result] = await pool.query(sql, [id, userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Produto não encontrado ou você não tem permissão para excluí-lo.' });
        }

        res.status(200).json({ message: 'Produto excluído com sucesso!' });
    } catch (error) {
        console.error('Erro ao excluir produto:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});