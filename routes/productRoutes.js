// routes/productRoutes.js

import express from 'express';
import * as productController from '../controllers/productController.js';
import authenticateToken from '../middleware/authMiddleware.js';

const router = express.Router();

// APLICANDO O MIDDLEWARE DE AUTENTICAÇÃO PARA TODAS AS ROTAS DE PRODUTOS ABAIXO
// Qualquer rota que comece com /produtos vai exigir um token válido.
router.use('/produtos', authenticateToken);

// Agrupa as rotas que operam no endpoint '/produtos'
router.route('/produtos')
    .post(productController.create)    // POST /api/produtos -> Cria um novo produto
    .get(productController.getAll);     // GET /api/produtos -> Lista todos os produtos do usuário

// Agrupa as rotas que operam em um produto específico via '/produtos/:id'
router.route('/produtos/:id')
    .get(productController.getOne)      // GET /api/produtos/:id -> Busca um produto
    .put(productController.update)      // PUT /api/produtos/:id -> Atualiza um produto
    .delete(productController.remove);  // DELETE /api/produtos/:id -> Exclui um produto

export default router;