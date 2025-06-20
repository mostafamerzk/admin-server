import { Router } from 'express';
import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  updateCustomerStatus,
  uploadCustomerImage
} from './customers.controller.js';
import { validation } from '../../middlewares/vakidation.middleware.js';
import { isAuthenticated } from '../../middlewares/auth.middleware.js';
import { uploadCloudFile } from '../../utils/multer/cloud.multer.js';
import {
  createCustomerSchema,
  updateCustomerSchema,
  getCustomersSchema,
  getCustomerSchema,
  updateCustomerStatusSchema,
  uploadImageSchema
} from './customers.validation.js';

const router = Router();

/**
 * Customer Management Routes
 * Base path: /api/users
 * All routes require authentication
 */

// @route   GET /api/users
// @desc    Get all customers with pagination, search, and filtering
// @access  Private
router.get(
  '/',
  isAuthenticated,
  validation(getCustomersSchema, 'query'),
  getCustomers
);

// @route   GET /api/users/:id
// @desc    Get single customer by ID
// @access  Private
router.get(
  '/:id',
  isAuthenticated,
  validation(getCustomerSchema, 'params'),
  getCustomer
);

// @route   POST /api/users
// @desc    Create new customer
// @access  Private
router.post(
  '/',
  isAuthenticated,
  validation(createCustomerSchema),
  createCustomer
);

// @route   PUT /api/users/:id
// @desc    Update customer
// @access  Private
router.put(
  '/:id',
  isAuthenticated,
  validation(getCustomerSchema, 'params'),
  validation(updateCustomerSchema, 'body'),
  updateCustomer
);

// @route   DELETE /api/users/:id
// @desc    Delete customer
// @access  Private
router.delete(
  '/:id',
  isAuthenticated,
  validation(getCustomerSchema, 'params'),
  deleteCustomer
);

// @route   PUT /api/users/:id/status
// @desc    Update customer status (active/banned)
// @access  Private
router.put(
  '/:id/status',
  isAuthenticated,
  validation(getCustomerSchema, 'params'),
  validation(updateCustomerStatusSchema, 'body'),
  updateCustomerStatus
);

// @route   POST /api/users/upload-image
// @desc    Upload customer image
// @access  Private
router.post(
  '/upload-image',
  isAuthenticated,
  uploadCloudFile().single('image'), // Use default image extensions (jpg, jpeg, png, gif)
  uploadCustomerImage
);

export default router;
