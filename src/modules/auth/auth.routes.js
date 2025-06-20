import { Router } from 'express';
import { login, getMe, logout } from './auth.controller.js';
import { validation } from '../../middlewares/vakidation.middleware.js';
import { isAuthenticated } from '../../middlewares/auth.middleware.js';
import { loginSchema, getUserSchema } from './auth.validation.js';

const router = Router();

/**
 * Authentication Routes
 * Base path: /api/auth
 */

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validation(loginSchema), login);

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', isAuthenticated, getMe);

// @route   POST /api/auth/logout
// @desc    Logout user (invalidate token)
// @access  Private
router.post('/logout', isAuthenticated, logout);

export default router;
