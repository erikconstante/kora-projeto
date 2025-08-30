import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Importa os arquivos de rotas que você criou
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import publicRoutes from './routes/publicRoutes.js'; // Vamos criar este para a rota pública

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

// 1. Inicializa o Express
const app = express();
const PORT = process.env.PORT || 3000; // Boa prática para implantação

// 2. Configura os Middlewares Globais
app.use(cors());
app.use(express.json()); // Middleware para interpretar o corpo das requisições como JSON

// 3. Delega as Rotas
// O Express usará o arquivo correspondente para qualquer rota que comece com '/api'
app.use('/api', authRoutes);      // Para rotas como /api/login, /api/cadastro
app.use('/api', productRoutes);   // Para rotas como /api/produtos
app.use('/api', publicRoutes);    // Para rotas como /api/public/produto/:id

// 4. Rota de Verificação (Health Check)
// Uma rota simples para saber se o servidor está no ar
app.get('/', (req, res) => {
  res.send('API da KORA está no ar!');
});

// 5. Inicia o Servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});