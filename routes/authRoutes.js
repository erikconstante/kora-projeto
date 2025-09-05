// routes/authRoutes.js

import express from 'express';
import * as authController from '../controllers/authController.js';
import authenticateToken from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/cadastro', authController.handleRegister);
router.get('/verificar-email', authController.handleVerifyEmail);
router.post('/login', authController.handleLogin);
router.post('/redefinir-senha', authController.handlePasswordResetRequest);
router.post('/alterar-senha', authController.handleResetPassword);
// Protected route to fetch user profile
router.get('/perfil', authenticateToken, authController.handleGetProfile);

export default router;