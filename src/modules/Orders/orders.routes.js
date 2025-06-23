import { Router } from 'express';
import {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
  updateOrderStatus,
  approveOrder,
  rejectOrder,
  completeOrder
} from './orders.controller.js';
import { validation } from '../../middlewares/vakidation.middleware.js';
import { isAuthenticated } from '../../middlewares/auth.middleware.js';
import {
  createOrderSchema,
  getOrdersSchema,
  getOrderSchema,
  updateOrderSchema,
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

// @route   PUT /api/orders/:id
// @desc    Update order
// @access  Private
router.put(
  '/:id',
  isAuthenticated,
  validation(getOrderSchema, 'params'),
  validation(updateOrderSchema, 'body'),
  updateOrder
);

// @route   DELETE /api/orders/:id
// @desc    Delete order
// @access  Private
router.delete(
  '/:id',
  isAuthenticated,
  validation(getOrderSchema, 'params'),
  deleteOrder
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

// @route   PUT /api/orders/:id/approve
// @desc    Approve order
// @access  Private
router.put(
  '/:id/approve',
  isAuthenticated,
  validation(getOrderSchema, 'params'),
  approveOrder
);

// @route   PUT /api/orders/:id/reject
// @desc    Reject order
// @access  Private
router.put(
  '/:id/reject',
  isAuthenticated,
  validation(getOrderSchema, 'params'),
  rejectOrder
);

// @route   PUT /api/orders/:id/complete
// @desc    Complete order
// @access  Private
router.put(
  '/:id/complete',
  isAuthenticated,
  validation(getOrderSchema, 'params'),
  completeOrder
);

export default router;
