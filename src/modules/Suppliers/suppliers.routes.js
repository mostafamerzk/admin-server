import { Router } from 'express';
import {
  getSuppliers,
  getSupplier,
  getSupplierProducts,
  createSupplier,
  updateSupplierVerificationStatus,
  banSupplier,
  unbanSupplier,
  deleteSupplier
} from './suppliers.controller.js';
import { validation } from '../../middlewares/vakidation.middleware.js';
import { isAuthenticated } from '../../middlewares/auth.middleware.js';
import {
  getSuppliersSchema,
  getSupplierSchema,
  getSupplierProductsSchema,
  createSupplierSchema,
  updateVerificationStatusSchema,
  banSupplierSchema
} from './suppliers.validation.js';

const router = Router();

/**
 * Suppliers Management Routes
 * Base path: /api/suppliers
 * All routes require authentication
 */

// @route   GET /api/suppliers
// @desc    Get all suppliers with pagination, search, and filtering
// @access  Private
router.get(
  '/',
  isAuthenticated,
  validation(getSuppliersSchema, 'query'),
  getSuppliers
);

// @route   GET /api/suppliers/:id
// @desc    Get single supplier by ID
// @access  Private
router.get(
  '/:id',
  isAuthenticated,
  validation(getSupplierSchema, 'params'),
  getSupplier
);

// @route   GET /api/suppliers/:id/products
// @desc    Get supplier products with pagination
// @access  Private
router.get(
  '/:id/products',
  isAuthenticated,
  validation(getSupplierProductsSchema, 'params'),
  validation(getSuppliersSchema, 'query'), // Reuse pagination validation
  getSupplierProducts
);

// @route   POST /api/suppliers
// @desc    Create new supplier
// @access  Private
router.post(
  '/',
  isAuthenticated,
  validation(createSupplierSchema),
  createSupplier
);

// @route   PUT /api/suppliers/:id/verification-status
// @desc    Update supplier verification status
// @access  Private
router.put(
  '/:id/verification-status',
  isAuthenticated,
  validation(getSupplierSchema, 'params'),
  validation(updateVerificationStatusSchema, 'body'),
  updateSupplierVerificationStatus
);

// @route   PUT /api/suppliers/:id/ban
// @desc    Ban supplier
// @access  Private
router.put(
  '/:id/ban',
  isAuthenticated,
  validation(getSupplierSchema, 'params'),
  validation(banSupplierSchema, 'body'),
  banSupplier
);

// @route   PUT /api/suppliers/:id/unban
// @desc    Unban supplier
// @access  Private
router.put(
  '/:id/unban',
  isAuthenticated,
  validation(getSupplierSchema, 'params'),
  unbanSupplier
);

// @route   DELETE /api/suppliers/:id
// @desc    Delete supplier
// @access  Private
router.delete(
  '/:id',
  isAuthenticated,
  validation(getSupplierSchema, 'params'),
  deleteSupplier
);

export default router;
