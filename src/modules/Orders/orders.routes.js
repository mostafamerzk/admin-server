import { Router } from 'express';
import {
  getOrders,
  getOrder,
  createOrder,
  updateOrderStatus
} from './orders.controller.js';
import { validation } from '../../middlewares/vakidation.middleware.js';
import { isAuthenticated } from '../../middlewares/auth.middleware.js';
import {
  createOrderSchema,
  getOrdersSchema,
  getOrderSchema,
  updateOrderStatusSchema
} from './orders.validation.js';

const router = Router();

/**
 * Orders Management Routes
 * Base path: /api/orders
 * All routes require authentication
 */

// @route   GET /api/orders
// @desc    Get all orders with pagination, search, and filtering
// @access  Private
router.get(
  '/',
  isAuthenticated,
  validation(getOrdersSchema, 'query'),
  getOrders
);

// @route   GET /api/orders/:id
// @desc    Get single order by ID
// @access  Private
router.get(
  '/:id',
  isAuthenticated,
  validation(getOrderSchema, 'params'),
  getOrder
);

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post(
  '/',
  isAuthenticated,
  validation(createOrderSchema),
  createOrder
);

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private
router.put(
  '/:id/status',
  isAuthenticated,
  validation(getOrderSchema, 'params'),
  validation(updateOrderStatusSchema, 'body'),
  updateOrderStatus
);

export default router;
