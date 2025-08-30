// routes/authRoutes.js

import express from 'express';
import * as authController from '../controllers/authController.js';

const router = express.Router();

router.post('/cadastro', authController.handleRegister);
router.get('/verificar-email', authController.handleVerifyEmail);
router.post('/login', authController.handleLogin);
router.post('/redefinir-senha', authController.handlePasswordResetRequest);
router.post('/alterar-senha', authController.handleResetPassword);

export default router;