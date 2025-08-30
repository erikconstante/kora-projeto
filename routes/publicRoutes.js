// routes/publicRoutes.js
import express from 'express';
// Você precisará criar o handler 'getPublic' no seu productController
import { getPublic } from '../controllers/productController.js';

const router = express.Router();

// A rota agora é apenas '/public/produto/:id' porque o '/api' já está no server.js
router.get('/public/produto/:id', getPublic);

export default router;