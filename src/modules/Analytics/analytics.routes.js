import { Router } from 'express';
import { 
  getDashboardStats, 
  getSalesData, 
  getUserGrowthData, 
  getCategoryDistribution 
} from './analytics.controller.js';
import { validation } from '../../middlewares/vakidation.middleware.js';
import { isAuthenticated } from '../../middlewares/auth.middleware.js';
import { periodSchema } from './analytics.validation.js';

const router = Router();

/**
 * Dashboard Analytics Routes
 * Base path: /api/dashboard
 */

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private
router.get('/stats', isAuthenticated, getDashboardStats);

// @route   GET /api/dashboard/sales
// @desc    Get sales data with period filtering
// @access  Private
router.get('/sales', isAuthenticated, validation(periodSchema), getSalesData);

// @route   GET /api/dashboard/user-growth
// @desc    Get user growth data with period filtering
// @access  Private
router.get('/user-growth', isAuthenticated, validation(periodSchema), getUserGrowthData);

// @route   GET /api/dashboard/category-distribution
// @desc    Get category distribution data
// @access  Private
router.get('/category-distribution', isAuthenticated, getCategoryDistribution);

export default router;
