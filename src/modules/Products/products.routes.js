import { Router } from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStatus,
  uploadProductImages,
  deleteProductImage
} from './products.controller.js';
import { validation } from '../../middlewares/vakidation.middleware.js';
import { isAuthenticated } from '../../middlewares/auth.middleware.js';
import { handleMulterError } from '../../middlewares/multer-error.middleware.js';
import { uploadCloudFile, fileValidations } from '../../utils/multer/cloud.multer.js';
import {
  getProductsSchema,
  getProductSchema,
  createProductSchema,
  updateProductSchema,
  updateProductStatusSchema,
  deleteImageSchema,
  deleteImageByUrlSchema
} from './products.validation.js';

const router = Router();

/**
 * Products Management Routes
 * Base path: /api/products
 * All routes require authentication
 */

// @route   GET /api/products
// @desc    Get all products with pagination, search, and filtering
// @access  Private
router.get(
  '/',
  isAuthenticated,
  validation(getProductsSchema, 'query'),
  getProducts
);

// @route   GET /api/products/:id
// @desc    Get single product by ID
// @access  Private
router.get(
  '/:id',
  isAuthenticated,
  validation(getProductSchema, 'params'),
  getProduct
);

// @route   POST /api/products
// @desc    Create new product
// @access  Private
router.post(
  '/',
  isAuthenticated,
  validation(createProductSchema),
  createProduct
);

// @route   PUT /api/products/:id
// @desc    Update existing product
// @access  Private
router.put(
  '/:id',
  isAuthenticated,
  validation(getProductSchema, 'params'),
  validation(updateProductSchema, 'body'),
  updateProduct
);

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private
router.delete(
  '/:id',
  isAuthenticated,
  validation(getProductSchema, 'params'),
  deleteProduct
);

// @route   PUT /api/products/:id/status
// @desc    Update product status (active/inactive)
// @access  Private
router.put(
  '/:id/status',
  isAuthenticated,
  validation(getProductSchema, 'params'),
  validation(updateProductStatusSchema, 'body'),
  updateProductStatus
);

// @route   POST /api/products/:id/images
// @desc    Upload product images
// @access  Private
router.post(
  '/:id/images',
  isAuthenticated,
  validation(getProductSchema, 'params'),
  uploadCloudFile(['jpg', 'jpeg', 'png', 'gif', 'webp']).array('images', 10),
  handleMulterError,
  uploadProductImages
);

// @route   DELETE /api/products/:productId/images
// @desc    Delete specific product image by URL
// @access  Private
router.delete(
  '/:productId/images',
  isAuthenticated,
  validation(deleteImageSchema, 'params'),
  validation(deleteImageByUrlSchema, 'body'),
  deleteProductImage
);

export default router;
